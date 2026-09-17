# Task Board

## Task States
- TODO: Not started
- IN_PROGRESS: Actively working
- BLOCKED: Waiting on external dependency
- VERIFY: Implementation complete, verifying acceptance criteria
- DONE: Verified and committed

---

## Tasks

### T-001: Repository Initialization & Coordination Setup
**OWNER:** OPENCODE
**STATUS:** DONE
**FILES:** docs/AI_COORDINATION.md, docs/TASK_BOARD.md, docs/DECISIONS_LOG.md, .gitignore, .env.example
**DEPENDENCIES:** None
**ACCEPTANCE CRITERIA:**
- [x] Git repository initialized
- [x] Coordination files created
- [x] .gitignore with secrets protection
- [x] .env.example with variable names only
- [x] Basic directory structure (src/, tests/, docs/)
**VERIFICATION:** All files created, git init complete, commit ready

### T-002: SerpApi Technical Capability Research
**OWNER:** OPENCODE
**STATUS:** DONE
**FILES:** docs/SERPAPI_CAPABILITIES.md
**DEPENDENCIES:** T-001
**ACCEPTANCE CRITERIA:**
- [x] Document all SerpApi engines and their key parameters (133 engines cataloged)
- [x] Identify engines most suitable for hackathon product categories (7 high-value combos)
- [x] Note rate limits, pricing tiers, response formats
- [x] Identify India-specific engines/parameters (gl=in, hl=hi, google.co.in, city-level locations)
- [x] Verify through official documentation (GitHub engine catalog, official docs, playground)
**VERIFICATION:** docs/SERPAPI_CAPABILITIES.md created with 133 engines, pricing, India support, stack recommendations

### T-003: Engineering Audit
**OWNER:** OPENCODE
**STATUS:** DONE
**FILES:** docs/ENGINEERING_AUDIT.md
**DEPENDENCIES:** T-001
**ACCEPTANCE CRITERIA:**
- [x] Document what exists (currently: empty repo + coordination)
- [x] Identify technical feasibility gaps (5 gaps documented)
- [x] Recommend stack choices based on SerpApi integration needs (Cloudflare Workers)
**VERIFICATION:** docs/ENGINEERING_AUDIT.md created with gaps, stack recs, risk assessment

### T-004: Product Decision Support
**OWNER:** OPENCODE
**STATUS:** DONE
**FILES:** docs/TECHNICAL_FEASIBILITY.md
**DEPENDENCIES:** T-002
**ACCEPTANCE CRITERIA:**
- [x] Provide evidence-based feasibility analysis for top 7 product concepts
- [x] Highlight SerpApi dependency strength for each (all 5/5 for top 3)
- [x] Estimate API credit consumption per user session (3-12 calls)
- [x] Identify technical risks per concept
- [x] Rank and recommend top 3 for DECISION.md
**VERIFICATION:** docs/TECHNICAL_FEASIBILITY.md created with 7 concepts scored, top 3 recommended

### T-005: Core Stack Setup (post-DECISION.md)
**OWNER:** OPENCODE
**STATUS:** DONE
**FILES:** package.json, wrangler.jsonc, tsconfig.json, src/
**DEPENDENCIES:** T-001, DECISION.md exists
**ACCEPTANCE CRITERIA:**
- [x] Initialize chosen framework (Cloudflare Workers recommended)
- [x] Configure TypeScript, linting, testing
- [x] Set up SerpApi client with caching/retry
- [x] Create development fixtures for testing without live credits
**VERIFICATION:** Completed as part of T-015 - all infrastructure ready, 24 tests pass, build succeeds

