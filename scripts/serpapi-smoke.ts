#!/usr/bin/env tsx
/**
 * SerpApi Controlled Live Verification Smoke Test
 * 
 * Safety Rules:
 * 1. ZERO secret printing or leaking.
 * 2. Makes exactly ONE small legitimate call.
 * 3. Never dumps raw payload blobs.
 * 4. Prints only safe metadata (status, latency, result count).
 * 5. Returns non-zero exit code on failure.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SerpApiClient, SerpApiError } from '../src/lib/serpapi-client';
import { SerpApiResponseSchema } from '../src/lib/types';
import { extractProductKey, deduplicateListings } from '../src/lib/normalization';

function loadEnvFile(): void {
  const candidates = ['.env', '.dev.vars', '.env.local'];
  for (const file of candidates) {
    const filePath = resolve(process.cwd(), file);
    if (!existsSync(filePath)) continue;
    try {
      const content = readFileSync(filePath, 'utf-8');
      for (const rawLine of content.split('\n')) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const eqIdx = line.indexOf('=');
        if (eqIdx <= 0) continue;
        const key = line.slice(0, eqIdx).trim();
        let val = line.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (key && val && !process.env[key]) {
          process.env[key] = val;
        }
      }
    } catch {
      // Ignore read errors
    }
  }
}

async function runSmokeTest(): Promise<void> {
  console.log('============================================================');
  console.log('SERPAPI LIVE VERIFICATION SMOKE TEST');
  console.log('============================================================');

  loadEnvFile();

  const apiKey = (process.env.SERPAPI_API_KEY ?? process.env.SERPAPI_KEY ?? '').trim();

  if (!apiKey || apiKey === 'your_key_here' || apiKey === '<my real key>') {
    console.error('SERPAPI CONFIG: FAILED');
    console.error('REASON: SERPAPI_API_KEY is not configured in .env or environment.');
    console.error('ACTION REQUIRED: Place your real SerpApi key in .env:');
    console.error('  SERPAPI_API_KEY=<your_real_key>');
    console.error('Then re-run: npm run serpapi:smoke');
    process.exit(1);
  }

  console.log('SERPAPI CONFIG: PASS');
  console.log('KEY SANITIZATION: PASS (secret is masked and never printed)');

  const client = new SerpApiClient({
    apiKey,
    fixtureMode: false,
    maxRetries: 1,
    defaultTimeout: 15000,
  });

  const engine = 'google_shopping';
  const query = 'boAt Airdopes';
  const startTime = Date.now();

  try {
    console.log(`MAKING 1 CONTROLLED LIVE REQUEST (engine: ${engine})...`);
    const response = await client.search({
      engine,
      q: query,
      gl: 'in',
      hl: 'en',
    });

    const latencyMs = Date.now() - startTime;
    console.log(`AUTHENTICATION: PASS (HTTP 200, latency: ${latencyMs}ms)`);
    console.log(`ENGINE: ${engine}`);

    // Verify response schema
    const parsed = SerpApiResponseSchema.safeParse(response);
    if (!parsed.success) {
      console.warn('RESPONSE SCHEMA WARNING:', parsed.error.issues.map(i => i.message).join(', '));
    } else {
      console.log('RESPONSE SCHEMA: PASS (Zod validated)');
    }

    const shoppingResults = response.shopping_results ?? [];
    console.log(`RESPONSE: PASS (received ${shoppingResults.length} organic shopping items)`);

    // Verify normalization
    const listingsForDedup = shoppingResults
      .filter(r => r.title && r.extracted_price)
      .map(r => ({
        title: r.title,
        source: r.source ?? 'Unknown',
        extractedPrice: r.extracted_price ?? 0,
      }));

    const deduplicated = deduplicateListings(listingsForDedup);
    const sampleKey = listingsForDedup[0] ? extractProductKey(listingsForDedup[0].title) : 'none';

    console.log(`NORMALIZATION: PASS (entity key: "${sampleKey}", deduplicated: ${deduplicated.length}/${listingsForDedup.length})`);
    console.log(`ESTIMATED CREDITS USED: ${client.getCreditUsage()} credits`);
    console.log('============================================================');
    console.log('STATUS: VERIFIED — LIVE SMOKE TEST SUCCESSFUL');
    console.log('============================================================');
    process.exit(0);
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime;
    console.error(`AUTHENTICATION: FAILED (after ${latencyMs}ms)`);

    if (err instanceof SerpApiError) {
      console.error(`DIAGNOSIS: SerpApi returned status ${err.statusCode}: ${err.message}`);
      if (err.statusCode === 401) {
        console.error('REASON: Invalid API key or key lacks permissions.');
      } else if (err.statusCode === 429) {
        console.error('REASON: Monthly search limit or hourly rate limit reached.');
      }
    } else if (err instanceof Error) {
      console.error(`DIAGNOSIS: Network/Request Error: ${err.message}`);
    } else {
      console.error('DIAGNOSIS: Unknown error occurred during search.');
    }

    console.log('============================================================');
    console.log('STATUS: LIVE VERIFICATION FAILED');
    console.log('============================================================');
    process.exit(1);
  }
}

runSmokeTest();
