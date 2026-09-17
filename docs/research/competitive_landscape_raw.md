# SerpApi Ecosystem — Competitive Landscape Raw Research
**Purpose:** Fact-gathering for SerpApi India Hackathon 2026 (deadline Oct 5, 2026) idea selection. This document catalogues existing SerpApi-based projects to identify saturated vs. underexplored territory. **This is not a recommendation document** — no idea is picked here, only evidence is organized for a teammate to use.

**Compiled:** 2026-09-17

---

## Sources consulted

Directly fetched / searched (via WebFetch and WebSearch tools) during this research:

1. https://serpapi.github.io/BuiltWithSerpApi/ — official community gallery (rendered page)
2. https://github.com/serpapi/BuiltWithSerpApi — gallery source repo (structure)
3. https://raw.githubusercontent.com/serpapi/BuiltWithSerpApi/main/src/_data/projects.json — **raw structured data file, 177 project entries** (primary dataset for this report)
4. https://api.github.com/repos/serpapi/BuiltWithSerpApi/git/trees/main?recursive=1 — repo file tree (used to locate the JSON data file)
5. https://serpapi.github.io/serpapi-india-hackathon-2026/ — the hackathon's own site (tracks, prizes, rules, judging criteria)
6. https://api-cloud-ai-hackathon-2026.devpost.com/project-gallery — DevNetwork [API+Cloud+AI] Hackathon 2026 Devpost gallery (315 total projects; searched for SerpApi usage)
7. https://github.com/topics/serpapi — GitHub topic page listing repos tagged "serpapi"
8. https://devpost.com/software/search?query=serpapi — attempted direct Devpost search (returned empty/blank via fetch tool — JS-rendered, could not extract; see limitations)
9. WebSearch: `site:github.com "serpapi" hackathon project -serpapi/BuiltWithSerpApi`
10. WebSearch: `devpost.com "SerpApi" hackathon project`
11. WebSearch: `"SerpApi" site:producthunt.com`
12. WebSearch: `"SerpApi" site:news.ycombinator.com`
13. WebSearch: `SerpApi hackathon 2025 devpost winners`
14. WebSearch: `"SerpApi" "product hunt" launch AI search tool`
15. WebSearch: `github "google-search-results" OR "serpapi" flight tracker OR "job scraper" OR "price tracker" stars`
16. WebSearch: `"SerpApi" "google_patents" project github OR devpost`
17. WebSearch: `"SerpApi" "ads transparency" project`
18. WebSearch: `"SerpApi" "google_play" OR "Google Play API" project scraper`
19. WebSearch: `"SerpApi" "trends_trending_now" OR "trending now" project`
20. WebSearch: `"SerpApi" "google_maps_reviews" sentiment analysis project github`
21. WebSearch: `"SerpApi" "google_scholar" "case law" project OR "forums" engine project`

