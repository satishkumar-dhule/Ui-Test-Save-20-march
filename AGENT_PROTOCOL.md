# OpenCode Agent Protocol

## Overview

This protocol defines the hierarchical agent team structure, delegation rules, and tracking mechanisms for all agents in this project.

---

## Agent Hierarchy (3 Levels)

### Level 1: Architects (Strategic)

| Role             | Can Delegate | Can Approve | Max Depth | Skills                             |
| ---------------- | ------------ | ----------- | --------- | ---------------------------------- |
| Chief Architect  | Yes          | Yes         | 10        | architecture, strategy, mentorship |
| System Architect | Yes          | Yes         | 8         | system_design, technical_direction |

### Level 2: Managers (Tactical)

| Role            | Can Delegate | Can Approve | Max Depth | Skills                                  |
| --------------- | ------------ | ----------- | --------- | --------------------------------------- |
| Tech Lead       | Yes          | Yes         | 6         | technical_leadership, code_review       |
| Project Manager | Yes          | Yes         | 5         | project_management, resource_allocation |
| Team Lead       | Yes          | Yes         | 4         | team_management, coordination           |

### Level 3: Specialists (Ground/Execution)

| Role              | Can Delegate | Can Approve | Max Depth | Skills                    |
| ----------------- | ------------ | ----------- | --------- | ------------------------- |
| Senior Specialist | Yes          | No          | 2         | expert_skills, mentoring  |
| Specialist        | No           | No          | 0         | development, testing      |
| Ground Engineer   | No           | No          | 0         | execution, implementation |
| Junior Specialist | No           | No          | 0         | learning, execution       |

---

## Starting New Tasks

### Method 1: Quick Delegate (Recommended for simple tasks)

```typescript
import { agentTeam } from "./src/agents";

// Delegate to specific agent by name
agentTeam.delegateTaskToMember("Build login feature", "Jack");
agentTeam.delegateTaskToMember("Fix bug #123", "Grace");
agentTeam.delegateTaskToMember("Write tests", "Hank");
```

### Method 2: Orchestrated Task (Recommended for complex tasks)

```typescript
import { taskOrchestrator, agentRegistry } from "./src/agents";

// Get an architect to start the task
const architects = agentRegistry.getAgentsByLevel("architect");
const architect = architects[0];

// Create and delegate with automatic hierarchy flow
const task = taskOrchestrator.createAndOrchestrateTask(
  "Build user authentication",
  "Implement JWT-based auth with refresh tokens",
  "high", // priority: critical | high | medium | low
  architect.id, // creator
  "ground", // target level: architect | manager | specialist | ground
);
```

### Method 3: Manual Task Creation (Full control)

```typescript
import { agentRegistry, delegationTracker } from "./src/agents";

// Step 1: Create task
const task = agentRegistry.createTask(
  "Implement API endpoint",
  "Create GET /api/users endpoint",
  "high", // priority
  creatorAgentId, // who creates
);

// Step 2: Track it
delegationTracker.trackTask(task.id);

// Step 3: Add checkpoints
delegationTracker.addCheckpoint(
  task.id,
  "Created",
  creatorAgentId,
  creatorAgentId,
);
delegationTracker.addCheckpoint(
  task.id,
  "Assigned",
  creatorAgentId,
  executorAgentId,
);

// Step 4: Delegate down hierarchy
agentRegistry.delegateTask(
  task.id,
  fromAgentId,
  toAgentId,
  "For implementation",
);

// Step 5: Update status
agentRegistry.updateTaskStatus(task.id, executorAgentId, "in_progress");

// Step 6: Complete when done
agentRegistry.updateTaskStatus(task.id, executorAgentId, "completed");
delegationTracker.completeTask(task.id);
```

### Method 4: Batch Task Creation

```typescript
import { taskOrchestrator, agentRegistry } from "./src/agents";

const architects = agentRegistry.getAgentsByLevel("architect");
const creator = architects[0];

// Create multiple tasks at once
const tasks = taskOrchestrator.executeTaskPipeline(
  [
    { title: "Task 1", description: "Desc 1", priority: "critical" },
    { title: "Task 2", description: "Desc 2", priority: "high" },
    { title: "Task 3", description: "Desc 3", priority: "medium" },
  ],
  creator.id,
);
```

---

## Executing Tasks

After delegation, tasks must be executed by the assigned agent:

```typescript
import { taskExecutor } from "./src/agents";

// Execute a single task
const result = await taskExecutor.executeTask(task.id);
console.log(result.success); // true/false
console.log(result.output); // execution output
console.log(result.error); // error message if failed
```

The executor will:

1. Update task status to `in_progress`
2. Add checkpoints for each step
3. Complete or fail the task
4. Return the execution result

---

## Delegation Rules

1. **Top-Down Only**: Tasks flow from higher to lower levels only
2. **Max Depth**: Each role has a maximum delegation depth
3. **No Peer Delegation**: Cannot delegate to same or higher level
4. **Track All Delegations**: Every delegation must be recorded

### Delegation Chain Example

```
Chief Architect → Tech Lead → Senior Dev → Dev → Junior
(Depth: 1)      (Depth: 2)  (Depth: 3)   (Depth: 4)
```

---

## Task Lifecycle

```
[Created] → [Delegated] → [In Progress] → [Completed]
     ↓            ↓              ↓              ↓
  assigned     tracked       checkpoint     metrics
```

### Task States

- `pending` - Created but not assigned
- `delegated` - Assigned to agent
- `in_progress` - Agent actively working
- `completed` - Task finished
- `failed` - Task failed
- `cancelled` - Task cancelled

### Task Priority

- `critical` - Immediate attention
- `high` - Important, soon
- `medium` - Normal priority
- `low` - When available

---

## Getting Task Status

```typescript
import { agentRegistry, delegationTracker } from "./src/agents";

// Get task by ID
const task = agentRegistry.getTask(taskId);

// Get delegation history
const history = agentRegistry.getDelegationHistory(taskId);

// Get all updates
const updates = agentRegistry.getTaskHistory(taskId);

// Get tracker with progress
const tracker = delegationTracker.getTracker(taskId);
console.log(`Progress: ${tracker.progress}%`);
console.log(`Checkpoints: ${tracker.checkpoints}`);

// Generate full report
const report = delegationTracker.generateReport(taskId);
```

---

## Monitoring & Metrics

```typescript
import { agentRegistry, delegationTracker, teamManager } from "./src/agents";

// Team status
const status = teamManager.getTeamStatus();
console.log(status.architects);
console.log(status.managers);
console.log(status.specialists);

// Workload distribution
const workload = teamManager.getWorkloadDistribution();
// { "Alice": 3, "Bob": 2, "Carol": 5, ... }

// Analytics
const analytics = delegationTracker.getAnalytics();
// { totalTracked: 10, completed: 5, inProgress: 5, ... }

// Full dashboard
const dashboard = taskOrchestrator.getDashboard();
```

---

## File Structure

```
src/agents/
├── types/           # Type definitions
├── core/            # AgentRegistry
├── tracking/        # DelegationTracker
└── team/            # AgentTeam, TaskOrchestrator
```

---

## Quick Start Commands

```bash
# Run demo
bun run agents

# Available agents in code
import { agentTeam } from './src/agents';
agentTeam.printHierarchy();  // Show all 10 agents
```

---

## Best Practices

1. **Always use tracking** - Call `trackTask()` for all tasks
2. **Add checkpoints** - Use `addCheckpoint()` for milestones
3. **Check metrics** - Monitor team performance via `getTeamMetrics()`
4. **Respect hierarchy** - Never skip levels when delegating
5. **Document delegations** - Include reason when delegating
