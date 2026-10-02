# Beacontra: Live Demonstration Checklist & Rehearsal Runbook

**Event:** SerpApi India Hackathon 2026  
**Target Video Duration:** 2:30 – 2:50 (Hard ceiling: 3:00)  
**Product:** Beacontra Evidence Desk & Beacontra Lens Companion  
**Rule Compliance:** Video quality does not affect judging; live functional demonstration required; zero false counterfeit claims.

---

## 1. Pre-Demo Setup Checklist (T-Minus 15 Minutes)

- [ ] **Local Worker Server Running:**
  ```bash
  npm run dev
  # Confirms server listening at http://localhost:8787
  ```
- [ ] **Health Endpoint Verification:**
  ```bash
  curl -s http://localhost:8787/health | jq .
  # Expect: { "status": "ok", "serpApi": { "configured": true } }
  ```
- [ ] **Extension Loaded in Chromium:**
  1. Open Chrome/Chromium -> `chrome://extensions/`.
  2. Toggle **Developer mode** -> Click **Load unpacked**.
  3. Select directory: `/Users/kirtan/Hackathons/Serp/extension`.
  4. Confirm **Beacontra Lens** is active with side-panel capability.
- [ ] **Target Marketplace Tab Pre-loaded:**
  - Open Amazon India tab: `https://www.amazon.in/dp/B09N3ZNHTY` (boAt Airdopes 141) or target product page.
- [ ] **Fallback Demo Tab Open:**
  - Keep `http://localhost:8787` open in background with pre-loaded demo case `docs/evidence-report-demo.html` ready as backup if conference WiFi drops.

---

## 2. Timed Demonstration Script (Target: 2:45)

### [0:00 – 0:25] The Problem & Asymmetry
- **Action:** Show Amazon India search page with dozens of confusing audio listings.
- **Narrative:**
  > "Meesho alone took down 4.2 million counterfeit and copyright-infringing listings in six months. In India's D2C boom, small brand owners have no affordable way to know which marketplace listings are hijacking their product photos, parallel importing unverified stock, or selling unauthorized units at 80% below MRP. Enterprise brand-protection platforms cost tens of thousands of dollars. Beacontra is the evidence-first marketplace investigation desk built for the rest of us."

---

### [0:25 – 1:15] Beacontra Lens Chrome Companion in Action
- **Action:**
  1. Click the Beacontra Lens extension icon in the toolbar.
  2. The native side panel opens alongside the Amazon India product listing.
  3. Click **"Extract Active Tab Product"**.
  4. Show fields auto-populating: ASIN (`B09N3ZNHTY`), Title (`boAt Airdopes 141...`), Listing Price (`₹1,299`), MRP (`₹4,490`), Seller (`Appario Retail`), and high-res photo.
  5. Expand calibration details: show calibrated street price band (`₹1000 – ₹1500`) and authorized seller whitelist.
- **Narrative:**
  > "Meet Beacontra Lens, our Chrome companion. While browsing a suspicious or active listing, an analyst clicks 'Extract'. The extension extracts the product metadata directly from the page DOM. Notice the street price band: statutory MRP on Indian electronics is often inflated, so Beacontra allows calibrating the genuine market band to prevent false alarms on legitimate festive sales."

---

### [1:15 – 1:55] Multi-Signal Scan & Reverse-Image Verification
- **Action:**
  1. Click **"Run Beacontra Cross-Check"**.
  2. Show progress spinner (`Querying marketplace index & reverse-image matching...`).
  3. Results render: Risk Score meter (e.g. `85/100`), Anomaly Chips (`Price: severe_undercut`, `Seller: unknown_seller`, `Visual: matched`), and Recommendation banner (`High Commercial Discrepancy — Review Urgently`).
- **Narrative:**
  > "In the background, Beacontra queries SerpApi's Google Shopping engine for current live listings and feeds candidate listing photos into Google Lens for reverse-image cross-matching. This is not just an AI summary—it computes three independent deterministic signals: price variance, seller authorization, and visual co-occurrence. Every signal gives transparent, plain-English explanations."

---

### [1:55 – 2:25] Filing into Evidence Desk & Generating the Dossier
- **Action:**
  1. Click **"Save to Evidence Desk Case"**.
  2. Success alert displays: `✔ Case Saved: case_...`.
  3. Click **"Open Complete HTML Evidence Report →"**.
  4. Full-screen view of `docs/evidence-report-demo.html`:
     - Show regulatory compliance disclaimer banner.
     - Target product profile grid with official photo.
     - Marketplace findings table with risk scores.
     - Evidence observations and analyst audit trail.
  5. Click **"Print / Save as PDF"** to preview clean A4 printable document.
- **Narrative:**
  > "With one click, the analyst files the investigation into Evidence Desk. It compiles a standalone, executive-ready evidence dossier. Notice the high-contrast regulatory notice: Beacontra provides commercial anomaly risk signals for human review, strictly disclaiming legal evidentiary status. It includes full provenance timestamps, listing links, and print-ready PDF stylesheets for internal triage."

---

### [2:25 – 2:45] Why SerpApi is Indispensable & Conclusion
- **Action:** Switch back to terminal or summary slide.
- **Narrative:**
  > "Marketplace listings rotate hourly. Without SerpApi's real-time Google Shopping and Google Lens engines, there is no way to cross-verify live marketplace prices and visual image co-occurrence. Beacontra turns raw search data into verifiable, audit-ready evidence for brand owners."

---

## 3. Strict Language Discipline Guide

| NEVER USE (Disallowed Terms) | ALWAYS USE (Allowed Terms) |
|---|---|
| "Counterfeit detector" | "Marketplace listing investigation desk" |
| "Verified fake" / "Counterfeit confirmed" | "High commercial discrepancy" / "Severe price undercut" |
| "Fraudulent seller" | "Unregistered / unknown third-party seller" |
| "Legal proof of infringement" | "Technical and commercial anomaly signals for review" |
| "Stolen product image" | "Visual co-occurrence match across web sources" |

---

## 4. Troubleshooting & Fallback Procedures

| Failure Scenario | Immediate Remedy |
|---|---|
| **Conference WiFi drops during live scan:** | Do not panic. Click the pre-cached demonstration tab (`docs/evidence-report-demo.html`) and explain: *"Our backend caches all investigations with full provenance; here is the completed investigation dossier compiled from our earlier run."* |
| **Amazon India page layout changes:** | The manual calibration form allows typing product name and pasting reference image URL directly without relying on DOM extraction. |
| **SerpApi rate limit / quota exhaustion:** | The backend automatically falls back to fixture mode (`dataSource: "fixture"`), which runs deterministically with zero credits and displays all three signals. |
