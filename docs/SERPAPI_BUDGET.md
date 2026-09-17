# SerpApi Credit Budget: BrandLens

**Free plan reference (verified directly against serpapi.com/pricing, `docs/RESEARCH.md` §1):** 250 searches/month, 50/hr throughput, cached/errored/failed searches don't count.

---

## Per-engine call accounting (as implemented in `src/lib/brandlens.ts`)

| Call | Engine | Frequency per scan | Notes |
|---|---|---|---|
| Marketplace search | `google_shopping` | **1** | One call regardless of result count. |
| Visual verification | `google_lens` | **1 per candidate listing** | This is the cost driver — `BrandLensService.scan()` currently loops over *every* extracted candidate with a valid price and calls Lens for each. |

## The actual cost question: how many candidates does one `google_shopping` call return?

`extractCandidates()` filters shopping results down to those with `extracted_price > 0`, but does not currently cap the count. A typical `google_shopping` response returns on the order of **~15-40 organic shopping results per query** (varies by query specificity and marketplace coverage). At that rate, **one BrandLens scan could cost 16-41 total calls** (1 shopping + 15-40 Lens) — against a 250/month free-tier budget, that's roughly **6-15 full scans per month** before hitting the limit, and well above the mission's own target of "≤5 calls per demo flow, ideally 2-3" (`docs/ENGINEERING_AUDIT.md`).

**Recommendation (flagging for OPENCODE, not blocking T-006, but should land before demo rehearsal):** cap the number of candidates that get a Lens call — e.g., take the top 8-10 candidates by price-anomaly-first ordering (cheapest/most-suspicious first, since those are the ones worth spending a Lens call on) rather than every single result. This turns a worst-case 41-call scan into a worst-case ~11-call scan, and is a better product decision anyway — a brand owner cares most about the most-suspicious listings, not an exhaustive Lens check of every legitimate-looking one.

## Budget estimate

| Phase | Estimated calls | Basis |
|---|---|---|
| **Development** | **0 live calls** | Fixture-mode (`src/lib/fixtures/*.json`) covers `google_shopping`, `google_lens`, `amazon_product` already created per T-006; `npm test` runs entirely against fixtures. |
| **One live integration test run** | ~2-11 calls | One real scan against a real/demo product, capped per the recommendation above. Should be run intentionally via `npm run test:live`, not in default CI. |
| **Demo (single rehearsed run)** | ~9-11 calls (with the cap) | 1 shopping + up to 10 Lens calls, capped as above. Cached on repeat runs within the 1hr SerpApi cache window — re-running the *same* demo query during rehearsal costs 0 additional credits. |
| **Full demo day (a few rehearsals + the live take)** | ~20-40 calls | A handful of rehearsal runs plus the actual recorded/live take; well within the 250/month free allocation if the cap above is implemented, and if rehearsals reuse the same product/query to hit the cache. |

## Caching policy

- SerpApi's own 1hr server-side cache is free on hit and already used by `serpapi-client.ts` — rehearsing the same demo query repeatedly inside an hour costs nothing extra.
- The generic KV+in-memory tier (T-015) applies automatically to both `google_shopping` and `google_lens` calls made through `SerpApiClient`, with no BrandLens-specific change needed.
- **Not yet implemented, worth adding before demo day:** de-duplicating Lens calls for the *same* listing thumbnail URL across separate scans (e.g., if the demo script runs the same product scan twice for rehearsal, currently each run still issues its own Lens calls per candidate — though SerpApi's own cache should catch this at the HTTP level as long as the thumbnail URL and Lens params are identical).

## Failure behavior / credit safety

- `SerpApiClient` fixture mode fully replaces live calls when `ENVIRONMENT === 'development' && !SERPAPI_KEY` (from `src/index.ts`) — a developer without a key literally cannot spend credits by accident.
- `npm run test:live` is a separate, explicitly-named script (T-015) — not part of the default `npm test`, preventing accidental credit burn in CI or on every local test run.
- **Action item for OPENCODE (non-blocking):** add a simple per-scan call cap (see recommendation above) as an actual code change, not just a documented intention — this is the one place a demo-day bug (e.g., a popular product query returning 40+ shopping results) could burn a meaningful fraction of the monthly free allocation in a single accidental run.
