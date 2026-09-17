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

*(Pending — running as a background research agent against the official gallery, GitHub, Devpost, Product Hunt, HN. Will be inserted here on completion, then cross-referenced with OPENCODE's 7 scored concepts in `docs/TECHNICAL_FEASIBILITY.md` — 3 of which fall inside categories the mission brief pre-flags as saturation risks: generic shopping/price comparison, generic travel planning. Full writeup will also populate `docs/COMPETITIVE_LANDSCAPE.md`.)*

## 5. Indian Problem Research

*(Pending — running as a background research agent, target 25-30 evidence-backed problems across commerce, education, jobs, public services, consumer protection, local discovery, travel, legal/professional research, market intelligence, patents, real estate, logistics, agriculture, healthcare access, etc. Will be inserted here on completion.)*

## 6. 30 Evidence-Backed Problems

*(Pending §5.)*

## 7. 20 Candidate Products

*(Pending §4 and §6 — idea generation is downstream of knowing what's saturated and what's real.)*

## 8. Top-8 Comparison

*(Pending §7.)*

## 9. Top-5 Competitor Audit

*(Pending §8.)*

## 10. Hostile Judge Red Team

*(Pending §9.)*

## 11. Final Top 3 Concepts

*(Pending §10.)*

## 12. Selected Project

*(Pending — will be mirrored into `docs/DECISION.md`.)*

## 13. Why It Won the Internal Selection

*(Pending.)*
