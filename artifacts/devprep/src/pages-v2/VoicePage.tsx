import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/molecules/Card/Card'
import { Text } from '@/components/atoms/Text'
import { Button, buttonVariants } from '@/components/atoms/Button/Button'
import { Badge } from '@/components/atoms/Badge'
import { useNewTheme } from '@/hooks/useNewTheme'
import { cn } from '@/lib/utils/cn'

type RecordingState = 'ready' | 'recording' | 'paused' | 'completed' | 'playing'

interface VoicePrompt {
  id: string
  title: string
  prompt: string
  duration: number
  difficulty: 'easy' | 'medium' | 'hard'
  tips?: string[]
  references?: string[]
}

interface Evaluation {
  clarity: number
  confidence: number
  structure: number
  notes?: string
}

interface VoicePracticeState {
  promptId: string
  recordingState: RecordingState
  recordingTime: number
  playbackTime: number
  playbackDuration: number
  evaluation: Evaluation | null
  audioUrl: string | null
}

const mockPrompts: VoicePrompt[] = [
  {
    id: '1',
    title: 'Explain Closures',
    prompt: 'Explain what a closure is in JavaScript. Include an example and discuss use cases.',
    duration: 60,
    difficulty: 'medium',
    tips: [
      'Start with a clear definition',
      'Use a simple code example',
      'Explain the lexical environment',
      'Mention practical use cases like data privacy',
    ],
    references: ['MDN: Closures', 'YouTube: JavaScript Closures Explained'],
  },
  {
    id: '2',
    title: 'Describe RESTful APIs',
    prompt: 'Explain what makes an API RESTful. What are the key principles and constraints?',
    duration: 90,
    difficulty: 'easy',
    tips: [
      'Define REST',
      'List the 6 constraints',
      'Explain HTTP methods',
      'Give examples of proper URL design',
    ],
    references: ['RESTful API Design', ' Richardson Maturity Model'],
  },
  {
    id: '3',
    title: 'Database Normalization',
    prompt:
      'Explain the different levels of database normalization (1NF, 2NF, 3NF). Why is normalization important?',
    duration: 120,
    difficulty: 'hard',
    tips: [
      'Start with the problem normalization solves',
      'Explain each normal form with examples',
      'Discuss pros and cons',
      'Mention when denormalization might be appropriate',
    ],
    references: ['Database Normalization - Wikipedia', '3NF vs BCNF'],
  },
]

const difficultyColors = {
  easy: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  hard: 'bg-red-500/10 text-red-600 dark:text-red-400',
}

