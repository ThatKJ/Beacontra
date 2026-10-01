/**
 * Beacontra Evidence Desk — Investigation Data Model & Service
 * 
 * Provides structured case management, provenance preservation,
 * evidence observation logging, analyst notes, and standalone
 * downloadable HTML investigation reports with printable styles.
 * 
 * IMPORTANT: All outputs maintain strict risk-signal language and
 * disclaim legal evidentiary status or proof of product authenticity.
 */

import type { BeacontraScanResult, FusedResult } from './beacontra';
import type { CacheAdapter } from './types';

export type CaseStatus = 'active' | 'under_review' | 'escalated' | 'resolved' | 'archived';
export type CasePriority = 'high' | 'medium' | 'low';

export const NON_LEGAL_EVIDENCE_DISCLAIMER =
  'NON-LEGAL ADVISORY NOTICE: This investigation report provides technical and commercial risk signals ' +
  'derived from algorithmic marketplace co-occurrence, price variance analysis, and automated reverse-image matching. ' +
  'It is intended exclusively to assist human analysts with triage and review. ' +
  'This report does NOT constitute legal proof of counterfeit status, trademark infringement, or commercial fraud. ' +
  'All findings must be independently verified by authorized brand representatives and legal counsel before initiating enforcement or takedown actions.';

export interface TargetProductProfile {
  productName: string;
  brand: string;
  officialImageUrl: string;
  mrp?: number;
  expectedPriceRange?: { min: number; max: number };
  knownAuthorizedSellers?: string[];
}

export interface InvestigationNote {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface EvidenceObservation {
  id: string;
  type: 'price' | 'seller' | 'visual' | 'variant' | 'listing_metadata';
  candidateTitle: string;
  source: string;
  url: string;
  retrievalTimestamp: string;
  anomalyDetected: boolean;
  anomalyType: string;
  severity: 'high' | 'medium' | 'low' | 'none';
  observationSummary: string;
  analysisExplanation: string;
  uncertaintyDisclaimer: string;
}

export interface InvestigationCase {
  id: string;
  title: string;
  status: CaseStatus;
  priority: CasePriority;
  targetProduct: TargetProductProfile;
  scanId?: string;
  scanSnapshot?: BeacontraScanResult;
  evidenceObservations: EvidenceObservation[];
  notes: InvestigationNote[];
  tags: string[];
  findingsSummary: string;
  legalDisclaimer: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCaseInput {
  title?: string;
  productName: string;
  brand?: string;
  officialImageUrl: string;
  mrp?: number;
  expectedPriceRange?: { min: number; max: number };
  knownAuthorizedSellers?: string[];
  priority?: CasePriority;
  scanId?: string;
  initialNote?: string;
  tags?: string[];
}

export interface UpdateCaseInput {
  title?: string;
  status?: CaseStatus;
  priority?: CasePriority;
  tags?: string[];
  findingsSummary?: string;
}

/**
 * Extracts brand from product name if not provided
 */
export function extractBrand(productName: string): string {
  if (!productName) return 'Unknown Brand';
  const firstWord = productName.trim().split(/\s+/)[0] ?? 'Unknown Brand';
  return firstWord;
}

/**
 * Converts a FusedResult from a scan into standardized EvidenceObservations
 */
export function buildObservationsFromScan(scanResult: BeacontraScanResult): EvidenceObservation[] {
  const observations: EvidenceObservation[] = [];
  const timestamp = scanResult.createdAt || new Date().toISOString();

  for (const item of scanResult.results) {
    const candidate = item.listing;

    // 1. Price Observation
    observations.push({
      id: `obs_price_${item.listing.position}_${Date.now()}`,
      type: 'price',
      candidateTitle: candidate.title,
      source: candidate.source,
      url: candidate.productLink,
      retrievalTimestamp: timestamp,
      anomalyDetected: item.priceSignal.isAnomalous,
      anomalyType: item.priceSignal.anomalyType,
      severity: item.priceSignal.isAnomalous
        ? item.priceSignal.anomalyType === 'below_mrp' ? 'high' : 'medium'
        : 'none',
      observationSummary: `Extracted price: ₹${candidate.extractedPrice} (${candidate.price})`,
      analysisExplanation: item.priceSignal.details,
      uncertaintyDisclaimer: 'Price evaluation compares marketplace offer against specified MRP and expected street price. Legitimate authorized promotional sales and seasonal discounts may occur.',
    });

    // 2. Seller Observation
    observations.push({
      id: `obs_seller_${item.listing.position}_${Date.now()}`,
      type: 'seller',
      candidateTitle: candidate.title,
      source: candidate.source,
      url: candidate.productLink,
      retrievalTimestamp: timestamp,
      anomalyDetected: item.sellerSignal.isAnomalous,
      anomalyType: item.sellerSignal.anomalyType,
      severity: item.sellerSignal.isAnomalous
        ? item.sellerSignal.anomalyType === 'generic_pattern' ? 'high' : 'medium'
        : 'none',
      observationSummary: `Seller entity: "${candidate.seller}"`,
      analysisExplanation: item.sellerSignal.details,
      uncertaintyDisclaimer: 'Seller evaluation is based on known authorized entity lists and naming heuristics. Unlisted sellers may include authorized sub-distributors or new partner accounts.',
    });

    // 3. Visual Match Observation
    observations.push({
      id: `obs_visual_${item.listing.position}_${Date.now()}`,
      type: 'visual',
      candidateTitle: candidate.title,
      source: candidate.source,
      url: candidate.productLink,
      retrievalTimestamp: timestamp,
      anomalyDetected: item.visualSignal.isAnomalous,
      anomalyType: item.visualSignal.anomalyType,
      severity: item.visualSignal.isAnomalous ? 'medium' : 'none',
      observationSummary: `Visual search status: ${item.visualSignal.status || item.visualSignal.anomalyType}`,
      analysisExplanation: item.visualSignal.details,
      uncertaintyDisclaimer: 'Reverse-image matching evaluates visual co-occurrence indexed by search providers. Matches represent identical or similar imagery across web pages, not proof of physical product provenance.',
    });
  }

  return observations;
}

/**
 * Service managing Evidence Desk investigation cases
 */
export class EvidenceDeskService {
  constructor(private cache: CacheAdapter) {}

