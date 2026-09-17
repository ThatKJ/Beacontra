# Submission Package

**Status: draft, ready for final copy-edit once naming is FINAL and a rehearsed demo recording exists.** T-017 (Lens request-path fix) and T-026 (scoring fix) are both resolved and independently verified by direct code reading this session — see the updated Known Limitations below for what's actually still open (narrower than before). All facts below are sourced to `docs/DECISION.md`, `docs/RESEARCH.md`, `docs/COMPETITIVE_ADJUDICATION.md`, and direct code reading — nothing here is invented for submission-copy purposes.

---

## PROJECT NAME

Internal codename: **BrandLens**. This collides with existing products and is not the intended public submission name — see Known Limitations. If a replacement name (`docs/TASK_BOARD.md` T-019) isn't chosen before submission, submit under a plain descriptive name (e.g., "Marketplace Listing Photo Verifier") rather than a colliding brand name.

## TAGLINE

See who's really selling your product.

## TRACK

**Commerce & Market Intelligence** — "Turn product, price, merchant, finance, trend, and marketplace results into useful tools." Chosen over Open Innovation because the fit is direct and specific, not a fallback.

## PROJECT DESCRIPTION

A brand owner submits a product name/SKU and their official product photo. The tool searches live marketplace listings (`google_shopping`, `amazon_product`), reverse-image-checks each listing's photo against the official photo (`google_lens`), and fuses that visual signal with deterministic price-anomaly and seller-anomaly checks into one ranked, evidence-backed review queue — not a verdict, a prioritized list of listings worth a human's attention, with the reasoning shown for each.

## PROBLEM

Counterfeit and unauthorized-seller listings on Indian e-commerce marketplaces are pervasive and effectively unmonitorable by hand. Delhi High Court restricted Flipkart's "latching-on" feature in November 2024 specifically because it let third-party sellers list counterfeit goods directly under a genuine brand's product page. BIS raided Amazon and Flipkart warehouses in March 2025 over forged certification marks. Meesho disclosed removing 4.2 million counterfeit listings in six months. Small Indian D2C/SME brands — big enough to be worth counterfeiting, too small to afford enterprise brand-protection SaaS — have no affordable way to check this themselves, today, for their own products.

## SOLUTION

Live cross-marketplace listing search fused with reverse-image verification and deterministic price/seller heuristics into one ranked, explained review queue — see Project Description above. Full product rationale: `docs/DECISION.md`. Full spec: `docs/PRODUCT_SPEC.md`.

## WHO IT HELPS

