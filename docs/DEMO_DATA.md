# Demo Data Selection

**Purpose:** Document the chosen demo product and reference image for the live demo, with rationale and verified metrics.

---

## Selected Demo Product

### Product: **boAt Airdopes 141** (plain/original variant)

**Reference Image URL:** `https://www.boat-lifestyle.com/cdn/shop/files/AD141-FI_Black06_600x.jpg`  
- HTTP Status: 200 OK (verified via curl)  
- Image Size: 60,098 bytes  

**Reference MRP:** ₹4,490  
- Verified directly against boAt's official product listing and retail packaging for the plain "Airdopes 141" (Gen 2 is ₹3,990, Pro is ₹2,990, Elite ANC is ₹5,990). Matches `mrp: 4490` in `scripts/final-validation.ts`.

**Expected Street Price Range:** ₹800 – ₹1,500  

**Known Authorized Sellers:** boAt, Flipkart, Amazon, Reliance Digital, Croma, JioMart, Myntra, boat-lifestyle.com  

---

## Why This Product

| Criterion | Assessment |
|-----------|------------|
| **Recognizable** | boAt is a flagship Indian D2C audio brand; Airdopes 141 is widely searched |
| **Reference image accessible** | High-quality official image on boAt CDN (returns 200 OK, unblocked) |
| **Live Google Shopping coverage** | Returns 40 deduplicated listings across Amazon.in, Flipkart, Croma, Zepto, Myntra, and independent retailers |
| **Price variance exists** | Listings range from ₹129 (silicone cases) and ₹749–₹1,599 (street discounts) to ₹5,990 (Elite ANC variant) |
| **Seller diversity** | Mix of brand-direct (boAt), major platforms (Amazon, Croma, Myntra), and independent stores (Swara Telecom, Nalanda Enterprises, LowestRate Shopping) |
| **Visual evidence realism** | Real marketplace thumbnails produce honest neutral outcomes (`no_evidence` / `unavailable`), demonstrating absence-of-evidence safety |

---

## Canonical Live Run Characteristics

From the verified canonical run (`docs/FINAL_METRICS_DUMP.json`):

| Metric | Canonical Value | Meaning |
|--------|-----------------|---------|
| **Deduplicated commercial listings** | 40 | Total marketplace offers analyzed |
| **Candidate listings with Lens analysis** | 10 | Strictly bounded by `MAX_LENS_CALLS = 10` cap |
| **Commercial listings without Lens** | 30 | Retain commercial price/source evidence (`not_verified`) |
| **Visual signal breakdown** | 6 `no_evidence`, 4 `unavailable`, 0 `matched` | Honest absence of evidence; no false alarms |
| **Listings with price deviation** | 36 / 40 | 35 `below_mrp`, 1 `moderate_discount`, 4 `normal` |
| **Listings with seller deviation** | 0 / 40 | 40 `no_authorized_list` (non-anomalous when no allowlist provided) |
| **API requests breakdown** | 1 Shopping, 10 Lens, up to 10 Image Uploads | Total: 11 search calls (+ image uploads) |
| **Estimated credit cost** | 13–33 credits | App-level estimate (`isAdvanced ? 3 : 1`), not confirmed billing |

> **Coverage Architecture Note:**  
> Beacontra performs Lens analysis on the top 10 candidate listings to bound API usage; the remaining listings retain commercial price/source evidence.

---

## Visual Evidence Interpretation

| Signal Status | Meaning | Score Impact |
|---------------|---------|--------------|
| `matched` | Listing photo matches official image | Negative risk (-5 pts) |
| `visual_match` | Visual matches found but not exact | Neutral (+5 base pts) |
| `no_evidence` | Lens ran successfully, found 0 matches against reference | Neutral (+5 base pts) |
| `unavailable` | Lens unindexed or thumbnail unavailable | Neutral (+5 base pts) |
| `not_verified` | Listing beyond the top 10 candidate cap | Neutral (+5 base pts) |
| `unverified_photo_source` | Photo matches third-party sources, not brand | High risk anomaly (+40 pts) |

---

## Pre-Demo Verification Checklist

- [x] Reference image URL returns HTTP 200 OK
- [x] `npm test` passes (68 unit/integration tests)
- [x] `curl -X POST /api/beacontra/scan` returns live data with `dataSource: "live"`
- [x] UI displays **"Review Priority Score"** (not "Heuristic Risk Score" or "Fraud Score")
- [x] UI shows transparent data provenance badge (`⚡ LIVE SERPAPI RESULT` or `CACHED LIVE RESULT`)
- [x] Side-by-side image comparison dialog opens and traps keyboard focus
- [x] All 40 listings appear in review queue, with top 10 displaying Lens analysis
- [x] Zero references to retired codename "BrandLens" in user-facing UI