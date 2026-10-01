import { describe, it, expect, beforeEach } from 'vitest';
import app from '../src/index';
import { clearSharedCache } from '../src/lib/cache';
import {
  EvidenceDeskService,
  generateInvestigationHtmlReport,
  NON_LEGAL_EVIDENCE_DISCLAIMER,
  type InvestigationCase,
} from '../src/lib/evidence-desk';
import { MemoryCache } from '../src/lib/cache';

describe('Stage 2 - Evidence Desk & Case Management', () => {
  let memoryCache: MemoryCache;
  let service: EvidenceDeskService;

  beforeEach(() => {
    clearSharedCache();
    memoryCache = new MemoryCache();
    service = new EvidenceDeskService(memoryCache);
  });

  describe('Investigation Case Data Model', () => {
    it('should create a case with mandatory fields and non-legal disclaimer', async () => {
      const created = await service.createCase({
        productName: 'boAt Airdopes 141',
        brand: 'boAt',
        officialImageUrl: 'https://images.unsplash.com/photo-sample.jpg',
        mrp: 4490,
        expectedPriceRange: { min: 1000, max: 1500 },
        knownAuthorizedSellers: ['Amazon', 'Flipkart'],
        initialNote: 'Case opened based on marketplace monitoring alert.',
        tags: ['earbuds', 'd2c'],
      });

      expect(created.id).toMatch(/^case_/);
      expect(created.status).toBe('active');
      expect(created.priority).toBe('low');
      expect(created.targetProduct.productName).toBe('boAt Airdopes 141');
      expect(created.targetProduct.brand).toBe('boAt');
      expect(created.notes).toHaveLength(1);
      expect(created.notes[0]?.content).toBe('Case opened based on marketplace monitoring alert.');
      expect(created.legalDisclaimer).toBe(NON_LEGAL_EVIDENCE_DISCLAIMER);
      expect(created.legalDisclaimer).toContain('does NOT constitute legal proof');
    });

    it('should update case status and priority', async () => {
      const created = await service.createCase({
        productName: 'boAt Airdopes 141',
        officialImageUrl: 'https://images.unsplash.com/photo-sample.jpg',
      });

      const updated = await service.updateCase(created.id, {
        status: 'escalated',
        priority: 'high',
        tags: ['high-priority', 'brand-protection'],
      });

      expect(updated).not.toBeNull();
      expect(updated?.status).toBe('escalated');
      expect(updated?.priority).toBe('high');
      expect(updated?.tags).toEqual(['high-priority', 'brand-protection']);
    });

    it('should append analyst notes to an investigation case', async () => {
      const created = await service.createCase({
        productName: 'Noise Pulse 2',
        officialImageUrl: 'https://images.unsplash.com/photo-sample.jpg',
      });

      const note = await service.addNote(created.id, 'Senior Analyst', 'Confirmed seller is not on approved distribution list.');
      expect(note).not.toBeNull();
      expect(note?.author).toBe('Senior Analyst');

      const fetched = await service.getCase(created.id);
      expect(fetched?.notes).toHaveLength(1);
      expect(fetched?.notes[0]?.content).toBe('Confirmed seller is not on approved distribution list.');
    });

    it('should list cases with optional status filter and search query', async () => {
      await service.createCase({
        productName: 'Apple iPhone 15',
        brand: 'Apple',
        officialImageUrl: 'https://images.unsplash.com/iphone.jpg',
        tags: ['electronics', 'mobile'],
      });

      const boatCase = await service.createCase({
        productName: 'boAt Airdopes 141',
        brand: 'boAt',
        officialImageUrl: 'https://images.unsplash.com/boat.jpg',
        tags: ['audio', 'earbuds'],
      });

      await service.updateCase(boatCase.id, { status: 'under_review' });

      // List all
      const all = await service.listCases();
      expect(all).toHaveLength(2);

      // Filter by status
      const underReview = await service.listCases({ status: 'under_review' });
      expect(underReview).toHaveLength(1);
      expect(underReview[0]?.targetProduct.productName).toBe('boAt Airdopes 141');

      // Filter by search query
      const searchApple = await service.listCases({ search: 'apple' });
      expect(searchApple).toHaveLength(1);
      expect(searchApple[0]?.targetProduct.brand).toBe('Apple');
    });
  });

  describe('Standalone HTML Investigation Report Generator', () => {
    it('should generate valid standalone HTML with print styling and explicit disclaimers', async () => {
      const testCase: InvestigationCase = {
        id: 'case_test_998877',
        title: 'Investigation: boAt Airdopes 141 - Marketplace Cross-Check',
        status: 'under_review',
        priority: 'high',
        targetProduct: {
          productName: 'boAt Airdopes 141',
          brand: 'boAt',
          officialImageUrl: 'https://images.unsplash.com/photo-sample.jpg',
          mrp: 4490,
          expectedPriceRange: { min: 1000, max: 1500 },
          knownAuthorizedSellers: ['Amazon', 'Flipkart'],
        },
        evidenceObservations: [
          {
            id: 'obs_1',
            type: 'price',
            candidateTitle: 'boAt Airdopes 141 Bluetooth Headset',
            source: 'Flipkart',
            url: 'https://flipkart.com/sample',
            retrievalTimestamp: new Date().toISOString(),
            anomalyDetected: false,
            anomalyType: 'normal',
            severity: 'none',
            observationSummary: 'Price ₹1,199',
            analysisExplanation: 'Within expected retail band',
            uncertaintyDisclaimer: 'Price evaluation compares marketplace offer against specified MRP and expected street price.',
          },
        ],
        notes: [
          {
            id: 'note_1',
            author: 'Analyst Jane',
            content: 'Marketplace listings sampled across Google Shopping index.',
            createdAt: new Date().toISOString(),
          },
        ],
        tags: ['d2c-audio', 'urgent'],
        findingsSummary: '1 listing analyzed. Price aligns with authorized street price.',
        legalDisclaimer: NON_LEGAL_EVIDENCE_DISCLAIMER,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const html = generateInvestigationHtmlReport(testCase);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('BEACONTRA EVIDENCE DESK');
      expect(html).toContain('CASE #case_test_998877');
      expect(html).toContain('Regulatory & Legal Compliance Disclaimer');
      expect(html).toContain('does NOT constitute legal proof of counterfeit status');
      expect(html).toContain('boAt Airdopes 141');
      expect(html).toContain('₹4,490');
      expect(html).toContain('₹1,000 – ₹1,500');
      expect(html).toContain('@media print');
      expect(html).toContain('window.print()');
    });

    it('should properly escape potentially malicious HTML content in case fields', () => {
      const xssCase: InvestigationCase = {
        id: 'case_xss',
        title: '<script>alert("xss")</script>',
        status: 'active',
        priority: 'low',
        targetProduct: {
          productName: '<img src=x onerror=alert(1)>',
          brand: 'SafeBrand',
          officialImageUrl: 'https://example.com/test.jpg',
        },
        evidenceObservations: [],
        notes: [
          {
            id: 'n1',
            author: 'Bad <script>',
            content: 'Payload: <b onmouseover=alert(2)>hover</b>',
            createdAt: new Date().toISOString(),
          },
        ],
        tags: ['<tag>'],
        findingsSummary: '<b>test</b>',
        legalDisclaimer: NON_LEGAL_EVIDENCE_DISCLAIMER,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const html = generateInvestigationHtmlReport(xssCase);
      expect(html).not.toContain('<script>alert("xss")</script>');
      expect(html).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      expect(html).not.toContain('<img src=x onerror=alert(1)>');
      expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    });
  });

  describe('Evidence Desk HTTP API Endpoints', () => {
    it('should create a case via POST /api/cases', async () => {
      const res = await app.request('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: 'boAt Airdopes 141',
          officialImageUrl: 'https://images.unsplash.com/photo-sample.jpg',
          mrp: 4490,
          expectedPriceRange: { min: 1000, max: 1500 },
          knownAuthorizedSellers: ['Amazon', 'Flipkart'],
          initialNote: 'Case created via API',
        }),
      });

      expect(res.status).toBe(201);
      const json = await res.json() as { data: InvestigationCase };
      expect(json.data.id).toMatch(/^case_/);
      expect(json.data.targetProduct.productName).toBe('boAt Airdopes 141');
      expect(json.data.notes[0]?.content).toBe('Case created via API');
    });

    it('should retrieve a case via GET /api/cases/:caseId', async () => {
      const createRes = await app.request('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: 'boAt Wave Call 2',
          officialImageUrl: 'https://images.unsplash.com/watch.jpg',
        }),
      });

      const created = await createRes.json() as { data: InvestigationCase };
      const caseId = created.data.id;

      const getRes = await app.request(`/api/cases/${caseId}`);
      expect(getRes.status).toBe(200);
      const retrieved = await getRes.json() as { data: InvestigationCase };
      expect(retrieved.data.id).toBe(caseId);
      expect(retrieved.data.targetProduct.productName).toBe('boAt Wave Call 2');
    });

    it('should update a case via PATCH /api/cases/:caseId', async () => {
      const createRes = await app.request('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: 'Noise Buds VS104',
          officialImageUrl: 'https://images.unsplash.com/buds.jpg',
        }),
      });

      const created = await createRes.json() as { data: InvestigationCase };
      const caseId = created.data.id;

      const patchRes = await app.request(`/api/cases/${caseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'under_review',
          priority: 'high',
        }),
      });

      expect(patchRes.status).toBe(200);
      const patched = await patchRes.json() as { data: InvestigationCase };
      expect(patched.data.status).toBe('under_review');
      expect(patched.data.priority).toBe('high');
    });

    it('should add an analyst note via POST /api/cases/:caseId/notes', async () => {
      const createRes = await app.request('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: 'OnePlus Nord Buds 2',
          officialImageUrl: 'https://images.unsplash.com/buds2.jpg',
        }),
      });

      const created = await createRes.json() as { data: InvestigationCase };
      const caseId = created.data.id;

      const noteRes = await app.request(`/api/cases/${caseId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: 'Investigator Mike',
          content: 'Cross-checked with marketplace team.',
        }),
      });

      expect(noteRes.status).toBe(201);
      const noteJson = await noteRes.json() as { data: { author: string; content: string } };
      expect(noteJson.data.author).toBe('Investigator Mike');
      expect(noteJson.data.content).toBe('Cross-checked with marketplace team.');
    });

    it('should serve downloadable HTML report via GET /api/cases/:caseId/report', async () => {
      const createRes = await app.request('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: 'boAt Rockerz 450',
          officialImageUrl: 'https://images.unsplash.com/headphones.jpg',
          mrp: 3990,
          expectedPriceRange: { min: 1299, max: 1599 },
        }),
      });

      const created = await createRes.json() as { data: InvestigationCase };
      const caseId = created.data.id;

      const reportRes = await app.request(`/api/cases/${caseId}/report`);
      expect(reportRes.status).toBe(200);
      expect(reportRes.headers.get('Content-Type')).toContain('text/html');
      expect(reportRes.headers.get('Content-Disposition')).toContain(`beacontra-case-${caseId}.html`);

      const html = await reportRes.text();
      expect(html).toContain('BEACONTRA EVIDENCE DESK');
      expect(html).toContain('boAt Rockerz 450');
      expect(html).toContain(caseId);
      expect(html).toContain('window.print()');
    });
  });
});