Founders and small ops teams at Indian D2C/FMCG brands (roughly 1-50 employees) — evidenced as an underserved segment in `docs/RESEARCH.md` §6 (problem #27), independently corroborated by a second, separately-run research pass that reached the same conclusion without seeing the first one's findings.

## HOW SERPAPI IS USED

- `google_shopping` — one call per scan, discovers live marketplace listings for the submitted product name across Indian e-commerce.
- `amazon_product` — Amazon-specific listing detail where applicable.
- `google_lens` (`exact_matches`/`visual_matches`) — up to 10 calls per scan (capped, ordered by price-anomaly-first to control credit spend), reverse-image-verifies each candidate listing's photo against the brand's official product photo.

## WHY SERPAPI USAGE IS MATERIAL

Every fact the product surfaces — which listings exist, at what price, from which seller, whether the photo matches — comes from a live SerpApi call; there is no persisted "known good/bad" database standing in for it. The visual-verification mechanism specifically cannot exist without a reverse-image search engine — deleting SerpApi removes the entire evidentiary basis of every result, not a convenience layer on top of one. Full necessity argument, including the hostile-judge pass: `docs/DECISION.md` "SERPAPI MOAT" section, `docs/JUDGE_QA.md` Q3.

## TECHNICAL HIGHLIGHTS

- **Real multi-signal fusion, not an LLM summarizing a search result:** price anomaly, seller anomaly, and visual-match signals are each computed independently in deterministic code and combined into one weighted composite score with a full evidence trail per signal (`src/lib/brandlens.ts` `fuseSignals()`). There is no LLM anywhere in the scoring path — a deliberate choice, explained honestly in `docs/JUDGE_QA.md` Q8, that trades "uses an LLM" for "every score is auditable and reproducible."
- **Credit-budget engineering, not just a feature:** an initial implementation called `google_lens` once per every extracted listing with no cap (worst case ~16-41 calls/scan against a 250/month free plan); this was found during review, fixed to cap at 10 calls ordered by price-anomaly-first, and the fix is verifiable directly in the code (`docs/SERPAPI_BUDGET.md`).
- **Competitive originality, proven not asserted:** the closest prior art found across the entire `#BuiltWithSerpApi` gallery (177 structured project entries, directly fetched and audited, `docs/COMPETITIVE_LANDSCAPE.md`) triggered a formal, structured adjudication — delete tests in both directions, a user-job comparison, a 30-second-demo comparison, run independently by two separate parties and converging on the same verdict (`docs/COMPETITIVE_ADJUDICATION.md`).

## GITHUB DESCRIPTION

*(One-liner for the repo's About field — update once T-019 naming resolves.)*
> Cross-checks marketplace listings against your brand's real product photos using live SerpApi search and reverse-image matching — commercial-anomaly signals for Indian D2C brands, not accusations.

## DEMO DESCRIPTION

Full script: `docs/DEMO.md`. Structure: problem (real, sourced numbers) → product (one sentence) → live workflow ending in a visible photo-vs-photo mismatch → proactive comparison against the closest existing SerpApi-gallery project → explicit SerpApi-necessity statement → close. **Not yet rehearsed end-to-end** — the remaining real blocker is picking and spot-checking one specific demo product/photo pair against the corrected live pipeline (T-017/T-026 are otherwise resolved), plus finalizing the public product name.

## AI TOOLS USED

Three AI coding agents, coordinated by a human throughout: **Claude Code** (research, product selection, architecture documentation, competitive adjudication, code review, this submission package), **OpenCode** (repository scaffolding, core implementation, testing infrastructure, live-integration work), **Gemini CLI** (adversarial red-teaming, UX/demo audits, an independent competitive adjudication, some implementation fixes). Coordination was file-based and asynchronous (`docs/AI_COORDINATION.md`, `docs/TASK_BOARD.md`), not a single agent working alone.

## AI DISCLOSURE

Per the hackathon's own policy ("AI-assisted development is allowed and does not affect judging... List any AI tools used... Developers remain responsible for every submitted component"): this submission was built primarily by the three AI agents named above under human direction — the human set the mission, configured the live SerpApi credentials, and made or approved decisions at checkpoints, but did not personally write the TypeScript, HTML, or most of the documentation. This is disclosed plainly, not minimized, in `docs/JUDGE_QA.md` Q18-19, including how the AI-generated work was verified (automated tests/typecheck/lint/build gates, plus cross-agent adversarial review that caught and fixed real bugs — not a single pass with no checking).

## SETUP NOTES

See `README.md` for the authoritative, tested setup path (env var configuration, `npm install`, `npm run dev`, `npm test`, `npm run serpapi:smoke`).

## KNOWN LIMITATIONS

Stated plainly, matching `docs/JUDGE_QA.md`'s weaknesses rather than a softened version for outside readers:
- Scoring weights (price/seller/visual point contributions) are hand-chosen heuristics, not statistically calibrated against a labeled dataset — no such dataset exists to calibrate against. The product is positioned as decision-support, not a certainty score, and the UI avoids percentage-style framing for exactly this reason.
- No real brand owner has used this yet — usefulness is evidenced by a documented market gap (two independent research passes), not validated customer demand.
- `google_lens` was initially thought not to return structured match data at all — that conclusion turned out to be caused by three implementation bugs (wrong parameter name, missing required `type` parameter, wrong response-parsing path), found via direct comparison against SerpApi's official docs and fixed. A live matrix test now confirms Lens genuinely returns structured `exact_matches`/`visual_matches`/`products` data when called correctly. **What's still open:** that matrix used an atypical test image (the Google logo, one of the most heavily-indexed images on the internet), not an ordinary marketplace product photo — the mechanism works, but its real-world hit rate on typical product images hasn't been separately confirmed.
- The scoring-logic issue found during review (treating "no visual match" as positive mismatch evidence) has been fixed and independently verified by direct code reading — `no_evidence` and `unavailable` are now both neutral, non-scoring states, distinct from an actual positive finding.
- "BrandLens" is an internal codename colliding with existing products; a public submission name has not been finalized (T-019).
- No takedown-drafting or enforcement-action step exists — output is a review queue for a human, not an end-to-end enforcement workflow (unlike, e.g., CeaseFire's notice-signing step for its own different problem).
