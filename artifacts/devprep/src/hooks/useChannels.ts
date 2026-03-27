import { useState, useEffect } from 'react'
import { channels as staticChannels } from '@/data/channels'
import type { Channel } from '@/data/channels'
import { subscribeDbState, getChannelsFromDb } from '@/services/dbClient'

export interface UseChannelsResult {
  channels: Channel[]
  isLoading: boolean
  error: Error | null
}

export function useChannels(): UseChannelsResult {
  const [channels, setChannels] = useState<Channel[]>(staticChannels)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setIsLoading(true)
    setError(null)

    const unsubscribe = subscribeDbState(state => {
      if (!state.isReady) return

      try {
        const dbChannels = getChannelsFromDb()
        if (dbChannels && dbChannels.length > 0) {
          setChannels(
            dbChannels.map(c => ({
              id: c.id,
              name: c.name,
              shortName: c.shortName,
              emoji: c.emoji,
              color: c.color,
              type: c.type,
              certCode: c.certCode,
              description: c.description,
              tagFilter: c.tagFilter,
            }))
          )
        }
        setIsLoading(false)
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Failed to load channels'))
        setIsLoading(false)
      }
    })

    return () => {
      unsubscribe()
      setIsLoading(false)
    }
  }, [])

  return { channels, isLoading, error }
}