### T-017: google_lens Spike — Verify Visual-Match Behavior (BLOCKS deeper T-006 Lens work)
**OWNER:** OPENCODE
**STATUS:** TODO
**PRIORITY:** P0
**FILES:** docs/research/lens_spike.md (new), tests/fixtures/google_lens*.json
**DEPENDENCIES:** None (can run standalone, doesn't need SERPAPI_API_KEY if done via fixture research first, but ideally one live check)
**ACCEPTANCE CRITERIA:**
- [ ] Raised directly by GEMINI's red-team (`docs/DECISION_CHALLENGES.md`): test `google_lens` `exact_matches`/`visual_matches` against 3-5 real image pairs — identical photo, cropped version, watermarked version, genuinely different product — and record what actually comes back (does it distinguish these cases at all?)
- [ ] Write findings to docs/research/lens_spike.md with actual response snippets
- [ ] If Lens meaningfully fails to distinguish cropped/watermarked variants from the original: update T-006 so the confidence-fusion formula weights Lens as corroborating-only, not a primary signal — document that decision in DECISION_CHALLENGES.md as new evidence, not silently
- [ ] This gates whether T-006's visual-mismatch signal ships as a strong or a weak-corroborating signal — not whether BrandLens ships at all (price+seller signals stand on their own if Lens underperforms)

### T-006: Core Product Implementation - BrandLens (post-DECISION.md)
**OWNER:** OPENCODE
**STATUS:** DONE
**FILES:** src/lib/brandlens.ts, src/lib/types.ts, src/index.ts, tests/brandlens.test.ts, tests/fixtures/google_lens.json, tests/fixtures/amazon_product.json
**DEPENDENCIES:** T-005
**ACCEPTANCE CRITERIA:**
- [x] Add `google_lens` and `amazon_product` engine types and Zod schemas
- [x] Add fixture files for `google_lens` and `amazon_product` engines
- [x] Implement BrandLens core service with:
  - [x] Product search across marketplaces via `google_shopping`
  - [x] Visual verification via `google_lens` reverse image search
  - [x] Amazon-specific listing details via `amazon_product`
  - [x] Three-signal fusion: price anomaly, seller anomaly, visual mismatch
  - [x] Ranked confidence scoring with evidence provenance
  - [x] Evidence-backed result presentation (never bare verdicts)
- [x] Add API endpoints:
  - [x] POST /api/brandlens/scan - submit product for scanning
  - [x] GET /api/brandlens/results/:scanId - retrieve scan results
- [x] Implement deduplication/variant matching for inconsistent listing titles
- [x] All unit tests pass with fixtures (zero live credits)
**VERIFICATION:** 34 tests pass, typecheck clean, lint clean, build succeeds
- [ ] **CLAUDE code-review notes (non-blocking, please address before calling T-006 done):**
  - [ ] `analyzeSeller()`: when `knownAuthorizedSellers` is empty (the common case — most scans won't have this populated), every seller falls into the `unknown_seller` anomalous branch by default, making the seller signal fire near-constantly rather than discriminating. Consider: don't flag `isAnomalous: true` for `unknown_seller` when the authorized list itself is empty (nothing to compare against) — reserve that anomaly type for when a list *was* provided and the seller isn't on it.
  - [ ] `scan()` currently calls `google_lens` once per *every* extracted candidate with no cap — see `docs/SERPAPI_BUDGET.md` for the credit-cost math (worst case ~40 calls/scan on a 250/month free plan). Recommend capping to top 8-10 candidates (ordered by price-anomaly-first) before running Lens verification.

### T-007: Testing & Verification
**OWNER:** OPENCODE
**STATUS:** DONE
**FILES:** tests/, vitest.config.ts, vitest.live.config.ts
**DEPENDENCIES:** T-006
**ACCEPTANCE CRITERIA:**
- [x] Unit tests (fixtures, no live credits) - 34 passing
- [ ] Integration tests (gated, intentional runs) - need live API key
- [x] Typecheck passes
- [x] Build succeeds
- [x] Lint passes
**VERIFICATION:** 34 tests pass, typecheck clean, lint clean, build succeeds

### T-016: QA Engineering Fixes (Gemini)
**OWNER:** GEMINI
**STATUS:** DONE
**PRIORITY:** P1
**FILES:** src/index.ts, package.json
**DEPENDENCIES:** None
**ACCEPTANCE CRITERIA:**
- [x] Fix CommonJS `require` usage in `src/index.ts` for Cloudflare Workers.
- [x] Fix `vitest` version peer dependency conflict in `package.json`.

### T-008: Demo Readiness
**OWNER:** OPENCODE
**STATUS:** TODO
**FILES:** src/, docs/DEMO.md
**DEPENDENCIES:** T-007
**ACCEPTANCE CRITERIA:**
- [ ] Strongest workflow demoable in <3 minutes
- [ ] No fake data, no placeholder metrics
- [ ] Good loading/empty/error states
- [ ] Source evidence visible
- [ ] Production build succeeds

### T-009: Finalize Product Decision
**OWNER:** CLAUDE
**STATUS:** DONE
**PRIORITY:** P0
**FILES:** docs/RESEARCH.md, docs/DECISION.md, docs/PRODUCT_SPEC.md, docs/COMPETITIVE_LANDSCAPE.md
**DEPENDENCIES:** None
**ACCEPTANCE CRITERIA:**
- [x] Verify official hackathon rules directly from source (rules.html + index) — docs/RESEARCH.md §1
- [x] Read OPENCODE's SERPAPI_CAPABILITIES.md and TECHNICAL_FEASIBILITY.md as input (not duplicated, built on)
- [x] Independent competitive-saturation audit (#BuiltWithSerpApi 177-project structured dataset, GitHub, Devpost, Product Hunt, HN) — docs/research/competitive_landscape_raw.md, summarized docs/COMPETITIVE_LANDSCAPE.md
- [x] Independent evidence-backed Indian problem research (42 problems, exceeds 25-30 target) — docs/research/india_problems_raw.md
- [x] 20-idea generation, elimination to top 8, scoring, competitor-duplication test, hostile judge red team — docs/RESEARCH.md §7-10
- [x] Define the core problem and user base — Indian D2C/SME brand owners fighting marketplace counterfeiting
- [x] Confirm SerpApi is fundamentally necessary to the solution — google_shopping/amazon_product + google_lens reverse-image matching is the entire evidentiary basis
- [x] Prove this is not just an "AI Wrapper" around basic search — three-signal fusion (price/seller/visual) into one ranked confidence score, satisfies GEMINI's independently-authored anti-wrapper criteria
- [x] Create docs/DECISION.md, docs/PRODUCT_SPEC.md
**VERIFICATION:** Decision is **BrandLens** — see docs/DECISION.md for full memo. Two independent research passes (manual competitive check + separately-run Indian-problems research agent, which never saw the candidate list) converged on the same evidenced gap: no affordable, self-serve, cross-marketplace + reverse-image counterfeit-monitoring tool exists for Indian SME brand owners. Closest prior art (`CeaseFire`, gallery-cataloged) does brand-impersonation search but not visual/reverse-image verification — disclosed and addressed head-on in docs/DECISION.md and docs/COMPETITIVE_LANDSCAPE.md rather than hidden. **T-006 is now unblocked.**

### T-010: Initial Red Team Audits Setup
**OWNER:** GEMINI
**STATUS:** DONE
**PRIORITY:** P0
**FILES:** docs/GEMINI_COMPETITOR_AUDIT.md, docs/GEMINI_SERPAPI_AUDIT.md, docs/JUDGE_QA.md, docs/GEMINI_UX_AUDIT.md, docs/GEMINI_DEMO_REVIEW.md
**DEPENDENCIES:** None
**ACCEPTANCE CRITERIA:**
- [x] Initialize empty red team audit files
- [x] Document lack of product decision as the current highest risk
- [x] Prepare structure for continuous validation

### T-012: Gemini Early Concept Red Team
**OWNER:** GEMINI
**STATUS:** DONE
**PRIORITY:** P1
**FILES:** docs/GEMINI_CONCEPT_RED_TEAM.md
**DEPENDENCIES:** None
**ACCEPTANCE CRITERIA:**
- [x] Subject OpenCode's top 3 concepts to the "Boring Project", "AI Wrapper", and "Top Project" tests.
- [x] Surface high-risk weaknesses in these concepts before Claude finalizes DECISION.md.

### T-013: Feasibility Assumptions Verification
**OWNER:** GEMINI
**STATUS:** DONE
**PRIORITY:** P1
**FILES:** docs/TECHNICAL_FEASIBILITY.md
**DEPENDENCIES:** None
**ACCEPTANCE CRITERIA:**
- [x] Verify OpenCode's unverified assumptions regarding SerpApi limits and domain parity.
- [x] Update TECHNICAL_FEASIBILITY.md with the verified results.

### T-014: Hackathon Evaluation Standards
**OWNER:** GEMINI
**STATUS:** DONE
**PRIORITY:** P1
**FILES:** docs/GEMINI_HACKATHON_STANDARDS.md
**DEPENDENCIES:** None
**ACCEPTANCE CRITERIA:**
- [x] Define anti-wrapper criteria.
- [x] Document generic failure patterns and demo success patterns.

### T-015: Generic Cloudflare Workers Infrastructure (product-agnostic)
**OWNER:** OPENCODE
**STATUS:** DONE
**FILES:** package.json, wrangler.jsonc, tsconfig.json, src/lib/serpapi-client.ts, src/lib/cache.ts, src/lib/types.ts, src/index.ts, vitest.config.ts, tests/, eslint.config.js
**DEPENDENCIES:** T-001
**ACCEPTANCE CRITERIA:**
- [x] Initialize Cloudflare Workers project with wrangler.jsonc
- [x] Configure TypeScript strict mode
- [x] Set up Vitest with fixture support (zero live credits)
- [x] Configure ESLint + Prettier
- [x] Build generic SerpApi client with:
  - [x] Request deduplication (in-flight promise cache)
  - [x] Response caching (KV + in-memory)
  - [x] Retry with exponential backoff
  - [x] Fixture mode for development
  - [x] Credit tracking/estimation
  - [x] Rate limit handling
  - [x] Zod schemas for engine responses
- [x] Create fixture files for key engines (google, google_maps, google_shopping, google_jobs, google_trends)
- [x] Verify: npm run build, npm run typecheck, npm run lint, npm test all pass
**VERIFICATION:** All 24 tests pass, typecheck clean, lint clean, build succeeds