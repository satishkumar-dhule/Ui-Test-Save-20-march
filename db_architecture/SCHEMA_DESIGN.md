# DB Schema Design — SQLite

## 1. Schema Overview

This schema normalizes the DevPrep content store around the five content types
defined in `CONTENT_STANDARDS.md`, extracting queryable metadata into indexed
columns while preserving type-specific payloads as JSON.

### Entity–Relationship Summary

```
channels ──1:N── contents ──1:N── content_tags
                                    │
contents ──1:1── content_payload    └── tags (denormalized, TEXT column)
```

## 2. Tables

### 2.1 `channels`

Reference table for each technology channel.

```sql
CREATE TABLE channels (
  id    TEXT PRIMARY KEY,   -- slug: "javascript", "aws-saa", "devops"
  name  TEXT NOT NULL       -- human name: "JavaScript", "AWS Solutions Architect"
);
```

### 2.2 `contents`

The central table. One row per content entity regardless of type.

| Column               | Type    | Spec Reference | Notes                                                                     |
| -------------------- | ------- | -------------- | ------------------------------------------------------------------------- |
| `id`                 | TEXT PK | §4.1 id        | Format depends on type: `q{N}`, `fc{N}`, `cc{N}`, `ex-{slug}{N}`, `vp{N}` |
| `channel_id`         | TEXT FK | §4.1 channelId | References `channels.id`                                                  |
| `content_type`       | TEXT    | —              | One of: `question`, `flashcard`, `coding`, `exam`, `voice`                |
| `difficulty`         | TEXT    | §2             | `beginner/intermediate/advanced` OR `easy/medium/hard` per taxonomy       |
| `tags`               | TEXT    | §3             | JSON array `["channel-slug", "tag1", "tag2"]`, max 5, kebab-case          |
| `status`             | TEXT    | —              | `pending`, `approved`, `published`, `rejected`                            |
| `quality_score`      | REAL    | —              | 0.0–1.0                                                                   |
| `data`               | TEXT    | —              | Full JSON payload matching the spec interface for this content_type       |
| `created_at`         | INTEGER | —              | Unix timestamp                                                            |
| `updated_at`         | INTEGER | —              | Unix timestamp                                                            |
| `generated_by`       | TEXT    | —              | AI model or editor identifier                                             |
| `generation_time_ms` | INTEGER | —              | Time taken to generate                                                    |

**NOT NULL enforcement**: `id`, `channel_id`, `content_type`, `difficulty`, `tags`, `data`, `status`.

### 2.3 `content_tags`

Denormalized tag index for fast tag-based filtering without JSON parsing.

```sql
CREATE TABLE content_tags (
  content_id  TEXT NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  tag         TEXT NOT NULL,
  PRIMARY KEY (content_id, tag)
);
```

### 2.4 `migrations`

Tracks applied schema migrations.

```sql
CREATE TABLE migrations (
  id          TEXT PRIMARY KEY,
  applied_at  INTEGER NOT NULL
);
```

## 3. Indexes

```sql
-- Primary query patterns:
-- 1. Filter by channel + content_type (main feed)
CREATE INDEX idx_contents_channel_type ON contents(channel_id, content_type);
-- 2. Filter by content_type alone (type-specific pages)
CREATE INDEX idx_contents_type ON contents(content_type);
-- 3. Filter by status (only published/approved)
CREATE INDEX idx_contents_status ON contents(status);
-- 4. Order by quality_score DESC
CREATE INDEX idx_contents_quality ON contents(quality_score DESC);
-- 5. Order by created_at DESC (recency)
CREATE INDEX idx_contents_created ON contents(created_at DESC);
-- 6. Composite: channel + status + type (main API query)
CREATE INDEX idx_contents_ch_st_ty ON contents(channel_id, status, content_type);
-- 7. Tag lookup
CREATE INDEX idx_content_tags_tag ON content_tags(tag);
```

## 4. Difficulty Taxonomy Mapping (Spec §2)

```
Tech channels (JS, TS, React, Algorithms, System Design, DevOps, Networking):
  Q&A / Flashcards / Voice → beginner | intermediate | advanced

Cert channels (AWS-SAA, AWS-DEV, CKA, Terraform):
  Q&A / Flashcards / Exam / Voice → easy | medium | hard

Coding challenges (ALL channels):
  → easy | medium | hard
```

The `difficulty` column stores the raw value. The application layer selects
the correct taxonomy based on `channel_id` + `content_type`.

## 5. Tag Format (Spec §3)

- Kebab-case: `event-loop`, `closures`, `multi-az`
- Max 5 tags per entity
- First tag must be the channel slug
- No generic tags: `important`, `review`, `misc`
- No difficulty-as-tag

Enforced at application level during write.

## 6. Query Cookbook

### All published content for a channel

```sql
SELECT * FROM contents
WHERE channel_id = ? AND status IN ('published', 'approved')
ORDER BY created_at DESC
LIMIT ? OFFSET ?;
```

### Content by type

```sql
SELECT * FROM contents
WHERE content_type = ? AND status IN ('published', 'approved')
ORDER BY quality_score DESC, created_at DESC
LIMIT ? OFFSET ?;
```

### Filter by tag

```sql
SELECT c.* FROM contents c
JOIN content_tags t ON t.content_id = c.id
WHERE t.tag = ? AND c.status IN ('published', 'approved')
ORDER BY c.created_at DESC;
```

### Stats: count by type per channel

```sql
SELECT channel_id, content_type, COUNT(*) as count
FROM contents
WHERE status IN ('published', 'approved')
GROUP BY channel_id, content_type;
```

### Difficulty distribution for a channel

```sql
SELECT content_type, difficulty, COUNT(*) as count
FROM contents
WHERE channel_id = ? AND status = 'published'
GROUP BY content_type, difficulty;
```

## 7. Backward Compatibility

The legacy `generated_content` table is preserved. New writes populate both
`generated_content` (for local SQLite client in frontend) and `contents`
(for server API). A migration copies existing data from `generated_content`
to `contents` on first startup.
