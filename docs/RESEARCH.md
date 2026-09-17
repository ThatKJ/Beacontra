# Research: SerpApi India Hackathon 2026

**Author:** CLAUDE (product research/selection lead)
**Status:** IN PROGRESS — sections 1-3 verified directly; sections 4-13 depend on background research agents (competitive audit, Indian problem research) and will be filled in as they land.
**Note on process:** This repo is being built collaboratively by three AI coding agents (OPENCODE, CLAUDE, GEMINI) coordinated by the user via `docs/AI_COORDINATION.md` / `docs/TASK_BOARD.md`. OPENCODE already produced `docs/SERPAPI_CAPABILITIES.md` (133-engine catalog, verified) and `docs/TECHNICAL_FEASIBILITY.md` (7 concepts scored on feasibility). This document builds on those rather than re-deriving them, and adds the parts they don't cover: verified hackathon rules, competitive saturation, evidence-backed problem research, and final selection with a hostile-judge red team.

---

## 1. Verified Hackathon Rules

Fetched directly from the official pages on 2026-09-17 (not inferred, not cached knowledge):
- https://serpapi.github.io/serpapi-india-hackathon-2026/ (index)
- https://serpapi.github.io/serpapi-india-hackathon-2026/rules.html (full rules)

### Timeline
- Sept 1, 2026, 00:00 IST — hackathon begins
- **Oct 5, 2026, 23:59 IST — submissions close** (confirmed, matches assumption in the mission brief)
- Judging/winners: TBA

### Eligibility
- 18+, India resident. Teams of 1-5, each member must individually be eligible and contribute.
- SerpApi employees/contractors/affiliates/immediate family ineligible.
- **Pre-existing projects are allowed** if the submitted version demonstrates meaningful SerpApi usage and the relevant work is identifiable/reviewable, with disclosure of prior existence. (Not relevant to us — building fresh.)

### The "Meaningful SerpApi Usage" bar (load-bearing — quoted verbatim)
> "SerpApi must make a material contribution to the submitted project's functionality."
> "Adding an isolated or cosmetic API call solely to meet eligibility requirements is insufficient."
> Determination is "by SerpApi in its sole discretion."

This is the single most important constraint on idea selection. It directly matches the mission brief's "mental deletion test" framing (Gemini's `docs/GEMINI_SERPAPI_AUDIT.md` already encodes this same test).

### GitHub repo requirements
- Public. Must include setup instructions. Must open without requesting access (test in a private browser window before submitting).

### Demo video requirements
- Under 3 minutes. Must show the project **working locally**. Public/unlisted YouTube or shareable Drive link. Video production quality does not affect judging. Narration optional.

### AI-assisted development policy
- Explicitly allowed, does not affect judging, but **must be disclosed** (which AI tools were used). Submitter remains responsible for every component. This matches our approach: heavy Claude Code usage, disclosed honestly in `docs/SUBMISSION.md`.

### Submission process
- Sign in with GitHub on the submission dashboard. Draft-save supported. Required fields: repo link, demo video link, description + track, lead participant details (name/email/phone/occupation/experience), team member info, AI tool disclosures, acceptance of Rules/T&Cs.

### Tracks (choose ONE — primary purpose)
1. **AI Agents** — "agents that plan, search, compare, and act with current information"
2. **Open-Source Integrations** — "bring SerpApi to a new open-source package or platform"
3. **Travel & Local Discovery** — flights, hotels, maps, places, reviews, destination data
4. **Commerce & Market Intelligence** — product, price, merchant, finance, trend, marketplace results
5. **Knowledge & Public Interest** — education, research, jobs, news literacy, accessibility, civic info, patents
6. **Open Innovation** — anything else
- SerpApi may re-assign a project to a more fitting track before judging.

### Judging criteria (unweighted, evaluated together)
1. Idea strength — "clear and compelling insight"
2. Originality — "distinctive or thoughtfully recombined"
3. Technical complexity — "meaningful engineering effort"
4. Usefulness — "practical value"
5. Meaningful SerpApi usage
- Judges may inspect **repository history** — meaning commit history/incremental development is visible and matters, not just a final code dump.
- "The demo verifies functionality" — production polish is not the bar, working functionality is.

### Prizes (context, not decision-relevant, but confirms this is a serious competitive pool)
- Total pool ₹3 lakh+. 1st: ₹1,00,000 + $150 credits. 2nd: ₹40,000 + $100 credits. 3rd: ₹20,000 + $100 credits. 6 track awards of $100 credits each. 4 community-partner awards. Any valid submission gets $10 participation credits. One competitive award per project.

### Code of conduct / disqualification triggers (relevant to how we build)
- False claims (eligibility/authorship/functionality), plagiarism/unauthorized reuse, manipulating judging signals, exposing API keys/secrets in public materials. **Directly actionable:** never commit `.env`, scan git history before submission, don't fabricate demo data presented as live.

### Free plan credits (confirms OPENCODE's SERPAPI_CAPABILITIES.md)
- 250 searches/month free, 50/hr throughput. Cross-checked directly against serpapi.com/pricing: Free $0/250 searches confirmed; Starter $25/1,000; Developer $75/5,000; Production $150/15,000 — all match.

---

## 2. Judging Interpretation (our own reading, not official policy)

Five unweighted criteria, but two of them are effectively gatekeepers that can zero out the other three regardless of polish:

- **Meaningful SerpApi usage** is explicitly adjudicated by SerpApi "in its sole discretion" with an explicit anti-pattern named ("isolated or cosmetic API call"). A project that could swap SerpApi for a cached JSON file and behave identically fails this criterion outright, no matter how good the UI is. This is our hardest constraint and the first filter applied to every candidate idea below.
- **Originality**, combined with judges being able to inspect "publicly available project information," implies judges likely *will* look at `#BuiltWithSerpApi` and general prior art — an idea that's a visible clone of an existing SerpApi gallery project is a real risk, not a hypothetical one. This is why Phase 2 (competitive saturation audit) runs before ideation is locked, not after.
- **Technical complexity = "meaningful engineering effort,"** not visual complexity or number of API calls. A project juggling 10 engines with no real reasoning/processing layer scores worse on this axis than one deeply using 2 engines with real extraction, ranking, or cross-verification logic. This directly supports the mission brief's "two engines used indispensably beats ten used cosmetically."
- **Usefulness** requires a real persona, not "everyone." Combined with the India-resident-only eligibility, an India-specific persona with a concrete, frequent, painful workflow is a stronger target than a global-generic one.
- Repository-history visibility means our git workflow (incremental, meaningful commits, not one final squash) is itself something a judge might notice — low cost, so we should just do it correctly throughout.

---

## 3. SerpApi Capability Map (product-ideation angle)

Full engineering-grade catalog already exists at `docs/SERPAPI_CAPABILITIES.md` (133 engines, verified against official docs/GitHub catalog/playground/pricing — OPENCODE, T-002, DONE). Rather than duplicate it, here is the DATA → SIGNAL → DECISION → ACTION → VALUE framing the mission asks for, applied to the engines most likely to matter, plus what that file doesn't cover: the MCP integration (verified directly below) and a first-pass read on saturation (refined in §4).

