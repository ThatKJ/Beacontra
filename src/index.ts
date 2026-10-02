import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { SerpApiClient, SerpApiError } from './lib/serpapi-client';
import { getSharedCache } from './lib/cache';
import { createBeacontraService, type BeacontraInput, type BeacontraScanResult } from './lib/beacontra';
import { getSerpApiKey, isSerpApiConfigured, getSerpApiHealthStatus } from './lib/config';
import { isSafePublicUrl } from './lib/security';
import {
  EvidenceDeskService,
  generateInvestigationHtmlReport,
  type CreateCaseInput,
  type UpdateCaseInput,
  type CaseStatus,
} from './lib/evidence-desk';
import {
  BrandDnaService,
  type CreateBrandInput,
  type CreateProductInput,
  type UpdateProductInput,
  type UserCorrection,
} from './lib/brand-dna';
import {
  DurableEvidenceRepository,
  type EvidenceRepository,
} from './lib/evidence-core';
import { MarketRadarService } from './lib/market-radar';
import {
  VisualForensicsService,
  type EvidenceGraph,
  type GraphFilterOptions,
} from './lib/visual-forensics';
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

// Rate limiter to prevent rapid exhaustion of monthly SerpApi credits
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_SCANS_PER_WINDOW = 10;
const scanRateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkScanRateLimit(ip: string): { allowed: boolean; resetInSeconds: number } {
  const now = Date.now();
  const record = scanRateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    scanRateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, resetInSeconds: 60 };
  }
  if (record.count >= MAX_SCANS_PER_WINDOW) {
    const remainingSecs = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return { allowed: false, resetInSeconds: remainingSecs };
  }
  record.count++;
  return { allowed: true, resetInSeconds: Math.max(1, Math.ceil((record.resetAt - now) / 1000)) };
}

export function resetScanRateLimitForTesting(): void {
  scanRateLimitMap.clear();
}

