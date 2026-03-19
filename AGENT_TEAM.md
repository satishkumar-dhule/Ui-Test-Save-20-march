# DevPrep Content Generation Agent Team

> **Last Updated:** 2026-03-19  
> **Session ID:** session-content-gen-20260319  
> **Project:** AI-powered content generation with local Vector DB + SQLite

---

## MANDATORY: Read AGENT_FRAMEWORK.md First

**ALL agents MUST read `/home/runner/workspace/AGENT_FRAMEWORK.md` before starting any work.**

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CONTENT GENERATION PIPELINE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  GitHub Actions (Scheduled/Demand)                                          │
│       │                                                                      │
│       ▼                                                                      │
│  ┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐     │
│  │  CONTENT_AGENT  │────▶│  opencode-ai    │────▶│  Local SQLite DB   │     │
│  │  (Orchestrator) │     │  CLI/JS SDK     │     │  (data/devprep.db) │     │
│  └─────────────────┘     └──────────────────┘     └─────────┬───────────┘     │
│                                                              │                │
│                                                              ▼                │
│                                               ┌───────────────────────────┐   │
│                                               │   Local Vector DB         │   │
│                                               │   (data/vectors/)         │   │
│                                               │   - questions.vec         │   │
│                                               │   - flashcards.vec         │   │
│                                               │   - coding.vec             │   │
│                                               └───────────────────────────┘   │
│                                                              │                │
│       ┌───────────────────────────────────────────────────────┘                │
│       │                                                                      │
│       ▼                                                                      │
│  ┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐ │
│  │  API Server     │────▶│  /api/content     │────▶│  Frontend Merge     │ │
│  │  (Express)      │     │  /api/search      │     │  (Runtime)          │ │
│  └─────────────────┘     └──────────────────┘     └─────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Agent Team

### Core Agents

| ID                   | Name           | Experience | Specialization                        | Status    |
| -------------------- | -------------- | ---------- | ------------------------------------- | --------- |
| CONTENT_ORCHESTRATOR | Sarah Mitchell | 21 years   | Content Strategy, AI Prompts, Quality | available |
| VECTOR_DB_AGENT      | David Park     | 25 years   | Vector DB, Embeddings, Similarity     | available |
| QUALITY_AGENT        | Chris Taylor   | 17 years   | Content Quality, Testing, Validation  | available |
| PROMPT_ENGINEER      | Maria Garcia   | 23 years   | AI Prompts, Content Structure         | available |
| DATABASE_AGENT       | Robert Kim     | 21 years   | SQLite, Schema, Data Integrity        | available |
| CI_CD_AGENT          | Emma Brown     | 22 years   | GitHub Actions, Automation, Workflows | available |
| DOCS_AGENT           | Jennifer Davis | 18 years   | Technical Writing, Runbooks           | available |

---

## Content Types & Quality Standards

### Supported Content Types

| Type        | Description                   | Quality Bar                          | Daily Target |
| ----------- | ----------------------------- | ------------------------------------ | ------------ |
| `question`  | Technical interview questions | 90%+ parse rate, real code examples  | 5/channel    |
| `flashcard` | Study flashcards with hints   | 95%+ parse rate, valid code snippets | 5/channel    |
| `exam`      | Scenario-based MCQ exams      | 90%+ parse rate, realistic scenarios | 5/channel    |
| `voice`     | Voice practice prompts        | 90%+ parse rate, structured key pts  | 5/channel    |
| `coding`    | Coding challenges with tests  | 85%+ parse rate, runnable code       | 3/channel    |

### Quality Requirements

#### Questions

- Real interview questions (not basics)
- Minimum 2 code examples (runnable)
- ELI5 section with real-world analogy
- Proper markdown with bold/key terms
- Tags from channel-specific tag pool

#### Flashcards

- Specific concept (not generic)
- Bullet point answers with `•` separator
- Working code examples (5-15 lines)
- Hint that guides without giving away answer

#### Exams

- Scenario-based questions
- 4 plausible options (2 distractors)
- 2-3 sentence explanations
- Real exam domain mapping

#### Voice Practice

- 1-2 sentence prompts
- 4+ structured key points
- Natural follow-up questions
- 120-second time limit

#### Coding Challenges

- Complete runnable code in all languages
- Test cases with edge cases
- Time/space complexity analysis
- Step-by-step approach markdown
- ELI5 real-world analogy
- Related concepts tags

