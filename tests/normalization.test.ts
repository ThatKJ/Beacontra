import { describe, it, expect } from 'vitest';
import {
  normalizeSellerName,
  extractDomain,
  normalizeDomain,
  getMarketplaceFromSource,
  isLikelyAuthorizedSeller,
  extractProductKey,
  calculateTitleSimilarity,
  deduplicateListings,
  estimateScanCredits,
  sanitizeForLogging,
} from '../src/lib/normalization';

describe('normalizeSellerName', () => {
  it('should normalize basic seller names', () => {
    expect(normalizeSellerName('Flipkart Official Store')).toBe('flipkart');
    expect(normalizeSellerName('Amazon India')).toBe('amazon');
    expect(normalizeSellerName('Reliance Digital')).toBe('reliance digital');
  });

  it('should remove common suffixes', () => {
    expect(normalizeSellerName('Best Seller Store')).toBe('best');
    expect(normalizeSellerName('Official Shop')).toBe('official shop');
    expect(normalizeSellerName('Random Mart')).toBe('random');
    expect(normalizeSellerName('Unknown Bazaar')).toBe('unknown');
  });

  it('should handle edge cases', () => {
    expect(normalizeSellerName('')).toBe('');
    expect(normalizeSellerName('   ')).toBe('');
    expect(normalizeSellerName('Pvt Ltd Company')).toBe('company');
    expect(normalizeSellerName('Unknown')).toBe('unknown');
  });
});

describe('extractDomain', () => {
  it('should extract domain from URLs', () => {
    expect(extractDomain('https://www.flipkart.com/product/123')).toBe('flipkart.com');
    expect(extractDomain('https://amazon.in/dp/B00123')).toBe('amazon.in');
    expect(extractDomain('https://www.example.com/path')).toBe('example.com');
  });

  it('should handle invalid URLs', () => {
    expect(extractDomain('not-a-url')).toBe('unknown');
    expect(extractDomain('')).toBe('unknown');
  });
});

describe('normalizeDomain', () => {
  it('should normalize domains', () => {
    expect(normalizeDomain('WWW.FLIPKART.COM')).toBe('flipkart.com');
    expect(normalizeDomain('Amazon.in/')).toBe('amazon.in');
  });
});

describe('getMarketplaceFromSource', () => {
  it('should identify major Indian marketplaces', () => {
    expect(getMarketplaceFromSource('Flipkart')).toBe('flipkart');
    expect(getMarketplaceFromSource('Amazon India')).toBe('amazon');
    expect(getMarketplaceFromSource('Reliance Digital')).toBe('reliance');
    expect(getMarketplaceFromSource('Croma')).toBe('croma');
    expect(getMarketplaceFromSource('Tata CLiQ')).toBe('tata');
    expect(getMarketplaceFromSource('Meesho')).toBe('meesho');
    expect(getMarketplaceFromSource('Nykaa')).toBe('nykaa');
    expect(getMarketplaceFromSource('Myntra')).toBe('myntra');
  });

  it('should return other for unknown sources', () => {
    expect(getMarketplaceFromSource('Random Seller')).toBe('other');
    expect(getMarketplaceFromSource('Unknown Shop')).toBe('other');
  });
});

describe('isLikelyAuthorizedSeller', () => {
  it('should match authorized sellers', () => {
    expect(isLikelyAuthorizedSeller('Flipkart Official Store', ['Flipkart', 'Amazon'])).toBe(true);
    expect(isLikelyAuthorizedSeller('Amazon India', ['Flipkart', 'Amazon'])).toBe(true);
    expect(isLikelyAuthorizedSeller('Reliance Digital Store', ['Reliance'])).toBe(true);
  });

  it('should not match unauthorized sellers', () => {
    expect(isLikelyAuthorizedSeller('Random Seller', ['Flipkart', 'Amazon'])).toBe(false);
    expect(isLikelyAuthorizedSeller('Unknown Shop', ['Flipkart'])).toBe(false);
  });

  it('should handle empty authorized list', () => {
    expect(isLikelyAuthorizedSeller('Any Seller', [])).toBe(false);
  });
});

