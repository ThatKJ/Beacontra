/**
 * Beacontra Lens — Content Script (Amazon India Extractor)
 * 
 * Extracts product metadata from Amazon.in pages upon explicit user request.
 * Operates purely on DOM inspection with no external credentials.
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

function extractAmazonProduct() {
  const url = window.location.href;

  // 1. ASIN Extraction
  let asin = '';
  const asinInput = document.querySelector('input#ASIN, input[name="ASIN"]');
  if (asinInput && asinInput.value) {
    asin = asinInput.value.trim();
  } else {
    const urlMatch = url.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
    if (urlMatch) {
      asin = urlMatch[1].toUpperCase();
    }
  }

  // 2. Title Extraction
  let title = '';
  const titleEl = document.querySelector('#productTitle, #title, h1.a-size-large');
  if (titleEl) {
    title = cleanText(titleEl.textContent);
  }

  // 3. Price Extraction (Current Offer Price)
  let priceStr = '';
  const priceSelectors = [
    '#corePrice_desktop .a-price .a-offscreen',
    '.priceToPay .a-offscreen',
    '#corePriceDisplay_desktop_feature_div .a-price .a-offscreen',
    '#apex_desktop .a-price .a-offscreen',
    '#priceblock_ourprice',
    '#priceblock_dealprice',
    'span.a-price span.a-offscreen'
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

  // 4. MRP / List Price Extraction
  let mrpStr = '';
  const mrpSelectors = [
    '.basisPrice .a-offscreen',
    '#corePrice_desktop .a-text-price .a-offscreen',
    '#corePriceDisplay_desktop_feature_div .a-text-price .a-offscreen',
    '#listPrice',
    'span.a-text-strike'
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

  // 5. Seller Extraction
  let seller = '';
  const sellerEl = document.querySelector('#sellerProfileTriggerId, #merchant-info, #tabular-buybox-truncate-0 .a-truncate-cut');
  if (sellerEl) {
    seller = cleanText(sellerEl.textContent);
    // Remove "Sold by " prefix if present
    seller = seller.replace(/^sold by\s+/i, '').replace(/\s+and\s+fulfilled by.*$/i, '').trim();
  }
  if (!seller) {
    // Check buybox merchant info
    const buyboxMerchant = document.querySelector('#buybox-tabular table tr:last-child td:last-child');
    if (buyboxMerchant) {
      seller = cleanText(buyboxMerchant.textContent);
    }
  }

  // 6. Image Extraction
  let imageUrl = '';
  const imgEl = document.querySelector('#landingImage, #imgBlkFront, #main-image-container img');
  if (imgEl) {
    // Try high-res first
    imageUrl = imgEl.getAttribute('data-old-hires') || '';
    if (!imageUrl) {
      const dynamicImages = imgEl.getAttribute('data-a-dynamic-image');
      if (dynamicImages) {
        try {
          const parsed = JSON.parse(dynamicImages);
          const urls = Object.keys(parsed);
          if (urls.length > 0) {
            imageUrl = urls[0];
          }
        } catch {
          // ignore json parse error
        }
      }
    }
    if (!imageUrl) {
      imageUrl = imgEl.src || '';
    }
  }

  return {
    asin,
    title,
    price: priceStr || (extractedPrice ? `₹${extractedPrice}` : ''),
    extractedPrice,
    mrp: extractedMrp,
    mrpFormatted: mrpStr || (extractedMrp ? `₹${extractedMrp}` : ''),
    seller: seller || 'Amazon Seller',
    imageUrl,
    pageUrl: url,
    extractedAt: new Date().toISOString(),
  };
}

// Listen for extraction requests from the Beacontra Lens side panel
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'EXTRACT_PRODUCT_CONTEXT') {
    try {
      const productData = extractAmazonProduct();
      sendResponse({ success: true, data: productData });
    } catch (err) {
      sendResponse({ success: false, error: err.message || 'Extraction failed' });
    }
  }
  return true; // Keep message channel open for async response
});
