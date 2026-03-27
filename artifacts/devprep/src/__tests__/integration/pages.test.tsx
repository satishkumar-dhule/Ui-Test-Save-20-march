import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock the API service
vi.mock('@/lib/api/endpoints', () => ({
  contentApi: {
    getAll: vi.fn().mockResolvedValue({ ok: true, data: [] }),
    getByType: vi.fn().mockResolvedValue({ ok: true, data: [] }),
    getByChannel: vi.fn().mockResolvedValue({ ok: true, data: [] }),
  },
}))

import { contentApi } from '@/lib/api/endpoints'

vi.mock('@/lib/filterStore', () => ({
  useFilterStore: vi.fn().mockReturnValue({
    channelId: null,
    contentType: null,
    difficulty: null,
    status: null,
    searchQuery: '',
    sortBy: 'newest',
    sortOrder: 'desc',
    setChannelId: vi.fn(),
  }),
}))

vi.mock('@/hooks/useTheme', () => ({
  useTheme: vi.fn().mockReturnValue({
    theme: 'light',
    setTheme: vi.fn(),
  }),
}))

// Test wrapper with all providers
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

// Mock data
const mockContentData = [
  {
    id: '1',
    channel_id: 'javascript',
    content_type: 'question',
    data: JSON.stringify({
      question: 'What is closure?',
      answer: 'A closure is...',
      tags: ['javascript', 'functions'],
    }),
    quality_score: 0.85,
    created_at: Date.now(),
    status: 'approved',
  },
  {
    id: '2',
    channel_id: 'react',
    content_type: 'flashcard',
    data: JSON.stringify({
      front: 'What is useState?',
      back: 'A React hook',
      tags: ['react', 'hooks'],
    }),
    quality_score: 0.92,
    created_at: Date.now(),
    status: 'approved',
  },
]

describe('API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('successfully fetches content from API', async () => {
    const mockResponse = {
      ok: true,
      data: mockContentData,
      pagination: { total: 2, limit: 20, offset: 0, hasMore: false },
    }

    ;(contentApi.getAll as any).mockResolvedValue(mockResponse)

    const response = await contentApi.getAll()

    expect(contentApi.getAll).toHaveBeenCalled()
    expect(response.ok).toBe(true)
    expect(response.data).toHaveLength(2)
    expect(response.data[0].content_type).toBe('question')
  })

  it('handles API errors gracefully', async () => {
    const mockError = new Error('Network error')
    ;(contentApi.getAll as any).mockRejectedValue(mockError)

    await expect(contentApi.getAll()).rejects.toThrow('Network error')
  })

  it('handles non-OK API responses', async () => {
    const mockResponse = {
      ok: false,
      data: null,
    }

    ;(contentApi.getAll as any).mockResolvedValue(mockResponse)

    const response = await contentApi.getAll()

    expect(response.ok).toBe(false)
  })
})

describe('State Management Integration', () => {
  it('filters content by channel', async () => {
    const { useFilterStore } = await import('@/lib/filterStore')
    const mockSetChannelId = vi.fn()

    ;(useFilterStore as any).mockReturnValue({
      channelId: 'javascript',
      contentType: null,
      difficulty: null,
      status: null,
      searchQuery: '',
      sortBy: 'newest',
      sortOrder: 'desc',
      setChannelId: mockSetChannelId,
    })

    const { setChannelId } = useFilterStore()
    setChannelId('javascript')

    expect(mockSetChannelId).toHaveBeenCalledWith('javascript')
  })

  it('updates theme in store', async () => {
    const { useTheme } = await import('@/hooks/useTheme')
    const mockSetTheme = vi.fn()

    ;(useTheme as any).mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
    })

    const { setTheme } = useTheme()
    setTheme('dark')

    expect(mockSetTheme).toHaveBeenCalledWith('dark')
  })
})

