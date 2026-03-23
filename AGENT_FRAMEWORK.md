# OpenCode Agent Framework

> **Version:** 1.1.0
> **Last Updated:** 2026-03-22
> **Purpose:** Standardized agent workflow for all development tasks

---

## Core Principle

**ALL agents MUST:**

1. Read this framework before starting any task
2. Read the **Mandatory Spec Reading** section below and load all required specs for the task type
3. Spawn from agent team defined in `AGENT_TEAM.md`
4. Track all work in `AGENT_TEAM.md`
5. Create checkpoints for every logical milestone
6. Check for outstanding tasks before starting new work
7. Validate all output against the relevant spec before marking COMPLETE

---

## Mandatory Spec Reading

Agents MUST read the following specs **before starting any work**. The list is role-specific — read every file in your role's row.

| Agent Role | Required Reading (in order) |
| ---------- | --------------------------- |
| **All agents** | `AGENT_FRAMEWORK.md` (this file), `AGENT_TEAM.md` |
| **Content agents** (CONTENT_ORCHESTRATOR, PROMPT_ENGINEER, QUALITY_AGENT) | + `CONTENT_STANDARDS.md` (all sections), `ARCHITECTURE_OVERVIEW.md` §4 |
| **Frontend agents** (FRONTEND_ENGINEER, UI_UX_AGENT, all frontend redesign team) | + `ARCHITECTURE_OVERVIEW.md` (all sections), `replit.md` |
| **Backend / DB agents** (BACKEND_ENGINEER, DATABASE_AGENT, TECH_ARCH_AGENT) | + `ARCHITECTURE_OVERVIEW.md` §4, `replit.md` |
| **QA agents** (QA_ENGINEER, TESTING_LEAD) | + `CONTENT_STANDARDS.md` §11, `ARCHITECTURE_OVERVIEW.md` |
| **DevOps / CI agents** (DEVOPS_ENGINEER, CI_CD_AGENT, STRUCTURAL_AGENT) | + `replit.md`, `BUN_WORKFLOW.md` |
| **Docs agents** (DOCS_AGENT, DOCUMENTATION_LEAD) | + `ARCHITECTURE_OVERVIEW.md`, `CONTENT_STANDARDS.md` |

### Non-Negotiable Architecture Rules (Read Before Writing Any Code)

These rules apply to **all agents** and cannot be overridden by any task description:

1. **No Express/API server in DevPrep** — The `artifacts/devprep` frontend uses **sql.js (SQLite in WASM)** directly in the browser. There is no backend API server for DevPrep. Do NOT add Express routes, Redis calls, or HTTP fetches to a local server.
2. **sql.js is the DB** — All data reads/writes in DevPrep go through `src/services/dbClient.ts` → `src/services/dbApi.ts`. The static DB file is `/devprep.db` served by Vite.
3. **Fallback chain** — If the DB is unavailable, fall back to seed data in `src/data/`. Never hard-fail if the DB hasn't loaded yet.
4. **Strict TypeScript** — Zero `any` types. All content data shapes must match the TypeScript interfaces in `CONTENT_STANDARDS.md`.
5. **Content status at generation** — Content is saved with `status: 'approved'` only if `qualityScore >= 0.5`. Otherwise it is saved as `status: 'pending'` and will not appear in the app.

---

## Agent Team Catalogue

### Core Agents (Always Available)

| ID                | Name           | Specialization                           | Min Experience |
| ----------------- | -------------- | ---------------------------------------- | -------------- |
| FRONTEND_ENGINEER | Alex Chen      | React 19, TypeScript, Performance        | 22 years       |
| QA_ENGINEER       | Sarah Mitchell | E2E Testing, Playwright, Quality Gates   | 21 years       |
| TECH_ARCH_AGENT   | David Park     | System Design, APIs, Databases           | 25 years       |
| UI_UX_AGENT       | Maria Garcia   | UI Design, Accessibility, Design Systems | 23 years       |
| INNOVATION_LEAD   | James Wilson   | DX, Emerging Tech, Best Practices        | 24 years       |
| STRUCTURAL_AGENT  | Lisa Thompson  | Monorepo, Build Systems, Docker          | 20 years       |
| BACKEND_ENGINEER  | Robert Kim     | Express, REST, ORM, Caching              | 21 years       |
| DEVOPS_ENGINEER   | Emma Brown     | CI/CD, Monitoring, Infrastructure        | 22 years       |
| SECURITY_AGENT    | Michael Lee    | Security, Auth, OWASP                    | 20 years       |
| DOCS_AGENT        | Jennifer Davis | Technical Writing, Docs                  | 18 years       |

---

## Agent Spawning Protocol

### Before Spawning Any Agent

```
1. READ /home/runner/workspace/AGENT_TEAM.md
2. CHECK current agent statuses and assignments
3. IDENTIFY best-fit agent for task
4. CHECK for existing work in progress
5. UPDATE task assignment in AGENT_TEAM.md
6. SPAWN agent with full context
```

### Agent Spawning Template

