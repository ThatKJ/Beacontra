import { SerpApiClient } from './serpapi-client';
import type {
  BaseSearchParams,
  LensSearchParams,
  SerpApiResponse,
  ShoppingResult,
  LensSearchResult,
} from './types';

export interface BrandLensInput {
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
  exactMatchSources: string[];
  visualMatchSources: string[];
  matchConfidence: 'high' | 'medium' | 'low' | 'none';
  details: LensSearchResult;
}

export interface PriceSignal {
  isAnomalous: boolean;
  anomalyType: 'below_mrp' | 'below_range' | 'suspicious_discount' | 'normal';
  mrp?: number;
  priceRatio?: number;
  details: string;
}

export interface SellerSignal {
  isAnomalous: boolean;
  anomalyType: 'unknown_seller' | 'new_account' | 'suspicious_pattern' | 'authorized' | 'no_authorized_list';
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

export interface BrandLensScanResult {
  scanId: string;
  dataSource: 'live' | 'fixture';
  productName: string;
  officialImageUrl: string;
  totalListingsFound: number;
  results: FusedResult[];
  createdAt: string;
  creditsUsed: number;
}

const PRICE_ANOMALY_THRESHOLD = 0.7;

export class BrandLensService {
  private client: SerpApiClient;

  constructor(client: SerpApiClient) {
    this.client = client;
  }

  private static readonly MAX_LENS_CALLS = 10;

