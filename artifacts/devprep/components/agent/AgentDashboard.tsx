'use client'

import { useState, useEffect, useCallback } from 'react'

interface Agent {
  id: string
  name: string
  role: string
  status: string
  specialization: string
  yearsOfExperience: number
}

interface Task {
  id: string
  title: string
  assignedAgent: string
  status: string
  priority: string
}

interface Content {
  id: string
  content: string
  chunks: string[]
  isComplete: boolean
  agentId: string
}

export function AgentDashboard() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [contents, setContents] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high' | 'critical'>(
    'medium'
  )
  const [selectedContent, setSelectedContent] = useState<Content | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [agentsRes, tasksRes, contentRes] = await Promise.all([
        fetch('/api/agent/team'),
        fetch('/api/agent/tasks'),
        fetch('/api/agent/content'),
      ])

      const [agentsData, tasksData, contentData] = await Promise.all([
        agentsRes.json(),
        tasksRes.json(),
        contentRes.json(),
      ])

      setAgents(agentsData)
      setTasks(tasksData)
      setContents(contentData)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch data:', error)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 1000)
    return () => clearInterval(interval)
  }, [fetchData])

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle || !newTaskDescription) return

    try {
      await fetch('/api/agent/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDescription,
          priority: newTaskPriority,
        }),
      })
      setNewTaskTitle('')
      setNewTaskDescription('')
      fetchData()
    } catch (error) {
      console.error('Failed to submit task:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    )
  }

  const activeTasks = tasks.filter(t => t.status === 'in-progress')
  const completedTasks = tasks.filter(t => t.status === 'completed')

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Elite Agent Team Dashboard</h1>
          <p className="text-gray-600 mt-2">
            {agents.length} agents with {agents.reduce((sum, a) => sum + a.yearsOfExperience, 0)}+
            years of combined experience
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Team Status</h2>
            <div className="space-y-3">
              {agents.map(agent => (
                <div key={agent.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{agent.name}</p>
                    <p className="text-sm text-gray-500">{agent.specialization}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      agent.status === 'idle'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {agent.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Active Tasks ({activeTasks.length})</h2>
            <div className="space-y-3">
              {activeTasks.length === 0 ? (
                <p className="text-gray-500">No active tasks</p>
              ) : (
                activeTasks.map(task => (
                  <div key={task.id} className="border-l-4 border-blue-500 pl-3">
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-gray-500">
                      Assigned:{' '}
                      {agents.find(a => a.id === task.assignedAgent)?.name || 'Unassigned'}
                    </p>
                    <div className="flex items-center mt-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: '60%' }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Completed ({completedTasks.length})</h2>
            <div className="space-y-2">
              {completedTasks.length === 0 ? (
                <p className="text-gray-500">No completed tasks</p>
              ) : (
                completedTasks
                  .slice(-5)
                  .reverse()
                  .map(task => (
                    <div key={task.id} className="flex items-center text-sm">
                      <span className="text-green-500 mr-2">✓</span>
                      <span className="text-gray-700">{task.title}</span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Create New Task</h2>
            <form onSubmit={handleSubmitTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Build user authentication component"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newTaskDescription}
                  onChange={e => setNewTaskDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Create a React component for user login with email and password fields..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={newTaskPriority}
                  onChange={e =>
                    setNewTaskPriority(e.target.value as 'low' | 'medium' | 'high' | 'critical')
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Assign to Agent Team
              </button>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Live Generated Content</h2>
            <div className="space-y-3">
              {contents.length === 0 ? (
                <p className="text-gray-500">No content generated yet</p>
              ) : (
                contents.map(content => (
                  <div
                    key={content.id}
                    className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setSelectedContent(content)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm text-gray-600">{content.id}</span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          content.isComplete
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {content.isComplete ? 'Complete' : 'Streaming...'}
                      </span>
                    </div>
                    <div className="font-mono text-sm bg-gray-100 p-2 rounded max-h-20 overflow-hidden">
                      {content.content || 'Generating...'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {selectedContent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Content Preview</h3>
                  <button
                    onClick={() => setSelectedContent(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Content ID</p>
                    <p className="font-mono">{selectedContent.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Chunks Generated</p>
                    <p>{selectedContent.chunks.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Full Content</p>
                    <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm whitespace-pre-wrap">
                      {selectedContent.content}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
