'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  MapPin, Building2, Banknote, Store, Leaf, HardHat, User, Scale,
  Share2, Mail, Bell, BarChart2, AlertTriangle, AlertCircle, Info,
  Check, CheckCircle, FileText, ClipboardList, Users, Shield, ArrowLeft, X,
  Smartphone, Link, Download,
} from 'lucide-react'
import SiteHeader from '@/components/SiteHeader'
import { supabase } from '@/lib/supabase'
import { dirigeantSlug } from '@/lib/dirigeant'
import { calculateScore, getYears as getYearsUtil, scoreColor } from '@/lib/score'
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

// getYears is imported from @/lib/score as getYearsUtil
const getYears = getYearsUtil

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
    a.famille === 'collective' || a.type?.toLowerCase().includes('liquidation') || a.type?.toLowerCase().includes('redressement') || a.type?.toLowerCase().includes('sauvegarde')
  )
  const depotComptes = annonces.filter(a =>
    a.famille === 'bilan'
  )
  const ventesCoissions = annonces.filter(a =>
    a.famille === 'vente' || a.type?.toLowerCase().includes('vente') || a.type?.toLowerCase().includes('cession')
  )
  const modifications = annonces.filter(a =>
    !proceduresCollectives.includes(a) && !depotComptes.includes(a) && !ventesCoissions.includes(a)
  )
  return { proceduresCollectives, depotComptes, ventesCoissions, modifications }
}

/* ─── Score calculation (shared via lib/score.ts) ────────── */
function computeScore(result: SearchResult) {
  const nbProceduresCollectives = (result.bodacc?.annonces ?? []).filter(a =>
    a.famille === 'collective'
  ).length
  return calculateScore({
    statut: result.statut,
    dateCreation: result.dateCreation,
    procedures: {
      disponible: result.bodacc?.fetched === true,
      collectives: nbProceduresCollectives,
    },
  })
}

/* ─── Décennale checklist ────────────────────────────────── */
function DecennaleChecklist() {
  const items = [
    'Demander l\'attestation décennale',
    'Vérifier que le SIRET sur l\'attestation correspond à celui de l\'entreprise',
    'Vérifier la date de validité',
    'Vérifier que les travaux sont bien couverts',
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#374151' }}>
          <span style={{ flexShrink: 0, marginTop: '1px' }}>☐</span>
          <span>{item}</span>
        </div>
      ))}
    </div>
  )
}

