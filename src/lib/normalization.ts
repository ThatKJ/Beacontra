export function normalizeSellerName(raw: string): string {
  if (raw === undefined || raw === null) return 'unknown';
  if (typeof raw !== 'string' || raw.trim() === '') return '';
  
  let normalized = raw
    .toLowerCase()
    .trim()
    .replace(/[^\w\s.-]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[.-]\s*$/g, '')
    .replace(/^\s*[.-]/g, '');

  const suffixes = [
    'official', 'store', 'shop', 'seller', 'retail', 'online', 'india',
    'pvt', 'ltd', 'limited', 'private', 'llp', 'inc', 'corp',
    'officialstore', 'officialshop', 'flagshipstore', 'flagship',
    'authorised', 'authorized', 'distributor', 'dealer', 'reseller',
    'mart', 'bazaar', 'market', 'emporium', 'outlet', 'hub', 'zone'
  ];

  for (const suffix of suffixes) {
    const regex = new RegExp(`\\b${suffix}\\b`, 'gi');
    normalized = normalized.replace(regex, '').trim();
  }

  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized || raw.toLowerCase().trim();
}

export function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}

export function normalizeDomain(domain: string): string {
  if (!domain) return 'unknown';
  return domain.toLowerCase().trim().replace(/^www\./, '').replace(/\/$/, '');
}

export function getMarketplaceFromSource(source: string): string {
  const normalized = normalizeSellerName(source);
  
  const marketplaceMap: Record<string, string[]> = {
    'flipkart': ['flipkart', 'fk', 'fkt'],
    'amazon': ['amazon', 'amzn', 'amazonin', 'amazon.in'],
    'reliance': ['reliance', 'reliancedigital', 'reliance digital', 'jiomart', 'jio mart'],
    'croma': ['croma', 'infiniti retail'],
    'tata': ['tata', 'tatacliq', 'tata cliq', 'tatadirect'],
    'meesho': ['meesho', 'meeshho'],
    'nykaa': ['nykaa', 'nykaa fashion'],
    'purplle': ['purplle'],
    'myntra': ['myntra'],
    'ajio': ['ajio', 'reliance ajio'],
    'snapdeal': ['snapdeal'],
    'paytm': ['paytm', 'paytm mall', 'paytmmall'],
    'shopclues': ['shopclues', 'shop clues'],
    'ebay': ['ebay', 'ebay.in'],
    'olx': ['olx'],
    'quikr': ['quikr'],
    'indiamart': ['indiamart', 'india mart'],
    'tradeindia': ['tradeindia', 'trade india'],
  };

  for (const [marketplace, aliases] of Object.entries(marketplaceMap)) {
    if (aliases.some(alias => normalized.includes(alias))) {
      return marketplace;
    }
  }

  return 'other';
}

export function isLikelyAuthorizedSeller(seller: string, authorizedList: string[]): boolean {
  if (!authorizedList || authorizedList.length === 0) return false;
  const normalizedSeller = normalizeSellerName(seller);
  return authorizedList.some(auth => {
    const normalizedAuth = normalizeSellerName(auth);
    return normalizedSeller.includes(normalizedAuth) || normalizedAuth.includes(normalizedSeller);
  });
}

export function extractProductKey(title: string): string {
  if (!title) return '';
  
  let key = title
    .toLowerCase()
    .replace(/(\d+)\s*(gb|mb|tb)\b/gi, '$1$2')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const noiseWords = [
    'original', 'genuine', 'authentic', 'brand new', 'new', 'sealed', 'boxed',
    'latest', 'model', 'version', 'edition', 'pack', 'combo', 'set', 'kit',
    'buy', 'online', 'best', 'price', 'offer', 'deal', 'discount', 'sale',
    'free', 'shipping', 'delivery', 'cod', 'emi', 'warranty', 'guarantee',
    'official', 'store', 'shop', 'seller', 'retail', 'india', 'officialstore'
  ];

  for (const word of noiseWords) {
    key = key.replace(new RegExp(`\\b${word}\\b`, 'gi'), ' ').replace(/\s+/g, ' ').trim();
  }

  const words = key.split(' ').filter(w => w.length > 2);
  return words.slice(0, 10).join(' ');
}

