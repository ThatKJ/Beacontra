# Beacontra — Master Demo Film Script & Scene Architecture

**Submission:** SerpApi India Hackathon 2026  
**Product:** Beacontra (`https://github.com/ThatKJ/Beacontra`)  
**Tagline:** Marketplace evidence, in focus  
**Master Film Target:** 2 minutes 45 seconds (Hard limit: < 3:00)  
**Exported Duration:** 2 minutes 48.5 seconds (`02:48.50` / `168.50s`)  
**Resolution / Codec:** 1920 × 1080 (Full HD 1080p, 16:9), H.264 High Profile @ 30fps, AAC Stereo 48kHz  

---

## Creative Direction & Narrative Arc

### The Core Premise
A small Indian direct-to-consumer (D2C) brand owner discovers a potentially problematic marketplace listing, uses Beacontra to investigate it, and ends with an understandable, evidence-backed report.

### The Three Evidentiary Pillars
1. **Beacontra addresses a genuine problem for small brands:** An overwhelming marketplace reality where unauthorized sellers, deep discounts, and cloned product photos create chaos.
2. **SerpApi is fundamentally necessary:** Powers live marketplace discovery across Indian e-commerce channels (`google_shopping`) and reverse-image visual forensics (`google_lens`).
3. **Beacontra transforms raw search data into a usable investigation:** Normalizes variants, checks against registered brand ground truth, provides transparent heuristic weights, simulates counterfactuals, and exports cryptographically defensible standalone HTML dossiers.

---

## Scene-by-Scene Timeline

### SCENE 01 — THE HOOK
- **Timecode:** `00:00.00 – 00:12.00` (12.0s)
- **Visual:** Dark cinematic frame (`#080C12`). Glowing radar beacon reticle in center. Smooth text animation.
  - `00:00.00 – 00:04.50`: *"Your brand is everywhere."* Subtitle: *INDIAN D2C & MARKETPLACE BRAND OBSERVATION*
  - `00:04.50 – 00:08.50`: Crossfade to *"But can you verify what you're seeing?"* Subtitle: *AMAZON · FLIPKART · GOOGLE SHOPPING · MYNTRA*
  - `00:08.50 – 00:12.00`: Crossfade to floating browser frame showing genuine marketplace listing.
- **On-Screen Typography:**
  - `YOUR BRAND IS EVERYWHERE.`
  - `BUT CAN YOU VERIFY WHAT YOU'RE SEEING?`
- **Sound Design:**
  - `00:00.30`: Low-frequency 40Hz sub-bass impact (`sfx_sub_impact.wav`).
  - Warm analog synth pad in D minor swells in background.
- **Narration (Spoken 00:00.80 – 00:11.65):**
  > *"Every Indian D2C brand faces an overwhelming marketplace reality. Thousands of product listings across Amazon, Flipkart, and Google Shopping."*

---

### SCENE 02 — THE USER'S PROBLEM
- **Timecode:** `00:12.00 – 00:26.00` (14.0s)
- **Visual:** Floating browser window displaying captured unverified marketplace listing on Amazon.in (boAt Nirvana Ion). Refined callout overlays highlight three anomalies:
  - Callout 1 (Top-Right): `SIGNAL 01: PRICE DEVIATION` — *₹1,399 vs ₹7,990 Statutory MRP (-81% Deviation)*
  - Callout 2 (Mid-Right): `SIGNAL 02: MERCHANT STATUS` — *Seller: FABGIZMOZ (Unauthorized)*
  - Callout 3 (Low-Right): `SIGNAL 03: VISUAL RECORD` — *Canonical Product Image Used (Reverse match required)*
  - Bottom Banner: *Is this the right product? · Is this price unusual? · Where did this image appear?*
- **On-Screen Typography:**
  - `⚠️ UNVERIFIED MARKETPLACE LISTING`
  - `Is this the right product?  ·  Is this price unusual?  ·  Where did this image appear?`
- **Sound Design:**
  - `00:11.50`: Soft directional transition whoosh (`sfx_transition_whoosh.wav`).
  - Rhythmic electronic pulse introduces pacing.
- **Narration (Spoken 00:12.80 – 00:25.30):**
  > *"Unauthorized sellers, steep unauthorized discounts, and copied photography. Brand teams can find listings—but they struggle to determine which ones actually deserve investigation."*

---

