import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { SerpApiClient, SerpApiError } from './lib/serpapi-client';
import { createTieredCache } from './lib/cache';
import type { BaseSearchParams, SerpApiEngine, SerpApiResponse } from './lib/types';

interface Env {
  SERPAPI_KEY: string;
  CACHE_KV: KVNamespace;
  ENVIRONMENT: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.post('/api/search', async (c) => {
  const env = c.env;
  const client = new SerpApiClient({
    apiKey: env.SERPAPI_KEY,
    cache: createTieredCache(env.CACHE_KV),
    fixtureMode: env.ENVIRONMENT === 'development' && !env.SERPAPI_KEY,
  });

  try {
    const body = await c.req.json();
    const { engine, ...params } = body as BaseSearchParams & { engine: SerpApiEngine };

    if (!engine) {
      return c.json({ error: 'engine parameter is required' }, 400);
    }

    const searchParams: BaseSearchParams = { engine, ...params };
    const result = await client.search<SerpApiResponse>(searchParams);

    return c.json({
      data: result,
      meta: {
        engine,
        creditsUsed: client.estimateCredits(searchParams).estimatedCredits,
        cached: result.search_metadata?.status === 'Success',
      },
    });
  } catch (error) {
    if (error instanceof SerpApiError) {
      const statusCode = error.statusCode >= 400 && error.statusCode < 600 ? error.statusCode : 502;
      return c.json(
        {
          error: error.message,
          engine: error.engine,
          isRateLimited: error.isRateLimited,
          statusCode: error.statusCode,
        },
        statusCode as 400 | 401 | 403 | 404 | 429 | 500 | 502 | 503
      );
    }
    console.error('Search error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.get('/api/engines', (c) => {
  const engines: SerpApiEngine[] = [
    'google',
    'google_light',
    'google_maps',
    'google_maps_reviews',
    'google_shopping',
    'google_shopping_light',
    'google_jobs',
    'google_trends',
    'google_trends_trending_now',
    'google_news',
    'google_images',
    'google_local',
    'search_index',
  ];
  return c.json({ engines });
});

app.get('/api/usage', (c) => {
  return c.json({ message: 'Credit tracking available via client.getCreditUsage()' });
});

export default app;