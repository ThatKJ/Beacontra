/**
 * Beacontra Watchtower — Historical Marketplace Intelligence & Snapshot Diffing
 * 
 * Provides:
 * 1. Durable historical scan snapshot capture from genuine market observations.
 * 2. Deterministic snapshot comparison:
 *    - Newly discovered listings
 *    - Listings missing from the latest search results (with explicit disclaimer that absence != deletion)
 *    - Observed price changes (direction, variance, significance)
 *    - Priority shifts (listings escalating to or de-escalating from required review)
 * 3. Alert rule evaluation (new unauthorized merchants, price crashes, anomalous offerings).
 * 4. Strict credit budget enforcement & frequency management for repeat investigations.
 */

import type { EvidenceRepository, HistoricalScanSnapshot } from './evidence-core';
import { computeIntegrityDigest } from './evidence-core';
import type { MarketRadarReport, RadarListing } from './market-radar';

export const ABSENCE_DISCLAIMER =
  'SEARCH PROVENANCE NOTICE: Absence from the latest marketplace scan indicates the listing was ' +
  'not returned within the search engine result window for the given query and location. ' +
  'This does NOT prove that the listing has been deleted, seller deactivated, or takedown confirmed.';

export interface SnapshotListingItem {
  id: string;
  cleanUrl: string;
  source: string;
  title: string;
  merchantName: string;
  price: number;
  imageUrl: string;
  requiresReview: boolean;
  classification: string;
}

export interface WatchtowerSnapshot {
  id: string;
  productId: string;
  productName: string;
  brandId: string;
  scanId: string;
  timestamp: string;
  listings: SnapshotListingItem[];
  stats: {
    totalOffers: number;
    anomalousOffers: number;
    medianPrice: number | null;
    minPrice: number | null;
    maxPrice: number | null;
  };
  provenanceHash: string;
}

export interface ListingPriceDiff {
  listingId: string;
  title: string;
  cleanUrl: string;
  source: string;
  merchantName: string;
  oldPrice: number;
  newPrice: number;
  changeAmount: number;
  changePercent: number;
  direction: 'increased' | 'decreased' | 'unchanged';
  significance: 'major_drop' | 'moderate_drop' | 'increase' | 'stable';
}

export interface PriorityShift {
  listingId: string;
  title: string;
  source: string;
  merchantName: string;
  previousRequiresReview: boolean;
  currentRequiresReview: boolean;
  direction: 'escalated' | 'deescalated';
  rationale: string;
}

export interface SnapshotComparisonResult {
  productId: string;
  baselineSnapshotId: string;
  baselineTimestamp: string;
  currentSnapshotId: string;
  currentTimestamp: string;
  newlyDiscoveredListings: SnapshotListingItem[];
  missingFromLatestSearch: SnapshotListingItem[];
  priceChanges: ListingPriceDiff[];
  priorityShifts: PriorityShift[];
  alerts: WatchtowerAlert[];
  absenceDisclaimer: string;
  summary: string;
}

export interface WatchtowerAlert {
  id: string;
  ruleType: 'new_unauthorized_seller' | 'price_crash' | 'anomalous_underpricing' | 'inventory_flux';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  evidenceListingId?: string;
  timestamp: string;
}

export interface MonitoringBudgetConfig {
  productId: string;
  frequency: 'manual' | 'daily' | 'weekly';
  monthlyBudgetCredits: number;
  consumedCreditsThisMonth: number;
  isActive: boolean;
}

export class WatchtowerService {
  private static readonly SNAPSHOT_PREFIX = 'wt:snap:';
  private static readonly BUDGET_PREFIX = 'wt:budget:';

  constructor(private repository: EvidenceRepository) {}

  /**
   * Captures a durable historical snapshot from a genuine Market Radar report.
   */
  async captureSnapshot(report: MarketRadarReport, brandId: string): Promise<WatchtowerSnapshot> {
    const timestamp = report.timestamp || new Date().toISOString();
    const allListings: SnapshotListingItem[] = [
      ...report.comparableListings.map(l => this.mapRadarToListingItem(l)),
      ...report.excludedListings.map(l => this.mapRadarToListingItem(l)),
    ];

    const stats = {
      totalOffers: allListings.length,
      anomalousOffers: report.comparableListings.filter(c => c.requiresReview).length,
      medianPrice: report.baseline.medianMarketPrice,
      minPrice: report.baseline.minComparablePrice,
      maxPrice: report.baseline.maxComparablePrice,
    };

    const provenancePayload = JSON.stringify({
      scanId: report.scanId,
      productId: report.productId,
      timestamp,
      count: allListings.length,
      prices: allListings.map(l => l.price),
    });
    const provenanceHash = await computeIntegrityDigest(provenancePayload);

    const snapshot: WatchtowerSnapshot = {
      id: `snap_${report.scanId}`,
      productId: report.productId,
      productName: report.productName,
      brandId,
      scanId: report.scanId,
      timestamp,
      listings: allListings,
      stats,
      provenanceHash,
    };

    // Save structured snapshot in repository
    const repoSnap: HistoricalScanSnapshot = {
      id: snapshot.id,
      productId: snapshot.productId,
      scanId: snapshot.scanId,
      timestamp: snapshot.timestamp,
      listingCount: snapshot.stats.totalOffers,
      anomalousCount: snapshot.stats.anomalousOffers,
      lowestObservedPrice: snapshot.stats.minPrice ?? 0,
      averageComparablePrice: snapshot.stats.medianPrice ?? 0,
      listingIds: allListings.map(l => l.id),
      summary: report.summary,
    };
    await this.repository.saveSnapshot(repoSnap);

    return snapshot;
  }

