#!/usr/bin/env bash
set -euo pipefail

echo "[VNC Setup] Killing existing sessions..."
pkill -f fluxbox 2>/dev/null || true
pkill -f Xvnc 2>/dev/null || true
sleep 1

echo "[VNC Setup] Creating xstartup..."
mkdir -p ~/.vnc
cat > ~/.vnc/xstartup << 'XEOF'
#!/bin/sh
export XDG_CURRENT_DESKTOP=Fluxbox
export DISPLAY=:1
fluxbox &>/dev/null &
sleep 2
firefox &>/dev/null &
chromium-browser --no-sandbox --disable-gpu --window-size=1000,700 &>/dev/null &
XEOF
chmod +x ~/.vnc/xstartup

echo "[VNC Setup] Starting Xvnc..."
Xvnc :1 -geometry 1280x800 -depth 24 -SecurityTypes=None -rfbport 5901 &>/dev/null &
sleep 2

echo "[VNC Setup] Starting Fluxbox..."
DISPLAY=:1 fluxbox &>/dev/null &
sleep 2

echo "[VNC Setup] Launching apps..."
DISPLAY=:1 firefox &>/dev/null &
DISPLAY=:1 chromium-browser --no-sandbox --disable-gpu --window-size=1000,700 &>/dev/null &

echo "[VNC Setup] Done! Connect to localhost:5901"
echo "[VNC Setup] Processes:"
ps -ef | grep -E "Xvnc|fluxbox|firefox|chromium" | grep -v grep | grep -v headless | grep -v contentproc