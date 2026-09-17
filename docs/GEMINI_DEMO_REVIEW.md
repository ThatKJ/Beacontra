# Gemini Demo Review

**STATUS: REVIEW COMPLETE - ISSUES FOUND**

This document evaluates the `BrandLens` demo (`public/index.html`) from the perspective of a hostile hackathon judge watching a 3-minute pitch.

## Demo Evaluation

### 1. Can I understand the product in 5 seconds?
**PASS.** The UI clearly states "Commercial Anomaly & Brand-Risk Scanner for Indian D2C Brands". The inputs (Product Name, Official Image URL) are intuitive.

### 2. Can I SEE why a listing was flagged?
**PASS.** The side-by-side "Photo Verification (Google Lens Reverse Match)" explicitly shows the Official Brand Photo next to the Marketplace Listing Photo. This provides immediate, visceral proof of the anomaly.

### 3. Does the reference-vs-result comparison create a real wow moment?
**PASS (conditional).** The side-by-side images look great. However, if the judge suspects this is a hardcoded frontend or using a static JSON fixture, the "wow" factor vanishes instantly.

### 4. Are we accidentally claiming a product is counterfeit?
**PASS.** The language has been correctly updated to objective risk framing: "Visual Anomaly / Discrepancy" rather than "stolen photo" or "counterfeit".

### 5. Is any score pretending to represent certainty it does not have?
**FAIL (P1).** The UI displays `Risk Score: 85/100`. This `/100` denominator strongly implies a statistical certainty or machine-learning probability that we do not possess. The score is a heuristically derived sum (Price=35 + Seller=25 + Visual=40). Presenting it as a percentage is intellectually dishonest and will be called out by a technical judge.

### 6. Is SerpApi visibly essential?
**FAIL (P0).** While the backend uses SerpApi, the frontend completely lacks "Live-vs-Fixture" transparency. When the app is run locally without an API key (or when hitting a cache), the UI just says "0 credits used". A judge will immediately ask, "Is this live or a mock?" If we can't prove on-screen that we just ran a live SerpApi search, they will assume it's a mock. 

## Required Fixes (Added to TASK_BOARD.md)
- **T-023 (P0): Live vs Fixture Transparency:** The UI must display a prominent badge indicating whether the results came from a LIVE SerpApi call or a CACHED/FIXTURE response.
- **T-024 (P1): Heuristic Score Accuracy:** Remove the `/100` denominator. Rename it to "Heuristic Risk Score: 85" or use a progress bar without pretending it's a probability metric.
