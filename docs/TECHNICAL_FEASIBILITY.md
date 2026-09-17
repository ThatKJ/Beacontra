# Technical Feasibility Analysis for Product Concepts

**Date:** 2026-09-17
**Author:** OPENCODE
**Purpose:** Evidence-based analysis to support product decision (DECISION.md)
**Source:** SERPAPI_CAPABILITIES.md (verified official docs)

---

## Evaluation Framework

Each concept scored on:
1. **SerpApi Dependency Strength** (1-5): Would product break without SerpApi?
2. **India Market Fit** (1-5): Relevance to Indian users/context
3. **Technical Complexity** (1-5): Implementation difficulty (lower = easier)
4. **Credit Efficiency** (1-5): Value per API call (higher = better)
5. **Demo Wow Factor** (1-5): Visual/impact in 3-minute demo
6. **Differentiation** (1-5): vs "Google + ChatGPT" baseline

**Scale:** 1=Poor, 2=Fair, 3=Good, 4=Strong, 5=Exceptional

---

## Concept 1: Local Business Intelligence Platform
**"Yelp + Crunchbase for Indian neighborhoods" - Competitive analysis, site selection, reputation monitoring for local businesses**

### SerpApi Engines Required:
- `google_maps` (places search, coordinates, details)
- `google_maps_reviews` (sentiment, rating distribution, keywords)
- `google_local` (local pack rankings)
- `google_shopping` (product availability for retail)
- `google_trends` (search interest for categories/locations)

### User Flow:
1. Search "coffee shops in Koramangala, Bangalore" → `google_maps` + `google_local`
2. View ranked list with ratings, review count, price level, hours
3. Click business → deep dive: review sentiment, peak hours, photos, competitor proximity
4. "Compare with Indiranagar" → side-by-side metrics
5. Export PDF report for site selection

### Scores:
| Criterion | Score | Evidence |
|-----------|-------|----------|
| SerpApi Dependency | 5 | Core data ONLY from Maps/Local; no alternative API |
| India Fit | 5 | 100k+ precise Indian locations; Maps coverage excellent |
| Technical Complexity | 3 | Multi-engine orchestration, geospatial logic, sentiment |
| Credit Efficiency | 4 | 2-3 calls per search; cached 24hr; maps results rich |
| Demo Wow | 5 | Interactive map, live reviews, competitor radar chart |
| Differentiation | 4 | Aggregates + analyzes; not just search results |

**Total: 26/30**

### Credit Estimate per Session:
- Initial search: 2 calls (maps + local)
- Deep dive (3 competitors): 3 calls (maps_reviews × 3)
- Comparison: 2 calls (trends + maps)
- **Total: ~7 calls** (within budget if cached)

### Technical Risks:
- Review sentiment requires LLM or rule-based (add complexity)
- `google_local_services` US-only (not usable in India)
- Pagination for 100+ results needs multiple calls

---

## Concept 2: Price Intelligence / Smart Shopping Assistant
**"CamelCamelCamel + Honey for India" - Price tracking, best deal alerts, product comparison across Indian e-commerce**

### SerpApi Engines Required:
- `google_shopping` (primary: prices, ratings, sources, availability)
- `google_shopping_filters` (facets: brand, price range, delivery)
- `amazon` / `amazon_product` (Amazon.in deep details)
- `google_trends` (price history proxy via search interest)
- `google_news` (deal announcements, sales events)

### User Flow:
1. Search "iPhone 15 128GB" → `google_shopping` shows Flipkart, Amazon, Reliance, Croma prices
2. View price history chart (simulated via trends + cached snapshots)
3. Set price alert → background worker checks via Cron
4. "Compare specs" → side-by-side table from shopping results
5. "Where to buy today" → filter by in-stock + same-day delivery

