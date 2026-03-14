'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Compte créé ! Vérifiez votre e-mail pour confirmer.')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('E-mail ou mot de passe incorrect.')
      } else {
        router.push('/')
      }
    }

    setLoading(false)
  }

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'var(--color-bg)',
    }}>
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
          <ShieldCheck size={24} color="var(--color-accent)" />
          <span className="font-display" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-accent)' }}>
            ArtisanCheck
          </span>
        </div>
        <h1 className="font-display" style={{ margin: 0, fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em' }}>
          {mode === 'login' ? 'Se connecter' : 'Créer un compte'}
        </h1>
      </div>

      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '16px',
        padding: '32px',
        width: '100%',
        maxWidth: '400px',
      }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="vous@exemple.fr"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                fontSize: '15px',
                fontFamily: 'var(--font-body)',
                color: 'var(--color-text)',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              minLength={6}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                fontSize: '15px',
                fontFamily: 'var(--font-body)',
                color: 'var(--color-text)',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          {error && (
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-danger)', padding: '10px 12px', background: 'var(--color-danger-bg)', borderRadius: '8px' }}>
              {error}
            </p>
          )}

          {success && (
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-safe)', padding: '10px 12px', background: 'var(--color-safe-bg)', borderRadius: '8px' }}>
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px',
              borderRadius: '10px',
              border: 'none',
              background: loading ? 'var(--color-muted)' : 'var(--color-text)',
              color: 'var(--color-bg)',
              fontSize: '15px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-body)',
            }}
          >
            {loading ? 'Chargement…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>
        </form>

        <p style={{ margin: '20px 0 0', textAlign: 'center', fontSize: '13px', color: 'var(--color-muted)' }}>
          {mode === 'login' ? 'Pas encore de compte ?' : 'Déjà un compte ?'}{' '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setSuccess(null) }}
            style={{ background: 'none', border: 'none', color: 'var(--color-text)', fontWeight: 600, cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-body)', textDecoration: 'underline' }}
          >
            {mode === 'login' ? 'S\'inscrire' : 'Se connecter'}
          </button>
        </p>
      </div>
    </main>
  )
}
