#!/usr/bin/env python3
"""Cut + duotone the archival intro footage (footage/raw → public/assets/footage).

Same treatment as duotone.py but for video: grayscale → percentile-normalized
(2/98, computed per clip so exposure is stable across frames) → gamma 1.1 →
mapped bg(#0b0b09) → capped paper, with a touch of temporal grain so the
low-res sources read as film instead of bad upscales. `tint: acid` swaps the
high end to the acid green — reserved for the payoff shot.
"""
import json
import subprocess
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "footage" / "raw"
DST = ROOT / "public" / "assets" / "footage"

BGC = np.array([0x0B, 0x0B, 0x09], dtype=np.float32)
PAPER = np.array([0xE8, 0xE7, 0xE0], dtype=np.float32) * 0.88
ACID = np.array([0xC6, 0xF5, 0x2E], dtype=np.float32) * 0.92

# name, source, in-point (s), OUTPUT duration (s), tint, speed (1.0 = realtime;
# 0.6 plays at 60% so a short source shot can fill a longer slot)
CLIPS: list[tuple[str, str, float, float, str] | tuple[str, str, float, float, str, float]] = [
    ("c64_typing",   "c64_1982_us_a.mp4",  6.0, 3.5, "paper"),
    ("c64_title",    "c64_1982_us_a.mp4", 11.45, 1.6, "paper"),
    ("c64_word",     "c64_1982_us_a.mp4", 15.5, 1.6, "paper"),
    ("ibm_tapes",    "ibm_360_irs.mp4",   18.5, 6.0, "paper"),
    ("ibm_room",     "ibm_360_irs.mp4",   95.0, 5.0, "paper"),
    ("saturn_pad",   "nasa_reel07.mp4",    2.0, 6.0, "paper"),
    ("saturn_ignition", "nasa_reel07.mp4", 10.0, 6.0, "paper"),
    ("saturn_climb", "nasa_reel07.mp4",   18.0, 6.0, "paper"),
    ("earth",        "nasa_reel07.mp4",   24.5, 4.5, "paper"),
    ("cockpit",      "nasa_reel07.mp4",  252.0, 5.0, "paper"),
    ("llrf",         "nasa_reel07.mp4",  445.0, 5.0, "paper"),
    # WarGames-adjacent: ARPANET doc (1972) + SAGE air defense (1956)
    ("keys_macro",   "arpanet_1972.mp4",  35.4, 2.0, "paper"),
    ("imp_panel",    "arpanet_1972.mp4",  28.45, 2.1, "paper", 0.6),
    ("crt_room",     "arpanet_1972.mp4",  43.4, 2.6, "paper"),
    ("arpanet_net",  "arpanet_1972.mp4", 1221.5, 6.0, "paper"),
    ("sage_scope",   "sage_1956.mp4",    272.0, 5.0, "paper"),
    ("sage_lightgun", "sage_1956.mp4",   277.5, 5.0, "paper"),
    ("sage_board",   "sage_1956.mp4",    316.5, 4.0, "paper"),
]

OW, OH = 1440, 1080  # keep 4:3; the scene crops/frames


def percentiles(src: Path, ss: float, t: float) -> tuple[float, float]:
    """Sample the clip at 4fps in gray and take global 2/98 percentiles."""
    raw = subprocess.run(
        ["ffmpeg", "-v", "quiet", "-ss", str(ss), "-t", str(t), "-i", str(src),
         "-vf", "fps=4,scale=160:120", "-f", "rawvideo", "-pix_fmt", "gray", "-"],
        capture_output=True, check=True).stdout
    g = np.frombuffer(raw, dtype=np.uint8)
    return float(np.percentile(g, 2)), float(np.percentile(g, 98))


def treat(name: str, src: Path, ss: float, t: float, tint: str,
          speed: float = 1.0) -> dict:
    src_t = t * speed  # source seconds needed for t output seconds
    lo, hi = percentiles(src, ss, src_t)
    span = max(hi - lo, 1.0)
    fg = ACID if tint == "acid" else PAPER
    # gray val → normalized^1.1 → duotone, per channel (expr runs on 0..255)
    norm = f"pow(min(max((val-{lo})/{span},0),1),1.1)"
    lut = ":".join(
        f"{ch}='{c0}+({c1}-{c0})*{norm}'"
        for ch, c0, c1 in zip("rgb", BGC, fg)
    )
    slow = f"setpts=PTS/{speed}," if speed != 1.0 else ""
    vf = (
        f"{slow}scale={OW}:{OH}:force_original_aspect_ratio=increase,"
        f"crop={OW}:{OH},format=gray,noise=c0s=7:c0f=t,format=rgb24,"
        f"lutrgb={lut}"
    )
    dst = DST / f"{name}.mp4"
    subprocess.run(
        ["ffmpeg", "-v", "quiet", "-y", "-ss", str(ss), "-t", str(src_t),
         "-i", str(src), "-vf", vf, "-an",
         "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p",
         "-movflags", "+faststart", str(dst)],
        check=True)
    dur = float(subprocess.run(
        ["ffprobe", "-v", "quiet", "-show_entries", "format=duration",
         "-of", "csv=p=0", str(dst)], capture_output=True, text=True).stdout)
    print(f"  {name}.mp4  {t:.1f}s asked / {dur:.2f}s got  lo={lo:.0f} hi={hi:.0f}")
    return {"file": f"{name}.mp4", "duration": round(dur, 3)}


def main() -> None:
    DST.mkdir(parents=True, exist_ok=True)
    out = {}
    for name, srcname, ss, t, tint, *rest in CLIPS:
        out[name] = treat(name, RAW / srcname, ss, t, tint, *rest)
    (ROOT / "src" / "data" / "footage.json").write_text(json.dumps(out, indent=1))
    print("wrote src/data/footage.json")


if __name__ == "__main__":
    main()
