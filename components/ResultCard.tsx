'use client'

import { useState, useEffect } from 'react'
import {
  CheckCircle2, XCircle, AlertCircle, Info, MapPin, Calendar, Building2, Hash,
  Leaf, ChevronRight, Users, Scale, Clock, Sparkles, Award, Briefcase,
  ClipboardList, ArrowLeftRight, Download, GitCompare, ClipboardCheck, Bell, X,
} from 'lucide-react'
import ScoreRing from './ScoreRing'
import type { SearchResult, Alert, AlertType, BodaccAnnonce } from '@/types'

interface Props {
  result: SearchResult
  onSelect?: (siren: string) => void
}

interface EnrichState {
  loading: boolean
  aiSummary?: string | null
  aiChecklist?: string[] | null
}

const alertIcons: Record<AlertType, React.ReactNode> = {
  safe: <CheckCircle2 size={15} />,
  warn: <AlertCircle size={15} />,
  danger: <XCircle size={15} />,
  info: <Info size={15} />,
}

// ── Company initials circle (Qonto-style) ────────────────────────
const INITIALS_PALETTES = [
  { bg: '#dbeafe', color: '#1d4ed8' },
  { bg: '#d1fae5', color: '#065f46' },
  { bg: '#fce7f3', color: '#be185d' },
  { bg: '#ede9fe', color: '#5b21b6' },
  { bg: '#fef3c7', color: '#92400e' },
  { bg: '#ffedd5', color: '#9a3412' },
  { bg: '#e0f2fe', color: '#0c4a6e' },
  { bg: '#f0fdf4', color: '#14532d' },
]

function getInitials(name: string): string {
  const words = (name || '').trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase() || '?'
}

function getPalette(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff
  return INITIALS_PALETTES[Math.abs(hash) % INITIALS_PALETTES.length]
}

function CompanyAvatar({ nom, size = 52 }: { nom: string; size?: number }) {
  const initials = getInitials(nom)
  const palette = getPalette(nom)
  const radius = size <= 40 ? '10px' : '14px'
  return (
    <div style={{
      width: size, height: size, borderRadius: radius, flexShrink: 0,
      background: palette.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: `1.5px solid color-mix(in srgb, ${palette.color} 25%, transparent)`,
    }}>
      <span style={{
        fontSize: size <= 40 ? '13px' : '17px', fontWeight: 700,
        color: palette.color, fontFamily: 'var(--font-display)', letterSpacing: '-0.01em',
      }}>
        {initials}
      </span>
    </div>
  )
}

// ── Misc helpers ─────────────────────────────────────────────────
function computeScoreMaturite(dateCreation: string, rge: boolean, hasCC: boolean) {
  if (!dateCreation) return null
  const ans = (Date.now() - new Date(dateCreation).getTime()) / (1000 * 60 * 60 * 24 * 365)
  if (ans < 1) return { label: 'Jeune', bg: '#fef3c7', color: '#d97706', ans: Math.floor(ans) }
  if (ans < 5) {
    if (rge || hasCC) return { label: 'Établie', bg: 'var(--color-safe-bg)', color: 'var(--color-safe)', ans: Math.floor(ans) }
    return { label: 'En développement', bg: '#dbeafe', color: '#2563eb', ans: Math.floor(ans) }
  }
  if (ans < 10) {
    if (rge && hasCC) return { label: 'Expérimentée', bg: '#d1fae5', color: '#065f46', ans: Math.floor(ans) }
    return { label: 'Établie', bg: 'var(--color-safe-bg)', color: 'var(--color-safe)', ans: Math.floor(ans) }
  }
  return { label: 'Expérimentée', bg: '#d1fae5', color: '#065f46', ans: Math.floor(ans) }
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | number }) {
  if (!value && value !== 0) return null
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
      <div style={{ color: 'var(--color-muted)', flexShrink: 0, marginTop: '1px' }}>{icon}</div>
      <div>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)', marginBottom: '2px' }}>{label}</p>
        <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>{value}</p>
      </div>
    </div>
  )
}

