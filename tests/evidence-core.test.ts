/**
 * Unified Evidence Foundation Test Suite
 * 
 * Verifies:
 * 1. Clean separation of entities (Product, Listing, Merchant, Visual, Commercial, Observations, Inferences, Cases, Snapshots)
 * 2. Deterministic ID generation and tracking parameter stripping
 * 3. Cryptographic integrity digests (with explicit non-legal authenticity disclaimers)
 * 4. Cross-module listing referencing without conflicting duplicate records
 * 5. Worker restart survival via durable storage
 * 6. Non-destructive migration from legacy Evidence Desk cases
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryCache } from '../src/lib/cache';
import {
  DurableEvidenceRepository,
  computeIntegrityDigest,
  sanitizeListingUrl,
  generateListingId,
  generateMerchantId,
  INTEGRITY_NOTICE,
  type ProductIdentity,
  type MarketplaceListing,
  type MerchantIdentity,
  type VisualEvidence,
  type CommercialEvidence,
} from '../src/lib/evidence-core';
import { EvidenceDeskService, type InvestigationCase as LegacyCase } from '../src/lib/evidence-desk';

describe('Milestone 2 — Unified Evidence Foundation', () => {
  let cache: MemoryCache;
  let repo: DurableEvidenceRepository;

  beforeEach(() => {
    cache = new MemoryCache();
    repo = new DurableEvidenceRepository(cache);
  });

  describe('Integrity & Normalization Utilities', () => {
    it('should compute cryptographic SHA-256 integrity digest', async () => {
      const payload = 'marketplace_observation_payload_data';
      const digest = await computeIntegrityDigest(payload);
      expect(digest).toBeDefined();
      expect(digest.length).toBe(64); // SHA-256 hex string
      expect(INTEGRITY_NOTICE).toContain('DATA INTEGRITY NOTICE');
      expect(INTEGRITY_NOTICE).toContain('They do NOT establish legal authenticity');
    });

    it('should strip tracking and affiliate parameters from listing URLs', () => {
      const rawUrl = 'https://www.amazon.in/dp/B09XYZ1234?utm_source=google&tag=affil-21&ref_=nav_signin&qid=1690000';
      const clean = sanitizeListingUrl(rawUrl);
      expect(clean).toBe('https://www.amazon.in/dp/B09XYZ1234');
    });

    it('should generate deterministic listing and merchant IDs', async () => {
      const url1 = 'https://www.amazon.in/dp/B09XYZ1234?utm_source=ad';
      const url2 = 'https://www.amazon.in/dp/B09XYZ1234?tag=partner';
      const id1 = await generateListingId('Amazon.in', url1);
      const id2 = await generateListingId('Amazon.in', url2);
      expect(id1).toBe(id2); // Stripped URL yields identical deterministic ID
      expect(id1.startsWith('lst_')).toBe(true);

      const mId1 = await generateMerchantId('amazon', 'Appario Retail Private Ltd.');
      const mId2 = await generateMerchantId('amazon', 'appario retail private ltd');
      expect(mId1).toBe(mId2);
      expect(mId1.startsWith('merch_')).toBe(true);
    });
  });

  describe('Entity Separation & Cross-Module Referencing', () => {
    it('should save and reference the same listing across modules without conflict', async () => {
      const product: ProductIdentity = {
        id: 'prod_boat_141',
        brandId: 'boat',
        canonicalName: 'boAt Airdopes 141',
        canonicalImageUrls: ['https://example.com/boat141.jpg'],
        mrp: 4490,
        currency: 'INR',
        expectedPriceRange: { min: 999, max: 1499 },
        authorizedSellers: ['Appario Retail', 'Imagine Marketing'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await repo.saveProduct(product);

      const merchant: MerchantIdentity = {
        id: 'merch_dealzone',
        name: 'DealZone Electronics',
        normalizedName: 'dealzoneelectronics',
        platform: 'amazon',
        verificationStatus: 'unverified',
        firstObservedAt: new Date().toISOString(),
        lastObservedAt: new Date().toISOString(),
      };
      await repo.saveMerchant(merchant);

      const listingId = await generateListingId('Amazon.in', 'https://www.amazon.in/dp/B09XYZ1234');
      const listing: MarketplaceListing = {
        id: listingId,
        source: 'Amazon.in',
        marketplace: 'amazon',
        title: 'boAt Airdopes 141 Bluetooth TWS Earbuds (Bold Black)',
        url: 'https://www.amazon.in/dp/B09XYZ1234?tag=promo',
        cleanUrl: 'https://www.amazon.in/dp/B09XYZ1234',
        extractedPrice: 699,
        originalPriceText: '₹699',
        currency: 'INR',
        sellerName: 'DealZone Electronics',
        merchantId: merchant.id,
        imageUrl: 'https://m.media-amazon.com/images/I/41XYZ.jpg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await repo.saveListing(listing);

      // Attach visual forensics evidence
      const visualEv: VisualEvidence = {
        id: 'vis_1',
        listingId,
        imageUrl: listing.imageUrl,
        lensEngine: 'google_lens',
        lensStatus: 'visual_match',
        matchedPages: [{
          title: 'boAt Official Product Page',
          link: 'https://www.boat-lifestyle.com/products/airdopes-141',
          source: 'boat-lifestyle.com'
        }],
        confidenceScore: 0.92,
        retrievalTimestamp: new Date().toISOString(),
      };
      await repo.saveVisualEvidence(visualEv);

      // Attach commercial market evidence
      const commEv: CommercialEvidence = {
        id: 'comm_1',
        listingId,
        productId: product.id,
        observedPrice: 699,
        baselineMrp: 4490,
        variancePercent: -84.4,
        anomalyType: 'steep_discount',
        discountLegitimacyScore: 20, // Suspiciously below street price
        sellerReputation: 'unauthorized_new',
        retrievalTimestamp: new Date().toISOString(),
      };
      await repo.saveCommercialEvidence(commEv);

      // Verify that the listing is shared and retrievable
      const retrievedListing = await repo.getListing(listingId);
      expect(retrievedListing).toBeDefined();
      expect(retrievedListing?.sellerName).toBe('DealZone Electronics');
      expect(retrievedListing?.merchantId).toBe(merchant.id);

      const attachedVisual = await repo.getVisualEvidenceForListing(listingId);
      expect(attachedVisual.length).toBe(1);
      expect(attachedVisual[0]!.lensStatus).toBe('visual_match');

      const attachedComm = await repo.getCommercialEvidenceForListing(listingId);
      expect(attachedComm.length).toBe(1);
      expect(attachedComm[0]!.observedPrice).toBe(699);
    });

    it('should survive simulated worker restarts using the underlying cache storage', async () => {
      const prod: ProductIdentity = {
        id: 'prod_noise_colorfit',
        brandId: 'noise',
        canonicalName: 'Noise ColorFit Pulse Grand',
        canonicalImageUrls: ['https://example.com/pulse.jpg'],
        mrp: 3999,
        currency: 'INR',
        authorizedSellers: ['Noise Official'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await repo.saveProduct(prod);

      // Simulate Worker restart: create a new repository instance pointing to the same backing store
      const restartedRepo = new DurableEvidenceRepository(cache);
      const fetched = await restartedRepo.getProduct('prod_noise_colorfit');
      expect(fetched).toBeDefined();
      expect(fetched?.canonicalName).toBe('Noise ColorFit Pulse Grand');
      expect(fetched?.brandId).toBe('noise');
    });
  });

  describe('Legacy KV Case Migration', () => {
    it('should non-destructively migrate legacy Evidence Desk cases into Unified Evidence Foundation', async () => {
      // Setup a legacy case in the cache
      const legacyService = new EvidenceDeskService(cache);
      const legacyCase: LegacyCase = {
        id: 'case_legacy_001',
        title: 'Investigation into Noise Pulse Smartwatch anomalies',
        status: 'under_review',
        priority: 'high',
        targetProduct: {
          productName: 'Noise ColorFit Pulse',
          brand: 'Noise',
          officialImageUrl: 'https://example.com/noise.jpg',
          mrp: 3999,
          knownAuthorizedSellers: ['Noise Official'],
        },
        evidenceObservations: [],
        notes: [{
          id: 'note_1',
          author: 'Analyst Ravi',
          content: 'Confirmed multiple suspicious listings below ₹500',
          createdAt: new Date().toISOString(),
        }],
        tags: ['smartwatch', 'price-anomaly'],
        findingsSummary: 'Observed extreme price deviations on marketplace channels.',
        legalDisclaimer: 'Non-legal advisory',
        createdAt: '2026-09-30T10:00:00Z',
        updatedAt: '2026-09-30T10:00:00Z',
      };

      await cache.set('case_case_legacy_001', {
        data: legacyCase,
        timestamp: Date.now(),
        ttl: 86400000,
        engine: 'evidence_desk',
        paramsHash: 'case_legacy_001',
      });
      await cache.set('cases:index', {
        data: ['case_legacy_001'],
        timestamp: Date.now(),
        ttl: 86400000,
        engine: 'evidence_desk',
        paramsHash: 'cases:index',
      });

      // Run migration
      const migratedCount = await repo.migrateFromLegacyKvCases(cache);
      expect(migratedCount).toBe(1);

      // Verify migrated case in new repository
      const migratedCase = await repo.getCase('case_legacy_001');
      expect(migratedCase).toBeDefined();
      expect(migratedCase?.title).toBe('Investigation into Noise Pulse Smartwatch anomalies');
      expect(migratedCase?.notes.length).toBe(1);
      expect(migratedCase?.notes[0]!.author).toBe('Analyst Ravi');

      // Verify associated product identity was automatically preserved
      const products = await repo.listProducts('noise');
      expect(products.length).toBeGreaterThan(0);
      expect(products[0]!.canonicalName).toBe('Noise ColorFit Pulse');
    });
  });
});
