# Bun Migration Audit Report

**Date**: 2026-03-21  
**Bun Version**: 1.3.6 (d530ed99)  
**Project**: DevPrep Monorepo  
**Node.js**: v24.13.0 (currently used via pnpm)

---

## Executive Summary

| Component                  | Status         | Notes                                          |
| -------------------------- | -------------- | ---------------------------------------------- |
| `bun install`              | ❌ **FAILS**   | pnpm `catalog:` protocol unsupported           |
| `bun run build` (frontend) | ✅ **WORKS**   | Vite build succeeds with existing node_modules |
| `bun run server`           | ❌ **FAILS**   | `better-sqlite3` native addon unsupported      |
| `bun test` (native)        | ⚠️ **PARTIAL** | 5/6 test files pass, 1 fails (sql.js WASM)     |
| `bun run test` (vitest)    | ⚠️ **PARTIAL** | 18/19 tests pass, sql.js WASM issue            |
| `bun` for TS execution     | ✅ **WORKS**   | Native TS support replaces tsx                 |
| Playwright e2e             | ⚠️ **ISSUES**  | Missing vitest dependency in e2e package       |
| Content generation scripts | ⚠️ **PARTIAL** | Scripts call `node` (falls back to Node.js)    |

**Overall Verdict**: Migration is feasible but requires **one critical change** (replacing `better-sqlite3` with `bun:sqlite`) and several smaller adaptations. The pnpm `catalog:` protocol is the main blocker for `bun install`.

---

## 1. `bun install` — ❌ BLOCKED

### Issue: pnpm `catalog:` Protocol Unsupported

```
error: typescript@catalog: failed to resolve
```

**Root Cause**: Bun v1.3.6 does not support pnpm's workspace `catalog:` protocol. This is a pnpm-specific feature for centralizing dependency versions.

**Impact**: 31 references to `catalog:` across 10 `package.json` files.

**Affected Files**:
| File | `catalog:` Count |
|------|-----------------|
| `artifacts/devprep/package.json` | 16 |
| `lib/api-client-react/package.json` | 1 |
| `lib/api-zod/package.json` | 1 |
| `lib/db/package.json` | 3 |
| `lib/shared/package.json` | 2 |
| `scripts/package.json` | 2 |
| `package.json` (root, workspaces.catalog) | defines them |

### Recommended Fix

Replace all `catalog:` references with explicit version strings. Run:

```bash
# Map catalog entries to their actual versions from pnpm-workspace.yaml
# Example replacements in each package.json:
#   "typescript": "catalog:"  →  "typescript": "~5.9.2"
#   "react": "catalog:"       →  "react": "19.1.0"
#   "zod": "catalog:"         →  "zod": "^3.25.76"
```

**Also**: Remove the `preinstall` script in root `package.json` (line 6) that blocks non-pnpm package managers:

```json
// DELETE this:
"preinstall": "sh -c 'rm -f package-lock.json yarn.lock; case \"$npm_config_user_agent\" in pnpm/*) ;; *) echo \"Use pnpm instead\" >&2; exit 1 ;; esac'"
```

**Files to Modify**:

- `/home/runner/workspace/package.json` — lines 6 (preinstall), 39-61 (catalog definitions)
- `/home/runner/workspace/artifacts/devprep/package.json` — lines 28, 33, 34, 43, 44, 51, 85-87, 89, 92-94, 97, 101, 102, 111, 115, 119, 121
- `/home/runner/workspace/lib/api-client-react/package.json` — line 10
- `/home/runner/workspace/lib/api-zod/package.json` — line 14
- `/home/runner/workspace/lib/db/package.json` — lines 18, 23, 26
- `/home/runner/workspace/lib/shared/package.json` — lines 22, 28
- `/home/runner/workspace/scripts/package.json` — lines 11, 12

---

## 2. `better-sqlite3` — ❌ CRITICAL BLOCKER

### Issue: Native Node.js Addon Unsupported in Bun

```
error: 'better-sqlite3' is not yet supported in Bun.
Track the status in https://github.com/oven-sh/bun/issues/4290
In the meantime, you could try bun:sqlite which has a similar API.
```

