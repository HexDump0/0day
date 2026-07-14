#!/usr/bin/env python3
"""Synthesize the SFX layer. Everything is generated from noise/sines or from
the instrumental stem itself — no stock sample packs.

Outputs (public/audio/sfx/):
  tape_stop.wav  – the instrumental at 49.87s resampled with a rate ramp 1→0
  riser.wav      – noise swell w/ upward bandpass sweep + sine riser, into the drop
  sub_hit.wav    – one deep 45Hz thump (lands when "0" appears in the silence)
  whoosh.wav     – short filtered-noise swell for punch-in zooms
  tick1..3.wav   – 25ms glitch ticks for hard cuts
"""
import subprocess
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
INSTR = ROOT / "music" / "no_vocals_full_all_the_things.mp3"
OUT = ROOT / "public" / "audio" / "sfx"
SR = 48000

TAPE_STOP_AT = 49.243  # timeline second where the stop begins (2 bars pre-drop)


def decode(path: Path, start: float, dur: float) -> np.ndarray:
    cmd = ["ffmpeg", "-v", "quiet", "-ss", str(start), "-i", str(path),
           "-t", str(dur), "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()


def write_wav(name: str, x: np.ndarray) -> None:
    x = np.clip(x, -1, 1).astype(np.float32)
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    p = OUT / name
    cmd = ["ffmpeg", "-v", "quiet", "-y", "-f", "f32le", "-ar", str(SR),
           "-ac", "2", "-i", "-", str(p)]
    subprocess.run(cmd, input=x.tobytes(), check=True)
    print(f"  {p.name}  {len(x)/SR:.2f}s")


def tape_stop() -> None:
    src = decode(INSTR, TAPE_STOP_AT, 2.5)
    out_dur = 1.35
    n_out = int(out_dur * SR)
    t = np.arange(n_out) / n_out
    rate = (1 - t) ** 2                       # playback rate 1 → 0, quadratic
    pos = np.cumsum(rate) / SR * 1.0
    pos_samples = pos * SR
    idx = np.clip(pos_samples.astype(int), 0, len(src) - 2)
    frac = (pos_samples - idx)[:, None]
    y = src[idx] * (1 - frac) + src[idx + 1] * frac
    y *= ((1 - t) ** 0.7)[:, None]            # fade with the slowdown
    write_wav("tape_stop.wav", y * 0.9)


def riser() -> None:
    dur = 2.6
    n = int(dur * SR)
    t = np.linspace(0, 1, n)
    rng = np.random.default_rng(1337)
    noise = rng.standard_normal(n).astype(np.float32)
    # upward bandpass sweep via STFT masking
    hop, nfft = 256, 2048
    n_frames = 1 + (n - nfft) // hop
    win = np.hanning(nfft).astype(np.float32)
    frames = np.stack([noise[i*hop:i*hop+nfft] * win for i in range(n_frames)])
    spec = np.fft.rfft(frames, axis=1)
    freqs = np.fft.rfftfreq(nfft, 1 / SR)
    y = np.zeros(n, dtype=np.float32)
    for i in range(n_frames):
        p = i / n_frames
        center = 250 * (26 ** p)              # 250 Hz → ~6.5 kHz
        bw = 0.55 * center
        mask = np.exp(-0.5 * ((freqs - center) / bw) ** 2)
        y[i*hop:i*hop+nfft] += np.fft.irfft(spec[i] * mask).astype(np.float32) * win
    y /= np.abs(y).max() + 1e-9
    env = t ** 2.2                            # exponential-ish swell
    sine = 0.22 * np.sin(2 * np.pi * np.cumsum(70 * (8 ** t)) / SR)  # 70→560 Hz
    mix = y * env + sine * env
    mix[-int(0.02*SR):] *= np.linspace(1, 0, int(0.02*SR))  # declick tail
    write_wav("riser.wav", mix * 0.8)


def sub_hit() -> None:
    dur = 0.9
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 45 * np.exp(-t * 2.0) + 38            # slight downward pitch
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 5.5)
    click = np.exp(-t * 400) * 0.4            # transient so it reads on laptops
    write_wav("sub_hit.wav", (y + click) * 0.95)


def whoosh() -> None:
    dur = 0.45
    n = int(dur * SR)
    t = np.linspace(0, 1, n)
    rng = np.random.default_rng(7)
    noise = rng.standard_normal(n).astype(np.float32)
    # simple moving-average lowpass whose window shrinks over time (opens up)
    y = np.copy(noise)
    k = (40 * (1 - t) + 2).astype(int)
    c = np.cumsum(np.concatenate([[0], noise]))
    idx = np.arange(n)
    lo = np.maximum(idx - k, 0)
    y = (c[idx + 1] - c[lo]) / (idx + 1 - lo)
    env = np.sin(np.pi * t) ** 1.5
    write_wav("whoosh.wav", y * env * 2.2)


def ticks() -> None:
    rng = np.random.default_rng(42)
    for i, (f0, character) in enumerate([(2400, 0.5), (900, 0.8), (3600, 0.3)]):
        dur = 0.03
        n = int(dur * SR)
        t = np.arange(n) / SR
        sq = np.sign(np.sin(2 * np.pi * f0 * t))
        nz = rng.standard_normal(n)
        y = (sq * (1 - character) + nz * character) * np.exp(-t * 180)
        write_wav(f"tick{i+1}.wav", y * 0.5)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    tape_stop(); riser(); sub_hit(); whoosh(); ticks()


if __name__ == "__main__":
    main()
