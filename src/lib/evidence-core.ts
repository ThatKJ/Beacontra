/**
 * Beacontra Unified Evidence Foundation
 * 
 * Defines unified data models and repository abstractions for:
 * - Product identity
 * - Marketplace listings
 * - Marketplace sources
 * - Merchant identity (when actually available)
 * - Visual evidence (Lens match lineages, cryptographic integrity digest)
 * - Commercial evidence (price variance & legitimate discount classification)
 * - Search observations (provenance & query parameters)
 * - Derived inferences (explainable signals with explicit uncertainties)
 * - Investigation cases (formal cases with multi-listing references)
 * - Historical scan snapshots (for Watchtower tracking)
 * 
 * CRITICAL ADVISORY:
 * SHA-256 integrity digests guarantee data record immutability.
 * A cryptographic digest does NOT constitute proof of physical or legal product authenticity.
 */

import type { CacheAdapter } from './types';
import type { InvestigationCase as LegacyCase } from './evidence-desk';

export const INTEGRITY_NOTICE =
  'DATA INTEGRITY NOTICE: Cryptographic digests (SHA-256) verify payload immutability ' +
  'and retrieval provenance. They do NOT establish legal authenticity, trademark validity, ' +
  'or legitimate manufacturing origins.';

// 1. Product Identity
export interface ProductIdentity {
  id: string; // e.g. "prod_boat_141"
  brandId: string;
  canonicalName: string;
  modelNumber?: string;
  category?: string;
  canonicalImageUrls: string[];
  mrp: number;
  currency: string;
  expectedPriceRange?: { min: number; max: number };
  authorizedSellers: string[];
  createdAt: string;
  updatedAt: string;
}

// 2. Marketplace Listing
export interface MarketplaceListing {
  id: string; // deterministic "lst_<hash>"
  targetProductId?: string; // Foreign key to TargetProductProfile if associated
  source: string; // e.g., "Amazon.in", "Flipkart"
  marketplace: string; // e.g., "amazon", "google_shopping"
  externalId?: string;
  title: string;
  url: string;
  cleanUrl: string; // URL stripped of tracking/affiliate params
  extractedPrice: number;
  originalPriceText: string;
  currency: string;
  sellerName: string;
  merchantId?: string; // Foreign key to MerchantIdentity if resolved
  imageUrl: string;
  rating?: number;
  reviewCount?: number;
  availabilityStatus?: string;
  createdAt: string;
  updatedAt: string;
}

// 3. Marketplace Source
export interface MarketplaceSource {
  id: string;
  name: string;
  baseDomain: string;
  country: string;
  supportedEngines: ('google_shopping' | 'google_lens' | 'amazon_product')[];
  trustedAuthorizedFlag: boolean;
}

// 4. Merchant Identity (When actually available)
export interface MerchantIdentity {
  id: string; // e.g. "merch_..."
  name: string;
  normalizedName: string;
  platform: string;
  storefrontUrl?: string;
  businessRegistrationId?: string; // e.g. GSTIN
  verificationStatus: 'authorized' | 'unauthorized' | 'unverified';
  firstObservedAt: string;
  lastObservedAt: string;
}

// 5. Visual Evidence
export interface VisualEvidence {
  id: string; // e.g. "vis_..."
  listingId: string;
  imageUrl: string;
  imageSha256?: string; // Cryptographic integrity digest
  lensEngine: 'google_lens';
  lensStatus: 'exact_match' | 'visual_match' | 'partial_match' | 'no_match' | 'unprocessed';
  matchedPages: Array<{
    title: string;
    link: string;
    source: string;
    thumbnail?: string;
  }>;
  confidenceScore: number; // 0 to 1
  retrievalTimestamp: string;
}

// 6. Commercial Evidence
export interface CommercialEvidence {
  id: string;
  listingId: string;
  productId: string;
  observedPrice: number;
  baselineMrp: number;
  variancePercent: number;
  anomalyType: 'below_mrp' | 'steep_discount' | 'price_surge' | 'normal_range';
  discountLegitimacyScore: number; // 0-100 (high = standard festive/clearance sale, low = extreme anomalous variance)
  sellerReputation: 'authorized' | 'known_retailer' | 'unauthorized_new' | 'generic_name';
  retrievalTimestamp: string;
}

