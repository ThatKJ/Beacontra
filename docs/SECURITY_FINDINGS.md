# Beacontra Security Audit & Findings Dossier

**Product:** Beacontra (formerly BrandLens)  
**Security Level:** Senior Staff Security Engineering Review  
**Date:** October 2, 2026  
**Status:** All release-blocking security vulnerabilities remediated and covered by automated regression tests.

---

## 1. Threat Model & Attack Surface

Beacontra operates a dual-surface architecture:
1. **Serverless Cloudflare Worker API** (`src/index.ts`):
   - Exposes public search, scan, case management, and HTML dossier generation endpoints.
   - Accepts external URLs (`officialImageUrl`, `productLink`) and triggers upstream API requests to SerpApi and third-party image hosts.
2. **Chrome Manifest V3 Companion Extension** (`extension/`):
   - Interacts with untrusted marketplace DOM trees (`https://*.amazon.in/*`).
   - Forwards parsed listing metadata to the backend and renders backend responses in a browser side panel.

---

## 2. In-Depth Security Findings & Remediations

### Finding 1: SSRF via Alternative IP Encodings (Decimal, Hex, Octal, Short Notation)
- **CWE:** CWE-918 (Server-Side Request Forgery)
- **Severity:** High (CVSS 7.5)
- **Vulnerability Mechanism:**
  The initial `isSafePublicUrl` function relied on a standard dotted-decimal regular expression:
  `/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/`
  Standard operating systems, C libraries, curl, and Node.js network stacks parse alternative IP notations:
  - **Decimal/Dword IP:** `http://2130706433/` (`127.0.0.1`)
  - **Hex IP:** `http://0x7f000001/` or `http://0x7f.0.0.1/` (`127.0.0.1`)
  - **Octal IP:** `http://0177.0.0.1/` (evaluates to `177` in JS decimal, bypassing `o1 === 127`, but resolves to `127.0.0.1` in network stacks)
  - **Short notation:** `http://127.1/` (`127.0.0.1`)
  An attacker providing an official reference image URL formatted in decimal or hex could coerce the server to fetch loopback or private subnet services.
- **Remediation Implemented (`src/lib/security.ts`):**
  Implemented `parseIpv4Candidate()`:
  1. Detects pure decimal integers (`/^\d+$/`) and pure hex integers (`/^0x[0-9a-f]+$/i`), converting them into standard 32-bit unsigned integers and extracting the 4 octets.
  2. Parses dotted components with support for octal (`0177`) and hex (`0x7f`), and standard IP part-expansion (1, 2, 3, or 4 parts).
  3. Validates the normalized 4 octets against all RFC 1918 subnets, loopback (`127.0.0.0/8`), link-local/cloud metadata (`169.254.0.0/16`), Carrier-grade NAT (`100.64.0.0/10`), multicast (`224.0.0.0/4`), and broadcast/reserved ranges (`240.0.0.0/4`).
- **Regression Tests:** Verified in `tests/security.test.ts`.

---

### Finding 2: SSRF via HTTP Redirect Bypass
- **CWE:** CWE-918 (Server-Side Request Forgery)
- **Severity:** High (CVSS 8.2)
- **Vulnerability Mechanism:**
  When fetching external image references in `safeFetchImage`, standard `fetch()` follows HTTP 301/302 redirects by default (`redirect: 'follow'`).
  An attacker hosting a public server (`https://attacker-safe-domain.com/photo.jpg`) would pass the initial `isSafePublicUrl` check. However, the attacker server could respond with:
  `HTTP/1.1 302 Found`  
  `Location: http://169.254.169.254/latest/meta-data/identity-credentials/`
  The fetch client would follow the redirect directly to the internal cloud metadata service.
- **Remediation Implemented (`src/lib/security.ts`):**
  1. Set `redirect: 'manual'` on all external image fetches.
  2. Implemented an explicit redirect-handling loop (maximum 3 hops).
  3. Every intermediate `Location` header is resolved relative to the requesting URL and validated with `isSafePublicUrl` *before* the subsequent fetch is initiated.
  4. If a redirect targets a private, loopback, or cloud metadata destination, the request is immediately aborted with a security violation error.
- **Regression Tests:** Verified in `tests/security.test.ts`.

---

### Finding 3: SSRF via Wildcard DNS Rebinding
- **CWE:** CWE-918 (Server-Side Request Forgery)
- **Severity:** High (CVSS 7.2)
- **Vulnerability Mechanism:**
  Wildcard DNS services such as `nip.io`, `sslip.io`, and `xip.io` map arbitrary IP addresses to publicly resolvable domain names (e.g. `127.0.0.1.nip.io` or `169.254.169.254.sslip.io`). These hostnames do not contain raw IP addresses in their top-level representation, bypassing naive string checks while resolving to internal infrastructure.
