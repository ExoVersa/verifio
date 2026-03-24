'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

/* ── Icônes SVG inline ─────────────────────────────────────── */
function IconShield() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}
function IconEye({ off }: { off?: boolean }) {
  return off ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}
function IconMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  )
}
function IconGoogle() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

/* ── Indicateur de force du mot de passe ───────────────────── */
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]
  const score = checks.filter(Boolean).length
  const colors = ['#E63946', '#F4A261', '#F4A261', '#52B788', '#52B788']
  const labels = ['Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort']
  return (
    <div style={{ marginTop: '6px' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i <= score ? colors[score] : '#e5e7eb',
            transition: 'background 0.2s',
          }} />
        ))}
      </div>
      <p style={{ margin: 0, fontSize: '11px', color: colors[score] }}>{labels[score]}</p>
    </div>
  )
}

/* ── Champ input réutilisable ──────────────────────────────── */
function Field({
  label, type, value, onChange, placeholder, required, icon, rightEl, minLength,
}: {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
  icon?: React.ReactNode
  rightEl?: React.ReactNode
  minLength?: number
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        {icon && (
          <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: focused ? '#1B4332' : '#9ca3af', pointerEvents: 'none', transition: 'color 0.15s' }}>
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          autoComplete={type === 'password' ? 'current-password' : type === 'email' ? 'email' : 'off'}
          style={{
            width: '100%',
            height: '52px',
            paddingLeft: icon ? '42px' : '16px',
            paddingRight: rightEl ? '48px' : '16px',
            borderRadius: '12px',
            border: `2px solid ${focused ? '#1B4332' : '#e5e7eb'}`,
            background: 'white',
            fontSize: '15px',
            fontFamily: 'var(--font-body)',
            color: '#111827',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            boxShadow: focused ? '0 0 0 3px rgba(27,67,50,0.08)' : 'none',
          }}
        />
        {rightEl && (
          <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }}>
            {rightEl}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Page principale ────────────────────────────────────────── */
export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  // Login
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)

  // Signup
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [emailS, setEmailS] = useState('')
  const [passwordS, setPasswordS] = useState('')
  const [showPwdS, setShowPwdS] = useState(false)
  const [confirmPwd, setConfirmPwd] = useState('')
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)
  const [cguChecked, setCguChecked] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const switchMode = (m: 'login' | 'signup') => {
    setMode(m); setError(null); setSuccess(null)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('E-mail ou mot de passe incorrect.')
    else router.push('/')
    setLoading(false)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordS !== confirmPwd) { setError('Les mots de passe ne correspondent pas.'); return }
    if (!cguChecked) { setError('Veuillez accepter les CGU pour continuer.'); return }
    setLoading(true); setError(null)
    const { error } = await supabase.auth.signUp({
      email: emailS, password: passwordS,
      options: { data: { prenom, nom } },
    })
    if (error) setError(error.message)
    else setSuccess('Compte créé ! Vérifiez votre e-mail pour confirmer.')
    setLoading(false)
  }

  /* ── Colonne gauche ─────────────────────────────────────── */
  const LeftPanel = () => (
    <div style={{
      width: '100%',
      background: '#1B4332',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '48px 40px',
      minHeight: '100vh',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white' }}>
        <IconShield />
        <span style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>Verifio</span>
      </div>

      {/* Citation + arguments */}
      <div>
        <h2 style={{
          margin: '0 0 40px',
          fontSize: '32px', fontWeight: 700, color: 'white',
          fontFamily: 'var(--font-display)', lineHeight: 1.25,
          letterSpacing: '-0.02em',
        }}>
          Vérifiez votre artisan<br />avant qu&apos;il soit<br />trop tard
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {[
            { icon: '🛡️', text: 'Données officielles INSEE, ADEME, BODACC' },
            { icon: '⚡', text: 'Vérification en 30 secondes' },
            { icon: '🎁', text: 'Gratuit pour les particuliers' },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '22px', flexShrink: 0 }}>{icon}</span>
              <span style={{ fontSize: '15px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Témoignage */}
      <div style={{
        background: 'rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid rgba(255,255,255,0.12)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: '#52B788',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', fontWeight: 700, color: 'white',
            flexShrink: 0,
          }}>M</div>
          <div>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'white' }}>Marie D.</p>
            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Tours</p>
          </div>
        </div>
        <p style={{ margin: '0 0 10px', fontSize: '13px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, fontStyle: 'italic' }}>
          &quot;J&apos;ai évité une arnaque grâce à Verifio. L&apos;artisan était en liquidation judiciaire.&quot;
        </p>
        <div style={{ display: 'flex', gap: '2px' }}>
          {'⭐⭐⭐⭐⭐'.split('').map((s, i) => <span key={i} style={{ fontSize: '14px' }}>{s}</span>)}
        </div>
      </div>
    </div>
  )

  /* ── Formulaire connexion ─────────────────────────────── */
  const LoginForm = () => (
    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ textAlign: 'center', marginBottom: '4px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#1B4332', marginBottom: '16px' }}>
          <IconShield />
          <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>Verifio</span>
        </div>
        <h1 style={{ margin: '0 0 6px', fontSize: '28px', fontWeight: 700, color: '#111827', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
          Bon retour 👋
        </h1>
        <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
          Connectez-vous pour accéder à vos chantiers
        </p>
      </div>

      <Field
        label="E-mail"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="vous@exemple.fr"
        required
        icon={<IconMail />}
      />

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Mot de passe</label>
          <a href="/auth/reset" style={{ fontSize: '12px', color: '#1B4332', textDecoration: 'none', fontWeight: 500 }}>
            Mot de passe oublié ?
          </a>
        </div>
        <div style={{ position: 'relative' }}>
          <input
            type={showPwd ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="••••••••"
            autoComplete="current-password"
            style={{
              width: '100%', height: '52px',
              paddingLeft: '16px', paddingRight: '48px',
              borderRadius: '12px', border: '2px solid #e5e7eb',
              background: 'white', fontSize: '15px',
              fontFamily: 'var(--font-body)', color: '#111827',
              outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = '#1B4332'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27,67,50,0.08)' }}
            onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none' }}
          />
          <button
            type="button"
            onClick={() => setShowPwd(v => !v)}
            style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex' }}
          >
            <IconEye off={showPwd} />
          </button>
        </div>
      </div>

      {error && (
        <p style={{ margin: 0, fontSize: '13px', color: '#dc2626', padding: '10px 12px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          height: '52px', borderRadius: '12px', border: 'none',
          background: loading ? '#9ca3af' : '#1B4332', color: 'white',
          fontSize: '16px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-body)', transition: 'background 0.15s',
        }}
        onMouseEnter={e => !loading && ((e.currentTarget as HTMLButtonElement).style.background = '#2D6A4F')}
        onMouseLeave={e => !loading && ((e.currentTarget as HTMLButtonElement).style.background = '#1B4332')}
      >
        {loading ? 'Connexion…' : 'Se connecter →'}
      </button>

      {/* Séparateur */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
        <span style={{ fontSize: '12px', color: '#9ca3af', flexShrink: 0 }}>ou</span>
        <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
      </div>

      {/* Bouton Google */}
      <button
        type="button"
        style={{
          height: '52px', borderRadius: '12px',
          border: '1.5px solid #e5e7eb', background: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          fontSize: '15px', fontWeight: 600, color: '#374151',
          cursor: 'pointer', fontFamily: 'var(--font-body)',
          transition: 'border-color 0.15s, background 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f9fafb'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#d1d5db' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'white'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb' }}
      >
        <IconGoogle />
        Continuer avec Google
      </button>

      <p style={{ margin: 0, textAlign: 'center', fontSize: '13px', color: '#6b7280' }}>
        Pas encore de compte ?{' '}
        <button
          type="button"
          onClick={() => switchMode('signup')}
          style={{ background: 'none', border: 'none', color: '#1B4332', fontWeight: 700, cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-body)', textDecoration: 'underline', padding: 0 }}
        >
          S&apos;inscrire →
        </button>
      </p>
    </form>
  )

  /* ── Formulaire inscription ───────────────────────────── */
  const SignupForm = () => (
    <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ textAlign: 'center', marginBottom: '4px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#1B4332', marginBottom: '16px' }}>
          <IconShield />
          <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>Verifio</span>
        </div>
        <h1 style={{ margin: '0 0 6px', fontSize: '28px', fontWeight: 700, color: '#111827', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
          Créer un compte
        </h1>
        <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
          Gratuit · Sans carte bancaire
        </p>
      </div>

      {/* Prénom + Nom */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Prénom</label>
          <input
            type="text"
            value={prenom}
            onChange={e => setPrenom(e.target.value)}
            required
            placeholder="Jean"
            autoComplete="given-name"
            style={{ width: '100%', height: '52px', padding: '0 14px', borderRadius: '12px', border: '2px solid #e5e7eb', background: 'white', fontSize: '15px', fontFamily: 'var(--font-body)', color: '#111827', outline: 'none', boxSizing: 'border-box' }}
            onFocus={e => { e.currentTarget.style.borderColor = '#1B4332'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27,67,50,0.08)' }}
            onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Nom</label>
          <input
            type="text"
            value={nom}
            onChange={e => setNom(e.target.value)}
            required
            placeholder="Dupont"
            autoComplete="family-name"
            style={{ width: '100%', height: '52px', padding: '0 14px', borderRadius: '12px', border: '2px solid #e5e7eb', background: 'white', fontSize: '15px', fontFamily: 'var(--font-body)', color: '#111827', outline: 'none', boxSizing: 'border-box' }}
            onFocus={e => { e.currentTarget.style.borderColor = '#1B4332'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27,67,50,0.08)' }}
            onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none' }}
          />
        </div>
      </div>

      <Field label="E-mail" type="email" value={emailS} onChange={setEmailS} placeholder="vous@exemple.fr" required icon={<IconMail />} />

      {/* Mot de passe avec indicateur */}
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Mot de passe</label>
        <div style={{ position: 'relative' }}>
          <input
            type={showPwdS ? 'text' : 'password'}
            value={passwordS}
            onChange={e => setPasswordS(e.target.value)}
            required minLength={8}
            placeholder="8 caractères minimum"
            autoComplete="new-password"
            style={{ width: '100%', height: '52px', paddingLeft: '16px', paddingRight: '48px', borderRadius: '12px', border: '2px solid #e5e7eb', background: 'white', fontSize: '15px', fontFamily: 'var(--font-body)', color: '#111827', outline: 'none', boxSizing: 'border-box' }}
            onFocus={e => { e.currentTarget.style.borderColor = '#1B4332'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27,67,50,0.08)' }}
            onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none' }}
          />
          <button type="button" onClick={() => setShowPwdS(v => !v)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex' }}>
            <IconEye off={showPwdS} />
          </button>
        </div>
        <PasswordStrength password={passwordS} />
      </div>

      {/* Confirmation */}
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Confirmer le mot de passe</label>
        <div style={{ position: 'relative' }}>
          <input
            type={showConfirmPwd ? 'text' : 'password'}
            value={confirmPwd}
            onChange={e => setConfirmPwd(e.target.value)}
            required
            placeholder="••••••••"
            autoComplete="new-password"
            style={{
              width: '100%', height: '52px', paddingLeft: '16px', paddingRight: '48px',
              borderRadius: '12px',
              border: `2px solid ${confirmPwd && confirmPwd !== passwordS ? '#E63946' : '#e5e7eb'}`,
              background: 'white', fontSize: '15px', fontFamily: 'var(--font-body)', color: '#111827', outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={e => { if (!confirmPwd || confirmPwd === passwordS) { e.currentTarget.style.borderColor = '#1B4332'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27,67,50,0.08)' } }}
            onBlur={e => { e.currentTarget.style.borderColor = (confirmPwd && confirmPwd !== passwordS) ? '#E63946' : '#e5e7eb'; e.currentTarget.style.boxShadow = 'none' }}
          />
          <button type="button" onClick={() => setShowConfirmPwd(v => !v)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex' }}>
            <IconEye off={showConfirmPwd} />
          </button>
        </div>
        {confirmPwd && confirmPwd !== passwordS && (
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#E63946' }}>Les mots de passe ne correspondent pas</p>
        )}
      </div>

      {/* CGU */}
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={cguChecked}
          onChange={e => setCguChecked(e.target.checked)}
          style={{ marginTop: '2px', accentColor: '#1B4332', width: '16px', height: '16px', flexShrink: 0 }}
        />
        <span style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.5 }}>
          J&apos;accepte les{' '}
          <a href="/cgu" target="_blank" style={{ color: '#1B4332', fontWeight: 600, textDecoration: 'none' }}>CGU</a>
          {' '}et la{' '}
          <a href="/politique-confidentialite" target="_blank" style={{ color: '#1B4332', fontWeight: 600, textDecoration: 'none' }}>politique de confidentialité</a>
        </span>
      </label>

      {error && (
        <p style={{ margin: 0, fontSize: '13px', color: '#dc2626', padding: '10px 12px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
          {error}
        </p>
      )}
      {success && (
        <p style={{ margin: 0, fontSize: '13px', color: '#15803d', padding: '10px 12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #86efac' }}>
          {success}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          height: '52px', borderRadius: '12px', border: 'none',
          background: loading ? '#9ca3af' : '#1B4332', color: 'white',
          fontSize: '16px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-body)', transition: 'background 0.15s',
        }}
        onMouseEnter={e => !loading && ((e.currentTarget as HTMLButtonElement).style.background = '#2D6A4F')}
        onMouseLeave={e => !loading && ((e.currentTarget as HTMLButtonElement).style.background = '#1B4332')}
      >
        {loading ? 'Création…' : 'Créer mon compte →'}
      </button>

      <p style={{ margin: 0, textAlign: 'center', fontSize: '13px', color: '#6b7280' }}>
        Déjà un compte ?{' '}
        <button
          type="button"
          onClick={() => switchMode('login')}
          style={{ background: 'none', border: 'none', color: '#1B4332', fontWeight: 700, cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-body)', textDecoration: 'underline', padding: 0 }}
        >
          Se connecter →
        </button>
      </p>
    </form>
  )

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .auth-left { display: none !important; }
          .auth-right { width: 100% !important; }
        }
      `}</style>
      <main style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Colonne gauche */}
        <div className="auth-left" style={{ flex: '0 0 45%', maxWidth: '45%' }}>
          <LeftPanel />
        </div>

        {/* Colonne droite */}
        <div
          className="auth-right"
          style={{
            width: '55%',
            background: '#F8F4EF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 24px',
            minHeight: '100vh',
            boxSizing: 'border-box',
          }}
        >
          <div style={{
            width: '100%',
            maxWidth: '420px',
            background: 'white',
            borderRadius: '20px',
            padding: '36px 32px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
          }}>
            {mode === 'login' ? <LoginForm /> : <SignupForm />}
          </div>
        </div>
      </main>
    </>
  )
}