// 7. Search Observation
export interface SearchObservation {
  id: string;
  scanId: string;
  engine: 'google_shopping' | 'google_lens' | 'amazon_product' | 'google_search';
  queryParameters: Record<string, unknown>;
  retrievalTimestamp: string;
  dataSource: 'live' | 'fixture' | 'cache';
  rawItemCount: number;
  requestCostCredits: number;
  provenanceHash: string;
}

// 8. Derived Inference
export interface DerivedInference {
  id: string;
  targetEntityId: string;
  entityType: 'listing' | 'merchant' | 'brand';
  signalType: 'price_anomaly' | 'visual_mismatch' | 'seller_anomaly' | 'variant_divergence';
  severity: 'high' | 'medium' | 'low' | 'info';
  supportingObservationIds: string[];
  missingEvidence: string[];
  reasoning: string;
  uncertaintyDisclaimer: string;
  confidence: number;
  createdAt: string;
}

// 9. Investigation Case
export interface InvestigationCase {
  id: string;
  caseNumber: string;
  title: string;
  productId: string;
  status: 'active' | 'under_review' | 'escalated' | 'resolved' | 'archived';
  priority: 'high' | 'medium' | 'low';
  listingIds: string[];
  notes: Array<{
    id: string;
    author: string;
    content: string;
    createdAt: string;
  }>;
  tags: string[];
  findingsSummary: string;
  legalDisclaimer: string;
  createdAt: string;
  updatedAt: string;
}

// 10. Historical Scan Snapshot
export interface HistoricalScanSnapshot {
  id: string;
  productId: string;
  scanId: string;
  timestamp: string;
  listingCount: number;
  anomalousCount: number;
  lowestObservedPrice: number;
  averageComparablePrice: number;
  listingIds: string[];
  summary: string;
  listings?: unknown[];
  productName?: string;
  brandId?: string;
  stats?: Record<string, unknown>;
  provenanceHash?: string;
}

/**
 * Computes a SHA-256 cryptographic digest for tamper-evident provenance.
 */
export async function computeIntegrityDigest(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Normalizes and strips tracking parameters from a marketplace URL.
 */
export function sanitizeListingUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    // Remove typical tracking and affiliate parameters
    const paramsToRemove = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'tag', 'linkCode', 'ref', 'ref_', 'pf_rd_r', 'pf_rd_p', 'pd_rd_r',
      'pd_rd_w', 'pd_rd_wg', 'qid', 'sr', 'dchild'
    ];
    for (const p of paramsToRemove) {
      parsed.searchParams.delete(p);
    }
    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

/**
 * Generates a deterministic listing ID from clean URL and source.
 */
export async function generateListingId(source: string, url: string): Promise<string> {
  const clean = sanitizeListingUrl(url);
  const digest = await computeIntegrityDigest(`${source.toLowerCase()}:${clean.toLowerCase()}`);
  return `lst_${digest.slice(0, 16)}`;
}

/**
 * Generates a deterministic merchant ID from platform and normalized seller name.
 */
export async function generateMerchantId(platform: string, name: string): Promise<string> {
  const norm = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const digest = await computeIntegrityDigest(`${platform.toLowerCase()}:${norm}`);
  return `merch_${digest.slice(0, 16)}`;
}

/**
 * Unified Evidence Repository Interface
 */
export interface EvidenceRepository {
  // Products
  saveProduct(product: ProductIdentity): Promise<ProductIdentity>;
  getProduct(id: string): Promise<ProductIdentity | null>;
  listProducts(brandId?: string): Promise<ProductIdentity[]>;

  // Listings
  saveListing(listing: MarketplaceListing): Promise<MarketplaceListing>;
  getListing(id: string): Promise<MarketplaceListing | null>;
  findListingByUrl(cleanUrl: string): Promise<MarketplaceListing | null>;
  listListings(query?: { merchantId?: string }): Promise<MarketplaceListing[]>;

