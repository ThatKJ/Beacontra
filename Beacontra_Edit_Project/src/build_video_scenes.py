#!/usr/bin/env python3
"""
Renders each of the 9 video scenes with cinematic framing, browser chrome,
motion graphics overlays, and precise timings.
Ensures fps=30 and setpts=PTS-STARTPTS for rock-solid sync and exact durations.
"""

import subprocess
import os

RAW_VIDEO = "./Beacontra_RAW_MASTER_DEMO_2026-10-08.mp4"
ASSETS_DIR = "Beacontra_Edit_Project/assets"
CLIPS_DIR = "Beacontra_Edit_Project/clips"
os.makedirs(CLIPS_DIR, exist_ok=True)

def run_cmd(cmd):
    print("Running:", " ".join(cmd[:8]), "...")
    subprocess.run(cmd, check=True)

def render_scene01():
    print("\n--- Rendering Scene 01 (12.0s): The Hook ---")
    out_path = os.path.join(CLIPS_DIR, "scene01.mp4")
    # Part 1A: 0.0 to 4.5s (Hook A)
    # Part 1B: 4.5 to 8.5s (Hook B)
    # Part 1C: 8.5 to 12.0s (Marketplace preview in browser frame from raw video 01:43 to 01:47)
    filter_complex = (
        "[0:v]loop=loop=135:size=1:start=0,fps=30,scale=1920:1080,setsar=1[p1];"
        "[1:v]loop=loop=120:size=1:start=0,fps=30,scale=1920:1080,setsar=1[p2];"
        "[2:v]fps=30,setpts=PTS-STARTPTS,scale=1740:1051,crop=1740:946:0:52[raw_sub];"
        "[3:v][raw_sub]overlay=90:84[bg_screen];"
        "[bg_screen][4:v]overlay=0:0[p3];"
        "[p1][p2]xfade=transition=fade:duration=0.5:offset=4.0[x1];"
        "[x1][p3]xfade=transition=fade:duration=0.5:offset=8.0,format=yuv420p[outv]"
    )
    cmd = [
        "ffmpeg", "-y",
        "-i", os.path.join(ASSETS_DIR, "scene01_hook_a.png"),
        "-i", os.path.join(ASSETS_DIR, "scene01_hook_b.png"),
        "-ss", "103.0", "-t", "4.5", "-i", RAW_VIDEO,
        "-loop", "1", "-i", os.path.join(ASSETS_DIR, "cinematic_bg.png"),
        "-loop", "1", "-i", os.path.join(ASSETS_DIR, "browser_frame_overlay.png"),
        "-filter_complex", filter_complex,
        "-map", "[outv]",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-r", "30", "-t", "12.0",
        out_path
    ]
    run_cmd(cmd)

def render_scene02():
    print("\n--- Rendering Scene 02 (14.0s): The User's Problem ---")
    out_path = os.path.join(CLIPS_DIR, "scene02.mp4")
    # Raw video 01:44.0 to 01:58.0 (14.0s) with browser frame & problem callout overlay
    filter_complex = (
        "[0:v]fps=30,setpts=PTS-STARTPTS,scale=1740:1051,crop=1740:946:0:52[screen];"
        "[1:v][screen]overlay=90:84[bg_screen];"
        "[bg_screen][2:v]overlay=0:0[framed];"
        "[framed][3:v]overlay=0:0:enable='gte(t,0.5)',format=yuv420p[outv]"
    )
    cmd = [
        "ffmpeg", "-y",
        "-ss", "104.0", "-t", "14.0", "-i", RAW_VIDEO,
        "-loop", "1", "-i", os.path.join(ASSETS_DIR, "cinematic_bg.png"),
        "-loop", "1", "-i", os.path.join(ASSETS_DIR, "browser_frame_overlay.png"),
        "-loop", "1", "-i", os.path.join(ASSETS_DIR, "scene02_problem_overlay.png"),
        "-filter_complex", filter_complex,
        "-map", "[outv]",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-r", "30", "-t", "14.0",
        out_path
    ]
    run_cmd(cmd)