  async scan(input: BrandLensInput): Promise<BrandLensScanResult> {
    const scanId = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = new Date().toISOString();

    const shoppingResults = await this.searchMarketplaceListings(input.productName);

    const candidates = this.extractCandidates(shoppingResults);

    const priceSignals = candidates.map(c => ({ candidate: c, priceSignal: this.analyzePrice(c, input) }));
    priceSignals.sort((a, b) => {
      const aScore = a.priceSignal.isAnomalous ? 100 : 0;
      const bScore = b.priceSignal.isAnomalous ? 100 : 0;
      if (aScore !== bScore) return bScore - aScore;
      return b.candidate.extractedPrice - a.candidate.extractedPrice;
    });

    const results: FusedResult[] = [];

    for (const entry of priceSignals) {
      const { candidate, priceSignal } = entry;
      const sellerSignal = this.analyzeSeller(candidate, input);

      let lensEvidence: LensEvidence;
      let visualSignal: VisualSignal;

      const currentLensCalls = results.filter(r => r.visualSignal.anomalyType !== 'not_verified').length;

      if (currentLensCalls < BrandLensService.MAX_LENS_CALLS) {
        lensEvidence = await this.runVisualVerification(candidate.thumbnail, input.officialImageUrl);
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

      const fused = this.fuseSignals(candidate, lensEvidence, priceSignal, sellerSignal, visualSignal);
      results.push(fused);
    }

    results.sort((a, b) => b.compositeScore - a.compositeScore);

    return {
      scanId,
      dataSource: this.client.isFixtureMode() ? 'fixture' : 'live',
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

  private extractCandidates(response: SerpApiResponse): ListingCandidate[] {
    const shoppingResults = response.shopping_results || [];
    return shoppingResults
      .filter((r): r is ShoppingResult => r.extracted_price !== undefined && r.extracted_price > 0)
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
    officialImageUrl: string
  ): Promise<LensEvidence> {
    try {
      const lensParams: LensSearchParams = {
        engine: 'google_lens',
        image_url: listingImageUrl,
      };
      const lensResponse = await this.client.search(lensParams);
      const lensResults = lensResponse.lens_results;

      // Lens returned no structured results (ai_overview only)
      if (!lensResults) {
        return {
          ...this.emptyLensEvidence(),
          hasLensData: false,
        };
      }

      const exactMatches = lensResults.exact_matches || [];
      const visualMatches = lensResults.visual_matches || [];

      const exactMatchSources = exactMatches.map(m => m.source).filter((s): s is string => Boolean(s));
      const visualMatchSources = visualMatches.map(m => m.source).filter((s): s is string => Boolean(s));

      const hasExactMatch = exactMatches.some(
        m => m.link?.includes(officialImageUrl) || m.source?.includes('official') || m.source?.includes('brand')
      );
      const hasVisualMatch = visualMatches.length > 0;

      let matchConfidence: 'high' | 'medium' | 'low' | 'none' = 'none';
      if (hasExactMatch) matchConfidence = 'high';
      else if (visualMatches.length >= 3) matchConfidence = 'medium';
      else if (visualMatches.length > 0) matchConfidence = 'low';

      return {
        hasExactMatch,
        hasVisualMatch,
        hasLensData: true,
        exactMatchSources,
        visualMatchSources,
        matchConfidence,
        details: lensResults,
      };
    } catch {
      return {
        ...this.emptyLensEvidence(),
        hasLensData: false,
      };
    }
  }

  private emptyLensEvidence(): LensEvidence {
    return {
      hasExactMatch: false,
      hasVisualMatch: false,
      hasLensData: false,
      exactMatchSources: [],
      visualMatchSources: [],
      matchConfidence: 'none',
      details: {},
    };
  }

  private analyzePrice(candidate: ListingCandidate, input: BrandLensInput): PriceSignal {
    const price = candidate.extractedPrice;
    const mrp = input.mrp;

    if (mrp && price < mrp * PRICE_ANOMALY_THRESHOLD) {
      return {
        isAnomalous: true,
        anomalyType: 'below_mrp',
        mrp,
        priceRatio: price / mrp,
        details: `Price ₹${price} is ${Math.round((1 - price / mrp) * 100)}% below MRP ₹${mrp}`,
      };
    }

    if (input.expectedPriceRange) {
      const { min, max } = input.expectedPriceRange;
      if (price < min * PRICE_ANOMALY_THRESHOLD) {
        return {
          isAnomalous: true,
          anomalyType: 'below_range',
          priceRatio: price / min,
          details: `Price ₹${price} is significantly below expected range ₹${min}-₹${max}`,
        };
      }
    }

    if (mrp && price < mrp * 0.9) {
      return {
        isAnomalous: true,
        anomalyType: 'suspicious_discount',
        mrp,
        priceRatio: price / mrp,
        details: `Price ₹${price} has suspicious discount vs MRP ₹${mrp}`,
      };
    }

    return {
      isAnomalous: false,
      anomalyType: 'normal',
      details: `Price ₹${price} within expected range`,
    };
  }

  private analyzeSeller(candidate: ListingCandidate, input: BrandLensInput): SellerSignal {
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

      const suspiciousPatterns = ['random', 'seller', 'shop', 'store', 'mart', 'bazaar', 'unknown', 'new'];
      const hasSuspiciousPattern = suspiciousPatterns.some(p => seller.includes(p));

      if (hasSuspiciousPattern || seller.length < 5) {
        return {
          isAnomalous: true,
          anomalyType: 'suspicious_pattern',
          sellerName: candidate.seller,
          isAuthorized: false,
          details: `Seller "${candidate.seller}" has suspicious naming pattern`,
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
    // Lens unavailable or returned no structured data (ai_overview only)
    if (!evidence.hasLensData) {
      return {
        isAnomalous: false,
        anomalyType: 'unavailable',
        confidence: 'low',
        matchSources: [],
        details: 'Visual verification unavailable (Lens returned AI overview only, no structured match data)',
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
        details: 'Listing photo matches official product image',
        status: 'matched',
      };
    }

    // Lens worked and found visual matches
    if (evidence.hasVisualMatch) {
      const hasBrandMismatch = evidence.visualMatchSources.some(
        s => !s.includes('official') && !s.includes('brand') && !s.includes('manufacturer')
      );

      if (hasBrandMismatch) {
        return {
          isAnomalous: true,
          anomalyType: 'unverified_photo_source',
          confidence: 'high',
          matchSources: evidence.visualMatchSources,
          details: `Listing photo matches other sources (${evidence.visualMatchSources.join(', ')}) but not official brand - unverified photo origin requiring review`,
          status: 'visual_match',
        };
      }

      return {
        isAnomalous: false,
        anomalyType: 'visual_match',
        confidence: 'medium',
        matchSources: evidence.visualMatchSources,
        details: `Visual matches found but not with official brand - possible variant or similar product`,
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
      score += 15;
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

export function createBrandLensService(client: SerpApiClient): BrandLensService {
  return new BrandLensService(client);
}