# Final Verified Metrics & Truth Sweep

## Count Reconciliation
All language in Beacontra is factually consistent with the actual deterministic counts achieved during the canonical live test sequence (`docs/FINAL_METRICS_DUMP.json`):

- **Shopping Raw Result Count:** 40
- **Deduplicated Commercial Listings:** 40
- **Top Candidates Receiving Lens Analysis:** 10 (strictly capped by `MAX_LENS_CALLS = 10` to bound API usage)
- **Remaining Commercial Listings:** 30 (retain commercial price and source evidence, marked `not_verified` for visual)
- **Visual Evidence Breakdown (Top 10 Candidates):**
  - `matched`: 0
  - `visual_match`: 0
  - `no_evidence`: 6 (neutral — Lens executed, found 0 matches against official photo)
  - `unavailable`: 4 (neutral — unindexed or no structured match data)
- **Price Classification Breakdown:**
  - `below_mrp` (< 70% of MRP): 35
  - `moderate_discount` (< 90% of MRP): 1
  - `normal`: 4
- **Seller Classification Breakdown:**
  - `no_authorized_list`: 40 (0 anomalous; safe neutral default when no allowlist is supplied)
- **API Request Breakdown:**
  - **TOTAL API REQUESTS:** 11 engine calls (+ up to 10 image-upload attempts)
  - **SHOPPING REQUESTS:** 1
  - **LENS REQUESTS:** 10
  - **IMAGE-UPLOAD REQUESTS:** up to 10
- **Estimated Credit Cost:** 13–33 credits (internal app-level heuristic estimate; not confirmed SerpApi account billing)
- **Composite Recommendations:** 36 `review`, 4 `likely_genuine` (Review Priority Score range: 25–55)

---

## Language Rule Enforcement
- The phrase `"180+ listings scanned"` is completely retired.
- Beacontra's verified claim: **"Scans 40 marketplace listings and deeply evaluates the top 10 candidate listings with Google Lens."**
- "Counterfeit detector", "fraud score", and "confirmed fake" are completely retired.
- Score label is strictly **"Review Priority Score"**.
- "Unauthorized seller" is only used when an authorized allowlist is provided and the seller is absent from it.
- Lens matches are explained as an *optional, supporting signal* that falls back gracefully (`no_evidence` / `unavailable` / `not_verified`) without generating false-positive alarms.