### Scores:
| Criterion | Score | Evidence |
|-----------|-------|----------|
| SerpApi Dependency | 5 | Shopping data ONLY from SerpApi; no public Indian price API |
| India Fit | 5 | Google Shopping covers Flipkart, Amazon.in, Jiomart, TataCliq |
| Technical Complexity | 3 | Price normalization, variant matching, history simulation |
| Credit Efficiency | 3 | Shopping calls heavier; need frequent refresh for alerts |
| Demo Wow | 4 | Live price matrix, history chart, alert demo |
| Differentiation | 4 | Cross-platform comparison + alerts; not just search |

**Total: 24/30**

### Credit Estimate per Session:
- Product search: 1 call (shopping)
- Specs comparison: 1 call (shopping_filters)
- Price history (7-day): 7 calls (trends) or simulated
- **Total: ~3-9 calls** (alerts need cron = more credits)

### Technical Risks:
- Price freshness: Shopping results cached 1hr; real-time needs `no_cache`
- Variant matching: "iPhone 15 128GB Blue" vs "iPhone 15 128GB" across sites
- No direct price history API; must simulate via periodic snapshots
- Amazon.in requires `amazon` engine (different structure)

---

## Concept 3: Job Market Analytics Dashboard
**"Levels.fyi + LinkedIn Insights for India" - Salary benchmarks, skill demand, hiring trends by role/location**

### SerpApi Engines Required:
- `google_jobs` (listings: title, company, location, salary, description)
- `google_jobs_listing` (full description, requirements, benefits)
- `google_trends` (skill search interest: "React", "Python", "GenAI")
- `google_news` (layoff announcements, funding, hiring sprees)
- `google_search` (company research, Glassdoor/AmbitionBox pages)

### User Flow:
1. Select "Backend Engineer" + "Bangalore" → `google_jobs` shows 50+ listings
2. Salary distribution chart (extract from descriptions)
3. Top skills frequency analysis (parse requirements)
4. "Trending skills" → `google_trends` for tech stacks
5. Company deep dive → search + news for hiring health
6. Export salary report for negotiation

### Scores:
| Criterion | Score | Evidence |
|-----------|-------|----------|
| SerpApi Dependency | 5 | Jobs data ONLY from SerpApi; no structured Indian jobs API |
| India Fit | 5 | Google Jobs indexes Naukri, LinkedIn, Indeed, Instahyre, company sites |
| Technical Complexity | 4 | Salary parsing (unstructured), skill NER, trend correlation |
| Credit Efficiency | 3 | Jobs listing = 1 call; detail = 1 call each; trends = 1 |
| Demo Wow | 4 | Live salary bands, skill clouds, trend lines |
| Differentiation | 5 | Structured extraction from unstructured listings; unique value |

**Total: 26/30**

### Credit Estimate per Session:
- Job search: 1 call (jobs)
- 10 listing details: 10 calls (jobs_listing) - **HIGH**
- Trends (5 skills): 1 call (trends multi-query)
- **Total: ~12 calls** (optimization: sample 3-5 listings)

### Technical Risks:
- Salary rarely in structured field; must parse from description (LLM/regex)
- `google_jobs_listing` = separate call per job (credit heavy)
- Pagination via `next_page_token` only (no offset)
- Indian salary data often missing or "competitive"

---

## Concept 4: Trend Detection & Content Strategy Tool
**"Exploding Topics + AnswerThePublic for India" - Rising trends, content gaps, SEO opportunities**

### SerpApi Engines Required:
- `google_trends` / `google_trends_trending_now` (rising queries, regional)
- `google_related_questions` (People Also Ask → content clusters)
- `google_news` (news velocity, coverage gaps)
- `youtube` (video content, creator analysis)
- `google_search` (SERP analysis: featured snippets, competition)

### User Flow:
1. Enter "fintech" + "India" → `trends_trending_now` + `trends` (geo=IN)
2. View rising queries with growth %, related topics
3. Click query → `related_questions` for FAQ clusters
4. `news` + `youtube` for content format analysis
5. SERP gap analysis: "What's missing from page 1?"
6. Export content calendar with keywords

