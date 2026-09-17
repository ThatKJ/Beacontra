# SerpApi Technical Capabilities Research

**Source:** Official SerpApi documentation, GitHub engine catalog (133 engines), playground, pricing pages
**Status:** VERIFIED from official sources
**Date:** 2026-09-17

---

## Engine Catalog Summary (133 Total)

### Google (69 engines)
| Engine | Description | Key Parameters | Hackathon Relevance |
|--------|-------------|----------------|---------------------|
| `google` | Main Google Search | q, location, gl, hl, google_domain | Core search, organic/local/knowledge graph |
| `google_light` | Fast, essential Google Search | q, location, gl, hl | **Cheaper, faster** - prefer for production |
| `google_ai_mode` | Google AI-powered search | q, gl, hl | AI summaries, cutting-edge |
| `google_ai_overview` | Google AI Overview results | q, gl, hl | Extract AI summaries + citations |
| `google_autocomplete` | Search autocomplete suggestions | q, gl, hl | Query suggestions, type-ahead |
| `google_related_questions` | "People Also Ask" questions | q, gl, hl | Question clustering, FAQ generation |
| `google_images` / `_light` | Image search | q, location, ijn, safe | Visual search, product images |
| `google_reverse_image` | Reverse image search | image_url, gl, hl | Visual lookup, authenticity |
| `google_lens` | Google Lens visual search | url, image_url | Advanced visual understanding |
| `google_news` / `_light` | News results | q, gl, hl, tbm=nws | Real-time news, trends |
| `google_shopping` / `_light` | Product search | q, location, direct_link | **High value** - price comparison, specs |
| `google_shopping_filters` | Shopping filters/facets | q, tbs, gl, hl | Faceted navigation, filter UI |
| `google_videos` / `_light` | Video search | q, location, gl, hl | Video content discovery |
| `google_short_videos` | Shorts/TikTok style | q, gl, hl | Short-form video trends |
| `google_local` | Local pack results | q, location, gl, hl | Local business discovery |
| `google_local_services` | Local Services ads (USA only) | q, location, category | Service professionals (plumbers, etc.) |
| `google_maps` | Maps search | q, ll, type | **High value** - places, coordinates |
| `google_maps_reviews` | Place reviews | data_id, hl, sort | Reputation analysis |
| `google_maps_directions` | Directions | origin, destination | Routing, commute analysis |
| `google_maps_photos` | Place photos | data_id, hl | Visual context |
| `google_maps_posts` | Business posts | data_id, hl | Business updates |
| `google_maps_autocomplete` | Maps autocomplete | q, ll | Place search suggestions |
| `google_jobs` / `_listing` | Job search | q, location, chips | **High value** - job market analysis |
| `google_scholar` / `_author` / `_cite` | Academic search | q, as_ylo, as_yhi | Research, citations |
| `google_patents` / `_details` | Patent search | q, patent_number | IP research |
| `google_finance` / `_markets` | Stock/market data | q, window | Financial data |
| `google_flights` / `_deals` / `_autocomplete` | Flight search | departure_id, arrival_id, outbound_date | Travel planning |
| `google_hotels` / `_ads` / `_reviews` / `_properties` | Hotel search | q, check_in_date, check_out_date | Travel, accommodation |
| `google_trends` / `_autocomplete` / `_news` / `_trending_now` | Trends data | q, geo, date | **High value** - trend analysis, market research |
| `google_events` | Events search | q, location, gl, hl | Event discovery |
| `google_play` / `_product` / `_reviews` | Play Store | q, store, gl, hl | App market analysis |
| `google_ads` / `_transparency_center` | Ads data | q, location, customer_id | Competitive ad intelligence |
| `google_immersive_product` | Immersive product views | q, product_id | 3D product visualization |
| `google_forums` | Forum results | q, gl, hl | Community discussions |
| `google_travel` / `_explore` | Travel destinations | q, gl, hl, travel_type | Travel planning |

### Bing (9 engines)
`bing`, `bing_images`, `bing_news`, `bing_shopping`, `bing_videos`, `bing_copilot`, `bing_maps`, `bing_product`, `bing_reverse_image`

### DuckDuckGo + AI Web (5 engines)
`duckduckgo` / `_light`, `duckduckgo_maps`, `duckduckgo_news`, `brave_ai_mode`

### Yahoo, Yandex, Baidu, Naver (15 engines)
Regional search engines for specific markets

