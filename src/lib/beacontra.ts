import { SerpApiClient } from './serpapi-client';
import { isVariantMismatch, classifyMatchSource } from './normalization';
import { safeFetchImage } from './security';
import type {
  BaseSearchParams,
  LensSearchParams,
  SerpApiResponse,
  ShoppingResult,
  LensSearchResult,
} from './types';

export interface BeacontraInput {
  productName: string;
  officialImageUrl: string;
  mrp?: number;
  expectedPriceRange?: { min: number; max: number };
  knownAuthorizedSellers?: string[];
}

export interface ListingCandidate {
  position: number;
  title: string;
  productLink: string;
  source: string;
  price: string;
  extractedPrice: number;
  rating: number;
  reviews: number;
  thumbnail: string;
  delivery: string;
  seller: string;
  extensions: string[];
}

export interface LensEvidence {
  hasExactMatch: boolean;
  hasVisualMatch: boolean;
  hasLensData: boolean;
  /** True only when the Lens request itself failed (network error, timeout, thrown exception) —
   * distinct from a request that succeeded but simply found nothing. See analyzeVisual(). */
  callFailed: boolean;
  exactMatchSources: string[];
  visualMatchSources: string[];
  matchConfidence: 'high' | 'medium' | 'low' | 'none';
  details: LensSearchResult;
  hasBrandOrAuthorizedMatch?: boolean;
  unverifiedSources?: string[];
}

export interface PriceSignal {
  isAnomalous: boolean;
  anomalyType: 'below_mrp' | 'below_range' | 'large_deviation' | 'moderate_discount' | 'normal';
  mrp?: number;
  priceRatio?: number;
  details: string;
}

export interface SellerSignal {
  isAnomalous: boolean;
  anomalyType: 'unknown_seller' | 'new_account' | 'generic_pattern' | 'authorized' | 'no_authorized_list';
  sellerName: string;
  isAuthorized: boolean;
  details: string;
}

export interface VisualSignal {
  isAnomalous: boolean;
  anomalyType: 'matched' | 'visual_match' | 'no_evidence' | 'unavailable' | 'unverified_photo_source' | 'different_product' | 'match' | 'not_verified';
  confidence: 'high' | 'medium' | 'low';
  matchSources: string[];
  details: string;
  status?: 'matched' | 'visual_match' | 'no_evidence' | 'unavailable';
}


export interface FusedResult {
  listing: ListingCandidate;
  lensEvidence: LensEvidence;
  priceSignal: PriceSignal;
  sellerSignal: SellerSignal;
  visualSignal: VisualSignal;
  compositeScore: number;
  confidence: 'high' | 'medium' | 'low';
  evidenceSummary: string;
  recommendation: 'review_urgently' | 'review' | 'monitor' | 'likely_genuine';
}

export interface BeacontraScanResult {
  scanId: string;
  dataSource: 'live' | 'fixture' | 'cache';
  productName: string;
  officialImageUrl: string;
  totalListingsFound: number;
  results: FusedResult[];
  createdAt: string;
  creditsUsed: number;
}

export class BeacontraService {
  private client: SerpApiClient;

  constructor(client: SerpApiClient) {
    this.client = client;
  }

  private static readonly MAX_LENS_CALLS = 10;

  async scan(input: BeacontraInput): Promise<BeacontraScanResult> {
    const scanId = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = new Date().toISOString();

    const shoppingResults = await this.searchMarketplaceListings(input.productName);

    const candidates = this.extractCandidates(shoppingResults, input.productName);

    const priceSignals = candidates.map(c => ({ candidate: c, priceSignal: this.analyzePrice(c, input) }));
    priceSignals.sort((a, b) => {
      const aScore = a.priceSignal.isAnomalous ? 100 : 0;
      const bScore = b.priceSignal.isAnomalous ? 100 : 0;
      if (aScore !== bScore) return bScore - aScore;
      return b.candidate.extractedPrice - a.candidate.extractedPrice;
    });

    const resultsPromises = priceSignals.map(async (entry, index) => {
      const { candidate, priceSignal } = entry;
      const sellerSignal = this.analyzeSeller(candidate, input);

      let lensEvidence: LensEvidence;
      let visualSignal: VisualSignal;

      if (index < BeacontraService.MAX_LENS_CALLS) {
        lensEvidence = await this.runVisualVerification(candidate.thumbnail, input.officialImageUrl, input);
        visualSignal = this.analyzeVisual(lensEvidence);
      } else {
        lensEvidence = this.emptyLensEvidence();
        visualSignal = {
          isAnomalous: false,
          anomalyType: 'not_verified',
          confidence: 'low',
          matchSources: [],
          details: 'Visual verification skipped (Lens call cap reached)',
        };
      }

      return this.fuseSignals(candidate, lensEvidence, priceSignal, sellerSignal, visualSignal);
    });

    const results: FusedResult[] = await Promise.all(resultsPromises);

    results.sort((a, b) => b.compositeScore - a.compositeScore);

    // creditUsage only increments on a genuine live fetch (serpapi-client.ts never counts a
    // cache hit as a credit spend) and this client is constructed fresh per request, so a scan
    // that spent zero credits was answered entirely from cache — not a new live search.
    const dataSource: BeacontraScanResult['dataSource'] = this.client.isFixtureMode()
      ? 'fixture'
      : this.client.getCreditUsage() === 0
        ? 'cache'
        : 'live';

    return {
      scanId,
      dataSource,
      productName: input.productName,
      officialImageUrl: input.officialImageUrl,
      totalListingsFound: candidates.length,
      results,
      createdAt,
      creditsUsed: this.client.getCreditUsage(),
    };
  }

