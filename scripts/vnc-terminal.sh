#!/usr/bin/env bash
export DISPLAY=:1
echo "Launching terminal..."
if command -v xterm >/dev/null 2>&1; then
    xterm -geometry 80x24+100+100 &>/dev/null &
elif command -v lxterminal >/dev/null 2>&1; then
    lxterminal &>/dev/null &
else
    echo "No terminal found"
    exit 1
fi
echo "Terminal launched"
