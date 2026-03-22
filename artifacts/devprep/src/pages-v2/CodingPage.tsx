import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Layout } from '@/components/layouts/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/Card'
import { Badge } from '@/components/atoms'
import { contentApi } from '@/lib/api/endpoints'

interface CodingChallenge {
  id: string
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  tags: string[]
  examples: Array<{
    input: string
    output: string
    explanation: string
  }>
  starterCode: string
  solution: string
}

export function CodingPage() {
  const [selectedChallenge, setSelectedChallenge] = useState<CodingChallenge | null>(null)
  const [code, setCode] = useState('')
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [activeTab, setActiveTab] = useState<'code' | 'examples' | 'hints'>('code')

  const { data, isLoading } = useQuery({
    queryKey: ['coding-challenges'],
    queryFn: () => contentApi.getByType('coding'),
  })

  const challenges: CodingChallenge[] = (data?.data || []).map(item => ({
    id: item.id,
    title: (item.data.title as string) || 'Untitled Challenge',
    description: (item.data.description as string) || '',
    difficulty: (item.data.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
    tags: (item.data.tags as string[]) || [],
    examples: (item.data.examples as CodingChallenge['examples']) || [],
    starterCode: (item.data.starterCode as string) || '',
    solution: (item.data.solution as string) || '',
  }))

  useEffect(() => {
    if (challenges.length > 0 && !selectedChallenge) {
      setSelectedChallenge(challenges[0])
      setCode(challenges[0].starterCode)
    }
  }, [challenges])

  const handleChallengeSelect = (challenge: CodingChallenge) => {
    setSelectedChallenge(challenge)
    setCode(challenge.starterCode)
    setOutput('')
  }

  const handleRunCode = async () => {
    setIsRunning(true)
    setOutput('Running code...\n')

    // Simulate code execution
    setTimeout(() => {
      try {
        // In a real app, this would send code to a secure execution environment
        setOutput(`✅ Code executed successfully\n\nOutput:\n${code}\n\nTest cases: 3/3 passed`)
      } catch (error) {
        setOutput(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      } finally {
        setIsRunning(false)
      }
    }, 1500)
  }

  const handleSubmitCode = () => {
    if (!selectedChallenge) return

    // In a real app, this would validate against test cases
    setOutput(
      `🎉 Congratulations! Solution accepted.\n\nAll test cases passed!\nTime complexity: O(n)\nSpace complexity: O(1)`
    )
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-center">
            <div className="h-8 w-48 bg-muted rounded mb-4 mx-auto" />
            <div className="h-4 w-64 bg-muted rounded mx-auto" />
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Coding Challenges">
      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        {/* Challenge List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Available Challenges</h2>
          <div className="space-y-3">
            {challenges.map(challenge => (
              <Card
                key={challenge.id}
                className={`cursor-pointer transition-colors hover:border-primary ${
                  selectedChallenge?.id === challenge.id ? 'border-primary' : ''
                }`}
                onClick={() => handleChallengeSelect(challenge)}
              >
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{challenge.title}</CardTitle>
                    <Badge
                      variant={
                        challenge.difficulty === 'easy'
                          ? 'secondary'
                          : challenge.difficulty === 'medium'
                            ? 'default'
                            : 'destructive'
                      }
                    >
                      {challenge.difficulty}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Challenge Details */}
        {selectedChallenge && (
          <div className="space-y-6">
            {/* Challenge Header */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">{selectedChallenge.title}</h1>
                <div className="flex gap-2">
                  {selectedChallenge.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <p className="text-muted-foreground">{selectedChallenge.description}</p>
            </div>

            {/* Tabs */}
            <div className="space-y-4">
              <div className="flex border-b">
                <button
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'code'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveTab('code')}
                >
                  Code Editor
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'examples'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveTab('examples')}
                >
                  Examples
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'hints'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveTab('hints')}
                >
                  Hints
                </button>
              </div>

              {activeTab === 'code' && (
                <div className="space-y-4">
                  {/* Code Editor */}
                  <Card>
                    <CardContent className="p-0">
                      <div className="border-b bg-muted/50 p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge>JavaScript</Badge>
                            <span className="text-sm text-muted-foreground">
                              {selectedChallenge.title}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1 text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                              onClick={handleRunCode}
                              disabled={isRunning}
                            >
                              {isRunning ? 'Running...' : 'Run Code'}
                            </button>
                            <button
                              className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                              onClick={handleSubmitCode}
                            >
                              Submit
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <textarea
                          className="w-full h-64 font-mono text-sm bg-background resize-none focus:outline-none"
                          value={code}
                          onChange={e => setCode(e.target.value)}
                          spellCheck={false}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Output */}
                  {output && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Output</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="text-sm font-mono whitespace-pre-wrap">{output}</pre>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {activeTab === 'examples' && (
                <div className="space-y-4">
                  {selectedChallenge.examples.map((example, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-base">Example {index + 1}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <div className="text-sm font-medium mb-1">Input:</div>
                          <code className="block bg-muted p-2 rounded text-sm">
                            {example.input}
                          </code>
                        </div>
                        <div>
                          <div className="text-sm font-medium mb-1">Output:</div>
                          <code className="block bg-muted p-2 rounded text-sm">
                            {example.output}
                          </code>
                        </div>
                        {example.explanation && (
                          <div>
                            <div className="text-sm font-medium mb-1">Explanation:</div>
                            <p className="text-sm text-muted-foreground">{example.explanation}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {activeTab === 'hints' && (
                <Card>
                  <CardContent className="py-6">
                    <div className="space-y-4">
                      <h3 className="font-medium">Getting Started</h3>
                      <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                        <li>Read the problem statement carefully</li>
                        <li>Start with the examples to understand the pattern</li>
                        <li>Consider edge cases</li>
                        <li>Test your solution with the provided examples</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Challenge Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Challenge Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Difficulty</div>
                    <div className="font-medium capitalize">{selectedChallenge.difficulty}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Time Limit</div>
                    <div className="font-medium">30 minutes</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Memory Limit</div>
                    <div className="font-medium">256 MB</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  )
}
