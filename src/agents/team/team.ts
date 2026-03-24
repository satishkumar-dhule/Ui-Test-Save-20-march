import { agentRegistry } from "../core/registry";
import { delegationTracker } from "../tracking/delegation";
import type { AgentRole, Agent } from "../types";

export interface TeamMember {
  id: string;
  name: string;
  role: AgentRole;
  level: "architect" | "manager" | "specialist" | "ground";
  skills: string[];
  canDelegate: boolean;
}

const TEAM_STRUCTURE: Omit<TeamMember, "id">[] = [
  {
    name: "Chief Architect Alice",
    role: "chief_architect",
    level: "architect",
    skills: ["architecture", "strategy", "mentorship"],
    canDelegate: true,
  },
  {
    name: "System Architect Bob",
    role: "system_architect",
    level: "architect",
    skills: ["system_design", "technical_direction"],
    canDelegate: true,
  },
  {
    name: "Tech Lead Carol",
    role: "tech_lead",
    level: "manager",
    skills: ["technical_leadership", "code_review"],
    canDelegate: true,
  },
  {
    name: "Project Manager Dave",
    role: "project_manager",
    level: "manager",
    skills: ["project_management", "resource_allocation"],
    canDelegate: true,
  },
  {
    name: "Team Lead Eve",
    role: "team_lead",
    level: "manager",
    skills: ["team_management", "coordination"],
    canDelegate: true,
  },
  {
    name: "Senior Dev Frank",
    role: "senior_specialist",
    level: "specialist",
    skills: ["expert_dev", "code_review"],
    canDelegate: true,
  },
  {
    name: "Dev Grace",
    role: "specialist",
    level: "specialist",
    skills: ["development", "testing"],
    canDelegate: false,
  },
  {
    name: "Dev Hank",
    role: "specialist",
    level: "specialist",
    skills: ["development", "debugging"],
    canDelegate: false,
  },
  {
    name: "Engineer Ivy",
    role: "ground_engineer",
    level: "ground",
    skills: ["execution", "implementation"],
    canDelegate: false,
  },
  {
    name: "Junior Jack",
    role: "junior_specialist",
    level: "ground",
    skills: ["learning", "execution"],
    canDelegate: false,
  },
];

export class AgentTeam {
  private members: TeamMember[] = [];

  constructor() {
    this.buildTeam();
  }

  private buildTeam(): void {
    const architect1 = agentRegistry.createAgent(
      "chief_architect",
      "Chief Architect Alice",
    );
    const architect2 = agentRegistry.createAgent(
      "system_architect",
      "System Architect Bob",
    );
    const manager1 = agentRegistry.createAgent(
      "tech_lead",
      "Tech Lead Carol",
      architect2.id,
    );
    const manager2 = agentRegistry.createAgent(
      "project_manager",
      "Project Manager Dave",
      architect1.id,
    );
    const manager3 = agentRegistry.createAgent(
      "team_lead",
      "Team Lead Eve",
      manager2.id,
    );
    const specialist1 = agentRegistry.createAgent(
      "senior_specialist",
      "Senior Dev Frank",
      manager1.id,
    );
    const specialist2 = agentRegistry.createAgent(
      "specialist",
      "Dev Grace",
      manager1.id,
    );
    const specialist3 = agentRegistry.createAgent(
      "specialist",
      "Dev Hank",
      manager3.id,
    );
    const ground1 = agentRegistry.createAgent(
      "ground_engineer",
      "Engineer Ivy",
      manager3.id,
    );
    const ground2 = agentRegistry.createAgent(
      "junior_specialist",
      "Junior Jack",
      manager3.id,
    );

    this.members = [
      { ...TEAM_STRUCTURE[0], id: architect1.id },
      { ...TEAM_STRUCTURE[1], id: architect2.id },
      { ...TEAM_STRUCTURE[2], id: manager1.id },
      { ...TEAM_STRUCTURE[3], id: manager2.id },
      { ...TEAM_STRUCTURE[4], id: manager3.id },
      { ...TEAM_STRUCTURE[5], id: specialist1.id },
      { ...TEAM_STRUCTURE[6], id: specialist2.id },
      { ...TEAM_STRUCTURE[7], id: specialist3.id },
      { ...TEAM_STRUCTURE[8], id: ground1.id },
      { ...TEAM_STRUCTURE[9], id: ground2.id },
    ];
  }

  forkTo(subteam: string, memberIndices: number[]): Agent[] {
    const forked: Agent[] = [];
    for (const idx of memberIndices) {
      if (this.members[idx]) {
        const agent = agentRegistry.getAgent(this.members[idx].id);
        if (agent) forked.push(agent);
      }
    }
    console.log(
      `Forked subteam '${subteam}': ${forked.map((a) => a.name).join(", ")}`,
    );
    return forked;
  }

  getMembers(): TeamMember[] {
    return this.members;
  }

  delegateTaskToMember(taskTitle: string, memberName: string): void {
    const member = this.members.find((m) =>
      m.name.toLowerCase().includes(memberName.toLowerCase()),
    );
    if (!member) {
      console.log(`Member ${memberName} not found`);
      return;
    }

    const parent = agentRegistry.getParent(member.id);
    if (!parent) return;

    const task = agentRegistry.createTask(
      taskTitle,
      `Task for ${member.name}`,
      "high",
      parent.id,
    );
    delegationTracker.trackTask(task.id);
    agentRegistry.delegateTask(task.id, parent.id, member.id);
  }

  printHierarchy(): void {
    console.log("\n=== AGENT TEAM HIERARCHY (10 AGENTS) ===\n");
    console.log("LEVEL 1 - ARCHITECTS");
    console.log("-".repeat(40));
    const architects = this.members.filter((m) => m.level === "architect");
    for (const m of architects)
      console.log("  " + m.name + " [" + m.role + "]");

    console.log("\nLEVEL 2 - MANAGERS");
    console.log("-".repeat(40));
    const managers = this.members.filter((m) => m.level === "manager");
    for (const m of managers) console.log("  " + m.name + " [" + m.role + "]");

    console.log("\nLEVEL 3 - SPECIALISTS");
    console.log("-".repeat(40));
    const specialists = this.members.filter(
      (m) => m.level === "specialist" || m.level === "ground",
    );
    for (const m of specialists)
      console.log("  " + m.name + " [" + m.role + "]");
  }
}

export const agentTeam = new AgentTeam();

if (import.meta.main) {
  agentTeam.printHierarchy();

  console.log("\n=== TASK DELEGATION FLOW ===\n");
  agentTeam.delegateTaskToMember("Build authentication", "Jack");
  agentTeam.delegateTaskToMember("Write API", "Hank");
  agentTeam.delegateTaskToMember("Test features", "Grace");

  console.log("\n=== METRICS ===");
  console.log(agentRegistry.getTeamMetrics());
  console.log("\n=== ANALYTICS ===");
  console.log(delegationTracker.getAnalytics());
}
