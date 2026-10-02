# Beacontra: Controlled Live Verification Protocol & Request Budget

**Repository:** `ThatKJ/Beacontra`  
**Status:** **HALTED — AWAITING EXPLICIT USER APPROVAL BEFORE EXECUTION**  
**Budget Governance:** Strict SerpApi credit conservation under free-tier quota (250 requests/month).

---

## 1. Credit Calculation & Maximum Expected Request Count

In accordance with repo rules (`AGENTS.md`) and the project credit discipline charter (`docs/SERPAPI_BUDGET.md`):

### Budget Formula per Investigation Scan:
$$\text{Total Credits} = \text{Credits}_{\text{shopping}} + \min(\text{Candidates}_{\text{visual}}, \text{MAX\_LENS\_CALLS})$$

1. **Marketplace Discovery Engine (`google_shopping`):**
   - Query: `productName` with geolocation `gl: in` (India), language `hl: en`.
   - **Cost: 1 SerpApi Credit**.
2. **Reverse-Image Visual Verification (`google_lens`):**
   - Candidate Cap: Strictly bounded by `MAX_LENS_CALLS = 10` (ordered price-anomaly-first in `src/lib/beacontra.ts`).
   - Image Deduplication: Listings that share identical image URLs are deduplicated prior to dispatch; each unique image is queried at most once.
   - **Cost: Between 1 and 10 SerpApi Credits** (maximum 10).
3. **Total Maximum Credit Consumption:**
   $$\text{Maximum Expected Credits} = 1 + 10 = \mathbf{11\text{ Credits}}$$
   *(If previously scanned within cache TTL of 24h: **0 Credits**).*

---

## 2. Planned Controlled Live Test Configuration

Once explicit user approval is granted, the single live investigation will be executed with these parameters:

```json
{
  "productName": "boAt Airdopes 141",
  "officialImageUrl": "https://m.media-amazon.com/images/I/41rZZ7K7r-L._SY300_SX300_.jpg",
  "mrp": 4490,
  "expectedPriceRange": {
    "min": 1000,
    "max": 1500
  },
  "knownAuthorizedSellers": [
    "Appario Retail Private Ltd",
    "boAt Lifestyle Official",
    "Amazon Retail"
  ]
}
```

### Rationale for Parameter Choices:
1. **Target Product:** boAt Airdopes 141 is the canonical Indian D2C benchmark identified during research (`docs/RESEARCH.md` and `docs/DECISION.md`).
2. **Statutory MRP vs. Street Band:**
   - Statutory MRP: ₹4,490
   - Calibrated Expected Street Price Band: ₹1,000 – ₹1,500 (verifies that legitimate ~70% promotional discounts on authorized retailers do not trigger false alarms).
3. **Authorized Seller Matching:**
   - Validates that authorized distributors (`Appario Retail Private Ltd`) are recognized and exempted from seller anomaly penalties.

---

## 3. Evaluation Criteria for Live Findings

The live run output will be evaluated against these strict integrity rules:
1. **Honest Inconclusive Visual Signals:**
   - If Google Lens returns no exact co-occurrences for the listing photo, the UI and API must report status `no_evidence` or `different_product` with medium confidence, and state explicitly:
     *"Visual check ran, found no conclusive matches across indexed sources."*
   - It must **NEVER** fabricate a visual match or claim counterfeit status based solely on an empty search result.
2. **Price Precedence Verification:**
   - Listings priced between ₹1,000 and ₹1,500 must receive `anomalyType: "within_expected_range"` (score: 0–10).
   - Listings priced under ₹800 must trigger `anomalyType: "severe_undercut"` (score: 70–90).
3. **Data Source Transparency:**
   - Payload attribute `dataSource` must verify as `"live"`.

---

## 4. Current State: Hold for Approval

```
========================================================================
[HOLD] NO LIVE SERPAPI CALLS WILL BE EXECUTED WITHOUT EXPLICIT PERMISSION.
Max expected credits for 1 controlled run: 11 credits.
To execute, submit explicit instruction in chat.
========================================================================
```
