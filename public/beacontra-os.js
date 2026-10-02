/**
 * Beacontra OS — Master Client Controller
 * Manages Brand Vault, Market Radar, Evidence Graph, Watchtower,
 * and Investigation Intelligence explanation modals.
 */

(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);

  const OSState = {
    activeTab: 'overview',
    brands: [],
    products: [],
    activeProduct: null,
    radarReport: null,
    graphData: null,
    snapshots: [],
    cases: [],
    selectedFinding: null,
  };

  // Helper formatting
  const money = (val) => (typeof val === 'number' ? `₹${val.toLocaleString('en-IN')}` : 'N/A');

  // Module Navigation
  function initModuleNavigation() {
    const navButtons = document.querySelectorAll('.os-module-btn');
    navButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-target');
        switchModule(target);
      });
    });

    // Handle hash on initial load
    const hash = window.location.hash.replace('#', '');
    if (['brand-vault', 'market-radar', 'evidence-graph', 'watchtower', 'cases-desk'].includes(hash)) {
      switchModule(hash);
    }
  }

  function switchModule(targetId) {
    OSState.activeTab = targetId;
    window.location.hash = targetId === 'overview' ? '' : targetId;

    // Update buttons
    document.querySelectorAll('.os-module-btn').forEach((b) => {
      if (b.getAttribute('data-target') === targetId) {
        b.classList.add('is-active');
      } else {
        b.classList.remove('is-active');
      }
    });

    // Update sections
    const overviewEl = $('home');
    const sections = document.querySelectorAll('.os-section');

    if (targetId === 'overview') {
      if (overviewEl) overviewEl.style.display = 'block';
      sections.forEach((s) => s.classList.remove('is-active'));
    } else {
      if (overviewEl) overviewEl.style.display = 'none';
      sections.forEach((s) => {
        if (s.id === targetId) {
          s.classList.add('is-active');
        } else {
          s.classList.remove('is-active');
        }
      });
    }

    // Trigger tab-specific loaders
    if (targetId === 'brand-vault') loadBrandVault();
    if (targetId === 'market-radar') loadMarketRadarView();
    if (targetId === 'evidence-graph') loadEvidenceGraphView();
    if (targetId === 'watchtower') loadWatchtowerView();
    if (targetId === 'cases-desk') loadCasesDeskView();
  }

  // ==========================================
  // 1. BRAND VAULT
  // ==========================================
  async function loadBrandVault() {
    const listEl = $('vaultProductList');
    if (!listEl) return;
    listEl.innerHTML = '<div class="os-card"><p class="mono">Loading registered Brand Vault profiles...</p></div>';

    try {
      const resp = await fetch('/api/brand-dna/products');
      if (!resp.ok) throw new Error('Failed to load products');
      const json = await resp.json();
      OSState.products = json.data || [];

      if (OSState.products.length === 0) {
        listEl.innerHTML = `
          <div class="os-card" style="text-align: center; padding: 48px;">
            <h3>No Products Registered in Vault</h3>
            <p class="muted">Register your first official brand product profile using the form on the right.</p>
          </div>
        `;
        return;
      }

      listEl.innerHTML = OSState.products
        .map(
          (p) => `
        <div class="os-card" style="display: flex; gap: 20px; align-items: center;">
          <div style="width: 72px; height: 72px; flex: 0 0 72px; background: #fff; border-radius: 4px; overflow: hidden; display: grid; place-items: center;">
            <img src="${p.canonicalImageUrl}" alt="${p.productName}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px;">
              <span class="os-tag os-tag-teal">${p.brandName || p.brandId}</span>
              ${p.modelNumber ? `<span class="os-tag">${p.modelNumber}</span>` : ''}
              <span class="os-tag">${p.variants?.length || 0} Variants</span>
            </div>
            <h3 style="margin: 0; font-size: 1.1rem;">${p.productName}</h3>
            <p class="mono" style="margin: 4px 0 0; font-size: 0.75rem; color: var(--os-text-muted);">
              Statutory MRP: ${money(p.statutoryMrp)} | Authorized Sellers: ${(p.authorizedSellers || []).join(', ') || 'None listed'}
            </p>
          </div>
          <div>
            <button class="cta cta-solid select-radar-btn" data-id="${p.id}" style="min-height: 38px; padding: 6px 14px; font-size: 0.65rem;">
              Scan in Radar →
            </button>
          </div>
        </div>
      `
        )
        .join('');

      document.querySelectorAll('.select-radar-btn').forEach((b) => {
        b.addEventListener('click', () => {
          const id = b.getAttribute('data-id');
          OSState.activeProduct = OSState.products.find((p) => p.id === id);
          switchModule('market-radar');
        });
      });
    } catch (err) {
      listEl.innerHTML = `<div class="os-card"><p class="hint error">Error: ${err.message}</p></div>`;
    }
  }

  // Handle Create Product in Vault
  function initVaultForm() {
    const form = $('createProductForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const statusEl = $('vaultFormStatus');
      const submitBtn = form.querySelector('button[type="submit"]');

      const brandName = $('vaultBrandName').value.trim();
      const productName = $('vaultProductName').value.trim();
      const canonicalImageUrl = $('vaultImageUrl').value.trim();
      const statutoryMrp = Number($('vaultMrp').value) || undefined;
      const authorizedSellers = $('vaultAuthorizedSellers')
        .value.split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      submitBtn.disabled = true;
      statusEl.textContent = 'Registering profile in durable vault...';

      try {
        // 1. Ensure Brand exists
        const brandResp = await fetch('/api/brand-dna/brands', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: brandName,
            officialDomains: ['example.com'],
          }),
        });
        const brandJson = await brandResp.json();
        const brandId = brandJson.data?.id || 'brand_default';

        // 2. Register Product
        const prodResp = await fetch('/api/brand-dna/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brandId,
            productName,
            canonicalImageUrl,
            statutoryMrp,
            authorizedSellers,
          }),
        });

        if (!prodResp.ok) {
          const err = await prodResp.json();
          throw new Error(err.error || 'Failed to create product profile');
        }

        form.reset();
        statusEl.className = 'hint';
        statusEl.style.color = 'var(--os-teal-light)';
        statusEl.textContent = 'Product profile registered successfully!';
        loadBrandVault();
      } catch (err) {
        statusEl.className = 'hint error';
        statusEl.textContent = `Error: ${err.message}`;
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  // ==========================================
  // 2. MARKET RADAR
  // ==========================================
  async function loadMarketRadarView() {
    const select = $('radarProductSelect');
    if (!select) return;

    if (OSState.products.length === 0) {
      const resp = await fetch('/api/brand-dna/products');
      if (resp.ok) {
        const json = await resp.json();
        OSState.products = json.data || [];
      }
    }

    select.innerHTML = '<option value="">-- Choose a Product Profile --</option>';
    for (const p of OSState.products) {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.brandName || p.brandId} — ${p.productName}`;
      if (OSState.activeProduct && OSState.activeProduct.id === p.id) {
        opt.selected = true;
      }
      select.appendChild(opt);
    }

    if (OSState.activeProduct) {
      runRadarScan(OSState.activeProduct.id);
    }
  }

  function initRadarControls() {
    const scanBtn = $('runRadarScanBtn');
    const select = $('radarProductSelect');
    if (!scanBtn || !select) return;

    scanBtn.addEventListener('click', () => {
      const prodId = select.value;
      if (!prodId) {
        alert('Please select a product from the Brand Vault first.');
        return;
      }
      const mode = document.querySelector('input[name="radarScanMode"]:checked')?.value || 'quick';
      runRadarScan(prodId, mode);
    });
  }

  async function runRadarScan(productId, mode = 'quick') {
    const container = $('radarResultsArea');
    if (!container) return;
    container.innerHTML = `
      <div class="os-card" style="text-align: center; padding: 48px;">
        <div class="spinner" style="margin: 0 auto 16px;"></div>
        <div style="font-family: var(--mono); font-size: 0.85rem; color: var(--os-teal-light);">
          EXECUTING MARKET RADAR (${mode.toUpperCase()} SCAN)...
        </div>
        <p class="muted" style="margin-top: 8px;">Gathering Google Shopping offers, calculating baseline, and evaluating variant anomalies.</p>
      </div>
    `;

    try {
      const resp = await fetch('/api/market-radar/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          mode,
          allowDeepScan: mode === 'deep',
        }),
      });

      if (!resp.ok) throw new Error('Market Radar search failed');
      const json = await resp.json();
      const report = json.data;
      OSState.radarReport = report;

      renderRadarReport(report);
    } catch (err) {
      container.innerHTML = `<div class="os-card"><p class="hint error">Market Radar error: ${err.message}</p></div>`;
    }
  }

  function renderRadarReport(report) {
    const container = $('radarResultsArea');
    if (!container) return;

    const b = report.baseline;
    container.innerHTML = `
      <div class="os-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div>
            <span class="os-tag os-tag-teal">${report.mode.toUpperCase()} SCAN</span>
            <span class="os-tag" style="margin-left: 8px;">Credits Used: ${report.searchPlan.creditsUsed}</span>
            <span class="os-tag os-tag-${b.status === 'robust_baseline' ? 'teal' : 'amber'}" style="margin-left: 8px;">
              ${b.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <button id="saveSnapshotBtn" class="cta cta-ghost" style="min-height: 36px; padding: 6px 12px; font-size: 0.65rem;">
            Save to Watchtower Timeline
          </button>
        </div>

        <div class="baseline-meter">
          <div class="baseline-metric">
            <div class="baseline-metric-num">${money(b.mrp)}</div>
            <div class="baseline-metric-lbl">Statutory MRP</div>
          </div>
          <div class="baseline-metric" style="border-left: 1px solid var(--os-border);">
            <div class="baseline-metric-num">${money(b.medianMarketPrice)}</div>
            <div class="baseline-metric-lbl">Market Baseline (Median)</div>
          </div>
          <div class="baseline-metric" style="border-left: 1px solid var(--os-border);">
            <div class="baseline-metric-num">${b.includedListingCount}</div>
            <div class="baseline-metric-lbl">Comparable Offers</div>
          </div>
          <div class="baseline-metric" style="border-left: 1px solid var(--os-border);">
            <div class="baseline-metric-num">${b.excludedListingCount}</div>
            <div class="baseline-metric-lbl">Excluded Listings</div>
          </div>
        </div>
        <p class="mono" style="font-size: 0.74rem; color: var(--os-text-muted); margin: 8px 0 0;">
          ${b.explanation}
        </p>
      </div>

      <!-- Listings Table -->
      <div class="os-card">
        <h3 style="margin: 0 0 16px; font-size: 1.1rem;">Observed Marketplace Offers (${report.comparableListings.length})</h3>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem;">
            <thead>
              <tr style="border-bottom: 1px solid var(--os-border); text-align: left; color: var(--os-text-muted); font-family: var(--mono); font-size: 0.68rem;">
                <th style="padding: 10px;">OFFER / TITLE</th>
                <th style="padding: 10px;">SELLER / CHANNEL</th>
                <th style="padding: 10px;">PRICE</th>
                <th style="padding: 10px;">VARIANCE</th>
                <th style="padding: 10px;">CLASSIFICATION</th>
                <th style="padding: 10px; text-align: right;">ACTION</th>
              </tr>
            </thead>
            <tbody>
              ${report.comparableListings
                .map(
                  (item) => `
                <tr style="border-bottom: 1px solid rgba(148, 163, 184, 0.08); ${item.requiresReview ? 'background: rgba(239, 68, 68, 0.06);' : ''}">
                  <td style="padding: 12px 10px; max-width: 320px;">
                    <a href="${item.url}" target="_blank" rel="noopener noreferrer" style="color: var(--os-text-primary); text-decoration: none; font-weight: 500;">
                      ${item.title}
                    </a>
                  </td>
                  <td style="padding: 12px 10px;">
                    <div>${item.merchantName}</div>
                    <small class="muted">${item.source}</small>
                  </td>
                  <td style="padding: 12px 10px; font-weight: 600; font-family: var(--mono);">
                    ${money(item.price)}
                  </td>
                  <td style="padding: 12px 10px; font-family: var(--mono); color: ${item.priceDeviationFromBaselinePercent < -40 ? 'var(--os-red)' : 'var(--os-text-secondary)'};">
                    ${item.priceDeviationFromBaselinePercent !== null ? `${item.priceDeviationFromBaselinePercent}%` : 'N/A'}
                  </td>
                  <td style="padding: 12px 10px;">
                    <span class="os-tag os-tag-${item.requiresReview ? 'red' : 'teal'}">
                      ${item.priceClassification.replace('_', ' ')}
                    </span>
                  </td>
                  <td style="padding: 12px 10px; text-align: right;">
                    <button class="cta cta-ghost explain-btn" data-id="${item.id}" style="min-height: 32px; padding: 4px 10px; font-size: 0.62rem;">
                      Explain Finding
                    </button>
                  </td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Wire up Explain Finding buttons
    container.querySelectorAll('.explain-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = report.comparableListings.find((l) => l.id === id);
        if (item) openExplainModal(item, report);
      });
    });

    // Wire up Save Snapshot to Watchtower
    const saveSnapBtn = $('saveSnapshotBtn');
    if (saveSnapBtn) {
      saveSnapBtn.addEventListener('click', async () => {
        saveSnapBtn.disabled = true;
        saveSnapBtn.textContent = 'Saving...';
        try {
          const resp = await fetch('/api/watchtower/snapshots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              report,
              brandId: report.productId.split('_')[1] || 'brand',
            }),
          });
          if (resp.ok) {
            saveSnapBtn.textContent = 'Saved to Watchtower!';
            saveSnapBtn.style.color = 'var(--os-teal-light)';
          }
        } catch {
          saveSnapBtn.disabled = false;
          saveSnapBtn.textContent = 'Save Failed';
        }
      });
    }
  }

  // ==========================================
  // 3. EVIDENCE GRAPH
  // ==========================================
  async function loadEvidenceGraphView() {
    const canvas = $('graphCanvasContainer');
    if (!canvas) return;
    canvas.innerHTML = '<p class="mono" style="padding: 24px;">Loading Evidence Graph nodes & relationships...</p>';

    try {
      const resp = await fetch('/api/evidence-graph');
      if (!resp.ok) throw new Error('Failed to load evidence graph');
      const json = await resp.json();
      OSState.graphData = json.data;

      renderEvidenceGraph(json.data);
    } catch (err) {
      canvas.innerHTML = `<p class="hint error" style="padding: 24px;">Graph error: ${err.message}</p>`;
    }
  }

  function renderEvidenceGraph(graph) {
    const canvas = $('graphCanvasContainer');
    const details = $('graphNodeDetails');
    if (!canvas) return;

    const nodes = graph.nodes || [];
    const edges = graph.edges || [];

    canvas.innerHTML = `
      <div style="padding: 16px; border-bottom: 1px solid var(--os-border); display: flex; gap: 12px; align-items: center; justify-content: space-between;">
        <div>
          <span class="mono" style="font-size: 0.75rem; color: var(--os-text-muted);">
            TOTAL NODES: <strong style="color: var(--os-text-primary);">${graph.summary.totalNodes}</strong> | 
            FACTUAL EDGES: <strong style="color: var(--os-teal-light);">${graph.summary.totalEdges}</strong>
          </span>
        </div>
        <div style="display: flex; gap: 8px;">
          <span class="os-tag os-tag-teal">Observed Factual Basis</span>
          <span class="os-tag">Zero Speculative Claims</span>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; padding: 20px; max-height: 440px; overflow-y: auto;">
        ${nodes
          .map(
            (n) => `
          <div class="os-card graph-node-card" data-id="${n.id}" style="margin: 0; padding: 14px; cursor: pointer;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span class="os-tag os-tag-${n.type === 'product' ? 'teal' : n.type === 'listing' ? 'amber' : 'red'}">${n.type}</span>
              <span class="mono" style="font-size: 0.6rem; color: var(--os-text-muted);">${(n.provenance.confidence * 100).toFixed(0)}% conf</span>
            </div>
            <div style="font-weight: 600; font-size: 0.85rem; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${n.label}
            </div>
            <div class="muted" style="font-size: 0.72rem;">${n.sublabel || ''}</div>
          </div>
        `
          )
          .join('')}
      </div>
    `;

    canvas.querySelectorAll('.graph-node-card').forEach((card) => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        const node = nodes.find((n) => n.id === id);
        const connectedEdges = edges.filter((e) => e.source === id || e.target === id);

        if (details && node) {
          details.innerHTML = `
            <div style="margin-bottom: 12px;">
              <span class="os-tag os-tag-teal">${node.type.toUpperCase()}</span>
            </div>
            <h4 style="margin: 0 0 8px;">${node.label}</h4>
            <p class="muted" style="font-size: 0.8rem; margin: 0 0 16px;">${node.sublabel || ''}</p>

            <div style="border-top: 1px solid var(--os-border); padding-top: 12px; margin-top: 12px;">
              <div class="mono" style="font-size: 0.68rem; color: var(--os-text-muted); margin-bottom: 8px;">
                CONNECTED EVIDENCE EDGES (${connectedEdges.length})
              </div>
              ${connectedEdges
                .map(
                  (e) => `
                <div style="padding: 8px; background: var(--os-navy-700); border-radius: 4px; margin-bottom: 8px; font-size: 0.76rem;">
                  <div style="display: flex; justify-content: space-between; font-family: var(--mono); font-size: 0.62rem; color: var(--os-teal-light);">
                    <span>${e.relationship.replace('_', ' ').toUpperCase()}</span>
                    <span>${e.relationshipKind.toUpperCase()}</span>
                  </div>
                  <div style="margin-top: 4px; color: var(--os-text-secondary);">${e.evidenceBasis}</div>
                </div>
              `
                )
                .join('')}
            </div>
          `;
        }
      });
    });
  }

  // ==========================================
  // 4. WATCHTOWER
  // ==========================================
  async function loadWatchtowerView() {
    const listEl = $('watchtowerSnapshotsList');
    if (!listEl) return;
    listEl.innerHTML = '<p class="mono" style="padding: 24px;">Loading historical marketplace snapshots...</p>';

    try {
      const prodId = OSState.activeProduct?.id || (OSState.products[0]?.id ?? '');
      if (!prodId) {
        listEl.innerHTML = '<p class="muted" style="padding: 24px;">Select or register a product first to view historical Watchtower timelines.</p>';
        return;
      }

      const resp = await fetch(`/api/watchtower/snapshots?productId=${encodeURIComponent(prodId)}`);
      if (!resp.ok) throw new Error('Failed to load snapshots');
      const json = await resp.json();
      OSState.snapshots = json.data || [];

      if (OSState.snapshots.length < 2) {
        listEl.innerHTML = `
          <div class="os-card" style="text-align: center; padding: 36px;">
            <h3>Watchtower Needs At Least 2 Saved Scans</h3>
            <p class="muted">Currently ${OSState.snapshots.length} snapshot(s) stored for this product. Run scans on Market Radar and click "Save to Watchtower Timeline" to record genuine historical comparisons.</p>
          </div>
        `;
        return;
      }

      // Automatically compare the two most recent snapshots
      const snapA = OSState.snapshots[OSState.snapshots.length - 2];
      const snapB = OSState.snapshots[OSState.snapshots.length - 1];

      const compResp = await fetch('/api/watchtower/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baselineSnapshot: snapA,
          currentSnapshot: snapB,
        }),
      });

      if (!compResp.ok) throw new Error('Comparison failed');
      const compJson = await compResp.json();
      renderWatchtowerDiff(compJson.data);
    } catch (err) {
      listEl.innerHTML = `<p class="hint error" style="padding: 24px;">Watchtower error: ${err.message}</p>`;
    }
  }

  function renderWatchtowerDiff(diff) {
    const listEl = $('watchtowerSnapshotsList');
    if (!listEl) return;

    listEl.innerHTML = `
      <div class="os-card">
        <span class="os-tag os-tag-teal">HISTORICAL TIMELINE COMPARISON</span>
        <h3 style="margin: 12px 0 6px;">Market Variance Timeline</h3>
        <p class="mono" style="font-size: 0.74rem; color: var(--os-text-muted);">
          Comparing ${diff.baselineTimestamp.slice(0, 10)} against ${diff.currentTimestamp.slice(0, 10)}
        </p>
        <p style="font-size: 0.9rem; margin-top: 12px;">${diff.summary}</p>

        <div style="margin-top: 16px; padding: 12px; background: rgba(239, 68, 68, 0.08); border-left: 3px solid var(--os-red); border-radius: 4px;">
          <div class="mono" style="font-size: 0.65rem; color: var(--os-red); font-weight: 700;">PROVENANCE ADVISORY</div>
          <div style="font-size: 0.78rem; margin-top: 4px; color: var(--os-text-secondary);">${diff.absenceDisclaimer}</div>
        </div>
      </div>

      <!-- Actionable Alerts -->
      ${diff.alerts.length > 0
        ? `
        <div class="os-card">
          <h4 style="margin: 0 0 14px; font-size: 1rem; color: var(--os-amber);">Actionable Commercial Alerts (${diff.alerts.length})</h4>
          ${diff.alerts
            .map(
              (a) => `
            <div style="padding: 12px; background: var(--os-navy-700); border-radius: 6px; margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between; font-family: var(--mono); font-size: 0.65rem; color: var(--os-amber);">
                <span>${a.ruleType.toUpperCase()}</span>
                <span>${a.severity.toUpperCase()}</span>
              </div>
              <div style="margin-top: 6px; font-size: 0.85rem;">${a.message}</div>
            </div>
          `
            )
            .join('')}
        </div>
      `
        : ''}
    `;
  }

  // ==========================================
  // 5. CASES & EVIDENCE DESK
  // ==========================================
  async function loadCasesDeskView() {
    const listEl = $('casesDeskList');
    if (!listEl) return;
    listEl.innerHTML = '<p class="mono" style="padding: 24px;">Loading formal investigation cases...</p>';

    try {
      const resp = await fetch('/api/cases');
      if (!resp.ok) throw new Error('Failed to load cases');
      const json = await resp.json();
      OSState.cases = json.data || [];

      if (OSState.cases.length === 0) {
        listEl.innerHTML = `
          <div class="os-card" style="text-align: center; padding: 48px;">
            <h3>No Investigation Cases Created Yet</h3>
            <p class="muted">Run an investigation scan in Market Radar or the Beacontra Lens Chrome extension, then save relevant findings to an official case.</p>
          </div>
        `;
        return;
      }

      listEl.innerHTML = OSState.cases
        .map(
          (c) => `
        <div class="os-card">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
            <div>
              <span class="os-tag os-tag-${c.priority === 'high' ? 'red' : 'teal'}">${c.priority.toUpperCase()} PRIORITY</span>
              <span class="os-tag" style="margin-left: 6px;">${c.status.toUpperCase()}</span>
              <span class="mono" style="font-size: 0.72rem; color: var(--os-text-muted); margin-left: 8px;">Case #${c.id}</span>
            </div>
            <a href="/api/cases/${c.id}/report" target="_blank" rel="noopener noreferrer" class="cta cta-ghost" style="min-height: 32px; padding: 4px 12px; font-size: 0.65rem;">
              Export Standalone HTML Report ↗
            </a>
          </div>
          <h3 style="margin: 0 0 6px; font-size: 1.15rem;">${c.title}</h3>
          <p class="muted" style="margin: 0 0 14px; font-size: 0.85rem;">${c.findingsSummary}</p>
          <div class="mono" style="font-size: 0.7rem; color: var(--os-text-muted);">
            TARGET: ${c.targetProduct?.productName || 'General Product'} | CREATED: ${c.createdAt.slice(0, 10)} | NOTES: ${c.notes?.length || 0}
          </div>
        </div>
      `
        )
        .join('');
    } catch (err) {
      listEl.innerHTML = `<p class="hint error" style="padding: 24px;">Cases error: ${err.message}</p>`;
    }
  }

  // ==========================================
  // 6. EXPLAIN THIS FINDING MODAL
  // ==========================================
  async function openExplainModal(item, report) {
    const modalBackdrop = $('explainModalBackdrop');
    const modalBody = $('explainModalBody');
    if (!modalBackdrop || !modalBody) return;

    modalBackdrop.removeAttribute('hidden');
    modalBody.innerHTML = '<p class="mono">Generating deterministic explanation...</p>';

    try {
      const resp = await fetch('/api/intelligence/explain-finding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          productName: report.productName,
          extractedPrice: item.price,
          sellerName: item.merchantName,
          source: item.source,
          productUrl: item.url,
          imageUrl: item.imageUrl,
          medianMarketPrice: report.baseline.medianMarketPrice,
          isAuthorizedSeller: item.discountLegitimacyScore >= 90,
          mrp: report.baseline.mrp,
        }),
      });

      if (!resp.ok) throw new Error('Explanation generator failed');
      const json = await resp.json();
      const exp = json.data;

      modalBody.innerHTML = `
        <div style="margin-bottom: 20px;">
          <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            <span class="os-tag os-tag-${exp.dimensions.reviewPriority === 'urgent_review' ? 'red' : 'teal'}">
              ${exp.dimensions.reviewPriority.replace('_', ' ').toUpperCase()}
            </span>
            <span class="os-tag">Commercial: ${exp.dimensions.commercialSignal.replace('_', ' ')}</span>
            <span class="os-tag">Evidence Strength: ${exp.dimensions.evidenceStrength.toUpperCase()}</span>
          </div>
          <h3 style="margin: 0; font-size: 1.3rem;">${exp.headline}</h3>
        </div>

        <div class="os-card" style="margin-bottom: 16px;">
          <h4 style="margin: 0 0 6px; font-size: 0.95rem; color: var(--os-teal-light);">What Was Observed</h4>
          <p style="margin: 0; font-size: 0.85rem;">${exp.whatWasObserved}</p>
        </div>

        <div class="os-card" style="margin-bottom: 16px;">
          <h4 style="margin: 0 0 6px; font-size: 0.95rem; color: var(--os-teal-light);">Why It Matters</h4>
          <p style="margin: 0; font-size: 0.85rem;">${exp.whyItMatters}</p>
        </div>

        <!-- Counterfactual Scenarios -->
        <div class="os-card" style="margin-bottom: 16px;">
          <h4 style="margin: 0 0 8px; font-size: 0.95rem; color: var(--os-teal-light);">What Would Change This Finding</h4>
          ${exp.whatWouldChangeThisFinding
            .map(
              (c) => `
            <div class="os-counterfactual-card">
              <strong style="display: block; font-size: 0.82rem; margin-bottom: 2px;">${c.scenario}</strong>
              <span class="muted" style="font-size: 0.78rem;">${c.potentialShift}</span>
            </div>
          `
            )
            .join('')}
        </div>

        <!-- Human Triage Playbook -->
        <div class="os-card" style="margin-bottom: 16px;">
          <h4 style="margin: 0 0 8px; font-size: 0.95rem; color: var(--os-teal-light);">Recommended Human Action Playbook</h4>
          <p style="font-weight: 500; font-size: 0.85rem; margin-bottom: 10px;">${exp.playbook.recommendedAction}</p>
          ${exp.playbook.humanTriageSteps
            .map(
              (step) => `
            <div class="os-playbook-step">${step}</div>
          `
            )
            .join('')}
          <p class="mono" style="font-size: 0.65rem; color: var(--os-text-muted); margin-top: 12px;">
            ${exp.playbook.ethicalLegalDisclaimers}
          </p>
        </div>
      `;
    } catch (err) {
      modalBody.innerHTML = `<p class="hint error">Could not generate explanation: ${err.message}</p>`;
    }
  }

  function initExplainModal() {
    const modalBackdrop = $('explainModalBackdrop');
    const closeBtn = $('closeExplainModalBtn');
    if (!modalBackdrop || !closeBtn) return;

    closeBtn.addEventListener('click', () => {
      modalBackdrop.setAttribute('hidden', '');
    });

    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        modalBackdrop.setAttribute('hidden', '');
      }
    });
  }

  // Initial Boot
  document.addEventListener('DOMContentLoaded', () => {
    initModuleNavigation();
    initVaultForm();
    initRadarControls();
    initExplainModal();
  });
})();
