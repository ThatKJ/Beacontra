# Final Demo Product Validation

**Date:** 2026-09-17  
**Status:** COMPLETE - Primary demo product validated

---

## Selected Demo Product

### Product: **boAt Airdopes 141 Gen 2**

**Reference Image URL:** `https://www.boat-lifestyle.com/cdn/shop/files/AD141-FI_Black06_600x.jpg`  
**Image HTTP Status:** 200 OK  
**Image Size:** 60 KB  

**MRP:** ₹1,299  
**Expected Price Range:** ₹700 - ₹1,200  
**Known Authorized Sellers:** Flipkart, Amazon, Reliance Digital, Croma, boAt, JioMart, Myntra, Nykaa, boat-lifestyle.com  

---

## Why This Product

| Criterion | Assessment |
|-----------|------------|
| **Recognizable** | boAt is a well-known Indian D2C brand; Airdopes 141 is a flagship product |
| **Reference image available** | High-quality official image available on boAt website (200 OK) |
| **Live Google Shopping results** | Returns 60+ listings across Flipkart, Amazon, Reliance, Croma, JioMart, Myntra, etc. |
| **Lens structured results** | Returns 60 visual_matches, 139 exact_matches, price/rating data |
| **Price variance exists** | Listings range from ₹699 to ₹2,499 (31-93% below MRP) |
| **Seller diversity** | Multiple sellers: Flipkart, Amazon, Reliance Digital, Croma, JioMart, Myntra, Zepto, boat-lifestyle.com, etc. |
| **Visual evidence** | Google Lens returns 60 visual_matches, 139 exact_matches with price/rating data |
| **Safe demo** | No need to accuse real sellers; price anomalies and visual evidence speak for themselves |

---

## Lens Validation Results (Live Test - 2026-09-17)

### Lens Matrix Results (boAt Airdopes 141 image)

| Test | Type | Method | Status | Visual Matches | Exact Matches | Products | AI Overview |
|------|------|--------|--------|----------------|---------------|----------|-------------|
| A | visual_matches | URL | ✅ PASS | 60 | 0 | 0 | No |
| B | exact_matches | URL | ✅ PASS | 0 | 139 | 0 | No |
| C | products | URL | ✅ PASS | 60 | 0 | 0 | No |
| D | all | URL | ✅ PASS | 12 | 0 | 0 | Yes |
| E | visual_matches | image_id | ✅ PASS | 60 | 0 | 0 | No |
| F | exact_matches | image_id | ✅ PASS | 0 | 140 | 0 | No |
| G | products | image_id | ✅ PASS | 60 | 0 | 0 | No |
| H | all | image_id | ✅ PASS | 12 | 0 | 0 | Yes |

**All 8 tests PASS** - Structured results work for real product image.

### Key Findings

| Aspect | Result |
|--------|--------|
| **Image API upload** | ✅ Works (image_id obtained in ~2s) |
| **visual_matches** | ✅ Returns 60 matches with thumbnails, sources, prices |
| **exact_matches** | ✅ Returns 139-140 exact matches with dimensions |
| **products** | ✅ Returns 60 visual matches with price/rating/in_stock |
| **all** | ✅ Returns 12 visual matches + ai_overview + organic_results |
| **Image upload flow** | Works perfectly (image_id obtained in ~2s, then Lens calls use it) |

### Visual Matches Data Quality

| Field | Present |
|-------|---------|
| thumbnail | ✅ |
| image | ✅ |
| source | ✅ |
| source_icon | ✅ |
| title | ✅ |
| link | ✅ |
| rating | ✅ |
| reviews | ✅ |
| price (value, extracted_value, currency) | ✅ |
| in_stock | ✅ |
| source_icon | ✅ |
| dimensions (width/height) | ✅ |
| exact_matches flag | ✅ |
| serpapi_exact_matches_link | ✅ |

---

## Expected Live Result Characteristics

