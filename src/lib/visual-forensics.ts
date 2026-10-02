/**
 * Beacontra Visual Forensics & Evidence Graph Engine
 * 
 * Central technical differentiator:
 * 1. Visual Forensics using supported Google Lens engine (exact & visual matches).
 *    - Explicitly treats Lens matches as discovery leads, NEVER proof of authenticity or ownership.
 *    - Absence of Lens matches is treated as lack of visual evidence, NOT positive proof of mismatch.
 * 2. Multi-Entity Evidence Graph:
 *    - Nodes: Product, Listing, Marketplace, Merchant, Image, External Source, Case.
 *    - Edges: Explicit evidence basis for every link.
 *    - Strict separation between observed and inferred relationships.
 *    - Disclaims shared ownership claims derived solely from stock imagery.
 * 3. Client-ready graph traversal, filtering (by confidence/uncertainty), and grouping.
 */

import type { SerpApiClient } from './serpapi-client';
import type {
  EvidenceRepository,
  ProductIdentity,
  MarketplaceListing,
  VisualEvidence,
  InvestigationCase,
} from './evidence-core';
import { isSafePublicUrl } from './security';
import type { BaseSearchParams } from './types';

export const VISUAL_EVIDENCE_DISCLAIMER =
  'VISUAL EVIDENCE NOTICE: Google Lens reverse-image matches identify web pages displaying ' +
  'visually similar or identical pixel patterns. A visual match indicates image asset reuse, ' +
  'not genuine product provenance, physical product authenticity, or authorized merchant status. ' +
  'Common catalog imagery is routinely shared across authorized and unauthorized distributors alike.';

export type GraphNodeType =
  | 'product'
  | 'listing'
  | 'marketplace'
  | 'merchant'
  | 'image'
  | 'external_source'
  | 'case';

export type GraphRelationshipType =
  | 'references_product'
  | 'uses_image'
  | 'has_lens_match'
  | 'appeared_in_marketplace'
  | 'observed_in_scan'
  | 'case_contains_evidence';

export interface EvidenceGraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  sublabel?: string;
  metadata: Record<string, unknown>;
  provenance: {
    sourceEngine?: string;
    retrievalTimestamp: string;
    dataSource: 'live' | 'fixture' | 'cache' | 'user_input';
    confidence: number;
  };
}

export interface EvidenceGraphEdge {
  id: string;
  source: string; // Source Node ID
  target: string; // Target Node ID
  relationship: GraphRelationshipType;
  relationshipKind: 'observed' | 'inferred';
  evidenceBasis: string; // Concrete underlying factual observation
  confidence: number;
  uncertaintyDisclaimer: string;
}

export interface EvidenceGraph {
  nodes: EvidenceGraphNode[];
  edges: EvidenceGraphEdge[];
  summary: {
    totalNodes: number;
    totalEdges: number;
    nodeTypeCounts: Record<GraphNodeType, number>;
    relationshipCounts: Record<GraphRelationshipType, number>;
  };
}

export interface VisualInvestigationResult {
  listingId: string;
  imageUrl: string;
  lensStatus: 'exact_match' | 'visual_match' | 'partial_match' | 'no_match';
  matchedSources: Array<{
    title: string;
    link: string;
    source: string;
    thumbnail?: string;
  }>;
  confidence: number;
  interpretation: string;
  disclaimer: string;
}

export interface GraphFilterOptions {
  nodeTypes?: GraphNodeType[];
  relationshipTypes?: GraphRelationshipType[];
  minConfidence?: number;
  relationshipKind?: 'observed' | 'inferred' | 'all';
}

export class VisualForensicsService {
  constructor(
    private serpApiClient: SerpApiClient,
    private repository: EvidenceRepository
  ) {}

