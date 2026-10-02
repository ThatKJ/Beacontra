# Beacontra Overview Design System (Authoritative Specification)

**Status:** Verified & Approved Reference Document  
**Scope:** Single source of truth for UI unification across all Beacontra OS modules.  
**Extracted From:** `public/styles.css`, `public/experience.css`, `public/index.html`, and live computed styles.

---

## 1. Visual Identity & Design Philosophy

The Beacontra visual identity is an **editorial intelligence instrument**. It avoids generic SaaS dashboard tropes (e.g. rounded bubbly cards, generic blue slate hues, loud gradient buttons) in favor of a disciplined, tactile duality:
- **Atmospheric Dark Ink** for instruments, canonical references, search scenes, and telemetry.
- **Warm Crisp Paper** for analytical workspaces, investigation results, evidence queues, and documentation.
- **Electric Signal Lime** (`#d4f58f`) for actionable prompts, real-time focal points, and live indicators.
- **Deep Botanical Moss** (`#536a4c`) for technical labeling, section numerals, and grounded measurement rules.

---

## 2. Verified Token Inventory

### 2.1 Color Palette
Source: `public/styles.css:2-14`

| Token Name | Hex / Value | Semantic Role |
|:---|:---|:---|
| `--ink` | `#10150f` | Primary dark surface, body background, dark instrument panels |
| `--ink-2` | `#171e17` | Raised dark card background, loading containers, side rails |
| `--ink-3` | `#263026` | Dark borders, hover surfaces, elevated dark interactive states |
| `--paper` | `#edf0e8` | Primary light section surface (Signals, Desk, Results) |
| `--paper-2` | `#f8f9f4` | Clean crisp paper card surface (`.scan-card`, `.ro-plate`, `.metrics`) |
| `--paper-3` | `#dfe5dc` | Subtle paper shade for secondary cards and detail sections |
| `--fog` | `#afbaae` | Muted sage foreground text and secondary indicators |
| `--moss` | `#536a4c` | Primary brand green: tech labels, numerals, focus rings, glyphs |
| `--signal` | `#d4f58f` | High-energy signal lime: primary CTAs, active states, indicators |
| `--signal-strong` | `#b9e862` | Hover state for primary CTAs, high-contrast focus rings |
| `--teal` | `#25796f` | Low risk, verified baseline, authorized seller indicator |
| `--amber` | `#a96f21` | Moderate risk, price deviation, seller caution |
| `--rust` | `#9e4934` | High risk, severe anomaly, unverified source, error states |
| `--line-dark` | `rgba(232, 239, 229, 0.16)` | Hairline grid lines and dividing rules on dark surfaces |
| `--line-light` | `rgba(16, 21, 15, 0.16)` | Hairline grid lines and dividing rules on paper surfaces |
| `--shadow-soft` | `0 22px 70px rgba(13, 21, 13, 0.12)` | Subtle elevation shadow on paper surfaces |
| `--shadow-deep` | `0 32px 90px rgba(0, 0, 0, 0.28)` | Deep dramatic elevation shadow on dark surfaces |

### 2.2 Typography
Source: `public/styles.css:9-11`

| Typeface Role | Token / CSS Font Family | Target Weights | Semantic Usage |
|:---|:---|:---|:---|
| **Editorial Display** | `--display: "Newsreader", Georgia, serif` | `420` (regular), `320` (light italic `em`) | Main titles (`h1`, `h2`), large metric figures, section headers |
| **Technical Body** | `--sans: "Inter", "Avenir Next", "Segoe UI", sans-serif` | `400` (normal), `600-760` (strong) | Body lede, narrative paragraphs, form labels, general UI |
| **Monospace / HUD** | `--mono: ui-monospace, "SFMono-Regular", Consolas, monospace` | `500-760` (uppercase) | Category tags, badges, buttons, indices, table headers, coordinates |

**Heading Specifications:**
- `.hero-title`: `font-family: var(--display); font-size: clamp(4rem, 7.3vw, 6rem); font-weight: 420; letter-spacing: -0.035em; line-height: 0.92;`
- `.section-title`: `font-family: var(--display); font-size: clamp(3rem, 5.5vw, 5.6rem); font-weight: 420; letter-spacing: -0.035em; line-height: 0.92;`
- `em` inside headings: `color: var(--signal)` (on dark) or `color: var(--moss)` (on light); `font-weight: 320; font-style: italic;`
- `.tech, .mono`: `font-family: var(--mono); font-size: 0.72rem; letter-spacing: 0.08em; line-height: 1.4; text-transform: uppercase;`

---

## 3. Component Architecture & Geometry

### 3.1 Corner Radii & Precision
- Standard components use **sharp, precise geometry**:
  - Buttons (`.cta`, `.button`): `border-radius: 3px;`
  - Cards & Panels (`.scan-card`, `.os-card`, `.loading`): `border-radius: 3px;`
  - Inputs & Selects: `border-radius: 2px;`
  - Badges & Chips: `border-radius: 2px;`
  - Rounded pills and bubbles are strictly forbidden.

### 3.2 Buttons & Interactive Controls
```css
/* Primary Action Button */
.cta-solid, .button.primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 48px;
  padding: 12px 18px;
  border: 1px solid transparent;
  border-radius: 3px;
  background: var(--signal);
  color: var(--ink);
  font-family: var(--mono);
  font-size: 0.7rem;
  font-weight: 760;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
  transition: color 160ms ease, background 160ms ease, transform 160ms var(--ease);
}
.cta-solid:hover, .button.primary:hover {
  background: var(--signal-strong);
}

/* Secondary / Ghost Button */
.cta-ghost, .button.secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 48px;
  padding: 12px 18px;
  border: 1px solid currentColor;
  border-radius: 3px;
  background: transparent;
  color: inherit;
  font-family: var(--mono);
  font-size: 0.7rem;
  font-weight: 760;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
  transition: background 160ms ease;
}
.cta-ghost:hover, .button.secondary:hover {
  background: rgba(255, 255, 255, 0.06);
}
```

