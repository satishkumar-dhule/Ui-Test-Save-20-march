import { apiClient, type ApiResponse } from './client'

export interface ContentItem {
  id: string
  content_type: 'question' | 'flashcard' | 'exam' | 'voice' | 'coding'
  channel_id: string
  data: Record<string, unknown>
  quality_score: number
  created_at: number
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
  getAll: async (params?: ContentParams): Promise<ApiResponse<ContentItem[]>> => {
    const queryParams: Record<string, string> = {}
    if (params?.channel) queryParams.channel = params.channel
    if (params?.type) queryParams.type = params.type
    if (params?.limit) queryParams.limit = params.limit.toString()
    if (params?.offset) queryParams.offset = params.offset.toString()

    return apiClient.get<ContentItem[]>('/content', queryParams)
  },

  getByType: async (
    type: string,
    params?: Omit<ContentParams, 'type'>
  ): Promise<ApiResponse<ContentItem[]>> => {
    return contentApi.getAll({ ...params, type })
  },

  getByChannel: async (
    channelId: string,
    params?: Omit<ContentParams, 'channel'>
  ): Promise<ApiResponse<ContentItem[]>> => {
    return contentApi.getAll({ ...params, channel: channelId })
  },
}

export const channelsApi = {
  getAll: async (): Promise<ApiResponse<Channel[]>> => {
    // Channels are currently static in the frontend, but we can create an API endpoint later
    // For now, we'll return a mock response
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
