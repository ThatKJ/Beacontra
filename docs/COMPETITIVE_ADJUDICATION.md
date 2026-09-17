# Competitive Adjudication: Our Product vs CeaseFire

**Triggered by:** Gemini's P0 block in `docs/DECISION_CHALLENGES.md`, escalated by the user to a formal adjudication process. Decision status changed from LOCKED to **PROVISIONAL_LOCK — COMPETITIVE ADJUDICATION IN PROGRESS** for the duration of this document, resolved at the bottom.
**Method:** Direct fetch of CeaseFire's actual GitHub repository/README (2026-09-17, https://github.com/midhunrajcharles/Ceasefire), not just the one-line gallery description previously relied on. This is a materially deeper source than the earlier analysis in `docs/COMPETITIVE_LANDSCAPE.md`/`docs/RESEARCH.md` §7b, which only had the gallery's short description. **Finding ahead of the full writeup: the deeper source changes the picture substantially, and in our favor** — this is exactly the kind of thing this adjudication process exists to catch, in either direction.

---

## 1. CeaseFire — Verified Behavior

Source: CeaseFire's own README, fetched directly. Gallery one-liner ("searches brand impersonation across web, AI, app-store, shopping, maps, image, video results to prioritize takedowns") is confirmed accurate but incomplete/misleading about the actual core mechanism — the gallery description emphasizes the *surface sweep* step, not the *domain-permutation* step that is actually the heart of the product.

- **PRIMARY PERSONA:** "Organisations with a brand worth impersonating and no brand-protection budget — regional banks, D2C brands, clinics, universities, fintech startups." Explicitly broader than e-commerce/D2C — a bank or university is a primary example, not an edge case.
- **INPUT:** A brand **domain** (e.g., `example.com`). Not a product name. Not a product photo.
- **CORE USER JOB:** Find out whether someone has registered a **lookalike domain** to impersonate my brand (phishing/fraud risk), and get takedown-ready evidence.
- **SERPAPI ENGINES:** Google Search (1/survivor), AI Overview (2, no_cache), AI Mode (1, no_cache), plus "7 brand engines" (1 each, cacheable) sweeping Play Store, Shopping, Maps, YouTube, Images/Lens, Trends as surfaces checked for each surviving candidate domain.
- **SEARCH STRATEGY:** Not a single product search. A five-stage pipeline: (1) **generate** ~126 candidate lookalike domains via 7 algorithmic techniques (homoglyph, omission, transposition, insertion, tld-swap, hyphenation, combosquat); (2) **prefilter** via free DNS/MX/HTTP checks, reducing ~126 candidates to typically 1-3 "survivors" (~97% reduction) *before* spending any SerpApi credit; (3) **sweep** the 10 surfaces only for survivors; (4) **score** CRITICAL/HIGH/MEDIUM/LOW by documented heuristics (e.g., CRITICAL = cited in AI Overview/Mode; HIGH = live with MX records or app listing); (5) **notice** — draft a takedown notice, human reviews and signs before delivery.
- **IMAGE/REVERSE-IMAGE ROLE:** README mentions "Images / Lens" as one of ten background surfaces, described as being for "logo and brand-asset misuse" detection. **UNKNOWN** whether reverse-image *matching* (i.e., comparing two specific images) is actually implemented, or whether this surface just checks if the brand's logo/name appears in Lens-adjacent image search results — the README does not detail the implementation. Not confirmed as a product-photo-vs-listing-photo comparison mechanism in any form.
- **PROCESSING:** DNS/network-level prefiltering (free, not a SerpApi call) is the primary cost-control and precision mechanism, not signal fusion across marketplace listings. No product-listing extraction, no price-anomaly detection, no per-listing seller analysis — these concepts don't appear anywhere in the described pipeline.
- **OUTPUT:** A risk-tiered list of *domains/impersonation instances* (not product listings), defensive-domain-registration candidates (unregistered lookalike domains available to buy defensively), and takedown notice drafts with pricing/availability data.
- **ACTION USER TAKES:** Review and sign a takedown notice; optionally register a defensive domain via an integrated registrar check.
- **CORE DEMO MOMENT (inferred from architecture, screenshots/video status UNKNOWN):** Most likely "here are the dangerous lookalike domains someone registered for your brand, ranked by threat, with a takedown notice ready to sign" — a domain-security/phishing-defense moment, not a "look, this product photo doesn't match" moment.
- **TECHNICAL DEPTH:** Very high and confirmed mature, not a stub — 3,817 backend LOC (FastAPI/Python, SQLAlchemy, Argon2id auth), 4,877 frontend LOC (Next.js/TypeScript/Three.js with custom GLSL shaders), 194 tests (2,294 lines), documented `ARCHITECTURE.md`, SSRF-guarded egress, IDOR test suite. This is a serious, security-conscious, production-grade codebase.
- **SCOPE:** Domain/phishing-impersonation defense across many industries, with a takedown-notice workflow as the end product.

