# Competitive Adjudication: CeaseFire vs Candidate #4

## VERIFIED INVESTIGATION OF CEASEFIRE

I have cloned and deeply inspected the source code and documentation of Project #30 (CeaseFire). 

- **Who is the user?** Organisations with a brand worth impersonating and no brand-protection budget (regional banks, D2C brands, etc.).
- **What does the user provide as input?** A brand domain (e.g., `example.com`).
- **Does CeaseFire accept a canonical product photograph?** No.
- **Does it use SerpApi Google Lens?** No.
- **Does it perform reverse-image matching?** No.
- **Does it use exact_matches / visual_matches / product matches?** No.
- **Does it discover product listings FROM an image?** No.
- **Does it normalize sellers?** No.
- **Does it calculate price anomalies?** No.
- **Does it fuse seller + commercial + visual evidence?** No.
- **Does it rank individual marketplace listings?** No.
- **Does it explain why an individual listing is suspicious?** No.
- **Does it perform broad brand impersonation discovery instead?** Yes. It generates typosquatting domains (e.g. `paypa1.com`) and searches across 10 surfaces to see if those domains are actively indexed or cited.
- **What exact action does the user take from its result?** The user signs a drafted takedown notice against the impersonating domain.
- **What is its central 30-second demo?** Enter a domain, the system generates lookalikes, filters by DNS/MX, and proves that an attacker's domain is being cited as a source by Google's AI Overview.

## JOB TO BE DONE COMPARISON

**CEASEFIRE JOB TO BE DONE:**
"Help a brand owner detect if a malicious typosquatting domain is being actively surfaced and legitimized by Google's search algorithms."

**OUR JOB TO BE DONE (Candidate #4):**
"Help a D2C brand owner detect unauthorized 3rd-party sellers selling counterfeit goods on marketplaces by finding price anomalies and reverse-image-matching product photos to prove theft."

**Assessment:** These are entirely distinct jobs. CeaseFire protects the *domain identity*. Candidate #4 protects the *physical product inventory*. 

## FOUR OVERLAP TESTS

1. **PERSONA OVERLAP:** MEDIUM (Both target brand protection / D2C brand owners).
2. **INPUT OVERLAP:** LOW (Domain string vs. Product SKU + Image).
3. **COMPUTATION OVERLAP:** LOW (Domain permutation & DNS filtering vs. Price anomaly & Reverse Image hashing).
4. **OUTCOME OVERLAP:** LOW (Domain takedown vs. Marketplace listing takedown).

## THE ARCHITECTURE TEST

**Could CeaseFire add our supposedly differentiating workflow with:**
**D. a fundamentally different pipeline.**

CeaseFire's entire architecture (`services/permutations.py`, `prefilter.py`) is a string-manipulation and network-resolution funnel. Candidate #4 requires image processing, variant matching across disparate shopping listings, and reverse image search orchestration. They share zero architectural DNA beyond calling SerpApi.

## THE DEMO TEST

If simulated side-by-side:
- **CeaseFire:** Shows a domain (`mybank.com`), generates permutations (`mybanc.com`), and reveals the fake domain cited in an AI Overview.
- **Candidate #4:** Shows a product photo, scans Shopping for cheap variants, and draws a red box showing how a sketchy seller stole the exact canonical pixels.

These demos are visually, narratively, and technically completely distinct.

---

VERDICT:
CLEARLY DISTINCT

CONFIDENCE:
HIGH

STRONGEST EVIDENCE AGAINST OUR PROJECT:
Both products operate in the "B2B Brand Protection" space and both technically query the `google_shopping` engine (though for entirely different purposes).

STRONGEST EVIDENCE FOR OUR PROJECT:
Candidate #4 relies on visual evidence (`google_lens` / reverse image), which CeaseFire definitively does not use. The core technical mechanism and input modalities have zero overlap. 

WHAT WOULD CHANGE MY VERDICT:
If Candidate #4 drops the visual/image verification component and reverts to just checking seller names, it would become a generic scraper and lose its differentiation.