---

## Vector DB Specification

### Local Vector Store

```
data/
├── devprep.db              # SQLite - all content
├── vectors/
│   ├── questions/          # Question embeddings
│   │   ├── index.bin       # FAISS/pickle index
│   │   └── metadata.json   # ID mappings
│   ├── flashcards/         # Flashcard embeddings
│   ├── coding/             # Coding challenge embeddings
│   ├── exams/              # Exam question embeddings
│   └── voice/              # Voice prompt embeddings
└── embeddings/
    └── model/              # Local embedding model (optional)
```

### Embedding Strategy

| Content Type | Embedding Model       | Dimensions | Batch Size |
| ------------ | --------------------- | ---------- | ---------- |
| Questions    | sentence-transformers | 384        | 32         |
| Flashcards   | sentence-transformers | 384        | 32         |
| Coding       | codebert/multilingual | 768        | 16         |
| Exams        | sentence-transformers | 384        | 32         |
| Voice        | sentence-transformers | 384        | 32         |

---

## SQLite Schema

```sql
-- Main content table
CREATE TABLE generated_content (
  id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL,
  content_type TEXT NOT NULL,
  data TEXT NOT NULL,           -- JSON blob
  quality_score REAL DEFAULT 0, -- AI-assessed quality
  embedding_id TEXT,            -- Reference to vector store
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  generated_by TEXT,            -- opencode model used
  generation_time_ms INTEGER     -- performance tracking
);

CREATE INDEX idx_type ON generated_content(content_type);
CREATE INDEX idx_channel ON generated_content(channel_id);
CREATE INDEX idx_status ON generated_content(status);
CREATE INDEX idx_quality ON generated_content(quality_score);

-- Quality feedback table
CREATE TABLE quality_feedback (
  id TEXT PRIMARY KEY,
  content_id TEXT REFERENCES generated_content(id),
  feedback_type TEXT,           -- upvote, downvote, report
  user_id TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Generation logs
CREATE TABLE generation_logs (
  id TEXT PRIMARY KEY,
  channel_id TEXT,
  content_type TEXT,
  success INTEGER,
  error_message TEXT,
  duration_ms INTEGER,
  model TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);
```

---

## GitHub Actions Workflow

### Workflows

| Workflow            | Trigger                  | Purpose                      |
| ------------------- | ------------------------ | ---------------------------- |
| `content-gen.yml`   | Schedule (daily 3AM UTC) | Scheduled content generation |
| `content-gen.yml`   | Manual dispatch          | On-demand generation         |
| `vector-index.yml`  | Push to data/            | Rebuild vector indices       |
| `quality-check.yml` | PR to main               | Validate generated content   |

### Secrets Required

| Secret              | Description                            |
| ------------------- | -------------------------------------- |
| `ANTHROPIC_API_KEY` | For Claude-powered generation          |
| `OPENAI_API_KEY`    | Alternative for GPT-powered generation |
| `OPENCODE_MODEL`    | Model override (optional)              |

---

## Task Assignment Protocol

### Before Starting Any Task

1. **READ** `/home/runner/workspace/AGENT_FRAMEWORK.md`
2. **READ** this file section
3. **SELECT** appropriate agent from the Agent Catalogue
4. **UPDATE** agent status to `active`
5. **CREATE** START checkpoint
6. **EXECUTE** task
7. **LOG** checkpoints at every milestone
8. **UPDATE** this file with progress
9. **SET** status to `available`

### Agent Selection Guide

| Task Type          | Primary Agent        | Secondary Agent      |
| ------------------ | -------------------- | -------------------- |
| Content Generation | CONTENT_ORCHESTRATOR | PROMPT_ENGINEER      |
| Vector DB          | VECTOR_DB_AGENT      | DATABASE_AGENT       |
| Quality Assurance  | QUALITY_AGENT        | CONTENT_ORCHESTRATOR |
| CI/CD              | CI_CD_AGENT          | DATABASE_AGENT       |
| Documentation      | DOCS_AGENT           | PROMPT_ENGINEER      |

---

## Outstanding Tasks

### P0 - Critical

