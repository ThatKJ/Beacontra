/**
 * Investigation Intelligence & Action Center Playbook Test Suite (Milestones 7 & 8)
 * 
 * Verifies:
 * 1. Deterministic explanation engine ("Explain This Finding")
 * 2. Strict dimension separation (Evidence Strength, Commercial Signals, Uncertainty, Review Priority)
 * 3. Transparent missing evidence cataloging (absence does not become proof of wrongdoing)
 * 4. "What Would Change This Finding" counterfactual evaluation
 * 5. Actionable human triage playbooks with ethical legal disclaimers
 */

import { describe, it, expect } from 'vitest';
import {
  InvestigationIntelligenceService,
  ETHICAL_TRIAGE_NOTICE,
  type FindingContext,
} from '../src/lib/investigation-intelligence';

describe('Milestones 7 & 8 — Investigation Intelligence & Action Center', () => {
  const service = new InvestigationIntelligenceService();

  it('should generate a comprehensive, deterministic explanation for an anomalous listing', () => {
    const context: FindingContext = {
      id: 'find_001',
      productName: 'boAt Airdopes 141',
      brandName: 'boAt Lifestyle',
      mrp: 4490,
      extractedPrice: 399,
      sellerName: 'QuickStore99',
      source: 'Amazon.in',
      productUrl: 'https://www.amazon.in/dp/B09XYZ',
      imageUrl: 'https://example.com/boat.jpg',
      lensMatchStatus: 'exact_match',
      isAuthorizedSeller: false,
      medianMarketPrice: 1349,
    };

    const explanation = service.explainFinding(context);

    // Required Sections
    expect(explanation.findingId).toBe('find_001');
    expect(explanation.headline).toContain('Anomalous Commercial Variance');
    expect(explanation.whatWasObserved).toContain('₹399');
    expect(explanation.whatWasObserved).toContain('QuickStore99');
    expect(explanation.whyItMatters).toContain('Extreme price deviations');

    // Evidence Dimensions Separation
    expect(explanation.dimensions.commercialSignal).toBe('anomalous_underpricing');
    expect(explanation.dimensions.reviewPriority).toBe('urgent_review');
    expect(explanation.dimensions.evidenceStrength).toBe('strong');
    expect(explanation.dimensions.uncertaintyLevel).toBe('medium');

    // Supporting Evidence items
    expect(explanation.supportingEvidence.length).toBeGreaterThanOrEqual(2);
    expect(explanation.supportingEvidence.some(s => s.dimension === 'price')).toBe(true);
    expect(explanation.supportingEvidence.some(s => s.dimension === 'visual')).toBe(true);

    // Missing Evidence items (must not be ignored)
    expect(explanation.missingEvidence.length).toBeGreaterThanOrEqual(1);
    const packagingMissing = explanation.missingEvidence.find(m => m.dimension === 'packaging_and_physical');
    expect(packagingMissing).toBeDefined();
    expect(packagingMissing?.impactOnAssessment).toContain('Physical authenticity cannot be established without physical sample');

    // "What Would Change This Finding"
    expect(explanation.whatWouldChangeThisFinding.length).toBeGreaterThanOrEqual(1);
    expect(explanation.whatWouldChangeThisFinding[0]!.scenario).toBeDefined();
    expect(explanation.whatWouldChangeThisFinding[0]!.potentialShift).toBeDefined();

    // Playbook
    expect(explanation.playbook.recommendedAction).toBeDefined();
    expect(explanation.playbook.humanTriageSteps.length).toBeGreaterThan(0);
    expect(explanation.playbook.ethicalLegalDisclaimers).toBe(ETHICAL_TRIAGE_NOTICE);
    expect(explanation.playbook.ethicalLegalDisclaimers).toContain('do NOT constitute proof of counterfeit merchandise');
  });

  it('should treat zero Lens matches as missing evidence rather than affirmative proof of wrongdoing', () => {
    const context: FindingContext = {
      id: 'find_002',
      productName: 'boAt Airdopes 141',
      extractedPrice: 1299,
      sellerName: 'Imagine Marketing',
      source: 'Croma',
      lensMatchStatus: 'no_match',
      isAuthorizedSeller: true,
      medianMarketPrice: 1299,
    };

    const explanation = service.explainFinding(context);

    // Review priority should be normal / informational
    expect(explanation.dimensions.reviewPriority).toBe('informational');
    expect(explanation.dimensions.commercialSignal).toBe('normal_retail');

    // Lens no_match must appear in missing evidence
    const visualMissing = explanation.missingEvidence.find(m => m.dimension === 'visual');
    expect(visualMissing).toBeDefined();
    expect(visualMissing?.impactOnAssessment).toContain('Absence of indexed imagery does not imply illegitimate product');
  });

  it('should provide actionable human triage playbook without automated accusations', () => {
    const context: FindingContext = {
      id: 'find_003',
      productName: 'boAt Airdopes 141',
      mrp: 4490,
      extractedPrice: 450,
      sellerName: 'UnknownDistro',
      source: 'Flipkart',
      lensMatchStatus: 'visual_match',
      isAuthorizedSeller: false,
      medianMarketPrice: 1300,
    };

    const explanation = service.explainFinding(context);
    const steps = explanation.playbook.humanTriageSteps;

    expect(steps.some(s => s.includes('Do NOT submit automated counterfeit notices'))).toBe(true);
    expect(steps.some(s => s.includes('Cross-reference seller GSTIN'))).toBe(true);
    expect(steps.some(s => s.includes('Conduct a documented test-purchase'))).toBe(true);
  });
});