  private async searchMarketplaceListings(productName: string): Promise<SerpApiResponse> {
    const params: BaseSearchParams = {
      engine: 'google_shopping',
      q: productName,
      gl: 'in',
      hl: 'en',
    };
    return this.client.search(params);
  }

  private isVariantMismatch(title: string, productName: string): boolean {
    return isVariantMismatch(title, productName).isMismatch;
  }

  private extractCandidates(response: SerpApiResponse, productName: string): ListingCandidate[] {
    const shoppingResults = response.shopping_results || [];
    return shoppingResults
      .filter((r): r is ShoppingResult => r.extracted_price !== undefined && r.extracted_price > 0)
      .filter((r) => !this.isVariantMismatch(r.title, productName))
      .map((r) => ({
        position: r.position ?? 0,
        title: r.title,
        productLink: r.product_link ?? '',
        source: r.source ?? 'Unknown',
        price: r.price ?? 'N/A',
        extractedPrice: r.extracted_price ?? 0,
        rating: r.rating ?? 0,
        reviews: r.reviews ?? 0,
        thumbnail: r.thumbnail ?? '',
        delivery: r.delivery ?? '',
        seller: r.source ?? 'Unknown',
        extensions: r.extensions ?? [],
      }));
  }

  private async runVisualVerification(
    listingImageUrl: string,
    officialImageUrl: string,
    input?: BeacontraInput
  ): Promise<LensEvidence> {
    try {
      // First, try to upload the image to get image_id for better exact_matches
      let imageId: string | undefined;
      try {
        imageId = await this.uploadImage(listingImageUrl);
      } catch {
        // Upload failed, continue with URL
      }

      // Try multiple Lens modes for best coverage
      // 1. Try exact_matches with image_id (best for exact matches)
      // 2. Try products with URL (best for commercial product matches)
      // 3. Try all with URL (broad coverage)
      
      let lensResponse: SerpApiResponse;

      if (imageId) {
        // Try exact_matches with image_id first (best for finding exact matches)
        const exactParams: LensSearchParams = {
          engine: 'google_lens',
          image_id: imageId,
          type: 'exact_matches',
        };
        lensResponse = await this.client.search(exactParams);
        
        // If no exact matches, try products with URL
        if (!lensResponse.exact_matches?.length) {
          const productParams: LensSearchParams = {
            engine: 'google_lens',
            url: listingImageUrl,
            type: 'products',
          };
          lensResponse = await this.client.search(productParams);
        }
      } else {
        // No image_id, use URL with products type
        const productParams: LensSearchParams = {
          engine: 'google_lens',
          url: listingImageUrl,
          type: 'products',
        };
        lensResponse = await this.client.search(productParams);
      }

      // Check for structured results
      const visualMatches = lensResponse.visual_matches || [];
      const exactMatches = lensResponse.exact_matches || [];
      const products = lensResponse.products || [];
      const allMatches = [...visualMatches, ...exactMatches, ...products];

      if (allMatches.length === 0 && !lensResponse.ai_overview) {
        // The request succeeded (HTTP 200) but genuinely found nothing — an observation,
        // not a failure. callFailed stays false so analyzeVisual reports this as absence
        // of evidence, not as "verification unavailable".
        return {
          ...this.emptyLensEvidence(),
          hasLensData: false,
        };
      }

      const exactMatchSources = exactMatches.map(m => m.source).filter((s): s is string => Boolean(s));
      const visualMatchSources = visualMatches.map(m => m.source).filter((s): s is string => Boolean(s));
      const productSources = products.map(m => m.source).filter((s): s is string => Boolean(s));

      // Domain-aware and authorized seller source classification
      const classifyCandidate = (m: { source?: string; link?: string }) => {
        return classifyMatchSource(
          m.source ?? '',
          m.link,
          input?.productName ?? '',
          input?.knownAuthorizedSellers ?? [],
          officialImageUrl
        );
      };

      const classifiedExact = exactMatches.map(classifyCandidate);
      const classifiedVisual = [...visualMatches, ...products].map(classifyCandidate);

      // Check for exact match with official image or verified brand/authorized channel
      const hasExactMatch = exactMatches.some((m, idx) => {
        const cls = classifiedExact[idx];
        return (
          Boolean(cls?.isOfficialBrand) ||
          Boolean(cls?.isAuthorizedSeller) ||
          Boolean(m.source?.toLowerCase().includes('official') || m.source?.toLowerCase().includes('brand')) ||
          Boolean(officialImageUrl && m.link?.includes(officialImageUrl))
        );
      });

      const hasBrandOrAuthorizedMatch = [...classifiedExact, ...classifiedVisual].some(
        c => c.isOfficialBrand || c.isAuthorizedSeller || c.isRecognizedMarketplace
      );

      const unverifiedSources = classifiedVisual
        .filter(c => !c.isOfficialBrand && !c.isAuthorizedSeller && !c.isRecognizedMarketplace)
        .map(c => c.sourceDomain || 'unverified');

      const hasVisualMatch = visualMatches.length > 0 || products.length > 0;

      let matchConfidence: 'high' | 'medium' | 'low' | 'none' = 'none';
      if (hasExactMatch) matchConfidence = 'high';
      else if (hasVisualMatch) {
        if (visualMatches.length >= 3 || products.length >= 3) matchConfidence = 'medium';
        else matchConfidence = 'low';
      }

      return {
        hasExactMatch,
        hasVisualMatch,
        hasLensData: true,
        callFailed: false,
        hasBrandOrAuthorizedMatch,
        unverifiedSources,
        exactMatchSources,
        visualMatchSources: [...visualMatchSources, ...productSources],
        matchConfidence,
        details: {
          visual_matches: visualMatches,
          exact_matches: exactMatches,
          products: products,
          ai_overview: lensResponse.ai_overview,
        },
      };
    } catch {
      // The request itself failed (network error, timeout, malformed image) — we made no
      // observation at all. This must stay distinguishable from "observed zero matches" below.
      return {
        ...this.emptyLensEvidence(),
        hasLensData: false,
        callFailed: true,
      };
    }
  }

