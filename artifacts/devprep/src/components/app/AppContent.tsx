import type { Section } from '@/hooks/app/useAppState'
import type { Question } from '@/data/questions'
import type { Flashcard } from '@/data/flashcards'
import type { ExamQuestion } from '@/data/exam'
import type { VoicePrompt } from '@/data/voicePractice'
import type { CodingChallenge } from '@/data/coding'
import { QAPage } from '@/pages/QAPage'
import { FlashcardsPage } from '@/pages/FlashcardsPage'
import { MockExamPage } from '@/pages/MockExamPage'
import { VoicePracticePage } from '@/pages/VoicePracticePage'
import { CodingPage } from '@/pages/CodingPage'
import { ErrorBoundary } from '@/components/ErrorBoundary'

type CodingStatus = 'not_started' | 'in_progress' | 'completed'
type FlashcardStatus = 'unseen' | 'reviewing' | 'known' | 'hard'

interface AppContentProps {
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

/**
 * Main content area that renders the appropriate section.
 * Each page manages its own internal layout and scrolling.
 */
export function AppContent({
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
}: AppContentProps) {
  return (
    <ErrorBoundary>
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
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
            categories={[...new Set(filteredFlashcards.map(f => f.category))]}
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
      </div>
    </ErrorBoundary>
  )
}
