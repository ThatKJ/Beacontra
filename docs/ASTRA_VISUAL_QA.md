# Beacontra premium experience — visual QA

ASTRA · T-036 · 2026-09-18

## Design direction and signature components
**80% calm / 20% wow.** Dark editorial composition and light evidence desk. Expressive moments are concentrated in the hero, reference-photo treatment, scan instrument and expanded comparison. Forms, queue text and source observations stay direct and readable.

1. CSS-3D evidence instrument: stacked reference planes, Price / Source / Visual tokens, fine-pointer depth.
2. Tactile reference-input card: contained image, connected state, focus lift, replace/remove.
3. Scan instrument: actual reference image, abstract orbital paths, indeterminate sweep, real elapsed time.
4. Investigation queue: selected-state treatment, real counts, calm progressive disclosure.
5. Comparison stage: equal image planes, subtle image depth, native expandable dialog.
6. Provenance rail: explicit mode in results **and inside the comparison dialog**.

## Visual passes performed
| Pass | Evidence / refinement |
|---|---|
| Structure | Hero now has its own authored composition; scan input one CTA away. |
| Visual system | Editorial serif/sans pairing; ink-dark stage and paper evidence desk; restrained token translucency. |
| Motion / 3D | CSS transforms only; one-time reveal, pointer depth, scan sweep. Removed surface-opacity transitions that briefly reduced text contrast. |
| Mobile | All six widths checked; mobile stage static; shortened workflow labels after screenshot exposed awkward word wrapping. |
| States / copy | No invented metrics, fake progress percentages or authenticity verdicts; actual reference used only when current URL matches loaded preview. |
| Demo | Example → reference preview → scan → selected top result → expanded photos. Source mode remains visible when paused in the dialog. |
| Final QA | Screenshots regenerated after fixes; browser regression/accessibility suite and required build/test gates pass. |

## Desktop and mobile checks
- [x] Home / result queue / comparison: **375, 390, 430, 768, 1024, 1440 px**; no document horizontal overflow.
- [x] Very long title and absent price/seller/image at all six widths.
- [x] Actual rendered hero, populated reference input, scan, queue, dialog and error screenshots inspected.
- [x] Mobile/tablet home screenshots inspected; mobile field and workflow spacing refined.
- [x] Images preserve aspect ratio and use real source images; no fake difference heatmap.

## Motion and 3D checks
- [x] Fine-pointer hero depth reacts; requestAnimationFrame coalesces updates.
- [x] Reduced-motion change clears transforms; hero CTA focuses input immediately.
- [x] Coarse-pointer/mobile fallbacks remove interactive tilt; mobile scan sweep disabled.
- [x] No continuous JavaScript rendering loop, WebGL context, 3D textures, physics engine or animation package.
- [x] Native controls remain usable during transitions; no scroll-jacking.
- [x] Enhancement-script failure tested: core example input still works.

## Accessibility checks
- [x] axe WCAG A/AA checks: no violations in tested desktop home, **mobile home**, loading, review queue, modal, error and empty states.
- [x] Keyboard skip link, associated labels, focus states, modal Tab containment, Escape and focus restoration.
- [x] Decorative scene hidden from assistive technology; plain-text product explanation and evidence available independently.
- [x] Color never acts as the sole priority/provenance indicator.

## Performance measurements
Reproducible command: `npm run test:ui:performance`, with a running local Worker. Raw output: [`screenshots/performance.json`](screenshots/performance.json).

These are **local Chromium lab measurements**, not production field Core Web Vitals or a guaranteed rendered-frame rate. No network throttling; mobile uses touch emulation and 4× CPU slowdown. Chrome DevTools MCP was unavailable; Playwright + browser PerformanceObserver/CDP provided the measurements instead.

| Measurement | Desktop 1440 | Mobile 390, 4× CPU |
|---|---:|---:|
| Observed initial LCP | 60 ms | 100 ms |
| First contentful paint | 60 ms | 100 ms |
| Observed non-input layout-shift sum | 0 | 0 |
| Long tasks during sampled window | 0 | 0 |
| requestAnimationFrame interval, p95 | 8.8 ms | 10.2 ms |
| Sampled frame intervals over 32 ms | 0 / 241 | 0 / 240 |

- All initial HTML/CSS/JS: **102,839 bytes raw; 25,995 bytes gzip (~25.4 KiB)**, excluding user-requested external photos.
- New experience CSS + JS: **8,479 bytes gzip (~8.3 KiB)**.
- Initial page requests only local assets. No remote fonts, external illustration downloads or blocking third-party scripts.
- Measurements cover initial rendering and a two-second frame-cadence sample. They do not establish production INP, GPU presentation FPS or live-scan latency.

## Demo and truth checks
- [x] Hero explicitly says “Workflow illustration”; tokens contain concepts, not invented search results.
- [x] Scan visualization runs only while the actual request is pending. Workflow labels are not fake completed stages.
- [x] Screenshot review data replays the unchanged saved response with **CACHED LIVE RESULT**.
- [x] Empty/failed/skipped visual checks remain neutral. Raw Lens records are separate from reference-match interpretation.
- [x] Core scoring, SerpApi request logic and API contracts unchanged in T-036.
- [x] Zero live SerpApi credits spent on browser QA.

## Screenshot-ready states
| View | File |
|---|---|
| Hero, before input | `screenshots/hero.png` |
| Full home with actual reference preview | `screenshots/home.png` |
| Reference input | `screenshots/reference-input.png` |
| Scan | `screenshots/loading.png` |
| Review workspace | `screenshots/review-queue.png` |
| Evidence detail | `screenshots/evidence-detail.png` |
| Mobile home / review | `screenshots/mobile-home.png`, `screenshots/mobile-review.png` |
| Tablet | `screenshots/tablet-home.png` |
| Recovery state | `screenshots/error.png` |

## Test and build results
- `npm test`: **68 passed, 1 skipped**.
- `npm run typecheck`: **passed**.
- `npm run lint`: **passed** (repository's TypeScript scope).
- `npm run build`: **passed** (Wrangler dry-run; not deployed).
- `npm run test:ui`: **passed**.
- `npm run test:ui:performance`: **passed** including depth, reduced-motion, CTA and enhancement-failure assertions.
- JavaScript syntax and `git diff --check`: **passed**.

## Remaining limitations
- Photo input is still **public URL**, not browser-file upload; T-035 requests a real upload contract. No nonfunctional dropzone is presented.
- Backend lacks actual progress events and fresh-vs-cached metadata; UI honestly qualifies both.
- Backend reference-match heuristics and failed-vs-empty ambiguity remain core-owner work; raw record presentation does not fix those semantics.
- External image availability and sample product/variant identity require checking before the final live presentation.
- Safari/Firefox, real low-end mobile GPU testing and production field performance were not tested. Existing old-Wrangler/build-alias warnings remain.
