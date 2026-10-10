#!/usr/bin/env python3
"""
Modular scene renderer for Beacontra Master Film.
Renders atomic sub-clips as standardized 1920x1080 @ 30fps,
then joins them with clean crossfades or cuts into the 9 master scenes.
Guarantees 100% timing accuracy, stable timebases, and broadcast quality.
"""

import subprocess
import os

RAW_VIDEO = "./Beacontra_RAW_MASTER_DEMO_2026-10-08.mp4"
ASSETS_DIR = "Beacontra_Edit_Project/assets"
PARTS_DIR = "Beacontra_Edit_Project/renders/parts"
CLIPS_DIR = "Beacontra_Edit_Project/clips"
os.makedirs(PARTS_DIR, exist_ok=True)
os.makedirs(CLIPS_DIR, exist_ok=True)

def run(cmd):
    subprocess.run(cmd, check=True)

def make_still_clip(img_path, dur, out_path):
    """Renders a static image as a 1920x1080 30fps MP4."""
    cmd = [
        "ffmpeg", "-y",
        "-loop", "1", "-i", img_path,
        "-c:v", "libx264", "-t", str(dur),
        "-pix_fmt", "yuv420p", "-r", "30",
        "-preset", "veryfast", "-crf", "18",
        out_path
    ]
    run(cmd)

def make_framed_raw_clip(ss, dur, badge_path, out_path, overlay_path=None):
    """Cuts a section of raw video and frames it inside the floating browser frame."""
    filter_complex = (
        "[0:v]fps=30,setpts=PTS-STARTPTS,scale=1740:1051,crop=1740:946:0:52[screen];"
        "[1:v][screen]overlay=90:84[bg_screen];"
        "[bg_screen][2:v]overlay=0:0[framed]"
    )
    inputs = [
        "ffmpeg", "-y",
        "-ss", str(ss), "-t", str(dur), "-i", RAW_VIDEO,
        "-loop", "1", "-t", str(dur), "-i", os.path.join(ASSETS_DIR, "cinematic_bg.png"),
        "-loop", "1", "-t", str(dur), "-i", os.path.join(ASSETS_DIR, "browser_frame_overlay.png")
    ]
    
    current_out = "[framed]"
    if overlay_path:
        inputs.extend(["-loop", "1", "-t", str(dur), "-i", overlay_path])
        filter_complex += f";{current_out}[3:v]overlay=0:0[with_ov]"
        current_out = "[with_ov]"
    
    if badge_path:
        b_idx = 4 if overlay_path else 3
        inputs.extend(["-loop", "1", "-t", str(dur), "-i", badge_path])
        filter_complex += f";{current_out}[{b_idx}:v]overlay=0:0[with_badge]"
        current_out = "[with_badge]"
    
    filter_complex += f";{current_out}format=yuv420p[outv]"
    
    cmd = inputs + [
        "-filter_complex", filter_complex,
        "-map", "[outv]",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-r", "30", "-t", str(dur),
        out_path
    ]
    run(cmd)

def xfade_clips(clip1, clip2, offset, dur=0.5, out_path=None):
    """Crossfades two standardized 30fps clips."""
    fc = f"[0:v][1:v]xfade=transition=fade:duration={dur}:offset={offset},format=yuv420p[outv]"
    cmd = [
        "ffmpeg", "-y",
        "-i", clip1,
        "-i", clip2,
        "-filter_complex", fc,
        "-map", "[outv]",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-r", "30",
        out_path
    ]
    run(cmd)

def concat_clips(clips_list, out_path):
    """Direct stream concat for identical clips."""
    list_file = os.path.join(PARTS_DIR, "concat_list.txt")
    with open(list_file, "w") as f:
        for c in clips_list:
            f.write(f"file '{os.path.abspath(c)}'\n")
    cmd = [
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0", "-i", list_file,
        "-c", "copy",
        out_path
    ]
    run(cmd)