## 2. Our Product — Actual Planned/Implemented Behavior

Source: `docs/DECISION.md`, `docs/PRODUCT_SPEC.md`, and the actual shipped implementation (`src/lib/brandlens.ts`, `public/index.html` — T-006/T-007/T-008 all DONE per `docs/TASK_BOARD.md`, 34 tests passing, real code not a stub).

- **PRIMARY PERSONA:** Founder/small ops person at an Indian D2C or FMCG brand, priced out of enterprise brand-protection tooling.
- **INPUT:** A **product name/SKU** plus the brand's **official product photo URL** (optionally: MRP, expected price range, known authorized sellers).
- **CORE USER JOB:** Find out which *live marketplace listings* selling my product are potentially counterfeit, unauthorized, or misrepresented — using the listing's own photo as evidence, not just its price or seller name.
- **SERPAPI ENGINES:** `google_shopping` (1 call, marketplace listing search), `amazon_product` (Amazon-specific listing detail), `google_lens` (1 call per candidate listing, `exact_matches`/`visual_matches` against the official photo).
- **SEARCH STRATEGY:** Single product-name search → extract all priced candidate listings → for each candidate, reverse-image-check its thumbnail against the official photo. (Not domain generation, not DNS prefiltering — an entirely different search strategy shape.)
- **REVERSE IMAGE SEARCH:** Confirmed implemented and central, not a background surface. `runVisualVerification()` explicitly calls `google_lens` with `image_url` set to each *specific listing's* thumbnail and interprets `exact_matches`/`visual_matches` against the official photo to produce a `VisualSignal` (`match`/`mismatch`/`stolen_photo`/`different_product`) — a real, coded, per-listing image-to-image comparison, not a presence-detection surface.
- **PRODUCT-LISTING DISCOVERY:** Confirmed core mechanism — `searchMarketplaceListings()` + `extractCandidates()` turn a `google_shopping` response into structured `ListingCandidate[]` (price, seller, thumbnail, source, rating). CeaseFire has no equivalent step at all.
- **SELLER ANALYSIS:** `analyzeSeller()` — deterministic heuristic against an optional authorized-sellers list. (Currently has a known quality issue when the list is empty — see `docs/TASK_BOARD.md` T-006 code-review notes, not relevant to this adjudication but disclosed for completeness.)
- **PRICE ANALYSIS:** `analyzePrice()` — deterministic anomaly detection against MRP/expected range. CeaseFire has no pricing concept anywhere in its pipeline.
- **VISUAL ANALYSIS:** `analyzeVisual()` — interprets the Lens evidence into a signal with a confidence band and human-readable reason.
- **MARKETPLACE FOCUS:** Amazon.in/Flipkart/Meesho-style e-commerce listings specifically — not domains, not app stores, not social profiles.
- **CROSS-SOURCE FUSION:** `fuseSignals()` — weighted composite score (price 5-35, seller 15-25, visual 10-40) → confidence band → recommendation. Real fused logic, implemented and tested.
- **SCORING:** 0-100 composite score, `high`/`medium`/`low` confidence, `review_urgently`/`review`/`monitor`/`likely_genuine` recommendation (see §Language Change below for a wording revision).
- **EVIDENCE:** Every result carries listing link/source/thumbnail, Lens match sources, and a human-readable reason string per signal — visible in the API response and the demo UI.
- **OUTPUT:** A ranked list of *specific marketplace listings*, each with per-signal evidence, sorted by composite score.
- **ACTION USER TAKES:** Review the ranked list (not sign a takedown notice — no takedown-drafting step currently exists in our product; this is itself a difference worth naming, see below).
- **CORE DEMO MOMENT:** A specific listing's photo shown next to the brand's official photo with the Lens match result, making a mismatch immediately visible without narration.
- **TECHNICAL DEPTH:** Real, tested (34 tests, typecheck/lint/build clean per `docs/TASK_BOARD.md` T-006/T-007), materially smaller in raw LOC than CeaseFire (expected — CeaseFire is described as a mature multi-week project; ours is a hackathon-timeline build), but the *mechanism* (image-to-image comparison fused with price/seller heuristics into one ranked score) is real code, not a stub — verified directly by reading `src/lib/brandlens.ts` in full.
- **SCOPE:** Narrow and deliberately so — one marketplace-listing-verification workflow, not a multi-surface brand-security platform.