def render_scene03():
    print("\n--- Rendering Scene 03 (12.0s): Introduce Beacontra ---")
    out_path = os.path.join(CLIPS_DIR, "scene03.mp4")
    # 0.0 to 3.5s: Title reveal card
    # 3.5 to 12.0s: Overview interface from raw video 00:01.0 to 00:09.5 inside browser frame
    filter_complex = (
        "[0:v]loop=loop=120:size=1:start=0,fps=30,scale=1920:1080,setsar=1[p1];"
        "[1:v]fps=30,setpts=PTS-STARTPTS,scale=1740:1051,crop=1740:946:0:52[screen];"
        "[2:v][screen]overlay=90:84[bg_screen];"
        "[bg_screen][3:v]overlay=0:0[p2];"
        "[p1][p2]xfade=transition=fade:duration=0.6:offset=3.0,format=yuv420p[outv]"
    )
    cmd = [
        "ffmpeg", "-y",
        "-i", os.path.join(ASSETS_DIR, "scene03_intro_card.png"),
        "-ss", "1.0", "-t", "9.5", "-i", RAW_VIDEO,
        "-loop", "1", "-i", os.path.join(ASSETS_DIR, "cinematic_bg.png"),
        "-loop", "1", "-i", os.path.join(ASSETS_DIR, "browser_frame_overlay.png"),
        "-filter_complex", filter_complex,
        "-map", "[outv]",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-r", "30", "-t", "12.0",
        out_path
    ]
    run_cmd(cmd)

def render_scene04():
    print("\n--- Rendering Scene 04 (19.0s): Brand Vault ---")
    out_path = os.path.join(CLIPS_DIR, "scene04.mp4")
    # Raw video 00:56.0 to 01:15.0 (19.0s: Brand Vault -> Market Radar entry)
    filter_complex = (
        "[0:v]fps=30,setpts=PTS-STARTPTS,scale=1740:1051,crop=1740:946:0:52[screen];"
        "[1:v][screen]overlay=90:84[bg_screen];"
        "[bg_screen][2:v]overlay=0:0[framed];"
        "[framed][3:v]overlay=0:0,format=yuv420p[outv]"
    )
    cmd = [
        "ffmpeg", "-y",
        "-ss", "56.0", "-t", "19.0", "-i", RAW_VIDEO,
        "-loop", "1", "-i", os.path.join(ASSETS_DIR, "cinematic_bg.png"),
        "-loop", "1", "-i", os.path.join(ASSETS_DIR, "browser_frame_overlay.png"),
        "-loop", "1", "-i", os.path.join(ASSETS_DIR, "badge_scene04.png"),
        "-filter_complex", filter_complex,
        "-map", "[outv]",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-r", "30", "-t", "19.0",
        out_path
    ]
    run_cmd(cmd)

def render_scene05():
    print("\n--- Rendering Scene 05 (26.0s): Live Market Intelligence (SerpApi) ---")
    out_path = os.path.join(CLIPS_DIR, "scene05.mp4")
    # Part A: 00:12.0 to 00:25.0 (13.0s: Scan submit & live loading)
    # Part B: 00:33.0 to 00:43.0 (10.0s: Results return & flagged listing)
    # Part C: 01:06.0 to 01:09.5 (3.5s: Radar baseline calculation)
    filter_complex = (
        "[0:v]fps=30,setpts=PTS-STARTPTS,scale=1740:1051,crop=1740:946:0:52[s1];"
        "[1:v]fps=30,setpts=PTS-STARTPTS,scale=1740:1051,crop=1740:946:0:52[s2];"
        "[2:v]fps=30,setpts=PTS-STARTPTS,scale=1740:1051,crop=1740:946:0:52[s3];"
        "[s1][s2]xfade=transition=fade:duration=0.5:offset=12.5[seq1];"
        "[seq1][s3]xfade=transition=fade:duration=0.5:offset=22.5[screen];"
        "[3:v][screen]overlay=90:84[bg_screen];"
        "[bg_screen][4:v]overlay=0:0[framed];"
        "[framed][5:v]overlay=0:0,format=yuv420p[outv]"
    )
    cmd = [
        "ffmpeg", "-y",
        "-ss", "12.0", "-t", "13.0", "-i", RAW_VIDEO,
        "-ss", "33.0", "-t", "10.5", "-i", RAW_VIDEO,
        "-ss", "66.0", "-t", "4.0", "-i", RAW_VIDEO,
        "-loop", "1", "-i", os.path.join(ASSETS_DIR, "cinematic_bg.png"),
        "-loop", "1", "-i", os.path.join(ASSETS_DIR, "browser_frame_overlay.png"),
        "-loop", "1", "-i", os.path.join(ASSETS_DIR, "badge_scene05.png"),
        "-filter_complex", filter_complex,
        "-map", "[outv]",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-r", "30", "-t", "26.0",
        out_path
    ]
    run_cmd(cmd)