### 3.3 Badges & Chips
```css
.badge {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  min-height: 24px;
  padding: 4px 8px;
  border: 1px solid #869184;
  border-radius: 2px;
  color: #566052;
  font: 0.56rem var(--mono);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.badge.teal {
  border-color: var(--teal);
  background: rgba(37, 121, 111, 0.09);
  color: #17665e;
}
.badge.amber {
  border-color: var(--amber);
  background: rgba(169, 111, 33, 0.1);
  color: #85520f;
}
.badge.rust {
  border-color: var(--rust);
  background: rgba(158, 73, 52, 0.09);
  color: #883b29;
}
```

### 3.4 Cards & Surfaces
```css
/* Light Paper Card */
.scan-card {
  position: relative;
  padding: clamp(28px, 4vw, 56px);
  border: 1px solid var(--line-light);
  border-radius: 3px;
  background: var(--paper-2);
  box-shadow: var(--shadow-soft);
}

/* Dark Intelligence Instrument Card */
.dark-card, .os-card-dark {
  position: relative;
  padding: 24px;
  border: 1px solid var(--line-dark);
  border-radius: 3px;
  background: var(--ink-2);
  box-shadow: var(--shadow-deep);
}
```

### 3.5 Form Inputs
```css
/* Light Inputs */
input, select, textarea {
  width: 100%;
  min-height: 48px;
  padding: 12px 15px;
  border: 1px solid #aeb8ac;
  border-radius: 2px;
  background: #fff;
  color: var(--ink);
  font-family: var(--sans);
  font-size: 0.88rem;
  outline: none;
  transition: border-color 160ms ease, box-shadow 160ms ease;
}
input:focus, select:focus, textarea:focus {
  border-color: var(--moss);
  box-shadow: 0 0 0 3px rgba(83, 106, 76, 0.17);
}

/* Dark Mode Form Controls */
.dark-surface input, .dark-surface select, .dark-surface textarea {
  border: 1px solid var(--line-dark);
  border-radius: 2px;
  background: var(--ink);
  color: var(--paper);
}
.dark-surface input:focus, .dark-surface select:focus {
  border-color: var(--signal);
  box-shadow: 0 0 0 3px rgba(212, 245, 143, 0.18);
}
```

---

## 4. Navigation Architecture

### 4.1 Header Bar (`.site-header`)
- Height: `72px`, sticky with `backdrop-filter: blur(16px); background: rgba(16, 21, 15, 0.88); border-bottom: 1px solid var(--line-dark);`
- Brand title: `Beacontra.` with signal dot icon and lettermark.

### 4.2 Beacontra OS Module Switcher (`.os-module-bar`)
Must inherit the exact same aesthetic:
- Background: `rgba(16, 21, 15, 0.95)` (matching `.site-header`).
- Bottom border: `1px solid var(--line-dark)`.
- Module buttons:
  - Font: `var(--mono)`, `0.7rem`, `letter-spacing: 0.08em`, uppercase.
  - Border: `1px solid transparent`, radius `3px`.
  - Inactive state: `color: var(--fog);`
  - Hover: `color: var(--paper); background: rgba(255, 255, 255, 0.04); border-color: var(--line-dark);`
  - Active: `color: var(--signal); background: var(--ink-2); border-color: var(--signal);`
  - Module Badge (e.g. M1, M3, AUTO): `background: var(--ink-3); color: var(--fog); border-radius: 2px; font-size: 0.58rem;`

---

## 5. Baseline Screenshots Reference

The following baseline screenshots were captured prior to modifications:
- Desktop (1440px): `docs/screenshots/baseline/overview_hero_desktop.png`, `overview_full_desktop.png`
- Tablet (768px): `docs/screenshots/baseline/overview_hero_tablet.png`, `overview_full_tablet.png`
- Mobile (390px): `docs/screenshots/baseline/overview_hero_mobile.png`, `overview_full_mobile.png`
- Initial Modules State: `docs/screenshots/baseline/module_before_*.png`

---

## 6. Implementation Mandate for All Modules

Every section outside `#home` must replace the legacy navy/teal slate tokens (`--os-navy-*`, `--os-teal`, rounded 10px borders) with the verified tokens and component structures detailed above:
1. **Brand Vault:** Paper-toned or dark-ink card layouts, Newsreader editorial headings, 3px radii, monospace badges.
2. **Market Radar:** Hairline metric grids (`.metric`), Newsreader numerical values, verified/anomaly signal indicators.
3. **Evidence Graph:** Controls, inspector drawer, legends styled with `--ink-2`, `--line-dark`, `--signal`, and `--mono`.
4. **Watchtower:** Timeline and snapshot comparison tables with hairline borders, `.badge.teal`/`.amber`/`.rust`, and clean typographic hierarchy.
5. **Cases Desk:** Case records, evidence lists, and report actions inheriting `.scan-card` and `.cta-solid` styling.
6. **Autopilot:** Bounded planner, gap cards, execution terminal, and replay scrubber matching the Overview's tactile technical instrument language.
7. **Chrome Extension:** `extension/sidepanel.css` refactored to consume `--ink`, `--paper`, `--signal`, `--moss`, and 3px precision geometry.