## 3. Feature-Level Comparison

| Dimension | CeaseFire | Ours | Classification | Why |
|---|---|---|---|---|
| **User** | Any organization w/ a brand (banks, universities, clinics, fintech, D2C) | Indian D2C/SME product brand owner specifically | PARTIAL OVERLAP | Both are "brand owner," but CeaseFire's stated examples skew toward non-product organizations (banks, universities, clinics) where there is no physical product listing to verify at all. |
| **Problem** | Domain/phishing impersonation risk | Marketplace counterfeit/misrepresented product listings | DIFFERENT | A bank has no "product listing" to protect; a D2C brand's core marketplace-fraud exposure isn't primarily about lookalike domains. Different threat models. |
| **Initial input** | Brand domain (text) | Product name + official photo (text + image) | DIFFERENT | Confirmed directly from CeaseFire's README input spec vs. our implemented API schema (`BrandLensInput`). |
| **Discovery mechanism** | Algorithmic domain-permutation generation (126 candidates) + DNS/network prefiltering | Direct `google_shopping` product search | DIFFERENT | No overlap in mechanism at all — one is combinatorial string generation + network probing, the other is a single structured search API call. |
| **Reverse image search** | Mentioned as one of 10 background surfaces ("logo/brand-asset misuse"); implementation detail UNKNOWN | Confirmed core, coded, per-listing image-to-image comparison via `google_lens exact_matches`/`visual_matches` | UNKNOWN vs. CONFIRMED — treat as PARTIAL OVERLAP at best | Cannot claim DIFFERENT with certainty since CeaseFire's Lens usage isn't documented in enough detail to rule out overlap entirely — but what's confirmed for CeaseFire (brand-asset/logo presence across the web) reads as a different specific check than ours (does *this specific listing's photo* match *this specific official product photo*). |
| **Product-listing discovery** | Not present — no product/SKU concept anywhere in CeaseFire's described pipeline | Core mechanism | DIFFERENT | |
| **Seller analysis** | Not present | Present (`analyzeSeller()`) | DIFFERENT | |
| **Price analysis** | Not present — no pricing concept in CeaseFire's pipeline | Present (`analyzePrice()`) | DIFFERENT | |
| **Visual analysis (as a fused signal)** | Not confirmed as a scored/fused signal — Lens appears to be a presence-check surface, not a scoring input | Present as one of three fused signals, weighted 10-40 pts | DIFFERENT (in role and depth), UNKNOWN (in raw capability) | |
| **Marketplace focus** | Domains + app stores + maps + video + image search broadly | E-commerce product listings (Shopping/Amazon) specifically | DIFFERENT | |
| **Cross-source fusion** | Risk-tier scoring from surface-presence signals (is it live, is it cited in AI Overview, does it have MX records) | Weighted composite from price + seller + visual signals | PARTIAL OVERLAP | Both fuse multiple signals into a score — the *pattern* (fusion → tiered output) is shared, which is the honest overlap here; the *signals being fused* are entirely different in kind. |
| **Output artifact** | Domain risk list + defensive-registration candidates + takedown notice draft | Ranked product-listing list with evidence | DIFFERENT | |
| **Recommended action** | Sign a takedown notice / register a defensive domain | Review a flagged listing (no drafting/signing step exists in ours) | DIFFERENT | This is also a scope gap worth naming honestly — CeaseFire goes one step further in its workflow (notice drafting) than we currently do; not a differentiation point in our favor. |
| **Demo experience** | (Inferred) domain risk table + notice-signing flow | Photo-vs-photo visual mismatch as the centerpiece | DIFFERENT (with the caveat that CeaseFire's actual demo/screenshots are UNKNOWN — this is our best inference from its architecture, not a confirmed observation) | |

**Overall pattern:** of 14 compared dimensions, **10 are DIFFERENT, 3 are PARTIAL OVERLAP (persona-category, fusion-as-a-pattern, and the Lens-uncertainty dimension), 0 are SAME.** The earlier assessment (`docs/RESEARCH.md` §7b), based only on the one-line gallery description, was *not wrong* but was working from a thinner source than this adjudication used — the real README shows less overlap than the gallery description implied, not more.

---

## THE DELETE TEST

**Test 1 — if we removed Lens from our product, would it collapse into something basically equivalent to CeaseFire?**

**NO.** Without Lens, our product would still: search `google_shopping`/`amazon_product` for a *specific named product*, extract structured listing candidates, run price-anomaly and seller-anomaly heuristics, and rank the results. None of that exists anywhere in CeaseFire's pipeline, which starts from a *domain*, not a *product*, and never touches marketplace listing price/seller data as a scored signal. Removing Lens would not make our product equivalent to CeaseFire — it would make our product a (weaker, less differentiated-from-the-*shopping-cluster*) price/seller anomaly tool. That's an honest, separate risk (noted in `docs/COMPETITIVE_LANDSCAPE.md`'s 31-project shopping/price-comparison cluster), but it is not a CeaseFire-collapse risk. **Test result: differentiation from CeaseFire survives even in the worst case.**

**Test 2 (reverse) — if CeaseFire were given our uploaded reference product photo, could it execute our full workflow without a substantial architecture change?**

**NO.** CeaseFire has no product-listing search step (no `google_shopping`/`amazon_product` integration for finding live listings of a named product), no price-normalization or price-anomaly logic, no seller-heuristic logic, and its domain-permutation-generation core (the actual heart of its pipeline, per the README) is entirely irrelevant to a product-photo input — there's no "domain" to permute. Bolting our workflow onto CeaseFire would require building net-new: listing discovery, price/seller signal extraction, and a fusion/scoring model that operates on listings instead of domains. That is a substantial rebuild, not a config change or a new input field. **Test result: differentiation confirmed from the reverse direction too.**

---

## THE USER-JOB TEST

> CeaseFire helps **a brand-owning organization (bank, university, clinic, D2C brand, fintech) with no brand-protection budget** do **discover and respond to lookalike-domain phishing/impersonation risk, ending in a signed takedown notice.**

> Our project helps **an Indian D2C/SME product brand owner** do **discover which live marketplace listings selling their product are potentially counterfeit or misrepresented, using the listing's own photo as evidence, ending in a reviewed list of flagged listings.**

These sentences are **not** almost identical. The persona overlaps only at the coarse "brand owner" level (and CeaseFire's own stated examples — banks, universities, clinics — mostly *don't* have a marketplace-product-listing problem at all, which undercuts even that overlap). The job itself is different in threat type (phishing/domain fraud vs. marketplace goods misrepresentation), evidence type (domain/network/mention signals vs. product-photo/price/seller signals), and end artifact (signed takedown notice vs. reviewed listing queue). **Per the test's own rule: meaningfully different — proceed, don't block.**

---

## THE 30-SECOND DEMO TEST

**CeaseFire's first 30 seconds (inferred from its architecture — actual demo/video status UNKNOWN):** enter a brand domain → watch it generate dozens of lookalike domain candidates → see a DNS-prefiltered shortlist → see a risk-tiered table of live impersonations → (likely) a takedown-notice draft appears.

**Our first 30 seconds:** enter a product name + upload the real product photo → watch live marketplace listings appear → watch the system reverse-image-check each one → **see a specific listing's photo placed next to the real photo with a visible mismatch, flagged with a reason.**

These are not both "enter brand → find suspicious listings" in a way a judge would experience as the same demo. The centerpiece moments are different in kind: a *risk table* vs. a *visual photo comparison*. **Test passes — proceed.**

---

## THE ANTI-WRAPPER / TECHNICAL DEPTH TEST

Already implemented and confirmed (not aspirational): reverse-image discovery (Lens per-listing), price-deviation calculation, image-match evidence, cross-query evidence fusion (three signals → one score), explainable anomaly scoring (`evidenceSummary` per result), evidence provenance (source links, match sources retained per result).

**Worth adding if time allows, evaluated for genuine feasibility (not feature-creep for its own sake):**
- **Duplicate listing clustering / canonical product fingerprinting** — feasible, moderate effort; would strengthen the "variant matching" requirement already in T-006's acceptance criteria.
- **Seller recurrence analysis** (same suspicious seller appearing across multiple scans) — requires persistence across scans; feasible as a P1 if a KV/DB layer is added, currently out of scope per `docs/PRODUCT_SPEC.md`'s P2 list (scheduled/recurring monitoring).
- **Merchant/domain normalization** — lower priority; more relevant to CeaseFire's domain-centric problem than ours.
- **Known-brand-domain allowlisting** — explicitly *not* recommended: this is CeaseFire's territory (domain-identity verification), and adding it would erode rather than sharpen our differentiation. Deliberately excluded.

**Assessment: passes.** The shipped mechanism already does more than "Lens result + price heuristic + pretty risk score" — it's a genuine weighted multi-signal fusion with explainable output, confirmed by reading the actual scoring code, not assumed from the design doc.

---

## LANGUAGE CHANGE — APPLIED

Per the adjudication brief: we cannot establish counterfeit status from these signals, only risk/anomaly signals. Applying the requested vocabulary shift going forward in all product-facing docs and (flagged as a task) UI copy:

- ~~"counterfeit detector"~~ → **"commercial anomaly detection"** / **"listing requiring review"**
- ~~"counterfeit listing"~~ → **"suspected listing mismatch"** / **"potentially unauthorized listing"**
- Output framing → **"brand-risk signal"**, always with a visible reason, never a bare verdict (this was already the product's stated design in `docs/DECISION.md`'s risk #3/mitigation #3 — the new vocabulary makes it explicit at the word level too, not just the UX level).
- **Action item for OPENCODE (non-blocking, not P0):** `src/lib/brandlens.ts`'s `VisualSignal.anomalyType` includes `'stolen_photo'` — this is an accusatory factual claim the evidence doesn't support (a photo *appearing elsewhere* doesn't prove theft). Recommend renaming to something like `'unverified_photo_source'` or `'photo_reused_elsewhere'` and reviewing `public/index.html` copy for the same pattern. Tracked in `docs/TASK_BOARD.md`.

---

## PRODUCT NAME COLLISION

Per instruction: "BrandLens" is already used by multiple existing products. **Treating "BrandLens" as an internal codename only from this point forward** — not building brand identity, logo, or marketing copy around it. A real public-facing name is a separate, lower-priority task, tracked below, and does not block continued development (the product's *function*, not its *name*, was what was under adjudication).

---

## DECISION RULE

**A. KEEP.**

Evidence shows the workflow, user job, input, discovery mechanism, and core demo moment are materially different from CeaseFire — confirmed by reading CeaseFire's actual README/architecture directly, not inferring from a one-line gallery description. Of 14 directly compared dimensions, 10 are DIFFERENT, 3 are PARTIAL OVERLAP at the category level (not the mechanism level), 0 are SAME. Both the forward delete-test (remove our differentiator, do we become CeaseFire? No) and the reverse delete-test (could CeaseFire trivially do our job? No, would need substantial rebuild) support KEEP. This is not a sunk-cost decision — if anything, this adjudication used a *deeper* source than the original decision did, and the deeper source *reduced* the measured overlap, which is the opposite of what a sunk-cost-motivated analysis would produce.

**Genuinely honest residual risk, not hidden:** the "brand protection" *category* label is shared, CeaseFire is a more mature/impressive-looking codebase if a judge digs in, and CeaseFire's Lens usage is genuinely UNKNOWN in enough detail that a small residual chance exists it does something closer to our mechanism than the README discloses. The mitigation is unchanged from `docs/DECISION.md`: state the comparison proactively in the demo/submission, in these more precise terms now available (domain-impersonation-defense vs. marketplace-listing-photo-verification), rather than a vaguer "we're different" claim.
