#!/usr/bin/env bash
# ==============================================================================
# Beacontra Master Demo Film — End-to-End Automated Pipeline
# Produces: Beacontra_Hackathon_Final.mp4 (1080p @ 30fps, ~2m48s)
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${PROJECT_ROOT}"

echo "======================================================================"
echo "🎬 BEACONTRA — CINEMATIC HACKATHON DEMO FILM BUILDER"
echo "======================================================================"

echo ""
echo "▶ STEP 1: Generating high-resolution graphic assets & overlays..."
python3 Beacontra_Edit_Project/src/generate_graphics.py

echo ""
echo "▶ STEP 2: Synthesizing neural documentary voiceover (9 scenes)..."
python3 Beacontra_Edit_Project/src/generate_voiceover.py

echo ""
echo "▶ STEP 3: Synthesizing bespoke atmospheric soundtrack & SFX..."
python3 Beacontra_Edit_Project/src/generate_soundtrack.py

echo ""
echo "▶ STEP 4: Rendering all 9 scene video clips with browser framing..."
python3 Beacontra_Edit_Project/src/render_modular_scenes.py

echo ""
echo "▶ STEP 5: Mixing master audio track with dynamic ducking..."
python3 Beacontra_Edit_Project/src/build_audio_track.py

echo ""
echo "▶ STEP 6: Assembling final master film & multiplexing..."
python3 Beacontra_Edit_Project/src/assemble_final_film.py

echo ""
echo "======================================================================"
echo "✅ MASTER FILM BUILD COMPLETE: Beacontra_Hackathon_Final.mp4"
echo "======================================================================"
ffprobe -v error -show_entries format=duration,size,bit_rate -of default=noprint_wrappers=1 Beacontra_Hackathon_Final.mp4
