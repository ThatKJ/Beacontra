# Decision: Beacontra (developed under the internal codename "BrandLens" — see naming note)

**Status:** LOCKED — re-confirmed 2026-09-17 after a formal competitive-adjudication process. History: LOCKED → **PROVISIONAL_LOCK — COMPETITIVE ADJUDICATION IN PROGRESS** (when Gemini's P0 CeaseFire-duplicate block escalated to a forensic comparison) → **LOCKED** (adjudication verdict: KEEP, HIGH confidence, reached independently by two separate deep-dives — mine in `docs/COMPETITIVE_ADJUDICATION.md`, Gemini's in `docs/COMPETITIVE_ADJUDICATION_GEMINI.md` — both concluding CeaseFire is a domain-typosquatting scanner with a fundamentally different input/mechanism/output, not a duplicate). Full research trail: `docs/RESEARCH.md`. Competitive audit: `docs/COMPETITIVE_LANDSCAPE.md` + `docs/COMPETITIVE_ADJUDICATION.md`. This unblocks OPENCODE's implementation (already complete through T-008) and GEMINI's decision-dependent audits.
**Track:** Commerce & Market Intelligence.
**Naming:** FINAL — **Beacontra** (`docs/NAMING_DECISION.md`). "BrandLens," the name used throughout this memo's body text below (accurate to when it was written), collided with existing products and was retired after two independent collision audits found Beacontra clean (`docs/NAMING_V2.md`, `docs/NAMING_AUDIT_V2.md`). Left as "BrandLens" in the body below since this memo documents a specific historical decision point — read "BrandLens" there as "Beacontra."
**Language:** output framing uses "commercial anomaly / brand-risk signal / listing requiring review," not "counterfeit detector" — the system flags risk signals for human review, it does not and cannot establish legal counterfeit status from price/seller/visual signals alone (`docs/COMPETITIVE_ADJUDICATION.md`).
**Author:** CLAUDE, 2026-09-17.

---

## THE PROBLEM

Counterfeit and unauthorized-seller listings on Indian e-commerce marketplaces (Amazon.in, Flipkart, Meesho) are pervasive, continuously changing, and effectively unmonitorable by hand. Counterfeiters list fakes under a genuine brand's name, sometimes lifting the brand's own product photos and sometimes using mismatched/stolen photos, and rotate seller accounts to evade detection. Small and mid-size Indian D2C brands have no affordable way to find out, right now, which live listings are doing this to them.

## WHO SUFFERS FROM IT

**The primary persona is the founder/small ops team at an Indian D2C or FMCG brand** — the kind of brand big enough to be worth counterfeiting but too small to afford enterprise brand-protection SaaS (MarqVision, Bustem, IPMoat-class tools) or a retained IP law firm. Not "everyone" — specifically the underserved middle: too big to ignore the problem, too small to buy the existing solution.

## WHY NOW

India's counterfeit-goods problem on marketplaces is escalating and legally live right now: the Delhi High Court restricted Flipkart's "latching-on" feature in **November 2024** specifically because it let third-party sellers list counterfeit/unauthorized goods directly under a genuine brand's existing product page — a named, current, court-recognized version of exactly this mechanism. BIS raided an Amazon Delhi warehouse in **March 2025** (3,500+ items, forged ISI marks) and a Flipkart warehouse the same period. Meesho disclosed removing 4.2 million counterfeit listings in six months. This is an active, ongoing enforcement fight, not a historical or hypothetical one.

## CURRENT PROCESS

A brand owner today either (a) does nothing and absorbs the revenue/reputation loss, (b) has a founder or small team manually search marketplaces periodically — infeasible at scale against sellers who rotate accounts, or (c) pays for Amazon Brand Registry (Amazon-only, doesn't cover Flipkart/Meesho/the open web) or a retained IP-monitoring service (priced for larger clients).

## FAILURE

The workflow breaks at scale and at cost: manual search doesn't scale past a handful of SKUs/sellers, Amazon Brand Registry is platform-siloed, and paid monitoring retainers are priced out of reach for most Indian SMEs. The result, evidenced independently by two separate research passes (`docs/RESEARCH.md` §6, §7a/§9): there is no affordable, self-serve, cross-marketplace tool for this segment today.

## INSIGHT

The non-obvious observation: **text/price/seller-metadata monitoring (what every adjacent tool, including the closest prior art `CeaseFire`, does) cannot answer the one question that actually resolves ambiguity — does the photo on this listing actually depict the genuine product, or is it stolen/mismatched?** Price and seller-identity signals are individually weak and noisy (legitimate resellers also undercut price; legitimate small sellers also look unfamiliar). A reverse-image match against the brand's own official product photo is comparatively hard to fake and cheap to check via `google_lens`, and no tool found in the entire competitive audit combines this specific signal with marketplace listing search for this specific purpose.

## PRODUCT

**BrandLens.** A brand owner submits a product name/SKU and links their official product photo(s). BrandLens searches `google_shopping` (and `amazon_product` for Amazon-specific listings) for that product across Indian marketplaces, then runs each suspect listing's photos through `google_lens` (`exact_matches`/`visual_matches`) against the official photo. It fuses three independent signals — price anomaly (below-MRP/typical range), seller anomaly (new/unfamiliar seller identity), and visual mismatch (photo doesn't match or appears elsewhere under different branding) — into one ranked, evidence-backed list: "these listings are worth your review," with the underlying evidence shown for each, not a bare accusation.

