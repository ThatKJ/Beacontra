#!/usr/bin/env python3
"""
Build the master 168.5s audio track for Beacontra Master Film.
Mixes soundtrack, voiceover clips, and SFX with dynamic sidechain ducking,
sub-bass impacts, interface clicks, and confirmation chimes.
Synchronized to exact scene video cuts.
"""

import numpy as np
import wave
import os

SAMPLE_RATE = 48000
TOTAL_DUR = 168.5

VOICE_DIR = "Beacontra_Edit_Project/voice"
MUSIC_DIR = "Beacontra_Edit_Project/music"
SFX_DIR = "Beacontra_Edit_Project/sfx"
RENDERS_DIR = "Beacontra_Edit_Project/renders"
os.makedirs(RENDERS_DIR, exist_ok=True)

def load_wav(path):
    with wave.open(path, "r") as wf:
        n_ch = wf.getnchannels()
        sr = wf.getframerate()
        n_frames = wf.getnframes()
        raw = wf.readframes(n_frames)
        data = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
        if n_ch == 1:
            data = np.column_stack((data, data)).T
        else:
            data = data.reshape(-1, 2).T
        return data, sr

def save_wav(path, stereo_data):
    clipped = np.clip(stereo_data, -0.98, 0.98)
    int_data = (clipped * 32767).astype(np.int16)
    with wave.open(path, "w") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        interleaved = np.empty((len(clipped[0]) * 2,), dtype=np.int16)
        interleaved[0::2] = int_data[0]
        interleaved[1::2] = int_data[1]
        wf.writeframes(interleaved.tobytes())
    print(f"Master audio saved to {path} ({len(clipped[0])/SAMPLE_RATE:.2f}s)")

# Scene timeline definitions (start_time, duration, vo_file, vo_offset)
SCENE_TIMELINE = [
    {"id": "scene01", "start": 0.0,   "dur": 12.0, "vo": "scene01_vo.wav", "vo_offset": 0.8},
    {"id": "scene02", "start": 12.0,  "dur": 14.0, "vo": "scene02_vo.wav", "vo_offset": 0.8},
    {"id": "scene03", "start": 26.0,  "dur": 12.0, "vo": "scene03_vo.wav", "vo_offset": 0.6},
    {"id": "scene04", "start": 38.0,  "dur": 19.0, "vo": "scene04_vo.wav", "vo_offset": 0.5},
    {"id": "scene05", "start": 57.0,  "dur": 26.5, "vo": "scene05_vo.wav", "vo_offset": 0.8},
    {"id": "scene06", "start": 83.5,  "dur": 26.0, "vo": "scene06_vo.wav", "vo_offset": 0.6},
    {"id": "scene07", "start": 109.5, "dur": 22.0, "vo": "scene07_vo.wav", "vo_offset": 0.5},
    {"id": "scene08", "start": 131.5, "dur": 24.0, "vo": "scene08_vo.wav", "vo_offset": 0.5},
    {"id": "scene09", "start": 155.5, "dur": 13.0, "vo": "scene09_vo.wav", "vo_offset": 0.5},
]

# SFX Cue Sheet (time, sfx_file, volume)
SFX_CUES = [
    {"time": 0.3,   "sfx": "sfx_sub_impact.wav",         "vol": 0.75}, # Intro hook impact
    {"time": 11.5,  "sfx": "sfx_transition_whoosh.wav",  "vol": 0.40}, # Transition to problem
    {"time": 26.2,  "sfx": "sfx_sub_impact.wav",         "vol": 0.70}, # Beacontra title reveal
    {"time": 29.2,  "sfx": "sfx_transition_whoosh.wav",  "vol": 0.40}, # Settle into Overview
    {"time": 37.8,  "sfx": "sfx_transition_whoosh.wav",  "vol": 0.40}, # Transition to Brand Vault
    {"time": 46.5,  "sfx": "sfx_ui_click.wav",           "vol": 0.35}, # Brand Vault click
    {"time": 56.8,  "sfx": "sfx_transition_whoosh.wav",  "vol": 0.40}, # Transition to live scan
    {"time": 58.2,  "sfx": "sfx_ui_click.wav",           "vol": 0.35}, # Scan button click
    {"time": 69.5,  "sfx": "sfx_confirmation_chime.wav", "vol": 0.45}, # Live results arrive!
    {"time": 83.2,  "sfx": "sfx_transition_whoosh.wav",  "vol": 0.40}, # Transition to Forensics
    {"time": 98.5,  "sfx": "sfx_ui_click.wav",           "vol": 0.35}, # Evidence Graph click
    {"time": 109.2, "sfx": "sfx_transition_whoosh.wav",  "vol": 0.40}, # Transition to Explain Finding
    {"time": 131.2, "sfx": "sfx_transition_whoosh.wav",  "vol": 0.40}, # Transition to Chrome Ext
    {"time": 143.5, "sfx": "sfx_confirmation_chime.wav", "vol": 0.50}, # HTML Dossier export!
    {"time": 155.2, "sfx": "sfx_transition_whoosh.wav",  "vol": 0.40}, # Sweep into closing
    {"time": 160.5, "sfx": "sfx_sub_impact.wav",         "vol": 0.60}, # Final brand statement
]

