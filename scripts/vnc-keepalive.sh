#!/usr/bin/env bash
echo "[VNC Keepalive] Starting monitor..."
while true; do
    if ! pgrep -f Xvnc >/dev/null; then
        echo "$(date): VNC not running, restarting..."
        Xvnc :1 -geometry 1280x800 -depth 24 -SecurityTypes=None -rfbport 5901 &>/dev/null &
        sleep 2
        DISPLAY=:1 fluxbox &>/dev/null &
    fi
    sleep 30
done
