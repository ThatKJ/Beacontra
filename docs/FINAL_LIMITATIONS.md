# Final Limitations Classification

**Status: DRAFT, first pass — 2026-09-18.** Written before OpenCode's variant-normalization/production/latency work has landed, so several items below are marked PENDING rather than resolved. This will need a second pass once those land; not a final submission artifact yet. Classification follows the mission's three buckets exactly — anything fixable is not allowed to sit in "unavoidable."

---

## FIXED (verified this session by direct code/data reading, not just cited)

- **T-017** — `google_lens` request-path bugs (wrong parameter name, missing `type`, wrong response-parsing path). Verified: `url`/`type`/top-level-field parsing all confirmed correct by reading `src/lib/beacontra.ts` directly.
- **T-026** — visual-signal scoring overclaim ("no match" treated as positive mismatch evidence). Verified on the real canonical run: seller signal correctly produced 0/40 anomalies when no authorized-seller list was supplied; visual `no_evidence`/`unavailable` states are neutral, not scored as anomalous.
- **T-027** — datetime schema mismatch with live SerpApi response format. Fixed.
- **T-030** — price-signal language overclaim ("suspicious discount" → neutral `moderate_discount`, factual "X% below MRP" wording). Verified directly in the real dump: `"Price ₹3890 is 13% below MRP ₹4490"`.
- **T-031** — `uploadImage()` bypassing `fixtureMode`, causing "unit" tests to make live network/API calls whenever a real key was configured. Verified fixed: `tests/beacontra.test.ts` runtime returned from 9.8s to 64ms after the fix.
- **Naming** — BrandLens → Beacontra. Verified in code (`BeacontraService`, `/api/beacontra/scan`) and across active docs.
- **Tagline** — finalized via an independent Gemini red-team that converged on the same candidate without seeing my lean.
- **Live/fixture/cache transparency** — `dataSource` field exists and is surfaced in the UI; verified directly.
- **Score-label consistency** — UI shows "Review Priority Score"; propagated into README/docs after finding a stale "Confidence Risk Score"/"Heuristic Risk Score" reference.
- **Metrics-doc internal consistency** — `docs/FINAL_VERIFIED_RUN.md` was rewritten from the raw dump after its first version's numbers (MRP, product variant, visual/price/seller-anomaly counts, credit framing) didn't match the underlying data it claimed to summarize.

## PENDING — real, fixable, not yet resolved as of this check (OpenCode's implementation lane; re-verify before moving to FIXED)

- **Product variant mixing in price comparisons** — confirmed root cause (Shopping query for "boAt Airdopes 141" returns other boAt variants — Gen 2, Elite ANC, 611, Neo, etc. — compared against one fixed MRP). Checked `src/lib/beacontra.ts`/`normalization.ts` directly as of this writing: **no variant-matching logic exists yet.** This inflates the price-anomaly rate for reasons unrelated to real pricing and should be fixed (or the demo query narrowed) before submission.
- **Browser-based local file upload** — not yet verified whether a user can select a local image file and have it reach the SerpApi Image API end-to-end, versus needing to paste a public URL.
- **Production deployment** — not yet verified beyond local `wrangler dev`/dry-run build.
- **Demo latency** — the canonical run took ~112 seconds. Too slow for a 3-minute demo if reproduced live on stage; needs investigation (likely serial Lens calls per candidate) and, if safe, parallelization.
- **Cross-browser testing** — Chromium checks exist (ASTRA's visual QA); Firefox/Safari status not yet confirmed.
- **Cached-live demo fallback** — referenced in `docs/DEMO.md`'s resilience notes as a concept; not yet confirmed as an implemented, working fallback path distinct from fixture mode.

## KNOWN BUT ACCEPTABLE — genuinely unavoidable, not being hidden

- **Scoring weights are hand-picked heuristics**, not statistically calibrated against a labeled ground-truth dataset — no such dataset exists for this problem; disclosed plainly rather than dressed up as a trained model.
- **Credit/request cost cannot be verified against real SerpApi billing** without dashboard/invoice access this project doesn't have. The app's own internal estimate counter is labeled as an estimate everywhere it appears, not presented as a confirmed bill.
- **No real brand-owner user has validated the product yet** — this is a pre-submission hackathon build; usefulness is evidenced by documented market research (two independent passes), not customer usage data.
- **Live search results vary run to run** — inherent to depending on live marketplace data rather than a static dataset; this is the product's entire value proposition, not a bug to fix.
- **Not every listing will have visual evidence** — `google_lens` coverage of an arbitrary marketplace thumbnail is an upstream Google-index limitation, not something this project's code controls. The product is designed to degrade gracefully (neutral, not falsely anomalous) when this happens, which is the correct and already-verified handling.
- **The heuristic score is not legal certainty** — by design; this is the core language-discipline decision made throughout `docs/COMPETITIVE_ADJUDICATION.md` and carried through every subsequent doc, not an oversight to fix.

---

**Next pass needed once:** variant normalization lands (re-run the canonical scan, confirm the price-anomaly rate drops for the right reason), production deployment is verified, and latency is addressed — then re-classify anything that moves from PENDING to FIXED, and confirm nothing new has regressed.
