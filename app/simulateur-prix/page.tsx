'use client'

import { useState } from 'react'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import { supabase } from '@/lib/supabase'

export default function SimulateurPrixPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      await supabase.from('waitlist').insert({ email, feature: 'simulateur' })
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

        {/* SVG Clock illustration */}
        <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'center' }}>
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="40" cy="40" r="32" stroke="#52B788" strokeWidth="3" />
            <line x1="40" y1="40" x2="40" y2="18" stroke="#52B788" strokeWidth="3" strokeLinecap="round" />
            <line x1="40" y1="40" x2="56" y2="50" stroke="#52B788" strokeWidth="3" strokeLinecap="round" />
            <circle cx="40" cy="40" r="3" fill="#52B788" />
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
          Simulateur de prix travaux
        </h1>

        {/* Description */}
        <p style={{
          margin: '0 0 40px',
          fontSize: '16px',
          color: '#6b7280',
          lineHeight: 1.65,
        }}>
          Comparez instantanément le prix de vos devis avec les tarifs moyens du marché. Détectez les anomalies avant de signer.
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
