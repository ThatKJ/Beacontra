/**
 * Beacontra OS — Brand DNA Module
 * 
 * Reusable brand specifications, SKU catalogs, variant mappings,
 * product identity normalization, user corrections, and comparison evaluation.
 */

import type { CacheAdapter } from './types';
import { isSafePublicUrl } from './security';

export interface BrandProfile {
  id: string;
  name: string;
  slug: string;
  officialDomains: string[];
  description?: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  sku: string;
  name: string;
  attributes: {
    color?: string;
    storage?: string;
    connectivity?: string;
    edition?: string;
    generation?: string;
    [key: string]: string | undefined;
  };
  officialImageUrl?: string;
  mrp?: number;
  expectedPriceRange?: { min: number; max: number };
}

export interface UserCorrection {
  id: string;
  listingTitle: string;
  correctionType: 'incompatible_variant' | 'comparable_variant' | 'exact_match' | 'accessory_exclusion';
  targetSku?: string;
  reason: string;
  createdAt: string;
}

export interface ProductProfile {
  id: string;
  brandId: string;
  brandName: string;
  productName: string;
  modelNumber?: string;
  category?: string;
  canonicalImageUrl: string;
  referenceImages: string[];
  variants: ProductVariant[];
  statutoryMrp?: number;
  expectedPriceRange?: { min: number; max: number };
  authorizedSellers: string[];
  attributes: {
    formFactor?: string;
    releaseYear?: number;
    targetMarket?: string;
    [key: string]: unknown;
  };
  userCorrections: UserCorrection[];
  createdAt: string;
  updatedAt: string;
}

export type ProductComparisonMatchType =
  | 'exact_product'
  | 'comparable_cosmetic_variant'
  | 'incompatible_hardware_tier'
  | 'incompatible_generation'
  | 'incompatible_storage'
  | 'accessory_mismatch'
  | 'user_corrected_incompatible'
  | 'unresolved_similarity';

export interface ProductComparisonEvaluation {
  isComparable: boolean;
  matchType: ProductComparisonMatchType;
  confidence: 'high' | 'medium' | 'low';
  explanation: string;
  matchedVariantSku?: string;
  detectedAttributes: {
    isAccessory: boolean;
    hardwareTierMismatch?: string;
    generationMismatch?: string;
    storageMismatch?: string;
    colorVariant?: string;
  };
}

export interface CreateBrandInput {
  name: string;
  officialDomains: string[];
  description?: string;
  logoUrl?: string;
}

export interface CreateProductInput {
  brandId: string;
  productName: string;
  modelNumber?: string;
  category?: string;
  canonicalImageUrl: string;
  referenceImages?: string[];
  variants?: ProductVariant[];
  statutoryMrp?: number;
  expectedPriceRange?: { min: number; max: number };
  authorizedSellers?: string[];
  attributes?: Record<string, unknown>;
}

export interface UpdateProductInput {
  productName?: string;
  modelNumber?: string;
  category?: string;
  canonicalImageUrl?: string;
  referenceImages?: string[];
  variants?: ProductVariant[];
  statutoryMrp?: number;
  expectedPriceRange?: { min: number; max: number };
  authorizedSellers?: string[];
  attributes?: Record<string, unknown>;
}

const ACCESSORY_TERMS = [
  'case cover',
  'protective case',
  'silicone case',
  'pouch',
  'skin cover',
  'charging cable',
  'replacement cable',
  'ear tips',
  'cushion pad',
  'lanyard',
  'adapter',
  'screen protector',
  'tempered glass',
  'carrying strap',
  'dock only',
];

const HARDWARE_TIERS = [
  'anc',
  'active noise cancellation',
  'pro',
  'max',
  'elite',
  'ultra',
  'plus',
  'lite',
  'mini',
];

const GENERATION_PATTERNS = [
  /\bgen(?:eration)?\s*([0-9]+)\b/i,
  /\bv([0-9]+)\b/i,
  /\bversion\s*([0-9]+)\b/i,
  /\b([0-9]+)(?:st|nd|rd|th)\s*gen\b/i,
];

const STORAGE_PATTERNS = [
  /\b(32|64|128|256|512)\s*gb\b/i,
  /\b(1|2)\s*tb\b/i,
];

/**
 * Service managing Brand DNA identity, product catalogs, and identity normalization
 */
export class BrandDnaService {
  constructor(private cache: CacheAdapter) {}