| Metric | Expected Value |
|--------|----------------|
| Total listings found | ~60-80 |
| Listings with price anomaly | ~25-35 (below MRP/expected range) |
| Listings with seller anomaly | ~35-45 (unknown/unauthorized sellers) |
| Listings with visual evidence | ~10-20 (exact/visual matches) |
| Listings with "unavailable" visual | ~30-40 (Lens returns ai_overview only) |
| Credits used per scan | ESTIMATE: capped at 10 Lens candidates to control usage |

---

## Visual Evidence Expected

| Signal | Expected | Rationale |
|--------|----------|-----------|
| **exact_matches** | Likely 0 | boAt image unlikely to have exact matches in Google's index |
| **visual_matches** | 1-5 | Similar earbud images may match |
| **products** | 1-5 | Commercial listings with price/rating |
| **exact_matches (image_id)** | 100+ | Uploaded image gets exact matches |
| **visual_matches (image_id)** | 10-60 | Good coverage with image_id |

---

## Fallback Strategy

| Failure Mode | Fallback |
|--------------|----------|
| **Lens API error** | Show "Visual verification unavailable" badge; rely on price/seller signals |
| **Image upload fails** | Fall back to URL-based Lens call (type=products) |
| **No Shopping results** | Show "No listings found" message |
| **Image URL 404** | Use cached demo image from repo (hosted locally) |
| **Live API quota exceeded** | Show cached/fixture data with "CACHED" badge |

---

## Cached Demo Data

If live API is unavailable, use fixture data that simulates:

| Scenario | Fixture File |
|----------|--------------|
| Live Google Lens with matches | `tests/fixtures/google_lens.json` |
| Lens returns ai_overview only | `tests/fixtures/google_lens_ai_overview_only.json` |
| exact_matches with image_id | `tests/fixtures/google_lens_exact_matches.json` |
| Google Shopping with listings | `tests/fixtures/google_shopping.json` |

---

## Verification Checklist (Pre-Demo)

- [x] Reference image URL returns 200 OK
- [x] `npm run serpapi:smoke` passes
- [x] `curl -X POST /api/beacontra/scan` returns live data with `dataSource: "live"`
- [x] Results show price anomalies, seller anomalies, visual signals
- [x] UI shows "⚡ LIVE SERPAPI RESULT" badge
- [x] Side-by-side image comparison renders
- [x] Score label shows **"Review Priority Score"** (verified directly in `public/index.html` — superseded from the earlier "Heuristic Risk Score"/"Risk Score: XX/100" checklist wording)
- [x] dataSource badge shows "live" or "fixture"
- [x] No "BrandLens" references in the UI — renamed to Beacontra, `docs/NAMING_DECISION.md` (NAMING STATUS: FINAL)

---

## Credit Estimate

**These figures are our own app-level heuristic (`isAdvanced ? 3 : 1` in `SerpApiClient.estimateCredits()`), not confirmed SerpApi billing** — see `docs/SERPAPI_BUDGET.md`'s explicit caveat. Treat as an internal estimate label, not a verified cost.

| Operation | App-level estimated credits |
|-----------|---------|
| Google Shopping (1 call) | 3 (estimate) |
| Google Lens exact_matches (image_id, up to 1 per candidate) | 3 (estimate) |
| Google Lens products (URL, fallback, up to 1 per candidate) | 3 (estimate) |
| **Total per scan** | Beacontra caps Lens analysis to `MAX_LENS_CALLS = 10` candidates specifically to bound API usage — that cap, not a specific credit number, is the verifiable, code-backed claim to make publicly. |

---

## Known Variability

| Factor | Impact | Mitigation |
|--------|--------|------------|
| Google Lens results vary by image | Exact matches may vary | Use exact_matches with image_id for best results |
| Shopping results pagination | Only first page | Accept first page only |
| Seller name normalization | Variations exist | `normalizeSellerName()` handles common suffixes |
| Price extraction | Some listings lack price | Filter out listings without extracted_price |
| Image URL accessibility | Amazon CDN may block | Use uploaded image_id as primary, URL as fallback |