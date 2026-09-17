# Architecture: BrandLens

**Status:** Documents the as-built system (implementation led by OPENCODE, T-005/T-006/T-015). Product rationale: `docs/DECISION.md`. Scope: `docs/PRODUCT_SPEC.md`.

---

## System diagram

```
Browser (frontend, TBD by T-008 demo work)
        │  POST /api/brandlens/scan  { productName, officialImageUrl, mrp?, ... }
        ▼
Cloudflare Worker (Hono app, src/index.ts)
        │
        ▼
BrandLensService.scan()  (src/lib/brandlens.ts)
        │
        ├─▶ SerpApiClient.search(google_shopping)  ──▶ [cache: KV + in-memory] ──▶ SerpApi
        │        │
        │        ▼
        │   extractCandidates()  →  ListingCandidate[]
        │
        └─▶ for each candidate:
                ├─▶ SerpApiClient.search(google_lens, image_url=candidate.thumbnail) ──▶ [cache] ──▶ SerpApi
                ├─▶ analyzePrice()    (deterministic, no API call)
                ├─▶ analyzeSeller()   (deterministic, no API call)
                ├─▶ analyzeVisual()   (deterministic, reads Lens response)
                └─▶ fuseSignals()     (deterministic scoring → FusedResult)
        │
        ▼
results.sort(by compositeScore desc)  →  BrandLensScanResult  →  JSON response
```

## Components