```markdown
### Before spawning:

1. Read AGENT_TEAM.md current state
2. Identify correct agent based on:
   - FRONTEND_ENGINEER → React, UI, Components, Performance
   - QA_ENGINEER → Testing, Quality, Coverage
   - TECH_ARCH_AGENT → Architecture, APIs, DB, Scaling
   - UI_UX_AGENT → Design, Accessibility, UX
   - INNOVATION_LEAD → DX, Best Practices, Innovation
   - STRUCTURAL_AGENT → Build, Monorepo, Docker
   - BACKEND_ENGINEER → API, Server, Database
   - DEVOPS_ENGINEER → CI/CD, Deploy, Monitoring
   - SECURITY_AGENT → Auth, Security, Validation
   - DOCS_AGENT → Documentation, README

3. Update AGENT_TEAM.md:
   - Set agent Status to "active"
   - Set Assigned field to task
   - Clear Progress field
   - Set Last Checkpoint to "[TIME] | AGENT | START | Beginning [task]"
```

---

## Checkpoint Protocol

### Checkpoint Format

```
[TIMESTAMP] | AGENT_ID | CHECKPOINT_TYPE | Description
- Detail 1
- Detail 2
```

### Checkpoint Types

| Type       | Meaning            | When                         |
| ---------- | ------------------ | ---------------------------- |
| START      | Agent began work   | Task assignment              |
| PROGRESS   | Work in progress   | Every 10-15 min or milestone |
| CHECKPOINT | Logical milestone  | After sub-task completion    |
| ISSUE      | Problem identified | When blocking issue found    |
| COMPLETE   | Task finished      | All work done                |
| BLOCKED    | Cannot proceed     | Waiting on dependency        |

### Mandatory Checkpoints

1. **START** - When agent begins work
2. **Every 10 minutes** - During active work
3. **After each sub-task** - Milestone completion
4. **Before blocking** - When issue encountered
5. **COMPLETE** - When all work done

---

## Task Workflow

### 1. Task Identification

```
- Check AGENT_TEAM.md Outstanding Tasks section
- Check BUG_TRACKER.md for critical bugs
- Check TASK_TRACKER.md for pending tasks
```

### 2. Agent Assignment

```
- Match task to best-fit agent
- Update AGENT_TEAM.md with assignment
- Set agent Status to "active"
```

### 3. Execution

```
- Agent reads AGENT_TEAM.md for context
- Agent spawns and executes task
- Agent creates checkpoints in AGENT_TEAM.md
```

### 4. Completion

```
- Agent updates Progress field
- Agent sets Status to "available" or "completed"
- Agent logs COMPLETE checkpoint
- Verify task in AGENT_TEAM.md
```

---

## File Update Protocol

### Files to Maintain

| File            | Purpose                         | Update Frequency     |
| --------------- | ------------------------------- | -------------------- |
| AGENT_TEAM.md   | Team status, tasks, checkpoints | Every action         |
| BUG_TRACKER.md  | Known bugs and status           | On bug discovery/fix |
| TASK_TRACKER.md | Task tracking                   | On task change       |
| TASK.md         | Current active task             | On task start/end    |

### Update Rules

1. **AGENT_TEAM.md** - MANDATORY for all agents
2. Update immediately on:
   - Task assignment
   - Status change
   - Milestone completion
   - Issue discovery
   - Checkpoint creation

---

## Agent Communication

### Checkpoint Logging

```javascript
// Every agent MUST log checkpoints
const checkpoint = `[${new Date().toISOString()}] | ${AGENT_ID} | ${TYPE} | ${description}`;
```

### Status Codes

| Status    | Meaning               |
| --------- | --------------------- |
| available | Ready for new task    |
| active    | Currently working     |
| blocked   | Waiting on dependency |
| completed | Task finished         |
| on-hold   | Paused temporarily    |

---

## Error Handling

### On Error

```
1. Log ISSUE checkpoint with error details
2. Update agent Status to "blocked"
3. List error in AGENT_TEAM.md Issues section
4. Continue with other work if possible
```

### On Blocked

```
1. Log BLOCKED checkpoint
2. Identify blocking dependency
3. Update AGENT_TEAM.md with blocker
4. Signal for help or skip to other task
```

---

## Task Priority Matrix

| Priority | Description           | Response       |
| -------- | --------------------- | -------------- |
| P0       | Critical/Critical Bug | Immediate      |
| P1       | High/Feature          | Within 1 hour  |
| P2       | Medium/Enhancement    | Within 4 hours |
| P3       | Low/Nice-to-have      | When available |

---

## Agent Selection Algorithm

```
FUNCTION selectAgent(task):
  1. Analyze task type and requirements
  2. MATCH against agent specializations:
     - UI/Component → FRONTEND_ENGINEER + UI_UX_AGENT
     - Testing → QA_ENGINEER
     - API/Server → BACKEND_ENGINEER + TECH_ARCH_AGENT
     - Architecture → TECH_ARCH_AGENT
     - DevOps/Docker → DEVOPS_ENGINEER + STRUCTURAL_AGENT
     - Security → SECURITY_AGENT
     - Documentation → DOCS_AGENT
     - Innovation/DX → INNOVATION_LEAD
  3. CHECK agent availability
  4. ASSIGN to first available matching agent
  5. UPDATE AGENT_TEAM.md
  6. SPAWN agent
```

