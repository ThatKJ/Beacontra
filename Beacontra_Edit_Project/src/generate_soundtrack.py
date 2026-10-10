#!/usr/bin/env python3
"""
Synthesizes a bespoke minimal atmospheric electronic soundtrack and SFX
tailored to the 168s Beacontra product launch film.
Uses pure numpy and wave - 48kHz, 16-bit stereo.
"""

import numpy as np
import wave
import os

SAMPLE_RATE = 48000
MUSIC_DIR = "Beacontra_Edit_Project/music"
SFX_DIR = "Beacontra_Edit_Project/sfx"
os.makedirs(MUSIC_DIR, exist_ok=True)
os.makedirs(SFX_DIR, exist_ok=True)

def save_wav(filename, stereo_data):
    """Save 2-channel float array (-1.0 to 1.0) as 16-bit PCM WAV."""
    # Clip to avoid distortion
    clipped = np.clip(stereo_data, -0.98, 0.98)
    int_data = (clipped * 32767).astype(np.int16)
    
    with wave.open(filename, "w") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        # Interleave L and R channels
        interleaved = np.empty((len(clipped[0]) * 2,), dtype=np.int16)
        interleaved[0::2] = int_data[0]
        interleaved[1::2] = int_data[1]
        wf.writeframes(interleaved.tobytes())
    print(f"Saved: {filename} ({len(clipped[0]) / SAMPLE_RATE:.2f}s)")

def synthesize_pad(t, freq, detune=0.003, cutoff=800):
    """Warm analog-style sawtooth/sine blend with detuning."""
    l = np.sin(2 * np.pi * freq * t) * 0.4 + np.sin(2 * np.pi * (freq * (1 - detune)) * t) * 0.3
    r = np.sin(2 * np.pi * freq * t) * 0.4 + np.sin(2 * np.pi * (freq * (1 + detune)) * t) * 0.3
    # Gentle low-pass harmonic saturation
    l += np.tanh(l * 1.5) * 0.15
    r += np.tanh(r * 1.5) * 0.15
    return l, r