def build_master_audio():
    num_samples = int(TOTAL_DUR * SAMPLE_RATE)
    master_l = np.zeros(num_samples, dtype=np.float32)
    master_r = np.zeros(num_samples, dtype=np.float32)
    
    # Track speech activity mask for dynamic music ducking
    speech_mask = np.zeros(num_samples, dtype=np.float32)
    
    print("Mixing voiceover tracks...")
    for scene in SCENE_TIMELINE:
        vo_path = os.path.join(VOICE_DIR, scene["vo"])
        vo_data, _ = load_wav(vo_path)
        vo_start = scene["start"] + scene["vo_offset"]
        start_idx = int(vo_start * SAMPLE_RATE)
        end_idx = min(start_idx + vo_data.shape[1], num_samples)
        actual_len = end_idx - start_idx
        
        # Add voice to master (clarity volume: 1.05)
        master_l[start_idx:end_idx] += vo_data[0, :actual_len] * 1.05
        master_r[start_idx:end_idx] += vo_data[1, :actual_len] * 1.05
        
        # Mark speech mask with 0.25s attack/decay padding
        pad = int(0.25 * SAMPLE_RATE)
        m_start = max(0, start_idx - pad)
        m_end = min(num_samples, end_idx + pad)
        speech_mask[m_start:m_end] = 1.0

    print("Synthesizing dynamic ducking envelope for soundtrack...")
    kernel_size = int(0.4 * SAMPLE_RATE)
    kernel = np.ones(kernel_size) / kernel_size
    smoothed_mask = np.convolve(speech_mask, kernel, mode="same")
    
    # Music volume: 0.28 during speech, 0.65 during pauses/transitions
    music_vol = 0.65 - smoothed_mask * 0.37
    
    # Load soundtrack
    music_path = os.path.join(MUSIC_DIR, "beacontra_cinematic_soundtrack.wav")
    music_data, _ = load_wav(music_path)
    m_len = min(num_samples, music_data.shape[1])
    
    master_l[:m_len] += music_data[0, :m_len] * music_vol[:m_len]
    master_r[:m_len] += music_data[1, :m_len] * music_vol[:m_len]

    print("Mixing sound effects cues...")
    for cue in SFX_CUES:
        sfx_path = os.path.join(SFX_DIR, cue["sfx"])
        sfx_data, _ = load_wav(sfx_path)
        start_idx = int(cue["time"] * SAMPLE_RATE)
        end_idx = min(start_idx + sfx_data.shape[1], num_samples)
        actual_len = end_idx - start_idx
        
        master_l[start_idx:end_idx] += sfx_data[0, :actual_len] * cue["vol"]
        master_r[start_idx:end_idx] += sfx_data[1, :actual_len] * cue["vol"]

    # Master Limiter & Normalization (-1.0 dBFS = 0.891)
    peak = max(np.max(np.abs(master_l)), np.max(np.abs(master_r)))
    print(f"Pre-master peak level: {peak:.2f}")
    if peak > 0.89:
        factor = 0.89 / peak
        master_l *= factor
        master_r *= factor
        print(f"Normalized to -1.0 dBFS (scale factor: {factor:.3f})")
    
    out_path = os.path.join(RENDERS_DIR, "master_audio.wav")
    save_wav(out_path, np.array([master_l, master_r]))
    return out_path

if __name__ == "__main__":
    build_master_audio()
