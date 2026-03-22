'use client'

import { useState } from 'react'
import { Send, CheckCircle2, AlertCircle } from 'lucide-react'
import SiteHeader from '@/components/SiteHeader'

const SUJETS = [
  'Question générale',
  'Signaler une erreur',
  'Artisan — demande de rectification',
  'Presse',
  'Autre',
]

export default function ContactPage() {
  const [form, setForm] = useState({ nom: '', email: '', sujet: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || 'Erreur lors de l\'envoi.')
        setStatus('error')
      } else {
        setStatus('success')
      }
    } catch {
      setErrorMsg('Erreur réseau. Réessayez.')
      setStatus('error')
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <SiteHeader />

      {/* Hero */}
      <section style={{ background: '#1B4332', padding: '56px 24px 48px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '5px 14px', borderRadius: '20px', marginBottom: '20px', border: '1px solid rgba(216,243,220,0.2)' }}>
            <Send size={12} color="#D8F3DC" />
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#D8F3DC' }}>Nous contacter</span>
          </div>
          <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>
            Une question ?
          </h1>
          <p style={{ margin: 0, fontSize: '15px', color: 'rgba(216,243,220,0.75)', lineHeight: 1.65 }}>
            Nous lisons chaque message et répondons sous 48h. Pour les signalements d&apos;erreurs ou demandes de rectification d&apos;artisans, précisez le SIRET concerné.
          </p>
        </div>
      </section>

      {/* Form */}
      <section style={{ padding: '56px 24px 80px', maxWidth: '600px', margin: '0 auto' }}>
        {status === 'success' ? (
          <div style={{ textAlign: 'center', padding: '64px 24px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#f0fdf4', border: '2px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle2 size={32} color="#16a34a" />
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: 800, color: 'var(--color-text)' }}>Message envoyé !</h2>
            <p style={{ margin: '0 0 28px', fontSize: '15px', color: 'var(--color-muted)' }}>Nous vous répondrons dans les 48h.</p>
            <button
              onClick={() => { setForm({ nom: '', email: '', sujet: '', message: '' }); setStatus('idle') }}
              style={{ padding: '11px 24px', borderRadius: '10px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', color: 'var(--color-text)' }}
            >
              Envoyer un autre message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Nom + Email */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '6px' }}>
                  Nom <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.nom}
                  onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                  placeholder="Jean Dupont"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', fontSize: '15px', color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '6px' }}>
                  Email <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="jean@exemple.fr"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', fontSize: '15px', color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Sujet */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '6px' }}>
                Sujet <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                required
                value={form.sujet}
                onChange={e => setForm(f => ({ ...f, sujet: e.target.value }))}
                style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', fontSize: '15px', color: form.sujet ? 'var(--color-text)' : 'var(--color-muted)', outline: 'none', cursor: 'pointer' }}
              >
                <option value="" disabled>Choisir un sujet…</option>
                {SUJETS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Message */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '6px' }}>
                Message <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                required
                rows={6}
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Décrivez votre demande…"
                maxLength={2000}
                style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', fontSize: '15px', color: 'var(--color-text)', outline: 'none', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-muted)', textAlign: 'right' }}>
                {form.message.length}/2000
              </p>
            </div>

            {status === 'error' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fecaca' }}>
                <AlertCircle size={18} color="#dc2626" />
                <p style={{ margin: 0, fontSize: '14px', color: '#dc2626' }}>{errorMsg}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px 28px', borderRadius: '12px', background: status === 'loading' ? '#6b7280' : '#1B4332', color: '#fff', fontSize: '15px', fontWeight: 700, border: 'none', cursor: status === 'loading' ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}
            >
              <Send size={16} />
              {status === 'loading' ? 'Envoi en cours…' : 'Envoyer le message'}
            </button>
          </form>
        )}
      </section>
    </main>
  )
}
