import { useState, useEffect, useRef, useCallback } from 'react'
import { BookOpen, ChevronLeft, ChevronRight, Search, Menu, Copy, Check } from 'lucide-react'
import type { Question, AnswerSection } from '@/data/questions'
import { channels } from '@/data/channels'
import type { ReactElement } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { sanitizeSVG } from '@/lib/security'

const DIFF_COLOR: Record<string, string> = {
  beginner: 'hsl(var(--chart-2))',
  intermediate: 'hsl(var(--chart-3))',
  advanced: 'hsl(var(--chart-5))',
}

const SECTION_COLORS: Record<string, string> = {
  short: 'hsl(var(--primary))',
  code: 'hsl(var(--chart-3))',
  diagram: 'hsl(var(--chart-4))',
  video: 'hsl(var(--chart-5))',
  related: 'hsl(var(--chart-2))',
  eli5: 'hsl(var(--chart-3))',
}

function renderMarkdown(text: string): ReactElement {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return (
    <span>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) {
          return (
            <strong key={i} className="text-foreground font-semibold">
              {p.slice(2, -2)}
            </strong>
          )
        }
        if (p.startsWith('`') && p.endsWith('`')) {
          return (
            <code
              key={i}
              className="px-1 py-0.5 rounded text-xs font-mono"
              style={{
                background: 'hsl(var(--muted))',
                color: 'hsl(var(--chart-1))',
              }}
            >
              {p.slice(1, -1)}
            </code>
          )
        }
        return <span key={i}>{p}</span>
      })}
    </span>
  )
}

function MarkdownBlock({ content }: { content: string }) {
  return (
    <div className="text-sm text-foreground leading-relaxed space-y-2">
      {content.split('\n\n').map((para, i) => (
        <p key={i}>{renderMarkdown(para)}</p>
      ))}
    </div>
  )
}

function CodeBlock({
  language,
  content,
  filename,
}: {
  language: string
  content: string
  filename?: string
}) {
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
      <div key={li} className="min-h-[1.5em]">
        {tokens.map((tok, ti) => {
          if (
            /^(const|let|var|function|return|if|else|for|while|class|async|await|import|export|from|new|typeof|instanceof|of|in|default|throw|try|catch|finally)$/.test(
              tok
            )
          )
            return (
              <span key={ti} style={{ color: 'hsl(var(--chart-4))' }}>
                {tok}
              </span>
            )
          if (/^(null|undefined|true|false)$/.test(tok))
            return (
              <span key={ti} style={{ color: 'hsl(var(--chart-5))' }}>
                {tok}
              </span>
            )
          if (/^\d+$/.test(tok))
            return (
              <span key={ti} style={{ color: 'hsl(var(--chart-2))' }}>
                {tok}
              </span>
            )
          if (/^("|'|`)/.test(tok))
            return (
              <span key={ti} style={{ color: 'hsl(var(--chart-3))' }}>
                {tok}
              </span>
            )
          if (tok.startsWith('//'))
            return (
              <span key={ti} style={{ color: 'hsl(var(--muted-foreground))' }}>
                {tok}
              </span>
            )
          return <span key={ti}>{tok}</span>
        })}
      </div>
    )
  })

  return (
    <div className="rounded-lg overflow-hidden border border-border">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/50">
        <div className="flex items-center gap-2">
          {filename && <span className="text-xs text-muted-foreground font-mono">{filename}</span>}
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
            {language}
          </span>
        </div>
        <button
          data-testid="code-copy-btn"
          onClick={copy}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs font-mono text-foreground bg-muted/30 leading-relaxed">
        {highlighted}
      </pre>
    </div>
  )
}