  private async uploadImage(imageUrl: string): Promise<string | undefined> {
    try {
      if (this.client.isFixtureMode()) return undefined;
      const apiKey = this.client.getApiKey?.() || '';
      if (!apiKey) return undefined;

      const fetchResult = await safeFetchImage(imageUrl, 500 * 1024);
      if (!fetchResult.ok || !fetchResult.buffer) return undefined;

      const formData = new FormData();
      const blob = new Blob([fetchResult.buffer]);
      formData.append('image', blob, 'upload.jpg');
      formData.append('api_key', apiKey);

      const uploadResponse = await fetch('https://serpapi.com/image', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) return undefined;

      const uploadResult = await uploadResponse.json() as { image_id?: string };
      return uploadResult.image_id;
    } catch {
      return undefined;
    }
  }

  private emptyLensEvidence(): LensEvidence {
    return {
      hasExactMatch: false,
      hasVisualMatch: false,
      hasLensData: false,
      callFailed: false,
      exactMatchSources: [],
      visualMatchSources: [],
      matchConfidence: 'none',
      details: {},
    };
  }

  private analyzePrice(candidate: ListingCandidate, input: BeacontraInput): PriceSignal {
    const price = candidate.extractedPrice;
    const mrp = input.mrp;
    const range = input.expectedPriceRange;

    // 1. If expectedPriceRange is provided, it takes precedence as the realistic commercial baseline
    // (Addresses the Indian market reality where printed statutory MRP is 2x-4x genuine retail street price)
    if (range && range.min > 0) {
      const { min, max } = range;
      const effectiveMax = max >= min ? max : min;

      if (price >= min && price <= effectiveMax) {
        const discountFromMrp = mrp && mrp > price ? Math.round((1 - price / mrp) * 100) : undefined;
        return {
          isAnomalous: false,
          anomalyType: 'normal',
          mrp,
          priceRatio: price / min,
          details: `Price ₹${price} is within expected retail range ₹${min}–₹${effectiveMax}${discountFromMrp ? ` (${discountFromMrp}% discount off statutory MRP ₹${mrp} is standard retail street pricing)` : ''}`,
        };
      }

      if (price < min * 0.7) {
        return {
          isAnomalous: true,
          anomalyType: 'below_range',
          mrp,
          priceRatio: price / min,
          details: `Price ₹${price} is significantly below expected retail minimum ₹${min} (${Math.round((1 - price / min) * 100)}% below minimum)`,
        };
      }

      if (price < min) {
        return {
          isAnomalous: true,
          anomalyType: 'below_range',
          mrp,
          priceRatio: price / min,
          details: `Price ₹${price} is below expected retail minimum ₹${min} (${Math.round((1 - price / min) * 100)}% deviation)`,
        };
      }

      // price > effectiveMax
      return {
        isAnomalous: false,
        anomalyType: 'normal',
        mrp,
        priceRatio: price / effectiveMax,
        details: `Price ₹${price} aligns with or exceeds expected retail range ₹${min}–₹${effectiveMax}`,
      };
    }

    // 2. Fallback when expectedPriceRange is NOT provided: analyze against statutory MRP
    if (mrp && mrp > 0) {
      if (price < mrp * 0.5) {
        return {
          isAnomalous: true,
          anomalyType: 'below_mrp',
          mrp,
          priceRatio: price / mrp,
          details: `Price ₹${price} is ${Math.round((1 - price / mrp) * 100)}% below MRP ₹${mrp} (Extreme deviation)`,
        };
      }

      if (price < mrp * 0.7) {
        return {
          isAnomalous: true,
          anomalyType: 'large_deviation',
          mrp,
          priceRatio: price / mrp,
          details: `Price ₹${price} is ${Math.round((1 - price / mrp) * 100)}% below MRP ₹${mrp}`,
        };
      }

      if (price < mrp * 0.9) {
        const discountPct = Math.round((1 - price / mrp) * 100);
        return {
          isAnomalous: false,
          anomalyType: 'moderate_discount',
          mrp,
          priceRatio: price / mrp,
          details: `Price ₹${price} is ${discountPct}% below MRP ₹${mrp} (Standard market discount)`,
        };
      }

      return {
        isAnomalous: false,
        anomalyType: 'normal',
        mrp,
        priceRatio: price / mrp,
        details: `Price ₹${price} is within standard range of MRP ₹${mrp}`,
      };
    }

    // 3. Neither expectedPriceRange nor MRP provided
    return {
      isAnomalous: false,
      anomalyType: 'normal',
      details: `Price ₹${price} recorded (no MRP or expected price range provided for baseline comparison)`,
    };
  }

