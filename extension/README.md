# Beacontra Lens — Chrome Manifest V3 Extension

Beacontra Lens is the browser companion for **Beacontra Evidence Desk**. It allows brand protection analysts and investigators to inspect live marketplace listings on Amazon India (`amazon.in`), extract product attributes on-demand, calibrate baseline parameters, run cross-marketplace reverse-image and price verification via the Beacontra backend, and file investigation cases directly into the Evidence Desk.

---

## Key Capabilities

1. **Explicit User Extraction**:
   - Analyzes the active Amazon.in product tab only when the user explicitly triggers the action ("Extract Active Tab Product").
   - Automatically parses ASIN, product title, current offer price, statutory MRP, seller name, and primary high-resolution product imagery.

2. **Analyst Calibration & Manual Override**:
   - Allows investigators to review and modify extracted values before initiating a scan.
   - Computes expected retail street price bands (e.g. ±15% of marketplace price) to prevent false positives from legitimate retail discounting off inflated printed MRPs.
   - Configurable authorized seller whitelist.

3. **In-Panel Investigation Triage**:
   - Queries `POST /api/beacontra/scan` on the local or production Beacontra Worker backend.
   - Surfaces data provenance (`LIVE`, `CACHE`, or `FIXTURE`), credit spend, and highest composite risk score.
   - Renders ranked listing anomalies with price, seller, and Google Lens visual co-occurrence chips.

4. **Evidence Desk Case Filing**:
   - One-click case creation (`POST /api/cases`) linking the scan snapshot and evidence observations.
   - Provides a direct link to the standalone, printable HTML investigation report (`/api/cases/:id/report`).

5. **Strict Security & Zero Extension Secrets**:
   - **Zero API keys stored in extension**: All SerpApi credentials remain exclusively on the backend Cloudflare Worker.
   - Content security: Uses Manifest V3 standards with local script isolation and no `eval` or remote script execution.
   - Full SSRF and origin protection.

---

## Installation & Testing

1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (top right toggle).
3. Click **Load unpacked** and select the `/Users/kirtan/Hackathons/Serp/extension` directory.
4. Ensure the Beacontra backend is running (`npm run dev` at `http://localhost:8787`).
5. Open an Amazon India product page (e.g., `https://www.amazon.in/dp/B09N3ZNHTY`).
6. Click the Beacontra Lens extension icon to open the Chrome Side Panel.
7. Click **Extract Active Tab Product**, inspect the fields, and click **Run Beacontra Cross-Check**.
8. Click **Save to Evidence Desk Case** and follow the link to view the complete HTML Evidence Report.