  // Merchants
  saveMerchant(merchant: MerchantIdentity): Promise<MerchantIdentity>;
  getMerchant(id: string): Promise<MerchantIdentity | null>;
  findMerchantByName(platform: string, name: string): Promise<MerchantIdentity | null>;
  listMerchants(): Promise<MerchantIdentity[]>;

  // Visual Evidence
  saveVisualEvidence(evidence: VisualEvidence): Promise<VisualEvidence>;
  getVisualEvidenceForListing(listingId: string): Promise<VisualEvidence[]>;

  // Commercial Evidence
  saveCommercialEvidence(evidence: CommercialEvidence): Promise<CommercialEvidence>;
  getCommercialEvidenceForListing(listingId: string): Promise<CommercialEvidence[]>;

  // Search Observations
  saveSearchObservation(obs: SearchObservation): Promise<SearchObservation>;
  getSearchObservationsForScan(scanId: string): Promise<SearchObservation[]>;

  // Derived Inferences
  saveDerivedInference(inf: DerivedInference): Promise<DerivedInference>;
  getInferencesForEntity(entityId: string): Promise<DerivedInference[]>;

  // Investigation Cases
  saveCase(c: InvestigationCase): Promise<InvestigationCase>;
  getCase(id: string): Promise<InvestigationCase | null>;
  listCases(productId?: string): Promise<InvestigationCase[]>;

  // Snapshots
  saveSnapshot(snap: HistoricalScanSnapshot): Promise<HistoricalScanSnapshot>;
  getSnapshotsForProduct(productId: string): Promise<HistoricalScanSnapshot[]>;

  // Migration
  migrateFromLegacyKvCases(cache: CacheAdapter): Promise<number>;
}

/**
 * DurableEvidenceRepository
 * 
 * Works across Cloudflare Workers environments.
 * Uses structured KV storage with secondary indexes and in-memory caches,
 * ensuring high performance, zero external database locks in local dev,
 * and reliable persistence across Worker restarts.
 */
export class DurableEvidenceRepository implements EvidenceRepository {
  private cache: CacheAdapter;
  private memoryStore: Map<string, unknown> = new Map();

  // Prefix definitions
  private static readonly PFX_PRODUCT = 'ev:prod:';
  private static readonly PFX_LISTING = 'ev:lst:';
  private static readonly PFX_MERCHANT = 'ev:merch:';
  private static readonly PFX_VISUAL = 'ev:vis:';
  private static readonly PFX_COMMERCIAL = 'ev:comm:';
  private static readonly PFX_OBSERVATION = 'ev:obs:';
  private static readonly PFX_INFERENCE = 'ev:inf:';
  private static readonly PFX_CASE = 'ev:case:';
  private static readonly PFX_SNAPSHOT = 'ev:snap:';

  // Index keys
  private static readonly IDX_PRODUCTS = 'ev:idx:products';
  private static readonly IDX_LISTINGS = 'ev:idx:listings';
  private static readonly IDX_MERCHANTS = 'ev:idx:merchants';
  private static readonly IDX_CASES = 'ev:idx:cases';
  private static readonly IDX_SNAPSHOTS = 'ev:idx:snapshots';

  constructor(cache: CacheAdapter) {
    this.cache = cache;
  }

  private async getIndex(indexKey: string): Promise<string[]> {
    const cached = await this.cache.get<string[]>(indexKey);
    return cached?.data || [];
  }

  private async addToIndex(indexKey: string, id: string): Promise<void> {
    const current = await this.getIndex(indexKey);
    if (!current.includes(id)) {
      current.push(id);
      await this.cache.set(indexKey, {
        data: current,
        timestamp: Date.now(),
        ttl: 86400000 * 365,
        engine: 'evidence_repo',
        paramsHash: indexKey,
      });
    }
  }

