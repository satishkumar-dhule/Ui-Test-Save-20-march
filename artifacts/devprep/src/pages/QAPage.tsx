import { useState, useEffect, useRef, useCallback } from 'react'
import { useAnnounce, SkipLink, LiveRegion } from '@/hooks/useAnnounce'
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Search,
  Menu,
  Copy,
  Check,
  MessageSquare,
  X,
  ArrowUp,
  Eye,
  Clock,
  Tag,
} from 'lucide-react'
import type { Question, AnswerSection } from '@/data/questions'
import type { ReactElement } from 'react'
import { sanitizeSVG } from '@/lib/security'
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { progressApi } from '@/services/progressApi'

const DIFF_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  beginner: { label: 'Beginner', color: '#3fb950', bg: 'rgba(63,185,80,0.1)', border: 'rgba(63,185,80,0.25)' },
  intermediate: { label: 'Intermediate', color: '#f7a843', bg: 'rgba(247,168,67,0.1)', border: 'rgba(247,168,67,0.25)' },
  advanced: { label: 'Advanced', color: '#ff7b72', bg: 'rgba(255,123,114,0.1)', border: 'rgba(255,123,114,0.25)' },
}

function DiffBadge({ level }: { level: string }) {
  const c = DIFF_CONFIG[level] ?? { label: level, color: 'var(--dp-text-3)', bg: 'var(--dp-bg-3)', border: 'var(--dp-border-1)' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
      padding: '2px 8px', borderRadius: 'var(--dp-r-full)',
      color: c.color, background: c.bg, border: `1px solid ${c.border}`,
    }}>
      {c.label}
    </span>
  )
}

function renderMarkdown(text: string): ReactElement {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return (
    <span>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**'))
          return <strong key={i} style={{ color: 'var(--dp-text-0)', fontWeight: 600 }}>{p.slice(2, -2)}</strong>
        if (p.startsWith('`') && p.endsWith('`'))
          return (
            <code key={i} style={{
              padding: '1px 6px', borderRadius: 4, fontSize: '0.9em',
              fontFamily: "'SF Mono','Fira Code',monospace",
              background: 'var(--dp-bg-3)', color: '#a5d6ff',
              border: '1px solid var(--dp-border-1)',
            }}>
              {p.slice(1, -1)}
            </code>
          )
        return <span key={i}>{p}</span>
      })}
    </span>
  )
}

function MarkdownBlock({ content }: { content: string }) {
  return (
    <div style={{ fontSize: 14, color: 'var(--dp-text-1)', lineHeight: 1.7 }}>
      {content.split('\n\n').map((para, i) => (
        <p key={i} style={{ marginBottom: 8 }}>{renderMarkdown(para)}</p>
      ))}
    </div>
  )
}

function CodeBlock({ language, content, filename }: { language: string; content: string; filename?: string }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const highlighted = content.split('\n').map((line, li) => {
    const tokens = line.split(
      /(\b(?:const|let|var|function|return|if|else|for|while|class|async|await|import|export|from|new|typeof|instanceof|of|in|default|throw|try|catch|finally|=>|null|undefined|true|false)\b|"[^"]*"|'[^']*'|`[^`]*`|\/\/.*$|\d+)/g
    )
    return (
      <div key={li} style={{ minHeight: '1.6em' }}>
        {tokens.map((tok, ti) => {
          if (/^(const|let|var|function|return|if|else|for|while|class|async|await|import|export|from|new|typeof|instanceof|of|in|default|throw|try|catch|finally)$/.test(tok))
            return <span key={ti} className="dp-token-kw">{tok}</span>
          if (/^(null|undefined|true|false)$/.test(tok))
            return <span key={ti} className="dp-token-bool">{tok}</span>
          if (/^\d+$/.test(tok))
            return <span key={ti} className="dp-token-num">{tok}</span>
          if (/^("|'|`)/.test(tok))
            return <span key={ti} className="dp-token-str">{tok}</span>
          if (tok.startsWith('//'))
            return <span key={ti} className="dp-token-comment">{tok}</span>
          return <span key={ti}>{tok}</span>
        })}
      </div>
    )
  })

  return (
    <div className="dp-code-block">
      <div className="dp-code-header">
        <div className="dp-code-dots">
          <div className="dp-code-dot" style={{ background: '#ff5f57' }} />
          <div className="dp-code-dot" style={{ background: '#ffbd2e' }} />
          <div className="dp-code-dot" style={{ background: '#28c840' }} />
        </div>
        <span className="dp-code-filename">{filename || language}</span>
        <button className="dp-code-copy" data-testid="code-copy-btn" onClick={copy}>
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="dp-code-pre">{highlighted}</pre>
    </div>
  )
}

function SectionChip({ type }: { type: string }) {
  const configs: Record<string, { label: string; color: string }> = {
    short: { label: 'Answer', color: 'var(--dp-blue)' },
    code: { label: 'Code', color: '#f7df1e' },
    diagram: { label: 'Diagram', color: 'var(--dp-purple)' },
    video: { label: 'Video', color: 'var(--dp-red)' },
    related: { label: 'Related', color: 'var(--dp-green)' },
    eli5: { label: 'ELI5', color: 'var(--dp-orange)' },
  }
  const c = configs[type] ?? { label: type, color: 'var(--dp-text-3)' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em',
      padding: '2px 9px', borderRadius: 'var(--dp-r-full)', marginBottom: 10,
      color: c.color, background: c.color + '15', border: `1px solid ${c.color}33`,
    }}>
      {c.label}
    </span>
  )
}

