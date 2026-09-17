# Submission Package

**Status: FINAL, verified against the local build and test suite.** `docs/PRODUCTION_VERIFICATION.md`'s Cloudflare-deployment claims are not independently confirmed as of this pass (no authenticated `wrangler` session, no live URL on record) — treat this as a local-build verification, not a verified production deployment, until that is checked directly. All other facts below are sourced to `docs/DECISION.md`, `docs/RESEARCH.md`, `docs/COMPETITIVE_ADJUDICATION.md`, and direct code reading — nothing here is invented for submission-copy purposes.

---

## PROJECT NAME

**Beacontra.** `docs/NAMING_DECISION.md` — NAMING STATUS: FINAL. Formerly developed under the internal codename "BrandLens," which collided with existing products and was retired.

## TAGLINE

**"Where price, seller, and photo evidence meet."**

## TRACK

**Commerce & Market Intelligence** — "Turn product, price, merchant, finance, trend, and marketplace results into useful tools." Chosen over Open Innovation because the fit is direct and specific, not a fallback.

## PROJECT DESCRIPTION

A brand owner submits a product name/SKU and their official product photo. The tool searches live marketplace listings (`google_shopping`), performs reverse-image checks on the top candidate listings against the official photo (`google_lens`), and fuses that visual signal with deterministic price-anomaly and seller-anomaly checks into one ranked, evidence-backed review queue — not a verdict, a prioritized list of listings worth a human's attention, with the reasoning shown for each.

*(Beacontra performs Lens analysis concurrently on the top 10 candidate listings to bound API usage; the remaining listings retain commercial price/source evidence.)*

## PROBLEM

Counterfeit and unauthorized-seller listings on Indian e-commerce marketplaces are pervasive and effectively unmonitorable by hand. Delhi High Court restricted Flipkart's "latching-on" feature in November 2024 specifically because it let third-party sellers list counterfeit goods directly under a genuine brand's product page. BIS raided Amazon and Flipkart warehouses in March 2025 over forged certification marks. Meesho disclosed removing 4.2 million counterfeit listings in six months. Small Indian D2C/SME brands — big enough to be worth counterfeiting, too small to afford enterprise brand-protection SaaS — have no affordable way to check this themselves, today, for their own products.

## SOLUTION

Live cross-marketplace listing search fused with reverse-image verification and deterministic price/seller heuristics into one ranked, explained review queue — see Project Description above. Full product rationale: `docs/DECISION.md`. Full spec: `docs/PRODUCT_SPEC.md`.

## WHO IT HELPS

Founders and small ops teams at Indian D2C/FMCG brands (roughly 1-50 employees) — evidenced as an underserved segment in `docs/RESEARCH.md` §6 (problem #27), independently corroborated by a second, separately-run research pass that reached the same conclusion without seeing the first one's findings.

## HOW SERPAPI IS USED

- **SHOPPING REQUESTS**: 1 call per scan (`google_shopping`) — verified, one call regardless of result count.
- **LENS REQUESTS**: Executed concurrently for the top 10 candidate listings only (`MAX_LENS_CALLS = 10`, ordered by price anomaly).
- **IMAGE-UPLOAD REQUESTS**: Browser file uploads are routed to SerpApi's Image API to obtain an `image_id` for Google Lens.

## WHY SERPAPI USAGE IS MATERIAL

Every fact the product surfaces — which listings exist, at what price, from which seller, whether the photo matches — comes from a live SerpApi call; there is no persisted "known good/bad" database standing in for it. The visual-verification mechanism specifically cannot exist without a reverse-image search engine — deleting SerpApi removes the entire evidentiary basis of every result, not a convenience layer on top of one. 

## TECHNICAL HIGHLIGHTS

- **Real multi-signal fusion, not an LLM summarizing a search result:** price anomaly, seller anomaly, and visual-match signals are each computed independently in deterministic code and combined into one weighted composite score with a full evidence trail per signal (`src/lib/beacontra.ts` `fuseSignals()`). There is no LLM anywhere in the scoring path.
- **Credit-budget engineering:** Caps Lens API calls to the top 10 candidates to limit credit burn.
- **Concurrent API Fetching:** Demo latency is kept to ~15-25 seconds through `Promise.all` Lens concurrency.
- **Variant Skew Filtering:** Normalizes Google Shopping results deterministically (Regex filters out accessories/Pro models) before analyzing price anomalies, ensuring clean comparisons against the official MRP.

## GITHUB DESCRIPTION

*(One-liner for the repo's About field)*
> Beacontra cross-checks marketplace listings against your brand's real product photos using live SerpApi search and reverse-image matching — commercial-anomaly signals for Indian D2C brands, not accusations.

## DEMO DESCRIPTION

Full script: `docs/DEMO.md`. Structure: problem (real, sourced numbers) → product (one sentence) → live workflow ending in a visible photo-vs-photo comparison → proactive comparison against the closest existing SerpApi-gallery project → explicit SerpApi-necessity statement → close. Pre-tested product/photo pair (boAt Airdopes 141, MRP ₹4,490) validated live with reference image HTTP 200 OK and canonical run logged in `docs/FINAL_METRICS_DUMP.json`.

## AI TOOLS USED

This project was built with the assistance of several AI tools, working under human direction and coordinating through shared documentation. The specific tools and their roles were:
- **Claude / Claude Code:** research, product strategy, architecture review, documentation, demo/submission review
- **OpenCode:** implementation, SerpApi integration, testing, debugging, technical hardening
- **Gemini:** independent red-team, competitive analysis, QA, claim verification, UX review
- **GPT-6 Astra:** UI/UX redesign, interaction design, frontend polish, responsive/accessibility review
- **ChatGPT:** prompt design, research guidance, project review, coordination strategy, submission guidance

## AI DISCLOSURE

Per the hackathon's own policy ("AI-assisted development is allowed and does not affect judging... List any AI tools used... Developers remain responsible for every submitted component"): this submission was built with the AI tools named above under human direction. The human developer set the mission, configured the live SerpApi credentials, supplied the reference demo assets, and orchestrated the multi-agent coordination. All AI-generated work was thoroughly reviewed and verified via automated tests (Vitest), typechecking, linting, and build gates before submission. This is disclosed plainly, not minimized, in `docs/JUDGE_QA.md` Q18-19.

## SETUP NOTES

See `README.md` for the authoritative, tested setup path (env var configuration, `npm install`, `npm run dev`, `npm test`, `npm run serpapi:smoke`).

## KNOWN LIMITATIONS

- **Live search variability**: As Beacontra pulls live data, search results and exact rankings for the same product can shift over time depending on Google's Shopping index.
- **Visual evidence may not exist**: Google Lens often returns no exact product matches for typical e-commerce thumbnail images, degrading the visual signal to `no_evidence`. Beacontra accurately reflects this neutral reality instead of inventing false positives.
- **Score Subjectivity**: The Review Priority Score is a hand-tuned deterministic heuristic, not a machine-learned probability or legal guarantee of counterfeit status.
