import { useState, useEffect } from 'react'
import { channels as staticChannels } from '@/data/channels'
import type { Channel } from '@/data/channels'
import { subscribeDbState, getChannelsFromDb } from '@/services/dbClient'

/**
 * Returns the channel list from the DB (source of truth).
 * Falls back to the static channels.ts list until the DB has loaded.
 */
export function useChannels(): Channel[] {
  const [channels, setChannels] = useState<Channel[]>(staticChannels)

  useEffect(() => {
    const unsubscribe = subscribeDbState((state) => {
      if (!state.isReady) return
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
    })
    return unsubscribe
  }, [])

  return channels
}