### Shopping (13 engines)
`amazon` / `_product` / `_reviews`, `ebay` / `_product` / `_deals`, `walmart` / `_product` / `_reviews` / `_product_sellers`, `home_depot` / `_product` / `_product_reviews`

### Travel & Local (10 engines)
`tripadvisor` / `_place` / `_reviews`, `yelp` / `_place` / `_reviews`, `opentable` / `_reviews`, `apple_maps` / `_places`

### Media (9 engines)
`youtube` / `_video` / `_video_transcript` / `_channel` / `_playlist` / `_shorts`, `apple_app_store` / `_product` / `_reviews`

### Social (2 engines)
`instagram_profile`, `facebook_profile`

### SerpApi Search Index (Alpha)
`search_index` - First-party crawled index, no external dependency, fastest, private, **alpha**

---

## India-Specific Capabilities

### Verified Support:
- **Location parameter**: Supports Indian cities (Mumbai, Delhi, Bangalore, Hyderabad, Chennai, Kolkata, Pune, Ahmedabad, etc.)
- **gl parameter**: `gl=in` for India country code
- **hl parameter**: `hl=en` (English), `hl=hi` (Hindi), and other Indian languages
- **google_domain**: `google.co.in` supported
- **Google Maps**: Full coverage of Indian places, businesses, coordinates
- **Google Shopping**: Indian e-commerce results (Flipkart, Amazon.in, Jiomart, etc.)
- **Google Jobs**: Indian job market (Naukri, LinkedIn India, Indeed India, etc.)
- **Google Trends**: `geo=IN` for India trends, state-level (`IN-MH`, `IN-KA`, `IN-DL`, etc.)
- **YouTube**: Indian content, regional languages
- **Local engines**: Yelp limited in India; Tripadvisor works for tourism; Apple Maps growing

### India-Relevant Engine Combinations:
1. **Local Business Discovery**: `google_maps` + `google_local` + `google_local_services` (limited to US)
2. **Price Comparison**: `google_shopping` + `amazon` + `flipkart` (via shopping) + `walmart` (limited)
3. **Job Market**: `google_jobs` + `linkedin` (via web search)
4. **Trend Analysis**: `google_trends` + `google_news` + `youtube`
5. **Travel/Tourism**: `google_hotels` + `google_flights` + `tripadvisor` + `google_maps`
6. **Academic/Research**: `google_scholar` + `google_patents`
7. **Financial**: `google_finance` (Indian stocks: NSE/BSE symbols)

---

## Pricing & Credit Model

### SerpApi.com (Official)
| Plan | Monthly Cost | Searches/Month | Hourly Throughput |
|------|-------------|----------------|-------------------|
| Free | $0 | 250 | 50/hr |
| Starter | $25 | 1,000 | 200/hr |
| Developer | $75 | 5,000 | 1,000/hr |
| Production | $150 | 15,000 | 3,000/hr |
| Big Data | $275 | 30,000 | 6,000/hr |

**Key Rules:**
- Only successful searches count (cached, errored, failed = free)
- Cached searches are free (1hr TTL default)
- `no_cache=true` forces fresh request (costs credit)
- Light variants (`*_light`) are cheaper/faster
- Results per response don't affect credit cost

### SerpApi.org (Alternative)
- 5,000 free credits on signup
- Pay-as-you-go: ~$0.36/1k credits (Basic) down to $0.024/1k (Ultra)
- "Advanced requests" = ~3 credits each (maps, shopping, jobs, etc.)
- Standard requests = 1 credit (web search, images, news)

### Hackathon Budget Strategy:
- Free tier: 250 searches (SerpApi.com) or 5,000 credits (SerpApi.org)
- Target: **< 10 searches per user session** for demo
- Use `_light` variants aggressively
- Cache aggressively (1hr+ TTL for static-ish data)
- Pre-fetch fixture data for development/testing

---

## Response Formats & Key Data Structures

### Common Top-Level Fields:
```json
{
  "search_metadata": { "id", "status", "json_endpoint", "created_at", "processed_at", "total_time_taken" },
  "search_parameters": { "engine", "q", "location", "gl", "hl", ... },
  "search_information": { "total_results", "time_taken_displayed", "query_displayed" }
}
```

