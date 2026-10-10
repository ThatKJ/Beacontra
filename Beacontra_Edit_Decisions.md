# Beacontra — Edit Decisions & Raw Footage Mapping

**File:** `Beacontra_Edit_Decisions.md`  
**Raw Source:** `Beacontra_RAW_MASTER_DEMO_2026-10-08.mp4` (Duration: 141.14s, Resolution: 2844×1718, 20.13 fps variable)  
**Final Master:** `Beacontra_Hackathon_Final.mp4` (Duration: 168.50s / 2:48.5, Resolution: 1920×1080, 30.00 fps constant)  

---

## 1. Master Timeline to Raw Recording Mapping

| Final Scene | Final Timecode | Final Dur | Raw Source Timecode | Raw Module / Action Captured | Edit / Framing Rationale |
|:---|:---|:---|:---|:---|:---|
| **Scene 01: The Hook** | `00:00.00 – 00:12.00` | 12.0s | `01:43.0 – 01:47.0` (for final 3.5s) | Marketplace product listing on Amazon.in | Establishes the real-world problem before software UI. Uses custom animated typography over dark ink background, crossfading into the unverified listing. |
| **Scene 02: The User Problem** | `00:12.00 – 00:26.00` | 14.0s | `01:44.0 – 01:58.0` | Amazon.in listing for boAt Nirvana Ion (₹1,399, seller FABGIZMOZ) | Overlaid with Linear-style callout brackets pointing to Price (-81%), Seller (unauthorized), and Image. Illustrative of brand owner dilemma. |
| **Scene 03: Introduce Beacontra** | `00:26.00 – 00:38.00` | 12.0s | `00:01.0 – 00:09.5` (from 00:29.5) | Overview hero interface: boAt Nirvana Ion reference photo & 3 signal stations | 3.5s dedicated Beacontra title reveal card settling into Overview dashboard in floating browser frame. |
| **Scene 04: Brand Vault** | `00:38.00 – 00:57.00` | 19.0s | `00:56.0 – 01:15.0` | Brand Vault catalog: boAt products, statutory MRP, authorized merchants, canonical photos | Establishes brand ground truth. Shows one-click transfer from Brand Vault into Market Radar. Badge: `01 / ESTABLISH THE REFERENCE GROUND TRUTH`. |
| **Scene 05: Live Market Intelligence** | `00:57.00 – 01:23.50` | 26.5s | `00:12.0 – 00:25.0` + `00:33.0 – 00:43.0` + `01:06.0 – 01:09.5` | Live investigation scan submission, loading state, SerpApi badge, 19 listings return, Radar baseline | Trims dead waiting time during API roundtrip while preserving the authentic loading indicator, `SERPAPI RESULT · Live API mode` badge, and credit counter. Highlights ₹1,399 flagged listing. |
| **Scene 06: Visual Forensics & Graph** | `01:23.50 – 01:49.50` | 26.0s | `00:43.0 – 00:58.0` + `01:34.0 – 01:45.5` | Visual Forensics dual-image panel (320 Lens records) + Evidence Graph bipartite network | Connects dual-image inspection (official vs listing thumbnail) with honest neutral labeling directly into Evidence Graph node lineage. |
| **Scene 07: Explain This Finding** | `01:49.50 – 02:11.50` | 22.0s | `01:09.5 – 01:21.5` + `01:13.5 – 01:24.0` | "Explain This Finding" heuristic weights modal & counterfactual simulation slider | Gives ample viewing time for judges to read the exact mathematical weights (price deviation, seller penalty, visual confidence) and counterfactual toggle. |
| **Scene 08: From Evidence to Action** | `02:11.50 – 02:35.50` | 24.0s | `01:47.0 – 01:57.0` + `01:21.0 – 01:35.5` | Beacontra Lens Chrome sidepanel + Cases Desk & Standalone HTML Dossier export | Shows extension extraction directly from marketplace, followed by filing to Cases Desk and viewing the print-ready HTML dossier with cryptographic hash. |
| **Scene 09: The Closing** | `02:35.50 – 02:48.50` | 13.0s | `02:06.0 – 02:11.5` (for first 5.0s) | Multi-module sweep across all tabs (Overview → Vault → Radar → Graph → Watchtower → Cases) | Elegant camera pull-back settling into Beacontra logo reticle mark, tagline, SerpApi attribution, and GitHub repository URL, with gentle fade to black. |

---

## 2. Hard Editorial Rules Enforced

1. **Zero Fabricated Findings:**  
   Every single UI screen, price number, listing title, and seller name shown in the video came directly from the real application running on `localhost:8787` recorded in `Beacontra_RAW_MASTER_DEMO_2026-10-08.mp4`. No simulated fake mockups were substituted.

2. **Strict Language Discipline (No False Legal Claims):**  
   The narration and on-screen overlays strictly adhere to the project's legal guideline: Beacontra provides *commercial anomalies* and *brand-risk signals* for human review. It does not claim to prove counterfeit status or legal fraud without forensic physical verification.

3. **Honest Inconclusive Evidence Handling:**  
   When Google Lens returns no exact structured matches, the video explicitly highlights that Beacontra classifies this as *neutral absence of evidence* rather than manufacturing false counterfeit certainty.

4. **Preserved Provenance & Credit Transparency:**  
   The live SerpApi scan scene clearly displays the `SERPAPI RESULT · Live API mode` badge and real-time credit consumption counter. No fixture data is represented as live.

5. **Pure Window Capture Aesthetics:**  
   All footage is framed inside a floating, rounded browser window (1760×1000) with subtle macOS traffic dots and address bar pill, set against a deep slate ink background (`#080C12`) with soft central radial lighting. No cluttered desktop icons or OS menu bars are visible.

---

## 3. Audio & Sound Design Architecture

1. **Voiceover Narration:**  
   Generated using `edge-tts` with voice model `en-US-ChristopherNeural` (News/Documentary/Authority profile). Measured, clear, calm delivery tailored to the style of Apple keynote and Linear launch films.

2. **Custom Minimal Electronic Soundtrack:**  
   Synthesized mathematically in 48kHz 16-bit stereo (`generate_soundtrack.py`).
   - Progression in D minor / F major (D3, F3, A3, C4).
   - Evolving analog detuned sawtooth pads with soft low-pass filter saturation.
   - Deep sub-bass pulse at 55Hz / 43Hz every 3.5s.
   - Sparse crystalline arpeggio bell tones (587Hz–1046Hz) providing subtle momentum.
   - Dynamic volume automation: sidechain ducked to 0.28 during voiceover, swelling to 0.65 during scene reveals and transitions.

3. **Tactile Sound Design (SFX):**  
   - `sfx_sub_impact.wav`: 40Hz resonant boom at scene reveals.
   - `sfx_transition_whoosh.wav`: Soft filtered stereo whoosh at major cuts.
   - `sfx_ui_click.wav`: Subtle haptic interface click on button presses.
   - `sfx_confirmation_chime.wav`: Pristine two-tone crystal chime (E6 → B6) when SerpApi search results land and when the HTML dossier is exported.
   - Master mixed to -1.0 dBFS peak with broadcast-compliant dynamic range.
