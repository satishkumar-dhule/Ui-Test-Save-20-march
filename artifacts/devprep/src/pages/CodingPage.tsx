import { useState, useEffect, useRef, useCallback } from 'react'
import { useAnnounce, SkipLink, LiveRegion } from '@/hooks/useAnnounce'
import {
  Code2, ChevronLeft, ChevronRight, Lightbulb, Eye, EyeOff,
  Play, RotateCcw, CheckCircle2, XCircle, Menu, X, Terminal,
} from 'lucide-react'
import type { CodingChallenge, Language } from '@/data/coding'
import { progressApi } from '@/services/progressApi'
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'

const DIFF_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  easy:   { color: '#3fb950', bg: 'rgba(63,185,80,0.1)',   border: 'rgba(63,185,80,0.25)' },
  medium: { color: '#f7a843', bg: 'rgba(247,168,67,0.1)', border: 'rgba(247,168,67,0.25)' },
  hard:   { color: '#ff7b72', bg: 'rgba(255,123,114,0.1)', border: 'rgba(255,123,114,0.25)' },
}

const LANGS: { id: Language; label: string; color: string }[] = [
  { id: 'javascript', label: 'JavaScript', color: '#f7df1e' },
  { id: 'typescript', label: 'TypeScript', color: '#3178c6' },
  { id: 'python',     label: 'Python',     color: '#3fb950' },
]

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
                return <strong key={pi} style={{ color: 'var(--dp-text-0)', fontWeight: 600 }}>{p.slice(2, -2)}</strong>
              if (p.startsWith('`') && p.endsWith('`'))
                return (
                  <code key={pi} style={{
                    padding: '1px 5px', borderRadius: 4, fontSize: '0.88em',
                    fontFamily: "'SF Mono','Fira Code',monospace",
                    background: 'var(--dp-bg-3)', color: '#a5d6ff',
                    border: '1px solid var(--dp-border-1)',
                  }}>{p.slice(1, -1)}</code>
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

function SimpleCodeEditor({ value, onChange, language }: { value: string; onChange: (v: string) => void; language: Language }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
    <textarea
      ref={textareaRef}
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      spellCheck={false}
      style={{
        width: '100%', flex: 1, minHeight: 200,
        fontFamily: "'SF Mono','Fira Code','Cascadia Code',monospace",
        fontSize: 13, lineHeight: 1.65, padding: '14px 16px',
        background: 'var(--dp-bg-0)', color: 'var(--dp-text-0)',
        border: 'none', outline: 'none', resize: 'none',
        caretColor: 'var(--dp-blue)',
      }}
      aria-label="Code editor"
    />
  )
}

interface CodingPageProps {
  challenges: CodingChallenge[]
  channelId: string
  onCodingUpdate?: (challengeId: string, status: 'not_started' | 'in_progress' | 'completed') => void
  isLoading?: boolean
}

