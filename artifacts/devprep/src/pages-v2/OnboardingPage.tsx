import { useState } from 'react'
import { Layout } from '@/components/layouts/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/molecules/Card'
import { Badge } from '@/components/atoms'

type OnboardingStep = 'welcome' | 'profile' | 'goals' | 'channels' | 'complete'

interface ChannelOption {
  id: string
  name: string
  description: string
  icon: string
}

export function OnboardingPage() {
  const [step, setStep] = useState<OnboardingStep>('welcome')
  const [profile, setProfile] = useState({
    name: '',
    role: '',
    experience: '0-2',
  })
  const [selectedChannels, setSelectedChannels] = useState<string[]>([])

  const channels: ChannelOption[] = [
    { id: 'javascript', name: 'JavaScript', description: 'ES6+, async/await, patterns', icon: '📜' },
    { id: 'react', name: 'React', description: 'Hooks, state, performance', icon: '⚛️' },
    { id: 'python', name: 'Python', description: 'Data structures, algorithms', icon: '🐍' },
    { id: 'devops', name: 'DevOps', description: 'Docker, CI/CD, cloud', icon: '🔄' },
    { id: 'system-design', name: 'System Design', description: 'Architecture, scalability', icon: '🏗️' },
    { id: 'database', name: 'Database', description: 'SQL, NoSQL, optimization', icon: '🗄️' },
  ]

  const handleNext = () => {
    const steps: OnboardingStep[] = ['welcome', 'profile', 'goals', 'channels', 'complete']
    const currentIndex = steps.indexOf(step)
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1])
    }
  }

  const handleBack = () => {
    const steps: OnboardingStep[] = ['welcome', 'profile', 'goals', 'channels', 'complete']
    const currentIndex = steps.indexOf(step)
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1])
    }
  }

  const toggleChannel = (channelId: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId]
    )
  }

  const renderStep = () => {
    switch (step) {
      case 'welcome':
        return (
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold">Welcome to DevPrep</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Your AI-powered platform for technical interview preparation. Let's get you set up in just a few steps.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3 max-w-3xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">📝 Practice</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Access thousands of interview questions across multiple technologies
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🎴 Learn</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Interactive flashcards and spaced repetition for better retention
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">💻 Code</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Solve real coding challenges with instant feedback
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      case 'profile':
        return (
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Tell us about yourself</h2>
              <p className="text-muted-foreground">
                This helps us personalize your learning experience
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-medium">
                  Current Role
                </label>
                <input
                  id="role"
                  type="text"
                  placeholder="e.g., Frontend Developer, Student"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={profile.role}
                  onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="experience" className="text-sm font-medium">
                  Years of Experience
                </label>
                <select
                  id="experience"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={profile.experience}
                  onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                >
                  <option value="0-2">0-2 years</option>
                  <option value="3-5">3-5 years</option>
                  <option value="6-10">6-10 years</option>
                  <option value="10+">10+ years</option>
                </select>
              </div>
            </div>
          </div>
        )

      case 'goals':
        return (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">What are your goals?</h2>
              <p className="text-muted-foreground">
                Select the topics you want to focus on
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {channels.map((channel) => (
                <Card
                  key={channel.id}
                  className={`cursor-pointer transition-colors hover:border-primary ${
                    selectedChannels.includes(channel.id) ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => toggleChannel(channel.id)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span>{channel.icon}</span>
                        {channel.name}
                      </CardTitle>
                      {selectedChannels.includes(channel.id) && (
                        <Badge>Selected</Badge>
                      )}
                    </div>
                    <CardDescription>{channel.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )

      case 'channels':
        return (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Customize your dashboard</h2>
              <p className="text-muted-foreground">
                Choose which content types you want to see
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="cursor-pointer transition-colors hover:border-primary">
                <CardHeader>
                  <CardTitle className="text-lg">📝 Questions</CardTitle>
                  <CardDescription>Multiple choice and open-ended questions</CardDescription>
                </CardHeader>
              </Card>
              <Card className="cursor-pointer transition-colors hover:border-primary">
                <CardHeader>
                  <CardTitle className="text-lg">🎴 Flashcards</CardTitle>
                  <CardDescription>Quick review cards for memorization</CardDescription>
                </CardHeader>
              </Card>
              <Card className="cursor-pointer transition-colors hover:border-primary">
                <CardHeader>
                  <CardTitle className="text-lg">📝 Exams</CardTitle>
                  <CardDescription>Simulated interview tests</CardDescription>
                </CardHeader>
              </Card>
              <Card className="cursor-pointer transition-colors hover:border-primary">
                <CardHeader>
                  <CardTitle className="text-lg">🎤 Voice Practice</CardTitle>
                  <CardDescription>Practice explaining concepts aloud</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        )

      case 'complete':
        return (
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold">You're all set!</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Your learning environment is ready. Start your interview preparation journey.
              </p>
            </div>
            <div className="space-y-4 max-w-md mx-auto">
              <button className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 w-full">
                Start Learning
              </button>
              <button className="inline-flex items-center justify-center rounded-md border border-input bg-background px-8 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground w-full">
                Explore Content Library
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Layout>
      <div className="min-h-[80vh] flex flex-col">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-center space-x-2">
            {['welcome', 'profile', 'goals', 'channels', 'complete'].map((s, index) => (
              <div
                key={s}
                className={`w-2 h-2 rounded-full ${
                  s === step ? 'bg-primary' : index < ['welcome', 'profile', 'goals', 'channels', 'complete'].indexOf(step) ? 'bg-primary/50' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 flex items-center justify-center">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-center gap-4">
          {step !== 'welcome' && (
            <button
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              onClick={handleBack}
            >
              Back
            </button>
          )}
          {step !== 'complete' ? (
            <button
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              onClick={handleNext}
            >
              {step === 'welcome' ? 'Get Started' : 'Continue'}
            </button>
          ) : (
            <button
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              onClick={() => window.location.href = '/'}
            >
              Go to Dashboard
            </button>
          )}
        </div>
      </div>
    </Layout>
  )
}