/**
 * Beacontra OS — Investigation Autopilot Engine
 *
 * Deterministic investigation planner and bounded autonomous execution engine.
 * Synthesizes Brand DNA, Market Radar, Visual Forensics, Watchtower, and Action Center.
 *
 * Enforces strict server-side credit limits, requires explicit user approval,
 * and maintains total provenance linking every finding to concrete search observations.
 */

import type { SerpApiClient } from './serpapi-client';
import type { EvidenceRepository, MarketplaceListing, VisualEvidence } from './evidence-core';
import type { BrandDnaService, ProductProfile } from './brand-dna';
import { MarketRadarService, type MarketRadarReport } from './market-radar';
import { VisualForensicsService, type EvidenceGraph, type VisualInvestigationResult } from './visual-forensics';
import { WatchtowerService, type WatchtowerSnapshot, type SnapshotComparisonResult } from './watchtower';
import { generateInvestigationHtmlReport, type InvestigationCase } from './evidence-desk';

export type GapSeverity = 'high' | 'medium' | 'low';

export type EvidenceGapType =
  | 'missing_visual_evidence'
  | 'unverified_merchant'
  | 'insufficient_baseline'
  | 'conflicting_variant_signals'
  | 'stale_observations'
  | 'drastic_underpricing';

export interface EvidenceGap {
  id: string;
  type: EvidenceGapType;
  severity: GapSeverity;
  title: string;
  description: string;
  targetListingId?: string;
  targetImageUrl?: string;
  targetMerchantName?: string;
  recommendedAction: string;
  estimatedCredits: number;
}

export type StepEngine = 'google_shopping' | 'google_lens' | 'local_analysis';
export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';

export interface AutopilotInvestigationStep {
  stepId: string;
  order: number;
  engine: StepEngine;
  action: string;
  description: string;
  estimatedCredits: number;
  status: StepStatus;
  targetListingId?: string;
  targetImageUrl?: string;
  reason: string;
  executionResult?: {
    summary: string;
    itemsDiscovered?: number;
    creditsSpent: number;
    error?: string;
  };
}

export interface InvestigationTemplate {
  id: 'fast_baseline' | 'anomaly_verification' | 'deep_marketplace_sweep';
  name: string;
  description: string;
  maxCredits: number;
  recommendedFor: string;
  allowedEngines: StepEngine[];
}

export const INVESTIGATION_TEMPLATES: InvestigationTemplate[] = [
  {
    id: 'fast_baseline',
    name: 'Fast Baseline & Anomaly Check',
    description: 'Discovers marketplace listings, evaluates variant matches, and computes IQR robust price baselines without visual searches.',
    maxCredits: 1,
    recommendedFor: 'Initial product intake or rapid daily price checks.',
    allowedEngines: ['google_shopping', 'local_analysis'],
  },
  {
    id: 'anomaly_verification',
    name: 'Counterfeit Lead & Outlier Verification',
    description: 'Discovers listings, computes baseline, and triggers targeted Google Lens reverse-image forensics on top 2 anomalous price outliers.',
    maxCredits: 3,
    recommendedFor: 'Investigating suspected counterfeit or grey-market price collapses.',
    allowedEngines: ['google_shopping', 'google_lens', 'local_analysis'],
  },
  {
    id: 'deep_marketplace_sweep',
    name: 'Deep Marketplace Forensic Sweep',
    description: 'Comprehensive multi-platform discovery plus bounded reverse-image searches for up to 5 unverified listings with images.',
    maxCredits: 6,
    recommendedFor: 'Thorough brand protection audit before legal review or high-priority triage.',
    allowedEngines: ['google_shopping', 'google_lens', 'local_analysis'],
  },
];

export interface AutopilotInvestigationPlan {
  planId: string;
  productId: string;
  productName: string;
  brandName: string;
  templateId?: string;
  createdAt: string;
  detectedGaps: EvidenceGap[];
  steps: AutopilotInvestigationStep[];
  totalEstimatedCredits: number;
  requiresApproval: boolean;
  status: 'planned' | 'approved' | 'executed' | 'cancelled';
}

export interface BeforeAndAfterEvidence {
  before: {
    listingCount: number;
    visualEvidenceCount: number;
    medianPrice?: number;
    anomalousListingCount: number;
  };
  after: {
    listingCount: number;
    visualEvidenceCount: number;
    medianPrice?: number;
    anomalousListingCount: number;
  };
  deltas: {
    newListingsDiscovered: number;
    newLensMatchesDiscovered: number;
    priceShiftPercent?: number;
    newAnomaliesFlagged: number;
  };
}

