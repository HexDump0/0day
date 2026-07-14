#!/usr/bin/env python3
"""Detect the beat grid of the instrumental stem.

Constant-tempo model (electronic track): estimate BPM via autocorrelation of a
spectral-flux onset envelope, then fit the grid phase by maximizing onset
energy at beat positions. Output: src/data/beats.json.
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
AUDIO = ROOT / "music" / "no_vocals_full_all_the_things.mp3"
OUT = ROOT / "src" / "data" / "beats.json"

SR = 22050
HOP = 256
NFFT = 1024
ANALYZE_SECONDS = 80.0  # we only use the first ~79s of the song


def decode(path: Path, seconds: float) -> np.ndarray:
    cmd = [
        "ffmpeg", "-v", "quiet", "-i", str(path), "-t", str(seconds),
        "-ac", "1", "-ar", str(SR), "-f", "f32le", "-",
    ]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32)


def onset_envelope(y: np.ndarray) -> np.ndarray:
    window = np.hanning(NFFT)
    n_frames = 1 + (len(y) - NFFT) // HOP
    idx = np.arange(NFFT)[None, :] + HOP * np.arange(n_frames)[:, None]
    frames = y[idx] * window
    mag = np.abs(np.fft.rfft(frames, axis=1))
    logmag = np.log1p(1000.0 * mag)
    flux = np.diff(logmag, axis=0)
    flux[flux < 0] = 0.0
    env = flux.sum(axis=1)
    env -= env.mean()
    env /= env.std() + 1e-9
    return env


def estimate_bpm(env: np.ndarray) -> float:
    fps = SR / HOP
    ac = np.correlate(env, env, mode="full")[len(env) - 1:]
    # LRC chorus spacing (~2.505s per 4 beats) pins tempo near 95.8 bpm;
    # search a tight window to avoid the 3:2 mis-lock at ~63 bpm
    lo, hi = int(fps * 60 / 105), int(fps * 60 / 85)
    lags = np.arange(len(ac))
    # weight against octave errors: prefer lags near 90-100 bpm gently
    seg = ac[lo:hi].copy()
    best = lo + int(np.argmax(seg))
    # parabolic refine
    if 1 <= best < len(ac) - 1:
        a, b, c = ac[best - 1], ac[best], ac[best + 1]
        denom = a - 2 * b + c
        shift = 0.5 * (a - c) / denom if abs(denom) > 1e-12 else 0.0
        best = best + float(np.clip(shift, -1, 1))
    return 60.0 * fps / best


def fit_phase(env: np.ndarray, bpm: float) -> tuple[float, float]:
    """Grid-search small bpm tweaks + phase, return (bpm, offset_seconds)."""
    fps = SR / HOP
    best = (-1e18, bpm, 0.0)
    for bpm_try in np.linspace(bpm * 0.998, bpm * 1.002, 21):
        period = fps * 60.0 / bpm_try
        for phase in np.linspace(0, period, 64, endpoint=False):
            positions = np.arange(phase, len(env) - 1, period)
            ip = positions.astype(int)
            frac = positions - ip
            vals = env[ip] * (1 - frac) + env[ip + 1] * frac
            score = vals.mean()
            if score > best[0]:
                best = (score, bpm_try, phase / fps)
    return best[1], best[2]


def bpm_from_lrc() -> float:
    """Least-squares tempo from chorus lines, which repeat every 2 beats.
    Anchor sets are (time, beat-index); 54.83->64.83 is 16 beats apart."""
    anchors = [
        (54.25, 0), (55.56, 2), (56.86, 4), (57.95, 6), (59.36, 8), (60.62, 10),
        (64.15, 16), (65.55, 18), (66.89, 20), (68.23, 22), (69.52, 24), (70.75, 26),
    ]
    t = np.array([a[0] for a in anchors])
    k = np.array([a[1] for a in anchors], dtype=float)
    period = np.polyfit(k, t, 1)[0]
    return 60.0 / period


def main() -> None:
    y = decode(AUDIO, ANALYZE_SECONDS)
    env = onset_envelope(y)
    bpm = bpm_from_lrc()
    print(f"LRC least-squares BPM: {bpm:.3f} (audio autocorr said {estimate_bpm(env):.3f})")
    bpm, offset = fit_phase(env, bpm)

    period = 60.0 / bpm
    beats = []
    t = offset
    while t < ANALYZE_SECONDS:
        beats.append(round(t, 4))
        t += period

    # LRC cross-check: chorus "Hack all the things" hits (should sit near beats)
    chorus = [55.56, 57.95, 60.62, 65.55, 68.23, 70.75]
    errs = []
    for c in chorus:
        k = round((c - offset) / period)
        errs.append(abs(offset + k * period - c))
    print(f"BPM {bpm:.3f}  offset {offset:.4f}s  period {period:.4f}s")
    print(f"chorus alignment error: mean {np.mean(errs)*1000:.0f}ms "
          f"max {np.max(errs)*1000:.0f}ms")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({
        "bpm": round(bpm, 3),
        "offset": round(offset, 4),
        "period": round(period, 5),
        "beats": beats,
    }, indent=1))
    print(f"wrote {OUT} ({len(beats)} beats)")


if __name__ == "__main__":
    sys.exit(main())