| Task                                                 | Assigned To          | Status  | Priority |
| ---------------------------------------------------- | -------------------- | ------- | -------- |
| Create `.github/workflows/content-gen.yml`           | CI_CD_AGENT          | pending | P0       |
| Update `generate-content.mjs` with vector DB support | CONTENT_ORCHESTRATOR | pending | P0       |
| Add quality scoring to generation pipeline           | QUALITY_AGENT        | pending | P0       |
| Create vector embedding script                       | VECTOR_DB_AGENT      | pending | P0       |
| Update SQLite schema with new columns                | DATABASE_AGENT       | pending | P0       |

### P1 - High Priority

| Task                                        | Assigned To          | Status  | Priority |
| ------------------------------------------- | -------------------- | ------- | -------- |
| Create embedding service                    | VECTOR_DB_AGENT      | pending | P1       |
| Add search endpoint using vector similarity | CONTENT_ORCHESTRATOR | pending | P1       |
| Update API to expose generated content      | DATABASE_AGENT       | pending | P1       |
| Create quality feedback endpoints           | QUALITY_AGENT        | pending | P1       |
| Document runbook for GitHub Actions         | DOCS_AGENT           | pending | P1       |

### P2 - Medium Priority

| Task                                          | Assigned To          | Status  | Priority |
| --------------------------------------------- | -------------------- | ------- | -------- |
| Add batch generation support                  | CONTENT_ORCHESTRATOR | pending | P2       |
| Create content refresh strategy               | PROMPT_ENGINEER      | pending | P2       |
| Add monitoring dashboard for generation stats | CI_CD_AGENT          | pending | P2       |

---

## Checkpoint Log

```
[2026-03-19T00:00:00Z] | SYSTEM | INIT | Content Generation Agent Team initialized
[2026-03-19T00:00:00Z] | SYSTEM | TASK | Outstanding tasks identified - see below
```

### Active Checkpoints

| Agent                | Last Checkpoint | Status    |
| -------------------- | --------------- | --------- |
| CONTENT_ORCHESTRATOR | N/A             | available |
| VECTOR_DB_AGENT      | N/A             | available |
| QUALITY_AGENT        | N/A             | available |
| PROMPT_ENGINEER      | N/A             | available |
| DATABASE_AGENT       | N/A             | available |
| CI_CD_AGENT          | N/A             | pending   |
| DOCS_AGENT           | N/A             | pending   |

---

## Quality Gates

### Content Generation Quality Gate

- [ ] JSON parse succeeds (≥85% of attempts)
- [ ] All required fields present
- [ ] Code examples are syntactically valid
- [ ] Tags match channel tag pool
- [ ] Difficulty is appropriate for content type
- [ ] Vector embedding generated and stored
- [ ] SQLite record created with quality_score

### Vector DB Quality Gate

- [ ] Embedding model loads successfully
- [ ] Batch processing completes without OOM
- [ ] Index saved with correct format
- [ ] Metadata mappings are complete
- [ ] Search returns relevant results

---

## Channels Configuration

### Active Channels

| ID            | Name                       | Type | Tags                                   |
| ------------- | -------------------------- | ---- | -------------------------------------- |
| javascript    | JavaScript                 | tech | javascript, async, closures, prototype |
| react         | React                      | tech | react, hooks, state, performance       |
| algorithms    | Algorithms                 | tech | algorithms, sorting, big-o, dp         |
| devops        | DevOps                     | tech | devops, docker, ci-cd, linux           |
| kubernetes    | Kubernetes                 | tech | kubernetes, k8s, containers            |
| networking    | Networking                 | tech | networking, http, rest, dns            |
| system-design | System Design              | tech | cs, distributed, concurrency           |
| aws-saa       | AWS Solutions Architect    | cert | aws, cloud                             |
| aws-dev       | AWS Developer              | cert | aws, cloud, serverless                 |
| cka           | Certified Kubernetes Admin | cert | kubernetes, k8s                        |
| terraform     | HashiCorp Terraform        | cert | terraform, iac                         |

---

## Session Persistence

### How to Resume

1. **READ** `/home/runner/workspace/AGENT_FRAMEWORK.md`
2. **READ** this file (AGENT_TEAM.md)
3. **CHECK** Outstanding Tasks section
4. **SELECT** next task by priority
5. **ASSIGN** to appropriate agent
6. **SPAWN** agent with full context

---

**All agents MUST abide by AGENT_FRAMEWORK.md. All work tracked here.**
