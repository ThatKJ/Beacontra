# Final Verified Metrics & Truth Sweep

## Count Reconciliation
All language in Beacontra is factually consistent with the actual deterministic counts achieved during the canonical live test sequence (`docs/FINAL_METRICS_DUMP.json`):

- **Shopping Raw Result Count:** 11 (Reduced dramatically from previous runs by deterministic variant filtering which removes mismatched accessories and Pro models).
- **Deduplicated Commercial Listings:** 11
- **Top Candidates Receiving Lens Analysis:** 10 (strictly capped by `MAX_LENS_CALLS = 10` to bound API usage)
- **Remaining Commercial Listings:** 1 (retains commercial price and source evidence, marked `not_verified` for visual)
- **Visual Evidence Breakdown (Top 10 Candidates):**
  - `matched`: 0
  - `visual_match`: 0
  - `no_evidence`: 8 (neutral — Lens executed, found 0 matches against official photo)
  - `unavailable`: 2 (neutral — unindexed or no structured match data)
- **Price Classification Breakdown:**
  - `below_mrp` (< 50% of MRP - Extreme Deviation): 11
  - `large_deviation` (< 70% of MRP): 0
  - `moderate_discount` (< 90% of MRP): 0
  - `normal`: 0
- **Seller Classification Breakdown:**
  - `no_authorized_list`: 11 (0 anomalous; safe neutral default when no allowlist is supplied)
- **API Request Breakdown:**
  - **TOTAL API REQUESTS:** 11 engine calls (+ up to 10 image-upload attempts)
  - **SHOPPING REQUESTS:** 1
  - **LENS REQUESTS:** 10
  - **IMAGE-UPLOAD REQUESTS:** up to 10
- **Latency:** ~24.9 seconds.
- **Composite Recommendations:** 11 `review`

---

## Language Rule Enforcement
- The phrase `"180+ listings scanned"` is completely retired.
- Beacontra's verified claim: **"Filters live marketplace listings using regex variant normalization, and deeply evaluates the top 10 candidate listings with Google Lens."**
- "Counterfeit detector", "fraud score", and "confirmed fake" are completely retired.
- Score label is strictly **"Review Priority Score"**.
- "Unauthorized seller" is only used when an authorized allowlist is provided and the seller is absent from it.
- Lens matches are explained as an *optional, supporting signal* that falls back gracefully (`no_evidence` / `unavailable` / `not_verified`) without generating false-positive alarms.
