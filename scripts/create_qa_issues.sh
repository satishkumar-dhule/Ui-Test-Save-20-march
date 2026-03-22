#!/usr/bin/env bash
set -euo pipefail

# Simple helper to create GitHub issues from qa/issues.json using gh CLI
# Requires: gh CLI installed and authenticated

REPO=${REPO:-"OWNER/REPO"}
JSON_FILE="qa/issues.json"

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI not found. Please install and authenticate gh to use this script." >&2
  exit 1
fi

if [[ ! -f "$JSON_FILE" ]]; then
  echo "Missing $JSON_FILE" >&2
  exit 1
fi

jq -c '.[]' "$JSON_FILE" | while read -r item; do
  title=$(echo "$item" | jq -r '.title')
  body=$(echo "$item" | jq -r '.body')
  labels=$(echo "$item" | jq -r '.labels | join(",")')
  assignee=$(echo "$item" | jq -r '.assignee')
  link=$(echo "$item" | jq -r '.link')

  echo "Creating issue: $title (labels: $labels, assignee: $assignee)"
  gh issue create --repo "$REPO" --title "$title" --body "$body\n\nReference: $link" --label "$labels" --assignee "$assignee" >/dev/null
done

echo "QA issues creation attempted. Review results in GitHub."
