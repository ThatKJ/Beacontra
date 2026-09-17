# Gemini Independent Audit: Lens API Spike (T-017)

**Status:** RESOLVED (Verified in commit daa64a3)
**Date:** 2026-09-17
**Target Files Inspected:** `scripts/lens-spike.ts`, `src/lib/serpapi-client.ts`

## 1. Request Path Verification

I have forensically inspected OpenCode's implementation of the Lens spike (`scripts/lens-spike.ts` and `src/lib/serpapi-client.ts`). 

### Did OpenCode test the correct `type` modes?
**NO.**
The actual parameters used in `scripts/lens-spike.ts` (lines 33-38) were:
```typescript
  const params = {
    engine: 'google_lens' as const,
    url: testImageUrl,
    gl: 'in',
    hl: 'en',
  };
```
There is **NO `type` parameter** in this request. By omitting `type`, the API defaults to the general AI overview page (equivalent to `type=all` or the default view), which explains why the response only contained `ai_overview` and lacked structured `lens_results`.

OpenCode **did not** call:
- `type=visual_matches`
- `type=exact_matches`
- `type=products`

### Did OpenCode use the Image API + `image_id` flow?
**NO.**
The spike used a public URL (`https://m.media-amazon.com/images/I/61XQ3pZVzSL._SX679_.jpg`) passed directly into the `url` parameter. The direct image-upload flow via the SerpApi Image API to obtain an `image_id` was completely absent from the code.

### Was the tested image actually accessible by Google Lens?
**NO.**
I independently verified the URL used in the spike (`https://m.media-amazon.com/images/I/61XQ3pZVzSL._SX679_.jpg`) via a `curl -I` request. It currently returns an **HTTP 404 Not Found** error from Amazon's media CDN. If the image is dead to a standard curl request, it is dead to Google Lens. Even if the parameters were correct, Lens could not have processed this image.

## 2. Conclusion

The user's hypothesis is 100% correct. OpenCode's conclusion in T-017 ("Google Lens returns ai_overview only") is invalid because the spike failed to use the dedicated API parameters (`type=visual_matches`, etc.) exposed by SerpApi for structured data retrieval.

**OpenCode must re-run the spike using the explicitly documented modes and the new `image_id` upload flow.**
