'use client'

import { useState, useRef } from 'react'
import { Share2, Loader, Copy, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface BoutonPartageProps {
  sessionId: string
}

export default function BoutonPartage({ sessionId }: BoutonPartageProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [hovered, setHovered] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleShare() {
    if (loading) return
    if (shareUrl) {
      // Déjà généré — juste copier
      await copyUrl(shareUrl)
      return
    }
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/rapport-share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ stripe_session_id: sessionId }),
      })
      const data = await res.json()
      if (data.share_url) {
        setShareUrl(data.share_url)
        await copyUrl(data.share_url)
      }
    } catch {
      // silencieux
    } finally {
      setLoading(false)
    }
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      inputRef.current?.select()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <button
        onClick={handleShare}
        disabled={loading}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'transparent',
          border: `1.5px solid ${hovered ? 'var(--color-accent)' : 'var(--color-border)'}`,
          borderRadius: '8px',
          padding: '10px 20px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: 500,
          fontSize: '14px',
          color: copied ? 'var(--color-safe)' : 'var(--color-text)',
          opacity: loading ? 0.7 : 1,
          transition: 'all 0.15s ease',
          whiteSpace: 'nowrap',
        }}
      >
        {loading ? (
          <Loader size={16} strokeWidth={1.5} style={{ animation: 'spin 1s linear infinite' }} />
        ) : copied ? (
          <Check size={16} strokeWidth={1.5} color="var(--color-safe)" />
        ) : (
          <Share2 size={16} strokeWidth={1.5} />
        )}
        {loading ? 'Génération…' : copied ? 'Lien copié !' : 'Partager le rapport'}
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </button>

      {/* Champ URL si déjà généré */}
      {shareUrl && (
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <input
            ref={inputRef}
            readOnly
            value={shareUrl}
            style={{
              flex: 1,
              fontSize: '12px',
              padding: '7px 10px',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              background: 'var(--color-bg)',
              color: 'var(--color-muted)',
              outline: 'none',
              minWidth: 0,
            }}
            onClick={e => (e.target as HTMLInputElement).select()}
          />
          <button
            onClick={() => copyUrl(shareUrl)}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '7px 12px', borderRadius: '6px',
              background: 'var(--color-accent)', color: 'white',
              border: 'none', cursor: 'pointer',
              fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <Copy size={12} strokeWidth={1.5} />
            Copier
          </button>
        </div>
      )}
    </div>
  )
}
