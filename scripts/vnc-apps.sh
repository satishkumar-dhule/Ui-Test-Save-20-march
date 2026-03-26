#!/usr/bin/env bash
# VNC App Launcher - Launch apps in the VNC session
# Usage: ./scripts/vnc-apps.sh [app1 app2 ...]

set -euo pipefail

export DISPLAY=:1

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}[VNC]${NC} $1"; }
err() { echo -e "${RED}[VNC]${NC} $1"; }

# Available apps with launch commands
declare -A APPS=(
  ["firefox"]="firefox"
  ["chromium"]="chromium-browser --no-sandbox --disable-gpu --disable-dev-shm-usage"
  ["code"]="code --no-sandbox --disable-gpu --disable-dev-shm-usage --new-window"
  ["terminal"]="xterm 2>/dev/null || lxterminal 2>/dev/null || x-terminal-emulator 2>/dev/null"
)

launch_app() {
  local app="$1"
  local cmd="${APPS[$app]}"
  
  if [ -z "$cmd" ]; then
    err "Unknown app: $app"
    return 1
  fi
  
  log "Launching $app..."
  eval "$cmd &" 2>/dev/null
  sleep 1
  log "Launched $app"
}

list_apps() {
  echo "Available apps:"
  for app in "${!APPS[@]}"; do
    echo "  - $app"
  done
}

launch_all() {
  log "Launching all available apps..."
  launch_app firefox
  launch_app chromium
  log "Done! Check VNC session at localhost:5901"
}

# Main
case "${1:-all}" in
  list|ls)
    list_apps
    ;;
  all)
    launch_all
    ;;
  *)
    launch_app "$1"
    ;;
esac
