#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# bun-commands.sh — Bun equivalents for the DevPrep monorepo
#
# Usage: source bun-commands.sh
#        then call: bun:install, bun:dev, bun:build, etc.
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── bun:install ───────────────────────────────────────────────────────────────
# Replaces: pnpm install
bun:install() {
  echo "→ bun install"
  bun install "$@"
}

# ── bun:dev ───────────────────────────────────────────────────────────────────
# Starts the frontend Vite dev server
bun:dev() {
  echo "→ Starting frontend dev server (Vite)"
  bun run --filter @workspace/devprep dev "$@"
}

# ── bun:dev:server ────────────────────────────────────────────────────────────
# Starts the backend Express server with --watch (replaces tsx watch)
bun:dev:server() {
  echo "→ Starting backend server with --watch"
  bun run --filter @workspace/devprep-server dev "$@"
}

# ── bun:build ─────────────────────────────────────────────────────────────────
# Full build: typecheck libs, then build all packages
bun:build() {
  echo "→ Running typecheck on libs"
  bun run typecheck:libs
  echo "→ Building all workspaces"
  bun run -r --if-present build "$@"
}

# ── bun:test ──────────────────────────────────────────────────────────────────
# Run vitest in the devprep frontend
bun:test() {
  echo "→ Running vitest"
  bun run --filter @workspace/devprep test "$@"
}

# ── bun:test:e2e ──────────────────────────────────────────────────────────────
# Run Playwright E2E tests
bun:test:e2e() {
  echo "→ Running Playwright E2E tests"
  bun run --filter @workspace/e2e test "$@"
}

# ── bun:generate ──────────────────────────────────────────────────────────────
# Generate content via the content-gen package
bun:generate() {
  local type="${1:-}"
  if [[ -n "$type" ]]; then
    echo "→ Generating $type content"
    cd content-gen && CONTENT_TYPE="$type" bun run generate-content.mjs
  else
    echo "→ Generating all content"
    cd content-gen && bun run generate-content.mjs
  fi
}

# ── bun:generate:parallel ────────────────────────────────────────────────────
# Run parallel multi-agent content generation across all channels
bun:generate:parallel() {
  local mode="${1:-}"
  case "$mode" in
    dry)
      echo "→ Parallel generation (dry run)"
      cd content-gen && DRY_RUN=true bun run generate-all-parallel.mjs
      ;;
    batch)
      echo "→ Parallel generation (batch, 2 per task)"
      cd content-gen && COUNT=2 bun run generate-all-parallel.mjs
      ;;
    fast)
      echo "→ Parallel generation (fast, 15 workers)"
      cd content-gen && CONCURRENCY=15 bun run generate-all-parallel.mjs
      ;;
    *)
      echo "→ Parallel generation (default: 1 per task, 30 workers)"
      cd content-gen && bun run generate-all-parallel.mjs
      ;;
  esac
}

# ── bun:typecheck ─────────────────────────────────────────────────────────────
# Run TypeScript type checking across the monorepo
bun:typecheck() {
  echo "→ Typechecking libs (tsc --build)"
  bun x tsc --build
  echo "→ Typechecking workspace packages"
  bun run -r --filter "./artifacts/**" --filter "./scripts" --if-present typecheck
}

# ── Alias helpers ─────────────────────────────────────────────────────────────
alias bi="bun:install"
alias bd="bun:dev"
alias bds="bun:dev:server"
alias bb="bun:build"
alias bt="bun:test"
alias bte="bun:test:e2e"
alias bg="bun:generate"
alias bgp="bun:generate:parallel"
alias btc="bun:typecheck"

echo "✓ Bun commands loaded. Use: bun:install, bun:dev, bun:dev:server, bun:build, bun:test, bun:test:e2e, bun:generate, bun:generate:parallel, bun:typecheck"
echo "  Shortcuts: bi, bd, bds, bb, bt, bte, bg, bgp, btc"
echo "  Parallel: bgp, bgp dry, bgp batch, bgp fast"
