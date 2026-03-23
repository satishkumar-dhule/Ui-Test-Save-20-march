# Workspace

## Key Spec Files (Read Before Any Work)

| File | Purpose |
| ---- | ------- |
| `AGENT_FRAMEWORK.md` | Agent workflow, mandatory spec reading, quality gates |
| `CONTENT_STANDARDS.md` | All content type interfaces, rules, and per-channel minimums |
| `ARCHITECTURE_OVERVIEW.md` | Frontend architecture, data layer (sql.js), component structure |
| `AGENT_TEAM.md` | Agent assignments, checkpoints, team tracking |

> **Content agents** must read `CONTENT_STANDARDS.md` completely before generating any content.
> **Frontend agents** must read `ARCHITECTURE_OVERVIEW.md` — DevPrep is client-only (sql.js), no backend API server.

---

## Overview

Bun workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: Bun workspaces (defined in `package.json#workspaces`)
- **Package manager**: Bun (not pnpm — all scripts use `bun run`)
- **Runtime**: Bun v1.x
- **TypeScript version**: 5.9
- **Frontend**: React 19, Vite, Tailwind CSS v4 (runs standalone — no backend needed)
- **Database**: SQLite via sql.js (loaded in-browser from `/devprep.db`; seeds if unavailable)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **E2E Testing**: Playwright with screenshot capture (`e2e/tests/devprep/screenshots.spec.ts`)
- **Build**: esbuild (CJS bundle)

## Key Architecture Decisions

- **No API server**: The frontend reads the SQLite DB directly in the browser via sql.js. The `dbClient.ts` service fetches `/devprep.db` served by Vite, falls back to seeded data.
- **DB is source of truth**: `data/devprep.db` has two tables — `generated_content` (questions, flashcards, etc.) and `channels` (50 tech + 25 cert). Run `node scripts/seed-channels.mjs` to populate/update channels.
- **Channel loading**: `useChannels()` hook (`hooks/useChannels.ts`) reads channels from DB after it loads; falls back to static `data/channels.ts` immediately. `OnboardingModal` and `App.tsx` both use this hook.
- **Channel list**: `getChannelsFromDb()` in `dbClient.ts` queries the `channels` table (id, name, short_name, emoji, color, type, cert_code, description, tag_filter, is_active, sort_order).
- **Question format**: includes `diagram` section (`{type, title, description, svgContent}`) for most questions, and `related` section (`{type, topics:[{title, description, tag}]}`). Both rendered in `QAPage.tsx`.
- **Search is in-browser**: `searchContent()` from `dbClient.ts` performs full-text search over the local DB.
- **Content API**: `contentApi.ts` uses `tryDbFirst` — DB layer via `dbApi.ts`, no HTTP fallback needed.
- **Analytics stability**: `analyticsRef` pattern used in App.tsx to avoid infinite render loops from unstable `useAnalytics()` references.

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── devprep/            # Tech Interview Preparation Web App
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `bun run --filter @workspace/scripts <script>`
├── pnpm-workspace.yaml     # Legacy pnpm config (kept for reference; Bun reads workspaces from package.json)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `bun run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `bun run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `bun run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `bun run --filter @workspace/api-server dev` — run the dev server
- `bun run --filter @workspace/api-server build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `bun run --filter @workspace/db push`, and we fallback to `bun run --filter @workspace/db push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `bun run --filter @workspace/api-spec codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `artifacts/controls-demo` (`@workspace/controls-demo`)

Single-page React + Vite app showcasing all UI controls: text/email/password inputs, textarea, select dropdown, checkboxes, radio buttons, switches, sliders, toggle buttons, progress bars, tabs, dialog/modal, badges, alerts, and buttons.

- Entry: `src/main.tsx`
- Page: `src/pages/ControlsPage.tsx` — all controls with `data-testid` attributes
- UI Components: shadcn/ui (Radix UI + Tailwind)
- `bun run --filter @workspace/controls-demo dev` — dev server

### `artifacts/devprep` (`@workspace/devprep`)

DevPrep - Tech Interview Preparation Web App

- Entry: `src/main.tsx`
- Pages: QAPage, FlashcardsPage, CodingPage, MockExamPage, VoicePracticePage
- UI Components: shadcn/ui component library
- State: TanStack Query v5 (wraps in-browser sql.js DB — no HTTP server)
- Routing: Wouter
- Styling: Tailwind CSS v4
- **DB**: sql.js (SQLite WASM) reading `devprep.db` — source of truth for all content and channels
- `bun run --filter @workspace/devprep dev` — run the dev server
- `bun run --filter @workspace/devprep build` — production Vite build
- `bun run --filter @workspace/devprep test` — run Vitest unit tests
- `bun run --filter @workspace/devprep lint` — run ESLint

### `e2e` (`@workspace/e2e`)

Playwright end-to-end test suite for the UI controls demo.

- Config: `playwright.config.ts` — targets `http://localhost:80`, saves screenshots and JSON/HTML reports
- Tests: `tests/controls.spec.ts` — 21 tests covering every control
- Screenshots saved to: `e2e/screenshots/`
- Test results (HTML + JSON) saved to: `e2e/test-results/`
- Run from workspace root: `bun run e2e` or `bun run --filter @workspace/e2e test`

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `bun run --filter @workspace/scripts <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.

## Bun Commands

> All commands use `bun run`. There is no pnpm in this project.

### Dev / Build

```bash
# Run devprep dev server
bun run --filter @workspace/devprep dev

# Build devprep for production
bun run --filter @workspace/devprep build

# Build everything (typecheck + all packages)
bun run build

# Typecheck all packages
bun run typecheck
```

### Content Generation

```bash
# Seed channels into devprep.db (source of truth)
bun run scripts/seed-channels.mjs

# Generate content (all types)
bun run generate:all

# Generate specific content type
bun run generate:question
bun run generate:flashcard
bun run generate:coding
bun run generate:exam
bun run generate:voice

# Generate in parallel (faster)
bun run generate:parallel
```

### Database (devprep.db — source of truth)

```bash
# Seed channels table
bun scripts/seed-channels.mjs

# Inspect DB content count
bun -e "import { Database } from 'bun:sqlite'; const db = new Database('./data/devprep.db', { readonly: true }); console.log(db.query('SELECT content_type, COUNT(*) as cnt FROM generated_content GROUP BY content_type').all()); db.close();"
```

### Testing

```bash
# Run all tests from root
bun run test

# Run tests for specific package
bun run --filter @workspace/devprep test

# Run tests with coverage
bun run --filter @workspace/devprep test:coverage
```

### Linting

```bash
# Lint devprep
bun run --filter @workspace/devprep lint
```
