'use client'

import { useEffect, useState } from 'react'
import { Sparkles, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'
import type { SyntheseInput, SyntheseResult } from '@/app/api/rapport-synthese/route'
import PackBadge from '@/components/PackBadge'

interface SyntheseIAProps {
  input: SyntheseInput
  compact?: boolean
}

const VERDICT_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  FIABLE:    { bg: '#EAF3DE', color: '#27500A', label: 'Fiable' },
  VIGILANCE: { bg: '#FAEEDA', color: '#854F0B', label: 'Vigilance recommandée' },
  RISQUE:    { bg: '#FCEBEB', color: '#791F1F', label: 'Risque détecté' },
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
        <span style={{ fontWeight: 700, fontSize: '15px' }}>Synthèse Rien qui cloche</span>
        <PackBadge />
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

export default function SyntheseIA({ input, compact }: SyntheseIAProps) {
  const [synthese, setSynthese] = useState<SyntheseResult | null>(null)
  const [loading, setLoading] = useState(true)
  const inputKey = JSON.stringify(input)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setSynthese(null)
    fetch('/api/rapport-synthese', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
      .then(r => r.json())
      .then((data: SyntheseResult) => {
        if (!cancelled) setSynthese(data)
      })
      .catch(() => {
        if (!cancelled) setSynthese(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [inputKey])

  if (loading) return <Skeleton />
  if (!synthese) return null

  // Support both old (recommandation) and new (verdict) fields
  const verdictKey = synthese.verdict ?? synthese.recommandation ?? 'VIGILANCE'
  const verdictStyle = VERDICT_STYLES[verdictKey] ?? VERDICT_STYLES.VIGILANCE
  const verdictTitre = synthese.verdict_titre ?? verdictStyle.label

  return (
    <div className="rapport-card" style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px',
    }}>
      {/* Titre + badge verdict */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <Sparkles size={20} color="var(--color-accent)" strokeWidth={1.5} />
        <span style={{ fontWeight: 700, fontSize: '15px' }}>Synthèse Rien qui cloche</span>
        <PackBadge />
      </div>

      {/* Verdict titre + badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 500, fontSize: '16px', color: 'var(--color-text)' }}>
          {verdictTitre}
        </span>
        <span style={{
          fontSize: '11px', fontWeight: 700,
          background: verdictStyle.bg,
          color: verdictStyle.color,
          padding: '3px 10px', borderRadius: '20px',
          flexShrink: 0,
        }}>
          {verdictKey}
        </span>
      </div>

      {/* Verdict explication */}
      {!compact && synthese.verdict_explication && (
        <p style={{ margin: '0 0 14px', fontSize: '14px', color: 'var(--color-muted)', lineHeight: 1.6 }}>
          {synthese.verdict_explication}
        </p>
      )}

      {/* Résumé */}
      <p style={{ margin: '0 0 12px', fontSize: compact ? '13px' : '15px', lineHeight: 1.7, color: 'var(--color-text)' }}>
        {synthese.resume}
      </p>

      {/* Score explication */}
      {!compact && synthese.score_explication && (
        <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--color-muted)', fontStyle: 'italic', lineHeight: 1.5 }}>
          {synthese.score_explication}
        </p>
      )}

      {/* Points forts */}
      {!compact && synthese.points_forts.length > 0 && (
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
      {!compact && synthese.points_attention.length > 0 && (
        <div style={{ marginTop: synthese.points_forts.length > 0 ? '12px' : '0', marginBottom: '12px' }}>
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

      {/* Actions recommandées */}
      {!compact && synthese.actions_recommandees && synthese.actions_recommandees.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, color: '#185FA5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Ce que vous devez faire avant de signer
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {synthese.actions_recommandees.map((a, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: '8px',
                background: '#E6F1FB', borderRadius: '8px', padding: '8px 12px',
              }}>
                <ArrowRight size={14} color="#185FA5" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: '1px' }} />
                <span style={{ fontSize: '13px', color: 'var(--color-text)' }}>{a}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommandation texte (compat ancien format) */}
      {!compact && !synthese.verdict_explication && synthese.recommandation_texte && (
        <p style={{ margin: '14px 0 0', fontSize: '12px', color: 'var(--color-muted)', fontStyle: 'italic' }}>
          {synthese.recommandation_texte}
        </p>
      )}
    </div>
  )
}
