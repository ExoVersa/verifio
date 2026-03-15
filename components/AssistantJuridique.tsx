'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Loader2, Scale, MessageSquare, ChevronRight, RotateCcw } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const QUICK_QUESTIONS = [
  { label: 'Mon artisan a disparu avec l\'acompte', icon: '🚨' },
  { label: 'Les travaux sont mal faits', icon: '🔨' },
  { label: 'Le chantier n\'est pas terminé', icon: '🏗️' },
  { label: 'L\'artisan dépasse largement le délai prévu', icon: '⏰' },
  { label: 'Je veux annuler le contrat', icon: '📄' },
  { label: 'Mon artisan n\'a pas de décennale', icon: '⚠️' },
  { label: 'L\'artisan réclame plus que le devis', icon: '💶' },
  { label: 'Je n\'arrive plus à contacter mon artisan', icon: '📵' },
]

function formatMarkdown(text: string) {
  // Split into lines and render with basic markdown
  const lines = text.split('\n')
  return lines.map((line, i) => {
    // Bold **text**
    const renderBold = (str: string) => {
      const parts = str.split(/\*\*(.*?)\*\*/g)
      return parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)
    }
    // Headings **text** : at start of line
    if (line.startsWith('**') && line.includes('**') && line.trim().endsWith(':')) {
      const heading = line.replace(/\*\*/g, '').trim()
      return (
        <p key={i} style={{ margin: '10px 0 4px', fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>
          {heading}
        </p>
      )
    }
    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      return (
        <p key={i} style={{ margin: '3px 0', fontSize: '13px', lineHeight: 1.6, paddingLeft: '4px' }}>
          {renderBold(line)}
        </p>
      )
    }
    // Bullet
    if (line.startsWith('- ') || line.startsWith('• ')) {
      return (
        <p key={i} style={{ margin: '3px 0', fontSize: '13px', lineHeight: 1.6, paddingLeft: '4px' }}>
          {renderBold(line)}
        </p>
      )
    }
    // Empty line
    if (!line.trim()) return <div key={i} style={{ height: '6px' }} />
    // Normal
    return (
      <p key={i} style={{ margin: '3px 0', fontSize: '13px', lineHeight: 1.65 }}>
        {renderBold(line)}
      </p>
    )
  })
}

export default function AssistantJuridique({ initialQuestion }: { initialQuestion?: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const hasStarted = messages.length > 0

  useEffect(() => {
    if (initialQuestion && messages.length === 0) {
      sendMessage(initialQuestion)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMsg: Message = { role: 'user', content: trimmed }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/assistant-juridique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
      }
    } catch {
      setError('Erreur réseau. Vérifiez votre connexion.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const reset = () => {
    setMessages([])
    setInput('')
    setError(null)
  }

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 16px 40px', display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 56px)' }}>

      {/* HEADER */}
      <div style={{ padding: '32px 0 24px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)', border: '1px solid var(--color-border)', marginBottom: '16px' }}>
          <Scale size={22} color="var(--color-accent)" />
        </div>
        <h1 className="font-display" style={{ margin: '0 0 8px', fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 800, letterSpacing: '-0.02em' }}>
          Assistant juridique chantier
        </h1>
        <p style={{ margin: '0 auto', fontSize: '15px', color: 'var(--color-muted)', lineHeight: 1.6, maxWidth: '520px' }}>
          Décrivez votre problème, je vous explique vos droits et recours en français simple.
        </p>
      </div>

      {/* QUICK QUESTIONS — shown before first message */}
      {!hasStarted && (
        <div style={{ marginBottom: '24px' }}>
          <p style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Questions fréquentes
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q.label}
                onClick={() => sendMessage(q.label)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px 14px', borderRadius: '10px',
                  border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                  cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.background = 'color-mix(in srgb, var(--color-accent) 4%, var(--color-surface))' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-surface)' }}
              >
                <span style={{ fontSize: '18px', flexShrink: 0 }}>{q.icon}</span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', flex: 1, lineHeight: 1.4 }}>{q.label}</span>
                <ChevronRight size={13} color="var(--color-muted)" style={{ flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MESSAGES */}
      {hasStarted && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              {msg.role === 'assistant' && (
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg, #eff6ff, #f0fdf4)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: '10px', marginTop: '2px' }}>
                  <Scale size={14} color="var(--color-accent)" />
                </div>
              )}
              <div style={{
                maxWidth: '85%',
                padding: msg.role === 'user' ? '10px 14px' : '14px 16px',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: msg.role === 'user'
                  ? 'var(--color-accent)'
                  : 'var(--color-surface)',
                border: msg.role === 'assistant' ? '1px solid var(--color-border)' : 'none',
                color: msg.role === 'user' ? '#fff' : 'var(--color-text)',
              }}>
                {msg.role === 'user' ? (
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5 }}>{msg.content}</p>
                ) : (
                  <div>{formatMarkdown(msg.content)}</div>
                )}
              </div>
            </div>
          ))}

          {/* Loading bubble */}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg, #eff6ff, #f0fdf4)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Scale size={14} color="var(--color-accent)" />
              </div>
              <div style={{ padding: '14px 16px', borderRadius: '18px 18px 18px 4px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Loader2 size={14} color="var(--color-muted)" style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '13px', color: 'var(--color-muted)' }}>Analyse en cours…</span>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--color-danger-bg)', border: '1px solid color-mix(in srgb, var(--color-danger) 30%, transparent)', fontSize: '13px', color: 'var(--color-danger)' }}>
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}

      {/* CHAT INPUT */}
      <div style={{ position: 'sticky', bottom: 0, paddingTop: '12px', paddingBottom: '8px', background: 'var(--color-bg)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '10px 12px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <MessageSquare size={16} color="var(--color-muted)" style={{ flexShrink: 0, marginBottom: '3px' }} />
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Décrivez votre situation en détail…"
            rows={1}
            style={{
              flex: 1, border: 'none', background: 'transparent', outline: 'none',
              fontSize: '14px', fontFamily: 'var(--font-body)', color: 'var(--color-text)',
              resize: 'none', lineHeight: 1.5, maxHeight: '120px', overflowY: 'auto',
            }}
            onInput={(e) => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = Math.min(el.scrollHeight, 120) + 'px'
            }}
          />
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexShrink: 0 }}>
            {hasStarted && (
              <button
                type="button"
                onClick={reset}
                title="Nouvelle conversation"
                style={{ width: '34px', height: '34px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)' }}
              >
                <RotateCcw size={14} />
              </button>
            )}
            <button
              type="submit"
              disabled={!input.trim() || loading}
              style={{
                width: '34px', height: '34px', borderRadius: '8px', border: 'none',
                background: input.trim() && !loading ? 'var(--color-accent)' : 'var(--color-border)',
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s', flexShrink: 0,
              }}
            >
              {loading ? <Loader2 size={15} color="#fff" style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={15} color="#fff" />}
            </button>
          </div>
        </form>
        <p style={{ margin: '8px 0 0', fontSize: '11px', color: 'var(--color-muted)', textAlign: 'center', lineHeight: 1.5 }}>
          Cet assistant fournit des informations générales. Consultez un avocat pour votre situation spécifique.
        </p>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
