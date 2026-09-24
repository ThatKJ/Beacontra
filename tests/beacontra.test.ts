import { describe, it, expect, beforeEach } from 'vitest';
import { createSerpApiClient, SerpApiClient } from '../src/lib/serpapi-client';
import { createBeacontraService, type BeacontraInput } from '../src/lib/beacontra';
import { MemoryCache } from '../src/lib/cache';

describe('BeacontraService', () => {
  let client: SerpApiClient;
  let beacontra: ReturnType<typeof createBeacontraService>;
  let mockCache: MemoryCache;

  beforeEach(() => {
    mockCache = new MemoryCache();
    client = new SerpApiClient({
      apiKey: 'test-key',
      cache: mockCache,
      fixtureMode: true,
    });
    beacontra = createBeacontraService(client);
  });

  afterEach(() => {
    mockCache.clear();
  });

  const validInput: BeacontraInput = {
    productName: 'iPhone 15 128GB',
    officialImageUrl: 'https://example.com/official-iphone.jpg',
    mrp: 85000,
    expectedPriceRange: { min: 70000, max: 80000 },
    knownAuthorizedSellers: ['Flipkart', 'Amazon', 'Reliance Digital', 'Croma'],
  };

  it('should scan and return ranked results', async () => {
    const result = await beacontra.scan(validInput);

    expect(result.scanId).toBeDefined();
    expect(result.productName).toBe('iPhone 15 128GB');
    expect(result.officialImageUrl).toBe('https://example.com/official-iphone.jpg');
    expect(result.totalListingsFound).toBeGreaterThan(0);
    expect(result.results).toBeDefined();
    expect(Array.isArray(result.results)).toBe(true);
    expect(result.createdAt).toBeDefined();
    expect(result.creditsUsed).toBeGreaterThanOrEqual(0);
  });

  it('should return results sorted by composite score descending', async () => {
    const result = await beacontra.scan(validInput);
    const results = (result.results ?? []) as Array<{ compositeScore: number }>;

    for (let i = 0; i < results.length - 1; i++) {
      const current = results[i]!;
      const next = results[i + 1]!;
      expect(current.compositeScore).toBeGreaterThanOrEqual(next.compositeScore);
    }
  });

  it('should include all required fields in each result', async () => {
    const result = await beacontra.scan(validInput);

    for (const r of result.results) {
      expect(r.listing).toBeDefined();
      expect(r.lensEvidence).toBeDefined();
      expect(r.priceSignal).toBeDefined();
      expect(r.sellerSignal).toBeDefined();
      expect(r.visualSignal).toBeDefined();
      expect(typeof r.compositeScore).toBe('number');
      expect(['high', 'medium', 'low']).toContain(r.confidence);
      expect(['review_urgently', 'review', 'monitor', 'likely_genuine']).toContain(r.recommendation);
      expect(typeof r.evidenceSummary).toBe('string');
    }
  });

  it('should detect price anomaly for below-MRP listings', async () => {
    // Override MRP to force a large_deviation anomaly (e.g. price 72999 < 120000 * 0.7)
    const testInput = { ...validInput, mrp: 120000 };
    const result = await beacontra.scan(testInput);
    const results = result.results ?? [];

    const hasPriceAnomaly = results.some(r => r.priceSignal.isAnomalous);
    expect(hasPriceAnomaly).toBe(true);
  });

  it('should handle authorized sellers correctly', async () => {
    const result = await beacontra.scan(validInput);
    const results = result.results ?? [];

    const authorizedResult = results.find(r =>
      validInput.knownAuthorizedSellers?.some(auth =>
        r.listing.seller.toLowerCase().includes(auth.toLowerCase())
      )
    );

    if (authorizedResult) {
      expect(authorizedResult.sellerSignal.isAnomalous).toBe(false);
      expect(authorizedResult.sellerSignal.anomalyType).toBe('authorized');
    }
  });

  it('should detect visual match when exact match exists', async () => {
    // Test analyzeVisual directly with mock evidence that has exact match
    const testClient = new SerpApiClient({
      apiKey: 'test-key',
      cache: mockCache,
      fixtureMode: true,
    });
    const testBeacontra = createBeacontraService(testClient);
    
    // Test the analyzeVisual logic directly with mock evidence that has exact match
    const mockEvidence = {
      hasExactMatch: true,
      hasVisualMatch: false,
      hasLensData: true,
      exactMatchSources: ['brandwebsite.com'],
      visualMatchSources: [],
      matchConfidence: 'high' as const,
      details: {},
    };
    
    // Access private method via bracket notation for testing
    const visualSignal = (testBeacontra as any).analyzeVisual(mockEvidence);
    
    expect(visualSignal.isAnomalous).toBe(false);
    expect(visualSignal.anomalyType).toBe('matched');
    expect(visualSignal.status).toBe('matched');
    expect(visualSignal.confidence).toBe('high');
  });

  it('should distinguish a failed Lens request from a successful-but-empty one', async () => {
    const testClient = new SerpApiClient({
      apiKey: 'test-key',
      cache: mockCache,
      fixtureMode: true,
    });
    const testBeacontra = createBeacontraService(testClient);

    const failedRequest = {
      hasExactMatch: false,
      hasVisualMatch: false,
      hasLensData: false,
      callFailed: true,
      exactMatchSources: [],
      visualMatchSources: [],
      matchConfidence: 'none' as const,
      details: {},
    };
    const emptyButSuccessful = { ...failedRequest, callFailed: false };

    const failedSignal = (testBeacontra as any).analyzeVisual(failedRequest);
    const emptySignal = (testBeacontra as any).analyzeVisual(emptyButSuccessful);

    // Both are neutral (neither is treated as evidence of a problem)...
    expect(failedSignal.isAnomalous).toBe(false);
    expect(emptySignal.isAnomalous).toBe(false);

    // ...but they must not collapse into the same observation. "The check never ran" and
    // "the check ran and found nothing" are different facts and must stay visibly different.
    expect(failedSignal.anomalyType).toBe('unavailable');
    expect(failedSignal.status).toBe('unavailable');
    expect(emptySignal.anomalyType).toBe('no_evidence');
    expect(emptySignal.status).toBe('no_evidence');
    expect(failedSignal.details).not.toBe(emptySignal.details);
  });

  it('should assign recommendation based on composite score', async () => {
    const result = await beacontra.scan(validInput);

    for (const r of result.results) {
      if (r.compositeScore >= 70) {
        expect(r.recommendation).toBe('review_urgently');
      } else if (r.compositeScore >= 50) {
        expect(r.recommendation).toBe('review');
      } else if (r.compositeScore >= 30) {
        expect(r.recommendation).toBe('monitor');
      } else {
        expect(r.recommendation).toBe('likely_genuine');
      }
    }
  });

  it('should report dataSource "cache" when every request in a scan was served from cache', async () => {
    // Non-fixture client: exercises the real live/cache branch, not the fixture short-circuit.
    const liveClient = new SerpApiClient({
      apiKey: 'test-key',
      cache: mockCache,
      fixtureMode: false,
    });
    const liveBeacontra = createBeacontraService(liveClient);

    const originalFetch = global.fetch;
    global.fetch = (async () => ({
      ok: true,
      status: 200,
      json: async () => ({ shopping_results: [] }),
    })) as unknown as typeof fetch;

    try {
      const input: BeacontraInput = {
        productName: 'Cache Test Product',
        officialImageUrl: 'https://example.com/ref.jpg',
      };

      liveClient.resetCreditUsage();
      const first = await liveBeacontra.scan(input);
      expect(first.dataSource).toBe('live');
      expect(liveClient.getCreditUsage()).toBeGreaterThan(0);

      // Same input -> same cache key -> the second scan's shopping search is a cache hit,
      // and (with no candidates) no Lens calls happen at all, so zero credits are spent.
      liveClient.resetCreditUsage();
      const second = await liveBeacontra.scan(input);
      expect(second.dataSource).toBe('cache');
      expect(liveClient.getCreditUsage()).toBe(0);
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('should track credit usage', async () => {
    client.resetCreditUsage();
    await beacontra.scan(validInput);
    expect(client.getCreditUsage()).toBeGreaterThan(0);
  });

  it('should handle missing MRP gracefully', async () => {
    const inputWithoutMrp: BeacontraInput = {
      productName: 'Test Product',
      officialImageUrl: 'https://example.com/official.jpg',
    };

    const result = await beacontra.scan(inputWithoutMrp);
    expect(result.results.length).toBeGreaterThan(0);
  });

  it('should mark authorized sellers as non-anomalous', async () => {
    const result = await beacontra.scan(validInput);

    const authorizedResult = result.results.find(r => 
      validInput.knownAuthorizedSellers?.some(auth => 
        r.listing.seller.toLowerCase().includes(auth.toLowerCase())
      )
    );
    
    if (authorizedResult) {
      expect(authorizedResult.sellerSignal.isAnomalous).toBe(false);
      expect(authorizedResult.sellerSignal.anomalyType).toBe('authorized');
    }
  });
});