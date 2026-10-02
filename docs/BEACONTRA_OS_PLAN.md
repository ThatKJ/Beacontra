# Beacontra OS: Architectural Master Plan & Implementation Blueprint

**Platform:** Beacontra OS — Marketplace Intelligence & Visual Investigation Platform  
**Target:** SerpApi India Hackathon 2026 (Deadline: October 10, 2026)  
**Branch:** `feat/evidence-desk-investigation`  
**Architect:** Principal Architect & Technical Lead  
**Status:** Milestone 0 Baseline Verified — Implementation in Progress

---

## 1. Existing System Baseline & Audit Confirmation

Before expanding the system, the existing codebase was independently verified:
- **Test Suite (`npm test`):** 10 test suites passed (114 passed, 1 skipped) in 1.36s.
- **Typecheck (`tsc --noEmit`):** 0 errors under strict TypeScript with `noUncheckedIndexedAccess`.
- **Linter (`eslint src --ext .ts`):** 0 errors, 0 warnings.
- **Worker Bundle (`wrangler build`):** 171.06 KiB (gzip: 41.08 KiB).
- **Deterministic E2E Verification (`scripts/e2e-evidence-desk-demo.ts`):** All 6 stages passed.
- **Real Browser Chromium Verification (`scripts/test-extension-browser.ts`):** Passed 2/2 complete passes including DOM extraction, manual calibration, scan dispatch, case filing, and report linking.