export function calculateTitleSimilarity(title1: string, title2: string): number {
  const key1 = extractProductKey(title1);
  const key2 = extractProductKey(title2);
  
  if (!key1 || !key2) return 0;
  
  const words1 = new Set(key1.split(' '));
  const words2 = new Set(key2.split(' '));
  
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
}

export function deduplicateListings(
  listings: Array<{ title: string; source: string; extractedPrice: number }>
): Array<{ title: string; source: string; extractedPrice: number }> {
  const deduplicated: Array<{ title: string; source: string; extractedPrice: number }> = [];

  for (const listing of listings) {
    const marketplace = getMarketplaceFromSource(listing.source);
    const existingIndex = deduplicated.findIndex(existing => {
      const existingMarketplace = getMarketplaceFromSource(existing.source);
      if (marketplace !== existingMarketplace) return false;
      const sim = calculateTitleSimilarity(listing.title, existing.title);
      return sim >= 0.7;
    });

    if (existingIndex >= 0) {
      const existing = deduplicated[existingIndex];
      if (existing && listing.extractedPrice < existing.extractedPrice) {
        deduplicated[existingIndex] = listing;
      }
    } else {
      deduplicated.push(listing);
    }
  }

  return deduplicated;
}

export interface CreditEstimate {
  shoppingCalls: number;
  lensCalls: number;
  amazonCalls: number;
  totalEstimatedCredits: number;
  breakdown: string[];
}

export function estimateScanCredits(
  expectedShoppingResults: number,
  maxLensCalls: number = 10,
  includeAmazon: boolean = false
): CreditEstimate {
  const shoppingCalls = 1;
  const lensCalls = Math.min(expectedShoppingResults, maxLensCalls);
  const amazonCalls = includeAmazon ? Math.min(expectedShoppingResults, 5) : 0;
  
  const shoppingCredits = shoppingCalls * 3;
  const lensCredits = lensCalls * 3;
  const amazonCredits = amazonCalls * 3;
  
  return {
    shoppingCalls,
    lensCalls,
    amazonCalls,
    totalEstimatedCredits: shoppingCredits + lensCredits + amazonCredits,
    breakdown: [
      `Google Shopping: ${shoppingCalls} call(s) = ${shoppingCredits} credits`,
      `Google Lens: ${lensCalls} call(s) = ${lensCredits} credits`,
      ...(amazonCalls > 0 ? [`Amazon Product: ${amazonCalls} call(s) = ${amazonCredits} credits`] : []),
      `Total: ${shoppingCredits + lensCredits + amazonCredits} credits`
    ]
  };
}

export function sanitizeForLogging(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    return obj
      .replace(/api[_-]?key["'\s:=]+[^\s"'&]+/gi, 'api_key=***')
      .replace(/bearer\s+[^\s"'&]+/gi, 'Bearer ***');
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForLogging);
  }
  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const lower = key.toLowerCase();
      if (
        lower.includes('key') ||
        lower.includes('secret') ||
        lower.includes('token') ||
        lower.includes('auth') ||
        lower.includes('password')
      ) {
        sanitized[key] = '***';
      } else {
        sanitized[key] = sanitizeForLogging(value);
      }
    }
    return sanitized;
  }
  return obj;
}

export interface VariantMismatchResult {
  isMismatch: boolean;
  reason?: 'accessory' | 'hardware_tier' | 'version_generation' | 'capacity' | 'bundle';
  details?: string;
}

/**
 * Robust product-variant normalization
 * Identifies accessories, hardware tier differences (Pro, Max, ANC), and version generations
 * while preserving legitimate cosmetic/color variations.
 */
