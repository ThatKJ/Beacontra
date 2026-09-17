# Google Lens API — Official Contract Verification (T-017 reopened)

**Method:** Direct fetch of SerpApi's own current documentation (`serpapi.com/google-lens-api`, `serpapi.com/google-lens-upload-an-image`), 2026-09-17, cross-checked against a second independent fetch of the same page earlier in this session (consistent results both times) — then compared line-by-line against the actual implementation in `src/lib/types.ts` and `src/lib/brandlens.ts`. **Conclusion up front: T-017's "FAIL" verdict is not yet substantiated.** The spike as actually conducted has at least three concrete, independently verifiable bugs that would produce exactly the observed symptom (no structured matches) regardless of whether SerpApi's Lens API actually returns them. This needs to be re-run correctly before any conclusion about Lens's real capability is trusted.

---

## ENGINE

`google_lens` (confirmed, matches implementation).

## REQUIRED PARAMETERS

- `type` — documented as **required**, one of `all` / `about_this_image` / `products` / `exact_matches` / `visual_matches`. The docs also separately state "by default, the search type is `all`" — an internally ambiguous statement (required-but-defaulted), but the safe reading is: **always send `type` explicitly**, don't rely on undocumented fallback behavior.
- Image input — **exactly one of:**
  - `url` — "the URL of an image to perform the Google Lens search." **This is the documented parameter name.**
  - `image_id` — obtained from a separate upload call, used in place of `url`.

## SUPPORTED `type` VALUES

Quoted directly from the docs, no others listed: `all`, `about_this_image`, `products`, `exact_matches`, `visual_matches`.

## IMAGE URL FLOW

Pass a publicly-fetchable image URL as `url`. No separate step needed. **The parameter is named `url`, not `image_url`.**

## IMAGE UPLOAD FLOW (`image_id`)

1. `POST https://serpapi.com/image`, `multipart/form-data`, image file in a field named `image`, plus `api_key`. Max file size **500 KB**.
2. Response: `{ "message": "Image uploaded successfully.", "image_id": "<id>" }`.
3. Use that `image_id` in the `google_lens` search call in place of `url`.
4. Validity period of the `image_id` is not documented — treat as short-lived, use promptly after upload.

## EXPECTED RESPONSE SECTIONS

Per the docs' own example response, top-level keys observed: `ai_overview`, `visual_matches`, `related_content` (plus the standard `search_metadata`/`search_parameters`). **There is no `lens_results` wrapper object anywhere in the documentation.** Matches are top-level response fields, not nested under an intermediate object.

## CURRENT EXAMPLE RESPONSE SHAPE

Fields documented on visual/exact match entries: `position`, `title`, `link`, `source`, `source_icon`, `thumbnail` (with dimensions), `image` (with dimensions); `ai_overview` carries `page_token`/`serpapi_link` for a separate follow-up call to the `google_ai_overview` engine; `related_content` is an array of suggested follow-up queries.

## KNOWN LIMITATIONS (from docs, not observed behavior)

- 500 KB upload limit.
- `image_id` validity period undocumented.
- `about_this_image` doesn't support auto-crop.
- No documented limitation suggesting `visual_matches`/`exact_matches` are unavailable for ordinary product photos — nothing in the official docs suggests the feature is degraded or unreliable.

---

## Comparison against our implementation — three confirmed mismatches

### Mismatch 1: wrong parameter name for the image
`src/lib/types.ts` line 110 and `src/lib/brandlens.ts` line 199 send **`image_url`**. The documented parameter is **`url`**. `image_url` is not a documented SerpApi parameter for this engine. If SerpApi silently ignores unrecognized parameters (common API behavior), **the live spike may have sent no image reference at all** — which alone would fully explain a response with only `ai_overview` and no matches, independent of anything else.

### Mismatch 2: `type` never sent
Neither `LensSearchParams` (`types.ts` line 107-111) nor the actual call (`brandlens.ts` line 197-200) include a `type` parameter at all. Per the docs, this is a required parameter. `docs/LENS_SPIKE.md`'s own recorded request confirms only `url` (well — `image_url`, per mismatch 1), `gl`, `hl` were sent — no `type`.

### Mismatch 3: response parsed at the wrong path
`src/lib/types.ts` line 260 defines `SerpApiResponse.lens_results: LensSearchResult.optional()`, and `LensSearchResult` (lines 211-225) nests `exact_matches`/`visual_matches` inside it. `brandlens.ts` line 202 reads `lensResponse.lens_results`. **Per the official docs' own example response, `visual_matches` (and by the same pattern, `exact_matches`) are top-level fields on the response — there is no `lens_results` wrapper in SerpApi's actual API.** Even if SerpApi had returned `visual_matches` at the top level during the spike, this code would never have found it, because it was never looking there. `docs/LENS_SPIKE.md`'s finding "No `lens_results` field in response" is *guaranteed* to be true regardless of what SerpApi actually returned, because that field never existed in the real API to begin with — this specific finding has zero diagnostic value.

### What this does *not* prove
This does **not** prove Lens *does* return good structured matches for our use case — that's still an open, empirical question. It proves the spike as conducted could not have detected structured matches even if SerpApi had returned them, because of a wrong parameter name, a missing required parameter, and a wrong response path, compounding. `docs/LENS_SPIKE.md`'s raw-HTML finding (only the query image visible, no other marketplace images in the rendered page) is a real, independent signal for the specific `type`/parameter combination that was actually sent — but that combination is now known to be wrong on at least two counts, so it doesn't settle the question for the *documented, correct* request shape either.

---

## Required re-test (owned by OPENCODE, this is the P0 unblock)

Using **one** reference image, with the **correct** parameter name and an **explicit** `type` each time, reading the response at the **top-level** path (not `lens_results`):

| Test | Params | What top-level field to check |
|---|---|---|
| A | `engine=google_lens`, `url=<image>`, `type=visual_matches` | `response.visual_matches` |
| B | `engine=google_lens`, `url=<image>`, `type=exact_matches` | `response.exact_matches` |
| C | `engine=google_lens`, `url=<image>`, `type=products` | `response.products` (field name to confirm from actual response) |
| D (optional) | `engine=google_lens`, `url=<image>`, `type=all` | all of the above plus `ai_overview`/`related_content` |

If the `image_id` upload flow is used instead (recommended architecturally per the user's suggested flow — keeps the key server-side, avoids external-URL-accessibility failure modes), upload first via `POST /image`, then substitute `image_id=<id>` for `url=<image>` in each test above.

**Only after this matrix runs with the corrected request shape should T-017 return to DONE or FAIL** — the current `docs/LENS_SPIKE.md` verdict is not evidence either way about SerpApi's actual capability, only evidence that the specific request sent was malformed against the documented contract.