  // --- PRODUCTS ---
  async saveProduct(product: ProductIdentity): Promise<ProductIdentity> {
    const key = `${DurableEvidenceRepository.PFX_PRODUCT}${product.id}`;
    this.memoryStore.set(key, product);
    await this.cache.set(key, {
      data: product,
      timestamp: Date.now(),
      ttl: 86400000 * 365,
      engine: 'evidence_repo',
      paramsHash: product.id,
    });
    await this.addToIndex(DurableEvidenceRepository.IDX_PRODUCTS, product.id);
    return product;
  }

  async getProduct(id: string): Promise<ProductIdentity | null> {
    const key = `${DurableEvidenceRepository.PFX_PRODUCT}${id}`;
    if (this.memoryStore.has(key)) {
      return this.memoryStore.get(key) as ProductIdentity;
    }
    const cached = await this.cache.get<ProductIdentity>(key);
    if (cached?.data) {
      this.memoryStore.set(key, cached.data);
      return cached.data;
    }
    return null;
  }

  async listProducts(brandId?: string): Promise<ProductIdentity[]> {
    const ids = await this.getIndex(DurableEvidenceRepository.IDX_PRODUCTS);
    const products: ProductIdentity[] = [];
    for (const id of ids) {
      const prod = await this.getProduct(id);
      if (prod) {
        if (!brandId || prod.brandId.toLowerCase() === brandId.toLowerCase()) {
          products.push(prod);
        }
      }
    }
    return products;
  }

  // --- LISTINGS ---
  async saveListing(listing: MarketplaceListing): Promise<MarketplaceListing> {
    const key = `${DurableEvidenceRepository.PFX_LISTING}${listing.id}`;
    this.memoryStore.set(key, listing);
    await this.cache.set(key, {
      data: listing,
      timestamp: Date.now(),
      ttl: 86400000 * 30,
      engine: 'evidence_repo',
      paramsHash: listing.id,
    });
    await this.addToIndex(DurableEvidenceRepository.IDX_LISTINGS, listing.id);
    return listing;
  }

  async getListing(id: string): Promise<MarketplaceListing | null> {
    const key = `${DurableEvidenceRepository.PFX_LISTING}${id}`;
    if (this.memoryStore.has(key)) {
      return this.memoryStore.get(key) as MarketplaceListing;
    }
    const cached = await this.cache.get<MarketplaceListing>(key);
    if (cached?.data) {
      this.memoryStore.set(key, cached.data);
      return cached.data;
    }
    return null;
  }

  async findListingByUrl(cleanUrl: string): Promise<MarketplaceListing | null> {
    const listings = await this.listListings();
    return listings.find(l => l.cleanUrl === cleanUrl) || null;
  }

  async listListings(query?: { merchantId?: string }): Promise<MarketplaceListing[]> {
    const ids = await this.getIndex(DurableEvidenceRepository.IDX_LISTINGS);
    const listings: MarketplaceListing[] = [];
    for (const id of ids) {
      const item = await this.getListing(id);
      if (item) {
        if (!query?.merchantId || item.merchantId === query.merchantId) {
          listings.push(item);
        }
      }
    }
    return listings;
  }

  // --- MERCHANTS ---
  async saveMerchant(merchant: MerchantIdentity): Promise<MerchantIdentity> {
    const key = `${DurableEvidenceRepository.PFX_MERCHANT}${merchant.id}`;
    this.memoryStore.set(key, merchant);
    await this.cache.set(key, {
      data: merchant,
      timestamp: Date.now(),
      ttl: 86400000 * 365,
      engine: 'evidence_repo',
      paramsHash: merchant.id,
    });
    await this.addToIndex(DurableEvidenceRepository.IDX_MERCHANTS, merchant.id);
    return merchant;
  }

  async getMerchant(id: string): Promise<MerchantIdentity | null> {
    const key = `${DurableEvidenceRepository.PFX_MERCHANT}${id}`;
    if (this.memoryStore.has(key)) {
      return this.memoryStore.get(key) as MerchantIdentity;
    }
    const cached = await this.cache.get<MerchantIdentity>(key);
    if (cached?.data) {
      this.memoryStore.set(key, cached.data);
      return cached.data;
    }
    return null;
  }

