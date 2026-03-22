import { lazy, Suspense } from 'react'
import type { Section } from '@/App'
import type { Question } from '@/data/questions'
import type { Flashcard } from '@/data/flashcards'
import type { ExamQuestion } from '@/data/exam'
import type { VoicePrompt } from '@/data/voicePractice'
import type { CodingChallenge } from '@/data/coding'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Spinner } from '@/components/ui/spinner'

const QAPage = lazy(() => import('@/pages/QAPage').then(m => ({ default: m.QAPage })))
const FlashcardsPage = lazy(() => import('@/pages/FlashcardsPage').then(m => ({ default: m.FlashcardsPage })))
const CodingPage = lazy(() => import('@/pages/CodingPage').then(m => ({ default: m.CodingPage })))
const MockExamPage = lazy(() => import('@/pages/MockExamPage').then(m => ({ default: m.MockExamPage })))
const VoicePracticePage = lazy(() => import('@/pages/VoicePracticePage').then(m => ({ default: m.VoicePracticePage })))

type CodingStatus = 'not_started' | 'in_progress' | 'completed'
type FlashcardStatus = 'unseen' | 'reviewing' | 'known' | 'hard'

interface StudyContentProps {
  section: Section
  channelId: string
  filteredQuestions: Question[]
  filteredFlashcards: Flashcard[]
  filteredExamQs: ExamQuestion[]
  filteredVoicePs: VoicePrompt[]
  filteredCoding: CodingChallenge[]
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
  filteredQuestions,
  filteredFlashcards,
  filteredExamQs,
  filteredVoicePs,
  filteredCoding,
  onQuestionAnswered,
  onFlashcardUpdate,
  onCodingUpdate,
  onExamComplete,
  onVoicePractice,
}: StudyContentProps) {
  return (
    <main className="study-main">
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          {section === 'qa' && (
            <QAPage
              questions={filteredQuestions}
              channelId={channelId}
              onQuestionAnswered={onQuestionAnswered}
            />
          )}
          {section === 'flashcards' && (
            <FlashcardsPage
              flashcards={filteredFlashcards}
              categories={[]}
              channelId={channelId}
              onFlashcardUpdate={onFlashcardUpdate}
            />
          )}
          {section === 'coding' && (
            <CodingPage
              challenges={filteredCoding}
              channelId={channelId}
              onCodingUpdate={onCodingUpdate}
            />
          )}
          {section === 'exam' && (
            <MockExamPage
              questions={filteredExamQs}
              channelId={channelId}
              onExamComplete={onExamComplete}
            />
          )}
          {section === 'voice' && (
            <VoicePracticePage
              prompts={filteredVoicePs}
              channelId={channelId}
              onVoicePractice={onVoicePractice}
            />
          )}
        </Suspense>
      </ErrorBoundary>
    </main>
  )
}
