#!/usr/bin/env python3
"""
Generate voiceover audio clips for each of the 9 scenes in Beacontra Master Film.
Uses edge-tts with en-US-ChristopherNeural for authoritative, calm, Apple/Linear documentary tone.
"""

import subprocess
import os
import json

VOICE = "en-US-ChristopherNeural"
OUT_DIR = "Beacontra_Edit_Project/voice"
os.makedirs(OUT_DIR, exist_ok=True)

SCENES = [
    {
        "id": "scene01",
        "title": "The Hook",
        "target_dur": 10.0,
        "text": "Every Indian D2C brand faces an overwhelming marketplace reality. Thousands of product listings across Amazon, Flipkart, and Google Shopping."
    },
    {
        "id": "scene02",
        "title": "The User Problem",
        "target_dur": 14.0,
        "text": "Unauthorized sellers, steep unauthorized discounts, and copied photography. Brand teams can find listings—but they struggle to determine which ones actually deserve investigation."
    },
    {
        "id": "scene03",
        "title": "Introduce Beacontra",
        "target_dur": 12.0,
        "text": "This is Beacontra. A visual and commercial investigation workspace that transforms live marketplace search and reverse-image matching into an evidence-backed review queue."
    },
    {
        "id": "scene04",
        "title": "Brand Vault",
        "target_dur": 18.0,
        "text": "Everything starts in the Brand Vault. Here, a brand registers its ground truth: statutory MRP, expected price bands, authorized merchants, and canonical reference photography. This benchmark prevents false alarms and anchors every subsequent scan."
    },
    {
        "id": "scene05",
        "title": "Live Market Intelligence",
        "target_dur": 28.0,
        "text": "Through SerpApi Google Shopping, Beacontra scans live e-commerce offers in real time. Our deterministic SKU normalizer automatically excludes non-comparable accessories like silicone covers and cables. Instantly, an unauthorized listing at 1,399 rupees is flagged: an 81 percent price drop against the statutory MRP."
    },
    {
        "id": "scene06",
        "title": "Visual Forensics",
        "target_dur": 22.0,
        "text": "Next, Visual Forensics submits listing thumbnails to SerpApi Google Lens. If Lens returns no matches, Beacontra is honest: it classifies the signal as neutral absence of evidence, never claiming counterfeit status without proof. The Evidence Graph unifies every factual link—connecting brands to listings, merchants, and visual clusters."
    },
    {
        "id": "scene07",
        "title": "Explain This Finding",
        "target_dur": 22.0,
        "text": "Clicking Explain This Finding opens Beacontra's transparent heuristic engine. It displays exact mathematical weights: price deviation, unauthorized merchant penalty, and visual confidence. It even runs a counterfactual simulation—showing how review priority changes if seller authorization is verified."
    },
    {
        "id": "scene08",
        "title": "From Evidence to Action",
        "target_dur": 26.0,
        "text": "Investigators can capture listings directly from the browser using the Beacontra Lens Chrome extension, or file cases into the Cases Desk. With one click, Beacontra exports a standalone, print-ready HTML dossier—complete with cryptographic provenance, timestamped evidence, and defensible audit notes for legal and compliance teams."
    },
    {
        "id": "scene09",
        "title": "The Closing",
        "target_dur": 13.0,
        "text": "SerpApi delivers the live marketplace and visual data. Beacontra turns that data into evidence you can trust. Every listing, a clearer signal."
    }
]

def get_duration(path):
    cmd = ["ffprobe", "-v", "quiet", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", path]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, text=True, check=True)
    return float(res.stdout.strip())

def main():
    metadata = []
    total_audio_dur = 0.0
    for s in SCENES:
        mp3_path = os.path.join(OUT_DIR, f"{s['id']}_vo.mp3")
        wav_path = os.path.join(OUT_DIR, f"{s['id']}_vo.wav")
        print(f"Synthesizing {s['id']}: {s['title']}...")
        cmd = ["edge-tts", "--voice", VOICE, "--text", s["text"], "--write-media", mp3_path]
        subprocess.run(cmd, check=True)
        # Convert to 48kHz stereo WAV for clean studio mixing
        cmd_wav = ["ffmpeg", "-y", "-i", mp3_path, "-ar", "48000", "-ac", "2", wav_path]
        subprocess.run(cmd_wav, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        dur = get_duration(wav_path)
        total_audio_dur += dur
        s["audio_dur"] = dur
        s["wav_path"] = wav_path
        print(f"  -> Generated {wav_path} ({dur:.2f}s, target {s['target_dur']}s)")
        metadata.append(s)

    with open(os.path.join(OUT_DIR, "scenes_audio.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\nAll voiceover audio generated successfully! Total speech duration: {total_audio_dur:.2f}s")

if __name__ == "__main__":
    main()
