#!/usr/bin/env bash
set -euo pipefail

LOG="/tmp/e2e_launcher.log"
exec >> "$LOG" 2>&1

export DISPLAY=:1
DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "$DIR/launcher_config.sh" ]; then
  . "$DIR/launcher_config.sh"
fi

has_cmd() { command -v "$1" >/dev/null 2>&1; }
has_wmctrl() { has_cmd wmctrl; }

place_window() {
  local name="$1"
  if has_wmctrl; then
    wmctrl -r "$name" -t 0 2>/dev/null || true
    wmctrl -r "$name" -b add,maximized_vert,maximized_horz 2>/dev/null || true
  fi
}

wait_for_window() {
  local key="$1"; local timeout="${2:-20}"
  local i=0
  while [ $i -lt $timeout ]; do
    if wmctrl -l | grep -i -- "$key" >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.5
    i=$((i+1))
  done
  return 1
}

echo "[E2E] Starting Fluxbox and launching apps..." > /dev/null

# Ensure Fluxbox is running
fluxbox &>/dev/null &
sleep 1

# Load launcher config (if present) and merge with defaults
if [ -f "$DIR/launcher_config.sh" ]; then
  source "$DIR/launcher_config.sh"
fi

# Launch common GUI apps if installed (defaults) or from config
if [ -n "${LAUNCH_APPS:+x}" ]; then
for entry in "${LAUNCH_APPS[@]}"; do
  IFS='|' read -r NAME CMD WORKSPACE GEOMETRY <<< "$entry"
    if command -v "$CMD" >/dev/null 2>&1; then
      "$CMD" &>/dev/null &
      if [ -n "$WORKSPACE" ] && [ "$WORKSPACE" -ge 1 ]; then
        if command -v wmctrl >/dev/null 2>&1; then
          sleep 0.6
          wmctrl -l | grep -i -- "$NAME" >/dev/null 2>&1 && wmctrl -r "$NAME" -t $((WORKSPACE-1)) 2>/dev/null || true
        fi
      fi
    fi
  done
else
  APPS=( firefox chromium-browser google-chrome chrome xterm )
  for APP in "${APPS[@]}"; do
    if command -v "$APP" >/dev/null 2>&1; then "$APP" &>/dev/null &; fi
  done
fi

# Attempt to place known apps on workspace 1
sleep 2
if [ -f "$DIR/launcher_config.sh" ]; then
  # We will try to place windows based on config entries
  for entry in "${LAUNCH_APPS[@]}"; do
    IFS='|' read -r NAME CMD WORKSPACE <<< "$entry"
      if command -v wmctrl >/dev/null 2>&1; then
        # If a window with the given NAME exists, place it
        if wmctrl -l 2>/dev/null | grep -i -- "$NAME" >/dev/null 2>&1; then
          if [ -n "$GEOMETRY" ]; then
            # parse GEOMETRY as WIDTHxHEIGHT+X+Y
            if [[ "$GEOMETRY" =~ ^([0-9]+)x([0-9]+)\+([0-9]+)\+([0-9]+)$ ]]; then
              W="${BASH_REMATCH[1]}"; H="${BASH_REMATCH[2]}"; X="${BASH_REMATCH[3]}"; Y="${BASH_REMATCH[4]}"
              wmctrl -r "$NAME" -e 0,"$X","$Y","$W","$H" 2>/dev/null || true
            fi
          else
            place_window "$NAME" || true
          fi
        fi
      fi
  done
fi

echo "[E2E] Launcher finished." 
