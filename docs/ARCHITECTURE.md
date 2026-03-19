# DevPrep Technical Architecture

> **Document Version:** 1.0.0  
> **Last Updated:** 2026-03-19  
> **Author:** TECH_ARCH_AGENT

---

## System Overview

DevPrep is a modern full-stack monorepo application built with React 19, Express 5, and PostgreSQL. The architecture follows a clean separation between deployable artifacts and shared libraries.

### Tech Stack

| Layer           | Technology     | Version   |
| --------------- | -------------- | --------- |
| Frontend        | React          | 19.1.0    |
| Frontend Build  | Vite           | 7.3.0     |
| Styling         | Tailwind CSS   | 4.1.14    |
| State/Fetch     | TanStack Query | 5.90.21   |
| API Server      | Express.js     | 5.x       |
| Database        | PostgreSQL     | 16        |
| ORM             | Drizzle        | 0.45.1    |
| Package Manager | pnpm           | workspace |
| Type Safety     | TypeScript     | 5.9.2     |
| Validation      | Zod            | 3.25.76   |
| Code Generation | Orval          | 8.5.x     |

---

## Package Relationships

```
workspace/
├── pnpm-workspace.yaml          # Monorepo configuration
│
├── artifacts/                   # Deployable packages
│   ├── api-server/              # Express API server
│   │   └── src/
│   │       ├── index.ts         # Entry point
│   │       ├── app.ts           # Express app setup
│   │       └── routes/          # API routes
│   │
│   ├── devprep/                 # React frontend (PWA)
│   │   └── src/
│   │       ├── components/      # React components
│   │       ├── hooks/           # Custom hooks
│   │       └── lib/             # Utilities
│   │
│   ├── controls-demo/           # Demo/controls package
│   └── mockup-sandbox/          # Sandbox package
│
├── lib/                         # Shared libraries
│   ├── api-client-react/        # React Query hooks
│   │   └── src/
│   │       ├── generated/       # Orval-generated API
│   │       └── custom-fetch.ts  # Fetch wrapper
│   │
│   ├── api-spec/                # OpenAPI specification
│   │   ├── openapi.yaml         # API contract
│   │   └── orval.config.ts      # Code generation config
│   │
│   ├── api-zod/                 # Zod validation schemas
│   │   └── src/generated/       # Orval-generated schemas
│   │
│   ├── db/                      # Database layer
│   │   ├── src/
│   │   │   ├── index.ts         # Drizzle instance
│   │   │   └── schema/          # Table definitions
│   │   └── drizzle.config.ts    # Drizzle config
│   │
│   └── shared/                  # Shared utilities
│       └── src/
│           ├── index.ts          # Main exports
│           ├── hooks/            # Shared hooks
│           ├── logger.ts         # Logging utility
│           └── timeout.ts        # Timeout utility
│
├── scripts/                     # Build/dev scripts
├── e2e/                         # Playwright E2E tests
└── content-gen/                 # Content generation scripts
```

---

## Data Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │
│  │  Browser    │────│  Vite Dev   │    │  PWA        │              │
│  │  (React 19) │    │  Server     │    │  (Workbox)  │              │
│  └──────┬──────┘    └─────────────┘    └─────────────┘              │
│         │                                                             │
│         │ React Query Hooks (TanStack Query v5)                      │
│         ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                   API CLIENT LAYER                              │ │
│  │  ┌─────────────────┐         ┌─────────────────┐               │ │
│  │  │ @workspace/     │         │ @workspace/     │               │ │
│  │  │ api-client-react│         │ api-zod          │               │ │
│  │  │ (React Query)   │         │ (Zod Schemas)    │               │ │
│  │  └────────┬────────┘         └─────────────────┘               │ │
│  │           │                                                      │ │
│  │           │ custom-fetch.ts (Fetch wrapper)                      │ │
│  └───────────┼──────────────────────────────────────────────────────┘ │
└──────────────┼───────────────────────────────────────────────────────┘
               │ HTTP/JSON
               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                          API LAYER                                    │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    Express 5 Server                              │ │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐      │ │
