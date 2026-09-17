# Judge QA Simulation

**STATUS: ANSWERED.** Originally scaffolded by GEMINI (T-010) as a question list; answered by CLAUDE once the product and implementation both existed, per the user's role division ("judge Q&A" is a CLAUDE responsibility in the implementation/demo-hardening phase). Sources: `docs/DECISION.md`, `docs/PRODUCT_SPEC.md`, `docs/COMPETITIVE_ADJUDICATION.md`, `docs/RESEARCH.md`, `docs/ARCHITECTURE.md`, `docs/SERPAPI_BUDGET.md`, and direct reading of `src/lib/brandlens.ts`. Every weakness below is stated plainly, not softened — a judge will find these faster than we'd like if we don't name them first.

---

### 1. Why is this useful?
**STRONG FACTUAL ANSWER:** It replaces an unbounded, currently-skipped manual task (a founder occasionally Googling their own product name) with a five-minute ranked review of live marketplace listings, each with concrete evidence (price, seller, visual match) rather than a raw search results page.
**EVIDENCE:** `docs/RESEARCH.md` §6 problem #27 (independently-researched, evidence-cited) documents the exact gap: no affordable, self-serve, cross-marketplace monitoring tool exists for Indian SME brand owners today — only platform-siloed (Amazon Brand Registry) or enterprise-priced (MarqVision, Bustem, retained IP firms) alternatives.
**WEAKNESS IF ANY:** Usefulness is currently un-validated by any real user — no brand owner has used this yet. This is a hackathon MVP's evidence, not a customer's.

### 2. Why now?
**STRONG FACTUAL ANSWER:** The specific legal mechanism this product targets was reaffirmed months ago, not years ago: Delhi HC restricted Flipkart's "latching-on" feature in November 2024 specifically because it enabled counterfeit sellers to list under a genuine brand's product page. BIS raided Amazon and Flipkart warehouses in March 2025.
**EVIDENCE:** `docs/DECISION.md` "WHY NOW" section, sourced to Moneylife/BIS and the EU IP Helpdesk's coverage of the Delhi HC ruling.
**WEAKNESS IF ANY:** "Why now" is true of the underlying problem, not of the technology — `google_lens`'s reverse-image capability isn't new. The honest "why now" is regulatory/legal timing, not a new SerpApi feature.

### 3. Why SerpApi?
**STRONG FACTUAL ANSWER:** Every piece of evidence the product produces — which listings exist, at what price, from which seller, whether the photo matches — comes from a live SerpApi call. There is no persisted database of "known good" or "known bad" listings; delete SerpApi and there is nothing left to show.
**EVIDENCE:** `src/lib/brandlens.ts` — `searchMarketplaceListings()` (`google_shopping`) and `runVisualVerification()` (`google_lens`) are the only two data-acquisition paths in the entire service; everything downstream (`analyzePrice`, `analyzeSeller`, `analyzeVisual`, `fuseSignals`) is pure computation over their output.
**WEAKNESS IF ANY:** None significant — this is the strongest-evidenced answer in this document.

### 4. Why can't Google do this directly?
**STRONG FACTUAL ANSWER:** A manual Google/Shopping search shows one listing at a time to a human, with no price/seller/photo cross-referencing across results and no persistent scoring. This product synthesizes many listings plus a reverse-image check into one ranked, explained output — a search engine doesn't rank "how suspicious is this specific listing," it ranks relevance to a query.
**EVIDENCE:** `docs/DECISION.md` DEMO section states this directly; verifiable by simply trying the equivalent manual search and observing there's no synthesis step.
**WEAKNESS IF ANY:** A sufficiently patient human with 15 open browser tabs could reconstruct the same conclusion manually — the product's value is speed and consistency, not doing something literally impossible for a person.

### 5. Why can't ChatGPT do this?
**STRONG FACTUAL ANSWER:** An LLM alone has no access to today's live marketplace listings or a way to fetch and compare two specific images against each other — both require live external tool calls (SerpApi Shopping + Lens), not training-data knowledge. Testably: ask a chat-only LLM to check today's Flipkart price for a specific SKU and it will refuse or hallucinate a plausible-sounding but unverifiable number.
**EVIDENCE:** `docs/RESEARCH.md` §10 (hostile judge red team) raises this exact question and answers it the same way.
**WEAKNESS IF ANY:** An LLM *with* live tool access (e.g., via the SerpApi MCP server, `docs/RESEARCH.md` §3) could in principle approximate parts of this — the honest distinction is "chat-only LLM" vs. "an LLM with the same tools we built," and our answer only fully holds against the former. We don't currently use an LLM at all in the scoring path (see Q8) — the comparison is with a hypothetical LLM-based competitor, not a claim that LLMs can't ever be given search tools.

