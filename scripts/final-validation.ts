import { createBeacontraService } from '../src/lib/beacontra';
import { createSerpApiClient } from '../src/lib/serpapi-client';
import { getSerpApiKey } from '../src/lib/config';
import fs from 'fs';
import { resolve } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';

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

async function main() {
  loadEnvFile();
  const env = { SERPAPI_API_KEY: process.env.SERPAPI_API_KEY, SERPAPI_KEY: process.env.SERPAPI_KEY };
  let apiKey: string;
  try {
    apiKey = getSerpApiKey(env);
  } catch {
    console.error('Missing SERPAPI_API_KEY in environment');
    process.exit(1);
  }

  const client = createSerpApiClient(apiKey);
  const service = createBeacontraService(client);

  const input = {
    productName: 'boAt Airdopes 141',
    officialImageUrl: 'https://www.boat-lifestyle.com/cdn/shop/files/AD141-FI_Black06_600x.jpg',
    mrp: 4490
  };

  console.log('Starting live scan for:', input.productName);
  const startTime = Date.now();
  const result = await service.scan(input);
  const latency = Date.now() - startTime;

  console.log('--- RESULTS ---');
  console.log('Latency:', latency, 'ms');
  console.log('Data Source:', result.dataSource);
  console.log('Total Results:', result.results.length);
  
  let matchedCount = 0;
  let visualMatchCount = 0;
  let noEvidenceCount = 0;
  let unavailableCount = 0;
  let anomalousCount = 0;

  let belowMrpCount = 0;
  let largeDeviationCount = 0;
  let moderateDiscountCount = 0;
  let normalPriceCount = 0;

  for (const r of result.results) {
    const v = r.visualSignal;
    if (v.status === 'matched') matchedCount++;
    if (v.status === 'visual_match') visualMatchCount++;
    if (v.status === 'no_evidence') noEvidenceCount++;
    if (v.status === 'unavailable') unavailableCount++;
    if (v.isAnomalous) anomalousCount++;

    const p = r.priceSignal;
    if (p.anomalyType === 'below_mrp') belowMrpCount++;
    if (p.anomalyType === 'large_deviation') largeDeviationCount++;
    if (p.anomalyType === 'moderate_discount') moderateDiscountCount++;
    if (p.anomalyType === 'normal') normalPriceCount++;
  }

  console.log('Visual Status Breakdown:');
  console.log('  Matched:', matchedCount);
  console.log('  Visual Match:', visualMatchCount);
  console.log('  No Evidence:', noEvidenceCount);
  console.log('  Unavailable:', unavailableCount);
  console.log('  Anomalous:', anomalousCount);

  console.log('Price Status Breakdown:');
  console.log('  Below MRP (Extreme):', belowMrpCount);
  console.log('  Large Deviation:', largeDeviationCount);
  console.log('  Moderate Discount:', moderateDiscountCount);
  console.log('  Normal:', normalPriceCount);

  // We need to write this to a file so we can view it
  fs.writeFileSync('docs/FINAL_METRICS_DUMP.json', JSON.stringify({
    latency,
    resultCount: result.results.length,
    creditsUsed: result.creditsUsed,
    matchedCount,
    visualMatchCount,
    noEvidenceCount,
    unavailableCount,
    anomalousCount,
    priceCounts: {
      belowMrpCount,
      largeDeviationCount,
      moderateDiscountCount,
      normalPriceCount
    },
    results: result.results
  }, null, 2));
}

main().catch(console.error);
