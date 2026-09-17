# Beacontra design system

ASTRA · T-034 · 2026-09-18

- **Concept:** an evidence desk. Warm paper, ink typography, a precise teal focus accent. A small concentric signal mark, never a decorative lighthouse.
- **Type:** system sans (no blocking font requests); 44/48 hero, 28/34 page title, 20/28 section, 16/24 body, 14/20 supporting, 12/18 metadata. Tabular numerals for prices, counts, ranking. Avoid uppercase body copy.
- **Spacing:** 4, 8, 12, 16, 24, 32, 48, 64 px. Max content width 1240 px. Mobile gutters 16 px.
- **Surfaces:** paper `#f6f7f5`, white panels, subtle `#eef2ef` inset; ink `#172c29`, secondary `#52645f`. Borders `#d8e1dc`; no glass or ambient glow.
- **Radius:** 6 px badges, 8 px inputs/buttons, 12 px panels, 16 px hero form/dialog. Shadows limited to hover and dialog elevation.
- **Buttons:** solid teal primary; bordered secondary; text tertiary. Minimum 44 px hit areas. Visible 3 px focus ring. Disabled means unavailable action, not low contrast text alone.
- **Forms:** persistent associated labels, concise hints, native validation plus cross-field checks; white image frame preserving aspect ratio. Optional context in disclosure.
- **Evidence:** price = amber only when a computed price signal exists; seller unknown = neutral; visual returned records = teal informational, not confirmed authenticity. Three separate observation blocks with contextual interpretation beneath.
- **Priority:** high = muted rust; medium = amber; monitor/low = neutral. Always text plus color. Score is a ranking heuristic, never a percentage/gauge.
- **Provenance:** fixture = amber with explicit synthetic-data wording; SerpApi result = teal with caching caveat; cached-live label only on explicitly known replay/cache data. Unknown provenance = neutral.
- **Icons:** simple inline stroke SVG, decorative icons hidden from assistive technology; no emoji dependency.
- **Motion:** 120–180 ms color/focus changes; quiet indeterminate scan line; no fake percentage or timed stage completion. Respect `prefers-reduced-motion`. No hover-induced layout shifts.
- **Responsive:** queue and evidence pane at desktop; stacked on mobile; native modal for expanded comparison with Escape, focus trapping and return focus.