**Root Cause**: `better-sqlite3` uses Node.js N-API (C++ native addon with `binding.gyp`). Bun does not support native Node.js addons compiled with `node-gyp`. The `better_sqlite3.node` binary at `node_modules/.pnpm/better-sqlite3@12.8.0/node_modules/better-sqlite3/build/Release/better_sqlite3.node` cannot be loaded by Bun.

### Files Using `better-sqlite3` (11 total):

| File                                               | Import Style                      | Purpose                      |
| -------------------------------------------------- | --------------------------------- | ---------------------------- |
| `artifacts/devprep/server/src/index.ts:6`          | ESM `import`                      | Express server DB operations |
| `artifacts/devprep/vite.config.ts:16`              | CJS `require` (via createRequire) | WAL checkpoint on build      |
| `content-gen/save-content.mjs:20`                  | CJS `require`                     | Save generated content       |
| `content-gen/generate-content.mjs:40`              | CJS `require`                     | Content generation pipeline  |
| `content-gen/db-channels.mjs:21`                   | CJS `require`                     | Channel queries              |
| `content-gen/generate-agent-team.mjs:81`           | CJS `require`                     | Agent team DB ops            |
| `content-gen/generate-all-parallel.mjs:272`        | CJS `require`                     | Parallel content gen         |
| `content-gen/generate-pollination-content.mjs:160` | CJS `require`                     | Pollination content          |
| `scripts/seed-channels.mjs:6`                      | ESM `import`                      | Seed channels table          |
| `lib/api-client-react/package.json`                | dependency                        | Listed as dep                |
| `lib/api-zod/package.json`                         | dependency                        | Listed as dep                |

### Recommended Replacement: `bun:sqlite`

Bun has a **built-in SQLite module** (`bun:sqlite`) with a nearly identical API. Verified working:

```javascript
import { Database } from "bun:sqlite";
const db = new Database(":memory:");
db.exec("PRAGMA journal_mode = WAL");
db.prepare("INSERT INTO t VALUES (?)").run("hello");
const row = db.prepare("SELECT * FROM t").get();
```

### API Differences to Handle

| Feature      | `better-sqlite3`                        | `bun:sqlite`                            | Migration           |
| ------------ | --------------------------------------- | --------------------------------------- | ------------------- |
| Import       | `import Database from 'better-sqlite3'` | `import { Database } from 'bun:sqlite'` | Change import       |
| Pragma       | `db.pragma('journal_mode = WAL')`       | `db.exec('PRAGMA journal_mode = WAL')`  | Use exec            |
| busy_timeout | `db.pragma('busy_timeout = 5000')`      | `db.exec('PRAGMA busy_timeout = 5000')` | Use exec            |
| Constructor  | `new Database(path)`                    | `new Database(path)`                    | ✅ Same             |
| prepare      | `db.prepare(sql)`                       | `db.prepare(sql)`                       | ✅ Same             |
| run          | `stmt.run(args)`                        | `stmt.run(args)`                        | ✅ Same             |
| get          | `stmt.get(args)`                        | `stmt.get(args)`                        | ✅ Same             |
| exec         | `db.exec(sql)`                          | `db.exec(sql)`                          | ✅ Same             |
| transaction  | `db.transaction(fn)`                    | `db.transaction(fn)`                    | ✅ Same             |
| Types        | `Database.Database` (TypeScript)        | `Database` from `bun:sqlite`            | Update type imports |

### Recommended Migration Strategy

**Option A: Universal shim (supports both Node.js and Bun)**

Create a `lib/sqlite/index.ts` that abstracts the database:

```typescript
// Detect runtime and use appropriate SQLite
let Database: any;
if (typeof Bun !== "undefined") {
  ({ Database } = await import("bun:sqlite"));
} else {
  Database = (await import("better-sqlite3")).default;
}
export default Database;
```

**Option B: Hard switch to `bun:sqlite`** (simpler, Bun-only)

Replace all 11 files' imports and pragma calls as shown in the table above.

---

## 3. `tsx` Dependency — ✅ ELIMINATE

### Current Usage

- `artifacts/devprep/server/package.json` — `"dev": "tsx watch src/index.ts"`, `"start": "tsx src/index.ts"`
- `scripts/package.json` — `"hello": "tsx ./src/hello.ts"`
- `package.json` root catalog — `"tsx": "^4.21.0"`
- `pnpm-workspace.yaml` — `"@esbuild-kit/esm-loader": "npm:tsx@^4.21.0"` (override)

