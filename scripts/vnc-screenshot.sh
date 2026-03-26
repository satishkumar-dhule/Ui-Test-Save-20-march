#!/usr/bin/env bash
export DISPLAY=:1
OUT="/tmp/vnc-screenshot-$(date +%Y%m%d-%H%M%S).png"
echo "Taking screenshot..."
if command -v import >/dev/null 2>&1; then
    import -window root "$OUT"
elif command -v xwd >/dev/null 2>&1; then
    xwd -root | convert xwd:- "$OUT" 2>/dev/null
else
    echo "No screenshot tool available"
    exit 1
fi
echo "Saved to: $OUT"