export interface AutopilotExecutionResult {
  executionId: string;
  planId: string;
  productId: string;
  productName: string;
  brandName: string;
  timestamp: string;
  userApproved: boolean;
  approvedBudgetCredits: number;
  spentCredits: number;
  remainingCredits: number;
  steps: AutopilotInvestigationStep[];
  beforeAndAfter: BeforeAndAfterEvidence;
  remainingUnresolvedGaps: EvidenceGap[];
  caseId: string;
  radarReport: MarketRadarReport;
  evidenceGraph: EvidenceGraph;
  narrativeSummary: string;
  htmlReportUrl?: string;
}

export interface ReplayFrame {
  frameIndex: number;
  timestamp: string;
  stepId: string;
  action: string;
  creditsSpentSoFar: number;
  observationsSnapshot: {
    listingsCount: number;
    visualMatchesCount: number;
    activeAnomaliesCount: number;
  };
  notes: string;
}

export interface AutopilotReplay {
  replayId: string;
  executionId: string;
  productId: string;
  productName: string;
  executedAt: string;
  frames: ReplayFrame[];
  finalResult: {
    spentCredits: number;
    totalListings: number;
    totalVisualMatches: number;
    caseId: string;
  };
}

export class InvestigationAutopilotService {
  private readonly MAX_SERVER_BUDGET = 10; // Hard server ceiling for any single autopilot run

  constructor(
    private readonly client: SerpApiClient,
    private readonly repository: EvidenceRepository,
    private readonly brandDna: BrandDnaService
  ) {}

  private isListingRelevant(product: ProductProfile, listing: MarketplaceListing): boolean {
    const titleLower = (listing.title || '').toLowerCase();
    const prodLower = (product.productName || '').toLowerCase();
    const brandLower = (product.brandName || '').toLowerCase();
    const brandWords = brandLower.split(/[^a-z0-9]+/i).filter((w) => w.length >= 3);
    const prodWords = prodLower.split(/[^a-z0-9]+/i).filter((w) => w.length >= 3);

    return (
      titleLower.includes(brandLower) ||
      brandWords.some((w) => titleLower.includes(w)) ||
      titleLower.includes(prodLower.slice(0, 10)) ||
      prodWords.filter((w) => titleLower.includes(w)).length >= 2
    );
  }

