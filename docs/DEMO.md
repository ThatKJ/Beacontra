# Demo Script (target: 2:30-2:50, hard limit 3:00)

**Status: draft, close to rehearsable — updated this session.** T-021 (visual side-by-side rendering in `public/index.html`) is DONE, verified directly. T-017 (`google_lens` spike) is substantially resolved — the request-path bugs (wrong param name, missing `type`, wrong response path) are fixed and verified, and a live matrix confirms Lens genuinely returns structured `exact_matches`/`visual_matches`/`products` data (`docs/LENS_SPIKE_V2.md`). **One real caveat before treating this as demo-proven:** that matrix was tested against the Google logo (an atypical, maximally-indexed image), not an ordinary marketplace product photo — the mechanism works, but whether it reliably produces a clean, camera-ready "gotcha" on the *actual* demo product/photo pair is not yet confirmed. Do one credit-conscious spot-check with the real chosen demo image (not another full parameter matrix) before rehearsing on camera.

**Naming note:** the product is referred to below only as "this tool" / descriptively — a public name is still open (`docs/TASK_BOARD.md` T-019); do not record a demo that bakes in the "BrandLens" internal codename as a public-facing brand name.

---

### 0:00-0:15 — PROBLEM

> "Meesho alone took down 4.2 million counterfeit listings in six months. Delhi's High Court has already ruled once on sellers piggybacking fake goods onto a real brand's product page. If you're a small Indian D2C brand, you have no affordable way to find out which live listings are doing this to you right now — enterprise brand-protection tools exist, but they're priced for companies ten times your size."

*(Evidence sourced in `docs/DECISION.md`/`docs/RESEARCH.md` §6 — say this plainly, don't oversell it; the real numbers are strong enough without embellishment.)*

### 0:15-0:30 — PRODUCT

> "This tool takes your product name and your real product photo, finds live listings for it across marketplaces, and reverse-image-checks every one of them against your actual photo — not just the price or the seller name, the picture itself."

### 0:30-1:45 — LIVE WORKFLOW (the magic)

1. Enter a real (or clearly-labeled demo) product name + link the official photo. **State out loud that this is a live SerpApi call, not a canned response** — the hackathon rules require the demo to visibly show it's working, and judges are told production polish isn't the bar, working functionality is.
2. Show the live `google_shopping`/`amazon_product` results streaming in — a handful of listings appear with price/seller.
3. **The gotcha moment:** click into the most-flagged result. Show the listing's photo *next to* the official photo, with the `google_lens` match result underneath. If they don't match — or the same photo turns up on a completely different, unrelated listing — that's visible on screen without narration.
4. Show the ranked list with the composite score and the plain-English reason per signal (price/seller/visual) — say explicitly: *"this is not one API call summarized by an AI — three independent signals get computed and fused into this score, and you can see all three."*

### 1:45-2:15 — WHY IT'S DIFFERENT

> "The closest thing that already exists in the SerpApi community gallery is a project called CeaseFire — but it's a domain-typosquatting scanner: you give it a brand name, it finds lookalike domains like `yourbrand-shop.com` and drafts takedown notices for phishing sites. That's a real, different problem. This tool doesn't look at domains at all — it looks at whether the photo on a real marketplace listing actually matches your real product. We checked this carefully, in both directions, before building on it — not just describing it as different, but proving it."

*(This is the CeaseFire-comparison beat from `docs/DECISION.md` mitigation #4 and `docs/COMPETITIVE_ADJUDICATION.md` — say it proactively and specifically, don't wait for a judge to ask. Naming the actual mechanism difference — domains vs. product photos — is what makes this land as a real answer instead of a defensive dodge.)*

### 2:15-2:35 — WHY SERPAPI IS ESSENTIAL

> "Every piece of evidence here — which listings exist right now, what they cost, whose photo is on them — only exists live. A snapshot from yesterday is already wrong, because sellers rotate listings constantly. And the photo comparison specifically needs a reverse-image search engine — there's no way to check 'does this photo match' without one. Take away SerpApi and there's nothing left to show you."

### 2:35-2:50 — CLOSE

> "This isn't a dashboard on top of a search result — it's evidence you can act on, for the brand owners who've been priced out of the tools that already do this for bigger companies."

---

## Demo resilience notes

- **Fallback mode:** if live SerpApi calls are slow/unavailable during the actual recording, a clearly-labeled cached/fixture run may be shown per the hackathon's own rules ("video quality does not affect judging," but fabricated-as-live data is a disqualification-risk per the rules' plagiarism/false-claims clause) — label it on screen as cached, don't claim it's live if it isn't.
- **Deterministic scenario:** pick one product/photo pair in advance that reliably produces a clear visual mismatch, and rehearse that exact input — per Gemini's UX audit P1 finding, a "Load Demo Example" button (T-021) should pre-fill this so the live presenter never fumbles a URL on stage.
- **What NOT to say:** never say "this is a counterfeit" or "this seller is committing fraud" on camera — say "flagged for review" / "a mismatch worth investigating," consistent with the language discipline in `docs/COMPETITIVE_ADJUDICATION.md`. This is not just a legal-safety note — it's also a more honest description of what three heuristic signals can actually establish.

## Open blockers before this script is rehearsal-ready

1. ~~T-021 (visual side-by-side rendering)~~ — DONE, verified.
2. ~~T-017 (`google_lens` spike)~~ — request-path bugs fixed and verified; mechanism confirmed to return real structured data (tested on the Google logo, not yet on a realistic product photo — see status note above).
3. A specific, pre-tested product+photo demo pair still needs to be chosen and spot-checked live (one targeted check, not another full matrix — credit-conscious per `docs/SERPAPI_BUDGET.md`) before the first full rehearsal. This is now the single remaining real blocker.
4. The product's public name is still open (`docs/NAMING_V2.md`/`docs/NAMING_DECISION.md`) — this script deliberately avoids baking in "BrandLens," and should get the real name once `NAMING STATUS: FINAL`.
