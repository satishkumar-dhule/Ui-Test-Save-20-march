import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  mockContent,
  mockChannels,
  mockApiResponse,
  createTestQueryClient,
  mockFetch,
  mockFetchError,
  a11y,
  perf,
  MockWebSocket,
  mockLocalStorage,
  generateMockContentList,
  parseMockContent,
  testIds,
  keyboard,
  performanceThresholds,
  coverageTargets,
} from './test-utils'

describe('Test Utilities', () => {
  describe('Mock Data', () => {
    it('provides valid mock content for all types', () => {
      expect(mockContent.question).toBeDefined()
      expect(mockContent.flashcard).toBeDefined()
      expect(mockContent.exam).toBeDefined()
      expect(mockContent.coding).toBeDefined()
      expect(mockContent.voice).toBeDefined()

      // Verify each content type has required fields
      Object.values(mockContent).forEach(content => {
        expect(content.id).toBeDefined()
        expect(content.channel_id).toBeDefined()
        expect(content.content_type).toBeDefined()
        expect(content.data).toBeDefined()
        expect(typeof content.data).toBe('string')

        // Verify data is valid JSON
        const parsed = JSON.parse(content.data)
        expect(parsed).toBeDefined()
      })
    })

    it('provides mock channels', () => {
      expect(mockChannels).toBeInstanceOf(Array)
      expect(mockChannels.length).toBeGreaterThan(0)

      mockChannels.forEach(channel => {
        expect(channel.id).toBeDefined()
        expect(channel.name).toBeDefined()
        expect(channel.type).toBeDefined()
        expect(channel.tags).toBeDefined()
        expect(Array.isArray(channel.tags)).toBe(true)
      })
    })

    it('provides valid mock API response', () => {
      expect(mockApiResponse.ok).toBe(true)
      expect(mockApiResponse.data).toBeDefined()
      expect(mockApiResponse.pagination).toBeDefined()
      expect(mockApiResponse.pagination.total).toBeDefined()
      expect(mockApiResponse.pagination.limit).toBeDefined()
    })
  })

  describe('Test Query Client', () => {
    it('creates a query client with test configuration', () => {
      const client = createTestQueryClient()

      expect(client).toBeDefined()
      expect(client.getDefaultOptions().queries?.retry).toBe(false)
      expect(client.getDefaultOptions().queries?.gcTime).toBe(0)
    })
  })

  describe('Mock Fetch', () => {
    it('creates a successful fetch mock', async () => {
      const data = { result: 'success' }
      const fetchMock = mockFetch(data)

      const response = await fetchMock()
      expect(response.ok).toBe(true)
      expect(await response.json()).toEqual(data)
    })

    it('creates an error fetch mock', async () => {
      const fetchMock = mockFetchError('Not Found', 404)

      const response = await fetchMock()
      expect(response.ok).toBe(false)
      expect(response.status).toBe(404)
    })
  })

  describe('Accessibility Helpers', () => {
    it('checks if element is focusable', () => {
      const focusableElement = document.createElement('button')
      focusableElement.tabIndex = 0
      expect(a11y.isFocusable(focusableElement)).toBe(true)

      const disabledElement = document.createElement('button')
      disabledElement.disabled = true
      expect(a11y.isFocusable(disabledElement)).toBe(false)

      const hiddenElement = document.createElement('button')
      hiddenElement.setAttribute('aria-hidden', 'true')
      expect(a11y.isFocusable(hiddenElement)).toBe(false)
    })

    it('checks color contrast (simplified)', () => {
      expect(a11y.hasSufficientContrast('#000000', '#ffffff')).toBe(true)
      expect(a11y.hasSufficientContrast('#ffffff', '#ffffff')).toBe(false)
    })

    it('checks for valid ARIA attributes', () => {
      const elementWithAria = document.createElement('button')
      elementWithAria.setAttribute('aria-label', 'Close')
      expect(a11y.hasValidAriaAttributes(elementWithAria)).toBe(true)

      const elementWithoutAria = document.createElement('div')
      expect(a11y.hasValidAriaAttributes(elementWithoutAria)).toBe(false)
    })
  })

  describe('Performance Helpers', () => {
    it('measures render time', async () => {
      const renderFn = vi.fn()
      const time = await perf.measureRenderTime(renderFn)

      expect(typeof time).toBe('number')
      expect(time).toBeGreaterThanOrEqual(0)
    })

    it('checks if render completes within limit', async () => {
      const fastRender = vi.fn()
      const result = await perf.rendersWithinLimit(fastRender, 1000)

      expect(result).toBe(true)
    })
  })

  describe('Mock WebSocket', () => {
    beforeEach(() => {
      MockWebSocket.reset()
    })

    it('creates WebSocket instance', () => {
      const ws = new MockWebSocket('ws://localhost:8080')

      expect(MockWebSocket.instances).toHaveLength(1)
      expect(MockWebSocket.lastInstance).toBe(ws)
      expect(ws.url).toBe('ws://localhost:8080')
      expect(ws.readyState).toBe(WebSocket.CONNECTING)
    })

    it('simulates connection opening', async () => {
      const ws = new MockWebSocket('ws://localhost:8080')
      const openHandler = vi.fn()
      ws.onopen = openHandler

      // Wait for next tick to allow connection to open
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(ws.readyState).toBe(WebSocket.OPEN)
      expect(openHandler).toHaveBeenCalled()
    })

    it('simulates messages', () => {
      const ws = new MockWebSocket('ws://localhost:8080')
      const messageHandler = vi.fn()
      ws.onmessage = messageHandler

      const testData = { type: 'test', data: 'hello' }
      ws.simulateMessage(testData)

      expect(messageHandler).toHaveBeenCalled()
      const event = messageHandler.mock.calls[0][0]
      expect(JSON.parse(event.data)).toEqual(testData)
    })

    it('simulates errors', () => {
      const ws = new MockWebSocket('ws://localhost:8080')
      const errorHandler = vi.fn()
      ws.onerror = errorHandler

      ws.simulateError()

      expect(errorHandler).toHaveBeenCalled()
    })
  })

  describe('Mock LocalStorage', () => {
    beforeEach(() => {
      mockLocalStorage.reset()
    })

    it('stores and retrieves items', () => {
      mockLocalStorage.setItem('key', 'value')
      expect(mockLocalStorage.getItem('key')).toBe('value')
    })

    it('removes items', () => {
      mockLocalStorage.setItem('key', 'value')
      mockLocalStorage.removeItem('key')
      expect(mockLocalStorage.getItem('key')).toBeNull()
    })

    it('clears all items', () => {
      mockLocalStorage.setItem('key1', 'value1')
      mockLocalStorage.setItem('key2', 'value2')
      mockLocalStorage.clear()
      expect(mockLocalStorage.getItem('key1')).toBeNull()
      expect(mockLocalStorage.getItem('key2')).toBeNull()
    })
  })

  describe('Content Generators', () => {
    it('generates mock content list', () => {
      const list = generateMockContentList(5, 'question')

      expect(list).toHaveLength(5)
      list.forEach((item, index) => {
        expect(item.id).toBe(`q${index + 1}`)
        expect(item.content_type).toBe('question')
      })
    })

    it('parses mock content', () => {
      const content = mockContent.question
      const parsed = parseMockContent(content)

      expect(parsed.question).toBeDefined()
      expect(parsed.answer).toBeDefined()
      expect(parsed.tags).toBeDefined()
    })
  })

  describe('Constants', () => {
    it('defines test IDs', () => {
      expect(testIds.app).toBe('app')
      expect(testIds.header).toBe('header')
      expect(testIds.navigation).toBe('navigation')
      expect(testIds.loading).toBe('loading')
    })

    it('defines keyboard events', () => {
      expect(keyboard.enter.key).toBe('Enter')
      expect(keyboard.escape.key).toBe('Escape')
      expect(keyboard.space.key).toBe(' ')
      expect(keyboard.tab.key).toBe('Tab')
    })

    it('defines performance thresholds', () => {
      expect(performanceThresholds.componentRender).toBe(100)
      expect(performanceThresholds.hookExecution).toBe(50)
      expect(performanceThresholds.apiResponse).toBe(1000)
    })

    it('defines coverage targets', () => {
      expect(coverageTargets.lines).toBe(80)
      expect(coverageTargets.functions).toBe(80)
      expect(coverageTargets.branches).toBe(80)
      expect(coverageTargets.statements).toBe(80)
    })
  })

  describe('Integration', () => {
    it('mock content can be used in tests', () => {
      const question = mockContent.question
      const parsed = JSON.parse(question.data)

      expect(parsed.question).toBe('What is closure in JavaScript?')
      expect(question.quality_score).toBeGreaterThanOrEqual(0)
    })

    it('mock API response structure matches expectations', () => {
      expect(mockApiResponse.ok).toBe(true)
      expect(Array.isArray(mockApiResponse.data)).toBe(true)
      expect(mockApiResponse.pagination).toHaveProperty('total')
      expect(mockApiResponse.pagination).toHaveProperty('limit')
    })

    it('test utilities are properly exported', () => {
      expect(mockContent).toBeDefined()
      expect(mockChannels).toBeDefined()
      expect(mockApiResponse).toBeDefined()
      expect(createTestQueryClient).toBeDefined()
      expect(mockFetch).toBeDefined()
    })
  })
})