describe('extractProductKey', () => {
  it('should extract core product identifiers', () => {
    expect(extractProductKey('Apple iPhone 15 128GB Black Original')).toBe('apple iphone 128gb black');
    expect(extractProductKey('Nike Air Max 270 Running Shoes Men')).toBe('nike air max 270 running shoes men');
    expect(extractProductKey('Boat Airdopes 141 TWS Earbuds')).toBe('boat airdopes 141 tws earbuds');
  });

  it('should remove marketing noise words', () => {
    expect(extractProductKey('Original Genuine Apple iPhone 15 Best Price')).toBe('apple iphone');
    expect(extractProductKey('Brand New Sealed Nike Air Max Free Shipping')).toBe('nike air max');
  });

  it('should handle edge cases', () => {
    expect(extractProductKey('')).toBe('');
    expect(extractProductKey('   ')).toBe('');
    expect(extractProductKey('A B C')).toBe('');
  });
});

describe('calculateTitleSimilarity', () => {
  it('should return high similarity for same product', () => {
    const sim = calculateTitleSimilarity(
      'Apple iPhone 15 128GB Black',
      'iPhone 15 128 GB Black Apple'
    );
    expect(sim).toBeGreaterThan(0.7);
  });

  it('should return low similarity for different products', () => {
    const sim = calculateTitleSimilarity(
      'Apple iPhone 15',
      'Samsung Galaxy S24'
    );
    expect(sim).toBeLessThan(0.3);
  });

  it('should return 0 for empty titles', () => {
    expect(calculateTitleSimilarity('', 'iPhone 15')).toBe(0);
    expect(calculateTitleSimilarity('iPhone 15', '')).toBe(0);
    expect(calculateTitleSimilarity('', '')).toBe(0);
  });
});

describe('deduplicateListings', () => {
  it('should deduplicate listings from same marketplace with similar titles', () => {
    const listings = [
      { title: 'iPhone 15 128GB Black', source: 'Flipkart', extractedPrice: 72999 },
      { title: 'Apple iPhone 15 128GB Black', source: 'Flipkart', extractedPrice: 73999 },
      { title: 'iPhone 15 128GB Blue', source: 'Amazon', extractedPrice: 71999 },
      { title: 'Samsung Galaxy S24', source: 'Flipkart', extractedPrice: 69999 },
    ];

    const result = deduplicateListings(listings);
    
    expect(result.length).toBe(3);
    const flipkartIPhone = result.find(r => r.source === 'Flipkart' && r.title.includes('iPhone'));
    expect(flipkartIPhone?.extractedPrice).toBe(72999);
  });

  it('should keep unique products from different marketplaces', () => {
    const listings = [
      { title: 'iPhone 15', source: 'Flipkart', extractedPrice: 72999 },
      { title: 'iPhone 15', source: 'Amazon', extractedPrice: 73999 },
    ];

    const result = deduplicateListings(listings);
    expect(result.length).toBe(2);
  });
});

describe('estimateScanCredits', () => {
  it('should estimate credits correctly', () => {
    const estimate = estimateScanCredits(20, 10, false);
    expect(estimate.shoppingCalls).toBe(1);
    expect(estimate.lensCalls).toBe(10);
    expect(estimate.totalEstimatedCredits).toBe(33);
  });

  it('should cap lens calls at maxLensCalls', () => {
    const estimate = estimateScanCredits(50, 10, false);
    expect(estimate.lensCalls).toBe(10);
    expect(estimate.totalEstimatedCredits).toBe(33);
  });

  it('should include amazon calls when requested', () => {
    const estimate = estimateScanCredits(10, 10, true);
    expect(estimate.amazonCalls).toBe(5);
    expect(estimate.totalEstimatedCredits).toBe(48);
  });
});

describe('sanitizeForLogging', () => {
  it('should redact API keys', () => {
    const obj = { api_key: 'secret123', other: 'value' };
    const sanitized = sanitizeForLogging(obj) as Record<string, unknown>;
    expect(sanitized.api_key).toBe('***');
    expect(sanitized.other).toBe('value');
  });

  it('should redact keys in nested objects', () => {
    const obj = { 
      params: { apiKey: 'secret', engine: 'google' },
      headers: { Authorization: 'Bearer token' }
    };
    const sanitized = sanitizeForLogging(obj) as Record<string, unknown>;
    expect((sanitized.params as Record<string, unknown>).apiKey).toBe('***');
    expect((sanitized.headers as Record<string, unknown>).Authorization).toBe('***');
  });

  it('should handle arrays', () => {
    const arr = [{ api_key: 'key1' }, { api_key: 'key2' }];
    const sanitized = sanitizeForLogging(arr) as Array<Record<string, unknown>>;
    expect(sanitized[0]?.api_key).toBe('***');
    expect(sanitized[1]?.api_key).toBe('***');
  });
});