  /**
   * Conducts visual forensics on a listing's image using Google Lens.
   */
  async investigateImage(
    listing: MarketplaceListing,
    canonicalProductImageUrl?: string
  ): Promise<VisualInvestigationResult> {
    const imageUrl = listing.imageUrl;

    if (!imageUrl || !isSafePublicUrl(imageUrl).isSafe) {
      return {
        listingId: listing.id,
        imageUrl: imageUrl || '',
        lensStatus: 'no_match',
        matchedSources: [],
        confidence: 0,
        interpretation: 'Invalid or unsafe image URL provided; visual analysis could not be initiated.',
        disclaimer: VISUAL_EVIDENCE_DISCLAIMER,
      };
    }

    const searchParams: BaseSearchParams & { url?: string } = {
      engine: 'google_lens',
      url: imageUrl,
      hl: 'en',
    };

    let lensStatus: VisualInvestigationResult['lensStatus'] = 'no_match';
    const matchedSources: VisualInvestigationResult['matchedSources'] = [];
    let confidence = 0.5;
    let interpretation = 'No matching web imagery identified by Google Lens.';

    try {
      const resp = await this.serpApiClient.search<{
        visual_matches?: Array<{
          title?: string;
          link?: string;
          source?: string;
          thumbnail?: string;
        }>;
        exact_matches?: Array<{
          title?: string;
          link?: string;
          source?: string;
          thumbnail?: string;
        }>;
      }>(searchParams);

      const exact = resp.exact_matches || [];
      const visual = resp.visual_matches || [];

      if (exact.length > 0) {
        lensStatus = 'exact_match';
        confidence = 0.95;
        for (const m of exact.slice(0, 5)) {
          if (m.title && m.link) {
            matchedSources.push({
              title: m.title,
              link: m.link,
              source: m.source || 'Web Source',
              thumbnail: m.thumbnail,
            });
          }
        }
        interpretation = `Identified ${exact.length} exact visual matches across public web sources, indicating common catalog asset usage.`;
      } else if (visual.length > 0) {
        lensStatus = 'visual_match';
        confidence = 0.8;
        for (const m of visual.slice(0, 5)) {
          if (m.title && m.link) {
            matchedSources.push({
              title: m.title,
              link: m.link,
              source: m.source || 'Web Source',
              thumbnail: m.thumbnail,
            });
          }
        }
        interpretation = `Identified ${visual.length} visually similar image leads. Requires human visual inspection to confirm packaging or model nuances.`;
      } else {
        // T-026 Rule: Zero matches is absence of evidence, NOT evidence of product mismatch
        lensStatus = 'no_match';
        confidence = 0.3;
        interpretation = 'Google Lens indexed no public co-occurrences for this specific image URL. This indicates absence of indexed visual evidence, not proof of counterfeit or mismatched product.';
      }

      // Check against canonical product image if provided
      if (canonicalProductImageUrl && imageUrl === canonicalProductImageUrl) {
        interpretation += ' Image URL identically matches the brand official canonical photo.';
      }
    } catch {
      // Graceful fallback on search provider error
      interpretation = 'Visual forensics search query failed or timed out. Lens signal unavailable.';
    }

    // Save visual evidence to repository
    const visualEv: VisualEvidence = {
      id: `vis_${listing.id}_${Date.now()}`,
      listingId: listing.id,
      imageUrl,
      lensEngine: 'google_lens',
      lensStatus,
      matchedPages: matchedSources,
      confidenceScore: confidence,
      retrievalTimestamp: new Date().toISOString(),
    };
    await this.repository.saveVisualEvidence(visualEv);

    return {
      listingId: listing.id,
      imageUrl,
      lensStatus,
      matchedSources,
      confidence,
      interpretation,
      disclaimer: VISUAL_EVIDENCE_DISCLAIMER,
    };
  }