function PromptSidebar({
  prompts,
  currentPromptId,
  onSelectPrompt,
  completedIds,
}: {
  prompts: VoicePrompt[]
  currentPromptId: string
  onSelectPrompt: (id: string) => void
  completedIds: string[]
}) {
  return (
    <div className="w-full md:w-72 shrink-0 space-y-2">
      <Text variant="h3" size="lg" weight="semibold" className="mb-4">
        Prompts
      </Text>
      <div className="space-y-2">
        {prompts.map(prompt => {
          const isActive = prompt.id === currentPromptId
          const isCompleted = completedIds.includes(prompt.id)

          return (
            <button
              key={prompt.id}
              onClick={() => onSelectPrompt(prompt.id)}
              className={cn(
                'w-full p-3 rounded-xl text-left transition-all duration-200',
                'border border-border hover:border-primary/50 hover:shadow-sm',
                isActive && 'border-primary bg-primary/5 ring-2 ring-primary/20'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <Text variant="span" size="sm" weight="medium" className="block truncate">
                    {prompt.title}
                  </Text>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="outline"
                      size="sm"
                      className={difficultyColors[prompt.difficulty]}
                    >
                      {prompt.difficulty}
                    </Badge>
                    <Text variant="span" size="xs" color="muted">
                      {prompt.duration}s
                    </Text>
                  </div>
                </div>
                {isCompleted && <span className="text-emerald-500 text-lg">✓</span>}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function RecordButton({
  state,
  onStart,
  onStop,
  onPause,
  onResume,
}: {
  state: RecordingState
  onStart: () => void
  onStop: () => void
  onPause: () => void
  onResume: () => void
}) {
  const buttonSize = 'h-16 w-16 md:h-20 md:w-20'
  const iconSize = 'h-8 w-8 md:h-10 md:w-10'

  if (state === 'recording') {
    return (
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className={cn(buttonSize, 'rounded-full')}
          onClick={onPause}
        >
          <span className="text-xl">⏸️</span>
        </Button>
        <Button
          variant="destructive"
          className={cn(buttonSize, 'rounded-full animate-pulse')}
          onClick={onStop}
        >
          <span className={cn(iconSize, 'bg-red-500 rounded-full block')} />
        </Button>
      </div>
    )
  }

  if (state === 'paused') {
    return (
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className={cn(buttonSize, 'rounded-full')}
          onClick={onResume}
        >
          <span className="text-xl">▶️</span>
        </Button>
        <Button variant="destructive" className={cn(buttonSize, 'rounded-full')} onClick={onStop}>
          <span className={cn(iconSize, 'bg-red-500 rounded-full block')} />
        </Button>
      </div>
    )
  }

  return (
    <Button variant="default" className={cn(buttonSize, 'rounded-full')} onClick={onStart}>
      <span className="text-3xl">🎤</span>
    </Button>
  )
}

function RecordingTimer({ seconds, isRecording }: { seconds: number; isRecording: boolean }) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`

  return (
    <div className="text-center">
      <Text
        variant="h1"
        size="3xl"
        weight="bold"
        className={cn('font-mono tabular-nums', isRecording && 'text-destructive animate-pulse')}
      >
        {formatted}
      </Text>
      {isRecording && (
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="size-3 rounded-full bg-destructive animate-pulse" />
          <Text variant="span" size="sm" color="muted">
            Recording...
          </Text>
        </div>
      )}
    </div>
  )
}

function WaveformVisualization({
  isActive,
  progress = 0,
}: {
  isActive: boolean
  progress?: number
}) {
  const barCount = 40
  const bars = Array.from({ length: barCount })

  return (
    <div className="w-full h-24 flex items-center justify-center gap-1">
      {bars.map((_, i) => {
        const height = isActive
          ? Math.sin((i / barCount) * Math.PI * 2 + Date.now() / 100) * 40 + 40
          : 20 + Math.random() * 20

        return (
          <div
            key={i}
            className="w-1 bg-primary/60 rounded-full transition-all duration-75"
            style={{
              height: `${Math.max(8, height)}px`,
              opacity: progress > 0 && i / barCount <= progress ? 1 : 0.4,
            }}
          />
        )
      })}
    </div>
  )
}

function PlaybackControls({
  isPlaying,
  currentTime,
  duration,
  playbackRate,
  onPlayPause,
  onSeek,
  onRateChange,
}: {
  isPlaying: boolean
  currentTime: number
  duration: number
  playbackRate: number
  onPlayPause: () => void
  onSeek: (time: number) => void
  onRateChange: (rate: number) => void
}) {
  const progress = duration > 0 ? currentTime / duration : 0
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const rates = [0.5, 1, 1.5, 2]

  return (
    <div className="space-y-4">
      <WaveformVisualization isActive={isPlaying} progress={progress} />

      <input
        type="range"
        min={0}
        max={duration || 100}
        value={currentTime}
        onChange={e => onSeek(Number(e.target.value))}
        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={onPlayPause}
            className="size-12 rounded-full"
          >
            <span className="text-xl">{isPlaying ? '⏸️' : '▶️'}</span>
          </Button>
          <Text variant="span" size="sm" color="muted" className="font-mono tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>
        </div>

        <div className="flex items-center gap-2">
          {rates.map(rate => (
            <button
              key={rate}
              onClick={() => onRateChange(rate)}
              className={cn(
                'px-2 py-1 text-xs rounded transition-colors',
                playbackRate === rate
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              )}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function SelfEvaluationForm({
  evaluation,
  onSubmit,
}: {
  evaluation: Evaluation | null
  onSubmit: (evaluation: Evaluation) => void
}) {
  const [clarity, setClarity] = useState(evaluation?.clarity || 0)
  const [confidence, setConfidence] = useState(evaluation?.confidence || 0)
  const [structure, setStructure] = useState(evaluation?.structure || 0)
  const [notes, setNotes] = useState(evaluation?.notes || '')

  const StarRating = ({
    label,
    value,
    onChange,
  }: {
    label: string
    value: number
    onChange: (v: number) => void
  }) => (
    <div className="space-y-2">
      <Text variant="span" size="sm" color="muted">
        {label}
      </Text>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => onChange(star)}
            className="text-2xl transition-transform hover:scale-110"
          >
            {star <= value ? '⭐' : '☆'}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <Text variant="h3" size="lg" weight="semibold">
        Self-Evaluation
      </Text>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StarRating label="How clear was your explanation?" value={clarity} onChange={setClarity} />
        <StarRating
          label="How confident did you sound?"
          value={confidence}
          onChange={setConfidence}
        />
        <StarRating
          label="How well did you structure your answer?"
          value={structure}
          onChange={setStructure}
        />
      </div>

      <div className="space-y-2">
        <Text variant="span" size="sm" color="muted">
          Notes (optional)
        </Text>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Add any notes about your performance..."
          className="w-full h-20 p-3 rounded-lg border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <Button
        onClick={() => onSubmit({ clarity, confidence, structure, notes })}
        disabled={clarity === 0 || confidence === 0 || structure === 0}
        className="w-full"
      >
        Submit Evaluation
      </Button>
    </div>
  )
}

function TipsSection({ tips, references }: { tips?: string[]; references?: string[] }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">💡</span>
          <Text variant="span" weight="medium">
            Tips & References
          </Text>
        </div>
        <span
          className="text-xl transition-transform duration-200"
          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          ▼
        </span>
      </button>

      {isExpanded && (
        <CardContent className="pt-0 space-y-4 animate-fade-in">
          {tips && tips.length > 0 && (
            <div>
              <Text variant="span" size="sm" weight="semibold" color="muted" className="block mb-2">
                What to Include
              </Text>
              <ul className="space-y-1">
                {tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-primary">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {references && references.length > 0 && (
            <div>
              <Text variant="span" size="sm" weight="semibold" color="muted" className="block mb-2">
                References
              </Text>
              <ul className="space-y-1">
                {references.map((ref, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-secondary">📚</span>
                    {ref}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

export function VoicePage() {
  const { theme, isDark } = useNewTheme()

  const [prompts] = useState<VoicePrompt[]>(mockPrompts)
  const [currentPromptId, setCurrentPromptId] = useState<string>(mockPrompts[0].id)
  const [completedIds, setCompletedIds] = useState<string[]>([])

  const [practiceState, setPracticeState] = useState<VoicePracticeState>({
    promptId: mockPrompts[0].id,
    recordingState: 'ready',
    recordingTime: 0,
    playbackTime: 0,
    playbackDuration: 0,
    evaluation: null,
    audioUrl: null,
  })

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null)

  const currentPrompt = prompts.find(p => p.id === currentPromptId) || prompts[0]

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = event => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const audioUrl = URL.createObjectURL(audioBlob)
        setPracticeState(prev => ({
          ...prev,
          recordingState: 'completed',
          audioUrl,
          playbackDuration: prev.recordingTime,
        }))
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()

      setPracticeState(prev => ({
        ...prev,
        recordingState: 'recording',
        recordingTime: 0,
      }))

      timerRef.current = setInterval(() => {
        setPracticeState(prev => ({
          ...prev,
          recordingTime: prev.recordingTime + 1,
        }))
      }, 1000)
    } catch (error) {
      console.error('Microphone access denied:', error)
      alert('Microphone access is required to record. Please enable microphone permissions.')
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause()
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setPracticeState(prev => ({ ...prev, recordingState: 'paused' }))
  }, [])

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume()
    }
    timerRef.current = setInterval(() => {
      setPracticeState(prev => ({
        ...prev,
        recordingTime: prev.recordingTime + 1,
      }))
    }, 1000)
    setPracticeState(prev => ({ ...prev, recordingState: 'recording' }))
  }, [])

  const playRecording = useCallback(() => {
    if (!practiceState.audioUrl) return

    if (!audioRef.current) {
      audioRef.current = new Audio(practiceState.audioUrl)
      audioRef.current.onended = () => {
        setPracticeState(prev => ({ ...prev, recordingState: 'completed', playbackTime: 0 }))
        if (playbackTimerRef.current) {
          clearInterval(playbackTimerRef.current)
        }
      }
    }

    audioRef.current.play()
    setPracticeState(prev => ({ ...prev, recordingState: 'playing' }))

    playbackTimerRef.current = setInterval(() => {
      if (audioRef.current) {
        setPracticeState(prev => ({
          ...prev,
          playbackTime: audioRef.current!.currentTime,
        }))
      }
    }, 100)
  }, [practiceState.audioUrl])

  const pausePlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
    if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current)
    }
    setPracticeState(prev => ({ ...prev, recordingState: 'completed' }))
  }, [])

  const seekPlayback = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setPracticeState(prev => ({ ...prev, playbackTime: time }))
    }
  }, [])

  const setPlaybackRate = useCallback((rate: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate
    }
  }, [])

  const handleEvaluation = useCallback(
    (evalData: Evaluation) => {
      setPracticeState(prev => ({ ...prev, evaluation: evalData }))
      if (!completedIds.includes(currentPromptId)) {
        setCompletedIds(prev => [...prev, currentPromptId])
      }
    },
    [currentPromptId, completedIds]
  )

  const selectPrompt = useCallback((id: string) => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current)
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    setCurrentPromptId(id)
    setPracticeState({
      promptId: id,
      recordingState: 'ready',
      recordingTime: 0,
      playbackTime: 0,
      playbackDuration: 0,
      evaluation: null,
      audioUrl: null,
    })
  }, [])

  const handleNextPrompt = useCallback(() => {
    const currentIndex = prompts.findIndex(p => p.id === currentPromptId)
    const nextIndex = (currentIndex + 1) % prompts.length
    selectPrompt(prompts[nextIndex].id)
  }, [currentPromptId, prompts, selectPrompt])

  const handlePracticeAgain = useCallback(() => {
    selectPrompt(currentPromptId)
  }, [currentPromptId, selectPrompt])

  return (
    <div className="flex flex-col md:flex-row gap-6 p-4 md:p-6">
      <PromptSidebar
        prompts={prompts}
        currentPromptId={currentPromptId}
        onSelectPrompt={selectPrompt}
        completedIds={completedIds}
      />

      <div className="flex-1 space-y-6">
        <Card
          className={cn(
            'transition-all duration-300',
            practiceState.recordingState === 'recording' &&
              'border-destructive border-2 animate-pulse'
          )}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{currentPrompt.title}</CardTitle>
                <CardDescription className="mt-2 text-base">{currentPrompt.prompt}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={difficultyColors[currentPrompt.difficulty]}>
                  {currentPrompt.difficulty}
                </Badge>
                <Badge variant="secondary">⏱️ {currentPrompt.duration}s</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <RecordingTimer
              seconds={
                practiceState.recordingState === 'recording' ||
                practiceState.recordingState === 'paused'
                  ? practiceState.recordingTime
                  : practiceState.playbackTime
              }
              isRecording={practiceState.recordingState === 'recording'}
            />

            {practiceState.recordingState === 'ready' && (
              <div className="flex justify-center py-4">
                <RecordButton
                  state={practiceState.recordingState}
                  onStart={startRecording}
                  onStop={stopRecording}
                  onPause={pauseRecording}
                  onResume={resumeRecording}
                />
              </div>
            )}

            {(practiceState.recordingState === 'recording' ||
              practiceState.recordingState === 'paused') && (
              <div className="flex justify-center py-4">
                <RecordButton
                  state={practiceState.recordingState}
                  onStart={startRecording}
                  onStop={stopRecording}
                  onPause={pauseRecording}
                  onResume={resumeRecording}
                />
              </div>
            )}

            {(practiceState.recordingState === 'completed' ||
              practiceState.recordingState === 'playing') && (
              <PlaybackControls
                isPlaying={practiceState.recordingState === 'playing'}
                currentTime={practiceState.playbackTime}
                duration={practiceState.playbackDuration}
                playbackRate={1}
                onPlayPause={
                  practiceState.recordingState === 'playing' ? pausePlayback : playRecording
                }
                onSeek={seekPlayback}
                onRateChange={setPlaybackRate}
              />
            )}
          </CardContent>
        </Card>

        <TipsSection tips={currentPrompt.tips} references={currentPrompt.references} />

        {(practiceState.recordingState === 'completed' ||
          practiceState.recordingState === 'playing') &&
          !practiceState.evaluation && (
            <Card>
              <CardContent className="pt-6">
                <SelfEvaluationForm
                  evaluation={practiceState.evaluation}
                  onSubmit={handleEvaluation}
                />
              </CardContent>
            </Card>
          )}

        {practiceState.evaluation && (
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle>Evaluation Complete</CardTitle>
              <CardDescription>Keep practicing to improve!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <Text variant="span" size="sm" color="muted">
                    Clarity
                  </Text>
                  <Text variant="h2" size="xl" weight="bold" className="text-primary">
                    {practiceState.evaluation.clarity}/5
                  </Text>
                </div>
                <div className="text-center">
                  <Text variant="span" size="sm" color="muted">
                    Confidence
                  </Text>
                  <Text variant="h2" size="xl" weight="bold" className="text-secondary">
                    {practiceState.evaluation.confidence}/5
                  </Text>
                </div>
                <div className="text-center">
                  <Text variant="span" size="sm" color="muted">
                    Structure
                  </Text>
                  <Text variant="h2" size="xl" weight="bold" className="text-accent">
                    {practiceState.evaluation.structure}/5
                  </Text>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handlePracticeAgain} className="flex-1">
                  Practice Again
                </Button>
                <Button onClick={handleNextPrompt} className="flex-1">
                  Next Prompt
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default VoicePage
