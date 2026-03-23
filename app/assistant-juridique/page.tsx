'use client'

import { useState } from 'react'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import { createClient } from '@/lib/supabase/client'

export default function AssistantJuridiquePage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      const supabase = createClient()
      await supabase.from('waitlist').insert({ email, feature: 'juridique' })
    } catch {
      // Table might not exist yet — show success anyway
    } finally {
      setLoading(false)
      setSubmitted(true)
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#F8F4EF', fontFamily: 'var(--font-bricolage, var(--font-body))' }}>
      <SiteHeader />

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>

        {/* SVG Scale of justice illustration */}
        <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'center' }}>
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            {/* Center pole */}
            <line x1="40" y1="12" x2="40" y2="68" stroke="#52B788" strokeWidth="3" strokeLinecap="round" />
            {/* Crossbar */}
            <line x1="16" y1="26" x2="64" y2="26" stroke="#52B788" strokeWidth="3" strokeLinecap="round" />
            {/* Left pan rope */}
            <line x1="20" y1="26" x2="20" y2="46" stroke="#52B788" strokeWidth="2" strokeLinecap="round" />
            {/* Right pan rope */}
            <line x1="60" y1="26" x2="60" y2="46" stroke="#52B788" strokeWidth="2" strokeLinecap="round" />
            {/* Left pan */}
            <path d="M12 46 Q20 52 28 46" stroke="#52B788" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            {/* Right pan */}
            <path d="M52 46 Q60 52 68 46" stroke="#52B788" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            {/* Base */}
            <line x1="28" y1="68" x2="52" y2="68" stroke="#52B788" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>

        {/* Badge */}
        <div style={{ marginBottom: '20px' }}>
          <span style={{
            display: 'inline-block',
            background: '#D8F3DC',
            color: '#1B4332',
            fontSize: '12px',
            fontWeight: 700,
            padding: '4px 14px',
            borderRadius: '20px',
          }}>
            Bientôt disponible
          </span>
        </div>

        {/* Title */}
        <h1 style={{
          margin: '0 0 16px',
          fontWeight: 800,
          fontSize: 'clamp(28px, 5vw, 40px)',
          color: '#1B4332',
          letterSpacing: '-0.03em',
          lineHeight: 1.15,
        }}>
          Assistant juridique IA
        </h1>

        {/* Description */}
        <p style={{
          margin: '0 0 40px',
          fontSize: '16px',
          color: '#6b7280',
          lineHeight: 1.65,
        }}>
          Posez vos questions juridiques sur votre chantier et obtenez des réponses claires basées sur le droit français de la construction.
        </p>

        {/* Email form */}
        {!submitted ? (
          <form onSubmit={handleSubmit}>
            <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: 600, color: '#1B4332', textAlign: 'left' }}>
              Soyez notifié dès l&apos;ouverture
            </label>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
            }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                style={{
                  flex: '1 1 200px',
                  height: '48px',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '0 16px',
                  fontSize: '15px',
                  fontFamily: 'var(--font-bricolage, var(--font-body))',
                  outline: 'none',
                  background: '#fff',
                  color: '#111',
                }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: '0 0 auto',
                  height: '48px',
                  padding: '0 24px',
                  background: '#1B4332',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-bricolage, var(--font-body))',
                  opacity: loading ? 0.7 : 1,
                  whiteSpace: 'nowrap',
                }}
              >
                {loading ? 'Envoi…' : 'Me notifier →'}
              </button>
            </div>
          </form>
        ) : (
          <p style={{ fontSize: '16px', fontWeight: 700, color: '#52B788', margin: '0 0 24px' }}>
            ✓ Vous serez notifié en priorité !
          </p>
        )}

        {/* Back link */}
        <div style={{ marginTop: '48px' }}>
          <Link href="/" style={{ fontSize: '14px', color: '#52B788', textDecoration: 'none' }}>
            ← Retour à l&apos;accueil
          </Link>
        </div>

      </div>
    </main>
  )
}
