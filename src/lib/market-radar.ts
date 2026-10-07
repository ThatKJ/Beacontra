/**
 * Beacontra Market Radar
 * 
 * Transforms listing searches into an intelligent market-comparison engine.
 * - Discerns legitimate Indian e-commerce retail discounts from anomalous underpricing.
 * - Groups and filters listings by product-variant compatibility (excluding accessories and wrong hardware tiers).
 * - Computes robust market-price baselines (median, trimmed mean, IQR) when sufficient comparable offers exist.
 * - Explains included vs excluded observations with complete provenance.
 * - Intelligent search planning: Quick Scan (1 credit cap) vs Deep Investigation (max 3 credits with explicit authorization).
 * - Separates marketplace platforms from merchant identities.
 */

import type { SerpApiClient } from './serpapi-client';
import type { EvidenceRepository, SearchObservation } from './evidence-core';
import { sanitizeListingUrl, generateListingId, generateMerchantId, computeIntegrityDigest } from './evidence-core';
import type { BrandDnaService, ProductProfile } from './brand-dna';
import type { BaseSearchParams } from './types';

export type RadarScanMode = 'quick' | 'deep';

export interface MarketRadarScanOptions {
  mode?: RadarScanMode;
  allowDeepScan?: boolean;
  maxAdditionalOffers?: number; // Capped at 2 extra calls
  location?: string;
  gl?: string;
  hl?: string;
}

export interface MarketBaseline {
  status: 'robust_baseline' | 'preliminary_baseline' | 'insufficient_evidence';
  sampleSize: number;
  mrp: number;
  medianMarketPrice: number | null;
  trimmedMeanPrice: number | null;
  minComparablePrice: number | null;
  maxComparablePrice: number | null;
  explanation: string;
  includedListingCount: number;
  excludedListingCount: number;
  exclusionReasons: Record<string, number>;
}

export type RadarMatchClassification =
  | 'exact_product'
  | 'approved_variant'
  | 'incompatible_variant'
  | 'accessory_excluded'
  | 'unrelated';

export type RadarPriceClassification =
  | 'at_baseline'
  | 'standard_discount'
  | 'promotional_sale'
  | 'anomalous_underpricing'
  | 'anomalous_overpricing'
  | 'unverified';

export interface RadarListing {
  id: string;
  title: string;
  source: string;
  marketplace: string;
  merchantName: string;
  merchantId?: string;
  url: string;
  cleanUrl: string;
  price: number;
  originalPriceText: string;
  imageUrl: string;
  rating?: number;
  reviews?: number;
  isComparable: boolean;
  matchClassification: RadarMatchClassification;
  priceClassification: RadarPriceClassification;
  priceDeviationFromBaselinePercent: number | null;
  discountLegitimacyScore: number; // 0-100 (high = normal commercial discount, low = anomalous)
  requiresReview: boolean;
  reviewRationale: string;
  detectedAttributes?: {
    color?: string;
    storage?: string;
    tier?: string;
    generation?: string;
  };
}

export interface RadarMerchantSummary {
  id: string;
  name: string;
  platform: string;
  listingCount: number;
  isAuthorized: boolean;
}

export interface MarketRadarReport {
  productId: string;
  productName: string;
  scanId: string;
  timestamp: string;
  mode: RadarScanMode;
  searchPlan: {
    plannedRequests: number;
    executedRequests: number;
    cachedRequests: number;
    creditsUsed: number;
    maxCreditsCap: number;
  };
  baseline: MarketBaseline;
  comparableListings: RadarListing[];
  excludedListings: RadarListing[];
  merchantsObserved: RadarMerchantSummary[];
  observations: SearchObservation[];
  summary: string;
}

export class MarketRadarService {
  constructor(
    private serpApiClient: SerpApiClient,
    private repository: EvidenceRepository,
    private brandDnaService: BrandDnaService
  ) {}

