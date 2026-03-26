#!/usr/bin/env bash
set -euo pipefail

export DISPLAY=:1
LOG="/tmp/vnc-master.log"

start_vnc() {
    echo "[VNC] Starting VNC server..."
    pkill -f Xvnc 2>/dev/null || true
    sleep 1
    Xvnc :1 -geometry 1280x800 -depth 24 -SecurityTypes=None -rfbport 5901 &>/dev/null &
    sleep 2
    fluxbox &>/dev/null &
    sleep 1
    echo "[VNC] VNC started on port 5901"
}

launch_app() {
    local app="$1"
    echo "[VNC] Launching $app..."
    case "$app" in
        firefox) firefox &>/dev/null & ;;
        chromium) chromium-browser --no-sandbox --disable-gpu &>/dev/null & ;;
        code) code --no-sandbox --disable-gpu --new-window /home/runner/workspace &>/dev/null & ;;
        *) echo "[VNC] Unknown app: $app" ;;
    esac
}

launch_all() {
    start_vnc
    launch_app firefox
    launch_app chromium
    echo "[VNC] All apps launched. Connect to localhost:5901"
}

status() {
    echo "=== VNC Status ==="
    ps -ef | grep -E "Xvnc|fluxbox" | grep -v grep || echo "VNC not running"
    echo "=== Running Apps ==="
    ps -ef | grep -E "firefox|chromium" | grep -v grep | grep -v headless | grep -v contentproc || echo "No apps"
}

case "${1:-help}" in
    start) start_vnc ;;
    launch) launch_app "${2:-firefox}" ;;
    all) launch_all ;;
    status) status ;;
    *) echo "Usage: $0 {start|launch <app>|all|status}" ;;
esac