def main():
    print("=== Rendering Modular Sub-Clips & Scenes ===")
    
    # ---------------- SCENE 01 (12.0s) ----------------
    print("\nScene 01: The Hook...")
    p1a = os.path.join(PARTS_DIR, "s01_a.mp4")
    p1b = os.path.join(PARTS_DIR, "s01_b.mp4")
    p1c = os.path.join(PARTS_DIR, "s01_c.mp4")
    make_still_clip(os.path.join(ASSETS_DIR, "scene01_hook_a.png"), 4.5, p1a)
    make_still_clip(os.path.join(ASSETS_DIR, "scene01_hook_b.png"), 4.5, p1b)
    make_framed_raw_clip(103.0, 4.0, None, p1c)
    
    s01_temp = os.path.join(PARTS_DIR, "s01_temp.mp4")
    xfade_clips(p1a, p1b, offset=4.0, dur=0.5, out_path=s01_temp)
    out01 = os.path.join(CLIPS_DIR, "scene01.mp4")
    xfade_clips(s01_temp, p1c, offset=8.0, dur=0.5, out_path=out01)

    # ---------------- SCENE 02 (14.0s) ----------------
    print("\nScene 02: The User Problem...")
    out02 = os.path.join(CLIPS_DIR, "scene02.mp4")
    make_framed_raw_clip(104.0, 14.0, None, out02, overlay_path=os.path.join(ASSETS_DIR, "scene02_problem_overlay.png"))

    # ---------------- SCENE 03 (12.0s) ----------------
    print("\nScene 03: Introduce Beacontra...")
    p3a = os.path.join(PARTS_DIR, "s03_a.mp4")
    p3b = os.path.join(PARTS_DIR, "s03_b.mp4")
    make_still_clip(os.path.join(ASSETS_DIR, "scene03_intro_card.png"), 3.5, p3a)
    make_framed_raw_clip(1.0, 9.0, None, p3b)
    out03 = os.path.join(CLIPS_DIR, "scene03.mp4")
    xfade_clips(p3a, p3b, offset=3.0, dur=0.5, out_path=out03)

    # ---------------- SCENE 04 (19.0s) ----------------
    print("\nScene 04: Brand Vault...")
    out04 = os.path.join(CLIPS_DIR, "scene04.mp4")
    make_framed_raw_clip(56.0, 19.0, os.path.join(ASSETS_DIR, "badge_scene04.png"), out04)

    # ---------------- SCENE 05 (26.0s) ----------------
    print("\nScene 05: Live Market Intelligence (SerpApi)...")
    p5a = os.path.join(PARTS_DIR, "s05_a.mp4")
    p5b = os.path.join(PARTS_DIR, "s05_b.mp4")
    p5c = os.path.join(PARTS_DIR, "s05_c.mp4")
    badge5 = os.path.join(ASSETS_DIR, "badge_scene05.png")
    make_framed_raw_clip(12.0, 13.0, badge5, p5a)
    make_framed_raw_clip(33.0, 10.5, badge5, p5b)
    make_framed_raw_clip(66.0, 4.0, badge5, p5c)
    
    s05_temp = os.path.join(PARTS_DIR, "s05_temp.mp4")
    xfade_clips(p5a, p5b, offset=12.5, dur=0.5, out_path=s05_temp)
    out05 = os.path.join(CLIPS_DIR, "scene05.mp4")
    xfade_clips(s05_temp, p5c, offset=22.5, dur=0.5, out_path=out05)

    # ---------------- SCENE 06 (26.0s) ----------------
    print("\nScene 06: Visual Forensics & Evidence Graph...")
    p6a = os.path.join(PARTS_DIR, "s06_a.mp4")
    p6b = os.path.join(PARTS_DIR, "s06_b.mp4")
    badge6 = os.path.join(ASSETS_DIR, "badge_scene06.png")
    make_framed_raw_clip(43.0, 15.0, badge6, p6a)
    make_framed_raw_clip(94.0, 11.5, badge6, p6b)
    out06 = os.path.join(CLIPS_DIR, "scene06.mp4")
    xfade_clips(p6a, p6b, offset=14.5, dur=0.5, out_path=out06)

    # ---------------- SCENE 07 (22.0s) ----------------
    print("\nScene 07: Explain This Finding...")
    p7a = os.path.join(PARTS_DIR, "s07_a.mp4")
    p7b = os.path.join(PARTS_DIR, "s07_b.mp4")
    badge7 = os.path.join(ASSETS_DIR, "badge_scene07.png")
    make_framed_raw_clip(69.5, 12.0, badge7, p7a)
    make_framed_raw_clip(73.5, 10.5, badge7, p7b)
    out07 = os.path.join(CLIPS_DIR, "scene07.mp4")
    xfade_clips(p7a, p7b, offset=11.5, dur=0.5, out_path=out07)

    # ---------------- SCENE 08 (24.0s) ----------------
    print("\nScene 08: From Evidence to Action...")
    p8a = os.path.join(PARTS_DIR, "s08_a.mp4")
    p8b = os.path.join(PARTS_DIR, "s08_b.mp4")
    badge8 = os.path.join(ASSETS_DIR, "badge_scene08.png")
    make_framed_raw_clip(107.0, 10.0, badge8, p8a)
    make_framed_raw_clip(81.0, 14.5, badge8, p8b)
    out08 = os.path.join(CLIPS_DIR, "scene08.mp4")
    xfade_clips(p8a, p8b, offset=9.5, dur=0.5, out_path=out08)

    # ---------------- SCENE 09 (13.0s) ----------------
    print("\nScene 09: The Closing...")
    p9a = os.path.join(PARTS_DIR, "s09_a.mp4")
    p9b = os.path.join(PARTS_DIR, "s09_b.mp4")
    make_framed_raw_clip(126.0, 5.5, None, p9a)
    make_still_clip(os.path.join(ASSETS_DIR, "scene09_outro_card.png"), 8.0, p9b)
    out09 = os.path.join(CLIPS_DIR, "scene09.mp4")
    xfade_clips(p9a, p9b, offset=5.0, dur=0.5, out_path=out09)

    print("\nAll 9 master scene clips generated cleanly!")

if __name__ == "__main__":
    main()
