# Demo Data Selection

**Status: recommendation drafted, not yet live-verified with a working reference image.** Per the credit-management directive (don't rerun tests casually), this document recommends a candidate based on testing that has *already happened* across this project, rather than spending fresh credits running new candidate products. One targeted, final spot-check is still needed before rehearsal — see "Remaining step" below.

## Selection criteria (per the mission brief)

- Recognizable to a judge without explanation.
- A real reference image available.
- Lens returns useful structured matches (mechanism now confirmed working, per `docs/LENS_SPIKE_V2.md` — not yet confirmed *for this specific product's images*).
- Shopping returns enough listings to make the ranked-queue moment meaningful.
- Visually interesting results, real price variance.
- Doesn't require accusing a real, named merchant of anything — reviewable listings from generic/marketplace-style sellers, not "look, Amazon.in is selling fakes."

## Recommended candidate: **boAt Airdopes 141**

**Why this one, not a fresh candidate:** it's already the de facto standard test product across this project's history, so choosing it doesn't require new credit spend to validate the basics:
- The original `google_shopping` smoke test (`docs/TASK_BOARD.md` T-027) queried "boAt Airdopes" directly — confirmed live, HTTP 200, **40 organic shopping results**, real price variance, ~3 credits.
- The UI's own "Load Demo Example" button (`public/index.html`) already pre-fills "boAt Airdopes 141" as the product name.
- The original (buggy) T-017 spike used a boAt Airdopes 141 product image from Amazon as its test image — meaning this exact product has already been the subject of a Lens call, even though that specific call predates the parameter fixes.
- boAt is a well-known, mass-market Indian audio brand — instantly recognizable to any Indian judge, and its earbuds are a category genuinely affected by marketplace counterfeiting (cheap wired/wireless earbuds are one of the most commonly counterfeited electronics categories in India).

**Expected live result characteristics** (based on the T-027 smoke test data, not re-run for this document): dozens of listings across price points from ~₹500 to full MRP, multiple sellers/sources (Flipkart, Amazon, smaller marketplace sellers), enough spread for the price-anomaly signal to have real material to work with.

**Known variability:** shopping results for a popular product like this will differ run-to-run (new listings appear, prices fluctuate) — this is expected and fine; SerpApi's 1hr cache keeps repeated rehearsals from costing extra credits or from changing mid-rehearsal.

## Remaining step before this is rehearsal-ready

**The one concrete blocker:** `docs/TASK_BOARD.md` T-028 — the demo prefill's hardcoded official-product-photo URL (a Shopify CDN link) is dead (404, verified directly with curl this session). A working reference image for boAt Airdopes 141 needs to be sourced and substituted before the visual "gotcha" moment has anything real to compare against. Recommend hosting this image as a static asset in the repo/deployment rather than depending on an external CDN URL again (same recommendation as T-028) — this failure mode (an external link quietly dying) is exactly what already happened once.

**After that fix lands:** one live end-to-end scan of boAt Airdopes 141 with the *working* reference image, using the corrected Lens pipeline, to confirm the visual signal produces a legible result for this specific product — not a full parameter matrix again, just the actual production call path once.

## Fallback strategy

Per `docs/DEMO.md`'s existing fallback hierarchy (LIVE → CACHED → labeled FIXTURE, never presented as live): if boAt Airdopes 141 doesn't produce a clean result on the final spot-check, the second candidate to try (not yet tested, would need its own credit-conscious check) is another well-known, frequently-counterfeited Indian D2C category — a Mamaearth or Boat-adjacent personal-care/electronics product — rather than inventing a synthetic example, per the demo's own commitment to using genuine live data.
