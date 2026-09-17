import { createBeacontraService } from '../src/lib/beacontra';
import { createSerpApiClient } from '../src/lib/serpapi-client';
import { getSerpApiKey } from '../src/lib/config';
import fs from 'fs';

async function main() {
  let apiKey: string;
  try {
    apiKey = getSerpApiKey();
  } catch {
    console.error('Missing SERPAPI_API_KEY in environment');
    process.exit(1);
  }

  const client = createSerpApiClient(apiKey);
  const service = createBeacontraService(client);

  const input = {
    productName: 'Skechers Go Walk 6 Men',
    referenceImageUrl: 'https://m.media-amazon.com/images/I/71Y1oX-H54L._SY695_.jpg',
    referencePrice: 5499
  };

  console.log('Starting live scan for:', input.productName);
  const startTime = Date.now();
  const result = await service.scan(input);
  const latency = Date.now() - startTime;

  console.log('--- RESULTS ---');
  console.log('Latency:', latency, 'ms');
  console.log('Data Source:', result.dataSource);
  console.log('Total Results:', result.results.length);
  
  let exactMatchCount = 0;
  let visualMatchCount = 0;
  let productMatchCount = 0;
  let noEvidenceCount = 0;
  let anomalyCount = 0;

  for (const r of result.results) {
    const v = r.visualSignal;
    if (v.status === 'matched') {
      if (v.anomalyType === 'same_product') {
        exactMatchCount++;
      }
    } else if (v.status === 'anomalous_evidence') {
      anomalyCount++;
    } else if (v.status === 'no_evidence' || v.status === 'unavailable') {
      noEvidenceCount++;
    }
  }

  console.log('Visual Status Breakdown:');
  console.log('  Exact Match:', exactMatchCount);
  console.log('  Anomalous:', anomalyCount);
  console.log('  No Evidence/Unavailable:', noEvidenceCount);

  // We need to write this to a file so we can view it
  fs.writeFileSync('docs/FINAL_METRICS_DUMP.json', JSON.stringify({
    latency,
    resultCount: result.results.length,
    creditsUsed: result.creditsUsed,
    exactMatchCount,
    anomalyCount,
    noEvidenceCount
  }, null, 2));
}

main().catch(console.error);
