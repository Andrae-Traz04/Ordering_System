import { useState, useRef, useEffect, useCallback } from 'react'
import { sendChatMessage, fetchChatbotInfo } from '../api/ordersApi'
import { useAuth } from '@/context/AuthContext'

// ── Styles ────────────────────────────────────────────────────────────────
const C = {
  primary: '#7C3AED',
  primaryLight: '#9B6DFF',
  primaryBg: '#F3EEFF',
  dark: '#2D1F6E',
  mid: '#9B8FC0',
  light: '#C4B8E8',
  white: '#fff',
  red: '#ef4444',
  green: '#10B981',
  bubbleBot: '#F3EEFF',
  bubbleUser: '#7C3AED',
  border: '#F0EBFF',
}

const STYLE = {
  button: {
    position: 'fixed',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: '50%',
    border: 'none',
    background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
    color: C.white,
    fontSize: 24,
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  container: {
    position: 'fixed',
    bottom: 90,
    right: 24,
    width: 380,
    maxHeight: 500,
    background: C.white,
    borderRadius: 20,
    boxShadow: '0 8px 40px rgba(124,58,237,0.18)',
    border: `1.5px solid ${C.border}`,
    display: 'flex',
    flexDirection: 'column',
    zIndex: 999,
    overflow: 'hidden',
    animation: 'chatIn 0.25s ease',
  },
  header: {
    padding: '16px 20px',
    background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
    color: C.white,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: C.green,
    display: 'inline-block',
    animation: 'pulse 2s infinite',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: C.white,
    fontSize: 20,
    cursor: 'pointer',
    padding: 4,
    opacity: 0.8,
    transition: 'opacity 0.15s',
  },
  messagesArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    background: '#FAF8FF',
  },
  bubbleWrapper: {
    display: 'flex',
    flexDirection: 'column',
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    background: C.bubbleUser,
    color: C.white,
    padding: '10px 14px',
    borderRadius: '16px 16px 4px 16px',
    fontSize: 13,
    fontWeight: 500,
    maxWidth: '80%',
    wordBreak: 'break-word',
    lineHeight: 1.4,
  },
  bubbleBot: {
    alignSelf: 'flex-start',
    background: C.bubbleBot,
    color: C.dark,
    padding: '10px 14px',
    borderRadius: '16px 16px 16px 4px',
    fontSize: 13,
    fontWeight: 500,
    maxWidth: '80%',
    wordBreak: 'break-word',
    lineHeight: 1.4,
    border: `1px solid ${C.border}`,
  },
  inputArea: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 16px',
    borderTop: `1.5px solid ${C.border}`,
    background: C.white,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    border: `1.5px solid ${C.border}`,
    borderRadius: 12,
    fontSize: 13,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    outline: 'none',
    background: C.white,
    color: C.dark,
    transition: 'border-color 0.15s',
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    border: 'none',
    background: C.primary,
    color: C.white,
    fontSize: 16,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s',
    flexShrink: 0,
  },
  typing: {
    alignSelf: 'flex-start',
    background: C.bubbleBot,
    padding: '10px 14px',
    borderRadius: '16px 16px 16px 4px',
    border: `1px solid ${C.border}`,
    display: 'flex',
    gap: 4,
    alignItems: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: C.mid,
    animation: 'bounce 1.4s infinite',
  },
  welcome: {
    textAlign: 'center',
    color: C.mid,
    fontSize: 12,
    padding: '20px 0',
    lineHeight: 1.6,
  },
  emptyInput: {
    borderColor: C.red,
  },
}

// ── Component ──────────────────────────────────────────────────────────────

