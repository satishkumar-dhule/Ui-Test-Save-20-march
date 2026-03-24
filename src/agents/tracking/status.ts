import { agentRegistry } from "../core/registry";
import { delegationTracker } from "./delegation";
import type { Agent, Task, TaskStatus } from "../types";

export interface AgentStatus {
  agent: Agent;
  status: "idle" | "busy" | "offline";
  currentTasks: Task[];
  completedToday: number;
  efficiency: number;
}

export interface TeamHealth {
  overall: "healthy" | "warning" | "critical";
  activeAgents: number;
  idleAgents: number;
  overloadedAgents: number;
  avgWorkload: number;
  completionRate: number;
}

export interface TaskBoard {
  todo: Task[];
  inProgress: Task[];
  done: Task[];
}

export class StatusTracker {
  getAgentStatus(agentId: string): AgentStatus | null {
    const agent = agentRegistry.getAgent(agentId);
    if (!agent) return null;

    const currentTasks = agentRegistry.getTasksByAgent(agentId);
    const isBusy =
      currentTasks.length > 0 &&
      currentTasks.some((t) => t.status === "in_progress");

    const completedToday = agent.completedTasks.length;
    const efficiency =
      agent.activeTasks.length > 0
        ? (completedToday / (completedToday + agent.activeTasks.length)) * 100
        : 100;

    return {
      agent,
      status: isBusy ? "busy" : "idle",
      currentTasks,
      completedToday,
      efficiency,
    };
  }

  getAllAgentStatuses(): AgentStatus[] {
    return agentRegistry
      .getAllAgents()
      .map((agent) => {
        const status = this.getAgentStatus(agent.id);
        return status!;
      })
      .filter(Boolean);
  }

  getTeamHealth(): TeamHealth {
    const statuses = this.getAllAgentStatuses();
    const activeAgents = statuses.filter((s) => s.status === "busy").length;
    const idleAgents = statuses.filter((s) => s.status === "idle").length;
    const overloadedAgents = statuses.filter(
      (s) => s.agent.activeTasks.length > 5,
    ).length;

    const totalWorkload = statuses.reduce(
      (sum, s) => sum + s.agent.activeTasks.length,
      0,
    );
    const avgWorkload = totalWorkload / statuses.length;

    const metrics = agentRegistry.getTeamMetrics();
    const completionRate =
      metrics.totalTasks > 0
        ? (metrics.completedTasks / metrics.totalTasks) * 100
        : 0;

    let overall: TeamHealth["overall"] = "healthy";
    if (overloadedAgents > 2 || completionRate < 50) overall = "critical";
    else if (overloadedAgents > 0 || completionRate < 80) overall = "warning";

    return {
      overall,
      activeAgents,
      idleAgents,
      overloadedAgents,
      avgWorkload: Math.round(avgWorkload * 10) / 10,
      completionRate: Math.round(completionRate),
    };
  }

  getTaskBoard(): TaskBoard {
    const allTasks = Array.from({ length: 100 }, (_, i) =>
      agentRegistry.getTask(`task-${i}`),
    ).filter(Boolean) as Task[];

    return {
      todo: allTasks.filter((t) => t.status === "pending"),
      inProgress: allTasks.filter(
        (t) => t.status === "in_progress" || t.status === "delegated",
      ),
      done: allTasks.filter((t) => t.status === "completed"),
    };
  }

  getWorkloadReport(): Record<
    string,
    {
      active: number;
      completed: number;
      total: number;
      status: string;
    }
  > {
    const report: Record<string, any> = {};

    for (const agent of agentRegistry.getAllAgents()) {
      const active = agent.activeTasks.length;
      const completed = agent.completedTasks.length;

      let status = "balanced";
      if (active > 5) status = "overloaded";
      else if (active === 0 && completed > 0) status = "idle";
      else if (active > 3) status = "busy";

      report[agent.name] = {
        active,
        completed,
        total: active + completed,
        status,
      };
    }

    return report;
  }

  getStatusDashboard(): {
    timestamp: Date;
    teamHealth: TeamHealth;
    agentStatuses: AgentStatus[];
    workloadReport: ReturnType<StatusTracker["getWorkloadReport"]>;
    recentActivity: { agent: string; action: string; time: Date }[];
    recommendations: string[];
  } {
    const teamHealth = this.getTeamHealth();
    const workloadReport = this.getWorkloadReport();
    const recommendations: string[] = [];

    if (teamHealth.overloadedAgents > 0) {
      recommendations.push(
        `${teamHealth.overloadedAgents} agents are overloaded - consider redistributing tasks`,
      );
    }

    if (teamHealth.idleAgents > 2) {
      recommendations.push(
        `${teamHealth.idleAgents} agents are idle - assign pending tasks`,
      );
    }

    if (teamHealth.completionRate < 80) {
      recommendations.push(
        `Completion rate is ${teamHealth.completionRate}% - review failed/blocked tasks`,
      );
    }

    const recentActivity = delegationTracker.getAnalytics();

    return {
      timestamp: new Date(),
      teamHealth,
      agentStatuses: this.getAllAgentStatuses(),
      workloadReport,
      recentActivity: [],
      recommendations,
    };
  }

  printStatusDashboard(): void {
    const dashboard = this.getStatusDashboard();

    console.log("\n" + "=".repeat(60));
    console.log("TEAM STATUS DASHBOARD");
    console.log("=".repeat(60));
    console.log("Timestamp:", dashboard.timestamp.toISOString());

    console.log("\n[TEAM HEALTH]");
    console.log(
      "  Overall:",
      "🟢 ".repeat(1) + dashboard.teamHealth.overall.toUpperCase(),
    );
    console.log("  Active Agents:", dashboard.teamHealth.activeAgents);
    console.log("  Idle Agents:", dashboard.teamHealth.idleAgents);
    console.log("  Overloaded:", dashboard.teamHealth.overloadedAgents);
    console.log(
      "  Avg Workload:",
      dashboard.teamHealth.avgWorkload + " tasks/agent",
    );
    console.log(
      "  Completion Rate:",
      dashboard.teamHealth.completionRate + "%",
    );

    console.log("\n[WORKLOAD DISTRIBUTION]");
    for (const [name, data] of Object.entries(dashboard.workloadReport)) {
      const bar =
        "█".repeat(data.active) + "░".repeat(Math.max(0, 5 - data.active));
      const statusIcon =
        data.status === "overloaded"
          ? "🔴"
          : data.status === "busy"
            ? "🟡"
            : "🟢";
      console.log(
        `  ${statusIcon} ${name.padEnd(20)} ${bar} (${data.active} active, ${data.completed} done)`,
      );
    }

    if (dashboard.recommendations.length > 0) {
      console.log("\n[RECOMMENDATIONS]");
      for (const rec of dashboard.recommendations) {
        console.log("  ⚠️ ", rec);
      }
    }
  }
}

export const statusTracker = new StatusTracker();
