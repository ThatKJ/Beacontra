# Competitive Landscape

**Purpose:** Summary deliverable for the SerpApi India Hackathon 2026 submission process. Full raw research (459 lines, all sources cited) is at `docs/research/competitive_landscape_raw.md`; this document summarizes it and states its implications for our product decision (`docs/DECISION.md`).

**Method:** A background research agent fetched the official `#BuiltWithSerpApi` gallery's structured data file directly (177 projects with engine lists, tags, authors, links — not a scrape of the rendered page), cross-checked against GitHub topic search, the DevNetwork API+Cloud+AI Hackathon 2026 Devpost gallery, Product Hunt, and Hacker News. Separately, the project lead ran targeted manual competitive searches on specific candidate ideas during ideation (documented in `docs/RESEARCH.md` §7a).

---

## Important context

The official BuiltWithSerpApi gallery is **not** exclusive to the SerpApi India Hackathon 2026 — it's SerpApi's general "built with our API" showcase across many events. Evidence (submission dates, repo names like `devnetwork-2026`, `hack-devnet`, `apiworld-2026`, `pycon-2026`) shows most of the 177 cataloged projects came from **other** hackathons/workshops (PyCon 2026, several Gemma-4 hackathons, and predominantly the **DevNetwork API+Cloud+AI Hackathon 2026**, Sept 2026, where SerpApi sponsored a track). These are not literally our competing submissions — but they are exactly the "publicly available project information" a judge is likely to check against for originality, so treating this gallery as the saturation baseline is the right strategic call regardless.

---

## Saturation map

| Cluster | Count | Pattern |
|---|---|---|
| **Evidence/claim verification agent** | ~38 | An AI agent checks a claim/vendor/document/price/image against live SerpApi results, produces a cited verdict, gates a human decision. By far the largest pattern in the entire ecosystem — likely driven by the Sept 2026 DevNetwork hackathon's apparent "agentic trust" theme. Includes a sub-cluster of ≥8 near-identical procurement/invoice/vendor due-diligence agents. |
| **Shopping / price comparison** | 31 | Compare product prices/offers across marketplaces. |
| **Travel itinerary / flight+hotel planning** | 21 | Plan a trip using Flights + Hotels (+Maps/Tripadvisor). Plus ≥6 independent flight-price-tracker variants alone. |
| **Research/briefing agent** | ~25+ | Topic/company in, cited research brief out. Includes two of SerpApi's own official showcase repos. |
| Google Maps lead-generation scraper | ≥7 | Near-identically-named projects: find businesses, dedupe, export to Sheets/CRM. |
| SEO / rank-tracking dashboard | ≥6 (+external ecosystem) | Reinforced by SerpApi's own curated "awesome-seo-tools" list. |
| Job finder / resume matcher | 9 | |
| Beauty/skincare shopping+try-on assistant | 9 | Likely a specific sponsor track prompt, narrow and recently clustered. |

**Read:** four of these clusters (verification agents, shopping/price comparison, travel planning, research/briefing agents) map directly onto categories the hackathon mission brief pre-flagged as saturation risks — confirmed empirically, not just anticipated.

---

## Underexplored engines

