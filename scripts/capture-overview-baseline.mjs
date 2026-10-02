/**
 * Capture baseline screenshots of the existing Overview page and modules
 * across Desktop (1440px), Tablet (768px), and Mobile (390px).
 */

import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';
import http from 'node:http';
import fs from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const screenshotsDir = resolve(__dirname, '../docs/screenshots/baseline');
await mkdir(screenshotsDir, { recursive: true });

// Spin up self-contained static server
const staticDir = resolve(__dirname, '../public');
const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);

  if (url.pathname === '/api/brand-dna/products') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        data: [
          {
            id: 'prod_boat_141',
            brandId: 'brand_boat',
            brandName: 'boAt Lifestyle',
            productName: 'boAt Airdopes 141',
            statutoryMrp: 4490,
            canonicalImageUrl: 'https://example.com/boat141.jpg',
            authorizedSellers: ['Appario Retail', 'boAt Lifestyle'],
          },
        ],
      })
    );
    return;
  }

  let filePath = resolve(staticDir, url.pathname === '/' ? 'index.html' : `.${url.pathname}`);
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext = filePath.split('.').pop();
  const mimeTypes = {
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    json: 'application/json',
    svg: 'image/svg+xml',
    png: 'image/png',
  };

  res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

await new Promise((r) => server.listen(8789, r));
console.log('✓ Baseline server listening at http://localhost:8789');

const browser = await chromium.launch({ headless: true });

try {
  const viewports = [
    { name: 'desktop', width: 1440, height: 950 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 390, height: 844 },
  ];

  for (const vp of viewports) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();

    console.log(`Capturing Overview at ${vp.name} (${vp.width}x${vp.height})...`);
    await page.goto('http://localhost:8789', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600); // let boot animation complete / clear

    // Capture hero & top
    await page.screenshot({ path: resolve(screenshotsDir, `overview_hero_${vp.name}.png`), fullPage: false });

    // Capture full overview page
    await page.screenshot({ path: resolve(screenshotsDir, `overview_full_${vp.name}.png`), fullPage: true });

    await context.close();
  }

  // Also capture existing modules on desktop to document current visual state
  const modContext = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const modPage = await modContext.newPage();
  await modPage.goto('http://localhost:8789', { waitUntil: 'domcontentloaded' });
  await modPage.waitForTimeout(600);

  const modules = [
    { id: 'brand-vault', label: 'Brand Vault' },
    { id: 'market-radar', label: 'Market Radar' },
    { id: 'evidence-graph', label: 'Evidence Graph' },
    { id: 'watchtower', label: 'Watchtower' },
    { id: 'cases-desk', label: 'Cases Desk' },
    { id: 'investigation-autopilot', label: 'Autopilot' },
  ];

  for (const mod of modules) {
    console.log(`Capturing module: ${mod.label}...`);
    const btn = modPage.locator(`button[data-target="${mod.id}"]`);
    if ((await btn.count()) > 0) {
      await btn.click();
      await modPage.waitForTimeout(500);
      await modPage.screenshot({ path: resolve(screenshotsDir, `module_before_${mod.id}.png`), fullPage: false });
    }
  }

  // Extract computed styles from Overview hero, CTA, badge, and card
  const btnOverview = modPage.locator(`button[data-target="overview"]`);
  await btnOverview.click();
  await modPage.waitForTimeout(400);

  const extractedStyles = await modPage.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const heroTitle = document.querySelector('.hero-title');
    const heroTitleStyle = heroTitle ? getComputedStyle(heroTitle) : null;
    const cta = document.querySelector('.cta-solid');
    const ctaStyle = cta ? getComputedStyle(cta) : null;
    const ctaGhost = document.querySelector('.cta-ghost');
    const ctaGhostStyle = ctaGhost ? getComputedStyle(ctaGhost) : null;
    const badge = document.querySelector('.badge') || document.querySelector('.qi-chip');
    const badgeStyle = badge ? getComputedStyle(badge) : null;
    const scanCard = document.querySelector('.scan-card');
    const scanCardStyle = scanCard ? getComputedStyle(scanCard) : null;

    return {
      rootTokens: {
        ink: root.getPropertyValue('--ink').trim(),
        ink2: root.getPropertyValue('--ink-2').trim(),
        ink3: root.getPropertyValue('--ink-3').trim(),
        paper: root.getPropertyValue('--paper').trim(),
        paper2: root.getPropertyValue('--paper-2').trim(),
        paper3: root.getPropertyValue('--paper-3').trim(),
        fog: root.getPropertyValue('--fog').trim(),
        moss: root.getPropertyValue('--moss').trim(),
        signal: root.getPropertyValue('--signal').trim(),
        signalStrong: root.getPropertyValue('--signal-strong').trim(),
        teal: root.getPropertyValue('--teal').trim(),
        amber: root.getPropertyValue('--amber').trim(),
        rust: root.getPropertyValue('--rust').trim(),
        lineDark: root.getPropertyValue('--line-dark').trim(),
        lineLight: root.getPropertyValue('--line-light').trim(),
        sans: root.getPropertyValue('--sans').trim(),
        display: root.getPropertyValue('--display').trim(),
        mono: root.getPropertyValue('--mono').trim(),
        ease: root.getPropertyValue('--ease').trim(),
      },
      heroTitle: heroTitleStyle
        ? {
            fontFamily: heroTitleStyle.fontFamily,
            fontSize: heroTitleStyle.fontSize,
            fontWeight: heroTitleStyle.fontWeight,
            letterSpacing: heroTitleStyle.letterSpacing,
            lineHeight: heroTitleStyle.lineHeight,
            color: heroTitleStyle.color,
          }
        : null,
      ctaSolid: ctaStyle
        ? {
            background: ctaStyle.backgroundColor,
            color: ctaStyle.color,
            borderRadius: ctaStyle.borderRadius,
            fontFamily: ctaStyle.fontFamily,
            fontSize: ctaStyle.fontSize,
            fontWeight: ctaStyle.fontWeight,
            letterSpacing: ctaStyle.letterSpacing,
            minHeight: ctaStyle.minHeight,
            padding: ctaStyle.padding,
          }
        : null,
      ctaGhost: ctaGhostStyle
        ? {
            borderColor: ctaGhostStyle.borderColor,
            color: ctaGhostStyle.color,
            borderRadius: ctaGhostStyle.borderRadius,
          }
        : null,
      scanCard: scanCardStyle
        ? {
            background: scanCardStyle.backgroundColor,
            border: scanCardStyle.border,
            boxShadow: scanCardStyle.boxShadow,
            padding: scanCardStyle.padding,
          }
        : null,
    };
  });

  console.log('EXTRACTED_STYLES_JSON:' + JSON.stringify(extractedStyles));

  await modContext.close();
} finally {
  await browser.close();
  server.close();
}