app.post('/api/beacontra/scan', async (c) => {
  const clientIp =
    c.req.header('cf-connecting-ip') ||
    c.req.header('x-real-ip') ||
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    'direct-client';

  const rateCheck = checkScanRateLimit(clientIp);
  if (!rateCheck.allowed) {
    c.header('Retry-After', String(rateCheck.resetInSeconds));
    return c.json(
      {
        error: `Rate limit exceeded. To protect SerpApi credit quotas, investigations are limited to ${MAX_SCANS_PER_WINDOW} scans per minute. Retry in ${rateCheck.resetInSeconds}s.`,
      },
      429
    );
  }

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

// ==========================================
// EVIDENCE DESK CASE MANAGEMENT API
// ==========================================

function getEvidenceDeskService(env?: Env) {
  const safeEnv = env || ({} as Env);
  const cache = getSharedCache(safeEnv.CACHE_KV);
  return new EvidenceDeskService(cache);
}

app.post('/api/cases', async (c) => {
  try {
    const body = await c.req.json<CreateCaseInput>();
    if (!body.productName) {
      return c.json({ error: 'productName is required' }, 400);
    }
    if (!body.officialImageUrl) {
      return c.json({ error: 'officialImageUrl is required' }, 400);
    }

    const env = c.env || ({} as Env);
    const deskService = getEvidenceDeskService(env);

    let scanSnapshot: BeacontraScanResult | undefined;
    if (body.scanId) {
      const cache = getSharedCache(env.CACHE_KV);
      const cachedScan = await cache.get<BeacontraScanResult>(`scan:${body.scanId}`);
      if (cachedScan?.data) {
        scanSnapshot = cachedScan.data;
      }
    }

    const newCase = await deskService.createCase(body, scanSnapshot);
    return c.json({ data: newCase }, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return c.json({ error: msg }, 500);
  }
});

app.get('/api/cases', async (c) => {
  try {
    const status = c.req.query('status') as CaseStatus | undefined;
    const search = c.req.query('search') || c.req.query('q');

    const env = c.env || ({} as Env);
    const deskService = getEvidenceDeskService(env);

    const cases = await deskService.listCases({ status, search });
    return c.json({ data: cases, count: cases.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return c.json({ error: msg }, 500);
  }
});

app.get('/api/cases/:caseId', async (c) => {
  try {
    const caseId = c.req.param('caseId');
    const env = c.env || ({} as Env);
    const deskService = getEvidenceDeskService(env);

    const found = await deskService.getCase(caseId);
    if (!found) {
      return c.json({ error: 'Case not found', caseId }, 404);
    }

    return c.json({ data: found });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return c.json({ error: msg }, 500);
  }
});

app.patch('/api/cases/:caseId', async (c) => {
  try {
    const caseId = c.req.param('caseId');
    const body = await c.req.json<UpdateCaseInput>();

    const env = c.env || ({} as Env);
    const deskService = getEvidenceDeskService(env);

    const updated = await deskService.updateCase(caseId, body);
    if (!updated) {
      return c.json({ error: 'Case not found', caseId }, 404);
    }

    return c.json({ data: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return c.json({ error: msg }, 500);
  }
});

app.post('/api/cases/:caseId/notes', async (c) => {
  try {
    const caseId = c.req.param('caseId');
    const body = await c.req.json<{ author?: string; content: string }>();
    if (!body.content || typeof body.content !== 'string') {
      return c.json({ error: 'content is required' }, 400);
    }

    const env = c.env || ({} as Env);
    const deskService = getEvidenceDeskService(env);

    const note = await deskService.addNote(caseId, body.author || 'Analyst', body.content);
    if (!note) {
      return c.json({ error: 'Case not found', caseId }, 404);
    }

    return c.json({ data: note }, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return c.json({ error: msg }, 500);
  }
});

app.get('/api/cases/:caseId/report', async (c) => {
  try {
    const caseId = c.req.param('caseId');
    const env = c.env || ({} as Env);
    const deskService = getEvidenceDeskService(env);

    const investigationCase = await deskService.getCase(caseId);
    if (!investigationCase) {
      return c.text('Case not found', 404);
    }

    const html = generateInvestigationHtmlReport(investigationCase);
    c.header('Content-Type', 'text/html; charset=utf-8');
    c.header('Content-Disposition', `inline; filename="beacontra-case-${caseId}.html"`);
    c.header('X-Evidence-Case-Id', caseId);
    return c.html(html);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return c.text(`Report generation error: ${msg}`, 500);
  }
});

// ==========================================
// BRAND DNA — BRAND VAULT & SPECIFICATIONS
// ==========================================

function getBrandDnaService(env?: Env) {
  const safeEnv = env || ({} as Env);
  const cache = getSharedCache(safeEnv.CACHE_KV);
  return new BrandDnaService(cache);
}

app.post('/api/brand-dna/brands', async (c) => {
  try {
    const body = await c.req.json<CreateBrandInput>();
    const env = c.env || ({} as Env);
    const service = getBrandDnaService(env);
    const brand = await service.createBrand(body);
    return c.json({ data: brand }, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return c.json({ error: msg }, 400);
  }
});

app.get('/api/brand-dna/brands', async (c) => {
  try {
    const env = c.env || ({} as Env);
    const service = getBrandDnaService(env);
    const brands = await service.listBrands();
    return c.json({ data: brands, count: brands.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return c.json({ error: msg }, 500);
  }
});

app.get('/api/brand-dna/brands/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const env = c.env || ({} as Env);
    const service = getBrandDnaService(env);
    const brand = await service.getBrand(id);
    if (!brand) return c.json({ error: 'Brand not found' }, 404);
    return c.json({ data: brand });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return c.json({ error: msg }, 500);
  }
});

app.post('/api/brand-dna/products', async (c) => {
  try {
    const body = await c.req.json<CreateProductInput>();
    const env = c.env || ({} as Env);
    const service = getBrandDnaService(env);
    const product = await service.createProduct(body);
    return c.json({ data: product }, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return c.json({ error: msg }, 400);
  }
});

app.get('/api/brand-dna/products', async (c) => {
  try {
    const brandId = c.req.query('brandId');
    const search = c.req.query('search') || c.req.query('q');
    const env = c.env || ({} as Env);
    const service = getBrandDnaService(env);
    const products = await service.listProducts({ brandId, search });
    return c.json({ data: products, count: products.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return c.json({ error: msg }, 500);
  }
});

app.get('/api/brand-dna/products/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const env = c.env || ({} as Env);
    const service = getBrandDnaService(env);
    const product = await service.getProduct(id);
    if (!product) return c.json({ error: 'Product not found' }, 404);
    return c.json({ data: product });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return c.json({ error: msg }, 500);
  }
});

app.patch('/api/brand-dna/products/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<UpdateProductInput>();
    const env = c.env || ({} as Env);
    const service = getBrandDnaService(env);
    const updated = await service.updateProduct(id, body);
    if (!updated) return c.json({ error: 'Product not found' }, 404);
    return c.json({ data: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return c.json({ error: msg }, 400);
  }
});

app.post('/api/brand-dna/products/:id/corrections', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<Omit<UserCorrection, 'id' | 'createdAt'>>();
    if (!body.listingTitle || !body.correctionType || !body.reason) {
      return c.json({ error: 'listingTitle, correctionType, and reason are required' }, 400);
    }
    const env = c.env || ({} as Env);
    const service = getBrandDnaService(env);
    const updated = await service.addUserCorrection(id, body);
    if (!updated) return c.json({ error: 'Product not found' }, 404);
    return c.json({ data: updated }, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return c.json({ error: msg }, 500);
  }
});

app.post('/api/brand-dna/products/:id/evaluate', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<{ listingTitle: string }>();
    if (!body.listingTitle) {
      return c.json({ error: 'listingTitle is required' }, 400);
    }
    const env = c.env || ({} as Env);
    const service = getBrandDnaService(env);
    const product = await service.getProduct(id);
    if (!product) return c.json({ error: 'Product not found' }, 404);

    const evaluation = service.evaluateListingMatch(product, body.listingTitle);
    return c.json({ data: evaluation });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return c.json({ error: msg }, 500);
  }
});

// --- Unified Evidence Foundation Routes ---
function getEvidenceRepository(env?: Env): EvidenceRepository {
  const safeEnv = env || ({} as Env);
  const cache = getSharedCache(safeEnv.CACHE_KV);
  return new DurableEvidenceRepository(cache);
}

app.get('/api/evidence/products', async (c) => {
  const brandId = c.req.query('brandId');
  const env = c.env || ({} as Env);
  const repo = getEvidenceRepository(env);
  const products = await repo.listProducts(brandId);
  return c.json({ data: products });
});

app.get('/api/evidence/products/:id', async (c) => {
  const id = c.req.param('id');
  const env = c.env || ({} as Env);
  const repo = getEvidenceRepository(env);
  const product = await repo.getProduct(id);
  if (!product) return c.json({ error: 'Product not found' }, 404);
  return c.json({ data: product });
});

app.get('/api/evidence/listings', async (c) => {
  const merchantId = c.req.query('merchantId');
  const env = c.env || ({} as Env);
  const repo = getEvidenceRepository(env);
  const listings = await repo.listListings(merchantId ? { merchantId } : undefined);
  return c.json({ data: listings });
});

app.get('/api/evidence/listings/:id', async (c) => {
  const id = c.req.param('id');
  const env = c.env || ({} as Env);
  const repo = getEvidenceRepository(env);
  const listing = await repo.getListing(id);
  if (!listing) return c.json({ error: 'Listing not found' }, 404);
  const visual = await repo.getVisualEvidenceForListing(id);
  const commercial = await repo.getCommercialEvidenceForListing(id);
  return c.json({ data: { ...listing, visualEvidence: visual, commercialEvidence: commercial } });
});

app.get('/api/evidence/merchants', async (c) => {
  const env = c.env || ({} as Env);
  const repo = getEvidenceRepository(env);
  const merchants = await repo.listMerchants();
  return c.json({ data: merchants });
});

app.get('/api/evidence/cases', async (c) => {
  const productId = c.req.query('productId');
  const env = c.env || ({} as Env);
  const repo = getEvidenceRepository(env);
  const cases = await repo.listCases(productId);
  return c.json({ data: cases });
});

app.post('/api/evidence/migrate', async (c) => {
  const env = c.env || ({} as Env);
  const cache = getSharedCache(env.CACHE_KV);
  const repo = getEvidenceRepository(env);
  const migratedCount = await repo.migrateFromLegacyKvCases(cache);
  return c.json({ success: true, migratedCount });
});

app.post('/api/market-radar/scan', async (c) => {
  try {
    const body = await c.req.json<{
      productId: string;
      mode?: 'quick' | 'deep';
      allowDeepScan?: boolean;
      location?: string;
    }>();

    if (!body.productId) {
      return c.json({ error: 'productId is required' }, 400);
    }

    const env = c.env || ({} as Env);
    const brandDna = getBrandDnaService(env);
    const product = await brandDna.getProduct(body.productId);
    if (!product) {
      return c.json({ error: 'Product not found in Brand Vault' }, 404);
    }

    const client = createClient(env);
    const repo = getEvidenceRepository(env);
    const radar = new MarketRadarService(client, repo, brandDna);

    const report = await radar.runRadar(product, {
      mode: body.mode || 'quick',
      allowDeepScan: body.allowDeepScan,
      location: body.location,
    });

    return c.json({ data: report });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return c.json({ error: msg }, 500);
  }
});

app.post('/api/visual-forensics/investigate', async (c) => {
  try {
    const body = await c.req.json<{ listingId: string }>();
    if (!body.listingId) {
      return c.json({ error: 'listingId is required' }, 400);
    }

    const env = c.env || ({} as Env);
    const repo = getEvidenceRepository(env);
    const listing = await repo.getListing(body.listingId);
    if (!listing) {
      return c.json({ error: 'Listing not found' }, 404);
    }

    const client = createClient(env);
    const forensics = new VisualForensicsService(client, repo);
    const result = await forensics.investigateImage(listing);
    return c.json({ data: result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return c.json({ error: msg }, 500);
  }
});

app.get('/api/evidence-graph', async (c) => {
  try {
    const productId = c.req.query('productId');
    const caseId = c.req.query('caseId');
    const env = c.env || ({} as Env);
    const client = createClient(env);
    const repo = getEvidenceRepository(env);
    const forensics = new VisualForensicsService(client, repo);

    const graph = await forensics.buildGraph({ productId, caseId });
    return c.json({ data: graph });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return c.json({ error: msg }, 500);
  }
});

app.post('/api/evidence-graph/filter', async (c) => {
  try {
    const body = await c.req.json<{
      graph: EvidenceGraph;
      options: GraphFilterOptions;
    }>();
    if (!body.graph) {
      return c.json({ error: 'graph is required' }, 400);
    }

    const env = c.env || ({} as Env);
    const client = createClient(env);
    const repo = getEvidenceRepository(env);
    const forensics = new VisualForensicsService(client, repo);

    const filtered = forensics.filterGraph(body.graph, body.options || {});
    return c.json({ data: filtered });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return c.json({ error: msg }, 500);
  }
});

export default app;
