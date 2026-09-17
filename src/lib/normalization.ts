export function normalizeSellerName(raw: string): string {
  if (!raw) return 'unknown';
  
  let normalized = raw
    .toLowerCase()
    .trim()
    .replace(/[^\w\s.-]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[.-]\s*$/g, '')
    .replace(/^\s*[.-]/g, '');

  const suffixes = [
    'official', 'store', 'shop', 'seller', 'retail', 'online', 'india',
    'pvt', 'ltd', 'limited', 'private', 'llp', 'inc', 'corp', 'company',
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
  
  return domain
    .toLowerCase()
    .trim()
    .replace(/^www\./, '')
    .replace(/\/$/, '');
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

export function isLikelyAuthorizedSeller(source: string, authorizedSellers: string[]): boolean {
  const normalizedSource = normalizeSellerName(source);
  const normalizedAuthorized = authorizedSellers.map(normalizeSellerName);
  
  return normalizedAuthorized.some(auth => 
    normalizedSource.includes(auth) || auth.includes(normalizedSource)
  );
}

export function extractProductKey(title: string): string {
  if (!title) return '';
  
  let key = title
    .toLowerCase()
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

export function deduplicateListings(listings: Array<{ title: string; source: string; extractedPrice: number }>): Array<{ title: string; source: string; extractedPrice: number }> {
  const groups = new Map<string, Array<{ title: string; source: string; extractedPrice: number }>>();
  
  for (const listing of listings) {
    const key = `${extractProductKey(listing.title)}|${getMarketplaceFromSource(listing.source)}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(listing);
  }

  const deduplicated: Array<{ title: string; source: string; extractedPrice: number }> = [];
  
  for (const [, group] of groups) {
    const best = group.reduce((a, b) => a.extractedPrice < b.extractedPrice ? a : b);
    deduplicated.push(best);
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
    return obj.replace(/api[_-]?key["'\s:=]+[^\s"'&]+/gi, 'api_key=***');
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForLogging);
  }
  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key.toLowerCase().includes('key') || key.toLowerCase().includes('secret') || key.toLowerCase().includes('token')) {
        sanitized[key] = '***';
      } else {
        sanitized[key] = sanitizeForLogging(value);
      }
    }
    return sanitized;
  }
  return obj;
}