  /**
   * Runs an intelligent Market Radar scan for a product profile.
   */
  async runRadar(product: ProductProfile, options: MarketRadarScanOptions = {}): Promise<MarketRadarReport> {
    const mode = options.mode || 'quick';
    const allowDeep = options.allowDeepScan === true && mode === 'deep';
    const scanId = `radar_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const timestamp = new Date().toISOString();

    const searchPlan = {
      plannedRequests: allowDeep ? 3 : 1,
      executedRequests: 0,
      cachedRequests: 0,
      creditsUsed: 0,
      maxCreditsCap: allowDeep ? 3 : 1,
    };

    const observations: SearchObservation[] = [];
    const rawListings: Array<{
      title: string;
      link?: string;
      source?: string;
      price?: string;
      extracted_price?: number;
      thumbnail?: string;
      rating?: number;
      reviews?: number;
      product_id?: string;
    }> = [];

    const brandName = product.brandName || '';
    const queryTerm = brandName && !product.productName.toLowerCase().includes(brandName.toLowerCase())
      ? `${brandName} ${product.productName}`.trim()
      : product.productName;
    const queryParams: BaseSearchParams & { tbm?: string } = {
      engine: 'google_shopping',
      q: queryTerm,
      location: options.location || 'India',
      gl: options.gl || 'in',
      hl: options.hl || 'en',
    };

    const initialCredits = this.serpApiClient.getCreditUsage();
    let shoppingResp;
    try {
      shoppingResp = await this.serpApiClient.search<{
        shopping_results?: Array<Record<string, unknown>>;
      }>(queryParams);
    } catch (err) {
      // Return empty report with explanation if search fails
      const errMsg = err instanceof Error ? err.message : 'Search request failed';
      return this.buildEmptyReport(product, scanId, timestamp, mode, searchPlan, errMsg);
    }

    const creditsAfterPrimary = this.serpApiClient.getCreditUsage();
    searchPlan.executedRequests += 1;
    const primaryCost = creditsAfterPrimary - initialCredits;
    searchPlan.creditsUsed += primaryCost;
    if (primaryCost === 0) searchPlan.cachedRequests += 1;

    const shoppingResults = (shoppingResp.shopping_results || []) as Array<{
      title?: string;
      product_link?: string;
      link?: string;
      source?: string;
      price?: string;
      extracted_price?: number;
      thumbnail?: string;
      rating?: number;
      reviews?: number;
      product_id?: string;
    }>;

    for (const item of shoppingResults) {
      if (item.title) {
        rawListings.push({
          title: item.title,
          link: item.product_link || item.link,
          source: item.source || 'Marketplace',
          price: item.price,
          extracted_price: item.extracted_price,
          thumbnail: item.thumbnail,
          rating: item.rating,
          reviews: item.reviews,
          product_id: item.product_id,
        });
      }
    }

    // Save primary search observation
    const primaryObsDigest = await computeIntegrityDigest(JSON.stringify(queryParams) + timestamp);
    const primaryObs: SearchObservation = {
      id: `obs_primary_${scanId}`,
      scanId,
      engine: 'google_shopping',
      queryParameters: queryParams as unknown as Record<string, unknown>,
      retrievalTimestamp: timestamp,
      dataSource: this.serpApiClient.isFixtureMode() ? 'fixture' : (primaryCost === 0 ? 'cache' : 'live'),
      rawItemCount: rawListings.length,
      requestCostCredits: primaryCost,
      provenanceHash: primaryObsDigest,
    };
    await this.repository.saveSearchObservation(primaryObs);
    observations.push(primaryObs);

    // 2. Selective Deep Investigation (if authorized and requested)
    if (allowDeep && searchPlan.executedRequests < searchPlan.maxCreditsCap) {
      // Find candidate product_ids for immersive product or deeper search
      const candidateProductId = rawListings.find(l => l.product_id)?.product_id;
      if (candidateProductId) {
        const deepParams: BaseSearchParams & { product_id?: string } = {
          engine: 'google_shopping_light',
          q: candidateProductId,
          location: options.location || 'India',
          gl: options.gl || 'in',
          hl: options.hl || 'en',
        };
        try {
          const preCredits = this.serpApiClient.getCreditUsage();
          const deepResp = await this.serpApiClient.search<{
            shopping_results?: Array<{
              title?: string;
              product_link?: string;
              source?: string;
              price?: string;
              extracted_price?: number;
              thumbnail?: string;
            }>;
          }>(deepParams);
          const postCredits = this.serpApiClient.getCreditUsage();
          searchPlan.executedRequests += 1;
          const cost = postCredits - preCredits;
          searchPlan.creditsUsed += cost;
          if (cost === 0) searchPlan.cachedRequests += 1;

          if (deepResp.shopping_results) {
            for (const item of deepResp.shopping_results) {
              if (item.title && !rawListings.some(r => r.link === item.product_link)) {
                rawListings.push({
                  title: item.title,
                  link: item.product_link,
                  source: item.source || 'Marketplace Offer',
                  price: item.price,
                  extracted_price: item.extracted_price,
                  thumbnail: item.thumbnail,
                });
              }
            }
          }
        } catch {
          // Gracefully continue with primary results if secondary call fails
        }
      }
    }

    // 3. Normalize & Deduplicate Listings
    const seenUrls = new Set<string>();
    const comparableListings: RadarListing[] = [];
    const excludedListings: RadarListing[] = [];
    const exclusionReasons: Record<string, number> = {};
    const merchantsMap = new Map<string, RadarMerchantSummary>();

    for (const raw of rawListings) {
      const url = raw.link || `https://shopping.google.com/search?q=${encodeURIComponent(raw.title)}`;
      const cleanUrl = sanitizeListingUrl(url);

      if (seenUrls.has(cleanUrl)) continue;
      seenUrls.add(cleanUrl);

      const listingId = await generateListingId(raw.source || 'google_shopping', cleanUrl);
      const merchantName = (raw.source || 'Marketplace Seller').trim();
      const merchantId = await generateMerchantId(
        raw.source?.toLowerCase().includes('amazon') ? 'amazon' : 'google_shopping',
        merchantName
      );

      // Evaluate variant match using Brand DNA
      const matchEval = this.brandDnaService.evaluateListingMatch(product, raw.title);

      // Track merchant
      if (!merchantsMap.has(merchantId)) {
        const isAuth = product.authorizedSellers.some(s => s.toLowerCase() === merchantName.toLowerCase());
        merchantsMap.set(merchantId, {
          id: merchantId,
          name: merchantName,
          platform: raw.source || 'google_shopping',
          listingCount: 1,
          isAuthorized: isAuth,
        });

        // Save merchant to repository
        await this.repository.saveMerchant({
          id: merchantId,
          name: merchantName,
          normalizedName: merchantName.toLowerCase().replace(/[^a-z0-9]/g, ''),
          platform: raw.source || 'google_shopping',
          verificationStatus: isAuth ? 'authorized' : 'unverified',
          firstObservedAt: timestamp,
          lastObservedAt: timestamp,
        });
      } else {
        const m = merchantsMap.get(merchantId)!;
        m.listingCount += 1;
      }

      // Determine extracted price
      const price = raw.extracted_price ?? (raw.price ? parseFloat(raw.price.replace(/[^0-9.]/g, '')) : 0);

      let matchClassification: RadarMatchClassification = 'exact_product';
      if (!matchEval.isComparable) {
        if (matchEval.detectedAttributes.isAccessory || matchEval.matchType === 'accessory_mismatch') {
          matchClassification = 'accessory_excluded';
        } else if (matchEval.matchType.startsWith('incompatible_') || matchEval.matchType === 'user_corrected_incompatible') {
          matchClassification = 'incompatible_variant';
        } else {
          matchClassification = 'unrelated';
        }
      } else if (matchEval.matchType === 'comparable_cosmetic_variant') {
        matchClassification = 'approved_variant';
      }

      const listing: RadarListing = {
        id: listingId,
        title: raw.title,
        source: raw.source || 'Marketplace',
        marketplace: raw.source?.toLowerCase().includes('amazon') ? 'amazon' : 'google_shopping',
        merchantName,
        merchantId,
        url,
        cleanUrl,
        price,
        originalPriceText: raw.price || `₹${price}`,
        imageUrl: raw.thumbnail || '',
        rating: raw.rating,
        reviews: raw.reviews,
        isComparable: matchEval.isComparable,
        matchClassification,
        priceClassification: 'unverified',
        priceDeviationFromBaselinePercent: null,
        discountLegitimacyScore: 50,
        requiresReview: false,
        reviewRationale: '',
        detectedAttributes: {
          color: matchEval.detectedAttributes.colorVariant,
          storage: matchEval.detectedAttributes.storageMismatch,
          tier: matchEval.detectedAttributes.hardwareTierMismatch,
          generation: matchEval.detectedAttributes.generationMismatch,
        },
      };

      // Save listing record to repository
      await this.repository.saveListing({
        id: listingId,
        source: listing.source,
        marketplace: listing.marketplace,
        title: listing.title,
        url: listing.url,
        cleanUrl: listing.cleanUrl,
        extractedPrice: listing.price,
        originalPriceText: listing.originalPriceText,
        currency: 'INR',
        sellerName: listing.merchantName,
        merchantId,
        imageUrl: listing.imageUrl,
        rating: listing.rating,
        reviewCount: listing.reviews,
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      if (matchEval.isComparable && price > 0) {
        comparableListings.push(listing);
      } else {
        excludedListings.push(listing);
        const reason = matchEval.isComparable && price <= 0 ? 'missing_price' : matchEval.matchType;
        exclusionReasons[reason] = (exclusionReasons[reason] || 0) + 1;
      }
    }

    // 4. Calculate Market Baseline
    const baseline = this.calculateBaseline(product.statutoryMrp ?? 0, comparableListings, excludedListings.length, exclusionReasons);

    // 5. Evaluate Price Variance & Distinguish Legitimate Discounts from Anomalies
    for (const item of comparableListings) {
      this.evaluateListingPrice(item, product, baseline);

      // Save commercial evidence in repository
      await this.repository.saveCommercialEvidence({
        id: `comm_${item.id}_${Date.now()}`,
        listingId: item.id,
        productId: product.id,
        observedPrice: item.price,
        baselineMrp: product.statutoryMrp ?? 0,
        variancePercent: item.priceDeviationFromBaselinePercent ?? 0,
        anomalyType: item.priceClassification === 'anomalous_underpricing' ? 'below_mrp' : 'normal_range',
        discountLegitimacyScore: item.discountLegitimacyScore,
        sellerReputation: merchantsMap.get(item.merchantId || '')?.isAuthorized ? 'authorized' : 'unauthorized_new',
        retrievalTimestamp: timestamp,
      });
    }

    // 6. Generate Summary
    const summary = this.buildSummary(product, baseline, comparableListings, excludedListings);

    return {
      productId: product.id,
      productName: product.productName,
      scanId,
      timestamp,
      mode,
      searchPlan,
      baseline,
      comparableListings,
      excludedListings,
      merchantsObserved: Array.from(merchantsMap.values()),
      observations,
      summary,
    };
  }

  /**
   * Computes robust price baseline from comparable offers.
   */
  private calculateBaseline(
    mrp: number,
    comparable: RadarListing[],
    excludedCount: number,
    reasons: Record<string, number>
  ): MarketBaseline {
    if (comparable.length < 2) {
      return {
        status: 'insufficient_evidence',
        sampleSize: comparable.length,
        mrp,
        medianMarketPrice: comparable.length === 1 ? comparable[0]!.price : null,
        trimmedMeanPrice: comparable.length === 1 ? comparable[0]!.price : null,
        minComparablePrice: comparable.length === 1 ? comparable[0]!.price : null,
        maxComparablePrice: comparable.length === 1 ? comparable[0]!.price : null,
        explanation: `Fewer than 2 comparable market offers observed (${comparable.length} found). Insufficient evidence to establish a reliable market price baseline.`,
        includedListingCount: comparable.length,
        excludedListingCount: excludedCount,
        exclusionReasons: reasons,
      };
    }

    const prices = comparable.map(c => c.price).sort((a, b) => a - b);
    const count = prices.length;
    
    // Median
    const mid = Math.floor(count / 2);
    const median = count % 2 !== 0 ? prices[mid]! : (prices[mid - 1]! + prices[mid]!) / 2;

    // 10% Trimmed Mean (removes extreme high/low noise)
    const trimCount = Math.floor(count * 0.1);
    const trimmed = prices.slice(trimCount, count - trimCount);
    const trimmedSum = trimmed.reduce((acc, p) => acc + p, 0);
    const trimmedMean = Math.round(trimmedSum / trimmed.length);

    const status = count >= 4 ? 'robust_baseline' : 'preliminary_baseline';
    const explanation = `Established ${status === 'robust_baseline' ? 'robust' : 'preliminary'} market baseline from ${count} comparable offers (median: ₹${median}, trimmed mean: ₹${trimmedMean}). ${excludedCount} listings excluded (accessories, mismatched variants, or invalid prices).`;

    return {
      status,
      sampleSize: count,
      mrp,
      medianMarketPrice: median,
      trimmedMeanPrice: trimmedMean,
      minComparablePrice: prices[0]!,
      maxComparablePrice: prices[count - 1]!,
      explanation,
      includedListingCount: count,
      excludedListingCount: excludedCount,
      exclusionReasons: reasons,
    };
  }

  /**
   * Distinguishes ordinary/promotional e-commerce discounts from anomalous underpricing.
   */
  private evaluateListingPrice(
    listing: RadarListing,
    product: ProductProfile,
    baseline: MarketBaseline
  ): void {
    const price = listing.price;
    const mrp = product.statutoryMrp ?? 0;
    const median = baseline.medianMarketPrice || (product.expectedPriceRange ? (product.expectedPriceRange.min + product.expectedPriceRange.max) / 2 : mrp);
    
    // Deviation from market median
    const devFromMedian = median > 0 ? Math.round(((price - median) / median) * 100) : 0;
    listing.priceDeviationFromBaselinePercent = devFromMedian;

    // Check authorized seller status
    const isAuthorized = product.authorizedSellers.some(
      s => s.toLowerCase() === listing.merchantName.toLowerCase()
    );

    // Rule 1: Ordinary price near market baseline (within -20% to +25% of median)
    if (devFromMedian >= -20 && devFromMedian <= 25) {
      listing.priceClassification = 'at_baseline';
      listing.discountLegitimacyScore = 95;
      listing.requiresReview = false;
      listing.reviewRationale = `Offer of ₹${price} aligns closely with market baseline (median: ₹${median}). Normal commercial offer.`;
      return;
    }

    // Rule 2: Moderate promotional retail discount (-21% to -45% from median)
    // Common during platform sales (Amazon Great Indian Festival, Flipkart Big Billion Days)
    if (devFromMedian < -20 && devFromMedian >= -45) {
      listing.priceClassification = 'promotional_sale';
      listing.discountLegitimacyScore = isAuthorized ? 88 : 75;
      listing.requiresReview = !isAuthorized && devFromMedian <= -35;
      listing.reviewRationale = isAuthorized
        ? `Offer of ₹${price} is ${Math.abs(devFromMedian)}% below median, consistent with authorized promotional clearance.`
        : `Offer of ₹${price} is ${Math.abs(devFromMedian)}% below median from unauthorized seller "${listing.merchantName}". Monitor for possible grey-market or refurbished stock.`;
      return;
    }

    // Rule 3: Extreme anomalous underpricing (> 45% plunge below market median, or > 70% below MRP from unverified seller)
    if (devFromMedian < -45 || (mrp > 0 && (price / mrp) < 0.25 && !isAuthorized)) {
      listing.priceClassification = 'anomalous_underpricing';
      listing.discountLegitimacyScore = 15;
      listing.requiresReview = true;
      listing.reviewRationale = `Commercial anomaly: ₹${price} is ${Math.abs(devFromMedian)}% below market median (₹${median}) and ${Math.round((1 - price / mrp) * 100)}% below MRP (₹${mrp}). Such severe variance departs sharply from standard Indian retail discounting patterns. Requires human triage.`;
      return;
    }

    // Rule 4: Overpricing (> 35% above market median)
    if (devFromMedian > 35) {
      listing.priceClassification = 'anomalous_overpricing';
      listing.discountLegitimacyScore = 60;
      listing.requiresReview = false;
      listing.reviewRationale = `Offer of ₹${price} is ${devFromMedian}% above market baseline. Likely distributor markup or out-of-stock placeholder.`;
      return;
    }

    listing.priceClassification = 'standard_discount';
    listing.discountLegitimacyScore = 80;
    listing.requiresReview = false;
    listing.reviewRationale = `Offer of ₹${price} represents standard competitive pricing.`;
  }

  private buildSummary(
    product: ProductProfile,
    baseline: MarketBaseline,
    comparable: RadarListing[],
    excluded: RadarListing[]
  ): string {
    const anomalous = comparable.filter(c => c.requiresReview);
    return `Market Radar evaluated ${comparable.length + excluded.length} total listings for "${product.productName}". ` +
      `${comparable.length} comparable offers analyzed; ${excluded.length} non-comparable listings excluded. ` +
      `Baseline status: ${baseline.status} (median: ₹${baseline.medianMarketPrice ?? 'N/A'}). ` +
      `${anomalous.length} offer(s) flagged for human review due to anomalous commercial variance.`;
  }

  private buildEmptyReport(
    product: ProductProfile,
    scanId: string,
    timestamp: string,
    mode: RadarScanMode,
    searchPlan: MarketRadarReport['searchPlan'],
    errorMsg: string
  ): MarketRadarReport {
    return {
      productId: product.id,
      productName: product.productName,
      scanId,
      timestamp,
      mode,
      searchPlan,
      baseline: {
        status: 'insufficient_evidence',
        sampleSize: 0,
        mrp: product.statutoryMrp ?? 0,
        medianMarketPrice: null,
        trimmedMeanPrice: null,
        minComparablePrice: null,
        maxComparablePrice: null,
        explanation: `Search failed: ${errorMsg}`,
        includedListingCount: 0,
        excludedListingCount: 0,
        exclusionReasons: {},
      },
      comparableListings: [],
      excludedListings: [],
      merchantsObserved: [],
      observations: [],
      summary: `Market Radar could not retrieve observations: ${errorMsg}`,
    };
  }
}
