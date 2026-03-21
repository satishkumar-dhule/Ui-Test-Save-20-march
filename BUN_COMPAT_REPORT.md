# Bun Compatibility Validation Report

**Generated:** 2026-03-21  
**Scope:** Full monorepo workspace configuration analysis  
**Target Runtime:** Bun 1.2.x

---

## Executive Summary

| Area                        | Status     | Severity | Notes                                              |
| --------------------------- | ---------- | -------- | -------------------------------------------------- |
| TypeScript Config (Root)    | ⚠️ WARN    | Medium   | `moduleResolution: "bundler"` may cause issues     |
| TypeScript Config (DevPrep) | ⚠️ WARN    | Medium   | `types: ["node", "vite/client"]` needs review      |
| Vite Config                 | ⚠️ WARN    | High     | `better-sqlite3` native bindings + `createRequire` |
| Vitest Config               | ✅ OK      | Low      | Compatible with `bun test` or `bunx vitest`        |
| ESLint Config               | ✅ OK      | Low      | Pure JS/TS, no Node-specific APIs                  |
| Server Code                 | 🔴 BLOCKER | Critical | `better-sqlite3` + `ws` + `fs.watchFile`           |
| Docker (Frontend)           | ⚠️ WARN    | Medium   | pnpm/corepack incompatibility with Bun images      |
| Docker (API)                | ⚠️ WARN    | Medium   | Missing Dockerfile; Node base assumed              |
| Docker Compose              | ✅ OK      | Low      | Service orchestration is runtime-agnostic          |

---

## 1. TypeScript Configuration Analysis

### 1.1 Root `tsconfig.base.json`

```json
{
  "compilerOptions": {
    "module": "esnext",
    "moduleResolution": "bundler",
    "customConditions": ["workspace"],
    "types": [],
    "target": "es2022"
  }
}
```

| Setting                           | Bun Compat | Issue                                                                                                                                                                                                                                                 |
| --------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `module: "esnext"`                | ✅         | Bun handles ESM natively                                                                                                                                                                                                                              |
| `moduleResolution: "bundler"`     | ⚠️         | Bun's TS transpiler has its own resolution. Works in most cases but `bundler` mode was designed for Vite/esbuild. Bun supports `"node"` and its own `"bun"` resolution (v1.1+). May cause issues with workspace packages under `pnpm-workspace.yaml`. |
| `customConditions: ["workspace"]` | ⚠️         | Bun supports conditional exports (`exports` field in package.json) but `customConditions` behavior may differ from Node/Vite. Test with `bun --conditions workspace`.                                                                                 |
| `types: []`                       | ✅         | Empty types array is fine; avoids auto-including `@types/node` globally                                                                                                                                                                               |
| `isolatedModules: true`           | ✅         | Required by Bun's transpiler; good practice                                                                                                                                                                                                           |
| `strict*` flags                   | ✅         | All strict flags are purely tsc-level, Bun ignores them at runtime                                                                                                                                                                                    |

### 1.2 DevPrep `tsconfig.json`

```json
{
  "compilerOptions": {
    "jsx": "preserve",
    "types": ["node", "vite/client"],
    "allowImportingTsExtensions": true,
    "paths": {
      "@/*": ["./src/*"],
      "@workspace/shared": ["../../lib/shared/src/index.ts"]
    }
  }
}
```

| Setting                      | Bun Compat | Issue                                                                                                                                                                                          |
| ---------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `jsx: "preserve"`            | ✅         | Vite handles JSX transform; Bun can also handle it                                                                                                                                             |
| `types: ["node"]`            | ⚠️         | `@types/node` may conflict with Bun's built-in types. Bun has its own `bun-types` package. Mixing `@types/node` with Bun APIs can cause type errors for APIs like `Bun.serve()`.               |
| `types: ["vite/client"]`     | ✅         | Vite types are just ambient declarations, no runtime dependency                                                                                                                                |
| `allowImportingTsExtensions` | ✅         | Bun supports `.ts` imports natively                                                                                                                                                            |
| `paths` aliases              | ⚠️         | Bun's `bun build` does NOT read `tsconfig.json` paths. Must configure `Bun.serve()` or use `bunfig.toml` `[serve.static]` paths, or rely on Vite which does read tsconfig paths.               |
| Project `references`         | ⚠️         | Bun does not support TypeScript project references (`tsc --build`). Running `bunx tsc --build` may work if tsc is installed, but `bun run typecheck` will fail if it depends on `tsc --build`. |

