# Demo Data Selection

**Purpose:** Document the chosen demo product and image for the live demo, with rationale and verification.

---

## Selected Demo Product

### Product: **boAt Airdopes 141**

**Reference Image URL:** `https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png` (for Lens testing; actual demo uses real boAt image)

**Actual Demo Image:** `https://m.media-amazon.com/images/I/71gN9JKBVML._SX679_.jpg` (boAt Airdopes 141 Gen 2 product image)

**MRP:** ₹1,299

**Expected Price Range:** ₹700 - ₹1,100

**Known Authorized Sellers:** Flipkart, Amazon, Reliance Digital, Croma, boAt, JioMart, Myntra, Nykaa, boat-lifestyle.com

---

## Why This Product

| Criterion | Assessment |
|-----------|------------|
| **Recognizable** | boAt is a well-known Indian D2C brand; Airdopes 141 is a flagship product |
| **Reference image available** | High-quality official image available on Amazon/boAt website |
| **Live Google Shopping results** | Returns 40+ listings across Flipkart, Amazon, Reliance, Croma, JioMart, Myntra, etc. |
| **Lens structured results** | Returns exact_matches (400+ for Google logo test), visual_matches, products with price/rating |
| **Price variance exists** | Listings range from ₹699 to ₹2,499 (31-93% below MRP) |
| **Seller diversity** | Multiple sellers: Flipkart, Amazon, Reliance Digital, Croma, boAt, JioMart, Myntra, Zepto, Flipkart, Croma, boat-lifestyle.com, etc. |
| **Visual evidence** | Google Lens returns exact_matches (400 for Google logo), visual_matches, products |

---

## Expected Live Result Characteristics

**⚠️ PROVISIONAL — pre-dates both the Lens request-path fix and the real-product validation task below.** This table's own numbers already predicted boAt might be a weak Lens candidate ("exact_matches: Likely 0 for boAt image") — which is exactly the weak-demo concern raised this session. Do not treat these as current expectations; replace this table with the real observed numbers from `docs/FINAL_DEMO_PRODUCT_VALIDATION.md` / `docs/FINAL_METRICS.md` once that P0 validation (OPENCODE/GEMINI) lands, including confirming whether boAt remains the primary demo product or gets replaced by one of up to 2 alternatives that produces genuine visual evidence.

| Metric | Expected Value (pre-validation estimate, not observed) |
|--------|----------------|
| Total listings found | ~40-60 |
| Listings with price anomaly | ~25-35 (below MRP/expected range) |
| Listings with seller anomaly | ~35-45 (unknown/unauthorized sellers) |
| Listings with visual evidence | ~10-20 (exact/visual matches) |
| Listings with "unavailable" visual | ~30-50 (Lens returns ai_overview only for some) |
| Credits used per scan | ~13 (1 Shopping + ~12 Lens) — see `docs/SERPAPI_BUDGET.md`'s caveat that this multiplier is an app-level estimate, not confirmed SerpApi billing |

---

## Visual Evidence Expected

| Signal | Expected | Rationale |
|--------|----------|-----------|
| **exact_matches** | Likely 0 for boAt image | boAt image unlikely to have exact matches in Google's index |
| **visual_matches** | 1-5 | Similar earbud images may match |
| **products** | 1-5 | Commercial listings with price/rating |
| **exact_matches (image_id)** | 0-5 | Depends on image_id upload |
| **ai_overview** | Present | Fallback when structured results limited |

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

- [ ] Reference image URL returns 200 OK
- [ ] `npm run serpapi:smoke` passes
- [ ] `curl -X POST /api/brandlens/scan` (route path keeps the internal identifier; product is now Beacontra) returns live data with `dataSource: "live"`
- [ ] Results show price anomalies, seller anomalies, visual signals
- [ ] UI shows "⚡ LIVE SERPAPI RESULT" badge
- [ ] Side-by-side image comparison renders
- [ ] Heuristic score label shows "Heuristic Risk Score" (not "Risk Score: XX/100")
- [ ] dataSource badge shows "live" or "fixture"
- [ ] No "BrandLens" references in the UI (renamed to Beacontra, `docs/NAMING_DECISION.md` — NAMING STATUS: FINAL)

---

## Credit Estimate

| Operation | Credits |
|-----------|---------|
| Google Shopping (1 call) | 3 |
| Google Lens exact_matches (image_id, up to 1) | 3 |
| Google Lens products (URL, up to 10) | 30 |
| **Total per scan (max)** | **~36** |
| **Typical scan (capped at 10 Lens)** | **~13-16** |

**Cross-check note (CLAUDE, this session):** reading `runVisualVerification()` directly, the exact_matches→products fallback logic runs *per candidate* inside the `MAX_LENS_CALLS`-capped loop, not once globally — so the realistic worst case is closer to 1 shopping + up to 20 Lens calls (10 candidates × up to 2 calls each), not the single "exact_matches, up to 1" implied above. See `docs/SERPAPI_BUDGET.md`'s "Worst-case call count" section for the reconciled model, and its caveat that the credit-per-call multipliers (1 vs. 3) are our own app-level estimate, not confirmed SerpApi billing. Recommend replacing both tables with one real observed number from an actual logged scan before submission, rather than reconciling two different estimates.

---

## Known Variability

| Factor | Impact | Mitigation |
|--------|--------|------------|
| Google Lens results vary by image | Exact matches may vary | Use exact_matches with image_id for best results |
| Shopping results pagination | Only first page | Accept first page only |
| Seller name normalization | Variations exist | `normalizeSellerName()` handles common suffixes |
| Price extraction | Some listings lack price | Filter out listings without extracted_price |
| Image URL accessibility | Amazon CDN may block | Use uploaded image_id as primary, URL as fallback |