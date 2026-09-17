import type {
  SerpApiEngine,
  BaseSearchParams,
  SerpApiResponse,
  SerpApiClientOptions,
  CacheAdapter,
  RequestDeduplicationEntry,
  CreditEstimate,
  CachedResponse,
} from './types';
import { createCacheKey, createTieredCache } from './cache';

const DEFAULT_BASE_URL = 'https://serpapi.com/search.json';
const DEFAULT_TIMEOUT = 30000;
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 1000;

const ADVANCED_ENGINES: Set<string> = new Set([
  'google_maps',
  'google_maps_reviews',
  'google_maps_directions',
  'google_shopping',
  'google_shopping_light',
  'google_shopping_filters',
  'google_jobs',
  'google_jobs_listing',
  'google_flights',
  'google_flights_deals',
  'google_hotels',
  'google_local_services',
  'google_ads',
  'google_scholar',
  'google_patents',
  'google_finance',
  'google_finance_markets',
  'google_play_product',
  'google_trends',
  'google_trends_trending_now',
]);



export class SerpApiClient {
  private apiKey: string;
  private baseUrl: string;
  private defaultTimeout: number;
  private maxRetries: number;
  private cache: CacheAdapter;
  private fixtureMode: boolean;

  private inFlightRequests = new Map<string, RequestDeduplicationEntry<unknown>>();
  private creditUsage = 0;

  constructor(options: SerpApiClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.defaultTimeout = options.defaultTimeout ?? DEFAULT_TIMEOUT;
    this.maxRetries = options.maxRetries ?? MAX_RETRIES;
    this.cache = options.cache ?? createTieredCache();
    this.fixtureMode = options.fixtureMode ?? false;
  }

  estimateCredits(params: BaseSearchParams): CreditEstimate {
    const engine = params.engine;
    const isAdvanced = ADVANCED_ENGINES.has(engine);
    const estimatedCredits = isAdvanced ? 3 : 1;
    return { estimatedCredits, engine, isAdvanced: isAdvanced as boolean };
  }

  getCreditUsage(): number {
    return this.creditUsage;
  }

  resetCreditUsage(): void {
    this.creditUsage = 0;
  }

  async search<T = unknown>(params: BaseSearchParams): Promise<SerpApiResponse<T>> {
    const cacheKey = createCacheKey(params.engine, params);

    if (!params.no_cache) {
      const cached = await this.cache.get<SerpApiResponse<T>>(cacheKey);
      if (cached) {
        return cached.data;
      }
    }

    const deduplicationKey = `${params.engine}:${JSON.stringify(params)}`;
    const existing = this.inFlightRequests.get(deduplicationKey);
    if (existing) {
      const age = Date.now() - existing.timestamp;
      if (age < this.defaultTimeout) {
        return existing.promise as Promise<SerpApiResponse<T>>;
      }
    }

    const promise = this.executeWithRetry<T>(params, cacheKey);
    this.inFlightRequests.set(deduplicationKey, { promise, timestamp: Date.now() });

    try {
      const result = await promise;
      return result;
    } finally {
      this.inFlightRequests.delete(deduplicationKey);
    }
  }

  private async executeWithRetry<T>(
    params: BaseSearchParams,
    cacheKey: string
  ): Promise<SerpApiResponse<T>> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await this.executeRequest<T>(params);

        if (result.error) {
          throw new SerpApiError(result.error, params.engine);
        }

        const credits = this.estimateCredits(params);
        this.creditUsage += credits.estimatedCredits;

        if (!params.no_cache) {
          const cachedResponse: CachedResponse<SerpApiResponse<T>> = {
            data: result,
            timestamp: Date.now(),
            ttl: 60 * 60 * 1000,
            engine: params.engine,
            paramsHash: cacheKey,
          };
          await this.cache.set(cacheKey, cachedResponse);
        }

        return result;
      } catch (error) {
        lastError = error as Error;

        if (error instanceof SerpApiError) {
          if (error.isRateLimited && attempt < this.maxRetries) {
            const delay = RETRY_BASE_DELAY * Math.pow(2, attempt) + Math.random() * 1000;
            await this.sleep(delay);
            continue;
          }
          if (error.statusCode === 401 || error.statusCode === 400) {
            throw error;
          }
        }

        if (attempt < this.maxRetries) {
          const delay = RETRY_BASE_DELAY * Math.pow(2, attempt);
          await this.sleep(delay);
        }
      }
    }

    throw lastError ?? new Error('Max retries exceeded');
  }

  private async executeRequest<T>(params: BaseSearchParams): Promise<SerpApiResponse<T>> {
    if (this.fixtureMode) {
      return this.loadFixture<T>(params.engine);
    }

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    searchParams.set('api_key', this.apiKey);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.defaultTimeout);

    try {
      const response = await fetch(`${this.baseUrl}?${searchParams.toString()}`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'serpapi-hackathon/0.1.0',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          throw new SerpApiError('Rate limit exceeded', params.engine, true, 429);
        }
        if (response.status === 401) {
          throw new SerpApiError('Invalid API key', params.engine, false, 401);
        }
        if (response.status === 400) {
          const errorData = await response.json().catch(() => ({ error: 'Bad request' })) as { error?: string };
          throw new SerpApiError(errorData.error ?? 'Bad request', params.engine, false, 400);
        }
        throw new SerpApiError(`HTTP ${response.status}`, params.engine, false, response.status);
      }

      const data = await response.json() as SerpApiResponse<T>;
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof SerpApiError) throw error;
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new SerpApiError('Request timeout', params.engine, false, 408);
      }
      throw new SerpApiError(`Network error: ${error}`, params.engine, false, 0);
    }
  }

  private async loadFixture<T>(engine: SerpApiEngine): Promise<SerpApiResponse<T>> {
    try {
      const module = await import(`../../tests/fixtures/${engine}.json`);
      return module.default as SerpApiResponse<T>;
    } catch {
      return this.getEmptyFixture<T>(engine);
    }
  }

  private getEmptyFixture<T>(engine: SerpApiEngine): SerpApiResponse<T> {
    return {
      search_metadata: {
        id: 'fixture',
        status: 'Success',
        json_endpoint: '',
        created_at: new Date().toISOString(),
        processed_at: new Date().toISOString(),
        total_time_taken: 0,
      },
      search_parameters: { engine },
      search_information: { total_results: 0 },
    } as SerpApiResponse<T>;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async clearCache(): Promise<void> {
    if (this.cache && 'clear' in this.cache) {
      (this.cache as { clear(): void }).clear();
    }
  }
}

export class SerpApiError extends Error {
  public readonly engine: string;
  public readonly isRateLimited: boolean;
  public readonly statusCode: number;
  public readonly timestamp: Date;

  constructor(
    message: string,
    engine: string,
    isRateLimited = false,
    statusCode = 0
  ) {
    super(message);
    this.name = 'SerpApiError';
    this.engine = engine;
    this.isRateLimited = isRateLimited;
    this.statusCode = statusCode;
    this.timestamp = new Date();
  }
}

export function createSerpApiClient(
  apiKey: string,
  kv?: KVNamespace,
  fixtureMode = false
): SerpApiClient {
  const cache = createTieredCache(kv);
  return new SerpApiClient({
    apiKey,
    cache,
    fixtureMode,
  });
}