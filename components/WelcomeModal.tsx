'use client'

import { useState, useEffect } from 'react'
import { FileText, Search, BellRing, Scale, ClipboardCheck, MessageSquare, X, ShieldCheck } from 'lucide-react'

interface WelcomeModalProps {
  sessionId: string
  isNew: boolean
  nomEntreprise?: string
}

const FEATURES = [
  {
    Icon: FileText,
    titre: 'Rapport PDF complet',
    desc: 'Téléchargeable et partageable, toutes les données de l\'artisan.',
  },
  {
    Icon: Search,
    titre: 'Analyse juridique de devis',
    desc: 'Uploadez votre devis pour détecter les clauses abusives.',
  },
  {
    Icon: BellRing,
    titre: 'Surveillance 6 mois activée',
    desc: 'Vous serez alerté par email si la situation change.',
  },
  {
    Icon: Scale,
    titre: 'Vos droits & recours',
    desc: 'Guide juridique complet + modèle de contrat pré-rempli.',
  },
  {
    Icon: ClipboardCheck,
    titre: 'Checklist personnalisée',
    desc: 'Générée selon le profil de cet artisan.',
  },
  {
    Icon: MessageSquare,
    titre: 'Questions à poser',
    desc: 'Adaptées aux risques détectés dans ce profil.',
  },
]

export default function WelcomeModal({ sessionId, isNew, nomEntreprise }: WelcomeModalProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isNew) return
    const key = `rapport_welcome_${sessionId}`
    if (localStorage.getItem(key)) return
    // Small delay so page content renders first
    const t = setTimeout(() => setVisible(true), 400)
    return () => clearTimeout(t)
  }, [isNew, sessionId])

  function close() {
    localStorage.setItem(`rapport_welcome_${sessionId}`, 'true')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <>
      <style>{`
        @keyframes wm-fade-in {
          from { opacity: 0 }
          to   { opacity: 1 }
        }
        @keyframes wm-slide-up {
          from { opacity: 0; transform: translateY(24px) scale(0.97) }
          to   { opacity: 1; transform: translateY(0)    scale(1) }
        }
      `}</style>

      {/* Overlay */}
      <div
        onClick={close}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.5)',
          animation: 'wm-fade-in 0.2s ease',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px',
        }}
      >
        {/* Modal */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: '480px',
            borderRadius: '16px', overflow: 'hidden',
            animation: 'wm-slide-up 0.25s ease',
            boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
          }}
        >
          {/* Header */}
          <div style={{
            background: '#1B4332', padding: '24px 24px 20px',
            position: 'relative',
          }}>
            <button
              onClick={close}
              aria-label="Fermer"
              style={{
                position: 'absolute', top: '14px', right: '14px',
                background: 'rgba(255,255,255,0.15)', border: 'none',
                borderRadius: '8px', width: '32px', height: '32px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'white',
              }}
            >
              <X size={16} strokeWidth={1.5} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <ShieldCheck size={24} color="#D8F3DC" strokeWidth={1.5} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#52B788', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Pack Sérénité débloqué
              </span>
            </div>

            <h2 style={{
              margin: '0 0 6px', fontSize: '22px', fontWeight: 800,
              color: 'white', letterSpacing: '-0.02em', lineHeight: 1.2,
            }}>
              Votre rapport complet est débloqué
            </h2>
            {nomEntreprise && (
              <p style={{ margin: 0, fontSize: '14px', color: '#D8F3DC', opacity: 0.85 }}>
                {nomEntreprise}
              </p>
            )}
            <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#D8F3DC', opacity: 0.7 }}>
              Voici ce que vous avez obtenu avec le Pack Sérénité
            </p>
          </div>

          {/* Body */}
          <div style={{ background: 'var(--color-bg)', padding: '20px 24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              {FEATURES.map(({ Icon, titre, desc }) => (
                <div key={titre} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: 'var(--color-safe-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={16} color="var(--color-safe)" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.4 }}>
                      {titre}
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)', lineHeight: 1.5 }}>
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={close}
              style={{
                width: '100%', padding: '14px',
                background: 'var(--color-accent)', color: 'white',
                border: 'none', borderRadius: '12px',
                fontSize: '15px', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'var(--font-body)',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = '#22a85f')}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--color-accent)')}
            >
              Découvrir mon rapport →
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
