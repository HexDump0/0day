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
# The verse runs uncut from its first line (13.98 — ducked under the
# explainer by the Mix envelope, back to full as the first YSWS card lands)
# through "destroyed recaptcha" (ends 49.27, right at the tape-stop).
# Still cut: only the lines that would spill into the gap (49.27, 51.67).
# The full chorus is IN per user decision 2026-07-16 — booze, vodka and all;
# it plays as an uncut call-and-response from the drop to the outro.
ALLOWED = {
    0.66,    # Not every geek with a Commodore 64... (Hackers 1995 sample)
    8.75,    # This one's dedicated to all the hackers
    13.98, 15.87, 19.06, 21.27, 24.16, 26.32, 28.91, 31.55, 33.84, 35.49,
    36.26, 37.69, 39.43, 41.58, 42.13, 42.98, 44.15, 46.73,
    54.25, 56.86, 59.36, 64.15, 66.89, 69.52,  # Drink all the booze (x6)
    55.56, 57.95, 60.62, 65.55, 68.23, 70.75,  # Hack all the things (x6)
    61.69, 62.83,  # Got this Vodka and this Redbull / They still give me wings
    71.60,   # Zero through Three
    72.88,   # We're in every single ring
}

# Lines whose gate stays open past the estimated end so the stem's tail can
# be faded out slowly instead of clipped: LRC time -> gate end.
EXTENDED_ENDS = {
    8.75: 13.6,  # dedication reverb tail breathes out over the explainer
}

# Lines whose sung attack starts before the LRC time by more than PRE_ROLL:
# LRC time -> extra pre-roll seconds. (Empty: an early-open of the first
# chorus line's "So" pickup was tried 2026-07-16 and reverted — the vocal
# should enter at the drop, not before it.)
EARLY_STARTS: dict[float, float] = {}

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
        if ln["time"] in EXTENDED_ENDS:
            end = EXTENDED_ENDS[ln["time"]]
        out.append({
            "time": ln["time"],
            "end": round(end, 3),
            "gateStart": round(ln["time"] - PRE_ROLL - EARLY_STARTS.get(ln["time"], 0), 3),
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
