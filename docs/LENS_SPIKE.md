# Google Lens Real-World Spike (T-017)

## Objective

Verify with LIVE SerpApi Google Lens behavior whether our product's visual evidence model actually works for realistic marketplace-image variations.

## Test Setup

- **API**: SerpApi `google_lens` engine
- **Key**: SERPAPI_API_KEY from .env (live)
- **Test Image**: boAt Airdopes 141 official product image from Amazon
- **Image URL**: `https://m.media-amazon.com/images/I/61XQ3pZVzSL._SX679_.jpg`
- **Parameters tested**: `url` with `gl=in`, `hl=en`

## Image Variants Tested

| Variant | Description | Tested |
|---------|-------------|--------|
| A. Original | Official product image from Amazon | ✅ |
| B. Cropped | Not yet tested | ⏳ |
| C. Watermarked | Not yet tested | ⏳ |
| D. Compressed | Not yet tested | ⏳ |
| E. Altered | Not yet tested | ⏳ |
| F. Different marketplace/angle | Not yet tested | ⏳ |

## Observed SerpApi Response Shape

### Current Response (google_lens engine)
```json
{
  "search_metadata": { ... },
  "search_parameters": { "engine": "google_lens", "url": "...", "hl": "en" },
  "ai_overview": {
    "page_token": "...",
    "serpapi_link": "https://serpapi.com/search.json?engine=google_ai_overview&page_token=..."
  }
}
```

**Key findings:**
- **No `lens_results` field** in response
- **No `exact_matches` field** in response
- **No `visual_matches` field** in response
- **No `knowledge_graph` field** in response
- Only `ai_overview` with `page_token` for AI Overview engine
- Raw HTML contains only the query image itself (2 `<img>` tags), no visual matches from other sources

### Raw HTML Inspection
- HTML length: ~226KB
- Contains text "visual match" / "exact match" (generic page text)
- Only 2 `<img>` tags found - both are the **query image itself** (the uploaded image)
- **No visual matches from other sources** (Flipkart, Amazon listings, etc.) in the HTML

### Comparison with Expected (Fixture) Response
Our fixture (`tests/fixtures/google_lens.json`) expects:
```json
{
  "lens_results": {
    "exact_matches": [...],
    "visual_matches": [...],
    "knowledge_graph": { ... }
  }
}
```

**This structure is NOT returned by the live API.**

## Results

### Original Image Test

| Field | Expected | Actual | Status |
|-------|----------|--------|--------|
| `lens_results` | Present | **Absent** | ❌ |
| `exact_matches` | Array of matches | **Absent** | ❌ |
| `visual_matches` | Array of matches | **Absent** | ❌ |
| `knowledge_graph` | Object | **Absent** | ❌ |
| `ai_overview` | Not in fixture | Present (page_token) | ⚠️ |

### Raw HTML Analysis
- Query image present (2 occurrences)
- **Zero visual matches from other sources** (Flipkart, Amazon, other marketplaces)
- No source URLs for matching products
- No price/rating data for matched products

## Findings

### What Lens Actually Proves (Current Reality)
1. **Upload works**: The API accepts the image URL and returns success
2. **AI Overview token**: Returns a page_token for Google AI Overview engine
3. **No visual matching data**: No exact_matches, visual_matches, or product matches returned
4. **Raw HTML insufficient**: Only contains the query image, not matched results

### What Lens Does NOT Prove (Current Reality)
- Cannot verify if a listing photo matches the official product
- Cannot detect stolen/reused images from other sources
- Cannot provide source URLs for matched products
- Cannot provide confidence scores for visual similarity

## Impact on Product Scoring

### Current Implementation Assumption (INVALID)
```typescript
// In brandlens.ts - analyzeVisual()
if (!evidence.hasVisualMatch) {
  return { isAnomalous: true, anomalyType: 'different_product', ... };
}
// This treats "no Lens data" as "mismatch confirmed"
```

### Reality
- **Absence of Lens data ≠ Evidence of mismatch**
- **Absence of Lens data = Absence of evidence**
- Current scoring treats missing data as positive mismatch signal (+25 to +40 points)
- This is a **critical overclaim** - we're scoring products as suspicious because Lens returned no data

## Recommended Visual-Signal Logic

### New VisualSignal States
```typescript
type VisualEvidenceStatus = 
  | 'matched'           // exact_match found
  | 'visual_match'      // visual_matches found
  | 'no_evidence'       // Lens returned data but no matches
  | 'unavailable'       // Lens failed / not available / returned ai_overview only
```

### Updated analyzeVisual()
```typescript
private analyzeVisual(evidence: LensEvidence): VisualSignal {
  // If Lens returned actual match data
  if (evidence.hasExactMatch) {
    return { isAnomalous: false, anomalyType: 'match', status: 'matched', ... };
  }
  if (evidence.hasVisualMatch) {
    return { isAnomalous: false, anomalyType: 'visual_match', status: 'visual_match', ... };
  }
  if (evidence.hasLensData) {
    // Lens worked but found nothing
    return { isAnomalous: false, anomalyType: 'no_evidence', status: 'no_evidence', ... };
  }
  // Lens unavailable / returned ai_overview only
  return { 
    isAnomalous: false, 
    anomalyType: 'unavailable', 
    status: 'unavailable',
    details: 'Visual verification unavailable (Lens returned AI overview only)'
  };
}
```

### Scoring Impact
| Visual Status | Score Contribution | Rationale |
|---------------|-------------------|-----------|
| `matched` | -20 (reduces risk) | Strong evidence of genuine |
| `visual_match` | -10 (reduces risk) | Some visual similarity |
| `no_evidence` | +0 (neutral) | Lens worked, found nothing conclusive |
| `unavailable` | +0 (neutral) | Cannot verify visually |

**Never add positive risk score from absent Lens data**

## Demo Recommendation

1. **Show honest state**: Display "Visual verification unavailable" badge when Lens returns no match data
2. **Don't fake confidence**: Don't show confidence percentages that don't exist
3. **Explain limitation**: Add tooltip explaining "Google Lens visual matching currently unavailable for this image"
4. **Show what we have**: Price + Seller signals still work and are valuable

## Verdict

**FAIL** - Google Lens (via SerpApi) does NOT currently return usable visual matching data for our use case.

### Specific Failures
- ❌ No `exact_matches` returned
- ❌ No `visual_matches` returned  
- ❌ No `knowledge_graph` returned
- ❌ Raw HTML contains only query image
- ❌ `ai_overview` returned instead of `lens_results`

### What Still Works
- ✅ Price anomaly detection (Google Shopping)
- ✅ Seller anomaly detection (source normalization)
- ✅ Product discovery (Google Shopping)

## Next Steps

1. **Document this limitation** in UI and documentation
2. **Fix T-026**: Remove overclaim on absent Lens data (neutral scoring)
3. **Update fixtures** to match reality (empty lens_results or unavailable status)
4. **Update UI** to show "Visual verification unavailable" instead of fake match data
5. **Monitor SerpApi** for when/if `lens_results` returns
5. **Consider alternative**: Manual reverse image search via Google Images API if available