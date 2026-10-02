/**
 * Investigation Autopilot Test Suite
 *
 * Verifies:
 * 1. Evidence gap detection (insufficient baseline, missing visual forensics, unverified seller divergence, stale data).
 * 2. Deterministic planning with predefined recipes (Fast Baseline, Counterfeit Lead, Deep Sweep).
 * 3. Server-side credit budget limits and strict user-approval enforcement.
 * 4. End-to-end bounded execution with Before-and-After delta tracking.
 * 5. Case creation, Evidence Graph generation, and structured Investigation Replay.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryCache } from '../src/lib/cache';
import { DurableEvidenceRepository } from '../src/lib/evidence-core';
import { BrandDnaService, type ProductProfile } from '../src/lib/brand-dna';
import { SerpApiClient } from '../src/lib/serpapi-client';
import {
  InvestigationAutopilotService,
  INVESTIGATION_TEMPLATES,
} from '../src/lib/autopilot';
import type { BaseSearchParams, SerpApiResponse } from '../src/lib/types';

describe('Investigation Autopilot Engine', () => {
  let cache: MemoryCache;
  let repo: DurableEvidenceRepository;
  let brandService: BrandDnaService;
  let testProduct: ProductProfile;
  let client: SerpApiClient;

  beforeEach(async () => {
    cache = new MemoryCache();
    repo = new DurableEvidenceRepository(cache);
    brandService = new BrandDnaService(cache);

    const brand = await brandService.createBrand({
      name: 'boAt Lifestyle',
      officialDomains: ['boat-lifestyle.com'],
    });

    testProduct = await brandService.createProduct({
      brandId: brand.id,
      productName: 'boAt Airdopes 141',
      modelNumber: 'AD141',
      canonicalImageUrl: 'https://cdn.boat.com/airdopes141-canonical.jpg',
      statutoryMrp: 4490,
      expectedPriceRange: { min: 999, max: 1499 },
      authorizedSellers: ['Appario Retail', 'boAt Lifestyle'],
    });

    client = new SerpApiClient({
      apiKey: '',
      fixtureMode: true,
      cache,
    });

    // Mock search responses for Shopping and Lens
    client.search = async <T = unknown>(params: BaseSearchParams): Promise<SerpApiResponse<T>> => {
      if (params.engine === 'google_shopping') {
        return {
          search_metadata: { id: 'meta_shop_1', status: 'Success' },
          shopping_results: [
            {
              title: 'boAt Airdopes 141 Bluetooth Wireless Earbuds (Black)',
              price: '₹1,299',
              extracted_price: 1299,
              product_link: 'https://www.amazon.in/dp/B09N3ZNHTY',
              source: 'Amazon.in',
              thumbnail: 'https://m.media-amazon.com/images/I/41-boat141.jpg',
            },
            {
              title: 'boAt Airdopes 141 Bluetooth Earbuds (Pure White)',
              price: '₹1,349',
              extracted_price: 1349,
              product_link: 'https://www.flipkart.com/boat-airdopes-141/p/itm1',
              source: 'Flipkart',
              thumbnail: 'https://rukminim.flixcart.com/image/boat141.jpg',
            },
            {
              title: 'boAt Airdopes 141 Wireless Earbuds (Severe Discount)',
              price: '₹499', // Outlier (<50% of market, <45% of MRP)
              extracted_price: 499,
              product_link: 'https://www.randomdeals.in/p/boat141',
              source: 'RandomDeals.in',
              thumbnail: 'https://randomdeals.in/thumb-boat.jpg',
            },
          ],
        } as SerpApiResponse<T>;
      }

      if (params.engine === 'google_lens') {
        return {
          search_metadata: { id: 'meta_lens_1', status: 'Success' },
          visual_matches: [
            {
              title: 'boAt Airdopes 141 True Wireless Earbuds',
              link: 'https://www.amazon.in/dp/B09N3ZNHTY',
              source: 'Amazon.in',
              thumbnail: 'https://m.media-amazon.com/images/I/41-boat141.jpg',
            },
            {
              title: 'Wholesale boAt Earbuds Bulk Lot',
              link: 'https://indiamart.com/proddetail/earbuds-lot.html',
              source: 'IndiaMART',
              thumbnail: 'https://5.imimg.com/data5/boat-copy.jpg',
            },
          ],
        } as SerpApiResponse<T>;
      }

      return { search_metadata: { status: 'Success' } } as SerpApiResponse<T>;
    };
  });

  describe('1. Evidence Gap Analysis', () => {
    it('should detect insufficient baseline when product has zero or fewer than 3 listings', async () => {
      const autopilot = new InvestigationAutopilotService(client, repo, brandService);
      const gaps = await autopilot.analyzeEvidenceGaps(testProduct);

      const baselineGap = gaps.find((g) => g.type === 'insufficient_baseline');
      expect(baselineGap).toBeDefined();
      expect(baselineGap?.severity).toBe('high');
      expect(baselineGap?.estimatedCredits).toBe(1);
    });

    it('should detect missing visual evidence when a listing has an image but no Lens records', async () => {
      // Seed a listing with an image
      await repo.saveListing({
        id: 'listing_seed_1',
        source: 'Flipkart',
        marketplace: 'flipkart',
        externalId: 'flip_1',
        title: 'boAt Airdopes 141 Black',
        url: 'https://flipkart.com/item1',
        cleanUrl: 'https://flipkart.com/item1',
        extractedPrice: 800,
        originalPriceText: '₹800',
        currency: 'INR',
        sellerName: 'Flipkart Seller',
        imageUrl: 'https://images.flipkart.com/boat141.jpg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const autopilot = new InvestigationAutopilotService(client, repo, brandService);
      const gaps = await autopilot.analyzeEvidenceGaps(testProduct);

      const visualGap = gaps.find((g) => g.type === 'missing_visual_evidence');
      expect(visualGap).toBeDefined();
      expect(visualGap?.targetListingId).toBe('listing_seed_1');
    });

    it('should identify unverified merchants with severe price divergence', async () => {
      const merchant = await repo.saveMerchant({
        id: 'm_unverified_1',
        name: 'SuperDiscountHub',
        normalizedName: 'superdiscounthub',
        platform: 'ThirdParty',
        verificationStatus: 'unverified',
        firstObservedAt: new Date().toISOString(),
        lastObservedAt: new Date().toISOString(),
      });

      await repo.saveListing({
        id: 'listing_severe_disc',
        source: 'ThirdParty',
        marketplace: 'third_party',
        externalId: 'ext_disc_1',
        title: 'boAt Airdopes 141 (Clearance)',
        url: 'https://discounthub.com/item',
        cleanUrl: 'https://discounthub.com/item',
        extractedPrice: 699, // Severe discount vs statutory 4490
        originalPriceText: '₹699',
        currency: 'INR',
        sellerName: merchant.name,
        merchantId: merchant.id,
        imageUrl: 'https://discounthub.com/photo.jpg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const autopilot = new InvestigationAutopilotService(client, repo, brandService);
      const gaps = await autopilot.analyzeEvidenceGaps(testProduct);

      const merchantGap = gaps.find((g) => g.type === 'unverified_merchant');
      expect(merchantGap).toBeDefined();
      expect(merchantGap?.targetMerchantName).toBe('SuperDiscountHub');
    });
  });

  describe('2. Deterministic Investigation Planning & Templates', () => {
    it('should create a fast_baseline plan capped at 1 credit', async () => {
      const autopilot = new InvestigationAutopilotService(client, repo, brandService);
      const plan = await autopilot.createInvestigationPlan(testProduct, 'fast_baseline');

      expect(plan.templateId).toBe('fast_baseline');
      expect(plan.totalEstimatedCredits).toBe(1);
      expect(plan.steps.some((s) => s.engine === 'google_shopping')).toBe(true);
      expect(plan.steps.some((s) => s.engine === 'google_lens')).toBe(false);
      expect(plan.steps.some((s) => s.engine === 'local_analysis')).toBe(true);
      expect(plan.requiresApproval).toBe(true);
    });

    it('should create an anomaly_verification plan including selective Google Lens steps', async () => {
      // Seed a listing needing visual investigation
      await repo.saveListing({
        id: 'listing_anom_lens',
        source: 'RandomDeals.in',
        marketplace: 'random_deals',
        externalId: 'rd_1',
        title: 'boAt Airdopes 141 (Outlier)',
        url: 'https://randomdeals.in/p/boat',
        cleanUrl: 'https://randomdeals.in/p/boat',
        extractedPrice: 499,
        originalPriceText: '₹499',
        currency: 'INR',
        sellerName: 'Random Deals Store',
        imageUrl: 'https://randomdeals.in/photo.jpg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const autopilot = new InvestigationAutopilotService(client, repo, brandService);
      const plan = await autopilot.createInvestigationPlan(testProduct, 'anomaly_verification');

      expect(plan.templateId).toBe('anomaly_verification');
      expect(plan.totalEstimatedCredits).toBeLessThanOrEqual(3);
      expect(plan.steps.some((s) => s.engine === 'google_shopping')).toBe(true);
      expect(plan.steps.some((s) => s.engine === 'google_lens')).toBe(true);
    });
  });

  describe('3. Server-Side Budget Ceiling & Approval Enforcement', () => {
    it('should throw an error if execution is attempted without user approval', async () => {
      const autopilot = new InvestigationAutopilotService(client, repo, brandService);
      const plan = await autopilot.createInvestigationPlan(testProduct, 'fast_baseline');

      await expect(
        autopilot.executePlan(plan, { userApproved: false, approvedBudgetCredits: 5 })
      ).rejects.toThrow(/User approval is strictly required/);
    });

    it('should strictly respect user-approved credit limit and skip excess steps', async () => {
      // Seed 4 listings with images to trigger multiple Lens gap recommendations
      for (let i = 1; i <= 4; i++) {
        await repo.saveListing({
          id: `listing_bulk_${i}`,
          source: 'MarketX',
          marketplace: 'market_x',
          externalId: `mx_${i}`,
          title: `boAt Airdopes 141 Offer ${i}`,
          url: `https://marketx.com/item${i}`,
          cleanUrl: `https://marketx.com/item${i}`,
          extractedPrice: 500 + i * 50,
          originalPriceText: `₹${500 + i * 50}`,
          currency: 'INR',
          sellerName: `Seller ${i}`,
          imageUrl: `https://marketx.com/img${i}.jpg`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      const autopilot = new InvestigationAutopilotService(client, repo, brandService);
      const plan = await autopilot.createInvestigationPlan(testProduct, 'deep_marketplace_sweep', 5);

      // User approves only 2 credits total
      const result = await autopilot.executePlan(plan, {
        userApproved: true,
        approvedBudgetCredits: 2,
      });

      expect(result.spentCredits).toBeLessThanOrEqual(2);
      expect(result.approvedBudgetCredits).toBe(2);
      const skipped = result.steps.filter((s) => s.status === 'skipped');
      expect(skipped.length).toBeGreaterThan(0);
      expect(skipped[0]?.executionResult?.summary).toContain('Skipped to preserve budget');
    });
  });

  describe('4. Autonomous Bounded Execution & Before/After Deltas', () => {
    it('should execute plan, track deltas, update evidence graph, and create durable case', async () => {
      const autopilot = new InvestigationAutopilotService(client, repo, brandService);
      const plan = await autopilot.createInvestigationPlan(testProduct, 'fast_baseline');

      const result = await autopilot.executePlan(plan, {
        userApproved: true,
        approvedBudgetCredits: 1,
      });

      expect(result.userApproved).toBe(true);
      expect(result.spentCredits).toBe(1);
      expect(result.remainingCredits).toBe(0);
      expect(result.beforeAndAfter.deltas.newListingsDiscovered).toBeGreaterThan(0);
      expect(result.caseId).toMatch(/^case_/);
      expect(result.evidenceGraph.nodes.length).toBeGreaterThan(0);
      expect(result.radarReport).toBeDefined();

      // Check case in repository
      const savedCase = await repo.getCase(result.caseId);
      expect(savedCase).toBeDefined();
      expect(savedCase?.productId).toBe(testProduct.id);
      expect(savedCase?.legalDisclaimer).toContain('do not constitute legal determinations');
    });
  });

  describe('5. Investigation Replay System', () => {
    it('should record chronological replay frames and allow faithful replay retrieval', async () => {
      const autopilot = new InvestigationAutopilotService(client, repo, brandService);
      const plan = await autopilot.createInvestigationPlan(testProduct, 'fast_baseline');

      const result = await autopilot.executePlan(plan, {
        userApproved: true,
        approvedBudgetCredits: 1,
      });

      const replay = await autopilot.getReplay(result.executionId);
      expect(replay).toBeDefined();
      expect(replay?.executionId).toBe(result.executionId);
      expect(replay?.frames.length).toBeGreaterThanOrEqual(2); // Initial frame + step frames
      expect(replay?.frames?.[0]?.frameIndex).toBe(0);
      expect(replay?.frames?.[0]?.action).toContain('Investigation Initialized');
      expect(replay?.finalResult.spentCredits).toBe(1);
    });
  });
});
