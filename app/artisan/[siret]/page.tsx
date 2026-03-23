'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import SiteHeader from '@/components/SiteHeader'
import { dirigeantSlug } from '@/lib/dirigeant'
import type { SearchResult } from '@/types'

/* ─── Interfaces ──────────────────────────────────────────── */
interface ArtisanPublicInfo {
  verifie: boolean
  badgeActif: boolean
  nomEntreprise: string | null
  description: string | null
}

/* ─── Helpers ─────────────────────────────────────────────── */
function getInitial(name: string): string {
  const trimmed = (name || '').trim()
  if (!trimmed) return '?'
  return trimmed[0].toUpperCase()
}

function getInitials(name: string): string {
  const words = (name || '').trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase() || '?'
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return dateStr
  }
}

function getYears(dateStr: string | undefined): number {
  if (!dateStr) return 0
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return 0
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365))
}

function formeJuridiqueLabel(code: string | undefined, raw: string | undefined): string {
  if (!code && !raw) return '—'
  const map: Record<string, string> = {
    '5710': 'Société par actions simplifiée',
    '5499': 'Société à responsabilité limitée',
    '1000': 'Entrepreneur individuel',
    '1100': 'Artisan-commerçant',
    '5306': 'SARL',
    '5308': 'Société à responsabilité limitée',
    '5720': 'Société par actions simplifiée unipersonnelle',
    '5202': 'Société en nom collectif',
    '5191': 'Société civile',
    '6540': 'Association loi 1901',
  }
  if (code && map[code]) return map[code]
  if (!raw) return code || '—'
  const rawUpper = raw.toUpperCase()
  if (rawUpper.includes('SAS') && !rawUpper.includes('SARL')) return 'Société par actions simplifiée'
  if (rawUpper.includes('SARL')) return 'Société à responsabilité limitée'
  if (rawUpper.includes('EI') || rawUpper.includes('ENTREPRISE INDIVIDUELLE')) return 'Entreprise individuelle'
  if (rawUpper.includes('EURL')) return 'Entreprise unipersonnelle à responsabilité limitée'
  if (rawUpper.includes('SA ') || rawUpper === 'SA') return 'Société anonyme'
  if (rawUpper.includes('SNC')) return 'Société en nom collectif'
  return raw
}

/* ─── TVA intracommunautaire ─────────────────────────────── */
function computeTVA(siren: string): string {
  const n = parseInt(siren, 10)
  if (isNaN(n)) return ''
  const cle = (12 + 3 * (n % 97)) % 97
  return `FR${String(cle).padStart(2, '0')}${siren}`
}

/* ─── Établissement type ─────────────────────────────────── */
interface Etablissement {
  siret: string
  adresse: string
  estSiege: boolean
  statut: 'A' | 'F' | string
  dateCreation?: string
}

/* ─── BODACC categorization ──────────────────────────────── */
function categorizeBodacc(annonces: Array<{ famille: string; type: string; date: string; tribunal?: string }>) {
  const proceduresCollectives = annonces.filter(a =>
    a.famille === 'PROCEDURE_COLLECTIVE' || a.type?.toLowerCase().includes('liquidation') || a.type?.toLowerCase().includes('redressement') || a.type?.toLowerCase().includes('sauvegarde')
  )
  const depotComptes = annonces.filter(a =>
    a.famille === 'BILAN' || a.famille === 'DEPOT_COMPTES' || a.type?.toLowerCase().includes('dépôt') || a.type?.toLowerCase().includes('bilan')
  )
  const ventesCoissions = annonces.filter(a =>
    a.famille === 'VENTE' || a.type?.toLowerCase().includes('vente') || a.type?.toLowerCase().includes('cession')
  )
  const modifications = annonces.filter(a =>
    !proceduresCollectives.includes(a) && !depotComptes.includes(a) && !ventesCoissions.includes(a)
  )
  return { proceduresCollectives, depotComptes, ventesCoissions, modifications }
}

/* ─── Score calculation ───────────────────────────────────── */
function computeScore(result: SearchResult) {
  const rge = result.rge ?? { certifie: false, domaines: [], organismes: [] }
  const dirigeants = result.dirigeants ?? []
  const bodacc = result.bodacc ?? { procedureCollective: false, annonces: [], changementDirigeantRecent: false }

  const statut_score = result.statut === 'actif' ? 25 : 0
  const certif_score = rge.certifie ? 20 : 0
  const age = getYears(result.dateCreation)
  const anciennete_score = age >= 10 ? 20 : age >= 3 ? 14 : 7
  const dirigeants_score = dirigeants.length > 0 ? 20 : 0
  const nbProcedures = bodacc.annonces?.length ?? 0
  const procedures_score = !bodacc.procedureCollective ? 15 : nbProcedures < 3 ? 5 : 0

  const total = statut_score + certif_score + anciennete_score + dirigeants_score + procedures_score

  return {
    total,
    statut_score,
    certif_score,
    anciennete_score,
    dirigeants_score,
    procedures_score,
  }
}

