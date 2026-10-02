/**
 * Beacontra Investigation Intelligence & Action Center Playbooks
 * 
 * Provides:
 * 1. Deterministic Explanation Engine ("Explain This Finding"):
 *    - What was observed
 *    - Why the observation matters
 *    - Supporting evidence breakdown
 *    - Missing evidence catalog (preventing absence from becoming affirmative proof)
 *    - "What Would Change This Finding" counterfactual evaluation
 * 2. Strict separation of Evidence Strength, Commercial Signals, Uncertainty, and Review Priority.
 * 3. Investigation Playbook suggesting actionable human next-steps without accusing merchants
 *    or issuing legal determinations.
 */

export const ETHICAL_TRIAGE_NOTICE =
  'INVESTIGATION NOTICE: Findings are technical and commercial risk signals synthesized ' +
  'for human analyst verification. They do NOT constitute proof of counterfeit merchandise, ' +
  'intellectual property infringement, or legal liability. Enforcement or contact with merchants ' +
  'must occur only after independent verification by authorized brand counsel.';

export interface SupportingEvidenceItem {
  dimension: 'price' | 'seller' | 'visual' | 'variant' | 'platform';
  observation: string;
  sourceUrl?: string;
  confidence: number; // 0 to 1
}

export interface MissingEvidenceItem {
  dimension: string;
  description: string;
  impactOnAssessment: string;
}

export interface CounterfactualScenario {
  scenario: string;
  potentialShift: string;
}

export interface InvestigationPlaybook {
  recommendedAction: string;
  humanTriageSteps: string[];
  suggestedPreservationArtifacts: string[];
  ethicalLegalDisclaimers: string;
}

export interface FindingExplanation {
  findingId: string;
  headline: string;
  whatWasObserved: string;
  whyItMatters: string;
  supportingEvidence: SupportingEvidenceItem[];
  missingEvidence: MissingEvidenceItem[];
  whatWouldChangeThisFinding: CounterfactualScenario[];
  dimensions: {
    evidenceStrength: 'strong' | 'moderate' | 'circumstantial' | 'insufficient';
    commercialSignal: 'anomalous_underpricing' | 'promotional_discount' | 'normal_retail' | 'outlier';
    uncertaintyLevel: 'high' | 'medium' | 'low';
    reviewPriority: 'urgent_review' | 'standard_review' | 'informational';
  };
  playbook: InvestigationPlaybook;
}

export interface FindingContext {
  id: string;
  productName: string;
  brandName?: string;
  mrp?: number;
  extractedPrice: number;
  originalPriceText?: string;
  sellerName: string;
  source: string;
  productUrl?: string;
  imageUrl?: string;
  lensMatchStatus?: 'exact_match' | 'visual_match' | 'no_match' | 'unprocessed';
  isAuthorizedSeller?: boolean;
  medianMarketPrice?: number;
  isAccessory?: boolean;
  hardwareTierMismatch?: string;
  userCorrectionApplied?: boolean;
}

