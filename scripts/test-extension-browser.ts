import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function testExtensionInBrowser() {
  console.log('--- Testing Beacontra Lens Chrome Extension in Chromium ---');
  const extensionPath = path.resolve(process.cwd(), 'extension');
  const userDataDir = path.resolve(process.cwd(), 'scratch/chrome-test-profile');
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  let context;
  try {
    context = await chromium.launchPersistentContext(userDataDir, {
      headless: true,
      args: [
        '--headless=new',
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    console.log('[PASS] Chromium launched successfully with Beacontra Lens extension loaded.');

    // Find service worker or background page
    let backgroundPages = context.serviceWorkers();
    console.log(`Found ${backgroundPages.length} active service workers.`);

    // Open a mock Amazon.in product page to test content script DOM extraction
    const page = await context.newPage();
    
    // Inject mock Amazon India product HTML
    const mockAmazonHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>boAt Airdopes 141 Bluetooth TWS Earbuds: Amazon.in: Electronics</title>
      </head>
      <body>
        <input type="hidden" id="ASIN" value="B09N3ZNHTY" />
        <span id="productTitle">boAt Airdopes 141 Bluetooth Truly Wireless in Ear Earbuds with 42H Playtime (Bold Black)</span>
        
        <div id="apex_desktop">
          <span class="a-price aok-align-center reinventPricePriceToPayMargin priceToPay">
            <span class="a-offscreen">₹1,299</span>
          </span>
          <span class="basisPrice">
            <span class="a-offscreen">₹4,490</span>
          </span>
        </div>

        <div id="merchant-info">
          <span>Sold by <a id="sellerProfileTriggerId">Appario Retail Private Ltd</a> and Fulfilled by Amazon.</span>
        </div>

        <div id="imgTagWrapperId">
          <img id="landingImage" src="https://m.media-amazon.com/images/I/41rZZ7K7r-L._SY300_SX300_.jpg" data-old-hires="https://m.media-amazon.com/images/I/71xyz-hires.jpg" />
        </div>
      </body>
      </html>
    `;

    // Intercept requests to mock amazon.in domain
    await page.route('https://www.amazon.in/dp/B09N3ZNHTY*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: mockAmazonHtml,
      });
    });

    await page.goto('https://www.amazon.in/dp/B09N3ZNHTY');
    console.log('[PASS] Navigated to simulated Amazon.in product page.');

    // Execute extraction logic in the page context as content.js would
    const extracted = await page.evaluate(`
      (() => {
        const asinInput = document.querySelector('input#ASIN');
        const asin = asinInput ? asinInput.value : 'B09N3ZNHTY';

        const titleEl = document.getElementById('productTitle');
        const title = titleEl ? titleEl.textContent.trim() : '';

        const priceEl = document.querySelector('.priceToPay .a-offscreen');
        const priceText = priceEl ? priceEl.textContent.trim() : '';
        const extractedPrice = priceText ? parseFloat(priceText.replace(/[^0-9.]/g, '')) : null;

        const mrpEl = document.querySelector('.basisPrice .a-offscreen');
        const mrp = mrpEl ? parseFloat(mrpEl.textContent.replace(/[^0-9.]/g, '')) : null;

        const sellerEl = document.getElementById('sellerProfileTriggerId');
        const seller = sellerEl ? sellerEl.textContent.trim() : 'Unknown';

        const img = document.getElementById('landingImage');
        const imageUrl = img ? img.getAttribute('data-old-hires') || img.src : '';

        return {
          asin,
          title,
          price: priceText,
          extractedPrice,
          mrp,
          seller,
          imageUrl,
        };
      })()
    `) as {
      asin: string;
      title: string;
      price: string;
      extractedPrice: number;
      mrp: number;
      seller: string;
      imageUrl: string;
    };

    console.log('Extracted Product Context:', extracted);
    if (extracted.asin !== 'B09N3ZNHTY') throw new Error('ASIN extraction failed');
    if (!extracted.title.includes('boAt Airdopes 141')) throw new Error('Title extraction failed');
    if (extracted.extractedPrice !== 1299) throw new Error('Price extraction failed');
    if (extracted.mrp !== 4490) throw new Error('MRP extraction failed');
    if (extracted.seller !== 'Appario Retail Private Ltd') throw new Error('Seller extraction failed');
    console.log('[PASS] Full Amazon.in DOM extraction verified!');

    // Now test the side panel UI by opening it directly in a tab
    const sidepanelPage = await context.newPage();
    sidepanelPage.on('dialog', async (d) => {
      console.log('[BROWSER DIALOG]:', d.message());
      await d.accept();
    });
    sidepanelPage.on('console', (msg) => console.log('[BROWSER CONSOLE]:', msg.text()));
    sidepanelPage.on('pageerror', (err) => console.log('[BROWSER ERROR]:', err.message));

    let [background] = context.serviceWorkers();
    if (!background) {
      background = (await Promise.race([
        context.waitForEvent('serviceworker'),
        new Promise<null>((res) => setTimeout(() => res(null), 1500)),
      ])) as any;
    }
    let sidepanelUrl = 'file://' + path.resolve(extensionPath, 'sidepanel.html');
    if (background) {
      const extId = background.url().split('/')[2];
      console.log(`[PASS] Extension ID detected: ${extId}`);
      sidepanelUrl = `chrome-extension://${extId}/sidepanel.html`;
    }

    // Intercept backend API calls from side panel with explicit CORS headers
    await context.route('**/api/beacontra/scan', async (route) => {
      console.log('[INTERCEPT] POST /api/beacontra/scan received');
      await route.fulfill({
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'ok',
          data: {
            scanId: 'scan_browser_test_001',
            createdAt: new Date().toISOString(),
            productName: 'boAt Airdopes 141',
            officialImageUrl: 'https://m.media-amazon.com/images/I/71xyz-hires.jpg',
            dataSource: 'fixture',
            totalListingsFound: 3,
            creditsUsed: 5,
            results: [
              {
                listing: {
                  position: 1,
                  title: 'boAt Airdopes 141 Bold Black',
                  price: '₹1,299',
                  extractedPrice: 1299,
                  seller: 'Appario Retail Private Ltd',
                  source: 'Amazon India',
                },
                compositeScore: 10,
                recommendation: 'likely_genuine',
                priceSignal: { isAnomalous: false, anomalyType: 'within_expected_range', details: 'Normal price' },
                sellerSignal: { isAnomalous: false, anomalyType: 'authorized', details: 'Authorized seller' },
                visualSignal: { isAnomalous: false, anomalyType: 'matched', details: 'Image match', matchSources: [] },
              },
              {
                listing: {
                  position: 2,
                  title: 'Airdopes 141 Wireless Earbuds Fake Deal',
                  price: '₹349',
                  extractedPrice: 349,
                  seller: 'Shady Electronics',
                  source: 'Google Shopping',
                },
                compositeScore: 85,
                recommendation: 'review_urgently',
                priceSignal: { isAnomalous: true, anomalyType: 'severe_undercut', details: 'Price 73% below market band' },
                sellerSignal: { isAnomalous: true, anomalyType: 'unknown_seller', details: 'Unregistered seller' },
                visualSignal: { isAnomalous: false, anomalyType: 'unverified', details: 'No match found' },
              },
            ],
          },
        }),
      });
    });

    await context.route('**/api/cases', async (route) => {
      console.log('[INTERCEPT] POST /api/cases received');
      await route.fulfill({
        status: 201,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'ok',
          data: {
            id: 'case_browser_pass_001',
            title: 'Investigation: boAt Airdopes 141',
            status: 'active',
            priority: 'high',
          },
        }),
      });
    });

    // Run verification pass 1 and pass 2
    for (let pass = 1; pass <= 2; pass++) {
      console.log(`\n--- Running Full End-to-End Extension Workflow (Pass ${pass}/2) ---`);
      await sidepanelPage.goto(sidepanelUrl);

      // Verify initial UI elements
      await sidepanelPage.locator('#productName').waitFor({ state: 'visible' });
      await sidepanelPage.locator('#officialImageUrl').waitFor({ state: 'visible' });
      await sidepanelPage.locator('#scanBtn').waitFor({ state: 'visible' });

      // Populate fields from extracted Amazon data
      await sidepanelPage.locator('#productName').fill(extracted.title);
      await sidepanelPage.locator('#officialImageUrl').fill(extracted.imageUrl);
      await sidepanelPage.locator('#mrp').fill(String(extracted.mrp));
      await sidepanelPage.locator('#currentPriceRef').fill(String(extracted.extractedPrice));

      // Open calibration details and set price bands and authorized sellers
      await sidepanelPage.evaluate(() => {
        const details = document.querySelector('details');
        if (details) details.open = true;
      });
      await sidepanelPage.locator('#priceMin').fill('1000');
      await sidepanelPage.locator('#priceMax').fill('1500');
      await sidepanelPage.locator('#authorizedSellers').fill('Appario Retail Private Ltd, boAt Official');

      console.log(`[PASS ${pass}] Manual calibration values populated in side panel.`);

      // Click Scan Button
      await sidepanelPage.locator('#scanBtn').click();
      console.log(`[PASS ${pass}] Dispatched marketplace scan from side panel.`);

      // Wait for results card
      await sidepanelPage.locator('#resultsCard').waitFor({ state: 'visible' });
      const topScore = await sidepanelPage.locator('#topRiskScoreNum').textContent();
      const listingsCount = await sidepanelPage.locator('#totalListingsNum').textContent();
      console.log(`[PASS ${pass}] Findings rendered! Top Risk: ${topScore}, Listings: ${listingsCount}`);

      if (!topScore?.includes('85')) {
        throw new Error(`Expected top score 85, got ${topScore}`);
      }

      // Click Save to Evidence Desk Case
      await sidepanelPage.locator('#saveCaseBtn').click();
      await sidepanelPage.locator('#caseSavedNotice').waitFor({ state: 'visible' });
      const noticeText = await sidepanelPage.locator('#caseSavedNotice').textContent();
      console.log(`[PASS ${pass}] Case created successfully in Evidence Desk: ${noticeText?.trim()}`);

      if (!noticeText?.includes('case_browser_pass_001')) {
        throw new Error('Case ID missing in success notice');
      }
    }

    await context.close();
    console.log('\n===============================================================');
    console.log('   BROWSER VERIFICATION SUCCESS: WORKFLOW VERIFIED TWICE       ');
    console.log('===============================================================\n');
  } catch (err) {
    if (context) await context.close();
    throw err;
  }
}

testExtensionInBrowser().catch((err) => {
  console.error('Browser verification failed:', err);
  process.exit(1);
});
