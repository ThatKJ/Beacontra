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
**STATUS:** TODO
**FILES:** package.json, wrangler.jsonc, tsconfig.json, src/
**DEPENDENCIES:** T-001, DECISION.md exists
**ACCEPTANCE CRITERIA:**
- [ ] Initialize chosen framework (Cloudflare Workers recommended)
- [ ] Configure TypeScript, linting, testing
- [ ] Set up SerpApi client with caching/retry
- [ ] Create development fixtures for testing without live credits

### T-006: Core Product Implementation (post-DECISION.md)
**OWNER:** OPENCODE
**STATUS:** TODO
**FILES:** src/
**DEPENDENCIES:** T-005
**ACCEPTANCE CRITERIA:**
- [ ] Implement smallest real end-to-end workflow
- [ ] SerpApi integration is material (not decorative)
- [ ] Structured processing layer transforms raw data
- [ ] Provenance tracking for results
- [ ] Error handling for all failure modes

### T-007: Testing & Verification
**OWNER:** OPENCODE
**STATUS:** TODO
**FILES:** tests/, vitest.config.ts
**DEPENDENCIES:** T-006
**ACCEPTANCE CRITERIA:**
- [ ] Unit tests (fixtures, no live credits)
- [ ] Integration tests (gated, intentional runs)
- [ ] Typecheck passes
- [ ] Build succeeds
- [ ] Lint passes

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
**STATUS:** IN_PROGRESS
**PRIORITY:** P0
**FILES:** docs/RESEARCH.md, docs/DECISION.md, docs/PRODUCT_SPEC.md, docs/COMPETITIVE_LANDSCAPE.md
**DEPENDENCIES:** None
**ACCEPTANCE CRITERIA:**
- [x] Verify official hackathon rules directly from source (rules.html + index) — done, see docs/RESEARCH.md §1 once written
- [x] Read OPENCODE's SERPAPI_CAPABILITIES.md and TECHNICAL_FEASIBILITY.md as input (not duplicating)
- [ ] Independent competitive-saturation audit (#BuiltWithSerpApi, GitHub, Devpost) — running in background
- [ ] Independent evidence-backed Indian problem research (25-30 problems) — running in background
- [ ] 20-idea generation, elimination to top 8, scoring, competitor-duplication test on top 5, hostile judge red team
- [ ] Define the core problem and user base
- [ ] Confirm SerpApi is fundamentally necessary to the solution
- [ ] Prove this is not just an "AI Wrapper" around basic search
- [ ] Create docs/DECISION.md, docs/PRODUCT_SPEC.md
**NOTE:** OPENCODE's TECHNICAL_FEASIBILITY.md top picks (Local Business Intel, Job Market Analytics, Price Intelligence) score well on SerpApi-dependency/feasibility but 2 of them sit in categories the hackathon brief explicitly flags as saturation risks (generic price tracker, generic travel-adjacent dashboards) and lean toward "aggregate + dashboard" rather than a sharp non-obvious insight. CLAUDE is running an independent competitive audit before finalizing — may keep one of these with a sharper wedge, or select a different concept. Will reconcile explicitly in DECISION.md.

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