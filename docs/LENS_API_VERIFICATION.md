# Google Lens API Verification — Official SerpApi Documentation

**Source**: Official SerpApi documentation (serpapi.com, v13.serpapi.com, serpapi.cloudsway.net, GitHub repos)
**Date**: 2026-09-17
**Status**: Verified against official docs

---

## Engine

**Engine**: `google_lens`

---

## Required Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `engine` | **Yes** | Set to `google_lens` |
| `url` | **Yes** (unless using `image_id`) | URL of an image to search. Publicly accessible. |
| `image_id` | **Yes** (if not using `url`) | Image ID from Image API upload. When provided, `url` can be omitted. |

---

## Supported `type` Values (Search Type)

**Required**: Yes (default: `all`)

| Value | Description |
|-------|-------------|
| `all` | All results (default) |
| `about_this_image` | About This Image tab |
| `products` | Products tab — commercial listings with price, rating, in_stock |
| `exact_matches` | Exact Matches tab — visually identical/similar images |
| `visual_matches` | Visual Matches tab — visually similar images |
| `about_this_image` | About This Image tab |

---

## Optional Parameters

| Parameter | Required | Applicable Types | Description |
|-----------|----------|------------------|-------------|
| `hl` | No | All | Language code (e.g., `en`, `es`, `fr`) |
| `country` | No | All | Country code (e.g., `us`, `in`, `fr`) |
| `q` | No | `all`, `visual_matches`, `products` | Search query to refine results |
| `safe` | No | All | `active` or `off` (default: Google blurs explicit) |
| `auto_crop` | No | All except `about_this_image` | `true` or `false` (default: `false`) |
| `no_cache` | No | All | Force fresh results (cache expires 1h) |

---

## Image Upload Flow (Image API)

### Step 1: Upload Image
```
POST https://serpapi.com/image
Content-Type: multipart/form-data
Fields:
  image: @/path/to/image.png (max 500 KB, JPG/JPEG/PNG/WebP)
  api_key: YOUR_API_KEY
```

**Response**:
```json
{
  "message": "Image uploaded successfully.",
  "image_id": "xokJFnic22FmYZ6SbJZmYmCaamhsbpZsmZxsmZpsbgEAYzoHYg"
}
```

**Constraints**:
- Max file size: 500 KB
- Formats: JPG/JPEG, PNG, WebP
- `image_id` expires after 10 minutes

### Step 2: Search with `image_id`
```json
{
  "engine": "google_lens",
  "image_id": "xokJFnic22FmYZ6SbJZmYmCaamhsbpZsmZxsmZpsbgEAYzoHYg",
  "type": "visual_matches"
}
```

---

## Expected Response Sections

### Top-Level Fields (all types)
```json
{
  "search_metadata": { ... },
  "search_parameters": { "engine": "google_lens", "type": "visual_matches", ... },
  "ai_overview": { "page_token": "...", "serpapi_link": "..." },
  "knowledge_graph": { "title": "...", "description": "...", "image_url": "..." },
  "visual_matches": [ ... ],
  "exact_matches": [ ... ],
  "products": [ ... ],
  "text_results": [ ... ],
  "related_content": [ ... ],
  "suggested_searches": [ ... ]
}
```

### `visual_matches` Array Items
```json
{
  "position": 1,
  "title": "String",
  "link": "URL",
  "source": "String",
  "thumbnail": "URL",
  "image": "URL",
  "rating": 4.7,
  "reviews": 20714,
  "price": { "value": "₹361*", "extracted_value": 361.0, "currency": "₹" },
  "in_stock": true,
  "source_icon": "URL",
  "thumbnail_width": 225,
  "thumbnail_height": 225,
  "image_width": 445,
  "image_height": 1000
}
```

### `exact_matches` Array Items
```json
{
  "position": 1,
  "title": "String",
  "link": "URL",
  "source": "String",
  "thumbnail": "URL",
  "source_icon": "URL",
  "actual_image_width": 220,
  "actual_image_height": 262
}
```

### `products` Array Items
```json
{
  "position": 1,
  "title": "String",
  "link": "URL",
  "source": "String",
  "source_icon": "URL",
  "price": { "value": "₹361*", "extracted_value": 361.0, "currency": "₹" },
  "in_stock": true,
  "rating": 4.7,
  "reviews": 20714,
  "thumbnail": "URL",
  "image": "URL",
  "thumbnail_width": 225,
  "thumbnail_height": 225,
  "image_width": 445,
  "image_height": 1000
}
```

### `ai_overview` (present when type=all or when Google generates)
```json
{
  "page_token": "...",
  "serpapi_link": "https://serpapi.com/search.json?engine=google_ai_overview&page_token=..."
}
```

---

## Known Limitations / Gotchas

1. **`type` parameter is REQUIRED** for structured results. Default `all` returns `ai_overview` + mixed results but may not include structured `visual_matches`/`exact_matches` arrays at top level.

2. **Image URL must be publicly accessible** — no auth, no redirects that break Google's fetcher.

3. **`image_id` expires after 10 minutes** — must use immediately after upload.

4. **Max upload size**: 500 KB (JPG/JPEG/PNG/WebP).

4. **Default `type` is `all`** — returns `ai_overview` + mixed, NOT structured `visual_matches`/`exact_matches` at top level unless `type` is explicitly set.

5. **Response shape varies by `type`** — only requested tab's data is returned as top-level array.

6. **Image upload**: `image_id` expires in 10 min, max 500 KB, JPG/PNG/WebP.

---

## Previous Spike Mismatches (T-017)

| Our Spike | Official Docs | Status |
|-----------|---------------|--------|
| Parameter `image_url` | Parameter is `url` | ❌ Wrong param name |
| No `type` sent (default `all`) | `type` REQUIRED for structured tabs | ❌ Missing required param |
| Looked for `lens_results` | Top-level `visual_matches`, `exact_matches`, `products` | ❌ Wrong response path |
| Used public URL only | Image upload flow (`image_id`) supported | ⚠️ Not tested |
| No `type` parameter | `type` REQUIRED for structured tabs | ❌ Missing required param |

---

## Verified Example Requests

### Visual Matches (URL)
```
GET https://serpapi.com/search?engine=google_lens&url=https://example.com/image.jpg&type=visual_matches&hl=en&country=us
```

### Exact Matches (URL)
```
GET https://serpapi.com/search?engine=google_lens&url=https://example.com/image.jpg&type=exact_matches&hl=en&country=us
```

### Products (URL)
```
GET https://serpapi.com/search?engine=google_lens&url=https://example.com/image.jpg&type=products&hl=en&country=us&q=product+query
```

### Visual Matches (Image Upload)
```
# Step 1: POST to /image → get image_id
# Step 2: 
GET https://serpapi.com/search?engine=google_lens&image_id=xyz123&type=visual_matches
```

---

## Test Matrix Plan

| Test | Engine | Type | Image Method | Expected Top-Level Array |
|------|--------|------|--------------|-------------------------|
| A | google_lens | visual_matches | image_id (upload) | visual_matches[] |
| B | google_lens | exact_matches | image_id (upload) | exact_matches[] |
| C | google_lens | products | image_id (upload) | products[] |
| D | google_lens | all | image_id (upload) | ai_overview + mixed |
| E | google_lens | visual_matches | url (public) | visual_matches[] |
| F | google_lens | exact_matches | url (public) | exact_matches[] |
| G | google_lens | products | url (public) | products[] |