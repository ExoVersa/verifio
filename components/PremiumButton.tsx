'use client'

import { useState } from 'react'
import { Lock } from 'lucide-react'

interface Props {
  siret: string
  nom: string
}

export default function PremiumButton({ siret, nom }: Props) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siret, nom }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        width: '100%',
        padding: '14px 20px',
        borderRadius: '12px',
        border: 'none',
        background: loading ? 'var(--color-muted)' : 'var(--color-text)',
        color: 'var(--color-bg)',
        fontSize: '15px',
        fontWeight: 600,
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'opacity 0.15s',
        opacity: loading ? 0.7 : 1,
        letterSpacing: '-0.01em',
      }}
    >
      <Lock size={16} />
      {loading ? 'Redirection…' : 'Rapport complet — 4,90\u00a0€'}
    </button>
  )
}