### 1.3 Root `tsconfig.json` (Project References)

```json
{
  "references": [
    { "path": "./lib/shared" },
    { "path": "./lib/db" },
    { "path": "./lib/api-client-react" },
    { "path": "./lib/api-zod" }
  ]
}
```

**Issue:** The root `build` script runs `pnpm run typecheck && pnpm -r run build`, which invokes `tsc --build` for project references. **Bun cannot replace `tsc --build`** — TypeScript's build mode is implemented entirely in the TypeScript compiler, not the runtime. `bunx tsc --build` works (Bun can execute the tsc binary), but there's no native Bun equivalent.

**Recommendation:** Keep `tsc --build` for type-checking even when migrating to Bun runtime. Use `bunx tsc` or ensure `typescript` is in `devDependencies`.

---

## 2. Vite Configuration Analysis

### 2.1 `vite.config.ts` — Compatibility Issues

| Line/Feature                                | Bun Compat     | Issue                                                                                                                                                                                                        |
| ------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `import path from 'path'`                   | ✅             | Bun supports `node:path`                                                                                                                                                                                     |
| `import fs from 'fs'`                       | ✅             | Bun supports `node:fs`                                                                                                                                                                                       |
| `import { createRequire } from 'module'`    | ✅             | Bun supports `node:module.createRequire`                                                                                                                                                                     |
| `const require = createRequire(...)`        | ✅             | Bun's `require()` works for CJS modules                                                                                                                                                                      |
| `require('better-sqlite3')`                 | 🔴 **BLOCKER** | `better-sqlite3` uses N-API native bindings. Bun's native addon support is improving but `better-sqlite3` is known to fail. **Bun has built-in SQLite (`bun:sqlite`)** which is the recommended replacement. |
| `import.meta.dirname`                       | ✅             | Bun supports `import.meta.dirname` (added in v1.0.15+)                                                                                                                                                       |
| Vite plugins (`@vitejs/plugin-react`, etc.) | ✅             | Vite runs its own esbuild-based pipeline; Bun just executes the Vite Node process                                                                                                                            |
| `process.env.*`                             | ✅             | Bun supports `process.env`                                                                                                                                                                                   |
| `VitePWA` + `workbox-build`                 | ⚠️             | Workbox generates service workers. Should work, but test PWA generation under Bun.                                                                                                                           |
| `@replit/vite-plugin-cartographer`          | ⚠️             | Replit-specific plugin; may assume Replit environment. Compatibility unknown under Bun.                                                                                                                      |
| `dotenv/config`                             | ✅             | Pure JS, works fine                                                                                                                                                                                          |

### 2.2 Vite Dev Server Under Bun

Running `bunx vite` (or `bun run dev`) should work because Vite is a pure JS bundler that uses esbuild internally. However:

- **Hot Module Replacement (HMR)** relies on WebSocket connections — Bun's WebSocket support is compatible
- **Vite's dependency pre-bundling** uses esbuild — Bun bundles esbuild, should work
- **Middleware proxy** (`/api` → `localhost:3001`) — standard HTTP proxying, works in Bun

**Verdict:** Vite frontend dev/build should work under Bun with one exception: the `better-sqlite3` `require()` in the `checkpointDb` function will fail at runtime (during dev when the plugin loads).

---

## 3. Vitest Configuration Analysis

### 3.1 `vitest.config.ts`

