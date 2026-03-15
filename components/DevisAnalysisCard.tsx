'use client'

import { CheckCircle2, XCircle, AlertCircle, Info, TrendingUp, TrendingDown, Minus, ClipboardList, Lightbulb, Building2, ExternalLink } from 'lucide-react'
import ScoreRing from './ScoreRing'
import type { DevisAnalysis, SearchResult } from '@/types'

interface Props {
  analysis: DevisAnalysis
  company?: SearchResult | null
}

const VERDICT_CONFIG = {
  conforme: { label: 'Devis conforme', bg: 'var(--color-safe-bg)', color: 'var(--color-safe)', icon: <CheckCircle2 size={16} /> },
  vigilance: { label: 'Points de vigilance', bg: '#fffbeb', color: '#d97706', icon: <AlertCircle size={16} /> },
  suspect: { label: 'Devis suspect', bg: 'var(--color-danger-bg)', color: 'var(--color-danger)', icon: <XCircle size={16} /> },
}

const ALERTE_CONFIG = {
  danger: { bg: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: 'color-mix(in srgb, var(--color-danger) 25%, transparent)', icon: <XCircle size={14} /> },
  warn: { bg: '#fffbeb', color: '#d97706', border: '#fde68a', icon: <AlertCircle size={14} /> },
  info: { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', icon: <Info size={14} /> },
}

export default function DevisAnalysisCard({ analysis, company }: Props) {
  const verdict = VERDICT_CONFIG[analysis.verdict]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── HEADER SCORE + VERDICT ── */}
      <div className="result-card" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <ScoreRing score={analysis.score} />
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '8px 14px', borderRadius: '10px',
            background: verdict.bg, color: verdict.color,
            fontWeight: 700, fontSize: '14px', marginBottom: '12px',
          }}>
            {verdict.icon}
            {verdict.label}
          </div>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.7, color: 'var(--color-text)' }}>
            {analysis.resume}
          </p>
        </div>
      </div>

      {/* ── MENTIONS LÉGALES ── */}
      <div className="result-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <ClipboardList size={16} color="var(--color-accent)" />
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, letterSpacing: '-0.01em' }}>Mentions légales obligatoires</h3>
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--color-muted)' }}>
            {analysis.mentions_legales.filter(m => m.present).length}/{analysis.mentions_legales.length} présentes
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {analysis.mentions_legales.map((m, i) => (
            <div key={i} style={{
              display: 'flex', gap: '12px', alignItems: 'flex-start',
              padding: '10px 0',
              borderBottom: i < analysis.mentions_legales.length - 1 ? '1px solid var(--color-border)' : 'none',
            }}>
              <div style={{ flexShrink: 0, marginTop: '1px' }}>
                {m.present
                  ? <CheckCircle2 size={16} color="var(--color-safe)" />
                  : <XCircle size={16} color="var(--color-danger)" />
                }
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: m.present ? 'var(--color-text)' : 'var(--color-danger)' }}>
                  {m.label}
                </p>
                {m.detail && (
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--color-muted)', lineHeight: 1.5 }}>
                    {m.detail}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ALERTES ── */}
      {analysis.alertes.length > 0 && (
        <div className="result-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <AlertCircle size={16} color="var(--color-danger)" />
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, letterSpacing: '-0.01em' }}>Alertes détectées</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {analysis.alertes.map((a, i) => {
              const cfg = ALERTE_CONFIG[a.type]
              return (
                <div key={i} style={{
                  display: 'flex', gap: '10px', alignItems: 'flex-start',
                  padding: '10px 12px', borderRadius: '10px',
                  background: cfg.bg, border: `1px solid ${cfg.border}`,
                }}>
                  <div style={{ color: cfg.color, flexShrink: 0, marginTop: '1px' }}>{cfg.icon}</div>
                  <p style={{ margin: 0, fontSize: '13px', color: cfg.color, fontWeight: 500, lineHeight: 1.5 }}>
                    {a.message}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── COHÉRENCE DES PRIX ── */}
      {analysis.prix_coherents !== null && (
        <div className="result-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            {analysis.prix_coherents
              ? <TrendingUp size={16} color="var(--color-safe)" />
              : <TrendingDown size={16} color="var(--color-danger)" />
            }
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, letterSpacing: '-0.01em' }}>Cohérence des prix</h3>
            <span style={{
              marginLeft: 'auto', fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px',
              background: analysis.prix_coherents ? 'var(--color-safe-bg)' : 'var(--color-danger-bg)',
              color: analysis.prix_coherents ? 'var(--color-safe)' : 'var(--color-danger)',
            }}>
              {analysis.prix_coherents ? 'Cohérents' : 'À vérifier'}
            </span>
          </div>
          {analysis.commentaire_prix && (
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)', lineHeight: 1.6 }}>
              {analysis.commentaire_prix}
            </p>
          )}
        </div>
      )}

      {/* ── RECOMMANDATIONS ── */}
      {analysis.recommandations.length > 0 && (
        <div className="result-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Lightbulb size={16} color="#d97706" />
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, letterSpacing: '-0.01em' }}>Recommandations</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {analysis.recommandations.map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                  background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                  color: 'var(--color-accent)', fontSize: '11px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1px',
                }}>
                  {i + 1}
                </div>
                <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6 }}>{r}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── FICHE ENTREPRISE (si SIRET croisé) ── */}
      {company && (
        <div className="result-card" style={{ background: 'var(--color-safe-bg)', border: '1px solid color-mix(in srgb, var(--color-safe) 30%, transparent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Building2 size={16} color="var(--color-safe)" />
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--color-safe)', letterSpacing: '-0.01em' }}>
              Entreprise identifiée dans le devis
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700 }}>{company.nom}</p>
              <p style={{ margin: '0 0 2px', fontSize: '12px', color: 'var(--color-muted)' }}>{company.activite}</p>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)' }}>{company.adresse}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '50%',
                background: company.score >= 70 ? 'var(--color-safe)' : company.score >= 45 ? '#f59e0b' : 'var(--color-danger)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: '16px', fontWeight: 800,
              }}>
                {company.score}
              </div>
              <p style={{ margin: 0, fontSize: '10px', color: 'var(--color-muted)', textAlign: 'center' }}>Score /100</p>
            </div>
          </div>
          <a
            href={`/?q=${encodeURIComponent(company.siret)}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '12px',
              fontSize: '13px', fontWeight: 600, color: 'var(--color-accent)', textDecoration: 'none',
            }}
          >
            <ExternalLink size={13} />
            Voir la fiche complète de cette entreprise
          </a>
        </div>
      )}

      {/* SIRET trouvé mais pas de fiche */}
      {analysis.siret_trouve && !company && (
        <div style={{ padding: '12px 14px', borderRadius: '10px', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#2563eb' }}>
            SIRET {analysis.siret_trouve} trouvé dans le devis.{' '}
            <a href={`/?q=${encodeURIComponent(analysis.siret_trouve)}`} style={{ fontWeight: 600, color: '#1d4ed8' }}>
              Rechercher cette entreprise →
            </a>
          </p>
        </div>
      )}

    </div>
  )
}
