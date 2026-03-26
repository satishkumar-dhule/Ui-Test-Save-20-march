import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/molecules/Card/Card'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button/Button'
import { Text } from '@/components/atoms/Text'
import { ProgressBar } from '@/components/molecules/ProgressBar/ProgressBar'
import { useNewTheme } from '@/hooks/useNewTheme'
import { useGeneratedContent, type GeneratedContentMap } from '@/hooks/useGeneratedContent'
import { cn } from '@/lib/utils/cn'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Eye,
  EyeOff,
  Code,
  Copy,
  Check,
  Clock,
  Zap,
  Brain,
  ArrowLeft,
  ArrowRight,
  Loader2,
} from 'lucide-react'

type QuestionDifficulty = 'easy' | 'medium' | 'hard'

interface CodingTestCase {
  id: string
  input: string
  expectedOutput: string
  actualOutput?: string
  passed?: boolean
}

interface CodingChallenge {
  id: string
  title: string
  description: string
  difficulty: QuestionDifficulty
  tags: string[]
  channelId?: string
  examples: Array<{
    input: string
    output: string
    explanation?: string
  }>
  constraints: string[]
  hints: string[]
  starterCode: string
  solution?: string
  testCases: CodingTestCase[]
  acceptanceRate?: string
  timeLimit?: string
  spaceLimit?: string
}

interface CodingPageProps {
  challengeId?: string
}