/* ─── BODACC detail sub-components ──────────────────────────*/
function BodaccField({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : undefined }}>
      <p style={{ margin: '0 0 1px', fontSize: '10px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      <p style={{ margin: 0, fontSize: '12px', color: '#374151', lineHeight: 1.4 }}>{value}</p>
    </div>
  )
}
function BodaccSection({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: '10px', padding: '10px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
      <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 700, color: '#6b7280' }}>{titre}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>{children}</div>
    </div>
  )
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

  const isLoading = score === -1

  const dasharray = isLoading || !animated
    ? `0 ${circumference}`
    : `${(score / 100) * circumference} ${circumference}`

  return (
    <div style={{ position: 'relative', width: 120, height: 120 }}>
      <svg viewBox="0 0 120 120" width="120" height="120">
        <circle cx="60" cy="60" r="52" fill="none" stroke="#e5e7eb" strokeWidth="8" />
        {!isLoading && (
          <circle
            cx="60" cy="60" r="52" fill="none"
            stroke={strokeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={dasharray}
            transform="rotate(-90 60 60)"
            style={{ transition: 'stroke-dasharray 1.2s ease' }}
          />
        )}
      </svg>
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        lineHeight: 1,
      }}>
        {isLoading ? (
          <div style={{ fontSize: '14px', color: '#9ca3af', lineHeight: 1.3 }}>Données<br />indisponibles</div>
        ) : (
          <>
            <div style={{ fontSize: '44px', fontWeight: 800, color: '#1B4332', fontFamily: 'var(--font-body)' }}>
              {score}
            </div>
            <div style={{ fontSize: '14px', color: '#9ca3af' }}>/100</div>
          </>
        )}
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
  const [showBodaccList, setShowBodaccList] = useState(false)
  const [showAllBodacc, setShowAllBodacc] = useState(false)
  const [expandedBodacc, setExpandedBodacc] = useState<Set<string>>(new Set())
  const [financialData, setFinancialData] = useState<Record<string, unknown> | null>(null)
  const [financialLoading, setFinancialLoading] = useState(false)
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null)
  const [rapportExistant, setRapportExistant] = useState<{ id: string; stripe_session_id: string } | null>(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Vérifie si l'utilisateur a déjà acheté un rapport pour ce SIRET
  useEffect(() => {
    if (!siret) return
    supabase.auth.getUser().then(({ data: { user } }) => {
      console.log('CHECK RAPPORT pour SIRET:', siret)
      console.log('USER ID:', user?.id)
      if (!user) return
      supabase
        .from('rapports')
        .select('id, stripe_session_id')
        .eq('user_id', user.id)
        .eq('siret', siret)
        .maybeSingle()
        .then(({ data, error }) => {
          console.log('RAPPORT FOUND:', data, error)
          if (data) setRapportExistant(data)
        })
    })
  }, [siret])

  async function startSerenite() {
    // Vérifier la connexion avant le checkout
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push(`/auth?redirect=/artisan/${siret}`)
      return
    }
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'serenite', siret, nom: result?.nom, user_id: user.id }),
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
        // Fetch financial data (INPI cascade)
        if (searchData.siren) {
          setFinancialLoading(true)
          fetch(`/api/financial?siren=${encodeURIComponent(searchData.siren)}`)
            .then(r => r.json())
            .then(d => { if (d?.data) setFinancialData(d.data) })
            .catch(() => {})
            .finally(() => setFinancialLoading(false))
        }

        if (!publicData.error) setArtisanPublic(publicData as ArtisanPublicInfo)
      })
      .catch(() => setError('Erreur réseau. Vérifiez votre connexion.'))
      .finally(() => setLoading(false))
  }, [siret])

  const rge = result?.rge ?? { certifie: false, domaines: [], organismes: [] }
  const dirigeants = result?.dirigeants ?? []
  const bodacc = result?.bodacc ?? { procedureCollective: false, annonces: [], changementDirigeantRecent: false }

  const scoreResult = result ? computeScore(result) : null
  const score = result?.score ?? scoreResult?.score ?? 0

  const strokeColor = scoreColor(score)

  // Qualibat detection from RGE organismes
  const isQualibat = rge.organismes.some((o: string) => o?.toLowerCase().includes('qualibat'))

  const verdictText = score >= 70
    ? 'Profil juridique solide'
    : score >= 50
    ? 'Quelques points à vérifier'
    : 'Profil juridique fragile'

  const VerdictIcon = score >= 70
    ? Check
    : score >= 50
    ? AlertTriangle
    : AlertCircle

  const verdictSubtitle = score >= 70
    ? 'Demandez toujours un devis détaillé et une attestation d\'assurance décennale.'
    : score >= 50
    ? 'Vérifiez l\'assurance décennale et demandez des références de chantiers récents avant de signer.'
    : 'En cas de problème, vos recours juridiques pourraient être limités. Sécurisez-vous avec le Pack Sérénité avant de signer.'

  const verdictColor = score >= 70 ? '#15803d' : score >= 50 ? '#d97706' : '#dc2626'

  const empathyPhrase = score >= 80
    ? 'Profil solide — aucun signal négatif détecté.'
    : score >= 60
    ? 'Profil correct — quelques points à vérifier avant de signer.'
    : 'Profil préoccupant — vérifications fortement conseillées.'

  // Breakdown : 3 critères (RGE et Dirigeants hors score, dans leurs sections dédiées)
  const scoreBreakdown = scoreResult?.criteres ?? []

  // Contexte risque pour Pack Sérénité
  const nbProcedures = (result?.bodacc?.annonces ?? []).filter((a) => a.famille === 'collective').length
  const isRisque = score < 70 || nbProcedures > 0

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

  // ── BODACC helpers ──────────────────────────────────────
  function getBodaccTypeLabel(a: { famille: string; type: string }): string {
    const f = a.famille?.toLowerCase() ?? ''
    const t = a.type?.toLowerCase() ?? ''
    if (f === 'collective' || t.includes('liquidation') || t.includes('redressement') || t.includes('sauvegarde')) return 'Procédure collective'
    if (f === 'bilan') return 'Dépôt de comptes'
    if (f === 'vente' || t.includes('vente') || t.includes('cession')) return 'Vente / Cession'
    if (f === 'immatriculation') return 'Création'
    if (f === 'radiation') return 'Radiation'
    return 'Modification'
  }
  function getBodaccBadgeStyle(label: string): React.CSSProperties {
    if (label === 'Procédure collective') return { background: '#fef2f2', color: '#dc2626' }
    if (label === 'Radiation') return { background: '#fef2f2', color: '#991b1b' }
    if (label === 'Dépôt de comptes') return { background: '#eff6ff', color: '#1d4ed8' }
    if (label === 'Vente / Cession') return { background: '#fff7ed', color: '#c2410c' }
    if (label === 'Création') return { background: '#f0fdf4', color: '#15803d' }
    return { background: '#f5f5f5', color: '#6b7280' }
  }
  const bodaccSorted = [...(bodacc.annonces ?? [])].sort((a, b) => {
    const da = new Date(a.date).getTime()
    const db = new Date(b.date).getTime()
    return isNaN(da) || isNaN(db) ? 0 : db - da
  })
  const BODACC_PAGE = 10
  const bodaccVisible = showAllBodacc ? bodaccSorted : bodaccSorted.slice(0, BODACC_PAGE)

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
            color: hoveredBtn === 'back' ? 'var(--color-accent)' : '#6b7280',
            fontSize: '13px', fontWeight: 500,
            padding: 0, fontFamily: 'var(--font-body)',
            marginBottom: '20px', transition: 'color 0.15s ease',
          }}
          onMouseEnter={() => setHoveredBtn('back')}
          onMouseLeave={() => setHoveredBtn(null)}
        >
          <ArrowLeft size={16} strokeWidth={1.5} /> Retour
        </button>

        {/* Loading */}
        {loading && <LoadingSkeleton />}

        {/* Error */}
        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <MapPin size={48} strokeWidth={1} color="#1B4332" />
          </div>
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
                fontFamily: 'var(--font-body)', transition: 'opacity 0.15s ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.88' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
            >
              <ArrowLeft size={16} strokeWidth={1.5} /> Retour à la recherche
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
                  <p style={{ margin: '0 0 6px', fontSize: '14px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={14} strokeWidth={1.5} /> {result.adresse}
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
                    whiteSpace: 'nowrap', display: 'inline-flex',
                    alignItems: 'center', gap: '4px',
                  }}>
                    <X size={13} strokeWidth={1.5} style={{ flexShrink: 0 }} /> FERMÉ
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
                  <h3 style={cardTitleStyle}><Building2 size={20} strokeWidth={1.5} /> Informations légales</h3>
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
                        <Check size={10} strokeWidth={1.5} style={{ display: 'inline', marginRight: '2px' }} /> Vérifié INSEE
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
                            {tvacopied ? <><Check size={11} strokeWidth={1.5} style={{ display: 'inline', marginRight: '2px' }} /> Copié</> : 'Copier'}
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
                  <h3 style={cardTitleStyle}><Banknote size={20} strokeWidth={1.5} /> Santé financière</h3>

                  {financialLoading ? (
                    <div style={{ color: '#9ca3af', fontSize: '13px' }}>Vérification des données financières…</div>
                  ) : financialData ? (
                    <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '12px', padding: '16px 20px' }}>
                      <p style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 600, color: '#15803d', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={14} strokeWidth={1.5} /> Données disponibles
                      </p>
                      <p style={{ margin: 0, fontSize: '13px', color: '#166534', lineHeight: 1.6 }}>
                        Des informations financières ont été trouvées pour cette entreprise.
                      </p>
                    </div>
                  ) : (
                    <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px 20px' }}>
                      <p style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                        Comptes non publiés
                      </p>
                      <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#6b7280', lineHeight: 1.6 }}>
                        Cette entreprise ne publie pas ses comptes annuels. Pour vérifier sa solidité financière, vous pouvez :
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <a
                          href="https://www.infogreffe.fr/recherche-kbis"
                          target="_blank"
                          rel="noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#1B4332', fontWeight: 600, textDecoration: 'none', background: '#f0fdf4', borderRadius: '8px', padding: '8px 12px', border: '1px solid #86efac' }}
                        >
                          <FileText size={14} strokeWidth={1.5} /> Demander un extrait Kbis à l&apos;artisan
                        </a>
                        <a
                          href="#section-bodacc"
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151', fontWeight: 600, textDecoration: 'none', background: '#f5f5f5', borderRadius: '8px', padding: '8px 12px', border: '1px solid #e5e7eb' }}
                        >
                          <ClipboardList size={14} strokeWidth={1.5} /> Consulter les annonces BODACC ci-dessous
                        </a>
                      </div>
                    </div>
                  )}

                  {result.capitalSocial ? (
                    <div style={{ marginTop: '12px', padding: '12px 16px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #86efac' }}>
                      <p style={{ margin: 0, fontSize: '13px', color: '#15803d', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={13} strokeWidth={1.5} /> Capital social déclaré : <strong>{result.capitalSocial.toLocaleString('fr-FR')} €</strong> — signe d&apos;une structure formalisée.
                      </p>
                    </div>
                  ) : null}

                  {result.effectif && result.effectif !== 'Non renseigné' && (
                    <div style={{ marginTop: '12px', padding: '12px 16px', background: '#eff6ff', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                      <p style={{ margin: 0, fontSize: '13px', color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Users size={13} strokeWidth={1.5} /> Effectifs déclarés : <strong>{result.effectif}</strong>
                      </p>
                    </div>
                  )}
                </div>

                {/* ── Card 3 — Établissements ── */}
                <div style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h3 style={{ ...cardTitleStyle, margin: 0 }}><Store size={20} strokeWidth={1.5} /> Établissements</h3>
                    {etablissements.filter(e => e.statut === 'A').length > 1 && (
                      <span style={{
                        background: '#d1fae5', color: '#065f46',
                        fontSize: '11px', fontWeight: 700,
                        padding: '3px 10px', borderRadius: '20px',
                      }}>
                        <Check size={11} strokeWidth={1.5} style={{ display: 'inline', marginRight: '2px' }} /> Présence multi-sites
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
                                {etab.statut === 'A' ? '● Actif' : <><X size={10} strokeWidth={1.5} style={{ display: 'inline', marginRight: '2px' }} /> Fermé</>}
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
                  <h3 style={cardTitleStyle}><Leaf size={20} strokeWidth={1.5} /> Certifications RGE</h3>
                  {rge.certifie ? (
                    <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '12px', padding: '20px' }}>
                      <p style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 700, color: '#15803d', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Check size={15} strokeWidth={1.5} /> Certifié RGE — Travaux éligibles aux aides de l&apos;État
                      </p>
                      {rgeDomainesUniques.length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px', alignItems: 'center' }}>
                          {rgeVisibleDomaines.map((d, i) => (
                            <span key={i} style={{ background: '#dcfce7', color: '#166534', fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px' }}>
                              <Check size={10} strokeWidth={1.5} style={{ display: 'inline', marginRight: '2px' }} /> {d}
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

                {/* ── Card — Assurance décennale ── */}
                <div style={cardStyle}>
                  <h3 style={cardTitleStyle}><HardHat size={20} strokeWidth={1.5} /> Assurance décennale</h3>
                  {isQualibat ? (
                    <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '12px', padding: '16px' }}>
                      <p style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 700, color: '#15803d', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={14} strokeWidth={1.5} /> Assurance vérifiée par Qualibat
                      </p>
                      <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#166534', lineHeight: 1.5 }}>
                        Cet artisan est certifié Qualibat. Pour obtenir cette certification, son assurance décennale a été contrôlée et validée par l&apos;organisme certificateur.
                      </p>
                      <span style={{ display: 'inline-block', background: '#dcfce7', color: '#166534', border: '1px solid #86efac', borderRadius: '20px', padding: '3px 10px', fontSize: '12px', fontWeight: 700, marginBottom: '12px' }}>
                        Certifié Qualibat <Check size={11} strokeWidth={1.5} style={{ display: 'inline', marginLeft: '2px' }} />
                      </span>
                      <p style={{ margin: 0, fontSize: '11px', color: '#6b7280', lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                        <Info size={12} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: '1px' }} /> La certification ne garantit pas que l&apos;assurance est toujours valide à ce jour. Demandez l&apos;attestation à jour avant de signer.
                      </p>
                    </div>
                  ) : rge.certifie ? (
                    <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '12px', padding: '16px' }}>
                      <p style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 700, color: '#92400e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertTriangle size={14} strokeWidth={1.5} /> Assurance non vérifiable automatiquement
                      </p>
                      <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#78350f', lineHeight: 1.5 }}>
                        Cet artisan est certifié RGE mais pas par Qualibat. Son assurance décennale n&apos;a pas pu être vérifiée via nos sources. Demandez l&apos;attestation décennale directement à l&apos;artisan avant de signer.
                      </p>
                      <DecennaleChecklist />
                    </div>
                  ) : (
                    <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
                      <p style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertTriangle size={14} strokeWidth={1.5} /> Assurance non vérifiable automatiquement
                      </p>
                      <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#6b7280', lineHeight: 1.5 }}>
                        Nous ne pouvons pas vérifier automatiquement l&apos;assurance décennale de cet artisan. Il n&apos;existe pas de base de données publique centralisant ces informations en France.
                      </p>
                      <DecennaleChecklist />
                      <a href="/guide-chantier#assurance" style={{ fontSize: '12px', color: '#1d4ed8', textDecoration: 'underline' }}>
                        En savoir plus sur l&apos;assurance décennale →
                      </a>
                    </div>
                  )}
                </div>

                {/* ── Card 3 — Dirigeants ── */}
                <div style={cardStyle}>
                  <h3 style={cardTitleStyle}><User size={20} strokeWidth={1.5} /> Dirigeants</h3>
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
                    <div style={{ background: '#F5F5F5', borderRadius: '10px', padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <AlertTriangle size={15} strokeWidth={1.5} style={{ flexShrink: 0, color: '#9ca3af' }} />
                      <div>
                        <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>Dirigeants — données non disponibles</p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', lineHeight: 1.5 }}>Nous n&apos;avons pas pu récupérer les informations sur les dirigeants de cette entreprise.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Card 7 — Procédures BODACC ── */}
                {(() => {
                  const cats = categorizeBodacc(bodacc.annonces ?? [])
                  const hasProcedure = bodacc.procedureCollective || cats.proceduresCollectives.length > 0
                  const bodaccUnavailable = result?.bodacc?.fetched === false
                  return (
                    <div id="section-bodacc" style={cardStyle}>
                      <h3 style={cardTitleStyle}><Scale size={20} strokeWidth={1.5} /> Procédures BODACC</h3>

                      {bodaccUnavailable && (
                        <div style={{ background: '#F5F5F5', borderRadius: '10px', padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <AlertTriangle size={15} strokeWidth={1.5} style={{ flexShrink: 0, color: '#9ca3af' }} />
                          <div>
                            <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>Procédures judiciaires — données non disponibles</p>
                            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', lineHeight: 1.5 }}>Nous n&apos;avons pas pu vérifier l&apos;historique judiciaire de cette entreprise. Demandez un extrait Kbis.</p>
                          </div>
                        </div>
                      )}

                      {/* Compteur synthèse */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                          background: cats.proceduresCollectives.length > 0 ? '#fef2f2' : '#f0fdf4',
                          color: cats.proceduresCollectives.length > 0 ? '#dc2626' : '#15803d',
                        }}>
                          {cats.proceduresCollectives.length === 0
                            ? <><Check size={12} strokeWidth={1.5} style={{ display: 'inline', marginRight: '3px' }} /></>
                            : <><AlertTriangle size={12} strokeWidth={1.5} style={{ display: 'inline', marginRight: '3px' }} /></>
                          }{cats.proceduresCollectives.length} procédure{cats.proceduresCollectives.length > 1 ? 's' : ''} collective{cats.proceduresCollectives.length > 1 ? 's' : ''}
                        </span>
                        {cats.depotComptes.length > 0 && (
                          <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: '#f0fdf4', color: '#15803d' }}>
                            <Check size={12} strokeWidth={1.5} style={{ display: 'inline', marginRight: '3px' }} /> {cats.depotComptes.length} dépôt{cats.depotComptes.length > 1 ? 's' : ''} de comptes
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
                        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '12px', padding: '16px', color: '#15803d', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Check size={14} strokeWidth={1.5} /> Aucune procédure collective détectée — c&apos;est un bon signal.
                        </div>
                      ) : (
                        <div>
                          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 16px', marginBottom: '12px' }}>
                            <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 700, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <AlertTriangle size={13} strokeWidth={1.5} /> Procédure collective détectée — vigilance recommandée
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
                        <div style={{ marginTop: '12px', padding: '10px 14px', background: '#f0fdf4', borderRadius: '10px', fontSize: '13px', color: '#15803d', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Check size={13} strokeWidth={1.5} /> Dépôt de comptes publié — cette entreprise est transparente sur sa gestion.
                        </div>
                      )}

                      {/* Accordéon détail toutes annonces */}
                      {bodaccSorted.length > 0 && (
                        <div style={{ marginTop: '16px' }}>
                          <button
                            onClick={() => setShowBodaccList(!showBodaccList)}
                            style={{
                              width: '100%', textAlign: 'left', background: 'none', border: '1px solid #e5e7eb',
                              borderRadius: '10px', padding: '10px 14px', cursor: 'pointer',
                              fontSize: '13px', fontWeight: 600, color: '#374151',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              fontFamily: 'var(--font-body)',
                            }}
                          >
                            <span>Voir les {bodaccSorted.length} annonce{bodaccSorted.length > 1 ? 's' : ''}</span>
                            <span style={{ transition: 'transform 0.2s', display: 'inline-block', transform: showBodaccList ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
                          </button>

                          {showBodaccList && (
                            <div style={{ marginTop: '8px' }}>
                              {bodaccVisible.map((a, i) => {
                                const label = getBodaccTypeLabel(a)
                                const badge = getBodaccBadgeStyle(label)
                                const isOpen = expandedBodacc.has(a.id || String(i))
                                const toggleKey = a.id || String(i)
                                return (
                                  <div key={i} style={{
                                    borderRadius: '10px', marginBottom: '6px',
                                    background: '#f9fafb', border: '1px solid #e5e7eb',
                                    fontSize: '13px', color: '#374151', overflow: 'hidden',
                                  }}>
                                    {/* Header cliquable */}
                                    <button
                                      onClick={() => setExpandedBodacc(prev => {
                                        const next = new Set(prev)
                                        if (next.has(toggleKey)) next.delete(toggleKey)
                                        else next.add(toggleKey)
                                        return next
                                      })}
                                      style={{
                                        width: '100%', textAlign: 'left', background: 'none', border: 'none',
                                        padding: '10px 14px', cursor: 'pointer', fontFamily: 'var(--font-body)',
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                          <span style={{ fontWeight: 600, color: '#111827', fontSize: '13px' }}>{a.date ? formatDate(a.date) : '—'}</span>
                                          <span style={{ ...badge, fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px' }}>{label}</span>
                                        </div>
                                        <span style={{ color: '#9ca3af', fontSize: '12px', transition: 'transform 0.2s', display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
                                      </div>
                                      {!isOpen && a.details && (
                                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280', textAlign: 'left' }}>{a.details}</p>
                                      )}
                                    </button>

                                    {/* Détails expandés */}
                                    {isOpen && (
                                      <div style={{ padding: '0 14px 14px', borderTop: '1px solid #e5e7eb' }}>
                                        {/* Infos de base */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px', marginBottom: '10px' }}>
                                          {a.numeroAnnonce && <BodaccField label="N° annonce" value={String(a.numeroAnnonce)} />}
                                          {a.numeroBodacc && <BodaccField label="N° BODACC" value={a.numeroBodacc} />}
                                          {a.registre && <BodaccField label="RCS" value={a.registre} />}
                                          {a.tribunal && <BodaccField label="Greffe" value={a.tribunal} />}
                                          {a.ville && <BodaccField label="Ville" value={a.ville} />}
                                        </div>

                                        {/* Jugement */}
                                        {(a.jugementNature || a.jugementDate || a.jugementComplement) && (
                                          <BodaccSection titre="Jugement">
                                            {a.jugementNature && <BodaccField label="Nature" value={a.jugementNature} full />}
                                            {a.jugementDate && <BodaccField label="Date du jugement" value={formatDate(a.jugementDate)} />}
                                            {a.jugementComplement && <BodaccField label="Complément" value={a.jugementComplement} full />}
                                          </BodaccSection>
                                        )}

                                        {/* Acte (immatriculation / vente) */}
                                        {(a.acteCategorie || a.acteDate || a.acteDescriptif) && (
                                          <BodaccSection titre="Acte">
                                            {a.acteCategorie && <BodaccField label="Catégorie" value={a.acteCategorie} full />}
                                            {a.acteDate && <BodaccField label="Date d'immatriculation" value={formatDate(a.acteDate)} />}
                                            {a.acteDescriptif && <BodaccField label="Descriptif" value={a.acteDescriptif} full />}
                                          </BodaccSection>
                                        )}

                                        {/* Modification */}
                                        {a.modificationDescriptif && (
                                          <BodaccSection titre="Modification">
                                            <BodaccField label="Objet" value={a.modificationDescriptif} full />
                                          </BodaccSection>
                                        )}

                                        {/* Établissement (vente/cession) */}
                                        {(a.etablissementActivite || a.etablissementOrigine || a.etablissementAdresse) && (
                                          <BodaccSection titre="Établissement">
                                            {a.etablissementActivite && <BodaccField label="Activité" value={a.etablissementActivite} full />}
                                            {a.etablissementOrigine && <BodaccField label="Origine du fonds" value={a.etablissementOrigine} full />}
                                            {a.etablissementAdresse && <BodaccField label="Adresse" value={a.etablissementAdresse} full />}
                                          </BodaccSection>
                                        )}

                                        {/* Vendeur */}
                                        {a.vendeurNom && (
                                          <BodaccSection titre="Vendeur">
                                            <BodaccField label="Nom" value={a.vendeurNom} full />
                                          </BodaccSection>
                                        )}

                                        {/* Personne/Société */}
                                        {(a.personnesDenomination || a.personnesActivite || a.personnesAdministration || a.personnesFormeJuridique || a.personnesCapital) && (
                                          <BodaccSection titre="Société concernée">
                                            {a.personnesDenomination && <BodaccField label="Dénomination" value={a.personnesDenomination} full />}
                                            {a.personnesFormeJuridique && <BodaccField label="Forme juridique" value={a.personnesFormeJuridique} />}
                                            {a.personnesCapital && <BodaccField label="Capital" value={a.personnesCapital} />}
                                            {a.personnesActivite && <BodaccField label="Activité" value={a.personnesActivite} full />}
                                            {a.personnesAdministration && <BodaccField label="Administration" value={a.personnesAdministration} full />}
                                          </BodaccSection>
                                        )}

                                        {/* Radiation */}
                                        {(a.radiationDate || a.radiationCommentaire) && (
                                          <BodaccSection titre="Radiation">
                                            {a.radiationDate && <BodaccField label="Date d'effet" value={formatDate(a.radiationDate)} />}
                                            {a.radiationCommentaire && <BodaccField label="Motif" value={a.radiationCommentaire} />}
                                          </BodaccSection>
                                        )}

                                        {/* Lien BODACC */}
                                        {a.urlBodacc && (
                                          <a href={a.urlBodacc} target="_blank" rel="noopener noreferrer" style={{
                                            display: 'inline-block', marginTop: '10px',
                                            fontSize: '12px', color: '#1d4ed8', textDecoration: 'underline',
                                          }}>
                                            <FileText size={12} strokeWidth={1.5} style={{ display: 'inline', marginRight: '4px' }} /> Voir l&apos;annonce sur BODACC.fr
                                          </a>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                              {bodaccSorted.length > BODACC_PAGE && (
                                <button
                                  onClick={() => setShowAllBodacc(!showAllBodacc)}
                                  style={{
                                    width: '100%', background: 'none', border: '1px dashed #d1d5db',
                                    borderRadius: '8px', padding: '8px', cursor: 'pointer',
                                    fontSize: '13px', color: '#6b7280', fontFamily: 'var(--font-body)',
                                  }}
                                >
                                  {showAllBodacc
                                    ? 'Réduire'
                                    : `Voir les ${bodaccSorted.length - BODACC_PAGE} annonces suivantes`}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* ── Card 5 — Checklist avant signature ── */}
                <div id="section-checklist" style={{
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

                {/* ── Disclaimer global ── */}
                <div style={{
                  background: '#f9fafb', border: '1px solid #e5e7eb',
                  borderRadius: '12px', padding: '16px',
                }}>
                  <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', lineHeight: 1.6 }}>
                    Les données affichées proviennent de sources officielles publiques (INSEE, ADEME, BODACC). Elles sont mises à jour quotidiennement. Verifio n&apos;est pas responsable des décisions prises sur la base de ces informations. Ces données ne constituent pas un conseil juridique.
                  </p>
                </div>

                {/* ── Card 6 — Partage ── */}
                <div style={cardStyle}>
                  <h3 style={cardTitleStyle}><Share2 size={20} strokeWidth={1.5} /> Partager cette fiche</h3>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Fiche artisan : ${result.nom} — ${typeof window !== 'undefined' ? window.location.href : ''}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        border: `1px solid ${hoveredBtn === 'whatsapp' ? 'var(--color-accent)' : '#e5e7eb'}`,
                        borderRadius: '8px', padding: '7px 14px', fontSize: '13px',
                        color: '#374151', textDecoration: 'none', fontWeight: 500,
                        background: hoveredBtn === 'whatsapp' ? 'rgba(45,185,110,0.06)' : 'transparent',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={() => setHoveredBtn('whatsapp')}
                      onMouseLeave={() => setHoveredBtn(null)}
                    >
                      <Smartphone size={14} strokeWidth={1.5} style={{ marginRight: '5px', verticalAlign: 'middle' }} />WhatsApp
                    </a>
                    <a
                      href={`mailto:?subject=${encodeURIComponent(`Fiche artisan : ${result.nom}`)}&body=${encodeURIComponent(`Consulter la fiche : ${typeof window !== 'undefined' ? window.location.href : ''}`)}`}
                      style={{
                        border: `1px solid ${hoveredBtn === 'email' ? 'var(--color-accent)' : '#e5e7eb'}`,
                        borderRadius: '8px', padding: '7px 14px', fontSize: '13px',
                        color: '#374151', textDecoration: 'none', fontWeight: 500,
                        background: hoveredBtn === 'email' ? 'rgba(45,185,110,0.06)' : 'transparent',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={() => setHoveredBtn('email')}
                      onMouseLeave={() => setHoveredBtn(null)}
                    >
                      <Mail size={13} strokeWidth={1.5} style={{ display: 'inline', marginRight: '4px' }} /> Email
                    </a>
                    <button
                      onClick={copyLink}
                      style={{
                        border: `1px solid ${hoveredBtn === 'copier' ? 'var(--color-accent)' : '#e5e7eb'}`,
                        borderRadius: '8px', padding: '7px 14px', fontSize: '13px',
                        color: linkCopied ? '#15803d' : '#374151',
                        background: hoveredBtn === 'copier' ? 'rgba(45,185,110,0.06)' : 'white',
                        cursor: 'pointer', fontWeight: 500, fontFamily: 'var(--font-body)',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={() => setHoveredBtn('copier')}
                      onMouseLeave={() => setHoveredBtn(null)}
                    >
                      {linkCopied ? <><Check size={13} strokeWidth={1.5} style={{ display: 'inline', marginRight: '4px' }} /> Lien copié !</> : <><Link size={13} strokeWidth={1.5} style={{ display: 'inline', marginRight: '4px' }} /> Copier le lien</>}
                    </button>
                  </div>
                  <p
                    style={{
                      margin: 0, fontSize: '12px',
                      color: hoveredBtn === 'signaler' ? 'var(--color-accent)' : '#9ca3af',
                      cursor: 'pointer', transition: 'color 0.15s ease',
                    }}
                    onClick={() => window.location.href = `mailto:contact@verifio.fr?subject=Erreur fiche ${result.siret}`}
                    onMouseEnter={() => setHoveredBtn('signaler')}
                    onMouseLeave={() => setHoveredBtn(null)}
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
                  {/* Score ring with tooltip */}
                  <div
                    title={"Ce score mesure :\n• Statut légal actif (40 pts)\n• Ancienneté de l'entreprise (35 pts)\n• Absence de procédures judiciaires (25 pts)\n\nIl ne préjuge pas de la qualité des travaux ni de la validité de l'assurance décennale."}
                    style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', cursor: 'help' }}
                  >
                    <ScoreRing score={score} strokeColor={strokeColor} />
                  </div>

                  {/* Verdict */}
                  <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, color: verdictColor, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <VerdictIcon size={14} strokeWidth={1.5} /> {verdictText}
                  </p>
                  <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#6b7280', lineHeight: 1.5 }}>
                    {verdictSubtitle}
                  </p>

                  {/* Score disclaimer */}
                  <div style={{
                    background: '#F8F4EF', borderRadius: '12px', padding: '12px 14px',
                    marginBottom: '20px', textAlign: 'left',
                    display: 'flex', gap: '8px', alignItems: 'flex-start',
                  }}>
                    <Info size={14} strokeWidth={1.5} style={{ flexShrink: 0 }} />
                    <p style={{ margin: 0, fontSize: '11px', color: '#6b7280', lineHeight: 1.5 }}>
                      Ce score évalue la solidité juridique — statut légal, ancienneté et historique judiciaire. Un score élevé signifie que vous disposez de leviers juridiques solides en cas de litige. <strong>Il ne garantit pas la qualité des travaux.</strong>
                    </p>
                  </div>

                  {/* Score breakdown */}
                  <div style={{
                    display: 'flex', flexDirection: 'column', gap: '10px',
                    textAlign: 'left', marginBottom: '24px',
                  }}>
                    {scoreBreakdown.map((item) => (
                      <div key={item.nom}>
                        <div style={{
                          display: 'flex', justifyContent: 'space-between',
                          marginBottom: '4px',
                        }}>
                          <span style={{ fontSize: '12px', color: '#374151' }}>{item.nom}</span>
                          {item.disponible ? (
                            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>
                              {item.points}/{item.max}
                            </span>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#9ca3af', fontStyle: 'italic' }}>
                              Donnée indisponible
                            </span>
                          )}
                        </div>
                        <div style={{
                          height: 6, background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%',
                            width: item.disponible ? `${(item.points / item.max) * 100}%` : '0%',
                            background: item.disponible
                              ? (item.points / item.max >= 0.8 ? '#52B788' : item.points / item.max >= 0.5 ? '#F4A261' : '#E63946')
                              : '#e5e7eb',
                            borderRadius: '3px',
                            transition: 'width 1s ease',
                          }} />
                        </div>
                      </div>
                    ))}
                    {scoreBreakdown.some(c => !c.disponible) && (
                      <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#9ca3af', lineHeight: 1.4, display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                        <Info size={11} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: '1px' }} /> Certaines données n&apos;ont pas pu être vérifiées — elles n&apos;impactent pas ce score.
                      </p>
                    )}
                  </div>

                  {/* Separator */}
                  <div style={{ height: 1, background: '#e5e7eb', margin: '0 0 16px' }} />

                  {/* Action buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Pack Sérénité — bloc contextuel */}
                    {rapportExistant ? (
                      <div style={{
                        background: 'var(--color-safe)',
                        color: 'white',
                        borderRadius: '16px',
                        padding: '20px 16px',
                        textAlign: 'center',
                      }}>
                        <CheckCircle size={24} strokeWidth={1.5} style={{ marginBottom: '8px' }} />
                        <p style={{ fontWeight: 700, margin: '0 0 4px', fontSize: '15px' }}>Rapport déjà acheté</p>
                        <p style={{ fontSize: '13px', opacity: 0.9, margin: '0 0 14px' }}>Accédez à votre rapport complet</p>
                        <button
                          onClick={() => router.push(`/rapport/succes?session_id=${rapportExistant.stripe_session_id}&siret=${siret}`)}
                          style={{
                            background: 'white', color: 'var(--color-safe)',
                            border: 'none', borderRadius: '10px',
                            padding: '10px 20px', fontSize: '14px', fontWeight: 700,
                            cursor: 'pointer', width: '100%',
                          }}
                        >
                          Accéder au rapport →
                        </button>
                      </div>
                    ) : (
                    <div style={{
                      background: isRisque ? '#FFF5F5' : '#F0FDF4',
                      border: `1.5px solid ${isRisque ? '#fca5a5' : '#86efac'}`,
                      borderRadius: '16px',
                      padding: '18px 16px 16px',
                    }}>
                      {/* En-tête contextuel */}
                      <div style={{ marginBottom: '14px' }}>
                        <p style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700, color: isRisque ? '#991b1b' : '#14532d', fontFamily: 'var(--font-body)', lineHeight: 1.3, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isRisque ? <><AlertCircle size={16} strokeWidth={1.5} /> Vous allez signer un contrat risqué</> : <><Shield size={16} strokeWidth={1.5} /> Sécurisez votre chantier pour 4,90€</>}
                        </p>
                        <p style={{ margin: 0, fontSize: '12px', color: isRisque ? '#b91c1c' : '#166534', lineHeight: 1.5 }}>
                          {isRisque
                            ? "Cette entreprise présente des signaux d'alerte. Avant de signer, analysez votre devis et protégez-vous."
                            : 'Le profil juridique est solide. Vérifiez aussi que votre devis est conforme avant de signer.'}
                        </p>
                      </div>

                      {/* 3 arguments visuels */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px', textAlign: 'left' }}>
                        {[
                          { Icon: Download, titre: 'Rapport PDF complet', desc: "Rapport complet de l'artisan en PDF" },
                          { Icon: FileText, titre: 'Analyse juridique du devis', desc: 'Clauses abusives, mentions manquantes' },
                          { Icon: Bell, titre: 'Surveillance 6 mois', desc: "Alerté si l'artisan change de statut" },
                        ].map(({ Icon, titre, desc }) => (
                          <div key={titre} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <Icon size={16} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: '2px', color: '#1f2937' }} />
                            <div style={{ textAlign: 'left' }}>
                              <div style={{ fontSize: '12px', fontWeight: 700, color: '#1f2937', lineHeight: 1.4 }}>{titre}</div>
                              <div style={{ fontSize: '11px', color: '#6b7280', lineHeight: 1.4 }}>{desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Bandeau urgence si procédures collectives */}
                      {nbProcedures > 0 && (
                        <div style={{
                          background: '#dc2626', color: 'white',
                          borderRadius: '8px', padding: '10px 12px',
                          marginBottom: '12px', fontSize: '12px', lineHeight: 1.5,
                        }}>
                          <AlertTriangle size={12} strokeWidth={1.5} style={{ display: 'inline', marginRight: '4px' }} /> Cette entreprise a <strong>{nbProcedures} procédure{nbProcedures > 1 ? 's' : ''} judiciaire{nbProcedures > 1 ? 's' : ''}</strong> — analyse de devis fortement recommandée avant tout engagement financier.
                        </div>
                      )}

                      {/* CTA */}
                      <button
                        onClick={startSerenite}
                        disabled={checkoutLoading}
                        style={{
                          width: '100%',
                          background: '#52B788', color: 'white',
                          border: 'none', borderRadius: '12px',
                          padding: '15px', fontSize: '15px', fontWeight: 700,
                          cursor: 'pointer', fontFamily: 'var(--font-body)',
                          opacity: checkoutLoading ? 0.7 : 1,
                        }}
                        onMouseEnter={e => !checkoutLoading && ((e.currentTarget as HTMLButtonElement).style.background = '#3d9c6e')}
                        onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = '#52B788')}
                      >
                        {checkoutLoading ? 'Redirection…' : 'Activer le Pack Sérénité — 4,90€ →'}
                      </button>
                      <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#9ca3af', textAlign: 'center' }}>
                        Paiement sécurisé · Satisfait ou remboursé 14j
                      </p>
                    </div>
                    )}

                    {/* Alerte */}
                    <button
                      style={{
                        width: '100%',
                        background: hoveredBtn === 'alerte' ? 'rgba(45,185,110,0.06)' : 'white',
                        color: '#1B4332',
                        border: `1.5px solid ${hoveredBtn === 'alerte' ? 'var(--color-accent)' : '#1B4332'}`,
                        borderRadius: '12px', padding: '13px',
                        fontSize: '15px', fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'var(--font-body)',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={() => setHoveredBtn('alerte')}
                      onMouseLeave={() => setHoveredBtn(null)}
                    >
                      <Bell size={15} strokeWidth={1.5} style={{ display: 'inline', marginRight: '6px' }} /> Recevoir une alerte
                    </button>

                    {/* Row of 2 small buttons */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a
                        href={`/comparer?a=${result.siret}`}
                        style={{
                          flex: 1, textAlign: 'center',
                          border: `1px solid ${hoveredBtn === 'comparer' ? 'var(--color-accent)' : '#e5e7eb'}`,
                          borderRadius: '8px', padding: '9px 8px',
                          fontSize: '13px', fontWeight: 600,
                          color: '#374151', textDecoration: 'none', display: 'block',
                          background: hoveredBtn === 'comparer' ? 'rgba(45,185,110,0.06)' : 'transparent',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={() => setHoveredBtn('comparer')}
                        onMouseLeave={() => setHoveredBtn(null)}
                      >
                        <BarChart2 size={13} strokeWidth={1.5} style={{ display: 'inline', marginRight: '4px' }} /> Comparer →
                      </a>
                      <button
                        onClick={copyLink}
                        style={{
                          flex: 1,
                          border: `1px solid ${hoveredBtn === 'partager' ? 'var(--color-accent)' : '#e5e7eb'}`,
                          borderRadius: '8px', padding: '9px 8px',
                          fontSize: '13px', fontWeight: 600,
                          color: linkCopied ? '#15803d' : '#374151',
                          background: hoveredBtn === 'partager' ? 'rgba(45,185,110,0.06)' : 'white',
                          cursor: 'pointer', fontFamily: 'var(--font-body)',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={() => setHoveredBtn('partager')}
                        onMouseLeave={() => setHoveredBtn(null)}
                      >
                        {linkCopied
                          ? <><Check size={13} strokeWidth={1.5} style={{ display: 'inline', marginRight: '4px' }} /> Copié</>
                          : <><Share2 size={13} strokeWidth={1.5} style={{ display: 'inline', marginRight: '4px' }} /> Partager</>
                        }
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
                      <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 700, color: '#14532d', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={13} strokeWidth={1.5} /> Artisan vérifié Verifio
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
                        style={{
                          color: hoveredBtn === 'revendiquer' ? 'var(--color-accent)' : '#1B4332',
                          fontWeight: 600, textDecoration: 'none',
                          transition: 'color 0.15s ease',
                        }}
                        onMouseEnter={() => setHoveredBtn('revendiquer')}
                        onMouseLeave={() => setHoveredBtn(null)}
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
          background: 'white', padding: '12px 16px',
          borderTop: '1px solid #e5e7eb',
          zIndex: 50,
        }}>
          {nbProcedures > 0 && (
            <p style={{ margin: '0 0 8px', fontSize: '11px', color: '#dc2626', fontWeight: 600, textAlign: 'center' }}>
              <AlertTriangle size={11} strokeWidth={1.5} style={{ display: 'inline', marginRight: '4px' }} /> {nbProcedures} procédure{nbProcedures > 1 ? 's' : ''} judiciaire{nbProcedures > 1 ? 's' : ''} détectée{nbProcedures > 1 ? 's' : ''}
            </p>
          )}
          {rapportExistant ? (
            <button
              onClick={() => router.push(`/rapport/succes?session_id=${rapportExistant.stripe_session_id}&siret=${siret}`)}
              style={{
                width: '100%',
                background: 'var(--color-safe)', color: 'white',
                border: 'none', borderRadius: '12px',
                padding: '14px', fontSize: '15px', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'var(--font-body)',
              }}
            >
              Accéder au rapport →
            </button>
          ) : (
            <button
              onClick={startSerenite}
              disabled={checkoutLoading}
              style={{
                width: '100%',
                background: '#52B788', color: 'white',
                border: 'none', borderRadius: '12px',
                padding: '14px', fontSize: '15px', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'var(--font-body)',
                opacity: checkoutLoading ? 0.7 : 1,
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={e => { if (!checkoutLoading) (e.currentTarget as HTMLButtonElement).style.background = '#2D6A4F' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#52B788' }}
            >
              {checkoutLoading ? 'Redirection…' : 'Activer le Pack Sérénité — 4,90€ →'}
            </button>
          )}
        </div>
      )}
    </main>
  )
}
