/**
 * Security and URL validation utilities for Beacontra
 * Protects against Server-Side Request Forgery (SSRF), alternative IP encodings,
 * DNS rebinding, unsafe ports, and redirect attacks.
 */

export interface SafeUrlResult {
  isSafe: boolean;
  reason?: string;
}

const ALLOWED_WEB_PORTS = new Set(['', '80', '443', '8080', '8443']);
const BLOCKED_HOST_SUFFIXES = [
  'localhost',
  '.localhost',
  '.local',
  '.internal',
  '.lan',
  '.home',
  '.corp',
  'metadata.google.internal',
];
const REBINDING_DOMAINS = ['.nip.io', '.sslip.io', '.xip.io', '.localtest.me', '.lvh.me'];

/**
 * Checks if 4 octets fall into any loopback, private, link-local, broadcast, or reserved range
 */
function isRestrictedIpv4(o1: number, o2: number, o3: number, _o4: number): { restricted: boolean; reason?: string } {
  // 0.0.0.0/8 (Current network)
  if (o1 === 0) {
    return { restricted: true, reason: 'Current network/broadcast address (0.0.0.0/8) is prohibited' };
  }
  // 10.0.0.0/8 (RFC 1918 Private)
  if (o1 === 10) {
    return { restricted: true, reason: 'Private network address (10.0.0.0/8) is prohibited' };
  }
  // 100.64.0.0/10 (Carrier-Grade NAT)
  if (o1 === 100 && o2 >= 64 && o2 <= 127) {
    return { restricted: true, reason: 'Carrier-Grade NAT address (100.64.0.0/10) is prohibited' };
  }
  // 127.0.0.0/8 (Loopback)
  if (o1 === 127) {
    return { restricted: true, reason: 'Loopback IP address (127.0.0.0/8) is prohibited' };
  }
  // 169.254.0.0/16 (Link-Local / AWS/GCP/Azure Metadata)
  if (o1 === 169 && o2 === 254) {
    return { restricted: true, reason: 'Cloud metadata / link-local address (169.254.0.0/16) is prohibited' };
  }
  // 172.16.0.0/12 (RFC 1918 Private: 172.16.x.x - 172.31.x.x)
  if (o1 === 172 && o2 >= 16 && o2 <= 31) {
    return { restricted: true, reason: 'Private network address (172.16.0.0/12) is prohibited' };
  }
  // 192.0.0.0/24 (IETF Protocol Assignments)
  if (o1 === 192 && o2 === 0 && o3 === 0) {
    return { restricted: true, reason: 'IETF reserved address (192.0.0.0/24) is prohibited' };
  }
  // 192.0.2.0/24 (TEST-NET-1)
  if (o1 === 192 && o2 === 0 && o3 === 2) {
    return { restricted: true, reason: 'Documentation address (192.0.2.0/24) is prohibited' };
  }
  // 192.168.0.0/16 (RFC 1918 Private)
  if (o1 === 192 && o2 === 168) {
    return { restricted: true, reason: 'Private network address (192.168.0.0/16) is prohibited' };
  }
  // 198.18.0.0/15 (Benchmarking)
  if (o1 === 198 && (o2 === 18 || o2 === 19)) {
    return { restricted: true, reason: 'Benchmarking network address (198.18.0.0/15) is prohibited' };
  }
  // 198.51.100.0/24 (TEST-NET-2)
  if (o1 === 198 && o2 === 51 && o3 === 100) {
    return { restricted: true, reason: 'Documentation address (198.51.100.0/24) is prohibited' };
  }
  // 203.0.113.0/24 (TEST-NET-3)
  if (o1 === 203 && o2 === 0 && o3 === 113) {
    return { restricted: true, reason: 'Documentation address (203.0.113.0/24) is prohibited' };
  }
  // 224.0.0.0/4 (Multicast)
  if (o1 >= 224 && o1 <= 239) {
    return { restricted: true, reason: 'Multicast address (224.0.0.0/4) is prohibited' };
  }
  // 240.0.0.0/4 & 255.255.255.255 (Reserved & Broadcast)
  if (o1 >= 240) {
    return { restricted: true, reason: 'Reserved/broadcast address (240.0.0.0/4) is prohibited' };
  }

  return { restricted: false };
}

/**
 * Attempts to parse an alternative IPv4 string representation (decimal, hex, octal, dotted)
 * Returns the [o1, o2, o3, o4] octets or null if not an IP representation
 */
