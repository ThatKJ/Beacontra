# Beacontra Design System V2

**Status:** Implemented in T-039 · 2026-09-28  
**Architecture:** semantic HTML, consolidated local CSS, vanilla JavaScript, CSS 3D/SVG, no frontend runtime dependency

## Experience direction

Beacontra is a **reference dossier**, not a generic AI dashboard. The experience changes material as the user moves through the work:

1. **Evidence field** — a dark cinematic first viewport shows the reference product at the center while price, source, and visual traces converge around it.
2. **Editorial explanation** — cool paper surfaces explain the independent evidence dimensions and the full `REFERENCE → SEARCH → VERIFY → FUSE → PRIORITIZE → REVIEW` chain.
3. **Investigation desk** — a bright, photo-led case form makes the official product image the main input instead of treating every field equally.
4. **Scan chamber** — a dark indeterminate instrument keeps the real reference image visible and explains the workflow without inventing stage completion or percentages.
5. **Analyst workspace** — a cool-paper review queue, dark reference rail, selected listing detail, equal image comparison, and evidence blocks support human review.

The expressive budget is concentrated in the hero convergence scene. Forms, queue rows, evidence copy, and controls remain calm.

## Tokens

| Token | Value | Use |
|---|---:|---|
| `--ink` | `#10150F` | Main dark foundation, provenance/reference rails |
| `--ink-2` | `#171E17` | Elevated dark surfaces and scan chamber |
| `--ink-3` | `#263026` | Strong copy and labels on light surfaces |
| `--paper` | `#EDF0E8` | Main light investigation/workspace foundation |
| `--paper-2` | `#F8F9F4` | Forms, metrics, evidence blocks |
| `--paper-3` | `#DFE5DC` | Secondary editorial passages |
| `--fog` | `#AFBAAE` | Quiet supporting text on dark surfaces |
| `--moss` | `#536A4C` | Light-surface signal, links, selected context |
| `--signal` | `#D4F58F` | Primary dark-surface accent and CTA |
| `--signal-strong` | `#B9E862` | Hover/focus emphasis |
| `--teal` | `#25796F` | Live/cached SerpApi provenance and returned records |
| `--amber` | `#A96F21` | Fixture/demo and price-review context |
| `--rust` | `#9E4934` | High-priority/error state |
| `--line-dark` | `rgba(232,239,229,.16)` | Hairline structure on ink surfaces |
| `--line-light` | `rgba(16,21,15,.16)` | Hairline structure on paper surfaces |
| `--shadow-soft` | `0 22px 70px rgba(13,21,13,.12)` | Raised case forms and recovery panels |
| `--shadow-deep` | `0 32px 90px rgba(0,0,0,.28)` | Dark floating objects and compact navigation |
| `--sans` | `Inter, Avenir Next, Segoe UI, sans-serif` | Body and interface copy |
| `--display` | `Newsreader, Georgia, serif` | Editorial display and evidence values |
| `--mono` | `ui-monospace, SFMono-Regular, Consolas, monospace` | Technical labels and measurements |
| `--ease` | `cubic-bezier(.22,1,.36,1)` | Entrances, depth, and tactile movement |
| `--wrap` | `min(1380px, 100vw - 64px)` | Default desktop content measure |

Accent color is deliberately sparse. Unknown, missing, failed, and unchecked evidence is neutral—not green.

## Typography

- **Display:** Newsreader, 420/320 weights, used for editorial headlines, selected listing titles, and score presentation.
- **Body/interface:** Inter with Avenir Next/Segoe UI fallback.
- **Measurement/data:** the platform UI monospace stack for indices, price deltas, evidence labels, and provenance only.
- Display sizes use `clamp()` and peak at `6rem`; body copy stays near 65–75 characters where practical.
- Small labels must still meet WCAG contrast; ancestor opacity is never used to dim text groups.

## Spacing and layout

- Main desktop width: `min(1380px, 100vw - 64px)`.
- Desktop landing rhythm: 88–150px section spacing.
- The hero and explanation use asymmetric editorial grids.
- The input uses a wide case form plus a narrow dark evidence-source rail.
- Results use a sticky reference rail plus a flexible queue/detail stream at desktop, then stack at ≤900px.
- At ≤720px the horizontal evidence pipeline becomes a vertical sequence, avoiding horizontal overflow and creating a keyboard-safe mobile reading path.

### Responsive bands

- **≤1180px:** tighten the editorial grids and hide nonessential header metadata; keep the core navigation visible.
- **≤900px:** collapse navigation behind the 44px menu control; stack the hero, reference story, investigation desk, and workspace; convert the sticky reference rail into an inline summary.
- **≤720px:** make primary actions full width, switch the evidence pipeline and scan stages to vertical reading order, stack comparisons and evidence blocks, and keep the queue optimized for touch.
- **≤430px:** reduce decorative annotations and low-priority queue chips before reducing primary evidence or action labels.

