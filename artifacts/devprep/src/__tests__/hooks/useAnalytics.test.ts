import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAnalytics } from '@/hooks/useAnalytics'

const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}

vi.stubGlobal('localStorage', mockLocalStorage)

describe('useAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  it('returns analytics object', () => {
    const { result } = renderHook(() => useAnalytics())
    expect(result.current.analytics).toBeDefined()
    expect(typeof result.current.analytics).toBe('object')
  })

  it('updateStats function does not throw', () => {
    const { result } = renderHook(() => useAnalytics())
    expect(() => result.current.updateStats()).not.toThrow()
  })
})
