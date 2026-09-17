# SerpApi Credit Budget: Beacontra

**Free plan reference (verified directly against serpapi.com/pricing, `docs/RESEARCH.md` §1):** 250 searches/month, 50/hr throughput, cached/errored/failed searches don't count.

---

## Per-engine call accounting — UPDATED this session to match the corrected Lens implementation

**Superseded:** the "1 Lens call per candidate, uncapped" model below was accurate for an earlier version of `brandlens.ts`. The cap (`MAX_LENS_CALLS = 10`, price-anomaly-first ordering) was implemented per the original recommendation here, **and** the Lens call strategy itself changed (T-017/T-029): for each capped candidate, the code now attempts an image upload (`POST /image` → `image_id`), then calls `google_lens` with `type=exact_matches`; **if that returns no exact matches, it makes a second `google_lens` call** with `type=products` and the plain `url` as a fallback. This means the realistic per-listing cost is **1-2 Lens search calls**, not a flat 1.

| Call | Engine | Frequency per scan | Notes |
|---|---|---|---|
| Marketplace search | `google_shopping` | **1** | One call regardless of result count. |
| Image upload | `POST serpapi.com/image` | up to `MAX_LENS_CALLS` (10) | Not a `search` engine call — per SerpApi's own docs this is a separate upload endpoint; whether it consumes a billable "search" is unconfirmed (flagged, not assumed either way). |
| Visual verification (primary) | `google_lens`, `type=exact_matches` | up to 10 (capped, price-anomaly-first) | One call per capped candidate, using the uploaded `image_id`. |
| Visual verification (fallback) | `google_lens`, `type=products` | 0-10 (only fires when the exact_matches call above returns zero matches) | Second call for that same candidate, using `url` instead of `image_id`. |

**Credit-multiplier caveat, stated plainly per the "do not invent numbers" instruction:** the `1`/`3`-credits-per-call figures used elsewhere in this document and in `docs/DEMO_DATA.md` come from `SerpApiClient.estimateCredits()` — **our own app-level heuristic** (`isAdvanced ? 3 : 1`, based on an internal `ADVANCED_ENGINES` set), not a confirmed SerpApi billing multiplier. `docs/SERPAPI_CAPABILITIES.md` flagged this exact question as unverified from the start of the project and it has not been independently confirmed against SerpApi's actual dashboard/invoice. Treat every credit figure in this document as an estimate from our own code, not a verified bill — check the SerpApi dashboard directly for real usage if submission-day precision matters.

## Worst-case call count (search calls, not credits)

With the cap in place: **1 (shopping) + up to 20 (10 candidates × up to 2 Lens calls each) = up to 21 search calls per scan**, down from the original uncapped worst case of 16-41. Typical case (most candidates find an exact match on the first Lens call, no fallback needed): closer to **1 + 10-15 = 11-16 calls**.

## Budget estimate

| Phase | Estimated search calls | Basis |
|---|---|---|
| **Development** | **0 live calls** | Fixture-mode covers all three engines; `npm test` runs entirely against fixtures. |
| **One live integration test run** | ~11-21 calls | One real scan against a real/demo product, capped per above. Run intentionally via `npm run serpapi:smoke`/`test:live`, not in default CI. |
| **Demo (single rehearsed run)** | ~11-21 calls | Cached on repeat runs within the 1hr SerpApi cache window — re-running the *same* demo query during rehearsal costs 0 additional calls. |
| **Full demo day (a few rehearsals + the live take)** | ~20-50 calls | A handful of rehearsal runs plus the actual recorded/live take; still well within the 250/month free allocation if rehearsals reuse the same product/query to hit the cache. |

**Recommended before submission (not yet done):** run one real scan of the actual chosen demo product (`docs/DEMO_DATA.md` — boAt Airdopes 141) and record the *actual* logged call count and `creditsUsed` value from that run here, replacing the estimate above with an observed number, per the instruction not to estimate from memory when a real log is available.

## Caching policy

- SerpApi's own 1hr server-side cache is free on hit and already used by `serpapi-client.ts` — rehearsing the same demo query repeatedly inside an hour costs nothing extra.
- The generic KV+in-memory tier (T-015) applies automatically to both `google_shopping` and `google_lens` calls made through `SerpApiClient`, with no Beacontra-specific change needed.
- **Not yet implemented, worth adding before demo day:** de-duplicating Lens calls for the *same* listing thumbnail URL across separate scans (e.g., if the demo script runs the same product scan twice for rehearsal, currently each run still issues its own Lens calls per candidate — though SerpApi's own cache should catch this at the HTTP level as long as the thumbnail URL and Lens params are identical).

## Failure behavior / credit safety

- `SerpApiClient` fixture mode fully replaces live calls when `ENVIRONMENT === 'development' && !SERPAPI_KEY` (from `src/index.ts`) — a developer without a key literally cannot spend credits by accident.
- `npm run test:live` is a separate, explicitly-named script (T-015) — not part of the default `npm test`, preventing accidental credit burn in CI or on every local test run.
- **Action item for OPENCODE (non-blocking):** add a simple per-scan call cap (see recommendation above) as an actual code change, not just a documented intention — this is the one place a demo-day bug (e.g., a popular product query returning 40+ shopping results) could burn a meaningful fraction of the monthly free allocation in a single accidental run.
