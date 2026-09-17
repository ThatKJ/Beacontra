#!/usr/bin/env tsx
/**
 * Google Lens Controlled Matrix Test
 * 
 * Tests all documented SerpApi Google Lens modes:
 * - type=visual_matches (image_id upload)
 * - type=exact_matches (image_id upload)
 * - type=products (image_id upload)
 * - type=all (image_id upload)
 * - URL-based variants
 * 
 * Records structured results for each call.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SerpApiClient } from '../src/lib/serpapi-client';

interface LensTestResult {
  testName: string;
  engine: string;
  type: string;
  imageMethod: 'url' | 'image_id';
  httpStatus: number;
  success: boolean;
  topLevelKeys: string[];
  visualMatchesCount: number;
  exactMatchesCount: number;
  productsCount: number;
  aiOverviewPresent: boolean;
  errorPresent: boolean;
  errorMessage?: string;
  imageFieldsPresent: boolean;
  sourceFieldsPresent: boolean;
  priceFieldsPresent: boolean;
  latencyMs: number;
  searchId?: string;
  rawResponse?: any;
}

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

async function uploadImage(imageUrl: string, apiKey: string): Promise<string | null> {
  // Download image first
  console.log(`  [DOWNLOAD] Fetching image from ${imageUrl.substring(0, 60)}...`);
  const imgResponse = await fetch(imageUrl);
  if (!imgResponse.ok) {
    console.log(`  [DOWNLOAD] Failed: ${imgResponse.status}`);
    return null;
  }
  const imageBuffer = await imgResponse.arrayBuffer();
  console.log(`  [DOWNLOAD] Got image (${imageBuffer.byteLength} bytes)`);
  
  if (imageBuffer.byteLength > 500 * 1024) {
    console.log(`  [UPLOAD] Image too large (${imageBuffer.byteLength} bytes > 500KB)`);
    return null;
  }
  
  // Upload to SerpApi Image API
  console.log(`  [UPLOAD] Uploading to SerpApi Image API...`);
  const formData = new FormData();
  const blob = new Blob([imageBuffer]);
  formData.append('image', blob, 'test-image.jpg');
  formData.append('api_key', apiKey);
  
  try {
    const uploadResponse = await fetch('https://serpapi.com/image', {
      method: 'POST',
      body: formData,
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.log(`  [UPLOAD] Failed: ${uploadResponse.status} - ${errorText}`);
      return null;
    }
    
    const uploadResult = await uploadResponse.json();
    console.log(`  [UPLOAD] Success: ${uploadResult.image_id}`);
    return uploadResult.image_id;
  } catch (error) {
    console.log(`  [UPLOAD] Exception: ${error}`);
    return null;
  }
}

async function runTest(
  client: SerpApiClient,
  testName: string,
  engine: string,
  type: string,
  imageUrl: string,
  imageId?: string
): Promise<LensTestResult> {
  const startTime = Date.now();
  
  const methodDesc = imageId ? `image_id=${imageId.substring(0, 8)}...` : `url=${imageUrl.substring(0, 60)}...`;
  console.log(`\n=== ${testName} ===`);
  console.log(`  engine=${engine}, type=${type}, ${methodDesc}`);
  
  try {
    const params: any = { engine, type, hl: 'en', country: 'in' };
    if (imageId) {
      params.image_id = imageId;
    } else {
      params.url = imageUrl;
    }
    const response = await client.search(params);
    const latencyMs = Date.now() - startTime;
    
    const topLevelKeys = Object.keys(response);
    const visualMatchesCount = response.visual_matches?.length ?? 0;
    const exactMatchesCount = response.exact_matches?.length ?? 0;
    const productsCount = response.products?.length ?? 0;
    const aiOverviewPresent = !!response.ai_overview;
    const errorPresent = !!response.error;
    
    // Check for key fields in results
    let imageFieldsPresent = false;
    let sourceFieldsPresent = false;
    let priceFieldsPresent = false;
    
    const allMatches = [
      ...(response.visual_matches ?? []),
      ...(response.exact_matches ?? []),
      ...(response.products ?? [])
    ];
    
    for (const match of allMatches) {
      if (match.thumbnail || match.image) imageFieldsPresent = true;
      if (match.source) sourceFieldsPresent = true;
      if (match.price || match.extracted_price) priceFieldsPresent = true;
    }
    
    const result: LensTestResult = {
      testName,
      engine,
      type,
      imageMethod: imageId ? 'image_id' : 'url',
      httpStatus: errorPresent ? 500 : 200,
      success: !errorPresent,
      topLevelKeys,
      visualMatchesCount,
      exactMatchesCount,
      productsCount,
      aiOverviewPresent,
      errorPresent,
      errorMessage: response.error,
      imageFieldsPresent,
      sourceFieldsPresent,
      priceFieldsPresent,
      latencyMs,
      searchId: response.search_metadata?.id,
      rawResponse: response
    };
    
    console.log(`  Status: ${errorPresent ? 'ERROR' : 'OK'} (${latencyMs}ms)`);
    console.log(`  Top-level keys: ${topLevelKeys.join(', ')}`);
    console.log(`  visual_matches: ${visualMatchesCount}, exact_matches: ${exactMatchesCount}, products: ${productsCount}`);
    console.log(`  ai_overview: ${aiOverviewPresent ? 'YES' : 'NO'}`);
    console.log(`  Image fields: ${imageFieldsPresent}, Source fields: ${sourceFieldsPresent}, Price fields: ${priceFieldsPresent}`);
    if (errorPresent) {
      console.log(`  Error: ${response.error}`);
    }
    
    return result;
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    console.log(`  Status: ERROR (${latencyMs}ms)`);
    console.log(`  Error: ${errorMsg}`);
    
    return {
      testName,
      engine,
      type,
      imageMethod: imageId ? 'image_id' : 'url',
      httpStatus: 0,
      success: false,
      topLevelKeys: [],
      visualMatchesCount: 0,
      exactMatchesCount: 0,
      productsCount: 0,
      aiOverviewPresent: false,
      errorPresent: true,
      errorMessage: errorMsg,
      imageFieldsPresent: false,
      sourceFieldsPresent: false,
      priceFieldsPresent: false,
      latencyMs,
      rawResponse: null
    };
  }
}

async function main() {
  console.log('============================================================');
  console.log('GOOGLE LENS CONTROLLED MATRIX TEST');
  console.log('============================================================');
  
  loadEnvFile();
  
  const apiKey = (process.env.SERPAPI_API_KEY ?? process.env.SERPAPI_KEY ?? '').trim();
  if (!apiKey || apiKey === 'your_key_here' || apiKey === '<my real key>') {
    console.error('SERPAPI_API_KEY not configured');
    process.exit(1);
  }
  
  const client = new (await import('../src/lib/serpapi-client')).SerpApiClient({
    apiKey,
    fixtureMode: false,
    maxRetries: 1,
    defaultTimeout: 60000,
  });
  
  // Test image - use Google logo (known working)
  const testImageUrl = 'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png';
  console.log(`Test image: ${testImageUrl}`);
  
  // First, upload image to get image_id
  console.log('\n--- UPLOADING IMAGE ---');
  const imageId = await uploadImage(testImageUrl, apiKey);
  
  const results: LensTestResult[] = [];
  
  // URL-based tests
  console.log('\n--- URL-BASED TESTS ---');
  results.push(await runTest(client, 'TEST A: visual_matches (URL)', 'google_lens', 'visual_matches', testImageUrl));
  results.push(await runTest(client, 'TEST B: exact_matches (URL)', 'google_lens', 'exact_matches', testImageUrl));
  results.push(await runTest(client, 'TEST C: products (URL)', 'google_lens', 'products', testImageUrl));
  results.push(await runTest(client, 'TEST D: all (URL)', 'google_lens', 'all', testImageUrl));
  
  // Image ID based tests (if upload succeeded)
  if (imageId) {
    console.log('\n--- IMAGE_ID-BASED TESTS ---');
    results.push(await runTest(client, 'TEST E: visual_matches (image_id)', 'google_lens', 'visual_matches', testImageUrl, imageId));
    results.push(await runTest(client, 'TEST F: exact_matches (image_id)', 'google_lens', 'exact_matches', testImageUrl, imageId));
    results.push(await runTest(client, 'TEST G: products (image_id)', 'google_lens', 'products', testImageUrl, imageId));
    results.push(await runTest(client, 'TEST H: all (image_id)', 'google_lens', 'all', testImageUrl, imageId));
  } else {
    console.log('\n--- IMAGE UPLOAD FAILED - SKIPPING image_id TESTS ---');
  }
  
  // Summary
  console.log('\n============================================================');
  console.log('MATRIX TEST SUMMARY');
  console.log('============================================================');
  
  for (const r of results) {
    const status = r.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} | ${r.testName.padEnd(35)} | visual=${r.visualMatchesCount} exact=${r.exactMatchesCount} products=${r.productsCount} ai_overview=${r.aiOverviewPresent ? 'YES' : 'NO'} | ${r.latencyMs}ms`);
  }
  
  // Save detailed results
  const fs = await import('fs/promises');
  const outputPath = resolve(process.cwd(), 'docs/LENS_MATRIX_RESULTS.json');
  await fs.writeFile(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nDetailed results saved to: ${outputPath}`);
  
  // Determine if structured results work
  const structuredWork = results.some(r => r.visualMatchesCount > 0 || r.exactMatchesCount > 0 || r.productsCount > 0);
  
  console.log('\n============================================================');
  if (structuredWork) {
    console.log('RESULT: STRUCTURED RESULTS WORK ✅');
    console.log('At least one mode returned structured visual_matches/exact_matches/products');
  } else {
    console.log('RESULT: NO STRUCTURED RESULTS ❌');
    console.log('All modes returned only ai_overview or empty results');
  }
  console.log('============================================================');
}

main().catch(console.error);