  async findMerchantByName(platform: string, name: string): Promise<MerchantIdentity | null> {
    const merchants = await this.listMerchants();
    const norm = name.trim().toLowerCase();
    return merchants.find(m => m.platform === platform && m.normalizedName === norm) || null;
  }

  async listMerchants(): Promise<MerchantIdentity[]> {
    const ids = await this.getIndex(DurableEvidenceRepository.IDX_MERCHANTS);
    const merchants: MerchantIdentity[] = [];
    for (const id of ids) {
      const m = await this.getMerchant(id);
      if (m) merchants.push(m);
    }
    return merchants;
  }

  // --- VISUAL EVIDENCE ---
  async saveVisualEvidence(evidence: VisualEvidence): Promise<VisualEvidence> {
    const key = `${DurableEvidenceRepository.PFX_VISUAL}${evidence.listingId}`;
    const list = await this.getVisualEvidenceForListing(evidence.listingId);
    const existingIndex = list.findIndex(v => v.id === evidence.id);
    if (existingIndex >= 0) {
      list[existingIndex] = evidence;
    } else {
      list.push(evidence);
    }
    this.memoryStore.set(key, list);
    await this.cache.set(key, {
      data: list,
      timestamp: Date.now(),
      ttl: 86400000 * 30,
      engine: 'evidence_repo',
      paramsHash: evidence.listingId,
    });
    return evidence;
  }

  async getVisualEvidenceForListing(listingId: string): Promise<VisualEvidence[]> {
    const key = `${DurableEvidenceRepository.PFX_VISUAL}${listingId}`;
    if (this.memoryStore.has(key)) {
      return this.memoryStore.get(key) as VisualEvidence[];
    }
    const cached = await this.cache.get<VisualEvidence[]>(key);
    if (cached?.data) {
      this.memoryStore.set(key, cached.data);
      return cached.data;
    }
    return [];
  }

  // --- COMMERCIAL EVIDENCE ---
  async saveCommercialEvidence(evidence: CommercialEvidence): Promise<CommercialEvidence> {
    const key = `${DurableEvidenceRepository.PFX_COMMERCIAL}${evidence.listingId}`;
    const list = await this.getCommercialEvidenceForListing(evidence.listingId);
    list.push(evidence);
    this.memoryStore.set(key, list);
    await this.cache.set(key, {
      data: list,
      timestamp: Date.now(),
      ttl: 86400000 * 30,
      engine: 'evidence_repo',
      paramsHash: evidence.listingId,
    });
    return evidence;
  }

  async getCommercialEvidenceForListing(listingId: string): Promise<CommercialEvidence[]> {
    const key = `${DurableEvidenceRepository.PFX_COMMERCIAL}${listingId}`;
    if (this.memoryStore.has(key)) {
      return this.memoryStore.get(key) as CommercialEvidence[];
    }
    const cached = await this.cache.get<CommercialEvidence[]>(key);
    if (cached?.data) {
      this.memoryStore.set(key, cached.data);
      return cached.data;
    }
    return [];
  }

  // --- SEARCH OBSERVATIONS ---
  async saveSearchObservation(obs: SearchObservation): Promise<SearchObservation> {
    const key = `${DurableEvidenceRepository.PFX_OBSERVATION}${obs.scanId}`;
    const list = await this.getSearchObservationsForScan(obs.scanId);
    list.push(obs);
    this.memoryStore.set(key, list);
    await this.cache.set(key, {
      data: list,
      timestamp: Date.now(),
      ttl: 86400000 * 30,
      engine: 'evidence_repo',
      paramsHash: obs.scanId,
    });
    return obs;
  }

  async getSearchObservationsForScan(scanId: string): Promise<SearchObservation[]> {
    const key = `${DurableEvidenceRepository.PFX_OBSERVATION}${scanId}`;
    if (this.memoryStore.has(key)) {
      return this.memoryStore.get(key) as SearchObservation[];
    }
    const cached = await this.cache.get<SearchObservation[]>(key);
    if (cached?.data) {
      this.memoryStore.set(key, cached.data);
      return cached.data;
    }
    return [];
  }