function SectionBlock({ section }: { section: AnswerSection }) {
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [relOpen, setRelOpen] = useState(true)

  if (section.type === 'short')
    return (
      <div>
        <SectionChip type="short" />
        <MarkdownBlock content={section.content} />
      </div>
    )

  if (section.type === 'code')
    return (
      <div>
        <SectionChip type="code" />
        <CodeBlock language={section.language} content={section.content} filename={section.filename} />
      </div>
    )

  if (section.type === 'diagram')
    return (
      <div>
        <SectionChip type="diagram" />
        <div style={{
          borderRadius: 'var(--dp-r-lg)', overflow: 'hidden',
          border: '1px solid var(--dp-border-0)', background: 'var(--dp-bg-1)',
        }}>
          <div style={{
            padding: '10px 14px', borderBottom: '1px solid var(--dp-border-1)',
            background: 'var(--dp-bg-2)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--dp-text-0)' }}>{section.title}</div>
            <div style={{ fontSize: 11, color: 'var(--dp-text-2)', marginTop: 2 }}>{section.description}</div>
          </div>
          <div
            style={{ padding: 16, display: 'flex', justifyContent: 'center', background: 'var(--dp-bg-1)' }}
            dangerouslySetInnerHTML={{ __html: sanitizeSVG(section.svgContent) }}
          />
        </div>
      </div>
    )

  if (section.type === 'video')
    return (
      <div>
        <SectionChip type="video" />
        {!videoLoaded ? (
          <button
            onClick={() => setVideoLoaded(true)}
            style={{
              width: '100%', height: 140, borderRadius: 'var(--dp-r-lg)',
              border: '1px solid var(--dp-border-1)', background: 'var(--dp-bg-2)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 10, cursor: 'pointer',
              transition: 'background var(--dp-dur-fast)',
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'rgba(255,123,114,0.15)', border: '1px solid rgba(255,123,114,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>▶</div>
            <span style={{ fontSize: 13, color: 'var(--dp-text-0)', fontWeight: 500 }}>{section.title}</span>
            <span style={{ fontSize: 11, color: 'var(--dp-text-3)' }}>Click to load</span>
          </button>
        ) : (
          <iframe src={section.url} title={section.title}
            style={{ width: '100%', height: 240, borderRadius: 'var(--dp-r-lg)', border: '1px solid var(--dp-border-0)' }}
            allowFullScreen />
        )}
      </div>
    )

  if (section.type === 'related')
    return (
      <div>
        <SectionChip type="related" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
          {(section.topics || []).map((t, i) => (
            <div key={i} style={{
              padding: '10px 12px', borderRadius: 'var(--dp-r-md)',
              border: '1px solid var(--dp-border-1)', background: 'var(--dp-bg-2)',
              transition: 'all var(--dp-dur-fast)',
            }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--dp-text-0)', marginBottom: 3 }}>{t.title}</div>
              <div style={{ fontSize: 11.5, color: 'var(--dp-text-2)', lineHeight: 1.4 }}>{t.description}</div>
              <span style={{
                display: 'inline-block', marginTop: 6, fontSize: 10,
                padding: '1px 6px', borderRadius: 3,
                background: 'var(--dp-bg-3)', color: 'var(--dp-text-3)',
                fontFamily: 'monospace',
              }}>{t.tag}</span>
            </div>
          ))}
        </div>
      </div>
    )

  if (section.type === 'eli5')
    return (
      <div>
        <SectionChip type="eli5" />
        <div style={{
          padding: '14px 16px', borderRadius: 'var(--dp-r-lg)',
          border: '1px solid rgba(247,168,67,0.2)',
          background: 'rgba(247,168,67,0.06)',
        }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>🧒</span>
            <MarkdownBlock content={section.content} />
          </div>
        </div>
      </div>
    )

  return null
}

interface QAPageProps {
  questions: Question[]
  channelId: string
  onQuestionAnswered?: (questionId: string) => void
  isLoading?: boolean
}

export function QAPage({ questions, channelId, onQuestionAnswered, isLoading = false }: QAPageProps) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [search, setSearch] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [viewed, setViewed] = useState<Record<string, boolean>>(
    () => {
      const data = progressApi.loadSync()
      const out: Record<string, boolean> = {}
      Object.entries(data.qa).forEach(([id, v]) => { if (v.answered) out[id] = true })
      return out
    }
  )
  const contentRef = useRef<HTMLDivElement>(null)
  const { announce } = useAnnounce()

  const filtered = search.trim()
    ? questions.filter(q =>
        q.title?.toLowerCase().includes(search.toLowerCase()) ||
        q.tags?.some(t => t.includes(search.toLowerCase()))
      )
    : questions

  const active = filtered[activeIdx]

  useEffect(() => {
    setActiveIdx(0)
    const data = progressApi.loadSync()
    const out: Record<string, boolean> = {}
    Object.entries(data.qa).forEach(([id, v]) => { if (v.answered) out[id] = true })
    setViewed(out)
  }, [channelId])

  useEffect(() => {
    if (!active) return
    onQuestionAnswered?.(active.id)
    setViewed(prev => {
      if (prev[active.id]) return prev
      const next = { ...prev, [active.id]: true }
      progressApi.saveQA(channelId, active.id, true, false)
      return next
    })
  }, [activeIdx, active, channelId, onQuestionAnswered])

  const go = useCallback((dir: 1 | -1) => {
    setActiveIdx(i => Math.max(0, Math.min(filtered.length - 1, i + dir)))
    setTimeout(() => {
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      announce(`Question ${activeIdx + dir + 1} of ${filtered.length}`)
    }, 50)
  }, [filtered.length, activeIdx, announce])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'h') go(-1)
      if (e.key === 'ArrowRight' || e.key === 'l') go(1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [go])

  if (isLoading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid var(--dp-border-0)', borderTopColor: 'var(--dp-blue)', animation: 'dp-spin 0.8s linear infinite' }} />
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="dp-empty">
        <div className="dp-empty-icon"><MessageSquare size={24} /></div>
        <div className="dp-empty-title">No questions yet</div>
        <div className="dp-empty-desc">Switch to a different channel or add more channels to get started.</div>
      </div>
    )
  }

  return (
    <div className="study-page">
      <SkipLink targetId="qa-content">Skip to content</SkipLink>
      <LiveRegion />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="mobile-overlay md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Left panel */}
      <div
        className={`study-panel${sidebarOpen ? ' study-panel--mobile-open' : ''}`}
        style={sidebarOpen ? {
          position: 'fixed', top: 0, left: 0, height: '100%', zIndex: 50,
          display: 'flex', width: 270,
          background: 'var(--dp-bg-0)',
        } : {}}
      >
        <div className="study-panel-header">
          <BookOpen size={13} style={{ color: 'var(--dp-text-3)' }} />
          <span className="study-panel-title">Questions</span>
          <span className="study-panel-count">{filtered.length}</span>
          {sidebarOpen && (
            <button onClick={() => setSidebarOpen(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dp-text-3)' }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Search within panel */}
        <div style={{ padding: '8px 8px 4px', flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <Search size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--dp-text-3)', pointerEvents: 'none' }} />
            <input
              data-testid="qa-search"
              value={search}
              onChange={e => { setSearch(e.target.value); setActiveIdx(0) }}
              placeholder="Filter questions..."
              style={{
                width: '100%', padding: '6px 10px 6px 28px', fontSize: 12,
                background: 'var(--dp-bg-3)', border: '1px solid var(--dp-border-1)',
                borderRadius: 'var(--dp-r-md)', color: 'var(--dp-text-0)', outline: 'none',
              }}
            />
          </div>
        </div>

        <div className="study-panel-list" role="list">
          {filtered.map((q, i) => {
            const diff = q.difficulty ?? 'unknown'
            const diffColor = DIFF_CONFIG[diff]?.color ?? 'var(--dp-text-3)'
            return (
              <button
                key={q.id ?? String(i)}
                data-testid={`qa-sidebar-item-${q.id ?? i}`}
                role="listitem"
                className={`study-panel-item${i === activeIdx ? ' study-panel-item--active' : ''}`}
                onClick={() => { setActiveIdx(i); setSidebarOpen(false) }}
                aria-current={i === activeIdx ? 'true' : undefined}
              >
                <div className="study-panel-item-meta">
                  <span className="study-panel-item-num">#{q.number ?? i + 1}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: diffColor }}>
                    {diff.slice(0, 3)}
                  </span>
                  {viewed[q.id] && (
                    <span title="Viewed" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--dp-green)', flexShrink: 0, display: 'inline-block' }} />
                  )}
                </div>
                <div className="study-panel-item-title">{q.title}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Toolbar */}
        <div className="study-toolbar" role="toolbar" aria-label="Question navigation">
          <button
            data-testid="qa-mob-menu"
            aria-label="Open question list"
            onClick={() => setSidebarOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: 'var(--dp-r-md)',
              border: '1px solid var(--dp-border-1)', background: 'var(--dp-bg-2)',
              color: 'var(--dp-text-2)', cursor: 'pointer',
            }}
            className="md:hidden"
          >
            <Menu size={15} />
          </button>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
            {active?.difficulty && <DiffBadge level={active.difficulty} />}
            {active?.votes != null && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--dp-text-3)' }}>
                <ArrowUp size={11} />{active.votes}
              </span>
            )}
            {active?.views && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--dp-text-3)' }}>
                <Eye size={11} />{active.views}
              </span>
            )}
          </div>

          <span style={{ fontSize: 12, color: 'var(--dp-text-2)', whiteSpace: 'nowrap' }}>
            {activeIdx + 1} / {filtered.length}
          </span>

          <button
            onClick={() => go(-1)}
            disabled={activeIdx === 0}
            aria-label="Previous question"
            className="study-toolbar-nav"
          >
            <ChevronLeft size={13} />
          </button>
          <button
            onClick={() => go(1)}
            disabled={activeIdx === filtered.length - 1}
            aria-label="Next question"
            className="study-toolbar-nav"
          >
            <ChevronRight size={13} />
          </button>
        </div>

        {/* Content */}
        <div
          ref={contentRef}
          id="qa-content"
          tabIndex={-1}
          style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          {active ? (
            <>
              {/* Question header card */}
              <div style={{
                background: 'var(--dp-glass-1)', border: '1px solid var(--dp-border-0)',
                borderRadius: 'var(--dp-r-xl)', padding: '20px 22px',
                backdropFilter: 'blur(10px)',
              }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {active.difficulty && <DiffBadge level={active.difficulty} />}
                  {(active.sections || []).map((s, i) => (
                    <span key={i} style={{
                      fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
                      padding: '2px 7px', borderRadius: 'var(--dp-r-full)',
                      background: 'var(--dp-bg-3)', color: 'var(--dp-text-3)',
                      border: '1px solid var(--dp-border-1)',
                    }}>{s.type}</span>
                  ))}
                </div>

                <h1 style={{
                  fontSize: 18, fontWeight: 700, color: 'var(--dp-text-0)',
                  lineHeight: 1.45, marginBottom: 14, letterSpacing: '-0.2px',
                }}>
                  {active.title}
                </h1>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {(active.tags || []).slice(0, 6).map(t => (
                      <span key={t} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                        fontSize: 10.5, padding: '2px 7px', borderRadius: 'var(--dp-r-xs)',
                        background: 'var(--dp-bg-3)', color: 'var(--dp-text-2)',
                        fontFamily: 'monospace', border: '1px solid var(--dp-border-1)',
                      }}>
                        <Tag size={8} />{t}
                      </span>
                    ))}
                  </div>

                  {active.askedAt && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--dp-text-3)', marginLeft: 'auto' }}>
                      <Clock size={10} />{active.askedAt}
                    </span>
                  )}
                </div>
              </div>

              {/* Answer sections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {(active.sections || []).map((s, i) => (
                  <div key={i} style={{
                    background: 'var(--dp-glass-1)', border: '1px solid var(--dp-border-0)',
                    borderRadius: 'var(--dp-r-xl)', padding: '18px 20px',
                    backdropFilter: 'blur(10px)',
                  }}>
                    <SectionBlock section={s} />
                  </div>
                ))}
              </div>

              {/* Navigation bottom */}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 24 }}>
                <button
                  onClick={() => go(-1)}
                  disabled={activeIdx === 0}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 'var(--dp-r-md)',
                    border: '1px solid var(--dp-border-1)', background: 'var(--dp-bg-2)',
                    color: 'var(--dp-text-2)', fontSize: 13, cursor: 'pointer',
                    opacity: activeIdx === 0 ? 0.4 : 1,
                    transition: 'all var(--dp-dur-fast)',
                  }}
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <button
                  onClick={() => go(1)}
                  disabled={activeIdx === filtered.length - 1}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 'var(--dp-r-md)',
                    border: '1px solid var(--dp-blue-dim)', background: 'var(--dp-blue-dim)',
                    color: 'var(--dp-blue)', fontSize: 13, cursor: 'pointer',
                    opacity: activeIdx === filtered.length - 1 ? 0.4 : 1,
                    transition: 'all var(--dp-dur-fast)',
                  }}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </>
          ) : (
            <div className="dp-empty">
              <div className="dp-empty-title">No results</div>
              <div className="dp-empty-desc">Try a different search term.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