### 6. Who actually has this problem?
**STRONG FACTUAL ANSWER:** Founders/small ops teams at Indian D2C or FMCG brands — big enough to be worth counterfeiting, too small to afford enterprise brand-protection SaaS.
**EVIDENCE:** `docs/PRODUCT_SPEC.md` PRIMARY USER; independently corroborated in `docs/RESEARCH.md` §6 problem #27 (Trademarkia, Kayser Legal sources describing the exact SME affordability gap).
**WEAKNESS IF ANY:** No named real brand has been interviewed or has used the product. This is evidence of a documented market gap, not validated demand from a specific customer.

### 7. What is technically difficult here?
**STRONG FACTUAL ANSWER:** Three things, concretely, not abstractly: (1) product-variant/title matching across sellers with inconsistent listing titles; (2) combining three independently-noisy signals (price, seller, visual) into one defensible ranked score without a labeled training set to calibrate against; (3) controlling SerpApi credit spend — an unbounded per-listing `google_lens` loop was found and fixed to cap at the top 8-10 most price-anomalous candidates rather than every result (`docs/SERPAPI_BUDGET.md`).
**EVIDENCE:** `src/lib/brandlens.ts` `fuseSignals()` (real weighted-scoring code, not a stub) and the `MAX_LENS_CALLS` cap.
**WEAKNESS IF ANY:** The scoring weights (35/25/40-point contributions) are hand-picked heuristics, not learned or statistically validated — stated plainly in Q11 below, not hidden here.

