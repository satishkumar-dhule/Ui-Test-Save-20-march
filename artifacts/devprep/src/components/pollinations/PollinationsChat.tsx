import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Send, AlertCircle, Bot, User, Settings, MessageSquare } from 'lucide-react'
import { motion } from 'framer-motion'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ChatMessage, AVAILABLE_MODELS, pollinationsService } from '@/services/pollinations'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function PollinationsChat() {
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const autoResizeTextarea = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [])

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return

    const userMessage = input.trim()
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    const newMessages = [...messages, { role: 'user' as const, content: userMessage }]
    setMessages(newMessages)
    setIsTyping(true)
    setError(null)

    abortControllerRef.current = new AbortController()

    try {
      const chatMessages: ChatMessage[] = newMessages.map(m => ({
        role: m.role,
        content: m.content,
      }))

      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      let assistantMessage = ''
      const systemPrompt =
        'You are a helpful AI assistant that provides clear, accurate, and concise responses.'

      for await (const chunk of pollinationsService.streamChat(
        chatMessages,
        selectedModel,
        systemPrompt
      )) {
        if (abortControllerRef.current?.signal.aborted) break

        assistantMessage += chunk.content
        setMessages(prev => {
          const updated = [...prev]
          if (updated[updated.length - 1].role === 'assistant') {
            updated[updated.length - 1].content = assistantMessage
          }
          return updated
        })
      }
    } catch (err: unknown) {
      const error = err as Error
      if (error.name !== 'AbortError') {
        setError(error.message || 'Failed to send message')
        setMessages(prev => {
          if (prev[prev.length - 1].role === 'assistant' && prev[prev.length - 1].content === '') {
            return prev.slice(0, -1)
          }
          return prev
        })
      }
    } finally {
      setIsTyping(false)
      abortControllerRef.current = null
    }
  }

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsTyping(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 bg-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center">
              <MessageSquare size={18} />
            </div>
            <h1 className="font-semibold hidden sm:block">Free AI Chat</h1>
          </div>

          <div className="flex-1 max-w-md">
            <div className="relative">
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                className="w-full appearance-none bg-zinc-950 border border-zinc-800 rounded-lg py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-zinc-200"
              >
                {AVAILABLE_MODELS.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-zinc-500">
                <Settings size={14} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-6 pb-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4">
              <Bot size={48} className="text-zinc-800" />
              <p>Send a message to start chatting for free!</p>
              <p className="text-xs text-zinc-600 max-w-sm text-center">
                No API key required. Powered by Pollinations.ai.
              </p>
            </div>
          ) : (
            messages.map((message, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {message.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-sm'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-sm'
                  }`}
                >
                  {message.role === 'user' ? (
                    <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                  ) : (
                    <div className="text-sm prose prose-invert max-w-none">
                      <Markdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: props => <p className="mb-3 last:mb-0 leading-relaxed" {...props} />,
                          code: ({ className, children, ...props }) => {
                            const match = /language-(\w+)/.exec(className || '')
                            const isCodeBlock = !!match && className?.includes('language-')
                            return isCodeBlock ? (
                              <div className="relative group my-4">
                                <div className="absolute top-0 right-0 px-2 py-1 text-xs text-zinc-500 bg-zinc-800/50 rounded-bl-lg rounded-tr-lg">
                                  {match?.[1] || 'code'}
                                </div>
                                <pre className="bg-zinc-950 p-4 rounded-lg overflow-x-auto border border-zinc-800">
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                </pre>
                              </div>
                            ) : (
                              <code
                                className="bg-zinc-800 text-indigo-300 px-1.5 py-0.5 rounded text-xs font-mono"
                                {...props}
                              >
                                {children}
                              </code>
                            )
                          },
                          ul: props => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
                          ol: props => (
                            <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />
                          ),
                          li: props => <li className="leading-relaxed" {...props} />,
                          a: props => (
                            <a
                              className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                              target="_blank"
                              rel="noopener noreferrer"
                              {...props}
                            />
                          ),
                          h1: props => <h1 className="text-xl font-bold mb-4 mt-6" {...props} />,
                          h2: props => <h2 className="text-lg font-bold mb-3 mt-5" {...props} />,
                          h3: props => <h3 className="text-base font-bold mb-2 mt-4" {...props} />,
                          blockquote: props => (
                            <blockquote
                              className="border-l-2 border-zinc-700 pl-4 italic text-zinc-400 my-4"
                              {...props}
                            />
                          ),
                        }}
                      >
                        {message.content || '...'}
                      </Markdown>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-2 shadow-lg">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => {
                setInput(e.target.value)
                autoResizeTextarea()
              }}
              onKeyDown={handleKeyDown}
              placeholder="Message AI..."
              className="flex-1 max-h-[200px] min-h-[44px] bg-transparent border-0 resize-none py-3 px-3 text-sm focus:ring-0 text-zinc-100 placeholder-zinc-500"
              rows={1}
            />
            {isTyping ? (
              <button
                onClick={stopGeneration}
                className="shrink-0 w-10 h-10 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl flex items-center justify-center transition-colors mb-0.5"
                title="Stop generation"
              >
                <div className="w-4 h-4 bg-red-400 rounded-sm" />
              </button>
            ) : (
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isTyping}
                className="shrink-0 w-10 h-10 bg-indigo-500 hover:bg-indigo-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-xl flex items-center justify-center transition-colors mb-0.5"
              >
                <Send size={18} className="ml-0.5" />
              </button>
            )}
          </div>
        </div>
        <div className="text-center mt-2">
          <p className="text-[10px] text-zinc-600">
            Powered by Pollinations.ai. AI models can make mistakes.
          </p>
        </div>
      </main>
    </div>
  )
}

export default PollinationsChat
