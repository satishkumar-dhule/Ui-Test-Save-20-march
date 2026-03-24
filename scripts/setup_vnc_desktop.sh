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
xterm &
EOF
chmod +x ~/.vnc/xstartup

echo "Configured ~/.vnc/xstartup to launch Fluxbox and XTerm."