  private static readonly BRAND_PREFIX = 'dna:brand:';
  private static readonly PRODUCT_PREFIX = 'dna:product:';
  private static readonly BRAND_INDEX = 'dna:brands:index';
  private static readonly PRODUCT_INDEX = 'dna:products:index';
  private static readonly TTL_MS = 365 * 24 * 60 * 60 * 1000; // 1 year durable TTL

  // ===================== BRANDS =====================

  async createBrand(input: CreateBrandInput): Promise<BrandProfile> {
    if (!input.name || typeof input.name !== 'string') {
      throw new Error('Brand name is required');
    }

    const id = `brand_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const slug = input.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const now = new Date().toISOString();
    const brand: BrandProfile = {
      id,
      name: input.name.trim(),
      slug,
      officialDomains: Array.isArray(input.officialDomains) ? input.officialDomains.map(d => d.toLowerCase().trim()) : [],
      description: input.description,
      logoUrl: input.logoUrl,
      createdAt: now,
      updatedAt: now,
    };

    await this.cache.set(`${BrandDnaService.BRAND_PREFIX}${id}`, {
      data: brand,
      timestamp: Date.now(),
      ttl: BrandDnaService.TTL_MS,
      engine: 'brand_dna',
      paramsHash: id,
    });

    await this.addToIndex(BrandDnaService.BRAND_INDEX, id);
    return brand;
  }

  async getBrand(brandId: string): Promise<BrandProfile | null> {
    try {
      const entry = await this.cache.get<BrandProfile>(`${BrandDnaService.BRAND_PREFIX}${brandId}`);
      if (!entry || !entry.data || typeof entry.data !== 'object') return null;
      return entry.data;
    } catch {
      return null;
    }
  }

  async listBrands(): Promise<BrandProfile[]> {
    const indexEntry = await this.cache.get<string[]>(BrandDnaService.BRAND_INDEX);
    const ids = Array.isArray(indexEntry?.data) ? indexEntry.data : [];
    const brands = await Promise.all(ids.map(id => this.getBrand(id)));
    return brands
      .filter((b): b is BrandProfile => b !== null)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  // ===================== PRODUCTS =====================

  async createProduct(input: CreateProductInput): Promise<ProductProfile> {
    if (!input.productName || typeof input.productName !== 'string') {
      throw new Error('Product name is required');
    }
    if (!input.canonicalImageUrl || typeof input.canonicalImageUrl !== 'string') {
      throw new Error('Canonical image URL is required');
    }

    const urlCheck = isSafePublicUrl(input.canonicalImageUrl);
    if (!urlCheck.isSafe) {
      throw new Error(`Invalid canonicalImageUrl: ${urlCheck.reason}`);
    }

    let brandName = 'Independent Brand';
    if (input.brandId) {
      const brand = await this.getBrand(input.brandId);
      if (brand) brandName = brand.name;
    }

    const id = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const product: ProductProfile = {
      id,
      brandId: input.brandId,
      brandName,
      productName: input.productName.trim(),
      modelNumber: input.modelNumber?.trim(),
      category: input.category?.trim() || 'General',
      canonicalImageUrl: input.canonicalImageUrl.trim(),
      referenceImages: Array.isArray(input.referenceImages) ? input.referenceImages : [],
      variants: Array.isArray(input.variants) ? input.variants : [],
      statutoryMrp: input.statutoryMrp,
      expectedPriceRange: input.expectedPriceRange,
      authorizedSellers: Array.isArray(input.authorizedSellers) ? input.authorizedSellers : [],
      attributes: input.attributes || {},
      userCorrections: [],
      createdAt: now,
      updatedAt: now,
    };

    await this.cache.set(`${BrandDnaService.PRODUCT_PREFIX}${id}`, {
      data: product,
      timestamp: Date.now(),
      ttl: BrandDnaService.TTL_MS,
      engine: 'product_dna',
      paramsHash: id,
    });

    await this.addToIndex(BrandDnaService.PRODUCT_INDEX, id);
    return product;
  }

  async getProduct(productId: string): Promise<ProductProfile | null> {
    try {
      const entry = await this.cache.get<ProductProfile>(`${BrandDnaService.PRODUCT_PREFIX}${productId}`);
      if (!entry || !entry.data || typeof entry.data !== 'object') return null;
      return entry.data;
    } catch {
      return null;
    }
  }

  async listProducts(filter?: { brandId?: string; search?: string }): Promise<ProductProfile[]> {
    const indexEntry = await this.cache.get<string[]>(BrandDnaService.PRODUCT_INDEX);
    const ids = Array.isArray(indexEntry?.data) ? indexEntry.data : [];

    const products = await Promise.all(ids.map(id => this.getProduct(id)));
    const results: ProductProfile[] = [];

    for (const p of products) {
      if (!p) continue;
      if (filter?.brandId && p.brandId !== filter.brandId) continue;
      if (filter?.search) {
        const q = filter.search.toLowerCase();
        const matchesName = p.productName.toLowerCase().includes(q);
        const matchesBrand = p.brandName.toLowerCase().includes(q);
        const matchesModel = p.modelNumber?.toLowerCase().includes(q);
        if (!matchesName && !matchesBrand && !matchesModel) continue;
      }
      results.push(p);
    }

    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async updateProduct(productId: string, updates: UpdateProductInput): Promise<ProductProfile | null> {
    const existing = await this.getProduct(productId);
    if (!existing) return null;

    if (updates.canonicalImageUrl) {
      const check = isSafePublicUrl(updates.canonicalImageUrl);
      if (!check.isSafe) {
        throw new Error(`Invalid canonicalImageUrl: ${check.reason}`);
      }
    }

    const updated: ProductProfile = {
      ...existing,
      productName: updates.productName?.trim() ?? existing.productName,
      modelNumber: updates.modelNumber?.trim() ?? existing.modelNumber,
      category: updates.category?.trim() ?? existing.category,
      canonicalImageUrl: updates.canonicalImageUrl?.trim() ?? existing.canonicalImageUrl,
      referenceImages: updates.referenceImages ?? existing.referenceImages,
      variants: updates.variants ?? existing.variants,
      statutoryMrp: updates.statutoryMrp ?? existing.statutoryMrp,
      expectedPriceRange: updates.expectedPriceRange ?? existing.expectedPriceRange,
      authorizedSellers: updates.authorizedSellers ?? existing.authorizedSellers,
      attributes: updates.attributes ?? existing.attributes,
      updatedAt: new Date().toISOString(),
    };

    await this.cache.set(`${BrandDnaService.PRODUCT_PREFIX}${productId}`, {
      data: updated,
      timestamp: Date.now(),
      ttl: BrandDnaService.TTL_MS,
      engine: 'product_dna',
      paramsHash: productId,
    });

    return updated;
  }

  async addUserCorrection(
    productId: string,
    correction: Omit<UserCorrection, 'id' | 'createdAt'>
  ): Promise<ProductProfile | null> {
    const existing = await this.getProduct(productId);
    if (!existing) return null;

    const newCorrection: UserCorrection = {
      id: `corr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      listingTitle: correction.listingTitle.trim(),
      correctionType: correction.correctionType,
      targetSku: correction.targetSku,
      reason: correction.reason.trim(),
      createdAt: new Date().toISOString(),
    };