## SERPAPI MOAT

Remove SerpApi and the product has no function left. There is no public alternative API for live, cross-marketplace listing data (price, seller, photos change daily; a static snapshot goes stale within days per counterfeit-seller account-rotation behavior, evidenced in `docs/RESEARCH.md` §6 problem #27). The visual-verification mechanism specifically requires a reverse-image search engine (`google_lens`) — there is no way to build "does this photo match" without either building our own reverse-image index (infeasible in hackathon timeframe) or using this exact capability. This satisfies the hackathon's explicit "material contribution... not an isolated or cosmetic API call" bar directly: the entire evidentiary basis of every ranked result comes from SerpApi calls.

## DIFFERENTIATION

Full detail in `docs/COMPETITIVE_LANDSCAPE.md`. In short: the closest prior art (`CeaseFire`, gallery-cataloged) does broad presence/mention-based brand-impersonation search across 10 engines but does not do visual/reverse-image verification. BrandLens is narrower and goes deeper on the one mechanism CeaseFire's engine list structurally cannot provide. The persona is also inverted from the generic "verification agent" cluster that dominates the current SerpApi ecosystem (~38 projects, `docs/RESEARCH.md` §4/§9) — those overwhelmingly serve a consumer or B2B-procurement checker persona; BrandLens serves the brand owner defending their own listings, a materially less crowded angle.

## TECHNICAL DEPTH

Not a single API call summarized by an LLM. The real engineering is: (1) product-variant/title matching and deduplication across sellers with wildly inconsistent listing titles (a genuine entity-resolution problem), (2) fusing three independently weak/noisy signals (price, seller, visual match confidence) into one defensible ranked confidence score rather than a binary verdict, and (3) presenting the underlying evidence per listing so a human — not the algorithm — makes the final call, which is also the correct answer to the defamation-risk concern raised in the red-team pass (`docs/RESEARCH.md` §10).

## DEMO

A brand/SKU with a real or realistically-constructed counterfeit listing produces a visually obvious "gotcha": a suspect listing's photo, shown side-by-side with the brand's real photo and the `google_lens` match evidence, clearly not matching. This is legible to a judge in seconds without narration, which is exactly the "surprising/useful result" moment the mission's demo framing calls for.

## RISKS

1. **Needs a cooperating brand/SKU or a well-chosen public example to demo convincingly.** *(build risk)*
2. **`google_lens` engine behavior/coverage for Indian marketplace product photos specifically is unverified beyond the documented parameter schema** — could underperform on real listings. *(technical risk)*
3. **Defamation-adjacent framing** — must never present "confirmed counterfeit," only "evidence for your review." *(product/legal risk)*
4. **CeaseFire overlap perception** — a judge who knows the gallery could initially read this as a subset of CeaseFire before the visual-verification distinction is explained. *(originality-perception risk)*
5. **Market-size figures used in the pitch (India counterfeit market $58.7B/$16.2B) are single-sourced and one specific "35%" stat is flagged as unverified (AI-search-summary-derived, not opened at the primary source) in `docs/RESEARCH.md` §6/§7.** *(evidence-integrity risk)*

## MITIGATIONS

1. Build the demo around a real, well-known, publicly-documented case (e.g., referencing the actual Skechers v. Flipkart pattern or a similar public case) rather than requiring an actual brand partner; construct a realistic synthetic suspect listing for the "gotcha" moment if needed, and disclose that clearly in the demo per the hackathon's "no fake data presented as live" rule.
2. Verify `google_lens` behavior directly against real Indian marketplace listing photos early in implementation (T-0 of the build, before committing further architecture) — flagged as the first thing OPENCODE should test live.
3. UX and copy always frame results as "evidence for review" with visible confidence bands, never a verdict — enforced as a product requirement in `docs/PRODUCT_SPEC.md`, and checked explicitly in GEMINI's UX audit.
4. `docs/SUBMISSION.md` and the demo script will state the CeaseFire comparison proactively and explain the visual-verification differentiation in the judges' own words, rather than hoping they don't notice the overlap — pre-empting the objection is stronger than hiding from it.
5. Any market-size figure used publicly (pitch deck, README, demo narration) will be re-verified at the primary source before use, or dropped/qualified if it can't be independently confirmed; the well-sourced, specific figures (BIS raid amounts, Meesho's 4.2M-listing removal disclosure, the Delhi HC ruling) are used preferentially over the softer aggregate percentage/dollar figures.

## WHY THIS CONCEPT WON

See `docs/RESEARCH.md` §13 for the full reasoning trail. In short: it is the only candidate that scored high on both SerpApi-necessity and low-competitive-risk simultaneously (every other strong candidate traded one against the other), it survived a genuine hostile-judge pass and a real competitor audit rather than an uncontested one, and — most importantly — it was independently re-discovered by a second research process that never saw the first one's candidate list. That last point is the strongest signal available before a single line of product code is written.