export class InvestigationIntelligenceService {
  /**
   * Generates a comprehensive, reproducible, deterministic explanation for any listing finding.
   */
  explainFinding(ctx: FindingContext): FindingExplanation {
    const supporting: SupportingEvidenceItem[] = [];
    const missing: MissingEvidenceItem[] = [];
    const counterfactuals: CounterfactualScenario[] = [];

    const mrp = ctx.mrp || 0;
    const price = ctx.extractedPrice;
    const median = ctx.medianMarketPrice || mrp;
    const priceVarianceVsMedian = median > 0 ? Math.round(((price - median) / median) * 100) : 0;
    const priceVarianceVsMrp = mrp > 0 ? Math.round(((price - mrp) / mrp) * 100) : 0;

    // 1. Evaluate Commercial / Price Evidence
    if (price > 0) {
      if (priceVarianceVsMedian <= -45 || (mrp > 0 && price / mrp < 0.3 && !ctx.isAuthorizedSeller)) {
        supporting.push({
          dimension: 'price',
          observation: `Observed offer of ₹${price} is ${Math.abs(priceVarianceVsMedian)}% below current market median (₹${median}) and ${Math.abs(priceVarianceVsMrp)}% below statutory MRP (₹${mrp}).`,
          sourceUrl: ctx.productUrl,
          confidence: 0.9,
        });
      } else if (priceVarianceVsMedian <= -20) {
        supporting.push({
          dimension: 'price',
          observation: `Observed offer of ₹${price} represents a competitive retail discount (${Math.abs(priceVarianceVsMedian)}% below market median).`,
          sourceUrl: ctx.productUrl,
          confidence: 0.75,
        });
      } else {
        supporting.push({
          dimension: 'price',
          observation: `Observed offer of ₹${price} aligns comfortably with prevailing market baseline (₹${median}).`,
          sourceUrl: ctx.productUrl,
          confidence: 0.85,
        });
      }
    } else {
      missing.push({
        dimension: 'price',
        description: 'Listing does not display a clear numeric offer price in current search index.',
        impactOnAssessment: 'Price variance could not be calculated; risk priority lowered due to lack of commercial signal.',
      });
    }

    // 2. Evaluate Seller Evidence
    if (ctx.sellerName) {
      if (ctx.isAuthorizedSeller) {
        supporting.push({
          dimension: 'seller',
          observation: `Seller "${ctx.sellerName}" matches known authorized brand partner / primary distributor list.`,
          confidence: 0.95,
        });
      } else {
        supporting.push({
          dimension: 'seller',
          observation: `Seller "${ctx.sellerName}" is not listed in registered authorized brand distributor records.`,
          confidence: 0.8,
        });
      }
    } else {
      missing.push({
        dimension: 'seller',
        description: 'Direct merchant name was not exposed in marketplace search snippet.',
        impactOnAssessment: 'Seller legitimacy cannot be confirmed without visiting storefront card directly.',
      });
    }

    // 3. Evaluate Visual Evidence
    if (ctx.lensMatchStatus === 'exact_match') {
      supporting.push({
        dimension: 'visual',
        observation: 'Google Lens confirmed exact visual matches with official catalog imagery across multiple online domains.',
        confidence: 0.9,
      });
    } else if (ctx.lensMatchStatus === 'visual_match') {
      supporting.push({
        dimension: 'visual',
        observation: 'Google Lens found visually similar images on secondary marketplaces.',
        confidence: 0.75,
      });
    } else if (ctx.lensMatchStatus === 'no_match') {
      missing.push({
        dimension: 'visual',
        description: 'Google Lens indexed zero matching co-occurrences for this specific image URL.',
        impactOnAssessment: 'Absence of indexed imagery does not imply illegitimate product; photo may be custom seller photography or recent upload.',
      });
    }

    // 4. Missing Physical Evidence
    missing.push({
      dimension: 'packaging_and_physical',
      description: 'Barcode, IMEI/serial number, and packaging tamper-evident seal verification are unavailable in web search results.',
      impactOnAssessment: 'Physical authenticity cannot be established without physical sample procurement.',
    });

    // 5. Counterfactuals ("What Would Change This Finding")
    if (priceVarianceVsMedian <= -40) {
      counterfactuals.push({
        scenario: 'If merchant produces proof of authorized bulk liquidation, clearance, or open-box refurbished status',
        potentialShift: 'The pricing variance would be re-classified from anomalous underpricing to legitimate secondary liquidation.',
      });
    }
    if (!ctx.isAuthorizedSeller) {
      counterfactuals.push({
        scenario: 'If brand registers seller as an authorized regional sub-dealer or partner',
        potentialShift: 'Seller risk signal drops to neutral and listing is classified as authorized channel.',
      });
    }
    if (ctx.lensMatchStatus === 'no_match') {
      counterfactuals.push({
        scenario: 'If high-resolution retail box photograph is provided and matches brand typography',
        potentialShift: 'Visual evidence strengthens toward confirmed genuine packaging.',
      });
    }

    // 6. Synthesize Dimensions & Severity
    const isAnomalousPrice = priceVarianceVsMedian <= -45 && !ctx.isAuthorizedSeller;
    const isSevereDiscount = priceVarianceVsMedian <= -30 && !ctx.isAuthorizedSeller;

    const evidenceStrength = (supporting.length >= 2 && ctx.lensMatchStatus !== 'unprocessed')
      ? 'strong'
      : (supporting.length >= 1 ? 'moderate' : 'circumstantial');

    const commercialSignal = isAnomalousPrice
      ? 'anomalous_underpricing'
      : (priceVarianceVsMedian < -20 ? 'promotional_discount' : 'normal_retail');

    const uncertaintyLevel = missing.length >= 2 ? 'high' : 'medium';

    const reviewPriority = isAnomalousPrice
      ? 'urgent_review'
      : (isSevereDiscount ? 'standard_review' : 'informational');

    const headline = isAnomalousPrice
      ? `Anomalous Commercial Variance: Offer ₹${price} departs sharply from market median (₹${median})`
      : (ctx.isAuthorizedSeller
        ? `Authorized Retail Offer: ₹${price} from verified partner "${ctx.sellerName}"`
        : `Competitive Marketplace Offer: ₹${price} from merchant "${ctx.sellerName}"`);

    const whatWasObserved =
      `Marketplace listing on ${ctx.source} offers "${ctx.productName}" for ₹${price} by seller "${ctx.sellerName}". ` +
      `Market baseline median is ₹${median} across comparable offers.`;

    const whyItMatters = isAnomalousPrice
      ? `Extreme price deviations (>45% below concurrent market street price) from unverified merchant accounts ` +
        `frequently correlate with counterfeit stock, grey-market imports, refurbished items passed as new, or fraudulent storefronts in Indian e-commerce.`
      : `Offer prices near baseline or from authorized distributors represent normal marketplace competition and require no adversarial response.`;

    // 7. Human Playbook
    const playbook = this.generatePlaybook(reviewPriority, ctx);

    return {
      findingId: ctx.id,
      headline,
      whatWasObserved,
      whyItMatters,
      supportingEvidence: supporting,
      missingEvidence: missing,
      whatWouldChangeThisFinding: counterfactuals,
      dimensions: {
        evidenceStrength,
        commercialSignal,
        uncertaintyLevel,
        reviewPriority,
      },
      playbook,
    };
  }