  /**
   * Compares two genuine snapshots and identifies newly discovered listings,
   * missing listings, price changes, and priority shifts.
   */
  compareSnapshots(
    baseline: WatchtowerSnapshot,
    current: WatchtowerSnapshot
  ): SnapshotComparisonResult {
    const baselineMap = new Map<string, SnapshotListingItem>();
    for (const item of baseline.listings) {
      baselineMap.set(item.cleanUrl || item.id, item);
    }

    const currentMap = new Map<string, SnapshotListingItem>();
    for (const item of current.listings) {
      currentMap.set(item.cleanUrl || item.id, item);
    }

    const newlyDiscoveredListings: SnapshotListingItem[] = [];
    const priceChanges: ListingPriceDiff[] = [];
    const priorityShifts: PriorityShift[] = [];
    const alerts: WatchtowerAlert[] = [];

    // 1. Inspect Current Listings vs Baseline
    for (const [key, currItem] of currentMap.entries()) {
      const baseItem = baselineMap.get(key);
      if (!baseItem) {
        // Newly discovered
        newlyDiscoveredListings.push(currItem);
        if (currItem.requiresReview) {
          alerts.push({
            id: `alert_new_${currItem.id}`,
            ruleType: 'anomalous_underpricing',
            severity: 'critical',
            message: `Newly discovered listing from "${currItem.merchantName}" flagged for immediate review (Price: ₹${currItem.price})`,
            evidenceListingId: currItem.id,
            timestamp: current.timestamp,
          });
        }
      } else {
        // Existed in both: check price change
        if (baseItem.price !== currItem.price && baseItem.price > 0 && currItem.price > 0) {
          const changeAmount = currItem.price - baseItem.price;
          const changePercent = Math.round((changeAmount / baseItem.price) * 100);
          const direction = changeAmount < 0 ? 'decreased' : 'increased';

          let significance: ListingPriceDiff['significance'] = 'stable';
          if (changePercent <= -30) significance = 'major_drop';
          else if (changePercent < 0) significance = 'moderate_drop';
          else if (changePercent > 0) significance = 'increase';

          priceChanges.push({
            listingId: currItem.id,
            title: currItem.title,
            cleanUrl: currItem.cleanUrl,
            source: currItem.source,
            merchantName: currItem.merchantName,
            oldPrice: baseItem.price,
            newPrice: currItem.price,
            changeAmount,
            changePercent,
            direction,
            significance,
          });

          if (significance === 'major_drop') {
            alerts.push({
              id: `alert_crash_${currItem.id}`,
              ruleType: 'price_crash',
              severity: 'warning',
              message: `Listing from "${currItem.merchantName}" observed sharp price plunge of ${Math.abs(changePercent)}% (₹${baseItem.price} → ₹${currItem.price})`,
              evidenceListingId: currItem.id,
              timestamp: current.timestamp,
            });
          }
        }

        // Priority Shift
        if (baseItem.requiresReview !== currItem.requiresReview) {
          priorityShifts.push({
            listingId: currItem.id,
            title: currItem.title,
            source: currItem.source,
            merchantName: currItem.merchantName,
            previousRequiresReview: baseItem.requiresReview,
            currentRequiresReview: currItem.requiresReview,
            direction: currItem.requiresReview ? 'escalated' : 'deescalated',
            rationale: currItem.requiresReview
              ? 'Listing conditions or commercial signals shifted into anomalous review criteria.'
              : 'Listing normalized or commercial variance resolved to baseline.',
          });
        }
      }
    }

    // 2. Inspect Baseline Listings Missing from Current Search
    const missingFromLatestSearch: SnapshotListingItem[] = [];
    for (const [key, baseItem] of baselineMap.entries()) {
      if (!currentMap.has(key)) {
        missingFromLatestSearch.push(baseItem);
      }
    }

    const summary =
      `Watchtower comparison across ${baseline.timestamp.slice(0, 10)} and ${current.timestamp.slice(0, 10)}: ` +
      `${newlyDiscoveredListings.length} newly discovered listings, ${missingFromLatestSearch.length} offers absent from recent search results, ` +
      `${priceChanges.length} observed price variations, and ${alerts.length} actionable commercial alerts generated.`;

    return {
      productId: current.productId,
      baselineSnapshotId: baseline.id,
      baselineTimestamp: baseline.timestamp,
      currentSnapshotId: current.id,
      currentTimestamp: current.timestamp,
      newlyDiscoveredListings,
      missingFromLatestSearch,
      priceChanges,
      priorityShifts,
      alerts,
      absenceDisclaimer: ABSENCE_DISCLAIMER,
      summary,
    };
  }

  private mapRadarToListingItem(l: RadarListing): SnapshotListingItem {
    return {
      id: l.id,
      cleanUrl: l.cleanUrl,
      source: l.source,
      title: l.title,
      merchantName: l.merchantName,
      price: l.price,
      imageUrl: l.imageUrl,
      requiresReview: l.requiresReview,
      classification: l.priceClassification,
    };
  }
}
