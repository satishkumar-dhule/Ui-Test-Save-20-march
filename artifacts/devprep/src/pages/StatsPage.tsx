import { useMemo } from 'react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useContentStore } from '@/stores/contentStore'
import {
  Flame,
  Clock,
  CreditCard,
  MessageSquare,
  Code2,
  GraduationCap,
  Mic2,
  Trophy,
  TrendingUp,
  BookOpen,
} from 'lucide-react'

function formatDuration(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`
  const h = Math.floor(ms / 3_600_000)
  const m = Math.round((ms % 3_600_000) / 60_000)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  color: string
}

function StatCard({ icon, label, value, sub, color }: StatCardProps) {
  return (
    <div
      style={{
        background: 'var(--dp-glass-1)',
        border: '1px solid var(--dp-border-0)',
        borderRadius: 'var(--dp-r-lg)',
        padding: '16px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 'var(--dp-r-md)',
          background: color + '18',
          border: `1px solid ${color}33`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--dp-text-1)', lineHeight: 1.1 }}>
          {value}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--dp-text-3)', marginTop: 2 }}>{label}</div>
        {sub && (
          <div style={{ fontSize: 11, color: 'var(--dp-text-3)', marginTop: 1, opacity: 0.7 }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  )
}

interface ExamRowProps {
  attempt: {
    channelName: string
    score: number
    totalQuestions: number
    passed: boolean
    timestamp: number
  }
}

function ExamRow({ attempt }: ExamRowProps) {
  const pct = Math.round((attempt.score / attempt.totalQuestions) * 100)
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 0',
        borderBottom: '1px solid var(--dp-border-0)',
      }}
    >
      <div
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: attempt.passed ? '#3fb950' : '#f85149',
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, fontSize: 13, color: 'var(--dp-text-1)' }}>
        {attempt.channelName}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: attempt.passed ? '#3fb950' : '#f85149' }}>
        {pct}%
      </div>
      <div style={{ fontSize: 11, color: 'var(--dp-text-3)' }}>
        {new Date(attempt.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
      </div>
    </div>
  )
}

export function StatsPage() {
  const { getStats, getExamAttempts, getFlashcardProgress, getQAProgress, getCodingProgress, getVoicePractice } =
    useAnalytics()
  const { channelId } = useContentStore()

  const stats = getStats()
  const examAttempts = getExamAttempts()
  const flashcardProgress = getFlashcardProgress()
  const qaProgress = getQAProgress()
  const codingProgress = getCodingProgress()
  const voicePractice = getVoicePractice()

  const channelExams = useMemo(
    () => examAttempts.filter(a => a.channelId === channelId),
    [examAttempts, channelId]
  )
  const allChannelExams = useMemo(
    () => [...examAttempts].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5),
    [examAttempts]
  )

  const flashcardValues = Object.values(flashcardProgress)
  const flashcardsMastered = flashcardValues.filter(f => f.status === 'known').length
  const flashcardsReviewing = flashcardValues.filter(f => f.status === 'reviewing').length

  const qaAnswered = Object.keys(qaProgress).length
  const codingCompleted = Object.values(codingProgress).filter(c => c.status === 'completed').length

  const passRate =
    examAttempts.length > 0
      ? Math.round((examAttempts.filter(a => a.passed).length / examAttempts.length) * 100)
      : 0

  const bestScore =
    channelExams.length > 0
      ? Math.round((Math.max(...channelExams.map(a => a.score / a.totalQuestions)) * 100))
      : null

  const isEmpty =
    stats.totalSessions === 0 &&
    flashcardValues.length === 0 &&
    qaAnswered === 0 &&
    examAttempts.length === 0

  if (isEmpty) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: 40,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: 'var(--dp-r-xl)',
            background: '#39d3f418',
            border: '1px solid #39d3f433',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#39d3f4',
          }}
        >
          <TrendingUp size={28} />
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--dp-text-1)', marginBottom: 6 }}>
            No activity yet
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--dp-text-3)', maxWidth: 280 }}>
            Start studying with Q&A, Flashcards, or Mock Exams to track your progress here.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px 20px 40px',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        maxWidth: 900,
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* Header */}
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--dp-text-1)', marginBottom: 4 }}>
          Your Progress
        </h2>
        <p style={{ fontSize: 13, color: 'var(--dp-text-3)' }}>
          Lifetime stats across all channels
        </p>
      </div>

      {/* Overview grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 12,
        }}
      >
        <StatCard
          icon={<Flame size={18} />}
          label="Current streak"
          value={stats.currentStreak ?? 0}
          sub={`Longest: ${stats.longestStreak ?? 0} days`}
          color="#f7843b"
        />
        <StatCard
          icon={<Clock size={18} />}
          label="Total study time"
          value={formatDuration(stats.totalStudyTimeMs ?? 0)}
          sub={`${stats.totalSessions ?? 0} sessions`}
          color="#39d3f4"
        />
        <StatCard
          icon={<CreditCard size={18} />}
          label="Flashcards mastered"
          value={flashcardsMastered}
          sub={`${flashcardsReviewing} reviewing · ${flashcardValues.length} total`}
          color="#3fb950"
        />
        <StatCard
          icon={<MessageSquare size={18} />}
          label="Q&A answered"
          value={qaAnswered}
          color="#388bfd"
        />
        <StatCard
          icon={<GraduationCap size={18} />}
          label="Exam attempts"
          value={examAttempts.length}
          sub={examAttempts.length > 0 ? `${passRate}% pass rate` : undefined}
          color="#ff7b72"
        />
        {bestScore !== null && (
          <StatCard
            icon={<Trophy size={18} />}
            label="Best exam score"
            value={`${bestScore}%`}
            sub="Current channel"
            color="#ffd700"
          />
        )}
        <StatCard
          icon={<Code2 size={18} />}
          label="Challenges solved"
          value={codingCompleted}
          color="#f7df1e"
        />
        <StatCard
          icon={<Mic2 size={18} />}
          label="Voice practices"
          value={voicePractice.length}
          color="#bc8cff"
        />
      </div>

      {/* Recent exam attempts */}
      {allChannelExams.length > 0 && (
        <div
          style={{
            background: 'var(--dp-glass-1)',
            border: '1px solid var(--dp-border-0)',
            borderRadius: 'var(--dp-r-lg)',
            padding: '16px 18px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 14,
              color: 'var(--dp-text-2)',
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            <BookOpen size={12} />
            Recent Exam Attempts
          </div>
          {allChannelExams.map((a, i) => (
            <ExamRow key={`${a.channelId}-${a.timestamp}-${i}`} attempt={a} />
          ))}
        </div>
      )}

      {/* Flashcard breakdown */}
      {flashcardValues.length > 0 && (
        <div
          style={{
            background: 'var(--dp-glass-1)',
            border: '1px solid var(--dp-border-0)',
            borderRadius: 'var(--dp-r-lg)',
            padding: '16px 18px',
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--dp-text-2)',
              marginBottom: 14,
            }}
          >
            Flashcard Breakdown
          </div>
          {(['known', 'reviewing', 'hard', 'unseen'] as const).map(status => {
            const count = flashcardValues.filter(f => f.status === status).length
            if (count === 0) return null
            const colors: Record<string, string> = {
              known: '#3fb950',
              reviewing: '#388bfd',
              hard: '#f85149',
              unseen: 'var(--dp-text-3)',
            }
            const labels: Record<string, string> = {
              known: 'Known',
              reviewing: 'Reviewing',
              hard: 'Hard',
              unseen: 'Unseen',
            }
            const pct = Math.round((count / flashcardValues.length) * 100)
            return (
              <div
                key={status}
                style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}
              >
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: colors[status], flexShrink: 0 }} />
                <div style={{ width: 80, fontSize: 12.5, color: 'var(--dp-text-2)' }}>{labels[status]}</div>
                <div
                  style={{
                    flex: 1,
                    height: 6,
                    borderRadius: 3,
                    background: 'var(--dp-border-0)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: colors[status],
                      borderRadius: 3,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
                <div style={{ width: 36, fontSize: 12, color: 'var(--dp-text-3)', textAlign: 'right' }}>
                  {count}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