  /**
   * Generates a recommended human action playbook for the finding.
   */
  private generatePlaybook(
    priority: 'urgent_review' | 'standard_review' | 'informational',
    _ctx: FindingContext
  ): InvestigationPlaybook {
    if (priority === 'urgent_review') {
      return {
        recommendedAction: 'Preserve evidence observations, verify merchant business entity, and consider test purchase.',
        humanTriageSteps: [
          '1. Inspect listing page directly to confirm whether seller is a new storefront or has recent negative feedback.',
          '2. Check whether product description mentions "refurbished", "open-box", or "unbranded OEM".',
          '3. Cross-reference seller GSTIN or legal registration details if displayed on marketplace storefront card.',
          '4. Conduct a documented test-purchase if brand protection protocol requires physical unit examination.',
          '5. Do NOT submit automated counterfeit notices without physical confirmation.',
        ],
        suggestedPreservationArtifacts: [
          'Full-page timestamped PDF/PNG screenshot of listing',
          'JSON observation payload export from Beacontra',
          'Merchant storefront URL and public reviews',
        ],
        ethicalLegalDisclaimers: ETHICAL_TRIAGE_NOTICE,
      };
    }

    if (priority === 'standard_review') {
      return {
        recommendedAction: 'Log listing to Watchtower monitor; check if price normalizes after promotional cycle.',
        humanTriageSteps: [
          '1. Confirm whether listing is participating in a temporary platform sale (e.g. Great Indian Festival, Big Billion Days).',
          '2. Check if seller is an authorized sub-distributor not yet indexed in Brand DNA.',
          '3. Monitor listing over the next 48-72 hours via Watchtower.',
        ],
        suggestedPreservationArtifacts: ['Beacontra scan ID snapshot'],
        ethicalLegalDisclaimers: ETHICAL_TRIAGE_NOTICE,
      };
    }

    return {
      recommendedAction: 'No immediate action required. Listing exhibits standard commercial parameters.',
      humanTriageSteps: [
        'Listing conforms to market baseline.',
        'Retain in routine periodic monitoring.',
      ],
      suggestedPreservationArtifacts: [],
      ethicalLegalDisclaimers: ETHICAL_TRIAGE_NOTICE,
    };
  }
}