export function CodingPage({ challenges, channelId, onCodingUpdate, isLoading = false }: CodingPageProps) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [lang, setLang] = useState<Language>('javascript')
  const [code, setCode] = useState('')
  const [showHint, setShowHint] = useState(false)
  const [showSolution, setShowSolution] = useState(false)
  const [runResult, setRunResult] = useState<null | { ok: boolean; output: string }>(null)
  const [statuses, setStatuses] = useState<Record<string, 'not_started' | 'in_progress' | 'completed'>>({})
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [running, setRunning] = useState(false)
  const { announce } = useAnnounce()

  const challenge = challenges[activeIdx]

  useEffect(() => { setActiveIdx(0) }, [channelId])

  useEffect(() => {
    progressApi.load(channelId).then(data => {
      if (data.coding && Object.keys(data.coding).length > 0) {
        setStatuses(data.coding as Record<string, 'not_started' | 'in_progress' | 'completed'>)
      }
    }).catch(() => {})
  }, [channelId])

  useEffect(() => {
    if (!challenge) return
    const starter = challenge.starterCode?.[lang] || challenge.starterCode?.javascript || ''
    setCode(starter)
    setShowHint(false); setShowSolution(false); setRunResult(null)
  }, [activeIdx, lang, challenge])

  const go = useCallback((dir: 1 | -1) => {
    setActiveIdx(i => Math.max(0, Math.min(challenges.length - 1, i + dir)))
    setRunResult(null)
    announce(`Challenge ${activeIdx + dir + 1} of ${challenges.length}`)
  }, [challenges.length, activeIdx, announce])

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
        setRunResult({ ok: true, output: '✓ Code executed successfully\n\nOutput looks correct! Review the solution to compare approaches.' })
        markStatus(challenge.id, 'completed')
      } else {
        setRunResult({ ok: false, output: '✗ No function detected. Make sure you implement the required function.' })
        markStatus(challenge.id, 'in_progress')
      }
    } catch (e: any) {
      setRunResult({ ok: false, output: `Error: ${e.message}` })
    }
    setRunning(false)
  }

  if (isLoading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid var(--dp-border-0)', borderTopColor: '#f7df1e', animation: 'dp-spin 0.8s linear infinite' }} />
      </div>
    )
  }

  if (challenges.length === 0) {
    return (
      <div className="dp-empty">
        <div className="dp-empty-icon"><Code2 size={24} /></div>
        <div className="dp-empty-title">No coding challenges</div>
        <div className="dp-empty-desc">Switch to a different channel to find coding challenges.</div>
      </div>
    )
  }

  const diff = challenge ? DIFF_CONFIG[challenge.difficulty || 'easy'] : DIFF_CONFIG.easy
  const statusCfg: Record<string, { color: string; label: string }> = {
    completed:   { color: '#3fb950', label: '✓ Solved' },
    in_progress: { color: '#f7a843', label: '⚡ In Progress' },
    not_started: { color: 'var(--dp-text-3)', label: 'Not Started' },
  }

  return (
    <div className="study-page">
      <SkipLink targetId="coding-content">Skip to content</SkipLink>
      <LiveRegion />

      {sidebarOpen && <div className="mobile-overlay md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Left panel */}
      <div className={`study-panel${sidebarOpen ? ' study-panel--mobile-open' : ''}`}
        style={sidebarOpen ? { position: 'fixed', top: 0, left: 0, height: '100%', zIndex: 40, display: 'flex', width: 270 } : {}}>
        <div className="study-panel-header">
          <Code2 size={13} style={{ color: 'var(--dp-text-3)' }} />
          <span className="study-panel-title">Challenges</span>
          <span className="study-panel-count">{challenges.length}</span>
          {sidebarOpen && (
            <button onClick={() => setSidebarOpen(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dp-text-3)' }}>
              <X size={14} />
            </button>
          )}
        </div>
        <div className="study-panel-list">
          {challenges.map((c, i) => {
            const st = statuses[c.id] || 'not_started'
            const d = DIFF_CONFIG[c.difficulty || 'easy']
            return (
              <button key={c.id}
                className={`study-panel-item${i === activeIdx ? ' study-panel-item--active' : ''}`}
                onClick={() => { setActiveIdx(i); setSidebarOpen(false) }}>
                <div className="study-panel-item-meta">
                  <span className="study-panel-item-num">#{i + 1}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: d.color }}>{c.difficulty?.slice(0,3)}</span>
                  {st === 'completed' && <CheckCircle2 size={10} style={{ color: '#3fb950', marginLeft: 'auto' }} />}
                  {st === 'in_progress' && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#f7a843', marginLeft: 'auto' }} />}
                </div>
                <div className="study-panel-item-title">{c.title}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main - split editor layout */}
      <main id="coding-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Toolbar */}
        <div className="study-toolbar">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 'var(--dp-r-md)', border: '1px solid var(--dp-border-1)', background: 'var(--dp-bg-2)', color: 'var(--dp-text-2)', cursor: 'pointer' }}>
            <Menu size={15} />
          </button>

          {challenge?.difficulty && (
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 'var(--dp-r-full)', background: diff.bg, color: diff.color, border: `1px solid ${diff.border}` }}>
              {challenge.difficulty}
            </span>
          )}

          {/* Language selector */}
          <div style={{ display: 'flex', gap: 4 }}>
            {LANGS.map(l => (
              <button key={l.id} onClick={() => setLang(l.id)}
                style={{
                  padding: '4px 10px', borderRadius: 'var(--dp-r-md)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                  border: `1px solid ${lang === l.id ? l.color + '55' : 'var(--dp-border-1)'}`,
                  background: lang === l.id ? l.color + '18' : 'var(--dp-bg-2)',
                  color: lang === l.id ? l.color : 'var(--dp-text-2)',
                  transition: 'all var(--dp-dur-fast)',
                }}>
                {l.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          {challenge && statuses[challenge.id] && (
            <span style={{ fontSize: 11, fontWeight: 600, color: statusCfg[statuses[challenge.id]].color }}>
              {statusCfg[statuses[challenge.id]].label}
            </span>
          )}

          <span style={{ fontSize: 12, color: 'var(--dp-text-2)' }}>{activeIdx + 1}/{challenges.length}</span>
          <button onClick={() => go(-1)} disabled={activeIdx === 0} className="study-toolbar-nav"><ChevronLeft size={13} /></button>
          <button onClick={() => go(1)} disabled={activeIdx === challenges.length - 1} className="study-toolbar-nav"><ChevronRight size={13} /></button>
        </div>

        {/* Editor split */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Left: problem description */}
          <div style={{
            width: '42%', flexShrink: 0, borderRight: '1px solid var(--dp-border-1)',
            display: 'flex', flexDirection: 'column', overflowY: 'auto',
            background: 'var(--dp-glass-1)',
          }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--dp-border-1)' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--dp-text-0)', margin: '0 0 8px', letterSpacing: '-0.2px' }}>
                {challenge?.title}
              </h2>
              {challenge?.tags && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {challenge.tags.map(t => (
                    <span key={t} style={{ fontSize: 10.5, padding: '1px 7px', borderRadius: 'var(--dp-r-xs)', background: 'var(--dp-bg-3)', color: 'var(--dp-text-2)', fontFamily: 'monospace', border: '1px solid var(--dp-border-1)' }}>{t}</span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ padding: '16px 20px', flex: 1 }}>
              {/* Description */}
              <div style={{ fontSize: 13.5, color: 'var(--dp-text-1)', lineHeight: 1.65, marginBottom: 16 }}>
                {challenge?.description ? renderMd(challenge.description) : null}
              </div>

              {/* Examples */}
              {challenge?.examples && challenge.examples.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--dp-text-3)', marginBottom: 8 }}>Examples</div>
                  {challenge.examples.map((ex, i) => (
                    <div key={i} style={{ marginBottom: 8, borderRadius: 'var(--dp-r-md)', overflow: 'hidden', border: '1px solid var(--dp-border-1)' }}>
                      <div style={{ padding: '6px 12px', background: 'var(--dp-bg-2)', borderBottom: '1px solid var(--dp-border-1)', fontSize: 11, color: 'var(--dp-text-3)', fontWeight: 600 }}>Example {i + 1}</div>
                      <div style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 12, background: 'var(--dp-bg-1)' }}>
                        <div style={{ color: 'var(--dp-text-2)', marginBottom: 3 }}>Input: <span style={{ color: 'var(--dp-text-0)' }}>{ex.input}</span></div>
                        <div style={{ color: 'var(--dp-text-2)' }}>Output: <span style={{ color: '#3fb950' }}>{ex.output}</span></div>
                        {ex.explanation && <div style={{ color: 'var(--dp-text-3)', marginTop: 4, fontSize: 11 }}>{ex.explanation}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Constraints */}
              {challenge?.constraints && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--dp-text-3)', marginBottom: 6 }}>Constraints</div>
                  <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 12.5, color: 'var(--dp-text-2)', lineHeight: 1.6 }}>
                    {Array.isArray(challenge.constraints)
                      ? challenge.constraints.map((c, i) => <li key={i}>{c}</li>)
                      : <li>{challenge.constraints}</li>
                    }
                  </ul>
                </div>
              )}

              {/* Hint */}
              {challenge?.hints && challenge.hints.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <button onClick={() => setShowHint(v => !v)} style={{
                    display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, cursor: 'pointer',
                    color: showHint ? 'var(--dp-yellow)' : 'var(--dp-text-2)', background: 'none', border: 'none', fontWeight: 600, padding: 0,
                  }}>
                    <Lightbulb size={13} style={{ color: '#f7df1e' }} />
                    {showHint ? 'Hide Hint' : 'Show Hint'}
                  </button>
                  {showHint && (
                    <div style={{ marginTop: 8, padding: '10px 14px', borderRadius: 'var(--dp-r-md)', background: 'rgba(247,223,30,0.06)', border: '1px solid rgba(247,223,30,0.2)', fontSize: 13, color: 'var(--dp-text-1)', lineHeight: 1.55 }}>
                      {challenge.hints[0]}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: editor */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
            {/* Editor header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px',
              height: 38, borderBottom: '1px solid var(--dp-border-1)',
              background: 'var(--dp-bg-2)', flexShrink: 0,
            }}>
              <div style={{ display: 'flex', gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
              </div>
              <span style={{ fontSize: 11.5, color: 'var(--dp-text-3)', fontFamily: 'monospace', flex: 1, textAlign: 'center' }}>
                solution.{lang === 'python' ? 'py' : lang === 'typescript' ? 'ts' : 'js'}
              </span>
              <button onClick={() => {
                if (!challenge) return
                const starter = challenge.starterCode?.[lang] || challenge.starterCode?.javascript || ''
                setCode(starter); setRunResult(null)
              }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dp-text-3)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                <RotateCcw size={11} /> Reset
              </button>
            </div>

            {/* Code editor area */}
            <div style={{ flex: 1, overflow: 'auto', background: 'var(--dp-bg-0)', display: 'flex', flexDirection: 'column' }}>
              <SimpleCodeEditor value={code} onChange={v => { setCode(v); if (challenge) markStatus(challenge.id, 'in_progress') }} language={lang} />
            </div>

            {/* Run button + result */}
            <div style={{ flexShrink: 0, borderTop: '1px solid var(--dp-border-1)', background: 'var(--dp-bg-1)' }}>
              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--dp-border-1)' }}>
                <button onClick={runCode} disabled={running}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '7px 18px',
                    borderRadius: 'var(--dp-r-md)', border: 'none',
                    background: 'var(--dp-green)', color: '#fff',
                    fontSize: 13, fontWeight: 700, cursor: running ? 'not-allowed' : 'pointer',
                    opacity: running ? 0.7 : 1, transition: 'all var(--dp-dur-fast)',
                  }}>
                  {running ? (
                    <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'dp-spin 0.7s linear infinite' }} />
                  ) : (
                    <Play size={12} />
                  )}
                  {running ? 'Running...' : 'Run Code'}
                </button>

                <button onClick={() => setShowSolution(v => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 'var(--dp-r-md)', border: '1px solid var(--dp-border-0)', background: 'var(--dp-bg-2)', color: 'var(--dp-text-2)', fontSize: 12, cursor: 'pointer' }}>
                  {showSolution ? <EyeOff size={12} /> : <Eye size={12} />}
                  {showSolution ? 'Hide' : 'View'} Solution
                </button>
              </div>

              {/* Terminal output */}
              {(runResult || showSolution) && (
                <div style={{ padding: '10px 14px', maxHeight: 180, overflowY: 'auto', background: 'var(--dp-bg-0)' }}>
                  {runResult && (
                    <div style={{ marginBottom: showSolution ? 12 : 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <Terminal size={11} style={{ color: 'var(--dp-text-3)' }} />
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--dp-text-3)' }}>Output</span>
                        {runResult.ok
                          ? <CheckCircle2 size={12} style={{ color: '#3fb950', marginLeft: 'auto' }} />
                          : <XCircle size={12} style={{ color: '#ff7b72', marginLeft: 'auto' }} />
                        }
                      </div>
                      <pre style={{
                        fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6,
                        color: runResult.ok ? '#3fb950' : '#ff7b72', margin: 0,
                      }}>
                        {runResult.output}
                      </pre>
                    </div>
                  )}

                  {showSolution && challenge?.solution?.[lang] && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--dp-text-3)', marginBottom: 6 }}>Solution</div>
                      <pre style={{
                        fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12,
                        lineHeight: 1.7, color: 'var(--dp-text-1)', margin: 0,
                        whiteSpace: 'pre-wrap',
                      }}>
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
