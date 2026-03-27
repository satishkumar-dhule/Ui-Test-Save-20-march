import { useState, useEffect } from 'react'
import { channels as staticChannels } from '@/data/channels'
import type { Channel } from '@/data/channels'

export interface UseChannelsResult {
  channels: Channel[]
  isLoading: boolean
  error: Error | null
}

export function useChannels(): UseChannelsResult {
  const [channels, setChannels] = useState<Channel[]>(staticChannels)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setIsLoading(false)
    setChannels(staticChannels)
  }, [])

  return { channels, isLoading, error }
}

export function useChannelsArray(): Channel[] {
  const result = useChannels()
  return result.channels
}