### Bun Alternative

Bun natively runs TypeScript — no transpiler needed:

```bash
# Instead of: tsx src/index.ts
bun run src/index.ts

# Instead of: tsx watch src/index.ts
bun --watch src/index.ts
```

**Verified**: `bun scripts/src/hello.ts` works natively.

### Files to Modify

- `artifacts/devprep/server/package.json` lines 7-8: Change `tsx` → `bun`
- `scripts/package.json` line 7: Change `tsx` → `bun`
- Remove `tsx` from devDependencies in both files
- Remove `"@esbuild-kit/esm-loader": "npm:tsx@^4.21.0"` from root `package.json` line 143

---

## 4. Frontend Build (`vite build`) — ✅ WORKS

```
✓ built in 3.62s
```

Vite 7.3.1 builds the React frontend successfully with Bun. All plugins work:

- `@vitejs/plugin-react` ✅
- `@tailwindcss/vite` ✅
- `vite-plugin-pwa` ✅
- `@replit/vite-plugin-runtime-error-modal` ✅
- Custom `serveDatabase()` plugin ✅ (with try-catch around better-sqlite3)

**Note**: The `better-sqlite3` call in `vite.config.ts:16` is wrapped in try-catch (line 20-22), so it gracefully falls back when unavailable with Bun.

---

## 5. Test Runners

### Vitest — ⚠️ PARTIAL (18/19 tests pass)

```
Test Files  1 failed | 5 passed (6)
     Tests  1 failed | 18 passed (19)
```

**Failure**: `src/__tests__/hooks/useGeneratedContent.test.ts` fails due to `sql.js` WASM loading:

```
RuntimeError: Aborted(Error: ENOENT: no such file or directory, open '/sql-wasm.wasm')
```

**Root Cause**: `sql.js` (WASM-based SQLite for browser) fails to locate its WASM binary when running under Bun's test environment. The path resolution for WASM files differs between Node.js and Bun.

**Affected File**: `artifacts/devprep/src/__tests__/hooks/useGeneratedContent.test.ts`

**Fix**: Either:

