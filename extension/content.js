/**
 * Beacontra Lens 2.0 — Extensible Content Script & Marketplace Adapters
 * 
 * Provides adapter-based extraction for:
 * - Amazon.in
 * - Flipkart.com
 * Operates strictly upon user request with zero embedded credentials.
 */

function cleanText(text) {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

function parsePriceNumber(priceStr) {
  if (!priceStr) return undefined;
  const cleaned = priceStr.replace(/[₹,\s]/g, '');
  const match = cleaned.match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[1]) : undefined;
}

// ==========================================
// 1. AMAZON.IN ADAPTER
// ==========================================
class AmazonAdapter {
  matches(url) {
    return /amazon\.in/i.test(url);
  }

  extract() {
    const url = window.location.href;

    // ASIN
    let asin = '';
    const asinInput = document.querySelector('input#ASIN, input[name="ASIN"]');
    if (asinInput && asinInput.value) {
      asin = asinInput.value.trim();
    } else {
      const match = url.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
      if (match) asin = match[1].toUpperCase();
    }

    // Title
    let title = '';
    const titleEl = document.querySelector('#productTitle, #title, h1.a-size-large');
    if (titleEl) title = cleanText(titleEl.textContent);

    // Current Offer Price
    let priceStr = '';
    const priceSelectors = [
      '#corePrice_desktop .a-price .a-offscreen',
      '.priceToPay .a-offscreen',
      '#corePriceDisplay_desktop_feature_div .a-price .a-offscreen',
      '#apex_desktop .a-price .a-offscreen',
      '#priceblock_ourprice',
      '#priceblock_dealprice',
      'span.a-price span.a-offscreen',
    ];
    for (const sel of priceSelectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent) {
        const candidate = cleanText(el.textContent);
        if (candidate.includes('₹') || candidate.match(/\d/)) {
          priceStr = candidate;
          break;
        }
      }
    }
    const extractedPrice = parsePriceNumber(priceStr);

    // MRP
    let mrpStr = '';
    const mrpSelectors = [
      '.basisPrice .a-offscreen',
      '#corePrice_desktop .a-text-price .a-offscreen',
      '#corePriceDisplay_desktop_feature_div .a-text-price .a-offscreen',
      '#listPrice',
      'span.a-text-strike',
    ];
    for (const sel of mrpSelectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent) {
        const candidate = cleanText(el.textContent);
        if (candidate.includes('₹') || candidate.match(/\d/)) {
          mrpStr = candidate;
          break;
        }
      }
    }
    const extractedMrp = parsePriceNumber(mrpStr);

    // Seller
    let seller = '';
    const sellerEl = document.querySelector('#sellerProfileTriggerId, #merchant-info, #tabular-buybox-truncate-0 .a-truncate-cut');
    if (sellerEl) {
      seller = cleanText(sellerEl.textContent)
        .replace(/^sold by\s+/i, '')
        .replace(/\s+and\s+fulfilled by.*$/i, '')
        .trim();
    }
    if (!seller) {
      const buyboxMerchant = document.querySelector('#buybox-tabular table tr:last-child td:last-child');
      if (buyboxMerchant) seller = cleanText(buyboxMerchant.textContent);
    }

    // Image
    let imageUrl = '';
    const imgEl = document.querySelector('#landingImage, #imgBlkFront, #main-image-container img');
    if (imgEl) {
      imageUrl = imgEl.getAttribute('data-old-hires') || '';
      if (!imageUrl) {
        const dynamicImages = imgEl.getAttribute('data-a-dynamic-image');
        if (dynamicImages) {
          try {
            const parsed = JSON.parse(dynamicImages);
            const urls = Object.keys(parsed);
            if (urls.length > 0) imageUrl = urls[0];
          } catch {
            // ignore JSON error
          }
        }
      }
      if (!imageUrl) imageUrl = imgEl.getAttribute('src') || '';
    }

    return {
      marketplace: 'amazon',
      platform: 'Amazon.in',
      url,
      externalId: asin,
      title,
      price: priceStr,
      extractedPrice,
      mrp: mrpStr,
      extractedMrp,
      seller,
      imageUrl,
    };
  }
}

// ==========================================
// 2. FLIPKART.COM ADAPTER
// ==========================================
class FlipkartAdapter {
  matches(url) {
    return /flipkart\.com/i.test(url);
  }

  extract() {
    const url = window.location.href;

    // Product ID / FSN
    let fsn = '';
    const pidMatch = url.match(/[?&]pid=([A-Z0-9]{16})/i) || url.match(/\/p\/(itm[a-z0-9]+)/i);
    if (pidMatch) fsn = pidMatch[1];

    // Title
    let title = '';
    const titleEl = document.querySelector('h1 span.B_NuCI, h1._6EBuvT, span.VU-ZEz, h1');
    if (titleEl) title = cleanText(titleEl.textContent);

    // Current Offer Price
    let priceStr = '';
    const priceEl = document.querySelector('div._30jeq3._16J063, div.Nx9bqj.CxhGGd, div._30jeq3');
    if (priceEl && priceEl.textContent) {
      priceStr = cleanText(priceEl.textContent);
    }
    const extractedPrice = parsePriceNumber(priceStr);

    // MRP
    let mrpStr = '';
    const mrpEl = document.querySelector('div._3I9_wc._2p6lqe, div.yRaY8j.A68aKn, div._3I9_wc');
    if (mrpEl && mrpEl.textContent) {
      mrpStr = cleanText(mrpEl.textContent);
    }
    const extractedMrp = parsePriceNumber(mrpStr);

    // Seller
    let seller = '';
    const sellerEl = document.querySelector('div#sellerName span span, div._1RLviY span, div._1RLviY');
    if (sellerEl) {
      seller = cleanText(sellerEl.textContent).replace(/\d+(\.\d+)?\s*★.*$/g, '').trim();
    }

    // Image
    let imageUrl = '';
    const imgEl = document.querySelector('img._396cs4._16AnPd, img.DByuf4.IZexXJ, div._2r_T1I img');
    if (imgEl) {
      imageUrl = imgEl.getAttribute('src') || '';
    }

    return {
      marketplace: 'flipkart',
      platform: 'Flipkart',
      url,
      externalId: fsn,
      title,
      price: priceStr,
      extractedPrice,
      mrp: mrpStr,
      extractedMrp,
      seller,
      imageUrl,
    };
  }
}

// Adapter Registry
const adapters = [new AmazonAdapter(), new FlipkartAdapter()];

function getMarketplaceAdapter(url) {
  return adapters.find((a) => a.matches(url)) || null;
}

// Message Listener
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'extractProduct' || request.action === 'EXTRACT_PRODUCT_CONTEXT') {
    const adapter = getMarketplaceAdapter(window.location.href);
    if (!adapter) {
      sendResponse({
        success: false,
        error: 'Unsupported marketplace page. Supported: Amazon.in, Flipkart.com',
      });
      return true;
    }

    try {
      const data = adapter.extract();
      sendResponse({ success: true, data });
    } catch (err) {
      sendResponse({
        success: false,
        error: err instanceof Error ? err.message : 'Extraction error',
      });
    }
  }
  return true;
});
