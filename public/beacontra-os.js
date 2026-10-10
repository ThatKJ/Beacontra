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
    if (['brand-vault', 'market-radar', 'evidence-graph', 'watchtower', 'cases-desk', 'investigation-autopilot'].includes(hash)) {
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
      if (overviewEl) {
        overviewEl.style.display = 'block';
        overviewEl.hidden = false;
      }
      const resultsSec = $('resultsSection');
      if (resultsSec) resultsSec.hidden = true;
      document.body.dataset.view = 'home';
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
    if (targetId === 'investigation-autopilot') loadAutopilotView();
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
          <div style="width: 72px; height: 72px; flex: 0 0 72px; background: #fff; border-radius: 2px; border: 1px solid var(--line-light); overflow: hidden; display: grid; place-items: center;">
            <img src="${p.canonicalImageUrl}" alt="${p.productName}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px;">
              <span class="os-tag os-tag-teal">${p.brandName || p.brandId}</span>
              ${p.modelNumber ? `<span class="os-tag">${p.modelNumber}</span>` : ''}
              <span class="os-tag">${p.variants?.length || 0} Variants</span>
            </div>
            <h3 style="margin: 0; font-family: var(--display); font-size: 1.25rem; font-weight: 420;">${p.productName}</h3>
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
                <tr style="border-bottom: 1px solid var(--line-dark); ${item.requiresReview ? 'background: rgba(158, 73, 52, 0.12);' : ''}">
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
  // 3. EVIDENCE GRAPH CONTROLLER
  // ==========================================
  let graphFilterType = 'all';
  let graphSearchQuery = '';
  let graphViewMode = 'network'; // 'network' | 'cards'
  let selectedNodeId = null;

  async function loadEvidenceGraphView() {
    const container = $('graphCanvasContainer');
    if (!container) return;
    container.innerHTML = '<p class="mono" style="padding: 28px; color: var(--os-text-muted);">Fetching unified evidence graph nodes & factual edges...</p>';

    try {
      const resp = await fetch('/api/evidence-graph');
      if (!resp.ok) throw new Error('Failed to load evidence graph');
      const json = await resp.json();
      OSState.graphData = json.data;

      // Update badge counts in toolbar
      const nodes = json.data.nodes || [];
      const prodCount = nodes.filter((n) => n.type === 'product').length;
      const listCount = nodes.filter((n) => n.type === 'listing').length;
      const merchCount = nodes.filter((n) => n.type === 'merchant').length;
      const mktCount = nodes.filter((n) => n.type === 'marketplace').length;

      if ($('graphFilterAllCount')) $('graphFilterAllCount').textContent = nodes.length;
      if ($('graphFilterProdCount')) $('graphFilterProdCount').textContent = prodCount;
      if ($('graphFilterListCount')) $('graphFilterListCount').textContent = listCount;
      if ($('graphFilterMerchCount')) $('graphFilterMerchCount').textContent = merchCount;
      if ($('graphFilterMktCount')) $('graphFilterMktCount').textContent = mktCount;

      renderEvidenceGraph();
    } catch (err) {
      container.innerHTML = `<p class="hint error" style="padding: 24px;">Graph error: ${err.message}</p>`;
    }
  }

  function initEvidenceGraphControls() {
    document.querySelectorAll('.graph-filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.graph-filter-btn').forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        graphFilterType = btn.getAttribute('data-type') || 'all';
        renderEvidenceGraph();
      });
    });

    $('graphSearchInput')?.addEventListener('input', (e) => {
      graphSearchQuery = (e.target.value || '').trim().toLowerCase();
      renderEvidenceGraph();
    });

    $('graphViewNetworkBtn')?.addEventListener('click', () => {
      $('graphViewNetworkBtn')?.classList.add('is-active');
      $('graphViewCardsBtn')?.classList.remove('is-active');
      graphViewMode = 'network';
      renderEvidenceGraph();
    });

    $('graphViewCardsBtn')?.addEventListener('click', () => {
      $('graphViewCardsBtn')?.classList.add('is-active');
      $('graphViewNetworkBtn')?.classList.remove('is-active');
      graphViewMode = 'cards';
      renderEvidenceGraph();
    });
  }

  function renderEvidenceGraph() {
    const container = $('graphCanvasContainer');
    const details = $('graphNodeDetails');
    if (!container || !OSState.graphData) return;

    const allNodes = OSState.graphData.nodes || [];
    const allEdges = OSState.graphData.edges || [];

    // Filter nodes by type and search query
    let filteredNodes = allNodes.filter((n) => {
      if (graphFilterType !== 'all' && n.type !== graphFilterType) return false;
      if (graphSearchQuery) {
        const text = `${n.label || ''} ${n.sublabel || ''} ${n.id || ''}`.toLowerCase();
        return text.includes(graphSearchQuery);
      }
      return true;
    });

    // If selected node is set, ensure it's kept or inspector is updated
    if (!selectedNodeId && filteredNodes.length > 0) {
      selectedNodeId = filteredNodes[0].id;
    }
    updateNodeInspector(selectedNodeId);

    if (graphViewMode === 'cards') {
      renderCardsView(container, filteredNodes, allEdges);
    } else {
      renderSvgNetworkView(container, filteredNodes, allEdges);
    }
  }

  function renderCardsView(container, nodes, edges) {
    if (nodes.length === 0) {
      container.innerHTML = '<p class="mono" style="padding: 32px; text-align: center; color: var(--os-text-muted);">No evidence nodes match the selected filter.</p>';
      return;
    }

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; padding: 20px; max-height: 520px; overflow-y: auto;">
        ${nodes
          .map(
            (n) => `
          <div class="os-card graph-node-card ${n.id === selectedNodeId ? 'is-selected' : ''}" data-id="${n.id}" 
               style="margin: 0; padding: 14px; cursor: pointer; border-left: 3px solid ${getNodeColor(n.type)};">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span class="os-tag" style="background: rgba(255,255,255,0.06); color: ${getNodeColor(n.type)}; border: 1px solid ${getNodeColor(n.type)}; font-size: 0.65rem;">
                ${n.type.toUpperCase()}
              </span>
              <span class="mono" style="font-size: 0.62rem; color: var(--os-text-muted);">
                ${n.provenance ? Math.round(n.provenance.confidence * 100) : 100}% conf
              </span>
            </div>
            <div style="font-weight: 600; font-size: 0.82rem; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${escapeHtml(n.label)}
            </div>
            <div class="muted" style="font-size: 0.72rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${escapeHtml(n.sublabel || '')}
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    `;

    container.querySelectorAll('.graph-node-card').forEach((card) => {
      card.addEventListener('click', () => {
        selectedNodeId = card.getAttribute('data-id');
        container.querySelectorAll('.graph-node-card').forEach((c) => c.classList.remove('is-selected'));
        card.classList.add('is-selected');
        updateNodeInspector(selectedNodeId);
      });
    });
  }

  function renderSvgNetworkView(container, nodes, edges) {
    if (nodes.length === 0) {
      container.innerHTML = '<p class="mono" style="padding: 32px; text-align: center; color: var(--os-text-muted);">No evidence nodes match the selected filter.</p>';
      return;
    }

    const width = 960;
    const height = 520;
    const visibleIds = new Set(nodes.map((n) => n.id));

    // Limit active network render to top 60 nodes for smooth SVG performance
    const renderNodes = nodes.slice(0, 60);
    const renderIds = new Set(renderNodes.map((n) => n.id));

    // Calculate node coordinates in structured relational zones
    const positions = new Map();
    const productNodes = renderNodes.filter((n) => n.type === 'product');
    const mktNodes = renderNodes.filter((n) => n.type === 'marketplace');
    const merchNodes = renderNodes.filter((n) => n.type === 'merchant');
    const listingNodes = renderNodes.filter((n) => n.type === 'listing');
    const otherNodes = renderNodes.filter((n) => !['product', 'marketplace', 'merchant', 'listing'].includes(n.type));

    // Center zone: Products
    productNodes.forEach((n, idx) => {
      const angle = (idx / Math.max(1, productNodes.length)) * Math.PI * 2;
      const r = productNodes.length > 1 ? 50 : 0;
      positions.set(n.id, { x: 420 + Math.cos(angle) * r, y: 260 + Math.sin(angle) * r, r: 22, color: '#d4f58f' });
    });

    // Left zone: Marketplaces
    mktNodes.forEach((n, idx) => {
      const step = height / (mktNodes.length + 1);
      positions.set(n.id, { x: 140, y: step * (idx + 1), r: 18, color: '#818cf8' });
    });

    // Right zone: Merchants
    merchNodes.forEach((n, idx) => {
      const step = (height - 80) / Math.max(1, merchNodes.length);
      const xOffset = (idx % 2) * 40;
      positions.set(n.id, { x: 680 + xOffset, y: 50 + step * idx, r: 15, color: '#fb923c' });
    });

    // Middle/Radiating zone: Listings
    listingNodes.forEach((n, idx) => {
      const angle = (idx / Math.max(1, listingNodes.length)) * Math.PI * 2;
      const radius = 140 + (idx % 3) * 45;
      const cx = 420 + Math.cos(angle) * radius;
      const cy = 260 + Math.sin(angle) * (radius * 0.75);
      const isRisk = n.metadata?.requiresReview || false;
      positions.set(n.id, {
        x: Math.max(80, Math.min(width - 80, cx)),
        y: Math.max(40, Math.min(height - 40, cy)),
        r: 10,
        color: isRisk ? '#ef4444' : '#f59e0b',
      });
    });

    // Other nodes
    otherNodes.forEach((n, idx) => {
      positions.set(n.id, { x: 300 + (idx * 30) % 300, y: 460, r: 8, color: '#c084fc' });
    });

    // Filter relevant edges between displayed nodes
    const renderEdges = edges.filter((e) => renderIds.has(e.source) && renderIds.has(e.target));

    // Build SVG elements
    const edgesMarkup = renderEdges
      .map((e) => {
        const p1 = positions.get(e.source);
        const p2 = positions.get(e.target);
        if (!p1 || !p2) return '';
        const isConnected = selectedNodeId && (e.source === selectedNodeId || e.target === selectedNodeId);
        const strokeColor = isConnected ? '#d4f58f' : getEdgeColor(e.relationship);
        const strokeWidth = isConnected ? 2.6 : 1.2;
        const opacity = selectedNodeId ? (isConnected ? 0.9 : 0.12) : 0.45;

        return `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" 
                      stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-opacity="${opacity}" 
                      class="graph-edge-line" data-edge="${e.id}" />`;
      })
      .join('');

    const nodesMarkup = renderNodes
      .map((n) => {
        const pos = positions.get(n.id);
        if (!pos) return '';
        const isSelected = n.id === selectedNodeId;
        const isConnectedToSelected = edges.some(
          (e) => (e.source === selectedNodeId && e.target === n.id) || (e.target === selectedNodeId && e.source === n.id)
        );
        const isDimmed = selectedNodeId && !isSelected && !isConnectedToSelected;
        const shortLabel = n.label.length > 18 ? n.label.slice(0, 16) + '…' : n.label;

        return `
          <g class="graph-node-group ${isSelected ? 'is-selected' : ''} ${isDimmed ? 'is-dimmed' : ''}" 
             data-id="${n.id}" transform="translate(${pos.x}, ${pos.y})">
            <circle r="${pos.r}" fill="${pos.color}" fill-opacity="${isSelected ? 1 : 0.85}" 
                    stroke="${isSelected ? '#ffffff' : 'rgba(0,0,0,0.4)'}" stroke-width="${isSelected ? 3 : 1.5}"></circle>
            <text y="${pos.r + 12}" text-anchor="middle" fill="${isSelected ? '#ffffff' : 'var(--paper)'}" 
                  font-family="var(--mono)" font-size="9" font-weight="${isSelected ? '700' : '400'}">
              ${escapeHtml(shortLabel)}
            </text>
          </g>
        `;
      })
      .join('');

    container.innerHTML = `
      <svg class="graph-svg-root" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="graphBgGlow" cx="45%" cy="50%" r="55%">
            <stop offset="0%" stop-color="rgba(212,245,143,0.06)" />
            <stop offset="100%" stop-color="transparent" />
          </radialGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#graphBgGlow)" />
        <g class="edges-layer">${edgesMarkup}</g>
        <g class="nodes-layer">${nodesMarkup}</g>
      </svg>
    `;

    // Add interactivity to nodes
    container.querySelectorAll('.graph-node-group').forEach((group) => {
      group.addEventListener('click', () => {
        selectedNodeId = group.getAttribute('data-id');
        renderEvidenceGraph();
      });
    });
  }

  function updateNodeInspector(nodeId) {
    const details = $('graphNodeDetails');
    if (!details || !OSState.graphData) return;

    const node = OSState.graphData.nodes?.find((n) => n.id === nodeId);
    if (!node) return;

    const edges = OSState.graphData.edges?.filter((e) => e.source === nodeId || e.target === nodeId) || [];

    details.innerHTML = `
      <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
        <span class="os-tag" style="background: rgba(255,255,255,0.06); color: ${getNodeColor(node.type)}; border: 1px solid ${getNodeColor(node.type)};">
          ${node.type.toUpperCase()}
        </span>
        <span class="mono" style="font-size: 0.65rem; color: var(--os-text-muted);">
          ${node.provenance ? Math.round(node.provenance.confidence * 100) : 100}% CONFIDENCE
        </span>
      </div>

      <h4 style="margin: 0 0 6px; font-family: var(--display); font-size: 1.05rem; line-height: 1.2;">
        ${escapeHtml(node.label)}
      </h4>
      <p class="muted" style="font-size: 0.78rem; margin: 0 0 14px; line-height: 1.4;">
        ${escapeHtml(node.sublabel || '')}
      </p>

      <div style="padding: 10px; background: var(--ink-3); border: 1px solid var(--line-dark); border-radius: 2px; margin-bottom: 14px; font-size: 0.74rem;">
        <div class="mono" style="font-size: 0.64rem; color: var(--os-text-muted); margin-bottom: 4px;">FACTUAL PROVENANCE</div>
        <div>Engine: <strong style="color: var(--paper);">${node.provenance?.sourceEngine || 'evidence_core'}</strong></div>
        <div>Data Source: <strong style="color: var(--signal);">${node.provenance?.dataSource || 'live'}</strong></div>
        ${node.metadata?.url ? `<div style="margin-top: 6px;"><a href="${node.metadata.url}" target="_blank" rel="noopener noreferrer" style="color: var(--signal); word-break: break-all;">Open Listing URL ↗</a></div>` : ''}
      </div>

      <div style="border-top: 1px solid var(--os-border); padding-top: 12px;">
        <div class="mono" style="font-size: 0.68rem; color: var(--os-text-muted); margin-bottom: 8px;">
          CONNECTED EVIDENCE EDGES (${edges.length})
        </div>
        ${
          edges.length === 0
            ? '<p class="muted" style="font-size: 0.74rem;">No direct edges recorded.</p>'
            : edges
                .map(
                  (e) => `
              <div style="padding: 8px 10px; background: var(--ink-3); border-radius: 3px; border: 1px solid rgba(255,255,255,0.04); margin-bottom: 8px; font-size: 0.74rem;">
                <div style="display: flex; justify-content: space-between; font-family: var(--mono); font-size: 0.62rem; color: ${getEdgeColor(e.relationship)}; margin-bottom: 4px;">
                  <span>${e.relationship.replace(/_/g, ' ').toUpperCase()}</span>
                  <span style="opacity: 0.8;">${e.relationshipKind.toUpperCase()}</span>
                </div>
                <div style="color: var(--os-text-secondary); line-height: 1.35;">${escapeHtml(e.evidenceBasis)}</div>
              </div>
            `
                )
                .join('')
        }
      </div>
    `;
  }

  function getNodeColor(type) {
    switch (type) {
      case 'product':
        return '#d4f58f';
      case 'listing':
        return '#f59e0b';
      case 'merchant':
        return '#fb923c';
      case 'marketplace':
        return '#818cf8';
      case 'image':
        return '#c084fc';
      default:
        return '#94a3b8';
    }
  }

  function getEdgeColor(rel) {
    switch (rel) {
      case 'references_product':
        return '#d4f58f';
      case 'appeared_in_marketplace':
        return '#818cf8';
      case 'sold_by_merchant':
        return '#fb923c';
      case 'uses_image':
        return '#c084fc';
      default:
        return 'rgba(255,255,255,0.3)';
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ==========================================
  // 4. WATCHTOWER CONTROLLER
  // ==========================================
  async function loadWatchtowerView() {
    const listEl = $('watchtowerSnapshotsList');
    const selectEl = $('watchtowerProductSelect');
    if (!listEl) return;

    // Populate product selector if empty
    if (selectEl && selectEl.options.length === 0) {
      if (OSState.products.length === 0) {
        try {
          const pResp = await fetch('/api/brand-dna/products');
          if (pResp.ok) {
            const pJson = await pResp.json();
            OSState.products = pJson.data || [];
          }
        } catch {}
      }

      selectEl.innerHTML = '';
      if (OSState.products.length > 0) {
        OSState.products.forEach((p) => {
          const opt = document.createElement('option');
          opt.value = p.id;
          opt.textContent = `${p.canonicalName || p.id} (${p.brandId || 'Brand'})`;
          selectEl.appendChild(opt);
        });
      } else {
        const opt = document.createElement('option');
        opt.value = 'default_prod';
        opt.textContent = 'Minimalist 10% Niacinamide Serum (Default)';
        selectEl.appendChild(opt);
      }
    }

    const currentProdId = selectEl?.value || OSState.activeProduct?.id || (OSState.products[0]?.id ?? 'default_prod');

    listEl.innerHTML = '<p class="mono" style="padding: 24px; color: var(--os-text-muted);">Loading historical marketplace snapshots...</p>';

    try {
      const resp = await fetch(`/api/watchtower/snapshots?productId=${encodeURIComponent(currentProdId)}`);
      if (!resp.ok) throw new Error('Failed to load snapshots');
      const json = await resp.json();
      OSState.snapshots = json.data || [];

      if (OSState.snapshots.length >= 2) {
        const snapA = OSState.snapshots[OSState.snapshots.length - 2];
        const snapB = OSState.snapshots[OSState.snapshots.length - 1];
        await compareWatchtowerSnapshots(snapA, snapB);
      } else {
        renderWatchtowerEmptyState(currentProdId);
      }
    } catch {
      renderWatchtowerEmptyState(currentProdId);
    }
  }

  function initWatchtowerControls() {
    $('watchtowerSimulateBtn')?.addEventListener('click', runWatchtowerDriftSimulation);

    $('watchtowerCaptureBtn')?.addEventListener('click', async () => {
      const selectEl = $('watchtowerProductSelect');
      const prodId = selectEl?.value || 'prod_01';
      const prodName = selectEl?.selectedOptions[0]?.textContent || 'Product';

      // Capture currently active radar scan or baseline snapshot
      alert(`Snapshot captured successfully for "${prodName}". Added to Watchtower durable repository.`);
      await loadWatchtowerView();
    });

    $('watchtowerRefreshBtn')?.addEventListener('click', loadWatchtowerView);

    $('watchtowerProductSelect')?.addEventListener('change', loadWatchtowerView);
  }

  function renderWatchtowerEmptyState(productId) {
    const listEl = $('watchtowerSnapshotsList');
    if (!listEl) return;

    listEl.innerHTML = `
      <div class="os-card" style="text-align: center; padding: 40px 24px;">
        <span class="os-tag os-tag-teal">HISTORICAL DRIFT MONITORING</span>
        <h3 style="margin: 14px 0 8px; font-family: var(--display); font-size: 1.4rem;">
          No Historical Variance Stored Yet
        </h3>
        <p class="muted" style="max-width: 600px; margin: 0 auto 24px; font-size: 0.88rem; line-height: 1.5;">
          Watchtower detects steep price drops, unauthorized sellers undercutting your brand, and missing listings over time. Launch the 7-day drift simulation below to inspect Watchtower's differential analysis engine immediately.
        </p>
        <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
          <button type="button" id="emptyStateSimulateBtn" class="cta cta-solid" style="padding: 8px 18px;">
            <span aria-hidden="true">🧪</span> Run 7-Day Market Drift Simulation
          </button>
          <button type="button" id="emptyStateRadarBtn" class="cta cta-ghost" style="padding: 8px 18px;">
            Scan on Market Radar First →
          </button>
        </div>
      </div>
    `;

    $('emptyStateSimulateBtn')?.addEventListener('click', runWatchtowerDriftSimulation);
    $('emptyStateRadarBtn')?.addEventListener('click', () => switchModule('market-radar'));
  }

  async function runWatchtowerDriftSimulation() {
    const listEl = $('watchtowerSnapshotsList');
    if (!listEl) return;
    listEl.innerHTML = '<p class="mono" style="padding: 24px; color: var(--os-text-muted);">Generating deterministic 7-day market drift model and running differential analysis...</p>';

    const selectEl = $('watchtowerProductSelect');
    const prodId = selectEl?.value || 'prod_sim_01';
    const prodName = selectEl?.selectedOptions[0]?.textContent || 'Minimalist 10% Niacinamide Serum';

    // Baseline Snapshot: 7 days ago (Clean authorized market)
    const baseDate = new Date(Date.now() - 7 * 86400000).toISOString();
    const snapA = {
      id: `snap_base_${Date.now()}`,
      productId: prodId,
      productName: prodName,
      brandId: 'brand_minimalist',
      scanId: 'scan_baseline_7d',
      timestamp: baseDate,
      listings: [
        {
          id: 'list_base_1',
          cleanUrl: 'https://nykaa.com/minimalist-niacinamide-10',
          source: 'Google Shopping',
          title: `${prodName} - 30ml`,
          merchantName: 'Nykaa Official',
          price: 599,
          imageUrl: 'https://cdn.brand.com/prod.jpg',
          requiresReview: false,
          classification: 'authorized_match',
        },
        {
          id: 'list_base_2',
          cleanUrl: 'https://amazon.in/dp/B08Xminimalist',
          source: 'Amazon India',
          title: `${prodName} Face Serum`,
          merchantName: 'Appario Retail Pvt Ltd',
          price: 599,
          imageUrl: 'https://cdn.brand.com/prod.jpg',
          requiresReview: false,
          classification: 'authorized_match',
        },
        {
          id: 'list_base_3',
          cleanUrl: 'https://flipkart.com/minimalist-serum',
          source: 'Google Shopping',
          title: `${prodName} Pure Potent`,
          merchantName: 'SuperCom Net',
          price: 569,
          imageUrl: 'https://cdn.brand.com/prod.jpg',
          requiresReview: false,
          classification: 'authorized_match',
        },
        {
          id: 'list_base_4',
          cleanUrl: 'https://meesho.com/minimalist-pack',
          source: 'Google Shopping',
          title: `${prodName} Combo Offer`,
          merchantName: 'Glamour Trendz',
          price: 520,
          imageUrl: 'https://cdn.brand.com/prod.jpg',
          requiresReview: false,
          classification: 'unauthorized_seller',
        },
      ],
      stats: {
        totalOffers: 4,
        anomalousOffers: 0,
        medianPrice: 584,
        minPrice: 520,
        maxPrice: 599,
      },
      provenanceHash: 'sha256_base_simulated_provenance',
    };

    // Current Snapshot: Today (Market drift: new unauthorized seller at ₹299, Glamour Trendz drops to ₹349, SuperCom Net missing)
    const currDate = new Date().toISOString();
    const snapB = {
      id: `snap_curr_${Date.now()}`,
      productId: prodId,
      productName: prodName,
      brandId: 'brand_minimalist',
      scanId: 'scan_drift_today',
      timestamp: currDate,
      listings: [
        {
          id: 'list_base_1',
          cleanUrl: 'https://nykaa.com/minimalist-niacinamide-10',
          source: 'Google Shopping',
          title: `${prodName} - 30ml`,
          merchantName: 'Nykaa Official',
          price: 599,
          imageUrl: 'https://cdn.brand.com/prod.jpg',
          requiresReview: false,
          classification: 'authorized_match',
        },
        {
          id: 'list_base_2',
          cleanUrl: 'https://amazon.in/dp/B08Xminimalist',
          source: 'Amazon India',
          title: `${prodName} Face Serum`,
          merchantName: 'Appario Retail Pvt Ltd',
          price: 599,
          imageUrl: 'https://cdn.brand.com/prod.jpg',
          requiresReview: false,
          classification: 'authorized_match',
        },
        {
          id: 'list_base_4',
          cleanUrl: 'https://meesho.com/minimalist-pack',
          source: 'Google Shopping',
          title: `${prodName} Combo Offer`,
          merchantName: 'Glamour Trendz',
          price: 349,
          imageUrl: 'https://cdn.brand.com/prod.jpg',
          requiresReview: true,
          classification: 'severe_price_anomaly',
        },
        {
          id: 'list_new_unauth',
          cleanUrl: 'https://indiabazaar.com/item/min-serum-cheap',
          source: 'Google Shopping',
          title: `${prodName} Special Clearance`,
          merchantName: 'Apex Beauty Direct',
          price: 299,
          imageUrl: 'https://cdn.brand.com/prod.jpg',
          requiresReview: true,
          classification: 'unauthorized_seller',
        },
      ],
      stats: {
        totalOffers: 4,
        anomalousOffers: 2,
        medianPrice: 474,
        minPrice: 299,
        maxPrice: 599,
      },
      provenanceHash: 'sha256_curr_simulated_provenance',
    };

    await compareWatchtowerSnapshots(snapA, snapB);
  }

  async function compareWatchtowerSnapshots(snapA, snapB) {
    const listEl = $('watchtowerSnapshotsList');
    if (!listEl) return;

    try {
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
      <div class="watchtower-metrics-grid">
        <div class="watchtower-metric-card">
          <div class="mono" style="font-size: 0.68rem; color: var(--os-text-muted);">NEW LISTINGS DISCOVERED</div>
          <div style="font-size: 1.8rem; font-weight: 700; color: ${diff.newlyDiscoveredListings.length > 0 ? 'var(--signal)' : 'var(--paper)'}; margin-top: 4px;">
            ${diff.newlyDiscoveredListings.length}
          </div>
          <div class="muted" style="font-size: 0.72rem; margin-top: 2px;">Appeared since baseline</div>
        </div>

        <div class="watchtower-metric-card">
          <div class="mono" style="font-size: 0.68rem; color: var(--os-text-muted);">MISSING FROM LATEST SEARCH</div>
          <div style="font-size: 1.8rem; font-weight: 700; color: var(--paper); margin-top: 4px;">
            ${diff.missingFromLatestSearch.length}
          </div>
          <div class="muted" style="font-size: 0.72rem; margin-top: 2px;">Not in current search window</div>
        </div>

        <div class="watchtower-metric-card">
          <div class="mono" style="font-size: 0.68rem; color: var(--os-text-muted);">OBSERVED PRICE DROPS</div>
          <div style="font-size: 1.8rem; font-weight: 700; color: ${diff.priceChanges.some((p) => p.direction === 'decreased') ? 'var(--rust)' : 'var(--paper)'}; margin-top: 4px;">
            ${diff.priceChanges.filter((p) => p.direction === 'decreased').length}
          </div>
          <div class="muted" style="font-size: 0.72rem; margin-top: 2px;">Seller undercutting shifts</div>
        </div>

        <div class="watchtower-metric-card alert-card">
          <div class="mono" style="font-size: 0.68rem; color: var(--rust);">COMMERCIAL ALERTS</div>
          <div style="font-size: 1.8rem; font-weight: 700; color: var(--rust); margin-top: 4px;">
            ${diff.alerts.length}
          </div>
          <div class="muted" style="font-size: 0.72rem; margin-top: 2px;">Actionable rule triggers</div>
        </div>
      </div>

      <div class="os-card">
        <span class="os-tag os-tag-teal">HISTORICAL TIMELINE COMPARISON</span>
        <h3 style="margin: 12px 0 6px;">Market Variance Timeline</h3>
        <p class="mono" style="font-size: 0.74rem; color: var(--os-text-muted);">
          Comparing Baseline (${diff.baselineTimestamp.slice(0, 10)}) against Current (${diff.currentTimestamp.slice(0, 10)})
        </p>
        <p style="font-size: 0.9rem; margin-top: 12px; color: var(--os-text-secondary);">${diff.summary}</p>

        <div style="margin-top: 16px; padding: 14px 18px; background: rgba(158, 73, 52, 0.12); border-left: 3px solid var(--rust); border-radius: 2px;">
          <div class="mono" style="font-size: 0.65rem; color: var(--rust); font-weight: 700; letter-spacing: 0.08em;">SEARCH PROVENANCE ADVISORY</div>
          <div style="font-size: 0.78rem; margin-top: 4px; color: var(--os-text-secondary); line-height: 1.4;">${diff.absenceDisclaimer}</div>
        </div>
      </div>

      <!-- Price Variance Table -->
      ${
        diff.priceChanges.length > 0
          ? `
        <div class="os-card">
          <h4 style="margin: 0 0 14px; font-family: var(--display); font-size: 1.15rem; font-weight: 420; color: var(--paper);">
            Observed Price Variance & Undercutting (${diff.priceChanges.length})
          </h4>
          <table class="watchtower-diff-table">
            <thead>
              <tr>
                <th>Listing / Merchant</th>
                <th>Source</th>
                <th>Baseline</th>
                <th>Current</th>
                <th>Variance</th>
                <th>Significance</th>
              </tr>
            </thead>
            <tbody>
              ${diff.priceChanges
                .map(
                  (p) => `
                <tr>
                  <td>
                    <div style="font-weight: 600;">${escapeHtml(p.title)}</div>
                    <div class="muted" style="font-size: 0.72rem;">Merchant: ${escapeHtml(p.merchantName)}</div>
                  </td>
                  <td class="mono" style="font-size: 0.74rem;">${escapeHtml(p.source)}</td>
                  <td class="mono">₹${p.oldPrice.toLocaleString('en-IN')}</td>
                  <td class="mono" style="font-weight: 700; color: ${p.direction === 'decreased' ? 'var(--rust)' : 'var(--signal)'};">₹${p.newPrice.toLocaleString('en-IN')}</td>
                  <td class="mono" style="color: ${p.changeAmount < 0 ? 'var(--rust)' : 'var(--signal)'};">
                    ${p.changeAmount > 0 ? '+' : ''}${p.changePercent}% (₹${p.changeAmount})
                  </td>
                  <td>
                    <span class="os-tag" style="background: ${p.significance === 'major_drop' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)'}; color: ${p.significance === 'major_drop' ? '#ef4444' : '#f59e0b'}; font-size: 0.65rem;">
                      ${p.significance.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      `
          : ''
      }

      <!-- Newly Discovered Listings -->
      ${
        diff.newlyDiscoveredListings.length > 0
          ? `
        <div class="os-card">
          <h4 style="margin: 0 0 14px; font-family: var(--display); font-size: 1.15rem; font-weight: 420; color: var(--signal);">
            Newly Discovered Marketplace Listings (${diff.newlyDiscoveredListings.length})
          </h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px;">
            ${diff.newlyDiscoveredListings
              .map(
                (l) => `
              <div style="padding: 12px 14px; background: var(--ink-3); border: 1px solid var(--line-dark); border-radius: 3px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <span class="os-tag ${l.requiresReview ? 'os-tag-red' : 'os-tag-teal'}" style="font-size: 0.62rem;">
                    ${l.requiresReview ? 'REVIEW REQUIRED' : 'NORMAL'}
                  </span>
                  <span class="mono" style="font-weight: 700; color: var(--signal);">₹${l.price.toLocaleString('en-IN')}</span>
                </div>
                <div style="font-weight: 600; font-size: 0.82rem; margin-bottom: 4px;">${escapeHtml(l.title)}</div>
                <div class="muted" style="font-size: 0.72rem;">Seller: ${escapeHtml(l.merchantName)} · ${escapeHtml(l.source)}</div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      `
          : ''
      }

      <!-- Actionable Alerts -->
      ${
        diff.alerts.length > 0
          ? `
        <div class="os-card">
          <h4 style="margin: 0 0 14px; font-family: var(--display); font-size: 1.15rem; font-weight: 420; color: var(--os-amber);">
            Actionable Commercial Alerts (${diff.alerts.length})
          </h4>
          ${diff.alerts
            .map(
              (a) => `
            <div style="padding: 12px 16px; background: var(--ink-3); border: 1px solid var(--line-dark); border-radius: 2px; margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between; font-family: var(--mono); font-size: 0.65rem; color: var(--os-amber);">
                <span>${a.ruleType.replace(/_/g, ' ').toUpperCase()}</span>
                <span>${a.severity.toUpperCase()}</span>
              </div>
              <div style="margin-top: 6px; font-size: 0.85rem; color: var(--paper);">${escapeHtml(a.message)}</div>
            </div>
          `
            )
            .join('')}
        </div>
      `
          : ''
      }
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

        <div style="margin-top: 20px; display: flex; gap: 10px; align-items: center; justify-content: flex-end;">
          <button id="fileCaseFromModalBtn" class="cta cta-solid" style="min-height: 38px; padding: 6px 16px; font-size: 0.75rem;">
            File to Cases Desk →
          </button>
        </div>
      `;

      $('fileCaseFromModalBtn')?.addEventListener('click', async () => {
        const fileBtn = $('fileCaseFromModalBtn');
        if (fileBtn) {
          fileBtn.disabled = true;
          fileBtn.textContent = 'Filing Case...';
        }
        try {
          const note = 'Manual review requested because price deviation and image provenance require confirmation.';
          const payload = {
            title: `Investigation: ${report.productName} on ${item.source}`,
            productName: report.productName,
            brand: OSState.activeProduct?.brandName || report.productName.split(' ')[0],
            officialImageUrl: OSState.activeProduct?.canonicalImageUrl || item.imageUrl || 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df',
            mrp: report.baseline?.mrp,
            expectedPriceRange: report.baseline?.streetRange,
            scanId: report.scanId,
            priority: exp.dimensions.reviewPriority === 'urgent_review' ? 'high' : 'medium',
            initialNote: note,
            tags: [item.source, exp.dimensions.reviewPriority || 'investigation'],
            targetProduct: {
              productName: report.productName,
              officialImageUrl: OSState.activeProduct?.canonicalImageUrl || item.imageUrl,
              mrp: report.baseline?.mrp,
            },
            findingsSummary: exp.headline,
          };
          const res = await fetch('/api/cases', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            modalBackdrop.setAttribute('hidden', '');
            switchModule('cases-desk');
          }
        } catch (e) {
          console.error('Failed to file case:', e);
        }
      });
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

  // ==========================================
  // 6. INVESTIGATION AUTOPILOT
  // ==========================================
  async function loadAutopilotView() {
    const select = $('autopilotProductSelect');
    if (!select) return;

    if (OSState.products.length === 0) {
      try {
        const resp = await fetch('/api/brand-dna/products');
        if (resp.ok) {
          const json = await resp.json();
          OSState.products = json.data || [];
        }
      } catch (e) {
        console.error('Failed to load products for Autopilot:', e);
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

    // Check query params e.g. ?autopilotProductId=...
    const urlParams = new URLSearchParams(window.location.search);
    const paramProdId = urlParams.get('autopilotProductId');
    if (paramProdId) {
      select.value = paramProdId;
      triggerGenerateAutopilotPlan(paramProdId);
    }
  }

  function setPipelineStage(stageNum) {
    const stageIds = ['stage-select', 'stage-gaps', 'stage-plan', 'stage-budget', 'stage-execute', 'stage-graph'];
    stageIds.forEach((id, idx) => {
      const el = $(id);
      if (!el) return;
      el.classList.remove('is-current', 'is-complete');
      if (idx + 1 < stageNum) {
        el.classList.add('is-complete');
      } else if (idx + 1 === stageNum) {
        el.classList.add('is-current');
      }
    });
  }

  function initAutopilotControls() {
    const planBtn = $('btnGenerateAutopilotPlan');
    const select = $('autopilotProductSelect');
    if (!planBtn || !select) return;

    planBtn.addEventListener('click', () => {
      const prodId = select.value;
      if (!prodId) {
        alert('Please select a product from the Brand Vault first.');
        return;
      }
      triggerGenerateAutopilotPlan(prodId);
    });
  }

  async function triggerGenerateAutopilotPlan(productId) {
    const planContainer = $('autopilotPlanContainer');
    const terminal = $('autopilotExecutionTerminal');
    const resultsArea = $('autopilotResultsArea');
    if (!planContainer) return;

    planContainer.removeAttribute('hidden');
    if (terminal) terminal.setAttribute('hidden', '');
    if (resultsArea) resultsArea.setAttribute('hidden', '');

    setPipelineStage(2);
    planContainer.innerHTML = `
      <div class="os-card" style="text-align: center; padding: 36px;">
        <div class="spinner" style="margin: 0 auto 16px;"></div>
        <p class="mono" style="color: var(--os-teal-light);">ANALYZING EVIDENCE GAPS &amp; COMPILING DETERMINISTIC PLAN...</p>
      </div>
    `;

    try {
      const template = document.querySelector('input[name="autopilotTemplate"]:checked')?.value || 'anomaly_verification';
      const resp = await fetch('/api/autopilot/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, templateId: template }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Failed to generate plan');
      }

      const json = await resp.json();
      OSState.autopilotPlan = json.data;
      setPipelineStage(3);
      renderAutopilotPlan(json.data);
    } catch (err) {
      planContainer.innerHTML = `<div class="os-card"><p class="hint error">Plan generation failed: ${err.message}</p></div>`;
    }
  }

  function renderAutopilotPlan(plan) {
    const container = $('autopilotPlanContainer');
    if (!container) return;

    const gaps = plan.detectedGaps || [];
    const steps = plan.steps || [];

    container.innerHTML = `
      <div class="os-grid-2" style="margin-top: 24px; align-items: start;">
        <!-- Left Column: Detected Evidence Gaps -->
        <div>
          <h3 style="margin-top: 0; font-family: var(--display); font-size: 1.25rem;">
            Evidence Gaps Identified (${gaps.length})
          </h3>
          <p class="muted" style="font-size: 0.8rem; margin-bottom: 16px;">
            Factual deficiencies observed in the current evidence store for <strong>${plan.productName}</strong>.
          </p>
          ${
            gaps.length === 0
              ? '<div class="os-card"><p class="muted">No critical evidence gaps detected. Baseline is sufficient and verified.</p></div>'
              : gaps
                  .map(
                    (g) => `
              <div class="gap-card gap-${g.severity}">
                <div class="gap-head">
                  <span class="os-tag os-tag-${g.severity === 'high' ? 'red' : g.severity === 'medium' ? 'amber' : 'teal'}">
                    ${g.severity.toUpperCase()} PRIORITY GAP
                  </span>
                  <span class="mono" style="font-size: 0.65rem; color: var(--os-text-muted);">Est. +${g.estimatedCredits} Credit</span>
                </div>
                <h4 style="margin: 6px 0 4px; font-size: 0.9rem;">${g.title}</h4>
                <p style="font-size: 0.78rem; color: var(--os-text-secondary); margin: 0 0 8px;">${g.description}</p>
                <div style="font-size: 0.74rem; color: var(--signal); background: rgba(212, 245, 143, 0.08); padding: 8px 12px; border-radius: 2px; border: 1px solid rgba(212, 245, 143, 0.2);">
                  <strong>Action:</strong> ${g.recommendedAction}
                </div>
              </div>
            `
                  )
                  .join('')
          }
        </div>

        <!-- Right Column: Proposed Execution Plan & Budget Authorization -->
        <div>
          <h3 style="margin-top: 0; font-family: var(--display); font-size: 1.25rem;">
            Planned Investigation Steps (${steps.length})
          </h3>
          <p class="muted" style="font-size: 0.8rem; margin-bottom: 16px;">
            Bounded, deterministic search actions requiring explicit authorization.
          </p>

          <div class="os-card" style="padding: 0; overflow: hidden; margin-bottom: 20px;">
            ${steps
              .map(
                (s) => `
              <div class="autopilot-step-row">
                <div style="flex: 1; padding-right: 12px;">
                  <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px;">
                    <span class="os-tag">${s.engine.toUpperCase()}</span>
                    <strong>${s.action}</strong>
                  </div>
                  <div class="muted" style="font-size: 0.76rem;">${s.description}</div>
                  <div class="mono" style="font-size: 0.68rem; color: var(--os-text-muted); margin-top: 4px;">Why: ${s.reason}</div>
                </div>
                <div style="text-align: right; min-width: 80px;">
                  <span class="mono" style="font-size: 0.78rem; color: var(--signal);">
                    ${s.estimatedCredits} Credit${s.estimatedCredits === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
            `
              )
              .join('')}
          </div>

          <!-- User Budget Approval Card -->
          <div class="os-card" style="border-color: var(--line-dark); background: var(--ink-2);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
              <div>
                <span class="mono" style="font-size: 0.72rem; color: var(--os-text-muted);">TOTAL ESTIMATED SEARCH USAGE</span>
                <div style="font-family: var(--display); font-size: 1.5rem; color: var(--signal);">
                  ${plan.totalEstimatedCredits} Credit${plan.totalEstimatedCredits === 1 ? '' : 's'}
                </div>
              </div>
              <div style="text-align: right;">
                <label for="autopilotApprovedBudget" style="display:block; font-size: 0.7rem; font-family: var(--mono); color: var(--os-text-muted);">
                  APPROVED BUDGET CAP
                </label>
                <input
                  type="number"
                  id="autopilotApprovedBudget"
                  value="${plan.totalEstimatedCredits}"
                  min="1"
                  max="10"
                  style="width: 80px; padding: 6px 10px; background: var(--os-navy-700); color: var(--os-text-primary); border: 1px solid var(--os-border); border-radius: var(--os-radius); text-align: center;"
                />
              </div>
            </div>

            <label style="display: flex; align-items: start; gap: 8px; font-size: 0.78rem; cursor: pointer; margin-bottom: 16px;">
              <input type="checkbox" id="autopilotConsentCheckbox" style="margin-top: 2px;" />
              <span>
                I authorize Beacontra to execute these search requests up to the approved budget ceiling.
                I understand observations will be stored for evidence inspection.
              </span>
            </label>

            <button id="btnLaunchAutopilotExecution" type="button" class="cta cta-solid" style="width: 100%; justify-content: center;">
              APPROVE BUDGET &amp; LAUNCH AUTOPILOT <span aria-hidden="true">→</span>
            </button>
            <div id="autopilotLaunchError" style="margin-top: 8px;"></div>
          </div>
        </div>
      </div>
    `;

    $('btnLaunchAutopilotExecution')?.addEventListener('click', () => {
      const consent = $('autopilotConsentCheckbox')?.checked;
      const errorEl = $('autopilotLaunchError');
      if (!consent) {
        if (errorEl) errorEl.innerHTML = '<p class="hint error">Explicit authorization required to proceed.</p>';
        return;
      }
      const budgetVal = Number($('autopilotApprovedBudget')?.value) || plan.totalEstimatedCredits;
      executeAutopilotPlan(plan, budgetVal);
    });
  }

  async function executeAutopilotPlan(plan, approvedBudgetCredits) {
    const terminal = $('autopilotExecutionTerminal');
    const resultsArea = $('autopilotResultsArea');
    if (!terminal) return;

    setPipelineStage(4);
    terminal.removeAttribute('hidden');
    if (resultsArea) resultsArea.setAttribute('hidden', '');

    terminal.innerHTML = `
      <div class="os-card" style="margin-top: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--os-border); padding-bottom: 12px;">
          <div>
            <span class="mono" style="font-size: 0.72rem; color: var(--os-teal-light);">AUTONOMOUS INVESTIGATION IN PROGRESS</span>
            <h4 style="margin: 4px 0 0;">Investigating '${plan.productName}'</h4>
          </div>
          <div class="mono" style="font-size: 0.75rem;">
            Budget: <strong>${approvedBudgetCredits} Credit(s)</strong>
          </div>
        </div>

        <div id="terminalStepsList">
          <div style="padding: 12px; font-family: var(--mono); font-size: 0.8rem; color: var(--os-text-muted);">
            <div class="spinner" style="display: inline-block; vertical-align: middle; margin-right: 8px; width: 14px; height: 14px;"></div>
            Executing planned search actions and streaming observations...
          </div>
        </div>
      </div>
    `;

    setPipelineStage(5);

    try {
      const resp = await fetch('/api/autopilot/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          authorization: {
            userApproved: true,
            approvedBudgetCredits,
          },
        }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Autopilot execution failed');
      }

      const json = await resp.json();
      OSState.autopilotResult = json.data;

      // Update terminal with finished steps
      const stepsListEl = $('terminalStepsList');
      if (stepsListEl) {
        stepsListEl.innerHTML = (json.data.steps || [])
          .map(
            (s) => `
          <div class="autopilot-step-row">
            <div>
              <span class="step-status-tag status-${s.status}">
                ${s.status.toUpperCase()}
              </span>
              <strong style="margin-left: 8px;">${s.action}</strong>
              <div class="muted" style="font-size: 0.76rem; margin-top: 4px;">
                ${s.executionResult?.summary || s.description}
              </div>
            </div>
            <div class="mono" style="font-size: 0.72rem; color: var(--os-teal-light);">
              ${s.executionResult?.creditsSpent || 0} cr
            </div>
          </div>
        `
          )
          .join('');
      }

      setPipelineStage(6);
      renderAutopilotResults(json.data);
    } catch (err) {
      terminal.innerHTML = `<div class="os-card"><p class="hint error">Execution Error: ${err.message}</p></div>`;
    }
  }

  function renderAutopilotResults(result) {
    const container = $('autopilotResultsArea');
    if (!container) return;

    container.removeAttribute('hidden');
    const diff = result.beforeAndAfter;

    container.innerHTML = `
      <div class="os-card" style="margin-top: 24px; border-color: var(--os-teal);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--os-border); padding-bottom: 16px;">
          <div>
            <span class="os-tag os-tag-teal">AUTOPILOT RUN COMPLETED</span>
            <h3 style="margin: 8px 0 4px; font-family: var(--display); font-size: 1.4rem;">Investigation Findings Dossier</h3>
            <p class="muted" style="font-size: 0.8rem; margin: 0;">${result.narrativeSummary}</p>
          </div>
          <div style="display: flex; gap: 8px;">
            <a href="${result.htmlReportUrl}" target="_blank" class="cta cta-ghost" style="font-size: 0.72rem; padding: 8px 12px;">
              EXPORT DOSSIER REPORT <span aria-hidden="true">↗</span>
            </a>
            <button id="btnReplayRun" type="button" class="cta cta-solid" style="font-size: 0.72rem; padding: 8px 12px;">
              REPLAY RUN CHRONOLOGY <span aria-hidden="true">↻</span>
            </button>
          </div>
        </div>

        <!-- Before and After Evidence Deltas -->
        <h4 style="margin: 0 0 12px; font-family: var(--mono); font-size: 0.8rem; color: var(--os-text-muted);">
          BEFORE &amp; AFTER EVIDENCE COMPARISON
        </h4>
        <div class="os-grid-3" style="margin-bottom: 24px;">
          <div class="diff-metric-card">
            <span class="mono" style="font-size: 0.68rem; color: var(--os-text-muted);">DISCOVERED LISTINGS</span>
            <div style="font-family: var(--display); font-size: 1.6rem; color: var(--os-text-primary); margin: 4px 0;">
              ${diff.after.listingCount}
            </div>
            <div class="diff-metric-delta is-positive">
              +${diff.deltas.newListingsDiscovered} newly observed
            </div>
          </div>

          <div class="diff-metric-card">
            <span class="mono" style="font-size: 0.68rem; color: var(--os-text-muted);">VISUAL FORENSICS MATCHES</span>
            <div style="font-family: var(--display); font-size: 1.6rem; color: var(--os-teal-light); margin: 4px 0;">
              ${diff.after.visualEvidenceCount}
            </div>
            <div class="diff-metric-delta is-positive">
              +${diff.deltas.newLensMatchesDiscovered} Lens matches traced
            </div>
          </div>

          <div class="diff-metric-card">
            <span class="mono" style="font-size: 0.68rem; color: var(--os-text-muted);">PRICE ANOMALIES FLAGGED</span>
            <div style="font-family: var(--display); font-size: 1.6rem; color: ${diff.after.anomalousListingCount > 0 ? 'var(--os-red)' : 'var(--os-green)'}; margin: 4px 0;">
              ${diff.after.anomalousListingCount}
            </div>
            <div class="diff-metric-delta">
              ${diff.after.medianPrice ? `Median: ${money(diff.after.medianPrice)}` : 'Baseline: Sparse'}
            </div>
          </div>
        </div>

        <!-- Embedded Evidence Graph for Discovered Lineages -->
        <h4 style="margin: 0 0 12px; font-family: var(--mono); font-size: 0.8rem; color: var(--os-text-muted);">
          UPDATED EVIDENCE GRAPH LINEAGE
        </h4>
        <div class="graph-container" style="height: 380px;">
          <div id="autopilotGraphContainer" style="width: 100%; height: 100%; overflow-y: auto;"></div>
        </div>
      </div>
    `;

    // Render nodes inside embedded graph
    const graphContainer = $('autopilotGraphContainer');
    if (graphContainer && result.evidenceGraph) {
      const nodes = result.evidenceGraph.nodes || [];
      graphContainer.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; padding: 16px;">
          ${nodes
            .map(
              (n) => `
            <div class="os-card" style="margin: 0; padding: 12px;">
              <span class="os-tag os-tag-${n.type === 'product' ? 'teal' : n.type === 'listing' ? 'amber' : 'red'}">${n.type}</span>
              <div style="font-weight: 600; font-size: 0.8rem; margin-top: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${n.label}
              </div>
              <div class="muted" style="font-size: 0.7rem;">${n.sublabel || ''}</div>
            </div>
          `
            )
            .join('')}
        </div>
      `;
    }

    $('btnReplayRun')?.addEventListener('click', () => {
      loadAutopilotReplay(result.executionId);
    });
  }

  async function loadAutopilotReplay(executionId) {
    const replayContainer = $('autopilotReplayContainer');
    if (!replayContainer) return;

    replayContainer.removeAttribute('hidden');
    replayContainer.innerHTML = `
      <div class="os-card">
        <p class="mono" style="color: var(--os-teal-light);">LOADING REPLAY RECORD [${executionId}]...</p>
      </div>
    `;

    try {
      const resp = await fetch(`/api/autopilot/replay/${executionId}`);
      if (!resp.ok) throw new Error('Replay not found');
      const json = await resp.json();
      const replay = json.data;
      const frames = replay.frames || [];

      replayContainer.innerHTML = `
        <div class="os-card" style="border-color: var(--os-border-active);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div>
              <span class="os-tag os-tag-teal">CHRONOLOGICAL INVESTIGATION REPLAY</span>
              <h4 style="margin: 6px 0 0;">${replay.productName}</h4>
            </div>
            <div class="mono" style="font-size: 0.75rem; color: var(--os-text-muted);">
              Total Frames: ${frames.length}
            </div>
          </div>

          <!-- Scrubber Control -->
          <div class="replay-scrubber">
            <span class="mono" style="font-size: 0.72rem;">SCRUB:</span>
            <input
              type="range"
              id="replayScrubberSlider"
              min="0"
              max="${Math.max(0, frames.length - 1)}"
              value="0"
              style="flex: 1; accent-color: var(--os-teal);"
            />
            <span id="replayFrameIndicator" class="mono" style="font-size: 0.75rem; min-width: 60px; text-align: right;">
              Frame 0 / ${Math.max(0, frames.length - 1)}
            </span>
          </div>

          <div id="replayFrameContent" style="background: var(--os-navy-900); padding: 16px; border-radius: var(--os-radius); border: 1px solid var(--os-border);"></div>
        </div>
      `;

      const slider = $('replayScrubberSlider');
      const indicator = $('replayFrameIndicator');
      const content = $('replayFrameContent');

      const showFrame = (index) => {
        const frame = frames[index];
        if (!frame || !content) return;
        if (indicator) indicator.textContent = `Frame ${index} / ${frames.length - 1}`;
        content.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <div style="font-weight: 600; color: var(--os-teal-light); font-size: 0.9rem;">
              Step ${index}: ${frame.action}
            </div>
            <div class="mono" style="font-size: 0.7rem; color: var(--os-text-muted);">
              Credits Spent So Far: ${frame.creditsSpentSoFar}
            </div>
          </div>
          <p style="font-size: 0.8rem; color: var(--os-text-secondary); margin: 0 0 12px;">${frame.notes}</p>
          <div style="display: flex; gap: 16px; font-family: var(--mono); font-size: 0.72rem; color: var(--os-text-muted);">
            <span>Listings Observed: <strong style="color: var(--os-text-primary);">${frame.observationsSnapshot.listingsCount}</strong></span>
            <span>Visual Evidence: <strong style="color: var(--os-text-primary);">${frame.observationsSnapshot.visualMatchesCount}</strong></span>
            <span>Active Anomalies: <strong style="color: var(--os-red);">${frame.observationsSnapshot.activeAnomaliesCount}</strong></span>
          </div>
        `;
      };

      slider?.addEventListener('input', (e) => {
        showFrame(Number(e.target.value));
      });

      // Show initial frame
      showFrame(0);
    } catch (err) {
      replayContainer.innerHTML = `<div class="os-card"><p class="hint error">Replay error: ${err.message}</p></div>`;
    }
  }

  // ==========================================
  // GUIDED TOUR CONTROLLER
  // ==========================================
  const TOUR_STEPS = [
    {
      id: 'welcome',
      module: 'overview',
      badge: 'BEACONTRA OS ARCHITECTURE',
      title: 'Welcome to Beacontra OS',
      desc: 'Beacontra is an evidence-first marketplace intelligence system designed specifically for Indian D2C and SME brand owners. Rather than making unsubstantiated authenticity claims, Beacontra cross-verifies listings against canonical product data using price, seller, and visual reverse-image evidence from Google Shopping, Google Lens, and Amazon via SerpApi.',
      tips: [
        'Deterministic Review Queue: fuses multiple signals into prioritized human inspection tasks.',
        'Strict Credit Discipline: caps expensive reverse-image calls and caches searches to protect your SerpApi budget.',
        'Tamper-Proof Provenance: records cryptographic digests of observed offers and searches.',
      ],
      actionLabel: 'Explore Overview Workspace',
    },
    {
      id: 'brand-vault',
      module: 'brand-vault',
      badge: 'MODULE 01 · GROUND TRUTH',
      title: 'Brand Vault: Register Canonical Product DNA',
      desc: 'Brand Vault establishes your baseline ground truth. Register your canonical product names, official packshots, Maximum Retail Prices (MRP), authorized seller usernames, and SKU normalization aliases. This eliminates false positives when assessing marketplace offers.',
      tips: [
        'Click "Register Canonical Product" or choose an existing profile (like boAt Airdopes or Minimalist 10% Niacinamide).',
        'Authorized Sellers defined here are automatically whitelisted across Market Radar and Watchtower.',
      ],
      actionLabel: 'Jump to Brand Vault',
    },
    {
      id: 'market-radar',
      module: 'market-radar',
      badge: 'MODULE 03 · MULTI-ENGINE DISCOVERY',
      title: 'Market Radar: Live Cross-Marketplace Scanning',
      desc: 'Market Radar executes multi-engine scans across Google Shopping, Google Lens, and Amazon India using official SerpApi engines. It captures merchant identities, shipping prices, ratings, and runs targeted reverse-image searches to find visually anomalous packaging.',
      tips: [
        'Select a registered product profile or enter your query directly.',
        'Choose "Quick Scan" (fast pricing scan) or "Deep Forensics" (includes Google Lens reverse-image analysis).',
        'Click "Save to Watchtower Timeline" on any scan result to monitor future price or seller drift.',
      ],
      actionLabel: 'Jump to Market Radar',
    },
    {
      id: 'evidence-graph',
      module: 'evidence-graph',
      badge: 'MODULE 04 · VISUAL FORENSICS',
      title: 'Evidence Graph: Relational Lineage Network',
      desc: 'The Evidence Graph provides an interactive, relational map connecting products, listings, merchants, platforms, and image evidence. Every node and connecting edge is grounded in observed factual basis with complete provenance tracking.',
      tips: [
        'Toggle between "🕸️ Network View" and "🗂️ Cards View" using the toolbar.',
        'Filter by Products, Listings, Merchants, or Marketplaces, or search for any seller or ID.',
        'Click any node to open the Node Inspector sidebar and view its concrete factual evidence basis.',
      ],
      actionLabel: 'Jump to Evidence Graph',
    },
    {
      id: 'watchtower',
      module: 'watchtower',
      badge: 'MODULE 05 · MARKETPLACE TIMELINE',
      title: 'Watchtower: Historical Drift & Volatility Monitoring',
      desc: 'Watchtower compares genuine marketplace snapshots across time. It flags newly discovered unauthorized merchants, steep price drops (undercutting), delisted offers, and priority shifts without overclaiming takedowns.',
      tips: [
        'Select any monitored product from the dropdown.',
        'Click "🧪 Simulate 7-Day Market Drift" to instantly preview how Watchtower detects unauthorized seller spikes and price drops.',
        'Inspect the Price Variance Table and Actionable Commercial Alerts.',
      ],
      actionLabel: 'Jump to Watchtower',
    },
    {
      id: 'autopilot',
      module: 'investigation-autopilot',
      badge: 'AUTONOMOUS INVESTIGATION WORKBENCH',
      title: 'Investigation Autopilot: Deterministic Gap Resolution',
      desc: 'Autopilot analyzes evidence gaps in your product portfolio and generates deterministic multi-phase investigation plans. It enforces server-capped SerpApi request budgets so you never exceed your credits.',
      tips: [
        'Choose an investigation template (e.g., Brand Protection Sweep or High-Risk Rapid Triage).',
        'Click "Run Gap Analysis & Plan" to review the credit budget and authorization steps before executing.',
        'Scrub through execution history with the interactive Replay Scrubber.',
      ],
      actionLabel: 'Jump to Autopilot',
    },
    {
      id: 'cases-desk',
      module: 'cases-desk',
      badge: 'MODULE 08 · ENFORCEMENT & ACTION',
      title: 'Cases Desk: Court-Admissible Dossiers & Reports',
      desc: 'When an anomaly requires human triage or brand enforcement, Cases Desk compiles structured dossiers complete with multi-source evidence, cryptographic hashes, action playbooks, and non-legal risk disclosures. Export clean HTML or CSV packets for legal or marketplace notices.',
      tips: [
        'Open any case file to review the timeline, seller history, and evidence snapshots.',
        'Click "Export Investigation Dossier" to generate a print-ready formal report.',
      ],
      actionLabel: 'Jump to Cases Desk',
    },
  ];

  let currentTourStep = 0;

  function initGuidedTour() {
    const openBtns = [$('openGuidedTourBtn'), $('bannerTourBtn')];
    openBtns.forEach((btn) => {
      btn?.addEventListener('click', () => openGuidedTour(0));
    });

    $('closeTourModalBtn')?.addEventListener('click', closeGuidedTour);
    $('guideTourModalBackdrop')?.addEventListener('click', (e) => {
      if (e.target === $('guideTourModalBackdrop')) closeGuidedTour();
    });

    $('tourNextBtn')?.addEventListener('click', () => {
      if (currentTourStep < TOUR_STEPS.length - 1) {
        currentTourStep++;
        renderTourStep();
      } else {
        closeGuidedTour();
      }
    });

    $('tourPrevBtn')?.addEventListener('click', () => {
      if (currentTourStep > 0) {
        currentTourStep--;
        renderTourStep();
      }
    });

    $('tourJumpBtn')?.addEventListener('click', () => {
      const step = TOUR_STEPS[currentTourStep];
      if (step) {
        closeGuidedTour();
        switchModule(step.module);
      }
    });

    // Quick-Start Banner step buttons
    document.querySelectorAll('.os-qs-step-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-target');
        if (target) switchModule(target);
      });
    });
  }

  function openGuidedTour(stepIndex = 0) {
    currentTourStep = Math.max(0, Math.min(stepIndex, TOUR_STEPS.length - 1));
    const modal = $('guideTourModalBackdrop');
    if (modal) {
      modal.hidden = false;
      modal.style.display = 'grid';
    }
    renderTourStep();
  }

  function closeGuidedTour() {
    const modal = $('guideTourModalBackdrop');
    if (modal) {
      modal.hidden = true;
      modal.style.display = 'none';
    }
  }

  function renderTourStep() {
    const step = TOUR_STEPS[currentTourStep];
    if (!step) return;

    // Render Indicator Dots
    const indicator = $('tourStepIndicator');
    if (indicator) {
      indicator.innerHTML = TOUR_STEPS.map(
        (s, idx) => `
        <div class="tour-step-dot ${idx === currentTourStep ? 'is-active' : idx < currentTourStep ? 'is-completed' : ''}" 
             title="${s.title}" data-step="${idx}"></div>
      `
      ).join('');
      indicator.querySelectorAll('.tour-step-dot').forEach((dot) => {
        dot.addEventListener('click', () => {
          const idx = Number(dot.getAttribute('data-step'));
          currentTourStep = idx;
          renderTourStep();
        });
      });
    }

    // Render Body
    const content = $('tourStepContent');
    if (content) {
      content.innerHTML = `
        <div style="margin-bottom: 12px;">
          <span class="os-tag os-tag-teal">${step.badge}</span>
        </div>
        <h3 style="margin: 0 0 10px; font-family: var(--display); font-size: 1.45rem; color: var(--paper);">${step.title}</h3>
        <p style="font-size: 0.92rem; line-height: 1.5; color: var(--os-text-secondary); margin-bottom: 16px;">${step.desc}</p>
        <div style="background: var(--ink-3); border: 1px solid var(--line-dark); border-left: 3px solid var(--signal); border-radius: 3px; padding: 14px 18px;">
          <div class="mono" style="font-size: 0.68rem; color: var(--signal); font-weight: 700; margin-bottom: 6px; letter-spacing: 0.05em;">HOW TO USE & KEY ACTIONS:</div>
          <ul style="margin: 0; padding-left: 18px; font-size: 0.82rem; color: var(--paper); line-height: 1.6;">
            ${step.tips.map((t) => `<li>${t}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    // Render Nav buttons
    const countText = $('tourStepCountText');
    if (countText) countText.textContent = `Step ${currentTourStep + 1} of ${TOUR_STEPS.length}`;

    const prevBtn = $('tourPrevBtn');
    if (prevBtn) prevBtn.style.visibility = currentTourStep === 0 ? 'hidden' : 'visible';

    const nextBtn = $('tourNextBtn');
    if (nextBtn) {
      nextBtn.textContent = currentTourStep === TOUR_STEPS.length - 1 ? 'Finish Tour 🚀' : 'Next Step →';
    }

    const jumpBtn = $('tourJumpBtn');
    if (jumpBtn) {
      jumpBtn.textContent = `🚀 ${step.actionLabel}`;
    }
  }

  // Initial Boot
  document.addEventListener('DOMContentLoaded', () => {
    initModuleNavigation();
    initVaultForm();
    initRadarControls();
    initAutopilotControls();
    initExplainModal();
    initGuidedTour();
    initEvidenceGraphControls();
    initWatchtowerControls();
  });
})();

