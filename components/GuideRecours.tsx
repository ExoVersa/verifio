'use client'

import React, { useState } from 'react'
import { LifeBuoy, Mail, Users, Shield, Gavel, X, Copy, Check, ExternalLink } from 'lucide-react'

const MODELE_MISE_EN_DEMEURE = `Objet : Mise en demeure — Malfaçons / Travaux non conformes

Madame, Monsieur,

Par la présente, je vous mets en demeure de remédier
aux désordres suivants constatés lors de vos travaux :

- ___________________________
- ___________________________

Ces travaux ont été réalisés à l'adresse : ___________________________
Pour un montant de : ___________________________

Je vous demande d'intervenir dans un délai de 15 jours
à compter de la réception de ce courrier.

À défaut, je me verrai contraint(e) d'engager toute
procédure judiciaire nécessaire à la défense de mes intérêts.

Veuillez agréer, Madame, Monsieur, l'expression
de mes salutations distinguées.

[Votre nom]
[Date]`

interface Etape {
  numero: number
  delai: string
  Icon: React.FC<{ size?: number; color?: string; strokeWidth?: number }>
  titre: string
  texte: string
  action?: 'lettre'
  liens?: { label: string; href: string }[]
}

const ETAPES: Etape[] = [
  {
    numero: 1,
    delai: 'J+0',
    Icon: Mail,
    titre: 'Envoyez une mise en demeure',
    texte: "Envoyez un courrier recommandé avec accusé de réception à l'artisan. Décrivez précisément le problème et demandez une intervention sous 15 jours. Conservez le double.",
    action: 'lettre',
  },
  {
    numero: 2,
    delai: 'J+15',
    Icon: Users,
    titre: 'Tentez la médiation',
    texte: "Avant tout tribunal, la médiation est gratuite et obligatoire. Contactez le médiateur de la consommation compétent pour votre secteur.",
    liens: [
      { label: 'Médiateur du bâtiment', href: 'https://www.mediateur-construction.fr' },
      { label: 'Médiation CNAMS', href: 'https://www.cnams.fr' },
    ],
  },
  {
    numero: 3,
    delai: 'J+30',
    Icon: Shield,
    titre: 'Déclarez à votre assurance',
    texte: "Si vous avez souscrit une assurance dommages-ouvrage, déclarez le sinistre. Elle préfinance les réparations sans attendre la décision du tribunal.",
  },
  {
    numero: 4,
    delai: 'J+60',
    Icon: Gavel,
    titre: 'Saisir le tribunal',
    texte: "En dernier recours, saisissez le tribunal judiciaire. En dessous de 10 000€ : tribunal de proximité (sans avocat). Au-dessus : tribunal judiciaire (avocat recommandé).",
    liens: [
      { label: 'Service public — saisir la justice', href: 'https://www.service-public.fr/particuliers/vosdroits/F2289' },
    ],
  },
]

export default function GuideRecours() {
  const [modalOpen, setModalOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleCopyLetter() {
    try {
      await navigator.clipboard.writeText(MODELE_MISE_EN_DEMEURE)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch { /* silent */ }
  }

  return (
    <div style={{ marginTop: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <LifeBuoy size={20} color="var(--color-danger)" strokeWidth={1.5} />
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, letterSpacing: '-0.01em' }}>
          Si ça se passe mal
        </h2>
      </div>
      <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--color-muted)' }}>
        Vos recours en cas de litige
      </p>

      {/* Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {ETAPES.map((etape, idx) => (
          <div key={etape.numero} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>

            {/* Ligne verticale + cercle */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--color-accent)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: 700,
                flexShrink: 0,
                zIndex: 1,
              }}>
                {etape.numero}
              </div>
              {idx < ETAPES.length - 1 && (
                <div style={{
                  width: '2px',
                  flex: 1,
                  background: 'var(--color-accent)',
                  opacity: 0.25,
                  minHeight: '24px',
                  marginTop: '2px',
                  marginBottom: '2px',
                }} />
              )}
            </div>

            {/* Contenu de l'étape */}
            <div style={{
              flex: 1,
              padding: '12px 16px 20px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              marginBottom: idx < ETAPES.length - 1 ? '8px' : '0',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                <etape.Icon size={14} color="var(--color-accent)" strokeWidth={1.5} />
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{etape.titre}</span>
                <span style={{
                  marginLeft: 'auto',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
                  color: 'var(--color-accent)',
                }}>
                  {etape.delai}
                </span>
              </div>

              <p style={{ margin: '0 0 10px', fontSize: '13px', color: 'var(--color-muted)', lineHeight: 1.6 }}>
                {etape.texte}
              </p>

              {etape.action === 'lettre' && (
                <button
                  onClick={() => setModalOpen(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: '1.5px solid var(--color-accent)',
                    color: 'var(--color-accent)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  <Mail size={13} strokeWidth={1.5} />
                  Voir le modèle de lettre
                </button>
              )}

              {'liens' in etape && etape.liens && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {etape.liens.map(lien => (
                    <a
                      key={lien.href}
                      href={lien.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '13px',
                        color: 'var(--color-accent)',
                        textDecoration: 'none',
                        fontWeight: 500,
                      }}
                    >
                      {lien.label} <ExternalLink size={12} strokeWidth={1.5} />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal mise en demeure */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
          onClick={() => setModalOpen(false)}
        >
          <div
            style={{
              background: 'var(--color-surface)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '85vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '16px 20px',
              borderBottom: '1px solid var(--color-border)',
              flexShrink: 0,
            }}>
              <Mail size={16} color="var(--color-accent)" strokeWidth={1.5} />
              <span style={{ fontSize: '14px', fontWeight: 700, flex: 1 }}>
                Modèle de mise en demeure
              </span>
              <button
                onClick={() => setModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: 'var(--color-muted)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            {/* Modal body */}
            <pre style={{
              margin: 0,
              padding: '20px',
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace',
              fontSize: '12px',
              lineHeight: 1.7,
              color: 'var(--color-text)',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              flex: 1,
            }}>
              {MODELE_MISE_EN_DEMEURE}
            </pre>

            {/* Modal footer */}
            <div style={{
              display: 'flex',
              gap: '8px',
              padding: '14px 20px',
              borderTop: '1px solid var(--color-border)',
              flexShrink: 0,
            }}>
              <button
                onClick={handleCopyLetter}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  background: copied ? 'var(--color-safe)' : 'var(--color-accent)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  transition: 'background 0.15s ease',
                  flex: 1,
                  justifyContent: 'center',
                }}
              >
                {copied ? <Check size={14} strokeWidth={1.5} /> : <Copy size={14} strokeWidth={1.5} />}
                {copied ? 'Copié !' : 'Copier le modèle'}
              </button>
              <button
                onClick={() => setModalOpen(false)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  background: 'transparent',
                  color: 'var(--color-muted)',
                  border: '1.5px solid var(--color-border)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
