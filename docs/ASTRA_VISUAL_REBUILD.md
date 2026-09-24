# Beacontra visual rebuild — T-036

## Current visual problems
The working T-034 UI has been rendered in Chromium at desktop/tablet/mobile, including input, loading, results, comparison, error and missing-evidence states. It is clear and accessible, but lacks a memorable focal composition. The latest request is a major experiential change, not a scoring change.

## Why it looks AI-generated / generic
An evenly weighted two-column form/hero, repeated rounded borders, system-sans hierarchy everywhere, three numbered explanatory blocks and a uniform white/green palette resemble conventional dashboard templates. There is no authored spatial composition or expressive contrast.

## What feels cheap
Too many equally elevated boxes; a small utilitarian photo preview; instant state replacement; no relationship between the input photo and scan moment. Empty photo frames carry more visual weight than the product metaphor.

## What feels unfinished
Upload is still URL-only because the API has no browser-file contract (T-035). Static source references depend on image hosts. The frontend must not conceal these facts with a pretend dropzone or fake pipeline progress.

## Signature moments
1. **Evidence instrument:** dark editorial hero with a perspective-stacked reference plate and three spatial evidence labels. Explicit workflow illustration, never simulated results.
2. **Reference object:** the user's actual preview inhabits the 3D plate; a tactile image-link input updates it.
3. **Scan aperture:** the actual reference photo sits in a restrained instrument-like frame while the real request runs. Workflow paths animate abstractly, not as stage completion.
4. **Investigation workspace:** calm off-white evidence desk, dark provenance rail, stronger selected-item hierarchy.
5. **Comparison stage:** deliberate large image frames, subtle pointer depth and an expanded evidence surface; no invented pixel differences.

## Simplify
Keep fields, buttons, queue text, price/source/visual observations and error recovery calm. No long scroll story, cursor replacement, autoplay model, charts without real values, or fake marketplace nodes. Primary input is one click away from the hero.

## 3D and motion implementation
CSS perspective and layered planes, lightweight inline vector geometry, no WebGL/runtime framework. Pointer updates coalesced through requestAnimationFrame; fine-pointer only, disabled with reduced motion. Short entry/reveal animations; no animation gates a user action. Mobile gets a static simplified stage. The 80% calm / 20% wow rule is the design constraint.

## Verification
Retain and extend the existing zero-credit browser suite, visually inspect each major state, test all six viewport widths and keyboard/reduced-motion behavior. Measure local LCP/layout shift, transfer footprint and animation-frame cadence; report local measurements as local, not production guarantees.

## T-038 addendum: cinematic evolution, still no runtime framework
A later request asked for an "Awwwards-level" transformation (React + Three.js/R3F + GSAP + Lenis, full 3D scroll choreography). That was evaluated against this document's own constraint above and against the 11-day hackathon runway remaining at the time, and the user confirmed: evolve this system, don't replace it. What was added, all within the existing vanilla CSS/JS architecture (see `docs/TASK_BOARD.md` T-038 for the full list and the bugs it surfaced):

- A pure-CSS, <600ms, session-gated boot splash.
- A generic `[data-reveal]` IntersectionObserver reveal system for section entries, excluding the scan form.
- A restrained evidence-network SVG in the "Signal Problem" section, reusing the existing trace-draw motion vocabulary rather than inventing a new one.
- The hero's existing pointer-tilt now settles as the user scrolls past it (`--hero-lock`), combined with tilt via CSS `calc()` so the two stay independent in JS.
- A magnetic hover effect on marketing CTAs only, and a subtle dot+ring custom cursor (desktop fine-pointer only, `pointer-events: none`, suppressed over form controls and the open dialog).

Everything above degrades to fully static under `prefers-reduced-motion: reduce`, matching this document's original constraint, and none of it touches `styles.css`'s design tokens or `src/lib/*.ts`'s scoring logic.
