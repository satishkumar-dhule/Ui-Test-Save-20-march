# DB Architecture Team — DevPrep

## Mission

Design and implement a state-of-the-art SQLite schema for the DevPrep content platform that directly models the five content types defined in `CONTENT_STANDARDS.md`, enabling structured queries, efficient filtering, tag-based lookups, and quality enforcement while maintaining full backward compatibility with existing API contracts.

## Architecture Principles (from CONTENT_STANDARDS.md §1)

- **Accuracy** — Every field maps 1:1 to a spec-defined entity. No orphaned columns.
- **Precision** — Normalize metadata into indexed columns; keep type-specific payloads in JSON only when the spec demands flexible schema.
- **Brevity** — Minimal tables, maximal queryability. No unnecessary joins.
- **Actionability** — Schema enables the queries the app actually runs (group by channel, filter by type, filter by tags, paginate by quality and recency).
- **Currency** — Schema reflects the current stable spec version. Flags deprecated fields explicitly.

## The Five Architects

| #   | Role                                  | Name     | Focus                                                                               |
| --- | ------------------------------------- | -------- | ----------------------------------------------------------------------------------- |
| 1   | **Lead DB Architect**                 | A. Kiran | Overall schema vision, alignment with CONTENT_STANDARDS.md, cross-team coordination |
| 2   | **Data Modeling Architect**           | M. Reyes | Entity extraction, normalization, relationship design, type-specific field mapping  |
| 3   | **Query & Indexing Architect**        | S. Patel | Index strategy, composite indexes for common query patterns, SQLite WAL tuning      |
| 4   | **Migration & Integration Architect** | J. Novak | Data migration from legacy `generated_content`, API compatibility, sync strategy    |
| 5   | **Quality & Observability Architect** | L. Chen  | Constraint enforcement, validation triggers, health metrics, data integrity checks  |

## Content Types Extracted from Spec

| Content Type | Difficulty Taxonomy                  | Key Unique Fields                                                                                                                        |
| ------------ | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `question`   | `beginner / intermediate / advanced` | `title`, `votes`, `views`, `asked_by`, `asked_at`, `sections`                                                                            |
| `flashcard`  | same as channel                      | `front`, `back`, `hint`, `category`, `code_example`, `mnemonic`                                                                          |
| `coding`     | `easy / medium / hard`               | `title`, `slug`, `time_estimate`, `constraints`, `examples`, `starter_code`, `solution`, `hints`, `test_cases`, `approach`, `complexity` |
| `exam`       | `easy / medium / hard`               | `domain`, `question`, `choices`, `correct`, `explanation`                                                                                |
| `voice`      | same as channel                      | `prompt`, `type`, `time_limit`, `domain`, `key_points`, `follow_up`                                                                      |

## Deliverables

1. **Schema Design Document** — `db_architecture/SCHEMA_DESIGN.md`
2. **Strategy** — `db_architecture/STRATEGY.md`
3. **Migration Plan** — Implemented in `artifacts/devprep/server/src/index.ts`
4. **Query Cookbook** — Embedded in schema design doc
5. **Quality Gates** — SQLite constraints and indexes

## Status

- [x] Team spawned and roles assigned
- [x] Schema design completed
- [x] Migration scripts implemented
- [ ] Quality triggers implemented (next)
- [ ] API endpoints verified against new schema (ready for QA)
