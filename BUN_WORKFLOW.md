# Bun Workflow Guide — DevPrep Monorepo

> Complete reference for running this monorepo entirely with [Bun](https://bun.sh) instead of pnpm/node/tsx.

---

## Table of Contents

1. [Installation & Setup](#1-installation--setup)
2. [Development](#2-development)
3. [Building](#3-building)
4. [Testing](#4-testing)
5. [Running Scripts](#5-running-scripts)
6. [Docker](#6-docker)
7. [Migration Cheatsheet](#7-migration-cheatsheet-pnpm--bun)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Installation & Setup

### Install Bun

```bash
# Official install script (macOS/Linux)
curl -fsSL https://bun.sh/install | bash

# Or via npm (if you still have Node available)
npm install -g bun

# Or via Homebrew
brew install oven-sh/bun/bun
```

### Verify Installation

```bash
bun --version   # Should print 1.x.x or higher
bun --revision  # Prints detailed build info
which bun       # Should point to ~/.bun/bin/bun
```

### Shell Integration

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
# Bun
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
```

### Install Dependencies

```bash
# Replace pnpm install — reads package.json workspaces natively
bun install

# First-time install (equivalent to pnpm install --frozen-lockfile for CI)
bun install --frozen-lockfile
```

> **Note:** Bun auto-detects `package.json` workspaces. No `bun-workspace.yaml` needed — it reads the `workspaces` field from root `package.json`.

### Regenerate Lockfile

```bash
# Delete pnpm lockfile and generate bun.lockb
rm -f pnpm-lock.yaml
bun install
```

---

## 2. Development

### Frontend (Vite + React)

```bash
# From repo root — runs the devprep frontend dev server
bun run --filter @workspace/devprep dev

# Or from the devprep directory directly
cd artifacts/devprep
bun run dev
```

**What it does:** Starts Vite dev server on `http://localhost:5173` (or PORT env) with HMR, proxying `/api` to the backend on port 3001.

### Backend (Express API Server)

```bash
# Bun replaces tsx directly — no transpile step needed
bun run --filter @workspace/devprep-server dev

# Or from the server directory directly
cd artifacts/devprep/server
bun run dev
```

The server `package.json` has `"dev": "tsx watch src/index.ts"`. Bun's equivalent:

```bash
# Direct Bun command (replaces tsx watch)
bun --watch run artifacts/devprep/server/src/index.ts
```

> **Key advantage:** Bun natively runs TypeScript — no `tsx` wrapper needed. The `--watch` flag provides auto-restart on file changes.

### Run Both Concurrently

```bash
# Option 1: Use bun's built-in concurrent execution
bun run dev & bun run dev:server

# Option 2: Install concurrently or use a script
# Add to root package.json:
# "dev:all": "bun run --filter @workspace/devprep dev & bun run --filter @workspace/devprep-server dev"
```

---

## 3. Building

### Build All Packages

```bash
# Root build script (replaces pnpm run build)
bun run build
```

This executes `pnpm run typecheck && pnpm -r --if-present run build`. For a pure Bun workflow, update root `package.json`:

```jsonc
// package.json scripts (updated for Bun)
{
  "scripts": {
    "build": "bun run typecheck && bun run --filter '*' build",
    "typecheck:libs": "bunx tsc --build",
    "typecheck": "bun run typecheck:libs && bun run --filter './artifacts/**' --filter './scripts' typecheck",
  },
}
```

### Build Frontend Only

```bash
cd artifacts/devprep
bun run build
# Output: artifacts/devprep/dist/public/
```

### Build for GitHub Pages

```bash
cd artifacts/devprep
bun run build:github
# Output: artifacts/devprep/dist/ (with BASE_PATH=/DevPrep/)
```

### Typecheck

```bash
# Full typecheck across all packages
bun run typecheck

# Individual package
cd artifacts/devprep && bunx tsc --noEmit
cd artifacts/devprep/server && bunx tsc --noEmit
```

> **Note:** Use `bunx` instead of `npx` to run TypeScript compiler and other CLI tools.

---

## 4. Testing

### Unit Tests (Vitest)

```bash
# Run frontend tests
cd artifacts/devprep
bun run test          # Watch mode
bun run test:run      # Single run with coverage
bun run test:ui       # Vitest UI dashboard

# Run content-gen tests
cd content-gen
bun run test
```

> **Compatibility:** Vitest works natively with Bun. No configuration changes needed.

### E2E Tests (Playwright)

```bash
# From repo root
bun run e2e           # Headless
bun run e2e:headed    # With browser UI
bun run e2e:ui        # Playwright UI mode

# Or directly
cd e2e
bunx playwright test
```

> **Important:** Playwright requires browser binaries. Install them once:
>
> ```bash
> bunx playwright install
> bunx playwright install chromium  # Just Chromium (faster)
> ```

### Run Specific Test Files

```bash
# Vitest — filter by file pattern
bun run test -- src/components/Button.test.tsx

# Playwright — filter by test name
bunx playwright test --grep "login flow"
```

---

## 5. Running Scripts

### Content Generation

```bash
# Generate all content types for a channel
cd content-gen && bun run generate

# Generate specific content types
cd content-gen && bun run generate:question
cd content-gen && bun run generate:flashcard
cd content-gen && bun run generate:coding
cd content-gen && bun run generate:exam
cd content-gen && bun run generate:voice

# Or from root (using the root scripts)
bun run generate:content
bun run generate:flashcard
```

### Save Content to Database

```bash
# Save a flashcard JSON file to the database
bun run content-gen/save-content.mjs /tmp/flashcard.json \
  --channel javascript --type flashcard

# Save inline JSON
bun run content-gen/save-content.mjs \
  --channel react --type flashcard \
  --json '{"id":"fla-123","front":"What is...","back":"It is..."}'
```

### Database Utilities

```bash
# List channels
bun run content-gen/db-channels.mjs

# Generate all channels in parallel
bun run content-gen/generate-all-parallel.mjs
```

### Custom Scripts

```bash
# Run the hello script (replaces tsx)
cd scripts
bun run hello
# Or directly: bun run scripts/src/hello.ts
```

> **Key point:** Bun runs `.ts` files natively. Every `tsx` command can be replaced with `bun run`.

---

## 6. Docker

### Production Dockerfile (Bun-based)

Replace `artifacts/devprep/Dockerfile`:

```dockerfile
# Build stage — use Bun instead of Node
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy workspace config
COPY package.json bun.lockb ./
COPY artifacts/devprep/package.json ./artifacts/devprep/
COPY lib ./lib

# Install dependencies
RUN bun install --frozen-lockfile --production=false

# Copy source
COPY artifacts/devprep ./artifacts/devprep

ARG BASE_PATH=/
ENV PORT=3000
ENV BASE_PATH=$BASE_PATH

# Build frontend
RUN bun run --filter @workspace/devprep build

# Production stage with nginx
FROM nginx:alpine AS production

RUN apk add --no-cache openssl

COPY artifacts/devprep/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/artifacts/devprep/dist/public /usr/share/nginx/html

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

### Dev Dockerfile (Bun-based)

Replace `artifacts/devprep/Dockerfile.dev`:

```dockerfile
FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lockb ./

RUN bun install --frozen-lockfile --production=false

COPY lib ./lib
COPY artifacts/devprep ./artifacts/devprep

ENV PORT=3000
ENV BASE_PATH=/
ENV NODE_ENV=development

EXPOSE 3000

CMD ["bun", "run", "--filter", "@workspace/devprep", "dev", "--host", "0.0.0.0"]
```

### API Server Dockerfile (Bun-based)

New file: `artifacts/devprep/server/Dockerfile`

```dockerfile
FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lockb ./
COPY artifacts/devprep/server/package.json ./artifacts/devprep/server/
COPY lib ./lib

RUN bun install --frozen-lockfile --production

COPY artifacts/devprep/server ./artifacts/devprep/server

ENV PORT=3001
ENV NODE_ENV=production

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/healthz || exit 1

CMD ["bun", "run", "artifacts/devprep/server/src/index.ts"]
```

### Docker Compose Updates

In `docker-compose.yml`, update the service build contexts:

```yaml
services:
  api:
    build:
      context: .
      dockerfile: artifacts/devprep/server/Dockerfile # New Bun-based Dockerfile
    # ... rest unchanged

  frontend-dev:
    build:
      context: .
      dockerfile: artifacts/devprep/Dockerfile.dev # Updated Bun version
    # ... rest unchanged

  frontend:
    build:
      context: .
      dockerfile: artifacts/devprep/Dockerfile # Updated Bun version
    # ... rest unchanged
```

---

## 7. Migration Cheatsheet (pnpm → Bun)

| pnpm                             | Bun                                     | Notes                                      |
| -------------------------------- | --------------------------------------- | ------------------------------------------ |
| `pnpm install`                   | `bun install`                           | Reads workspaces from package.json         |
| `pnpm install --frozen-lockfile` | `bun install --frozen-lockfile`         | CI usage                                   |
| `pnpm add <pkg>`                 | `bun add <pkg>`                         | Adds to dependencies                       |
| `pnpm add -D <pkg>`              | `bun add -d <pkg>`                      | Adds to devDependencies                    |
| `pnpm remove <pkg>`              | `bun remove <pkg>`                      | Removes a dependency                       |
| `pnpm run <script>`              | `bun run <script>`                      | Runs a package.json script                 |
| `pnpm --filter <pkg> <script>`   | `bun run --filter <pkg> <script>`       | Workspace-aware script execution           |
| `pnpm -r run build`              | `bun run --filter '*' build`            | Run script in all workspaces               |
| `npx <command>`                  | `bunx <command>`                        | Execute a package binary                   |
| `tsx watch src/index.ts`         | `bun --watch run src/index.ts`          | Bun runs TS natively                       |
| `tsx src/index.ts`               | `bun run src/index.ts`                  | No transpiler needed                       |
| `pnpm dlx <pkg>`                 | `bunx <pkg>`                            | One-off package execution                  |
| `pnpm test`                      | `bun test` (bun:test) or `bun run test` | Bun has built-in test runner OR use vitest |
| `pnpm exec <cmd>`                | `bunx <cmd>`                            | Execute binaries from deps                 |

### Key Differences

| Feature                        | pnpm                  | Bun                               |
| ------------------------------ | --------------------- | --------------------------------- |
| Lockfile                       | `pnpm-lock.yaml`      | `bun.lockb` (binary)              |
| Workspace config               | `pnpm-workspace.yaml` | `package.json` `workspaces` field |
| TypeScript execution           | Needs `tsx`           | Native                            |
| Install speed                  | Fast                  | Very fast (uses hardlinks)        |
| `.mjs` support                 | Yes                   | Yes                               |
| Native addons (better-sqlite3) | Yes                   | Yes (auto-compiles)               |

### Removing pnpm Artifacts

```bash
# After confirming Bun works, remove pnpm-specific files
rm -f pnpm-lock.yaml
rm -f pnpm-workspace.yaml  # Move config to package.json workspaces

# Remove corepack/preinstall guard from package.json
# Delete or update the "preinstall" script that enforces pnpm
```

### Updating the preinstall Script

In root `package.json`, change:

```jsonc
// Before (pnpm-only)
"preinstall": "sh -c 'rm -f package-lock.json yarn.lock; case \"$npm_config_user_agent\" in pnpm/*) ;; *) echo \"Use pnpm instead\" >&2; exit 1 ;; esac'"

// After (bun-compatible) — or remove entirely
"preinstall": "sh -c 'rm -f package-lock.json yarn.lock pnpm-lock.yaml'"
```

---

## 8. Troubleshooting

### better-sqlite3 Native Module

Bun auto-compiles native addons. If you encounter issues:

```bash
# Force rebuild native modules
bun install
bun rebuild better-sqlite3
```

### Permission Errors on Install

```bash
# Fix Bun's global directory permissions
chmod -R 755 ~/.bun
```

### TypeScript Path Aliases Not Resolving

Bun respects `tsconfig.json` paths. Ensure your `tsconfig.json` has:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Vite + Bun Compatibility

Vite works with Bun for dev and build. If you see issues:

```bash
# Clear Vite cache
rm -rf artifacts/devprep/node_modules/.vite

# Reinstall
bun install
```

### Playwright Browser Not Found

```bash
# Set Playwright browser path for Bun
export PLAYWRIGHT_BROWSERS_PATH=0
bunx playwright install
```

### Lockfile Conflicts

```bash
# If switching back and forth, clean install
rm -rf node_modules */node_modules bun.lockb pnpm-lock.yaml
bun install
```

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│                    BUN WORKFLOW CHEATSHEET                   │
├─────────────────────────────────────────────────────────────┤
│  Install deps:     bun install                              │
│  Dev frontend:     bun run --filter @workspace/devprep dev  │
│  Dev backend:      bun run artifacts/devprep/server/src/index.ts --watch │
│  Build all:        bun run build                            │
│  Run tests:        bun run test (vitest)                    │
│  E2E tests:        bunx playwright test                     │
│  Typecheck:        bunx tsc --noEmit                        │
│  Run script:       bun run scripts/src/hello.ts             │
│  Generate content: cd content-gen && bun run generate       │
│  Execute binary:   bunx <command>                           │
└─────────────────────────────────────────────────────────────┘
```

---

_Last updated: 2026-03-21_
_Project: DevPrep Monorepo_