  /**
   * Constructs a fully qualified Evidence Graph connecting products, listings,
   * merchants, images, Lens match sources, and cases.
   */
  async buildGraph(options: {
    productId?: string;
    caseId?: string;
    listingIds?: string[];
  }): Promise<EvidenceGraph> {
    const nodesMap = new Map<string, EvidenceGraphNode>();
    const edges: EvidenceGraphEdge[] = [];
    const seenEdges = new Set<string>();

    const addEdge = (edge: EvidenceGraphEdge) => {
      const key = `${edge.source}->${edge.target}:${edge.relationship}`;
      if (!seenEdges.has(key)) {
        seenEdges.add(key);
        edges.push(edge);
      }
    };

    // 1. Resolve Products
    let products: ProductIdentity[] = [];
    if (options.productId) {
      const p = await this.repository.getProduct(options.productId);
      if (p) products.push(p);
    } else {
      products = await this.repository.listProducts();
    }

    for (const prod of products) {
      nodesMap.set(prod.id, {
        id: prod.id,
        type: 'product',
        label: prod.canonicalName,
        sublabel: `Brand: ${prod.brandId.toUpperCase()} | MRP: ₹${prod.mrp}`,
        metadata: {
          brandId: prod.brandId,
          mrp: prod.mrp,
          authorizedSellers: prod.authorizedSellers,
        },
        provenance: {
          sourceEngine: 'brand_dna',
          retrievalTimestamp: prod.createdAt,
          dataSource: 'user_input',
          confidence: 1.0,
        },
      });
    }

    // 2. Resolve Listings
    const listings: MarketplaceListing[] = [];
    if (options.listingIds && options.listingIds.length > 0) {
      for (const id of options.listingIds) {
        const l = await this.repository.getListing(id);
        if (l) listings.push(l);
      }
    } else {
      const allListings = await this.repository.listListings();
      listings.push(...allListings.slice(0, 50)); // Cap graph size for visual clarity
    }

    for (const listing of listings) {
      const listingNodeId = listing.id;
      nodesMap.set(listingNodeId, {
        id: listingNodeId,
        type: 'listing',
        label: listing.title.slice(0, 48) + (listing.title.length > 48 ? '...' : ''),
        sublabel: `${listing.source} • ₹${listing.extractedPrice}`,
        metadata: {
          url: listing.url,
          cleanUrl: listing.cleanUrl,
          price: listing.extractedPrice,
          source: listing.source,
          sellerName: listing.sellerName,
        },
        provenance: {
          sourceEngine: 'marketplace_discovery',
          retrievalTimestamp: listing.createdAt,
          dataSource: 'live',
          confidence: 0.95,
        },
      });

      // Link listing to marketplace platform
      const marketplaceId = `mkt_${listing.marketplace.toLowerCase()}`;
      if (!nodesMap.has(marketplaceId)) {
        nodesMap.set(marketplaceId, {
          id: marketplaceId,
          type: 'marketplace',
          label: listing.source,
          sublabel: 'Marketplace Platform',
          metadata: { platform: listing.marketplace },
          provenance: {
            retrievalTimestamp: listing.createdAt,
            dataSource: 'live',
            confidence: 1.0,
          },
        });
      }

      addEdge({
        id: `e_${listingNodeId}_${marketplaceId}`,
        source: listingNodeId,
        target: marketplaceId,
        relationship: 'appeared_in_marketplace',
        relationshipKind: 'observed',
        evidenceBasis: `Observed on marketplace channel "${listing.source}" at ${listing.createdAt}`,
        confidence: 1.0,
        uncertaintyDisclaimer: 'Platform discovery is a direct observation of search engine indexing.',
      });

      // Link to merchant if available
      if (listing.merchantId) {
        const merchant = await this.repository.getMerchant(listing.merchantId);
        if (merchant) {
          if (!nodesMap.has(merchant.id)) {
            nodesMap.set(merchant.id, {
              id: merchant.id,
              type: 'merchant',
              label: merchant.name,
              sublabel: `Status: ${merchant.verificationStatus}`,
              metadata: {
                platform: merchant.platform,
                verificationStatus: merchant.verificationStatus,
              },
              provenance: {
                retrievalTimestamp: merchant.firstObservedAt,
                dataSource: 'live',
                confidence: 0.9,
              },
            });
          }

          addEdge({
            id: `e_${listingNodeId}_${merchant.id}`,
            source: listingNodeId,
            target: merchant.id,
            relationship: 'appeared_in_marketplace',
            relationshipKind: 'observed',
            evidenceBasis: `Merchant "${merchant.name}" listed as public seller for listing ${listing.id}`,
            confidence: 0.9,
            uncertaintyDisclaimer: 'Merchant name extracted from public marketplace listing card. Legal entity structure unverified.',
          });
        }
      }

      // Link listing to Product
      for (const prod of products) {
        if (listing.title.toLowerCase().includes(prod.brandId.toLowerCase())) {
          addEdge({
            id: `e_${listingNodeId}_${prod.id}`,
            source: listingNodeId,
            target: prod.id,
            relationship: 'references_product',
            relationshipKind: 'inferred',
            evidenceBasis: `Listing title references brand "${prod.brandId}" and product name patterns`,
            confidence: 0.85,
            uncertaintyDisclaimer: 'Product association inferred from title token co-occurrence and SKU matching.',
          });
        }
      }

      // 3. Link Visual Evidence & Google Lens Matches
      if (listing.imageUrl) {
        const imageNodeId = `img_${listing.id}`;
        if (!nodesMap.has(imageNodeId)) {
          nodesMap.set(imageNodeId, {
            id: imageNodeId,
            type: 'image',
            label: 'Observed Image Asset',
            sublabel: listing.imageUrl.slice(0, 40) + '...',
            metadata: { imageUrl: listing.imageUrl },
            provenance: {
              sourceEngine: 'marketplace_image',
              retrievalTimestamp: listing.createdAt,
              dataSource: 'live',
              confidence: 1.0,
            },
          });
        }

        addEdge({
          id: `e_${listingNodeId}_${imageNodeId}`,
          source: listingNodeId,
          target: imageNodeId,
          relationship: 'uses_image',
          relationshipKind: 'observed',
          evidenceBasis: `Listing specifies image URL in marketplace card thumbnail payload`,
          confidence: 1.0,
          uncertaintyDisclaimer: 'Direct image URL observation from marketplace discovery.',
        });

        const visualList = await this.repository.getVisualEvidenceForListing(listing.id);
        for (const vis of visualList) {
          for (let i = 0; i < vis.matchedPages.length; i++) {
            const page = vis.matchedPages[i]!;
            const extSourceId = `ext_${encodeURIComponent(page.source || 'web')}_${i}`;
            if (!nodesMap.has(extSourceId)) {
              nodesMap.set(extSourceId, {
                id: extSourceId,
                type: 'external_source',
                label: page.source || 'External Source',
                sublabel: page.title.slice(0, 36) + '...',
                metadata: {
                  url: page.link,
                  title: page.title,
                },
                provenance: {
                  sourceEngine: 'google_lens',
                  retrievalTimestamp: vis.retrievalTimestamp,
                  dataSource: 'live',
                  confidence: vis.confidenceScore,
                },
              });
            }

            addEdge({
              id: `e_${imageNodeId}_${extSourceId}`,
              source: imageNodeId,
              target: extSourceId,
              relationship: 'has_lens_match',
              relationshipKind: 'observed',
              evidenceBasis: `Google Lens matched image against external webpage "${page.title}" (${page.source}) with confidence ${vis.confidenceScore}`,
              confidence: vis.confidenceScore,
              uncertaintyDisclaimer: VISUAL_EVIDENCE_DISCLAIMER,
            });
          }
        }
      }
    }

    // 4. Resolve Investigation Cases
    let cases: InvestigationCase[] = [];
    if (options.caseId) {
      const c = await this.repository.getCase(options.caseId);
      if (c) cases.push(c);
    } else {
      cases = await this.repository.listCases(options.productId);
    }

    for (const c of cases) {
      const caseNodeId = c.id;
      nodesMap.set(caseNodeId, {
        id: caseNodeId,
        type: 'case',
        label: c.title,
        sublabel: `Status: ${c.status.toUpperCase()} | Priority: ${c.priority.toUpperCase()}`,
        metadata: {
          caseNumber: c.caseNumber,
          status: c.status,
          priority: c.priority,
        },
        provenance: {
          retrievalTimestamp: c.createdAt,
          dataSource: 'user_input',
          confidence: 1.0,
        },
      });

      // Link case to referenced listings
      for (const lId of c.listingIds) {
        if (nodesMap.has(lId)) {
          addEdge({
            id: `e_${caseNodeId}_${lId}`,
            source: caseNodeId,
            target: lId,
            relationship: 'case_contains_evidence',
            relationshipKind: 'observed',
            evidenceBasis: `Analyst associated listing ${lId} with formal investigation case ${c.caseNumber}`,
            confidence: 1.0,
            uncertaintyDisclaimer: 'Human analyst case association.',
          });
        }
      }
    }

    // Calculate node and relationship counts
    const nodes = Array.from(nodesMap.values());
    const nodeTypeCounts: Record<GraphNodeType, number> = {
      product: 0,
      listing: 0,
      marketplace: 0,
      merchant: 0,
      image: 0,
      external_source: 0,
      case: 0,
    };
    for (const n of nodes) {
      nodeTypeCounts[n.type] = (nodeTypeCounts[n.type] || 0) + 1;
    }

    const relationshipCounts: Record<GraphRelationshipType, number> = {
      references_product: 0,
      uses_image: 0,
      has_lens_match: 0,
      appeared_in_marketplace: 0,
      observed_in_scan: 0,
      case_contains_evidence: 0,
    };
    for (const e of edges) {
      relationshipCounts[e.relationship] = (relationshipCounts[e.relationship] || 0) + 1;
    }

    return {
      nodes,
      edges,
      summary: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        nodeTypeCounts,
        relationshipCounts,
      },
    };
  }

  /**
   * Filters an evidence graph by confidence, node types, or relationship kinds.
   */
  filterGraph(graph: EvidenceGraph, options: GraphFilterOptions): EvidenceGraph {
    let filteredNodes = [...graph.nodes];
    let filteredEdges = [...graph.edges];

    if (options.nodeTypes && options.nodeTypes.length > 0) {
      const allowed = new Set(options.nodeTypes);
      filteredNodes = filteredNodes.filter(n => allowed.has(n.type));
    }

    const validNodeIds = new Set(filteredNodes.map(n => n.id));

    filteredEdges = filteredEdges.filter(
      e => validNodeIds.has(e.source) && validNodeIds.has(e.target)
    );

    if (options.relationshipTypes && options.relationshipTypes.length > 0) {
      const allowedRels = new Set(options.relationshipTypes);
      filteredEdges = filteredEdges.filter(e => allowedRels.has(e.relationship));
    }

    if (options.minConfidence !== undefined) {
      filteredEdges = filteredEdges.filter(e => e.confidence >= options.minConfidence!);
    }

    if (options.relationshipKind && options.relationshipKind !== 'all') {
      filteredEdges = filteredEdges.filter(e => e.relationshipKind === options.relationshipKind);
    }

    // Recompute counts
    const nodeTypeCounts: Record<GraphNodeType, number> = {
      product: 0, listing: 0, marketplace: 0, merchant: 0, image: 0, external_source: 0, case: 0
    };
    for (const n of filteredNodes) nodeTypeCounts[n.type] = (nodeTypeCounts[n.type] || 0) + 1;

    const relationshipCounts: Record<GraphRelationshipType, number> = {
      references_product: 0, uses_image: 0, has_lens_match: 0, appeared_in_marketplace: 0, observed_in_scan: 0, case_contains_evidence: 0
    };
    for (const e of filteredEdges) relationshipCounts[e.relationship] = (relationshipCounts[e.relationship] || 0) + 1;

    return {
      nodes: filteredNodes,
      edges: filteredEdges,
      summary: {
        totalNodes: filteredNodes.length,
        totalEdges: filteredEdges.length,
        nodeTypeCounts,
        relationshipCounts,
      },
    };
  }
}