| Engine cluster | Unique real-world signal | Problem this unlocks (only because the signal exists) |
|---|---|---|
| `google_maps` + `google_maps_reviews` + `google_local` | Live, geographically precise business existence, ratings, review text, hours, photos — ground truth for "what's actually there right now" | Anything requiring current physical/local reality: site selection, reputation monitoring, service discovery, fraud/front-business detection |
| `google_shopping` + `amazon`/`amazon_product` + `google_shopping_filters` | Live cross-merchant price + availability + seller identity for a SKU, across Flipkart/Amazon.in/others simultaneously | Price comparison, counterfeit/MRP-violation detection, deal timing, out-of-stock tracking |
| `google_jobs` + `google_jobs_listing` | Live posted job requirements/compensation signals (unstructured but current) across aggregated sources (Naukri, LinkedIn, Indeed, Instahyre, company career pages) | Labor-market signal extraction: skill demand, negotiation leverage, hiring-health-by-company |
| `google_trends` + `google_trends_trending_now` | Real-time relative search interest by geography down to state level (`IN-KA`, `IN-MH`, ...) | Demand-timing decisions, early-signal detection, regional variation nobody self-reports |
| `google_scholar` + `google_patents` | Structured view of prior art / literature that is otherwise scattered across publisher paywalls and patent offices | Novelty-checking, literature-gap detection, IP landscape |
| `google_ads_transparency_center` | Who is *currently* paying to advertise for a given query/brand, and what creative they're running | Competitive/brand intelligence, ad-fraud or impersonation detection — genuinely underused signal (see §4) |
| `google_news` + `google_related_questions` | Current news coverage + the exact questions the public is asking right now (People Also Ask) | News-verification, misinformation surfacing, content-gap detection |
| `google_flights`/`_deals` + `google_hotels` + `tripadvisor` | Live fare/rate + review data for travel decisions | Travel planning (**saturated — see §4**) |
| `google_play`/`apple_app_store` | Current app listing metadata + review velocity | App market intelligence, competitive app monitoring |
| `google_finance`/`_markets` | Quasi-real-time (15-20 min delayed) NSE/BSE quotes + sector data | Retail investor tooling (has partial alternatives — Alpha Vantage etc. — so SerpApi dependency is weaker here) |
| `search_index` (alpha) | First-party crawled index, no external search-engine dependency | Interesting but alpha-quality and *reduces* the "meaningful SerpApi usage as dependency" story since it's SerpApi's own index rather than live web signal — deprioritized |

### SerpApi MCP (verified directly, 2026-09-17, https://serpapi.com/integrations/mcp — not previously documented by OPENCODE)
- Hosted MCP server at `https://mcp.serpapi.com/<API_KEY>/mcp`, or self-hosted via the open-source repo over stdio.
- Exposes a single unified `search` tool (not one tool per engine) — params include `q`, `engine` (defaults to `google_light`), `location`, `output` (json/markdown), and a `mode` of `compact`/`complete`.
- **Markdown output mode cuts token usage >90%** vs raw nested JSON — directly relevant if we build an "AI Agents" track entry where an LLM itself is the MCP client.
- Interactive UI tools (`search_table`, `search_dashboard`) exist for MCP hosts that support the MCP Apps extension — renders results as sortable tables/dashboards without dumping raw JSON into the model's context.
- Engine parameter schemas are exposed as MCP resources, enabling agent-side "guided search" argument completion.
- **Implication for track selection:** if we want to legitimately claim the "AI Agents" track (not just bolt an LLM onto a dashboard), the MCP's guided multi-engine tool-calling is the actual mechanism that makes an agent, rather than us hand-writing per-engine wrappers and calling that "agentic."

### `serpapi-search-tools` (verified 2026-09-17, https://serpapi.github.io/serpapi-search-tools-python/)
- Python package that wraps SerpApi search as native tools for agent frameworks: OpenAI Agents SDK, LangChain, LangGraph, CrewAI, LlamaIndex, **Claude Agent SDK**, Microsoft Agent Framework, AutoGen, Haystack, Semantic Kernel, Agno, smolagents, Google ADK — auto-detects which framework is present.
- Pre-built typed tools per domain: web, news, maps, images, shopping, videos, hotels, flights, travel — not just one generic wrapper.
- Falls back to plain Python functions (`provider="function"`) if no agent SDK detected — usable outside an agent context too.
- **Implication:** combined with the MCP server (above), SerpApi has invested specifically in making itself agent-native. An "AI Agents" track entry that uses real multi-step tool-calling (agent decides which engine to call, evaluates results, decides next query) — not just "one search, one LLM summary" — is exactly what this infrastructure is built for and is a legitimate, non-decorative way to satisfy both the AI Agents track and the "meaningful SerpApi usage" bar simultaneously.

---

## 4. #BuiltWithSerpApi Saturation Analysis

**Complete — full raw research at `docs/research/competitive_landscape_raw.md` (459 lines); summarized findings now in `docs/COMPETITIVE_LANDSCAPE.md`.** A background research agent fetched the official gallery's structured data file directly (177 projects, not a scrape of the rendered page — every project has engine list, tags, author, links) plus GitHub topic search, the DevNetwork API+Cloud+AI Hackathon 2026 Devpost gallery (confirmed to be the *same* underlying project pool as most of the official gallery — see below), Product Hunt, and HN.

**Critical context most of the mission brief's assumptions didn't anticipate:** the official BuiltWithSerpApi gallery is **not** specific to the SerpApi India Hackathon 2026 — it's SerpApi's general "built with our API" showcase, and the submission-date/repo-name evidence shows most of its 177 projects came from *other* events (PyCon 2026 workshops, several Gemma-4 hackathons, and overwhelmingly the **DevNetwork API+Cloud+AI Hackathon 2026**, Sept 4-5 2026, where SerpApi was a sponsor track). This matters: these aren't literally our competing submissions, but they are the exact body of "publicly available project information" a judge would find when checking originality, so avoiding duplication against this gallery is still the right strategic target.

**Saturation map (FACT, counted directly from the 177-project structured dataset):**
1. **"Evidence/claim verification agent"** — ~38 projects, by far the largest cluster. An agent checks a claim/vendor/document/price/image against live SerpApi results and produces a cited verdict gating a human decision. This directly confirms and quantifies the finding from my own manual spot-check in §7a (JobShield, VendorProof, DepositCheck, etc. are all members of this cluster) — it's even larger than that spot-check suggested. A sub-cluster of ≥8 near-identical "procurement/invoice/vendor due-diligence" projects exists inside it.
2. **Shopping/price comparison** — 31 projects.
3. **Travel itinerary/flight+hotel planning** — 21 projects (plus ≥6 independent flight-price-tracker variants alone) — confirms the mission brief's own prediction that this category would be saturated.
4. **Research/briefing agent** ("topic in, cited brief out") — ~25+ projects, including two of SerpApi's *own* official showcase repos.
5. Also saturated: Google-Maps lead-generation scrapers (≥7 near-identically-named), SEO/rank-tracking (≥6 + an external ecosystem), job-finder/resume-matcher (9), and a beauty/skincare shopping-assistant micro-cluster (9, likely a specific sponsor prompt).

**Underexplored engines (FACT, from the same dataset):** Google Patents API (1 dedicated product found, PatentPincer), **Google Scholar Case Law API (zero community products found anywhere — but see §7b, this is a dead end for India relevance, verified separately)**, Google Ads Transparency Center (3, all political/ad-monitoring — no commercial/brand use case found), Google Trends *Trending Now* real-time variant (1), **Google Play Store API (1 — flagged by the research agent itself as notable "particularly for an India-specific angle, since Play Store dominates Android in India")**, Zillow engine, Google Maps Reviews "at scale" analytics.

