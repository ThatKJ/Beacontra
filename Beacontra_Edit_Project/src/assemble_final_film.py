#!/usr/bin/env python3
"""
Master assembly script for Beacontra — Cinematic Hackathon Demo Film.
Concatenates all 9 scenes, multiplexes master audio (narration + soundtrack + SFX),
encodes to standard 1080p H.264/AAC with faststart for web/YouTube.
"""

import subprocess
import os

CLIPS_DIR = "Beacontra_Edit_Project/clips"
RENDERS_DIR = "Beacontra_Edit_Project/renders"
FINAL_OUTPUT = "Beacontra_Hackathon_Final.mp4"

def assemble_film():
    print("=== Assembling Master Video & Audio ===")
    
    # 1. Prepare concat list
    concat_file = os.path.join(RENDERS_DIR, "scenes_concat_list.txt")
    scenes = [f"scene{i:02d}.mp4" for i in range(1, 10)]
    with open(concat_file, "w") as f:
        for s in scenes:
            clip_path = os.path.abspath(os.path.join(CLIPS_DIR, s))
            f.write(f"file '{clip_path}'\n")
    print(f"Wrote concat file with {len(scenes)} scenes.")

    # 2. First pass: concatenate video stream
    concat_video = os.path.join(RENDERS_DIR, "master_video_track.mp4")
    cmd_v = [
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0", "-i", concat_file,
        "-c", "copy",
        concat_video
    ]
    print("Concatenating video tracks...")
    subprocess.run(cmd_v, check=True)

    # 3. Multiplex with master audio and master encode
    audio_path = os.path.join(RENDERS_DIR, "master_audio.wav")
    print(f"Multiplexing with {audio_path}...")
    
    cmd_master = [
        "ffmpeg", "-y",
        "-i", concat_video,
        "-i", audio_path,
        "-map", "0:v:0",
        "-map", "1:a:0",
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-r", "30",
        "-c:a", "aac",
        "-b:a", "256k",
        "-ar", "48000",
        "-movflags", "+faststart",
        "-metadata", "title=Beacontra — Marketplace Evidence in Focus",
        "-metadata", "artist=Beacontra Team",
        "-metadata", "comment=SerpApi India Hackathon 2026 Submission",
        FINAL_OUTPUT
    ]
    subprocess.run(cmd_master, check=True)
    print(f"\n Master film rendered successfully: {FINAL_OUTPUT}")

if __name__ == "__main__":
    assemble_film()