---

## Quality Gates

### Before Marking Task Complete

- [ ] All code changes made
- [ ] TypeScript compiles (`bun run typecheck` from workspace root)
- [ ] Linting passes or pre-existing warnings are not worsened (`bun run --filter @workspace/devprep lint`)
- [ ] Tests pass (`bun run --filter @workspace/devprep test`)
- [ ] Checkpoint logged in `AGENT_TEAM.md`
- [ ] Agent progress updated
- [ ] Agent status set appropriately

### Content Quality Gate (Content Agents Only)

Every piece of generated content must pass **all** checks in `CONTENT_STANDARDS.md` §11 (Revision Checklist) before being committed to the database or any data file. Specifically:

- [ ] TypeScript interface matches exactly — field names, types, and optionality
- [ ] `id` format matches the spec: `q{n}`, `fc{n}`, `cc{n}`, `ex-{slug}{n}`, `vp{n}`
- [ ] Difficulty value matches the correct taxonomy for the channel type (§2)
- [ ] Tags follow kebab-case; first tag is the channel slug; max 5 tags (§3)
- [ ] Minimums per channel are met (see each content-type section)
- [ ] Anti-patterns from §10 are absent
- [ ] `status` is set to `'approved'` only when `qualityScore >= 0.5`
- [ ] Content is stored in `generated_content` table as valid JSON in the `data` column

### Frontend Quality Gate (Frontend Agents Only)

- [ ] No `any` types introduced
- [ ] No Express, Redis, or direct HTTP fetch to `localhost:3001` — use `dbApi.ts` instead
- [ ] New components placed in correct atomic layer (`ui/` → `molecules/` → `organisms/` → `layouts/`)
- [ ] New pages registered in `src/routes-v2/index.tsx`
- [ ] All new hooks in `hooks/` or `hooks-v2/`; stores in `stores-v2/`
- [ ] Accessibility: interactive elements have `aria-label` or visible text; keyboard navigation works

---

## Framework Enforcement

### Agent Checklist (Must Complete)

- [ ] Read `AGENT_FRAMEWORK.md` (this file) before starting
- [ ] Read all mandatory specs listed in **Mandatory Spec Reading** for your role
- [ ] Read `AGENT_TEAM.md` and check current assignments
- [ ] Update `AGENT_TEAM.md` with task assignment
- [ ] Create START checkpoint
- [ ] Execute task
- [ ] Create checkpoints at milestones
- [ ] Run quality gate checklist for your role
- [ ] Update progress in `AGENT_TEAM.md`
- [ ] Create COMPLETE checkpoint
- [ ] Set final status

### Violations

Any agent not following this framework:

1. Will be flagged in the next checkpoint review
2. Must fix all violations before receiving new tasks
3. Supervisor (INNOVATION_LEAD / ORCHESTRATION_LEAD) will audit and re-assign if needed
4. Content that fails `CONTENT_STANDARDS.md` §11 will be rejected — it is NOT marked `approved` in the DB

---

## Meta-Agent Protocol

For orchestrating multiple agents:

```
1. READ AGENT_TEAM.md
2. IDENTIFY all required agents
3. SPAWN agents in parallel where possible
4. TRACK each agent's checkpoint
5. AGGREGATE results
6. UPDATE AGENT_TEAM.md with final status
7. REPORT completion
```

---

## Appendix: Checkpoint Examples

### START

```
[2026-03-19T10:30:00Z] | FRONTEND_ENGINEER | START | Beginning search component implementation
```

### CHECKPOINT

```
[2026-03-19T10:45:00Z] | FRONTEND_ENGINEER | CHECKPOINT | Completed search input component
- Added debounced input handler
- Integrated with API client
- Added loading state
```

### ISSUE

```
[2026-03-19T11:00:00Z] | FRONTEND_ENGINEER | ISSUE | API endpoint not returning results
- Blocking: Cannot test search display
- Needs: BACKEND_ENGINEER to verify endpoint
```

### COMPLETE

```
[2026-03-19T12:00:00Z] | FRONTEND_ENGINEER | COMPLETE | Search component fully implemented
- All user interactions handled
- Loading/error states added
- Tests passing
- Ready for QA review
```

---

## Revision History

| Version | Date       | Changes                                                                                   |
| ------- | ---------- | ----------------------------------------------------------------------------------------- |
| 1.0.0   | 2026-03-19 | Initial framework                                                                         |
| 1.1.0   | 2026-03-22 | Added Mandatory Spec Reading, Non-Negotiable Architecture Rules, Content & Frontend Quality Gates, updated Agent Checklist and Violations |

---

**All agents MUST abide by this framework. All work tracked in AGENT_TEAM.md.**
