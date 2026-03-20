#!/usr/bin/env bash
# Screenshot capture script using nix-shell environment

export OUTPUT_DIR="/home/runner/workspace/artifacts/devprep/test-results"
mkdir -p "$OUTPUT_DIR"

nix-shell -p chromium --run '
CHROMIUM_FLAGS="--headless --disable-gpu --no-sandbox --disable-dev-shm-usage --screenshot=$OUTPUT_DIR"

echo "Capturing screenshots..."

# Homepage
echo "Capturing: homepage"
chromium "$CHROMIUM_FLAGS/homepage.png" http://localhost:5174 2>/dev/null

# DevOps Questions
echo "Capturing: devops_questions"
chromium "$CHROMIUM_FLAGS/devops_questions.png" "http://localhost:5174/channel/devops?section=questions" 2>/dev/null

# DevOps Flashcards
echo "Capturing: devops_flashcards"
chromium "$CHROMIUM_FLAGS/devops_flashcards.png" "http://localhost:5174/channel/devops?section=flashcards" 2>/dev/null

# DevOps Exam
echo "Capturing: devops_exam"
chromium "$CHROMIUM_FLAGS/devops_exam.png" "http://localhost:5174/channel/devops?section=exam" 2>/dev/null

# DevOps Voice
echo "Capturing: devops_voice"
chromium "$CHROMIUM_FLAGS/devops_voice.png" "http://localhost:5174/channel/devops?section=voice" 2>/dev/null

# DevOps Coding
echo "Capturing: devops_coding"
chromium "$CHROMIUM_FLAGS/devops_coding.png" "http://localhost:5174/channel/devops?section=coding" 2>/dev/null

echo ""
echo "=== Screenshot Results ==="
for f in "$OUTPUT_DIR"/*.png; do
  if [ -f "$f" ]; then
    size=$(stat -c%s "$f" 2>/dev/null || stat -f%z "$f" 2>/dev/null)
    echo "✓ $(basename $f) ($size bytes)"
  fi
done
'
