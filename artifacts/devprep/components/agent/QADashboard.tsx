'use client'

import { useState, useEffect, useCallback } from 'react'

interface QAAgent {
  id: string
  name: string
  role: string
  status: string
  specialization: string
  yearsOfExperience: number
}

interface ValidationResult {
  id: string
  taskId: string
  agentId: string
  score: number
  passed: boolean
  issues: ValidationIssue[]
}

interface ValidationIssue {
  severity: string
  title: string
  description: string
  autoFixable: boolean
}

export function QADashboard() {
  const [qaAgents, setQaAgents] = useState<QAAgent[]>([])
  const [validations, setValidations] = useState<ValidationResult[]>([])
  const [loading, setLoading] = useState(true)
  const [runningValidation, setRunningValidation] = useState(false)
  const [selectedValidation, setSelectedValidation] = useState<ValidationResult | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [agentsRes, validationsRes] = await Promise.all([
        fetch('/api/qa/team'),
        fetch('/api/qa/validations'),
      ])

      const [agentsData, validationsData] = await Promise.all([
        agentsRes.json(),
        validationsRes.json(),
      ])

      setQaAgents(agentsData)
      setValidations(validationsData)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch QA data:', error)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 3000)
    return () => clearInterval(interval)
  }, [fetchData])

  const handleRunAllValidations = async () => {
    setRunningValidation(true)
    try {
      await fetch('/api/qa/validate-all', { method: 'POST' })
      fetchData()
    } catch (error) {
      console.error('Validation failed:', error)
    } finally {
      setRunningValidation(false)
    }
  }

  const handleValidateTask = async (taskId: string) => {
    setRunningValidation(true)
    try {
      await fetch(`/api/qa/validate/${taskId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'code-review' }),
      })
      fetchData()
    } catch (error) {
      console.error('Validation failed:', error)
    } finally {
      setRunningValidation(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
      </div>
    )
  }

  const totalIssues = validations.reduce((sum, v) => sum + v.issues.length, 0)
  const passedCount = validations.filter(v => v.passed).length
  const failedCount = validations.length - passedCount
  const avgScore =
    validations.length > 0
      ? Math.round(validations.reduce((sum, v) => sum + v.score, 0) / validations.length)
      : 0

  const criticalCount = validations.reduce(
    (sum, v) => sum + v.issues.filter(i => i.severity === 'critical').length,
    0
  )
  const highCount = validations.reduce(
    (sum, v) => sum + v.issues.filter(i => i.severity === 'high').length,
    0
  )
  const mediumCount = validations.reduce(
    (sum, v) => sum + v.issues.filter(i => i.severity === 'medium').length,
    0
  )
  const lowCount = validations.reduce(
    (sum, v) => sum + v.issues.filter(i => i.severity === 'low').length,
    0
  )

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">QA Validation Dashboard</h1>
          <p className="text-gray-600 mt-2">
            {qaAgents.length} QA agents with{' '}
            {qaAgents.reduce((sum, a) => sum + a.yearsOfExperience, 0)}+ years of combined
            experience
          </p>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Issues</p>
            <p className="text-2xl font-bold text-gray-900">{totalIssues}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Passed</p>
            <p className="text-2xl font-bold text-green-600">{passedCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Failed</p>
            <p className="text-2xl font-bold text-red-600">{failedCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Avg Score</p>
            <p className="text-2xl font-bold text-blue-600">{avgScore}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Critical</p>
            <p className="text-2xl font-bold text-red-800">{criticalCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">High</p>
            <p className="text-2xl font-bold text-orange-600">{highCount}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">QA Agent Team</h2>
              <button
                onClick={handleRunAllValidations}
                disabled={runningValidation}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {runningValidation ? 'Running...' : 'Run All Validations'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {qaAgents.map(agent => (
                <div key={agent.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{agent.name}</span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        agent.status === 'idle'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {agent.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-1">{agent.specialization}</p>
                  <p className="text-xs text-gray-400">
                    {agent.yearsOfExperience} years experience
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Issue Breakdown</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-800 rounded mr-2" />
                  <span className="text-sm">Critical</span>
                </div>
                <span className="font-bold">{criticalCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-orange-500 rounded mr-2" />
                  <span className="text-sm">High</span>
                </div>
                <span className="font-bold">{highCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-500 rounded mr-2" />
                  <span className="text-sm">Medium</span>
                </div>
                <span className="font-bold">{mediumCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-500 rounded mr-2" />
                  <span className="text-sm">Low</span>
                </div>
                <span className="font-bold">{lowCount}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Validation Results</h2>
          {validations.length === 0 ? (
            <p className="text-gray-500">No validations run yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Task ID</th>
                    <th className="text-left py-3 px-4">Validated By</th>
                    <th className="text-left py-3 px-4">Score</th>
                    <th className="text-left py-3 px-4">Issues</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {validations
                    .slice()
                    .reverse()
                    .map(validation => (
                      <tr key={validation.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono text-sm">{validation.taskId}</td>
                        <td className="py-3 px-4">
                          {qaAgents.find(a => a.id === validation.agentId)?.name || 'Unknown'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`font-bold ${
                              validation.score >= 80
                                ? 'text-green-600'
                                : validation.score >= 60
                                  ? 'text-yellow-600'
                                  : 'text-red-600'
                            }`}
                          >
                            {validation.score}
                          </span>
                        </td>
                        <td className="py-3 px-4">{validation.issues.length}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              validation.passed
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {validation.passed ? 'PASSED' : 'FAILED'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setSelectedValidation(validation)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedValidation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">Validation Details</h3>
                  <button
                    onClick={() => setSelectedValidation(null)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500">Validation ID</p>
                    <p className="font-mono">{selectedValidation.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Task ID</p>
                    <p className="font-mono">{selectedValidation.taskId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Score</p>
                    <p className="font-bold text-2xl">{selectedValidation.score}/100</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span
                      className={`px-3 py-1 rounded text-sm ${
                        selectedValidation.passed
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {selectedValidation.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                </div>

                <h4 className="font-semibold mb-3">
                  Issues Found ({selectedValidation.issues.length})
                </h4>
                <div className="space-y-3">
                  {selectedValidation.issues.map((issue, index) => (
                    <div
                      key={index}
                      className={`border-l-4 rounded-r-lg p-3 ${
                        issue.severity === 'critical'
                          ? 'border-red-800 bg-red-50'
                          : issue.severity === 'high'
                            ? 'border-orange-500 bg-orange-50'
                            : issue.severity === 'medium'
                              ? 'border-yellow-500 bg-yellow-50'
                              : 'border-blue-500 bg-blue-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">{issue.title}</span>
                        <span className="text-xs uppercase font-bold text-gray-600">
                          {issue.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{issue.description}</p>
                      {issue.autoFixable && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          Auto-fixable
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
