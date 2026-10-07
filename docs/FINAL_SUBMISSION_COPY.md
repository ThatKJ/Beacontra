# Beacontra — Official Hackathon Submission Copy

**Ready-to-paste submission form text for SerpApi India Hackathon 2026**

---

### Project Name
Beacontra

### Track
Commerce & Market Intelligence

### One-line Description
Evidence-first marketplace intelligence and visual forensics for Indian D2C and SME brands.

### Short Description
Beacontra turns live marketplace search and reverse-image matching into a prioritized brand-protection investigation workspace. By fusing live Google Shopping search results with Google Lens reverse-image forensics, Beacontra extracts multi-platform pricing, merchant attribution, and photo matching evidence into an interactive evidence graph, automated case docket, and downloadable investigation dossiers.

### Full Description
Beacontra OS is an evidence-first marketplace monitoring and investigation platform built specifically for Indian Direct-to-Consumer (D2C) and SME brand protection teams.

In the Indian e-commerce landscape, unauthorized third-party sellers frequently latch onto genuine brand listings across Amazon India, Flipkart, and Google Shopping, often offering parallel imports or items at steep price discounts with unverified product imagery. Small-to-medium brand owners cannot afford enterprise brand-protection suites costing $25k+/year and are left manually searching marketplaces and taking screenshots.

Beacontra replaces this manual guesswork with an end-to-end evidence workflow:
1. **Brand Vault**: Stores ground-truth product DNA, statutory MRP, expected street-price bands, authorized seller lists, and canonical product photography.
2. **Market Radar**: Discovers live listings via SerpApi Google Shopping, deterministically filtering variant noise (accessories, cables, hardware tier descriptors).
3. **Visual Forensics**: Reverse-searches listing thumbnails via SerpApi Google Lens, classifying visual match confidence against authorized sources.
4. **Evidence Graph**: Renders an interactive bipartite network linking brands, products, listings, sellers, and visual evidence nodes.
5. **Watchtower**: Captures temporal marketplace snapshots to detect stealth price drops, new unauthorized merchants, and listing image swaps over time.
6. **Evidence Desk**: Assembles findings into formal investigation cases with analyst notes and one-click export to standalone, print-ready HTML dossiers.
7. **Beacontra Lens Extension**: A Manifest V3 Chrome sidepanel companion that extracts live listing details on Amazon.in and Flipkart and triggers investigations with zero client-side credentials.

All risk scores and priority rankings are computed deterministically without relying on LLM hallucinations. When evidence is inconclusive or Lens returns zero matches, the system conservatively reports neutral "no evidence" rather than fabricating anomalies.

### Who It Helps
Founders, brand protection officers, and e-commerce operations managers at Indian D2C and SME brands (FMCG, electronics, beauty, apparel) who need to monitor marketplace distribution compliance without enterprise software budgets.

### Problem
Indian marketplaces face widespread unauthorized seller and counterfeit challenges. In late 2024, the Delhi High Court restricted Flipkart's "latching-on" feature because unauthorized sellers were piggybacking on authentic listings. In early 2025, BIS conducted nationwide warehouse raids over forged certification marks, while platforms like Meesho reported removing over 4.2 million non-compliant listings. Small brands lack the tools to detect and document these occurrences across multiple platforms.

### Solution
Beacontra bridges this gap by cross-referencing live market offers against verified brand ground truth. By combining Google Shopping listing data, Google Lens reverse-image analysis, and authorized seller metadata, it ranks listings by review priority, maps multi-seller networks, and generates defensible evidence files.

### Why It Is Original
Most existing brand-monitoring tools either focus strictly on domain typosquatting (phishing DNS) or use generic LLMs to summarize unstructured text. Beacontra is the first tool to directly cross-reference marketplace listing photography against official brand reference photos using Google Lens, fusing visual evidence with price-band deviation and seller domain attribution into an interactive bipartite graph and exportable case dossier.

### SerpApi Products Used
- **Google Shopping API (`google_shopping`)**: Live marketplace listing discovery across Amazon.in, Flipkart, Reliance Digital, Croma, Myntra, JioMart, etc., including prices, sellers, thumbnails, and reviews.
- **Google Lens API (`google_lens`)**: Reverse-image search on candidate listing thumbnails to identify source image origins and visual match clusters.
- **Image Upload API (`image_upload`)**: Converts local reference photo buffers to SerpApi image tokens for direct visual reverse lookup.

### Why SerpApi Is Essential
Every piece of intelligence Beacontra provides originates from live SerpApi queries. There is no hardcoded database of listings. The visual forensics engine strictly requires reverse-image lookup capability; without SerpApi's Google Lens and Google Shopping engines, Beacontra could not discover multi-merchant listings or perform visual cross-verification. Removing SerpApi would remove the entire operational engine of the platform.

### Technical Complexity
- **Deterministic Multi-Signal Fusion**: Scores listings via independent mathematical heuristics (Price Anomaly, Seller Authorization, Visual Match) rather than generative text.
- **Credit-Budget Engineering**: Capped Lens execution to the top 10 candidates per scan ordered price-anomaly-first, bounding credit consumption.
- **Edge Architecture**: Built on Cloudflare Workers edge runtime with Hono, utilizing tiered KV/memory caching and zero client-side secrets.
- **Security Engineering**: Full SSRF defense blocking RFC 1918 private subnets, link-local addresses, and loopbacks, combined with XSS-safe HTML report generation.
- **Deterministic SKU & Variant Filtering**: Tokenizer strips accessory keywords (cases, cables, cushions) and hardware tiers to eliminate false price-deviation alerts.
- **Dual-Interface System**: Seamless coordination between the unified Beacontra OS web app and the Manifest V3 Chrome extension.

### Existing-Project Disclosure
An initial concept named "BrandLens" was conceived prior to the hackathon. During this hackathon cycle, the project was completely overhauled and evolved into **Beacontra OS**:
- Architected the multi-module Beacontra OS suite (Brand Vault, Market Radar, Visual Forensics, Evidence Graph, Watchtower, Evidence Desk, Autopilot).
- Engineered the Manifest V3 Chrome extension (`extension/`) from scratch.
- Implemented comprehensive SSRF protection and security hardening.
- Developed the SKU normalization engine, graph visualizer, and standalone HTML dossier generator.
- Expanded testing to 17 test suites (158 passed tests), headless browser UI checks, and accessibility audits.

### AI Tools Disclosure
Built under human engineering direction with specialized AI assistance:
- **Claude / Claude Code**: Architecture design, adversarial challenge review, documentation.
- **Gemini**: Independent security audits, competitive landscape verification, red-teaming.
- **GPT-6 Astra**: Visual design system tokens, responsive layout engineering, accessibility.
- **OpenCode**: Backend service implementation, TypeScript typing, test harness creation.

### GitHub Repository
https://github.com/ThatKJ/Beacontra

### Demo Video
[ADD VIDEO URL]
