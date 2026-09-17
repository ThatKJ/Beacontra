# CLAUDE.md — guidance for AI agents working in this repo

This repo is built collaboratively by **three AI coding agents** (Claude Code, OpenCode, Gemini CLI) under one human's direction, coordinating asynchronously through shared markdown files rather than a single agent working alone. If you're picking this up fresh, read in this order before changing anything:

1. `docs/AI_COORDINATION.md` — current status, per-agent heartbeats, known blockers. **Read this first, every session.**
2. `docs/TASK_BOARD.md` — the task list. Grep `^### T-` for the current max ID before adding a new task (two task-ID collisions have already happened this project — see the note at the old T-023/T-024 entries).
3. `docs/DECISION.md` and `docs/PRODUCT_SPEC.md` — what's being built and why. Don't re-litigate the product decision without new evidence; it survived a full formal adjudication (`docs/COMPETITIVE_ADJUDICATION.md`).
4. `docs/DECISIONS_LOG.md` — the handful of decisions that are actually locked, with rationale.

## What this project is

A SerpApi India Hackathon 2026 submission (deadline Oct 5, 2026, 23:59 IST). Product (internal codename **BrandLens** — collides with existing products, do not build brand identity around this name, see `docs/TASK_BOARD.md` T-019): a visual + commercial cross-verification tool for Indian D2C/SME brand owners, checking marketplace listings (`google_shopping`/`amazon_product`) against a brand's official product photo via reverse-image matching (`google_lens`), fusing price/seller/visual signals into a ranked review queue.

## Coordination protocol

- All agents write to coordination files; **read before writing, never blind-overwrite.** If a file changed since you last read it, that's usually another agent's legitimate work — incorporate it, don't revert it.
- `docs/TASK_BOARD.md` is the single source of task truth. `docs/DECISIONS_LOG.md` captures irreversible decisions with rationale.
- Commit in reasonably-sized, meaningful units referencing task IDs — the hackathon's own judging criteria say judges may inspect repository history, not just a final snapshot.
- Update your own heartbeat section in `docs/AI_COORDINATION.md` when you make progress; don't leave stale "awaiting X" text once X has happened.
- **Don't trust another agent's "DONE" marker without spot-checking the actual code/file.** This project has caught real bugs this way (a seller-signal logic error, an uncapped credit-cost loop, a missing live/fixture UI indicator) — verification, not politeness, is the norm here.

## Hard rules (do not violate)

- **Never ask for or expose the SerpApi key in chat/output.** It lives in `.env` (gitignored) or as a Wrangler secret in production. Check `test -f .env && grep -q SERPAPI .env` if you need to know *whether* a key exists — never `cat` or print its value.
- **Never commit `.env`, `.dev.vars`, or any file containing a real credential.**
- **Language discipline:** the product cannot and does not establish counterfeit status — it produces risk/anomaly signals for human review. Don't reintroduce "counterfeit detector," "fraud," "verified counterfeit," etc. into user-facing copy. Use "commercial anomaly," "brand-risk signal," "listing requiring review." See `docs/COMPETITIVE_ADJUDICATION.md`'s language-change section for the full rationale.
- **Credit discipline:** `google_lens` calls are capped at 10 per scan, ordered price-anomaly-first (`src/lib/brandlens.ts`, `MAX_LENS_CALLS`). Don't remove this cap without re-reading `docs/SERPAPI_BUDGET.md` — an earlier uncapped version could burn ~16-41 calls per scan against a 250/month free-tier budget.
- **Never present fixture/cached data as live** in the UI or a demo. `BrandLensScanResult.dataSource` (`'live' | 'fixture'`) exists specifically to prevent this — surface it, don't suppress it.

## Known open items as of the last update to this file

Check `docs/TASK_BOARD.md` for current truth, but as of this writing:
- **T-017** (P0): `google_lens`'s behavior against real cropped/watermarked/altered images has not been empirically verified, despite later work assuming it's reliable. A real key is configured — this should actually be run (`npm run serpapi:smoke` or `test:live`), not deferred again.
- **T-026** (P1): `analyzeVisual()` in `src/lib/brandlens.ts` treats "Lens found zero matches" as positive evidence of a product mismatch (`different_product`, medium confidence, +25 score) rather than as absence of evidence. This overclaims what the signal supports.
- **T-019** (P2, non-blocking): the product needs a real public name before final submission.

## Running things

- `npm test` — fixture-based, zero live SerpApi credits, safe to run anytime.
- `npm run typecheck` / `npm run lint` / `npm run build` — standard gates, safe to run anytime.
- `npm run serpapi:smoke` / `npm run test:live` — **spends real SerpApi credits** if a key is configured. Run intentionally, not as part of routine iteration.
- `npm run dev` — Cloudflare Workers local dev server at `http://localhost:8787`.

## Full documentation map

Research → decision → build, in reading order: `docs/RESEARCH.md` → `docs/COMPETITIVE_LANDSCAPE.md` → `docs/DECISION.md` → `docs/COMPETITIVE_ADJUDICATION.md` (+ the independent `docs/COMPETITIVE_ADJUDICATION_GEMINI.md`) → `docs/PRODUCT_SPEC.md` → `docs/ARCHITECTURE.md` → `docs/SERPAPI_BUDGET.md` → `docs/DEMO.md` → `docs/SUBMISSION.md`. Adversarial/QA trail: `docs/DECISION_CHALLENGES.md`, `docs/GEMINI_*.md`, `docs/JUDGE_QA.md`.