function SectionBlock({ section }: { section: AnswerSection }) {
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [relOpen, setRelOpen] = useState(true)

  const chip = (label: string, type: string) => (
    <span
      className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-3"
      style={{
        background: SECTION_COLORS[type] + '20',
        color: SECTION_COLORS[type],
        border: `1px solid ${SECTION_COLORS[type]}44`,
      }}
    >
      {label}
    </span>
  )

  if (section.type === 'short')
    return (
      <div>
        {chip('Answer', 'short')}
        <MarkdownBlock content={section.content} />
      </div>
    )

  if (section.type === 'code')
    return (
      <div>
        {chip('Code Example', 'code')}
        <CodeBlock
          language={section.language}
          content={section.content}
          filename={section.filename}
        />
      </div>
    )

  if (section.type === 'diagram')
    return (
      <div>
        {chip('Diagram', 'diagram')}
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border bg-muted/30">
            <div className="text-sm font-semibold text-foreground">{section.title}</div>
            <div className="text-xs text-muted-foreground">{section.description}</div>
          </div>
          {/*
            XSS Prevention: SVG content is sanitized before rendering.
            The sanitizeSVG function from @/lib/security:
            - Validates SVG size limits (max 10KB)
            - Removes dangerous patterns (scripts, event handlers, javascript: URLs)
            - Whitelists only allowed SVG elements and attributes
            
            For enhanced security in production, consider using DOMPurify:
            import DOMPurify from 'dompurify';
            const cleanSVG = DOMPurify.sanitize(section.svgContent, {
              USE_PROFILES: { svg: true },
              ALLOWED_TAGS: ['svg', 'g', 'path', 'rect', 'circle', 'text'],
              ALLOWED_ATTR: ['viewBox', 'fill', 'stroke', 'd', 'x', 'y', 'width', 'height']
            });
          */}
          <div
            className="p-4 flex justify-center bg-card"
            dangerouslySetInnerHTML={{ __html: sanitizeSVG(section.svgContent) }}
          />
        </div>
      </div>
    )

  if (section.type === 'video')
    return (
      <div>
        {chip('Video', 'video')}
        {!videoLoaded ? (
          <button
            onClick={() => setVideoLoaded(true)}
            className="w-full h-40 rounded-lg border border-border bg-muted/30 flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
              <span className="text-xl">▶</span>
            </div>
            <span className="text-sm font-medium text-foreground">{section.title}</span>
            <span className="text-xs text-muted-foreground">Click to load video</span>
          </button>
        ) : (
          <iframe
            src={section.url}
            title={section.title}
            className="w-full h-56 rounded-lg border border-border"
            allowFullScreen
          />
        )}
      </div>
    )

  if (section.type === 'related')
    return (
      <div>
        {chip('Related Topics', 'related')}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(section.topics || []).map((t, i) => (
            <div
              key={i}
              className="p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
            >
              <div className="text-sm font-semibold text-foreground mb-1">{t.title}</div>
              <div className="text-xs text-muted-foreground leading-snug">{t.description}</div>
              <span className="mt-2 inline-block text-[10px] px-1.5 rounded-sm font-mono bg-muted text-muted-foreground">
                {t.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    )

  if (section.type === 'eli5')
    return (
      <div>
        {chip('ELI5', 'eli5')}
        <div
          className="p-4 rounded-lg border"
          style={{
            background: 'hsl(var(--chart-3) / 0.08)',
            borderColor: 'hsl(var(--chart-3) / 0.25)',
          }}
        >
          <div className="flex gap-2.5">
            <span className="text-xl shrink-0">🧒</span>
            <div className="text-sm text-foreground leading-relaxed">
              <MarkdownBlock content={section.content} />
            </div>
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

function ContentSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="p-4 rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="w-20 h-5 rounded-full" />
          <Skeleton className="w-16 h-5 rounded-full" />
        </div>
        <Skeleton className="w-full h-7 mb-3 rounded" />
        <div className="flex items-center gap-4 mb-3">
          <Skeleton className="w-12 h-4" />
          <Skeleton className="w-12 h-4" />
          <Skeleton className="w-24 h-4" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="w-16 h-5 rounded" />
          <Skeleton className="w-20 h-5 rounded" />
          <Skeleton className="w-14 h-5 rounded" />
        </div>
      </div>
      <div className="p-4 rounded-lg border border-border">
        <Skeleton className="w-16 h-5 mb-3" />
        <Skeleton className="w-full h-4 mb-2" />
        <Skeleton className="w-full h-4 mb-2" />
        <Skeleton className="w-3/4 h-4" />
      </div>
      <div className="p-4 rounded-lg border border-border">
        <Skeleton className="w-24 h-5 mb-3" />
        <Skeleton className="w-full h-32 rounded" />
      </div>
    </div>
  )
}

function SidebarSkeleton() {
  return (
    <div className="flex-shrink-0 flex-col border-r border-border overflow-hidden bg-card w-72 hidden md:flex">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Skeleton className="w-20 h-4" />
        <Skeleton className="w-8 h-5 ml-auto rounded-full" />
      </div>
      <div className="overflow-y-auto flex-1 p-2">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} className="px-3 py-2.5 mb-1">
            <div className="flex items-center gap-2 mb-1">
              <Skeleton className="w-10 h-3" />
              <Skeleton className="w-12 h-3" />
            </div>
            <Skeleton className="w-full h-4" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function QAPage({
  questions,
  channelId,
  onQuestionAnswered,
  isLoading = false,
}: QAPageProps) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [search, setSearch] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const filtered = search.trim()
    ? questions.filter(
        q =>
          q.title?.toLowerCase().includes(search.toLowerCase()) ||
          q.tags?.some(t => t.includes(search.toLowerCase()))
      )
    : questions

  const active = filtered[activeIdx]

  useEffect(() => {
    setActiveIdx(0)
  }, [channelId])

  useEffect(() => {
    if (active) {
      onQuestionAnswered?.(active.id)
    }
  }, [activeIdx, active, onQuestionAnswered])

  const go = useCallback(
    (dir: 1 | -1) => {
      setActiveIdx(i => Math.max(0, Math.min(filtered.length - 1, i + dir)))
    },
    [filtered.length]
  )

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
      <div className="flex flex-1 h-full overflow-hidden">
        <SidebarSkeleton />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div
            className="flex items-center gap-2 px-4 border-b border-border bg-card/50"
            style={{ height: 44 }}
          >
            <Skeleton className="w-8 h-8 rounded md:hidden" />
            <Skeleton className="w-32 h-7 rounded" />
            <Skeleton className="w-16 ml-auto h-4" />
            <Skeleton className="w-7 h-7 rounded" />
            <Skeleton className="w-7 h-7 rounded" />
          </div>
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <ContentSkeleton />
          </div>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <BookOpen size={48} className="text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No questions for this channel
        </h3>
        <p className="text-muted-foreground text-sm">
          Check out the other sections or switch channels.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div
        className={`sidebar flex-shrink-0 flex-col border-r border-border overflow-hidden bg-card ${sidebarOpen ? 'fixed left-0 top-0 h-full z-40 flex w-72' : 'hidden md:flex'}`}
        style={{ width: 260 }}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <BookOpen size={14} className="text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Questions</span>
          <span className="ml-auto text-[10px] font-bold bg-primary/15 text-primary px-1.5 rounded-full">
            {filtered.length}
          </span>
        </div>
        <div className="overflow-y-auto flex-1">
          {filtered.map((q, i) => (
            <button
              key={q.id}
              data-testid={`qa-sidebar-item-${q.id}`}
              onClick={() => {
                setActiveIdx(i)
                setSidebarOpen(false)
              }}
              className="w-full text-left px-3 py-2.5 transition-colors hover:bg-muted/50 border-l-2"
              style={{
                borderLeftColor: i === activeIdx ? 'hsl(var(--primary))' : 'transparent',
                background: i === activeIdx ? 'hsl(var(--primary) / 0.06)' : undefined,
              }}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-mono text-muted-foreground">#{q.number}</span>
                <span
                  className="text-[10px] font-semibold uppercase"
                  style={{ color: DIFF_COLOR[q.difficulty ?? ''] }}
                >
                  {(q.difficulty ?? 'n/a').slice(0, 3)}
                </span>
              </div>
              <div className="text-xs text-foreground line-clamp-2 leading-snug">{q.title}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div
          className="flex items-center gap-2 px-4 border-b border-border bg-card/50"
          style={{ height: 44 }}
        >
          <button
            data-testid="qa-mob-menu"
            aria-label="Open navigation menu"
            className="mob-menu md:hidden items-center justify-center w-8 h-8 rounded hover:bg-muted transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={16} />
          </button>
          <div className="relative flex-1 max-w-xs">
            <Search
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              data-testid="qa-search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search questions..."
              className="w-full pl-7 pr-3 py-1.5 text-xs rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <span className="text-xs text-muted-foreground ml-auto">
            {activeIdx + 1} / {filtered.length}
          </span>
          <button
            onClick={() => go(-1)}
            disabled={activeIdx === 0}
            aria-label="Previous question"
            className="w-7 h-7 rounded flex items-center justify-center hover:bg-muted disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => go(1)}
            disabled={activeIdx === filtered.length - 1}
            aria-label="Next question"
            className="w-7 h-7 rounded flex items-center justify-center hover:bg-muted disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto p-4 md:p-6">
          {active ? (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Question header */}
              <div className="p-4 rounded-lg border border-border bg-card">
                <div className="flex items-start gap-2 mb-2 flex-wrap">
                  <span
                    className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                    style={{
                      background: DIFF_COLOR[active.difficulty] + '20',
                      color: DIFF_COLOR[active.difficulty],
                    }}
                  >
                    {active.difficulty}
                  </span>
                  {(active.sections || []).map((s, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full"
                      style={{
                        background: SECTION_COLORS[s.type] + '15',
                        color: SECTION_COLORS[s.type],
                      }}
                    >
                      {s.type}
                    </span>
                  ))}
                </div>
                <h1 className="text-lg font-bold text-foreground mb-3">{active.title}</h1>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>▲ {active.votes}</span>
                  <span>👁 {active.views}</span>
                  <span>by {active.askedBy}</span>
                  <span>{active.askedAt}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {(active.tags || []).map(t => (
                    <span
                      key={t}
                      className="text-[10px] px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground font-mono"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Sections */}
              {(active.sections || []).map((s, i) => (
                <div key={i}>
                  <SectionBlock section={s} />
                </div>
              ))}

              {/* Bottom nav */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => go(-1)}
                  disabled={activeIdx === 0}
                  data-testid="qa-prev-btn"
                  aria-label="Previous question"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border border-border hover:bg-muted disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <div className="flex gap-1">
                  {filtered.slice(Math.max(0, activeIdx - 2), activeIdx + 3).map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full transition-colors"
                      style={{
                        background:
                          i + Math.max(0, activeIdx - 2) === activeIdx
                            ? 'hsl(var(--primary))'
                            : 'hsl(var(--muted))',
                      }}
                    />
                  ))}
                </div>
                <button
                  onClick={() => go(1)}
                  disabled={activeIdx === filtered.length - 1}
                  data-testid="qa-next-btn"
                  aria-label="Next question"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border border-border hover:bg-muted disabled:opacity-30 transition-colors"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-muted-foreground text-sm">No results for "{search}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