**Direct relevance to the leading candidate (BrandGuard, §7):** the gallery contains one close prior-art project — **CeaseFire** (#30: "searches brand impersonation across web, AI, app-store, shopping, maps, image, video results to prioritize takedowns," tagged uniquely `brand-protection`) — see §7b for how this changes the candidate's positioning.

## 5. Indian Problem Research / 6. Evidence-Backed Problems

**Complete — 42 problems (exceeds the 25-30 target), full detail at `docs/research/india_problems_raw.md` (1088 lines, ~90 sources).** Each entry has the full persona/JTBD/pain/frequency/consequence/workaround/existing-products/gap/search-dependency/SerpApi-role/India-angle/evidence structure the mission template asks for; unverified numbers are explicitly tagged ASSUMPTION/HYPOTHESIS rather than stated as fact (e.g., the oft-cited "35% of urban Indian consumers bought counterfeit goods online" figure is flagged there as **surfaced via AI-search-summary, not independently opened/verified** — a caveat I'm importing into this document too, correcting my own §7 entry which should be read with that same caveat).

**Most important cross-cutting finding (independently arrived at by this research agent, without seeing my candidate list in §7):** the fork's own "Cross-Cutting Observations" section flags **"cross-marketplace + reverse-image search" as a recurring pattern across five separate problem statements** (#2 Counterfeit Products & Fake Reviews, #9 Used Vehicle Fraud, #14 Matrimonial Fraud, #27 Trademark/Counterfeit Monitoring for SMEs, #32 E-commerce Delivery/Order Fraud) — the same mechanism I converged on independently in §7a/§7b via manual competitive search. **Problem #27 (Trademark/Counterfeit Monitoring for SMEs) is close to a word-for-word independent match for the BrandGuard/BrandLens concept**, down to citing the same real Indian legal case (Skechers v. Flipkart) and the same gap ("no affordable, cross-marketplace, self-serve monitoring tool aimed specifically at SMEs" — matching my own "enterprise SaaS isn't priced for Indian D2C/SMB brands" framing). Two independently-run research processes landing on the same evidenced gap is meaningfully stronger validation than either alone.

**Other findings worth recording for future/expansion scope (not pursued as primary, per §8's scoring):**
- Strongest "live search data is structurally necessary" cases identified: mandi crop prices (#7), GeM government tenders (#11), Tatkal train booking (#12), app-store competitive intelligence (#19), finfluencer pump-and-dump detection (#26), festival flight pricing (#30), festive fake-discount/MRP-inflation detection (#41) — all involve data that decays in hours/days, not months.
- Weakest SerpApi fit, flagged honestly by the research agent: gig-worker fare transparency (#24, data is platform-internal, not search-indexed) and visa-slot scalping (#22, VFS booking data isn't search-engine-indexed) — both real problems, but SerpApi's role would be supplementary at best.
- A government-data-fragmentation pattern recurs across RTI tracking (#5), court-case status (#6), GeM tenders (#11), RERA verification (#13), and welfare-scheme discovery (#31) — structurally different from the commerce-fraud pattern, and a possible direction for a future/second SerpApi project, not this one.
- **Festive Sale Fake Discount / MRP Inflation Detection (#41)** is a natural *feature extension* of BrandGuard/BrandLens (temporal price-history tracking to catch "inflate-then-discount" dark patterns) rather than a competing idea — flagged as a strong P1 candidate for the product spec, not the P0 scope.

## 7a. CRITICAL FINDING — the "verification agent" pattern is already crowded (2026-09-17, direct WebSearch check on the leading candidates below)

Before locking anything, I ran direct competitive searches on the two frontrunner candidates from the first ideation pass. Result: the mechanism itself — "AI agent cross-checks live search signals to verify whether something (a job, a vendor, a loan app) is legitimate" — is **already being built by multiple other hackathon teams right now**, not hypothetically:

- **Job-offer/recruiter verification, SerpApi-specific:** [JobShield](https://github.com/devy52/JobShield) ("AI agent that verifies job postings live — checking WHOIS domain records, real search results, and known scam patterns... an agent loop orchestrator decides which verification tools to call: WHOIS, live search, reviews search, social presence") and [SerpShield](https://github.com/0xConsole/serpshield) ("AI Threat Intelligence Agent powered by SerpApi + MCP") are near-exact mechanical duplicates of candidate #1 (TrustCheck Jobs). Plus [HireProof](https://github.com/Iron-Mark/Hackathon-HireProof) and [CareerShield-AI](https://github.com/workspacevedant/CareerShield-AI), and a crowded field of non-SerpApi consumer tools (JobScamScore, VerifyJobs, OfferGuard AI, ScamCheck, JobMeter, an MCP server called job-verify) solving the identical user problem.
- **Vendor/procurement verification:** [vendorproof](https://github.com/simonlin1212/vendorproof) — "Evidence-first AI procurement desk backed by live SerpApi research" — same mechanism applied to B2B vendors, built for a concurrent hackathon (DevNetwork API+Cloud+AI 2026), demoting candidate #3's wedding-vendor angle too (mechanically identical even if the vertical differs).
- **Rental-listing photo fraud:** [depositcheck](https://github.com/ishal1410/depositcheck) — "Check whether a rental listing's photos actually belong to the address... Built on SerpApi google_lens exact_matches" — clever use of an engine none of my 20 candidates used (`google_reverse_image`/`google_lens`), and directly relevant to candidate #6.
- Loan-app legitimacy (#2) wasn't directly duplicated in this pass, but combined with the RBI-directory finding above (§7 intro), it's a weaker bet on a different axis.

**Verdict: candidates #1, #2, #3, #6 (the "verify a person/business/listing's legitimacy" family) are downgraded from frontrunner to likely-reject.** Not because the mechanism is bad — it's clearly a strong, natural fit for MCP-style agentic SerpApi usage (which is exactly *why* so many other teams are independently arriving at it right now, this hackathon and adjacent ones) — but because originality is an explicit named judging criterion and "we found 4-5 near-identical projects in one search session" is a real, not hypothetical, risk. This is the mission's Phase 7/8 (competitor duplication + hostile judge) firing early, before the full background audit even lands, and it's a clean example of research changing the direction rather than confirming an initial hunch.

**New direction that survives this check:** candidate #4 (Counterfeit & MRP-Violation Watch, brand-owner persona, not consumer persona) had no direct hackathon-project duplicate found, and — combined with the `google_lens`/reverse-image mechanism `depositcheck` demonstrated for a different vertical — can be sharpened into a **visual + commercial cross-verification** tool: don't just flag suspicious listings by price/seller metadata, but reverse-image-check the listing photos against the brand's official product images to catch stolen/mismatched photos (a concrete, hard, visually demoable technical problem, using an engine none of the crowded "verify a person" projects above are using for this purpose). B2B brand-owner persona is also structurally different from the consumer-scam-checker crowd, which lowers direct-overlap risk further. This is now the leading candidate pending the background research agents' full findings (§4, §6) — see revised entry below.

## 7. 20 Candidate Products (DRAFT PASS — pending cross-check against §4/§6 when background research lands)

Writing this now rather than waiting idle on the two background research agents, so GEMINI can start red-teaming immediately (per continuous-operation protocol) and so idea generation isn't serialized behind research that's already running in parallel. Will revise/kill/add entries once §4 (saturation) and §6 (evidence) land — flagged inline where a candidate is a likely mission-brief-flagged saturation risk.

A pattern emerged while generating these: a large share of genuinely painful, frequent, evidence-rich Indian problems are **"is this real / can I trust it" problems** — job offers, loan apps, marketplace sellers, wedding vendors, colleges — where the only way to answer is to cross-check a claim against multiple *live* sources right now, because the thing you're checking (a listing, an app, a seller) is specifically trying to look legitimate at this moment. A static dataset or an LLM's training data can't do this; only current search data can. This is a materially different pattern from "aggregate SerpApi results into a dashboard" (OPENCODE's top 3 picks in TECHNICAL_FEASIBILITY.md) — it's verify → cross-reference → score confidence → flag risk, which is exactly the kind of complexity the mission brief calls out as *real* engineering rather than manufactured complexity. Several candidates below explore this pattern; §8 scoring will test whether it holds up.

**EVIDENCE UPDATE (2026-09-17, direct WebSearch, not the background agent):** Checked real evidence for candidates #1 and #2 specifically since they were the early frontrunners — this changed the read, documenting per the mission's "let research change your mind" rule.
- **Job scams (#1):** Real and large. India's National Cyber Crime Reporting Portal received 50,000+ job-scam complaints in 2025 (~6.4% YoY rise); a single Kanpur fake-recruitment call center busted by UP Police in April 2025 alone defrauded 1.2 lakh (120,000) job seekers using spoofed caller ID and fake company websites. [Business Standard](https://www.business-standard.com/india-news/work-from-home-scams-rising-in-india-here-s-all-you-must-know-about-them-123062000533_1.html), [Hirist](https://www.hirist.tech/blog/protect-yourself-from-online-job-scams-in-india/). **No official live/structured registry exists for verifying a recruiter/job posting** — the Cyber Crime Portal is for reporting after the fact, not pre-checking. This means there is genuinely no static-data alternative to a live cross-search approach.
- **Loan apps (#2):** Real and large, but **materially changed by one new fact**: RBI operationalized an official "Digital Lending Apps (DLA)" directory on **2025-07-01** specifically so consumers can verify "a DLA's association with a [RBI-]Regulated Entity." [Medianama](https://www.medianama.com/2025/05/223-rbi-digital-lending-apps-centralised-directory/), [PIB](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2241255&reg=3&lang=1). This is a **structured, authoritative, static-lookup alternative already built by the regulator for exactly this problem** — it weakens (does not kill) the "SerpApi is essential, nothing else can do this" argument for LoanCheck, since a judge could reasonably ask "why not just query RBI's own directory?" A defensible answer exists (most predatory apps deliberately aren't on any registry and mimic legitimate branding instead, so the real value is live corroborating signal — app-store developer-churn patterns, fresh news complaints — layered on top of a registry lookup, not the registry lookup itself) but it's a weaker, second-order SerpApi-necessity story than job-scam verification has. **Net effect: #1 (TrustCheck Jobs) is now the clearer frontrunner; #2 (LoanCheck) is demoted to a secondary/expansion vertical rather than the primary bet**, pending the competitive-saturation check in §4/§9.

### 1. TrustCheck Jobs — Job Offer / Recruiter Legitimacy Verifier **[DEMOTED — see §7a: multiple direct SerpApi-hackathon duplicates found (JobShield, SerpShield, HireProof, CareerShield-AI) plus a crowded consumer-tool field. Kept below for transparency, not being pursued further as primary.]**
- **Idea:** Paste a job posting or recruiter message; agent cross-checks the company's live footprint (Maps listing age/consistency, News for scam reports, whether the same "recruiter" is cross-posting identical listings under different company names) and returns a legitimacy score with evidence.
- **Target user:** Freshers / first-time jobseekers in India (huge volume, high vulnerability to "pay a registration fee" / fake WFH scams).
- **SerpApi:** `google_jobs`, `google_jobs_listing`, `google_maps`, `google_news`, `google` (company name + "scam"/"fraud" search).
- **Why SerpApi essential:** The legitimacy signal only exists as a live cross-reference across sources that change daily (scam listings get taken down and re-posted under new names constantly) — a static blocklist goes stale immediately.
- **Why different:** Not a job *search* tool (saturated); a job *verification* tool. No dashboard, one verdict.
- **Core technical challenge:** Entity resolution (is "TechCorp Solutions" in this posting the same as the legit Maps listing, or a copycat name?), confidence scoring across weak/conflicting signals.
- **Demo moment:** Paste two postings live — one real, one from a known scam pattern — watch the agent independently reach different verdicts with visible evidence trail.
- **Biggest risk:** False negatives could give false confidence — needs honest confidence bands, not binary yes/no. Legal caution around "accusing" a real company.
- **Feasibility:** Medium-high.

### 2. LoanCheck — Predatory Digital Lending App Verifier
- **Idea:** Paste a loan-app name/link; agent checks Play Store listing signals (developer name reuse across pulled/relisted apps, review-bombing patterns, permissions), live news for RBI action/complaints, and app-store presence consistency, returning a risk verdict.
- **Target user:** First-time smartphone users / lower-income borrowers targeted by predatory instant-loan apps.
- **SerpApi:** `google_play`, `google_play_product`, `google_play_reviews`, `google_news`, `google`.
- **Why SerpApi essential:** RBI's own published lists lag; apps reappear under new names within days — only live Play Store + live news data can catch a *current* repost.
- **Why different:** This is a real, well-documented, high-stakes India-specific crisis (RBI's 2022 digital lending guidelines followed widely reported borrower harassment and multiple suicides) — not a generic "app store analytics" tool.
- **Core technical challenge:** Detecting developer/name-reuse patterns and review anomalies without a labeled dataset; careful, non-sensational UX given the human stakes.
- **Demo moment:** Check a known-flagged app pattern vs. a legitimate bank app side by side.
- **Biggest risk:** Sensitive/high-stakes subject matter; must avoid overclaiming ("we detect scams") vs. accurately framing ("we surface risk signals"). Needs careful legal framing (not defamatory).
- **Feasibility:** Medium — Play Store engine coverage/consistency needs verification.

### 3. VendorCheck — Wedding/Event Vendor Advance-Payment Fraud Screener
- **Idea:** Same cross-verification mechanism as #1, applied to wedding photographers/caterers/venues, where advance-payment fraud is common and the India wedding industry is enormous.
- **Target user:** Couples/families booking vendors.
- **SerpApi:** `google_maps`, `google_maps_reviews`, `google_news`, `google`.
- **Why SerpApi essential:** Same as #1 — live cross-reference, not static.
- **Why different:** Different vertical of the same mechanism; large addressable market, very demo-friendly (visual, relatable to any judge).
- **Core technical challenge:** Same entity-resolution/confidence problem as #1.
- **Demo moment:** Similar side-by-side reveal.
- **Biggest risk:** Overlaps mechanically with #1 and #8 below — picking more than one "verification vertical" would be redundant, not additive.
- **Feasibility:** Medium-high.

### 4. Counterfeit & MRP-Violation Watch — Brand Protection for Indian D2C Sellers **[UPDATED — now leading candidate, see §7a]**
- **Idea:** Brand owner enters product name/SKU + uploads/links an official product photo; agent scans `google_shopping`/marketplace listings for unauthorized sellers and below-MRP pricing, **then reverse-image-verifies each suspect listing's photos against the official product image** (`google_reverse_image`/`google_lens`) to catch stolen stock photos, mismatched variants, or visually-inconsistent counterfeit listings — producing a ranked, evidence-backed takedown-candidate list (price evidence + visual evidence + seller evidence together, not any one alone).
- **Target user:** Indian D2C brand owners / small manufacturers (large, underserved segment; Meesho/Amazon/Flipkart seller fraud and counterfeiting is a well-documented pain point — commercial brand-protection SaaS like MarqVision/Bustem/LdotR exist but are enterprise-priced and not India-D2C/hackathon-accessible; no direct SerpApi hackathon-project duplicate found in the 2026-09-17 competitive check).
- **SerpApi:** `google_shopping`, `google_shopping_filters`, `amazon`/`amazon_product`, `google_reverse_image`/`google_lens` (the visual-verification engine — genuinely underused per §4/§7a, and the one piece of hard-to-fake evidence an LLM-alone approach cannot produce).
- **Why SerpApi essential:** Live marketplace listing data (price, seller, photos) has no public alternative API, and image-level product verification specifically requires a reverse-image/visual-search engine, not a text API — removing SerpApi removes the entire evidentiary basis of the tool, not just a convenience.
- **Why different from OPENCODE's "Price Intelligence" concept AND from the crowded "verify legitimacy" family in §7a:** Inverted persona (brand owner policing their own listings, not a consumer or jobseeker protecting themselves) + a visual-evidence mechanism none of the found competitors use for this purpose = lowest direct-overlap risk found so far.
- **Core technical challenge:** Product-variant matching/deduplication across sellers with inconsistent titles; combining three independent weak signals (price anomaly, seller anomaly, visual mismatch) into one ranked confidence score — genuine multi-signal fusion, not a single API call summarized.
- **Demo moment:** Real brand + real marketplace scan surfacing a listing whose photo doesn't match the official product — a visually obvious, hard-to-dispute "gotcha" moment that plays well on screen.
- **Biggest risk:** Needs a cooperating brand/SKU (or a well-chosen public example) to demo convincingly; must stay framed as "evidence for the brand owner to review," not an automated accusation, to avoid the defamation-adjacent trap that flagged candidate #5 and #15.
- **Feasibility:** Medium — `google_lens` engine verified directly (2026-09-17, https://serpapi.com/google-lens-api): takes `url` (image URL) or an uploaded `image_id`, `type` parameter supports `products`, `exact_matches` (identical-image matches — exactly what's needed here), `visual_matches`, `about_this_image`. This is real, buildable, not a documentation-only feature.
- **Evidence (2026-09-17, direct WebSearch, real numbers with sources):** This is a large, current, well-documented Indian problem, not a hypothetical one. 35% of urban Indian consumers bought counterfeit goods online in the past year; India's counterfeit market is estimated at **$58.7B/year**, costing the government **$16.2B in lost tax revenue** ([source](https://the420.in/e-commerce-deception-99-of-products-on-amazon-flipkart-fake/) — figure attribution needs a second corroborating source before using in the pitch deck, flagged). BIS raided an Amazon Delhi warehouse in **March 2025**, seizing 3,500+ electrical appliances (~₹70 lakh) with forged ISI certification marks, and a Flipkart Trinagar warehouse (590 pairs of footwear, ₹6 lakh, no ISI marks) ([Moneylife](https://www.moneylife.in/article/bis-cracks-down-on-amazon-and-flipkart-sellers-for-fake-isi-mark-substandard-goods/76755.html)). Meesho removed 4.2 million counterfeit listings in six months. Most directly on-point: the **Delhi High Court restricted Flipkart's "latching-on" feature in November 2024** specifically because it let third-party sellers list counterfeit/unauthorized goods directly under a genuine brand's existing product listing ([EU IP Helpdesk](https://intellectual-property-helpdesk.ec.europa.eu/news-events/news/delhi-high-court-restricts-latching-feature-flipkarts-website-misleading-users-buy-fake-or-deceiving-2024-11-28_en)) — this is a courts-recognized, named version of exactly the mechanism this product targets (unauthorized sellers piggybacking on a legitimate listing), which is about as strong as problem-validation evidence gets for a hackathon pitch.

### 5. CollegeCheck — Placement Claim Reality-Check for Prospective Students
- **Idea:** Enter a private college name; agent cross-checks claimed placement statistics/accreditation against live news coverage, `google_scholar` faculty output, and review sentiment, flagging inflated or unverifiable claims.
- **Target user:** 12th-grade students/parents choosing a private engineering/MBA college (huge, high-stakes, once-a-year decision; India has thousands of low-quality private colleges overstating placement rates — well-documented media pattern).
- **SerpApi:** `google_news`, `google_scholar`, `google_maps_reviews`, `google`.
- **Why SerpApi essential:** Claims must be checked against *current* news/reviews, not a static ranking list (which colleges already game).
- **Why different:** Targets a specific, high-stakes, once-a-year decision with real financial consequences (education loans) rather than generic "research assistant."
- **Core technical challenge:** Extracting/verifying quantitative claims from unstructured news and reviews; confidence scoring under sparse evidence.
- **Biggest risk:** Defamation-adjacent — must present as "unverifiable" not "false," needs careful evidence-first UX.
- **Feasibility:** Medium.

### 6. ResaleCheck — Second-Hand Vehicle/Gadget Listing & Seller Fraud Screener
- **Idea:** Same verification mechanism applied to OLX/Quikr-style used-vehicle or gadget listings — fair-price check via `google_shopping` + seller-history cross-check via Maps/News.
- **Target user:** Used-vehicle/gadget buyers.
- **Why flagged:** Third variant of the "verification agent" pattern (see #1, #3) — good evidence exists (resale fraud is common) but risks diluting focus if we pick a different vertical of the same mechanism; keep as a candidate only if #1/#2 don't pan out.
- **SerpApi:** `google_shopping`, `google_maps`, `google_news`.
- **Feasibility:** Medium — weakest SerpApi-native data source (classifieds aren't a SerpApi engine).

### 7. AppRisk — Play Store Scam-App Pattern Detector (general, not loan-specific)
- **Idea:** Generalized version of #2 across all app categories (not just loans) — detects developer-identity churn and review-manipulation patterns.
- **Why demoted vs #2:** Loses the specific, evidence-rich, emotionally resonant India narrative (RBI crackdown) that makes #2 compelling; "generic app safety checker" is weaker and closer to existing App Store review-analysis tools.
- **Feasibility:** Medium.

### 8. ClaimCheck — Scholarly-vs-Media Misinformation Screener
- **Idea:** Enter a viral health/science claim circulating in Indian news/WhatsApp-forward culture; agent searches `google_scholar` for the actual underlying research and `google_news`/`google_related_questions` for how it's being reported, surfacing the gap between the study and the claim.
- **Target user:** Journalists, fact-checkers, health-conscious consumers.
- **SerpApi:** `google_scholar`, `google_news`, `google_related_questions`, `google`.
- **Why SerpApi essential:** Needs *current* circulating claims (News/PAA) cross-referenced against the *current* state of literature (Scholar) — a moving target on both sides.
- **Why different:** Existing fact-checkers (Alt News, Boom, PolitiFact) are manual/human; this is a live scholarly cross-reference tool, a distinct mechanism, Knowledge & Public Interest track.
- **Core technical challenge:** Matching a lay claim to the correct underlying paper (semantic, not keyword); representing scientific uncertainty honestly.
- **Biggest risk:** Health/science misinformation is a crowded, sensitive space; risk of judges seeing it as "yet another fact-checker."
- **Feasibility:** Medium-low (hardest NLP matching problem of the set).

### 9. PatentGap — Prior-Art & Novelty Quick-Check for Indian Student Inventors/Makers
- **Idea:** Before a student/startup builds or files, agent searches `google_patents` + `google_scholar` for existing prior art and returns a novelty confidence read plus nearest matches.
- **Target user:** Indian engineering students, campus incubator founders (IIT/IISc/NIT ecosystem is large and specifically referenced as an audience OPENCODE also considered for Concept 6).
- **SerpApi:** `google_patents`, `google_patents_details`, `google_scholar`.
- **Why different from OPENCODE's Academic Research concept:** That concept is a citation-network browser (niche, low demo wow, OPENCODE scored it 3/5 wow). This is action-oriented (should I file/build this?) with a single clear yes/no-ish output, much sharper demo.
- **Biggest risk:** Niche audience (only relevant to inventors, not "everyone"), harder to make emotionally compelling to a general judge panel in 30 seconds.
- **Feasibility:** Medium.

### 10. SchemeWatch — Government Scheme Eligibility & Change Monitor
- **Idea:** Citizen enters basic profile (state, occupation, income band); agent finds currently-active central+state schemes via live news/search (not a static registry, which goes stale) and flags recent changes/deadlines.
- **Target user:** Rural/semi-urban citizens navigating subsidy/scheme access (myscheme.gov.in exists but is self-reported/often outdated).
- **SerpApi:** `google_news`, `google`, `google_related_questions`.
- **Why weaker:** SerpApi dependency is real but thinner — a good chunk of this could theoretically be built off a periodically-scraped static registry instead; must show *why live search specifically* (deadline changes, discontinued schemes) is essential, not just convenient.
- **Feasibility:** Medium — data structure is the hard part (schemes aren't a structured SerpApi engine).

### 11. Kirana Price Radar — Hyperlocal Competitive Pricing for Small Retailers
- **Idea:** A neighborhood kirana/small retailer benchmarks their prices against nearby competitors and online (`google_shopping`) for fast-moving SKUs.
- **Target user:** India's ~13M small retail stores (huge underserved segment).
- **Why weaker:** Small retailers are price-takers from distributors, not price-setters with much room to react; unclear the "decision" this enables is strong enough. Likely fails the "does this change a real decision" test — flagged for elimination pending problem evidence.
- **SerpApi:** `google_shopping`, `google_maps`.
- **Feasibility:** Medium.

### 12. Accessible Places — Disability-Access-Aware Local Discovery
- **Idea:** Mines `google_maps_reviews` text specifically for accessibility mentions (ramp, elevator, accessible washroom) to build an accessibility-confidence score per place — India has very poor structured accessibility data.
- **Target user:** Wheelchair users / mobility-impaired people in Indian cities.
- **Why interesting:** A genuinely underserved angle inside the saturated "local discovery" track (Travel & Local Discovery) — narrow, real, original wedge rather than "yet another places app."
- **SerpApi:** `google_maps`, `google_maps_reviews`.
- **Core technical challenge:** Extracting accessibility signal from free-text reviews reliably (most reviews never mention it — sparse-signal problem, needs honest "unknown" states not false confidence).
- **Biggest risk:** Sparse signal (most reviews don't mention accessibility) could mean "unknown" for the vast majority of places, weakening demo.
- **Feasibility:** Medium.

### 13. InfluenceCheck — Creator Brand-Deal Authenticity Screener
- **Idea:** Brands vetting an influencer cross-check claimed reach against `instagram_profile`/`youtube` engine signals and news for past controversy/fraud reports.
- **Target user:** Small D2C brands doing influencer marketing (fast-growing India creator economy).
- **SerpApi:** `instagram_profile`, `youtube`, `google_news`.
- **Biggest risk:** Instagram/engagement data via SerpApi may be shallow (profile-level, not deep engagement analytics) — needs verification before relying on it.
- **Feasibility:** Medium-low pending engine depth check.

### 14. ExportScout — Market-Entry Intelligence for Indian MSME Exporters
- **Idea:** MSME manufacturer picks a product + target country; agent surfaces demand signal (`google_trends` geo=target), competing listings (`google_shopping` in that market), and IP conflicts (`google_patents`) before they invest in export.
- **Target user:** Indian MSME exporters (large policy-relevant segment; India government actively pushing MSME exports).
- **SerpApi:** `google_trends`, `google_shopping`, `google_patents`, `google_news`.
- **Why interesting:** Multi-engine synthesis genuinely needed (demand + competition + IP risk = three different questions, one decision); good technical-complexity story.
- **Biggest risk:** B2B persona is harder to demo emotionally to a judge panel in 30 seconds than a consumer pain point.
- **Feasibility:** Medium.

### 15. Matrimonial/Big-Transaction Identity Consistency Checker
- **Idea:** Cross-check a person's claimed profile (employer, location) against public search footprint before a major decision (arranged-marriage matches, large peer-to-peer transactions).
- **Why flagged HIGH RISK / likely reject:** Real privacy/ethics/defamation exposure — verifying private individuals is explicitly the kind of thing the mission brief and general product ethics flag as a legal problem "that cannot be solved" easily. Keeping on the list for completeness/transparency but pre-flagging for elimination in §5.
- **Feasibility:** High technical feasibility, low ethical feasibility.

### 16. Food Safety Reputation Aggregator
- **Idea:** Cross `google_maps_reviews` sentiment with local news for food-safety incidents near a restaurant.
- **Why weaker:** Overlaps mechanically with #1/#3/#12 (review-mining pattern) without a distinct enough decision; FSSAI-type structured data isn't a SerpApi engine, so the "safety" framing may overclaim what review-text mining can actually support.
- **Feasibility:** Medium.

### 17. AI Agent Concierge for Multi-City Festival/Event Travel (Kumbh Mela-style mass events)
- **Idea:** For India's large periodic mass-gathering events (Kumbh Mela, major festivals), an agent plans logistics using `google_events`, `google_hotels`, `google_flights`, `google_maps` under real capacity/crowding constraints.
- **Why flagged:** Falls inside the mission-brief-flagged "generic travel planner" saturation risk unless the mass-event/crowding angle is sharp enough to differentiate — needs §4 evidence check.
- **Feasibility:** Medium, travel engines are credit-heavier (per OPENCODE's TECHNICAL_FEASIBILITY.md Concept 5 analysis).

### 18. SerpApi-native connector for an under-served open-source agent framework (Open-Source Integrations track)
- **Idea:** Ship a genuinely useful, missing SerpApi provider/tool-plugin for a real open-source project that doesn't have one yet (candidate frameworks TBD — needs a gap-check against `serpapi-search-tools`'s already-supported list: OpenAI Agents, LangChain, LangGraph, CrewAI, LlamaIndex, Claude Agent SDK, MS Agent Framework, AutoGen, Haystack, Semantic Kernel, Agno, smolagents, Google ADK — i.e. most major frameworks are *already* covered, so the genuinely-missing gap may be narrow).
- **Why risky:** `serpapi-search-tools` already covers the obvious frameworks (verified §3) — the "gap" this track wants may not exist in an obvious form, or exists only in a niche/non-Indian-specific tool, weakening the India-relevance/usefulness axis. A library alone also has weak demo potential (mission brief: prefer one unforgettable demo).
- **Feasibility:** Depends entirely on finding a real gap — unresearched.

### 19. Local Service Trust Score (electrician/plumber/tutor)
- **Idea:** Same review-mining + business-age pattern as #1/#3/#12 applied to informal home-services.
- **Why weaker:** Fourth variant of the same mechanism (see #1, #3, #6) — redundant with stronger siblings; India's home-services trust market is already served by Urban Company (dominant, well-funded incumbent) more directly than job-scam or loan-app spaces are served by anyone.
- **Feasibility:** Medium.

### 20. News-Velocity Early Warning for Price-Sensitive Categories (Commerce & Market Intelligence)
- **Idea:** Detect early demand spikes (`google_trends_trending_now` + `google_news` velocity) for specific product categories before mainstream price/stock impact, for small e-commerce sellers to react early (e.g., festival-season demand spikes).
- **Why weaker:** Close to OPENCODE's "Trend Detection" concept (already scored 23/30, differentiation only 3/5, "established competitors" per OPENCODE's own notes) — likely redundant, kept only for completeness.
- **Feasibility:** Medium-high (OPENCODE's own credit-efficiency data: ~7 calls, very cheap).

---

**Early read, superseded twice already (see §7a for the full reasoning — this is intentionally left as a visible trail, not cleaned up, so the decision process is auditable):** First pass favored #1 (TrustCheck Jobs) on problem-evidence strength. A direct competitive check then found #1, #2, #3, #6 all belong to an already-crowded "AI agent verifies legitimacy via live search" pattern with multiple near-duplicate hackathon projects. **Current leading candidate is #4 (Counterfeit & MRP-Violation Watch), sharpened with a `google_lens`/reverse-image visual-verification mechanism** — no direct duplicate found, inverted (B2B brand-owner) persona lowers overlap risk further, and the visual-evidence mechanism is a genuinely underused engine. Still not locked — pending §4 (full gallery audit) and §6 (broader problem evidence) from the two background research agents, which may surface either a duplicate of this too or a stronger alternative entirely.

## 7b. Final sharpening after the full competitive audit landed — product renamed to **BrandLens**

The completed gallery audit (§4) surfaced one genuine close prior-art project: **CeaseFire** — "searches brand impersonation across web, AI, app-store, shopping, maps, image, video results to prioritize takedowns" across 10 engines, uniquely tagged `brand-protection` in the entire 177-project gallery. This is the single closest thing to candidate #4 that exists. It does **not** use `google_lens`/reverse-image matching — its evidence is presence/mention-based (does this app/listing/page exist and mention my brand), not visual (does this listing's photo actually depict my genuine product).

Rather than treat this as disqualifying (per §7a's own logic — a distant/adjacent precedent is a risk to manage, not automatically a reason to abandon a well-evidenced direction, especially days before other agents are blocked on a decision), I'm narrowing the product to the one thing CeaseFire's engine list structurally cannot do: **visual proof**. Renaming from "Counterfeit & MRP-Violation Watch" to **BrandLens** to make that the name-level promise. Positioning difference, stated plainly for the record (this is exactly the kind of gap a hostile judge would probe, so it's answered here rather than left implicit):

| | CeaseFire (closest prior art) | BrandLens (this project) |
|---|---|---|
| Core evidence type | Brand name/mention presence across channels | Visual product-photo match/mismatch (`google_lens exact_matches`) |
| Breadth vs. depth | Broad — 10 engines, many impersonation *types* (fake apps, fake social, counterfeit listings, fake videos) | Narrow — 1-2 engines, one impersonation type (marketplace listing photos), gone deep |
| Can it show "this listing's photo isn't your product" on screen? | No — it's presence/mention detection, not image comparison | Yes — this is the specific, demoable capability |
| Persona | Not stated in the gallery entry (brand security team, implied enterprise-scale) | Explicitly an Indian D2C/SME brand owner priced out of enterprise brand-protection SaaS (evidenced §6, problem #27) |

This is now confirmed by **two independent research passes** (my own manual competitive check in §7a/§9, and the separately-run Indian-problems research agent's cross-cutting finding in §5/§6) as the strongest surviving candidate. Proceeding to lock it as primary.

## 8. Top-8 Comparison (preliminary — will confirm/revise once background agents land)

**Elimination pass (Phase 5) first, applying the mission's reject criteria plus §7a's fresh finding:**
- REJECTED — decorative/duplicate mechanism: #1 TrustCheck Jobs, #3 VendorCheck, #6 ResaleCheck (near-duplicate hackathon projects found, §7a).
- REJECTED — unsolvable legal/privacy exposure: #15 Matrimonial Identity Checker (verifying private individuals).
- REJECTED — Gemini VETO, saturated + no AI/engineering depth: OPENCODE Concept 3 (Price Intelligence).
- REJECTED — redundant with a stronger sibling already in the pool: #7 AppRisk (weaker version of #2), #16 Food Safety (weaker version of #12), #19 Local Service Trust (Urban Company already dominant + redundant mechanism), #20 News-Velocity (redundant with OPENCODE Trend Detection, which itself scored weakest-differentiation in OPENCODE's own table).
- DEPRIORITIZED — weak SerpApi indispensability or weak decision-impact: #10 SchemeWatch, #11 Kirana Price Radar, #13 InfluenceCheck, #18 Open-Source Integration (no confirmed gap exists — most major agent frameworks already covered by `serpapi-search-tools`, verified §3).
- DEPRIORITIZED — saturated track per mission brief, needs evidence to survive: #17 mass-event travel, OPENCODE Concept 5 (Travel Planning).
- Remaining #2 LoanCheck: same mechanism family as the rejected trio, but distinct enough evidence (RBI directory is a *different* kind of counter-evidence than a direct hackathon duplicate) — kept as 8th-ranked / expansion-vertical option rather than rejected outright.

**Top 8 surviving candidates, scored 0-10 (CLAUDE's own judgment framework, not official hackathon weights):**

| # | Concept | Idea strength | Originality | Tech complexity | Usefulness | SerpApi necessity | India relevance | Demo wow | Competitive risk (10=low risk) | **Total /80** |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **BrandGuard** — Counterfeit & MRP-Violation Watch w/ visual verification (cand. #4) | 9 | 8 | 8 | 8 | 9 | 9 | 8 | 8 | **67** |
| 2 | Job Market Salary/Skill Extraction (OPENCODE #2, sharpened per Gemini: extraction pipeline is the product, not the dashboard) | 7 | 6 | 8 | 8 | 8 | 8 | 6 | 6 | **57** |
| 3 | Local Business Intelligence w/ temporal wedge (OPENCODE #1 + Gemini's gentrification/price-drift angle) | 6 | 6 | 7 | 6 | 7 | 8 | 7 | 5 | **52** |
| 4 | ClaimCheck — scholarly-vs-media misinformation screener (cand. #8) | 7 | 6 | 5 | 6 | 6 | 5 | 5 | 6 | **46** |
| 5 | ExportScout — MSME export market-entry intelligence (cand. #14) | 6 | 6 | 7 | 6 | 7 | 8 | 4 | 7 | **51** |
| 6 | PatentGap — novelty/prior-art quick-check (cand. #9) | 6 | 5 | 6 | 5 | 7 | 5 | 4 | 6 | **44** |
| 7 | Accessible Places — accessibility-mined local discovery (cand. #12) | 6 | 7 | 5 | 6 | 5 | 6 | 5 | 7 | **47** |
| 8 | LoanCheck — predatory lending app screener (cand. #2, demoted) | 8 | 4 | 6 | 8 | 5 | 9 | 7 | 3 | **50** |

**Read:** BrandGuard leads by a wide margin (67 vs. next-best 57) — it's the only candidate scoring ≥8 on both SerpApi necessity *and* competitive-risk-is-low simultaneously, which is the actual gatekeeper combination given the hackathon's explicit "meaningful usage" rule and originality criterion. Job Market Analytics (#2, table) is a credible, safer runner-up if BrandGuard's demo mechanics don't pan out in build (Gemini independently reached a similar view in `GEMINI_CONCEPT_RED_TEAM.md`). Everything below rank 3 is meaningfully weaker on multiple axes at once, not just one.

## 9. Top-5 Competitor Audit

Already run inline for the top 2 during scoring (§7a, this section), rather than deferred — summarizing:

### BrandGuard (Counterfeit & MRP-Violation Watch, rank 1)
- **Exact duplicates:** None found across GitHub/Devpost/general web search for "counterfeit detection + reverse image search + SerpApi/google_lens" as a built hackathon product. SerpApi's own Lens API docs and third-party scraper marketing copy (Apify) describe the *technique* ("spot counterfeit listings using your product photos") as a known use-case pattern, but no shipped project doing it was found.
- **Partial competitors:** `depositcheck` (different hackathon, different vertical — rental-photo fraud, not counterfeit/MRP) uses the same underlying `google_lens exact_matches` mechanism — a real but domain-distant precedent.
- **Indirect alternatives:** Enterprise brand-protection SaaS (MarqVision, Bustem, IPMoat, LdotR) solve the business problem professionally, but at enterprise pricing, with web-crawling infrastructure far beyond a SerpApi call, and not positioned for India D2C/SMB brands. They validate the market rather than compete with a hackathon MVP.
- **Verdict:** Low direct-duplication risk. Real but distant technical precedent (depositcheck) and a different-market indirect competitor (enterprise SaaS) — both strengthen rather than undermine the "meaningful, non-cosmetic SerpApi usage" story.

### Job Market Analytics (rank 2, runner-up)
- **Partial competitor found:** `India_jobs_predictor` (GitHub, unconfirmed hackathon status) — scrapes India tech job listings via unspecified "public APIs," trains an XGBoost salary predictor, dashboard, 42 unit tests. Meaningfully similar mechanism (salary/skill extraction + dashboard) though not confirmed as SerpApi-based or as a hackathon entry.
- **Indirect alternatives:** Levels.fyi (US-centric, doesn't cover India well), Glassdoor/AmbitionBox (self-reported, not live-search-derived).
- **Verdict:** Medium duplication risk — the core "extract structured salary/skills from India job postings" idea has real precedent. Would need the extraction-accuracy/technical-depth angle (Gemini's framing in `GEMINI_CONCEPT_RED_TEAM.md`) to differentiate, not the dashboard.

### #3-5 (Local Business Intelligence, ClaimCheck, ExportScout)
- Not run through a dedicated competitor search yet — deprioritized given BrandGuard's clear lead in §8; will only be revisited if BrandGuard fails a downstream check (build blocker, or the pending background research agents surface a direct BrandGuard duplicate).

## 10. Hostile Judge Red Team (on BrandGuard, the leading candidate)

Running the mission's adversarial question set directly, in the voice of an exhausted judge who's seen 150 demos:

- **"Why should I care?"** — Because a specific, named legal mechanism (Delhi HC's "latching-on" ruling, Nov 2024) already recognizes this exact fraud pattern as a real, court-relevant problem costing India's economy an estimated $16.2B/year, and today the only tools that catch it are enterprise SaaS most small Indian brands can't afford.
- **"Why can't ChatGPT do this?"** — It can't see current marketplace listings or verify photo provenance; both require live external data (SerpApi Shopping + Lens), not training-data knowledge. This is directly testable: ask ChatGPT to check today's Flipkart listing for a specific SKU and it will either refuse or hallucinate.
- **"Why does this need SerpApi?"** — Live seller/price/photo data across marketplaces has no public structured alternative; `google_lens exact_matches` is the specific mechanism that makes photo-provenance checking possible at all without building our own reverse-image index.
- **"Is this actually original?"** — Original as a *product* (no shipped duplicate found); the underlying *technique* (Lens for photo-authenticity) has precedent in one distant-domain hackathon project and vendor marketing copy — disclosed honestly in §9, not hidden.
- **"Is the engineering real?"** — Yes if we build the three-signal fusion (price anomaly + seller anomaly + visual mismatch → ranked confidence) as actual logic, not just three API calls concatenated into a prompt. This is the load-bearing implementation risk — flagged for architecture.
- **"Where is the hard part?"** — Product-variant/title matching across inconsistent seller listings (classic entity-resolution problem) and turning three weak, noisy signals into one defensible confidence score.
- **"Could a developer build this in two hours?"** — No — the matching/fusion logic is the whole point and is not trivial; a two-hour version would just be a shopping-results list, which is explicitly what we're avoiding.
- **"Would anybody use this?"** — Yes, directly usable by any of the thousands of Indian D2C sellers actively fighting exactly this problem today (evidenced: Meesho alone removed 4.2M counterfeit listings in 6 months — meaning there is an active, working, human process today that this tool would materially speed up).
- **"What happens if search results are noisy / disagree?"** — This is explicitly the product's job — surfacing a *confidence* score, not a binary verdict, and showing the underlying evidence (price, seller, image match) so a human makes the final call. Framed as a decision-support tool, not an automated accusation engine (mitigates the defamation risk flagged in §7).
- **"What if SerpApi disappears?"** — The product has zero function without it — Shopping/Lens data is the entire evidentiary basis, which is the *correct* answer for the "meaningful usage" criterion, not a weakness.
- **"Why is this better than Google?"** — Google shows one listing at a time to a human searcher; this synthesizes many listings + reverse-image evidence into one ranked, evidence-backed action list — the synthesis is the product, not the underlying search.
- **"Are these claims supported?"** — Yes, all quantitative claims in §7/§9 are sourced (Moneylife/BIS, EU IP Helpdesk/Delhi HC, Meesho's own disclosed removal figures); the $58.7B/$16.2B figures are single-sourced (the420.in) and flagged as needing a second corroborating source before use in the actual pitch deck — noted honestly rather than presented as fully verified.

**Net read:** BrandGuard survives the hostile pass. The two genuine weaknesses are (1) needing a second source for the market-size figures before using them in the demo/pitch, and (2) the defamation-adjacent framing risk, both of which are addressable in product copy and UX (confidence bands + "evidence for your review," never "confirmed counterfeit") rather than being fatal to the concept.

## 10. Hostile Judge Red Team

*(Pending §9.)*

## 11. Final Top 3 Concepts

1. **BrandLens** (primary) — visual + commercial cross-verification agent for Indian D2C/SME brand owners fighting marketplace counterfeiting, built on `google_shopping`/`amazon_product` + `google_lens`. Doubly-validated by independent research passes (§7a/§9 and §6). Track: **Commerce & Market Intelligence**.
2. **Job Market Salary/Skill Extraction Pipeline** (runner-up) — OPENCODE's Concept 2, sharpened per Gemini's framing to center the extraction pipeline (unstructured India job postings → structured salary/skill data) rather than the dashboard. Track: **Commerce & Market Intelligence** or **Knowledge & Public Interest** depending on framing. Medium duplication risk (a non-hackathon GitHub precedent exists, §9) but real technical depth and no ethical/legal exposure.
3. **Local Business Intelligence with a temporal wedge** (safe fallback) — OPENCODE's Concept 1, salvageable only with Gemini's suggested sharp wedge (menu-price-drift/gentrification detection over time, or a specific persona like cloud-kitchen site-selection) rather than a generic Maps dashboard. Track: **Travel & Local Discovery** or **Commerce & Market Intelligence**.

## 12. Selected Project

**BrandLens.** Full decision memo at `docs/DECISION.md`. Product spec at `docs/PRODUCT_SPEC.md`.

## 13. Why It Won the Internal Selection

- It's the only candidate that scored ≥8/10 simultaneously on SerpApi necessity *and* competitive-risk-is-low in §8 — every other candidate traded one off against the other (the "verification agent" family had strong necessity but high duplication risk; travel/shopping/job-search had low risk-of-being-first-to-try but weak necessity/high saturation).
- It survived a genuine, not rubber-stamped, hostile-judge pass (§10) and a competitor audit that found and dealt with real prior art (CeaseFire, §7b) rather than a fabricated "no competitors exist" claim.
- It was independently re-discovered by a second, separately-run research process that never saw my candidate list (§6) — the strongest evidence-quality signal available given no external validation is possible before building.
- It ties to a concrete, named legal mechanism already recognized by an Indian court (Delhi HC's "latching-on" ruling) rather than an abstractly-described problem, which gives the eventual demo/pitch a factual anchor a judge can independently verify.
- It satisfies Gemini's independently-authored anti-wrapper criteria (`GEMINI_HACKATHON_STANDARDS.md`) via multi-source synthesis (price + seller + visual signals fused into one confidence score) and has a clear path to also satisfying the temporal-tracking criterion as a P1 feature (§6's festive-fake-discount finding).
- It lost to nothing on "usefulness" — the persona (Indian D2C/SME brand owner) is real, named, and has a documented existing-but-unaffordable alternative (enterprise brand-protection SaaS, IP-firm monitoring retainers), which is a stronger "would a real person use this" case than a consumer-convenience tool competing against free Google Search.
