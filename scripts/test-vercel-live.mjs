import { chromium } from 'playwright';

async function main() {
  console.log('Launching browser to test https://beacontra.vercel.app ...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
  });

  console.log('Navigating to live URL...');
  await page.goto('https://beacontra.vercel.app', { waitUntil: 'networkidle' });

  console.log('Page Title:', await page.title());

  // 1. Verify Guided Tour button and modal
  const guideBtn = page.locator('#openGuidedTourBtn');
  console.log('Open Guided Tour button visible:', await guideBtn.isVisible());
  await guideBtn.click();
  await page.waitForTimeout(400);

  const guideModal = page.locator('#guideTourModalBackdrop');
  console.log('Guide Modal visible after click:', await guideModal.isVisible());

  const nextBtn = page.locator('#tourNextBtn');
  await nextBtn.click();
  await page.waitForTimeout(300);
  console.log('Advanced to Step 2');

  const closeBtn = page.locator('#closeTourModalBtn');
  await closeBtn.click();
  await page.waitForTimeout(300);
  console.log('Guide Modal closed:', !(await guideModal.isVisible()));

  // 2. Test Evidence Graph navigation
  console.log('Navigating to Evidence Graph tab...');
  const graphTab = page.locator('.os-module-btn[data-target="evidence-graph"]');
  await graphTab.click();
  await page.waitForTimeout(1500);

  const graphNodes = page.locator('.graph-node-group');
  const nodeCount = await graphNodes.count();
  console.log('Evidence Graph node count:', nodeCount);

  // Click on a node to test Inspector
  if (nodeCount > 0) {
    await graphNodes.first().click();
    await page.waitForTimeout(500);
    const inspector = page.locator('#graphNodeDetails');
    const hasText = (await inspector.innerText()).includes('CONFIDENCE');
    console.log('Graph Node Inspector rendered details:', hasText);
  }

  // 3. Test Watchtower navigation
  console.log('Navigating to Watchtower tab...');
  const watchtowerTab = page.locator('.os-module-btn[data-target="watchtower"]');
  await watchtowerTab.click();
  await page.waitForTimeout(1500);

  const simulateBtn = page.locator('#watchtowerSimulateBtn');
  console.log('Watchtower Simulate Drift button visible:', await simulateBtn.isVisible());
  if (await simulateBtn.isVisible()) {
    await simulateBtn.click();
    await page.waitForTimeout(2000);
    const metricCards = page.locator('.watchtower-metric-card');
    const metricCount = await metricCards.count();
    console.log('Drift Metric Cards count:', metricCount);
  }

  console.log('\n--- Console Errors Audit ---');
  if (consoleErrors.length === 0) {
    console.log('SUCCESS: Zero console errors on live Vercel deployment!');
  } else {
    console.log('Errors encountered:', consoleErrors);
  }

  await browser.close();
}

main().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
