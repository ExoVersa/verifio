'use client'

import { useState, useRef } from 'react'
import { Search, Loader2 } from 'lucide-react'

interface Props {
  onSearch: (query: string) => void
  loading: boolean
  dark?: boolean
}

export default function SearchBar({ onSearch, loading, dark }: Props) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = value.trim()
    if (q.length >= 2) onSearch(q)
  }

  return (
    <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Search
          size={20}
          color={dark ? 'rgba(255,255,255,0.5)' : 'var(--color-muted)'}
          style={{ position: 'absolute', left: '18px', flexShrink: 0, pointerEvents: 'none' }}
        />
        <input
          ref={inputRef}
          className="search-input"
          style={{
            paddingLeft: '50px',
            paddingRight: '130px',
            ...(dark ? {
              background: 'rgba(255,255,255,0.12)',
              border: '1.5px solid rgba(255,255,255,0.25)',
              color: '#fff',
            } : {}),
          }}
          type="text"
          placeholder="Nom d'artisan, entreprise ou SIRET…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={loading}
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="submit"
          disabled={loading || value.trim().length < 2}
          style={{
            position: 'absolute',
            right: '8px',
            padding: '8px 18px',
            background: dark ? '#fff' : 'var(--color-accent)',
            color: dark ? 'var(--color-accent)' : '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            fontFamily: 'var(--font-body)',
            cursor: loading || value.trim().length < 2 ? 'not-allowed' : 'pointer',
            opacity: loading || value.trim().length < 2 ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'opacity 0.15s',
          }}
        >
          {loading ? <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> : null}
          Vérifier
        </button>
      </div>
    </form>
  )
}
