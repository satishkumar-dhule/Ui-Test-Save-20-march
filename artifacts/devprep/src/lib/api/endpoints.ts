/**
 * @deprecated This module is deprecated. Import directly from @/services/contentApi
 * This file is kept for backward compatibility - it now delegates to contentApi.ts
 */
import { fetchAllContent, fetchChannelContent, type ContentRecord } from '@/services/contentApi'

export interface ContentItem {
  id: string
  content_type: 'question' | 'flashcard' | 'exam' | 'voice' | 'coding'
  channel_id: string
  data: Record<string, unknown>
  quality_score: number
  created_at: number
}

// Convert contentApi record to ContentItem format
function toContentItem(record: ContentRecord): ContentItem {
  return {
    id: record.id,
    content_type: record.content_type as ContentItem['content_type'],
    channel_id: record.channel_id,
    data: record.data as Record<string, unknown>,
    quality_score: record.quality_score,
    created_at: record.created_at,
  }
}

export interface Channel {
  id: string
  name: string
  type: 'tech' | 'cert'
  tags: string[]
  tagFilter?: string[]
}

export interface ContentParams {
  channel?: string
  type?: string
  limit?: number
  offset?: number
}

export const contentApi = {
  getAll: async (params?: ContentParams) => {
    const records = await fetchAllContent({
      channelId: params?.channel,
      contentType: params?.type,
      limit: params?.limit,
      offset: params?.offset,
    })
    return {
      ok: true,
      data: records.map(toContentItem),
    }
  },

  getByType: async (type: string, params?: Omit<ContentParams, 'type'>) => {
    return contentApi.getAll({ ...params, type })
  },

  getByChannel: async (channelId: string, params?: Omit<ContentParams, 'channel'>) => {
    const records = await fetchChannelContent(channelId, {
      contentType: params?.type,
      limit: params?.limit,
      offset: params?.offset,
    })
    return {
      ok: true,
      data: records.map(toContentItem),
    }
  },
}

// Keep existing channelsApi (returns static data for now)
export const channelsApi = {
  getAll: async (): Promise<{ ok: boolean; data: Channel[] }> => {
    return {
      ok: true,
      data: [
        {
          id: 'javascript',
          name: 'JavaScript',
          type: 'tech',
          tags: ['javascript', 'async', 'closures', 'prototype'],
        },
        {
          id: 'react',
          name: 'React',
          type: 'tech',
          tags: ['react', 'hooks', 'state', 'performance'],
        },
        {
          id: 'algorithms',
          name: 'Algorithms',
          type: 'tech',
          tags: ['algorithms', 'sorting', 'big-o', 'dp'],
        },
        {
          id: 'devops',
          name: 'DevOps',
          type: 'tech',
          tags: ['devops', 'docker', 'ci-cd', 'linux'],
        },
        {
          id: 'kubernetes',
          name: 'Kubernetes',
          type: 'tech',
          tags: ['kubernetes', 'k8s', 'containers'],
        },
      ],
    }
  },
}
