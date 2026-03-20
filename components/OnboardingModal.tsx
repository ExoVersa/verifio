'use client'

import { useState, useEffect } from 'react'
import {
  Shield, Search, CheckSquare, Calculator, FileSearch,
  HardHat, Bell, X, ChevronRight,
} from 'lucide-react'

// ── Step content ───────────────────────────────────────────────────────────

function Step0() {
  return (
    <div style={{ textAlign: 'center' }}>
      {/* Animated shield */}
      <div style={{
        width: '80px', height: '80px', borderRadius: '22px',
        background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 24px',
        boxShadow: '0 8px 32px rgba(27,67,50,0.25)',
        animation: 'shieldPulse 2s ease-in-out infinite',
      }}>
        <Shield size={40} color="#D8F3DC" />
      </div>

      <h2 style={{ margin: '0 0 12px', fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }}>
        Bienvenue sur Verifio
      </h2>
      <p style={{ margin: '0 0 24px', fontSize: '15px', color: 'var(--color-muted)', lineHeight: 1.6 }}>
        La plateforme qui protège les particuliers<br />
        contre les arnaques sur les chantiers.
      </p>

      {/* Stat card */}
      <div style={{
        background: '#fef2f2', border: '1px solid #fecaca',
        borderRadius: '14px', padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <span style={{ fontSize: '28px' }}>⚠️</span>
        <div style={{ textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#991b1b' }}>
            26 000 signalements en 2024
          </p>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#7f1d1d' }}>
            20 000€ de perte moyenne par ménage victime d'arnaque
          </p>
        </div>
      </div>

      <style>{`
        @keyframes shieldPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 8px 32px rgba(27,67,50,0.25); }
          50% { transform: scale(1.04); box-shadow: 0 12px 40px rgba(27,67,50,0.35); }
        }
      `}</style>
    </div>
  )
}

function Step1({ progressWidth }: { progressWidth: number }) {
  const sources = ['INSEE', 'BODACC', 'ADEME', 'INPI', 'Dirigeants', 'Certifications']

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '80px', height: '80px', borderRadius: '22px',
        background: 'var(--color-accent-light)', border: '2px solid rgba(27,67,50,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 24px',
      }}>
        <Search size={36} color="var(--color-accent)" />
      </div>

      <h2 style={{ margin: '0 0 12px', fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }}>
        Vérifiez votre artisan<br />en 30 secondes
      </h2>
      <p style={{ margin: '0 0 24px', fontSize: '15px', color: 'var(--color-muted)', lineHeight: 1.6 }}>
        Entrez le nom ou le SIRET de votre artisan.<br />
        On interroge 6 sources officielles.
      </p>

      {/* Sources */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginBottom: '20px' }}>
        {sources.map(s => (
          <span key={s} style={{
            fontSize: '12px', fontWeight: 600, padding: '5px 12px', borderRadius: '20px',
            background: 'var(--color-bg)', border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
          }}>
            {s}
          </span>
        ))}
      </div>

      {/* Animated progress bar */}
      <div style={{ background: 'var(--color-border)', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: '6px',
          background: 'linear-gradient(90deg, #1B4332, #52B788)',
          width: `${progressWidth}%`,
          transition: 'width 2s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </div>
      <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--color-muted)' }}>
        Analyse complète en cours…
      </p>
    </div>
  )
}

function Step2() {
  const features = [
    { Icon: Calculator, label: 'Simulateur de prix', desc: 'Votre devis au bon tarif', color: '#6366f1', bg: '#ede9fe' },
    { Icon: FileSearch, label: 'Analyse de devis IA', desc: 'Conformité légale', color: '#d97706', bg: '#fef3c7' },
    { Icon: HardHat, label: 'Carnet de chantier', desc: 'Suivi complet', color: '#0891b2', bg: '#e0f2fe' },
    { Icon: Bell, label: 'Alertes statut', desc: 'En temps réel', color: '#16a34a', bg: '#dcfce7' },
  ]

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '80px', height: '80px', borderRadius: '22px',
        background: '#dcfce7', border: '2px solid #bbf7d0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 24px',
      }}>
        <CheckSquare size={36} color="#16a34a" />
      </div>

      <h2 style={{ margin: '0 0 12px', fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }}>
        Bien plus qu'une vérification
      </h2>
      <p style={{ margin: '0 0 24px', fontSize: '15px', color: 'var(--color-muted)', lineHeight: 1.6 }}>
        Simulez les prix, analysez vos devis, suivez votre chantier
        et recevez des alertes si votre artisan change de statut.
      </p>

      {/* 4 features */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {features.map(({ Icon, label, desc, color, bg }) => (
          <div key={label} style={{
            background: 'var(--color-bg)', border: '1px solid var(--color-border)',
            borderRadius: '12px', padding: '14px 12px',
            display: 'flex', alignItems: 'flex-start', gap: '10px', textAlign: 'left',
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
              background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={16} color={color} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: 'var(--color-text)' }}>{label}</p>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-muted)' }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export default function OnboardingModal() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [opacity, setOpacity] = useState(1)
  const [slideX, setSlideX] = useState(0)
  const [progressWidth, setProgressWidth] = useState(0)

  useEffect(() => {
    if (!localStorage.getItem('verifio_visited')) {
      const t = setTimeout(() => setOpen(true), 700)
      return () => clearTimeout(t)
    }
  }, [])

  // Trigger progress bar when step 1 becomes visible
  useEffect(() => {
    if (step === 1 && open) {
      setProgressWidth(0)
      const t = setTimeout(() => setProgressWidth(100), 120)
      return () => clearTimeout(t)
    }
  }, [step, open])

  const animate = (cb: () => void) => {
    setOpacity(0)
    setSlideX(-28)
    setTimeout(() => {
      cb()
      setSlideX(28)
      setTimeout(() => {
        setOpacity(1)
        setSlideX(0)
      }, 16)
    }, 220)
  }

  const next = () => {
    if (step < 2) {
      animate(() => setStep(s => s + 1))
    } else {
      dismiss()
    }
  }

  const dismiss = () => {
    localStorage.setItem('verifio_visited', '1')
    setOpen(false)
    setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>(
        'input[placeholder*="artisan"], input[placeholder*="SIRET"], input[placeholder*="Nom"]'
      )
      if (input) input.focus()
    }, 300)
  }

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 300,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) dismiss() }}
    >
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: '24px',
        padding: '40px 36px 32px',
        maxWidth: '460px',
        width: '100%',
        boxShadow: '0 32px 80px rgba(0,0,0,0.22)',
        position: 'relative',
        animation: 'slideUp 0.25s ease',
      }}>
        {/* Close */}
        <button
          onClick={dismiss}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'var(--color-bg)', border: '1px solid var(--color-border)',
            borderRadius: '50%', cursor: 'pointer',
            width: '28px', height: '28px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-muted)',
          }}
          aria-label="Fermer"
        >
          <X size={14} />
        </button>

        {/* Step content with slide animation */}
        <div style={{
          transition: 'opacity 0.22s ease, transform 0.22s ease',
          opacity,
          transform: `translateX(${slideX}px)`,
          minHeight: '320px',
        }}>
          {step === 0 && <Step0 />}
          {step === 1 && <Step1 progressWidth={progressWidth} />}
          {step === 2 && <Step2 />}
        </div>

        {/* Navigation bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: '28px',
        }}>
          {/* Dots */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {[0, 1, 2].map(i => (
              <div
                key={i}
                style={{
                  height: '8px',
                  width: i === step ? '22px' : '8px',
                  borderRadius: '4px',
                  background: i === step ? '#1B4332' : 'var(--color-border)',
                  transition: 'all 0.25s ease',
                  cursor: 'pointer',
                }}
                onClick={() => { if (i < step) animate(() => setStep(i)) }}
              />
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={dismiss}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '13px', color: 'var(--color-muted)',
                fontFamily: 'var(--font-body)', padding: '4px',
              }}
            >
              Passer
            </button>
            <button
              onClick={next}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '11px 22px', borderRadius: '12px',
                background: '#1B4332', color: '#fff',
                border: 'none', cursor: 'pointer',
                fontSize: '14px', fontWeight: 700,
                fontFamily: 'var(--font-body)',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              {step === 2 ? 'Commencer ✓' : <>Suivant <ChevronRight size={15} /></>}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </div>
  )
}