| Feature                            | Bun Compat | Issue                                                                                                                                 |
| ---------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `vitest/config`                    | ✅         | `bunx vitest` works; Vitest 2.x+ has official Bun support                                                                             |
| `path.dirname(fileURLToPath(...))` | ✅         | Bun supports `node:url` utilities                                                                                                     |
| `environment: "jsdom"`             | ⚠️         | jsdom uses native bindings. Bun supports jsdom but performance may differ. Consider `happy-dom` as alternative.                       |
| `coverage.provider: "v8"`          | ⚠️         | V8 coverage provider relies on Node's V8 inspector. **Bun uses JavaScriptCore, not V8.** Use `coverage.provider: "istanbul"` instead. |
| `fakeTimers`                       | ✅         | Vitest handles this internally                                                                                                        |
| `setupFiles`                       | ✅         | Pure TS, runs in Vitest's process                                                                                                     |
| `globals: true`                    | ✅         | Vitest injects globals; runtime-agnostic                                                                                              |

**Critical Issue:** `coverage.provider: "v8"` will not work under Bun because Bun uses WebKit's JavaScriptCore engine, not V8. The V8 coverage API (`--experimental-v8-coverage`) is Node-specific.

**Recommendation:** Change to `coverage.provider: "istanbul"`:

```ts
coverage: {
  provider: "istanbul", // Changed from "v8"
  // ... rest stays the same
}
```

---

## 4. Server Code — Node.js API Analysis

### 4.1 `server/src/index.ts`

| API                                               | Bun Compat             | Issue                                                                                                                                                                                                                                                                           |
| ------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `import express from 'express'`                   | ✅                     | Express 5.x works in Bun (HTTP server compatible)                                                                                                                                                                                                                               |
| `import { createServer } from 'http'`             | ✅                     | Bun supports `node:http`                                                                                                                                                                                                                                                        |
| `import { WebSocketServer, WebSocket } from 'ws'` | ⚠️                     | The `ws` npm package works in Bun, but **Bun has native WebSocket support** via `Bun.serve({ websocket: {...} })`. Using `ws` adds unnecessary overhead. Consider migrating to Bun's native WebSocket API for 3-5x performance gain.                                            |
| `import Database from 'better-sqlite3'`           | 🔴 **BLOCKER**         | `better-sqlite3` is a native N-API addon. While Bun has been improving native addon support, `better-sqlite3` v12.x has known incompatibilities. **Replace with `import { Database } from 'bun:sqlite'`** — Bun's built-in SQLite is faster and requires no native compilation. |
| `db.pragma('journal_mode = WAL')`                 | ✅ (with `bun:sqlite`) | `bun:sqlite` supports `PRAGMA` statements via `db.exec("PRAGMA journal_mode=WAL")`                                                                                                                                                                                              |
| `db.prepare(query).all(...)`                      | ✅ (with migration)    | `bun:sqlite` has `db.query()` and `db.prepare()` with similar API                                                                                                                                                                                                               |
| `process.env.*`                                   | ✅                     | Bun supports `process.env`                                                                                                                                                                                                                                                      |
| `process.on('SIGINT', ...)`                       | ✅                     | Bun supports process signal handlers                                                                                                                                                                                                                                            |
| `process.exit(0)`                                 | ✅                     | Standard, works in Bun                                                                                                                                                                                                                                                          |
| `console.log/error/warn`                          | ✅                     | Standard                                                                                                                                                                                                                                                                        |

### 4.2 `server/src/dbWatcher.ts`

| API                                     | Bun Compat | Issue                                                                                                                                                                                    |
| --------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `import { EventEmitter } from 'events'` | ✅         | Bun supports `node:events`                                                                                                                                                               |
| `fs.watchFile()`                        | ⚠️         | Bun supports `fs.watchFile()` but it's implemented as polling internally (same as Node). **Consider using `fs.watch()` (inotify/FSEvents)** or `Bun.fsWatcher()` for better performance. |
| `fs.unwatchFile()`                      | ✅         | Supported                                                                                                                                                                                |
| `fs.statSync()`                         | ✅         | Supported                                                                                                                                                                                |
| `fs.existsSync()`                       | ✅         | Supported                                                                                                                                                                                |
| `fs.mkdirSync()`                        | ✅         | Supported                                                                                                                                                                                |
| `setInterval` / `clearInterval`         | ✅         | Standard                                                                                                                                                                                 |

