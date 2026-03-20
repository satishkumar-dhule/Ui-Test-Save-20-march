import { Router, type IRouter, type Request, type Response } from "express";

interface AgentInfo {
  id: string;
  name: string;
  role: string;
  status: string;
  specialization: string;
  yearsOfExperience: number;
}

interface TaskInfo {
  id: string;
  title: string;
  assignedAgent: string;
  status: string;
  priority: string;
}

const agents: AgentInfo[] = [
  {
    id: "agent-001",
    name: "Marcus Chen",
    role: "architect",
    status: "idle",
    specialization: "System Architecture & Design Patterns",
    yearsOfExperience: 8,
  },
  {
    id: "agent-002",
    name: "Sarah Williams",
    role: "frontend-lead",
    status: "idle",
    specialization: "React & Modern JavaScript",
    yearsOfExperience: 7,
  },
  {
    id: "agent-003",
    name: "David Kim",
    role: "ui-engineer",
    status: "idle",
    specialization: "UI/UX Implementation & Animations",
    yearsOfExperience: 6,
  },
  {
    id: "agent-004",
    name: "Emily Rodriguez",
    role: "fullstack",
    status: "idle",
    specialization: "Full-Stack SaaS Development",
    yearsOfExperience: 9,
  },
  {
    id: "agent-005",
    name: "James Thompson",
    role: "performance",
    status: "idle",
    specialization: "Performance & Optimization",
    yearsOfExperience: 7,
  },
  {
    id: "agent-006",
    name: "Lisa Park",
    role: "saas-specialist",
    status: "idle",
    specialization: "SaaS Architecture & Billing",
    yearsOfExperience: 8,
  },
  {
    id: "agent-007",
    name: "Michael Brown",
    role: "devops",
    status: "idle",
    specialization: "DevOps & Infrastructure",
    yearsOfExperience: 10,
  },
  {
    id: "agent-008",
    name: "Amanda Foster",
    role: "testing",
    status: "idle",
    specialization: "Quality Assurance & Testing",
    yearsOfExperience: 6,
  },
  {
    id: "agent-009",
    name: "Robert Martinez",
    role: "backend",
    status: "idle",
    specialization: "API Design & Database",
    yearsOfExperience: 9,
  },
  {
    id: "agent-010",
    name: "Jennifer Lee",
    role: "security",
    status: "idle",
    specialization: "Application Security",
    yearsOfExperience: 8,
  },
  {
    id: "agent-011",
    name: "Chris Anderson",
    role: "frontend-dev",
    status: "idle",
    specialization: "Component Library Development",
    yearsOfExperience: 5,
  },
  {
    id: "agent-012",
    name: "Nicole Taylor",
    role: "integration",
    status: "idle",
    specialization: "Third-Party Integrations",
    yearsOfExperience: 6,
  },
];

const tasks: TaskInfo[] = [];
const contentStore: Map<
  string,
  {
    id: string;
    content: string;
    chunks: string[];
    isComplete: boolean;
    agentId: string;
  }
> = new Map();
let taskIdCounter = 1;

const router: IRouter = Router();

router.get("/team", async (_req: Request, res: Response) => {
  res.json(agents);
});

router.get("/tasks", async (_req: Request, res: Response) => {
  res.json(tasks);
});

router.get("/content/:id", async (req: Request, res: Response) => {
  const id = req.params.id;
  const content = contentStore.get(typeof id === "string" ? id : id[0]);
  if (!content) {
    res.status(404).json({ error: "Content not found" });
    return;
  }
  res.json(content);
});

router.get("/content", async (_req: Request, res: Response) => {
  res.json(Array.from(contentStore.values()));
});

router.post("/execute", async (req: Request, res: Response) => {
  try {
    const { title, description, priority, capabilities } = req.body;

    if (!title || !description) {
      res.status(400).json({ error: "Title and description are required" });
      return;
    }

    const taskId = `task-${taskIdCounter++}`;
    const contentId = `${taskId}-content`;
    const assignedAgent = agents.find((a) => a.status === "idle") || agents[0];

    if (assignedAgent) {
      assignedAgent.status = "working";
    }

    const task: TaskInfo = {
      id: taskId,
      title,
      assignedAgent: assignedAgent?.id || "unassigned",
      status: "in-progress",
      priority: priority || "medium",
    };
    tasks.push(task);

    const content = {
      id: contentId,
      content: "",
      chunks: [] as string[],
      isComplete: false,
      agentId: assignedAgent?.id || "unassigned",
    };
    contentStore.set(contentId, content);

    setTimeout(() => {
      const chunks = description.split(/\s+/).slice(0, 10);
      let index = 0;

      const interval = setInterval(() => {
        if (index < chunks.length) {
          const chunk = chunks[index] + " ";
          content.chunks.push(chunk);
          content.content += chunk;
          index++;
        } else {
          clearInterval(interval);
          content.isComplete = true;
          if (assignedAgent) {
            assignedAgent.status = "idle";
          }
          task.status = "completed";
        }
      }, 200);
    }, 100);

    res.json({
      taskId,
      success: true,
      contentId,
      agentId: assignedAgent?.id,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to execute task" });
  }
});

router.get("/agent/:id", async (req: Request, res: Response) => {
  const agent = agents.find((a) => a.id === req.params.id);
  if (!agent) {
    res.status(404).json({ error: "Agent not found" });
    return;
  }
  res.json(agent);
});

router.get("/task/:id", async (req: Request, res: Response) => {
  const task = tasks.find((t) => t.id === req.params.id);
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.json(task);
});

export default router;
