import { useState } from 'react'
import {
  ResponsiveButton,
  ResponsiveText,
  ResponsiveGrid,
  AdaptiveCard,
} from '@/components/responsive'

interface ContentItem {
  id: string
  title: string
  description: string
  type: 'question' | 'flashcard' | 'exam' | 'voice' | 'coding'
}

export function MobileOptimizedExample() {
  const [selectedItem, setSelectedItem] = useState<string | null>(null)

  const sampleContent: ContentItem[] = [
    {
      id: '1',
      title: 'JavaScript Closures',
      description: 'Explain how closures work in JavaScript and provide practical examples.',
      type: 'question',
    },
    {
      id: '2',
      title: 'React Hooks',
      description: 'Create flashcards for useState, useEffect, and custom hooks.',
      type: 'flashcard',
    },
    {
      id: '3',
      title: 'Algorithm Complexity',
      description: 'Practice time and space complexity analysis for common algorithms.',
      type: 'exam',
    },
  ]

  return (
    <div className="container-responsive py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <ResponsiveText variant="3xl" weight="bold">
          Mobile-Optimized Content
        </ResponsiveText>
        <ResponsiveText variant="base" color="muted">
          Experience responsive design with container queries and touch optimization
        </ResponsiveText>
      </div>

      {/* Responsive Grid */}
      <ResponsiveGrid columns={{ default: 1, sm: 2, lg: 3 }} gap="lg">
        {sampleContent.map(item => (
          <MobileContentCard
            key={item.id}
            item={item}
            isSelected={selectedItem === item.id}
            onSelect={() => setSelectedItem(item.id)}
          />
        ))}
      </ResponsiveGrid>

      {/* Mobile Navigation Example */}
      <MobileNavigationExample />

      {/* Responsive Form Example */}
      <ResponsiveFormExample />
    </div>
  )
}

interface MobileContentCardProps {
  item: ContentItem
  isSelected: boolean
  onSelect: () => void
}

function MobileContentCard({ item, isSelected, onSelect }: MobileContentCardProps) {
  const typeColors = {
    question: 'text-blue-600',
    flashcard: 'text-green-600',
    exam: 'text-purple-600',
    voice: 'text-orange-600',
    coding: 'text-red-600',
  }

  return (
    <AdaptiveCard
      title={item.title}
      icon={
        <span className={`text-2xl ${typeColors[item.type]}`}>
          {item.type === 'question' && '❓'}
          {item.type === 'flashcard' && '🃏'}
          {item.type === 'exam' && '📝'}
          {item.type === 'voice' && '🎤'}
          {item.type === 'coding' && '💻'}
        </span>
      }
      actions={
        <ResponsiveButton size="sm" variant={isSelected ? 'primary' : 'outline'} onClick={onSelect}>
          {isSelected ? 'Selected' : 'Select'}
        </ResponsiveButton>
      }
    >
      <ResponsiveText variant="sm" color="muted" className="mt-2">
        {item.description}
      </ResponsiveText>
    </AdaptiveCard>
  )
}

function MobileNavigationExample() {
  const [activeTab, setActiveTab] = useState('home')

  const tabs = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'search', label: 'Search', icon: '🔍' },
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ]

  return (
    <div className="space-y-4">
      <ResponsiveText variant="xl" weight="semibold">
        Mobile Navigation
      </ResponsiveText>

      {/* Bottom Navigation (Mobile) */}
      <div className="md:hidden">
        <div className="glass-navbar fixed bottom-0 left-0 right-0 p-2 safe-area-bottom">
          <div className="flex justify-around">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center p-3 rounded-xl touch-feedback ${
                  activeTab === tab.id ? 'text-primary bg-primary/10' : 'text-muted-foreground'
                }`}
              >
                <span className="text-2xl">{tab.icon}</span>
                <span className="text-xs mt-1">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:block">
        <div className="glass-card rounded-xl p-4">
          <div className="flex gap-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ResponsiveFormExample() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
  }

  return (
    <div className="space-y-4">
      <ResponsiveText variant="xl" weight="semibold">
        Responsive Form
      </ResponsiveText>

      <form onSubmit={handleSubmit} className="space-y-4">
        <ResponsiveGrid columns={{ default: 1, md: 2 }} gap="md">
          <div>
            <label className="block text-responsive-sm font-medium mb-2">
              Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="input-mobile w-full"
              placeholder="Enter your name"
            />
          </div>

          <div>
            <label className="block text-responsive-sm font-medium mb-2">
              Email <span className="text-destructive">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="input-mobile w-full"
              placeholder="Enter your email"
            />
          </div>
        </ResponsiveGrid>

        <div>
          <label className="block text-responsive-sm font-medium mb-2">Message</label>
          <textarea
            value={formData.message}
            onChange={e => setFormData({ ...formData, message: e.target.value })}
            className="input-mobile w-full min-h-[120px]"
            placeholder="Your message..."
            rows={4}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <ResponsiveButton type="submit" variant="primary" fullWidth>
            Submit Form
          </ResponsiveButton>
          <ResponsiveButton
            type="button"
            variant="outline"
            onClick={() => setFormData({ name: '', email: '', message: '' })}
            fullWidth
          >
            Reset
          </ResponsiveButton>
        </div>
      </form>
    </div>
  )
}
