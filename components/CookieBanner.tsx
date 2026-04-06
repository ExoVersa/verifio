'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Cookie, X } from 'lucide-react'

const STORAGE_KEY = 'verifio_cookie_consent'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) setVisible(true)
    } catch { /* ignore */ }
  }, [])

  function accept() {
    try { localStorage.setItem(STORAGE_KEY, 'accepted') } catch { /* ignore */ }
    setVisible(false)
  }

  function dismiss() {
    try { localStorage.setItem(STORAGE_KEY, 'essential') } catch { /* ignore */ }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="region"
      aria-label="Gestion des cookies"
      style={{
        position: 'fixed',
        bottom: '80px', // above mobile nav
        left: '12px',
        right: '12px',
        maxWidth: '520px',
        margin: '0 auto',
        background: 'var(--color-text)',
        color: '#fff',
        borderRadius: '16px',
        padding: '16px 20px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px',
      }}
    >
      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(216,243,220,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Cookie size={18} color="#D8F3DC" />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 700, color: '#fff', lineHeight: 1.4 }}>
          Rien qui cloche utilise des cookies
        </p>
        <p style={{ margin: '0 0 12px', fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
          Pour l&apos;authentification et améliorer votre expérience.{' '}
          <Link href="/politique-confidentialite" style={{ color: '#74C69D', textDecoration: 'underline' }}>
            En savoir plus
          </Link>
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={accept}
            style={{ padding: '7px 16px', borderRadius: '8px', background: '#52B788', color: '#fff', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer' }}
          >
            Accepter
          </button>
          <button
            onClick={dismiss}
            style={{ padding: '7px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 600, border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer' }}
          >
            Essentiels uniquement
          </button>
        </div>
      </div>

      <button
        onClick={dismiss}
        aria-label="Fermer"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: '4px', flexShrink: 0 }}
      >
        <X size={16} />
      </button>
    </div>
  )
}
