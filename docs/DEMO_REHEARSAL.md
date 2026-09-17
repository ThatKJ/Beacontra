# Demo Rehearsal

**Target time: 2:30–2:50**

## 0:00 - The Problem
"Hello, we built **Beacontra**. E-commerce fraud isn't just a consumer problem; it's a massive threat for SME brand owners in India. If you run a D2C brand, third-party sellers constantly hijack your listings, undercut your MRP, and sell unauthorized variants. Standard verification tools cost thousands of dollars. We built a self-serve, multi-signal scanner using SerpApi to democratize this protection."

## 0:30 - The Product Demo
*(Start live scan for Mamaearth Onion Hair Oil, MRP ₹419)*
"A brand owner enters their product name, official image URL, and MRP. Beacontra immediately runs a broad `google_shopping` search across the Indian marketplace, retrieving **40 raw candidates**."
*(Wait for scan to resolve - point out the loader)*
"Because SerpApi is so fast, we can afford to take those 40 results and deeply analyze the 10 most anomalous ones using `google_lens`. We fuse three signals: Price, Seller Authorization, and Visual Evidence."

## 1:15 - The Results (Truth & Fallback)
*(Show the populated results dashboard)*
"Here is the final **Review Priority Score**. Notice we don't say 'counterfeit'—we provide evidence for human review.
In this scan, we identified price anomalies below our MRP.
But more importantly, look at the visual signal. We run reverse image searches on these listings. When Lens maps the image successfully, we show exact matches. However, we're honest about the data: often, standard product images return 'No Evidence/Unavailable' from Lens. Beacontra is built to degrade gracefully when visual evidence is missing, relying on the robust price and seller signals instead of throwing an error or faking confidence."

## 2:00 - The Value
*(Click to expand the JSON trace)*
"Every single score is backed by a deterministic JSON trace. No LLM hallucinations in the scoring path. It costs about **10 SerpApi credits** to scan a product and give a brand owner immediate, actionable intelligence."

## 2:30 - Wrap Up
"Beacontra. Where price, seller, and photo evidence meet. Thank you."
