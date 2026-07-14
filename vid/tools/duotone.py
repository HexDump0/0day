#!/usr/bin/env python3
"""Duotone-treat the fetched YSWS artwork into the 0day palette.

Grayscale → percentile-normalized → mapped bg(#0b0b09) → paper(#e8e7e0),
capped below full white so the archival cards stay dimmer than 0day's own
acid moments. SVGs are copied through untouched (tinted via CSS at runtime).
"""
import json
import subprocess
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "ysws"
DST = ROOT / "public" / "assets" / "ysws"
MAX_W = 900

BGC = np.array([0x0B, 0x0B, 0x09], dtype=np.float32)
FGC = np.array([0xE8, 0xE7, 0xE0], dtype=np.float32) * 0.88  # capped paper


def probe(path: Path) -> tuple[int, int]:
    out = subprocess.run(
        ["ffprobe", "-v", "quiet", "-select_streams", "v:0", "-show_entries",
         "stream=width,height", "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, check=True).stdout.strip()
    w, h = out.split(",")[:2]
    return int(w), int(h)


def treat(src: Path, dst: Path) -> None:
    w, h = probe(src)
    ow = min(w, MAX_W)
    oh = int(h * ow / w) & ~1
    raw = subprocess.run(
        ["ffmpeg", "-v", "quiet", "-i", str(src),
         "-vf", f"scale={ow}:{oh}", "-f", "rawvideo", "-pix_fmt", "gray", "-"],
        capture_output=True, check=True).stdout
    g = np.frombuffer(raw, dtype=np.uint8).reshape(oh, ow).astype(np.float32)
    lo, hi = np.percentile(g, 2), np.percentile(g, 98)
    g = np.clip((g - lo) / max(hi - lo, 1), 0, 1) ** 1.1
    rgb = (BGC + (FGC - BGC) * g[..., None]).astype(np.uint8)
    subprocess.run(
        ["ffmpeg", "-v", "quiet", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
         "-s", f"{ow}x{oh}", "-i", "-", str(dst)],
        input=rgb.tobytes(), check=True)
    print(f"  {dst.name}  {ow}x{oh}")


def main() -> None:
    DST.mkdir(parents=True, exist_ok=True)
    manifest = json.loads((SRC / "manifest.json").read_text())
    out = {}
    for slug, meta in manifest.items():
        f = SRC / meta["file"]
        if f.suffix == ".svg":
            (DST / f.name).write_bytes(f.read_bytes())
            out[slug] = {"file": f.name, "svg": True}
            print(f"  {f.name}  (svg, copied)")
        else:
            dst = DST / f"{slug}.png"
            treat(f, dst)
            w, h = probe(dst)
            out[slug] = {"file": dst.name, "width": w, "height": h}
    (ROOT / "src" / "data" / "ysws-assets.json").write_text(json.dumps(out, indent=1))
    print("wrote src/data/ysws-assets.json")


if __name__ == "__main__":
    main()
