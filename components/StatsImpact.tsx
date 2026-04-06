'use client'

import { useEffect, useState } from 'react'

export default function StatsImpact() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const stats = [
    {
      pill: 'Plaintes 2024',
      pillColor: 'danger',
      number: '26 000',
      unit: 'signalements officiels',
      desc: 'déposés sur Signal Conso pour la rénovation énergétique en 2024 — contre 10 000 en 2022.',
      source: 'DGCCRF, sept. 2025',
    },
    {
      pill: 'Dossiers frauduleux',
      pillColor: 'danger',
      number: '44 000',
      unit: 'dossiers détectés',
      desc: 'dossiers frauduleux identifiés par le ministère du Logement sur MaPrimeRénov\' en 2024.',
      source: 'Ministère du Logement, 2024',
    },
    {
      pill: 'Chantiers litigieux',
      pillColor: 'warning',
      number: '15%',
      unit: 'des chantiers finissent en litige',
      desc: 'dont 40% pour malfaçons. Coût moyen d\'indemnisation : 15 000 € par dossier.',
      source: 'FFB / Observatoire de la Construction',
    },
    {
      pill: '1 professionnel sur 3',
      pillColor: 'neutral',
      number: '34%',
      unit: 'présentaient des manquements graves',
      desc: 'sur les 1 000 entreprises contrôlées en 2024, sanctionnées pénalement par la DGCCRF.',
      source: 'DGCCRF, bilan 2024',
    },
  ]

  const pillColors: Record<string, { bg: string; color: string }> = {
    danger: { bg: 'rgba(220, 53, 53, 0.1)', color: 'var(--color-danger)' },
    warning: { bg: 'rgba(180, 117, 23, 0.1)', color: '#BA7517' },
    neutral: { bg: 'rgba(0,0,0,0.06)', color: 'var(--color-muted)' },
  }

  return (
    <section style={{
      padding: isMobile ? '40px 16px' : '64px 24px',
      maxWidth: 1100,
      margin: '0 auto',
    }}>
      {/* Label section */}
      <p style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--color-muted)',
        marginBottom: 8,
      }}>
        Pourquoi ça compte
      </p>

      {/* Titre */}
      <h2 style={{
        fontSize: isMobile ? 22 : 28,
        fontWeight: 600,
        marginBottom: 32,
        lineHeight: 1.3,
        maxWidth: 600,
      }}>
        Les arnaques dans le bâtiment coûtent des centaines de millions d&apos;euros chaque année aux particuliers.
      </h2>

      {/* Grille stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
        gap: 16,
        marginBottom: 24,
      }}>
        {stats.map((stat, i) => (
          <div key={i} style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 16,
            padding: isMobile ? '20px 16px' : '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}>
            {/* Pill */}
            <span style={{
              display: 'inline-block',
              fontSize: 11,
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: 6,
              background: pillColors[stat.pillColor].bg,
              color: pillColors[stat.pillColor].color,
              alignSelf: 'flex-start',
            }}>
              {stat.pill}
            </span>

            {/* Nombre */}
            <div style={{
              fontSize: isMobile ? 28 : 36,
              fontWeight: 700,
              color: 'var(--color-accent)',
              lineHeight: 1,
            }}>
              {stat.number}
            </div>

            {/* Unité */}
            <div style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--color-muted)',
            }}>
              {stat.unit}
            </div>

            {/* Description */}
            <div style={{
              fontSize: 13,
              color: 'var(--color-muted)',
              lineHeight: 1.6,
            }}>
              {stat.desc}
            </div>

            {/* Source */}
            <div style={{
              fontSize: 11,
              color: 'var(--color-muted)',
              opacity: 0.6,
              marginTop: 4,
            }}>
              Source : {stat.source}
            </div>
          </div>
        ))}
      </div>

      {/* Bloc conclusion */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 16,
        padding: isMobile ? '20px 16px' : '24px 28px',
      }}>
        <p style={{
          fontSize: 15,
          fontWeight: 600,
          marginBottom: 8,
          color: 'inherit',
        }}>
          Un marché qui attire les opportunistes
        </p>
        <p style={{
          fontSize: 14,
          color: 'var(--color-muted)',
          lineHeight: 1.7,
          margin: 0,
        }}>
          La rénovation énergétique représente des dizaines de milliards d&apos;euros d&apos;aides publiques par an. Les fraudeurs s&apos;organisent désormais en réseaux structurés selon la DGCCRF, ciblant en priorité les particuliers qui ne vérifient pas avant de signer.
        </p>
      </div>
    </section>
  )
}
