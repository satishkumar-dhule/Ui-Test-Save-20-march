# State-of-the-Art DB Strategy — SQLite

## Overview

Normalize the DevPrep content store in SQLite around the five content types
defined in `CONTENT_STANDARDS.md` (Question, Flashcard, Coding Challenge,
Exam Question, Voice Prompt). Extract queryable metadata into indexed columns
while preserving type-specific payloads as JSON. Maintain full backward
compatibility with existing API endpoints and the frontend local-DB client.

## Architecture Decision: SQLite-First

- SQLite with WAL mode for concurrent reads during generation
- JSON-in-TEXT for flexible type-specific payloads (matching spec interfaces)
- Denormalized `content_tags` table for tag-based filtering without JSON parsing
- Lightweight `migrations` table for deterministic schema evolution

## Key Tables

| Table          | Purpose                                                         |
| -------------- | --------------------------------------------------------------- |
| `channels`     | Reference data: channel slug → human name                       |
| `contents`     | Central table: one row per content entity with indexed metadata |
| `content_tags` | Denormalized tag index for fast tag-based lookups               |
| `migrations`   | Tracks applied schema migrations                                |

## Migration Plan

### Phase 1: Schema Foundation (done)

- Add `contents`, `content_tags`, `migrations` tables
- Create composite indexes for primary query patterns
- Migrate existing data from `generated_content` to `contents`
- Update server API to prefer `contents` when available

### Phase 2: Quality Enforcement

- Add SQLite triggers for tag format validation (kebab-case, max 5, first=channel slug)
- Add CHECK constraints for valid content_type and status values
- Add difficulty taxonomy validation at write-time

### Phase 3: Query Optimization

- Add covering indexes for the most common API queries
- Analyze query plans with `EXPLAIN QUERY PLAN`
- Add partial indexes for filtered queries (e.g., only published content)

### Phase 4: Observability

- Add `/api/db/stats` endpoint for content coverage metrics
- Track difficulty distribution per channel per content type
- Monitor tag compliance rates

## Data Flow

```
Content Generator
  └─► INSERT into contents (id, channel_id, content_type, difficulty, tags, data, ...)
  └─► INSERT into content_tags (one row per tag)
  └─► INSERT into generated_content (backward compat for local SQLite client)

Server API
  └─► SELECT from contents (structured queries with indexes)
  └─► JOIN content_tags for tag-based filtering

Frontend (local SQLite)
  └─► SELECT from generated_content (unchanged)
```