  private analyzeSeller(candidate: ListingCandidate, input: BeacontraInput): SellerSignal {
    const seller = candidate.seller.toLowerCase();
    const authorizedSellers = (input.knownAuthorizedSellers || []).map(s => s.toLowerCase());
    const hasAuthorizedList = authorizedSellers.length > 0;

    if (hasAuthorizedList) {
      const isAuthorized = authorizedSellers.some(auth => seller.includes(auth) || auth.includes(seller));

      if (isAuthorized) {
        return {
          isAnomalous: false,
          anomalyType: 'authorized',
          sellerName: candidate.seller,
          isAuthorized: true,
          details: `Seller "${candidate.seller}" is in authorized sellers list`,
        };
      }

      const genericPatterns = ['random', 'seller', 'shop', 'store', 'mart', 'bazaar', 'unknown', 'new'];
      const hasGenericPattern = genericPatterns.some(p => seller.includes(p));

      if (hasGenericPattern || seller.length < 5) {
        return {
          isAnomalous: true,
          anomalyType: 'generic_pattern',
          sellerName: candidate.seller,
          isAuthorized: false,
          details: `Seller "${candidate.seller}" has a generic or unverified naming pattern`,
        };
      }

      return {
        isAnomalous: true,
        anomalyType: 'unknown_seller',
        sellerName: candidate.seller,
        isAuthorized: false,
        details: `Seller "${candidate.seller}" not in authorized sellers list`,
      };
    }

    return {
      isAnomalous: false,
      anomalyType: 'no_authorized_list',
      sellerName: candidate.seller,
      isAuthorized: false,
      details: 'No authorized sellers list provided - cannot verify seller',
    };
  }