export function isVariantMismatch(title: string, productName: string): VariantMismatchResult {
  if (!title || !productName) {
    return { isMismatch: false };
  }

  const t = title.toLowerCase();
  const p = productName.toLowerCase();

  // 1. Filter out common accessories if query product is not an accessory
  const accessoryTokens = [
    'case', 'cover', 'skin', 'silicone', 'pouch', 'protector', 'tempered glass',
    'strap', 'charging cable', 'cable', 'ear tips', 'eartips', 'sleeve',
    'cushion', 'adapter', 'charging case only', 'stand', 'mount', 'lanyard', 'holster'
  ];
  for (const token of accessoryTokens) {
    const regex = new RegExp(`\\b${token}\\b`, 'i');
    if (regex.test(t) && !regex.test(p)) {
      return {
        isMismatch: true,
        reason: 'accessory',
        details: `Listing title contains accessory descriptor "${token}" not present in target product`,
      };
    }
  }

  // 2. Filter out bundle / multi-pack variants
  const bundleTokens = [
    'pack of 2', 'pack of 3', 'pack of 4', 'combo pack', '2 pack', '3 pack',
    'set of 2', 'set of 3', '2 in 1 combo', 'pair pack'
  ];
  for (const token of bundleTokens) {
    if (t.includes(token) && !p.includes(token)) {
      return {
        isMismatch: true,
        reason: 'bundle',
        details: `Listing appears to be a bundled/multipack offering ("${token}")`,
      };
    }
  }

  // 3. Filter out hardware SKU tier modifiers (Pro, ANC, Plus, Max, Ultra, Lite, etc.)
  const tierTokens = [
    'pro', 'anc', 'plus', 'max', 'ultra', 'lite', 'neo', 'elite', 'active', 'se', 'mini', 'prime', 'fe'
  ];
  for (const token of tierTokens) {
    const regex = new RegExp(`\\b${token}\\b`, 'i');
    const inTitle = regex.test(t);
    const inProduct = regex.test(p);
    if (inTitle !== inProduct) {
      return {
        isMismatch: true,
        reason: 'hardware_tier',
        details: `Hardware tier modifier "${token}" ${inTitle ? 'present in listing but absent from target product' : 'missing from listing'}`,
      };
    }
  }

  // 4. Filter out generation/version modifiers (Gen 2, V2, 2nd Gen, etc.)
  const genTokens = [
    'gen 2', 'gen2', 'gen 3', 'gen3', 'gen 4', 'gen4',
    'v2', 'v3', 'v4', 'version 2', 'version 3',
    '2nd gen', '3rd gen', '4th gen',
    '2023 edition', '2024 edition', '2025 edition', '2026 edition'
  ];
  for (const token of genTokens) {
    const regex = new RegExp(`\\b${token}\\b`, 'i');
    const inTitle = regex.test(t);
    const inProduct = regex.test(p);
    if (inTitle !== inProduct) {
      return {
        isMismatch: true,
        reason: 'version_generation',
        details: `Generation/version modifier "${token}" ${inTitle ? 'present in listing but absent from target product' : 'missing from listing'}`,
      };
    }
  }

  // 5. Storage capacity differences (e.g. 128GB vs 256GB)
  const capacityRegex = /\b(\d+)\s*(gb|tb)\b/gi;
  const productCapMatches = Array.from(p.matchAll(capacityRegex)).map(m => `${m[1]}${(m[2] ?? '').toLowerCase()}`);
  const titleCapMatches = Array.from(t.matchAll(capacityRegex)).map(m => `${m[1]}${(m[2] ?? '').toLowerCase()}`);

  if (productCapMatches.length > 0 && titleCapMatches.length > 0) {
    const productCap = productCapMatches[0];
    const titleCap = titleCapMatches[0];
    if (productCap !== titleCap) {
      return {
        isMismatch: true,
        reason: 'capacity',
        details: `Capacity mismatch: target specifies ${productCap}, listing specifies ${titleCap}`,
      };
    }
  }

  return { isMismatch: false };
}

