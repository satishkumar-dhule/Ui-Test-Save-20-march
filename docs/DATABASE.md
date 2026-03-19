# DevPrep Database Documentation

> **Last Updated:** 2026-03-19  
> **Database:** PostgreSQL via Drizzle ORM  
> **Framework:** Drizzle Kit for migrations

---

## Schema Overview

### Tables

#### users

| Column     | Type      | Constraints               |
| ---------- | --------- | ------------------------- |
| id         | serial    | primary key               |
| email      | text      | NOT NULL, UNIQUE          |
| name       | text      | NOT NULL                  |
| role       | user_role | NOT NULL, DEFAULT student |
| created_at | timestamp | NOT NULL, DEFAULT now()   |
| updated_at | timestamp | NOT NULL, DEFAULT now()   |

Roles: `student`, `instructor`, `admin`

#### content

| Column      | Type         | Constraints             |
| ----------- | ------------ | ----------------------- |
| id          | serial       | primary key             |
| type        | content_type | NOT NULL                |
| title       | text         | NOT NULL                |
| body        | text         | NOT NULL                |
| options     | jsonb        | NULL                    |
| answer      | text         | NOT NULL                |
| explanation | text         | NULL                    |
| difficulty  | integer      | DEFAULT 1               |
| tags        | text[]       | NULL                    |
| author_id   | integer      | REFERENCES users(id)    |
| created_at  | timestamp    | NOT NULL, DEFAULT now() |
| updated_at  | timestamp    | NOT NULL, DEFAULT now() |

Content types: `question`, `flashcard`, `coding_challenge`

#### quizzes

| Column      | Type      | Constraints             |
| ----------- | --------- | ----------------------- |
| id          | serial    | primary key             |
| title       | text      | NOT NULL                |
| description | text      | NULL                    |
| content_ids | integer[] | NULL                    |
| author_id   | integer   | REFERENCES users(id)    |
| created_at  | timestamp | NOT NULL, DEFAULT now() |
| updated_at  | timestamp | NOT NULL, DEFAULT now() |

#### exams

| Column        | Type      | Constraints             |
| ------------- | --------- | ----------------------- |
| id            | serial    | primary key             |
| title         | text      | NOT NULL                |
| description   | text      | NULL                    |
| quiz_id       | integer   | REFERENCES quizzes(id)  |
| time_limit    | integer   | NULL (minutes)          |
| passing_score | integer   | NULL (percentage)       |
| is_published  | boolean   | DEFAULT false           |
| author_id     | integer   | REFERENCES users(id)    |
| created_at    | timestamp | NOT NULL, DEFAULT now() |
| updated_at    | timestamp | NOT NULL, DEFAULT now() |

---

## Running Migrations

### Development Setup

1. **Provision Database**
   - In Replit, provision a PostgreSQL database via the "Database" tool
   - The `DATABASE_URL` will be automatically set in environment

2. **Push Schema (Development)**

   ```bash
   cd lib/db
   pnpm run push
   ```

   This pushes schema changes directly without migration files.

3. **Force Push (Development)**

   ```bash
   pnpm run push-force
   ```

   Drops and recreates tables. **WARNING: Data loss in development only.**

4. **Generate Migrations (Production)**
   ```bash
   cd lib/db
   pnpm run generate
   ```
   Creates migration files in `drizzle/` directory.

---

## Connection Pooling

### Drizzle Configuration

The database uses `pg` Pool with Drizzle ORM:

```typescript
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
```

### Replit-Specific Notes

- **Connection Limits:** Replit PostgreSQL has connection limits
- **Pool Size:** Default pool settings work for development
- **Connection Timeout:** Use sensible timeout settings
- **Keep Alive:** Enable for long-running connections

### Recommended Pool Settings

```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10, // Max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});
```

---

## Performance Considerations

### Indexes

Create indexes on frequently queried columns:

```sql
-- For user lookups
CREATE INDEX idx_users_email ON users(email);

-- For content filtering
CREATE INDEX idx_content_type ON content(type);
CREATE INDEX idx_content_author ON content(author_id);

-- For quiz content
CREATE INDEX idx_quizzes_author ON quizzes(author_id);

-- For exam queries
CREATE INDEX idx_exams_published ON exams(is_published);
CREATE INDEX idx_exams_author ON exams(author_id);
```

### Query Optimization

1. **Use `select` only needed columns** in queries
2. **Paginate large result sets** with `LIMIT` and `OFFSET`
3. **Avoid N+1 queries** - use joins or batch fetching
4. **Use `jsonb` efficiently** - only fetch when needed

### Caching Strategy

- Cache user sessions and preferences
- Cache content metadata
- Invalidate cache on content updates

---

## Environment Variables

| Variable     | Description                  |
| ------------ | ---------------------------- |
| DATABASE_URL | PostgreSQL connection string |

---

## Type Safety

Types are exported for use throughout the application:

```typescript
import type { User, Content, Quiz, Exam } from "@workspace/db/schema";
import type {
  InsertUser,
  InsertContent,
  InsertQuiz,
  InsertExam,
} from "@workspace/db/schema";
```

---

## Troubleshooting

### "DATABASE_URL must be set"

- Ensure PostgreSQL is provisioned in Replit
- Check .env file contains DATABASE_URL
- Restart the repl after provisioning database

### Connection Refused

- Verify Replit database is active
- Check network/firewall settings
- Ensure DATABASE_URL format is correct

### Migration Errors

- Use `push-force` only in development
- Back up data before production migrations
- Review generated SQL before applying
