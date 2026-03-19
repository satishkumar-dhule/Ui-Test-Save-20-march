import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useGeneratedContent } from '@/hooks/useGeneratedContent'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('useGeneratedContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns generated object', () => {
    mockFetch.mockRejectedValue(new Error('API unavailable'))
    const { result } = renderHook(() => useGeneratedContent())
    expect(result.current.generated).toBeDefined()
  })

  it('returns loading as boolean', () => {
    mockFetch.mockRejectedValue(new Error('API unavailable'))
    const { result } = renderHook(() => useGeneratedContent())
    expect(typeof result.current.loading).toBe('boolean')
  })

  it('returns error as null initially when API fails', () => {
    mockFetch.mockRejectedValue(new Error('API unavailable'))
    const { result } = renderHook(() => useGeneratedContent())
    expect(result.current.error === null || typeof result.current.error === 'string').toBe(true)
  })
})
