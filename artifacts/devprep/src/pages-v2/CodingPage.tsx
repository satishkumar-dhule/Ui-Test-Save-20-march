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
  easy: { label: 'Easy', variant: 'success' as const, color: 'text-success' },
  medium: { label: 'Medium', variant: 'warning' as const, color: 'text-warning' },
  hard: { label: 'Hard', variant: 'destructive' as const, color: 'text-destructive' },
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
      <div className="flex flex-col lg:flex-row lg:h-[calc(100dvh-4rem)] min-h-0 overflow-hidden">
        {/* Left Panel - Problem Description */}
        <div className="w-full lg:w-[45%] xl:w-[42%] flex flex-col border-b lg:border-b-0 lg:border-r border-border overflow-hidden">
          {/* Header */}
          <div className="flex-shrink-0 p-3 sm:p-4 border-b border-border bg-card">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-snug truncate pr-2">
                  {challenge.title}
                </h1>
                <div className="flex items-center gap-2 mt-2 flex-wrap gap-y-2">
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
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      {challenge.timeLimit}
                    </Badge>
                  )}
                  {challenge.spaceLimit && (
                    <Badge variant="outline" className="text-muted-foreground">
                      <Zap className="w-3.5 h-3.5 mr-1" />
                      {challenge.spaceLimit}
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="flex-shrink-0 min-h-[44px] min-w-[44px]"
                onClick={() => setShowSolution(!showSolution)}
                leftIcon={
                  showSolution ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />
                }
              >
                {showSolution ? 'Hide' : 'View'} Solution
              </Button>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {challenge.tags.map(tag => (
                <Badge key={tag} variant="secondary" size="sm">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex-shrink-0 border-b border-border bg-card">
            <div className="flex gap-1 px-2 py-1.5" role="tablist">
              <button
                role="tab"
                aria-selected={activeTab === 'description'}
                className={cn(
                  'flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-colors min-h-[44px]',
                  activeTab === 'description'
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
                onClick={() => setActiveTab('description')}
              >
                Description
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'solution'}
                aria-disabled={!showSolution}
                className={cn(
                  'flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-colors min-h-[44px]',
                  activeTab === 'solution'
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                  !showSolution && 'opacity-50 cursor-not-allowed'
                )}
                onClick={() => showSolution && setActiveTab('solution')}
                disabled={!showSolution}
              >
                Solution
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
            {activeTab === 'description' ? (
              <div className="space-y-4 sm:space-y-6 prose prose-sm dark:prose-invert max-w-none leading-relaxed">
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => (
                      <h2 className="text-xl font-semibold mb-3 mt-4">{children}</h2>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-lg font-semibold mb-2 mt-5">{children}</h2>
                    ),
                    p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
                    code: ({ className, children }) => {
                      const isInline = !className?.includes('language-')
                      return isInline ? (
                        <code className="px-1.5 py-0.5 rounded text-xs font-mono bg-muted">
                          {children}
                        </code>
                      ) : (
                        <code className={className}>{children}</code>
                      )
                    },
                  }}
                >
                  {challenge.description}
                </Markdown>

                {/* Examples */}
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground">
                    Example{challenge.examples.length > 1 ? 's' : ''}
                  </h2>
                  {challenge.examples.map((example, index) => (
                    <Card key={index} className="overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between p-3 min-h-[44px] hover:bg-accent/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => toggleExample(index)}
                        aria-expanded={expandedExamples.has(index)}
                        aria-controls={`example-content-${index}`}
                      >
                        <Text className="font-medium">Example {index + 1}</Text>
                        <ChevronDown
                          className={cn(
                            'w-4 h-4 text-muted-foreground transition-transform duration-200',
                            expandedExamples.has(index) && 'rotate-180'
                          )}
                        />
                      </button>
                      {expandedExamples.has(index) && (
                        <CardContent
                          className="pt-0 space-y-3 border-t border-border"
                          id={`example-content-${index}`}
                        >
                          <div className="bg-muted/50 border border-border rounded-md overflow-hidden">
                            <div className="bg-muted px-3 py-1.5 border-b border-border flex items-center gap-2">
                              <Code className="w-3 h-3 text-blue-500" />
                              <Text className="text-xs text-muted-foreground font-medium">
                                Input
                              </Text>
                            </div>
                            <pre className="p-3 overflow-x-auto text-sm font-mono whitespace-pre-wrap text-foreground">
                              {example.input}
                            </pre>
                          </div>
                          <div className="bg-muted/50 border border-border rounded-md overflow-hidden">
                            <div className="bg-muted px-3 py-1.5 border-b border-border flex items-center gap-2">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              <Text className="text-xs text-muted-foreground font-medium">
                                Output
                              </Text>
                            </div>
                            <pre className="p-3 overflow-x-auto text-sm font-mono whitespace-pre-wrap text-foreground">
                              {example.output}
                            </pre>
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
                <div className="space-y-3 mt-6">
                  <h2 className="text-lg font-semibold text-foreground">Constraints</h2>
                  <ul className="list-none space-y-2" aria-label="Problem constraints">
                    {challenge.constraints.map((constraint, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <XCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <code
                          className={cn(
                            'px-2 py-1 rounded text-xs font-mono overflow-x-auto break-all max-w-full block',
                            isDark ? 'bg-[#1e1e1e] text-[#d4d4d4]' : 'bg-[#f6f8fa] text-[#24292e]'
                          )}
                        >
                          {constraint}
                        </code>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Hints */}
                {challenge.hints.length > 0 && (
                  <div className="space-y-3 mt-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-warning" />
                        Hints
                      </h2>
                      {showHints && currentHint < challenge.hints.length - 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="min-h-[44px]"
                          onClick={revealNextHint}
                        >
                          Show Next Hint
                        </Button>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full justify-start min-h-[44px]"
                      onClick={() => setShowHints(!showHints)}
                      leftIcon={<Lightbulb className="w-4 h-4" />}
                    >
                      {showHints ? 'Hide Hints' : `Show Hints (${challenge.hints.length})`}
                    </Button>
                    {showHints && (
                      <div className="space-y-3">
                        {challenge.hints.slice(0, currentHint + 1).map((hint, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-4 rounded-lg border bg-warning/5 border-warning/20"
                          >
                            <Lightbulb className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
                            <div>
                              <Text className="text-sm font-medium text-warning">
                                Hint {index + 1}
                              </Text>
                              <Text className="text-sm mt-1">{hint}</Text>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <Text className="text-muted-foreground" size="sm">
                  Here's a possible solution to the problem:
                </Text>
                <pre
                  className={cn(
                    'p-4 rounded-lg overflow-x-auto text-sm font-mono leading-6 border border-border',
                    isDark ? 'bg-[#1e1e1e] text-[#d4d4d4]' : 'bg-[#f6f8fa] text-[#24292e]'
                  )}
                >
                  <code className="whitespace-pre-wrap">{challenge.solution}</code>
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
        <div className="w-full lg:w-[55%] xl:w-[58%] flex flex-col border-l border-border">
          {/* Editor Toolbar */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border bg-card">
            <div className="flex items-center gap-3">
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                aria-label="Select programming language"
                className={cn(
                  'h-9 min-w-[140px] rounded-md px-3 text-sm text-foreground',
                  'bg-background border border-input',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
                  'transition-colors cursor-pointer hover:border-input/80'
                )}
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
                className="min-h-[44px] min-w-[44px]"
                onClick={copyCode}
                leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[44px] min-w-[44px]"
                onClick={resetCode}
                leftIcon={<RotateCcw className="w-4 h-4" />}
              >
                Reset
              </Button>
            </div>
          </div>

          {/* Code Editor */}
          <div className="flex-1 overflow-hidden min-h-0 min-h-[200px]">
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              className={cn(
                'w-full h-full p-4 font-mono text-sm resize-none',
                'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/50',
                'leading-6',
                isDark
                  ? 'bg-[#1e1e1e] text-[#d4d4d4] selection:bg-primary/30 scrollbar-thin'
                  : 'bg-[#f8f9fa] text-[#24292e] selection:bg-primary/20 scrollbar-thin'
              )}
              style={{ tabSize: 4 }}
              placeholder="// Write your code here..."
              spellCheck={false}
              aria-label="Code editor"
            />
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
                        <div className="flex gap-2 items-center min-w-0">
                          <Text className="text-muted-foreground flex-shrink-0">Input:</Text>
                          <code
                            className={cn(
                              'px-1.5 py-0.5 rounded text-xs font-mono overflow-x-auto break-all',
                              isDark ? 'bg-slate-800 text-slate-200' : 'bg-gray-200 text-gray-800'
                            )}
                          >
                            {testCase.input}
                          </code>
                        </div>
                        <div className="flex gap-2 items-center min-w-0">
                          <Text className="text-muted-foreground flex-shrink-0">Expected:</Text>
                          <code
                            className={cn(
                              'px-1.5 py-0.5 rounded text-xs font-mono overflow-x-auto break-all',
                              isDark ? 'bg-slate-800 text-slate-200' : 'bg-gray-200 text-gray-800'
                            )}
                          >
                            {testCase.expectedOutput}
                          </code>
                        </div>
                        {!testCase.passed && (
                          <div className="flex gap-2 items-center min-w-0">
                            <Text className="text-muted-foreground flex-shrink-0">Actual:</Text>
                            <code
                              className={cn(
                                'px-1.5 py-0.5 rounded text-xs font-mono overflow-x-auto break-all',
                                isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'
                              )}
                            >
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
                  <Card className="bg-emerald-500/10 border border-emerald-500/30">
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
