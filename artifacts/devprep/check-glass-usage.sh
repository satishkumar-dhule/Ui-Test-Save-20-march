#!/bin/bash
# Script to detect usage of glass utility classes in TSX/TS files
set -e
cd "$(dirname "$0")"
echo "Searching for glass class usage in src/..."
echo "---------------------------------------------------"

# Pattern for glass utility classes (starting with 'glass')
PATTERN='class[[:space:]]*=[[:space:]]*"[^"]*\bglass[-a-z]*\b'

FILES=$(find src -type f \( -name "*.tsx" -o -name "*.ts" \))
TOTAL=0
for f in $FILES; do
  COUNT=$(grep -c -E "$PATTERN" "$f" 2>/dev/null || true)
  if [ "$COUNT" -gt 0 ]; then
    echo "$f: $COUNT matches"
    TOTAL=$((TOTAL + COUNT))
  fi
done
echo "---------------------------------------------------"
echo "Total glass class occurrences: $TOTAL"
if [ "$TOTAL" -eq 0 ]; then
  echo "WARNING: No glass utility classes found in source code."
  echo "Glass theme is defined but not used."
fi