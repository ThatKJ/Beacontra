/**
 * Beacontra Lens 2.0 — Side Panel Controller
 * 
 * Features:
 * - Extensible product extraction (Amazon.in & Flipkart.com)
 * - Brand DNA profile loading and linking
 * - Image context menu investigation intake
 * - Quick Scan vs Deep Investigation mode selection
 * - Missing evidence coverage evaluation
 * - Case annotations & direct links to Evidence Graph / Evidence Desk
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const extractBtn = document.getElementById('extractBtn');
  const extractAlert = document.getElementById('extractAlert');
  const contextImageBanner = document.getElementById('contextImageBanner');
  const brandDnaSelect = document.getElementById('brandDnaSelect');
  const productNameInput = document.getElementById('productName');
  const officialImageUrlInput = document.getElementById('officialImageUrl');
  const imagePreview = document.getElementById('imagePreview');
  const mrpInput = document.getElementById('mrp');
  const currentPriceRefInput = document.getElementById('currentPriceRef');
  const priceMinInput = document.getElementById('priceMin');
  const priceMaxInput = document.getElementById('priceMax');
  const authorizedSellersInput = document.getElementById('authorizedSellers');
  const backendUrlInput = document.getElementById('backendUrl');
  const scanBtn = document.getElementById('scanBtn');
  const loadingState = document.getElementById('loadingState');
  const loadingMessage = document.getElementById('loadingMessage');
  const resultsCard = document.getElementById('resultsCard');
  const dataSourceBadge = document.getElementById('dataSourceBadge');
  const totalListingsNum = document.getElementById('totalListingsNum');
  const topRiskScoreNum = document.getElementById('topRiskScoreNum');
  const creditsUsedNum = document.getElementById('creditsUsedNum');
  const recommendationAlert = document.getElementById('recommendationAlert');
  const missingEvidenceNotice = document.getElementById('missingEvidenceNotice');
  const missingEvidenceText = document.getElementById('missingEvidenceText');
  const listingsList = document.getElementById('listingsList');
  const caseNoteInput = document.getElementById('caseNoteInput');
  const saveCaseBtn = document.getElementById('saveCaseBtn');
  const caseSavedNotice = document.getElementById('caseSavedNotice');
  const navLinksContainer = document.getElementById('navLinksContainer');
  const openDeskBtn = document.getElementById('openDeskBtn');
  const openGraphBtn = document.getElementById('openGraphBtn');
  const backendStatusPill = document.getElementById('backendStatusPill');

  let latestScanResult = null;
  let savedCaseId = null;
  let loadedProducts = [];

  // Helper: Show Alert
  function showAlert(el, msg, type = 'info') {
    el.className = `alert alert-${type}`;
    el.textContent = msg;
    el.classList.remove('hidden');
  }

  // 1. Restore Backend URL
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['beacontraBackendUrl', 'pendingImageInvestigation'], (res) => {
      if (res?.beacontraBackendUrl) {
        backendUrlInput.value = res.beacontraBackendUrl;
      }
      if (res?.pendingImageInvestigation) {
        const pending = res.pendingImageInvestigation;
        if (pending.imageUrl) {
          officialImageUrlInput.value = pending.imageUrl;
          imagePreview.src = pending.imageUrl;
          contextImageBanner.classList.remove('hidden');
          // Clear after consuming
          chrome.storage.local.remove(['pendingImageInvestigation']);
        }
      }
      loadBrandProfiles();
    });
  } else {
    loadBrandProfiles();
  }

  // 2. Fetch Brand DNA Profiles
  async function loadBrandProfiles() {
    const backendUrl = backendUrlInput.value.trim().replace(/\/+$/, '');
    try {
      const resp = await fetch(`${backendUrl}/api/brand-dna/products`);
      if (resp.ok) {
        const json = await resp.json();
        loadedProducts = json.data || [];
        brandDnaSelect.innerHTML = '<option value="">-- Manual Calibration / No Profile --</option>';
        for (const p of loadedProducts) {
          const opt = document.createElement('option');
          opt.value = p.id;
          opt.textContent = `${p.brandName || p.brandId} — ${p.productName}`;
          brandDnaSelect.appendChild(opt);
        }
        backendStatusPill.className = 'status-pill status-ready';
        backendStatusPill.textContent = 'ONLINE';
      }
    } catch {
      backendStatusPill.className = 'status-pill status-offline';
      backendStatusPill.textContent = 'LOCAL DEV';
    }
  }

  // Auto-fill from Brand DNA Selection
  brandDnaSelect.addEventListener('change', () => {
    const selectedId = brandDnaSelect.value;
    if (!selectedId) return;
    const prod = loadedProducts.find(p => p.id === selectedId);
    if (!prod) return;

    productNameInput.value = prod.productName;
    if (prod.canonicalImageUrl) {
      officialImageUrlInput.value = prod.canonicalImageUrl;
      imagePreview.src = prod.canonicalImageUrl;
    }
    if (prod.statutoryMrp) mrpInput.value = prod.statutoryMrp;
    if (prod.expectedPriceRange) {
      priceMinInput.value = prod.expectedPriceRange.min;
      priceMaxInput.value = prod.expectedPriceRange.max;
    }
    if (prod.authorizedSellers && prod.authorizedSellers.length > 0) {
      authorizedSellersInput.value = prod.authorizedSellers.join(', ');
    }
    showAlert(extractAlert, `Loaded Brand DNA profile for "${prod.productName}"`, 'success');
  });

  // Image Preview
  officialImageUrlInput.addEventListener('input', () => {
    const url = officialImageUrlInput.value.trim();
    if (url.startsWith('http')) imagePreview.src = url;
  });

  // 3. Extract Active Tab Product
  extractBtn.addEventListener('click', async () => {
    extractAlert.className = 'alert hidden';
    extractBtn.disabled = true;
    extractBtn.innerHTML = '<span class="spinner" style="width:14px;height:14px;border-width:2px;margin:0;display:inline-block;vertical-align:middle;"></span> Extracting...';

    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!activeTab || !activeTab.id) throw new Error('No active browser tab detected.');

      chrome.tabs.sendMessage(activeTab.id, { action: 'extractProduct' }, (response) => {
        extractBtn.disabled = false;
        extractBtn.innerHTML = '<span class="btn-icon">&#128269;</span> Extract Active Tab Product';

        if (chrome.runtime.lastError || !response || !response.success) {
          const errMsg = chrome.runtime.lastError?.message || response?.error || 'Could not extract product details. Ensure you are on Amazon.in or Flipkart.com.';
          showAlert(extractAlert, errMsg, 'error');
          return;
        }

        const data = response.data;
        if (data.title) productNameInput.value = data.title;
        if (data.imageUrl) {
          officialImageUrlInput.value = data.imageUrl;
          imagePreview.src = data.imageUrl;
        }
        if (data.mrp || data.extractedMrp) mrpInput.value = data.extractedMrp || data.mrp;
        if (data.extractedPrice) {
          currentPriceRefInput.value = data.extractedPrice;
          priceMinInput.value = Math.round(data.extractedPrice * 0.85);
          priceMaxInput.value = Math.round(data.extractedPrice * 1.15);
        }
        if (data.seller && !authorizedSellersInput.value.includes(data.seller)) {
          authorizedSellersInput.value = `${authorizedSellersInput.value}, ${data.seller}`;
        }

        showAlert(extractAlert, `Extracted "${(data.title || '').slice(0, 35)}..." from ${data.platform || 'marketplace'}!`, 'success');
      });
    } catch (err) {
      extractBtn.disabled = false;
      extractBtn.innerHTML = '<span class="btn-icon">&#128269;</span> Extract Active Tab Product';
      showAlert(extractAlert, err.message || 'Extraction failed', 'error');
    }
  });

  // 4. Run Investigation Scan
  scanBtn.addEventListener('click', async () => {
    const productName = productNameInput.value.trim();
    const officialImageUrl = officialImageUrlInput.value.trim();
    const mrp = mrpInput.value ? Number(mrpInput.value) : undefined;
    const priceMin = priceMinInput.value ? Number(priceMinInput.value) : undefined;
    const priceMax = priceMaxInput.value ? Number(priceMaxInput.value) : undefined;
    const rawSellers = authorizedSellersInput.value.trim();
    const knownAuthorizedSellers = rawSellers
      ? rawSellers.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    const backendUrl = backendUrlInput.value.trim().replace(/\/+$/, '');
    const modeEl = document.querySelector('input[name="investigationMode"]:checked');
    const mode = modeEl ? modeEl.value : 'quick';

    if (!productName) {
      showAlert(extractAlert, 'Product Name is required to run a scan.', 'error');
      return;
    }
    if (!officialImageUrl) {
      showAlert(extractAlert, 'Reference Image URL is required for visual matching.', 'error');
      return;
    }

    // Persist Backend URL
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ beacontraBackendUrl: backendUrl });
    }

    loadingState.classList.remove('hidden');
    resultsCard.classList.add('hidden');
    scanBtn.disabled = true;
    loadingMessage.textContent = mode === 'deep' ? 'Running Deep Investigation...' : 'Running Quick Scan...';

    try {
      const resp = await fetch(`${backendUrl}/api/beacontra/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName,
          officialImageUrl,
          mrp,
          expectedPriceRange: priceMin && priceMax ? { min: priceMin, max: priceMax } : undefined,
          knownAuthorizedSellers,
        }),
      });

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        throw new Error(errJson.error || `Scan request failed with HTTP ${resp.status}`);
      }

      const scanResult = await resp.json();
      latestScanResult = scanResult;

      // Render Results
      renderResults(scanResult);
    } catch (err) {
      showAlert(extractAlert, `Investigation error: ${err.message}`, 'error');
    } finally {
      loadingState.classList.add('hidden');
      scanBtn.disabled = false;
    }
  });

  // 5. Render Results & Missing Evidence Analysis
  function renderResults(res) {
    resultsCard.classList.remove('hidden');
    navLinksContainer.classList.add('hidden');
    caseSavedNotice.classList.add('hidden');

    // Data Source Badge
    dataSourceBadge.textContent = (res.dataSource || 'LIVE').toUpperCase();
    dataSourceBadge.className = `source-badge source-${res.dataSource || 'live'}`;

    totalListingsNum.textContent = res.totalListingsFound || 0;
    creditsUsedNum.textContent = res.creditsUsed ?? 1;

    const maxScore = res.results && res.results.length > 0
      ? Math.max(...res.results.map((r) => r.compositeScore))
      : 0;
    topRiskScoreNum.textContent = maxScore;

    // Recommendation Bar
    const urgentCount = (res.results || []).filter(r => r.recommendation === 'review_urgently').length;
    if (urgentCount > 0) {
      recommendationAlert.className = 'recommendation-bar bar-urgent';
      recommendationAlert.textContent = `${urgentCount} listing(s) flagged for urgent commercial review.`;
    } else {
      recommendationAlert.className = 'recommendation-bar bar-normal';
      recommendationAlert.textContent = 'Marketplace offers align with expected commercial parameters.';
    }

    // Missing Evidence Assessment
    const missingItems = [];
    if (!res.results || res.results.length === 0) {
      missingItems.push('No concurrent marketplace listings returned in search window.');
    }
    const hasVisualMatches = (res.results || []).some(r => r.visualSignal?.matchFound);
    if (!hasVisualMatches) {
      missingItems.push('Absence of indexed visual co-occurrences in Google Lens (unindexed or unique photograph).');
    }
    const hasSellerAuth = (res.results || []).some(r => r.sellerSignal?.isAuthorized);
    if (!hasSellerAuth) {
      missingItems.push('No recognized authorized distributors found among seller results.');
    }

    if (missingItems.length > 0) {
      missingEvidenceText.innerHTML = `<ul>${missingItems.map(m => `<li>${m}</li>`).join('')}</ul>`;
      missingEvidenceNotice.classList.remove('hidden');
    } else {
      missingEvidenceText.textContent = 'Full cross-verification evidence coverage achieved.';
      missingEvidenceNotice.classList.remove('hidden');
    }

    // Render Listings
    listingsList.innerHTML = '';
    for (const item of (res.results || []).slice(0, 10)) {
      const el = document.createElement('div');
      el.className = 'listing-item';
      el.innerHTML = `
        <div class="listing-top">
          <span class="listing-source">${item.listing.source || 'Marketplace'}</span>
          <span class="listing-price">${item.listing.price || `₹${item.listing.extractedPrice}`}</span>
        </div>
        <div class="listing-title">${item.listing.title}</div>
        <div class="listing-seller">Seller: <strong>${item.listing.seller}</strong></div>
        <div class="listing-score">Review Priority Score: ${item.compositeScore}/100</div>
      `;
      listingsList.appendChild(el);
    }
  }

  // 6. Save Case with Annotations
  saveCaseBtn.addEventListener('click', async () => {
    if (!latestScanResult) return;
    saveCaseBtn.disabled = true;
    saveCaseBtn.textContent = 'Saving Case...';

    const backendUrl = backendUrlInput.value.trim().replace(/\/+$/, '');
    const note = caseNoteInput.value.trim();

    try {
      const resp = await fetch(`${backendUrl}/api/cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanId: latestScanResult.scanId,
          productName: productNameInput.value.trim(),
          officialImageUrl: officialImageUrlInput.value.trim(),
          mrp: mrpInput.value ? Number(mrpInput.value) : undefined,
          initialNote: note || 'Opened via Beacontra Lens 2.0 Chrome Extension',
        }),
      });

      if (!resp.ok) throw new Error('Failed to create investigation case');
      const json = await resp.json();
      savedCaseId = json.data?.id;

      showAlert(caseSavedNotice, `Investigation Case ${savedCaseId} successfully saved to Evidence Desk!`, 'success');
      navLinksContainer.classList.remove('hidden');
    } catch (err) {
      showAlert(caseSavedNotice, `Could not save case: ${err.message}`, 'error');
    } finally {
      saveCaseBtn.disabled = false;
      saveCaseBtn.innerHTML = '<span class="btn-icon">&#128196;</span> Save to Evidence Desk Case';
    }
  });

  // 7. Navigation Links
  openDeskBtn.addEventListener('click', () => {
    const backendUrl = backendUrlInput.value.trim().replace(/\/+$/, '');
    const url = savedCaseId ? `${backendUrl}/#cases` : `${backendUrl}/#desk`;
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, '_blank');
    }
  });

  openGraphBtn.addEventListener('click', () => {
    const backendUrl = backendUrlInput.value.trim().replace(/\/+$/, '');
    const url = `${backendUrl}/api/evidence-graph`;
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, '_blank');
    }
  });
});