- **`src/index.ts`** — Hono app, CORS, `/health`, `/api/search` (generic passthrough, pre-existing), `/api/engines`, and the BrandLens-specific endpoints (`POST /api/brandlens/scan`, `GET /api/brandlens/results/:scanId` — per T-006).
- **`src/lib/serpapi-client.ts`** — generic SerpApi HTTP client: request dedup (in-flight promise cache), response caching (KV + in-memory), retry/backoff, fixture mode, credit tracking. Engine-agnostic — used by both the generic `/api/search` route and `BrandLensService`.
- **`src/lib/cache.ts`** — tiered cache (KV for cross-request persistence, in-memory `Map` for hot/duplicate requests within a single Worker invocation).
- **`src/lib/types.ts`** — Zod schemas per engine (`BaseSearchParams`, `ShoppingResult`, `LensSearchParams`/`LensSearchResult`, `AmazonProductSearchParams`, etc.) — defensive parsing at the SerpApi response boundary, per the mission's "don't send raw results to an LLM blindly" requirement (there is no LLM in this pipeline at all — see below).
- **`src/lib/fixtures/`** — one JSON fixture per engine used, enabling zero-live-credit unit tests and local dev without `SERPAPI_API_KEY`.
- **`src/lib/brandlens.ts`** — `BrandLensService`, the actual product logic:
  - `searchMarketplaceListings()` — one `google_shopping` call per scan.
  - `extractCandidates()` — deterministic filtering/normalization of shopping results into `ListingCandidate[]`.
  - `runVisualVerification()` — one `google_lens` call per candidate listing (the credit-heavy step — see `docs/SERPAPI_BUDGET.md`).
  - `analyzePrice()` / `analyzeSeller()` / `analyzeVisual()` — three independent, deterministic signal extractors (explicitly **not** LLM calls — per the mission's AI rule, this is exactly the kind of filtering/ranking/comparison logic that should be deterministic code, not a model call).
  - `fuseSignals()` — deterministic weighted scoring (price 5-35, seller 15-25, visual 10-40 depending on confidence) into one `compositeScore` (0-100) → `confidence` band → `recommendation` (`review_urgently`/`review`/`monitor`/`likely_genuine`).

## Request flow (happy path)

1. Client submits product name + official image URL (+ optional MRP/price range/authorized-seller list).
2. One `google_shopping` call retrieves live marketplace listings.
3. For each listing with a valid price, one `google_lens` call reverse-image-checks its thumbnail against the official photo.
4. Three deterministic analyzers turn (price, seller name, Lens response) into three independent signals.
5. `fuseSignals()` combines them into one ranked, evidence-attached result per listing.
6. Results are sorted by composite score and returned with the full evidence trail (not a bare verdict) — satisfying `docs/DECISION.md`'s "evidence for review, not accusation" requirement structurally, not just in copy.

## Where there is no LLM

Deliberately: this pipeline has zero LLM calls in the core scoring path. Every signal (price anomaly, seller-name heuristic, Lens-match interpretation, weighted fusion) is deterministic code. This is intentional per the mission's AI rule ("prefer deterministic code for filtering, ranking, comparison; use LLMs only where semantic reasoning is actually useful") and directly defends against the "AI wrapper" / "dashboard trap" criticism raised in `docs/DECISION_CHALLENGES.md` — there is no LLM to blame or credit for the result; it's auditable, deterministic logic. If a future iteration adds an LLM (e.g., to write a human-readable summary of the evidence, or to do fuzzier product-title/variant matching than simple string heuristics), that should be scoped narrowly to that one task, not folded into the scoring itself.

## Data flow / provenance

Every `FusedResult` carries its `listing` (with `productLink`, `source`, `thumbnail`), `lensEvidence` (raw match sources), `priceSignal`/`sellerSignal`/`visualSignal` (each with a human-readable `details` string), so the UI (T-008) can show *why* a result scored the way it did, not just the score — this is the "source provenance" requirement from the mission, already structurally present in the data model, not something the frontend needs to reconstruct.

## Caching strategy

- SerpApi's own server-side cache (1hr default) is free on hit — already handled transparently by `serpapi-client.ts`.
- KV + in-memory tiered cache adds a second layer keyed on `engine + normalized params` (existing generic infra from T-015).
- **BrandLens-specific consideration:** `google_lens` calls are keyed per listing thumbnail URL, which is mostly stable per listing but not deduplicated across different scans of the *same* listing yet — worth adding if the demo re-runs the same scan repeatedly (see `docs/SERPAPI_BUDGET.md`).

## Failure handling

- `SerpApiClient` throws a typed `SerpApiError` (rate-limited flag, status code) — surfaced as a proper HTTP error by `src/index.ts`, not swallowed.
- `runVisualVerification()` specifically catches and returns `emptyLensEvidence()` on failure rather than failing the whole scan — one candidate's Lens call failing degrades that listing's visual signal to "none," it doesn't break the batch. This matters because a scan can trigger many Lens calls (one per listing) and a single transient failure shouldn't kill the whole result set.

## Security model

- `SERPAPI_KEY` is a Worker secret (`env.SERPAPI_KEY`), never sent to the client, never committed (`.env`/`.dev.vars` gitignored, `.env.example` has names only).
- No auth layer for the hackathon demo (public, per `docs/ENGINEERING_AUDIT.md`'s explicit decision) — acceptable for a demo-scoped submission, flagged as a non-goal in `docs/PRODUCT_SPEC.md`, not a real gap for this scope.

## Testing strategy

- Unit tests run entirely against fixtures (`src/lib/fixtures/*.json`, `tests/fixtures/*.json`) — zero live SerpApi credits, per `docs/ENGINEERING_AUDIT.md`'s credit-discipline requirement.
- `npm run test:live` (separate Vitest config) is the only path that spends real credits — intentionally gated, not run in the default `npm test`/CI path.
- T-007 (pending) should add a BrandLens-specific fixture-based test asserting the fusion math itself (e.g., a listing with matching price + authorized seller + Lens exact-match should score low/`likely_genuine`; a listing with below-MRP price + unauthorized seller + Lens mismatch should score high/`review_urgently`) — this is the test that actually verifies the "real fused logic, not a dashboard" claim in `docs/DECISION_CHALLENGES.md`.

## Open item carried from DECISION_CHALLENGES.md

T-017 (google_lens empirical spike against cropped/watermarked/different images) is unresolved as of this writing — this document's confidence-weighting description (visual signal 10-40 points depending on Lens-reported confidence) may need adjustment once that spike's real-world results are in.
