# Beacontra Edit Project — Production Suite

This directory contains the complete, reproducible video post-production pipeline used to transform the raw screen recording (`Beacontra_RAW_MASTER_DEMO_2026-10-08.mp4`) into the final submission film (`Beacontra_Hackathon_Final.mp4`) for the SerpApi India Hackathon 2026.

---

## Directory Structure

```
Beacontra_Edit_Project/
├── build.sh                     # One-click master shell runner
├── README.md                    # Project documentation
├── src/
│   ├── generate_graphics.py     # Renders 1080p overlays, browser frames, badges, title cards
│   ├── generate_voiceover.py    # Generates neural voiceover clips via edge-tts (Christopher voice)
│   ├── generate_soundtrack.py   # Synthesizes 48kHz stereo electronic score and tactile SFX
│   ├── render_modular_scenes.py # Renders atomic 30fps clips and composites the 9 master scenes
│   ├── build_audio_track.py     # Mixes voice, soundtrack, and SFX with dynamic sidechain ducking
│   └── assemble_final_film.py   # Concatenates scenes and multiplexes AAC audio to final master MP4
├── assets/                      # Generated graphics, PNG overlays, title cards, background plates
├── voice/                       # Synthesized 48kHz WAV speech clips (Scenes 1–9)
├── music/                       # Synthesized ambient electronic soundtrack
├── sfx/                         # Tactile SFX (sub impact, transition whoosh, UI click, chime)
├── clips/                       # Rendered 1080p @ 30fps MP4 video clips (scene01.mp4 – scene09.mp4)
└── renders/                     # Intermediate composite parts, master audio track, contact sheet
```

---

## Quickstart: Rebuilding the Master Film

To rebuild the entire master film from scratch:

```bash
./Beacontra_Edit_Project/build.sh
```

Or run individual pipeline stages:

1. **Regenerate Graphics:** `python3 Beacontra_Edit_Project/src/generate_graphics.py`
2. **Regenerate Voiceover:** `python3 Beacontra_Edit_Project/src/generate_voiceover.py`
3. **Regenerate Soundtrack & SFX:** `python3 Beacontra_Edit_Project/src/generate_soundtrack.py`
4. **Re-render Scene Clips:** `python3 Beacontra_Edit_Project/src/render_modular_scenes.py`
5. **Re-mix Master Audio:** `python3 Beacontra_Edit_Project/src/build_audio_track.py`
6. **Re-assemble Master Film:** `python3 Beacontra_Edit_Project/src/assemble_final_film.py`

---

## Technical Dependencies

- **FFmpeg 9.0+** with `libx264` and `aac` enabled
- **Python 3.10+** with `numpy` and `Pillow`
- **edge-tts** (`pip install edge-tts`)
- **System Fonts:** Standard macOS supplemental fonts (`Arial.ttf` / `Arial Bold.ttf`)

---

## Master Output Specs

- **File:** `Beacontra_Hackathon_Final.mp4`
- **Duration:** 168.50s (2 minutes 48.5 seconds) — strictly `< 3:00`
- **Resolution:** 1920 × 1080 (16:9 Full HD)
- **Framerate:** 30.00 fps constant progressive
- **Video Codec:** H.264 High Profile (CRF 18)
- **Audio Codec:** AAC-LC Stereo @ 48kHz, 256 kbps
- **Web Optimization:** Faststart enabled (`moov` atom at start)
