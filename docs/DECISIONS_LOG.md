# Decisions Log

## Format
Each entry: **DATE | DECISION | RATIONALE | AUTHOR | REVERSIBLE?**

---

## 2026-09-17 | Initialize empty repository with coordination structure
**RATIONALE:** Fresh start for hackathon submission. No prior work exists.
**AUTHOR:** OPENCODE
**REVERSIBLE:** Yes (but would lose coordination history)

## 2026-09-17 | Cloudflare Workers + Pages as primary stack recommendation
**RATIONALE:** Native TypeScript, KV caching (free tier), edge deployment, Cron/Queues for async, Pages for frontend, wrangler CLI. Secrets stay server-side. Best fit for SerpApi integration.
**AUTHOR:** OPENCODE
**REVERSIBLE:** Yes (but would delay implementation)

## 2026-09-17 | SerpApi capability research complete: 133 engines cataloged
**RATIONALE:** Verified from official GitHub engine catalog, docs, playground. Identified 7 high-value engine combos for hackathon. India support confirmed (gl=in, hl=hi, google.co.in, city-level locations).
**AUTHOR:** OPENCODE
**REVERSIBLE:** No (factual research)

## 2026-09-17 | Technical feasibility analysis: 7 concepts evaluated, top 3 recommended
**RATIONALE:** Evidence-based scoring on SerpApi dependency, India fit, complexity, credit efficiency, demo wow, differentiation. Top: Local Business Intelligence (26/30), Job Market Analytics (26/30), Price Intelligence (24/30).
**AUTHOR:** OPENCODE
**REVERSIBLE:** Yes (Claude makes final product decision)

## 2026-09-17 | Product decision: BrandLens (internal codename) — visual + commercial marketplace-listing verification for Indian D2C/SME brand owners
**RATIONALE:** Two independently-run research passes (manual competitive audit + a separately-run problem-research agent that never saw the candidate list) converged on the same evidenced gap: no affordable, self-serve, cross-marketplace, reverse-image-based counterfeit-monitoring tool exists for Indian SME brand owners. `google_shopping`/`amazon_product` (listing discovery) + `google_lens` (reverse-image verification) fused with deterministic price/seller heuristics into one ranked, evidence-backed review queue. Full memo: `docs/DECISION.md`. Superseded the initial front-runner (job-offer-scam verification) after direct evidence showed 4+ near-duplicate hackathon projects already exist for that mechanism — decision changed in response to evidence, not defended past its shelf life.
**AUTHOR:** CLAUDE
**REVERSIBLE:** In principle yes, in practice no — full implementation (T-006/7/8) shipped on this decision before this log entry was written.

## 2026-09-17 | Competitive-duplication dispute vs. CeaseFire — resolved KEEP, not PIVOT
**RATIONALE:** Gemini raised a P0 block claiming direct duplication with gallery project CeaseFire, based on a keyword-match script. Escalated by the user to a formal, structured adjudication (delete test, user-job test, 30-second-demo test, anti-wrapper test — `docs/COMPETITIVE_ADJUDICATION.md`). Direct inspection of CeaseFire's actual README/architecture (not just the gallery's one-line description) showed it is a domain-typosquatting/phishing-defense scanner (input: brand domain; output: signed takedown notice) with no confirmed product-listing search, price/seller signals, or `google_lens` usage — a materially different mechanism from ours (input: product name + photo; output: ranked listing-review queue). Gemini independently ran a deeper adjudication from the cloned source and reached the same verdict. Two independent adjudications converging is treated as the strongest available evidence short of an actual judge's ruling.
**AUTHOR:** CLAUDE (parallel: GEMINI, `docs/COMPETITIVE_ADJUDICATION_GEMINI.md`)
**REVERSIBLE:** No — this is a factual finding about a third-party project, not a preference that could be revisited absent new evidence.

## 2026-09-17 | Output language changed from "counterfeit detector" to risk-signal framing; "BrandLens" downgraded to internal codename
**RATIONALE:** The system's three heuristic signals (price/seller/visual) cannot establish legal counterfeit status — only risk/anomaly signals worth human review. Continuing to say "counterfeit detector" publicly would be an unsupported claim, a real legal/reputational exposure, and inconsistent with the product's own designed behavior (never assert a bare verdict, `docs/DECISION.md` risk #3). Applied across `docs/DECISION.md`, `docs/PRODUCT_SPEC.md`; UI/code copy cleanup tracked separately (T-020, T-023). "BrandLens" collides with existing products (per direct instruction) and is being carried as an internal codename only pending a real public name (T-019, non-blocking).
**AUTHOR:** CLAUDE (per user instruction)
**REVERSIBLE:** Yes — this is a wording/naming decision, not a factual or architectural one.