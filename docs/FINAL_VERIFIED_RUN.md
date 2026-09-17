# Final Verified Live Run — Beacontra

**Corrected by CLAUDE, 2026-09-18.** The previous version of this document did not match its own underlying data (`docs/FINAL_METRICS_DUMP.json`) — its MRP (₹1,299), product variant ("Gen 2"), visual-signal split (8/2), price-anomaly count (38/40), seller-anomaly count (38/40), and credit framing ("Actual API Credits Consumed... per SerpApi response metadata") were all wrong relative to the actual script inputs and actual dump contents. Every number below was recomputed directly from `docs/FINAL_METRICS_DUMP.json`'s 40-record `results` array with a script, not eyeballed or copied from a prior summary.

---

## What was actually run

Read directly from `scripts/final-validation.ts` at the time this dump was produced:
- **productName:** `"boAt Airdopes 141"` (the plain variant — not "Gen 2," not "Pro," not "ANC")
- **officialImageUrl:** `https://www.boat-lifestyle.com/cdn/shop/files/AD141-FI_Black06_600x.jpg` (verified live, HTTP 200, real JPEG)
- **mrp:** `4490` (verified correct for this exact variant against boAt's own listing, see `docs/TASK_BOARD.md` T-033 follow-up)
- **knownAuthorizedSellers:** not passed at all (no such field in the script's `input` object)
- **Mode:** LIVE (`dataSource` in the raw result confirms `"live"`, real key, real network calls)

## Raw counts (recomputed directly from the 40-record dump, not summarized secondhand)

| Metric | Value | Source |
|---|---|---|
| Displayed/analyzed results | **40** | `resultCount` field + `len(results)`, both agree |
| Latency | **112,310 ms** (~112 seconds) | `latency` field |
| `creditsUsed` (app-level counter) | **10** | `creditsUsed` field — this is `SerpApiClient.getCreditUsage()`, our own `isAdvanced ? 3 : 1` heuristic accumulator. **It is not SerpApi billing data.** The previous version of this document's claim that a "13" figure came "per SerpApi response metadata" is false — there is no such field being read anywhere in the code; both "10" and any other number derived from this counter are the same internal estimate. |
| Errors | None recorded | `main().catch()` didn't fire; no error fields in any of the 40 records |

## Visual signal — exact distribution (all 40 records)

| `anomalyType` | Count |
|---|---|
| `not_verified` (beyond the `MAX_LENS_CALLS = 10` cap — no Lens call attempted for these) | 30 |
| `no_evidence` (Lens call made, ran successfully, found nothing) | 6 |
| `unavailable` (Lens call made, failed or returned no usable data) | 4 |
| `matched` / `visual_match` / `unverified_photo_source` / `different_product` | 0 (all) |

**10 of 40 listings received a Lens call at all** (6 + 4 = 10, exactly matching the `MAX_LENS_CALLS` cap — this is the intentional, code-backed design, not data loss). **Zero of those 10 produced positive visual evidence** (no `matched`, no `visual_match`). This confirms, on the real dump, the same limitation already documented: for this product/query, the visual "gotcha" signal did not fire. It is not fabricated as working; it correctly shows as neutral (`no_evidence`/`unavailable`), not as a false anomaly.

## Price signal — exact distribution, and the real reason the anomaly rate is high

| `anomalyType` | Count |
|---|---|
| `below_mrp` (price < 70% of the ₹4,490 MRP) | 35 |
| `moderate_discount` (70-90% of MRP) | 1 |
| `normal` | 4 |
| **`isAnomalous: true` total** | **36 / 40 (90%)** — not 38/40 as the previous version of this document claimed |

**Root cause, found by inspecting the actual listing titles in the dump (per the user's explicit item-4 instruction to investigate, not just report the number):** the Shopping query `"boAt Airdopes 141"` returns many listings for **different boAt products that are not the plain Airdopes 141** — confirmed directly from the real titles in this run: *"Airdopes 141 Gen 2," "Airdopes 141 Elite ANC," "Airdopes 611," "Airdopes 131 Elite ANC," "Airdopes 141 Neo," "Airdopes 111v2," "Airdopes Prime 412," "Airdopes Unity ANC," "Airdopes 121 PRO"* — each a genuinely different product with its own (usually lower) real MRP, all being compared against the plain-141's single ₹4,490 figure. **This is a real product-normalization/query-specificity gap, not a threshold-tuning issue and not an overclaim-language issue** (T-030's language fix was still correct and necessary, but doesn't address this). A ₹1,499 listing for the *Airdopes 611* is not "13% below MRP" of the *Airdopes 141* — it's a different product that shouldn't have been compared to that MRP at all.
**This needs a decision, not just a wording fix:** either (a) tighten the Shopping query/result-filtering to exclude listings whose title indicates a different named variant, or (b) choose a demo product query where this cross-variant confusion doesn't occur. Recommending (a) as the more durable fix, (b) as the faster one before a specific demo recording.

## Seller signal — exact distribution

| `anomalyType` | Count |
|---|---|
| `no_authorized_list` | **40 / 40 (100%)** |
| **`isAnomalous: true` total** | **0 / 40 (0%)** |

**This directly refutes the previous version of this document's claim of "38/40 seller anomalies (95%)."** The real, verified answer is **zero** seller anomalies in this run — exactly what the code should produce given no `knownAuthorizedSellers` list was passed (confirmed correct behavior per the T-026 fix: absence of a reference list correctly returns neutral, not anomalous). The seller-signal concern the user raised (`no_authorized_list` being miscounted as anomalous) does **not** occur in the actual code path — the previous write-up simply reported a wrong number.

## Composite score / recommendation distribution

| Recommendation | Count |
|---|---|
| `review` | 36 |
| `likely_genuine` | 4 |
| `review_urgently` / `monitor` | 0 / 0 |

Composite score range: 25–55 (not 25–70 as previously claimed).

## Request count and credits — what can and can't be verified

- **`creditsUsed: 10`** is the only request-volume signal this script currently records. It is `SerpApiClient`'s own internal accumulator (`isAdvanced ? 3 : 1` per call), **not a raw request count and not SerpApi billing data.**
- The **exact number of raw HTTP requests** (1 Shopping + N Lens calls, where N depends on how many of the 10 capped candidates needed the `exact_matches`→`products` fallback) is **not separately logged** by the current script or client. Reconstructing it precisely would require adding a request-count instrumentation (e.g., a counter alongside `creditsUsed`), which does not exist yet.
- **Do not publish a specific "N requests" or "N credits" number as verified fact** until that instrumentation exists. The honest, currently-supportable claim is the one already adopted elsewhere in the docs: *"Beacontra caps Lens analysis to the top `MAX_LENS_CALLS = 10` candidates (ordered by price anomaly) to bound API usage."* That claim is directly backed by the code, not an estimate.

## Conclusion

**Primary demo product tested:** boAt Airdopes 141 (plain variant), ₹4,490 MRP, real reference image, live mode, no errors.

**Verdict: PASS WITH LIMITATIONS — two limitations, not one:**
1. **Visual evidence:** zero positive Lens matches on this product/query, as already known and already handled correctly (neutral, not a false anomaly). The visual "gotcha" moment does not occur for this specific product as queried.
2. **Price-signal specificity (new finding this pass):** the high anomaly rate is substantially explained by cross-variant confusion in the Shopping query, not by the product genuinely having widespread suspicious pricing. This should be fixed (tighter query/filtering) or worked around (a cleaner demo query) before this run's price-anomaly numbers are presented as a clean demonstration of the signal.

Everything else — the end-to-end pipeline, the neutral-not-accusatory visual/seller handling, the language fixes (T-030), the live/fixture transparency, the quality gates — is confirmed working correctly on this real run.
