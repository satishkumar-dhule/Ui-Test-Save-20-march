import { useEffect, useState, useRef, useMemo } from 'react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  useAgentStore,
  formatDuration,
  formatTimestamp,
  getStatusColor,
  type Agent,
  type AgentLog,
  type AgentStatus,
} from '@/stores/agentStore'

function PulsingDot({ status }: { status: AgentStatus }) {
  const isActive = status === 'working'

  return (
    <span className="relative flex h-3 w-3">
      {isActive && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
      )}
      <span
        className={cn(
          'relative inline-flex rounded-full h-3 w-3',
          status === 'idle' && 'bg-muted-foreground/40',
          status === 'working' && 'bg-cyan-400',
          status === 'completed' && 'bg-green-400',
          status === 'failed' && 'bg-red-400'
        )}
      />
    </span>
  )
}

function StatusBadge({ status }: { status: AgentStatus }) {
  const variant =
    status === 'completed' ? 'secondary' : status === 'failed' ? 'destructive' : 'outline'
  const label = status.charAt(0).toUpperCase() + status.slice(1)

  return (
    <Badge variant={variant} className="text-xs">
      {label}
    </Badge>
  )
}

function AgentCard({ agent }: { agent: Agent }) {
  const timeSpent = useAgentStore(s => s.getAgentTimeSpent(agent.id))
  const [displayTime, setDisplayTime] = useState(timeSpent)

  useEffect(() => {
    if (agent.status !== 'working') return
    const interval = setInterval(() => {
      setDisplayTime(useAgentStore.getState().getAgentTimeSpent(agent.id))
    }, 1000)
    return () => clearInterval(interval)
  }, [agent.id, agent.status])

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PulsingDot status={agent.status} />
          <span className="font-medium text-foreground">{agent.name}</span>
        </div>
        <StatusBadge status={agent.status} />
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span>{agent.progress}%</span>
        </div>
        <Progress value={agent.progress} className="h-2" />
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Current Task</span>
          <span className={cn('text-xs', getStatusColor(agent.status))}>
            {displayTime > 0 && formatDuration(displayTime)}
          </span>
        </div>
        <p className="text-sm text-foreground/80 line-clamp-2">{agent.currentTask}</p>
      </div>

      {agent.logs.length > 0 && (
        <div className="pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-1">Recent Activity</p>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {agent.logs.slice(-3).map(log => (
              <div key={log.id} className="flex gap-2 text-xs">
                <span className="text-muted-foreground/60 shrink-0">
                  {formatTimestamp(log.timestamp)}
                </span>
                <span className="text-foreground/70 line-clamp-1">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ActivityLog({ logs }: { logs: AgentLog[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [logs.length, autoScroll])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50
    setAutoScroll(isAtBottom)
  }

  if (logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
        No activity yet
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        {!autoScroll && (
          <button
            onClick={() => {
              setAutoScroll(true)
              containerRef.current?.scrollTo({
                top: containerRef.current.scrollHeight,
                behavior: 'smooth',
              })
            }}
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Jump to latest
          </button>
        )}
      </div>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-64 overflow-y-auto space-y-2 pr-2 scrollbar-thin"
      >
        {[...logs].reverse().map(log => (
          <div key={log.id} className="flex gap-3 text-sm">
            <span className="text-muted-foreground/50 shrink-0 font-mono text-xs">
              {formatTimestamp(log.timestamp)}
            </span>
            <span className="text-cyan-400 shrink-0">{log.agentId}:</span>
            <span
              className={cn(
                'line-clamp-2',
                log.message.startsWith('Error') ? 'text-red-400' : 'text-foreground/80'
              )}
            >
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function OverallProgress({ progress }: { progress: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Overall Swarm Progress</span>
        <span className="text-cyan-400 font-medium">{progress}%</span>
      </div>
      <Progress value={progress} className="h-3" />
    </div>
  )
}

function AgentStats({ agents }: { agents: Agent[] }) {
  const stats = useMemo(() => {
    const total = agents.length
    const completed = agents.filter(a => a.status === 'completed').length
    const working = agents.filter(a => a.status === 'working').length
    const idle = agents.filter(a => a.status === 'idle').length
    const failed = agents.filter(a => a.status === 'failed').length
    return { total, completed, working, idle, failed }
  }, [agents])

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <StatCard label="Total" value={stats.total} color="text-foreground" />
      <StatCard label="Working" value={stats.working} color="text-cyan-400" />
      <StatCard label="Completed" value={stats.completed} color="text-green-400" />
      <StatCard label="Idle" value={stats.idle} color="text-muted-foreground" />
      <StatCard label="Failed" value={stats.failed} color="text-red-400" />
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-3 text-center">
      <div className={cn('text-2xl font-bold', color)}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

export function AgentTracker() {
  const agents = useAgentStore(s => s.agents)
  const logs = useAgentStore(s => s.logs)
  const overallProgress = useAgentStore(s => s.getOverallProgress())

  const agentList = useMemo(() => Object.values(agents), [agents])

  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Agent Swarm Tracker</h1>
            <p className="text-sm text-muted-foreground">Real-time monitoring of agent progress</p>
          </div>
          <div className="text-sm text-muted-foreground font-mono">{time.toLocaleTimeString()}</div>
        </div>

        <OverallProgress progress={overallProgress} />

        <AgentStats agents={agentList} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {agentList.map(agent => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            Live Activity Log
          </h2>
          <ActivityLog logs={logs} />
        </div>
      </div>
    </div>
  )
}

export default AgentTracker