const FAMILLE_COLORS: Record<string, string> = {
  'Créations': 'var(--color-safe)', 'Immatriculations': 'var(--color-safe)',
  'Modifications diverses': '#6366f1', 'Procédures collectives': 'var(--color-danger)',
  'Procédures de conciliation': 'var(--color-danger)', 'Procédures de rétablissement professionnel': 'var(--color-danger)',
  'Radiations': 'var(--color-muted)', 'Ventes et cessions': '#f59e0b', 'Dépôts des comptes': 'var(--color-muted)',
}

function TimelineItem({ annonce, last }: { annonce: BodaccAnnonce; last: boolean }) {
  const color = FAMILLE_COLORS[annonce.famille] || 'var(--color-muted)'
  const isAlert = annonce.famille.toLowerCase().includes('procédure')
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, marginTop: '4px' }} />
        {!last && <div style={{ width: '1px', flex: 1, background: 'var(--color-border)', marginTop: '4px' }} />}
      </div>
      <div style={{ paddingBottom: '16px', flex: 1 }}>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)', marginBottom: '2px' }}>
          {annonce.date ? new Date(annonce.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
        </p>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: isAlert ? 600 : 500, color: isAlert ? color : 'var(--color-text)' }}>{annonce.famille}</p>
        {annonce.tribunal && <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-muted)' }}>{annonce.tribunal}</p>}
        {annonce.details && <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-muted)' }}>{annonce.details}</p>}
      </div>
    </div>
  )
}

// ── Section wrapper ───────────────────────────────────────────────
function Section({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      marginTop: '16px', border: '1px solid var(--color-border)',
      borderRadius: '14px', overflow: 'hidden',
      ...style,
    }}>
      {children}
    </div>
  )
}

function SectionHeader({ icon, title, badge }: { icon: React.ReactNode; title: string; badge?: React.ReactNode }) {
  return (
    <div style={{
      padding: '12px 16px', background: 'var(--color-bg)',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex', alignItems: 'center', gap: '8px',
    }}>
      <div style={{ color: 'var(--color-muted)' }}>{icon}</div>
      <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase', color: 'var(--color-muted)', flex: 1 }}>
        {title}
      </span>
      {badge}
    </div>
  )
}

