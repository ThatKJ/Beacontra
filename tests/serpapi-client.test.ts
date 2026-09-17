import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SerpApiClient, SerpApiError } from '../src/lib/serpapi-client';
import { MemoryCache, createTieredCache } from '../src/lib/cache';
import type { BaseSearchParams, SerpApiEngine } from '../src/lib/types';

describe('SerpApiClient', () => {
  let client: SerpApiClient;
  let mockCache: MemoryCache;

  beforeEach(() => {
    mockCache = new MemoryCache();
    client = new SerpApiClient({
      apiKey: 'test-key',
      cache: mockCache,
      fixtureMode: true,
    });
  });

  afterEach(() => {
    mockCache.clear();
  });

  describe('estimateCredits', () => {
    it('should return 1 credit for standard engines', () => {
      const params: BaseSearchParams = { engine: 'google', q: 'test' };
      const estimate = client.estimateCredits(params);
      expect(estimate.estimatedCredits).toBe(1);
      expect(estimate.isAdvanced).toBe(false);
    });

    it('should return 3 credits for advanced engines', () => {
      const engines: SerpApiEngine[] = ['google_maps', 'google_shopping', 'google_jobs', 'google_trends'];
      engines.forEach(engine => {
        const params: BaseSearchParams = { engine, q: 'test' };
        const estimate = client.estimateCredits(params);
        expect(estimate.estimatedCredits).toBe(3);
        expect(estimate.isAdvanced).toBe(true);
      });
    });
  });

  describe('search with fixtures', () => {
it('should return google search fixture', async () => {
      const params: BaseSearchParams = { engine: 'google', q: 'coffee shops bangalore', location: 'Bangalore', gl: 'in', hl: 'en' };
      const result = await client.search(params);

      expect(result.search_metadata.status).toBe('Success');
      expect(result.organic_results).toBeDefined();
      expect(result.organic_results?.length).toBeGreaterThan(0);
      expect(result.local_results).toBeDefined();
      expect((result.local_results as { places?: Array<{ title: string }> })?.places?.length).toBeGreaterThan(0);
    });

    it('should return google_maps fixture', async () => {
      const params: BaseSearchParams = { engine: 'google_maps', q: 'coffee shops in Koramangala' };
      const result = await client.search(params);

      expect(result.search_metadata.status).toBe('Success');
      expect(result.local_results).toBeDefined();
      expect(result.local_results?.length).toBeGreaterThan(0);
    });

    it('should return google_shopping fixture', async () => {
      const params: BaseSearchParams = { engine: 'google_shopping', q: 'iPhone 15 128GB' };
      const result = await client.search(params);

      expect(result.search_metadata.status).toBe('Success');
      expect(result.shopping_results).toBeDefined();
      expect(result.shopping_results?.length).toBeGreaterThan(0);
    });

    it('should return google_jobs fixture', async () => {
      const params: BaseSearchParams = { engine: 'google_jobs', q: 'backend engineer', location: 'Bangalore' };
      const result = await client.search(params);

      expect(result.search_metadata.status).toBe('Success');
      expect(result.jobs_results).toBeDefined();
      expect(result.jobs_results?.length).toBeGreaterThan(0);
    });

    it('should return google_trends fixture', async () => {
      const params: BaseSearchParams = { engine: 'google_trends', q: 'coffee' };
      const result = await client.search(params);

      expect(result.search_metadata.status).toBe('Success');
      expect(result.interest_over_time?.timeline_data).toBeDefined();
      expect(result.interest_over_time?.timeline_data.length).toBeGreaterThan(0);
    });
  });

  describe('caching', () => {
    it('should cache successful responses', async () => {
      const params: BaseSearchParams = { engine: 'google', q: 'test query', location: 'Bangalore', gl: 'in', hl: 'en' };
      
      await client.search(params);
      await client.search(params);

      expect(mockCache.size()).toBe(1);
    });

    it('should not cache when no_cache is true', async () => {
      const params: BaseSearchParams = { engine: 'google', q: 'test query', location: 'Bangalore', gl: 'in', hl: 'en', no_cache: true };
      
      await client.search(params);
      
      expect(mockCache.size()).toBe(0);
    });

    it('should return cached response on second call', async () => {
      const params: BaseSearchParams = { engine: 'google', q: 'cached query', location: 'Bangalore', gl: 'in', hl: 'en' };
      
      const result1 = await client.search(params);
      const result2 = await client.search(params);

      expect(result1).toEqual(result2);
    });
  });

  describe('credit tracking', () => {
    it('should track credit usage', async () => {
      client.resetCreditUsage();
      
      await client.search({ engine: 'google', q: 'test1' });
      await client.search({ engine: 'google_maps', q: 'test2' });
      
      expect(client.getCreditUsage()).toBe(4);
    });

    it('should reset credit usage', async () => {
      client.resetCreditUsage();
      await client.search({ engine: 'google', q: 'test' });
      client.resetCreditUsage();
      expect(client.getCreditUsage()).toBe(0);
    });
  });

  describe('request deduplication', () => {
    it('should deduplicate simultaneous identical requests', async () => {
      const params: BaseSearchParams = { engine: 'google', q: 'dedup test' };
      
      const [result1, result2] = await Promise.all([
        client.search(params),
        client.search(params),
      ]);

      expect(result1).toEqual(result2);
    });
  });

  describe('error handling', () => {
    it('should return empty fixture for unknown engine in fixture mode', async () => {
      const params: BaseSearchParams = { engine: 'nonexistent_engine' as SerpApiEngine, q: 'test' };
      
      const result = await client.search(params);
      
      expect(result.search_metadata.status).toBe('Success');
      expect(result.search_information?.total_results).toBe(0);
    });
  });
});

describe('SerpApiError', () => {
  it('should create error with correct properties', () => {
    const error = new SerpApiError('Rate limited', 'google_maps', true, 429);
    
    expect(error.message).toBe('Rate limited');
    expect(error.engine).toBe('google_maps');
    expect(error.isRateLimited).toBe(true);
    expect(error.statusCode).toBe(429);
    expect(error.timestamp).toBeInstanceOf(Date);
  });
});