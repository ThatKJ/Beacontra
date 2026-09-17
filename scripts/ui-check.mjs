// Zero-credit browser verification. Every API route is intercepted before interaction.
// Screenshot result data is a replay of the checked-in live response, labelled cached.
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { readFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const base = process.env.UI_BASE_URL || "http://localhost:8787";
const output = resolve(process.env.UI_ARTIFACT_DIR || "docs/screenshots");
await mkdir(output, { recursive: true });
const dump = JSON.parse(
  await readFile(
    new URL("../docs/FINAL_METRICS_DUMP.json", import.meta.url),
    "utf8",
  ),
);
const reference =
  "https://www.boat-lifestyle.com/cdn/shop/files/AD141-FI_Black06_600x.jpg";
const replay = {
  productName: "boAt Airdopes 141",
  officialImageUrl: reference,
  dataSource: "cache",
  results: dump.results,
  totalListingsFound: dump.results.length,
};
const mrp = dump.results.find((r) => r.priceSignal?.mrp)?.priceSignal.mrp;
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined,
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
let responseData = replay,
  status = 200,
  delay = 0,
  posts = 0;
await page.route("**/api/**", async (route) => {
  assert.match(route.request().url(), /\/api\/beacontra\/scan$/);
  posts++;
  if (delay) await new Promise((r) => setTimeout(r, delay));
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(
      status === 200
        ? { data: responseData }
        : { error: "Do not expose raw upstream error / secret / stack" },
    ),
  });
});
async function visible(selector) {
  await page.locator(selector).waitFor({ state: "visible" });
}
async function overflow(label) {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
    `${label}: horizontal overflow`,
  );
}
async function axe(label) {
  await page.evaluate(async () => {
    await Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => {})),
    );
  });
  const report = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  assert.deepEqual(
    report.violations.map(
      (v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`,
    ),
    [],
    `${label}: accessibility violations`,
  );
}
async function submit() {
  await page.locator("#scanBtn").click();
  await visible("#resultsSection");
}
async function edit() {
  await page.locator("#newScanBtn").click();
  await visible("#home");
}
async function capture(name) {
  await page.evaluate(async () => {
    await Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => {})),
    );
  });
  if (name !== "loading")
    await page.evaluate(async () => {
      const images = [
        ...document.querySelectorAll(
          ".image-well img, .photo-preview img, .queue-thumb img, .hero-reference img, .scan-reference img",
        ),
      ].filter((img) => img.getBoundingClientRect().top < innerHeight);
      await Promise.race([
        Promise.all(images.map((img) => img.decode().catch(() => {}))),
        new Promise((r) => setTimeout(r, 15000)),
      ]);
    });
  await page.screenshot({
    path: `${output}/${name}.png`,
    fullPage: !["hero", "evidence-detail"].includes(name),
  });
}

try {
  const response = await page.goto(base);
  assert.equal(response.status(), 200, "Worker must serve home successfully");
  await axe("home");
  await capture("hero");
  await page.keyboard.press("Tab");
  assert.equal(
    await page.locator(".skip").evaluate((el) => el === document.activeElement),
    true,
    "Keyboard skip link",
  );
  await page.locator("#loadDemoBtn").click();
  await page.waitForFunction(
    () =>
      !document.getElementById("imageStatus").textContent.includes("Loading"),
    { timeout: 15000 },
  );
  if (mrp) await page.locator("#mrp").fill(String(mrp));
  await capture("home");
  await page
    .locator(".scan-card")
    .screenshot({ path: `${output}/reference-input.png` });
  delay = 3000;
  await page.locator("#scanBtn").click();
  await visible("#loading");
  await overflow("loading");
  await axe("loading");
  await capture("loading");
  await visible("#resultsSection");
  delay = 0;
  assert.match(
    await page.locator("#dataBadge").textContent(),
    /CACHED LIVE RESULT/,
  );
  assert.equal(await page.locator(".queue-item").count(), dump.results.length);
  assert.equal(
    await page
      .locator("#evidencePanel")
      .getByText("Photo Match Confirmed")
      .count(),
    0,
  );
  await axe("review queue");
  await page.waitForTimeout(1200);
  await capture("review-queue");
  await page.locator("#expandComparison").click();
  await visible("#comparisonDialog");
  await axe("comparison dialog");
  for (let i = 0; i < 5; i++) await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() =>
      document.querySelector("dialog").contains(document.activeElement),
    ),
    true,
    "Modal traps focus",
  );
  await capture("evidence-detail");
  await page.keyboard.press("Escape");
  assert.equal(
    await page
      .locator("#expandComparison")
      .evaluate((el) => el === document.activeElement),
    true,
    "Modal restores focus",
  );
  await page.locator(".sources > summary").click();
  assert.ok(
    (await page.locator(".source-list a").count()) > 0,
    "Linked Lens sources exposed",
  );
  await page.locator("#queueFilter").selectOption("visual");
  assert.ok(
    (await page.locator(".queue-item").count()) < dump.results.length,
    "Visual filter narrows queue",
  );
  await page.locator("#queueFilter").selectOption("all");

  for (const width of [375, 390, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await overflow(`results ${width}`);
    await page.locator("#expandComparison").click();
    await overflow(`dialog ${width}`);
    await page.keyboard.press("Escape");
    if (width === 390) await capture("mobile-review");
    await edit();
    await overflow(`home ${width}`);
    if (width === 390) {
      await axe("mobile home");
      await capture("mobile-home");
    }
    if (width === 768) await capture("tablet-home");
    await submit();
    console.log(`PASS home / queue / comparison at ${width}px`);
  }

  // Error recovery retains prior scan and its reference price, even after edits.
  await edit();
  await page.locator("#mrp").fill("9999");
  status = 429;
  await page.locator("#scanBtn").click();
  await visible("#errorPanel");
  assert.match(
    await page.locator("#errorMessage").textContent(),
    /request limit/,
  );
  assert.doesNotMatch(
    await page.locator("#errorPanel").textContent(),
    /raw upstream|secret|stack/,
  );
  await axe("error");
  await capture("error");
  await page.locator("#returnBtn").click();
  assert.doesNotMatch(
    await page.locator("#evidencePanel").textContent(),
    /9,999/,
  );
  status = 200;

  // Realistic adversarial states are synthetic fixtures, never screenshot claims.
  const r = structuredClone(dump.results[0]);
  r.listing.title =
    "A very long marketplace listing title ".repeat(12) +
    "<img src=x onerror=alert(1)>";
  r.listing.seller = "";
  r.listing.source = "Unknown";
  r.listing.extractedPrice = 0;
  r.listing.price = "N/A";
  r.listing.thumbnail = "https://images.invalid/missing.jpg";
  r.listing.productLink = "javascript:alert(1)";
  r.lensEvidence = {
    details: {},
    exactMatchSources: [],
    visualMatchSources: [],
  };
  r.visualSignal = { anomalyType: "unavailable", isAnomalous: false };
  r.recommendation = "likely_genuine";
  responseData = { ...replay, dataSource: "fixture", results: [r] };
  await edit();
  await submit();
  assert.match(await page.locator("#dataBadge").textContent(), /FIXTURE MODE/);
  assert.match(
    await page.locator("#evidencePanel").textContent(),
    /Seller not supplied/,
  );
  assert.match(
    await page.locator("#evidencePanel").textContent(),
    /Unavailable/,
  );
  assert.match(
    await page.locator("#evidencePanel").textContent(),
    /Not listed/,
  );
  assert.equal(await page.locator('a[href^="javascript:"]').count(), 0);
  assert.equal(
    await page.locator("#detailTitle img").count(),
    0,
    "Untrusted title is text",
  );
  for (const width of [375, 390, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await overflow(`adversarial ${width}`);
  }
  await page.locator("#queueFilter").selectOption("priority");
  assert.match(
    await page.locator("#resultsList").textContent(),
    /No listings meet/,
  );
  await page.locator("[data-clear-filter]").click();
  r.visualSignal.anomalyType = "no_evidence";
  responseData = { ...responseData, results: [r] };
  await edit();
  await submit();
  assert.match(
    await page.locator("#evidencePanel").textContent(),
    /Absence of evidence is not an image mismatch/,
  );
  r.visualSignal.anomalyType = "not_verified";
  await edit();
  await submit();
  assert.match(
    await page.locator("#evidencePanel").textContent(),
    /Not checked/,
  );
  responseData = { ...replay, dataSource: "live", results: [] };
  await edit();
  await submit();
  assert.match(await page.locator("#dataBadge").textContent(), /Live API mode/);
  assert.match(
    await page.locator("#resultsList").textContent(),
    /No listings found/,
  );
  await axe("empty results");
  await edit();
  await page.locator("#removeImage").click();
  assert.equal(await page.locator("#officialImageUrl").inputValue(), "");
  const previous = posts;
  await page.locator("#scanBtn").click();
  assert.equal(posts, previous, "Required image prevents request");
  await page.locator("#loadDemoBtn").click();
  await page.locator("#mrp").fill("-1");
  await page.locator("#scanBtn").click();
  assert.equal(posts, previous, "Negative price prevents request");
  await page.locator("#mrp").fill("");
  await page.locator(".context > summary").click();
  await page.locator("#minPrice").fill("200");
  await page.locator("#maxPrice").fill("100");
  await page.locator("#scanBtn").click();
  assert.equal(posts, previous, "Reversed range prevents request");
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(
    await page
      .locator(".scan-line")
      .evaluate((el) => getComputedStyle(el, "::after").animationName),
    "none",
  );
  assert.deepEqual(errors, [], "No browser runtime errors");
  console.log(
    "PASS provenance, raw evidence, fixture/empty/missing states, validation, error recovery, safe URLs/text, modal keyboard focus, reduced motion and axe WCAG checks.",
  );
  console.log(
    `Screenshots: ${output}. No live SerpApi calls made; all API requests intercepted.`,
  );
} finally {
  await browser.close();
}
