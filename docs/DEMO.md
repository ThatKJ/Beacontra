# Demo Script (target: 2:30-2:50, hard limit 3:00)

**Status: draft, close to rehearsable — updated this session.** T-021 (visual side-by-side rendering in `public/index.html`) is DONE, verified directly. T-017 (`google_lens` spike) is substantially resolved — the request-path bugs (wrong param name, missing `type`, wrong response path) are fixed and verified, and a live matrix confirms Lens genuinely returns structured `exact_matches`/`visual_matches`/`products` data (`docs/LENS_SPIKE_V2.md`). **One real caveat before treating this as demo-proven:** that matrix was tested against the Google logo (an atypical, maximally-indexed image), not an ordinary marketplace product photo — the mechanism works, but whether it reliably produces a clean, camera-ready "gotcha" on the *actual* demo product/photo pair is not yet confirmed. Do one credit-conscious spot-check with the real chosen demo image (not another full parameter matrix) before rehearsing on camera.

**Naming note:** naming is now FINAL — the product is **Beacontra** (`docs/NAMING_DECISION.md`). The script below has been updated to say the name naturally rather than "this tool."

---

### 0:00-0:15 — PROBLEM

> "Meesho alone took down 4.2 million counterfeit listings in six months. Delhi's High Court has already ruled once on sellers piggybacking fake goods onto a real brand's product page. If you're a small Indian D2C brand, you have no affordable way to find out which live listings are doing this to you right now — enterprise brand-protection tools exist, but they're priced for companies ten times your size."

*(Evidence sourced in `docs/DECISION.md`/`docs/RESEARCH.md` §6 — say this plainly, don't oversell it; the real numbers are strong enough without embellishment.)*

### 0:15-0:30 — PRODUCT

> "This is Beacontra. It takes your product name and your real product photo, finds live listings for it across marketplaces, and reverse-image-checks the top candidate listings against your actual photo — not just the price or the seller name, the picture itself."

*(Note on candidate cap: Beacontra performs Lens analysis on the top 10 candidate listings to bound API usage; the remaining listings retain commercial price/source evidence.)*

### 0:30-1:45 — LIVE WORKFLOW (the magic)

1. Enter a real (or clearly-labeled demo) product name + link the official photo. **State out loud that this is a live SerpApi call, not a canned response** — the hackathon rules require the demo to visibly show it's working, and judges are told production polish isn't the bar, working functionality is.
2. Show the live `google_shopping` results streaming in — deduplicated listings appear with price/seller context. **⚠️ Caveat confirmed on the canonical run (`docs/FINAL_VERIFIED_RUN.md`):** a broad product query like "boAt Airdopes 141" can pull in *other* boAt Airdopes variants (Gen 2, Elite ANC, etc.) that aren't the exact product being checked, which will show as price "anomalies" that aren't really comparable. If this hasn't been fixed with tighter query filtering before recording, don't claim on camera that every flagged price is a clean apples-to-apples comparison — say "flagged relative to this product's MRP" rather than implying every result is confirmed to be the same exact item.
3. **The gotcha moment (only if the chosen demo product/photo actually produces a visual match — verify with a fresh spot-check first, do not assume):** click into a flagged result. Show the listing's photo *next to* the official photo, with the `google_lens` match result underneath. **On the canonical run with boAt Airdopes 141, this did not fire — 0 of 40 listings had a positive visual match, all showed the neutral "no evidence" state instead.** If a live spot-check with the actual demo product/photo still shows no match, present that honestly on camera ("visual check ran, found nothing conclusive here — that's a real, valid outcome, not a failure") rather than imply a mismatch was found when it wasn't, or switch to a product/photo pair confirmed to produce a match before recording.
4. Show the ranked list with the composite score and the plain-English reason per signal (price/seller/visual) — say explicitly: *"this is not one API call summarized by an AI — three independent signals get computed and fused into this score, and you can see all three."*

### 1:45-2:15 — WHY IT'S DIFFERENT

> "The closest thing that already exists in the SerpApi community gallery is a project called CeaseFire — but it's a domain-typosquatting scanner: you give it a brand name, it finds lookalike domains like `yourbrand-shop.com` and drafts takedown notices for phishing sites. That's a real, different problem. Beacontra doesn't look at domains at all — it looks at whether the photo on a real marketplace listing actually matches your real product. We checked this carefully, in both directions, before building on it — not just describing it as different, but proving it."

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
2. ~~T-017 (`google_lens` spike)~~ — request-path bugs fixed and verified; mechanism confirmed to return real structured data.
3. **T-028 partially resolved, two real items remain (per `docs/FINAL_VERIFIED_RUN.md`, corrected 2026-09-18):** boAt Airdopes 141 (MRP ₹4,490, real live reference image) has a working end-to-end pipeline, but (a) it produced **zero positive visual matches** in the canonical run — step 3 above needs a fresh spot-check or a different product/photo before recording, and (b) the Shopping query pulls in other boAt variants, inflating the price-anomaly count for reasons unrelated to real pricing — needs tighter filtering or a cleaner query before the price signal is shown as a clean example.
4. ~~Naming~~ — DONE. `NAMING STATUS: FINAL` — Beacontra. Script updated above.
