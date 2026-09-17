// Local lab measurements, not field Core Web Vitals or guaranteed rendered FPS.
import { chromium } from "playwright";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import assert from "node:assert/strict";

const base = process.env.UI_BASE_URL || "http://localhost:8787";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined,
});
const output = {
  environment:
    "Local Chromium lab; localhost; no network throttling; no live API requests",
  assets: [],
  runs: [],
};
for (const file of [
  "index.html",
  "styles.css",
  "app.js",
  "experience.css",
  "experience.js",
]) {
  const bytes = await readFile(new URL(`../public/${file}`, import.meta.url));
  output.assets.push({
    file,
    rawBytes: bytes.length,
    gzipBytes: gzipSync(bytes).length,
  });
}
try {
  for (const [name, width, cpu] of [
    ["desktop", 1440, 1],
    ["mobile-4x-cpu", 390, 4],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height: 1000 },
      isMobile: width < 600,
      hasTouch: width < 600,
    });
    const page = await context.newPage();
    await page.route("**/api/**", (route) => route.abort());
    await page.addInitScript(() => {
      window.lab = { lcp: 0, layoutShifts: 0, longTasks: [] };
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) window.lab.lcp = e.startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((list) => {
        for (const e of list.getEntries())
          if (!e.hadRecentInput) window.lab.layoutShifts += e.value;
      }).observe({ type: "layout-shift", buffered: true });
      new PerformanceObserver((list) => {
        for (const e of list.getEntries())
          window.lab.longTasks.push(e.duration);
      }).observe({ type: "longtask", buffered: true });
    });
    const cdp = await context.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpu });
    await page.goto(base);
    await page.waitForTimeout(1500);
    const measurements = await page.evaluate(async () => {
      const intervals = [];
      let previous;
      const start = performance.now();
      await new Promise((resolve) => {
        function sample(time) {
          if (previous !== undefined) intervals.push(time - previous);
          previous = time;
          // Exercise the real pointer-depth handler while measuring rAF cadence.
          const scene = document.getElementById("signalScene");
          const rect = scene.getBoundingClientRect();
          scene.dispatchEvent(
            new PointerEvent("pointermove", {
              bubbles: true,
              clientX:
                rect.left + rect.width * (0.5 + 0.3 * Math.sin(time / 300)),
              clientY: rect.top + rect.height * 0.5,
            }),
          );
          if (time - start < 2000) requestAnimationFrame(sample);
          else resolve();
        }
        requestAnimationFrame(sample);
      });
      intervals.sort((a, b) => a - b);
      return {
        ...window.lab,
        fcp: performance.getEntriesByName("first-contentful-paint")[0]
          ?.startTime,
        frameMedianMs: intervals[Math.floor(intervals.length / 2)],
        frameP95Ms: intervals[Math.floor(intervals.length * 0.95)],
        framesOver32ms: intervals.filter((n) => n > 32).length,
        sampledFrames: intervals.length,
        requests: performance
          .getEntriesByType("resource")
          .map((r) => ({ url: r.name, transferBytes: r.transferSize })),
      };
    });
    // Progressive enhancement must actually react on desktop and stop on reduce.
    if (width === 1440)
      assert.ok(
        await page
          .locator("#signalScene")
          .evaluate((el) => el.style.getPropertyValue("--tilt-y")),
        "Pointer depth reacts",
      );
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForTimeout(50);
    assert.equal(
      await page
        .locator("#signalScene")
        .evaluate((el) => el.style.getPropertyValue("--tilt-y")),
      "",
      "Reduced motion clears depth",
    );
    assert.equal(
      await page
        .locator(".signal-object")
        .evaluate((el) => getComputedStyle(el).transform),
      "none",
      "Reduced motion uses static scene",
    );
    await page.locator("[data-start]").click();
    assert.equal(
      await page
        .locator("#scanTitle")
        .evaluate((el) => el === document.activeElement),
      true,
      "Hero CTA reaches form immediately",
    );
    output.runs.push({ name, cpuSlowdown: cpu, ...measurements });
    await context.close();
  }
  // Losing the enhancement script must not disable core input or validation.
  const fallback = await browser.newPage();
  await fallback.route("**/experience.js", (route) => route.abort());
  await fallback.route("**/api/**", (route) => route.abort());
  await fallback.goto(base);
  await fallback.locator("#loadDemoBtn").click();
  assert.equal(
    await fallback.locator("#productName").inputValue(),
    "boAt Airdopes 141",
  );
  await fallback.close();
  output.enhancementFallback =
    "PASS: example input works with experience.js blocked";
  output.totalRawBytes = output.assets.reduce((sum, a) => sum + a.rawBytes, 0);
  output.totalGzipBytes = output.assets.reduce(
    (sum, a) => sum + a.gzipBytes,
    0,
  );
  await mkdir(new URL("../docs/screenshots/", import.meta.url), {
    recursive: true,
  });
  await writeFile(
    new URL("../docs/screenshots/performance.json", import.meta.url),
    JSON.stringify(output, null, 2) + "\n",
  );
  console.log(JSON.stringify(output, null, 2));
} finally {
  await browser.close();
}
