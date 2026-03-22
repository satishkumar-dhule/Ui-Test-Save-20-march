import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Layout } from '@/components/layouts/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/Card'
import { Badge } from '@/components/atoms'
import { contentApi } from '@/lib/api/endpoints'

interface VoicePracticeItem {
  id: string
  title: string
  prompt: string
  duration: number
  difficulty: 'easy' | 'medium' | 'hard'
  tags: string[]
  feedback: {
    clarity: number
    speed: number
    confidence: number
    suggestions: string[]
  }
}

export function VoicePage() {
  const [selectedItem, setSelectedItem] = useState<VoicePracticeItem | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const { data, isLoading } = useQuery({
    queryKey: ['voice-practice'],
    queryFn: () => contentApi.getByType('voice'),
  })

  const practiceItems: VoicePracticeItem[] = data?.data || []

  useEffect(() => {
    if (practiceItems.length > 0 && !selectedItem) {
      setSelectedItem(practiceItems[0])
    }
  }, [practiceItems])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRecording])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        setAudioBlob(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      setAudioBlob(null)
      setShowFeedback(false)
    } catch (error) {
      console.error('Error accessing microphone:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const handlePlayRecording = () => {
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      audio.play()
    }
  }

  const handleGetFeedback = () => {
    // Simulate AI feedback
    setShowFeedback(true)
  }

  const handleReset = () => {
    setAudioBlob(null)
    setRecordingTime(0)
    setShowFeedback(false)
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-center">
            <div className="h-8 w-48 bg-muted rounded mb-4 mx-auto" />
            <div className="h-4 w-64 bg-muted rounded mx-auto" />
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Voice Practice">
      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        {/* Practice Items List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Practice Prompts</h2>
          <div className="space-y-3">
            {practiceItems.map((item) => (
              <Card
                key={item.id}
                className={`cursor-pointer transition-colors hover:border-primary ${
                  selectedItem?.id === item.id ? 'border-primary' : ''
                }`}
                onClick={() => setSelectedItem(item)}
              >
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <Badge
                      variant={
                        item.difficulty === 'easy'
                          ? 'secondary'
                          : item.difficulty === 'medium'
                          ? 'default'
                          : 'destructive'
                      }
                    >
                      {item.difficulty}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Practice Interface */}
        {selectedItem && (
          <div className="space-y-6">
            {/* Prompt Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{selectedItem.title}</CardTitle>
                  <div className="flex gap-2">
                    {selectedItem.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-lg">{selectedItem.prompt}</p>
                <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                  <span>⏱️ {formatTime(selectedItem.duration * 60)}</span>
                  <span>🎯 Target: Speak clearly and concisely</span>
                </div>
              </CardContent>
            </Card>

            {/* Recording Interface */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recording Studio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Timer Display */}
                <div className="text-center">
                  <div className="text-6xl font-mono font-bold mb-2">
                    {formatTime(recordingTime)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {isRecording ? 'Recording in progress...' : audioBlob ? 'Recording complete' : 'Ready to record'}
                  </div>
                </div>

                {/* Recording Controls */}
                <div className="flex justify-center gap-4">
                  {!audioBlob ? (
                    <button
                      className={`inline-flex items-center justify-center rounded-md px-8 py-3 text-sm font-medium transition-colors w-32 ${
                        isRecording
                          ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                          : 'bg-primary text-primary-foreground hover:bg-primary/90'
                      }`}
                      onClick={isRecording ? stopRecording : startRecording}
                    >
                      {isRecording ? '⏹️ Stop' : '🎤 Record'}
                    </button>
                  ) : (
                    <>
                      <button
                        className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                        onClick={handlePlayRecording}
                      >
                        ▶️ Play
                      </button>
                      <button
                        className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                        onClick={handleReset}
                      >
                        🔄 Retry
                      </button>
                      {!showFeedback && (
                        <button
                          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                          onClick={handleGetFeedback}
                        >
                          ✨ Get Feedback
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Recording Indicator */}
                {isRecording && (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-sm text-red-500 font-medium">Recording</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Feedback Section */}
            {showFeedback && selectedItem && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">AI Feedback</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Score Bars */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Clarity</span>
                        <span>{selectedItem.feedback.clarity}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${selectedItem.feedback.clarity}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Speaking Speed</span>
                        <span>{selectedItem.feedback.speed}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${selectedItem.feedback.speed}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Confidence</span>
                        <span>{selectedItem.feedback.confidence}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${selectedItem.feedback.confidence}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Suggestions */}
                  <div>
                    <h4 className="font-medium mb-3">Improvement Suggestions</h4>
                    <ul className="space-y-2">
                      {selectedItem.feedback.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-primary">•</span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Overall Assessment */}
                  <div className="p-4 rounded-lg bg-primary/5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        🎯
                      </div>
                      <div>
                        <div className="font-medium">Overall Performance</div>
                        <div className="text-sm text-muted-foreground">
                          Good explanation! Focus on speaking more slowly for better clarity.
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tips Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Speaking Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">1.</span>
                    <span>Start with a brief overview before diving into details</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">2.</span>
                    <span>Use examples to illustrate complex concepts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">3.</span>
                    <span>Pause between key points to let ideas sink in</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">4.</span>
                    <span>Practice active listening before responding</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  )
}