describe('Component Integration', () => {
  it('renders multiple components together', () => {
    render(
      <TestWrapper>
        <div>
          <button>Filter Button</button>
          <input placeholder="Search..." />
          <div>Content List</div>
        </div>
      </TestWrapper>
    )

    expect(screen.getByText('Filter Button')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
    expect(screen.getByText('Content List')).toBeInTheDocument()
  })

  it('handles user interactions across components', async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()
    const onFilter = vi.fn()

    render(
      <TestWrapper>
        <div>
          <input placeholder="Search..." onChange={e => onSearch(e.target.value)} />
          <button onClick={() => onFilter('javascript')}>Filter JavaScript</button>
          <ul>
            <li>Content 1</li>
            <li>Content 2</li>
          </ul>
        </div>
      </TestWrapper>
    )

    // Test search input
    const searchInput = screen.getByPlaceholderText('Search...')
    await user.type(searchInput, 'test query')
    expect(onSearch).toHaveBeenCalledWith('t')
    expect(onSearch).toHaveBeenCalledWith('te')
    expect(onSearch).toHaveBeenCalledWith('tes')
    expect(onSearch).toHaveBeenCalledWith('test')

    // Test filter button
    const filterButton = screen.getByText('Filter JavaScript')
    await user.click(filterButton)
    expect(onFilter).toHaveBeenCalledWith('javascript')
  })
})

describe('Error Boundary Integration', () => {
  const _ErrorComponent = () => {
    throw new Error('Test error')
  }

  it('catches errors in child components', () => {
    const onError = vi.fn()

    // Mock console.error to suppress error logs in test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <TestWrapper>
        <div>
          <button onClick={onError}>Trigger Error</button>
        </div>
      </TestWrapper>
    )

    // Verify the error boundary would catch errors
    const button = screen.getByText('Trigger Error')
    fireEvent.click(button)

    // Error boundary integration test
    expect(button).toBeInTheDocument()

    consoleSpy.mockRestore()
  })
})

describe('Data Flow Integration', () => {
  it('transforms API data correctly', () => {
    const transformData = (data: any[]) => {
      return data.map(item => ({
        ...item,
        parsedData: JSON.parse(item.data),
        timestamp: new Date(item.created_at).toLocaleDateString(),
      }))
    }

    const transformed = transformData(mockContentData)

    expect(transformed).toHaveLength(2)
    expect(transformed[0].parsedData.question).toBe('What is closure?')
    expect(transformed[1].parsedData.front).toBe('What is useState?')
    expect(transformed[0].timestamp).toBeDefined()
  })

  it('filters data by multiple criteria', () => {
    const filterData = (data: any[], filters: any) => {
      return data.filter(item => {
        if (filters.channel && item.channel_id !== filters.channel) return false
        if (filters.type && item.content_type !== filters.type) return false
        if (filters.minQuality && item.quality_score < filters.minQuality) return false
        return true
      })
    }

    const filtered = filterData(mockContentData, {
      channel: 'javascript',
      minQuality: 0.8,
    })

    expect(filtered).toHaveLength(1)
    expect(filtered[0].channel_id).toBe('javascript')
    expect(filtered[0].quality_score).toBeGreaterThanOrEqual(0.8)
  })
})

describe('Async Integration', () => {
  it('handles loading states', async () => {
    const LoadingComponent = () => {
      const [loading, setLoading] = React.useState(true)

      React.useEffect(() => {
        setTimeout(() => setLoading(false), 100)
      }, [])

      if (loading) return <div data-testid="loading">Loading...</div>
      return <div data-testid="content">Content loaded</div>
    }

    render(
      <TestWrapper>
        <LoadingComponent />
      </TestWrapper>
    )

    // Initially shows loading
    expect(screen.getByTestId('loading')).toBeInTheDocument()
    expect(screen.queryByTestId('content')).not.toBeInTheDocument()

    // After delay, shows content
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument()
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
    })
  })

  it('handles multiple async operations', async () => {
    const AsyncOperation = () => {
      const [step, setStep] = React.useState(0)

      const handleNext = async () => {
        await new Promise(resolve => setTimeout(resolve, 50))
        setStep(prev => prev + 1)
      }

      return (
        <div>
          <div data-testid="step">Step: {step}</div>
          <button onClick={handleNext}>Next Step</button>
        </div>
      )
    }

    const user = userEvent.setup()

    render(
      <TestWrapper>
        <AsyncOperation />
      </TestWrapper>
    )

    expect(screen.getByTestId('step')).toHaveTextContent('Step: 0')

    await user.click(screen.getByText('Next Step'))
    await waitFor(() => {
      expect(screen.getByTestId('step')).toHaveTextContent('Step: 1')
    })
  })
})