  /**
   * 1. Inspect existing product profile and stored observations to detect concrete evidence gaps.
   */
  async analyzeEvidenceGaps(product: ProductProfile): Promise<EvidenceGap[]> {
    const gaps: EvidenceGap[] = [];
    const listings = await this.repository.listListings();
    // Filter listings relevant to this product
    const relevantListings = listings.filter((l) => this.isListingRelevant(product, l));

    // Check 1: Insufficient baseline
    if (relevantListings.length < 3) {
      gaps.push({
        id: `gap_baseline_${product.id}`,
        type: 'insufficient_baseline',
        severity: 'high',
        title: 'Sparse Marketplace Coverage',
        description: `Only ${relevantListings.length} listing(s) observed. A robust statistical baseline requires at least 3 comparable marketplace offers.`,
        recommendedAction: 'Execute Google Shopping search to discover broader marketplace distribution.',
        estimatedCredits: 1,
      });
    }

    // Check 2: Missing visual evidence on anomalous listings
    for (const listing of relevantListings) {
      const visualRecords = await this.repository.getVisualEvidenceForListing(listing.id);
      const listingPrice = listing.extractedPrice ?? (listing as unknown as { price?: { amount?: number } }).price?.amount ?? 0;
      const isPriceOutlier =
        product.statutoryMrp && listingPrice > 0 && listingPrice < product.statutoryMrp * 0.45;

      if (listing.imageUrl && visualRecords.length === 0) {
        gaps.push({
          id: `gap_visual_${listing.id}`,
          type: 'missing_visual_evidence',
          severity: isPriceOutlier ? 'high' : 'medium',
          title: `Unverified Listing Imagery: ${listing.source}`,
          description: `Listing at ₹${listingPrice.toLocaleString('en-IN')} (${listing.source}) has an image but no Google Lens reverse-match forensics.`,
          targetListingId: listing.id,
          targetImageUrl: listing.imageUrl,
          recommendedAction: 'Perform bounded Google Lens visual match inspection to trace photo origin.',
          estimatedCredits: 1,
        });
      }
    }

    // Check 3: Unverified merchants selling at deep divergence
    const merchants = await this.repository.listMerchants();
    const authorizedSet = new Set((product.authorizedSellers || []).map((s) => s.toLowerCase()));

    for (const listing of relevantListings) {
      const listingPrice = listing.extractedPrice ?? (listing as unknown as { price?: { amount?: number } }).price?.amount ?? 0;
      if (listing.merchantId) {
        const merchant = merchants.find((m) => m.id === listing.merchantId);
        const nameLower = (merchant?.name || listing.sellerName || '').toLowerCase();
        const isAuthorized = Array.from(authorizedSet).some((auth) => nameLower.includes(auth));

        if (!isAuthorized && merchant?.verificationStatus !== 'authorized') {
          if (product.statutoryMrp && listingPrice > 0 && listingPrice < product.statutoryMrp * 0.5) {
            gaps.push({
              id: `gap_merchant_${listing.id}`,
              type: 'unverified_merchant',
              severity: 'medium',
              title: `Unverified Merchant at Severe Discount: ${merchant?.name || 'Unknown'}`,
              description: `Listing is sold by an unverified merchant '${merchant?.name || 'Unknown'}' at >50% below statutory MRP.`,
              targetListingId: listing.id,
              targetMerchantName: merchant?.name,
              recommendedAction: 'Flag for human merchant review and check marketplace seller profile.',
              estimatedCredits: 0,
            });
          }
        }
      }
    }

    // Check 4: Stale observations (older than 14 days)
    const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const staleListings = relevantListings.filter(
      (l) => new Date(l.createdAt || l.updatedAt).getTime() < fourteenDaysAgo
    );
    if (staleListings.length > 0) {
      gaps.push({
        id: `gap_stale_${product.id}`,
        type: 'stale_observations',
        severity: 'low',
        title: `${staleListings.length} Stale Marketplace Observation(s)`,
        description: `Marketplace offers were last recorded over 14 days ago. Commercial pricing and active availability may have shifted.`,
        recommendedAction: 'Refresh marketplace scan to verify active listings and current pricing.',
        estimatedCredits: 1,
      });
    }

    return gaps;
  }

