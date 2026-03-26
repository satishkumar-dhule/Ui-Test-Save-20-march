#!/usr/bin/env bash
export DISPLAY=:1

launch() {
    echo "Launching $1..."
    case "$1" in
        firefox) firefox &>/dev/null & ;;
        chromium|chrome) chromium-browser --no-sandbox --disable-gpu --window-size=1000,700 &>/dev/null & ;;
        code|vscode) code --no-sandbox --disable-gpu --new-window /home/runner/workspace &>/dev/null & ;;
        *) echo "Unknown: $1. Try: firefox, chromium, code" ;;
    esac
}

case "${1:-help}" in
    firefox|chromium|chrome|code|vscode) launch "$1" ;;
    all) launch firefox; launch chromium; launch code ;;
    *) echo "Usage: $0 {firefox|chromium|code|all}" ;;
esac