### Existing Reusable Services:
1. `SerpApiClient` ([src/lib/serpapi-client.ts](file:///Users/kirtan/Hackathons/Serp/src/lib/serpapi-client.ts)): Structured query builder, request deduplication, credit estimation, rate limit parsing, and deterministic fixture playback.
2. `BeacontraService` ([src/lib/beacontra.ts](file:///Users/kirtan/Hackathons/Serp/src/lib/beacontra.ts)): Tri-signal fusion (`priceSignal`, `sellerSignal`, `visualSignal`), credit consumption bounding (`MAX_LENS_CALLS = 10`), and recommendation heuristics.
3. `SecurityGateway` ([src/lib/security.ts](file:///Users/kirtan/Hackathons/Serp/src/lib/security.ts)): RFC 1918, link-local metadata (`169.254.169.254`), alternative IP encodings (decimal, hex, octal, short-form), wildcard DNS rebinding protection, port filtering, and redirect validation.
4. `EvidenceDeskService` ([src/lib/evidence-desk.ts](file:///Users/kirtan/Hackathons/Serp/src/lib/evidence-desk.ts)): Investigation case data model, observation conversion, print-ready HTML dossier generation, case deduplication, and XSS URL sanitization.
5. `NormalizationService` ([src/lib/normalization.ts](file:///Users/kirtan/Hackathons/Serp/src/lib/normalization.ts)): Variant mismatch classification (`isVariantMismatch`), seller normalization, domain extraction, and authorized channel identification.
6. `Beacontra Lens Chrome Companion` ([extension/](file:///Users/kirtan/Hackathons/Serp/extension)): Manifest V3 side panel with Amazon India DOM extraction.

---

## 2. Beacontra OS Module Architecture

Beacontra OS upgrades the point-in-time scanner into a continuous marketplace intelligence operating system consisting of 6 core modules:

```
+-----------------------------------------------------------------------------------------+
|                                    BEACONTRA OS UI                                      |
|   [Overview]  [Brand Vault]  [Market Radar]  [Evidence Graph]  [Watchtower]  [Cases]    |
+-----------------------------------------------------------------------------------------+
                                             |
+-----------------------------------------------------------------------------------------+
|                                 UNIFIED EVIDENCE CORE                                   |
|   - Product Identity  - Listings  - Merchants  - Visual Findings  - Observations        |
|   - Storage Adapter: Cloudflare D1 / Durable Storage Repository with KV Cache           |
+-----------------------------------------------------------------------------------------+
       |                         |                           |                     |
       v                         v                           v                     v
+---------------+       +------------------+       +-------------------+   +---------------+
|   BRAND DNA   |       |   MARKET RADAR   |       |  VISUAL FORENSICS |   |  WATCHTOWER   |
| - Brand specs |       | - Google Shopping|       | - Google Lens     |   | - Snapshots   |
| - SKU catalog |       | - Offer baseline |       | - Evidence Graph  |   | - Timelines   |
| - Variant map |       | - Quick vs Deep  |       | - Match lineages  |   | - Price alerts|
+---------------+       +------------------+       +-------------------+   +---------------+
       ^                         ^                           ^                     ^
       |                         |                           |                     |
+-----------------------------------------------------------------------------------------+
|                              INVESTIGATION INTELLIGENCE                                 |
|   - Deterministic Reasoning Engine ("Explain This Finding", "What Would Change")        |
|   - Action Center Playbooks & Non-Legal Dossier Compiler                                |
+-----------------------------------------------------------------------------------------+
       ^
       |
+-----------------------------------------------------------------------------------------+
|                        BEACONTRA LENS 2.0 (CHROME MV3 COMPANION)                        |
|   - Side-panel extraction  - Context-menu image check  - Adapter for Amazon & Flipkart  |
+-----------------------------------------------------------------------------------------+
```

---

## 3. Detailed Milestone Roadmaps & Dependencies

### Milestone 1: Brand DNA (Brand Vault)
- **Goal:** Enable brand owners to register and manage canonical brand profiles, SKUs, model numbers, variants, authorized domains, street price bands, and authorized partner lists.
- **Key Capability:** Intelligent product identity normalization that recognizes compatible color/aesthetic variants while rejecting incompatible hardware tier or generation mismatches (e.g. differentiating Airdopes 141 from Airdopes 141 ANC or Gen 2).
- **Backend APIs:**
  - `POST /api/brand-dna/brands`: Create/update brand profile.
  - `GET /api/brand-dna/brands`: List registered brands.
  - `POST /api/brand-dna/products`: Register product SKU with reference images, price bounds, and authorized seller lists.
  - `GET /api/brand-dna/products`: List and search brand products.
  - `GET /api/brand-dna/products/:id`: Get product profile.
  - `PATCH /api/brand-dna/products/:id`: Update product profile and manual corrections.
- **Storage:** Persisted in durable storage via repository adapter.

### Milestone 2: Unified Evidence Foundation
- **Goal:** Establish a single, strictly typed domain model shared across all modules without duplicate or conflicting representations.
- **Entities:**
  1. `ProductIdentity`: Canonical brand product definition.
  2. `MarketplaceListing`: Observed marketplace offer (ASIN, title, URL, price, seller).
  3. `MarketplaceSource`: Platform identity (Amazon.in, Flipkart, Google Shopping).
  4. `MerchantIdentity`: Observed seller profile with authorization status.
  5. `VisualEvidence`: Reference images and Google Lens search matches.
  6. `SearchObservation`: Raw timestamped search records and parameters.
  7. `InvestigationCase`: Human audit cases with analyst notes and status.
  8. `HistoricalSnapshot`: Captured state for timeline comparisons.
- **Storage:** Unified repository interface (`EvidenceRepository`) supporting Cloudflare D1 with seamless in-memory/KV fallback for local development and unit tests.

### Milestone 3: Market Radar
- **Goal:** Intelligent market discovery and comparison engine.
- **Key Capability:** Differentiates legitimate seasonal/retail discounts from abnormal undercut pricing; calculates market price baselines when sufficient comparable offers exist; implements Quick Scan (1-2 credits) vs Deep Investigation (selective authorization).
- **Backend APIs:**
  - `POST /api/radar/scan`: Execute targeted or deep market scan.
  - `GET /api/radar/baseline/:productId`: Retrieve computed price baseline and offer distribution.

### Milestone 4: Visual Forensics & Evidence Graph
- **Goal:** Visual match cross-verification and interactive evidence graph.
- **Key Capability:** Builds node-edge relationships (`Product` -> `Listing` -> `Image` -> `LensMatch` -> `Merchant`) strictly backed by verifiable observations. Interactive exploration of match sources and domains.
- **Backend APIs:**
  - `GET /api/graph/:caseId`: Get evidence graph nodes and edges.
  - `POST /api/visual/inspect`: Run on-demand Lens visual cross-check on a specific candidate image.

### Milestone 5: Watchtower
- **Goal:** Longitudinal marketplace intelligence and change tracking.
- **Key Capability:** Snapshot comparison between any two investigation runs: new listings, missing listings (without falsely claiming deletion), price shifts, seller turnover.
- **Backend APIs:**
  - `GET /api/watchtower/timeline/:productId`: Historical investigation snapshots.
  - `POST /api/watchtower/diff`: Compute semantic diff between two scan snapshots.

### Milestone 6: Beacontra Lens 2.0
- **Goal:** Upgraded Manifest V3 companion extension.
- **Key Capability:** Extensible marketplace adapter architecture (Amazon.in + Flipkart ready), image context-menu lookup, Brand DNA integration, and direct Evidence Graph navigation.

### Milestone 7: Investigation Intelligence
- **Goal:** Deterministic explanation engine.
- **Key Capability:** "Explain This Finding" and "What Would Change This Finding" explaining underlying heuristics, missing evidence, and sensitivity thresholds.

### Milestone 8: Action Center & Playbooks
- **Goal:** Next-step recommendations for human triage and updated dossier compilation.

### Milestone 9: World-Class UI
- **Goal:** Unified dark navy/charcoal design system with restrained teal accents across all views.

---

## 4. SerpApi Request Budget & Credit Discipline

| Module / Operation | Engine | Expected Credit Cost | Safeguards |
|---|---|---|---|
| **Market Radar (Quick Scan)** | `google_shopping` | 1 credit | Cached for 24h; 0 credits on cache hit |
| **Market Radar (Deep Scan)** | `google_shopping` | 1 credit | Requires explicit user authorization |
| **Visual Forensics** | `google_lens` | 1–10 credits | Strict cap: `MAX_LENS_CALLS = 10`, deduplicated by image URL |
| **Visual Forensics (Single Image)** | `google_lens` | 1 credit | On-demand user action only |
| **Watchtower (Diff)** | None (Internal) | 0 credits | Analyzes previously saved snapshots |
| **Evidence Graph** | None (Internal) | 0 credits | Constructed from stored observations |

---

## 5. Verification Plan

Each milestone will deliver:
1. Complete, idiomatic TypeScript implementation.
2. Comprehensive unit and regression tests in `tests/`.
3. Typecheck verification (`npm run typecheck`).
4. Lint verification (`npm run lint`).
5. Production build validation (`npm run build`).
6. Focused git commit referencing milestone goals.
