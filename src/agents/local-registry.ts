import { ELITE_AGENTS, EliteAgentConfig } from "../../agent-team/agents";
import { QA_AGENTS, QAAgent } from "../../agent-team/qa-agents";
import { E2E_TEAM, E2EAgent } from "../../agent-team/e2e-qa-orchestrator";
import {
  ENGINEERING_TEAM,
  Engineer,
} from "../../agent-team/engineering-orchestrator";

export type LocalAgentType = "elite" | "qa" | "e2e" | "engineering";

export interface LocalAgent {
  id: string;
  name: string;
  type: LocalAgentType;
  role: string;
  specialization: string;
  yearsOfExperience: number;
  skills: string[];
  status: "idle" | "working" | "busy";
}

class LocalAgentRegistry {
  private agents: Map<string, LocalAgent> = new Map();
  private typeIndex: Map<LocalAgentType, string[]> = new Map();
  private skillIndex: Map<string, string[]> = new Map();

  constructor() {
    this.initializeAgents();
  }

  private initializeAgents(): void {
    // Add ELITE_AGENTS
    ELITE_AGENTS.forEach((agent) => {
      this.registerAgent({
        id: agent.id,
        name: agent.name,
        type: "elite",
        role: agent.role,
        specialization: agent.specialization,
        yearsOfExperience: agent.yearsOfExperience,
        skills: agent.skills,
        status: agent.status as "idle" | "working" | "busy",
      });
    });

    // Add QA_AGENTS
    QA_AGENTS.forEach((agent) => {
      this.registerAgent({
        id: agent.id,
        name: agent.name,
        type: "qa",
        role: agent.role,
        specialization: agent.specialization,
        yearsOfExperience: agent.yearsOfExperience,
        skills: agent.skills,
        status: agent.status as "idle" | "working" | "busy",
      });
    });

    // Add E2E_TEAM
    E2E_TEAM.forEach((agent) => {
      this.registerAgent({
        id: agent.id,
        name: agent.name,
        type: "e2e",
        role: agent.role,
        specialization: agent.specialization,
        yearsOfExperience: agent.yearsOfExperience,
        skills: this.extractSkills(agent),
        status: agent.status as "idle" | "working" | "busy",
      });
    });

    // Add ENGINEERING_TEAM
    ENGINEERING_TEAM.forEach((agent) => {
      this.registerAgent({
        id: agent.id,
        name: agent.name,
        type: "engineering",
        role: agent.role,
        specialization: agent.specialization,
        yearsOfExperience: agent.yearsOfExperience,
        skills: this.extractEngineerSkills(agent),
        status: agent.status as "idle" | "working" | "busy",
      });
    });
  }

  private extractSkills(agent: E2EAgent): string[] {
    const baseSkills = agent.specialization.split(", ").map((s) => s.trim());
    return [...baseSkills, agent.role, "testing"];
  }

  private extractEngineerSkills(agent: Engineer): string[] {
    const baseSkills = agent.specialization.split(", ").map((s) => s.trim());
    return [...baseSkills, agent.role, "engineering"];
  }

  private registerAgent(agent: LocalAgent): void {
    this.agents.set(agent.id, agent);

    // Index by type
    const typeList = this.typeIndex.get(agent.type) || [];
    typeList.push(agent.id);
    this.typeIndex.set(agent.type, typeList);

    // Index by skills
    agent.skills.forEach((skill) => {
      const skillKey = skill.toLowerCase();
      const skillList = this.skillIndex.get(skillKey) || [];
      if (!skillList.includes(agent.id)) {
        skillList.push(agent.id);
        this.skillIndex.set(skillKey, skillList);
      }
    });
  }

  getAgent(id: string): LocalAgent | undefined {
    return this.agents.get(id);
  }

  getAllAgents(): LocalAgent[] {
    return Array.from(this.agents.values());
  }

  getAgentsByType(type: LocalAgentType): LocalAgent[] {
    const ids = this.typeIndex.get(type) || [];
    return ids.map((id) => this.agents.get(id)).filter(Boolean) as LocalAgent[];
  }

  getAgentsBySkill(skill: string): LocalAgent[] {
    const skillKey = skill.toLowerCase();
    const ids = this.skillIndex.get(skillKey) || [];
    return ids.map((id) => this.agents.get(id)).filter(Boolean) as LocalAgent[];
  }

  getIdleAgents(): LocalAgent[] {
    return this.getAllAgents().filter((a) => a.status === "idle");
  }

  findBestAgent(requiredSkills: string[]): LocalAgent | null {
    const idleAgents = this.getIdleAgents();

    if (idleAgents.length === 0) return null;

    let bestAgent: LocalAgent | null = null;
    let bestScore = -1;

    for (const agent of idleAgents) {
      const score = requiredSkills.reduce((acc, skill) => {
        const skillLower = skill.toLowerCase();
        const agentSkillsLower = agent.skills.map((s) => s.toLowerCase());
        return acc + (agentSkillsLower.includes(skillLower) ? 1 : 0);
      }, 0);

      if (score > bestScore) {
        bestScore = score;
        bestAgent = agent;
      }
    }

    // If no match on skills, return any idle agent
    return bestAgent || (idleAgents.length > 0 ? idleAgents[0] : null);
  }

  findBestAgentByRole(role: string): LocalAgent | null {
    const roleLower = role.toLowerCase();
    const idleAgents = this.getIdleAgents();

    for (const agent of idleAgents) {
      if (agent.role.toLowerCase().includes(roleLower)) {
        return agent;
      }
    }

    return idleAgents.length > 0 ? idleAgents[0] : null;
  }

  findBestAgentByType(type: LocalAgentType): LocalAgent | null {
    const agents = this.getAgentsByType(type).filter(
      (a) => a.status === "idle",
    );
    return agents.length > 0 ? agents[0] : null;
  }

  getStats(): {
    total: number;
    idle: number;
    working: number;
    byType: Record<LocalAgentType, number>;
  } {
    const all = this.getAllAgents();
    return {
      total: all.length,
      idle: all.filter((a) => a.status === "idle").length,
      working: all.filter((a) => a.status === "working").length,
      byType: {
        elite: this.getAgentsByType("elite").length,
        qa: this.getAgentsByType("qa").length,
        e2e: this.getAgentsByType("e2e").length,
        engineering: this.getAgentsByType("engineering").length,
      },
    };
  }

  updateAgentStatus(id: string, status: "idle" | "working" | "busy"): boolean {
    const agent = this.agents.get(id);
    if (agent) {
      agent.status = status;
      return true;
    }
    return false;
  }
}

export const localAgentRegistry = new LocalAgentRegistry();

// Helper function to find best local agent based on task type
export function findBestLocalAgent(taskType: string): LocalAgent | null {
  const skillMap: Record<string, string[]> = {
    "e2e-test": ["playwright", "cypress", "e2e", "testing"],
    qa: ["testing", "qa", "quality"],
    frontend: ["react", "typescript", "frontend", "ui"],
    backend: ["node", "api", "backend", "database"],
    fullstack: ["react", "node", "fullstack", "full-stack"],
    performance: ["performance", "lighthouse", "optimization"],
    security: ["security", "owasp", "penetration"],
    devops: ["devops", "docker", "kubernetes", "ci-cd"],
  };

  const requiredSkills = skillMap[taskType] || [taskType];
  return localAgentRegistry.findBestAgent(requiredSkills);
}

// Export all local agents for reference
export function getAllLocalAgents(): LocalAgent[] {
  return localAgentRegistry.getAllAgents();
}
