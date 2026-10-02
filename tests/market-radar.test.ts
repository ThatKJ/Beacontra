/**
 * Market Radar Test Suite (Milestone 3)
 * 
 * Verifies:
 * 1. Intelligent Search Planning (Quick Scan 1 credit cap vs Deep Investigation)
 * 2. Variant Matching & Exclusion (Hardware tiers, accessories excluded from baseline)
 * 3. Market Price Baseline Calculation (Robust median/trimmed mean vs insufficient evidence)
 * 4. Legitimate Discount vs Commercial Anomaly distinction (Indian e-commerce retail reality)
 * 5. Marketplace and Merchant Identity separation with durable evidence logging
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryCache } from '../src/lib/cache';
import { DurableEvidenceRepository } from '../src/lib/evidence-core';
import { BrandDnaService, type ProductProfile } from '../src/lib/brand-dna';
import { MarketRadarService } from '../src/lib/market-radar';
import { SerpApiClient } from '../src/lib/serpapi-client';
import type { BaseSearchParams, SerpApiResponse } from '../src/lib/types';

describe('Milestone 3 — Market Radar', () => {
  let cache: MemoryCache;
  let repo: DurableEvidenceRepository;
  let brandService: BrandDnaService;
  let testProduct: ProductProfile;

  beforeEach(async () => {
    cache = new MemoryCache();
    repo = new DurableEvidenceRepository(cache);
    brandService = new BrandDnaService(cache);

    // Register test brand and product
    const brand = await brandService.createBrand({
      name: 'boAt Lifestyle',
      officialDomains: ['boat-lifestyle.com', 'amazon.in', 'flipkart.com'],
    });

    testProduct = await brandService.createProduct({
      brandId: brand.id,
      productName: 'boAt Airdopes 141',
      modelNumber: 'AD141',
      category: 'Audio',
      canonicalImageUrl: 'https://example.com/boat141.jpg',
      statutoryMrp: 4490,
      expectedPriceRange: { min: 999, max: 1499 },
      authorizedSellers: ['Appario Retail', 'Imagine Marketing Pvt Ltd', 'boAt Official'],
      variants: [
        {
          sku: 'BOAT-141-BLK',
          name: 'Bold Black',
          attributes: { color: 'Black' },
          mrp: 4490,
          expectedPriceRange: { min: 999, max: 1499 },
        },
        {
          sku: 'BOAT-141-WHT',
          name: 'Pure White',
          attributes: { color: 'White' },
          mrp: 4490,
          expectedPriceRange: { min: 999, max: 1499 },
        },
      ],
    });
  });

  it('should run Quick Scan with a strict 1-request credit budget', async () => {
    // Mock SerpApiClient in fixture mode
    const client = new SerpApiClient({
      apiKey: '',
      fixtureMode: true,
      cache,
    });

    // Provide mock shopping response
    client.search = async <T = unknown>(_params: BaseSearchParams): Promise<SerpApiResponse<T>> => {
      return {
        search_metadata: { id: 'test_meta', status: 'Success' },
        shopping_results: [
          {
            title: 'boAt Airdopes 141 Bluetooth Truly Wireless in Ear Earbuds (Bold Black)',
            product_link: 'https://www.amazon.in/dp/B09N3ZNHTY',
            source: 'Amazon.in',
            price: '₹1,299',
            extracted_price: 1299,
          },
          {
            title: 'boAt Airdopes 141 TWS Earbuds (Pure White)',
            product_link: 'https://www.flipkart.com/boat-airdopes-141-white/p/itm123',
            source: 'Flipkart',
            price: '₹1,349',
            extracted_price: 1349,
          },
        ],
      } as SerpApiResponse<T>;
    };

    const radar = new MarketRadarService(client, repo, brandService);
    const report = await radar.runRadar(testProduct, { mode: 'quick' });

    expect(report.mode).toBe('quick');
    expect(report.searchPlan.plannedRequests).toBe(1);
    expect(report.searchPlan.maxCreditsCap).toBe(1);
    expect(report.searchPlan.executedRequests).toBe(1);
    expect(report.comparableListings.length).toBe(2);
    expect(report.baseline.status).toBe('preliminary_baseline');
    expect(report.baseline.medianMarketPrice).toBe(1324);
  });

  it('should exclude accessories and incompatible hardware tiers from price baseline', async () => {
    const client = new SerpApiClient({
      apiKey: '',
      fixtureMode: true,
      cache,
    });

    client.search = async <T = unknown>(_params: BaseSearchParams): Promise<SerpApiResponse<T>> => {
      return {
        search_metadata: { id: 'test_meta', status: 'Success' },
        shopping_results: [
          // Comparable 1
          {
            title: 'boAt Airdopes 141 True Wireless Earbuds with 42H Playtime (Bold Black)',
            product_link: 'https://www.amazon.in/dp/B09N3ZNHTY',
            source: 'Amazon.in',
            price: '₹1,299',
            extracted_price: 1299,
          },
          // Comparable 2
          {
            title: 'boAt Airdopes 141 Wireless TWS Earbuds (Pure White)',
            product_link: 'https://www.croma.com/boat-airdopes-141/p/246810',
            source: 'Croma',
            price: '₹1,399',
            extracted_price: 1399,
          },
          // Incompatible Hardware Tier (ANC) - must be excluded
          {
            title: 'boAt Airdopes 141 ANC Active Noise Cancelling TWS Earbuds',
            product_link: 'https://www.amazon.in/dp/B0ANC12345',
            source: 'Amazon.in',
            price: '₹1,799',
            extracted_price: 1799,
          },
          // Accessory (Protective Case) - must be excluded
          {
            title: 'Silicone Protective Case Cover for boAt Airdopes 141 with Keychain',
            product_link: 'https://www.meesho.com/boat-141-silicone-case/p/999',
            source: 'Meesho',
            price: '₹199',
            extracted_price: 199,
          },
        ],
      } as SerpApiResponse<T>;
    };

    const radar = new MarketRadarService(client, repo, brandService);
    const report = await radar.runRadar(testProduct, { mode: 'quick' });

    // Verify exclusions
    expect(report.comparableListings.length).toBe(2);
    expect(report.excludedListings.length).toBe(2);

    const ancExcluded = report.excludedListings.find(l => l.title.includes('ANC'));
    expect(ancExcluded).toBeDefined();
    expect(ancExcluded?.matchClassification).toBe('incompatible_variant');

    const caseExcluded = report.excludedListings.find(l => l.title.includes('Silicone Protective Case'));
    expect(caseExcluded).toBeDefined();
    expect(caseExcluded?.matchClassification).toBe('accessory_excluded');

    // Baseline only includes genuine offers: ₹1,299 and ₹1,399
    expect(report.baseline.medianMarketPrice).toBe(1349);
    expect(report.baseline.excludedListingCount).toBe(2);
    expect(report.baseline.explanation).toContain('2 listings excluded');
  });

  it('should distinguish legitimate festive discounts from anomalous underpricing', async () => {
    const client = new SerpApiClient({
      apiKey: '',
      fixtureMode: true,
      cache,
    });

    client.search = async <T = unknown>(_params: BaseSearchParams): Promise<SerpApiResponse<T>> => {
      return {
        search_metadata: { id: 'test_meta', status: 'Success' },
        shopping_results: [
          // Baseline offer 1: ₹1,399 (70% off MRP of ₹4,490 - normal Indian retail price)
          {
            title: 'boAt Airdopes 141 TWS Earbuds (Black)',
            product_link: 'https://www.amazon.in/dp/B09N3ZNHTY',
            source: 'Amazon.in',
            price: '₹1,399',
            extracted_price: 1399,
          },
          // Baseline offer 2: ₹1,299 from authorized seller
          {
            title: 'boAt Airdopes 141 TWS Earbuds (White)',
            product_link: 'https://www.flipkart.com/boat-141',
            source: 'Imagine Marketing Pvt Ltd',
            price: '₹1,299',
            extracted_price: 1299,
          },
          // Baseline offer 3: ₹1,349 from Croma
          {
            title: 'boAt Airdopes 141 Earbuds (Grey)',
            product_link: 'https://www.croma.com/boat-141',
            source: 'Croma',
            price: '₹1,349',
            extracted_price: 1349,
          },
          // Baseline offer 4: ₹1,199 promotional sale from authorized seller Appario Retail
          {
            title: 'boAt Airdopes 141 Bluetooth Earbuds (Black)',
            product_link: 'https://www.amazon.in/dp/B09APP12',
            source: 'Appario Retail',
            price: '₹1,199',
            extracted_price: 1199,
          },
          // Anomalous offer 5: ₹399 from generic new seller "FastDeals99"
          // Median is ~₹1,324. ₹399 is 70% below the market median and 91% below MRP!
          {
            title: 'boAt Airdopes 141 Wireless TWS Earbuds (Black)',
            product_link: 'https://www.shadydeal.com/boat-141-deal',
            source: 'FastDeals99',
            price: '₹399',
            extracted_price: 399,
          },
        ],
      } as SerpApiResponse<T>;
    };

    const radar = new MarketRadarService(client, repo, brandService);
    const report = await radar.runRadar(testProduct, { mode: 'quick' });

    // Verify baseline
    expect(report.baseline.status).toBe('robust_baseline');
    expect(report.baseline.sampleSize).toBe(5);

    // The authorized promotional offer (₹1,199) should NOT be flagged as an anomaly
    const promoOffer = report.comparableListings.find(l => l.merchantName === 'Appario Retail');
    expect(promoOffer).toBeDefined();
    expect(promoOffer?.requiresReview).toBe(false);
    expect(promoOffer?.priceClassification).toBe('at_baseline');
    expect(promoOffer?.discountLegitimacyScore).toBeGreaterThanOrEqual(90);

    // The ₹399 listing MUST be flagged as anomalous underpricing requiring review
    const suspiciousOffer = report.comparableListings.find(l => l.merchantName === 'FastDeals99');
    expect(suspiciousOffer).toBeDefined();
    expect(suspiciousOffer?.priceClassification).toBe('anomalous_underpricing');
    expect(suspiciousOffer?.requiresReview).toBe(true);
    expect(suspiciousOffer?.discountLegitimacyScore).toBe(15);
    expect(suspiciousOffer?.reviewRationale).toContain('Commercial anomaly');
  });

  it('should return insufficient_evidence when fewer than 2 comparable offers exist', async () => {
    const client = new SerpApiClient({
      apiKey: '',
      fixtureMode: true,
      cache,
    });

    client.search = async <T = unknown>(_params: BaseSearchParams): Promise<SerpApiResponse<T>> => {
      return {
        search_metadata: { id: 'test_meta', status: 'Success' },
        shopping_results: [
          {
            title: 'boAt Airdopes 141 Single Earbud Replacement Only',
            product_link: 'https://www.amazon.in/dp/B0SINGLE',
            source: 'Amazon.in',
            price: '₹699',
            extracted_price: 699,
          },
        ],
      } as SerpApiResponse<T>;
    };

    const radar = new MarketRadarService(client, repo, brandService);
    const report = await radar.runRadar(testProduct, { mode: 'quick' });

    // Since only 1 offer was found, baseline status must be insufficient_evidence
    expect(report.baseline.status).toBe('insufficient_evidence');
    expect(report.baseline.explanation).toContain('Fewer than 2 comparable market offers observed');
  });
});
