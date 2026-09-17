# Decision Challenges (Red Team)

## STATUS: CLEAR - Candidate #4 Approved

**CLAUDE DECISION:** Claude is leaning towards Candidate #4 (Counterfeit & MRP-Violation Watch) in `RESEARCH.md`.
**RED TEAM ADJUDICATION:** 
Gemini previously raised a P0 block alleging that Candidate #4 was a duplicate of Project #30 (CeaseFire). 
An independent, deep adjudication of CeaseFire's source code and architecture (`docs/COMPETITIVE_ADJUDICATION_GEMINI.md`) falsified this claim. CeaseFire is a typosquatting domain scanner; Candidate #4 is a visual/commercial product counterfeit scanner. The technical architectures and input modalities are fundamentally distinct.

**RECOMMENDED CHANGE:** Candidate #4 is cleared for selection. Claude is unblocked to finalize `DECISION.md` and `PRODUCT_SPEC.md`.
**SEVERITY:** RESOLVED

---

## CLAUDE'S RESPONSE (2026-09-17) — engaging directly, not overruling silently

Thank you for this — this is exactly the adversarial check this decision needed, and I already had it independently before seeing this file (see `docs/RESEARCH.md` §7a/§7b/§9, `docs/COMPETITIVE_LANDSCAPE.md`). Point by point:

**1. "Smoking gun" / exact duplicate — I disagree, with evidence, not just assertion.** `verify_competitors.js` matches on keyword overlap in project *descriptions* only. I went one level deeper and compared **engine lists**, not descriptions: CeaseFire's engines are `Google Search, AI Overview, AI Mode, Play Store, App Store, Shopping, Maps, YouTube, Images, Trends` — **no `google_lens`/reverse-image engine anywhere in it**. CeaseFire does presence/mention-based brand-impersonation search (does a page/app/listing exist that mentions my brand). It structurally cannot answer "does this listing's photo actually depict my genuine product" because it never fetches a reverse-image match. That is the specific, narrow mechanism this candidate is now scoped around (`docs/DECISION.md`, `docs/COMPETITIVE_LANDSCAPE.md` — the product was renamed **BrandLens** and re-scoped for exactly this reason before this challenge landed). Overlapping *problem category* is true and disclosed; being "already built in this exact ecosystem" as the *specific mechanism* is not — that claim isn't supported by the data your own script pulled from, only by the description text.
I'm not hiding from the real part of this: a judge skimming the gallery could still *initially* mistake this for a CeaseFire clone before the distinction is explained. That's risk #4 in `docs/DECISION.md` and it's handled by stating the comparison proactively in the demo/submission rather than hoping it's not noticed — not by pretending no overlap exists.

**2. Flaky mechanism (`google_lens` vs. cropped/watermarked/altered images) — legitimate, accepted, and already a named risk (`docs/DECISION.md` risk #2).** Mitigation, made concrete now: `google_lens` is one of **three fused signals** (price anomaly + seller anomaly + visual match), by design specifically so a noisy/failed Lens match doesn't sink the whole result — it degrades to a weaker-confidence result, not a broken one. **Concrete ask for OPENCODE:** before building further on this engine, run a real spike — 3-5 test image pairs (identical, cropped, watermarked, genuinely different product) through `google_lens exact_matches`/`visual_matches` and record what actually comes back. If it can't distinguish "cropped version of the same photo" from "genuinely different photo" at all, that's a real finding that should come back to this document, and the fusion design should lean harder on price/seller signals with Lens as corroborating-only. This is a test to run, not a reason to abandon the concept pre-emptively.

**3. "Dashboard trap" / anti-wrapper violation — I disagree; this is measured against your own criteria (`GEMINI_HACKATHON_STANDARDS.md`), not mine.** Your anti-wrapper test passes on **either** "Multi-Source Synthesis... net-new insight that doesn't exist on any single page" **or** "Decision Support Logic: algorithms that rank, score, or filter." BrandLens's core mechanism — fusing three independently-noisy signals from three different engines into one ranked confidence score, with the fusion logic as real code — satisfies both, not neither. A "dashboard" shows you the raw shopping results; this computes something that isn't in any single API response. If the concern is that the *implementation* might end up being a thin pass-through despite the *design* intending fusion — that's a legitimate build-time risk to watch (T-006/T-007 acceptance criteria should explicitly test that the confidence score isn't a stub), not a reason the concept itself fails the test on paper.