  private static readonly CASE_PREFIX = 'case:';
  private static readonly INDEX_KEY = 'cases:index';
  private static readonly TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

  async createCase(input: CreateCaseInput, scanResult?: BeacontraScanResult): Promise<InvestigationCase> {
    const caseId = `case_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();

    const brand = input.brand || extractBrand(input.productName);
    const title = input.title || `Investigation: ${input.productName} (${brand})`;

    const observations = scanResult ? buildObservationsFromScan(scanResult) : [];

    const notes: InvestigationNote[] = [];
    if (input.initialNote) {
      notes.push({
        id: `note_${Date.now()}_1`,
        author: 'Investigator',
        content: input.initialNote,
        createdAt: now,
      });
    }

    const priority: CasePriority = input.priority || (
      scanResult?.results.some(r => r.recommendation === 'review_urgently')
        ? 'high'
        : scanResult?.results.some(r => r.recommendation === 'review')
          ? 'medium'
          : 'low'
    );

    const findingsSummary = scanResult
      ? `Automated scan found ${scanResult.totalListingsFound} listings. ${scanResult.results.filter(r => r.compositeScore >= 50).length} flagged for analyst review.`
      : 'Manual investigation case opened.';

    const investigationCase: InvestigationCase = {
      id: caseId,
      title,
      status: 'active',
      priority,
      targetProduct: {
        productName: input.productName,
        brand,
        officialImageUrl: input.officialImageUrl,
        mrp: input.mrp,
        expectedPriceRange: input.expectedPriceRange,
        knownAuthorizedSellers: input.knownAuthorizedSellers,
      },
      scanId: input.scanId || scanResult?.scanId,
      scanSnapshot: scanResult,
      evidenceObservations: observations,
      notes,
      tags: input.tags || ['marketplace-check'],
      findingsSummary,
      legalDisclaimer: NON_LEGAL_EVIDENCE_DISCLAIMER,
      createdAt: now,
      updatedAt: now,
    };

    // Store case
    await this.cache.set(`${EvidenceDeskService.CASE_PREFIX}${caseId}`, {
      data: investigationCase,
      timestamp: Date.now(),
      ttl: EvidenceDeskService.TTL_MS,
      engine: 'evidence_desk',
      paramsHash: caseId,
    });

    // Update index
    await this.addToIndex(caseId);

    return investigationCase;
  }

  async getCase(caseId: string): Promise<InvestigationCase | null> {
    const cached = await this.cache.get<InvestigationCase>(`${EvidenceDeskService.CASE_PREFIX}${caseId}`);
    return cached?.data ?? null;
  }

  async listCases(filter?: { status?: CaseStatus; search?: string }): Promise<InvestigationCase[]> {
    const indexEntry = await this.cache.get<string[]>(EvidenceDeskService.INDEX_KEY);
    const caseIds = indexEntry?.data ?? [];

    const cases: InvestigationCase[] = [];
    for (const id of caseIds) {
      const c = await this.getCase(id);
      if (c) {
        let matches = true;
        if (filter?.status && c.status !== filter.status) {
          matches = false;
        }
        if (filter?.search) {
          const q = filter.search.toLowerCase();
          const matchesTitle = c.title.toLowerCase().includes(q);
          const matchesProduct = c.targetProduct.productName.toLowerCase().includes(q);
          const matchesBrand = c.targetProduct.brand.toLowerCase().includes(q);
          const matchesTag = c.tags.some(t => t.toLowerCase().includes(q));
          if (!matchesTitle && !matchesProduct && !matchesBrand && !matchesTag) {
            matches = false;
          }
        }
        if (matches) {
          cases.push(c);
        }
      }
    }

    // Sort descending by creation date
    return cases.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async updateCase(caseId: string, updates: UpdateCaseInput): Promise<InvestigationCase | null> {
    const existing = await this.getCase(caseId);
    if (!existing) return null;

    const updated: InvestigationCase = {
      ...existing,
      title: updates.title ?? existing.title,
      status: updates.status ?? existing.status,
      priority: updates.priority ?? existing.priority,
      tags: updates.tags ?? existing.tags,
      findingsSummary: updates.findingsSummary ?? existing.findingsSummary,
      updatedAt: new Date().toISOString(),
    };

    await this.cache.set(`${EvidenceDeskService.CASE_PREFIX}${caseId}`, {
      data: updated,
      timestamp: Date.now(),
      ttl: EvidenceDeskService.TTL_MS,
      engine: 'evidence_desk',
      paramsHash: caseId,
    });

    return updated;
  }

  async addNote(caseId: string, author: string, content: string): Promise<InvestigationNote | null> {
    const existing = await this.getCase(caseId);
    if (!existing) return null;

    const newNote: InvestigationNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      author: author || 'Analyst',
      content,
      createdAt: new Date().toISOString(),
    };

    existing.notes.push(newNote);
    existing.updatedAt = new Date().toISOString();

    await this.cache.set(`${EvidenceDeskService.CASE_PREFIX}${caseId}`, {
      data: existing,
      timestamp: Date.now(),
      ttl: EvidenceDeskService.TTL_MS,
      engine: 'evidence_desk',
      paramsHash: caseId,
    });

    return newNote;
  }

  private async addToIndex(caseId: string): Promise<void> {
    const indexEntry = await this.cache.get<string[]>(EvidenceDeskService.INDEX_KEY);
    const caseIds = indexEntry?.data ?? [];
    if (!caseIds.includes(caseId)) {
      caseIds.unshift(caseId);
      await this.cache.set(EvidenceDeskService.INDEX_KEY, {
        data: caseIds,
        timestamp: Date.now(),
        ttl: EvidenceDeskService.TTL_MS,
        engine: 'evidence_desk_index',
        paramsHash: 'all_cases',
      });
    }
  }
}

/**
 * Escapes HTML entities to prevent XSS in report generation
 */
function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generates a standalone, beautiful HTML investigation report with embedded printable styles
 */
export function generateInvestigationHtmlReport(investigationCase: InvestigationCase): string {
  const c = investigationCase;
  const target = c.targetProduct;
  const snapshot = c.scanSnapshot;
  const dateFormatted = new Date(c.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const updatedFormatted = new Date(c.updatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const statusColorMap: Record<CaseStatus, string> = {
    active: '#0ea5e9',
    under_review: '#f59e0b',
    escalated: '#ef4444',
    resolved: '#10b981',
    archived: '#64748b',
  };

  const priorityColorMap: Record<CasePriority, string> = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#64748b',
  };

  const statusBadge = `<span style="background:${statusColorMap[c.status] || '#64748b'};color:#fff;padding:4px 10px;border-radius:4px;font-weight:600;font-size:12px;text-transform:uppercase;">${escapeHtml(c.status.replace('_', ' '))}</span>`;
  const priorityBadge = `<span style="background:${priorityColorMap[c.priority] || '#64748b'};color:#fff;padding:4px 10px;border-radius:4px;font-weight:600;font-size:12px;text-transform:uppercase;">${escapeHtml(c.priority)} Priority</span>`;

  // Render Listing Findings Rows
  let listingsHtml = '';
  if (snapshot?.results && snapshot.results.length > 0) {
    listingsHtml = snapshot.results.map((r: FusedResult, idx: number) => {
      const recBadgeColor = r.recommendation === 'review_urgently' ? '#ef4444' : r.recommendation === 'review' ? '#f59e0b' : '#10b981';
      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 12px; font-weight: 600; text-align: center;">${idx + 1}</td>
          <td style="padding: 10px 12px;">
            <div style="font-weight: 600; color: #0f172a;">${escapeHtml(r.listing.title)}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
              Source: <strong>${escapeHtml(r.listing.source)}</strong> | Seller: <em>${escapeHtml(r.listing.seller)}</em>
            </div>
            ${r.listing.productLink ? `<div style="font-size: 11px; color: #2563eb; margin-top: 2px; word-break: break-all;"><a href="${escapeHtml(r.listing.productLink)}" target="_blank" rel="noopener noreferrer">View Marketplace Listing &rarr;</a></div>` : ''}
          </td>
          <td style="padding: 10px 12px; white-space: nowrap; font-weight: 700; color: #0f172a;">${escapeHtml(r.listing.price)}</td>
          <td style="padding: 10px 12px; font-size: 12px;">
            <span style="color: ${r.priceSignal.isAnomalous ? '#b91c1c' : '#15803d'}; font-weight: 600;">
              ${escapeHtml(r.priceSignal.anomalyType)}
            </span>
            <div style="font-size: 11px; color: #475569;">${escapeHtml(r.priceSignal.details)}</div>
          </td>
          <td style="padding: 10px 12px; font-size: 12px;">
            <span style="color: ${r.sellerSignal.isAnomalous ? '#b91c1c' : '#15803d'}; font-weight: 600;">
              ${escapeHtml(r.sellerSignal.anomalyType)}
            </span>
            <div style="font-size: 11px; color: #475569;">${escapeHtml(r.sellerSignal.details)}</div>
          </td>
          <td style="padding: 10px 12px; font-size: 12px;">
            <span style="color: ${r.visualSignal.isAnomalous ? '#b91c1c' : '#0369a1'}; font-weight: 600;">
              ${escapeHtml(r.visualSignal.anomalyType || r.visualSignal.status || 'not_verified')}
            </span>
            <div style="font-size: 11px; color: #475569;">${escapeHtml(r.visualSignal.details)}</div>
          </td>
          <td style="padding: 10px 12px; text-align: center; white-space: nowrap;">
            <div style="display: inline-block; padding: 4px 8px; border-radius: 4px; background: ${recBadgeColor}; color: #fff; font-weight: 700; font-size: 12px;">
              ${r.compositeScore}/100
            </div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px; text-transform: uppercase;">
              ${escapeHtml(r.recommendation.replace('_', ' '))}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } else {
    listingsHtml = `<tr><td colspan="7" style="padding: 20px; text-align: center; color: #64748b;">No listing snapshot recorded.</td></tr>`;
  }

  // Render Evidence Observations
  let observationsHtml = '';
  if (c.evidenceObservations && c.evidenceObservations.length > 0) {
    observationsHtml = c.evidenceObservations.slice(0, 15).map((obs: EvidenceObservation) => {
      const typeBadgeColor = obs.type === 'price' ? '#b45309' : obs.type === 'seller' ? '#4338ca' : '#047857';
      return `
        <div style="margin-bottom: 12px; padding: 12px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div>
              <span style="background:${typeBadgeColor}; color:#fff; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 3px; text-transform: uppercase;">
                ${escapeHtml(obs.type)}
              </span>
              <strong style="margin-left: 8px; font-size: 13px; color: #0f172a;">${escapeHtml(obs.candidateTitle)}</strong>
            </div>
            <span style="font-size: 11px; color: #64748b;">${escapeHtml(obs.retrievalTimestamp)}</span>
          </div>
          <div style="font-size: 12px; color: #1e293b; margin-bottom: 4px;">
            <strong>Observation:</strong> ${escapeHtml(obs.observationSummary)} — <em>${escapeHtml(obs.analysisExplanation)}</em>
          </div>
          <div style="font-size: 11px; color: #64748b; background: #ffffff; padding: 6px 8px; border-radius: 4px; border-left: 3px solid #cbd5e1;">
            <strong>Uncertainty Note:</strong> ${escapeHtml(obs.uncertaintyDisclaimer)}
          </div>
        </div>
      `;
    }).join('');
  } else {
    observationsHtml = '<p style="color: #64748b; font-style: italic;">No individual evidence observations recorded.</p>';
  }

  // Render Analyst Notes
  let notesHtml = '';
  if (c.notes && c.notes.length > 0) {
    notesHtml = c.notes.map((n: InvestigationNote) => `
      <div style="padding: 10px 14px; background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 8px;">
        <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">
          <strong>${escapeHtml(n.author)}</strong> &bull; ${escapeHtml(n.createdAt)}
        </div>
        <div style="font-size: 13px; color: #1e293b; white-space: pre-wrap;">${escapeHtml(n.content)}</div>
      </div>
    `).join('');
  } else {
    notesHtml = '<p style="color: #64748b; font-style: italic;">No analyst notes logged yet.</p>';
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(c.title)} — Beacontra Evidence Desk</title>
  <style>
    @page {
      size: A4;
      margin: 15mm 15mm 15mm 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #f1f5f9;
      line-height: 1.45;
      padding: 24px;
    }
    .container {
      max-width: 1080px;
      margin: 0 auto;
      background: #ffffff;
      padding: 36px 40px;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 18px;
      margin-bottom: 20px;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #0f172a;
    }
    .brand-subtitle {
      font-size: 13px;
      color: #64748b;
      margin-top: 2px;
      font-weight: 500;
    }
    .case-meta-header {
      text-align: right;
    }
    .case-id {
      font-family: monospace;
      font-size: 13px;
      font-weight: 600;
      color: #334155;
    }
    .disclaimer-banner {
      background: #fffbeb;
      border: 1px solid #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px 16px;
      border-radius: 4px;
      margin-bottom: 24px;
      font-size: 11.5px;
      color: #78350f;
      line-height: 1.5;
    }
    .disclaimer-title {
      font-weight: 700;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-size: 11px;
    }
    .section-title {
      font-size: 15px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin-top: 24px;
      margin-bottom: 12px;
    }
    .dossier-grid {
      display: grid;
      grid-template-columns: 140px 1fr;
      gap: 20px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 16px;
      border-radius: 6px;
      margin-bottom: 20px;
    }
    .dossier-img {
      width: 140px;
      height: 140px;
      object-fit: contain;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
    }
    .dossier-fields {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 16px;
      font-size: 12.5px;
    }
    .field-label {
      font-weight: 600;
      color: #64748b;
      font-size: 11px;
      text-transform: uppercase;
    }
    .field-value {
      font-weight: 600;
      color: #0f172a;
      margin-top: 2px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-top: 10px;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      text-align: left;
      padding: 10px 12px;
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #cbd5e1;
    }
    .actions-bar {
      margin-top: 30px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .btn {
      display: inline-block;
      padding: 8px 16px;
      background: #0f172a;
      color: #fff;
      font-size: 12px;
      font-weight: 600;
      text-decoration: none;
      border-radius: 4px;
      cursor: pointer;
      border: none;
    }
    .btn:hover {
      background: #1e293b;
    }
    .signoff-box {
      margin-top: 24px;
      padding: 16px;
      border: 1px dashed #cbd5e1;
      border-radius: 6px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      font-size: 12px;
    }

    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .container {
        box-shadow: none;
        padding: 0;
        max-width: 100%;
      }
      .actions-bar {
        display: none !important;
      }
      a {
        text-decoration: none;
        color: inherit;
      }
      tr {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header-bar">
      <div>
        <div class="brand-title">BEACONTRA EVIDENCE DESK</div>
        <div class="brand-subtitle">Commercial & Visual Marketplace Listing Investigation Report</div>
      </div>
      <div class="case-meta-header">
        <div class="case-id">CASE #${escapeHtml(c.id)}</div>
        <div style="margin-top: 6px; display: flex; gap: 8px; justify-content: flex-end;">
          ${statusBadge}
          ${priorityBadge}
        </div>
      </div>
    </div>

    <div class="disclaimer-banner">
      <div class="disclaimer-title">&#9888; Regulatory & Legal Compliance Disclaimer</div>
      <div>${escapeHtml(c.legalDisclaimer)}</div>
    </div>

    <div class="section-title">Target Product Profile</div>
    <div class="dossier-grid">
      <img src="${escapeHtml(target.officialImageUrl)}" alt="${escapeHtml(target.productName)}" class="dossier-img" onerror="this.src='https://placehold.co/140x140?text=No+Photo';" />
      <div class="dossier-fields">
        <div>
          <div class="field-label">Target Product Name</div>
          <div class="field-value">${escapeHtml(target.productName)}</div>
        </div>
        <div>
          <div class="field-label">Brand Entity</div>
          <div class="field-value">${escapeHtml(target.brand)}</div>
        </div>
        <div>
          <div class="field-label">Statutory MRP</div>
          <div class="field-value">${target.mrp ? `₹${target.mrp.toLocaleString('en-IN')}` : 'Not Specified'}</div>
        </div>
        <div>
          <div class="field-label">Expected Retail Street Band</div>
          <div class="field-value">${target.expectedPriceRange ? `₹${target.expectedPriceRange.min.toLocaleString('en-IN')} – ₹${target.expectedPriceRange.max.toLocaleString('en-IN')}` : 'Not Specified'}</div>
        </div>
        <div style="grid-column: 1 / -1;">
          <div class="field-label">Authorized Retail Partners</div>
          <div class="field-value">${target.knownAuthorizedSellers?.length ? escapeHtml(target.knownAuthorizedSellers.join(', ')) : 'No restriction list provided'}</div>
        </div>
      </div>
    </div>

    <div class="section-title">Marketplace Findings & Commercial Anomalies</div>
    <div style="overflow-x: auto;">
      <table>
        <thead>
          <tr>
            <th style="width: 40px; text-align: center;">#</th>
            <th>Marketplace Listing</th>
            <th style="width: 90px;">Price</th>
            <th style="width: 170px;">Price Signal</th>
            <th style="width: 170px;">Seller Signal</th>
            <th style="width: 180px;">Visual Co-occurrence</th>
            <th style="width: 100px; text-align: center;">Risk Score</th>
          </tr>
        </thead>
        <tbody>
          ${listingsHtml}
        </tbody>
      </table>
    </div>

    <div class="section-title">Evidence Observations & Provenance Log</div>
    <div>
      ${observationsHtml}
    </div>

    <div class="section-title">Investigation Notes & Analyst Audit</div>
    <div>
      ${notesHtml}
    </div>

    <div class="signoff-box">
      <div>
        <strong>Analyst Verification:</strong>
        <div style="margin-top: 8px; color: #64748b;">Signature / ID: _________________________</div>
        <div style="margin-top: 4px; color: #64748b;">Verification Date: ${dateFormatted}</div>
      </div>
      <div>
        <strong>Case Resolution / Action Taken:</strong>
        <div style="margin-top: 8px; color: #64748b;">Status: ${escapeHtml(c.status.toUpperCase())}</div>
        <div style="margin-top: 4px; color: #64748b;">Last Updated: ${updatedFormatted}</div>
      </div>
    </div>

    <div class="actions-bar">
      <div style="font-size: 11px; color: #64748b;">
        Generated by Beacontra Evidence Desk &bull; Provenance ID: ${escapeHtml(c.scanId || c.id)}
      </div>
      <div>
        <button class="btn" onclick="window.print()">Print / Save as PDF</button>
      </div>
    </div>
  </div>
</body>
</html>`;
}