### Scores:
| Criterion | Score | Evidence |
|-----------|-------|----------|
| SerpApi Dependency | 5 | Trends + PAA + News ONLY via SerpApi; no public equivalent |
| India Fit | 4 | Trends geo=IN + states; PAA in English/Hindi; YouTube India huge |
| Technical Complexity | 2 | Mostly aggregation + visualization; low processing |
| Credit Efficiency | 5 | Trends multi-query (5/topics in 1 call); PAA = 1 call |
| Demo Wow | 4 | Live trend curves, question trees, content gaps |
| Differentiation | 3 | Similar tools exist (Exploding Topics, Glimpse) |

**Total: 23/30**

### Credit Estimate per Session:
- Trending now: 1 call
- Deep dive (5 topics): 1 call (trends multi-query)
- PAA for 3 topics: 3 calls
- News + YouTube: 2 calls
- **Total: ~7 calls** (very efficient)

### Technical Risks:
- Trends data delayed (not real-time)
- PAA limited to 4-5 questions per query
- Differentiation harder (established competitors)

---

## Concept 5: Travel Planning Assistant (India Focus)
**"MakeMyTrip + Google Trips intelligence" - Multi-city optimization, hidden gems, budget allocation**

### SerpApi Engines Required:
- `google_flights` / `google_flights_deals` (routes, prices, dates)
- `google_hotels` / `google_hotels_properties` (accommodation, reviews)
- `google_maps` (attractions, restaurants, transit)
- `tripadvisor` / `tripadvisor_reviews` (tourist validation)
- `google_events` (festivals, events during dates)

### User Flow:
1. Enter dates + origin + interests → `flights_deals` for destination ideas
2. Select destination → `hotels` + `maps` (attractions near hotel)
3. Build day-by-day itinerary with transit times
4. Budget tracker (flights + hotels + food estimate)
5. "Hidden gems" → maps filters + tripadvisor off-beat
6. Export shareable itinerary

### Scores:
| Criterion | Score | Evidence |
|-----------|-------|----------|
| SerpApi Dependency | 4 | Flights/hotels have alternatives (Skyscanner, Booking APIs) |
| India Fit | 5 | Domestic flights, IRCTC gaps, tier-2 city tourism growing |
| Technical Complexity | 4 | Multi-city optimization, date flexibility, constraint solving |
| Credit Efficiency | 2 | Flights + hotels + maps + events = many calls per plan |
| Demo Wow | 5 | Interactive map, live prices, drag-drop itinerary |
| Differentiation | 3 | Many travel apps; intelligence layer is key |

**Total: 23/30**

### Credit Estimate per Session:
- Flight search (3 date options): 3 calls
- Hotel search: 1 call
- Attractions (3 areas): 3 calls (maps)
- Events: 1 call
- **Total: ~8 calls** (but repeat planning = more)

### Technical Risks:
- `google_flights` requires airport codes (not city names)
- Hotel availability needs check-in/out dates
- No direct booking; affiliate links only
- Complex state management for itinerary builder

---

## Concept 6: Academic/Research Intelligence
**"Semantic Scholar + PatentScope for Indian researchers" - Literature gaps, citation networks, IP landscape**

### SerpApi Engines Required:
- `google_scholar` (papers, citations, years)
- `google_scholar_author` (researcher profiles, h-index)
- `google_patents` / `google_patents_details` (IP landscape)
- `google_trends` (research topic velocity)
- `google_news` (breakthrough announcements)

### User Flow:
1. Search "transformer architecture" → `scholar` papers with citations
2. Filter by year, citations, author affiliation (IIT, IISc, etc.)
3. Citation network visualization (who cites whom)
4. Patent landscape for same keywords
5. "Research gap" detection: high citations + low recent papers
6. Export literature review skeleton

