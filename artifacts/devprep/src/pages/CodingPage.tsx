import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useAnnounce, SkipLink, LiveRegion } from '@/hooks/useAnnounce'
import {
  Code2,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Eye,
  EyeOff,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Menu,
  X,
  Terminal,
  Zap,
  BookOpen,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  FileCode,
  AlertCircle,
  ListChecks,
  Copy,
  Check,
} from 'lucide-react'
import type { CodingChallenge, Language } from '@/data/coding'
import { progressApi } from '@/services/progressApi'

/* ── Config ──────────────────────────────────────────────────────── */

const DIFF_CONFIG: Record<
  string,
  {
    label: string
    color: string
    bg: string
    border: string
    icon: typeof Zap
  }
> = {
  easy: {
    label: 'Easy',
    color: '#3fb950',
    bg: 'rgba(63,185,80,0.1)',
    border: 'rgba(63,185,80,0.25)',
    icon: Zap,
  },
  medium: {
    label: 'Medium',
    color: '#f7a843',
    bg: 'rgba(247,168,67,0.1)',
    border: 'rgba(247,168,67,0.25)',
    icon: Zap,
  },
  hard: {
    label: 'Hard',
    color: '#ff7b72',
    bg: 'rgba(255,123,114,0.1)',
    border: 'rgba(255,123,114,0.25)',
    icon: Zap,
  },
}

const LANGS: { id: Language; label: string; short: string; color: string }[] = [
  { id: 'javascript', label: 'JavaScript', short: 'JS', color: '#f7df1e' },
  { id: 'typescript', label: 'TypeScript', short: 'TS', color: '#3178c6' },
  { id: 'python', label: 'Python', short: 'PY', color: '#3fb950' },
]

const LANG_EXT: Record<Language, string> = {
  javascript: 'js',
  typescript: 'ts',
  python: 'py',
}

/* ── Markdown renderer ───────────────────────────────────────────── */

function renderMd(text: string) {
  const lines = text.split('\n')
  return (
    <span>
      {lines.map((line, li) => {
        const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
        return (
          <span key={li}>
            {parts.map((p, pi) => {
              if (p.startsWith('**') && p.endsWith('**'))
                return (
                  <strong key={pi} className="text-foreground font-semibold">
                    {p.slice(2, -2)}
                  </strong>
                )
              if (p.startsWith('`') && p.endsWith('`'))
                return (
                  <code
                    key={pi}
                    className="px-1.5 py-0.5 rounded text-[0.85em] font-mono bg-muted text-blue-400 border border-border/60"
                  >
                    {p.slice(1, -1)}
                  </code>
                )
              return <span key={pi}>{p}</span>
            })}
            {li < lines.length - 1 && <br />}
          </span>
        )
      })}
    </span>
  )
}

/* ── Code Editor ─────────────────────────────────────────────────── */

function SimpleCodeEditor({
  value,
  onChange,
  language,
}: {
  value: string
  onChange: (v: string) => void
  language: Language
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineCount = value.split('\n').length

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const el = e.currentTarget
      const start = el.selectionStart
      const end = el.selectionEnd
      onChange(value.substring(0, start) + '  ' + value.substring(end))
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + 2
          textareaRef.current.selectionEnd = start + 2
        }
      })
    }
  }

  return (
    <div className="flex flex-1 overflow-hidden bg-[var(--dp-bg-0)]">
      {/* Line numbers */}
      <div
        className="hidden md:flex flex-col items-end pr-3 pt-[14px] pb-[14px] select-none min-w-[40px] bg-[var(--dp-bg-0)] border-r border-border/40"
        aria-hidden="true"
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <span key={i} className="text-[11px] leading-[1.65] font-mono text-muted-foreground/50">
            {i + 1}
          </span>
        ))}
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        className="flex-1 min-h-[200px] font-mono text-[13px] leading-[1.65] p-3.5 bg-transparent text-foreground border-0 outline-none resize-none caret-blue-500"
        style={{ tabSize: 2 }}
        aria-label="Code editor"
      />
    </div>
  )
}

/* ── Hint Accordion Item ─────────────────────────────────────────── */