  // --- DERIVED INFERENCES ---
  async saveDerivedInference(inf: DerivedInference): Promise<DerivedInference> {
    const key = `${DurableEvidenceRepository.PFX_INFERENCE}${inf.targetEntityId}`;
    const list = await this.getInferencesForEntity(inf.targetEntityId);
    list.push(inf);
    this.memoryStore.set(key, list);
    await this.cache.set(key, {
      data: list,
      timestamp: Date.now(),
      ttl: 86400000 * 30,
      engine: 'evidence_repo',
      paramsHash: inf.targetEntityId,
    });
    return inf;
  }

  async getInferencesForEntity(entityId: string): Promise<DerivedInference[]> {
    const key = `${DurableEvidenceRepository.PFX_INFERENCE}${entityId}`;
    if (this.memoryStore.has(key)) {
      return this.memoryStore.get(key) as DerivedInference[];
    }
    const cached = await this.cache.get<DerivedInference[]>(key);
    if (cached?.data) {
      this.memoryStore.set(key, cached.data);
      return cached.data;
    }
    return [];
  }

  // --- INVESTIGATION CASES ---
  async saveCase(c: InvestigationCase): Promise<InvestigationCase> {
    const key = `${DurableEvidenceRepository.PFX_CASE}${c.id}`;
    this.memoryStore.set(key, c);
    await this.cache.set(key, {
      data: c,
      timestamp: Date.now(),
      ttl: 86400000 * 365,
      engine: 'evidence_repo',
      paramsHash: c.id,
    });
    await this.addToIndex(DurableEvidenceRepository.IDX_CASES, c.id);
    return c;
  }

  async getCase(id: string): Promise<InvestigationCase | null> {
    const key = `${DurableEvidenceRepository.PFX_CASE}${id}`;
    if (this.memoryStore.has(key)) {
      return this.memoryStore.get(key) as InvestigationCase;
    }
    const cached = await this.cache.get<InvestigationCase>(key);
    if (cached?.data) {
      this.memoryStore.set(key, cached.data);
      return cached.data;
    }
    return null;
  }

  async listCases(productId?: string): Promise<InvestigationCase[]> {
    const ids = await this.getIndex(DurableEvidenceRepository.IDX_CASES);
    const cases: InvestigationCase[] = [];
    for (const id of ids) {
      const c = await this.getCase(id);
      if (c) {
        if (!productId || c.productId === productId) {
          cases.push(c);
        }
      }
    }
    return cases;
  }

  // --- HISTORICAL SCAN SNAPSHOTS ---
  async saveSnapshot(snap: HistoricalScanSnapshot): Promise<HistoricalScanSnapshot> {
    const key = `${DurableEvidenceRepository.PFX_SNAPSHOT}${snap.productId}`;
    const list = await this.getSnapshotsForProduct(snap.productId);
    list.push(snap);
    this.memoryStore.set(key, list);
    await this.cache.set(key, {
      data: list,
      timestamp: Date.now(),
      ttl: 86400000 * 365,
      engine: 'evidence_repo',
      paramsHash: snap.productId,
    });
    await this.addToIndex(DurableEvidenceRepository.IDX_SNAPSHOTS, snap.id);
    return snap;
  }

  async getSnapshotsForProduct(productId: string): Promise<HistoricalScanSnapshot[]> {
    const key = `${DurableEvidenceRepository.PFX_SNAPSHOT}${productId}`;
    if (this.memoryStore.has(key)) {
      return this.memoryStore.get(key) as HistoricalScanSnapshot[];
    }
    const cached = await this.cache.get<HistoricalScanSnapshot[]>(key);
    if (cached?.data) {
      this.memoryStore.set(key, cached.data);
      return cached.data;
    }
    return [];
  }

