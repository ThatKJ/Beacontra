# Beacontra OS — Hackathon Submission Guide

**Authoritative Evaluation Document for Judges — SerpApi India Hackathon 2026**  
**Repository:** [ThatKJ/Beacontra](https://github.com/ThatKJ/Beacontra)  
**Track:** Commerce & Market Intelligence  
**Release Target:** Beacontra OS (Unified Production Baseline)

> **Document Status: CURRENT & AUTHORITATIVE**  
> This document supersedes historical planning documents (`docs/RESEARCH.md`, earlier drafts in `docs/DEMO.md`, and initial single-screen specs in `docs/SUBMISSION.md`). For any discrepancy between documents, this file and `README.md` represent the ground truth of the codebase as submitted.

---

## 1. Project Summary

**Beacontra OS** is an evidence-first marketplace intelligence and brand-protection platform engineered for Indian Direct-to-Consumer (D2C) and SME brand owners.

It addresses a pervasive market failure: unauthorized sellers, gray-market distributors, and listings using hijacked product photos proliferate on platforms like Amazon India, Flipkart, and Google Shopping. Small-to-medium brand owners cannot afford enterprise brand-protection suites (costing $25,000+/year) and are left manually combing listings.

Beacontra fuses **SerpApi Google Shopping** (for live market listing discovery, price baselines, and seller metadata) and **SerpApi Google Lens** (for reverse-image forensics on listing thumbnails) into an integrated investigation environment. Rather than generating opaque AI summaries or legal accusations, Beacontra assembles objective commercial and visual evidence into a prioritized review queue, interactive evidence graph, and downloadable investigation dossiers.

---

## 2. User & Problem Space

### Target User
- Founders, brand protection officers, and e-commerce operations managers at Indian D2C brands (1–50 employees, FMCG, electronics, apparel, personal care).

### The Real-World Crisis in Indian E-Commerce
1. **Flipkart "Latching-On" Rulings**: In November 2024, the Delhi High Court restricted Flipkart’s feature allowing unauthorized third parties to latch onto genuine brand product pages, after repeated instances of counterfeit goods being fulfilled under genuine brand names.
2. **Bureau of Indian Standards (BIS) Raids**: In March 2025, BIS conducted nationwide raids on major marketplace fulfillment centers seizing thousands of consumer products bearing forged quality marks.
3. **Platform Scale**: Meesho officially reported removing over 4.2 million non-compliant listings within a six-month window.

Small D2C brands lack the resources to monitor this manual chaos. They need deterministic evidence discovery, variant filtering, and case generation.

---

## 3. Core Architectural Insight

Traditional tools fall into two unproductive extremes:
1. **Domain Phishing Scanners**: Focus on DNS lookalike domains (e.g. typosquatting), ignoring actual marketplace product listings and photos entirely.
2. **Generic LLM Summarizers**: Scrape unstructured search text and feed it to an LLM, generating confident-sounding but unverified hallucinations about "counterfeit" status.

**Beacontra's Insight**: Reverse-image search (`google_lens`) combined with structured marketplace catalog signals (`google_shopping`) produces three mutually reinforcing, objective signals:
1. **Price Signal**: Quantifies deviation between statutory MRP / expected street price and listing offer price.
2. **Seller Signal**: Checks merchant name and seller domains against brand-authorized distribution channels.
3. **Visual Signal**: Verifies whether listing imagery matches canonical brand photography or originates from unrelated catalogs.

Combining these three independent signals yields an actionable **Review Priority Score (0–100)** without ever relying on LLM guesswork.

---

## 4. System Architecture

Beacontra OS is deployed on the Cloudflare Workers edge runtime with zero client-side credentials:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CLIENT INTERFACES                                │
│                                                                             │
│   ┌──────────────────────────────────┐   ┌──────────────────────────────┐   │
│   │   Beacontra OS Web Dashboard     │   │  Beacontra Lens Extension    │   │
│   │   (Vanilla JS + Accessible CSS)  │   │  (Chrome MV3 Sidepanel)      │   │
│   └─────────────────┬────────────────┘   └──────────────┬───────────────┘   │
└─────────────────────┼───────────────────────────────────┼───────────────────┘
                      │                                   │
                      ▼                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   CLOUDFLARE WORKERS (HONO APPLICATION TIER)                │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ Security Gateway: SSRF Defense (IPv4/IPv6 blocklists, URL validation)│   │
│   │ Rate Limiter: In-memory token bucket & IP protection                │   │
│   └──────────────────────────────────┬──────────────────────────────────┘   │
│                                      │                                      │
│         ┌────────────────────────────┼────────────────────────────┐         │
│         ▼                            ▼                            ▼         │
│   ┌───────────────┐          ┌───────────────┐          ┌───────────────┐   │
│   │   Brand DNA   │          │  Market Radar │          │Visual Forens. │   │
│   │  - Vault KV   │          │  - Shopping   │          │  - Lens API   │   │
│   │  - SKU Normal │          │  - Anomalies  │          │  - Thumbnail  │   │
│   └───────────────┘          └───────────────┘          └───────────────┘   │
│         │                            │                            │         │
│         └────────────────────────────┼────────────────────────────┘         │
│                                      ▼                                      │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ Relational Evidence Core & Bipartite Graph Engine                   │   │
│   │ Durable Repository (SQLite D1 / KV Cache fallback)                  │   │
│   └──────────────────────────────────┬──────────────────────────────────┘   │
│                                      ▼                                      │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ Watchtower (Temporal Diffing) & Evidence Desk (Dossier Generator)   │   │
│   └──────────────────────────────────┬──────────────────────────────────┘   │
└──────────────────────────────────────┼──────────────────────────────────────┘
                                       │ Server-side only (hidden secret)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SERPAPI PLATFORM                               │
│     • google_shopping        • google_lens        • image_upload API        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Beacontra OS Module Map

| Module | Purpose | Key Source Files |
|---|---|---|
| **Brand Vault (Brand DNA)** | Ground-truth repository for registered brands, products, official images, MRP, and authorized seller lists. | `src/lib/brand-dna.ts`<br>`tests/brand-dna.test.ts` |
| **Market Radar** | Marketplace listing search engine with automatic variant token stripping (removes cases, chargers, Pro tiers, generation mismatches). | `src/lib/market-radar.ts`<br>`tests/market-radar.test.ts` |
| **Visual Forensics** | Reverse-image analysis of listing thumbnails via Google Lens, evaluating visual matching confidence. | `src/lib/visual-forensics.ts`<br>`tests/visual-forensics.test.ts` |
| **Evidence Graph** | Interactive bipartite graph linking Brands → Products → Marketplace Listings → Sellers → Visual Matches. | `src/lib/visual-forensics.ts`<br>`public/beacontra-os.js` |
| **Watchtower** | Historical surveillance capturing timeline snapshots and alerting on merchant additions or stealth price changes. | `src/lib/watchtower.ts`<br>`tests/watchtower.test.ts` |
| **Evidence Desk** | Case management docket providing status tracking, analyst notes, and standalone print-ready HTML dossier exports. | `src/lib/evidence-desk.ts`<br>`tests/evidence-desk.test.ts` |
| **Investigation Intelligence** | "Explain This Finding" module providing rule transparency, counterfactual scenarios, and remediation playbooks. | `src/lib/investigation-intelligence.ts`<br>`tests/investigation-intelligence.test.ts` |
| **Investigation Autopilot** | Autonomous investigation workflow planner with strict credit-budget caps and step replay engine. | `src/lib/autopilot.ts`<br>`tests/autopilot.test.ts` |
| **Beacontra Lens Extension** | Manifest V3 Chrome extension providing in-situ Amazon.in/Flipkart page inspection and deep-linking into OS. | `extension/` directory<br>`tests/extension.test.ts` |

---

## 6. SerpApi Usage: Essential & Material

Beacontra is not a UI wrapper around generic web search. Every analytical capability depends directly on SerpApi engines:

1. **`google_shopping` Engine**:
   - Used by Market Radar to discover live offers across Indian e-commerce merchants.
   - Supplies critical fields: `extracted_price`, `source`, `seller`, `thumbnail`, `reviews`, `rating`, `delivery`.
   - Localized parameters: `location: "India"`, `gl: "in"`, `hl: "en"`.
2. **`google_lens` Engine**:
   - Used by Visual Forensics to reverse-search listing thumbnails.
   - Extracts structured `visual_matches` and `exact_matches` to determine whether an unauthorized seller is reusing official brand photography or altered visuals.
   - Capped at `MAX_LENS_CALLS = 10` per scan, prioritized by price anomaly, to prevent unbounded credit consumption.
3. **`image_upload` / Image API**:
   - Allows brand investigators to supply local product photo files without requiring a public hosting URL. Converts image buffers to SerpApi `image_id` references for Lens analysis.

*If SerpApi were removed, Beacontra would lose live marketplace price discovery, multi-merchant aggregation, and reverse-image verification.*

---

## 7. Technical Highlights & Engineering Discipline

- **Zero LLM Hallucinations**: All anomaly scores and priority ranks are computed deterministically. The scoring logic is fully auditable.
- **Credit-Budget Discipline**: Unbounded loops are strictly prevented. Google Shopping requires 1 call per scan; Google Lens calls are capped at 10.
- **Variant Disambiguation**: Deterministic regex tokenizers strip false-positive variant noise (e.g., silicone covers, charging cables, "Pro", "ANC", "Gen 2") from comparison against the base model MRP.
- **Absence of Evidence Handling**: When Google Lens returns zero matches, the system conservatively reports neutral `no_evidence` (+0 score penalty), rather than fabricating an anomaly.
- **Provenanced Data Source Labeling**: Every response explicitly declares whether data originated from `'live'` SerpApi or `'fixture'`/`'cache'` replays, preventing deceptive demos.

---

## 8. Security Engineering

- **Server-Side Credentials**: `SERPAPI_API_KEY` is never delivered to client code, never bundled in frontend assets, and never present in the Chrome extension.
- **SSRF Defense (`src/lib/security.ts`)**:
  - Restricts image URLs to `http:` and `https:`.
  - Rejects localhost, loopback (`127.0.0.1`), RFC 1918 private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local AWS metadata (`169.254.169.254`), and IPv6 private/mapped addresses.
  - Mitigates DNS rebinding and redirection attacks.
- **XSS-Safe HTML Reporting**: Standalone dossier reports escape all user and API strings and strip dangerous URI schemes (`javascript:`, `data:`).
- **Rate Limiting**: Protects investigation endpoints from abusive automated loops.

---

## 9. Comprehensive Testing & Quality Verification

All tests run deterministically in zero-credit fixture mode:

```bash
# 1. Run full unit and regression test suite
npm test
# Result: 17 passed (17 files), 158 passed | 1 skipped (live-key gated)

# 2. Verify TypeScript type safety
npm run typecheck
# Result: 0 errors

# 3. Verify code style and linting
npm run lint
# Result: Clean pass

# 4. Verify Cloudflare Worker production build bundle
npm run build
# Result: 284.09 KiB compiled successfully

# 5. Run headless browser UI, accessibility (axe), and multi-viewport tests
npm run test:ui
# Result: 6 viewports passed (375px, 390px, 430px, 768px, 1024px, 1440px), 0 axe WCAG violations

# 6. Run local rendering performance and core metrics check
npm run test:ui:performance
# Result: LCP ~616-700ms, CLS 0–0.01, frame p95 < 17ms
```

---

## 10. Known Limitations

In the interest of full engineering transparency:
1. **Heuristic Risk Weighting**: Risk scores are heuristic ranking algorithms designed to order human review priority, not statistical certainties.
2. **Thumbnail Compression**: Reverse-image accuracy is bounded by the resolution and compression of marketplace thumbnails provided by search engines.
3. **Legal Disclaimer**: Beacontra produces commercial investigation signals. It does not establish legal counterfeit status.

---

## 11. Existing-Project & Evolution Disclosure

An initial concept named "BrandLens" was conceived prior to the hackathon. During this hackathon cycle, the project was completely overhauled and evolved into **Beacontra OS**:
- **Rebuilt Architecture**: Expanded from an ad-hoc single-page form into a modular operating system (Brand Vault, Market Radar, Visual Forensics, Evidence Graph, Watchtower, Evidence Desk, Autopilot).
- **Chrome Extension**: Engineered the Manifest V3 Beacontra Lens sidepanel companion from scratch.
- **Security Hardening**: Implemented comprehensive SSRF defense with IPv4/IPv6 private IP blocklists and redirect safety.
- **Variant Normalization**: Built deterministic SKU tokenizers to filter accessory and model tier skew.
- **Export Engine**: Designed standalone HTML dossier generation with print stylesheets.
- **Comprehensive Quality Gates**: Built 17 test suites (158 tests) and Playwright multi-viewport accessibility checks.

---

## 12. AI Collaboration Disclosure

This project was built under human direction with specialized AI assistance:
- **Claude / Claude Code**: Architecture design, adversarial challenge red-teaming, documentation.
- **Gemini**: Independent audits, competitive landscape verification, security testing.
- **GPT-6 Astra**: Visual design system tokens, responsive layout engineering, accessibility.
- **OpenCode**: Backend service implementation, TypeScript typing, test harness creation.

---

## 13. Demo Instructions (Local Execution)

To run the application locally for evaluation:
```bash
# 1. Install dependencies
npm install

# 2. Configure your SerpApi key in .env
cp .env.example .env
# Edit .env with SERPAPI_API_KEY=your_key

# 3. Start local development server
npm run dev

# 4. Open in browser
# http://localhost:8787
```

- Click **"TRY AN EXAMPLE"** or **"Overview"** to instantly test the end-to-end workspace using verified cached results (zero credits consumed).
- Switch between **Brand Vault**, **Market Radar**, **Evidence Graph**, **Watchtower**, and **Cases Desk** using the top module navigation bar.
