import { create } from 'zustand'
import { cn } from '@/lib/utils'

export type AgentStatus = 'idle' | 'working' | 'completed' | 'failed'

export interface AgentLog {
  id: string
  agentId: string
  message: string
  timestamp: number
}

export interface Agent {
  id: string
  name: string
  status: AgentStatus
  progress: number
  currentTask: string
  logs: AgentLog[]
  startTime: number | null
  endTime: number | null
}

interface AgentStore {
  agents: Record<string, Agent>
  logs: AgentLog[]
  addAgent: (agent: Omit<Agent, 'logs' | 'startTime' | 'endTime'>) => void
  updateAgent: (id: string, updates: Partial<Agent>) => void
  completeAgent: (id: string, finalLog?: string) => void
  failAgent: (id: string, error: string) => void
  addLog: (agentId: string, message: string) => void
  getAgentTimeSpent: (id: string) => number
  getOverallProgress: () => number
  reset: () => void
}

const initialAgents: Record<string, Agent> = {
  frontend: {
    id: 'frontend',
    name: 'Frontend Agent',
    status: 'working',
    progress: 65,
    currentTask: 'Integrating database content into UI',
    logs: [],
    startTime: Date.now() - 45000,
    endTime: null,
  },
  database: {
    id: 'database',
    name: 'Database Agent',
    status: 'completed',
    progress: 100,
    currentTask: 'Verifying database serving',
    logs: [],
    startTime: Date.now() - 120000,
    endTime: Date.now() - 30000,
  },
  tracker: {
    id: 'tracker',
    name: 'Tracker Agent',
    status: 'working',
    progress: 40,
    currentTask: 'Creating agent tracking system',
    logs: [],
    startTime: Date.now() - 20000,
    endTime: null,
  },
  qa: {
    id: 'qa',
    name: 'QA Agent',
    status: 'idle',
    progress: 0,
    currentTask: 'Pending - waiting for other agents',
    logs: [],
    startTime: null,
    endTime: null,
  },
}

const generateLogId = () => `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

export const useAgentStore = create<AgentStore>((set, get) => ({
  agents: initialAgents,
  logs: [],

  addAgent: agentData => {
    const id = agentData.id || `agent-${Date.now()}`
    const agent: Agent = {
      ...agentData,
      id,
      logs: [],
      startTime: Date.now(),
      endTime: null,
    }
    set(state => ({
      agents: { ...state.agents, [id]: agent },
    }))
  },

  updateAgent: (id, updates) => {
    set(state => {
      const agent = state.agents[id]
      if (!agent) return state
      return {
        agents: {
          ...state.agents,
          [id]: { ...agent, ...updates },
        },
      }
    })
  },

  completeAgent: (id, finalLog) => {
    const log: AgentLog = {
      id: generateLogId(),
      agentId: id,
      message: finalLog || 'Task completed successfully',
      timestamp: Date.now(),
    }
    set(state => {
      const agent = state.agents[id]
      if (!agent) return state
      return {
        agents: {
          ...state.agents,
          [id]: {
            ...agent,
            status: 'completed',
            progress: 100,
            endTime: Date.now(),
            logs: [...agent.logs, log],
          },
        },
        logs: [...state.logs, log],
      }
    })
  },

  failAgent: (id, error) => {
    const log: AgentLog = {
      id: generateLogId(),
      agentId: id,
      message: `Error: ${error}`,
      timestamp: Date.now(),
    }
    set(state => {
      const agent = state.agents[id]
      if (!agent) return state
      return {
        agents: {
          ...state.agents,
          [id]: {
            ...agent,
            status: 'failed',
            endTime: Date.now(),
            logs: [...agent.logs, log],
          },
        },
        logs: [...state.logs, log],
      }
    })
  },

  addLog: (agentId, message) => {
    const log: AgentLog = {
      id: generateLogId(),
      agentId,
      message,
      timestamp: Date.now(),
    }
    set(state => {
      const agent = state.agents[agentId]
      if (!agent) return state
      return {
        agents: {
          ...state.agents,
          [agentId]: {
            ...agent,
            logs: [...agent.logs, log],
          },
        },
        logs: [...state.logs, log],
      }
    })
  },

  getAgentTimeSpent: id => {
    const agent = get().agents[id]
    if (!agent || !agent.startTime) return 0
    const endTime = agent.endTime || Date.now()
    return endTime - agent.startTime
  },

  getOverallProgress: () => {
    const { agents } = get()
    const agentList = Object.values(agents)
    if (agentList.length === 0) return 0
    const totalProgress = agentList.reduce((sum, agent) => sum + agent.progress, 0)
    return Math.round(totalProgress / agentList.length)
  },

  reset: () => {
    set({ agents: initialAgents, logs: [] })
  },
}))

export function formatDuration(ms: number): string {
  if (ms < 1000) return '0s'
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  }
  return `${seconds}s`
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

export function getStatusColor(status: AgentStatus): string {
  switch (status) {
    case 'idle':
      return 'text-muted-foreground'
    case 'working':
      return 'text-cyan-400'
    case 'completed':
      return 'text-green-400'
    case 'failed':
      return 'text-red-400'
    default:
      return 'text-muted-foreground'
  }
}

export function getStatusBgColor(status: AgentStatus): string {
  switch (status) {
    case 'idle':
      return 'bg-muted'
    case 'working':
      return 'bg-cyan-500/20'
    case 'completed':
      return 'bg-green-500/20'
    case 'failed':
      return 'bg-red-500/20'
    default:
      return 'bg-muted'
  }
}