### SCENE 03 — INTRODUCE BEACONTRA
- **Timecode:** `00:26.00 – 00:38.00` (12.0s)
- **Visual:**
  - `00:26.00 – 00:29.50`: Clean Beacontra title reveal card. Radar beacon reticle mark with signal lime (`#C9E6A6`) and tactile sage (`#8FBF9A`). Headline: *BEACONTRA*. Subheadline: *Marketplace intelligence. Built around evidence.* Pill: *⚡ POWERED BY SERPAPI*.
  - `00:29.50 – 00:38.00`: Crossfade into Beacontra OS Overview interface (`00:01 – 00:09` in raw footage) inside a floating browser frame. Focus on the boAt Nirvana Ion reference photo and the three core measurement stations: Price Signal, Visual Signal, Seller Signal.
- **On-Screen Typography:**
  - `BEACONTRA`
  - `Marketplace intelligence. Built around evidence.`
  - `⚡ POWERED BY SERPAPI`
- **Sound Design:**
  - `00:26.20`: Resonant cinematic sub-bass impact.
  - `00:29.20`: Transition whoosh settling into dashboard.
- **Narration (Spoken 00:26.60 – 00:37.42):**
  > *"This is Beacontra. A visual and commercial investigation workspace that transforms live marketplace search and reverse-image matching into an evidence-backed review queue."*

---

### SCENE 04 — FROM PRODUCT TO INVESTIGATION (BRAND VAULT)
- **Timecode:** `00:38.00 – 00:57.00` (19.0s)
- **Visual:** Authentic Brand Vault catalog (`00:56 – 01:15` in raw footage).
  - Registered brand ground truth: *boAt Nirvana Ion* and *boAt Airdopes 141*.
  - Displays Statutory MRP (`₹7,990` / `₹4,490`), retail price bands, authorized seller whitelist, and official canonical product photography.
  - Cursor clicks *"Scan in Radar →"*, automatically passing parameters into Market Radar.
- **On-Screen Overlay:**
  - Top badge: `BRAND VAULT · 01 / ESTABLISH THE REFERENCE GROUND TRUTH`
- **Sound Design:**
  - `00:37.80`: Soft transition whoosh.
  - `00:46.50`: Tactile interface click (`sfx_ui_click.wav`).
- **Narration (Spoken 00:38.50 – 00:56.43):**
  > *"Everything starts in the Brand Vault. Here, a brand registers its ground truth: statutory MRP, expected price bands, authorized merchants, and canonical reference photography. This benchmark prevents false alarms and anchors every subsequent scan."*

---

### SCENE 05 — LIVE MARKET INTELLIGENCE (SERPAPI SCAN & RADAR)
- **Timecode:** `00:57.00 – 01:23.50` (26.5s)
- **Visual:** Genuine SerpApi-powered workflow (`00:12 – 00:43` and `01:06 – 01:09` in raw footage).
  - Clicking *"Run Investigation Scan"*.
  - Authentic live progress state: *Querying SerpApi Google Shopping... Querying SerpApi Google Lens...*
  - Live verification badge: `SERPAPI RESULT · Live API mode` with real-time credit counter.
  - 19 live marketplace listings populate the queue across Indian platforms.
  - Market Radar baseline visualization: ₹7,990 MRP vs ₹1,799 median market price.
  - Automated variant normalizer excludes silicone cases and cables, highlighting the unauthorized ₹1,399 listing (-81% vs MRP).
- **On-Screen Overlay:**
  - Top badge: `LIVE MARKET SCAN · POWERED BY SERPAPI · GOOGLE SHOPPING`
- **Sound Design:**
  - `00:56.80`: Transition whoosh.
  - `00:58.20`: Scan button click.
  - `01:09.50`: Clean dual-tone confirmation chime (`sfx_confirmation_chime.wav`) as results land.
- **Narration (Spoken 00:57.80 – 01:21.37):**
  > *"Through SerpApi Google Shopping, Beacontra scans live e-commerce offers in real time. Our deterministic SKU normalizer automatically excludes non-comparable accessories like silicone covers and cables. Instantly, an unauthorized listing at 1,399 rupees is flagged: an 81 percent price drop against the statutory MRP."*

---

### SCENE 06 — VISUAL FORENSICS & EVIDENCE GRAPH
- **Timecode:** `01:23.50 – 01:49.50` (26.0s)
- **Visual:**
  - `01:23.50 – 01:38.00`: Visual Forensics inspection drawer (`00:43 – 00:58` in raw footage). Dual-image comparison: official boAt reference photo on left, marketplace listing thumbnail on right. Google Lens search returns 320 records. Preserves honest neutral labeling when conclusive match is absent.
  - `01:38.00 – 01:49.50`: Evidence Graph bipartite network (`01:34 – 01:45` in raw footage). Interactive graph nodes connecting Brands → Products → Listings → Merchants → Visual Clusters. Clicking a node opens the Node Inspector showing factual edge lineage.
- **On-Screen Overlay:**
  - Top badge: `VISUAL FORENSICS · 02 / FOLLOW THE VISUAL EVIDENCE · GOOGLE LENS`