  // --- MIGRATION FROM LEGACY KV CASES ---
  /**
   * Reads legacy `case_*` records from EvidenceDeskService and imports
   * them into normalized Unified Evidence models without losing any records.
   */
  async migrateFromLegacyKvCases(cache: CacheAdapter): Promise<number> {
    const indexCached = await cache.get<string[]>('cases:index');
    const legacyCaseIds = indexCached?.data || [];
    let migratedCount = 0;

    for (const caseId of legacyCaseIds) {
      const cached = await cache.get<LegacyCase>(`case_${caseId}`);
      if (!cached?.data) continue;
      const leg = cached.data;

      // Check if already in new store
      const existing = await this.getCase(leg.id);
      if (existing) continue;

      // 1. Ensure Product Identity exists
      const productId = `prod_${leg.targetProduct.brand.toLowerCase().replace(/[^a-z0-9]/g, '')}_${leg.targetProduct.productName.toLowerCase().replace(/[^a-z0-9]/g, '')}`.slice(0, 32);
      let prod = await this.getProduct(productId);
      if (!prod) {
        prod = await this.saveProduct({
          id: productId,
          brandId: leg.targetProduct.brand.toLowerCase(),
          canonicalName: leg.targetProduct.productName,
          canonicalImageUrls: leg.targetProduct.officialImageUrl ? [leg.targetProduct.officialImageUrl] : [],
          mrp: leg.targetProduct.mrp || 0,
          currency: 'INR',
          expectedPriceRange: leg.targetProduct.expectedPriceRange,
          authorizedSellers: leg.targetProduct.knownAuthorizedSellers || [],
          createdAt: leg.createdAt,
          updatedAt: leg.updatedAt,
        });
      }

      // 2. Normalize Listings and Observations
      const listingIds: string[] = [];
      if (leg.scanSnapshot?.results) {
        for (const item of leg.scanSnapshot.results) {
          const lId = await generateListingId(item.listing.source, item.listing.productLink);
          listingIds.push(lId);

          const existingListing = await this.getListing(lId);
          if (!existingListing) {
            await this.saveListing({
              id: lId,
              source: item.listing.source,
              marketplace: item.listing.source.toLowerCase().includes('amazon') ? 'amazon' : 'google_shopping',
              title: item.listing.title,
              url: item.listing.productLink,
              cleanUrl: sanitizeListingUrl(item.listing.productLink),
              extractedPrice: item.listing.extractedPrice,
              originalPriceText: item.listing.price,
              currency: 'INR',
              sellerName: item.listing.seller,
              imageUrl: item.listing.thumbnail,
              rating: item.listing.rating,
              reviewCount: item.listing.reviews,
              createdAt: leg.createdAt,
              updatedAt: leg.updatedAt,
            });
          }

          // Commercial evidence
          await this.saveCommercialEvidence({
            id: `comm_${lId}_${Date.now()}`,
            listingId: lId,
            productId: prod.id,
            observedPrice: item.listing.extractedPrice,
            baselineMrp: prod.mrp,
            variancePercent: item.priceSignal.priceRatio ? Math.round((item.priceSignal.priceRatio - 1) * 100) : 0,
            anomalyType: item.priceSignal.anomalyType === 'below_mrp' ? 'below_mrp' : 'normal_range',
            discountLegitimacyScore: item.priceSignal.isAnomalous ? 25 : 85,
            sellerReputation: item.sellerSignal.isAnomalous ? 'generic_name' : 'authorized',
            retrievalTimestamp: leg.createdAt,
          });
        }
      }

      // 3. Save Unified Case
      await this.saveCase({
        id: leg.id,
        caseNumber: leg.id.toUpperCase(),
        title: leg.title,
        productId: prod.id,
        status: leg.status,
        priority: leg.priority,
        listingIds,
        notes: leg.notes,
        tags: leg.tags,
        findingsSummary: leg.findingsSummary,
        legalDisclaimer: leg.legalDisclaimer,
        createdAt: leg.createdAt,
        updatedAt: leg.updatedAt,
      });

      migratedCount++;
    }

    return migratedCount;
  }
}
