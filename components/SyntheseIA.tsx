'use client'

import { useEffect, useState } from 'react'
import { Sparkles, CheckCircle, AlertCircle } from 'lucide-react'
import type { SyntheseInput, SyntheseResult } from '@/app/api/rapport-synthese/route'

interface SyntheseIAProps {
  input: SyntheseInput
}

const RECOMMANDATION_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  FIABLE: { bg: 'var(--color-safe-bg)', color: 'var(--color-safe)', label: 'Fiable' },
  VIGILANCE: { bg: '#fffbeb', color: '#92400e', label: 'Vigilance recommandée' },
  RISQUE: { bg: 'var(--color-danger-bg)', color: 'var(--color-danger)', label: 'Risque détecté' },
}

function Skeleton() {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Sparkles size={20} color="var(--color-accent)" strokeWidth={1.5} />
        <span style={{ fontWeight: 700, fontSize: '15px' }}>Synthèse Verifio</span>
        <span style={{
          fontSize: '11px', color: 'var(--color-muted)',
          background: 'var(--color-neutral-bg)',
          padding: '2px 8px', borderRadius: '20px',
        }}>
          Génération en cours…
        </span>
      </div>
      {[100, 80, 60, 40].map((w, i) => (
        <div key={i} style={{
          height: '12px',
          borderRadius: '6px',
          background: 'var(--color-border)',
          width: `${w}%`,
          marginBottom: '10px',
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  )
}

export default function SyntheseIA({ input }: SyntheseIAProps) {
  const [synthese, setSynthese] = useState<SyntheseResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/rapport-synthese', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
      .then(r => r.json())
      .then((data: SyntheseResult) => setSynthese(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <Skeleton />
  if (!synthese) return null

  const recomm = RECOMMANDATION_STYLES[synthese.recommandation] ?? RECOMMANDATION_STYLES.VIGILANCE

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px',
    }}>
      {/* Titre */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <Sparkles size={20} color="var(--color-accent)" strokeWidth={1.5} />
        <span style={{ fontWeight: 700, fontSize: '15px' }}>Synthèse Verifio</span>
        <span style={{
          fontSize: '11px', fontWeight: 700,
          background: recomm.bg,
          color: recomm.color,
          padding: '3px 10px', borderRadius: '20px',
          marginLeft: 'auto',
        }}>
          {recomm.label}
        </span>
      </div>

      {/* Résumé */}
      <p style={{ margin: '0 0 16px', fontSize: '15px', lineHeight: 1.7, color: 'var(--color-text)' }}>
        {synthese.resume}
      </p>

      {/* Points forts */}
      {synthese.points_forts.length > 0 && (
        <div style={{ marginBottom: synthese.points_attention.length > 0 ? '12px' : '0' }}>
          <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, color: 'var(--color-safe)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Points forts
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {synthese.points_forts.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <CheckCircle size={14} color="var(--color-safe)" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '13px', color: 'var(--color-text)' }}>{p}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Points d'attention */}
      {synthese.points_attention.length > 0 && (
        <div style={{ marginTop: synthese.points_forts.length > 0 ? '12px' : '0' }}>
          <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Points d&apos;attention
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {synthese.points_attention.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <AlertCircle size={14} color="orange" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '13px', color: 'var(--color-text)' }}>{p}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommandation texte */}
      <p style={{ margin: '14px 0 0', fontSize: '12px', color: 'var(--color-muted)', fontStyle: 'italic' }}>
        {synthese.recommandation_texte}
      </p>
    </div>
  )
}