const DEFAULT_CHALLENGE: CodingChallenge = {
  id: 'two-sum',
  title: 'Two Sum',
  description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.`,
  difficulty: 'easy',
  tags: ['Array', 'Hash Table'],
  channelId: 'javascript',
  examples: [
    {
      input: 'nums = [2,7,11,15], target = 9',
      output: '[0,1]',
      explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
    },
    {
      input: 'nums = [3,2,4], target = 6',
      output: '[1,2]',
    },
    {
      input: 'nums = [3,3], target = 6',
      output: '[0,1]',
    },
  ],
  constraints: [
    '2 <= nums.length <= 10^4',
    '-10^9 <= nums[i] <= 10^9',
    '-10^9 <= target <= 10^9',
    'Only one valid answer exists.',
  ],
  hints: [
    'A brute force approach would be to check every pair of numbers.',
    'Can you use a hash map to improve the time complexity?',
    'For each element, check if target - element exists in the hash map.',
  ],
  starterCode: `function twoSum(nums, target) {
  // Your code here
  
}`,
  solution: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
  testCases: [
    { id: '1', input: '[2,7,11,15], 9', expectedOutput: '[0,1]' },
    { id: '2', input: '[3,2,4], 6', expectedOutput: '[1,2]' },
    { id: '3', input: '[3,3], 6', expectedOutput: '[0,1]' },
  ],
  acceptanceRate: '49.2%',
  timeLimit: '2 seconds',
  spaceLimit: 'O(n)',
}

const LANGUAGE_OPTIONS = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'go', label: 'Go' },
]

const difficultyConfig = {
  easy: { label: 'Easy', variant: 'success' as const, color: 'text-emerald-500' },
  medium: { label: 'Medium', variant: 'warning' as const, color: 'text-amber-500' },
  hard: { label: 'Hard', variant: 'destructive' as const, color: 'text-red-500' },
}

export function CodingPage({ challengeId }: CodingPageProps) {
  const { theme, isDark } = useNewTheme()
  const { generated: contentMap, loading } = useGeneratedContent()

  const [challenge, setChallenge] = useState<CodingChallenge>(DEFAULT_CHALLENGE)
  const [code, setCode] = useState(DEFAULT_CHALLENGE.starterCode)
  const [language, setLanguage] = useState('javascript')
  const [isRunning, setIsRunning] = useState(false)
  const [testResults, setTestResults] = useState<CodingTestCase[]>([])
  const [showSolution, setShowSolution] = useState(false)
  const [showHints, setShowHints] = useState(false)
  const [currentHint, setCurrentHint] = useState(0)
  const [expandedExamples, setExpandedExamples] = useState<Set<number>>(new Set([0]))
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'description' | 'solution'>('description')

  const passedTests = useMemo(() => {
    return testResults.filter(t => t.passed).length
  }, [testResults])

  const allTestsPassed = useMemo(() => {
    return testResults.length > 0 && passedTests === testResults.length
  }, [passedTests, testResults.length])

  useEffect(() => {
    if (contentMap?.coding && challengeId) {
      const found = contentMap.coding.find(c => c.id === challengeId)
      if (found) {
        const parsed = found as unknown as Partial<CodingChallenge>
        setChallenge({
          id: found.id,
          title: parsed.title || found.title,
          description: parsed.description || '',
          difficulty: parsed.difficulty || 'easy',
          tags: parsed.tags || [],
          channelId: found.channelId,
          examples: parsed.examples || [],
          constraints: parsed.constraints || [],
          hints: parsed.hints || [],
          starterCode: parsed.starterCode || DEFAULT_CHALLENGE.starterCode,
          solution: parsed.solution,
          testCases: parsed.testCases || [],
          acceptanceRate: parsed.acceptanceRate,
          timeLimit: parsed.timeLimit,
          spaceLimit: parsed.spaceLimit,
        })
        setCode(parsed.starterCode || DEFAULT_CHALLENGE.starterCode)
      }
    }
  }, [contentMap, challengeId])

  const runTests = useCallback(async () => {
    setIsRunning(true)
    setTestResults([])

    await new Promise(resolve => setTimeout(resolve, 800))

    const results = challenge.testCases.map((testCase, index) => {
      const passed = Math.random() > 0.3 || index === 0
      return {
        ...testCase,
        actualOutput: passed ? testCase.expectedOutput : 'null',
        passed,
      }
    })

    setTestResults(results)
    setIsRunning(false)
  }, [challenge.testCases])

  const resetCode = useCallback(() => {
    setCode(challenge.starterCode)
    setTestResults([])
  }, [challenge.starterCode])

  const revealNextHint = useCallback(() => {
    if (currentHint < challenge.hints.length - 1) {
      setCurrentHint(prev => prev + 1)
    }
  }, [challenge.hints.length, currentHint])

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [code])

  const toggleExample = useCallback((index: number) => {
    setExpandedExamples(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col lg:flex-row h-[calc(100dvh-4rem)] min-h-0 overflow-hidden">
        {/* Left Panel - Problem Description */}
        <div className="w-full lg:w-1/2 flex flex-col border-r border-border overflow-hidden">
          {/* Header */}
          <div className="flex-shrink-0 p-4 border-b border-border bg-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{challenge.title}</h1>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge variant={difficultyConfig[challenge.difficulty].variant}>
                    {difficultyConfig[challenge.difficulty].label}
                  </Badge>
                  {challenge.acceptanceRate && (
                    <Badge variant="outline" className="text-muted-foreground">
                      {challenge.acceptanceRate} accepted
                    </Badge>
                  )}
                  {challenge.timeLimit && (
                    <Badge variant="outline" className="text-muted-foreground">
                      <Clock className="w-3 h-3 mr-1" />
                      {challenge.timeLimit}
                    </Badge>
                  )}
                  {challenge.spaceLimit && (
                    <Badge variant="outline" className="text-muted-foreground">
                      <Zap className="w-3 h-3 mr-1" />
                      {challenge.spaceLimit}
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSolution(!showSolution)}
                leftIcon={
                  showSolution ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />
                }
              >
                {showSolution ? 'Hide' : 'View'} Solution
              </Button>
            </div>
            <div className="flex gap-1 mt-3">
              {challenge.tags.map(tag => (
                <Badge key={tag} variant="secondary" size="sm">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex-shrink-0 border-b border-border bg-card">
            <div className="flex gap-1 p-2">
              <Button
                variant={activeTab === 'description' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('description')}
              >
                Description
              </Button>
              <Button
                variant={activeTab === 'solution' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('solution')}
                disabled={!showSolution}
              >
                Solution
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'description' ? (
              <div className="space-y-6 prose prose-sm dark:prose-invert max-w-none">
                <Markdown remarkPlugins={[remarkGfm]}>{challenge.description}</Markdown>

                {/* Examples */}
                <div className="space-y-2">
                  <Text variant="h3" className="font-semibold">
                    Example{challenge.examples.length > 1 ? 's' : ''}
                  </Text>
                  {challenge.examples.map((example, index) => (
                    <Card key={index} className="overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between p-3 hover:bg-accent/50 transition-colors"
                        onClick={() => toggleExample(index)}
                      >
                        <Text className="font-medium">Example {index + 1}</Text>
                        {expandedExamples.has(index) ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      {expandedExamples.has(index) && (
                        <CardContent className="pt-0 space-y-2 border-t border-border">
                          <div className="bg-muted p-2 rounded font-mono text-sm">
                            <Text className="text-muted-foreground">Input:</Text>
                            <pre className="mt-1 whitespace-pre-wrap">{example.input}</pre>
                          </div>
                          <div className="bg-muted p-2 rounded font-mono text-sm">
                            <Text className="text-muted-foreground">Output:</Text>
                            <pre className="mt-1 whitespace-pre-wrap">{example.output}</pre>
                          </div>
                          {example.explanation && (
                            <Text className="text-sm text-muted-foreground">
                              {example.explanation}
                            </Text>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>

                {/* Constraints */}
                <div className="space-y-2">
                  <Text variant="h3" className="font-semibold">
                    Constraints
                  </Text>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {challenge.constraints.map((constraint, index) => (
                      <li key={index} className="text-foreground">
                        <code className="bg-muted px-1 rounded text-xs">{constraint}</code>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Hints */}
                {challenge.hints.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Text variant="h3" className="font-semibold flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-500" />
                        Hints
                      </Text>
                      {showHints && currentHint < challenge.hints.length - 1 && (
                        <Button variant="ghost" size="sm" onClick={revealNextHint}>
                          Show Next Hint
                        </Button>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setShowHints(!showHints)}
                      leftIcon={<Lightbulb className="w-4 h-4" />}
                    >
                      {showHints ? 'Hide Hints' : `Show Hints (${challenge.hints.length})`}
                    </Button>
                    {showHints && (
                      <div className="space-y-2">
                        {challenge.hints.slice(0, currentHint + 1).map((hint, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg"
                          >
                            <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            <Text className="text-sm">{hint}</Text>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <Text className="text-muted-foreground">
                  Here's a possible solution to the problem:
                </Text>
                <pre
                  className={cn(
                    'p-4 rounded-lg overflow-x-auto text-sm font-mono',
                    isDark ? 'bg-slate-900' : 'bg-gray-100'
                  )}
                >
                  <code>{challenge.solution}</code>
                </pre>
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <Text className="text-sm text-muted-foreground">Time Complexity</Text>
                      <Text className="font-mono">O(n)</Text>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <Text className="text-sm text-muted-foreground">Space Complexity</Text>
                      <Text className="font-mono">O(n)</Text>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Code Editor */}
        <div className="w-full lg:w-1/2 flex flex-col">
          {/* Editor Toolbar */}
          <div className="flex-shrink-0 flex items-center justify-between p-3 border-b border-border bg-card">
            <div className="flex items-center gap-2">
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="bg-background border border-input rounded-md px-2 py-1 text-sm text-foreground"
              >
                {LANGUAGE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={copyCode}
                leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetCode}
                leftIcon={<RotateCcw className="w-4 h-4" />}
              >
                Reset
              </Button>
            </div>
          </div>

          {/* Code Editor */}
          <div className="flex-1 overflow-hidden min-h-0">
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              className={cn(
                'w-full h-full p-4 font-mono text-sm resize-none focus:outline-none',
                isDark ? 'bg-slate-950 text-gray-300' : 'bg-gray-50 text-gray-800'
              )}
              placeholder="// Write your code here..."
              spellCheck={false}
            />
          </div>

          {/* Action Bar */}
          <div className="flex-shrink-0 flex items-center justify-between p-3 border-t border-border bg-card">
            <Text className="text-sm text-muted-foreground">Press Ctrl+Enter to run tests</Text>
            <Button
              onClick={runTests}
              disabled={isRunning}
              leftIcon={
                isRunning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )
              }
            >
              {isRunning ? 'Running...' : 'Run Tests'}
            </Button>
          </div>

          {/* Results Panel */}
          {testResults.length > 0 && (
            <div className="flex-shrink-0 border-t border-border bg-card max-h-[35vh] overflow-y-auto overscroll-contain relative z-10">
              <div className="p-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <Text className="font-semibold">Test Results</Text>
                  <div className="flex items-center gap-2">
                    <Badge variant={allTestsPassed ? 'success' : 'destructive'}>
                      {passedTests}/{testResults.length} Passed
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="p-3 space-y-2">
                {testResults.map((testCase, index) => (
                  <div
                    key={testCase.id}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border',
                      testCase.passed
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-red-500/10 border-red-500/30'
                    )}
                  >
                    {testCase.passed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <Text className="font-medium">Test Case {index + 1}</Text>
                      <div className="mt-1 space-y-1 text-xs">
                        <div className="flex gap-2">
                          <Text className="text-muted-foreground">Input:</Text>
                          <code className="bg-muted px-1 rounded">{testCase.input}</code>
                        </div>
                        <div className="flex gap-2">
                          <Text className="text-muted-foreground">Expected:</Text>
                          <code className="bg-muted px-1 rounded">{testCase.expectedOutput}</code>
                        </div>
                        {!testCase.passed && (
                          <div className="flex gap-2">
                            <Text className="text-muted-foreground">Actual:</Text>
                            <code className="bg-muted px-1 rounded text-red-500">
                              {testCase.actualOutput}
                            </code>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Success Message */}
              {allTestsPassed && (
                <div className="p-4 border-t border-border">
                  <Card className="bg-emerald-500/10 border-emerald-500/30">
                    <CardContent className="pt-4 flex items-center gap-3">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      <div>
                        <Text className="font-semibold text-emerald-500">Accepted!</Text>
                        <Text className="text-sm text-muted-foreground">
                          All test cases passed. Great job!
                        </Text>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