    existing.userCorrections.push(newCorrection);
    existing.updatedAt = new Date().toISOString();

    await this.cache.set(`${BrandDnaService.PRODUCT_PREFIX}${productId}`, {
      data: existing,
      timestamp: Date.now(),
      ttl: BrandDnaService.TTL_MS,
      engine: 'product_dna',
      paramsHash: productId,
    });

    return existing;
  }

  // ===================== PRODUCT IDENTITY NORMALIZATION =====================

  /**
   * Evaluates whether a marketplace listing is strictly comparable to this product profile.
   * Differentiates cosmetic variants (acceptable) from hardware tiers, generations, and accessories (incompatible).
   * Honors user-persisted corrections.
   */
  evaluateListingMatch(profile: ProductProfile, listingTitle: string): ProductComparisonEvaluation {
    const cleanTitle = listingTitle.toLowerCase().trim();
    const cleanTarget = profile.productName.toLowerCase().trim();

    // 1. Check User Corrections First (Precedence)
    const exactCorrection = profile.userCorrections.find(
      c => c.listingTitle.toLowerCase() === cleanTitle || cleanTitle.includes(c.listingTitle.toLowerCase())
    );
    if (exactCorrection) {
      if (exactCorrection.correctionType === 'incompatible_variant' || exactCorrection.correctionType === 'accessory_exclusion') {
        return {
          isComparable: false,
          matchType: 'user_corrected_incompatible',
          confidence: 'high',
          explanation: `Explicit user correction: Marked incompatible ("${exactCorrection.reason}")`,
          matchedVariantSku: exactCorrection.targetSku,
          detectedAttributes: { isAccessory: exactCorrection.correctionType === 'accessory_exclusion' },
        };
      }
      if (exactCorrection.correctionType === 'exact_match' || exactCorrection.correctionType === 'comparable_variant') {
        return {
          isComparable: true,
          matchType: 'exact_product',
          confidence: 'high',
          explanation: `Explicit user correction: Confirmed comparable ("${exactCorrection.reason}")`,
          matchedVariantSku: exactCorrection.targetSku,
          detectedAttributes: { isAccessory: false },
        };
      }
    }

    // 2. Accessory Detection
    for (const term of ACCESSORY_TERMS) {
      if (cleanTitle.includes(term) && !cleanTarget.includes(term)) {
        return {
          isComparable: false,
          matchType: 'accessory_mismatch',
          confidence: 'high',
          explanation: `Listing is an accessory or protection component ("${term}"), not the primary product`,
          detectedAttributes: { isAccessory: true },
        };
      }
    }

    // 3. Hardware SKU Tier Mismatch (ANC, Pro, Lite, Ultra, Max)
    for (const tier of HARDWARE_TIERS) {
      const tierInTitle = new RegExp(`\\b${tier}\\b`, 'i').test(cleanTitle);
      const tierInTarget = new RegExp(`\\b${tier}\\b`, 'i').test(cleanTarget);
      if (tierInTitle && !tierInTarget) {
        return {
          isComparable: false,
          matchType: 'incompatible_hardware_tier',
          confidence: 'high',
          explanation: `Listing is a distinct hardware tier ("${tier.toUpperCase()}"), which cannot be combined into baseline pricing`,
          detectedAttributes: { isAccessory: false, hardwareTierMismatch: tier },
        };
      }
    }

    // 4. Generation / Version Mismatch (Gen 2 vs Gen 1)
    for (const pattern of GENERATION_PATTERNS) {
      const titleGen = cleanTitle.match(pattern);
      const targetGen = cleanTarget.match(pattern);
      if (titleGen && !targetGen) {
        return {
          isComparable: false,
          matchType: 'incompatible_generation',
          confidence: 'high',
          explanation: `Listing indicates a specific product generation (${titleGen[0]}), incompatible with base version`,
          detectedAttributes: { isAccessory: false, generationMismatch: titleGen[0] },
        };
      }
      if (titleGen && targetGen && titleGen[1] !== targetGen[1]) {
        return {
          isComparable: false,
          matchType: 'incompatible_generation',
          confidence: 'high',
          explanation: `Generation mismatch: Listing is Gen ${titleGen[1]} while target product is Gen ${targetGen[1]}`,
          detectedAttributes: { isAccessory: false, generationMismatch: titleGen[0] },
        };
      }
    }

    // 5. Storage Capacity Mismatch (e.g. 128GB vs 256GB)
    for (const pattern of STORAGE_PATTERNS) {
      const titleStorage = cleanTitle.match(pattern);
      const targetStorage = cleanTarget.match(pattern);
      if (titleStorage && targetStorage && titleStorage[0].toLowerCase() !== targetStorage[0].toLowerCase()) {
        return {
          isComparable: false,
          matchType: 'incompatible_storage',
          confidence: 'high',
          explanation: `Storage configuration differs: Listing is ${titleStorage[0]} while target is ${targetStorage[0]}`,
          detectedAttributes: { isAccessory: false, storageMismatch: titleStorage[0] },
        };
      }
    }

    // 6. Registered Product Variant Matching (Colors / Cosmetic SKU)
    for (const variant of profile.variants) {
      if (variant.attributes.color && cleanTitle.includes(variant.attributes.color.toLowerCase())) {
        return {
          isComparable: true,
          matchType: 'comparable_cosmetic_variant',
          confidence: 'high',
          explanation: `Matches authorized color variant "${variant.attributes.color}" (SKU: ${variant.sku})`,
          matchedVariantSku: variant.sku,
          detectedAttributes: { isAccessory: false, colorVariant: variant.attributes.color },
        };
      }
    }

    // 7. General Comparable Match
    return {
      isComparable: true,
      matchType: 'exact_product',
      confidence: 'medium',
      explanation: 'Title aligns with target product name and retains compatible specifications',
      detectedAttributes: { isAccessory: false },
    };
  }

  private async addToIndex(indexKey: string, id: string): Promise<void> {
    const entry = await this.cache.get<string[]>(indexKey);
    const ids = Array.isArray(entry?.data) ? entry.data : [];
    if (!ids.includes(id)) {
      ids.unshift(id);
      await this.cache.set(indexKey, {
        data: ids,
        timestamp: Date.now(),
        ttl: BrandDnaService.TTL_MS,
        engine: 'brand_dna_index',
        paramsHash: indexKey,
      });
    }
  }
}