- **Remediation Implemented (`src/lib/security.ts`):**
  1. Added `REBINDING_DOMAINS` blacklist targeting known public wildcard services (`.nip.io`, `.sslip.io`, `.xip.io`, `.localtest.me`, `.lvh.me`).
  2. Extracted the embedded IP prefix from the subdomain and subjected it to full `isRestrictedIpv4` analysis.
- **Regression Tests:** Verified in `tests/security.test.ts`.

---

### Finding 4: Unrestricted Outbound Port Probing
- **CWE:** CWE-200 (Exposure of Sensitive Information Through Sent Data)
- **Severity:** Medium (CVSS 5.3)
- **Vulnerability Mechanism:**
  `isSafePublicUrl` validated hostname IP ranges but did not restrict target ports. An attacker could specify URLs like `http://internal-target.com:6379/` (Redis) or `http://target.com:22/` (SSH) to perform internal network port scanning or protocol smuggling.
- **Remediation Implemented (`src/lib/security.ts`):**
  Enforced strict port whitelisting (`ALLOWED_WEB_PORTS`): only ports `80`, `443`, `8080`, and `8443` are permitted. All administrative, database, and system service ports are rejected.
- **Regression Tests:** Verified in `tests/security.test.ts`.

---

### Finding 5: Protocol Injection / XSS in HTML Investigation Dossiers
- **CWE:** CWE-79 (Cross-Site Scripting)
- **Severity:** High (CVSS 7.5)
- **Vulnerability Mechanism:**
  In `generateInvestigationHtmlReport`, while strings were escaped with `escapeHtml()`, URLs were directly interpolated into active HTML attributes:
  `<a href="${escapeHtml(r.listing.productLink)}">`
  `<img src="${escapeHtml(target.officialImageUrl)}">`
  `escapeHtml` transforms `<` and `>`, but leaves `javascript:` and `data:` schemes unchanged. If a malicious marketplace listing or case input supplied `productLink: "javascript:alert(document.cookie)"`, clicking the link in the report would execute arbitrary JavaScript in the analyst's browser.
- **Remediation Implemented (`src/lib/evidence-desk.ts`):**
  Created `sanitizeUrl(urlStr, fallback)`:
  Validates that the scheme strictly starts with `http://` or `https://`. Any `javascript:`, `data:`, or malformed URI is sanitized to safe fallbacks (`#` or a placeholder photo).
- **Regression Tests:** Verified in `tests/evidence-desk.test.ts`.

---

### Finding 6: Rate Limiting & SerpApi Credit Depletion Attack
- **CWE:** CWE-770 (Allocation of Resources Without Limits or Throttling)
- **Severity:** High (CVSS 7.5)
- **Vulnerability Mechanism:**
  Each call to `POST /api/beacontra/scan` consumes SerpApi credits (1 Google Shopping query + up to 10 Google Lens queries). With zero rate limiting, an automated script could issue 25 rapid scan requests and completely deplete the project's monthly free tier quota (250 credits).
- **Remediation Implemented (`src/index.ts`):**
  Implemented sliding-window rate limiter per client IP:
  1. Window: 60 seconds; maximum scans: 10 per window per IP.
  2. If exceeded, returns HTTP 429 Too Many Requests with header `Retry-After: <seconds>` and a clear explanatory message.
- **Regression Tests:** Verified in `tests/evidence-desk.test.ts`.

---

### Finding 7: Secret Hygiene & Credential Exposure Review
- **Audit Verification:**
  - Git commit history inspected across all commits: **Zero SerpApi keys or credentials ever committed**.
  - `.env` and `.dev.vars` remain strictly `.gitignore`d.
  - Extension codebase inspected: **Zero hardcoded credentials or API keys**. All extension communication calls the backend server without client-side secrets.
  - API response sanitization: Checked that all error messages from upstream providers are sanitized into generic HTTP status errors without leaking upstream headers or stack traces.

---

## 3. Security Recommendations for Post-Hackathon v1.0

1. **Authentication & Multi-Tenant Authorization:**
   Implement user sessions (e.g. Cloudflare Access, Auth0, or Supabase JWTs) so each brand's cases are strictly isolated by organization ID.
2. **Web Application Firewall (WAF):**
   Deploy Cloudflare WAF rules to block malicious scrapers and botnets from querying the scan endpoints.
3. **Turnstile / Bot Management:**
   Integrate Cloudflare Turnstile on the public search form to distinguish human investigators from automated bots.
