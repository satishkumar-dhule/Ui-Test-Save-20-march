import { lazy, Suspense } from 'react'
import type { Section } from '@/stores/contentStore'
import { useContentStore, useFilteredContent } from '@/stores/contentStore'
import { useChannels } from '@/hooks/useChannels'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Spinner } from '@/components/ui/spinner'

const QAPage = lazy(() => import('@/pages/QAPage').then(m => ({ default: m.QAPage })))
const FlashcardsPage = lazy(() =>
  import('@/pages/FlashcardsPage').then(m => ({ default: m.FlashcardsPage }))
)
const CodingPage = lazy(() => import('@/pages/CodingPage').then(m => ({ default: m.CodingPage })))
const MockExamPage = lazy(() =>
  import('@/pages/MockExamPage').then(m => ({ default: m.MockExamPage }))
)
const VoicePracticePage = lazy(() =>
  import('@/pages/VoicePracticePage').then(m => ({ default: m.VoicePracticePage }))
)

type CodingStatus = 'not_started' | 'in_progress' | 'completed'
type FlashcardStatus = 'unseen' | 'reviewing' | 'known' | 'hard'

interface StudyContentProps {
  section: Section
  channelId: string
  onQuestionAnswered: (questionId: string) => void
  onFlashcardUpdate: (cardId: string, status: FlashcardStatus) => void
  onCodingUpdate: (challengeId: string, status: CodingStatus) => void
  onExamComplete: (score: number, total: number, passed: boolean, durationMs: number) => void
  onVoicePractice: (promptId: string, rating: number) => void
}

function LoadingFallback() {
  return (
    <div className="study-loading">
      <Spinner className="size-6" />
      <span>Loading...</span>
    </div>
  )
}

export function StudyContent({
  section,
  channelId,
  onQuestionAnswered,
  onFlashcardUpdate,
  onCodingUpdate,
  onExamComplete,
  onVoicePractice,
}: StudyContentProps) {
  const channels = useChannels()
  const currentChannel = channels.find(c => c.id === channelId)

  const filtered = useFilteredContent(currentChannel?.tagFilter)

  return (
    <main className="study-main">
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          {section === 'qa' && (
            <QAPage
              questions={filtered.questions}
              channelId={channelId}
              onQuestionAnswered={onQuestionAnswered}
            />
          )}
          {section === 'flashcards' && (
            <FlashcardsPage
              flashcards={filtered.flashcards}
              categories={[]}
              channelId={channelId}
              onFlashcardUpdate={onFlashcardUpdate}
            />
          )}
          {section === 'coding' && (
            <CodingPage
              challenges={filtered.coding}
              channelId={channelId}
              onCodingUpdate={onCodingUpdate}
            />
          )}
          {section === 'exam' && (
            <MockExamPage
              questions={filtered.exam}
              channelId={channelId}
              onExamComplete={onExamComplete}
            />
          )}
          {section === 'voice' && (
            <VoicePracticePage
              prompts={filtered.voice}
              channelId={channelId}
              onVoicePractice={onVoicePractice}
            />
          )}
        </Suspense>
      </ErrorBoundary>
    </main>
  )
}