## Material, shape, and depth

- The system is editorial and rectilinear: controls, badges, dialog, and fields use 2–3px corners. Circles are reserved for status points, counts, the brand mark, and instrument geometry.
- Hairline rules, alternating ink/paper fields, and measured whitespace establish most hierarchy. Shadows are selective, not a default card treatment.
- Use `--shadow-soft` for paper objects that lift from the desk and `--shadow-deep` for dark floating objects or modal/navigation separation.
- White image wells isolate product photography from the paper field and always use `object-fit: contain`; never crop evidence imagery for decorative effect.
- Selected queue rows use a moss inset rule plus a white surface. Do not rely on background color alone to communicate selection.

## Components and states

### Controls and compact labels

- Primary controls use the signal fill on ink text, a 3px radius, a minimum 48px height, and uppercase mono labels. Hover moves to `--signal-strong`; focus uses a visible 3px outline.
- Secondary controls stay transparent with a current-color border. Text actions use an underlined 44px-minimum target rather than a filled tertiary button.
- Badges and queue chips are evidence labels, not decoration: 2px corners, compact mono type, restrained tint, and a text label for every color state.
- Dark-surface focus rings use `--signal-strong`; light-surface focus rings use the darker moss-derived outline so both remain visible against their field.

### Reference image input

- Empty: neutral contained image well with explicit “genuine product photo” language.
- Ready: image well and case border move to moss; preview continuity propagates into the hero and scan chamber.
- URL/file: both remain visible. File uploads are restricted to PNG/JPEG/WebP and 8MB in both client UX and the server contract.
- Invalid/broken: rust border and direct recovery copy; no generic error toast.
- Disabled/running: fieldset dims and retains its layout while cursor changes to progress.

### Review Priority

- Rendered as an editorial score rail, not a circular gauge or probability.
- Copy always calls it a deterministic ranking heuristic.
- Explanations expose price deviation, seller-name context, visual-source context, or the absence of elevated signals.
- Priority is represented with text plus restrained color: high/rust, review/amber, monitor/neutral.

### Provenance

| State | Label | Meaning |
|---|---|---|
| Live | `SERPAPI RESULT · Live API mode` | At least one response was retrieved live; individual responses may still be cached upstream. |
| Cache | `CACHED LIVE RESULT` | Previously retrieved evidence; not a new live search. |
| Fixture | `FIXTURE MODE · Sample data` | Synthetic fixtures, never current marketplace evidence. |
| Unknown | `PROVENANCE UNAVAILABLE` | Neutral; origin was not identified. |

Provenance appears above results and inside the comparison dialog.

### Visual evidence

| State | Treatment |
|---|---|
| Records returned | Teal evidence badge; linked records remain separate from the service interpretation. |
| No source records | Neutral; explicitly says absence of evidence is not an image mismatch. |
| Unavailable | Neutral; request failure is distinguished from an empty successful search. |
| Not checked | Neutral; explains the bounded ten-listing visual-check limit. |

## Motion

- Control feedback: 160–180ms.
- Section reveal: 520ms, once, via one `IntersectionObserver`.
- Hero composition: 620–820ms.
- Pointer depth: bounded to ±3°/4°, one pending animation frame, fine pointers only.
- Scan sweep and moving rule are indeterminate explanations, not telemetry.
- `prefers-reduced-motion: reduce` disables depth, scan animation, magnetic movement, boot sequence, and reveal transitions while preserving all content and actions.

## Accessibility

- Semantic headings, form labels, fieldset, native details/dialog, and logical source links.
- Visible high-contrast focus ring; skip link works from the first Tab.
- Dialog traps Tab, closes on Escape, and restores focus.
- State never depends on color alone.
- Photo frames have useful alt text or readable fallbacks.
- Axe WCAG A/AA/2.1 AA passes for desktop home, mobile home, loading, results, dialog, error, and empty states.
- No document horizontal overflow at 375, 390, 430, 768, 1024, or 1440px.

## Performance and resilience

- No React, Three.js, WebGL, GSAP, Lenis, CSS framework, or new dependency.
- Local application assets: 141,972 bytes raw / 35,777 bytes gzip in the 2026-09-28 lab run, excluding remote product imagery and font response bodies.
- Local observed FCP/LCP: 392ms desktop and 488ms mobile at 4× CPU; no sampled animation frame exceeded 32ms.
- Observed layout-shift sum: 0.0119 desktop, 0.0593 mobile. One 59ms desktop and one 119ms mobile long task were observed in the two-second local samples.
- `experience.js` is progressive enhancement: example input and the full scan form continue to work when it is blocked.
- Screenshot and browser QA intercept every `/api/` request; no live SerpApi credits are consumed.

These figures are local Chromium lab observations, not production field guarantees.
