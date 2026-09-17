import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { SerpApiClient, SerpApiError } from './lib/serpapi-client';
import { createTieredCache } from './lib/cache';
import { createBeacontraService, type BeacontraInput } from './lib/beacontra';
import { getSerpApiKey, isSerpApiConfigured, getSerpApiHealthStatus } from './lib/config';
import type { BaseSearchParams, SerpApiEngine, SerpApiResponse } from './lib/types';


interface Env {
  SERPAPI_API_KEY?: string;
  SERPAPI_KEY?: string;
  CACHE_KV: KVNamespace;
  ENVIRONMENT: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

app.get('/health', (c) => {
  const health = getSerpApiHealthStatus(c.env as unknown as Record<string, unknown>);
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    serpApi: {
      configured: health.configured,
    },
  });
});

// Serve index.html for root and SPA routes
app.get('/', async (c) => {
  const html = await fetch(new URL('./public/index.html', import.meta.url)).then(r => r.text());
  return c.html(html);
});

function createClient(env: Env) {
  const configured = isSerpApiConfigured(env as unknown as Record<string, unknown>);
  let apiKey = '';
  if (configured) {
    try {
      apiKey = getSerpApiKey(env as unknown as Record<string, unknown>);
    } catch {
      apiKey = '';
    }
  }

  return new SerpApiClient({
    apiKey,
    cache: createTieredCache(env.CACHE_KV),
    fixtureMode: !configured || (env.ENVIRONMENT === 'development' && !configured),
  });
}


app.post('/api/search', async (c) => {
  const env = c.env;
  const client = createClient(env);

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
    const errMsg = error instanceof Error ? error.message : 'Internal error';
    console.error('Search error:', errMsg);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.post('/api/beacontra/scan', async (c) => {
  const env = c.env;
  const client = createClient(env);
  const beacontra = createBeacontraService(client);

  try {
    const input = await c.req.json<BeacontraInput>();

    if (!input.productName || !input.officialImageUrl) {
      return c.json({ error: 'productName and officialImageUrl are required' }, 400);
    }

    const result = await beacontra.scan(input);

    return c.json({
      data: result,
      meta: {
        scanId: result.scanId,
        dataSource: result.dataSource,
        creditsUsed: result.creditsUsed,
        totalListingsFound: result.totalListingsFound,
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
    const errMsg = error instanceof Error ? error.message : 'Internal error';
    console.error('Beacontra scan error:', errMsg);
    return c.json({ error: 'Internal server error' }, 500);
  }
});


app.get('/api/beacontra/results/:scanId', async (c) => {
  const scanId = c.req.param('scanId');
  return c.json({ error: 'Scan results retrieval not yet implemented - use scan endpoint', scanId }, 501);
});

app.get('/api/engines', (c) => {
  const engines = [
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
    'google_lens',
    'amazon_product',
    'search_index',
  ];
  return c.json({ engines });
});

app.get('/api/usage', (c) => {
  return c.json({ message: 'Credit tracking available via client.getCreditUsage()' });
});

export default app;