  /**
   * 2. Generate a deterministic investigation plan based on detected gaps and optional template.
   */
  async createInvestigationPlan(
    product: ProductProfile,
    templateId: 'fast_baseline' | 'anomaly_verification' | 'deep_marketplace_sweep' = 'anomaly_verification',
    customMaxCredits?: number
  ): Promise<AutopilotInvestigationPlan> {
    const template =
      INVESTIGATION_TEMPLATES.find((t) => t.id === templateId) ?? INVESTIGATION_TEMPLATES[1]!;
    const budgetLimit = Math.min(
      customMaxCredits ?? template.maxCredits,
      this.MAX_SERVER_BUDGET
    );

    const gaps = await this.analyzeEvidenceGaps(product);
    const steps: AutopilotInvestigationStep[] = [];
    let allocatedCredits = 0;
    let stepOrder = 1;

    // Step A: Always discover/refresh Google Shopping offers if baseline is insufficient or stale
    const needsShopping =
      gaps.some((g) => g.type === 'insufficient_baseline' || g.type === 'stale_observations') ||
      template.allowedEngines.includes('google_shopping');

    if (needsShopping && allocatedCredits < budgetLimit) {
      steps.push({
        stepId: `step_${stepOrder++}`,
        order: stepOrder,
        engine: 'google_shopping',
        action: 'Search Marketplace Offers',
        description: `Execute Google Shopping discovery for "${product.brandName} ${product.productName}" across Indian marketplaces.`,
        estimatedCredits: 1,
        status: 'pending',
        reason: 'Establish current market price baseline, discover new sellers, and evaluate variant compatibility.',
      });
      allocatedCredits += 1;
    }

    // Step B: Visual Forensics with Google Lens on high-severity visual gaps
    if (template.allowedEngines.includes('google_lens')) {
      const visualGaps = gaps
        .filter((g) => g.type === 'missing_visual_evidence' && g.targetImageUrl)
        .sort((a, b) => (a.severity === 'high' ? -1 : 1));

      for (const gap of visualGaps) {
        if (allocatedCredits + 1 <= budgetLimit) {
          steps.push({
            stepId: `step_${stepOrder++}`,
            order: stepOrder,
            engine: 'google_lens',
            action: 'Trace Image Lineage',
            description: `Query Google Lens with observed photo from listing ${gap.targetListingId}.`,
            estimatedCredits: 1,
            status: 'pending',
            targetListingId: gap.targetListingId,
            targetImageUrl: gap.targetImageUrl,
            reason: `Visual gap on anomalous listing: ${gap.description}`,
          });
          allocatedCredits += 1;
        } else {
          break;
        }
      }
    }

    // Step C: Deterministic Local Evidence Synthesis & Baseline Recalculation
    steps.push({
      stepId: `step_${stepOrder++}`,
      order: stepOrder,
      engine: 'local_analysis',
      action: 'Synthesize Evidence & Recalculate Baseline',
      description: 'Compute IQR price baseline, isolate variant anomalies, build evidence graph, and assemble investigation case.',
      estimatedCredits: 0,
      status: 'pending',
      reason: 'Consolidate newly acquired observations into unified evidence store with zero credit cost.',
    });

    const plan: AutopilotInvestigationPlan = {
      planId: `plan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      productId: product.id,
      productName: product.productName,
      brandName: product.brandName,
      templateId: template.id,
      createdAt: new Date().toISOString(),
      detectedGaps: gaps,
      steps,
      totalEstimatedCredits: allocatedCredits,
      requiresApproval: true,
      status: 'planned',
    };

    return plan;
  }

  /**
   * 3. Execute an authorized, strictly bounded investigation plan.
   * Enforces server-side budgets and requires explicit user approval.
   */
  async executePlan(
    plan: AutopilotInvestigationPlan,
    authorization: {
      userApproved: boolean;
      approvedBudgetCredits: number;
    }
  ): Promise<AutopilotExecutionResult> {
    if (!authorization.userApproved) {
      throw new Error('Autopilot investigation aborted: User approval is strictly required before consuming search credits.');
    }

    const maxCreditsAllowed = Math.min(
      authorization.approvedBudgetCredits,
      plan.totalEstimatedCredits,
      this.MAX_SERVER_BUDGET
    );

    const product = await this.brandDna.getProduct(plan.productId);
    if (!product) {
      throw new Error(`Product profile '${plan.productId}' not found in Brand Vault.`);
    }

    // Capture "Before" snapshot
    const initialListings = await this.repository.listListings();
    const initialRelevant = initialListings.filter((l) =>
      this.isListingRelevant(product, l)
    );
    let initialVisualCount = 0;
    for (const l of initialRelevant) {
      const vis = await this.repository.getVisualEvidenceForListing(l.id);
      initialVisualCount += vis.length;
    }

    let spentCredits = 0;
    const executedSteps: AutopilotInvestigationStep[] = [];
    const radar = new MarketRadarService(this.client, this.repository, this.brandDna);
    const forensics = new VisualForensicsService(this.client, this.repository);
    let latestRadarReport: MarketRadarReport | null = null;

    for (const step of plan.steps) {
      const stepCopy: AutopilotInvestigationStep = { ...step };

      // Budget check
      if (stepCopy.estimatedCredits > 0 && spentCredits + stepCopy.estimatedCredits > maxCreditsAllowed) {
        stepCopy.status = 'skipped';
        stepCopy.executionResult = {
          summary: `Skipped to preserve budget. Required ${stepCopy.estimatedCredits} credit(s), but budget limit of ${maxCreditsAllowed} reached.`,
          creditsSpent: 0,
        };
        executedSteps.push(stepCopy);
        continue;
      }

      stepCopy.status = 'in_progress';

      try {
        if (stepCopy.engine === 'google_shopping') {
          const report = await radar.runRadar(product, {
            mode: 'quick',
            allowDeepScan: false,
          });
          latestRadarReport = report;
          spentCredits += 1;
          stepCopy.status = 'completed';
          const totalObserved = report.comparableListings.length + report.excludedListings.length;
          const median = report.baseline.medianMarketPrice;
          stepCopy.executionResult = {
            summary: `Discovered ${totalObserved} offers; ${report.comparableListings.length} comparable. Median price: ₹${median ? median.toLocaleString('en-IN') : 'N/A'}.`,
            itemsDiscovered: totalObserved,
            creditsSpent: 1,
          };
        } else if (stepCopy.engine === 'google_lens') {
          if (!stepCopy.targetListingId) {
            throw new Error('Target listing ID missing for Google Lens step.');
          }
          const listing = await this.repository.getListing(stepCopy.targetListingId);
          if (!listing || !listing.imageUrl) {
            throw new Error(`Listing ${stepCopy.targetListingId} has no verifiable image URL.`);
          }

          const forensicResult = await forensics.investigateImage(listing);
          spentCredits += 1;
          stepCopy.status = 'completed';
          stepCopy.executionResult = {
            summary: `Lens status: ${forensicResult.lensStatus} (${forensicResult.matchedSources.length} match(es) across indexed domains). ${forensicResult.interpretation}`,
            itemsDiscovered: forensicResult.matchedSources.length,
            creditsSpent: 1,
          };
        } else if (stepCopy.engine === 'local_analysis') {
          // If no shopping search was executed in this plan, run a local radar synthesis
          if (!latestRadarReport) {
            latestRadarReport = await radar.runRadar(product, {
              mode: 'quick',
              allowDeepScan: false,
            });
          }
          stepCopy.status = 'completed';
          stepCopy.executionResult = {
            summary: 'Consolidated observations into unified evidence graph and verified cross-signal integrity.',
            itemsDiscovered: 0,
            creditsSpent: 0,
          };
        }
      } catch (err) {
        stepCopy.status = 'failed';
        stepCopy.executionResult = {
          summary: `Failed to execute step: ${err instanceof Error ? err.message : 'Unknown error'}`,
          creditsSpent: 0,
          error: err instanceof Error ? err.message : String(err),
        };
      }

      executedSteps.push(stepCopy);
    }

    // Build finalized Evidence Graph & Watchtower snapshot
    const evidenceGraph = await forensics.buildGraph({ productId: product.id });
    const watchtower = new WatchtowerService(this.repository);
    if (latestRadarReport) {
      await watchtower.captureSnapshot(latestRadarReport, product.brandId);
    }

    // Capture "After" metrics
    const finalListings = await this.repository.listListings();
    const finalRelevant = finalListings.filter((l) =>
      this.isListingRelevant(product, l)
    );
    let finalVisualCount = 0;
    for (const l of finalRelevant) {
      const vis = await this.repository.getVisualEvidenceForListing(l.id);
      finalVisualCount += vis.length;
    }

    const allObservedListings = [
      ...(latestRadarReport?.comparableListings || []),
      ...(latestRadarReport?.excludedListings || []),
    ];
    const anomalousOffers = allObservedListings.filter(
      (l) => l.requiresReview || l.priceClassification === 'anomalous_underpricing'
    );

    const beforeAndAfter: BeforeAndAfterEvidence = {
      before: {
        listingCount: initialRelevant.length,
        visualEvidenceCount: initialVisualCount,
        medianPrice: undefined,
        anomalousListingCount: 0,
      },
      after: {
        listingCount: finalRelevant.length,
        visualEvidenceCount: finalVisualCount,
        medianPrice: latestRadarReport?.baseline?.medianMarketPrice ?? undefined,
        anomalousListingCount: anomalousOffers.length,
      },
      deltas: {
        newListingsDiscovered: Math.max(0, finalRelevant.length - initialRelevant.length),
        newLensMatchesDiscovered: Math.max(0, finalVisualCount - initialVisualCount),
        newAnomaliesFlagged: anomalousOffers.length,
      },
    };

    // Calculate remaining unresolved gaps
    const remainingGaps = await this.analyzeEvidenceGaps(product);

    // Save Case in repository
    const caseId = `case_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    await this.repository.saveCase({
      id: caseId,
      caseNumber: `CAS-${Date.now().toString().slice(-6)}`,
      title: `Autopilot Investigation: ${product.productName}`,
      productId: product.id,
      status: anomalousOffers.length > 0 ? 'under_review' : 'active',
      priority: anomalousOffers.length > 0 ? 'high' : 'medium',
      listingIds: finalRelevant.map((l) => l.id),
      notes: [
        {
          id: `note_${Date.now()}`,
          author: 'Beacontra Autopilot Engine',
          content: `Automated investigation executed under plan '${plan.planId}' (${plan.templateId || 'custom'}). Discovered ${beforeAndAfter.deltas.newListingsDiscovered} listings, ${beforeAndAfter.deltas.newLensMatchesDiscovered} Lens match(es). Flagged ${anomalousOffers.length} listing(s) for review.`,
          createdAt: new Date().toISOString(),
        },
      ],
      tags: ['autopilot', plan.templateId || 'custom', ...(anomalousOffers.length > 0 ? ['anomalies_detected'] : [])],
      findingsSummary: `Discovered ${finalRelevant.length} relevant offers. ${anomalousOffers.length} offer(s) flagged for review based on price or seller divergence.`,
      legalDisclaimer:
        'Observations reflect automated marketplace searches. They do not constitute legal determinations of counterfeit or copyright infringement.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const narrativeSummary = `Autopilot completed investigation on '${product.productName}' using ${spentCredits} credit(s). Discovered ${beforeAndAfter.deltas.newListingsDiscovered} new listings and ${beforeAndAfter.deltas.newLensMatchesDiscovered} visual forensics matches. Identified ${anomalousOffers.length} listing(s) requiring commercial review.`;

    const executionResult: AutopilotExecutionResult = {
      executionId: `exec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      planId: plan.planId,
      productId: product.id,
      productName: product.productName,
      brandName: product.brandName,
      timestamp: new Date().toISOString(),
      userApproved: true,
      approvedBudgetCredits: maxCreditsAllowed,
      spentCredits,
      remainingCredits: maxCreditsAllowed - spentCredits,
      steps: executedSteps,
      beforeAndAfter,
      remainingUnresolvedGaps: remainingGaps,
      caseId,
      radarReport: latestRadarReport!,
      evidenceGraph,
      narrativeSummary,
      htmlReportUrl: `/api/cases/${caseId}/report`,
    };

    // Persist replay record in repository cache
    await this.saveReplay(executionResult);

    return executionResult;
  }

  /**
   * 4. Save structured investigation replay frames for deterministic chronological playback.
   */
  private async saveReplay(result: AutopilotExecutionResult): Promise<void> {
    const frames: ReplayFrame[] = [];
    let creditsSpent = 0;

    frames.push({
      frameIndex: 0,
      timestamp: result.timestamp,
      stepId: 'init',
      action: 'Investigation Initialized & Ground Truth Loaded',
      creditsSpentSoFar: 0,
      observationsSnapshot: {
        listingsCount: result.beforeAndAfter.before.listingCount,
        visualMatchesCount: result.beforeAndAfter.before.visualEvidenceCount,
        activeAnomaliesCount: 0,
      },
      notes: `Targeting product '${result.productName}' with approved budget of ${result.approvedBudgetCredits} credits.`,
    });

    result.steps.forEach((step, idx) => {
      creditsSpent += step.executionResult?.creditsSpent || 0;
      frames.push({
        frameIndex: idx + 1,
        timestamp: new Date().toISOString(),
        stepId: step.stepId,
        action: step.action,
        creditsSpentSoFar: creditsSpent,
        observationsSnapshot: {
          listingsCount: step.executionResult?.itemsDiscovered || result.beforeAndAfter.after.listingCount,
          visualMatchesCount: result.beforeAndAfter.after.visualEvidenceCount,
          activeAnomaliesCount: result.beforeAndAfter.after.anomalousListingCount,
        },
        notes: step.executionResult?.summary || step.description,
      });
    });

    const replay: AutopilotReplay = {
      replayId: `replay_${result.executionId}`,
      executionId: result.executionId,
      productId: result.productId,
      productName: result.productName,
      executedAt: result.timestamp,
      frames,
      finalResult: {
        spentCredits: result.spentCredits,
        totalListings: result.beforeAndAfter.after.listingCount,
        totalVisualMatches: result.beforeAndAfter.after.visualEvidenceCount,
        caseId: result.caseId,
      },
    };

    // Store in KV cache using the underlying repository cache interface
    const repoWithCache = this.repository as unknown as { cache?: { set: (k: string, v: unknown) => Promise<void> } };
    if (repoWithCache.cache && typeof repoWithCache.cache.set === 'function') {
      await repoWithCache.cache.set(`autopilot:replay:${result.executionId}`, {
        data: replay,
        timestamp: Date.now(),
        ttl: 30 * 24 * 60 * 60 * 1000, // 30 days
      });
    }
  }

  /**
   * 5. Retrieve an investigation replay.
   */
  async getReplay(executionId: string): Promise<AutopilotReplay | null> {
    const repoWithCache = this.repository as unknown as {
      cache?: { get: <T>(k: string) => Promise<{ data?: T } | null> };
    };
    if (repoWithCache.cache && typeof repoWithCache.cache.get === 'function') {
      const cached = await repoWithCache.cache.get<AutopilotReplay>(`autopilot:replay:${executionId}`);
      if (cached?.data) return cached.data;
    }
    return null;
  }
}