| Engine | Gallery usage | Assessment |
|---|---|---|
| Google Patents API | 1 dedicated product (PatentPincer) | Underexplored |
| Google Scholar Case Law API | 0 community products found anywhere | Very underexplored — **but US-courts-only coverage, verified separately; not usable for an India-focused legal product** |
| Google Ads Transparency Center | 3, all political/ad-monitoring | Underexplored for commercial/brand use cases |
| Google Trends *Trending Now* (real-time variant) | 1 | Underexplored (classic `google_trends` itself is well-used, 12 projects) |
| Google Play Store API | 1 (tangential, inside CeaseFire) | Underexplored, "particularly for an India-specific angle, since Play Store dominates Android in India" (research agent's own flag) |
| Google Maps Reviews "at scale" analytics | 4 (basic monitoring only) | Moderately underexplored — no deep multi-location/competitor sentiment analytics found |
| Zillow engine | 1 | Underexplored — real-estate cluster mostly uses generic Search instead |

**Caution applied:** per the mission brief, an underexplored engine was not treated as sufficient reason on its own — the Case Law API is the clearest example of this, ruled out for India-relevance despite zero competition.

---

## Direct competitor check on our selected direction (BrandLens)

Our selected product (`docs/DECISION.md`) is a visual + commercial cross-verification tool for Indian D2C/SME brand owners fighting marketplace counterfeiting, using `google_shopping`/`amazon_product` + `google_lens` (reverse-image matching).

**Closest prior art found: CeaseFire** (gallery #30) — "searches brand impersonation across web, AI, app-store, shopping, maps, image, video results to prioritize takedowns," the only project in the entire 177-project gallery tagged `brand-protection`. It uses 10 engines but **not** `google_lens`/reverse-image matching — its evidence is presence/mention-based (does this app/page/listing exist and reference my brand), not visual (does this listing's photo actually depict my genuine product). This is a real, disclosed overlap, not a hidden one — see `docs/DECISION.md` for how the product is scoped to be additive to, not a clone of, this precedent.

**Distant technical precedent:** `DepositCheck` (gallery #43, different hackathon) uses the same underlying `google_lens exact_matches` mechanism for a different problem (rental-listing photo fraud). Validates the mechanism's technical feasibility; doesn't compete on the product.

**Indirect competitors:** enterprise brand-protection SaaS (MarqVision, Bustem, IPMoat, LdotR) solve this problem professionally but at enterprise pricing and with infrastructure (web crawling, human review teams) far beyond a hackathon MVP — validates the market rather than competing with an SME-priced, self-serve tool.

**Independent cross-validation:** a separately-run research agent studying Indian problem statements (not shown our candidate list) independently flagged "Trademark/Counterfeit Monitoring for SMEs" as a top opportunity, citing the same real legal case (Skechers v. Flipkart) and the same gap (no affordable, self-serve, cross-marketplace monitoring tool for SMEs) — see `docs/RESEARCH.md` §6. Two independently-run research passes converging on the same evidenced gap without cross-contamination is the strongest validation signal available before building.

---

## Rejected/demoted candidates and why (competitive reasons specifically)

| Candidate | Why demoted |
|---|---|
| Job-offer/recruiter legitimacy verifier | Multiple near-exact duplicates found: JobShield, SerpShield (both SerpApi+MCP specific), HireProof, CareerShield-AI, plus a crowded field of non-SerpApi consumer tools (JobScamScore, VerifyJobs, OfferGuard AI, ScamCheck, JobMeter). |
| Wedding-vendor / general vendor fraud screener | `VendorProof` (gallery #168) is a mechanically identical B2B procurement version, built for a concurrent hackathon. |
| Resale/rental listing fraud screener | `DepositCheck` already ships this exact mechanism for the rental vertical. |
| Predatory loan-app screener | Not directly duplicated in the gallery, but RBI's own official "Digital Lending Apps" directory (launched 2025-07-01) is a structured static alternative that weakens the "only live search can do this" argument — demoted, not rejected; kept as a possible expansion vertical. |
| Price Intelligence / shopping comparison | 31-project cluster in the gallery alone; Gemini's independent red-team (`docs/GEMINI_CONCEPT_RED_TEAM.md`) issued an explicit VETO on this concept as originally scoped. |
| Generic local-business dashboard | Not a direct duplicate, but the mechanism (query Maps, list results, add charts) matches ≥7 near-identically-named lead-generation scrapers in the gallery; would need a genuinely sharp wedge (temporal/gentrification angle) to survive, per Gemini's red-team. |
| Generic travel itinerary planner | 21-project cluster, the single most saturated pattern found besides verification agents; mission brief predicted this correctly. |