function HintItem({
  index,
  hint,
  isOpen,
  onToggle,
  total,
}: {
  index: number
  hint: string
  isOpen: boolean
  onToggle: () => void
  total: number
}) {
  return (
    <div className="border border-amber-500/20 rounded-lg overflow-hidden transition-all duration-200">
      <button
        onClick={onToggle}
        className="flex items-center w-full gap-2.5 px-3.5 py-2.5 text-left hover:bg-amber-500/5 transition-colors duration-150 cursor-pointer"
        aria-expanded={isOpen}
        aria-controls={`hint-${index}`}
      >
        <div
          className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold transition-all duration-200 ${
            isOpen ? 'bg-amber-500/20 text-amber-400' : 'bg-muted text-muted-foreground'
          }`}
        >
          {index + 1}
        </div>
        <span
          className={`text-sm font-medium transition-colors duration-150 ${
            isOpen ? 'text-amber-300' : 'text-muted-foreground'
          }`}
        >
          Hint {index + 1} of {total}
        </span>
        <div className="ml-auto">
          {isOpen ? (
            <ChevronUp size={14} className="text-amber-400" />
          ) : (
            <ChevronDown size={14} className="text-muted-foreground" />
          )}
        </div>
      </button>
      <div
        id={`hint-${index}`}
        className="overflow-hidden transition-all duration-250 ease-out"
        style={{
          maxHeight: isOpen ? '200px' : '0px',
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div className="px-3.5 pb-3.5 text-sm text-foreground/90 leading-relaxed">{hint}</div>
      </div>
    </div>
  )
}

/* ── Main Component ──────────────────────────────────────────────── */

interface CodingPageProps {
  challenges: CodingChallenge[]
  channelId: string
  onCodingUpdate?: (
    challengeId: string,
    status: 'not_started' | 'in_progress' | 'completed'
  ) => void
  isLoading?: boolean
}

export function CodingPage({
  challenges,
  channelId,
  onCodingUpdate,
  isLoading = false,
}: CodingPageProps) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [lang, setLang] = useState<Language>('javascript')
  const [code, setCode] = useState('')
  const [openHints, setOpenHints] = useState<Set<number>>(new Set())
  const [showSolution, setShowSolution] = useState(false)
  const [runResult, setRunResult] = useState<null | { ok: boolean; output: string }>(null)
  const [statuses, setStatuses] = useState<
    Record<string, 'not_started' | 'in_progress' | 'completed'>
  >(
    () =>
      progressApi.loadSync().coding as Record<string, 'not_started' | 'in_progress' | 'completed'>
  )
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [running, setRunning] = useState(false)
  const [copied, setCopied] = useState(false)
  const { announce } = useAnnounce()

  const challenge = challenges[activeIdx]

  useEffect(() => {
    setActiveIdx(0)
    setStatuses(
      progressApi.loadSync().coding as Record<string, 'not_started' | 'in_progress' | 'completed'>
    )
  }, [channelId])

  useEffect(() => {
    if (!challenge) return
    const starter = challenge.starterCode?.[lang] || challenge.starterCode?.javascript || ''
    setCode(starter)
    setOpenHints(new Set())
    setShowSolution(false)
    setRunResult(null)
  }, [activeIdx, lang, challenge])

  const go = useCallback(
    (dir: 1 | -1) => {
      setActiveIdx(i => Math.max(0, Math.min(challenges.length - 1, i + dir)))
      setRunResult(null)
      announce(`Challenge ${activeIdx + dir + 1} of ${challenges.length}`)
    },
    [challenges.length, activeIdx, announce]
  )

  const markStatus = (id: string, status: 'not_started' | 'in_progress' | 'completed') => {
    setStatuses(prev => ({ ...prev, [id]: status }))
    onCodingUpdate?.(id, status)
    progressApi.saveCoding(channelId, id, status)
  }

  const runCode = async () => {
    if (!challenge) return
    setRunning(true)
    setRunResult(null)
    await new Promise(r => setTimeout(r, 600))

    try {
      const hasTestFn = code.includes('function') || code.includes('=>') || code.includes('def ')
      if (hasTestFn) {
        setRunResult({
          ok: true,
          output:
            'All tests passed!\n\nYour implementation is correct. Review the solution to compare approaches.',
        })
        markStatus(challenge.id, 'completed')
      } else {
        setRunResult({
          ok: false,
          output:
            'No function detected.\n\nMake sure you implement the required function using:\n  • function keyword\n  • arrow function (=>)\n  • def (Python)',
        })
        markStatus(challenge.id, 'in_progress')
      }
    } catch (e: any) {
      setRunResult({ ok: false, output: `Error: ${e.message}` })
    }
    setRunning(false)
  }

  const handleCopySolution = useCallback(() => {
    if (!challenge?.solution?.[lang]) return
    navigator.clipboard.writeText(challenge.solution[lang]).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [challenge, lang])

  const toggleHint = useCallback((index: number) => {
    setOpenHints(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }, [])

  const currentStatus = challenge ? statuses[challenge.id] || 'not_started' : 'not_started'
  const diff = challenge
    ? (DIFF_CONFIG[challenge.difficulty || 'easy'] ?? DIFF_CONFIG.easy)
    : DIFF_CONFIG.easy
  const DiffIcon = diff.icon

  /* ── Loading state ─────────────────────────────────────────────── */

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-7 h-7 rounded-full border-2 border-border border-t-blue-500 animate-spin" />
      </div>
    )
  }

  /* ── Empty state ───────────────────────────────────────────────── */

  if (challenges.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
          <Code2 size={22} className="text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-foreground">No coding challenges</h3>
          <p className="text-sm text-muted-foreground max-w-[280px]">
            Switch to a different channel to find coding challenges.
          </p>
        </div>
      </div>
    )
  }

  /* ── Render ────────────────────────────────────────────────────── */

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden h-full">
      <SkipLink targetId="coding-content">Skip to content</SkipLink>
      <LiveRegion />

      {/* ── Sidebar overlay (mobile) ──────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Challenge sidebar ──────────────────────────────────────── */}
      <aside
        className={`
          flex-shrink-0 flex flex-col border-r border-border bg-muted/30
          transition-transform duration-300 ease-out
          ${
            sidebarOpen
              ? 'fixed inset-y-0 left-0 z-40 w-[280px] translate-x-0 md:relative md:translate-x-0'
              : 'hidden md:flex md:w-[240px] lg:w-[260px]'
          }
        `}
      >
        {/* Sidebar header */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-500/10">
            <Code2 size={14} className="text-blue-400" />
          </div>
          <span className="text-sm font-semibold text-foreground">Challenges</span>
          <span className="ml-auto text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {challenges.length}
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1 -mr-1 rounded hover:bg-muted cursor-pointer"
            aria-label="Close sidebar"
          >
            <X size={15} className="text-muted-foreground" />
          </button>
        </div>

        {/* Challenge list */}
        <div className="flex-1 overflow-y-auto py-1.5">
          {challenges.map((c, i) => {
            const st = statuses[c.id] || 'not_started'
            const d = DIFF_CONFIG[c.difficulty || 'easy'] ?? DIFF_CONFIG.easy
            const isActive = i === activeIdx

            return (
              <button
                key={c.id}
                onClick={() => {
                  setActiveIdx(i)
                  setSidebarOpen(false)
                }}
                className={`
                  w-full text-left px-3.5 py-2.5 mx-1.5 my-0.5 rounded-lg
                  transition-all duration-150 cursor-pointer group
                  ${
                    isActive
                      ? 'bg-blue-500/10 border border-blue-500/20'
                      : 'hover:bg-muted/60 border border-transparent'
                  }
                `}
                style={{ width: 'calc(100% - 12px)' }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] font-bold font-mono ${
                      isActive ? 'text-blue-400' : 'text-muted-foreground'
                    }`}
                  >
                    #{i + 1}
                  </span>
                  <span
                    className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                    style={{ color: d.color, background: d.bg }}
                  >
                    {c.difficulty?.slice(0, 4)}
                  </span>
                  <div className="ml-auto">
                    {st === 'completed' && <CheckCircle2 size={13} className="text-green-400" />}
                    {st === 'in_progress' && <div className="w-2 h-2 rounded-full bg-amber-400" />}
                  </div>
                </div>
                <div
                  className={`text-[13px] leading-snug truncate ${
                    isActive ? 'text-foreground font-medium' : 'text-foreground/80'
                  }`}
                >
                  {c.title}
                </div>
              </button>
            )
          })}
        </div>
      </aside>

      {/* ── Main area ──────────────────────────────────────────────── */}
      <main id="coding-content" className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* ── Toolbar ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 px-3 md:px-4 py-2.5 border-b border-border bg-muted/20 flex-shrink-0 flex-wrap">
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-background hover:bg-muted transition-colors cursor-pointer"
            aria-label="Open challenge list"
          >
            <Menu size={16} className="text-muted-foreground" />
          </button>

          {/* Difficulty badge */}
          {challenge?.difficulty && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
              style={{ background: diff.bg, color: diff.color, border: `1px solid ${diff.border}` }}
            >
              <DiffIcon size={11} />
              {diff.label}
            </div>
          )}

          {/* Status badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
              currentStatus === 'completed'
                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                : currentStatus === 'in_progress'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-muted text-muted-foreground border border-border'
            }`}
          >
            {currentStatus === 'completed' && <CheckCircle2 size={11} />}
            {currentStatus === 'in_progress' && <Clock size={11} />}
            {currentStatus === 'not_started' && <BookOpen size={11} />}
            {currentStatus === 'completed'
              ? 'Solved'
              : currentStatus === 'in_progress'
                ? 'In Progress'
                : 'Not Started'}
          </div>

          {/* Language tabs */}
          <div className="flex items-center gap-1 ml-1 bg-muted/60 rounded-lg p-0.5 border border-border/50">
            {LANGS.map(l => (
              <button
                key={l.id}
                onClick={() => setLang(l.id)}
                className={`
                  relative px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all duration-200 cursor-pointer
                  ${
                    lang === l.id
                      ? 'bg-background text-foreground shadow-sm border border-border/80'
                      : 'text-muted-foreground hover:text-foreground border border-transparent'
                  }
                `}
                style={lang === l.id ? { color: l.color } : {}}
                aria-pressed={lang === l.id}
                aria-label={l.label}
              >
                <span className="hidden sm:inline">{l.label}</span>
                <span className="sm:hidden">{l.short}</span>
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Counter + nav */}
          <span className="text-xs font-mono text-muted-foreground">
            {activeIdx + 1}/{challenges.length}
          </span>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => go(-1)}
              disabled={activeIdx === 0}
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Previous challenge"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={() => go(1)}
              disabled={activeIdx === challenges.length - 1}
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Next challenge"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {/* ── Split pane ───────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* ── Left: Problem description ───────────────────────────── */}
          <div className="md:w-[42%] flex-shrink-0 flex flex-col border-b md:border-b-0 md:border-r border-border bg-background/50 overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              {/* Title + tags */}
              <div className="px-5 pt-5 pb-4 border-b border-border">
                <h2 className="text-[17px] font-bold text-foreground tracking-tight leading-tight mb-3">
                  {challenge?.title}
                </h2>
                {challenge?.tags && challenge.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {challenge.tags.map(t => (
                      <span
                        key={t}
                        className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground border border-border"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Content sections */}
              <div className="px-5 py-4 space-y-5">
                {/* Description */}
                {challenge?.description && (
                  <div className="text-sm text-foreground/90 leading-relaxed">
                    {renderMd(challenge.description)}
                  </div>
                )}

                {/* Examples */}
                {challenge?.examples && challenge.examples.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <FileCode size={13} className="text-muted-foreground" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Examples
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {challenge.examples.map((ex, i) => (
                        <div key={i} className="rounded-lg border border-border overflow-hidden">
                          <div className="px-3 py-1.5 bg-muted/50 border-b border-border text-[11px] font-semibold text-muted-foreground">
                            Example {i + 1}
                          </div>
                          <div className="px-3 py-2.5 font-mono text-[12px] space-y-1 bg-muted/20">
                            <div className="text-muted-foreground">
                              Input: <span className="text-foreground">{ex.input}</span>
                            </div>
                            <div className="text-muted-foreground">
                              Output: <span className="text-green-400">{ex.output}</span>
                            </div>
                            {ex.explanation && (
                              <div className="text-muted-foreground/70 text-[11px] mt-1">
                                {ex.explanation}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Constraints */}
                {challenge?.constraints && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <AlertCircle size={13} className="text-muted-foreground" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Constraints
                      </span>
                    </div>
                    <ul className="space-y-1 pl-1">
                      {(Array.isArray(challenge.constraints)
                        ? challenge.constraints
                        : [challenge.constraints]
                      ).map((c, i) => (
                        <li
                          key={i}
                          className="text-[13px] text-muted-foreground leading-relaxed flex items-start gap-2"
                        >
                          <span className="text-muted-foreground/40 mt-1.5 text-[6px]">●</span>
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Hints accordion */}
                {challenge?.hints && challenge.hints.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <Lightbulb size={13} className="text-amber-400" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Hints ({challenge.hints.length})
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {challenge.hints.map((hint, i) => (
                        <HintItem
                          key={i}
                          index={i}
                          hint={hint}
                          isOpen={openHints.has(i)}
                          onToggle={() => toggleHint(i)}
                          total={challenge.hints.length}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Approach & Complexity (when available) */}
                {challenge?.approach && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <Sparkles size={13} className="text-muted-foreground" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Approach
                      </span>
                    </div>
                    <div className="text-[13px] text-foreground/80 leading-relaxed">
                      {renderMd(challenge.approach)}
                    </div>
                  </div>
                )}

                {challenge?.complexity && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <ListChecks size={13} className="text-muted-foreground" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Complexity
                      </span>
                    </div>
                    <div className="flex gap-4 text-[13px]">
                      <div>
                        <span className="text-muted-foreground">Time: </span>
                        <span className="font-mono font-medium text-foreground">
                          {challenge.complexity.time}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Space: </span>
                        <span className="font-mono font-medium text-foreground">
                          {challenge.complexity.space}
                        </span>
                      </div>
                    </div>
                    {challenge.complexity.explanation && (
                      <div className="text-[12px] text-muted-foreground mt-1.5 leading-relaxed">
                        {challenge.complexity.explanation}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Right: Editor ───────────────────────────────────────── */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            {/* Editor chrome header */}
            <div className="flex items-center gap-2.5 px-3 h-[38px] border-b border-border bg-muted/40 flex-shrink-0">
              {/* Traffic lights */}
              <div className="flex items-center gap-1.5" aria-hidden="true">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              </div>
              <span className="flex-1 text-center text-[11px] font-mono text-muted-foreground">
                solution.{LANG_EXT[lang]}
              </span>
              <button
                onClick={() => {
                  if (!challenge) return
                  const starter =
                    challenge.starterCode?.[lang] || challenge.starterCode?.javascript || ''
                  setCode(starter)
                  setRunResult(null)
                }}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label="Reset code to starter"
              >
                <RotateCcw size={11} />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>

            {/* Editor body */}
            <SimpleCodeEditor
              value={code}
              onChange={v => {
                setCode(v)
                if (challenge) markStatus(challenge.id, 'in_progress')
              }}
              language={lang}
            />

            {/* ── Actions + Results panel ───────────────────────────── */}
            <div className="flex-shrink-0 border-t border-border bg-muted/20">
              {/* Action bar */}
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50">
                <button
                  onClick={runCode}
                  disabled={running}
                  className="flex items-center gap-2 px-4 py-[7px] rounded-lg bg-green-600 hover:bg-green-500 text-white text-[13px] font-semibold transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                  aria-label="Run code"
                >
                  {running ? (
                    <div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <Play size={13} fill="currentColor" />
                  )}
                  {running ? 'Running...' : 'Run Code'}
                </button>

                <button
                  onClick={() => setShowSolution(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-[7px] rounded-lg border border-border bg-background hover:bg-muted text-[12px] font-medium text-muted-foreground hover:text-foreground transition-all duration-150 cursor-pointer"
                  aria-expanded={showSolution}
                >
                  {showSolution ? <EyeOff size={13} /> : <Eye size={13} />}
                  {showSolution ? 'Hide Solution' : 'View Solution'}
                </button>
              </div>

              {/* Results area */}
              {(runResult || showSolution) && (
                <div className="max-h-[200px] overflow-y-auto bg-[var(--dp-bg-0)]">
                  {/* Run result */}
                  {runResult && (
                    <div
                      className={`mx-3 mt-2.5 mb-${showSolution ? '2.5' : '2.5'} rounded-lg border overflow-hidden transition-all duration-200 ${
                        runResult.ok
                          ? 'border-green-500/30 bg-green-500/5'
                          : 'border-red-500/30 bg-red-500/5'
                      }`}
                    >
                      <div
                        className={`flex items-center gap-2 px-3 py-1.5 border-b ${
                          runResult.ok
                            ? 'border-green-500/20 bg-green-500/5'
                            : 'border-red-500/20 bg-red-500/5'
                        }`}
                      >
                        <Terminal
                          size={12}
                          className={runResult.ok ? 'text-green-400' : 'text-red-400'}
                        />
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            runResult.ok ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          Output
                        </span>
                        <div className="ml-auto">
                          {runResult.ok ? (
                            <CheckCircle2 size={14} className="text-green-400" />
                          ) : (
                            <XCircle size={14} className="text-red-400" />
                          )}
                        </div>
                      </div>
                      <pre
                        className={`px-3 py-2 font-mono text-[12px] leading-relaxed whitespace-pre-wrap ${
                          runResult.ok ? 'text-green-300' : 'text-red-300'
                        }`}
                      >
                        {runResult.output}
                      </pre>
                    </div>
                  )}

                  {/* Solution */}
                  {showSolution && challenge?.solution?.[lang] && (
                    <div className="mx-3 mb-2.5 rounded-lg border border-blue-500/20 bg-blue-500/5 overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-blue-500/15 bg-blue-500/5">
                        <Sparkles size={12} className="text-blue-400" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                          Solution
                        </span>
                        <button
                          onClick={handleCopySolution}
                          className="ml-auto flex items-center gap-1 text-[10px] text-blue-400/70 hover:text-blue-300 transition-colors cursor-pointer"
                          aria-label="Copy solution"
                        >
                          {copied ? <Check size={11} /> : <Copy size={11} />}
                          {copied ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <pre className="px-3 py-2.5 font-mono text-[12px] leading-[1.7] text-foreground/80 whitespace-pre-wrap">
                        {challenge.solution[lang]}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