### Engine-Specific Result Arrays:
| Engine | Key Result Arrays |
|--------|-------------------|
| `google` | `organic_results`, `local_results`, `knowledge_graph`, `answer_box`, `related_questions`, `ads`, `shopping_results` |
| `google_maps` | `local_results` (places), `place_results` (detailed) |
| `google_shopping` | `shopping_results` (products with price, rating, source, link) |
| `google_jobs` | `jobs_results` (title, company, location, description, apply_link) |
| `google_trends` | `interest_over_time`, `interest_by_region`, `related_topics`, `related_queries` |
| `google_maps_reviews` | `reviews` (rating, text, time, user) |
| `youtube` | `video_results` (title, channel, views, duration, thumbnail) |

---

## Technical Constraints & Best Practices

### Rate Limits:
- Free: 50/hr (SerpApi.com), generous on SerpApi.org
- Respect `X-RateLimit-Remaining` headers
- Implement exponential backoff on 429

### Latency:
- Typical: 1-3 seconds per request
- Light variants: ~500ms-1s
- Maps/Shopping/Jobs: 2-4s (more complex parsing)
- Parallelize independent requests

### Caching Strategy:
- SerpApi server-side cache: 1hr default, free on cache hit
- Client-side cache: Add another layer (Redis/Upstash/KV) for 24hr+ TTL on semi-static data
- Cache key: `engine + normalized_query_params`

### Error Handling:
- 401: Invalid API key
- 400: Missing required parameter
- 429: Rate limit exceeded (hourly or monthly)
- 5xx: SerpApi infrastructure issue
- Timeout: Default 30s, configurable

### Parameter Validation:
- `q` required for most engines
- `location` + `gl` + `hl` for geo-targeted engines
- `google_domain` for domain-specific results
- Mutually exclusive: `location` vs `uule` vs `lat/lon`

---

## High-Value Engine Combinations for Hackathon Products

### 1. **Local Business Intelligence Platform**
- `google_maps` (places) → `google_maps_reviews` (reputation) → `google_local` (local pack)
- Use case: Competitive analysis, site selection, review sentiment

### 2. **Price Intelligence / Shopping Assistant**
- `google_shopping` (products) → `amazon_product` (details) → `google_shopping_filters` (facets)
- Use case: Price tracking, best deal finder, product comparison

### 3. **Job Market Analytics**
- `google_jobs` (listings) → `google_jobs_listing` (details) → `google_trends` (skill trends)
- Use case: Salary benchmarking, skill gap analysis, hiring trends

### 4. **Trend Detection & Content Strategy**
- `google_trends` (trending) → `google_news` (coverage) → `youtube` (video content) → `google_related_questions` (FAQ)
- Use case: Content planning, market research, SEO

### 5. **Travel Planning Assistant**
- `google_flights` + `google_hotels` + `google_maps` (attractions) + `tripadvisor` (reviews)
- Use case: Itinerary optimization, budget planning

### 6. **Academic/Research Assistant**
- `google_scholar` (papers) → `google_patents` (IP) → `google_trends` (research trends)
- Use case: Literature review, gap analysis, citation tracking

### 7. **Financial Market Monitor**
- `google_finance` (stocks) → `google_news` (financial news) → `google_trends` (search interest)
- Use case: Portfolio monitoring, earnings prep, sector analysis

---

## Recommended Stack for Hackathon

### Backend: Cloudflare Workers
- Native TypeScript support
- KV for caching (free tier: 100k reads/day, 1k writes/day)
- Cron triggers for scheduled jobs
- Queues for async processing
- Edge deployment = low latency globally
- `wrangler` CLI for dev/deploy

### Frontend: React + Vite (or HTMX for simplicity)
- Deploy to Cloudflare Pages
- Static assets + API routes via Workers

### SerpApi Client:
- Simple fetch wrapper with:
  - Request deduplication (in-flight)
  - Response caching (KV + memory)
  - Retry with exponential backoff
  - Fixture mode for development
  - Credit tracking/estimation

### Testing:
- Vitest for unit/integration
- Fixture-based tests (zero live credits)
- Gated live integration tests
- TypeScript strict mode

---

## UNVERIFIED — REQUIRES EXTERNAL CHECK

- [ ] Exact credit cost per engine (some "advanced" engines cost more)
- [ ] SerpApi.org vs SerpApi.com API compatibility
- [ ] India-specific `google_local_services` availability (docs say US only)
- [ ] `search_index` alpha quality for production use
- [ ] Concurrent request limits per plan
- [ ] Webhook/async support for long-running searches
- [ ] Batch/multi-query API (single request, multiple queries)