/* ─── Skeleton ────────────────────────────────────────────── */
function Skeleton({ width = '100%', height = 20, borderRadius = 8 }: { width?: string | number; height?: number; borderRadius?: number }) {
  return (
    <div style={{
      width,
      height,
      borderRadius,
      background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
    }} />
  )
}

/* ─── Loading skeleton layout ─────────────────────────────── */
function LoadingSkeleton() {
  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
      {/* Header skeleton */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
        padding: '32px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
      }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#e5e7eb', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Skeleton width="60%" height={28} borderRadius={6} />
          <Skeleton width="40%" height={20} borderRadius={20} />
          <Skeleton width="50%" height={16} borderRadius={4} />
        </div>
        <Skeleton width={100} height={36} borderRadius={24} />
      </div>
      {/* Body skeletons */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        <div style={{ flex: '0 0 62%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {[200, 160, 120, 100].map((h, i) => (
            <div key={i} style={{
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
              padding: '28px',
            }}>
              <Skeleton width="40%" height={20} borderRadius={4} />
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Skeleton height={16} />
                <Skeleton width="80%" height={16} />
                <Skeleton width="60%" height={16} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ flex: '0 0 38%' }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
            padding: '28px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <div style={{ width: 120, height: 120, borderRadius: '50%', background: '#e5e7eb' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Skeleton height={16} />
              <Skeleton height={16} />
              <Skeleton height={16} />
              <Skeleton height={44} borderRadius={12} />
              <Skeleton height={44} borderRadius={12} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/* ─── Score Ring (animated) ───────────────────────────────── */
function ScoreRing({ score, strokeColor }: { score: number; strokeColor: string }) {
  const [animated, setAnimated] = useState(false)
  const circumference = 2 * Math.PI * 52

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(t)
  }, [])

  const dasharray = animated
    ? `${(score / 100) * circumference} ${circumference}`
    : `0 ${circumference}`

  return (
    <div style={{ position: 'relative', width: 120, height: 120 }}>
      <svg viewBox="0 0 120 120" width="120" height="120">
        <circle cx="60" cy="60" r="52" fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="60" cy="60" r="52" fill="none"
          stroke={strokeColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={dasharray}
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dasharray 1.2s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        lineHeight: 1,
      }}>
        <div style={{ fontSize: '44px', fontWeight: 800, color: '#1B4332', fontFamily: 'var(--font-body)' }}>
          {score}
        </div>
        <div style={{ fontSize: '14px', color: '#9ca3af' }}>/100</div>
      </div>
    </div>
  )
}

