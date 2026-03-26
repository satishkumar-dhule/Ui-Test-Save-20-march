#!/usr/bin/env bash
echo "=========================================="
echo "         VNC SESSION STATUS              "
echo "=========================================="
echo ""
echo "--- VNC Server ---"
if pgrep -f Xvnc >/dev/null; then
    echo "Status: RUNNING"
    ps -ef | grep Xvnc | grep -v grep
else
    echo "Status: NOT RUNNING"
fi
echo ""
echo "--- Fluxbox WM ---"
if pgrep -f fluxbox >/dev/null; then
    echo "Status: RUNNING"
else
    echo "Status: NOT RUNNING"
fi
echo ""
echo "--- GUI Applications ---"
echo "Firefox:" && pgrep -f firefox >/dev/null && echo "  RUNNING" || echo "  NOT RUNNING"
echo "Chromium:" && pgrep -f chromium-browser >/dev/null && echo "  RUNNING" || echo "  NOT RUNNING"
echo ""
echo "--- Connection Info ---"
echo "VNC Port: 5901"
echo "Display: :1"
echo "Connect: localhost:5901"
echo "=========================================="