### 8. Where does AI actually matter?
**STRONG FACTUAL ANSWER:** Deliberately, nowhere in the scoring pipeline itself — every signal (`analyzePrice`, `analyzeSeller`, `analyzeVisual`, `fuseSignals`) is plain deterministic TypeScript, not an LLM call. This is an intentional design choice, not an oversight: it makes every score auditable and reproducible, and directly defends against the "AI wrapper" criticism raised during our own internal red-team (`docs/DECISION_CHALLENGES.md`, `docs/GEMINI_HACKATHON_STANDARDS.md`'s anti-wrapper criteria, which this design explicitly satisfies via deterministic decision-support logic).
**EVIDENCE:** `docs/ARCHITECTURE.md` "Where there is no LLM" section; direct code reading confirms it.
**WEAKNESS IF ANY — stated honestly, not softened:** if a judge is specifically looking for "AI" as in an LLM, this project doesn't have one in its core path. The project is entered in the **Commerce & Market Intelligence** track, not **AI Agents**, so this is a defensible fit, not a gap against the actual track requirements — but it's worth naming directly rather than letting a judge discover it and wonder why it wasn't mentioned. `google_lens` and `google_shopping` are themselves Google-side ML systems we call, which is real technical dependency, just not an LLM we operate ourselves.

### 9. What happens when search results disagree?
**STRONG FACTUAL ANSWER:** They don't get silently averaged into one number without explanation — each signal keeps its own `details` string and `anomalyType`, and the UI shows all three independently alongside the fused score, so a human can see exactly which signal(s) drove a high score and judge for themselves whether to trust it.
**EVIDENCE:** `public/index.html` `signalCard()` renders Price/Seller/Visual signals as separate cards, not folded into an opaque number.
**WEAKNESS IF ANY (updated this session — the original issue is fixed, a narrower one remains):** an earlier bug (`docs/TASK_BOARD.md` T-026) that scored "no visual match" as positive mismatch evidence has been fixed and independently verified by reading the current code — `no_evidence` and `unavailable` are both now neutral, non-scoring states, distinct from an actual `unverified_photo_source` finding. What remains open: the fix's correctness was verified on a live matrix test using the Google logo, not an ordinary marketplace product photo — the mechanism is confirmed to work, but its real-world hit rate on typical product images (the actual demo use case) hasn't been separately confirmed yet.

### 10. What happens when data is stale?
**STRONG FACTUAL ANSWER:** SerpApi's own server-side cache is 1 hour by default; results reflect marketplace state as of that window, not real-time-to-the-second. The product doesn't claim otherwise.
**EVIDENCE:** `docs/SERPAPI_BUDGET.md` caching policy section.
**WEAKNESS IF ANY (updated — fixed):** a live/cached/fixture indicator was identified as missing and has since been shipped (`dataSource: 'live' | 'fixture'` surfaced in the UI, verified in `src/lib/brandlens.ts`/`public/index.html`) — this is no longer an open gap.

### 11. What is your confidence methodology?
**STRONG FACTUAL ANSWER:** A weighted point system (price anomaly worth up to 35, seller anomaly up to 25, visual signal up to 40 depending on Lens-reported confidence) summed to a 0-100 composite score, banded into `review_urgently` (≥70) / `review` (≥50) / `monitor` (≥30) / `likely_genuine` (below).
**EVIDENCE:** `src/lib/brandlens.ts` `fuseSignals()`, read directly, not inferred from documentation.
**WEAKNESS IF ANY — the most important one to say out loud before a judge finds it:** these weights and thresholds are hand-chosen, not statistically calibrated against any ground-truth labeled dataset of confirmed-genuine vs. confirmed-counterfeit listings (none exists to calibrate against). This is presented as a heuristic decision-support tool, explicitly not a statistically validated classifier — which is also why the product's own language deliberately avoids "92% counterfeit"-style false precision (`docs/COMPETITIVE_ADJUDICATION.md` language-change section) in favor of a review-priority framing. Relatedly: the visual signal's real-world reliability on ordinary product photos (vs. the atypical test image used in verification) hasn't been separately confirmed — see Q9.

### 12. What evidence proves this [is a real problem]?
**STRONG FACTUAL ANSWER:** Named, dated, sourced facts, not a vague market-size claim: Delhi HC's November 2024 "latching-on" ruling against Flipkart; BIS's March 2025 raids on Amazon and Flipkart warehouses (specific seizure amounts, ₹70 lakh and ₹6 lakh); Meesho's own disclosure of removing 4.2 million counterfeit listings in six months.
**EVIDENCE:** All three cited with URLs in `docs/DECISION.md`/`docs/RESEARCH.md` §6.
**WEAKNESS IF ANY:** The often-cited aggregate figures ("35% of urban Indian consumers," "$58.7B counterfeit market") are explicitly flagged in our own research as single-sourced or AI-search-summary-derived, not independently opened at a primary source — we chose not to lead with them for exactly this reason, and a judge who does find them elsewhere should be told the same caveat we gave ourselves.

### 13. Why didn't an existing company already solve it?
**STRONG FACTUAL ANSWER:** Something adjacent exists, but not this: enterprise brand-protection SaaS (MarqVision, Bustem, IPMoat, LdotR) solve a similar problem professionally, but at enterprise pricing with infrastructure (web crawling, human review teams) far beyond what an Indian D2C brand doing ₹1-10 crore in revenue can justify. The gap is specifically the SME-affordable, self-serve tier.
**EVIDENCE:** `docs/COMPETITIVE_LANDSCAPE.md`, `docs/RESEARCH.md` §6 problem #27 (independently corroborated by a second research pass citing the same gap).
**WEAKNESS IF ANY:** "Nobody built the cheap version yet" is also consistent with "the cheap version isn't commercially viable" — we haven't proven a sustainable business here, only a hackathon-scoped technical gap.

### 14. How is this different from CeaseFire (the closest competitor found)?
**STRONG FACTUAL ANSWER:** CeaseFire is a domain-typosquatting/phishing-defense scanner — input is a brand *domain*, it generates ~126 lookalike-domain candidates, DNS-prefilters them, sweeps 10 surfaces for survivors, and ends in a signed takedown notice. It has no product-listing search, no price/seller signals, and — per an independent, deeper inspection of its actual cloned source — no confirmed `google_lens`/reverse-image usage at all. This product's input is a product name *and photo*, its mechanism is live listing search + per-listing reverse-image verification, and its output is a ranked review queue, not a takedown notice.
**EVIDENCE:** `docs/COMPETITIVE_ADJUDICATION.md` (14-dimension comparison, 10 DIFFERENT / 3 partial-overlap-at-category-level / 0 SAME) and `docs/COMPETITIVE_ADJUDICATION_GEMINI.md` (independent, convergent verdict).
**WEAKNESS IF ANY:** Both operate in the same coarse "brand protection" market category, and CeaseFire is a materially more mature codebase (3,800+ backend LOC, 4,800+ frontend LOC, 194 tests) if a judge inspects both repos side by side — a judge could form a first impression of overlap before reading the differentiation, which is exactly why the demo script (`docs/DEMO.md`) addresses this proactively rather than waiting to be asked.

### 15. How many SerpApi calls does a user action use?
**STRONG FACTUAL ANSWER:** One `google_shopping` call per scan, plus up to 10 `google_lens` calls (capped, ordered by price-anomaly-first) — exactly 11 engine search calls per scan (plus up to 10 image-upload attempts to obtain `image_id`). Beacontra performs Lens analysis on the top 10 candidate listings to bound API usage; the remaining listings retain commercial price/source evidence.
**EVIDENCE:** `docs/SERPAPI_BUDGET.md`, and the `MAX_LENS_CALLS = 10` constant read directly from `src/lib/beacontra.ts`.
**WEAKNESS IF ANY:** None significant — this was an identified risk that was found and fixed, and the fix is verifiable in the code, not just claimed.

### 16. What happens when the API fails?
**STRONG FACTUAL ANSWER:** A single listing's `google_lens` call failing (timeout, rate limit, malformed response) degrades that one listing's visual signal to "no evidence" or "unavailable," not a crashed scan — `runVisualVerification()` catches and returns `emptyLensEvidence()` rather than propagating the error. A `google_shopping` failure surfaces as a typed `SerpApiError` with the correct HTTP status, not a silent empty result.
**EVIDENCE:** `src/lib/beacontra.ts` try/catch in `runVisualVerification()`; `src/index.ts` error handling for `SerpApiError`.
**WEAKNESS IF ANY:** Partial-failure states (e.g., 3 of 10 Lens calls fail) are not distinctly surfaced to the end user beyond each affected listing's own signal — there's no scan-level "N of M checks completed" indicator.

### 17. What did YOU build rather than API providers?
**STRONG FACTUAL ANSWER:** SerpApi provides raw search/image data; we built the listing-extraction/normalization layer, the three independent signal analyzers, the weighted fusion/scoring algorithm, the credit-control cap, the caching/retry/fixture infrastructure, and the evidence-first UI. None of that exists in SerpApi's API response — it's the product's own logic, verifiable by reading `src/lib/beacontra.ts` directly rather than taking the claim on faith.
**EVIDENCE:** `docs/ARCHITECTURE.md` component breakdown.
**WEAKNESS IF ANY:** None significant beyond what's already disclosed above (heuristic, uncalibrated weights).

### 18. Which portion was vibe-coded?
**STRONG FACTUAL ANSWER, disclosed honestly rather than minimized:** All of it, in the sense that this entire repository was built by AI tools (Claude Code for research/product strategy/architecture review/documentation/demo-submission review; OpenCode for implementation/SerpApi integration/testing/debugging/technical hardening; Gemini for independent red-team/competitive analysis/QA/claim verification/UX review; GPT-6 Astra for UI/UX redesign, interaction design, frontend polish, responsive/accessibility review; ChatGPT for prompt design, research guidance, project review, coordination strategy, submission guidance) working under a human's direction, with the human setting direction, configuring the real SerpApi key, and making final calls at decision points. This is disclosed per the hackathon's own AI-assisted-development policy, which explicitly allows this and requires disclosure, not concealment.
**EVIDENCE:** Full git history (every commit) shows this process; `docs/AI_COORDINATION.md`/`docs/TASK_BOARD.md` document the multi-agent coordination in real time, not reconstructed after the fact; `README.md`/`docs/SUBMISSION.md` "AI TOOLS USED" sections list the same five tools and roles.
**WEAKNESS IF ANY:** This is an unusually heavy AI-development story even by hackathon standards — the honest framing is "five AI tools, cross-checking and red-teaming each other's work under human direction," not "one prompt produced a finished product," and the submission should say exactly that, not a softened version.

### 19. How did you verify AI-generated code?
**STRONG FACTUAL ANSWER:** Automated tests (68 passing as of this session, fixture-based, zero live credits by default), typecheck, lint, and build gates on every change; and — more unusually — cross-agent adversarial review: Gemini's UX audit caught a real P0 (missing visual comparison in the UI, fixed); Gemini's competitive-duplication challenge forced a full forensic adjudication rather than being waved off; Claude's code review caught two real logic bugs (a seller-signal default that flagged every listing when no allowlist was given; an uncapped, credit-unsafe Lens-call loop) that were then fixed and verified in the next commit, not just noted and forgotten.
**EVIDENCE:** `docs/TASK_BOARD.md` T-006 code-review notes → confirmed fixed by re-reading the code in this session; `docs/GEMINI_UX_AUDIT.md` P0 finding → confirmed fixed (T-021); the full `docs/DECISION_CHALLENGES.md` back-and-forth.
**WEAKNESS IF ANY:** No human line-by-line code review has happened outside of this AI-to-AI review process — the human's role has been direction-setting and configuring the live API key, not manually auditing TypeScript. This is disclosed, not hidden, per Q18's answer above.
