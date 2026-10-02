/**
 * Watchtower Historical Intelligence Test Suite (Milestone 5)
 * 
 * Verifies:
 * 1. Durable historical snapshot capture with tamper-evident provenance hash
 * 2. Diffing between two genuine saved scans:
 *    - Newly discovered listings
 *    - Listings absent from latest results (with ABSENCE_DISCLAIMER)
 *    - Price drops and surges (direction, percentage, significance)
 *    - Priority shifts (escalations to review)
 * 3. Commercial alerts generated for anomalous events
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryCache } from '../src/lib/cache';
import { DurableEvidenceRepository } from '../src/lib/evidence-core';
import {
  WatchtowerService,
  ABSENCE_DISCLAIMER,
  type WatchtowerSnapshot,
} from '../src/lib/watchtower';
import type { MarketRadarReport } from '../src/lib/market-radar';

describe('Milestone 5 — Watchtower Historical Intelligence', () => {
  let cache: MemoryCache;
  let repo: DurableEvidenceRepository;
  let watchtower: WatchtowerService;

  beforeEach(() => {
    cache = new MemoryCache();
    repo = new DurableEvidenceRepository(cache);
    watchtower = new WatchtowerService(repo);
  });

  it('should capture a durable snapshot from genuine Market Radar findings', async () => {
    const mockReport: MarketRadarReport = {
      productId: 'prod_boat_141',
      productName: 'boAt Airdopes 141',
      scanId: 'radar_test_001',
      timestamp: '2026-10-01T10:00:00Z',
      mode: 'quick',
      searchPlan: {
        plannedRequests: 1,
        executedRequests: 1,
        cachedRequests: 0,
        creditsUsed: 1,
        maxCreditsCap: 1,
      },
      baseline: {
        status: 'robust_baseline',
        sampleSize: 3,
        mrp: 4490,
        medianMarketPrice: 1299,
        trimmedMeanPrice: 1299,
        minComparablePrice: 1199,
        maxComparablePrice: 1399,
        explanation: 'Established baseline',
        includedListingCount: 3,
        excludedListingCount: 0,
        exclusionReasons: {},
      },
      comparableListings: [
        {
          id: 'lst_1',
          title: 'boAt Airdopes 141 (Black)',
          source: 'Amazon.in',
          marketplace: 'amazon',
          merchantName: 'Appario Retail',
          url: 'https://www.amazon.in/dp/B09XYZ',
          cleanUrl: 'https://www.amazon.in/dp/B09XYZ',
          price: 1299,
          originalPriceText: '₹1,299',
          imageUrl: 'https://example.com/boat.jpg',
          isComparable: true,
          matchClassification: 'exact_product',
          priceClassification: 'at_baseline',
          priceDeviationFromBaselinePercent: 0,
          discountLegitimacyScore: 95,
          requiresReview: false,
          reviewRationale: 'Normal price',
        },
      ],
      excludedListings: [],
      merchantsObserved: [],
      observations: [],
      summary: 'Market Radar evaluation complete',
    };

    const snapshot = await watchtower.captureSnapshot(mockReport, 'boat');
    expect(snapshot.id).toBe('snap_radar_test_001');
    expect(snapshot.provenanceHash).toBeDefined();
    expect(snapshot.provenanceHash.length).toBe(64);
    expect(snapshot.listings.length).toBe(1);

    // Verify snapshot was persisted in repository
    const stored = await repo.getSnapshotsForProduct('prod_boat_141');
    expect(stored.length).toBe(1);
    expect(stored[0]!.scanId).toBe('radar_test_001');
  });

  it('should compare two genuine snapshots and detect new listings, missing offers, and price plunges', () => {
    const snapshotA: WatchtowerSnapshot = {
      id: 'snap_day_1',
      productId: 'prod_boat_141',
      productName: 'boAt Airdopes 141',
      brandId: 'boat',
      scanId: 'scan_001',
      timestamp: '2026-10-01T10:00:00Z',
      listings: [
        {
          id: 'lst_amazon_appario',
          cleanUrl: 'https://www.amazon.in/dp/B09XYZ',
          source: 'Amazon.in',
          title: 'boAt Airdopes 141',
          merchantName: 'Appario Retail',
          price: 1399,
          imageUrl: 'https://example.com/boat.jpg',
          requiresReview: false,
          classification: 'at_baseline',
        },
        {
          id: 'lst_old_deal',
          cleanUrl: 'https://www.flipkart.com/item/old',
          source: 'Flipkart',
          title: 'boAt Airdopes 141 (White)',
          merchantName: 'SuperComNet',
          price: 1349,
          imageUrl: 'https://example.com/boat2.jpg',
          requiresReview: false,
          classification: 'at_baseline',
        },
      ],
      stats: {
        totalOffers: 2,
        anomalousOffers: 0,
        medianPrice: 1374,
        minPrice: 1349,
        maxPrice: 1399,
      },
      provenanceHash: 'hash_a',
    };

    const snapshotB: WatchtowerSnapshot = {
      id: 'snap_day_2',
      productId: 'prod_boat_141',
      productName: 'boAt Airdopes 141',
      brandId: 'boat',
      scanId: 'scan_002',
      timestamp: '2026-10-02T10:00:00Z',
      listings: [
        // Appario price dropped from 1399 to 999 (29% drop)
        {
          id: 'lst_amazon_appario',
          cleanUrl: 'https://www.amazon.in/dp/B09XYZ',
          source: 'Amazon.in',
          title: 'boAt Airdopes 141',
          merchantName: 'Appario Retail',
          price: 999,
          imageUrl: 'https://example.com/boat.jpg',
          requiresReview: false,
          classification: 'promotional_sale',
        },
        // Brand new suspicious listing from generic seller at ₹399
        {
          id: 'lst_new_suspicious',
          cleanUrl: 'https://www.dealhub.in/boat141',
          source: 'DealHub',
          title: 'boAt Airdopes 141 Special Deal',
          merchantName: 'ShadyDistributor99',
          price: 399,
          imageUrl: 'https://example.com/boat_shady.jpg',
          requiresReview: true,
          classification: 'anomalous_underpricing',
        },
        // Old listing 'lst_old_deal' is NOT in Day 2 results
      ],
      stats: {
        totalOffers: 2,
        anomalousOffers: 1,
        medianPrice: 699,
        minPrice: 399,
        maxPrice: 999,
      },
      provenanceHash: 'hash_b',
    };

    const diff = watchtower.compareSnapshots(snapshotA, snapshotB);

    // 1. Newly discovered
    expect(diff.newlyDiscoveredListings.length).toBe(1);
    expect(diff.newlyDiscoveredListings[0]!.merchantName).toBe('ShadyDistributor99');

    // 2. Missing from latest results (with disclaimer)
    expect(diff.missingFromLatestSearch.length).toBe(1);
    expect(diff.missingFromLatestSearch[0]!.id).toBe('lst_old_deal');
    expect(diff.absenceDisclaimer).toBe(ABSENCE_DISCLAIMER);
    expect(diff.absenceDisclaimer).toContain('This does NOT prove that the listing has been deleted');

    // 3. Price changes
    expect(diff.priceChanges.length).toBe(1);
    const pChange = diff.priceChanges[0]!;
    expect(pChange.merchantName).toBe('Appario Retail');
    expect(pChange.oldPrice).toBe(1399);
    expect(pChange.newPrice).toBe(999);
    expect(pChange.direction).toBe('decreased');
    expect(pChange.changePercent).toBe(-29);

    // 4. Alerts
    expect(diff.alerts.length).toBeGreaterThanOrEqual(1);
    const alert = diff.alerts.find(a => a.ruleType === 'anomalous_underpricing');
    expect(alert).toBeDefined();
    expect(alert?.severity).toBe('critical');
    expect(alert?.message).toContain('ShadyDistributor99');
  });
});
