#!/usr/bin/env bash
# Usage: ./scripts/launch-app.sh firefox
# Usage: ./scripts/launch-app.sh chromium-browser
# Usage: ./scripts/launch-app.sh code

set -euo pipefail
APP="${1:-}"
if [ -z "$APP" ]; then
  echo "Usage: $0 <app-name>"
  echo "Examples: firefox, chromium-browser, code, geany"
  exit 1
fi

export DISPLAY=:1
if command -v "$APP" >/dev/null 2>&1; then
  echo "Launching $APP on display :1..."
  "$APP" &>/dev/null &
  echo "Launched $APP (PID: $!)"
else
  echo "App '$APP' not found. Available apps:"
  echo "  firefox chromium-browser code geany evince libreoffice"
fi