### Scores:
| Criterion | Score | Evidence |
|-----------|-------|----------|
| SerpApi Dependency | 5 | Scholar + Patents ONLY via SerpApi; no free structured API |
| India Fit | 3 | Niche audience (researchers); IIT/IISc output growing |
| Technical Complexity | 5 | Citation graph, author disambiguation, gap detection |
| Credit Efficiency | 3 | Scholar paginated; patents detailed; multi-call |
| Demo Wow | 3 | Citation graph cool but niche appeal |
| Differentiation | 4 | Unique combination; no Indian-focused tool |

**Total: 23/30**

### Credit Estimate per Session:
- Scholar search: 1 call
- 5 author profiles: 5 calls
- Patent search: 1 call
- **Total: ~7 calls**

### Technical Risks:
- Scholar pagination limited (no deep scroll)
- Author disambiguation hard (common names)
- Patent data dense; parsing complex
- Small hackathon judge audience

---

## Concept 7: Financial Market Monitor (Indian Markets)
**"Bloomberg Terminal lite for NSE/BSE" - Real-time quotes, news sentiment, sector rotation**

### SerpApi Engines Required:
- `google_finance` (NSE/BSE quotes, charts, fundamentals)
- `google_finance_markets` (sector heatmap, gainers/losers)
- `google_news` (company-specific + sector news)
- `google_trends` (search interest as retail sentiment proxy)
- `google_search` (earnings calls, analyst reports)

### User Flow:
1. Dashboard: Nifty 50 heatmap + sector rotation (`finance_markets`)
2. Watchlist: Real-time quotes + sparklines (`finance`)
3. Stock deep dive: News sentiment + trends + key metrics
4. "Earnings calendar" → upcoming results + estimates
5. Sector comparison: PE ratios, momentum, news volume
6. Alert on price/volume/news spikes

### Scores:
| Criterion | Score | Evidence |
|-----------|-------|----------|
| SerpApi Dependency | 4 | Finance data has alternatives (Alpha Vantage, Twelve Data) |
| India Fit | 4 | NSE/BSE symbols supported; Indian financial news indexed |
| Technical Complexity | 4 | Real-time updates, WebSocket simulation, charting |
| Credit Efficiency | 2 | Finance calls frequent for "real-time" feel; news + trends |
| Demo Wow | 4 | Live ticker, heatmap, sentiment gauge |
| Differentiation | 3 | Many fintech apps; retail-focused unique angle |

**Total: 21/30**

### Credit Estimate per Session:
- Market overview: 1 call (markets)
- 10 stock quotes: 1 call (finance multi-symbol?)
- News for 5 stocks: 5 calls
- Trends: 1 call
- **Total: ~8 calls** (but "real-time" needs polling = unsustainable)

### Technical Risks:
- `google_finance` not true real-time (15-20 min delay)
- No WebSocket; polling burns credits fast
- Indian market hours (9:15-15:30 IST) limit demo windows
- Regulatory: Not financial advice disclaimer needed

---

## Summary Ranking

| Rank | Concept | Total | SerpApi Dep | India Fit | Complexity | Credits | Wow | Diff |
|------|---------|-------|-------------|-----------|------------|---------|-----|------|
| 1 | **Local Business Intelligence** | **26** | 5 | 5 | 3 | 4 | 5 | 4 |
| 2 | **Job Market Analytics** | **26** | 5 | 5 | 4 | 3 | 4 | 5 |
| 3 | **Price Intelligence** | **24** | 5 | 5 | 3 | 3 | 4 | 4 |
| 4 | **Trend Detection** | **23** | 5 | 4 | 2 | 5 | 4 | 3 |
| 5 | **Travel Planning** | **23** | 4 | 5 | 4 | 2 | 5 | 3 |
| 6 | **Academic Research** | **23** | 5 | 3 | 5 | 3 | 3 | 4 |
| 7 | **Financial Monitor** | **21** | 4 | 4 | 4 | 2 | 4 | 3 |

---

## Top 3 Recommendations for DECISION.md