def render_scene06():
    print("\n--- Rendering Scene 06 (26.0s): Visual Forensics & Evidence Graph ---")
    out_path = os.path.join(CLIPS_DIR, "scene06.mp4")
    # Part A: 00:43.0 to 00:58.0 (15.0s: Visual Forensics dual pane & Lens)
    # Part B: 01:34.0 to 01:45.5 (11.5s: Evidence Graph network)
    filter_complex = (
        "[0:v]fps=30,setpts=PTS-STARTPTS,scale=1740:1051,crop=1740:946:0:52[s1];"
        "[1:v]fps=30,setpts=PTS-STARTPTS,scale=1740:1051,crop=1740:946:0:52[s2];"
        "[s1][s2]xfade=transition=fade:duration=0.5:offset=14.5[screen];"
        "[2:v][screen]overlay=90:84[bg_screen];"
        "[bg_screen][3:v]overlay=0:0[framed];"
        "[framed][4:v]overlay=0:0,format=yuv420p[outv]"
    )
    cmd = [
        "ffmpeg", "-y",
        "-ss", "43.0", "-t", "15.0", "-i", RAW_VIDEO,
        "-ss", "94.0", "-t", "12.0", "-i", RAW_VIDEO,
        "-loop", "1", "-i", os.path.join(ASSETS_DIR, "cinematic_bg.png"),
        "-loop", "1", "-i", os.path.join(ASSETS_DIR, "browser_frame_overlay.png"),
        "-loop", "1", "-i", os.path.join(ASSETS_DIR, "badge_scene06.png"),
        "-filter_complex", filter_complex,
        "-map", "[outv]",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-r", "30", "-t", "26.0",
        out_path
    ]
    run_cmd(cmd)

def render_scene07():
    print("\n--- Rendering Scene 07 (22.0s): Explain This Finding ---")
    out_path = os.path.join(CLIPS_DIR, "scene07.mp4")
    # Part A: 01:09.5 to 01:21.5 (12.0s: Heuristic drawer & counterfactuals)
    # Part B: 01:13.5 to 01:24.0 (10.5s: Focus dwell into weights)
    filter_complex = (
        "[0:v]fps=30,setpts=PTS-STARTPTS,scale=1740:1051,crop=1740:946:0:52[s1];"
        "[1:v]fps=30,setpts=PTS-STARTPTS,scale=1740:1051,crop=1740:946:0:52[s2];"
        "[s1][s2]xfade=transition=fade:duration=0.5:offset=11.5[screen];"
        "[2:v][screen]overlay=90:84[bg_screen];"
        "[bg_screen][3:v]overlay=0:0[framed];"
        "[framed][4:v]overlay=0:0,format=yuv420p[outv]"
    )
    cmd = [
        "ffmpeg", "-y",
        "-ss", "69.5", "-t", "12.0", "-i", RAW_VIDEO,
        "-ss", "73.5", "-t", "10.5", "-i", RAW_VIDEO,
        "-loop", "1", "-i", os.path.join(ASSETS_DIR, "cinematic_bg.png"),
        "-loop", "1", "-i", os.path.join(ASSETS_DIR, "browser_frame_overlay.png"),
        "-loop", "1", "-i", os.path.join(ASSETS_DIR, "badge_scene07.png"),
        "-filter_complex", filter_complex,
        "-map", "[outv]",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-r", "30", "-t", "22.0",
        out_path
    ]
    run_cmd(cmd)

