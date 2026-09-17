# Astra UI audit

2026-09-18 · ASTRA — Product experience / UI owner · T-034

## Current strengths
- Small vanilla frontend, a real ranked scan contract, raw Lens evidence and listing links available.
- Deterministic scoring, fixture flag, candidate limit and optional price/seller context already exist.
- Side-by-side framing is present, but needs a focused workspace.

## Current weaknesses / top three
1. **P0:** Running Worker homepage returns HTTP 500. `src/index.ts` fetches a module-relative file URL rather than bundling/serving HTML.
2. **P0:** Every non-anomalous visual state becomes “Photo Match Confirmed”; missing evidence becomes green “Normal.” This contradicts the data.
3. **P1:** Repeated full-size cards hide hierarchy. No focused detail view, clickable listing provenance, preview, or useful loading narrative.

## P0 UX issues
- Unknown/missing evidence must be neutral; low score must not become an authenticity verdict.
- Source-name heuristics are not image similarity. Raw Lens matches may exist even when backend says `no_evidence`; expose returned records separately from interpretation.
- `dataSource` only distinguishes live/fixture; backend cache hits cannot honestly be labelled newly retrieved live data.

## P1 UX issues
- URL-only input has no preview/error feedback; labels are unassociated; prices accept negative and partial ranges.
- Input remains dominant after results. Errors replace results without clearing stale metadata.
- No zero-results state, partial-coverage summary, keyboard detail navigation, or score explanation.
- Root serving must work under the actual local Worker, not just opening an HTML file.

## P2 polish
- Replace CDN runtime Tailwind, webfont dependency, glass/gradient surfaces and emojis with a lightweight local system.
- Consistent contained image frames, no retry-loop fallback; reduced motion and visible focus.
- Capture home, queue, and detailed comparison with explicit data provenance.

## Demo risks
- Current API is one long blocking response: stage completion cannot be measured. Show an indeterminate running state with workflow explanation, not simulated progress.
- No browser-file upload endpoint. Keep public photo URL functional; backend upload work belongs to OpenCode (T-035).
- Product variant/MRP consistency remains under T-033; sample inputs must not invent authorized sellers or reference pricing.
- Existing live validation documents contradict one another; do not use their headline counts for UI metrics.

## Screenshot risks
- A screenshot must not turn fixtures into live evidence or blank fallback frames into real product photos.
- Unknown/unchecked image evidence currently reads green; long title truncation hides product variants.
- External image hosts can fail: reserve geometry and show a readable fallback.

## Reference patterns
- [Stripe Radar review documentation](https://docs.stripe.com/radar/reviews): compact queue → contextual detail → source facts. Borrow the investigation hierarchy, not fraud verdicts or calibrated probabilities.
- [Linear features](https://linear.app/features): restrained density, typographic hierarchy and focus on the current work item. No copied identity/assets.

## Verification plan
Actual Chromium rendering; 375/390/430/768/1024/1440 px; keyboard/modal focus; fixture and recorded-live rendering explicitly labelled; adversarial missing/error states; axe checks; required unit/type/lint/build gates. No new live SerpApi calls needed for frontend verification.