// ── Surveillance modal ────────────────────────────────────────────
function SurveillanceModal({ result, onClose, onDone }: { result: SearchResult; onClose: () => void; onDone: () => void }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/surveillance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          siret: result.siret,
          nom: result.nom,
          score: result.score,
          statut: result.statut,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) setError(data.error || 'Erreur lors de l\'activation.')
      else { setDone(true); onDone() }
    } catch {
      setError('Erreur réseau. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Bell size={16} color="var(--color-accent)" />
              <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>Surveiller cet artisan</span>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)' }}>{result.nom}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', padding: '2px', lineHeight: 1 }}>
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔔</div>
            <p style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: 'var(--color-accent)' }}>Alerte activée !</p>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)', lineHeight: 1.6 }}>
              Nous vous enverrons un email si cet artisan change de statut, passe en liquidation ou reçoit une procédure judiciaire.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ margin: '0 0 16px', fontSize: '14px', color: 'var(--color-muted)', lineHeight: 1.6 }}>
              Nous vous alerterons si cet artisan change de statut, passe en liquidation ou reçoit une procédure judiciaire.
              <strong style={{ color: 'var(--color-text)' }}> Aucun compte requis.</strong>
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Votre email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="prenom@exemple.fr"
                style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--color-border)', borderRadius: '10px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--color-bg)', color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box' }}
                autoFocus
              />
            </div>

            {error && (
              <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--color-danger)' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim()}
              style={{ width: '100%', padding: '13px', borderRadius: '12px', border: 'none', background: loading || !email.trim() ? 'var(--color-border)' : 'var(--color-accent)', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: loading || !email.trim() ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)', transition: 'background 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {loading ? (
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} className="spin" />
              ) : (
                <><Bell size={15} /> M&apos;alerter</>
              )}
            </button>
          </form>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .spin { animation: spin 0.8s linear infinite; }`}</style>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────
export default function ResultCard({ result, onSelect }: Props) {
  const [enrich, setEnrich] = useState<EnrichState>({ loading: false })
  const [mapLoaded, setMapLoaded] = useState(false)
  const [showSurveillance, setShowSurveillance] = useState(false)
  const [surveillanceActive, setSurveillanceActive] = useState(false)

  useEffect(() => {
    setEnrich({ loading: true })
    const params = new URLSearchParams({
      siret: result.siret, nom: result.nom, codeNaf: result.codeNaf || '',
      activite: result.activite, dateCreation: result.dateCreation, adresse: result.adresse,
      score: String(result.score), statut: result.statut,
      rge: result.rge.certifie ? 'true' : 'false', cc: result.conventionCollective || '',
      alertes: result.alerts.filter((a) => a.type !== 'safe').map((a) => a.message).join('; '),
    })
    fetch(`/api/enrich?${params}`)
      .then((r) => r.json())
      .then((data) => setEnrich({ loading: false, aiSummary: data.aiSummary, aiChecklist: data.aiChecklist }))
      .catch(() => setEnrich({ loading: false }))
  }, [result.siret])

  const formatDate = (d: string) => {
    if (!d) return undefined
    try { return new Date(d).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) }
    catch { return d }
  }

  const nbAnnonces = result.bodacc.annonces.length

  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
  const mapsUrl = result.adresse
    ? mapsKey
      ? `https://www.google.com/maps/embed/v1/place?q=${encodeURIComponent(result.adresse)}&key=${mapsKey}`
      : `https://www.google.com/maps?q=${encodeURIComponent(result.adresse)}&output=embed`
    : null

  // ── Verdict ──────────────────────────────────────────────
  const hasDanger = result.alerts.some((a) => a.type === 'danger')
  const verdictLevel: 'fiable' | 'prudence' | 'risque' =
    result.statut !== 'actif' || result.bodacc.procedureCollective || result.score < 45
      ? 'risque'
      : result.score < 70 || hasDanger
      ? 'prudence'
      : 'fiable'

  const VERDICT_CONFIG = {
    fiable:   { label: 'FIABLE',   icon: '✓', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
    prudence: { label: 'PRUDENCE', icon: '⚠', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    risque:   { label: 'RISQUÉ',   icon: '✗', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  }
  const verdict = VERDICT_CONFIG[verdictLevel]

  // ── 6 indicators ─────────────────────────────────────────
  const ancAns = result.dateCreation
    ? (Date.now() - new Date(result.dateCreation).getTime()) / (1000 * 60 * 60 * 24 * 365)
    : null

  type IndicatorColor = 'safe' | 'warn' | 'danger' | 'neutral'
  const IND_COLORS: Record<IndicatorColor, { color: string; bg: string }> = {
    safe:    { color: '#16a34a', bg: '#f0fdf4' },
    warn:    { color: '#d97706', bg: '#fffbeb' },
    danger:  { color: '#dc2626', bg: '#fef2f2' },
    neutral: { color: 'var(--color-muted)', bg: 'var(--color-bg)' },
  }
  const indicators: { icon: string; label: string; text: string; level: IndicatorColor }[] = [
    {
      icon: result.statut === 'actif' ? '✓' : '✗',
      label: 'Statut',
      text: result.statut === 'actif' ? 'Active' : 'Fermée',
      level: result.statut === 'actif' ? 'safe' : 'danger',
    },
    {
      icon: ancAns === null ? '?' : ancAns >= 3 ? '✓' : ancAns >= 1 ? '~' : '✗',
      label: 'Ancienneté',
      text: ancAns !== null ? `${Math.floor(ancAns)} an${Math.floor(ancAns) > 1 ? 's' : ''}` : 'Inconnue',
      level: ancAns === null ? 'neutral' : ancAns >= 3 ? 'safe' : ancAns >= 1 ? 'warn' : 'danger',
    },
    {
      icon: result.rge.certifie ? '✓' : '—',
      label: 'RGE',
      text: result.rge.certifie ? 'Certifié' : 'Non certifié',
      level: result.rge.certifie ? 'safe' : 'neutral',
    },
    {
      icon: result.bodacc.procedureCollective ? '✗' : '✓',
      label: 'Procédures',
      text: result.bodacc.procedureCollective ? result.bodacc.typeProcedure || 'Détectée' : 'Aucune',
      level: result.bodacc.procedureCollective ? 'danger' : 'safe',
    },
    {
      icon: result.bodacc.changementDirigeantRecent ? '~' : '✓',
      label: 'Dirigeants',
      text: result.bodacc.changementDirigeantRecent ? 'Changement récent' : 'Stables',
      level: result.bodacc.changementDirigeantRecent ? 'warn' : 'safe',
    },
    {
      icon: result.conventionCollective ? '✓' : '~',
      label: 'Convention',
      text: result.conventionCollective ? 'Déclarée' : 'Non déclarée',
      level: result.conventionCollective ? 'safe' : 'warn',
    },
  ]

  // ── Vigilance / Positifs ──────────────────────────────────
  const alertOrder: Record<AlertType, number> = { danger: 0, warn: 1, info: 2, safe: 3 }
  const vigilanceAlerts = result.alerts
    .filter((a) => a.type !== 'safe')
    .sort((a, b) => alertOrder[a.type] - alertOrder[b.type])

  const positivePoints: string[] = []
  if (result.statut === 'actif' && ancAns !== null && ancAns >= 3)
    positivePoints.push(`Active depuis ${Math.floor(ancAns)} an${Math.floor(ancAns) > 1 ? 's' : ''}`)
  if (result.rge.certifie && result.rge.domaines.length > 0)
    positivePoints.push(`Certifiée RGE — ${[...new Set(result.rge.domaines)].slice(0, 2).join(', ')}`)
  if (!result.bodacc.procedureCollective)
    positivePoints.push('Aucune procédure judiciaire au BODACC')
  if (result.capitalSocial !== undefined && result.capitalSocial >= 10000)
    positivePoints.push(`Capital social de ${result.capitalSocial.toLocaleString('fr-FR')} €`)
  if (!result.bodacc.changementDirigeantRecent && result.dirigeants.length > 0)
    positivePoints.push('Dirigeants stables')
  if (result.conventionCollective)
    positivePoints.push('Convention collective déclarée')

  // ── Sources vérifiées ─────────────────────────────────────
  const SOURCES = [
    { label: 'INSEE', ok: !!result.siret },
    { label: 'BODACC', ok: true },
    { label: 'ADEME', ok: true },
    { label: 'Dirigeants', ok: result.dirigeants.length >= 0 },
    { label: 'Conventions', ok: true },
    { label: 'RNE/INPI', ok: true },
  ]
  const sourcesOk = SOURCES.filter((s) => s.ok).length

  return (
    <div>
      {showSurveillance && (
        <SurveillanceModal
          result={result}
          onClose={() => setShowSurveillance(false)}
          onDone={() => { setSurveillanceActive(true); setShowSurveillance(false) }}
        />
      )}
      <div className="result-card fade-up">

        {/* ── COMPANY HEADER ──────────────────────────────── */}
        <div style={{ marginBottom: '20px' }}>

          {/* Row 1: Avatar + Name + Verdict */}
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '16px' }}>
            <CompanyAvatar nom={result.nom} size={52} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 className="font-display" style={{ margin: '0 0 3px', fontSize: '19px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2, wordBreak: 'break-word' }}>
                {result.nom}
              </h2>
              <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--color-muted)', lineHeight: 1.4 }}>
                {result.activite}
                {result.codeNaf && <span style={{ marginLeft: '6px', fontSize: '11px', opacity: 0.6 }}>NAF {result.codeNaf}</span>}
                {result.formeJuridique && (
                  <span style={{ marginLeft: '6px', fontSize: '11px', fontWeight: 600, padding: '1px 7px', borderRadius: '20px', background: 'var(--color-neutral-bg)', color: 'var(--color-neutral)' }}>
                    {result.formeJuridique}
                  </span>
                )}
              </p>
              {/* Verdict pill */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '5px 12px', borderRadius: '20px',
                background: verdict.bg, border: `1px solid ${verdict.border}`,
              }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: verdict.color }}>{verdict.icon}</span>
                <span className="font-display" style={{ fontSize: '13px', fontWeight: 800, color: verdict.color, letterSpacing: '0.05em' }}>
                  {verdict.label}
                </span>
              </div>
            </div>
            {/* Score ring — right side */}
            <div style={{ flexShrink: 0 }}>
              <ScoreRing score={result.score} />
            </div>
          </div>

          {/* ── EMPATHETIC PHRASE ── */}
          {(() => {
            const s = result.score
            if (s >= 70) return (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', marginBottom: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <span style={{ fontSize: '15px' }}>✅</span>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#14532d', lineHeight: 1.4 }}>
                  Vous pouvez avancer sereinement avec cet artisan
                </p>
              </div>
            )
            if (s >= 45) return (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', marginBottom: '12px', background: '#fffbeb', border: '1px solid #fde68a' }}>
                <span style={{ fontSize: '15px' }}>⚠️</span>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#92400e', lineHeight: 1.4 }}>
                  Quelques vérifications supplémentaires recommandées
                </p>
              </div>
            )
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', marginBottom: '12px', background: '#fef2f2', border: '1px solid #fecaca' }}>
                <span style={{ fontSize: '15px' }}>🚨</span>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#991b1b', lineHeight: 1.4 }}>
                  Nous vous conseillons de demander des garanties supplémentaires
                </p>
              </div>
            )
          })()}

          {/* AI phrase */}
          {enrich.loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '14px' }}>
              {[80, 60].map((w, i) => (
                <div key={i} style={{ height: '10px', borderRadius: '5px', background: 'rgba(0,0,0,0.06)', width: `${w}%` }} />
              ))}
            </div>
          ) : enrich.aiSummary ? (
            <div style={{ display: 'flex', gap: '7px', alignItems: 'flex-start', marginBottom: '14px', padding: '10px 12px', borderRadius: '10px', background: 'color-mix(in srgb, var(--color-accent) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--color-accent) 15%, transparent)' }}>
              <Sparkles size={13} color="var(--color-accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text)', lineHeight: 1.55, fontStyle: 'italic', opacity: 0.8 }}>{enrich.aiSummary}</p>
            </div>
          ) : null}

          {/* 6 INDICATORS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '16px' }}>
            {indicators.map((ind) => {
              const c = IND_COLORS[ind.level]
              return (
                <div key={ind.label} style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  padding: '8px 10px', borderRadius: '10px',
                  background: c.bg, border: `1px solid color-mix(in srgb, ${c.color} 20%, transparent)`,
                }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: c.color, lineHeight: 1, flexShrink: 0 }}>{ind.icon}</span>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-muted)', display: 'block', lineHeight: 1, marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ind.label}</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: c.color, lineHeight: 1, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ind.text}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ⚠ POINTS DE VIGILANCE */}
          {vigilanceAlerts.length > 0 && (
            <div style={{ marginBottom: '10px', padding: '14px 16px', borderRadius: '12px', background: '#fffbeb', border: '1px solid #fde68a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
                <AlertCircle size={14} color="#d97706" />
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Points d'attention avant de signer
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {vigilanceAlerts.map((alert, i) => {
                  const aColor = alert.type === 'danger' ? '#dc2626' : alert.type === 'warn' ? '#d97706' : '#2563eb'
                  const aBg = alert.type === 'danger' ? '#fef2f2' : alert.type === 'warn' ? 'transparent' : '#eff6ff'
                  const AIcon = alert.type === 'danger' ? XCircle : alert.type === 'warn' ? AlertCircle : Info
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: alert.type === 'danger' ? '8px 10px' : '4px 0', borderRadius: alert.type === 'danger' ? '8px' : 0, background: aBg }}>
                      <AIcon size={13} color={aColor} style={{ flexShrink: 0, marginTop: '1px' }} />
                      <span style={{ fontSize: '13px', fontWeight: 500, color: aColor, lineHeight: 1.4 }}>{alert.message}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ✓ POINTS RASSURANTS */}
          {positivePoints.length > 0 && (
            <div style={{ marginBottom: '10px', padding: '14px 16px', borderRadius: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
                <CheckCircle2 size={14} color="#16a34a" />
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#14532d', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Points rassurants
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {positivePoints.map((point, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <CheckCircle2 size={12} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#166534', lineHeight: 1.4 }}>{point}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BARRE DE VÉRIFICATION */}
          <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Sources vérifiées
              </span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-safe)' }}>
                {sourcesOk}/{SOURCES.length}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '3px', marginBottom: '8px' }}>
              {SOURCES.map((s, i) => (
                <div key={i} style={{ flex: 1, height: '4px', borderRadius: '3px', background: s.ok ? 'var(--color-safe)' : 'var(--color-border)' }} />
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {SOURCES.map((s) => (
                <span key={s.label} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px', fontWeight: 600, color: s.ok ? 'var(--color-safe)' : 'var(--color-muted)' }}>
                  {s.ok ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                  {s.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ height: '1px', background: 'var(--color-border)', marginBottom: '16px' }} />

        {/* INFOS DE BASE */}
        <Section>
          <SectionHeader icon={<Building2 size={14} />} title="Identité légale" />
          <div style={{ padding: '4px 16px 8px' }}>
            <InfoRow icon={<Hash size={15} />} label="SIRET" value={result.siret} />
            <InfoRow icon={<Building2 size={15} />} label="Forme juridique" value={result.formeJuridique} />
            <InfoRow icon={<Calendar size={15} />} label="Date de création" value={formatDate(result.dateCreation)} />
            <InfoRow icon={<MapPin size={15} />} label="Adresse du siège" value={result.adresse} />
            {result.capitalSocial !== undefined && (
              <InfoRow icon={<Building2 size={15} />} label="Capital social" value={`${result.capitalSocial.toLocaleString('fr-FR')} €`} />
            )}
            {result.effectif && (
              <InfoRow icon={<Users size={15} />} label="Effectif" value={result.effectif} />
            )}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '10px 0' }}>
              <Briefcase size={15} color="var(--color-muted)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)', marginBottom: '2px' }}>Convention collective</p>
                {result.conventionCollective
                  ? <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>{result.conventionCollective}</p>
                  : <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)', fontStyle: 'italic' }}>Non déclarée</p>}
              </div>
            </div>
          </div>
        </Section>

        {/* CARTE MAPS */}
        {mapsUrl && (
          <Section>
            <SectionHeader
              icon={<MapPin size={14} />}
              title="Localisation"
              badge={mapLoaded ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--color-safe)', fontWeight: 600 }}>
                  <CheckCircle2 size={10} />Adresse vérifiée
                </span>
              ) : undefined}
            />
            <div style={{ height: '200px' }}>
              <iframe
                src={mapsUrl} width="100%" height="200"
                style={{ border: 0, display: 'block' }} loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                onLoad={() => setMapLoaded(true)}
                title={`Localisation : ${result.adresse}`}
              />
            </div>
          </Section>
        )}

        {/* ALERTE CESSION */}
        {result.successionInfo?.cessionDetectee && (
          <div style={{ marginTop: '16px', padding: '12px 14px', borderRadius: '10px', background: '#fffbeb', border: '1px solid #fde68a', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <ArrowLeftRight size={15} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#92400e' }}>
                Transfert de fonds de commerce détecté{result.successionInfo.cessionRecente && ' (moins de 3 ans)'}
              </p>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#78350f' }}>
                Une cession d'activité est publiée au BODACC. Vérifiez les conditions avant de vous engager.
              </p>
            </div>
          </div>
        )}

        {/* RGE */}
        <Section style={{ background: result.rge.certifie ? 'var(--color-safe-bg)' : undefined }}>
          <SectionHeader
            icon={<Leaf size={14} color={result.rge.certifie ? 'var(--color-safe)' : 'var(--color-muted)'} />}
            title="Certification RGE"
            badge={result.rge.certifie ? (
              <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: 'var(--color-safe-bg)', color: 'var(--color-safe)', border: '1px solid var(--color-safe-border)' }}>
                Certifié ✓
              </span>
            ) : undefined}
          />
          <div style={{ padding: '12px 16px' }}>
            {result.rge.certifie && result.rge.domaines.length > 0 ? (
              <div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                  {[...new Set(result.rge.domaines)].slice(0, 6).map((d, i) => (
                    <span key={i} className="badge badge-safe" style={{ fontSize: '11px' }}>{d}</span>
                  ))}
                </div>
                <a
                  href="/calculateur-aides"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    fontSize: '12px', fontWeight: 600, color: 'var(--color-safe)',
                    textDecoration: 'none', padding: '5px 10px',
                    borderRadius: '8px', border: '1px solid var(--color-safe-border)',
                    background: 'var(--color-safe-bg)',
                  }}
                >
                  💶 Calculer mes aides MaPrimeRénov&apos; →
                </a>
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)' }}>
                Non certifié RGE. Non obligatoire pour tous les travaux, mais requis pour les aides de l&apos;État (MaPrimeRénov&apos;).
              </p>
            )}
          </div>
        </Section>

        {/* CHECKLIST LÉGALE — IA */}
        {(enrich.loading || (enrich.aiChecklist && enrich.aiChecklist.length > 0)) && (
          <Section>
            <SectionHeader
              icon={<ClipboardList size={14} color="#7c3aed" />}
              title="Avant de signer — documents à demander"
              badge={
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: '#f3f0ff', color: '#7c3aed' }}>
                  IA · NAF {result.codeNaf || '—'}
                </span>
              }
            />
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {enrich.loading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(0,0,0,0.06)', flexShrink: 0 }} />
                    <div style={{ height: '11px', borderRadius: '6px', background: 'rgba(0,0,0,0.06)', flex: 1 }} />
                  </div>
                ))
              ) : (
                enrich.aiChecklist!.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0, background: '#f3f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1px' }}>
                      <CheckCircle2 size={11} color="#7c3aed" />
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.55 }}>{item}</p>
                  </div>
                ))
              )}
            </div>
          </Section>
        )}

        {/* SANTÉ FINANCIÈRE & HISTORIQUE */}
        <Section>
          <SectionHeader icon={<Scale size={14} color="var(--color-accent)" />} title="Santé financière &amp; historique légal" />
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Procédure collective */}
            {result.bodacc.procedureCollective && (
              <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <XCircle size={16} color="var(--color-danger)" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--color-danger)' }}>Procédure collective : {result.bodacc.typeProcedure || 'détectée'}</p>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-muted)' }}>Voir le détail dans les annonces BODACC ci-dessous.</p>
                </div>
              </div>
            )}

            {/* Dirigeants */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <Users size={13} color="var(--color-muted)" />
                <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dirigeants</p>
              </div>
              {result.dirigeants.length === 0 ? (
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)', fontStyle: 'italic' }}>Aucun dirigeant trouvé</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {result.dirigeants.map((d, i) => {
                    const fullName = [d.prenoms, d.nom].filter(Boolean).join(' ')
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--color-bg)', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                        <CompanyAvatar nom={fullName || '?'} size={34} />
                        <div>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>{fullName}</p>
                          <p style={{ margin: '1px 0 0', fontSize: '11px', color: 'var(--color-muted)' }}>
                            {d.qualite}{d.anneeNaissance ? ` · né en ${d.anneeNaissance}` : ''}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* BODACC timeline */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <Clock size={13} color="var(--color-muted)" />
                <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Annonces légales BODACC {nbAnnonces > 0 && `(${nbAnnonces})`}
                </p>
              </div>
              {nbAnnonces === 0 ? (
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)', fontStyle: 'italic' }}>Aucune annonce trouvée</p>
              ) : (
                <div>
                  {result.bodacc.annonces.map((annonce, i) => (
                    <TimelineItem key={i} annonce={annonce} last={i === nbAnnonces - 1} />
                  ))}
                </div>
              )}
            </div>

          </div>
        </Section>

        {/* BOUTONS ACTIONS */}
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <a
            href={`/nouveau-chantier?nom=${encodeURIComponent(result.nom)}&siret=${encodeURIComponent(result.siret || '')}&type=${encodeURIComponent(result.activite || '')}`}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', padding: '14px 20px', borderRadius: '12px', background: 'var(--color-accent)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', letterSpacing: '-0.01em', textDecoration: 'none', textAlign: 'center', boxSizing: 'border-box', fontFamily: 'var(--font-body)' }}
          >
            <ClipboardCheck size={16} />
            Créer un chantier avec cet artisan
          </a>

          {/* Bouton surveillance */}
          <button
            onClick={() => {
              if (!surveillanceActive) setShowSurveillance(true)
            }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              width: '100%', padding: '12px 20px', borderRadius: '12px', border: '1px solid',
              fontSize: '13px', fontWeight: 600, cursor: surveillanceActive ? 'default' : 'pointer',
              fontFamily: 'var(--font-body)', transition: 'all 0.15s', boxSizing: 'border-box',
              ...(surveillanceActive
                ? { background: '#f0fdf4', borderColor: '#bbf7d0', color: '#16a34a' }
                : { background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-muted)' }),
            }}
          >
            <Bell size={14} />
            {surveillanceActive ? '✓ Alerte activée' : 'Recevoir une alerte si le statut change'}
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <a
              href={`/comparer?q=${encodeURIComponent(result.siret)}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', textAlign: 'center', boxSizing: 'border-box' }}
            >
              <GitCompare size={14} />
              Comparer
            </a>
            <button
              onClick={() => window.print()}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
            >
              <Download size={14} />
              PDF
            </button>
          </div>
        </div>

        {/* DISCLAIMER */}
        <p style={{ margin: '16px 0 0', fontSize: '11px', color: 'var(--color-muted)', lineHeight: 1.6, padding: '12px', background: 'var(--color-bg)', borderRadius: '8px' }}>
          Données issues de l'INSEE (Sirene), de l'ADEME, du Registre National des Entreprises et du BODACC. Vérifiez toujours l'assurance décennale en demandant l'attestation directement à l'artisan. ArtisanCheck n'est pas responsable des décisions prises sur la base de ces données.
        </p>
      </div>

      {/* AUTRES RÉSULTATS */}
      {result.autresResultats.length > 0 && (
        <div className="fade-up fade-up-delay-1" style={{ marginTop: '12px' }}>
          <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '8px', paddingLeft: '4px' }}>Autres résultats similaires</p>
          {result.autresResultats.map((r) => (
            <button
              key={r.siren}
              onClick={() => onSelect?.(r.siren)}
              style={{ width: '100%', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '12px 16px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: onSelect ? 'pointer' : 'default', fontFamily: 'var(--font-body)', textAlign: 'left' }}
              className="card-hover"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CompanyAvatar nom={r.nom} size={36} />
                <div>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>{r.nom}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)' }}>{r.adresse}</p>
                </div>
              </div>
              <ChevronRight size={16} color="var(--color-muted)" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
