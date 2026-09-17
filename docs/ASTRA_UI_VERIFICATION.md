# Beacontra UI verification — T-034

ASTRA · 2026-09-18

## Shipped experience
- Replaced dark gradient/CDN styling with a local paper/forest-teal design system.
- Product-focused home, public photo-link preview/replacement/removal, optional price/seller context and decimal/range validation.
- Computed listing/prioritization/source/visual-record counts; compact queue with priority and visual-evidence filters.
- Selected listing workspace with equal photo frames, independent price/source/visual observations, ranking explanation and linked Lens sources.
- Expanded native comparison dialog with keyboard focus trap, Escape and focus restoration.
- Honest workflow loading with elapsed time, no invented stage completion; readable retry/edit/return-to-results errors.
- Explicit fixture/cached/live-API-mode provenance. Missing and skipped evidence is neutral; no “Photo Match Confirmed” default or “Likely Genuine” verdict.
- Fixed the actual homepage HTTP 500 using Workers Static Assets. Search API/scoring contracts unchanged.

## Verification performed
| Check | Result |
|---|---|
| Actual local Worker `/` and `/styles.css` | HTTP 200 |
| `npm test` | 68 passed, 1 skipped |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed (existing TypeScript lint scope) |
| `node --check public/app.js` | Passed |
| `npm run build` | Passed, Wrangler dry-run; no deployment |
| `npm run test:ui` | Passed in Chromium |
| Responsive geometry | Home, queue, comparison at 375/390/430/768/1024/1440; no document horizontal overflow |
| Adversarial geometry | Same six widths with very long title and missing fields |
| axe WCAG A/AA checks | No violations in tested home, queue, dialog, error and empty states |
| Keyboard | Skip link, comparison focus containment, Escape, focus restoration |
| Provenance | Cached replay, synthetic fixtures and live-mode rendering exercised |
| Evidence truth | Raw Lens records exposed independently from reference-match interpretation; unavailable/no-evidence/skipped distinct neutral copy |
| Recovery | Rate-limit error hides raw error text; prior results retain their original reference price |
| Input | Required image, negative reference, reversed range, preview/remove and example fill |
| Defensive rendering | HTML-like titles rendered as text; javascript source links excluded; broken image fallback has no retry loop |
| Reduced motion | Indeterminate-line animation disabled |

Browser tests intercept **all** `/api/*` requests before user interaction. No new live SerpApi scans or credits were used. Tests validate frontend behavior, not current upstream availability. Chromium executable was the installed headless-shell build 1228; use `CHROMIUM_EXECUTABLE_PATH` or install the Playwright-managed browser.

The repository's older Vitest Worker pool embeds a Wrangler that cannot parse modern static-assets configuration. Unit/live test configs now declare the same runtime compatibility and KV namespace directly in Miniflare; the actual serving path is tested against the running Wrangler server. Existing toolchain warnings remain (old runtime compatibility-date fallback and deprecated `wrangler build` alias); commands still pass.

## Screenshot provenance
- `screenshots/home.png`: real UI with example product and reference price from stored scan data.
- `screenshots/review-queue.png`: unchanged result records from `FINAL_METRICS_DUMP.json`, replayed by the browser harness and explicitly labelled **CACHED LIVE RESULT**.
- `screenshots/evidence-detail.png`: same recorded evidence, expanded photo comparison.
- `screenshots/mobile-review.png`: same cached replay at 390 px.
- `screenshots/loading.png`, `screenshots/error.png`: controlled loading and rate-limit states.

The dump contains 40 listings. The UI computes its displayed values directly from records, rather than copying contradictory headline metrics from historical docs. Its observed screenshot counts are 36 prioritized, 25 named sources, 6 listings with raw Lens records. Raw records are not confirmed matches to the reference. Product variant identity and reference-MRP suitability still need human checking; the screenshot makes no authenticity claim. The application's example button leaves MRP and authorized sellers blank intentionally.

## Performance
Zero runtime UI dependencies, no Tailwind CDN or external webfont requests. Local CSS/JS, fixed photo geometry, lazy queue images, bounded queue scrolling. Playwright/axe are development-only. No production latency/Core Web Vitals claim is made from this local verification.

## Remaining limitations / handoff
1. **File upload:** the API accepts only a public image URL. No deceptive drag/drop surface was added. Backend upload contract requested in T-035.
2. **Progress:** no backend stage events; displayed stages describe the workflow while the scan runs, without claiming real-time completion.
3. **Cache origin:** backend only emits live/fixture. Live mode is explicitly qualified as potentially cached; cached-live rendering is supported when that provenance is explicitly supplied.
4. **Visual interpretation:** backend source-name heuristics and conflated failed/empty checks remain core-owner work. UI exposes actual source records and uncertainty without rewriting scoring.
5. **External photos:** availability depends on source hosts; graceful fallbacks are provided.
6. **Scope:** Chromium checked; Safari/Firefox, assistive-technology user testing, and production performance profiling not performed.

## Final judge-facing pass
The opening promise is explicit, the scan CTA is dominant, the queue explains why an item deserves review, raw source observations are separated from service interpretation, and provenance stays visible. The strongest view is the selected listing with photo comparison and three signal areas. Existing backend constraints are exposed as neutral uncertainty, not decorated into certainty.
