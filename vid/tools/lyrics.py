#!/usr/bin/env python3
"""Parse the LRC lyric file into src/data/lyrics.json.

Each line gets an `allowed` flag — the vocal stem is only audible on allowed
lines (this is how the booze/vodka references and the "hack into NASA" bar get
edited out for an official Hack Club video while keeping the hook).

Gate windows: start = LRC time - PRE_ROLL, end = next line start (or a
word-count estimate for the last line before an instrumental stretch).
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "music" / "lyric.txt"
OUT = ROOT / "src" / "data" / "lyrics.json"

PRE_ROLL = 0.18   # open gate slightly early so consonants aren't clipped
POST_PAD = 0.15   # keep gate open a touch after the estimated line end
CUTOFF = 79.0     # video uses only the first ~79s of the song

# Times (LRC) of lines the vocal stem may pass through.
ALLOWED = {
    8.75,    # This one's dedicated to all the hackers
    19.06,   # Put your bytes up, prove it or you forfeit
    36.26,   # Passing code, didn't sanitize
    37.69,   # Command lines; land mine
    44.15,   # Don't prove we're human unless we really hafta
    46.73,   # My team built schemes that destroyed recaptcha
    55.56, 57.95, 60.62, 65.55, 68.23, 70.75,  # Hack all the things (x6)
    71.60,   # Zero through Three
    72.88,   # We're in every single ring
}

LRC_RE = re.compile(r"\[(\d+):(\d+(?:\.\d+)?)\](.*)")


def main() -> None:
    lines = []
    for raw in SRC.read_text().splitlines():
        m = LRC_RE.match(raw.strip())
        if not m:
            continue
        t = int(m.group(1)) * 60 + float(m.group(2))
        text = m.group(3).strip()
        if text:
            lines.append({"time": t, "text": text})

    out = []
    for i, ln in enumerate(lines):
        if ln["time"] >= CUTOFF:
            break
        nxt = lines[i + 1]["time"] if i + 1 < len(lines) else CUTOFF
        words = len(ln["text"].split())
        est_end = ln["time"] + min(0.42 * words + 0.35, 4.0) + POST_PAD
        end = min(nxt, est_end, CUTOFF)
        out.append({
            "time": ln["time"],
            "end": round(end, 3),
            "gateStart": round(ln["time"] - PRE_ROLL, 3),
            "text": ln["text"],
            "allowed": ln["time"] in ALLOWED,
        })

    missing = ALLOWED - {l["time"] for l in out}
    if missing:
        raise SystemExit(f"whitelist times not found in LRC: {sorted(missing)}")

    OUT.write_text(json.dumps(out, indent=1))
    kept = [l for l in out if l["allowed"]]
    print(f"wrote {OUT}: {len(out)} lines, {len(kept)} allowed")
    for l in kept:
        print(f"  {l['time']:6.2f}-{l['end']:6.2f}  {l['text']}")


if __name__ == "__main__":
    main()
