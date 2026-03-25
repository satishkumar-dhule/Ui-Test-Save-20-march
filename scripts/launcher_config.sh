#!/usr/bin/env bash
# Simple launcher config for VNC Fluxbox in Replit
# Each entry: NAME|CMD|WORKSPACE
# WORKSPACE is 1-based; Fluxbox workspaces are 0-based internally
LAUNCH_APPS=(
  "Firefox|firefox|1|800x600+20+20"
  "Chromium|chromium-browser|1|1200x800+10+10"
  "Google Chrome|google-chrome|1|1024x768+30+30"
  "Chrome|chrome|1|900x550+50+50"
  "Code|code|1|1400x900+200+50"
  "Code OSS|code-oss|1|1400x900+200+50"
  "Geany|geany|1|900x700+100+100"
  "LibreOffice Writer|libreoffice --writer|2|1000x700+60+60"
  "LibreOffice Calc|libreoffice --calc|2|900x600+70+70"
  "Evince|evince|3|800x600+60+60"
  "Okular|okular|3|800x520+80+80"
  "XTerm|xterm|4|800x400+50+50"
  "VS Code|code|1|1500x900+320+50"
  "VS Code Insiders|code-insiders|1|1500x900+360+60"
  "Sublime Text|subl|1|1200x900+80+80"
)
