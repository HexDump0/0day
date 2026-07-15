#!/usr/bin/env bash
# Loudness finishing: two-pass loudnorm to -14 LUFS (YouTube/social standard),
# video stream copied untouched.
set -euo pipefail
cd "$(dirname "$0")/.."

IN=out/0day-launch.mp4
OUT=out/0day-launch-final.mp4

# no tail: newer ffmpeg appends summary lines after the JSON block
STATS=$(ffmpeg -i "$IN" -af loudnorm=I=-14:TP=-1.2:LRA=11:print_format=json -f null - 2>&1)
I=$(echo "$STATS" | grep input_i | grep -oE '[-0-9.]+')
TP=$(echo "$STATS" | grep input_tp | grep -oE '[-0-9.]+')
LRA=$(echo "$STATS" | grep input_lra | grep -oE '[-0-9.]+' | head -1)
TH=$(echo "$STATS" | grep input_thresh | grep -oE '[-0-9.]+')

echo "measured: I=$I TP=$TP LRA=$LRA thresh=$TH"

ffmpeg -y -i "$IN" -c:v copy \
  -af "loudnorm=I=-14:TP=-1.2:LRA=11:measured_I=$I:measured_TP=$TP:measured_LRA=$LRA:measured_thresh=$TH:linear=true" \
  -c:a aac -b:a 320k "$OUT"

echo "final:"
ffmpeg -i "$OUT" -af loudnorm=I=-14:TP=-1.2:print_format=summary -f null - 2>&1 | grep -A2 'Input Integrated' | head -3