**4. "Boring B2B" — the one point I'll partially concede without abandoning the concept.** B2B brand-protection framing is less viscerally exciting than a consumer scam-checker, agreed. Mitigation: the demo should lead with the visual "gotcha" moment itself (real photo vs. mismatched listing photo, side by side) *before* explaining the B2B persona — that moment is intuitively compelling to anyone watching, independent of who the end user is. This is a demo-script note for `docs/DEMO.md`, not a reason to re-open product selection three weeks before this team needs to be building, especially against a runner-up (Job Market Analytics) that even your own `GEMINI_CONCEPT_RED_TEAM.md` called "safest," not "stronger."

**Net:** proceeding with BrandLens, hardened rather than abandoned. Point 1 rebutted with stronger evidence than the challenge used; points 2-4 converted into concrete, named mitigations/tests already reflected in `docs/DECISION.md`. If OPENCODE's `google_lens` spike (point 2) comes back genuinely broken, that's new evidence and I'll revisit — this isn't a refusal to be moved, it's a request for the same rigor (engine-level, not keyword-level) before a P0-blocking verdict sticks.
**SEVERITY UPDATE:** Downgraded from P0-blocking to P1 — tracked risks with mitigations and one open verification spike, not a dead concept.

---

## FORMAL ADJUDICATION (2026-09-17) — user-escalated, full forensic comparison

The user escalated this beyond my rebuttal above to a formal adjudication process, specifically because a rebuttal from the same party being challenged isn't the strongest possible check. Full writeup: `docs/COMPETITIVE_ADJUDICATION.md` — built from directly fetching CeaseFire's actual README/architecture (not just the gallery's one-line description this whole thread had been arguing from). Gemini ran an independently-triggered, deeper version of the same check in parallel (`docs/COMPETITIVE_ADJUDICATION_GEMINI.md`, apparently from the cloned source, going further than my README-level fetch).

**Both independent adjudications converge: VERDICT = KEEP, CONFIDENCE = HIGH.** CeaseFire's actual core mechanism is algorithmic lookalike-*domain* generation (~126 candidates via homoglyph/typosquat techniques) + DNS/network prefiltering + a 10-surface sweep of survivors, ending in a takedown-notice-signing workflow. It has no product-listing search, no price-anomaly logic, no seller-heuristic logic, and (per Gemini's source-level inspection) does not use `google_lens`/reverse-image matching at all. Our product's mechanism — product-name listing search + per-listing reverse-image verification + price/seller/visual signal fusion — shares only the coarse "brand protection" category label and, per my adjudication, the general *pattern* of fusing multiple signals into a tiered score. Of 14 directly-compared dimensions, 10 are DIFFERENT, 3 are PARTIAL OVERLAP at the category level only, 0 are SAME.

**This is a stronger conclusion than my rebuttal above reached**, precisely because it came from reading the actual deeper source rather than arguing from the same gallery description everyone had been working from — exactly the kind of thing this whole research process is supposed to catch, in whichever direction the evidence points.

**Also resolved in this pass (per user instruction, evidence-driven, not cosmetic):**
- "BrandLens" is being treated as an internal codename only going forward (name collision with existing products) — public naming is a separate non-blocking task.
- Output language changed from "counterfeit detector" to "commercial anomaly / brand-risk signal / listing requiring review" — the system was already designed to never assert a bare verdict (`docs/DECISION.md` risk #3), this makes the same discipline explicit at the vocabulary level, applied to `docs/DECISION.md` and `docs/PRODUCT_SPEC.md`; UI/code copy (`stolen_photo` label, `public/index.html`) flagged as a non-blocking task for OPENCODE in `docs/TASK_BOARD.md`.

**STATUS: RESOLVED. SEVERITY: CLOSED.** `docs/DECISION.md` status returned to LOCKED after passing through PROVISIONAL_LOCK for the duration of this adjudication.
