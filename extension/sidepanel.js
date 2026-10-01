/**
 * Beacontra Lens — Side Panel Controller
 * 
 * Coordinates product extraction from active Amazon India tabs,
 * allows manual review and calibration, runs marketplace scans via
 * the Beacontra backend, and persists cases into the Evidence Desk.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const extractBtn = document.getElementById('extractBtn');
  const extractAlert = document.getElementById('extractAlert');
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
  const listingsList = document.getElementById('listingsList');
  const saveCaseBtn = document.getElementById('saveCaseBtn');
  const caseSavedNotice = document.getElementById('caseSavedNotice');
  const backendStatusPill = document.getElementById('backendStatusPill');

  let latestScanResult = null;

  // Restore saved backend URL from storage if present
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['beacontraBackendUrl'], (res) => {
      if (res && res.beacontraBackendUrl) {
        backendUrlInput.value = res.beacontraBackendUrl;
      }
    });
  }

  // Update image preview on URL change
  officialImageUrlInput.addEventListener('input', () => {
    const url = officialImageUrlInput.value.trim();
    if (url.startsWith('http')) {
      imagePreview.src = url;
    }
  });

  // Extract from active Amazon tab
  extractBtn.addEventListener('click', async () => {
    extractAlert.className = 'alert hidden';
    extractBtn.disabled = true;
    extractBtn.innerHTML = '<span class="spinner" style="width:14px;height:14px;border-width:2px;margin:0;display:inline-block;vertical-align:middle;"></span> Extracting...';

    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!activeTab || !activeTab.id) {
        throw new Error('No active browser tab detected.');
      }

      if (!activeTab.url || !activeTab.url.includes('amazon.in')) {
        showAlert(extractAlert, 'Please navigate to an Amazon India (amazon.in) product page to extract details automatically.', 'error');
        return;
      }

      chrome.tabs.sendMessage(activeTab.id, { action: 'EXTRACT_PRODUCT_CONTEXT' }, (response) => {
        extractBtn.disabled = false;
        extractBtn.innerHTML = '<span class="btn-icon">&#128269;</span> Extract Active Tab Product';

        if (chrome.runtime.lastError || !response || !response.success) {
          const errMsg = chrome.runtime.lastError?.message || response?.error || 'Could not extract product details. Ensure you are on a product detail page.';
          showAlert(extractAlert, errMsg, 'error');
          return;
        }

        const data = response.data;
        if (data.title) productNameInput.value = data.title;
        if (data.imageUrl) {
          officialImageUrlInput.value = data.imageUrl;
          imagePreview.src = data.imageUrl;
        }
        if (data.mrp) mrpInput.value = data.mrp;
        if (data.extractedPrice) {
          currentPriceRefInput.value = data.extractedPrice;
          // Set sensible expected street price window around extracted price
          priceMinInput.value = Math.round(data.extractedPrice * 0.85);
          priceMaxInput.value = Math.round(data.extractedPrice * 1.15);
        }
        if (data.seller && !authorizedSellersInput.value.includes(data.seller)) {
          authorizedSellersInput.value = `${authorizedSellersInput.value}, ${data.seller}`;
        }

        showAlert(extractAlert, `Extracted "${data.title.substring(0, 40)}..." successfully! Review parameters below.`, 'success');
      });
    } catch (err) {
      extractBtn.disabled = false;
      extractBtn.innerHTML = '<span class="btn-icon">&#128269;</span> Extract Active Tab Product';
      showAlert(extractAlert, err.message || 'Extraction failed', 'error');
    }
  });

  // Run Beacontra Scan
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

    if (!productName) {
      alert('Please enter a target product name.');
      productNameInput.focus();
      return;
    }
    if (!officialImageUrl) {
      alert('Please provide an official reference image URL.');
      officialImageUrlInput.focus();
      return;
    }

    // Persist backend URL
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ beacontraBackendUrl: backendUrl });
    }

    // Show loading
    scanBtn.disabled = true;
    resultsCard.classList.add('hidden');
    caseSavedNotice.classList.add('hidden');
    loadingState.classList.remove('hidden');
    backendStatusPill.className = 'status-pill status-busy';
    backendStatusPill.textContent = 'SCANNING';

    const payload = {
      productName,
      officialImageUrl,
      mrp,
      expectedPriceRange: priceMin && priceMax ? { min: priceMin, max: priceMax } : undefined,
      knownAuthorizedSellers,
    };

    try {
      loadingMessage.textContent = 'Querying marketplace index & reverse-image matching...';
      const response = await fetch(`${backendUrl}/api/beacontra/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.error || `Server returned HTTP ${response.status}`);
      }

      const resJson = await response.json();
      latestScanResult = resJson.data;

      // Render findings
      renderScanResults(latestScanResult);
      loadingState.classList.add('hidden');
      resultsCard.classList.remove('hidden');
      backendStatusPill.className = 'status-pill status-ready';
      backendStatusPill.textContent = 'READY';
    } catch (err) {
      loadingState.classList.add('hidden');
      backendStatusPill.className = 'status-pill status-ready';
      backendStatusPill.textContent = 'READY';
      alert(`Investigation failed: ${err.message}`);
    } finally {
      scanBtn.disabled = false;
    }
  });

  // Save Case to Evidence Desk
  saveCaseBtn.addEventListener('click', async () => {
    if (!latestScanResult) return;

    const backendUrl = backendUrlInput.value.trim().replace(/\/+$/, '');
    saveCaseBtn.disabled = true;
    saveCaseBtn.innerHTML = '<span class="spinner" style="width:14px;height:14px;border-width:2px;margin:0;display:inline-block;vertical-align:middle;"></span> Saving...';

    const productName = productNameInput.value.trim();
    const officialImageUrl = officialImageUrlInput.value.trim();
    const mrp = mrpInput.value ? Number(mrpInput.value) : undefined;
    const priceMin = priceMinInput.value ? Number(priceMinInput.value) : undefined;
    const priceMax = priceMaxInput.value ? Number(priceMaxInput.value) : undefined;
    const rawSellers = authorizedSellersInput.value.trim();
    const knownAuthorizedSellers = rawSellers
      ? rawSellers.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    const casePayload = {
      productName,
      officialImageUrl,
      mrp,
      expectedPriceRange: priceMin && priceMax ? { min: priceMin, max: priceMax } : undefined,
      knownAuthorizedSellers,
      scanId: latestScanResult.scanId,
      initialNote: 'Case created via Beacontra Lens Chrome Extension.',
      tags: ['chrome-extension', 'marketplace-investigation'],
    };

    try {
      const response = await fetch(`${backendUrl}/api/cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(casePayload),
      });

      if (!response.ok) {
        throw new Error(`Failed to save case (HTTP ${response.status})`);
      }

      const resJson = await response.json();
      const savedCase = resJson.data;

      const reportUrl = `${backendUrl}/api/cases/${savedCase.id}/report`;
      caseSavedNotice.innerHTML = `
        <strong>&#10004; Case Saved:</strong> ${savedCase.id}<br/>
        <a href="${reportUrl}" target="_blank" style="color: #38bdf8; text-decoration: underline; font-weight: 600; display: inline-block; margin-top: 4px;">
          Open Complete HTML Evidence Report &rarr;
        </a>
      `;
      caseSavedNotice.className = 'alert alert-success';
      caseSavedNotice.classList.remove('hidden');
    } catch (err) {
      alert(`Could not save case: ${err.message}`);
    } finally {
      saveCaseBtn.disabled = false;
      saveCaseBtn.innerHTML = '<span class="btn-icon">&#128196;</span> Save to Evidence Desk Case';
    }
  });

  function renderScanResults(scan) {
    dataSourceBadge.textContent = scan.dataSource.toUpperCase();
    totalListingsNum.textContent = scan.totalListingsFound;
    creditsUsedNum.textContent = scan.creditsUsed;

    const results = scan.results || [];
    const maxScore = results.length > 0 ? Math.max(...results.map((r) => r.compositeScore)) : 0;
    topRiskScoreNum.textContent = `${maxScore}/100`;

    // Recommendation Bar
    if (maxScore >= 70) {
      recommendationAlert.className = 'recommendation-bar rec-urgently';
      recommendationAlert.textContent = 'High Commercial Discrepancy — Review Urgently';
    } else if (maxScore >= 50) {
      recommendationAlert.className = 'recommendation-bar rec-review';
      recommendationAlert.textContent = 'Moderate Variance — Analyst Review Advised';
    } else {
      recommendationAlert.className = 'recommendation-bar rec-genuine';
      recommendationAlert.textContent = 'Consistent Commercial Signals — Low Anomaly';
    }

    // Listings Container
    listingsList.innerHTML = '';
    if (results.length === 0) {
      listingsList.innerHTML = '<div style="color: #9ca3af; text-align: center; padding: 12px;">No listings matched query.</div>';
      return;
    }

    results.slice(0, 10).forEach((item) => {
      const listingDiv = document.createElement('div');
      listingDiv.className = 'listing-item';

      const priceChipClass = item.priceSignal.isAnomalous ? 'chip-danger' : 'chip-success';
      const sellerChipClass = item.sellerSignal.isAnomalous ? 'chip-danger' : 'chip-neutral';
      const visualChipClass = item.visualSignal.isAnomalous
        ? 'chip-danger'
        : item.visualSignal.status === 'matched'
          ? 'chip-info'
          : 'chip-neutral';

      listingDiv.innerHTML = `
        <div class="listing-header">
          <div class="listing-title">${escapeText(item.listing.title)}</div>
          <div class="listing-score">${item.compositeScore}</div>
        </div>
        <div style="font-size: 11px; color: #9ca3af; margin-top: 3px;">
          ${escapeText(item.listing.source)} &bull; <strong>${escapeText(item.listing.price)}</strong>
        </div>
        <div class="listing-chips">
          <span class="chip ${priceChipClass}">Price: ${escapeText(item.priceSignal.anomalyType)}</span>
          <span class="chip ${sellerChipClass}">Seller: ${escapeText(item.sellerSignal.anomalyType)}</span>
          <span class="chip ${visualChipClass}">Visual: ${escapeText(item.visualSignal.status || item.visualSignal.anomalyType)}</span>
        </div>
      `;
      listingsList.appendChild(listingDiv);
    });
  }

  function showAlert(el, msg, type) {
    el.textContent = msg;
    el.className = `alert alert-${type}`;
    el.classList.remove('hidden');
  }

  function escapeText(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
});
