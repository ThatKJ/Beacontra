# Product Spec: BrandLens

**Status:** LOCKED, unblocks OPENCODE T-005/T-006. Decision rationale: `docs/DECISION.md`. Research trail: `docs/RESEARCH.md`.

---

## PRODUCT NAME

BrandLens

## TAGLINE

See who's really selling your product.

## ONE-LINE PITCH

BrandLens cross-checks marketplace listings against your brand's real product photos — using live search and reverse-image matching — to surface counterfeit and unauthorized-seller listings you'd otherwise never find in time.

## 30-SECOND PITCH

Indian D2C brands lose real money to counterfeiters who list fakes under their name on Flipkart, Amazon, and Meesho — Meesho alone removed 4.2 million counterfeit listings in six months, and Delhi's High Court has already ruled on this exact pattern once. Enterprise brand-protection tools exist, but they're priced for companies far bigger than most Indian D2C brands. BrandLens gives a small brand owner the same capability at hackathon-project cost: paste your product and your real photo, and BrandLens finds live marketplace listings for it, then reverse-image-checks each one's photos against yours. Price anomalies, unfamiliar sellers, and mismatched photos get fused into one ranked list — evidence for you to review, not an automated accusation.

## PRIMARY USER

Founder or small ops/legal person at an Indian D2C or FMCG brand, roughly 1-50 employees — big enough to be worth counterfeiting, too small to afford enterprise brand-protection SaaS or a retained IP monitoring firm.

## USER STORY

"As a small D2C brand owner, I want to know which live marketplace listings are selling fake or unauthorized versions of my product, with evidence I can act on, without paying for enterprise tooling or manually searching every marketplace myself."

## BEFORE / AFTER WORKFLOW

**Before:** Founder occasionally Googles their own product name, scrolls a few pages of Flipkart/Amazon results, eyeballs anything that looks off, gives up because it doesn't scale — or does nothing at all until a customer complains about a fake they received.

**After:** Founder enters product name + links their real product photo once. BrandLens returns a ranked list of suspect listings across marketplaces within seconds, each with the specific evidence (price delta, seller signal, visual match result) shown, sorted by confidence — a five-minute review replaces a task that was previously either skipped or unbounded.

## CORE VALUE PROPOSITION

Turns three individually-weak, noisy signals (price, seller identity, product photo) into one ranked, evidence-backed action list — using a visual-verification mechanism (`google_lens` reverse-image matching) that no comparable tool in the current SerpApi ecosystem combines with marketplace listing search for this purpose.

## 3 MAGIC FEATURES

1. **Reverse-image "gotcha"** — side-by-side view of the brand's real product photo vs. a suspect listing's photo with the `google_lens` match result, making a mismatch immediately, visually obvious.
2. **Fused confidence score** — one ranked number per listing combining price/seller/visual signals, with each contributing signal shown transparently, not hidden behind a black-box verdict.
3. **Evidence trail, not accusation** — every flagged listing links back to its source (marketplace URL, timestamp, the exact image match used), so the brand owner can verify and act, never a bare "this is fake" claim.

## P0 FEATURES (must work for the demo)

- Submit product name + brand's official product photo URL.
- Search `google_shopping` (+`amazon_product` where applicable) for live listings of that product.
- Run each candidate listing's photo through `google_lens` (`exact_matches`/`visual_matches`) against the official photo.
- Compute and display a per-listing confidence score combining price anomaly + visual mismatch (+ seller signal if time allows).
- Evidence-first results UI: ranked list, each item showing its contributing signals and source links, framed as "for your review."
- Real SerpApi calls visible/verifiable during the demo (not pre-baked fake data presented as live), with a clearly-labeled fixture/cached fallback mode for demo resilience per `docs/SERPAPI_BUDGET.md`.

## P1 FEATURES (strengthen if time allows)

- Seller-identity signal (new/unfamiliar seller flagging) as a third fused signal.
- Multi-marketplace comparison view (Flipkart + Amazon.in + Meesho side by side for the same product).
- Temporal price-history tracking to also catch "festive fake-discount"/MRP-inflation dark patterns (`docs/RESEARCH.md` §6, problem #41) — a natural extension of the same infrastructure.
- Exportable evidence report (PDF/CSV) a brand owner could actually send to a marketplace's seller-enforcement team.

## P2 / POST-HACKATHON FEATURES

- Scheduled/recurring monitoring (cron) rather than one-shot checks.
- Multi-SKU/portfolio view for brands with many products.
- Direct marketplace takedown-request integration (Amazon Brand Registry API, etc.) — explicitly out of scope for the hackathon build.

## NON-GOALS

- Not a consumer-facing "should I buy this" tool (that's a different, more crowded persona/product — see `docs/RESEARCH.md` §7a's discussion of the adjacent `IsThisSafe?` project).
- Not an automated legal/takedown-filing system — output is evidence for a human, never an automated accusation or action.
- Not a general brand-monitoring tool across app stores/social media (that's CeaseFire's territory, deliberately not re-built — see `docs/DECISION.md`).
- Not a price-tracking/deal-finder tool for shoppers.

## SUCCESS METRICS (for this hackathon build, not a company)

- A real or realistically-constructed demo scenario produces a visually clear, undeniable mismatch result within the 3-minute demo, using live (or transparently-labeled cached) SerpApi calls.
- The three-signal fusion is real logic in code, verifiable in the repo history, not a single API call summarized by an LLM.
- Zero fabricated data presented as live; zero placeholder/fake statistics in the UI.
