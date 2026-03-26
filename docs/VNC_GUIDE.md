# VNC Setup Guide

## Quick Start

1. Start VNC: `./scripts/vnc-setup.sh`
2. Connect to: `localhost:5901`
3. Check status: `./scripts/vnc-status.sh`

## Available Scripts

- `vnc-setup.sh` - Full VNC setup with apps
- `vnc-master.sh` - Master orchestrator
- `vnc-status.sh` - Check VNC status
- `vnc-apps.sh` - Launch apps (firefox, chromium, code, all)
- `vnc-terminal.sh` - Launch terminal
- `vnc-screenshot.sh` - Take screenshot
- `vnc-keepalive.sh` - Monitor and auto-restart

## Available Apps

- Firefox
- Chromium
- VS Code

## Troubleshooting

- Check logs: `tail /tmp/vnc-master.log`
- Restart: `pkill -f Xvnc && ./scripts/vnc-setup.sh`