export interface SourceClassification {
  isOfficialBrand: boolean;
  isAuthorizedSeller: boolean;
  isRecognizedMarketplace: boolean;
  isKnownSafeChannel: boolean;
  matchType: 'official_brand' | 'authorized_retailer' | 'recognized_marketplace' | 'unverified_third_party';
  sourceDomain: string;
  details: string;
}

/**
 * Classifies a match source from Google Lens or marketplace search
 * Replaces crude substring heuristics (like searching for the word 'official')
 * with domain-aware, brand-token, and authorized seller reconciliation.
 */
export function classifyMatchSource(
  source: string,
  link: string | undefined,
  brandOrProductName: string,
  authorizedSellers: string[] = [],
  officialImageUrl?: string
): SourceClassification {
  const normSource = normalizeSellerName(source || '');
  const domainFromLink = link ? extractDomain(link) : '';
  const sourceDomain = domainFromLink !== 'unknown' && domainFromLink !== '' ? domainFromLink : normalizeDomain(source || '');

  // Extract brand keywords
  const brandKeywords: string[] = [];
  if (brandOrProductName) {
    const words = brandOrProductName.toLowerCase().split(/\s+/).filter(w => w.length >= 3);
    if (words.length > 0) {
      brandKeywords.push(words[0]!); // First word is typically the brand (e.g., boAt, Apple, Nike)
      if (words.length > 1 && words[1] === 'india') {
        brandKeywords.push(`${words[0]} india`);
      }
    }
  }

  // Extract official domain from officialImageUrl if present
  let officialDomain = '';
  if (officialImageUrl && officialImageUrl.startsWith('http')) {
    try {
      const url = new URL(officialImageUrl);
      officialDomain = normalizeDomain(url.hostname);
    } catch {
      // ignore
    }
  }

  // 1. Check for official brand channel
  const isOfficialDomain = officialDomain && (sourceDomain.includes(officialDomain) || officialDomain.includes(sourceDomain));
  const isBrandNameMatch = brandKeywords.some(bk => normSource.includes(bk) || sourceDomain.includes(bk));
  const isOfficialBrand = Boolean(isOfficialDomain || (isBrandNameMatch && (normSource.includes('store') || normSource.includes('official') || sourceDomain.includes(brandKeywords[0] || ''))));

  if (isOfficialBrand) {
    return {
      isOfficialBrand: true,
      isAuthorizedSeller: true,
      isRecognizedMarketplace: false,
      isKnownSafeChannel: true,
      matchType: 'official_brand',
      sourceDomain,
      details: `Source matches official brand identity (${sourceDomain || normSource})`,
    };
  }

  // 2. Check for authorized sellers
  const isAuthorized = isLikelyAuthorizedSeller(normSource, authorizedSellers) ||
    (sourceDomain && authorizedSellers.some(auth => {
      const normAuth = normalizeSellerName(auth);
      return sourceDomain.includes(normAuth) || normAuth.includes(sourceDomain);
    }));

  if (isAuthorized) {
    return {
      isOfficialBrand: false,
      isAuthorizedSeller: true,
      isRecognizedMarketplace: true,
      isKnownSafeChannel: true,
      matchType: 'authorized_retailer',
      sourceDomain,
      details: `Source "${source}" is in the authorized seller list`,
    };
  }

  // 3. Check for recognized major marketplace
  const marketplace = getMarketplaceFromSource(source || sourceDomain);
  const isRecognizedMarketplace = marketplace !== 'other';

  if (isRecognizedMarketplace) {
    return {
      isOfficialBrand: false,
      isAuthorizedSeller: false,
      isRecognizedMarketplace: true,
      isKnownSafeChannel: true,
      matchType: 'recognized_marketplace',
      sourceDomain,
      details: `Recognized marketplace (${marketplace}) but seller not specifically authorized`,
    };
  }

  // 4. Unverified third-party
  return {
    isOfficialBrand: false,
    isAuthorizedSeller: false,
    isRecognizedMarketplace: false,
    isKnownSafeChannel: false,
    matchType: 'unverified_third_party',
    sourceDomain,
    details: `Unverified third-party domain (${sourceDomain || source || 'unknown'})`,
  };
}