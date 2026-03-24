import { useState, useEffect, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/molecules/Card/Card'
import { Text } from '@/components/atoms/Text'
import { Button } from '@/components/atoms/Button/Button'
import { Badge } from '@/components/atoms/Badge'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useNewTheme, THEMES, ThemeName } from '@/hooks/useNewTheme'
import { useGeneratedContent } from '@/hooks/useGeneratedContent'
import { cn } from '@/lib/utils/cn'

const SETTINGS_STORAGE_KEY = 'devprep-settings-preferences'

interface SettingsPreferences {
  defaultContentType: string
  itemsPerSession: number
  notificationsEnabled: boolean
  emailNotifications: boolean
  streakReminders: boolean
  weeklyDigest: boolean
}

const defaultPreferences: SettingsPreferences = {
  defaultContentType: 'question',
  itemsPerSession: 10,
  notificationsEnabled: true,
  emailNotifications: false,
  streakReminders: true,
  weeklyDigest: true,
}

const contentTypeOptions = [
  { value: 'question', label: 'Questions' },
  { value: 'flashcard', label: 'Flashcards' },
  { value: 'exam', label: 'Exams' },
  { value: 'voice', label: 'Voice Practice' },
  { value: 'coding', label: 'Coding Challenges' },
]

const itemsPerSessionOptions = [
  { value: 5, label: '5 items' },
  { value: 10, label: '10 items' },
  { value: 15, label: '15 items' },
  { value: 20, label: '20 items' },
  { value: 25, label: '25 items' },
]

const themeIcons: Record<ThemeName, string> = {
  light: '☀️',
  dark: '🌙',
  'high-contrast': '⚡',
}

interface UserStats {
  totalQuestions: number
  totalFlashcards: number
  currentStreak: number
  totalExams: number
  completedSessions: number
}

