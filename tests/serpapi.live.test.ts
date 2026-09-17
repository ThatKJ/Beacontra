import { describe, it, expect } from 'vitest';
import process from 'node:process';
import { SerpApiClient } from '../src/lib/serpapi-client';
import { SerpApiResponseSchema } from '../src/lib/types';
import { deduplicateListings } from '../src/lib/normalization';

describe('Live SerpApi Integration (Opt-in)', () => {
  const apiKey = (process.env.SERPAPI_API_KEY ?? process.env.SERPAPI_KEY ?? '').trim();
  const isKeyPresent = Boolean(apiKey && apiKey !== 'your_key_here' && apiKey !== '<my real key>');

  it.runIf(isKeyPresent)('should authenticate and execute one controlled live search', async () => {
    const client = new SerpApiClient({
      apiKey,
      fixtureMode: false,
      maxRetries: 1,
      defaultTimeout: 15000,
    });

    const response = await client.search({
      engine: 'google_shopping',
      q: 'boAt Airdopes',
      gl: 'in',
      hl: 'en',
    });

    // Verify response schema
    expect(response.search_metadata.status).toBe('Success');
    const parsed = SerpApiResponseSchema.safeParse(response);
    expect(parsed.success).toBe(true);

    // Verify organic shopping results
    const results = response.shopping_results ?? [];
    expect(results.length).toBeGreaterThan(0);

    // Verify normalization
    const listings = results
      .filter(r => r.title && r.extracted_price)
      .map(r => ({
        title: r.title,
        source: r.source ?? 'Unknown',
        extractedPrice: r.extracted_price ?? 0,
      }));
    const deduplicated = deduplicateListings(listings);
    expect(deduplicated.length).toBeGreaterThan(0);
  });

  if (!isKeyPresent) {
    it('reports pending key status without failing', () => {
      // Intentionally passing informative test when live key is pending
      expect(isKeyPresent).toBe(false);
    });
  }
});