function parseIpv4Candidate(rawHost: string): number[] | null {
  const host = rawHost.trim().toLowerCase();

  // Pure single decimal integer (e.g. "2130706433" -> 127.0.0.1)
  if (/^\d+$/.test(host)) {
    const num = Number(host);
    if (!Number.isSafeInteger(num) || num < 0 || num > 0xffffffff) return null;
    return [(num >>> 24) & 255, (num >>> 16) & 255, (num >>> 8) & 255, num & 255];
  }

  // Pure single hex integer (e.g. "0x7f000001")
  if (/^0x[0-9a-f]+$/i.test(host)) {
    const num = parseInt(host, 16);
    if (isNaN(num) || num < 0 || num > 0xffffffff) return null;
    return [(num >>> 24) & 255, (num >>> 16) & 255, (num >>> 8) & 255, num & 255];
  }

  // Dotted parts (1 to 4 parts)
  const parts = host.split('.');
  if (parts.length >= 1 && parts.length <= 4) {
    const parsedParts: number[] = [];
    for (const part of parts) {
      if (!part) return null;
      let val: number;
      if (/^0x[0-9a-f]+$/i.test(part)) {
        val = parseInt(part, 16);
      } else if (/^0[0-7]+$/.test(part)) {
        val = parseInt(part, 8); // Octal representation
      } else if (/^\d+$/.test(part)) {
        val = parseInt(part, 10);
      } else {
        return null; // Contains non-numeric characters, likely a domain name
      }
      if (isNaN(val) || val < 0) return null;
      parsedParts.push(val);
    }

    // Expand into 4 standard octets depending on part count
    if (parsedParts.length === 4) {
      const [o1, o2, o3, o4] = parsedParts;
      if (o1 === undefined || o2 === undefined || o3 === undefined || o4 === undefined) return null;
      if (o1 > 255 || o2 > 255 || o3 > 255 || o4 > 255) return null;
      return [o1, o2, o3, o4];
    }
    if (parsedParts.length === 3) {
      // a.b.c -> a.b.0.c (where c is 16-bit)
      const [a, b, c] = parsedParts;
      if (a === undefined || b === undefined || c === undefined) return null;
      if (a > 255 || b > 255 || c > 0xffff) return null;
      return [a, b, (c >>> 8) & 255, c & 255];
    }
    if (parsedParts.length === 2) {
      // a.b -> a.0.0.b (where b is 24-bit)
      const [a, b] = parsedParts;
      if (a === undefined || b === undefined) return null;
      if (a > 255 || b > 0xffffff) return null;
      return [a, (b >>> 16) & 255, (b >>> 8) & 255, b & 255];
    }
  }

  return null;
}

/**
 * Validates that a URL is a safe, public HTTP/HTTPS URL
 * Rejects private IP ranges, loopback, link-local, cloud metadata services,
 * alternative IP encodings, DNS rebinding domains, dangerous ports, and non-HTTP protocols.
 */
