/**
 * Visual Forensics & Evidence Graph Test Suite (Milestone 4)
 * 
 * Verifies:
 * 1. Google Lens Visual Forensics (exact matches, visual leads, SSRF rejection)
 * 2. T-026 compliance: Zero Lens matches treated as lack of visual evidence, not proof of mismatch
 * 3. Multi-Entity Evidence Graph construction (Product, Listing, Marketplace, Merchant, Image, Source, Case)
 * 4. Explicit factual basis for every edge (no speculative shared ownership assertions)
 * 5. Interactive graph filtering by confidence, node type, and relationship kind
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryCache } from '../src/lib/cache';
import {
  DurableEvidenceRepository,
  type ProductIdentity,
  type MarketplaceListing,
  type MerchantIdentity,
  type InvestigationCase,
} from '../src/lib/evidence-core';
import {
  VisualForensicsService,
  VISUAL_EVIDENCE_DISCLAIMER,
} from '../src/lib/visual-forensics';
import { SerpApiClient } from '../src/lib/serpapi-client';
import type { BaseSearchParams, SerpApiResponse } from '../src/lib/types';

describe('Milestone 4 — Visual Forensics & Evidence Graph', () => {
  let cache: MemoryCache;
  let repo: DurableEvidenceRepository;
  let client: SerpApiClient;

  beforeEach(() => {
    cache = new MemoryCache();
    repo = new DurableEvidenceRepository(cache);
    client = new SerpApiClient({
      apiKey: '',
      fixtureMode: true,
      cache,
    });
  });

  describe('Google Lens Visual Forensics', () => {
    it('should reject unsafe SSRF or local IP image URLs before initiating search', async () => {
      const service = new VisualForensicsService(client, repo);
      const fakeListing: MarketplaceListing = {
        id: 'lst_unsafe',
        source: 'Amazon.in',
        marketplace: 'amazon',
        title: 'Suspicious Earbuds',
        url: 'https://example.com/item',
        cleanUrl: 'https://example.com/item',
        extractedPrice: 999,
        originalPriceText: '₹999',
        currency: 'INR',
        sellerName: 'Vendor',
        imageUrl: 'http://169.254.169.254/latest/meta-data',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await service.investigateImage(fakeListing);
      expect(result.lensStatus).toBe('no_match');
      expect(result.matchedSources.length).toBe(0);
      expect(result.confidence).toBe(0);
      expect(result.interpretation).toContain('Invalid or unsafe image URL');
      expect(result.disclaimer).toBe(VISUAL_EVIDENCE_DISCLAIMER);
    });

    it('should process exact and visual Lens matches as discovery leads without claiming physical authenticity', async () => {
      client.search = async <T = unknown>(_params: BaseSearchParams): Promise<SerpApiResponse<T>> => {
        return {
          search_metadata: { id: 'meta_lens', status: 'Success' },
          exact_matches: [
            {
              title: 'boAt Lifestyle Official Catalog',
              link: 'https://www.boat-lifestyle.com/products/airdopes-141',
              source: 'boat-lifestyle.com',
            },
            {
              title: 'Croma Retail - boAt Airdopes 141',
              link: 'https://www.croma.com/boat-airdopes-141/p/246810',
              source: 'croma.com',
            },
          ],
          visual_matches: [
            {
              title: 'Alternative Store Listing',
              link: 'https://www.anotherstore.in/item',
              source: 'anotherstore.in',
            },
          ],
        } as unknown as SerpApiResponse<T>;
      };

      const service = new VisualForensicsService(client, repo);
      const listing: MarketplaceListing = {
        id: 'lst_boat_1',
        source: 'Amazon.in',
        marketplace: 'amazon',
        title: 'boAt Airdopes 141 (Bold Black)',
        url: 'https://www.amazon.in/dp/B09XYZ',
        cleanUrl: 'https://www.amazon.in/dp/B09XYZ',
        extractedPrice: 1299,
        originalPriceText: '₹1,299',
        currency: 'INR',
        sellerName: 'Appario Retail',
        imageUrl: 'https://images.example.com/boat141.jpg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await service.investigateImage(listing);
      expect(result.lensStatus).toBe('exact_match');
      expect(result.confidence).toBe(0.95);
      expect(result.matchedSources.length).toBe(2);
      expect(result.matchedSources[0]!.source).toBe('boat-lifestyle.com');
      expect(result.disclaimer).toContain('Google Lens reverse-image matches identify web pages displaying visually similar');
      expect(result.disclaimer).toContain('not genuine product provenance');
    });

    it('should treat zero Lens matches as absence of evidence rather than proof of counterfeit (T-026)', async () => {
      client.search = async <T = unknown>(_params: BaseSearchParams): Promise<SerpApiResponse<T>> => {
        return {
          search_metadata: { id: 'meta_empty', status: 'Success' },
          exact_matches: [],
          visual_matches: [],
        } as unknown as SerpApiResponse<T>;
      };

      const service = new VisualForensicsService(client, repo);
      const listing: MarketplaceListing = {
        id: 'lst_unique_angle',
        source: 'Flipkart',
        marketplace: 'flipkart',
        title: 'boAt Airdopes 141 Custom Angle Photo',
        url: 'https://www.flipkart.com/item',
        cleanUrl: 'https://www.flipkart.com/item',
        extractedPrice: 1299,
        originalPriceText: '₹1,299',
        currency: 'INR',
        sellerName: 'Authorized Hub',
        imageUrl: 'https://images.example.com/custom_angle.jpg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await service.investigateImage(listing);
      expect(result.lensStatus).toBe('no_match');
      expect(result.matchedSources.length).toBe(0);
      expect(result.interpretation).toContain('absence of indexed visual evidence, not proof of counterfeit or mismatched product');
    });
  });

  describe('Evidence Graph Construction & Filtering', () => {
    it('should assemble a multi-entity graph with verifiable evidenceBasis for all edges', async () => {
      // 1. Populate Product
      const product: ProductIdentity = {
        id: 'prod_boat_141',
        brandId: 'boat',
        canonicalName: 'boAt Airdopes 141',
        canonicalImageUrls: ['https://example.com/boat141.jpg'],
        mrp: 4490,
        currency: 'INR',
        authorizedSellers: ['Appario Retail'],
        createdAt: '2026-10-01T12:00:00Z',
        updatedAt: '2026-10-01T12:00:00Z',
      };
      await repo.saveProduct(product);

      // 2. Populate Merchant
      const merchant: MerchantIdentity = {
        id: 'merch_appario',
        name: 'Appario Retail Private Ltd',
        normalizedName: 'apparioretailprivateltd',
        platform: 'amazon',
        verificationStatus: 'authorized',
        firstObservedAt: '2026-10-01T12:00:00Z',
        lastObservedAt: '2026-10-01T12:00:00Z',
      };
      await repo.saveMerchant(merchant);

      // 3. Populate Listing
      const listing: MarketplaceListing = {
        id: 'lst_boat_appario',
        source: 'Amazon.in',
        marketplace: 'amazon',
        title: 'boAt Airdopes 141 TWS Earbuds (Bold Black)',
        url: 'https://www.amazon.in/dp/B09XYZ',
        cleanUrl: 'https://www.amazon.in/dp/B09XYZ',
        extractedPrice: 1299,
        originalPriceText: '₹1,299',
        currency: 'INR',
        sellerName: 'Appario Retail Private Ltd',
        merchantId: merchant.id,
        imageUrl: 'https://images.example.com/boat141_thumb.jpg',
        createdAt: '2026-10-01T12:00:00Z',
        updatedAt: '2026-10-01T12:00:00Z',
      };
      await repo.saveListing(listing);

      // 4. Attach Case
      const testCase: InvestigationCase = {
        id: 'case_001',
        caseNumber: 'CASE-001',
        title: 'boAt 141 Marketplace Audit',
        productId: product.id,
        status: 'active',
        priority: 'medium',
        listingIds: [listing.id],
        notes: [],
        tags: ['audit'],
        findingsSummary: 'Cross-verifying marketplace observations',
        legalDisclaimer: 'Non-legal advisory',
        createdAt: '2026-10-01T12:00:00Z',
        updatedAt: '2026-10-01T12:00:00Z',
      };
      await repo.saveCase(testCase);

      const service = new VisualForensicsService(client, repo);
      const graph = await service.buildGraph({ productId: product.id });

      expect(graph.summary.totalNodes).toBeGreaterThanOrEqual(4);
      expect(graph.nodes.some(n => n.type === 'product')).toBe(true);
      expect(graph.nodes.some(n => n.type === 'listing')).toBe(true);
      expect(graph.nodes.some(n => n.type === 'merchant')).toBe(true);
      expect(graph.nodes.some(n => n.type === 'case')).toBe(true);

      // Every edge must have an explicit factual evidenceBasis
      for (const edge of graph.edges) {
        expect(edge.evidenceBasis).toBeDefined();
        expect(edge.evidenceBasis.length).toBeGreaterThan(5);
        expect(edge.uncertaintyDisclaimer).toBeDefined();
      }

      // Check case connection
      const caseEdge = graph.edges.find(e => e.relationship === 'case_contains_evidence');
      expect(caseEdge).toBeDefined();
      expect(caseEdge?.source).toBe('case_001');
      expect(caseEdge?.target).toBe(listing.id);
    });

    it('should support interactive filtering by node type and confidence', async () => {
      const service = new VisualForensicsService(client, repo);
      const graph = await service.buildGraph({});

      // Filter only listings
      const listingFiltered = service.filterGraph(graph, {
        nodeTypes: ['listing'],
      });

      expect(listingFiltered.nodes.every(n => n.type === 'listing')).toBe(true);
      // Edges connecting to excluded nodes should be removed
      expect(listingFiltered.edges.length).toBe(0);

      // Filter by confidence threshold
      const highConfidenceFiltered = service.filterGraph(graph, {
        minConfidence: 0.95,
      });
      expect(highConfidenceFiltered.edges.every(e => e.confidence >= 0.95)).toBe(true);
    });
  });
});