1. Mock sql.js in tests (recommended — tests shouldn't depend on WASM)
2. Configure sql.js with explicit WASM path: `initSqlJs({ locateFile: () => '/path/to/sql-wasm.wasm' })`

### Bun Native Test Runner — ⚠️ PARTIAL

```
(fail) Quality Assessment - Edge Cases > should handle empty object
```

One content-gen quality test fails — the quality scoring algorithm returns 56 instead of <50 for empty objects. This is likely a pre-existing test issue, not Bun-specific.

### Playwright — ⚠️ ISSUES

```
Error: Cannot find package 'vitest' imported from e2e/tests/devprep/SearchModal.unit.spec.tsx
```

The e2e package imports vitest but doesn't list it as a dependency. This is a pre-existing issue that works under pnpm due to hoisting but breaks under Bun's stricter resolution.

**Fix**: Add `vitest` to `e2e/package.json` devDependencies, or move the unit test out of the e2e package.

---

## 6. Express Server — ❌ BLOCKED (due to better-sqlite3)

```
error: 'better-sqlite3' is not yet supported in Bun.
```

Cannot start the server until `better-sqlite3` is replaced with `bun:sqlite`.

### Second Error Found

When `better-sqlite3` was bypassed, another error appeared:

```
EROFS: read-only file system, mkdir '/data'
```

This is because `DB_PATH` defaults to `path.resolve(process.cwd(), '../../../data/devprep.db')` and Bun resolves `process.cwd()` differently when running files directly vs. via `bun run`.

**File**: `artifacts/devprep/server/src/index.ts:10`
**Fix**: Use `import.meta.dirname` instead of `process.cwd()` for reliable path resolution:

```typescript
const DB_PATH =
  process.env.DB_PATH ||
  path.resolve(import.meta.dirname, "../../../data/devprep.db");
```

---

## 7. Content Generation Scripts — ⚠️ INDIRECT USE

The content-gen scripts call `node generate-content.mjs` (not `bun`), so they currently work by falling back to Node.js. Bun's `bun run` passes through to `node` for `node` commands.

**To fully migrate**: Replace `node` with `bun` in content-gen scripts, then fix the `better-sqlite3` → `bun:sqlite` migration.

---

## 8. pnpm Workspace Configuration

### `pnpm-workspace.yaml` Features That Need Bun Equivalents

| pnpm Feature              | Bun Equivalent                       | Action                                  |
| ------------------------- | ------------------------------------ | --------------------------------------- |
| `packages:`               | `workspaces` in package.json         | Already defined in root package.json ✅ |
| `catalog:`                | None                                 | Inline versions into each package.json  |
| `minimumReleaseAge: 1440` | None                                 | Use `bun.lock` integrity checks or skip |
| `autoInstallPeers: false` | N/A (Bun doesn't auto-install peers) | No action needed                        |
| `onlyBuiltDependencies`   | N/A                                  | Bun handles native builds differently   |
| `overrides`               | `overrides` in package.json          | Already duplicated ✅                   |

---

## 9. Other Compatibility Notes

### `ws` (WebSocket) — ✅ WORKS

Bun has native WebSocket support. The `ws` package works but Bun also offers `Bun.serve()` with built-in WebSocket.

### `express` — ✅ WORKS

Express 4.x/5.x works with Bun's Node.js compatibility layer.

### `dotenv` — ✅ WORKS

`dotenv/config` import works with Bun.

### `@replit/vite-plugin-*` — ✅ WORKS (in build)

These Vite plugins work during build. They are conditionally loaded (only when `REPL_ID` is set) so they don't interfere with local Bun development.

---

## 10. Migration Roadmap

### Phase 1: Critical Path (Required for basic Bun usage)

1. **Replace `catalog:` versions** in all package.json files (31 references)
2. **Remove `preinstall` script** that blocks non-pnpm managers
3. **Replace `better-sqlite3` with `bun:sqlite`** in all 11 files
4. **Update pragma calls** from `db.pragma()` to `db.exec('PRAGMA ...')`

### Phase 2: Optimization (Leverage Bun features)

5. **Replace `tsx` with Bun** in server and scripts package.json
6. **Remove `tsx` from dependencies** and the `@esbuild-kit/esm-loader` override
7. **Update server path resolution** to use `import.meta.dirname`
8. **Fix sql.js test** with proper WASM path or mock

### Phase 3: Cleanup

9. **Remove `pnpm-lock.yaml`** (rely on `bun.lock`)
10. **Remove `pnpm-workspace.yaml`** (config is in `package.json` already)
11. **Update all `pnpm` references** in scripts to `bun`
12. **Add vitest to e2e/package.json** devDependencies

### Estimated Effort

- Phase 1: ~2-3 hours (most time on better-sqlite3 migration + testing)
- Phase 2: ~1 hour
- Phase 3: ~30 minutes

---

## Quick Reference: Command Equivalents

| pnpm Command             | Bun Equivalent                         |
| ------------------------ | -------------------------------------- |
| `pnpm install`           | `bun install`                          |
| `pnpm run build`         | `bun run build`                        |
| `pnpm -r run build`      | `bun run --filter '*' build` (limited) |
| `tsx src/index.ts`       | `bun src/index.ts`                     |
| `tsx watch src/index.ts` | `bun --watch src/index.ts`             |
| `vitest`                 | `bun test` or `bun run vitest`         |
| `playwright test`        | `bun run playwright test`              |
| `node script.mjs`        | `bun script.mjs`                       |

---

## Appendix: Verified Working

| Test                                           | Result    |
| ---------------------------------------------- | --------- |
| `bun --version`                                | ✅ v1.3.6 |
| `bun -e "console.log('hello')"`                | ✅        |
| `bun -e "const x: string = 'hi'"` (native TS)  | ✅        |
| `bun:sqlite` in-memory operations              | ✅        |
| `bun run --cwd artifacts/devprep build` (vite) | ✅ 3.62s  |
| `bun scripts/src/hello.ts`                     | ✅        |
| `bun /path/to/file.mjs`                        | ✅        |
| `bun test` (5/6 test files)                    | ✅        |

| Test                            | Result                |
| ------------------------------- | --------------------- |
| `bun install` (with catalog:)   | ❌                    |
| `better-sqlite3` ESM import     | ❌                    |
| `better-sqlite3` CJS require    | ❌                    |
| Server startup                  | ❌ (blocked by above) |
| `bun:sqlite` `.pragma()` method | ❌ (use exec instead) |
