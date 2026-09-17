# Beacontra Final Limitations

## FIXED LIMITATIONS
- **Demo Latency:** The initial 112-second live scan latency was resolved by parallelizing up to 10 Lens API calls concurrently, dramatically reducing total response time to ~15 seconds.
- **Reference Image File Upload:** Upgraded the UI and API to natively support standard browser file uploads using `multipart/form-data`, passing image binaries directly to SerpApi for reverse lookup, eliminating the requirement to manually host reference images.
- **Variant Skew and False Positives:** Hardened Shopping result normalization with deterministic regex variant extraction (e.g., distinguishing "boAt Airdopes 141" from "Elite ANC", "Pro", and "cases"), ensuring prices are compared against matching SKUs.
- **Price Anomaly Granularity:** Overhauled the price signal logic to distinguish `below_mrp` (extreme deviation <50%), `large_deviation` (<70%), and `moderate_discount` (<90%), stopping ordinary market discounts from dominating review priority.
- **Seller Signal Penalties:** Fixed a logic bug where `no_authorized_list` penalized the score by 15 points. It now provides a neutral 5-point baseline, ensuring unknown sellers are not automatically presumed fraudulent without an explicit brand allowlist.
- **Error Transparency:** Extracted backend SerpApi status errors into the frontend UI, replacing generic connection failures with actionable error messages.
- **Lens Coverage Explanation:** Added clear provenance messaging to the UI explicitly stating that visual analysis is bounded to the top 10 most anomalous candidates to respect API quotas.

## UNAVOIDABLE (OR KNOWN/ACCEPTABLE) LIMITATIONS
- **Live Search Variability:** As Beacontra pulls live data, search results and exact rankings for the same product can shift over time depending on Google's Shopping index.
- **Lens Visual Evidence Caps:** To safely manage SerpApi credits, visual analysis is inherently restricted to the top 10 candidate listings. The remaining listings are classified as `not_verified` but retain their commercial price/seller evidence.
- **Absence of Visual Evidence:** Google Lens often returns no exact product matches for typical e-commerce thumbnail images, degrading the visual signal to `no_evidence` or `unavailable`. This is accepted as a natural limitation of third-party indexes and Beacontra falls back gracefully to commercial signals rather than making false claims.
- **Score Subjectivity:** The Review Priority Score is a hand-tuned deterministic heuristic, not a machine-learned probability or legal guarantee of counterfeit status.