function UserStatsSection({ stats, loading }: { stats: UserStats; loading: boolean }) {
  const statItems = [
    { label: 'Questions Answered', value: stats.totalQuestions, icon: '❓', color: 'primary' },
    { label: 'Flashcards Reviewed', value: stats.totalFlashcards, icon: '📚', color: 'secondary' },
    { label: 'Current Streak', value: stats.currentStreak, icon: '🔥', color: 'accent' },
    { label: 'Exams Completed', value: stats.totalExams, icon: '📝', color: 'success' },
    { label: 'Sessions', value: stats.completedSessions, icon: '⏱️', color: 'info' },
  ]

  const colorMap: Record<string, string> = {
    primary: 'text-primary bg-primary/10',
    secondary: 'text-secondary bg-secondary/10',
    accent: 'text-accent bg-accent/10',
    success: 'text-emerald-500 bg-emerald-500/10',
    info: 'text-blue-500 bg-blue-500/10',
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-5 w-32 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Stats</CardTitle>
        <CardDescription>Track your learning progress</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {statItems.map((item, index) => (
            <div
              key={item.label}
              className={cn(
                'p-4 rounded-xl border border-border/50 bg-gradient-to-b from-background to-muted/30',
                'transition-all duration-300 hover:shadow-md hover:-translate-y-1',
                'animate-fade-in'
              )}
              style={{ animationDelay: `${index * 75}ms` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={cn(
                    'size-8 rounded-lg flex items-center justify-center',
                    colorMap[item.color]
                  )}
                >
                  <span className="text-lg">{item.icon}</span>
                </div>
              </div>
              <Text variant="h3" size="2xl" weight="bold" className="mb-1">
                {item.value}
              </Text>
              <Text variant="span" size="xs" color="muted" className="block">
                {item.label}
              </Text>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ThemeSelector({
  currentTheme,
  onThemeChange,
}: {
  currentTheme: ThemeName
  onThemeChange: (theme: ThemeName) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Customize how DevPrep looks</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map(theme => (
            <button
              key={theme.name}
              onClick={() => onThemeChange(theme.name)}
              className={cn(
                'p-4 rounded-xl border-2 transition-all duration-200 text-left',
                currentTheme === theme.name
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border/50 hover:border-primary/30 hover:bg-muted/50'
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{themeIcons[theme.name]}</span>
                <Badge variant={currentTheme === theme.name ? 'default' : 'outline'} size="sm">
                  {theme.label}
                </Badge>
              </div>
              <Text variant="span" size="xs" color="muted">
                {theme.description}
              </Text>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function LearningPreferencesSection({
  preferences,
  onUpdate,
}: {
  preferences: SettingsPreferences
  onUpdate: (updates: Partial<SettingsPreferences>) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Learning Preferences</CardTitle>
        <CardDescription>Customize your learning experience</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Text variant="span" size="sm" weight="medium">
            Default Content Type
          </Text>
          <Select
            value={preferences.defaultContentType}
            onValueChange={(value: string) => onUpdate({ defaultContentType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select content type" />
            </SelectTrigger>
            <SelectContent>
              {contentTypeOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Text variant="span" size="xs" color="muted">
            Content type to show when starting a new session
          </Text>
        </div>

        <div className="space-y-2">
          <Text variant="span" size="sm" weight="medium">
            Items Per Session
          </Text>
          <Select
            value={preferences.itemsPerSession.toString()}
            onValueChange={(value: string) => onUpdate({ itemsPerSession: parseInt(value, 10) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select items per session" />
            </SelectTrigger>
            <SelectContent>
              {itemsPerSessionOptions.map(option => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Text variant="span" size="xs" color="muted">
            Number of items to practice in each session
          </Text>
        </div>
      </CardContent>
    </Card>
  )
}

function NotificationPreferencesSection({
  preferences,
  onUpdate,
}: {
  preferences: SettingsPreferences
  onUpdate: (updates: Partial<SettingsPreferences>) => void
}) {
  const toggleItems = [
    {
      key: 'notificationsEnabled',
      label: 'Push Notifications',
      description: 'Receive notifications about reminders and updates',
      defaultChecked: preferences.notificationsEnabled,
    },
    {
      key: 'emailNotifications',
      label: 'Email Notifications',
      description: 'Receive weekly summary emails',
      defaultChecked: preferences.emailNotifications,
    },
    {
      key: 'streakReminders',
      label: 'Streak Reminders',
      description: 'Get reminded to maintain your learning streak',
      defaultChecked: preferences.streakReminders,
    },
    {
      key: 'weeklyDigest',
      label: 'Weekly Digest',
      description: 'Receive a weekly summary of your progress',
      defaultChecked: preferences.weeklyDigest,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Manage your notification preferences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {toggleItems.map(item => (
          <div
            key={item.key}
            className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-background"
          >
            <div className="flex-1 pr-4">
              <Text variant="span" size="sm" weight="medium" className="block mb-1">
                {item.label}
              </Text>
              <Text variant="span" size="xs" color="muted">
                {item.description}
              </Text>
            </div>
            <Switch
              checked={preferences[item.key as keyof SettingsPreferences] as boolean}
              onCheckedChange={(checked: boolean) => onUpdate({ [item.key]: checked })}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function AccountInfoSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>Your account information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-background">
          <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-2xl">👤</span>
          </div>
          <div className="flex-1">
            <Text variant="span" size="sm" weight="semibold" className="block">
              Guest User
            </Text>
            <Text variant="span" size="xs" color="muted">
              Sign in to sync your progress across devices
            </Text>
          </div>
          <Button variant="outline" size="sm">
            Sign In
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-border/50 bg-muted/30">
            <Text variant="span" size="xs" color="muted" className="block mb-1">
              Member Since
            </Text>
            <Text variant="span" size="sm" weight="medium">
              Today
            </Text>
          </div>
          <div className="p-4 rounded-xl border border-border/50 bg-muted/30">
            <Text variant="span" size="xs" color="muted" className="block mb-1">
              Account Type
            </Text>
            <Text variant="span" size="sm" weight="medium">
              Free
            </Text>
          </div>
        </div>

        <div className="pt-2 border-t border-border/50">
          <Button variant="ghost" size="sm" className="text-destructive">
            Delete Account
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function SettingsPage() {
  const { theme, setTheme } = useNewTheme()
  const { generated } = useGeneratedContent()

  const [isPageLoading, setIsPageLoading] = useState(true)
  const [preferences, setPreferences] = useState<SettingsPreferences>(defaultPreferences)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsPageLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setPreferences({ ...defaultPreferences, ...parsed })
      }
    } catch (error) {
      console.warn('Failed to load settings:', error)
    }
  }, [])

  const handlePreferenceUpdate = (updates: Partial<SettingsPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }))

    try {
      const newPrefs = { ...preferences, ...updates }
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newPrefs))
    } catch (error) {
      console.warn('Failed to save settings:', error)
    }
  }

  const stats = useMemo((): UserStats => {
    return {
      totalQuestions: generated.question?.length ?? 0,
      totalFlashcards: generated.flashcard?.length ?? 0,
      currentStreak: 7,
      totalExams: generated.exam?.length ?? 0,
      completedSessions: 12,
    }
  }, [generated])

  if (isPageLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid gap-6">
          <div className="h-40 bg-muted rounded-xl animate-pulse" />
          <div className="h-64 bg-muted rounded-xl animate-pulse" />
          <div className="h-32 bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto animate-fade-in">
      <div className="space-y-1">
        <Text variant="h1" size="3xl" weight="bold">
          Settings
        </Text>
        <Text variant="p" color="muted">
          Manage your account and preferences
        </Text>
      </div>

      <UserStatsSection stats={stats} loading={false} />

      <ThemeSelector currentTheme={theme} onThemeChange={setTheme} />

      <LearningPreferencesSection preferences={preferences} onUpdate={handlePreferenceUpdate} />

      <NotificationPreferencesSection preferences={preferences} onUpdate={handlePreferenceUpdate} />

      <AccountInfoSection />
    </div>
  )
}

export default SettingsPage
