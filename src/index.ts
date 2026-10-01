import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { SerpApiClient, SerpApiError } from './lib/serpapi-client';
import { getSharedCache } from './lib/cache';
import { createBeacontraService, type BeacontraInput, type BeacontraScanResult } from './lib/beacontra';
import { getSerpApiKey, isSerpApiConfigured, getSerpApiHealthStatus } from './lib/config';
import { isSafePublicUrl } from './lib/security';
import type { BaseSearchParams, SerpApiEngine, SerpApiResponse } from './lib/types';


interface Env {
  SERPAPI_API_KEY?: string;
  SERPAPI_KEY?: string;
  CACHE_KV: KVNamespace;
  ENVIRONMENT: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors({
  origin: (origin) => {
    if (!origin) return '*';
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) return origin;
    if (origin.startsWith('chrome-extension://')) return origin;
    return '*';
  },
  allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposeHeaders: ['Content-Length', 'X-Scan-Id'],
  maxAge: 86400,
}));

app.get('/health', (c) => {
  const env = c.env || ({} as Env);
  const health = getSerpApiHealthStatus(env as unknown as Record<string, unknown>);
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    serpApi: {
      configured: health.configured,
    },
  });
});

// The frontend is served by Workers Static Assets (wrangler.jsonc).

function createClient(env?: Env) {
  const safeEnv = env || ({} as Env);
  const configured = isSerpApiConfigured(safeEnv as unknown as Record<string, unknown>);
  let apiKey = '';
  if (configured) {
    try {
      apiKey = getSerpApiKey(safeEnv as unknown as Record<string, unknown>);
    } catch {
      apiKey = '';
    }
  }

  return new SerpApiClient({
    apiKey,
    cache: getSharedCache(safeEnv.CACHE_KV),
    fixtureMode: !configured || (safeEnv.ENVIRONMENT === 'development' && !configured),
  });
}


app.post('/api/search', async (c) => {
  const env = c.env || ({} as Env);
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
  const env = c.env || ({} as Env);
  const client = createClient(env);
  const beacontra = createBeacontraService(client);

  try {
    let input: BeacontraInput;
    const contentType = c.req.header('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await c.req.parseBody();
      const productName = formData['productName'] as string;
      const mrpStr = formData['mrp'] as string;
      let officialImageUrl = formData['officialImageUrl'] as string;
      const imageFile = formData['imageFile'] as File;
      
      if (!productName) return c.json({ error: 'productName is required' }, 400);

      const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
      const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

      // The <input accept> attribute is a picker hint only, not an enforced constraint — the
      // client can send any file. Validate size/type here, before spending time or SerpApi
      // credits forwarding something that was never going to be a usable reference photo.
      if (imageFile && imageFile.size > MAX_IMAGE_BYTES) {
        return c.json(
          { error: `Image is too large (${(imageFile.size / (1024 * 1024)).toFixed(1)}MB). Maximum is ${MAX_IMAGE_BYTES / (1024 * 1024)}MB.` },
          400
        );
      }
      if (imageFile && imageFile.type && !ALLOWED_IMAGE_TYPES.has(imageFile.type)) {
        return c.json(
          { error: `Unsupported image type "${imageFile.type}". Use PNG, JPEG, or WebP.` },
          400
        );
      }

      // If a file was uploaded, we send it to SerpApi Image API to get an image_id.
      // Fixture mode never performs a real upload, so a placeholder reference is fine there
      // (all downstream data is canned). In live mode, a failed upload must fail loudly —
      // silently substituting a non-functional URL would make visual evidence quietly no-op
      // without telling the caller anything went wrong.
      if (imageFile && !officialImageUrl) {
        if (client.isFixtureMode()) {
          officialImageUrl = 'local-upload://' + imageFile.name;
        } else {
          const apiKey = client.getApiKey?.() || '';
          if (!apiKey) {
            return c.json(
              { error: 'Image upload requires SerpApi to be configured. Use a public image URL instead.' },
              503
            );
          }
          try {
            const serpFormData = new FormData();
            serpFormData.append('image', imageFile, imageFile.name);
            serpFormData.append('api_key', apiKey);

            const uploadResponse = await fetch('https://serpapi.com/image', {
              method: 'POST',
              body: serpFormData,
            });
            if (!uploadResponse.ok) {
              return c.json(
                { error: 'Could not upload the image to the search provider. Try a public image URL instead.' },
                502
              );
            }
            const uploadResult = await uploadResponse.json() as { image_id?: string };
            if (!uploadResult.image_id) {
              return c.json(
                { error: 'The image upload did not return a usable reference. Try a public image URL instead.' },
                502
              );
            }
            officialImageUrl = `serpapi:image_id:${uploadResult.image_id}`;
          } catch (e) {
            console.error('Failed to upload local image to SerpApi:', e);
            return c.json(
              { error: 'Could not upload the image to the search provider. Try a public image URL instead.' },
              502
            );
          }
        }
      }

      if (!officialImageUrl) {
        return c.json({ error: 'officialImageUrl or imageFile is required' }, 400);
      }

      input = {
        productName,
        officialImageUrl,
        mrp: mrpStr ? Number(mrpStr) : undefined,
      };
    } else {
      input = await c.req.json<BeacontraInput>();
      if (!input.productName || !input.officialImageUrl) {
        return c.json({ error: 'productName and officialImageUrl are required' }, 400);
      }
    }

    if (input.officialImageUrl && !input.officialImageUrl.startsWith('local-upload://') && !input.officialImageUrl.startsWith('serpapi:image_id:')) {
      const urlCheck = isSafePublicUrl(input.officialImageUrl);
      if (!urlCheck.isSafe) {
        return c.json({ error: `Invalid officialImageUrl: ${urlCheck.reason}` }, 400);
      }
    }

    const result = await beacontra.scan(input);

    // Persist scan result in shared cache for subsequent retrieval by scanId
    const cache = getSharedCache(env.CACHE_KV);
    await cache.set(`scan:${result.scanId}`, {
      data: result,
      timestamp: Date.now(),
      ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
      engine: 'beacontra_scan',
      paramsHash: result.scanId,
    });

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
  if (!scanId) {
    return c.json({ error: 'scanId is required' }, 400);
  }

  const env = c.env || ({} as Env);
  const cache = getSharedCache(env.CACHE_KV);
  const cached = await cache.get<BeacontraScanResult>(`scan:${scanId}`);

  if (!cached || !cached.data) {
    return c.json({ error: 'Scan result not found or expired', scanId }, 404);
  }

  return c.json({
    data: cached.data,
    meta: {
      scanId: cached.data.scanId,
      dataSource: cached.data.dataSource,
      creditsUsed: cached.data.creditsUsed,
      totalListingsFound: cached.data.totalListingsFound,
      retrievedAt: new Date().toISOString(),
      cachedAt: new Date(cached.timestamp).toISOString(),
    },
  });
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
