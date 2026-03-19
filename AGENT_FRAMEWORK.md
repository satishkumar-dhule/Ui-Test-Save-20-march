# OpenCode Agent Framework

> **Version:** 1.0.0
> **Last Updated:** 2026-03-19
> **Purpose:** Standardized agent workflow for all development tasks

---

## Core Principle

**ALL agents MUST:**

1. Read this framework before starting any task
2. Spawn from agent team defined in `AGENT_TEAM.md`
3. Track all work in `AGENT_TEAM.md`
4. Create checkpoints for every logical milestone
5. Check for outstanding tasks before starting new work

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
- [ ] TypeScript compiles (pnpm run typecheck)
- [ ] Tests pass (pnpm run test)
- [ ] Checkpoint logged in AGENT_TEAM.md
- [ ] Agent progress updated
- [ ] Agent status set appropriately

---

## Framework Enforcement

### Agent Checklist (Must Complete)

- [ ] Read AGENT_TEAM.md before starting
- [ ] Update AGENT_TEAM.md with task assignment
- [ ] Create START checkpoint
- [ ] Execute task
- [ ] Create checkpoints at milestones
- [ ] Update progress in AGENT_TEAM.md
- [ ] Create COMPLETE checkpoint
- [ ] Set final status

### Violations

Any agent not following this framework:

1. Will be flagged in next checkpoint
2. Must fix violations before new tasks
3. Supervisor (INNOVATION_LEAD) will audit

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

| Version | Date       | Changes           |
| ------- | ---------- | ----------------- |
| 1.0.0   | 2026-03-19 | Initial framework |

---

**All agents MUST abide by this framework. All work tracked in AGENT_TEAM.md.**
