import { describe, it, expect, beforeEach } from 'vitest';
import app from '../src/index';
import { clearSharedCache } from '../src/lib/cache';
import { isVariantMismatch, classifyMatchSource } from '../src/lib/normalization';

describe('Stage 1 Regression - Investigation Results, Heuristics, & Variant Normalization', () => {
  beforeEach(() => {
    clearSharedCache();
  });

  describe('Investigation Results Endpoint (Issue 1)', () => {
    it('should return 404 for non-existent or expired scanId', async () => {
      const res = await app.request('/api/beacontra/results/scan_nonexistent_12345');
      expect(res.status).toBe(404);
      const json = await res.json() as { error: string };
      expect(json.error).toContain('not found or expired');
    });

    it('should persist scan result and allow subsequent retrieval by scanId', async () => {
      const scanPayload = {
        productName: 'boAt Airdopes 141',
        officialImageUrl: 'https://images.unsplash.com/photo-sample.jpg',
        mrp: 4490,
        expectedPriceRange: { min: 1000, max: 1500 },
      };

      // 1. Run scan
      const scanRes = await app.request('/api/beacontra/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scanPayload),
      });

      expect(scanRes.status).toBe(200);
      const scanData = await scanRes.json() as { data: { scanId: string; productName: string }; meta: { scanId: string } };
      const scanId = scanData.data.scanId;
      expect(scanId).toBeDefined();

      // 2. Retrieve scan results using GET /api/beacontra/results/:scanId
      const getRes = await app.request(`/api/beacontra/results/${scanId}`);
      expect(getRes.status).toBe(200);
      const retrieved = await getRes.json() as {
        data: { scanId: string; productName: string; results: unknown[] };
        meta: { scanId: string; cachedAt: string };
      };

      expect(retrieved.data.scanId).toBe(scanId);
      expect(retrieved.data.productName).toBe('boAt Airdopes 141');
      expect(retrieved.meta.scanId).toBe(scanId);
      expect(retrieved.meta.cachedAt).toBeDefined();
    });
  });

  describe('Security & SSRF Verification on Scan Endpoint (Issue 4)', () => {
    it('should reject SSRF attempts with private or metadata IPs', async () => {
      const maliciousPayload = {
        productName: 'boAt Airdopes 141',
        officialImageUrl: 'http://169.254.169.254/latest/meta-data/',
      };

      const res = await app.request('/api/beacontra/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(maliciousPayload),
      });

      expect(res.status).toBe(400);
      const json = await res.json() as { error: string };
      expect(json.error).toContain('Invalid officialImageUrl');
    });

    it('should provide proper CORS headers for browser extensions and frontends', async () => {
      const res = await app.request('/health', {
        method: 'OPTIONS',
        headers: {
          Origin: 'chrome-extension://abcdefghijklmnop',
          'Access-Control-Request-Method': 'POST',
        },
      });

      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('chrome-extension://abcdefghijklmnop');
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });
  });

  describe('Product Variant Normalization', () => {
    it('should detect accessory titles as variant mismatches', () => {
      const res1 = isVariantMismatch('Silicone Case Cover for boAt Airdopes 141', 'boAt Airdopes 141');
      expect(res1.isMismatch).toBe(true);
      expect(res1.reason).toBe('accessory');

      const res2 = isVariantMismatch('Replacement Ear Tips for boAt Airdopes 141', 'boAt Airdopes 141');
      expect(res2.isMismatch).toBe(true);
      expect(res2.reason).toBe('accessory');
    });

    it('should detect hardware SKU tier differences (ANC, Pro, Lite, Ultra)', () => {
      const res = isVariantMismatch('boAt Airdopes 141 ANC TWS Earbuds', 'boAt Airdopes 141');
      expect(res.isMismatch).toBe(true);
      expect(res.reason).toBe('hardware_tier');
    });

    it('should detect version generation differences (Gen 2, V2)', () => {
      const res = isVariantMismatch('boAt Airdopes 141 Gen 2', 'boAt Airdopes 141');
      expect(res.isMismatch).toBe(true);
      expect(res.reason).toBe('version_generation');
    });

    it('should allow legitimate color/cosmetic variants without mismatch', () => {
      const res1 = isVariantMismatch('boAt Airdopes 141 Bold Black', 'boAt Airdopes 141');
      expect(res1.isMismatch).toBe(false);

      const res2 = isVariantMismatch('boAt Airdopes 141 Cider Cyan', 'boAt Airdopes 141');
      expect(res2.isMismatch).toBe(false);
    });

    it('should detect storage capacity mismatches', () => {
      const res = isVariantMismatch('Apple iPhone 15 256GB Black', 'Apple iPhone 15 128GB');
      expect(res.isMismatch).toBe(true);
      expect(res.reason).toBe('capacity');
    });
  });

  describe('Source Identity Classification (Issue 2)', () => {
    it('should identify authorized retailers without requiring literal "official" substring', () => {
      const classification = classifyMatchSource(
        'Amazon.in',
        'https://www.amazon.in/dp/B09N3ZNHTY',
        'boAt Airdopes 141',
        ['Amazon', 'Flipkart', 'Croma'],
        'https://www.boat-lifestyle.com/images/141.png'
      );

      expect(classification.isAuthorizedSeller).toBe(true);
      expect(classification.isKnownSafeChannel).toBe(true);
      expect(classification.matchType).toBe('authorized_retailer');
    });

    it('should identify official brand domains', () => {
      const classification = classifyMatchSource(
        'boAt Lifestyle',
        'https://www.boat-lifestyle.com/products/airdopes-141',
        'boAt Airdopes 141',
        ['Amazon'],
        'https://www.boat-lifestyle.com/images/141.png'
      );

      expect(classification.isOfficialBrand).toBe(true);
      expect(classification.isKnownSafeChannel).toBe(true);
      expect(classification.matchType).toBe('official_brand');
    });

    it('should classify unverified third-party domains outside authorized channels', () => {
      const classification = classifyMatchSource(
        'RandomShop99',
        'https://randomshop99.xyz/item/123',
        'boAt Airdopes 141',
        ['Amazon', 'Flipkart'],
        'https://www.boat-lifestyle.com/images/141.png'
      );

      expect(classification.isOfficialBrand).toBe(false);
      expect(classification.isAuthorizedSeller).toBe(false);
      expect(classification.isKnownSafeChannel).toBe(false);
      expect(classification.matchType).toBe('unverified_third_party');
    });
  });
});