export default function ChatbotWidget() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [provider, setProvider] = useState('fallback')
  const [streamingMessage, setStreamingMessage] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const abortControllerRef = useRef(null)

  // Fetch chatbot info on mount
  useEffect(() => {
    fetchChatbotInfo()
      .then((res) => {
        if (res?.data?.provider) setProvider(res.data.provider)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading, streamingMessage])

  // Cleanup streaming on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const addMessage = (text, sender) => {
    setMessages((prev) => [...prev, { id: Date.now() + Math.random(), text, sender }])
  }

  const streamChatMessage = async (message) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch('/api/chatbot/stream/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error('Failed to get streaming response')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.chunk) {
                accumulatedText += data.chunk
                setStreamingMessage(accumulatedText)
              }
              if (data.done) {
                // Add the completed message
                addMessage(accumulatedText, 'bot')
                setStreamingMessage('')
                return
              }
              if (data.error) {
                addMessage(data.error, 'bot')
                setStreamingMessage('')
                return
              }
            } catch (e) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        return // Request was aborted, ignore
      }
      console.error('Streaming error:', error)
      addMessage('Sorry, I encountered an error while processing your message.', 'bot')
      setStreamingMessage('')
    }
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return

    // Clear input immediately for responsiveness
    setInput('')
    addMessage(text, 'user')
    setLoading(true)

    // Try streaming first, fallback to regular API
    try {
      await streamChatMessage(text)
    } catch (error) {
      console.warn('Streaming failed, falling back to regular API:', error)
      try {
        const res = await sendChatMessage(text)
        const reply = res?.data?.response || "Sorry, I couldn't process that. Please try again."
        // Simulate a small delay for more natural feel
        await new Promise((r) => setTimeout(r, 400))
        addMessage(reply, 'bot')
      } catch (err) {
        addMessage(
          "I'm having trouble connecting. You can try again or contact support@amubowls.com.",
          'bot'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClose = () => {
    setOpen(false)
  }

  const handleToggle = () => {
    setOpen((prev) => !prev)
    // Focus input when opening
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const providerLabel =
    provider === 'azure'
      ? 'Azure OpenAI'
      : provider === 'openai'
      ? 'OpenAI'
      : 'Rule-based Assistant'

  return (
    <>
      {/* ── Chat Button ── */}
      <button
        onClick={handleToggle}
        style={STYLE.button}
        title="Chat with us"
        aria-label="Open chat"
      >
        💬
      </button>

      {/* ── Chat Window ── */}
      {open && (
        <div style={STYLE.container}>
          {/* Header */}
          <div style={STYLE.header}>
            <div style={STYLE.title}>
              <span style={STYLE.statusDot} title="Online" />
              AMU Bowls Assistant
            </div>
            <button onClick={handleClose} style={STYLE.closeBtn} title="Close chat" aria-label="Close chat">
              ✕
            </button>
          </div>

          {/* Messages */}
          <div style={STYLE.messagesArea}>
            {/* Welcome message */}
            {messages.length === 0 && (
              <div style={STYLE.welcome}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>👋</div>
                <strong>Hi! I'm your shopping assistant.</strong>
                <br />
                I can help with products, orders, and account questions.
                <br />
                <span style={{ fontSize: 11, color: C.light }}>
                  Powered by {providerLabel}
                </span>
              </div>
            )}

            {/* Message bubbles */}
            {messages.map((msg) => (
              <div key={msg.id} style={STYLE.bubbleWrapper}>
                <div style={msg.sender === 'user' ? STYLE.bubbleUser : STYLE.bubbleBot}>
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Streaming message */}
            {streamingMessage && (
              <div style={STYLE.bubbleWrapper}>
                <div style={STYLE.bubbleBot}>
                  {streamingMessage}
                  <span style={{ opacity: 0.6, animation: 'blink 1s infinite' }}>▊</span>
                </div>
              </div>
            )}

            {/* Typing indicator (fallback when not streaming) */}
            {loading && !streamingMessage && (
              <div style={STYLE.typing}>
                <div style={{ ...STYLE.dot, animationDelay: '0s' }} />
                <div style={{ ...STYLE.dot, animationDelay: '0.2s' }} />
                <div style={{ ...STYLE.dot, animationDelay: '0.4s' }} />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={STYLE.inputArea}>
            <input
              ref={inputRef}
              style={STYLE.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your question..."
              aria-label="Chat input"
              disabled={loading || !!streamingMessage}
            />
            <button
              onClick={handleSend}
              disabled={loading || streamingMessage || !input.trim()}
              style={{
                ...STYLE.sendBtn,
                opacity: (loading || streamingMessage || !input.trim()) ? 0.4 : 1,
                cursor: (loading || streamingMessage || !input.trim()) ? 'wait' : 'pointer',
              }}
              title="Send"
              aria-label="Send message"
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* ── Animations ── */}
      <style>{`
        @keyframes chatIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </>
  )
}