def render_scene08():
    print("\n--- Rendering Scene 08 (24.0s): From Evidence to Action ---")
    out_path = os.path.join(CLIPS_DIR, "scene08.mp4")
    # Part A: 01:47.0 to 01:57.0 (10.0s: Chrome extension sidepanel extraction)
    # Part B: 01:21.0 to 01:35.5 (14.5s: Cases Desk & Standalone HTML Report)
    filter_complex = (
        "[0:v]fps=30,setpts=PTS-STARTPTS,scale=1740:1051,crop=1740:946:0:52[s1];"
        "[1:v]fps=30,setpts=PTS-STARTPTS,scale=1740:1051,crop=1740:946:0:52[s2];"
        "[s1][s2]xfade=transition=fade:duration=0.5:offset=9.5[screen];"
        "[2:v][screen]overlay=90:84[bg_screen];"
        "[bg_screen][3:v]overlay=0:0[framed];"
        "[framed][4:v]overlay=0:0,format=yuv420p[outv]"
    )
    cmd = [
        "ffmpeg", "-y",
        "-ss", "107.0", "-t", "10.0", "-i", RAW_VIDEO,
        "-ss", "81.0", "-t", "14.5", "-i", RAW_VIDEO,
        "-loop", "1", "-i", os.path.join(ASSETS_DIR, "cinematic_bg.png"),
        "-loop", "1", "-i", os.path.join(ASSETS_DIR, "browser_frame_overlay.png"),
        "-loop", "1", "-i", os.path.join(ASSETS_DIR, "badge_scene08.png"),
        "-filter_complex", filter_complex,
        "-map", "[outv]",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-r", "30", "-t", "24.0",
        out_path
    ]
    run_cmd(cmd)

def render_scene09():
    print("\n--- Rendering Scene 09 (13.0s): The Closing ---")
    out_path = os.path.join(CLIPS_DIR, "scene09.mp4")
    # 0.0 to 5.0s: Full product sweep across modules from raw video 02:06.0 to 02:11.0 in browser frame
    # 5.0 to 13.0s: scene09_outro_card.png (Beacontra logo, tagline, SerpApi attribution, repo link)
    filter_complex = (
        "[0:v]fps=30,setpts=PTS-STARTPTS,scale=1740:1051,crop=1740:946:0:52[screen];"
        "[1:v][screen]overlay=90:84[bg_screen];"
        "[bg_screen][2:v]overlay=0:0[p1];"
        "[3:v]loop=loop=270:size=1:start=0,fps=30,scale=1920:1080,setsar=1[p2];"
        "[p1][p2]xfade=transition=fade:duration=0.6:offset=4.5,format=yuv420p[outv]"
    )
    cmd = [
        "ffmpeg", "-y",
        "-ss", "126.0", "-t", "5.5", "-i", RAW_VIDEO,
        "-loop", "1", "-i", os.path.join(ASSETS_DIR, "cinematic_bg.png"),
        "-loop", "1", "-i", os.path.join(ASSETS_DIR, "browser_frame_overlay.png"),
        "-i", os.path.join(ASSETS_DIR, "scene09_outro_card.png"),
        "-filter_complex", filter_complex,
        "-map", "[outv]",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-r", "30", "-t", "13.0",
        out_path
    ]
    run_cmd(cmd)

def main():
    render_scene01()
    render_scene02()
    render_scene03()
    render_scene04()
    render_scene05()
    render_scene06()
    render_scene07()
    render_scene08()
    render_scene09()
    print("\nAll 9 video scene clips rendered successfully!")

if __name__ == "__main__":
    main()