All 177 individual project citations below link to the project's own GitHub repo and/or live demo, as published in the official gallery's data file (source #3).

---

## Methodology note — FACT vs INFERENCE

- **FACT** = directly observed in a fetched page, search result, or the gallery's structured JSON (name, description, author, links, tags, APIs used, date added).
- **INFERENCE** = my own judgment call, e.g., mapping a project to one of the hackathon's 6 tracks, deciding whether "AI/LLM" is used beyond SerpApi calls when not explicitly stated, or grouping projects into a "cluster." These are flagged explicitly.
- Where a search returned few or no results, this is reported as **"limited/no results found"** — treated as weak evidence of scarcity, not proof of absence. Nothing below is invented; every project listed has a real citation.

---

## Part 1 — The Official Gallery (BuiltWithSerpApi): dataset overview

The gallery's own data file (`src/_data/projects.json`) contains **177 project entries** as of the fetch date (2026-09-17), each with: name, description, author, dateAdded, githubUrl, hostedUrl, tags[], apis[]. This is the single richest, most authoritative dataset available for this research and is used as the backbone of this report.

**FACT — submission date distribution** (by month added to gallery):
| Month | # projects added |
|---|---|
| 2026-06 | 55 |
| 2026-07 | 12 |
| 2026-08 | 24 |
| 2026-09 | 86 |

**INFERENCE:** The June spike correlates with many projects named "PyCon 2026 …" (e.g., *PyCon 2026 Knowledge Graph*, *PyCon SerpApi Vibe*, *PyConUS2026 Search Compare*, *Pyfood*, *Car Search Notification — PyCon 2026*), suggesting a PyCon 2026 SerpApi workshop/tutorial cohort. The September spike correlates with repo names containing "devnetwork-2026," "hack-devnet," "apiworld-2026," and "hackathon" (e.g., *Overturn* → `overturn-devnetwork-hackathon-2026`, *BrandProof* → `brandproof-devnetwork-2026`, *Proofline* → `proofline-apiworld-2026`), suggesting most of the largest cluster (see Part 4) came from the **DevNetwork [API + Cloud + AI] Hackathon 2026** (Sept 4–5, 2026, co-located with API World), not from a prior "SerpApi India Hackathon." This is useful context: the dominant saturated pattern below is very recent (last ~2 weeks before this research) and was produced by one specific hackathon's problem framing.

### FACT — SerpApi engine usage across all 177 gallery projects

| Count | Engine/API |
|---|---|
| 108 | Google Search API |
| 28 | Google News API |
| 28 | Google Maps API |
| 20 | Google Shopping API |
| 15 | Google Flights API |
| 12 | Google Trends API |
| 10 | Google Scholar API |
| 8 | Google Hotels API |
| 7 | YouTube Search API |
| 7 | Google Jobs API |
| 6 | Google Images API |
| 6 | Google Lens API |
| 5 | Google Local API |
| 5 | Amazon Search API |
| 5 | Google AI Mode API |
| 5 | Google Light Search API |
| 4 | Google Autocomplete API |
| 4 | Google Maps Reviews API |
| 4 | Google Patents API |
| 3 | Google Events API |
| 3 | Tripadvisor Search API |
| 3 | YouTube Video Transcript API |
| 3 | Yelp Search API |
| 3 | Google Ads Transparency API |
| 3 | Google AI Overview API |
| 2 | DuckDuckGo Search API |
| 2 | Search Index |
| 2 | Google News Light API |
| 2 | eBay Search API |
| 2 | Tripadvisor Reviews API |
| 2 | Yelp Reviews API |
| 2 | Apple App Store API |
| 1 each | Instagram Profile API, Google Related Questions API, Baidu Search API, Bing Search API, Yahoo! Search API, Yandex Search API, Naver Search API, Amazon Product API, Google Shopping Light API, Google Sports API, Google Images Light API, Google Trends Trending Now API, eBay Product API, The Home Depot Search API, The Home Depot Product API, Google Local Services API, Google Travel Explore API, Tripadvisor Place API, YouTube Video API, Google Reverse Image API, Google Scholar Case Law API, Google Finance API, Apple App Store Reviews API, Google Immersive Product API, Google Flights Autocomplete API, Google Ads API, Zillow Search API, Google Maps Directions API, Google Play Store API, Google Patents Details API |

### FACT — top tags across all 177 projects (of 138 distinct tags used)

| Count | Tag |
|---|---|
| 46 | research |
| 31 | verification |
| 25 | agent |
| 20 | travel |
| 19 | automation |
| 19 | shopping |
| 16 | documents |
| 14 | maps |
| 13 | news |
| 13 | images |
| 13 | flights |
| 12 | monitoring |
| 9 | ai |
| 9 | security |
| 8 | beauty |
| 7 | seo |
| 7 | search |
| 6 | fact-checking |
| 6 | hotels |
| 6 | jobs |
| 6 | education |
| 6 | lead-generation |
| 6 | analytics |
| 6 | market-research |
| 5 | price-comparison |
| 5 | local-search |
| 5 | alerts |
| 5 | startups |
| 4 | rank-tracking |
| 4 | market-intelligence |
| 4 | real-estate |
| 4 | itinerary |
| 4 | fashion |
| 4 | crm |
| 3 | procurement, invoicing, healthcare, blockchain, voice, matching, events, conference, youtube, dashboard, outreach, prices |

---

## Part 2 — Full project catalog (all 177 gallery projects)

Source for every row: `src/_data/projects.json` in the [BuiltWithSerpApi repo](https://github.com/serpapi/BuiltWithSerpApi), fetched 2026-09-17. This is the complete enumeration requested in the task (well beyond the 25–40 minimum).

| # | Project | Author | Description | SerpApi Engines Used | Tags | Links |
|---|---|---|---|---|---|---|
| 1 | AccessForm | ali-amjad52114 | Helps callers complete official forms by phone, using SerpApi to discover government sources and nearby assistance providers. | Google Search API, Google Maps API | documents, voice, accessibility | [repo](https://github.com/ali-amjad52114/accessform) |
| 2 | Account Intelligence Radar | Shaimaa Almously | Company research platform that uses SerpApi to discover sources and produces structured, traceable intelligence reports. | Google Search API | market-intelligence, research, reporting | [repo](https://github.com/shaimaaalmously054-beep/account-intelligence-radar) |
| 3 | AdWatch | Joseph Karns | Monitors competitors' advertising and search demand through SerpApi's Google Ads, Ads Transparency, Trends, and Autocomplete APIs. | Google Ads API, Google Ads Transparency API, Google Trends API, Google Autocomplete API | advertising, monitoring, analytics | [repo](https://github.com/jkarns87/AdWatch) |
| 4 | AegisFlow | Tushar Agarwal | Investigates procurement incidents using SerpApi searches for external corroboration and prepares evidence for a human decision-maker. | Google Search API | procurement, research, agent | [repo](https://github.com/TusharTechs/aegisflow) / [demo](https://aegisflow-ai.vercel.app) |
| 5 | AI Appointment + Sales Agent | Allavudeen S | n8n-based conversational agent that handles appointment booking, rescheduling, cancellations, sales-register lookups, and live web search using SerpApi. | Google Search API | agent, appointments, sales | [repo](https://github.com/Allavudeen/ai-automation-consulting) |
| 6 | AI Hiring Signal Pipeline | Mukut Khandelwal | n8n pipeline that collects Google Jobs results through SerpApi, classifies hiring signals, and prepares records for prospect enrichment and sales prioritization. | Google Jobs API | jobs, signals, automation, lead-generation | [repo](https://github.com/mukutkhandelwal/ai-hiring-signal-pipeline) |
| 7 | AI Job Copilot | Chetandeep Singh | Multi-agent job search system that discovers roles through SerpApi Google Jobs, evaluates fit, tailors resumes, generates PDFs, and stores learning memory. | Google Jobs API | jobs, agent, resume | [repo](https://github.com/chetandeepsingh91-creator/agentic-job-search) |
| 8 | AI Lead Research Flow | Nida Fatima | n8n workflow that uses SerpApi Google Maps search to find businesses, enriches them with AI research, identifies automation opportunities, and saves qualified leads to Google Sheets. | Google Maps API | lead-generation, maps, automation | [repo](https://github.com/nida-fatima247/ai-lead-generation) |
| 9 | AI Learning Path Generator | Devi Krishna Manoj | Automation workflow that creates personalized learning roadmaps, generates Google Docs study plans, and optionally schedules tasks in Google Calendar. | Google Search API | education, automation, llm | [repo](https://github.com/devik-sys/ai-automation-projects) |
| 10 | AI Opportunity Scout | Aditya Srivastava | Matches developers with live hackathons, internships, and competitions by ranking SerpApi Google Search results against their skills, location, and opportunity type. | Google Search API | opportunities, hackathons, matching, search | [repo](https://github.com/dev-aditya-design/ai-opportunity-scout) |
| 11 | AI Quiz Generator | Basit Abbas | Generates quizzes from uploaded documents or searches the web through SerpApi when additional context is needed. | Google Search API | education, quiz, search | [repo](https://github.com/baasit-abbas/MCQ-Generator) |
| 12 | AI Tailor | Nawaz shaikh | Recommends outfits, sources visual references through SerpApi's Google Images API, and supports virtual try-on. | Google Images API | fashion, images, ai | [repo](https://github.com/nk5092091-del/AI-Tailor) |
| 13 | AI Travel Agent | Taanyaa Haridass Prasad | Uses SerpApi to find flights, airports, hotels, and local places while building a travel itinerary. | Google Flights API, Google Flights Autocomplete API, Google Hotels API, Google Local API | travel, flights, hotels | [repo](https://github.com/taanyaaharidassprasad06/travel-agent) |
| 14 | AI Travel Planner | Sagar S.Rao | Streamlit multi-agent travel planner using local Ollama agents plus SerpApi search to research destinations and generate itineraries. | Google Search API | travel, agent, itinerary | [repo](https://github.com/sagarsrao/ai-travel-agent) |
| 15 | AlonTrip | alonuniverse | Plans East Asian trips with transit information and itineraries, using SerpApi's Google Maps API to discover attractions. | Google Maps API | travel, maps, itinerary | [repo](https://github.com/alon1997/alontrip) |
| 16 | Amazon FBA Listing Generator | Nitish Mane | Researches competing Amazon products, Google results, and autocomplete suggestions through SerpApi to generate product listings and keywords. | Amazon Search API, Google Search API, Google Autocomplete API | ecommerce, seo, shopping | [repo](https://github.com/Nitishmane/serp-hack) |
| 17 | ApplyPilot | Alyht | Finds jobs through SerpApi's Google Jobs API, then matches opportunities to a user's profile with evidence and deterministic scoring. | Google Jobs API | jobs, matching, ai | [repo](https://github.com/Alyht/ApplyPilot) |
| 18 | Atlas | Vínicius Oliveira | Telegram travel agent that finds and monitors flexible flight and accommodation deals using SerpApi Google Flights and Google Hotels. | Google Flights API, Google Hotels API | travel, flights, hotels | [repo](https://github.com/Haasytr/atlas) |
| 19 | AuthentiCheck | Ashutosh Pawar | Checks text, source code, and images for plagiarism using SerpApi's Google Search and Google Reverse Image APIs. | Google Search API, Google Reverse Image API | plagiarism, verification, images, code | [repo](https://github.com/Ashutosh-Pawar29/PlagiarismDetectionSys) |
| 20 | Autonomous AI Job Hunter | Karthik Banda | Automated LLM-powered job aggregation and evaluation pipeline: real-time listings, scoring, cover letters, alerts. | Google Jobs API | jobs, automation, llm | [repo](https://github.com/Karthik-Banda/Autonomous-AI-Job-Hunter) |
| 21 | Autonomous Outreach Pipeline | Ananay Srivastava | Serverless outreach ETL pipeline running SerpApi Google AI Mode company research, routed via Cloudflare Workers into Sheets/Make.com. | Google AI Mode API | outreach, automation, market-intelligence | [repo](https://github.com/Ananay-25/Autonomous-Outreach-Pipeline) |
| 22 | Baseline | Jacobo Posada | Finds skincare product claims through SerpApi Search and compares repeated skin measurements to assess routine changes. | Google Search API | beauty, research, analytics | [repo](https://github.com/Jacobopp27/baseline) |
| 23 | Basic Content Agent AI | Faisal Moarafur Rasul | n8n agentic workflow with Supabase memory, conditional SerpApi web search, Groq routing, self-critique, email delivery. | Google Search API | agent, automation, email | [repo](https://github.com/faisalmrasul/Inquiro-Basic_Content_Agentic-AI) |
| 24 | BillShield | chinesepowered | Reviews hospital bills and searches published procedure prices through SerpApi to support a billing-dispute letter. | Google Search API | healthcare, documents, price-comparison | [repo](https://github.com/chinesepowered/hack-devnet) |
| 25 | BlogMind AI | Ashir Iqbal | Flask blog intelligence platform that discovers blog URLs through SerpApi, analyzes sentiment/topics, generates engagement comments. | Google Search API | blogs, analysis, automation | [repo](https://github.com/ashiriqbal18/Automated-Blog-Posting-Engagement-System) |
| 26 | BrandProof | aviad12g | Combines beauty-product documents with current product offers via SerpApi's Google Shopping API. | Google Shopping API | beauty, marketing, shopping | [repo](https://github.com/aviad12g/brandproof-devnetwork-2026) |
| 27 | Campaign Weather | Tarik Moody | Tracks election advertising, news coverage, and search interest via SerpApi Ads Transparency, Search, Trends. | Google Ads Transparency API, Google Search API, Google Trends API | analytics, news, advertising | [repo](https://github.com/tmoody1973/campaign-weather) |
| 28 | Campus Connect | Nishank Jain | AI college research agent answering admissions/fee questions, speeding Q&A with SerpApi Search. | Google Search API | education, ai, research | [repo](https://github.com/Nishank-jain-5/campus-connect) |
| 29 | Car Search Notification | Hyun Barng | Searches for used cars near a ZIP code, filters by budget/mileage/criteria. | Google Search API, Google Maps API | cars, local-search, alerts | [repo](https://github.com/harrybarng/Car-Search-Notification-PyCon-2026-SerpAPI) |
| 30 | CeaseFire | Midhun | Searches brand impersonation across web, AI, app-store, shopping, maps, image, video results to prioritize takedowns. | Google Search API, Google AI Overview API, Google AI Mode API, Google Play Store API, Apple App Store API, Google Shopping API, Google Maps API, YouTube Search API, Google Images API, Google Trends API | security, monitoring, brand-protection | [repo](https://github.com/midhunrajcharles/Ceasefire) |
| 31 | Chancery | RaYYeR | Checks counterparties, brand conflicts, adverse reports before allowing an agent to act within signed permissions. | Google Search API, Google Light Search API, Google News API, Google Patents API, Google Scholar Case Law API, Google Maps API, Google Maps Reviews API, Google Trends API, Google Ads Transparency API, Amazon Search API, Google Finance API | agent, verification, documents | [repo](https://github.com/RaYYeR220/chancery) |
| 32 | Charter | Hriday Vig | Researches business-name conflicts via SerpApi while preparing a business-formation document packet. | Google Search API | documents, startups, agent | [repo](https://github.com/vighriday/Charter) |
| 33 | Civis RJ - Predictive Command Center | Rodrigo Carvalho | Supports public-works audits/delay investigations with Brazilian news via SerpApi's Google News API. | Google News API | infrastructure, news, analytics | [repo](https://github.com/Rodrigo5431/civis-rj_hackaton) |
| 34 | ClauseProof | wraithsupplements | Checks contract counterparties against SerpApi Search results, attaches evidence for human approval. | Google Search API | documents, verification, research | [repo](https://github.com/wraithsupplements/clauseproof-webmcp) |
| 35 | ClearSpace AI | 盧露 | Finds duplicate media/large files; storage advice informed by SerpApi's Google AI Mode API. | Google AI Mode API | productivity, ai, research | [repo](https://github.com/lucylow/storage-cleaner-mobile) |
| 36 | ClinicalBrief AI | Uday Shankar Bhowal | Uses SerpApi Google Scholar to retrieve clinical research/guidelines for briefs from patient lab inputs. | Google Scholar API | healthcare, research, automation | [repo](https://github.com/udaytx009/ClinicalbriefAI) |
| 37 | Competitive Intelligence Agent | SerpApi Team (official) | Competitive intelligence workflow with SerpApi engines, OpenAI, optional HubSpot add-on. | Google Search API, Google News API, Google Maps API | featured, market-intelligence, agent, automation | [repo](https://github.com/serpapi/competitive-intelligence-agent) |
| 38 | ComplyGraph AI | AbdulKabir Subair | Extracts invoice fields, cross-checks VAT IDs against public registry search via SerpApi. | Google Search API | documents, verification, invoicing | [repo](https://github.com/subair99/comply-graph) |
| 39 | Contrarian | ven venn | Tests business ideas against failure conditions using SerpApi search, news, scholar, trends, local-business evidence. | Google Search API, Google News API, Google Scholar API, Google Trends API, Google Maps API | market-research, research, agent | [repo](https://github.com/venvennnn/contrarian) |
| 40 | CounterSign | Carlos Sanoja | Investigates supplier invoices using SerpApi web/news/address searches; reserves decisions for people. | Google Search API, Google News API, Google Maps API | invoicing, security, verification | [repo](https://github.com/CarSanoja/countersign) |
| 41 | Creator Lens | SerpApi Team (official) | Analyzes YouTube creator strategy with AI using SerpApi data and DeepSeek. | YouTube Search API | featured, youtube, ai, analysis | [repo](https://github.com/serpapi/creator-lens) |
| 42 | DEALCLOSE | hashmessi | Researches property details/comparable listings via SerpApi before drafting real-estate documents. | Google Search API | real-estate, documents, research | [repo](https://github.com/hashmessi/DealClose) |
| 43 | DepositCheck | Vishal Patel | Checks rental listing photos against exact Google Lens matches to detect scams before a deposit is paid. | Google Lens API | rentals, verification, images, safety | [repo](https://github.com/ishal1410/depositcheck) |
| 44 | Diamond Evidence Gate | kiencuongnguyen88 | Collects current Google Search evidence for consequential decisions with human approval + audit receipt. | Google Search API | verification, documents, agent | [repo](https://github.com/kiencuongnguyen88/diamond-evidence-gate) |
| 45 | Document Trust Gate | Bryan | Extracts document evidence, cross-checks claims via SerpApi Search before routing for human approval. | Google Search API | documents, verification, research | [repo](https://github.com/equinoxaifinance-rgb/document-trust-gate) |
| 46 | Dossier | Shamnad Shaji | Researches CRM accounts with SerpApi News/Search to generate cited company briefs and outreach drafts. | Google News API, Google Search API | sales, research, crm | [repo](https://github.com/shamnadps/dossier) |
| 47 | DriftWatch | Faisal Shariff | Collects company coverage via SerpApi News, compares against baselines to detect narrative drift. | Google News API | news, monitoring, analytics | [repo](https://github.com/faisalshariff123/DriftWatch) |
| 48 | Droit de Retard | Chouam Samy, Xerxai, Arnaud Durand117 | Local-first EU261 assistant: extracts travel doc info, checks passenger-rights sources, finds airline claim channels. | Google Light Search API | travel, legal, eu261 | [repo](https://github.com/Claken/Paris-Gemma-4-Hackaton) |
| 49 | Ember | Arihant Agarwal | Combines skin analysis + virtual styling with clothing/beauty offers via SerpApi Shopping. | Google Shopping API | beauty, fashion, shopping | [repo](https://github.com/arihantagarwal/ember) |
| 50 | FaceChain | Punyashree H S | Uses SerpApi Lens to find public image candidates, compares face embeddings, records SHA-256 on local blockchain. | Google Lens API | images, verification, security, blockchain | [repo](https://github.com/Punya2711/face-blockchain-pipeline) |
| 51 | FactoryPulse AI | Sushanta Chowdhury | Industrial diagnostics: searches technical standards/bulletins via SerpApi before maintenance recommendations. | Google Search API | manufacturing, monitoring, analysis, research | [repo](https://github.com/sushantachowdhury/FactoryPulse-AI) |
| 52 | FacTruth | Aditya Kamath | Checks claims against Search + News results from SerpApi, presents a verdict with sources. | Google Search API, Google News API | fact-checking, news, verification | [repo](https://github.com/Adity-kamath/FacTruth) |
| 53 | Fake News Detection | Vamsi Pabbiti | Fact-checking web app: live Google searches via SerpApi + Groq classification with confidence scores. | Google Search API | fact-checking, news, verification | [repo](https://github.com/Vamsi-Pabbiti/Fake-News-Detection) |
| 54 | FamilyOut | Brian Chin | Helps families discover local events/activities by city, date, category, kid-friendly filters. | Google Events API, Google Local API | family, events, local-search | [repo](https://github.com/brianchin-sudo/familyout) |
| 55 | FitToFly | Raj Shah | Plans wardrobe-inspired vacations with SerpApi flight searches + shopping results for clothing. | Google Flights API, Google Shopping API, Google Immersive Product API | travel, fashion, flights | [repo](https://github.com/ShahRajS/FitToFly) |
| 56 | Fleet Command | Brock Falfas | Adds SerpApi market research to an agent-based ops workspace where a human approves changes. | Google Search API | agent, automation, research | [repo](https://github.com/thebrockchain/fleetcommand) |
| 57 | Flight Price Tracker | Jorge Luis Del Angel Maldonado | Python automation monitoring fares via SerpApi Flights, sends WhatsApp alerts on price drops. | Google Flights API | travel, flights, alerts | [repo](https://github.com/Jorge-delangel/Flight-Price-Tracker) |
| 58 | Flight Search Dashboard | Anjali Juikar | Streamlit dashboard querying SerpApi Flights for real-time routes/prices/airlines/durations. | Google Flights API | travel, flights, dashboard | [repo](https://github.com/AnjaliMMM0888/Flight_App) |
| 59 | Flight Search Script | Ruben | Automates recurring flight searches between two places to monitor deals. | Google Flights API | flights, automation, travel | [repo](https://github.com/rgimen3z/serp-api-example) |
| 60 | FlightDeals Tracker | Akhil Mende | Pulls Google Flights via SerpApi, stores fares, scores routes with rule-based filters + local Ollama LLM. | Google Flights API | travel, flights, deals | [repo](https://github.com/akhil99558/FlightDeals_Test) |
| 61 | Foundry Atlas | Joaquin Matres | Helps chip designers discover/compare semiconductor foundries via search aggregation + interactive map. | Google Search API | semiconductors, maps, discovery | [repo](https://github.com/joamatab/foundry-atlas) |
| 62 | Gemma² / Gemma Autopilot | Wilfred Doré, François Amat | Autonomous agent benchmarking a Gemma 4 deployment, changing config, repeating until performance improves. | Google Light Search API | agent, optimization, benchmarking | [repo](https://github.com/wilfred-dore/gemma-autopilot) |
| 63 | Giftly | Niyor Gogoi | Gift recommendations from recipient description/budget using SerpApi Shopping for real products/prices. | Google Shopping API | shopping, recommendations | [repo](https://github.com/niyor1/giftly) |
| 64 | Glow Proof | harrymakoni-netizen | Combines skin analysis with SerpApi Shopping results to suggest a skincare shopping list. | Google Shopping API | beauty, shopping, product-discovery | [repo](https://github.com/harrymakoni-netizen/glow-proof) |
| 65 | Google Maps Business Tracker | Mehul Kumawat | Python monitor scanning Maps results by category/location, records new places, email/Telegram alerts. | Google Maps API | maps, local-search, alerts | [repo](https://github.com/MehulKumawat0221/gmaps_tracker) |
| 66 | Google Maps Lead Scraper | Jannat Bali | Finds businesses via SerpApi Maps, extracts emails, dedupes, saves leads to Sheets. | Google Maps API | lead-generation, maps, google-sheets | [repo](https://github.com/studentJannatBali/Google-Maps-Business-Lead-Scraper) |
| 67 | Google Maps New Business Tracker | Ronak Bihani | Searches Maps by location/category, detects new listings vs. SQLite history, alerts via Telegram/email. | Google Maps API | lead-generation, maps, monitoring, alerts | [repo](https://github.com/ronakbihani123/New_Business_Tracker) |
| 68 | GoTrip AI | Manish Prajapati | Multi-agent travel planner adding live flight options to personalized itineraries (LangGraph). | Google Flights API | travel, flights, itinerary, agent | [repo](https://github.com/Manish7512/GoTrip-AI---A-Multi-Agent-Travel-Planner-with-LangGraph) |
| 69 | Grant Scout | ARKNET DIGITAL | Finds funding opportunities via SerpApi Search, turns results into recommendations with source links. | Google Search API | funding, startups, research | [repo](https://github.com/jayblast-spec/grant-scout) |
| 70 | Grid Guardian Intel | Impactquadrant | Adds SerpApi news/web search to industrial-device vulnerability investigations, source-linked security briefs. | Google News API, Google Search API | security, news, research | [repo](https://github.com/icohangar-ops/grid-guardian-intel) |
| 71 | GroundPitch | adamblackoak | Checks time-sensitive marketing claims against current Search results before human review. | Google Search API | marketing, verification, documents | [repo](https://github.com/adamblackoak/groundpitch) |
| 72 | Grounds | harshwardhan | Audits claims about a company in Google AI Mode/AI Overviews, inspects citations, seeks corroboration. | Google AI Mode API, Google AI Overview API, Google Search API, Google News API, Google Scholar API, Google Patents API, Google Maps API | research, verification, seo | [repo](https://github.com/harshwardhan-kp/grounds) |
| 73 | HermigoBot | Kushwanth Parameshwaraiah | SMS multi-agent vacation planner for group trips: Tripadvisor places + Hotels + Flights. | Tripadvisor Search API, Google Hotels API, Google Flights API | travel, hotels, flights | [repo](https://github.com/kira2406/hermigo_vacation_bot) |
| 74 | Hippocrate | Jilankum, Matéo Le Bras Sancho | Private family health assistant explaining local medical records, using Scholar searches for clinical evidence. | Google Search API, Google Scholar API | health, medical, research | [repo](https://github.com/MatLBS/front-gemma-hackathon) |
| 75 | hmmm | GURKIRAT SINGH | Records/organizes spoken ideas, uses SerpApi Search to research competitors and attach sources. | Google Search API | voice, productivity, research | [repo](https://github.com/Gurkirat-Singh-bit/hmmm) |
| 76 | Ignition | king-star-12 | Researches startup ideas via SerpApi Search, assembles cited findings + viability assessment + work plan. | Google Search API | startups, market-research, research | [repo](https://github.com/king-star-12/ignition) |
| 77 | Image Search to Sheets | Patrick Cabrera | Searches Google Images via SerpApi, validates URLs, writes one verified result per name to Sheets. | Google Images API | images, automation, google-sheets | [repo](https://github.com/codewithpatrick0/extract_data) |
| 78 | IntelliSelect | Zainab Raza Malik | Chrome extension explaining selected text with AI providers, fetching educational Google Images via SerpApi. | Google Images API | education, chrome-extension, images | [repo](https://github.com/zainabraza06/IntelliSelect) |
| 79 | Iria | Mabrouk Chouikri | Privacy-first visual assistant for blind/low-vision users; SerpApi retrieves web facts/nearby places via text-only queries. | Google Search API, Google Maps API | accessibility, vision, maps | [repo](https://github.com/mchouikr/iria) |
| 80 | IsThisSafe? | shrikantwagh | Identifies products from photos, researches recalls/safety warnings, finds replacements/disposal via SerpApi. | Google Lens API, Google Search API, Google News API, Google Shopping API, Google Maps API | images, verification, shopping | [repo](https://github.com/shrikantwagh/is-this-safe) |
| 81 | Jarvis Voice | bigsk1 | Self-hosted AI assistant (voice/chat/automation) with a very wide SerpApi tool suite: shopping, news, trends, events, local, sports, travel, images, YouTube. | 20+ engines incl. Amazon, eBay, Home Depot, Yelp, Tripadvisor, Search Index, Trends Trending Now, Local Services (see Part 1 table) | agent, automation, voice, self-hosted | [repo](https://github.com/bigsk1/jarvis-voice) |
| 82 | Job Hunt Agentic AI | Pramit Bose | Multi-agent job search: SerpApi Jobs + recruiter discovery + resume matching + human-approved outreach. | Google Jobs API, Google Search API | jobs, agent, outreach | [repo](https://github.com/pramitbose2024/job-hunt-agent) |
| 83 | LastTube | Kaung Zin Hein | Finds alternatives to discontinued cosmetics, compares retailers/prices via SerpApi Shopping. | Google Shopping API | beauty, shopping, product-discovery | [repo](https://github.com/Zen-cronic/lasttube) |
| 84 | Launchpad | GUACALITA | Researches competitors/market news via SerpApi while generating startup landing pages and checking domains. | Google Search API, Google News API | startups, market-research, automation | [repo](https://github.com/GUACALITA/launchpad-agent) |
| 85 | Layout Paper Generator | Joaquin Matres | Finds research papers via Scholar, generates downloadable photonic IC layouts from extracted parameters. | Google Scholar API | research, scholar, photonic-layout | [repo](https://github.com/joamatab/layout-paper-generator) |
| 86 | LeadAgent | Aleksandr Protsiuk | Uses SerpApi News/Search to find business signals, research companies, rank prospects, draft outreach. | Google News API, Google Search API | sales, leads, research | [repo](https://github.com/zavodIT/LeadAgent) |
| 87 | LeadBot AI | Muhammad Abdullah | AI lead-gen: prompts → CRM-ready local business leads using SerpApi Maps + enrichment. | Google Maps API | lead-generation, maps, crm | [repo](https://github.com/Muhammad08-dot/LeadBot_AI) |
| 88 | Lifecycle Hub | king-star-12 | Combines water-pipe asset records with construction/incident/local-condition reports via SerpApi for failure-risk reviews. | Google Search API | infrastructure, monitoring, research | [repo](https://github.com/king-star-12/lifecycle-hub) |
| 89 | LiveLLM | tom | Uses SerpApi to discover current economic info, verify sources, maintain a fact ledger for autonomous agents. | Google Light Search API, Google News Light API, Google News API, Search Index | agent, research, market-data | [repo](https://github.com/prx0r/livellm) |
| 90 | LiveRank SERP Tracker | Hema Karoonyaa T M | Python SEO rank tracker: live Google SERP snapshots, ranking-change detection, AI-written insight reports. | Google Search API | seo, rank-tracking, reporting | [repo](https://github.com/Hema-k-ds/liverank-serp-tracker) |
| 91 | Local LLM Web Search | SerpApi Team (official) | Gives a local LLM real-time web search through SerpApi function calling. | Google Search API | featured, llm, local-search, developer-tools | [repo](https://github.com/serpapi/local-llm-web-search) |
| 92 | MCP Chat Bot | Joseph Osei Yaw Nyarko | Chat UI backed by a FastMCP server sending queries to SerpApi, returns organic results as cards. | Google Search API | chatbot, mcp, search | [repo](https://github.com/Joe342wise/MCPChatBot) |
| 93 | MirrorMuse AI | Michael Marquis | Virtual beauty try-ons + skin analysis with product recs informed by SerpApi Shopping results. | Google Shopping API | beauty, shopping, images | [repo](https://github.com/QuisTech/MirrorMuse_AI) |
| 94 | NAR Signal Outreach Agent | Abdul Moeed | Searches NAR lawsuit/settlement signals for real estate agencies, drafts cold emails with Groq. | Google Search API | real-estate, outreach, automation | [repo](https://github.com/moeedabdul00988-tech/nar-outreach-agent) |
| 95 | ONIT | Tanishka Rao | Researches consumer problems/supporting documents via SerpApi Search for case-resolution plans (human review). | Google Search API | documents, research, agent | [repo](https://github.com/tanishkarao16/onit) |
| 96 | Opportunity Hunter | Poutru | Searches the web via SerpApi for personalized opportunities, ranks evidence, suggests next steps. | Google Search API | research, discovery, ai | [repo](https://github.com/Poutru/opportunity-hunter) |
| 97 | Orbit (Conference Discovery) | Hafsa Nawaz | Enriches conference speaker/company records via SerpApi Search for attendee discovery. | Google Search API | events, discovery, research | [repo](https://github.com/hnawaz2025/orbit) |
| 98 | Orbit (Web Data Automation) | triumphsystems | SerpApi Search discovers web sources; automates data extraction/delivery from a plain-language goal. | Google Search API | automation, web-data, agent | [repo](https://github.com/triumphsystems/orbit) |
| 99 | Overturn | Ashraf | Finds official health-insurance rules via SerpApi to check denial letters, prepares sourced appeal. | Google Search API | insurance, documents, verification | [repo](https://github.com/AshrafAhmed9/overturn-devnetwork-hackathon-2026) |
| 100 | PantryProof | Anupam Roy | Searches food-recall coverage via SerpApi News; helps pantry teams document/close recall responses. | Google Search API | food, monitoring, verification | [repo](https://github.com/Anupam0202/pantryproof) |
| 101 | Parallax | N DIVIJ | Compares readings of a PDF, checks business claims against public sources before human approval. | Google Search API | documents, verification, security | [repo](https://github.com/N-45div/Parallax) |
| 102 | PatchSignal | Hyunsik Parker | Uses SerpApi AI Mode + Search to research developer incidents and inspect cited-source authority. | Google AI Mode API, Google Search API | developer-tools, research, verification | [repo](https://github.com/HyunsikParker/patchsignal) |
| 103 | PatentPincer | doom2quake | Searches patents, patent claim details, academic literature via SerpApi for a cited preliminary patentability assessment. | Google Patents API, Google Patents Details API, Google Scholar API | patents, research, verification | [repo](https://github.com/doom2quake/patentpincer) |
| 104 | PayablePilot | Jonny7171 | Prepares invoice reviews, researches supplier risk via SerpApi when a price discrepancy needs investigation. | Google Search API | invoicing, research, agent | [repo](https://github.com/Jonny7171/payable-pilot) |
| 105 | Pre-Viral Restaurant Finder | Bhavani Ravi | Streamlit app querying SerpApi Maps local results, scores restaurants by rating/review-count/trend signals. | Google Maps API | restaurants, maps, discovery | [repo](https://github.com/thelearningdev/serpapi-tutorial) |
| 106 | Price Check | Kashish Pherwani | Scans products, compares live retailer prices via SerpApi Shopping. | Google Shopping API | shopping, prices, mobile | [repo](https://github.com/kash-08/Price-Check) |
| 107 | PriceScope | Carla Marcela Florida Roman | Compares real-time product prices across stores: cheapest-deal discovery, price charts, filterable tables. | Google Shopping API | shopping, prices, comparison | [repo](https://github.com/carlicode/PriceScope---Smart-Product-Price-Comparator) |
| 108 | PriceVerdict | xariskrigkos | Retrieves current Shopping offers via SerpApi, matches variants, applies pricing rules to assess a quoted price. | Google Shopping API | shopping, price-comparison, verification | [repo](https://github.com/xariskrigkos/priceverdict) |
| 109 | Productify AI | Abhyuday Tripathi | AI shopping assistant comparing marketplace offerings, summarizing pros/cons, recommending purchases. | Amazon Search API | shopping, marketplace, recommendations | [repo](https://github.com/Abhyuday746xev/Productify-AI) |
| 110 | ProductPulse | Yamuna Mediga | Compares live product prices, ratings, review counts, stores, availability via SerpApi Shopping. | Google Shopping API | shopping, prices, comparison | [repo](https://github.com/YamunaMediga/SCT_SD_4) |
| 111 | PROOFCHAIN | Firmin DJIKOLOUM | Checks business-document consistency, uses SerpApi Search for external corroboration before approving action. | Google Search API | documents, verification, automation | [repo](https://github.com/guelmbaye/proofchain) |
| 112 | Proofline | pdrucker48-lab | Researches vendor risks via SerpApi Search, organizes sources into decision packets for human review. | Google Search API | research, verification, procurement | [repo](https://github.com/pdrucker48-lab/proofline) |
| 113 | PyCon 2026 Knowledge Graph | Carmelo Piccione | Builds a live PyCon knowledge graph combining Search, News, Scholar, YouTube, Local. | Google Search API, Google News API, Google Scholar API, YouTube Search API, Google Local API | knowledge-graph, conference, multi-engine | [repo](https://github.com/struktured-labs/pycon-2026) |
| 114 | PyCon SerpApi Vibe | Yixing Fu | Searches an original project idea, shows related existing work for timing/inspiration judgment. | Google Search API | ideation, startup, search | [repo](https://github.com/yixingfu/pycon-serpapi-vibe) |
| 115 | PyConUS2026 Search Compare | Pawel Zal | Compares Google and DuckDuckGo results for the same query, highlights overlap/unique titles. | Google Search API, DuckDuckGo Search API | search-comparison, dashboard, analysis | [repo](https://github.com/pavelo22/PyConUS2026-SerpAPI) |
| 116 | Pyfood | Kirill Ignatev | Restaurant finder for PyCon attendees matching nearby restaurants to food preferences/allergies. | Google Maps API, Google Search API | food, restaurants, local-search | [repo](https://github.com/kiri11/pyfood) |
| 117 | PyLadies Skill Gap Analyzer | Ariana Cursino | Discovers PyLadies chapters, extracts public social profile details, compares curriculum vs. local job demand. | Google Search API, Instagram Profile API, Google Jobs API | education, analysis, python | [repo](https://github.com/arcursino/pyladies-serpapi) |
| 118 | Pylon 2026 SerpApi Demo | Israel Brewster | Processes NL queries with an LLM, runs SerpApi searches, parses results for user-facing answers. | Google Search API | llm, search, qa | [repo](https://github.com/ibrewster/pylon2026-serpapi-demo) |
| 119 | PyPackage Oracle | Everest K C | Recommends Python libraries for plain-English tasks using real search results synthesized into an answer. | Google Search API | python, developer-tools, research | [repo](https://github.com/everestkc/PyPackageOracle) |
| 120 | Rack | Sidharth Nair | Identifies clothing with Google Lens, researches shopping/eBay/demand via SerpApi for resale pricing. | Google Lens API, Google Shopping API, eBay Search API, Google Trends API | fashion, images, price-comparison | [repo](https://github.com/sidharthnair7/Rack) |
| 121 | Radar | Deepak Kambala | Combines SerpApi web/news/maps into a cited competitive-intelligence brief. | Google Search API, Google News API, Google Maps API | market-research, news, research | [repo](https://github.com/DeepakKambala/Radar) |
| 122 | Recuse | emmanuelist | Checks agent-written document claims against SerpApi Search results; reserves signing for a person. | Google Search API | documents, verification, agent | [repo](https://github.com/emmanuelist/recuse) |
| 123 | RedPen | Mahamoud Coulibaly, El Houssain Souhail | Real-time debate fact-checker: detects claims, retrieves evidence via SerpApi, Gemma 4 sourced verdicts. | Google Search API | fact-checking, debate, evidence | [repo](https://github.com/Ductive99/gemma4) |
| 124 | Relokit | projects-hacks | Checks relocation requirements against SerpApi property listings/local businesses/reviews/directions. | Zillow Search API, Google Maps API, Google Maps Directions API, Google Local API, Google Maps Reviews API, Yelp Search API, Google News API | travel, real-estate, maps | [repo](https://github.com/projects-hacks/relokit) |
| 125 | RentRadar | Shubham Sharma | Full-stack rental discovery for Indian cities: live listings, budget-filtered maps, AI market advice. | Google Search API | real-estate, rentals, maps | [repo](https://github.com/shubhamsharma0707/Renting_properties) |
| 126 | Research Brief | Omar Rafiq | Structured research brief for any topic combining Scholar, News, Search with AI synthesis. | Google Scholar API, Google News API, Google Search API | research, ai, briefing | [repo](https://github.com/omarraf/research-brief) |
| 127 | ResearchBrief | Chirag Tiwari Rao | Context-aware research assistant using SerpApi to find sources and generate evidence-linked briefs. | Google Search API | research, briefing, ai | [repo](https://github.com/CJ-777/ResearchBrief) |
| 128 | Review Watchdog | Vaithiyanathan Muneeswaran | Cloud Python watchdog using SerpApi Maps Reviews to monitor local business profiles, email alerts on low-star reviews. | Google Maps Reviews API | local-seo, reviews, monitoring | [repo](https://github.com/vaithiyaseo/review-watchdog) |
| 129 | SafePlate Agent | Rita Kao, Afaq, Yan, Pyae Sone Kyaw | Multilingual food-allergy assistant retrieving manufacturer evidence, asking about cross-contact. | Google Search API | food, allergies, safety | [repo](https://github.com/RitaTY/gemma4) |
| 130 | ScoutAI | Raghavendra Rathod | Searches jobs/internships via SerpApi Search, ranks against education/skills/interests. | Google Search API | jobs, search, matching | [repo](https://github.com/RaghavendraRathod/ScoutAI) |
| 131 | ScoutCRM | Purav Kanda | Collects company news/hiring signals/web research via SerpApi for lead qualification and outreach drafts. | Google News API, Google Jobs API, Google Search API | sales, crm, leads | [repo](https://github.com/Purav-Kanda/scoutcrm) |
| 132 | Search Signal Board | Katarina Nogradiova | Turns a topic into prototype ideas, repeated terms, related questions, source links from Search/News. | Google Search API, Google News API | ideation, news, signals | [repo](https://github.com/katyja/serpapi-pycon) |
| 133 | SearchPhone | Victor Bancayan | Open-source phone-number OSINT tool searching via SerpApi alongside code/social/carrier/threat-intel sources. | Google Search API | osint, phone, security | [repo](https://github.com/HackUnderway/SearchPhone) |
| 134 | SearchScout AI | Muhammad Rizwan | Discovers businesses, enriches contact info, filters by website presence, exports leads via SerpApi Maps. | Google Maps API | lead-generation, maps, business-intelligence | [repo](https://github.com/MRizwanMalik/SearchScout-AI) |
| 135 | SEO by Serp | Joseph Osei Yaw Nyarko | Tracks Google ranking positions, AI Overviews, PAA data, volatility alerts, competitor domain movement. | Google Search API | seo, rank-tracking, alerts | [repo](https://github.com/Joe342wise/serp-project) |
| 136 | SEO Keyword Research Tool | Artur Chukhrai | Python SEO keyword tool: Autocomplete, PAA, related-search via SerpApi. | Google Autocomplete API, Google Related Questions API, Google Search API | seo, keyword-research, python | [repo](https://github.com/chukhraiartur/seo-keyword-research-tool) |
| 137 | SEO Position Tracker | Dmitiry Zub | Python CLI/library tracking keyword positions across Google, Baidu, Bing, DuckDuckGo, Yahoo, Yandex, Naver. | Google Search API, Baidu Search API, Bing Search API, DuckDuckGo Search API, Yahoo! Search API, Yandex Search API, Naver Search API | seo, rank-tracking, python | [repo](https://github.com/dimitryzub/seo-position-tracker) |
| 138 | Serapp Warbler | Jorge Salvador Vigueras Perez | Field-guide planner for birders/photographers gathering regional sightings, forum data, image references. | Google Search API, Google Images API | birds, photography, images | [repo](https://github.com/jvigueras/serapp-warbler) |
| 139 | Serp Geocode Demo | Aaron Robinson | Turns human-readable addresses (single or uploaded lists) into lat/long coordinates. | Google Maps API | geocoding, maps, csv | [repo](https://github.com/aaronr8684/serp_demo) |
| 140 | SerpAPI Fact Check | Jay Shah | Fact-checks news headlines by searching reputable sources, shows if a claim was reported elsewhere. | Google News API, Google Search API | fact-checking, news, verification | [repo](https://github.com/sonjay97/SerpAPIHackathonProject) |
| 141 | SerpApi Raffle Companion | Goutham Kalla | Conference companion for finding talks, slides, speaker bios, demos, related resources. | Google Search API | conference, search, resources | [repo](https://github.com/kallagoutham/serpapi-raffle) |
| 142 | SerpApi Research Bot | SerpApi Team (official) | Cross-platform AI research agent bringing SerpApi research into Slack and Linear. | Google Search API, Google News API, Google Scholar API | featured, research, agent, automation | [repo](https://github.com/serpapi/serpapi-research-bot) |
| 143 | SerpApi Superapp | SerpApi Team (official) | Multi-engine SerpApi showcase built with the Python SDK. | Google Search API, Google Maps API, Google Images API, Google News API, Google Shopping API, Google Trends API, YouTube Search API | featured, python, multi-engine, developer-tools | [repo](https://github.com/serpapi/serpapi-superapp) |
| 144 | SerpAPI Trending News Digest | Joel Peter | CLI digest generator fetching trending Google News results, formats titles/sources/dates/links. | Google News API | news, cli, digest | [repo](https://github.com/joelpeter94/serpapi-trending-news-digest) |
| 145 | SERPDelta | researchsite | Compares an AI assistant's answers with current Google web/news results to highlight outdated info. | Google Search API | ai, verification, research | [repo](https://github.com/researchsite/SerpDelta) |
| 146 | SerpSide | Joseph Osei Yaw Nyarko | Conference companion: restaurant explorer + swipe-based product price game for evaluating swag. | Google Maps API, Google Shopping API | conference, food, shopping | [repo](https://github.com/Joe342wise/serpside) |
| 147 | SerpTrail | SerpApi Team (official) | Tracks/monitors SEO efforts with SerpApi-powered rank and search-visibility workflows. | Google Search API | featured, seo, rank-tracking, monitoring | [repo](https://github.com/serpapi/serptrail) |
| 148 | SignalOps × SerpApi | lps_atwork | Retrieves current Search evidence via SerpApi, ranks opportunities with AI, checks policy before external action. | Google Search API | agent, research, automation | [repo](https://github.com/leadingproblemsolver/signalops-workbench) |
| 149 | SignalWatch | Aditya Yadav | Searches vendor pricing, outages, deprecations, security reports via SerpApi for cited due-diligence assessments. | Google Search API | monitoring, research, verification | [repo](https://github.com/Officially-aditya/signal-watch) |
| 150 | Signet | projects-hacks | Identifies a company's public domain via SerpApi, checks invoice provenance against signatures/domain keys. | Google Search API | documents, security, verification | [repo](https://github.com/projects-hacks/signet) |
| 151 | Skin to Shelf | nickillig3-dotcom | Builds skincare routines/shopping baskets from skin-analysis results using SerpApi Shopping. | Google Shopping API | beauty, shopping, price-comparison | [repo](https://github.com/nickillig3-dotcom/skin-to-shelf) |
| 152 | SkyMind AI | Ujjwal Kumar Jha | AI travel assistant: search flights, compare options, multi-source travel intelligence recommendations. | Google Flights API, Google Search API | travel, flights, llm | [repo](https://github.com/JiNamaste/skymind-ai) |
| 153 | SmartStock CRM | Kaushik Joshi | Full-stack inventory/CRM app with AI analytics and SerpApi-powered product trend discovery for retail. | Amazon Search API | inventory, crm, shopping | [repo](https://github.com/k-k-j123/SmartStock_CRM) |
| 154 | Solar Market Intelligence | Jim Fingal | Tracks solar/distributed-energy policy news, regulatory activity, search trends across US states. | Google News API, Google Search API, Google Trends API | energy, policy, market-intelligence | [repo](https://github.com/jimfingal/v0-serpapi-pycon-2026-demo) |
| 155 | Still You | Midhun | Virtual try-on for wigs/headwear/eyebrow makeup, finds related products/prices via SerpApi Shopping. | Google Shopping API | beauty, shopping, images | [repo](https://github.com/midhunrajcharles/STILL-YOU) |
| 156 | SybilWatch | ATHMABHIRAM S J | Uses SerpApi Lens to find public instances of a profile photo, anchors evidence hashes on local blockchain. | Google Lens API | images, security, blockchain | [repo](https://github.com/athmabhiram1/hhgoa_task3) |
| 157 | Thermaflow | king-star-12 | Combines boiler/pressure-vessel records with incident reports/local context via SerpApi for maintenance investigations. | Google Search API | manufacturing, monitoring, research | [repo](https://github.com/king-star-12/thermaflow) |
| 158 | Time-Out | Ujwal Suresh Vanjare | Researches practitioner credentials, procedure evidence, product records before a cosmetic-procedure safety review. | Google Search API | healthcare, research, verification | [repo](https://github.com/usv240/time-out) |
| 159 | Travel Currency Trends | Adilson Torres | Tracks currency trend signals for travelers using search-driven discovery. | Google Trends API, Google Search API | travel, currency, trends | [repo](https://github.com/AdilsonTorres/travel-currency-trends) |
| 160 | Travel Planner AI | Ankush Patial | Agentic travel planner using SerpApi for real-time flight and hotel data. | Google Flights API, Google Hotels API | travel, flights, hotels | [repo](https://github.com/AnkushPatial06/Travel-Planner-AI) |
| 161 | Trend Spotter Dashboard | Amaury Rodriguez | Streamlit dashboard: current Google trends, related news, interest-over-time for custom topics. | Google Trends API, Google News API | trends, news, dashboard | [repo](https://github.com/amrod/trend-spotter-dashboard) |
| 162 | TripWeaver | Amiru Mallawarachchi | Multi-agent travel planner: flights, hotels, nearby places via SerpApi Flights/Hotels/Maps. | Google Flights API, Google Hotels API, Google Maps API | travel, flights, hotels, agent | [repo](https://github.com/AmiruMallawarachchi/multi-agent-travel-planner) |
| 163 | TruthStream | Himanshu Salve | Multi-agent fact-checking pipeline: extracts claims, verifies against live sources, scores bias, streams verdicts. | Google Search API | fact-checking, news, verification | [repo](https://github.com/himanshusalve16/TruthStream-Multi-Agent-Fact-Checking-Pipeline) |
| 164 | typo.watch | millerandmuller | Finds domains resembling a brand, checks if suspicious domains appear in SerpApi Search results. | Google Search API | security, domains, monitoring | [repo](https://github.com/millerandmuller/typo-watch) |
| 165 | Unmet | ByASB | Analyzes App Store reviews, local business feedback, search demand, AI Overviews for unmet needs/visibility gaps. Built on **9 SerpApi engines**. | Apple App Store API, Apple App Store Reviews API, Google Trends API, Google Autocomplete API, Google Maps API, Google Maps Reviews API, Yelp Search API, Yelp Reviews API, Tripadvisor Search API, Tripadvisor Reviews API, Google Search API, Google AI Overview API | research, reviews, market-research | [repo](https://github.com/byasb/unmet) |
| 166 | Unspun | Galih Kusuma Wijaya | Searches Reddit discussions + current shopping offers via SerpApi for product research with price comparisons. | Google Search API, Google Shopping API | shopping, research, price-comparison | [repo](https://github.com/galihkjaya/unspun) |
| 167 | Vantage | Joseph Sico Birch Kayombo | Searches published university admissions requirements via SerpApi to compare programs/assess readiness. | Google Search API | education, research, planning | [repo](https://github.com/joseph17-mancity/Vantage-Platform) |
| 168 | VendorProof | Simon Lin | Checks vendor claims with Light Search + News APIs, assembles procurement decision file with cited evidence. | Google Light Search API, Google News API | procurement, verification, research | [repo](https://github.com/simonlin1212/vendorproof) |
| 169 | VentureRadar AI | babifarah9 | Evaluates business ideas with SerpApi searches for demand/competitors/adoption barriers into a venture brief. | Google Search API | market-research, startups, research | [repo](https://github.com/babifarah9/venture-radar-ai) |
| 170 | VeriNews AI | Antonio Carlos Borges Neto | Audits news claims across Search, News, Scholar, Patents, presents a sourced assessment. | Google Search API, Google News API, Google Scholar API, Google Patents API | fact-checking, news, research | [repo](https://github.com/fafnirkyu/verinewsai) |
| 171 | VERITAS FORENSICS | Prasiddh Singh | Finds public visual matches via SerpApi Lens, compares candidate faces, registers SHA-256 on local blockchain. | Google Lens API | images, verification, blockchain | [repo](https://github.com/Prasiddh2140/face-recognition) |
| 172 | VibeTrip | Shiva Gaire | Travel planning app exploring flight deals, builds trip plans with flights/hotels/sightseeing. | Google Flights API, Google Hotels API, Google Search API | travel, flights, hotels | [repo](https://github.com/geeksambhu/demo-serp) |
| 173 | VidScribe.AI | Arslan Babar | YouTube video search/transcription agent using SerpApi for video discovery + transcript extraction. | YouTube Search API, YouTube Video Transcript API | youtube, transcription, agent | [repo](https://github.com/Arslan-Codes097/YouTube-Video-Search-AND-Transcription-AI-Agent-) |
| 174 | VisionRetain AI | Nidhi Sharma | Retention analytics/product intelligence app with Product Lens scanning + SerpApi Shopping price matches. | Google Shopping API | retention, analytics, shopping | [repo](https://github.com/AvinashChandra-git/VisionRetain-AI) |
| 175 | Voyage AI | Barat Chandar V. | Multi-city travel planner using SerpApi Flights/Hotels with agent orchestration for live itineraries. | Google Flights API, Google Hotels API | travel, itinerary, agent | [repo](https://github.com/bcve1017-spec/voyage) |
| 176 | WanderLens | Jeremy Wang | Destination dashboards: attractions, restaurants, hidden gems, events, travel videos across multiple engines. | Google Maps API, Google Search API, Google Events API, YouTube Search API | travel, maps, events | [repo](https://github.com/jqw115-hash/pycon2026-serpapi-submission) |
| 177 | YouTube RAG Chatbot | Gaurav Negi | Full-stack YouTube RAG chatbot: timestamped transcripts via SerpApi, chunked/searched, grounded answers. | YouTube Video Transcript API | youtube, rag, chatbot, transcription | [repo](https://github.com/gauravnegigit/Youtube-Chatbot) |

*(Note: the official gallery also lists a "Python Agent Tools" entry, `serpapi-search-tools` — [docs](https://serpapi.github.io/serpapi-search-tools-python/) / [PyPI](https://pypi.org/project/serpapi-search-tools/) — and the official **SerpApi MCP Server** ([repo](https://github.com/serpapi/serpapi-mcp), [blog post](https://serpapi.com/blog/introducing-serpapis-mcp-server/)), which are SDKs/infrastructure rather than end-user projects and are not counted in the 177.)*

---

## Part 3 — Ecosystem beyond the official gallery

### 3.1 GitHub topic `serpapi` (https://github.com/topics/serpapi) — FACT

Notable repos found (not in the BuiltWithSerpApi gallery), with star counts as shown at fetch time:

| Repo | Stars | Description |
|---|---|---|
| [karust/openserp](https://github.com/karust/openserp) | 1.4k | Self-hosted SERP API alternative (not a SerpApi consumer — a competing open-source scraper) |
| [serpapi/google-search-results-python](https://github.com/serpapi/google-search-results-python) | 756 | Official Python client (legacy) |
| [serpapi/nokolexbor](https://github.com/serpapi/nokolexbor) | 414 | HTML parser library used internally by SerpApi |
| [BrowserCash/teracrawl](https://github.com/BrowserCash/teracrawl) | 284 | Competing web-crawler API for LLMs (not built on SerpApi) |
| [serpapi/serpapi-python](https://github.com/serpapi/serpapi-python) | 173 | Official current Python SDK |
| [chukhraiartur/seo-keyword-research-tool](https://github.com/chukhraiartur/seo-keyword-research-tool) | 164 | Python SEO keyword tool (Autocomplete/PAA/Related Searches) — **also independently listed in the official gallery** (#136 above), confirming this exact idea pattern exists both inside and outside the gallery |
| [serpapi/public-roadmap](https://github.com/serpapi/public-roadmap) | 142 | SerpApi's own public roadmap repo |
| [dimitryzub/scrape-google-scholar-py](https://github.com/dimitryzub/scrape-google-scholar-py) | 135 | Google Scholar scraping module (same author as gallery's SEO Position Tracker, #137) |
| [ChanMeng666/server-google-news](https://github.com/ChanMeng666/server-google-news) | 129 | MCP server for Google News via SerpApi |
| [serpapi/google-search-results-nodejs](https://github.com/serpapi/google-search-results-nodejs) | 95 | Official Node.js client (legacy) |
| [serpapi/serpapi-javascript](https://github.com/serpapi/serpapi-javascript) | 95 | Official current JS/TS SDK |
| [AnonCatalyst/Odinova](https://github.com/AnonCatalyst/Odinova) | 94 | OSINT toolkit incorporating SerpApi |
| [robiwan303/babyagi](https://github.com/robiwan303/babyagi) | 93 | BabyAGI fork enhanced for Llama models w/ SerpApi web search |
| [webAutomationLover/google-map-scraper](https://github.com/webAutomationLover/google-map-scraper) | 66 | Google Maps scraper userscript |
| [serping/serp-checker](https://github.com/serping/serp-checker) | 59 | SERP checking tool |
| [gefsikatsinelou/MetaSearchMCP](https://github.com/gefsikatsinelou/MetaSearchMCP) | 56 | Open-source metasearch MCP server for LLM agents |
| [arjunprabhulal/mcp-gemini-search](https://github.com/arjunprabhulal/mcp-gemini-search) | 56 | MCP + Gemini 2.5 Pro for flight search via function calling |
| [serpapi/google-search-results-java](https://github.com/serpapi/google-search-results-java) | 50 | Official Java client |
| [arjunprabhulal/mcp-flight-search](https://github.com/arjunprabhulal/mcp-flight-search) | 43 | **Another independent "MCP Server for realtime flight search"** — a third distinct flight-search-via-SerpApi project outside the gallery, reinforcing flight search as a heavily repeated idea |
| [masteranime/enrichment-kit](https://github.com/masteranime/enrichment-kit) | 39 | Open-source Clay.com alternative — multi-vendor B2B enrichment waterfalls |

**Additional GitHub finds from targeted searches (FACT):**
- [ecillie/CheapFlightFinder](https://github.com/ecillie/CheapFlightFinder) — "configurable flight deal tracker that searches multiple routes with SerpApi, ranks best options, emails grouped reports, runs via GitHub Actions." Independent of the gallery; **a fourth distinct SerpApi-based flight-deal-tracker project** (alongside gallery entries #57, #58, #59, #60, #172).
- [serpapi/awesome-seo-tools](https://github.com/serpapi/awesome-seo-tools) — SerpApi's own curated list of SEO tools, evidence the SEO/rank-tracking space is treated by SerpApi itself as a mature, well-populated category.
- [KunihiroS/google-patents-mcp](https://github.com/KunihiroS/google-patents-mcp) and a fork at [SoftwareStartups/google-patents-mcp](https://github.com/SoftwareStartups/google-patents-mcp) — thin MCP wrappers around SerpApi's Google Patents API, not full products.
- [justserpapi/google-patents-search](https://github.com/justserpapi/google-patents-search) and [justserpapi/google-patents-details](https://github.com/justserpapi/google-patents-details) — SDK usage examples (appears to be a third-party/affiliated "JustSerpAPI" example repo set), not end-user products.
- [engkimo/google_maps_reviews_scraper](https://github.com/engkimo/google_maps_reviews_scraper) — a bare scraper (no analysis/product layer) for Google Maps Reviews via SerpApi.
- [serpapi/google-play-app-scraper](https://github.com/serpapi/google-play-app-scraper), [serpapi/google-play-reviews-scraper](https://github.com/serpapi/google-play-reviews-scraper), [serpapi/google-play-scraper](https://github.com/serpapi/google-play-scraper) — all **SerpApi's own official example/tool repos**, not independent community products.

### 3.2 Devpost — FACT + limitations

- **DevNetwork [API + Cloud + AI] Hackathon 2026** ([project gallery](https://api-cloud-ai-hackathon-2026.devpost.com/project-gallery)) — 315 total projects submitted; SerpApi is listed as a sponsor offering a "Best AI Use Case" prize. A gallery fetch surfaced three explicitly SerpApi-tagged entries: **Unmet** ([devpost.com/software/unmet](https://devpost.com/software/unmet)), **DepositCheck** ([devpost.com/software/depositcheck](https://devpost.com/software/depositcheck)), **PantryProof** ([devpost.com/software/pantryproof](https://devpost.com/software/pantryproof)) — all three are the *same projects* already catalogued above (#165, #43, #100), confirming the BuiltWithSerpApi gallery and this Devpost hackathon draw from an overlapping/identical project pool rather than being two separate populations. **VendorProof** (#168) is also confirmed via its GitHub README to target "the SerpApi and Xano cash tracks of the DevNetwork API + Cloud + AI Hackathon 2026."
- Devpost's own search UI (`devpost.com/software/search?query=serpapi`) could not be scraped via the fetch tool (JS-rendered, returned blank) — **limitation, not a negative finding**. WebSearch queries against Devpost did not surface additional SerpApi projects beyond the ones already found in the gallery/GitHub.
- No evidence found of a distinct, standalone **"SerpApi Hackathon 2025"** on Devpost with its own winners page. SerpApi's hackathon involvement in 2025–2026 appears to be as a **sponsor/track** inside larger multi-sponsor hackathons (DevNetwork API+Cloud+Data 2025, DevNetwork API+Cloud+AI 2026, various Gemma-4 hackathons referenced in gallery entries #48, #62, #74, #123, #129, and PyCon 2026), plus its own standalone **SerpApi India Hackathon 2026**. **Limited results found** — treated as inference of absence, not proof.

### 3.3 Product Hunt — FACT + limitations

- SerpApi's own product page: [producthunt.com/products/serp-api](https://www.producthunt.com/products/serp-api) (the API itself, not a project built with it).
- "Deep SerpApi" launch by a *different* company (Scrapeless) — [hunted.space/product/scrapeless-deep-serpapi](https://hunted.space/product/scrapeless-deep-serpapi) — 286 upvotes. This is a **competing SERP API product**, not a project built on SerpApi.com's API; noted for context only, not counted as a "built with SerpApi" project.
- **Limited/no results found** for independent, community-built consumer products launched on Product Hunt that credit SerpApi as their underlying data source. Product Hunt search did not surface any hackathon-style project from the gallery being separately launched there.

### 3.4 Hacker News — FACT + limitations

- [Show HN: SerpApi MCP Server](https://news.ycombinator.com/item?id=46165251) — the official MCP server launch (same as gallery's infrastructure entry, not an end-user project).
- [Why we're taking legal action against SerpApi's unlawful scraping](https://news.ycombinator.com/item?id=46329109) (Jan 2026) — a legal/business-conflict story about SerpApi itself, not a project.
- The remaining ~8 HN results are all SerpApi's own job postings (2018–2026), not projects.
- **Limited/no results found** for independent hackathon or side projects discussed on HN that were built with SerpApi. This is a notably thin channel compared to GitHub/the official gallery.

---

## Part 4 — SATURATION MAP

All counts below are **FACT** (derived by keyword/tag matching against the 177-entry gallery dataset, cross-checked against project descriptions) unless marked INFERENCE. A project can appear in more than one cluster.

### 4.1 "Evidence/Claim Verification Agent" — ~38 projects — MOST SATURATED CLUSTER FOUND

**Pattern:** an AI agent takes a claim, document, vendor, price, or piece of content; runs it against live SerpApi search/news results; produces a cited "verdict," "trust score," or "evidence packet"; and gates a human decision or action. This pattern was **not** in the task's example saturation list but emerged as the single largest one in the data — **INFERENCE**: it correlates strongly with the September 2026 DevNetwork [API+Cloud+AI] Hackathon 2026, whose theme appears to reward "agentic trust/verification before action" (repo names like `hack-devnet`, `devnetwork-2026`, `apiworld-2026` appear across this cluster).

Representative projects (non-exhaustive, ~38 found): [SerpAPI Fact Check](https://github.com/sonjay97/SerpAPIHackathonProject) (#140), [Fake News Detection](https://github.com/Vamsi-Pabbiti/Fake-News-Detection) (#53), [TruthStream](https://github.com/himanshusalve16/TruthStream-Multi-Agent-Fact-Checking-Pipeline) (#163), [FacTruth](https://github.com/Adity-kamath/FacTruth) (#52), [VeriNews AI](https://github.com/fafnirkyu/verinewsai) (#170), [SERPDelta](https://github.com/researchsite/SerpDelta) (#145), [RedPen](https://github.com/Ductive99/gemma4) (#123), [Grounds](https://github.com/harshwardhan-kp/grounds) (#72), [GroundPitch](https://github.com/adamblackoak/groundpitch) (#71), [Parallax](https://github.com/N-45div/Parallax) (#101), [Chancery](https://github.com/RaYYeR220/chancery) (#31), [ClauseProof](https://github.com/wraithsupplements/clauseproof-webmcp) (#34), [CounterSign](https://github.com/CarSanoja/countersign) (#40), [Recuse](https://github.com/emmanuelist/recuse) (#122), [PROOFCHAIN](https://github.com/guelmbaye/proofchain) (#111), [Document Trust Gate](https://github.com/equinoxaifinance-rgb/document-trust-gate) (#45), [Diamond Evidence Gate](https://github.com/kiencuongnguyen88/diamond-evidence-gate) (#44), [Signet](https://github.com/projects-hacks/signet) (#150), [ComplyGraph AI](https://github.com/subair99/comply-graph) (#38), [Proofline](https://github.com/pdrucker48-lab/proofline) (#112), [VendorProof](https://github.com/simonlin1212/vendorproof) (#168), [SignalWatch](https://github.com/Officially-aditya/signal-watch) (#149), [AegisFlow](https://github.com/TusharTechs/aegisflow) (#4), [PayablePilot](https://github.com/Jonny7171/payable-pilot) (#104), [PatentPincer](https://github.com/doom2quake/patentpincer) (#103), [IsThisSafe?](https://github.com/shrikantwagh/is-this-safe) (#80), [Baseline](https://github.com/Jacobopp27/baseline) (#22), [Time-Out](https://github.com/usv240/time-out) (#158), [DepositCheck](https://github.com/ishal1410/depositcheck) (#43), [PantryProof](https://github.com/Anupam0202/pantryproof) (#100), [Overturn](https://github.com/AshrafAhmed9/overturn-devnetwork-hackathon-2026) (#99), [AuthentiCheck](https://github.com/Ashutosh-Pawar29/PlagiarismDetectionSys) (#19), [FaceChain](https://github.com/Punya2711/face-blockchain-pipeline) (#50), [VERITAS FORENSICS](https://github.com/Prasiddh2140/face-recognition) (#171), [SybilWatch](https://github.com/athmabhiram1/hhgoa_task3) (#156), [PatchSignal](https://github.com/HyunsikParker/patchsignal) (#102), [PriceVerdict](https://github.com/xariskrigkos/priceverdict) (#108), [Droit de Retard](https://github.com/Claken/Paris-Gemma-4-Hackaton) (#48), [ONIT](https://github.com/tanishkarao16/onit) (#95), [Charter](https://github.com/vighriday/Charter) (#32).

**Sub-pattern within this cluster — "procurement/invoice/vendor due-diligence agent"** specifically: at least 8 near-identical projects (AegisFlow, ComplyGraph AI, Proofline, PayablePilot, SignalWatch, VendorProof, CounterSign, Signet) all solve "verify a vendor/invoice/supplier claim against web evidence before payment/approval."

### 4.2 Travel itinerary / flight+hotel planner — 21 projects — HIGHLY SATURATED

Pattern: plan a trip / build an itinerary using Google Flights + Google Hotels (+ Maps/Tripadvisor). Examples: [AI Travel Agent](https://github.com/taanyaaharidassprasad06/travel-agent) (#13), [GoTrip AI](https://github.com/Manish7512/GoTrip-AI---A-Multi-Agent-Travel-Planner-with-LangGraph) (#68), [TripWeaver](https://github.com/AmiruMallawarachchi/multi-agent-travel-planner) (#162), [Voyage AI](https://github.com/bcve1017-spec/voyage) (#175), [VibeTrip](https://github.com/geeksambhu/demo-serp) (#172), [Atlas](https://github.com/Haasytr/atlas) (#18), [HermigoBot](https://github.com/kira2406/hermigo_vacation_bot) (#73), [FitToFly](https://github.com/ShahRajS/FitToFly) (#55), [AlonTrip](https://github.com/alon1997/alontrip) (#15), [SkyMind AI](https://github.com/JiNamaste/skymind-ai) (#152), [Travel Planner AI](https://github.com/AnkushPatial06/Travel-Planner-AI) (#160), [AI Travel Planner](https://github.com/sagarsrao/ai-travel-agent) (#14), and 9 more. Plus 4 independent **flight-price-tracker** variants specifically ([Flight Price Tracker](https://github.com/Jorge-delangel/Flight-Price-Tracker) #57, [Flight Search Dashboard](https://github.com/AnjaliMMM0888/Flight_App) #58, [Flight Search Script](https://github.com/rgimen3z/serp-api-example) #59, [FlightDeals Tracker](https://github.com/akhil99558/FlightDeals_Test) #60) plus [CheapFlightFinder](https://github.com/ecillie/CheapFlightFinder) (GitHub, outside gallery) and [arjunprabhulal/mcp-flight-search](https://github.com/arjunprabhulal/mcp-flight-search) (43-star MCP flight search server, outside gallery) — **at least 6 independent "flight price tracker" implementations exist**, one of the clearest single-idea duplications found in this research.

### 4.3 Shopping / price comparison / price tracker — 31 projects — HIGHLY SATURATED

Pattern: compare product prices/offers via Google Shopping (or Amazon Search). Examples: [PriceScope](https://github.com/carlicode/PriceScope---Smart-Product-Price-Comparator) (#107), [ProductPulse](https://github.com/YamunaMediga/SCT_SD_4) (#110), [Price Check](https://github.com/kash-08/Price-Check) (#106), [PriceVerdict](https://github.com/xariskrigkos/priceverdict) (#108), [Giftly](https://github.com/niyor1/giftly) (#63), [Unspun](https://github.com/galihkjaya/unspun) (#166), [Productify AI](https://github.com/Abhyuday746xev/Productify-AI) (#109), [VisionRetain AI](https://github.com/AvinashChandra-git/VisionRetain-AI) (#174), plus a beauty-specific shopping sub-cluster (4.5 below). 31 total gallery projects tagged with shopping/price-comparison keywords.

### 4.4 "Research/briefing AI agent" (non-verification) — ~25+ projects — HIGHLY SATURATED

Pattern: take a topic/company/idea and generate a cited research brief by combining Search+News(+Scholar/Trends/Maps). Examples: [Research Brief](https://github.com/omarraf/research-brief) (#126), [ResearchBrief](https://github.com/CJ-777/ResearchBrief) (#127), [Account Intelligence Radar](https://github.com/shaimaaalmously054-beep/account-intelligence-radar) (#2), [Dossier](https://github.com/shamnadps/dossier) (#46), [Contrarian](https://github.com/venvennnn/contrarian) (#39), [Ignition](https://github.com/king-star-12/ignition) (#76), [VentureRadar AI](https://github.com/babifarah9/venture-radar-ai) (#169), [Grant Scout](https://github.com/jayblast-spec/grant-scout) (#69), [Launchpad](https://github.com/GUACALITA/launchpad-agent) (#84), [Radar](https://github.com/DeepakKambala/Radar) (#121), [Opportunity Hunter](https://github.com/Poutru/opportunity-hunter) (#96), plus the official [SerpApi Research Bot](https://github.com/serpapi/serpapi-research-bot) (#142) and [Competitive Intelligence Agent](https://github.com/serpapi/competitive-intelligence-agent) (#37) — meaning even SerpApi's own two official showcase repos duplicate this exact pattern.

### 4.5 Local-business lead generation via Google Maps — ≥7 near-identical projects — HIGHLY SATURATED

Pattern: query Google Maps for businesses in an area/category, dedupe, export to Sheets/CRM/alerts. Names are literally near-duplicates: [Google Maps Business Tracker](https://github.com/MehulKumawat0221/gmaps_tracker) (#65), [Google Maps Lead Scraper](https://github.com/studentJannatBali/Google-Maps-Business-Lead-Scraper) (#66), [Google Maps New Business Tracker](https://github.com/ronakbihani123/New_Business_Tracker) (#67), [LeadBot AI](https://github.com/Muhammad08-dot/LeadBot_AI) (#87), [SearchScout AI](https://github.com/MRizwanMalik/SearchScout-AI) (#134), [AI Lead Research Flow](https://github.com/nida-fatima247/ai-lead-generation) (#8), [ScoutCRM](https://github.com/Purav-Kanda/scoutcrm) (#131).

### 4.6 SEO / rank-tracking / competitor dashboard — ≥6 gallery projects + external ecosystem — SATURATED

Gallery: [SerpTrail](https://github.com/serpapi/serptrail) (#147, official), [SEO by Serp](https://github.com/Joe342wise/serp-project) (#135), [LiveRank SERP Tracker](https://github.com/Hema-k-ds/liverank-serp-tracker) (#90), [SEO Keyword Research Tool](https://github.com/chukhraiartur/seo-keyword-research-tool) (#136), [SEO Position Tracker](https://github.com/dimitryzub/seo-position-tracker) (#137), [AdWatch](https://github.com/jkarns87/AdWatch) (#3). Reinforced by SerpApi's own [awesome-seo-tools](https://github.com/serpapi/awesome-seo-tools) curated list and independently-starred GitHub repos (seo-keyword-research-tool at 164 stars appears in **both** the gallery and the general GitHub topic listing).

### 4.7 Job finder / resume matcher — 9 projects — SATURATED

[ScoutAI](https://github.com/RaghavendraRathod/ScoutAI) (#130), [ApplyPilot](https://github.com/Alyht/ApplyPilot) (#17), [AI Job Copilot](https://github.com/chetandeepsingh91-creator/agentic-job-search) (#7), [Autonomous AI Job Hunter](https://github.com/Karthik-Banda/Autonomous-AI-Job-Hunter) (#20), [Job Hunt Agentic AI](https://github.com/pramitbose2024/job-hunt-agent) (#82), [AI Opportunity Scout](https://github.com/dev-aditya-design/ai-opportunity-scout) (#10), [AI Hiring Signal Pipeline](https://github.com/mukutkhandelwal/ai-hiring-signal-pipeline) (#6).

### 4.8 Beauty/skincare shopping+try-on assistant — 9 projects — SATURATED (niche)

**INFERENCE:** likely a specific hackathon track/sponsor prompt given how narrow and recently clustered this is. [Ember](https://github.com/arihantagarwal/ember) (#49), [Still You](https://github.com/midhunrajcharles/STILL-YOU) (#155), [MirrorMuse AI](https://github.com/QuisTech/MirrorMuse_AI) (#93), [Glow Proof](https://github.com/harrymakoni-netizen/glow-proof) (#64), [Skin to Shelf](https://github.com/nickillig3-dotcom/skin-to-shelf) (#151), [LastTube](https://github.com/Zen-cronic/lasttube) (#83), [BrandProof](https://github.com/aviad12g/brandproof-devnetwork-2026) (#26), [Baseline](https://github.com/Jacobopp27/baseline) (#22, overlaps 4.1), [Time-Out](https://github.com/usv240/time-out) (#158, overlaps 4.1).

---

## Part 5 — UNDEREXPLORED SerpApi engines / use cases

All numbers are counts within the 177-project gallery (**FACT**, from the structured data). External-search results confirming scarcity beyond the gallery are cited per item. Absence of external search results is reported honestly as "limited/no results found" — **this is inference of scarcity, not proof of non-existence.**

| Engine | Gallery usage | External evidence checked | Assessment |
|---|---|---|---|
| **Google Patents API / Patents Details API** | 4 projects ([Chancery](https://github.com/RaYYeR220/chancery) #31, [Grounds](https://github.com/harshwardhan-kp/grounds) #72, [VeriNews AI](https://github.com/fafnirkyu/verinewsai) #170, [PatentPincer](https://github.com/doom2quake/patentpincer) #103 — the only project centered on patents) | WebSearch for `"SerpApi" "google_patents" project` surfaced only SerpApi's own blog tutorials, two thin MCP-wrapper forks ([KunihiroS/google-patents-mcp](https://github.com/KunihiroS/google-patents-mcp), [SoftwareStartups/google-patents-mcp](https://github.com/SoftwareStartups/google-patents-mcp)), and SDK example repos ([justserpapi/google-patents-search](https://github.com/justserpapi/google-patents-search), [justserpapi/google-patents-details](https://github.com/justserpapi/google-patents-details)) — no independent hackathon **product** beyond PatentPincer. | **Underexplored.** Only 1 dedicated product found across all sources. |
| **Google Scholar Case Law API** | 1 project ([Chancery](https://github.com/RaYYeR220/chancery) #31, as one of 11 engines) | WebSearch found only SerpApi's own blog posts ("How to scrape Google Case Law API for Legal Research...", "How to Extract Full Opinion Text from Google Scholar Case Law..."). **No community project found at all** that centers on this engine. | **Very underexplored / limited-to-no results found.** |
| **Google Ads Transparency Center API** | 3 projects ([AdWatch](https://github.com/jkarns87/AdWatch) #3, [Campaign Weather](https://github.com/tmoody1973/campaign-weather) #27, [Chancery](https://github.com/RaYYeR220/chancery) #31) | WebSearch found only SerpApi's own blog/product pages (launch announcement, "how to spy on winning Google Ads," "no code Ads Transparency scraper"). No independent community product beyond the 3 gallery entries. | **Underexplored**, especially for non-political/non-ad-monitoring use cases (e.g., ad-creative trend mining, IPO/funding-round ad-spend signals). |
| **Google Trends Trending Now API** (distinct from classic `google_trends`) | 1 project ([Jarvis Voice](https://github.com/bigsk1/jarvis-voice) #81, as 1 of ~28 engines it wraps) | WebSearch surfaced only SerpApi's own docs pages (Trending Now, Trending Now Daily/Realtime/Categories/Locations) and a generic "scrape Google Trends for product ideas" tutorial repo. No dedicated community product found. | **Underexplored** — note classic `google_trends` itself is well-used (12 projects) but the newer, real-time "Trending Now" variant specifically is essentially untouched. |
| **Google Play Store API** | 1 project ([CeaseFire](https://github.com/midhunrajcharles/Ceasefire) #30, as 1 of 10 engines, for brand-impersonation app detection) | WebSearch surfaced only SerpApi's own three official scraper repos (google-play-app-scraper, google-play-reviews-scraper, google-play-scraper) and blog posts. No independent hackathon product (e.g., an ASO/App Store Optimization tool, or app-review-mining product) found. | **Underexplored**, particularly for an India-specific angle (Play Store dominates Android in India). |
| **Search Index (alpha)** | 2 projects ([Jarvis Voice](https://github.com/bigsk1/jarvis-voice) #81, [LiveLLM](https://github.com/prx0r/livellm) #89) | Not independently web-searched beyond gallery; flagged as new/alpha by naming. | **Underexplored** — too new for much external evidence either way; noted as INFERENCE based on low gallery count + alpha status. |
| **Google Maps Reviews API "at scale" (reviews intelligence/sentiment dashboards)** | 4 projects ([Review Watchdog](https://github.com/vaithiyaseo/review-watchdog) #128, [Chancery](https://github.com/RaYYeR220/chancery) #31, [Unmet](https://github.com/byasb/unmet) #165, [Relokit](https://github.com/projects-hacks/relokit) #124) | WebSearch found SerpApi's own [google-maps-reviews-scraper](https://github.com/serpapi/google-maps-reviews-scraper) and [review-analyzer](https://github.com/serpapi/review-analyzer) (Chrome extension) repos, plus one bare independent scraper ([engkimo/google_maps_reviews_scraper](https://github.com/engkimo/google_maps_reviews_scraper), no analysis layer) and unrelated non-SerpApi review-sentiment projects. | **Moderately underexplored** — basic monitoring exists (Review Watchdog), but no gallery project does deep multi-location, multi-competitor review-sentiment analytics at scale. |
| **Google Ads API** (distinct from Ads Transparency) | 1 project ([AdWatch](https://github.com/jkarns87/AdWatch) #3) | Not separately searched; noted from gallery count alone. | **Underexplored** — INFERENCE from single gallery use. |
| **Google Finance API** | 1 project ([Chancery](https://github.com/RaYYeR220/chancery) #31) | Not separately web-searched. | **Underexplored** — INFERENCE from single gallery use; no dedicated finance-data product found in gallery. |
| **Instagram Profile API** | 1 project ([PyLadies Skill Gap Analyzer](https://github.com/arcursino/pyladies-serpapi) #117) | Not separately web-searched. | **Underexplored** — INFERENCE from single gallery use. |
| **Google Local Services API** | 1 project ([Jarvis Voice](https://github.com/bigsk1/jarvis-voice) #81) | Not separately web-searched. | **Underexplored** — INFERENCE from single gallery use. |
| **Zillow Search API** | 1 project ([Relokit](https://github.com/projects-hacks/relokit) #124) | Not separately web-searched. | **Underexplored**, notable because the Real Estate cluster (5 gallery projects) mostly relies on generic Google Search rather than the dedicated Zillow engine. |
| **"Forums" engine** | 0 projects found using an engine by this name | WebSearch for `"forums" engine project` combined with SerpApi/case-law query returned no relevant hits; could not confirm a `forums`-named engine exists in SerpApi's current catalog from this research alone. | **No results found — treat as unconfirmed**, not stated as a verified underexplored engine; flag for the teammate to check SerpApi's own engine catalog directly. |
| **Google Events API** | 3 projects ([WanderLens](https://github.com/jqw115-hash/pycon2026-serpapi-submission) #176, [FamilyOut](https://github.com/brianchin-sudo/familyout) #54, [Jarvis Voice](https://github.com/bigsk1/jarvis-voice) #81) | Not separately web-searched beyond gallery. | **Moderately underexplored** — only FamilyOut centers on events as the core product; others use it as one of several engines. |

---

## Part 6 — Limitations / caveats of this research

1. **The 177-project gallery is the dominant data source** for this report because it is structured, authoritative, and directly maintained by SerpApi. External sources (GitHub topic search, Devpost, Product Hunt, HN) added confirmatory and supplementary evidence but did not surface a large independent population of SerpApi projects outside this gallery — this itself is a finding: **the visible "built with SerpApi" ecosystem is heavily concentrated in this one gallery + a handful of GitHub topic repos**, rather than spread across many unconnected hackathons/showcases.
2. **Devpost's own search UI could not be scraped** (JavaScript-rendered, WebFetch returned blank). Findings from Devpost rely on WebSearch snippets and the DevNetwork hackathon's project-gallery page, which is a strong signal but not an exhaustive Devpost-wide search.
3. **Product Hunt and Hacker News yielded thin results** for actual "built with SerpApi" community projects — mostly SerpApi's own company posts/job listings/product launches were found instead. This should be read as "limited channel for this kind of evidence," not as proof no such projects exist there.
4. **Track assignments** (AI Agents / Open-Source Integrations / Travel & Local Discovery / Commerce & Market Intelligence / Knowledge & Public Interest / Open Innovation) were **not explicitly stated per-project** in the gallery data — any such mapping would be this researcher's inference from descriptions/tags, and was intentionally not forced onto all 177 entries to avoid fabricating structure that doesn't exist in the source data. The gallery/date-name evidence (Part 1) indicates most cataloged projects were built for **other** hackathons (PyCon 2026, DevNetwork API+Cloud+AI 2026, various Gemma-4 hackathons) rather than for the SerpApi India Hackathon 2026 specifically — track-fit should be treated as approximate.
5. Star counts and GitHub metadata reflect the state at fetch time (2026-09-17) and will drift.
6. This document intentionally contains **no recommendation or idea selection** — that is left to the teammate consuming this research, per the task instructions.