/* ─── Main Page ───────────────────────────────────────────── */
export default function ArtisanFichePage() {
  const params = useParams()
  const router = useRouter()
  const siret = typeof params.siret === 'string' ? params.siret : ''

  const [result, setResult] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [artisanPublic, setArtisanPublic] = useState<ArtisanPublicInfo | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [etablissements, setEtablissements] = useState<Etablissement[]>([])
  const [etablissementsLoading, setEtablissementsLoading] = useState(false)
  const [tvacopied, setTvaCopied] = useState(false)
  const [showAllEtab, setShowAllEtab] = useState(false)
  const [showAllRGE, setShowAllRGE] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  async function startSerenite() {
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'serenite', siret, nom: result?.nom }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      alert('Erreur Stripe. Réessayez.')
    } finally {
      setCheckoutLoading(false)
    }
  }

  function copyLink() {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    if (url) {
      navigator.clipboard.writeText(url).then(() => {
        setLinkCopied(true)
        setTimeout(() => setLinkCopied(false), 2000)
      })
    }
  }

  useEffect(() => {
    if (!siret) return
    setLoading(true)
    setError(null)
    Promise.all([
      fetch(`/api/search?q=${encodeURIComponent(siret)}`).then(r => r.json()),
      fetch(`/api/artisan/public?siret=${encodeURIComponent(siret)}`).then(r => r.json()),
    ])
      .then(([searchData, publicData]) => {
        if (searchData.error) setError(searchData.error)
        else {
          setResult(searchData)
          // Fetch établissements
          if (searchData.siren) {
            setEtablissementsLoading(true)
            fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(searchData.siren)}&per_page=20`)
              .then(r => r.json())
              .then(data => {
                const etabs: Etablissement[] = (data.results?.[0]?.matching_etablissements ?? []).map((e: Record<string, unknown>) => ({
                  siret: String(e.siret ?? ''),
                  adresse: [e.numero_voie, e.type_voie, e.libelle_voie, e.code_postal, e.libelle_commune].filter(Boolean).join(' ') || String(e.adresse ?? ''),
                  estSiege: Boolean(e.est_siege),
                  statut: String(e.etat_administratif ?? 'A'),
                  dateCreation: String(e.date_creation ?? ''),
                }))
                etabs.sort((a, b) => (b.estSiege ? 1 : 0) - (a.estSiege ? 1 : 0))
                setEtablissements(etabs)
              })
              .catch(() => {})
              .finally(() => setEtablissementsLoading(false))
          }
        }
        if (!publicData.error) setArtisanPublic(publicData as ArtisanPublicInfo)
      })
      .catch(() => setError('Erreur réseau. Vérifiez votre connexion.'))
      .finally(() => setLoading(false))
  }, [siret])

  const rge = result?.rge ?? { certifie: false, domaines: [], organismes: [] }
  const dirigeants = result?.dirigeants ?? []
  const bodacc = result?.bodacc ?? { procedureCollective: false, annonces: [], changementDirigeantRecent: false }

  const scores = result ? computeScore(result) : {
    total: 0, statut_score: 0, certif_score: 0,
    anciennete_score: 0, dirigeants_score: 0, procedures_score: 0,
  }
  const score = result?.score ?? scores.total

  const strokeColor = score >= 70 ? '#52B788' : score >= 50 ? '#f97316' : '#ef4444'

  const verdictText = score >= 70
    ? '✓ Vous pouvez avancer sereinement'
    : score >= 50
    ? '⚠ Quelques points à vérifier'
    : '🚨 Procédez avec grande prudence'

  const verdictColor = score >= 70 ? '#15803d' : score >= 50 ? '#d97706' : '#dc2626'

  const empathyPhrase = score >= 80
    ? 'Profil solide — aucun signal négatif détecté.'
    : score >= 60
    ? 'Profil correct — quelques points à vérifier avant de signer.'
    : 'Profil préoccupant — vérifications fortement conseillées.'

  const scoreBreakdown = [
    { label: 'Statut légal', value: scores.statut_score, max: 25 },
    { label: 'Certifications', value: scores.certif_score, max: 20 },
    { label: 'Ancienneté', value: scores.anciennete_score, max: 20 },
    { label: 'Dirigeants', value: scores.dirigeants_score, max: 20 },
    { label: 'Procédures judiciaires', value: scores.procedures_score, max: 15 },
  ]

  const checklistItems = [
    'Vérifier l\'assurance décennale',
    'Demander le certificat RGE si travaux éligibles aux aides',
    'Exiger un devis détaillé avec mentions légales obligatoires',
    'Ne pas verser plus de 30% d\'acompte avant démarrage',
    'Vérifier les garanties (parfait achèvement, biennale, décennale)',
    'Faire établir un contrat écrit pour tout chantier > 1500€',
    'Conserver tous les documents (devis, factures, contrat)',
  ]

  const age = getYears(result?.dateCreation)
  const maturityBadge = age >= 10
    ? { text: 'Expérimentée', bg: '#d1fae5', color: '#065f46' }
    : age >= 3
    ? { text: 'Établie', bg: '#dbeafe', color: '#1e40af' }
    : { text: 'Jeune entreprise', bg: '#fef3c7', color: '#92400e' }

  /* ── Card style helper ── */
  const cardStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
    padding: '28px',
  }

  const cardTitleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 700,
    color: '#1B4332',
    margin: '0 0 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontFamily: 'var(--font-body)',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    textTransform: 'uppercase',
    color: '#9ca3af',
    letterSpacing: '0.06em',
    margin: '0 0 4px',
  }

  const valueStyle: React.CSSProperties = {
    fontSize: '15px',
    fontWeight: 600,
    color: '#111827',
    margin: 0,
  }

  const mutedStyle: React.CSSProperties = {
    color: '#6b7280',
    fontSize: '14px',
  }

  // ── RGE display helpers ──────────────────────────────────
  const RGE_DOMAINS: Record<string, string> = {
    'architecte': 'Architecture',
    'cnoa': 'Conseil National de l\'Ordre des Architectes',
    'qualibat': 'Qualibat',
    'qualifelec': 'Qualifelec',
    'qualipac': 'QualiPAC',
    'qualisol': 'QualiSOL',
    'qualit-enr': 'Qualit\'ENR',
    'certibat': 'Certibat',
    'acqualif': 'ACQualif',
    'afnor': 'AFNOR Certification',
    'promotelec': 'Promotelec',
    'eco-artisan': 'Eco Artisan',
    'label-flamme-verte': 'Flamme Verte',
    'handibat': 'Handibat',
  }
  const mapRGEDomain = (d: string) => {
    const key = d.toLowerCase().trim()
    return RGE_DOMAINS[key] ?? (key.charAt(0).toUpperCase() + key.slice(1))
  }
  const rgeData = result?.rge
  const rgeDomainesUniques = rgeData ? [...new Set(rgeData.domaines.map(mapRGEDomain))] : []
  const rgeOrganismesUniques = rgeData ? [...new Set(rgeData.organismes.map(mapRGEDomain))] : []
  const RGE_MAX = 5
  const rgeVisibleDomaines = showAllRGE ? rgeDomainesUniques : rgeDomainesUniques.slice(0, RGE_MAX)

  return (
    <main style={{ minHeight: '100vh', background: '#F8F4EF', fontFamily: 'var(--font-body)' }}>
      <SiteHeader />

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '20px 16px 100px' : '32px 24px 80px' }}>

        {/* Back button */}
        <button
          onClick={() => router.back()}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#6b7280', fontSize: '13px', fontWeight: 500,
            padding: 0, fontFamily: 'var(--font-body)',
            marginBottom: '20px',
          }}
        >
          ← Retour
        </button>

        {/* Loading */}
        {loading && <LoadingSkeleton />}

        {/* Error */}
        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1B4332', margin: '0 0 8px' }}>
              Entreprise introuvable
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>{error}</p>
            <button
              onClick={() => router.back()}
              style={{
                background: '#1B4332', color: 'white', border: 'none',
                borderRadius: '12px', padding: '12px 24px',
                fontSize: '15px', fontWeight: 700, cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              ← Retour à la recherche
            </button>
          </div>
        )}

        {/* Result */}
        {!loading && result && (
          <>
            {/* ── HEADER CARD ── */}
            <div style={{
              background: 'white',
              borderRadius: '20px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
              padding: '32px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              flexWrap: isMobile ? 'wrap' : 'nowrap',
            }}>
              {/* Avatar */}
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: '#1B4332', color: 'white',
                fontSize: '24px', fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontFamily: 'var(--font-body)',
              }}>
                {getInitial(result.nom)}
              </div>

              {/* Middle info */}
              <div style={{ flexGrow: 1, minWidth: 0 }}>
                <h1 style={{
                  fontSize: isMobile ? '22px' : '28px',
                  fontWeight: 800,
                  color: '#1B4332',
                  letterSpacing: '-0.03em',
                  margin: '0 0 8px',
                  lineHeight: 1.2,
                  fontFamily: 'var(--font-body)',
                }}>
                  {result.nom}
                </h1>

                {/* Chips */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {result.formeJuridique && (
                    <span style={{
                      background: '#f0fdf4', color: '#15803d',
                      fontSize: '12px', fontWeight: 600,
                      padding: '3px 10px', borderRadius: '20px',
                    }}>
                      {result.formeJuridique}
                    </span>
                  )}
                  {result.activite && (
                    <span style={{
                      background: '#f0fdf4', color: '#15803d',
                      fontSize: '12px', fontWeight: 600,
                      padding: '3px 10px', borderRadius: '20px',
                    }}>
                      {result.activite}
                    </span>
                  )}
                </div>

                {/* Address */}
                {result.adresse && (
                  <p style={{ margin: '0 0 6px', fontSize: '14px', color: '#6b7280' }}>
                    📍 {result.adresse}
                  </p>
                )}

                {/* Empathy phrase */}
                <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', fontStyle: 'italic' }}>
                  {empathyPhrase}
                </p>
              </div>

              {/* Status badge */}
              <div style={{ flexShrink: 0 }}>
                {result.statut === 'actif' ? (
                  <span style={{
                    background: '#52B788', color: 'white',
                    fontSize: '13px', fontWeight: 800,
                    padding: '8px 20px', borderRadius: '24px',
                    whiteSpace: 'nowrap', display: 'inline-block',
                  }}>
                    ● ACTIF
                  </span>
                ) : (
                  <span style={{
                    background: '#ef4444', color: 'white',
                    fontSize: '13px', fontWeight: 800,
                    padding: '8px 20px', borderRadius: '24px',
                    whiteSpace: 'nowrap', display: 'inline-block',
                  }}>
                    ✕ FERMÉ
                  </span>
                )}
              </div>
            </div>

            {/* ── 2-COLUMN LAYOUT ── */}
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: '24px',
              alignItems: 'flex-start',
            }}>
              {/* ── LEFT COLUMN ── */}
              <div style={{
                flex: isMobile ? '1 1 auto' : '0 0 62%',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                minWidth: 0,
              }}>

                {/* ── Card 1 — Informations légales ── */}
                <div style={cardStyle}>
                  <h3 style={cardTitleStyle}>🏢 Informations légales</h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px 20px',
                  }}>
                    {/* SIRET */}
                    <div>
                      <p style={labelStyle}>SIRET</p>
                      <p style={{ ...valueStyle, wordBreak: 'break-all' }}>{result.siret}</p>
                      <span style={{
                        display: 'inline-block', marginTop: '4px',
                        fontSize: '10px', background: '#d1fae5', color: '#065f46',
                        padding: '2px 6px', borderRadius: '8px', fontWeight: 600,
                      }}>
                        ✓ Vérifié INSEE
                      </span>
                    </div>

                    {/* Date de création */}
                    <div>
                      <p style={labelStyle}>Date de création</p>
                      <p style={valueStyle}>{formatDate(result.dateCreation)}</p>
                      {result.dateCreation && (
                        <span style={{
                          display: 'inline-block', marginTop: '4px',
                          fontSize: '10px', background: maturityBadge.bg, color: maturityBadge.color,
                          padding: '2px 6px', borderRadius: '8px', fontWeight: 600,
                        }}>
                          {maturityBadge.text}
                        </span>
                      )}
                    </div>

                    {/* Forme juridique */}
                    <div>
                      <p style={labelStyle}>Forme juridique</p>
                      <p style={valueStyle}>
                        {formeJuridiqueLabel(undefined, result.formeJuridique) || 'Non renseigné'}
                      </p>
                    </div>

                    {/* Capital social */}
                    <div>
                      <p style={labelStyle}>Capital social</p>
                      <p style={valueStyle}>
                        {result.capitalSocial
                          ? `${result.capitalSocial.toLocaleString('fr-FR')} €`
                          : 'Non renseigné'}
                      </p>
                    </div>

                    {/* Effectifs */}
                    <div>
                      <p style={labelStyle}>Effectifs</p>
                      <p style={valueStyle}>{result.effectif || 'Non renseigné'}</p>
                    </div>

                    {/* Code NAF */}
                    <div>
                      <p style={labelStyle}>Code NAF</p>
                      <p style={valueStyle}>
                        {result.codeNaf
                          ? `${result.codeNaf}${result.activite ? ` — ${result.activite}` : ''}`
                          : result.activite || 'Non renseigné'}
                      </p>
                    </div>

                    {/* TVA intracommunautaire */}
                    {result.siren && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <p style={labelStyle}>N° TVA intracommunautaire</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <p style={{ ...valueStyle, fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                            {computeTVA(result.siren)}
                          </p>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(computeTVA(result.siren))
                              setTvaCopied(true)
                              setTimeout(() => setTvaCopied(false), 2000)
                            }}
                            style={{
                              background: tvacopied ? '#d1fae5' : '#f3f4f6',
                              border: 'none', borderRadius: '6px',
                              padding: '3px 8px', fontSize: '11px',
                              fontWeight: 600, cursor: 'pointer',
                              color: tvacopied ? '#065f46' : '#374151',
                              fontFamily: 'var(--font-body)',
                            }}
                          >
                            {tvacopied ? '✓ Copié' : 'Copier'}
                          </button>
                        </div>
                        <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#9ca3af' }}>
                          Calculé depuis le SIREN — à vérifier sur votre devis
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Card 2 — Santé financière ── */}
                <div style={cardStyle}>
                  <h3 style={cardTitleStyle}>💰 Santé financière</h3>
                  <div style={{
                    background: '#f9fafb', border: '1px solid #e5e7eb',
                    borderRadius: '12px', padding: '16px 20px',
                  }}>
                    <p style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                      Comptes non publiés
                    </p>
                    <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', lineHeight: 1.6 }}>
                      Les comptes de cette entreprise ne sont pas publics, ce qui est tout à fait normal pour un artisan indépendant. Les micro-entreprises et auto-entrepreneurs ne sont pas tenus de déposer leurs comptes.
                    </p>
                  </div>
                  {result.capitalSocial ? (
                    <div style={{ marginTop: '12px', padding: '12px 16px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #86efac' }}>
                      <p style={{ margin: 0, fontSize: '13px', color: '#15803d' }}>
                        ✓ Capital social déclaré : <strong>{result.capitalSocial.toLocaleString('fr-FR')} €</strong> — signe d&apos;une structure formalisée.
                      </p>
                    </div>
                  ) : null}
                </div>

                {/* ── Card 3 — Établissements ── */}
                <div style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h3 style={{ ...cardTitleStyle, margin: 0 }}>🏪 Établissements</h3>
                    {etablissements.filter(e => e.statut === 'A').length > 1 && (
                      <span style={{
                        background: '#d1fae5', color: '#065f46',
                        fontSize: '11px', fontWeight: 700,
                        padding: '3px 10px', borderRadius: '20px',
                      }}>
                        ✓ Présence multi-sites
                      </span>
                    )}
                  </div>
                  {etablissementsLoading ? (
                    <div style={{ color: '#9ca3af', fontSize: '13px' }}>Chargement des établissements…</div>
                  ) : etablissements.length === 0 ? (
                    <div style={{ color: '#9ca3af', fontSize: '13px' }}>Aucun établissement trouvé</div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {(showAllEtab ? etablissements : etablissements.slice(0, 3)).map((etab, i) => (
                          <div key={i} style={{
                            padding: '12px 16px', borderRadius: '10px',
                            background: etab.estSiege ? '#f0fdf4' : '#f9fafb',
                            border: `1px solid ${etab.estSiege ? '#86efac' : '#e5e7eb'}`,
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              {etab.estSiege && (
                                <span style={{ background: '#52B788', color: 'white', fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '8px' }}>
                                  Siège
                                </span>
                              )}
                              <span style={{
                                background: etab.statut === 'A' ? '#d1fae5' : '#fef2f2',
                                color: etab.statut === 'A' ? '#065f46' : '#dc2626',
                                fontSize: '10px', fontWeight: 700,
                                padding: '2px 7px', borderRadius: '8px',
                              }}>
                                {etab.statut === 'A' ? '● Actif' : '✕ Fermé'}
                              </span>
                            </div>
                            <p style={{ margin: '0 0 2px', fontSize: '12px', fontFamily: 'monospace', color: '#6b7280' }}>
                              {etab.siret}
                            </p>
                            <p style={{ margin: 0, fontSize: '13px', color: '#374151' }}>{etab.adresse || '—'}</p>
                            {etab.dateCreation && etab.dateCreation !== 'undefined' && (
                              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#9ca3af' }}>
                                Créé le {formatDate(etab.dateCreation)}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                      {etablissements.length > 3 && (
                        <button
                          onClick={() => setShowAllEtab(!showAllEtab)}
                          style={{
                            marginTop: '10px', width: '100%',
                            background: 'none', border: '1px solid #e5e7eb',
                            borderRadius: '8px', padding: '8px',
                            fontSize: '13px', fontWeight: 600, color: '#374151',
                            cursor: 'pointer', fontFamily: 'var(--font-body)',
                          }}
                        >
                          {showAllEtab ? 'Réduire' : `Voir les ${etablissements.length} établissements`}
                        </button>
                      )}
                      {etablissements.length === 1 && (
                        <p style={{ margin: '10px 0 0', fontSize: '12px', color: '#9ca3af' }}>
                          Cet artisan ne possède qu&apos;un seul établissement — courant pour les artisans indépendants.
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* ── Card 4 — Certifications RGE ── */}
                <div style={cardStyle}>
                  <h3 style={cardTitleStyle}>🌿 Certifications RGE</h3>
                  {rge.certifie ? (
                    <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '12px', padding: '20px' }}>
                      <p style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 700, color: '#15803d' }}>
                        ✓ Certifié RGE — Travaux éligibles aux aides de l&apos;État
                      </p>
                      {rgeDomainesUniques.length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px', alignItems: 'center' }}>
                          {rgeVisibleDomaines.map((d, i) => (
                            <span key={i} style={{ background: '#dcfce7', color: '#166534', fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px' }}>
                              ✓ {d}
                            </span>
                          ))}
                          {rgeDomainesUniques.length > RGE_MAX && (
                            <button
                              onClick={() => setShowAllRGE(!showAllRGE)}
                              style={{ background: '#1B4332', color: 'white', border: 'none', borderRadius: '20px', fontSize: '12px', fontWeight: 700, padding: '4px 10px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                            >
                              {showAllRGE ? 'Réduire' : `+${rgeDomainesUniques.length - RGE_MAX}`}
                            </button>
                          )}
                        </div>
                      )}
                      {rgeOrganismesUniques.length > 0 && (
                        <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#166534' }}>
                          Certifié par : <strong>{rgeOrganismesUniques[0]}</strong>
                        </p>
                      )}
                      <a href="/calculateur-aides" style={{ display: 'inline-block', border: '1.5px solid #16a34a', color: '#16a34a', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>
                        Calculer mes aides →
                      </a>
                    </div>
                  ) : (
                    <div style={{
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '20px',
                    }}>
                      <p style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 700, color: '#374151' }}>
                        Non certifié RGE
                      </p>
                      <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                        Les aides MaPrimeRénov&apos; nécessitent un artisan RGE
                      </p>
                    </div>
                  )}
                </div>

                {/* ── Card 3 — Dirigeants ── */}
                <div style={cardStyle}>
                  <h3 style={cardTitleStyle}>👤 Dirigeants</h3>
                  {dirigeants.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {dirigeants.map((d, i) => (
                        <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <div style={{
                            width: 40, height: 40, borderRadius: '50%',
                            background: '#e8f5e9', color: '#1B4332',
                            fontSize: '14px', fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, fontFamily: 'var(--font-body)',
                          }}>
                            {getInitials(`${d.prenoms || ''} ${d.nom || ''}`)}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#111827' }}>
                              <a
                                href={`/dirigeant/${dirigeantSlug(d.nom, d.prenoms)}`}
                                style={{
                                  color: '#1B4332', textDecoration: 'none', fontWeight: 700,
                                }}
                                onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                                onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                              >
                                {d.prenoms ? `${d.prenoms} ${d.nom}` : d.nom}
                              </a>
                            </p>
                            <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                              {d.qualite}
                              {d.anneeNaissance ? ` · né(e) en ${d.anneeNaissance}` : ''}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: 0, ...mutedStyle }}>Aucun dirigeant renseigné</p>
                  )}
                </div>

                {/* ── Card 7 — Procédures BODACC ── */}
                {(() => {
                  const cats = categorizeBodacc(bodacc.annonces ?? [])
                  const hasProcedure = bodacc.procedureCollective || cats.proceduresCollectives.length > 0
                  return (
                    <div style={cardStyle}>
                      <h3 style={cardTitleStyle}>⚖️ Procédures BODACC</h3>

                      {/* Compteur synthèse */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                          background: cats.proceduresCollectives.length > 0 ? '#fef2f2' : '#f0fdf4',
                          color: cats.proceduresCollectives.length > 0 ? '#dc2626' : '#15803d',
                        }}>
                          {cats.proceduresCollectives.length === 0 ? '✓ ' : '⚠ '}{cats.proceduresCollectives.length} procédure{cats.proceduresCollectives.length > 1 ? 's' : ''} collective{cats.proceduresCollectives.length > 1 ? 's' : ''}
                        </span>
                        {cats.depotComptes.length > 0 && (
                          <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: '#f0fdf4', color: '#15803d' }}>
                            ✓ {cats.depotComptes.length} dépôt{cats.depotComptes.length > 1 ? 's' : ''} de comptes
                          </span>
                        )}
                        {cats.ventesCoissions.length > 0 && (
                          <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: '#f5f5f5', color: '#6b7280' }}>
                            {cats.ventesCoissions.length} vente{cats.ventesCoissions.length > 1 ? 's' : ''}/cession{cats.ventesCoissions.length > 1 ? 's' : ''}
                          </span>
                        )}
                        {cats.modifications.length > 0 && (
                          <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: '#f5f5f5', color: '#6b7280' }}>
                            {cats.modifications.length} modification{cats.modifications.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {!hasProcedure ? (
                        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '12px', padding: '16px', color: '#15803d', fontSize: '14px', fontWeight: 600 }}>
                          ✓ Aucune procédure collective détectée — c&apos;est un bon signal.
                        </div>
                      ) : (
                        <div>
                          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 16px', marginBottom: '12px' }}>
                            <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 700, color: '#dc2626' }}>
                              ⚠ Procédure collective détectée — vigilance recommandée
                            </p>
                            <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                              Une liquidation ou un redressement judiciaire est un signal sérieux avant de signer un contrat.
                            </p>
                          </div>
                          {cats.proceduresCollectives.map((a, i) => (
                            <div key={i} style={{ padding: '10px 14px', background: '#fef2f2', borderRadius: '10px', marginBottom: '6px', fontSize: '13px', color: '#374151' }}>
                              <span style={{ fontWeight: 600 }}>{a.date}</span> · <span>{a.type}</span>
                              {a.tribunal && <span style={{ color: '#6b7280' }}> · {a.tribunal}</span>}
                            </div>
                          ))}
                        </div>
                      )}

                      {cats.depotComptes.length > 0 && (
                        <div style={{ marginTop: '12px', padding: '10px 14px', background: '#f0fdf4', borderRadius: '10px', fontSize: '13px', color: '#15803d' }}>
                          ✓ Dépôt de comptes publié — cette entreprise est transparente sur sa gestion.
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* ── Card 5 — Checklist avant signature ── */}
                <div style={{
                  background: '#F8F4EF',
                  borderRadius: '12px',
                  padding: '20px',
                }}>
                  <h3 style={{ ...cardTitleStyle, color: '#1B4332' }}>
                    Avant de signer avec cet artisan
                  </h3>
                  <div>
                    {checklistItems.map((item, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'flex-start', gap: '10px',
                        fontSize: '14px', color: '#374151',
                        padding: '8px 0',
                        borderBottom: i < checklistItems.length - 1 ? '1px solid #e5e7eb' : 'none',
                      }}>
                        <span style={{ flexShrink: 0, fontSize: '16px' }}>☐</span>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Card 6 — Partage ── */}
                <div style={cardStyle}>
                  <h3 style={cardTitleStyle}>📤 Partager cette fiche</h3>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Fiche artisan : ${result.nom} — ${typeof window !== 'undefined' ? window.location.href : ''}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        border: '1px solid #e5e7eb', borderRadius: '8px',
                        padding: '7px 14px', fontSize: '13px',
                        color: '#374151', textDecoration: 'none',
                        fontWeight: 500,
                      }}
                    >
                      📱 WhatsApp
                    </a>
                    <a
                      href={`mailto:?subject=${encodeURIComponent(`Fiche artisan : ${result.nom}`)}&body=${encodeURIComponent(`Consulter la fiche : ${typeof window !== 'undefined' ? window.location.href : ''}`)}`}
                      style={{
                        border: '1px solid #e5e7eb', borderRadius: '8px',
                        padding: '7px 14px', fontSize: '13px',
                        color: '#374151', textDecoration: 'none',
                        fontWeight: 500,
                      }}
                    >
                      ✉️ Email
                    </a>
                    <button
                      onClick={copyLink}
                      style={{
                        border: '1px solid #e5e7eb', borderRadius: '8px',
                        padding: '7px 14px', fontSize: '13px',
                        color: linkCopied ? '#15803d' : '#374151',
                        background: 'white', cursor: 'pointer',
                        fontWeight: 500, fontFamily: 'var(--font-body)',
                      }}
                    >
                      {linkCopied ? '✓ Lien copié !' : '🔗 Copier le lien'}
                    </button>
                  </div>
                  <p
                    style={{ margin: 0, fontSize: '12px', color: '#9ca3af', cursor: 'pointer' }}
                    onClick={() => window.location.href = `mailto:contact@verifio.fr?subject=Erreur fiche ${result.siret}`}
                  >
                    Signaler une erreur sur cette fiche
                  </p>
                </div>

              </div>

              {/* ── RIGHT COLUMN ── */}
              <div style={{
                flex: isMobile ? '1 1 auto' : '0 0 38%',
                position: isMobile ? 'static' : 'sticky',
                top: '24px',
                alignSelf: 'flex-start',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                minWidth: 0,
              }}>

                {/* ── Score Card ── */}
                <div style={{ ...cardStyle, textAlign: 'center' }}>
                  {/* Score ring */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                    <ScoreRing score={score} strokeColor={strokeColor} />
                  </div>

                  {/* Verdict */}
                  <p style={{
                    margin: '0 0 20px',
                    fontSize: '14px', fontWeight: 700,
                    color: verdictColor,
                  }}>
                    {verdictText}
                  </p>

                  {/* Score breakdown */}
                  <div style={{
                    display: 'flex', flexDirection: 'column', gap: '10px',
                    textAlign: 'left', marginBottom: '24px',
                  }}>
                    {scoreBreakdown.map((item) => (
                      <div key={item.label}>
                        <div style={{
                          display: 'flex', justifyContent: 'space-between',
                          marginBottom: '4px',
                        }}>
                          <span style={{ fontSize: '12px', color: '#374151' }}>{item.label}</span>
                          <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>
                            {item.value}/{item.max}
                          </span>
                        </div>
                        <div style={{
                          height: 6, background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${(item.value / item.max) * 100}%`,
                            background: strokeColor,
                            borderRadius: '3px',
                            transition: 'width 1s ease',
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Separator */}
                  <div style={{ height: 1, background: '#e5e7eb', margin: '0 0 16px' }} />

                  {/* Action buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Pack Sérénité */}
                    <div>
                      <button
                        onClick={startSerenite}
                        disabled={checkoutLoading}
                        style={{
                          width: '100%',
                          background: '#1B4332', color: 'white',
                          border: 'none', borderRadius: '12px',
                          padding: '14px', fontSize: '15px', fontWeight: 700,
                          cursor: 'pointer', fontFamily: 'var(--font-body)',
                          opacity: checkoutLoading ? 0.7 : 1,
                        }}
                        onMouseEnter={e => !checkoutLoading && ((e.currentTarget as HTMLButtonElement).style.background = '#145028')}
                        onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = '#1B4332')}
                      >
                        {checkoutLoading ? 'Redirection…' : '🛡️ Pack Sérénité — 19,90€'}
                      </button>
                      <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>
                        Analyse devis + Rapport PDF + Surveillance 6 mois
                      </p>
                    </div>

                    {/* Alerte */}
                    <button
                      style={{
                        width: '100%',
                        background: 'white', color: '#1B4332',
                        border: '1.5px solid #1B4332', borderRadius: '12px',
                        padding: '13px', fontSize: '15px', fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'var(--font-body)',
                      }}
                    >
                      🔔 Recevoir une alerte
                    </button>

                    {/* Row of 2 small buttons */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a
                        href={`/comparer?a=${result.siret}`}
                        style={{
                          flex: 1, textAlign: 'center',
                          border: '1px solid #e5e7eb', borderRadius: '8px',
                          padding: '9px 8px', fontSize: '13px', fontWeight: 600,
                          color: '#374151', textDecoration: 'none',
                          display: 'block',
                        }}
                      >
                        📊 Comparer →
                      </a>
                      <button
                        onClick={copyLink}
                        style={{
                          flex: 1,
                          border: '1px solid #e5e7eb', borderRadius: '8px',
                          padding: '9px 8px', fontSize: '13px', fontWeight: 600,
                          color: linkCopied ? '#15803d' : '#374151',
                          background: 'white', cursor: 'pointer',
                          fontFamily: 'var(--font-body)',
                        }}
                      >
                        {linkCopied ? '✓ Copié' : '📤 Partager'}
                      </button>
                    </div>
                  </div>

                  {/* Separator */}
                  <div style={{ height: 1, background: '#e5e7eb', margin: '16px 0' }} />

                  {/* Dirigeant claim / verified badge */}
                  {artisanPublic?.verifie && artisanPublic.badgeActif ? (
                    <div style={{
                      background: '#f0fdf4', border: '1px solid #86efac',
                      borderRadius: '10px', padding: '12px',
                      textAlign: 'left',
                    }}>
                      <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 700, color: '#14532d' }}>
                        ✓ Artisan vérifié Verifio
                      </p>
                      <p style={{ margin: 0, fontSize: '11px', color: '#166534' }}>
                        L&apos;existence légale de cet artisan a été vérifiée.
                      </p>
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>
                      Vous êtes le dirigeant ?{' '}
                      <a
                        href="/espace-artisan"
                        style={{ color: '#1B4332', fontWeight: 600, textDecoration: 'none' }}
                      >
                        Revendiquez cette fiche →
                      </a>
                    </p>
                  )}
                </div>

              </div>
            </div>
          </>
        )}
      </div>

      {/* Mobile fixed bottom CTA */}
      {!loading && result && isMobile && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'white', padding: '16px',
          borderTop: '1px solid #e5e7eb',
          zIndex: 50,
        }}>
          <button
            onClick={startSerenite}
            disabled={checkoutLoading}
            style={{
              width: '100%',
              background: '#1B4332', color: 'white',
              border: 'none', borderRadius: '12px',
              padding: '14px', fontSize: '15px', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'var(--font-body)',
              opacity: checkoutLoading ? 0.7 : 1,
            }}
          >
            {checkoutLoading ? 'Redirection…' : '🛡️ Pack Sérénité — 19,90€'}
          </button>
        </div>
      )}
    </main>
  )
}
