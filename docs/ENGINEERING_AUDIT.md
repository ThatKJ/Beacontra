# Engineering Audit

**Date:** 2026-09-17
**Auditor:** OPENCODE
**Status:** Initial audit - empty repository

---

## Repository State

### What Exists
- ✅ Git repository initialized
- ✅ Coordination files: AI_COORDINATION.md, TASK_BOARD.md, DECISIONS_LOG.md
- ✅ Directory structure: docs/, src/, tests/
- ✅ .gitignore (secrets protected)
- ✅ .env.example (variable names only)
- ✅ SERPAPI_CAPABILITIES.md (133 engines documented)

### What is Missing (Critical)
- ❌ No package.json / build system
- ❌ No TypeScript config
- ❌ No Cloudflare Workers config (wrangler.jsonc)
- ❌ No SerpApi client implementation
- ❌ No caching layer
- ❌ No API routes / handlers
- ❌ No frontend
- ❌ No tests (unit, integration, fixtures)
- ❌ No CI/CD
- ❌ No DEPLOYMENT documentation
- ❌ No DECISION.md (product direction)

### What is Stubbed/Fake
- None (empty repo)

### What is Broken
- None (nothing to break)

---

## Technical Feasibility Gaps

### Gap 1: No SerpApi Integration Layer
**Impact:** HIGH - Core requirement
**Effort:** MEDIUM (2-4 hours for robust client)
**Details:** Need typed client with caching, retry, fixtures, credit tracking

### Gap 2: No Compute/Deployment Target
**Impact:** HIGH - Need to run somewhere
**Effort:** LOW (Cloudflare Workers: 30 min setup)
**Details:** Workers + Pages is ideal for hackathon (free tier, global, TypeScript native)

### Gap 3: No Product Direction
**Impact:** BLOCKING - Cannot implement without DECISION.md
**Effort:** N/A (Claude's responsibility)
**Details:** Need product concept to drive architecture

### Gap 4: No Testing Strategy
**Impact:** MEDIUM - Critical for credit discipline
**Effort:** LOW (Vitest + fixtures: 1 hour)
**Details:** Must separate unit (fixtures) from integration (live)

### Gap 5: No API Key Management
**Impact:** MEDIUM - Need for live testing
**Effort:** LOW (.dev.vars + wrangler secret)
**Details:** Never commit keys; use wrangler secret for deploy

---

## Stack Recommendations (Based on SerpApi Integration Needs)

### Primary Recommendation: Cloudflare Workers + Pages
**Rationale:**
- Native TypeScript, zero config
- KV storage for caching (free tier sufficient for hackathon)
- Edge deployment = low latency to SerpApi globally
- Cron triggers for background jobs (trend monitoring, etc.)
- Queues for async processing (batch searches)
- Pages for frontend (static + functions)
- wrangler CLI for local dev + deploy
- **SerpApi calls stay server-side** (secrets safe)

### Alternative: Node.js + Express + Vercel/Render
**Tradeoffs:** More familiar but less hackathon-optimized; secrets management more manual

### Not Recommended:
- Next.js (overkill, heavier cold starts)
- Python/FastAPI (less edge-native, more infra)
- Supabase Edge Functions (good but Workers better for pure API)
- Client-side SerpApi calls (EXPOSES SECRETS - NEVER DO THIS)

---

## Architecture Decision Points (Pending DECISION.md)

| Decision | Options | Recommendation |
|----------|---------|----------------|
| API Style | REST vs GraphQL vs tRPC | REST (simple, SerpApi is REST) |
| Caching | KV only vs KV + Memory | KV + in-memory (Map) for hot data |
| Auth | None vs Clerk vs Custom JWT | None for hackathon demo (public) |
| Frontend | React + Vite vs HTMX vs Vanilla | React + Vite (team familiarity) |
| State | React Query vs SWR vs Custom | React Query (caching, deduping) |
| Styling | Tailwind vs CSS Modules vs Plain | Tailwind (speed, consistency) |
| Validation | Zod vs Valibot vs Manual | Zod (SerpApi response schemas) |

---

## Credit Discipline Requirements

### Must Implement Before Live Calls:
1. **Request deduplication** - In-flight promise cache (prevent duplicate simultaneous calls)
2. **Response caching** - KV with configurable TTL (1hr default, 24hr for trends)
3. **Fixture system** - JSON files for every engine/response type used
4. **Credit estimator** - Track estimated credits per user flow
5. **Integration test gate** - `npm run test:live` only (not in CI)
6. **Rate limit handling** - Exponential backoff + user-friendly error

### Per-Session Budget Target:
- **Demo flow: ≤ 5 SerpApi calls** (ideally 2-3)
- **Cached repeat views: 0 calls**
- **Development: 0 live calls** (fixtures only)

---

## Next Steps (Priority Order)

1. **Wait for DECISION.md** from Claude (product concept)
2. **Initialize Cloudflare Workers project** (wrangler.jsonc, tsconfig, package.json)
3. **Build SerpApi client** with caching, fixtures, retry
4. **Implement core product workflow** (vertical slice)
5. **Add frontend** for demo
6. **Test end-to-end** with fixtures, then live
7. **Polish UX** for demo readiness

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| No DECISION.md by Day 2 | MEDIUM | HIGH | Start generic foundation (client, caching, infra) |
| SerpApi credits exhausted | LOW | HIGH | Fixtures, caching, strict budgets, monitor usage |
| API changes break parsing | LOW | MEDIUM | Zod schemas, defensive parsing, version pinning |
| Cloudflare deploy issues | LOW | MEDIUM | Test deploy early, use wrangler dev locally |
| Scope creep | HIGH | MEDIUM | Strict TASK_BOARD, vertical slices only |
| Demo fails live | MEDIUM | HIGH | Rehearse, fallback fixtures, error boundaries |