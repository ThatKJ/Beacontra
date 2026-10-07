# Beacontra OS — 3-Minute Video Demo Script

**Target Duration:** 2 minutes 58 seconds (Strictly < 3:00)  
**Host Environment:** Local machine running `npm run dev` at `http://localhost:8787`  
**Recording Mode:** Full-screen browser window (1440x900 or 1920x1080), clean desktop, system audio muted, crisp voiceover.

---

## Preparation Checklist Before Recording

1. Ensure the dev server is active:
   ```bash
   npm run dev
   ```
2. Open `http://localhost:8787` in Google Chrome.
3. Have `docs/evidence-report-demo.html` available or ready to open in a tab.
4. Verify browser zoom is at 100%, developer console is closed.

---

## Timed Scene-by-Scene Script

### 0:00 – 0:15 | Scene 1: The Problem
- **Visual:** Display the browser showing `http://localhost:8787` hero section.
- **Action:** Smooth mouse scroll down to the problem overview / editorial illustration.
- **Narration:**
  > *"Every Indian D2C brand faces an overwhelming marketplace reality. Millions of listings on Amazon, Flipkart, and Google Shopping—unauthorized sellers, steep unauthorized discounts, and hijacked product photography. Brand protection teams can find listings, but they struggle to determine which ones actually deserve investigation."*

---

### 0:15 – 0:30 | Scene 2: Introduce Beacontra
- **Visual:** Move cursor to the Beacontra OS navigation bar at the top of the screen.
- **Action:** Highlight the unified OS module bar (`Overview`, `Brand Vault`, `Market Radar`, `Evidence Graph`, `Watchtower`, `Cases Desk`).
- **Narration:**
  > *"This is Beacontra OS. Beacontra turns live marketplace search and reverse-image matching into an evidence-backed brand investigation workspace. Instead of relying on guesswork or opaque AI summaries, Beacontra connects live market observations to verified brand ground truth."*

---

### 0:30 – 0:55 | Scene 3: Brand Vault (Ground Truth)
- **Visual:** Click on the **Brand Vault** module button in the top navigation.
- **Action:** The Brand Vault view displays the registered product catalog. Point to the *boAt Airdopes 141* profile showing statutory MRP (₹4,490), expected street price band (₹1,000–₹1,500), authorized sellers list, and the official canonical product photo.
- **Narration:**
  > *"Everything starts in the Brand Vault. Here, a brand registers its ground truth: official product identifiers, statutory MRP, authorized retail price bands, approved merchants, and canonical reference photography. This benchmark prevents false alarms and anchors every subsequent scan."*
- **Action:** Click **"Scan in Radar →"** on the product card.

---

### 0:55 – 1:30 | Scene 4: Market Radar (Live Listing Discovery)
- **Visual:** Smooth transition into the **Market Radar** module.
- **Action:** Form auto-fills with product parameters. Click **"Run Market Radar Scan"** (or use the instant cached live replay).
- **Visual:** The live listing table populates with offers across Flipkart, Amazon, Myntra, and Reliance Digital.
- **Action:** Hover over the variant filter indicator and price anomaly tags.
- **Narration:**
  > *"Market Radar queries SerpApi Google Shopping across Indian e-commerce platforms. Notice our deterministic SKU normalizer in action: it automatically filters out accessories like silicone covers and cables so they don't skew the comparison. Here, a listing at ₹1,399 is flagged: a 69% deviation against the statutory MRP, offered by an unauthorized third-party seller."*

---

### 1:30 – 2:00 | Scene 5: Visual Forensics & Evidence Graph
- **Visual:** Click to expand the listing's Visual Forensics panel, then switch to the **Evidence Graph** module.
- **Action:** Show the Google Lens visual card.
- **Narration:**
  > *"Next, Visual Forensics passes candidate listing thumbnails to SerpApi Google Lens. If Google Lens returns no structured matches for a thumbnail, Beacontra is honest: it classifies the signal as neutral 'no evidence' rather than manufacturing a false match.*
  > *Opening the Evidence Graph, we see the complete bipartite relationship: our brand connects to products, which link to live listings, merchant storefronts, and reverse-image evidence clusters."*

---

### 2:00 – 2:30 | Scene 6: Investigation & "Explain This Finding"
- **Visual:** Click on a high-priority listing node or row to open the **Investigation Inspector**.
- **Action:** Click **"Explain This Finding"**. The drawer reveals the deterministic rule breakdown, counterfactual simulation, and recommended action playbook.
- **Narration:**
  > *"Clicking 'Explain This Finding' opens our transparent heuristic engine. It shows exact mathematical weights: price deviation score, unauthorized seller penalty, and visual evidence confidence. It even runs a counterfactual simulation: what happens if this seller verifies their authorization? And it suggests a concrete action playbook—such as initiating a formal marketplace takedown."*
- **Action:** Click **"File to Cases Desk"**.

---

### 2:30 – 2:50 | Scene 7: Evidence Desk & Dossier Export
- **Visual:** Navigate to **Cases Desk**.
- **Action:** Show the active case docket. Click **"Download HTML Dossier"** and view the rendered standalone report (`docs/evidence-report-demo.html`).
- **Visual:** Display the clean, print-ready standalone HTML report complete with timestamped provenance, listing data, thumbnail comparisons, analyst notes, and legal disclaimers.
- **Narration:**
  > *"In the Cases Desk, the finding becomes a tracked investigation docket. With one click, an investigator can export a standalone, print-ready HTML dossier. It packages complete cryptographic provenance, listing metadata, and audit notes into a defensible document ready for legal counsel or marketplace compliance teams."*

---

### 2:50 – 2:58 | Scene 8: Closing Statement
- **Visual:** Return to the Beacontra OS dashboard showing the unified interface.
- **Narration:**
  > *"SerpApi gives Beacontra the live market and visual evidence. Beacontra turns that evidence into an investigation a brand can actually review."*
- **Action:** Fade out or pause cursor at 2:58.

---

## Recording Tips

1. **Pacing:** Speak deliberately and clearly. Practice transitions to keep scene changes under 3 seconds.
2. **Cursor Discipline:** Move the mouse deliberately. Avoid rapid circular gestures or idle jiggling.
3. **No Fluff:** Do not spend time reading raw JSON or opening command-line terminal windows during the video. Keep the screen focused entirely on the working product interface.
4. **Time Checkpoints:**
   - 0:30 — Must be entering Brand Vault.
   - 0:55 — Must be in Market Radar.
   - 1:30 — Must be showing Visual Forensics / Evidence Graph.
   - 2:00 — Must be in Explain This Finding.
   - 2:30 — Must be showing the HTML Dossier.
   - 2:50 — Begin final closing sentence.
