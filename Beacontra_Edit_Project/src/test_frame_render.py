#!/usr/bin/env python3
"""
Test rendering a single composite frame to check visual quality.
"""

from PIL import Image, ImageDraw
import subprocess
import os

ASSETS_DIR = "Beacontra_Edit_Project/assets"

def test_composite():
    # 1. Extract a frame from the raw video (e.g. at t=25s: live SerpApi scan)
    sample_frame_path = "Beacontra_Edit_Project/renders/sample_raw_frame.png"
    os.makedirs("Beacontra_Edit_Project/renders", exist_ok=True)
    cmd = ["ffmpeg", "-y", "-ss", "25", "-i", "./Beacontra_RAW_MASTER_DEMO_2026-10-08.mp4", "-frames:v", "1", sample_frame_path]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    
    # 2. Base background
    bg = Image.open(os.path.join(ASSETS_DIR, "cinematic_bg.png")).convert("RGBA")
    
    # 3. Scale raw frame into browser window content area: 1740 x 946
    raw_img = Image.open(sample_frame_path).convert("RGBA")
    # Aspect ratio: 2844 x 1718 -> width 1740 -> height ~1051 -> crop top/bottom slightly
    target_w = 1740
    target_h = int(1740 * (1718 / 2844))
    raw_scaled = raw_img.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    # Crop to 1740 x 946
    crop_y = (target_h - 946) // 2
    raw_cropped = raw_scaled.crop((0, crop_y, 1740, crop_y + 946))
    
    # Paste video into window content area (x=90, y=84)
    bg.paste(raw_cropped, (90, 84))
    
    # 4. Paste browser frame overlay (window titlebar, border, traffic dots)
    frame_overlay = Image.open(os.path.join(ASSETS_DIR, "browser_frame_overlay.png")).convert("RGBA")
    bg.alpha_composite(frame_overlay)
    
    # 5. Paste scene badge
    badge = Image.open(os.path.join(ASSETS_DIR, "badge_scene05.png")).convert("RGBA")
    bg.alpha_composite(badge)
    
    out_path = "Beacontra_Edit_Project/renders/sample_composite.png"
    bg.save(out_path)
    print(f"Sample composite frame saved to: {out_path}")

if __name__ == "__main__":
    test_composite()