  private analyzeVisual(evidence: LensEvidence): VisualSignal {
    // The Lens request itself failed (network error, timeout, malformed image) — no
    // observation was made. This must not read as "we checked and it's fine"; it contributes
    // nothing to the score either way and says plainly that verification did not happen.
    if (evidence.callFailed) {
      return {
        isAnomalous: false,
        anomalyType: 'unavailable',
        confidence: 'low',
        matchSources: [],
        details: 'Visual verification could not be completed — the Lens request failed. This is not evidence of anything; the check simply did not run.',
        status: 'unavailable',
      };
    }

    // Lens worked and found exact match
    if (evidence.hasExactMatch) {
      return {
        isAnomalous: false,
        anomalyType: 'matched',
        confidence: 'high',
        matchSources: evidence.exactMatchSources,
        details: 'Listing photo matches official product reference image across brand or authorized channels',
        status: 'matched',
      };
    }

    // Lens worked and found visual matches
    if (evidence.hasVisualMatch) {
      // Check if matches belong to recognized brand or authorized retail channels
      const hasRecognizedMatch = evidence.hasBrandOrAuthorizedMatch ?? (
        evidence.exactMatchSources.length > 0 ||
        evidence.visualMatchSources.some(s => {
          const l = s.toLowerCase();
          return l.includes('official') || l.includes('brand') || l.includes('amazon') || l.includes('flipkart') || l.includes('croma') || l.includes('reliance');
        })
      );

      if (hasRecognizedMatch) {
        return {
          isAnomalous: false,
          anomalyType: 'visual_match',
          confidence: 'medium',
          matchSources: evidence.visualMatchSources,
          details: `Visual matches found across recognized retail or catalog sources (${evidence.visualMatchSources.slice(0, 3).join(', ')})`,
          status: 'visual_match',
        };
      }

      // Visual match exists strictly on unverified third-party sources
      return {
        isAnomalous: true,
        anomalyType: 'unverified_photo_source',
        confidence: 'medium',
        matchSources: evidence.visualMatchSources,
        details: `Listing photo matches third-party sources (${evidence.visualMatchSources.slice(0, 3).join(', ')}) outside known brand channels — unverified photo origin requiring review`,
        status: 'visual_match',
      };
    }

    // Lens worked but found no matches
    return {
      isAnomalous: false,
      anomalyType: 'no_evidence',
      confidence: 'low',
      matchSources: [],
      details: 'Visual search completed but no matches found - inconclusive',
      status: 'no_evidence',
    };
  }

  private fuseSignals(
    candidate: ListingCandidate,
    lensEvidence: LensEvidence,
    priceSignal: PriceSignal,
    sellerSignal: SellerSignal,
    visualSignal: VisualSignal
  ): FusedResult {
    let score = 0;
    const reasons: string[] = [];

    if (priceSignal.isAnomalous) {
      score += 35;
      reasons.push(`Price anomaly: ${priceSignal.details}`);
    } else {
      score += 5;
    }

    if (sellerSignal.isAnomalous) {
      score += 25;
      reasons.push(`Seller anomaly: ${sellerSignal.details}`);
    } else {
      score += 5; // Neutral base score (down from 15 to prevent false positives when no allowlist exists)
    }

    // Visual signal scoring - only add risk for actual anomalies
    // matched, visual_match, no_evidence, unavailable are NEUTRAL (not anomalous)
    if (visualSignal.isAnomalous) {
      const visualWeight = visualSignal.confidence === 'high' ? 40 : visualSignal.confidence === 'medium' ? 25 : 10;
      score += visualWeight;
      reasons.push(`Visual anomaly: ${visualSignal.details}`);
    } else {
      // Neutral visual signals (matched, visual_match, no_evidence, unavailable) add minimal base score
      // matched reduces risk slightly, others add small base
      if (visualSignal.status === 'matched') {
        score -= 5; // Slight reduction for confirmed match
      } else {
        score += 5; // Small base for other neutral statuses
      }
      reasons.push(`Visual: ${visualSignal.details}`);
    }

    let confidence: 'high' | 'medium' | 'low';
    let recommendation: 'review_urgently' | 'review' | 'monitor' | 'likely_genuine';

    if (score >= 70) {
      confidence = 'high';
      recommendation = 'review_urgently';
    } else if (score >= 50) {
      confidence = 'medium';
      recommendation = 'review';
    } else if (score >= 30) {
      confidence = 'low';
      recommendation = 'monitor';
    } else {
      confidence = 'low';
      recommendation = 'likely_genuine';
    }

    return {
      listing: candidate,
      lensEvidence,
      priceSignal,
      sellerSignal,
      visualSignal,
      compositeScore: Math.min(score, 100),
      confidence,
      evidenceSummary: reasons.join('; '),
      recommendation,
    };
  }
}

export function createBeacontraService(client: SerpApiClient): BeacontraService {
  return new BeacontraService(client);
}