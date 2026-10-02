import { describe, it, expect, beforeEach } from 'vitest';
import app from '../src/index';
import { clearSharedCache, MemoryCache } from '../src/lib/cache';
import {
  BrandDnaService,
  type ProductProfile,
  type BrandProfile,
} from '../src/lib/brand-dna';

describe('Milestone 1 — Brand DNA & Identity Normalization', () => {
  let memoryCache: MemoryCache;
  let service: BrandDnaService;

  beforeEach(() => {
    clearSharedCache();
    memoryCache = new MemoryCache();
    service = new BrandDnaService(memoryCache);
  });

  describe('Brand Profile Management', () => {
    it('should register and retrieve a brand profile', async () => {
      const brand = await service.createBrand({
        name: 'boAt Lifestyle',
        officialDomains: ['boat-lifestyle.com', 'boat.in'],
        description: 'Indian consumer audio and wearables brand',
      });

      expect(brand.id).toMatch(/^brand_/);
      expect(brand.name).toBe('boAt Lifestyle');
      expect(brand.slug).toBe('boat-lifestyle');
      expect(brand.officialDomains).toContain('boat-lifestyle.com');

      const retrieved = await service.getBrand(brand.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(brand.id);
    });

    it('should list registered brands', async () => {
      await service.createBrand({ name: 'Apple', officialDomains: ['apple.com'] });
      await service.createBrand({ name: 'boAt', officialDomains: ['boat-lifestyle.com'] });

      const list = await service.listBrands();
      expect(list.length).toBe(2);
      expect(list.map(b => b.name)).toEqual(['Apple', 'boAt']);
    });
  });

  describe('Product Profile Management & Persistence', () => {
    let brand: BrandProfile;

    beforeEach(async () => {
      brand = await service.createBrand({
        name: 'boAt',
        officialDomains: ['boat-lifestyle.com'],
      });
    });

    it('should create a product with SKU variants, price bands, and authorized sellers', async () => {
      const product = await service.createProduct({
        brandId: brand.id,
        productName: 'boAt Airdopes 141',
        modelNumber: 'AD141',
        category: 'TWS Earbuds',
        canonicalImageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df',
        statutoryMrp: 4490,
        expectedPriceRange: { min: 1000, max: 1500 },
        authorizedSellers: ['Appario Retail Private Ltd', 'boAt Official'],
        variants: [
          { sku: 'AD141-BLK', name: 'Bold Black', attributes: { color: 'Bold Black' } },
          { sku: 'AD141-BLU', name: 'Cyan Cider', attributes: { color: 'Cyan Cider' } },
        ],
      });

      expect(product.id).toMatch(/^prod_/);
      expect(product.brandName).toBe('boAt');
      expect(product.productName).toBe('boAt Airdopes 141');
      expect(product.variants.length).toBe(2);

      const retrieved = await service.getProduct(product.id);
      expect(retrieved?.statutoryMrp).toBe(4490);
      expect(retrieved?.expectedPriceRange?.min).toBe(1000);
    });

    it('should reject unsafe or SSRF canonical image URLs during product creation', async () => {
      await expect(
        service.createProduct({
          brandId: brand.id,
          productName: 'Malicious Product',
          canonicalImageUrl: 'http://169.254.169.254/latest/meta-data/',
        })
      ).rejects.toThrow(/Invalid canonicalImageUrl/);

      await expect(
        service.createProduct({
          brandId: brand.id,
          productName: 'Loopback Product',
          canonicalImageUrl: 'http://127.0.0.1/logo.png',
        })
      ).rejects.toThrow(/Invalid canonicalImageUrl/);
    });

    it('should update product profile fields', async () => {
      const product = await service.createProduct({
        brandId: brand.id,
        productName: 'boAt Rockerz 450',
        canonicalImageUrl: 'https://images.unsplash.com/headphones.jpg',
        statutoryMrp: 3990,
      });

      const updated = await service.updateProduct(product.id, {
        statutoryMrp: 3499,
        expectedPriceRange: { min: 1199, max: 1499 },
      });

      expect(updated?.statutoryMrp).toBe(3499);
      expect(updated?.expectedPriceRange?.min).toBe(1199);
    });
  });

  describe('Intelligent Product Identity Normalization', () => {
    let profile: ProductProfile;

    beforeEach(async () => {
      const brand = await service.createBrand({ name: 'boAt', officialDomains: ['boat-lifestyle.com'] });
      profile = await service.createProduct({
        brandId: brand.id,
        productName: 'boAt Airdopes 141',
        modelNumber: 'AD141',
        canonicalImageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df',
        statutoryMrp: 4490,
        expectedPriceRange: { min: 1000, max: 1500 },
        variants: [
          { sku: 'AD141-BLK', name: 'Bold Black', attributes: { color: 'Black' } },
          { sku: 'AD141-WHT', name: 'Pure White', attributes: { color: 'White' } },
        ],
      });
    });

    it('should recognize exact product matches as comparable', () => {
      const evalResult = service.evaluateListingMatch(profile, 'boAt Airdopes 141 Bluetooth Truly Wireless in Ear Earbuds');
      expect(evalResult.isComparable).toBe(true);
      expect(evalResult.matchType).toBe('exact_product');
      expect(evalResult.detectedAttributes.isAccessory).toBe(false);
    });

    it('should recognize registered cosmetic/color variants as comparable', () => {
      const evalResult = service.evaluateListingMatch(profile, 'boAt Airdopes 141 TWS Earbuds (Black)');
      expect(evalResult.isComparable).toBe(true);
      expect(evalResult.matchType).toBe('comparable_cosmetic_variant');
      expect(evalResult.matchedVariantSku).toBe('AD141-BLK');
    });

    it('should identify accessory listings and reject them as incompatible', () => {
      const eval1 = service.evaluateListingMatch(profile, 'Silicone Case Cover for boAt Airdopes 141 with Keychain Hook');
      expect(eval1.isComparable).toBe(false);
      expect(eval1.matchType).toBe('accessory_mismatch');
      expect(eval1.detectedAttributes.isAccessory).toBe(true);

      const eval2 = service.evaluateListingMatch(profile, 'boAt Airdopes 141 Replacement Ear Tips Cushion Pad');
      expect(eval2.isComparable).toBe(false);
      expect(eval2.matchType).toBe('accessory_mismatch');
    });

    it('should identify hardware SKU tier differences (ANC, Pro, Elite) as incompatible', () => {
      const eval1 = service.evaluateListingMatch(profile, 'boAt Airdopes 141 ANC with 32dB Active Noise Cancellation');
      expect(eval1.isComparable).toBe(false);
      expect(eval1.matchType).toBe('incompatible_hardware_tier');
      expect(eval1.detectedAttributes.hardwareTierMismatch).toBe('anc');

      const eval2 = service.evaluateListingMatch(profile, 'boAt Airdopes 141 Pro Gaming Edition');
      expect(eval2.isComparable).toBe(false);
      expect(eval2.matchType).toBe('incompatible_hardware_tier');
      expect(eval2.detectedAttributes.hardwareTierMismatch).toBe('pro');
    });

    it('should identify version and generation differences as incompatible', () => {
      const eval1 = service.evaluateListingMatch(profile, 'boAt Airdopes 141 Gen 2 TWS Wireless Earbuds');
      expect(eval1.isComparable).toBe(false);
      expect(eval1.matchType).toBe('incompatible_generation');
      expect(eval1.detectedAttributes.generationMismatch).toMatch(/gen 2/i);
    });

    it('should respect user corrections and persist overrides for future evaluations', async () => {
      // Initially, a tricky title might appear comparable
      const trickyTitle = 'boAt Airdopes 141 Limited Collector Tin Box Edition';
      const initialEval = service.evaluateListingMatch(profile, trickyTitle);
      expect(initialEval.isComparable).toBe(true);

      // User submits an explicit correction
      const updatedProfile = await service.addUserCorrection(profile.id, {
        listingTitle: trickyTitle,
        correctionType: 'incompatible_variant',
        reason: 'Special promotional box includes branded speaker accessory and costs ₹3,999',
      });

      expect(updatedProfile?.userCorrections.length).toBe(1);

      // Re-evaluating now respects user correction
      const correctedEval = service.evaluateListingMatch(updatedProfile!, trickyTitle);
      expect(correctedEval.isComparable).toBe(false);
      expect(correctedEval.matchType).toBe('user_corrected_incompatible');
      expect(correctedEval.explanation).toContain('Explicit user correction');
    });
  });

  describe('Brand DNA HTTP API Endpoints', () => {
    it('should create and list brands via /api/brand-dna/brands', async () => {
      const res = await app.request('/api/brand-dna/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Noise',
          officialDomains: ['gonoise.com'],
          description: 'Indian smart wearables brand',
        }),
      });

      expect(res.status).toBe(201);
      const data = (await res.json()) as { data: BrandProfile };
      expect(data.data.name).toBe('Noise');

      const listRes = await app.request('/api/brand-dna/brands');
      expect(listRes.status).toBe(200);
      const listData = (await listRes.json()) as { count: number };
      expect(listData.count).toBeGreaterThanOrEqual(1);
    });

    it('should create product, evaluate listing match, and add user correction via HTTP API', async () => {
      // 1. Create Brand
      const brandRes = await app.request('/api/brand-dna/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Apple', officialDomains: ['apple.com'] }),
      });
      const brand = ((await brandRes.json()) as { data: BrandProfile }).data;

      // 2. Create Product Profile
      const prodRes = await app.request('/api/brand-dna/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: brand.id,
          productName: 'Apple iPhone 15',
          modelNumber: 'A3090',
          canonicalImageUrl: 'https://images.unsplash.com/iphone15.jpg',
          statutoryMrp: 79900,
          expectedPriceRange: { min: 72000, max: 79900 },
          attributes: { storage: '128GB' },
        }),
      });

      expect(prodRes.status).toBe(201);
      const product = ((await prodRes.json()) as { data: ProductProfile }).data;

      // 3. Evaluate an accessory via API
      const evalRes1 = await app.request(`/api/brand-dna/products/${product.id}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingTitle: 'Silicone Case Cover for Apple iPhone 15' }),
      });
      expect(evalRes1.status).toBe(200);
      const evalData1 = (await evalRes1.json()) as { data: { isComparable: boolean; matchType: string } };
      expect(evalData1.data.isComparable).toBe(false);
      expect(evalData1.data.matchType).toBe('accessory_mismatch');

      // 4. Submit user correction via API
      const corrRes = await app.request(`/api/brand-dna/products/${product.id}/corrections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingTitle: 'Apple iPhone 15 Dummy Display Unit',
          correctionType: 'incompatible_variant',
          reason: 'Non-working retail dummy display model',
        }),
      });
      expect(corrRes.status).toBe(201);

      // 5. Verify correction works on evaluate endpoint
      const evalRes2 = await app.request(`/api/brand-dna/products/${product.id}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingTitle: 'Apple iPhone 15 Dummy Display Unit' }),
      });
      expect(evalRes2.status).toBe(200);
      const evalData2 = (await evalRes2.json()) as { data: { isComparable: boolean; matchType: string } };
      expect(evalData2.data.isComparable).toBe(false);
      expect(evalData2.data.matchType).toBe('user_corrected_incompatible');
    });
  });
});