def generate_soundtrack(total_dur=168.0):
    print("Generating bespoke atmospheric electronic soundtrack...")
    num_samples = int(total_dur * SAMPLE_RATE)
    t = np.linspace(0, total_dur, num_samples, endpoint=False)
    
    left = np.zeros(num_samples)
    right = np.zeros(num_samples)
    
    # 1. Warm Ambient Drone & Chords (D minor / F major progression: D3, F3, A3, C4)
    # Slow chord changes every 14 seconds
    progression = [
        [146.83, 174.61, 220.00], # Dm (D3, F3, A3)
        [130.81, 164.81, 196.00], # C (C3, E3, G3)
        [174.61, 220.00, 261.63], # F (F3, A3, C4)
        [116.54, 146.83, 174.61], # Bb (Bb2, D3, F3)
        [146.83, 174.61, 220.00], # Dm
        [164.81, 196.00, 246.94], # Em
        [174.61, 220.00, 261.63], # F
        [196.00, 246.94, 293.66], # G
        [146.83, 174.61, 220.00], # Dm (build to report)
        [174.61, 220.00, 261.63], # F
        [220.00, 261.63, 329.63], # Am
        [146.83, 220.00, 293.66]  # Dm resolution
    ]
    
    chord_dur = total_dur / len(progression)
    for i, chord in enumerate(progression):
        start_t = i * chord_dur
        end_t = (i + 1) * chord_dur
        mask = (t >= start_t) & (t < end_t)
        local_t = t[mask] - start_t
        # Smooth crossfade envelope for chords
        fade_in = np.minimum(local_t / 2.0, 1.0)
        fade_out = np.minimum((chord_dur - local_t) / 2.0, 1.0)
        env = np.sin(fade_in * np.pi / 2) * np.sin(fade_out * np.pi / 2)
        
        for freq in chord:
            l, r = synthesize_pad(t[mask], freq)
            left[mask] += l * env * 0.12
            right[mask] += r * env * 0.12

    # 2. Deep Sub-Bass Pulse (55Hz / 43.65Hz / 65.4Hz)
    bass_freqs = [73.42, 65.41, 87.31, 58.27] # Root notes
    for i in range(int(total_dur / 3.5)): # Pulse every 3.5s
        p_start = i * 3.5
        p_end = p_start + 3.2
        if p_start >= total_dur: break
        mask = (t >= p_start) & (t < min(p_end, total_dur))
        lt = t[mask] - p_start
        bfreq = bass_freqs[(i // 4) % len(bass_freqs)]
        # Sine sub with soft envelope
        sub_env = np.sin(lt / 3.2 * np.pi) ** 1.5
        sub = np.sin(2 * np.pi * bfreq * lt) * sub_env * 0.18
        left[mask] += sub
        right[mask] += sub

    # 3. Delicate Linear/Apple style Arp / Bell Tones (starting after Scene 2, 24s -> 155s)
    arp_mask = (t >= 24.0) & (t < 156.0)
    arp_notes = [587.33, 659.25, 783.99, 880.00, 1046.50] # D5, E5, G5, A5, C6
    # Generates soft crystalline pings every 0.875 seconds
    step = 0.875
    for i in range(int(24.0 / step), int(156.0 / step)):
        ping_start = i * step
        ping_end = ping_start + 0.8
        mask = (t >= ping_start) & (t < min(ping_end, total_dur))
        lt = t[mask] - ping_start
        note = arp_notes[i % len(arp_notes)]
        ping_env = np.exp(-lt * 5.0)
        # Stereo panning alternating
        pan = 0.5 + 0.3 * np.sin(i * 1.3)
        tone = (np.sin(2 * np.pi * note * lt) + 0.3 * np.sin(2 * np.pi * note * 2 * lt)) * ping_env * 0.05
        left[mask] += tone * (1.0 - pan)
        right[mask] += tone * pan

    # 4. Master Film Dynamic Envelope (Intro fade in, outro gentle fade out)
    master_env = np.ones(num_samples)
    intro_fade = np.minimum(t / 2.5, 1.0)
    outro_fade = np.minimum((total_dur - t) / 4.0, 1.0)
    master_env *= np.sin(intro_fade * np.pi / 2) * np.sin(outro_fade * np.pi / 2)
    
    left *= master_env * 0.75
    right *= master_env * 0.75
    
    save_wav(os.path.join(MUSIC_DIR, "beacontra_cinematic_soundtrack.wav"), np.array([left, right]))

def generate_sfx():
    print("Generating tactile sound effects...")
    # 1. Sub Bass Impact (for scene reveals)
    dur = 2.5
    num = int(dur * SAMPLE_RATE)
    t = np.linspace(0, dur, num, endpoint=False)
    # Pitch bend from 90Hz down to 35Hz
    freq_sweep = 90.0 * np.exp(-t * 2.5) + 35.0
    phase = 2 * np.pi * np.cumsum(freq_sweep) / SAMPLE_RATE
    env = np.exp(-t * 1.8)
    sub = np.sin(phase) * env * 0.7
    # Add subtle sub rumble
    rumble = np.random.normal(0, 0.03, num) * env
    sfx_impact = np.array([sub + rumble, sub + rumble])
    save_wav(os.path.join(SFX_DIR, "sfx_sub_impact.wav"), sfx_impact)

    # 2. Transition Whoosh (air displacement)
    dur = 0.8
    num = int(dur * SAMPLE_RATE)
    t = np.linspace(0, dur, num, endpoint=False)
    noise = np.random.normal(0, 0.3, num)
    env = np.sin(t / dur * np.pi) ** 2
    pan_l = np.cos(t / dur * np.pi / 2)
    pan_r = np.sin(t / dur * np.pi / 2)
    whoosh_l = noise * env * pan_l * 0.4
    whoosh_r = noise * env * pan_r * 0.4
    save_wav(os.path.join(SFX_DIR, "sfx_transition_whoosh.wav"), np.array([whoosh_l, whoosh_r]))

    # 3. Soft UI Click (haptic interface tick)
    dur = 0.06
    num = int(dur * SAMPLE_RATE)
    t = np.linspace(0, dur, num, endpoint=False)
    click = np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 120.0) * 0.3
    save_wav(os.path.join(SFX_DIR, "sfx_ui_click.wav"), np.array([click, click]))

    # 4. Confirmation Chime (two-tone pristine chime: E6 -> B6)
    dur = 1.2
    num = int(dur * SAMPLE_RATE)
    t = np.linspace(0, dur, num, endpoint=False)
    tone1 = np.sin(2 * np.pi * 1318.5 * t) * np.exp(-t * 4.0) * 0.25
    t2 = np.maximum(t - 0.12, 0)
    tone2 = np.sin(2 * np.pi * 1975.5 * t2) * np.exp(-t2 * 3.5) * (t >= 0.12) * 0.3
    chime = tone1 + tone2
    save_wav(os.path.join(SFX_DIR, "sfx_confirmation_chime.wav"), np.array([chime, chime]))

if __name__ == "__main__":
    generate_soundtrack(168.0)
    generate_sfx()
