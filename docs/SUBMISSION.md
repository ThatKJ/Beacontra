# Submission Package

**Status: draft, ready for final copy-edit once naming is FINAL and a rehearsed demo recording exists.** T-017 (Lens request-path fix) and T-026 (scoring fix) are both resolved and independently verified by direct code reading this session — see the updated Known Limitations below for what's actually still open (narrower than before). All facts below are sourced to `docs/DECISION.md`, `docs/RESEARCH.md`, `docs/COMPETITIVE_ADJUDICATION.md`, and direct code reading — nothing here is invented for submission-copy purposes.

---

## PROJECT NAME

**Beacontra.** `docs/NAMING_DECISION.md` — NAMING STATUS: FINAL, selected after two independent collision audits (`docs/NAMING_V2.md`, `docs/NAMING_AUDIT_V2.md`) found it clean. Formerly developed under the internal codename "BrandLens," which collided with existing products and was retired.

## TAGLINE

**"Where price, seller, and photo evidence meet."** *(provisional — one of 5 candidates in `docs/TAGLINE.md`, pending Gemini's red-team; update this line once that lands if a different candidate wins.)*

## TRACK

**Commerce & Market Intelligence** — "Turn product, price, merchant, finance, trend, and marketplace results into useful tools." Chosen over Open Innovation because the fit is direct and specific, not a fallback.

## PROJECT DESCRIPTION

A brand owner submits a product name/SKU and their official product photo. The tool searches live marketplace listings (`google_shopping`, `amazon_product`), performs reverse-image checks on the top candidate listings against the official photo (`google_lens`), and fuses that visual signal with deterministic price-anomaly and seller-anomaly checks into one ranked, evidence-backed review queue — not a verdict, a prioritized list of listings worth a human's attention, with the reasoning shown for each.

*(Beacontra performs Lens analysis on the top 10 candidate listings to bound API usage; the remaining listings retain commercial price/source evidence.)*

## PROBLEM

Counterfeit and unauthorized-seller listings on Indian e-commerce marketplaces are pervasive and effectively unmonitorable by hand. Delhi High Court restricted Flipkart's "latching-on" feature in November 2024 specifically because it let third-party sellers list counterfeit goods directly under a genuine brand's product page. BIS raided Amazon and Flipkart warehouses in March 2025 over forged certification marks. Meesho disclosed removing 4.2 million counterfeit listings in six months. Small Indian D2C/SME brands — big enough to be worth counterfeiting, too small to afford enterprise brand-protection SaaS — have no affordable way to check this themselves, today, for their own products.

## SOLUTION

Live cross-marketplace listing search fused with reverse-image verification and deterministic price/seller heuristics into one ranked, explained review queue — see Project Description above. Full product rationale: `docs/DECISION.md`. Full spec: `docs/PRODUCT_SPEC.md`.

## WHO IT HELPS

Founders and small ops teams at Indian D2C/FMCG brands (roughly 1-50 employees) — evidenced as an underserved segment in `docs/RESEARCH.md` §6 (problem #27), independently corroborated by a second, separately-run research pass that reached the same conclusion without seeing the first one's findings.

## HOW SERPAPI IS USED

**Corrected 2026-09-18 — the previous version of this section stated a specific request count (11) and credit range that are not actually verifiable from the current instrumentation; see `docs/FINAL_VERIFIED_RUN.md` for the full correction.**

- **SHOPPING REQUESTS**: 1 call per scan (`google_shopping`) — verified, one call regardless of result count.
- **LENS REQUESTS**: up to 2 calls per candidate listing (`exact_matches` with `image_id`, falling back to `products` with `url` if no exact match), for the top **10** candidate listings only (`MAX_LENS_CALLS = 10`, ordered by price anomaly) — this cap is verified directly in the code, and is the accurate, publishable claim. The *exact* total number of Lens requests in a given scan depends on how many of those 10 candidates needed the fallback and is not currently logged separately from the app's own credit-estimate counter.
- **IMAGE-UPLOAD REQUESTS**: up to 10 attempts to `serpapi.com/image` (one per capped candidate) to obtain an `image_id`.
- **CREDIT COST**: not verified against real SerpApi billing. The app's own internal accounting counter (`SerpApiClient.estimateCredits()`, an `isAdvanced ? 3 : 1` heuristic) reported **10** on the canonical live run (`docs/FINAL_VERIFIED_RUN.md`) — this is an app-level estimate, not a confirmed credit charge, and should not be quoted as a verified cost.

## WHY SERPAPI USAGE IS MATERIAL

Every fact the product surfaces — which listings exist, at what price, from which seller, whether the photo matches — comes from a live SerpApi call; there is no persisted "known good/bad" database standing in for it. The visual-verification mechanism specifically cannot exist without a reverse-image search engine — deleting SerpApi removes the entire evidentiary basis of every result, not a convenience layer on top of one. Full necessity argument, including the hostile-judge pass: `docs/DECISION.md` "SERPAPI MOAT" section, `docs/JUDGE_QA.md` Q3.

## TECHNICAL HIGHLIGHTS

- **Real multi-signal fusion, not an LLM summarizing a search result:** price anomaly, seller anomaly, and visual-match signals are each computed independently in deterministic code and combined into one weighted composite score with a full evidence trail per signal (`src/lib/beacontra.ts` `fuseSignals()`). There is no LLM anywhere in the scoring path — a deliberate choice, explained honestly in `docs/JUDGE_QA.md` Q8, that trades "uses an LLM" for "every score is auditable and reproducible."
- **Credit-budget engineering, not just a feature:** an initial implementation called `google_lens` once per every extracted listing with no cap (worst case ~16-41 calls/scan against a 250/month free plan); this was found during review, fixed to cap at 10 calls ordered by price-anomaly-first, and the fix is verifiable directly in the code (`docs/SERPAPI_BUDGET.md`).
- **Competitive originality, proven not asserted:** the closest prior art found across the entire `#BuiltWithSerpApi` gallery (177 structured project entries, directly fetched and audited, `docs/COMPETITIVE_LANDSCAPE.md`) triggered a formal, structured adjudication — delete tests in both directions, a user-job comparison, a 30-second-demo comparison, run independently by two separate parties and converging on the same verdict (`docs/COMPETITIVE_ADJUDICATION.md`).

## GITHUB DESCRIPTION

*(One-liner for the repo's About field)*
> Beacontra cross-checks marketplace listings against your brand's real product photos using live SerpApi search and reverse-image matching — commercial-anomaly signals for Indian D2C brands, not accusations.

## DEMO DESCRIPTION

Full script: `docs/DEMO.md`. Structure: problem (real, sourced numbers) → product (one sentence) → live workflow ending in a visible photo-vs-photo comparison → proactive comparison against the closest existing SerpApi-gallery project → explicit SerpApi-necessity statement → close. Pre-tested product/photo pair (boAt Airdopes 141, MRP ₹4,490) validated live with reference image HTTP 200 OK and canonical run logged in `docs/FINAL_METRICS_DUMP.json`.

## AI TOOLS USED

Three AI coding agents, coordinated by a human throughout: **Claude Code** (research, product selection, architecture documentation, competitive adjudication, code review, this submission package), **OpenCode** (repository scaffolding, core implementation, testing infrastructure, live-integration work), **Gemini CLI** (adversarial red-teaming, UX/demo audits, an independent competitive adjudication, some implementation fixes). Coordination was file-based and asynchronous (`docs/AI_COORDINATION.md`, `docs/TASK_BOARD.md`), not a single agent working alone.

## AI DISCLOSURE

Per the hackathon's own policy ("AI-assisted development is allowed and does not affect judging... List any AI tools used... Developers remain responsible for every submitted component"): this submission was built primarily by the three AI agents named above under human direction — the human set the mission, configured the live SerpApi credentials, and made or approved decisions at checkpoints, but did not personally write the TypeScript, HTML, or most of the documentation. This is disclosed plainly, not minimized, in `docs/JUDGE_QA.md` Q18-19, including how the AI-generated work was verified (automated tests/typecheck/lint/build gates, plus cross-agent adversarial review that caught and fixed real bugs — not a single pass with no checking).

## SETUP NOTES

See `README.md` for the authoritative, tested setup path (env var configuration, `npm install`, `npm run dev`, `npm test`, `npm run serpapi:smoke`).

## KNOWN LIMITATIONS

**Updated 2026-09-18 from the canonical live run (`docs/FINAL_VERIFIED_RUN.md`), computed directly from the run's raw data rather than carried over from an earlier estimate:**
- Scoring weights (price/seller/visual point contributions) are hand-chosen heuristics, not statistically calibrated against a labeled dataset — no such dataset exists to calibrate against. The product is positioned as decision-support, not a certainty score, and the UI avoids percentage-style framing for exactly this reason.
- No real brand owner has used this yet — usefulness is evidenced by a documented market gap (two independent research passes), not validated customer demand.
- `google_lens`'s request-path bugs (wrong parameter name, missing `type`, wrong response path) are fixed and verified. **On the canonical real-product live run** (boAt Airdopes 141, 40 listings, 10 analyzed by Lens per the candidate cap), **zero listings produced a positive visual match** (`matched`/`visual_match`) — all 10 were `no_evidence`/`unavailable`, correctly scored as neutral, not as false anomalies. The mechanism works; for this specific product's marketplace thumbnails, it did not find a positive match to demonstrate on camera. The demo should present this honestly as a real neutral outcome, or use a different product/photo pair known to produce a match, rather than imply the visual signal fired when it didn't.
- **New, from the same canonical run:** the price-anomaly rate (36/40, 90%) is substantially explained by the Shopping query returning listings for *different* boAt Airdopes variants (Gen 2, Elite ANC, 611, Neo, Prime 412, etc.), each compared against the single MRP of the specific variant queried — not by widespread genuinely-suspicious pricing. This is a product-query-specificity gap, not a threshold or language bug (the T-030 language fix is separately confirmed correct and applied). Needs tighter result filtering or a cleaner demo query before the price-anomaly numbers are presented as a clean demonstration.
- The scoring-logic issue (treating "no visual match" as positive mismatch evidence) is fixed and independently verified by direct code reading and by the real run's data — `no_evidence` and `unavailable` are both neutral, non-scoring states. Separately verified on the same run: the seller signal correctly produced **0/40 anomalies** (all `no_authorized_list`, correctly neutral) when no authorized-seller list was supplied.
- T-030 (price-signal wording) is applied and verified in the running code (`moderate_discount`, factual "X% below MRP" wording) — no longer open.
- No takedown-drafting or enforcement-action step exists — output is a review queue for a human, not an end-to-end enforcement workflow (unlike, e.g., CeaseFire's notice-signing step for its own different problem).