│  │  │ CORS      │  │ JSON      │  │ Routes    │  │ Error     │      │ │
│  │  │ Middleware│  │ Parser    │  │ Router    │  │ Handler   │      │ │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘      │ │
│  │                                                                 │ │
│  │  Route Structure:                                                │ │
│  │  /api/healthz  → Health check endpoint                          │ │
│  │  /api/*        → Business logic endpoints (to implement)        │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│           │                                                      │
└───────────┼──────────────────────────────────────────────────────┘
            │ Drizzle ORM
            ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        DATABASE LAYER                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │
│  │ PostgreSQL  │    │ Connection  │    │ Drizzle     │              │
│  │ 16          │◀───│ Pool       │◀───│ ORM         │              │
│  └─────────────┘    └─────────────┘    └─────────────┘              │
│                                                                     │
│  Schema Tables (to define):                                          │
│  - users          - content                                          │
│  - questions      - exams                                            │
│  - flashcards     - user_progress                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## API Contracts

### OpenAPI Specification

The API is documented in `lib/api-spec/openapi.yaml` using OpenAPI 3.1.0.

### Current Endpoints

| Path           | Method | Description  | Status      |
| -------------- | ------ | ------------ | ----------- |
| `/api/healthz` | GET    | Health check | Implemented |

### Code Generation Pipeline

```
lib/api-spec/openapi.yaml
        │
        ▼
    Orval CLI
        │
        ├──▶ lib/api-zod/src/generated/
        │         ├── api.ts          (Zod schemas)
        │         └── types/          (TypeScript types)
        │
        └──▶ lib/api-client-react/src/generated/
                  ├── api.ts           (React Query hooks)
                  └── api.schemas.ts   (Response schemas)
```

### Adding New Endpoints

1. Add endpoint to `lib/api-spec/openapi.yaml`
2. Run `pnpm --filter @workspace/api-spec run codegen`
3. Use generated hooks in frontend components

---

## Database Architecture

### Drizzle ORM Configuration

- **Dialect**: PostgreSQL
- **Schema Location**: `lib/db/src/schema/`
- **Config File**: `lib/db/drizzle.config.ts`

### Schema Template

```typescript
// lib/db/src/schema/users.ts
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
```

### Migration Strategy

```bash
# Push schema to database (development)
pnpm --filter @workspace/db run push

# Force push (overwrite)
pnpm --filter @workspace/db run push-force
```

---

## Security Configuration

### Supply Chain Defense

The monorepo uses `minimumReleaseAge: 1440` (24 hours) to prevent installing recently published npm packages, mitigating supply-chain attacks.

### Platform Optimization

Extensive overrides exclude unnecessary platform binaries:

- esbuild: linux-x64 only
- rollup: linux-x64 only
- lightningcss: linux-x64 only

---

## Docker Architecture

### Services

| Service      | Port      | Purpose          | Profile    |
| ------------ | --------- | ---------------- | ---------- |
| api          | 4000:3000 | Express API      | default    |
| frontend-dev | 3000:3000 | Hot reload dev   | default    |
| frontend     | 8080:3000 | Production build | default    |
| postgres     | 5432:5432 | Database         | with-db    |
| nginx        | 80, 443   | Reverse proxy    | with-proxy |

### Health Checks

- API: `GET /api/healthz`
- PostgreSQL: `pg_isready`

---

## Performance Architecture

### Frontend Build Optimization

- **Code Splitting**: React + React-DOM in separate chunk
- **Manual Chunks**: Vendor and TanStack Query separated
- **PWA Caching**: NetworkFirst for API, CacheFirst for assets
- **Tailwind CSS v4**: Built-in optimization via `@tailwindcss/vite`

### API Server

- Express 5 with async middleware support
- JSON body parsing enabled
- CORS configured for cross-origin requests

---

## Scalability Considerations

### Current Limitations

1. **No caching layer**: Missing Redis/memcached
2. **No CDN**: Static assets served by Express
3. **Single DB connection pool**: Need connection pooling tuning
4. **No horizontal scaling config**: No sticky session handling

### Recommended Scaling Path

1. **Phase 1**: Add Redis for session/cache
2. **Phase 2**: CDN for static assets
3. **Phase 3**: Database read replicas
4. **Phase 4**: API gateway with rate limiting

---

## Monitoring & Observability

### Missing Components

- Structured logging (Pino/Winston)
- Error tracking (Sentry)
- Metrics collection (Prometheus)
- Distributed tracing (OpenTelemetry)

### Recommended Implementation

```typescript
// API Server logging middleware
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
});
```

---

## Future Architecture Considerations

### Near-term (Q2 2026)

1. Define complete database schema
2. Implement authentication (JWT/sessions)
3. Add request validation middleware
4. Configure structured logging

### Mid-term (Q3 2026)

1. Add rate limiting
2. Implement business logic endpoints
3. Add API response caching
4. Set up monitoring/alerting

### Long-term (Q4 2026)

1. Microservices decomposition if needed
2. GraphQL API for complex queries
3. Real-time features (WebSocket)
4. ML-powered content recommendations

---

## Appendix: TypeScript Configuration

The monorepo uses a shared base configuration (`tsconfig.base.json`) with:

- **Strict Mode**: Enabled with `strictNullChecks`, `noImplicitAny`
- **Bundler Resolution**: `moduleResolution: bundler`
- **ES2022 Target**: Modern JavaScript features
- **Workspace Conditions**: `customConditions: ["workspace"]`

---

## Appendix: Package Catalog

Shared dependencies managed via `pnpm-workspace.yaml` catalog:

```yaml
catalog:
  react: "19.1.0"
  react-dom: "19.1.0"
  vite: "^7.3.0"
  tailwindcss: "^4.1.14"
  drizzle-orm: "^0.45.1"
  zod: "^3.25.76"
  @tanstack/react-query: "^5.90.21"
```