- **Sound Design:**
  - `01:23.20`: Transition whoosh.
  - `01:38.50`: Tactile interface click on graph node.
- **Narration (Spoken 01:24.10 – 01:47.98):**
  > *"Next, Visual Forensics submits listing thumbnails to SerpApi Google Lens. If Lens returns no matches, Beacontra is honest: it classifies the signal as neutral absence of evidence, never claiming counterfeit status without proof. The Evidence Graph unifies every factual link—connecting brands to listings, merchants, and visual clusters."*

---

### SCENE 07 — UNDERSTAND THE FINDINGS (EXPLAIN THIS FINDING)
- **Timecode:** `01:49.50 – 02:11.50` (22.0s)
- **Visual:** *"Explain This Finding"* modal (`01:09.5 – 01:24.0` in raw footage).
  - Heuristic breakdown displaying deterministic mathematical weights: price deviation score, unauthorized seller penalty, visual confidence.
  - Counterfactual simulation slider: demonstrates how verifying seller authorization reduces the review priority score from High to Low.
  - Recommended action playbook (formal marketplace takedown / authorized merchant channel inquiry).
- **On-Screen Overlay:**
  - Top badge: `EXPLAIN THIS FINDING · NOT JUST A SCORE · THE REASONING BEHIND IT`
- **Sound Design:**
  - `01:49.20`: Transition whoosh.
  - Atmospheric ambient build in soundtrack.
- **Narration (Spoken 01:50.00 – 02:10.52):**
  > *"Clicking Explain This Finding opens Beacontra's transparent heuristic engine. It displays exact mathematical weights: price deviation, unauthorized merchant penalty, and visual confidence. It even runs a counterfactual simulation—showing how review priority changes if seller authorization is verified."*

---

### SCENE 08 — FROM EVIDENCE TO ACTION (CASES DESK & HTML DOSSIER)
- **Timecode:** `02:11.50 – 02:35.50` (24.0s)
- **Visual:**
  - `02:11.50 – 02:21.00`: Beacontra Lens 2.0 Chrome extension sidepanel (`01:47 – 01:57` in raw footage). One-click marketplace listing extraction directly from browser tab, linking to Brand Vault DNA.
  - `02:21.00 – 02:35.50`: Cases Desk (`01:21 – 01:35` in raw footage). Filing case docket #CASE_1791433328187_QW998U. Clicking *"Export Standalone HTML Report"*. Slow cinematic reveal of rendered printable standalone HTML dossier (`docs/evidence-report-demo.html`) featuring cryptographic SHA-256 provenance hash, timestamps, dual-photo forensics, and legal disclaimers.
- **On-Screen Overlay:**
  - Top badge: `STANDALONE DOSSIER · EVIDENCE YOU CAN ACTUALLY REVIEW`
- **Sound Design:**
  - `02:11.20`: Transition whoosh.
  - `02:23.50`: Confirmation chime as standalone dossier exports.
- **Narration (Spoken 02:12.00 – 02:33.98):**
  > *"Investigators can capture listings directly from the browser using the Beacontra Lens Chrome extension, or file cases into the Cases Desk. With one click, Beacontra exports a standalone, print-ready HTML dossier—complete with cryptographic provenance, timestamped evidence, and defensible audit notes for legal and compliance teams."*

---

### SCENE 09 — THE CLOSING
- **Timecode:** `02:35.50 – 02:48.50` (13.0s)
- **Visual:**
  - `02:35.50 – 02:40.50`: Seamless navigation sweep montage (`02:06 – 02:11.5` in raw footage) across Overview → Brand Vault → Market Radar → Evidence Graph → Watchtower → Cases Desk, smoothly pulling back into the dark charcoal frame.
  - `02:40.50 – 02:48.50`: Final title reveal card. Glowing radar beacon reticle. Tagline: *"Every listing. A clearer signal."* Brand wordmark: *BEACONTRA*. Hackathon attribution: *Built for SerpApi India Hackathon 2026*. Repository URL: `github.com/ThatKJ/Beacontra`. Elegant fade to black at `02:47.50`.
- **On-Screen Typography:**
  - `Every listing. A clearer signal.`
  - `BEACONTRA`
  - `Built for SerpApi India Hackathon 2026`
  - `github.com/ThatKJ/Beacontra`
- **Sound Design:**
  - `02:35.20`: Transition whoosh.
  - `02:40.50`: Resonant sub-bass resolution.
  - Ambient soundtrack resolves gently into silence.
- **Narration (Spoken 02:36.00 – 02:47.26):**
  > *"SerpApi delivers the live marketplace and visual data. Beacontra turns that data into evidence you can trust. Every listing, a clearer signal."*
