export { agentRegistry, AgentRegistry } from "./core/registry";
export { delegationTracker, DelegationTracker } from "./tracking/delegation";
export { taskExecutor, TaskExecutor } from "./tracking/executor";
export { statusTracker, StatusTracker } from "./tracking/status";
export {
  teamManager,
  taskOrchestrator,
  AgentTeamManager,
  TaskOrchestrator,
} from "./team/manager";
export { agentTeam, AgentTeam } from "./team/team";
export {
  localAgentRegistry,
  findBestLocalAgent,
  getAllLocalAgents,
} from "./local-registry";
export type { LocalAgent, LocalAgentType } from "./local-registry";
export type { TaskTracker, TaskCheckpoint } from "./tracking/delegation";
export type { TaskAssignment, TeamConfig } from "./team/manager";
export type { TeamMember } from "./team/team";
export type {
  Agent,
  AgentLevel,
  AgentRole,
  AgentCapabilities,
  Task,
  TaskStatus,
  TaskPriority,
  DelegationEvent,
  TaskUpdate,
  TeamMetrics,
} from "./types";