### 4.3 Migration Path for Server

```typescript
// BEFORE (Node.js + better-sqlite3)
import Database from "better-sqlite3";
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
const rows = db.prepare("SELECT * FROM table").all();

// AFTER (Bun native SQLite)
import { Database } from "bun:sqlite";
const db = new Database(DB_PATH);
db.exec("PRAGMA journal_mode = WAL");
const rows = db.prepare("SELECT * FROM table").all();
```

The API is nearly identical — `bun:sqlite` was designed as a drop-in replacement. Key differences:

- `db.pragma()` → `db.exec("PRAGMA ...")`
- `db.prepare().all()` → same API
- `db.prepare().run()` → same API
- No need for native compilation

---

## 5. Docker Configuration Analysis

### 5.1 `artifacts/devprep/Dockerfile` (Frontend)

```dockerfile
FROM node:22-alpine AS builder
RUN corepack enable && pnpm install --frozen-lockfile
RUN pnpm --filter @workspace/devprep run build
FROM nginx:alpine AS production
```

| Aspect                                       | Bun Compat | Issue                                                                                                                                                                           |
| -------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node:22-alpine` base                        | ❌         | Must change to `oven/bun:1-alpine` or `oven/bun:1.2-alpine`                                                                                                                     |
| `corepack enable`                            | ❌         | **Not available in Bun images.** Bun has its own package manager.                                                                                                               |
| `pnpm install --frozen-lockfile`             | ❌         | Bun uses `bun install --frozen-lockfile` (or `bun install --yarn` for yarn.lock compat). **pnpm workspace features (`pnpm-workspace.yaml`) are NOT natively supported by Bun.** |
| `pnpm --filter @workspace/devprep run build` | ❌         | Bun does not support `--filter`. Use `cd artifacts/devprep && bun run build`.                                                                                                   |
| `nginx:alpine` production stage              | ✅         | Runtime-agnostic; just serves static files                                                                                                                                      |

**Bun-equivalent Dockerfile:**

```dockerfile
FROM oven/bun:1-alpine AS builder
WORKDIR /app
COPY package.json bun.lockb pnpm-workspace.yaml ./
COPY artifacts/devprep ./artifacts/devprep
COPY lib ./lib
RUN bun install --frozen-lockfile
ARG BASE_PATH=/
ENV PORT=3000
ENV BASE_PATH=$BASE_PATH
RUN cd artifacts/devprep && bun run build
FROM nginx:alpine AS production
RUN apk add --no-cache openssl
COPY artifacts/devprep/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/artifacts/devprep/dist/public /usr/share/nginx/html
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
```

**Critical Issue:** The monorepo uses `pnpm-workspace.yaml` with `catalog` features (shared dependency versions). **Bun's package manager does not support pnpm workspace catalogs.** This means:

- `catalog:` references in `package.json` must be replaced with explicit versions
- Or keep pnpm for package management and only use Bun as the runtime

### 5.2 `docker-compose.yml`

| Service                | Bun Compat | Issue                                                                                                  |
| ---------------------- | ---------- | ------------------------------------------------------------------------------------------------------ |
| `api` service          | ⚠️         | References `artifacts/api-server/Dockerfile` (missing!). If built with Node, needs separate migration. |
| `frontend-dev` service | ⚠️         | Uses `artifacts/devprep/Dockerfile.dev` (not analyzed). Dev server runs Vite, should work with Bun.    |
| `frontend` service     | ⚠️         | Uses current Dockerfile; needs Bun base image swap.                                                    |
| `postgres` service     | ✅         | Runtime-agnostic                                                                                       |
| `nginx` service        | ✅         | Runtime-agnostic                                                                                       |
| Volume mounts          | ✅         | Docker volumes are runtime-agnostic                                                                    |
| Health checks (`wget`) | ✅         | Alpine has wget; independent of Node/Bun                                                               |
| `NODE_ENV=production`  | ⚠️         | Bun respects `NODE_ENV` but also has `BUN_ENV`. Keep `NODE_ENV` for compatibility.                     |

### 5.3 Missing API Server Dockerfile

The `docker-compose.yml` references `artifacts/api-server/Dockerfile` which does not exist in the workspace. The actual API server code lives at `artifacts/devprep/server/src/`. This is a pre-existing issue unrelated to Bun migration.

---

## 6. Compatibility Matrix

### 6.1 Full Stack Component Matrix

| Component                | Current Runtime | Bun Compatible? | Migration Effort | Blocker? |
| ------------------------ | --------------- | --------------- | ---------------- | -------- |
| **TypeScript Config**    | tsc 5.9         | ⚠️ Partial      | Low              | No       |
| **Vite Dev Server**      | Node.js         | ✅ Yes          | None             | No       |
| **Vite Build**           | Node.js         | ✅ Yes          | None             | No       |
| **Vitest Runner**        | Node.js         | ⚠️ Partial      | Low              | No       |
| **Vitest Coverage (V8)** | Node.js V8      | ❌ No           | Low              | **Yes**  |
| **ESLint**               | Node.js         | ✅ Yes          | None             | No       |
| **Express Server**       | Node.js         | ✅ Yes          | None             | No       |
| **better-sqlite3**       | Node.js N-API   | ❌ No           | Medium           | **Yes**  |
| **ws (WebSocket)**       | Node.js         | ✅ Yes          | Low              | No       |
| **fs.watchFile**         | Node.js         | ⚠️ Partial      | Low              | No       |
| **pnpm Workspaces**      | pnpm            | ❌ No           | High             | **Yes**  |
| **pnpm Catalog**         | pnpm            | ❌ No           | High             | **Yes**  |
| **Docker (Frontend)**    | node:22-alpine  | ⚠️ Partial      | Medium           | No       |
| **Docker (API)**         | Unknown         | ⚠️ Unknown      | Medium           | No       |
| **Docker Compose**       | docker          | ✅ Yes          | None             | No       |
| **Project References**   | tsc --build     | ⚠️ Partial      | Low              | No       |
| **Corepack**             | Node.js         | ❌ No           | Medium           | **Yes**  |

### 6.2 Node.js APIs Used → Bun Support Status

| Node.js API            | File(s)                                     | Bun Support         | Notes                                  |
| ---------------------- | ------------------------------------------- | ------------------- | -------------------------------------- |
| `path`                 | vite.config.ts, vitest.config.ts, server/\* | ✅ Full             |                                        |
| `fs`                   | vite.config.ts, dbWatcher.ts, server/\*     | ✅ Full             |                                        |
| `fs.watchFile()`       | dbWatcher.ts                                | ✅ Supported        | Polling-based in both runtimes         |
| `http.createServer`    | server/index.ts                             | ✅ Full             |                                        |
| `events.EventEmitter`  | dbWatcher.ts                                | ✅ Full             |                                        |
| `url.fileURLToPath`    | vitest.config.ts                            | ✅ Full             |                                        |
| `module.createRequire` | vite.config.ts                              | ✅ Full             |                                        |
| `process.env`          | vite.config.ts, server/\*                   | ✅ Full             |                                        |
| `process.on('SIGINT')` | server/index.ts                             | ✅ Full             |                                        |
| `ws` (npm package)     | server/index.ts                             | ✅ Works            | Bun has native WS but ws npm pkg works |
| `better-sqlite3`       | vite.config.ts, server/\*                   | ❌ **Incompatible** | Use `bun:sqlite`                       |
| `express`              | server/index.ts                             | ✅ Works            | Express 5.x compatible                 |

### 6.3 NPM Package Compatibility

| Package                | Version | Bun Compat | Notes                          |
| ---------------------- | ------- | ---------- | ------------------------------ |
| `vite`                 | ^7.3.0  | ✅         |                                |
| `vitest`               | ^4.1.0  | ✅         | Use `bunx vitest`              |
| `@vitejs/plugin-react` | ^5.0.4  | ✅         |                                |
| `@tailwindcss/vite`    | ^4.1.14 | ✅         |                                |
| `better-sqlite3`       | ^12.8.0 | ❌         | Use `bun:sqlite`               |
| `express`              | ^5.2.1  | ✅         |                                |
| `ws`                   | ^8.19.0 | ✅         | Consider native Bun WS         |
| `sql.js`               | ^1.14.1 | ✅         | Pure WASM, no native deps      |
| `jsdom`                | ^24.0.0 | ⚠️         | Works but may have edge cases  |
| `typescript`           | ~5.9.2  | ✅         | Needed for `tsc --build`       |
| `eslint`               | ^10.0.3 | ✅         |                                |
| `drizzle-orm`          | ^0.45.1 | ✅         | Has Bun SQLite driver          |
| `@sentry/browser`      | ^8.0.0  | ✅         | Browser-side, runtime agnostic |
| `workbox-build`        | ^7.3.0  | ⚠️         | May need testing               |

---

## 7. Recommendations

### Phase 1: Low-Risk Frontend Migration (Recommended First)

1. **Swap Dockerfile base image** from `node:22-alpine` to `oven/bun:1-alpine`
2. **Replace `pnpm install`** with `bun install` (generate `bun.lockb`)
3. **Replace `pnpm --filter`** with `cd` + `bun run build`
4. **Fix Vitest coverage provider** from `v8` to `istanbul`
5. **Keep Vite as-is** — it runs fine under Bun
6. **Remove `better-sqlite3` require** from `vite.config.ts` or guard with `try/catch` (already done)

### Phase 2: Server Migration

1. **Replace `better-sqlite3`** with `bun:sqlite`:
   - Change `import Database from 'better-sqlite3'` → `import { Database } from 'bun:sqlite'`
   - Change `db.pragma(...)` → `db.exec("PRAGMA ...")`
   - Test all prepared statements (API should be compatible)
2. **Evaluate `ws` replacement** with `Bun.serve({ websocket: {...} })` (optional, `ws` works)
3. **Test `fs.watchFile`** behavior under Bun (should work, same polling semantics)

### Phase 3: Monorepo Tooling

1. **Replace pnpm workspace** with Bun workspace (`workspaces` in root `package.json`)
2. **Resolve `catalog:` dependencies** — pin explicit versions in each package.json
3. **Keep `tsc --build`** for type-checking (use `bunx tsc --build`)
4. **Update `package.json` scripts** to use `bun run` instead of `pnpm run`

### Phase 4: Docker & CI

1. Create Bun-native Dockerfiles
2. Update docker-compose.yml to use Bun images for app services
3. Keep `nginx:alpine` for production static serving
4. Keep `postgres:16-alpine` as-is

---

## 8. Risk Assessment

| Risk                                  | Probability | Impact   | Mitigation                                            |
| ------------------------------------- | ----------- | -------- | ----------------------------------------------------- |
| `better-sqlite3` fails under Bun      | **High**    | Critical | Migrate to `bun:sqlite` before runtime switch         |
| pnpm catalog breaks                   | **High**    | High     | Pin versions explicitly or keep pnpm for install only |
| V8 coverage fails                     | **High**    | Medium   | Switch to istanbul provider                           |
| `ws` library issues                   | Low         | Medium   | Bun has native WebSocket fallback                     |
| `fs.watchFile` behavioral differences | Low         | Low      | Already uses polling fallback                         |
| Vite HMR instability                  | Low         | High     | Vite has official Bun support                         |
| Express 5.x edge cases                | Low         | Medium   | Express 5 is compatible with Bun                      |

---

## 9. Conclusion

**Overall Assessment: MIGRATION IS FEASIBLE with 3 critical blockers.**

The monorepo can be migrated to Bun with moderate effort. The three critical blockers are:

1. **`better-sqlite3`** → Must migrate to `bun:sqlite` (straightforward, API is nearly identical)
2. **pnpm workspace catalogs** → Must pin explicit versions or hybrid approach
3. **Vitest V8 coverage** → Must switch to istanbul provider (one-line change)

The frontend (Vite + React) is the lowest-risk component and should be migrated first. The Express API server requires the `better-sqlite3` migration before it can run under Bun. Docker configurations need base image swaps and package manager command updates.

**Estimated total effort:** 4-8 hours for an experienced developer.
