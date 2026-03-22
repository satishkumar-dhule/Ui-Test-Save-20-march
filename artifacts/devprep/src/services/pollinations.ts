export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface Model {
  id: string
  name: string
}

export const AVAILABLE_MODELS: Model[] = [{ id: 'openai', name: 'Free AI (GPT-OSS)' }]

export interface StreamChunk {
  content: string
  done: boolean
}

export class PollinationsService {
  private baseUrl = 'https://text.pollinations.ai'

  async *streamChat(
    messages: ChatMessage[],
    model: string = 'openai',
    systemPrompt: string = 'You are a helpful AI assistant.'
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const response = await fetch(`${this.baseUrl}/openai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({ role: m.role, content: m.content })),
        ],
        model,
        stream: true,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`API Error ${response.status}: ${errorText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmedLine = line.trim()
        
        // Check for error messages in the stream
        if (trimmedLine.startsWith('data: error') || trimmedLine.includes('error')) {
          try {
            const errorData = JSON.parse(trimmedLine.slice(6))
            if (errorData.error) {
              throw new Error(errorData.error)
            }
          } catch (e) {
            if (e instanceof Error && e.message !== 'Invalid JSON') {
              throw e
            }
          }
        }
        
        if (trimmedLine.startsWith('data: ') && trimmedLine !== 'data: [DONE]') {
          try {
            const data = JSON.parse(trimmedLine.slice(6))
            const delta = data.choices?.[0]?.delta
            const content = delta?.content || delta?.reasoning_content || ''
            if (content) {
              yield { content, done: false }
            }
          } catch {
            // Ignore parse errors for incomplete chunks
          }
        }
      }
    }

    yield { content: '', done: true }
  }

  async chat(
    messages: ChatMessage[],
    model: string = 'openai',
    systemPrompt: string = 'You are a helpful AI assistant.'
  ): Promise<string> {
    let fullContent = ''

    for await (const chunk of this.streamChat(messages, model, systemPrompt)) {
      fullContent += chunk.content
    }

    return fullContent
  }
}

export const pollinationsService = new PollinationsService()