### 1. Local Business Intelligence Platform (Winner)
**Why:** Maximum SerpApi dependency (Maps/Local have no alternative), perfect India fit (maps coverage exceptional), strong demo (visual map + charts), differentiation through analysis not just search.

**MVP Scope:**
- Search businesses by category + location
- Ranked cards with key metrics
- Click → review sentiment + competitor map
- Compare 2-3 areas side-by-side
- Export one-pager

**SerpApi Calls/Session:** 3-5 (cached)

### 2. Job Market Analytics Dashboard (Runner-up)
**Why:** Equally strong SerpApi dependency, high India relevance (huge job market), unique differentiation (salary extraction from unstructured data), strong judge appeal (employment is universal pain point).

**MVP Scope:**
- Search roles by city
- Salary band visualization (parsed)
- Top skills frequency
- Trending skills (Trends)
- Company hiring health

**SerpApi Calls/Session:** 5-8 (optimize: sample listings)

### 3. Price Intelligence / Smart Shopping (Strong Contender)
**Why:** Clear consumer value, strong India e-commerce coverage, good demo (live price matrix), practical utility.

**MVP Scope:**
- Product search across platforms
- Price comparison table
- Price drop alert (cron)
- Specs comparison
- Best deal badge

**SerpApi Calls/Session:** 3-5

---

## Implementation Complexity Comparison (MVP in 3-4 days)

| Concept | Backend Complexity | Frontend Complexity | Data Processing | Total Effort |
|---------|-------------------|---------------------|-----------------|--------------|
| Local Business Intel | Medium (geo, multi-engine) | Medium (map, cards, charts) | Medium (sentiment, ranking) | **Medium** |
| Job Market Analytics | Medium-High (pagination, parsing) | Medium (charts, tables) | **High** (salary NER, skill extraction) | **Medium-High** |
| Price Intelligence | Medium (variant matching) | Medium (tables, history viz) | Medium (normalization, alerts) | **Medium** |

---

## Final Recommendation

**Primary: Local Business Intelligence Platform**
- Best balance of SerpApi dependency, India fit, demo impact, feasible scope
- Maps/Local engines are SerpApi's crown jewels
- Visual demo (map + charts) wins hackathons
- Clear "before/after" vs manual Google Maps searching

**Fallback: Job Market Analytics** (if Claude prefers B2B/employment angle)
- Equally strong SerpApi dependency
- Salary parsing is impressive technical feat
- Universal judge relatability

**Decision Needed:** Claude to choose in DECISION.md with rationale

---

## VERIFIED BY GEMINI (RED TEAM)

- [x] **Actual `google_maps` coverage density for Tier-2/3 Indian cities:** VERIFIED HIGH. Google Maps has near-ubiquitous coverage of Indian tier-2/3 cities including street-level businesses.
- [x] **`google_jobs` salary field availability for Indian listings:** VERIFIED SPARSE. Indian listings often omit salary or use "Not disclosed". Relying purely on structured salary fields is a high risk. We must use LLMs to extract proxy data from job descriptions or pivot if selecting this concept.
- [x] **`google_shopping` coverage of Indian D2C brands:** VERIFIED HIGH. Brands like Mamaearth, boAt, and Noise actively syndicate product feeds to Google Merchant Center; they appear reliably.
- [x] **`google_trends` state-level granularity:** VERIFIED. ISO 3166-2:IN codes (e.g., `IN-KA`, `IN-MH`) are fully supported by SerpApi for regional granularity.
- [x] **SerpApi.org vs .com engine parity:** RED TEAM WARNING. **There is no SerpApi.org**. SerpApi.com is the ONLY official domain. Do not use `.org` anywhere in documentation or code.
- [x] **Rate limit behavior under burst:** VERIFIED. SerpApi manages via *hourly throughput limits* (e.g., 20% of monthly volume per hour = 1,000 req/hr on a 5k plan), not strict concurrency limits. A burst of 10 rapid searches for a demo is perfectly safe, but long-term polling requires pacing.