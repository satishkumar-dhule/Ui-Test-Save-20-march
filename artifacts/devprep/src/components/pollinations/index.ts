export { PollinationsChat } from './PollinationsChat'
export type { ChatMessage, Model, StreamChunk } from '@/services/pollinations'
export { AVAILABLE_MODELS, pollinationsService } from '@/services/pollinations'

export interface Message {
  role: 'user' | 'assistant'
  content: string
}