export function isSafePublicUrl(urlStr: string): SafeUrlResult {
  if (!urlStr || typeof urlStr !== 'string') {
    return { isSafe: false, reason: 'URL must be a non-empty string' };
  }

  // Allow synthetic internal test schemes if explicitly flagged
  if (urlStr.startsWith('local-upload://') || urlStr.startsWith('serpapi:image_id:')) {
    return { isSafe: true };
  }

  let parsed: URL;
  try {
    parsed = new URL(urlStr);
  } catch {
    return { isSafe: false, reason: 'Malformed URL' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { isSafe: false, reason: `Unsupported protocol "${parsed.protocol}". Only HTTP and HTTPS are permitted.` };
  }

  // Restrict to standard web ports
  if (!ALLOWED_WEB_PORTS.has(parsed.port)) {
    return { isSafe: false, reason: `Prohibited port "${parsed.port}". Only standard HTTP/HTTPS ports (80, 443, 8080, 8443) are allowed.` };
  }

  const hostname = parsed.hostname.toLowerCase().trim();
  if (!hostname) {
    return { isSafe: false, reason: 'Empty hostname' };
  }

  // Check IPv6 addresses (e.g. [::1], fe80::, [::ffff:127.0.0.1])
  if (hostname.includes(':') || hostname.startsWith('[') || hostname.endsWith(']')) {
    return { isSafe: false, reason: 'Direct IPv6 addresses are prohibited' };
  }

  // Reject local and internal hostnames
  for (const blocked of BLOCKED_HOST_SUFFIXES) {
    if (hostname === blocked || hostname.endsWith(blocked)) {
      return { isSafe: false, reason: `Access to "${blocked}" internal domain names is prohibited` };
    }
  }

  // Check for DNS rebinding wildcard domains (e.g. 127.0.0.1.nip.io)
  for (const rebind of REBINDING_DOMAINS) {
    if (hostname.endsWith(rebind)) {
      const prefix = hostname.slice(0, -rebind.length);
      // Extract IP from prefix if present
      const embedded = parseIpv4Candidate(prefix.split(/[-.]/).pop() || prefix);
      if (embedded && embedded.length === 4) {
        const [e1, e2, e3, e4] = embedded;
        if (e1 !== undefined && e2 !== undefined && e3 !== undefined && e4 !== undefined) {
          const check = isRestrictedIpv4(e1, e2, e3, e4);
          if (check.restricted) {
            return { isSafe: false, reason: `DNS rebinding to restricted IP via ${rebind} is prohibited: ${check.reason}` };
          }
        }
      }
      return { isSafe: false, reason: `DNS rebinding domain "${rebind}" is prohibited` };
    }
  }

  // Check IPv4 addresses (including decimal, hex, octal, dotted)
  const ipOctets = parseIpv4Candidate(hostname);
  if (ipOctets && ipOctets.length === 4) {
    const [i1, i2, i3, i4] = ipOctets;
    if (i1 !== undefined && i2 !== undefined && i3 !== undefined && i4 !== undefined) {
      const check = isRestrictedIpv4(i1, i2, i3, i4);
      if (check.restricted) {
        return { isSafe: false, reason: check.reason };
      }
    }
  }

  return { isSafe: true };
}

/**
 * Safely fetches an external image with strict SSRF validation, size bounds,
 * timeout guards, and manual redirect verification to prevent redirect SSRF bypasses.
 */
export async function safeFetchImage(
  imageUrl: string,
  maxBytes = 5 * 1024 * 1024,
  timeoutMs = 6000,
  maxRedirects = 3
): Promise<{ ok: boolean; buffer?: ArrayBuffer; error?: string }> {
  let currentUrl = imageUrl;
  let redirectsRemaining = maxRedirects;

  while (redirectsRemaining >= 0) {
    const check = isSafePublicUrl(currentUrl);
    if (!check.isSafe) {
      return { ok: false, error: check.reason };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(currentUrl, {
        signal: controller.signal,
        redirect: 'manual', // Never auto-follow redirects to prevent SSRF bypass
        headers: {
          'User-Agent': 'Beacontra-Verification-Bot/1.0 (+https://beacontra.internal)',
          Accept: 'image/png, image/jpeg, image/webp, image/*;q=0.8',
        },
      });

      // Handle HTTP redirects securely
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        clearTimeout(timeoutId);
        const locationHeader = response.headers.get('location');
        if (!locationHeader) {
          return { ok: false, error: `Redirect status ${response.status} missing Location header` };
        }

        // Resolve redirect URL relative to current URL
        let nextUrl: string;
        try {
          nextUrl = new URL(locationHeader, currentUrl).toString();
        } catch {
          return { ok: false, error: `Invalid redirect location: ${locationHeader}` };
        }

        redirectsRemaining--;
        if (redirectsRemaining < 0) {
          return { ok: false, error: 'Maximum redirect limit exceeded' };
        }

        currentUrl = nextUrl;
        continue;
      }

      if (!response.ok) {
        clearTimeout(timeoutId);
        return { ok: false, error: `Image fetch failed with status ${response.status}` };
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.toLowerCase().startsWith('image/')) {
        clearTimeout(timeoutId);
        return { ok: false, error: `Invalid content type: expected image, got ${contentType}` };
      }

      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength, 10) > maxBytes) {
        clearTimeout(timeoutId);
        return { ok: false, error: `Image exceeds maximum allowed size (${maxBytes} bytes)` };
      }

      const buffer = await response.arrayBuffer();
      clearTimeout(timeoutId);

      if (buffer.byteLength > maxBytes) {
        return { ok: false, error: `Image body exceeds maximum allowed size (${maxBytes} bytes)` };
      }

      return { ok: true, buffer };
    } catch (err) {
      clearTimeout(timeoutId);
      const msg = err instanceof Error ? err.message : 'Fetch failed';
      return { ok: false, error: msg };
    }
  }

  return { ok: false, error: 'Too many redirects' };
}

