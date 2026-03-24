#!/usr/bin/env bash
set -euo pipefail

# Ensure ~/.vnc exists
mkdir -p ~/.vnc

# Create a minimal xstartup that launches Fluxbox and a simple terminal
cat > ~/.vnc/xstartup << 'EOF'
#!/bin/sh
export XDG_CURRENT_DESKTOP=Fluxbox
xrdb $HOME/.Xresources 2>/dev/null
fluxbox &
sleep 0.5
# Auto-launch common GUI apps if installed
APPS="firefox chromium-browser google-chrome chrome"
for APP in $APPS; do
  if command -v "$APP" >/dev/null 2>&1; then
    "$APP" &
  fi
fi
# Optional: try to move newly opened apps to workspace 1 if wmctrl is available
if command -v wmctrl >/dev/null 2>&1; then
  sleep 1
  # Move the currently active window to workspace 1 (if something is focused)
  wmctrl -r :ACTIVE: -t 0 2>/dev/null || true
fi

# Start E2E launcher if present (for automated workspace-arrangement)
if [ -x "/home/runner/workspace/scripts/e2e_launcher.sh" ]; then
  /bin/bash "/home/runner/workspace/scripts/e2e_launcher.sh" &
fi
EOF
LOG="/tmp/e2e_launcher.log"
echo "[E2E] Kick-off" >> "$LOG" 2>&1 || true
if [ -x "/home/runner/workspace/scripts/e2e_launcher.sh" ]; then
  /bin/bash "/home/runner/workspace/scripts/e2e_launcher.sh" >> "$LOG" 2>&1 &
fi
chmod +x ~/.vnc/xstartup

echo "Configured ~/.vnc/xstartup to launch Fluxbox and XTerm."
