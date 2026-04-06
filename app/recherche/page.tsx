'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { X, ExternalLink, Wrench, Zap, Home, Square, Paintbrush, Snowflake, Leaf, MapPin, AlertTriangle, HardHat, Search, Layers, Thermometer, Hammer, Map } from 'lucide-react'
import SiteHeader from '@/components/SiteHeader'
import { SectionBadge, SurfaceCard } from '@/components/ExperiencePrimitives'
import { SearchAutocomplete, saveRecent } from '@/components/SearchAutocomplete'
import { scoreColor, scoreBg } from '@/lib/score'
import type { SearchCandidate } from '@/types'

/* ─── Types ─────────────────────────────────────────────────── */
type CandidateResult = SearchCandidate & { rge?: boolean }
type SortBy = 'pertinence' | 'anciennete'

/* ─── Constants ─────────────────────────────────────────────── */
const QUICK_ACTIONS = [
  { Icon: Wrench,      label: 'Plombier',      kw: 'plombier' },
  { Icon: Zap,         label: 'Électricien',   kw: 'électricien' },
  { Icon: Layers,      label: 'Maçon',         kw: 'maçon' },
  { Icon: Home,        label: 'Couvreur',      kw: 'couvreur' },
  { Icon: Thermometer, label: 'Chauffagiste',  kw: 'chauffagiste' },
  { Icon: Square,      label: 'Menuisier',     kw: 'menuisier' },
  { Icon: Paintbrush,  label: 'Peintre',       kw: 'peintre' },
  { Icon: Hammer,      label: 'Charpentier',   kw: 'charpentier' },
  { Icon: Snowflake,   label: 'Climatisation', kw: 'climaticien' },
]

const POPULAR = [
  { label: 'Plombier Paris',     kw: 'Plombier',    ville: 'Paris' },
  { label: 'Électricien Lyon',   kw: 'Électricien', ville: 'Lyon' },
  { label: 'Maçon Bordeaux',     kw: 'Maçon',       ville: 'Bordeaux' },
]

const RAYON_OPTIONS = [
  { v: '5', label: '5 km' },
  { v: '10', label: '10 km' },
  { v: '25', label: '25 km' },
  { v: '50', label: '50 km' },
  { v: '100', label: '100 km' },
]

const CURRENT_YEAR = new Date().getFullYear()

/* ─── CSS shorthand ─────────────────────────────────────────── */
const cv = (name: string) => `var(--color-${name})`

/* ─── VilleAutocomplete ─────────────────────────────────────── */
interface GeoCommune { nom: string; codeDepartement: string; codesPostaux: string[] }
interface GeoDept { nom: string; code: string }
interface VilleSelection {
  label: string
  type: 'commune' | 'departement'
  codePostal?: string
  deptCode?: string
}

function VilleAutocomplete({
  value,
  onChange,
  onSelect,
}: {
  value: string
  onChange: (v: string) => void
  onSelect: (sel: VilleSelection) => void
}) {
  const [communes, setCommunes] = useState<GeoCommune[]>([])
  const [depts, setDepts] = useState<GeoDept[]>([])
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (value.length < 2) return
    timerRef.current = setTimeout(async () => {
      try {
        const q = encodeURIComponent(value)
        const [r1, r2] = await Promise.all([
          fetch(`https://geo.api.gouv.fr/communes?nom=${q}&limit=5&fields=nom,codeDepartement,codesPostaux`),
          fetch(`https://geo.api.gouv.fr/departements?nom=${q}&limit=3&fields=nom,code`),
        ])
        const [c, d] = await Promise.all([r1.json(), r2.json()])
        const communesList: GeoCommune[] = Array.isArray(c) ? c : []
        const deptsList: GeoDept[] = Array.isArray(d) ? d : []
        setCommunes(communesList)
        setDepts(deptsList)
        setOpen(communesList.length > 0 || deptsList.length > 0)
      } catch {
        setCommunes([]); setDepts([])
      }
    }, 250)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [value])

  useEffect(() => {
    const onMD = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onMD)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onMD); document.removeEventListener('keydown', onKey) }
  }, [])

  const select = (sel: VilleSelection) => {
    onChange(sel.label); onSelect(sel); setOpen(false); setCommunes([]); setDepts([])
  }

  const rowStyle = (last: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: '8px',
    width: '100%', padding: '9px 14px',
    background: 'none', border: 'none', cursor: 'pointer',
    textAlign: 'left', fontFamily: 'var(--font-body)',
    fontSize: '14px', color: cv('text'),
    borderBottom: last ? 'none' : `1px solid ${cv('border')}`,
  })

  const groupHeader = (hasBorder: boolean): React.CSSProperties => ({
    padding: '6px 14px 4px', fontSize: '10px', fontWeight: 700,
    color: cv('muted'), textTransform: 'uppercase', letterSpacing: '0.08em',
    background: '#f9fafb',
    borderTop: hasBorder ? `1px solid ${cv('border')}` : 'none',
  })

  return (
    <div ref={wrapperRef} style={{ flex: '1 1 160px', position: 'relative' }}>
      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1, display: 'flex', alignItems: 'center' }}>
        <MapPin size={16} strokeWidth={1.5} />
      </span>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Ville ou département"
        autoComplete="off"
        style={{
          width: '100%', height: '52px', paddingLeft: '40px', paddingRight: '16px',
          border: `2px solid ${cv('border')}`, borderRadius: '12px',
          background: 'white', fontSize: '15px', fontFamily: 'var(--font-body)',
          color: cv('text'), outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box',
        }}
        onFocus={e => { e.target.style.borderColor = cv('accent'); if (communes.length > 0 || depts.length > 0) setOpen(true) }}
        onBlur={e => (e.target.style.borderColor = cv('border'))}
      />
      {open && value.length >= 2 && (communes.length > 0 || depts.length > 0) && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: 'white', border: `1px solid ${cv('border')}`,
          borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          zIndex: 20, overflow: 'hidden',
        }}>
          {communes.length > 0 && (
            <>
              <div style={groupHeader(false)}>Villes</div>
              {communes.map((c, i) => (
                <button key={`c${i}`} type="button"
                  onMouseDown={() => select({ label: c.nom, type: 'commune', codePostal: c.codesPostaux?.[0] })}
                  style={rowStyle(i === communes.length - 1 && depts.length === 0)}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <MapPin size={14} strokeWidth={1.5} />
                  <span style={{ fontWeight: 600, flex: 1 }}>{c.nom}</span>
                  <span style={{ color: cv('muted'), fontSize: '12px' }}>({c.codeDepartement})</span>
                </button>
              ))}
            </>
          )}
          {depts.length > 0 && (
            <>
              <div style={groupHeader(communes.length > 0)}>Départements</div>
              {depts.map((d, i) => (
                <button key={`d${i}`} type="button"
                  onMouseDown={() => select({ label: d.nom, type: 'departement', deptCode: d.code })}
                  style={rowStyle(i === depts.length - 1)}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <Map size={14} strokeWidth={1.5} style={{ flexShrink: 0, color: 'var(--color-muted)' }} />
                  <span style={{ fontWeight: 600, flex: 1 }}>{d.nom}</span>
                  <span style={{ color: cv('muted'), fontSize: '12px' }}>({d.code})</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── CandidateCard ─────────────────────────────────────────── */
function CandidateCard({ c }: { c: CandidateResult }) {
  const router = useRouter()
  const statut = String(c.statut || '').toLowerCase().trim()
  const isActif = statut === 'actif' || statut === 'a'
  const age = c.dateCreation
    ? Math.max(0, CURRENT_YEAR - new Date(c.dateCreation).getFullYear())
    : null

  // Score pre-computed server-side by /api/recherche using lib/score.ts (same function as artisan page)
  const score = c.score ?? 0
  const color = scoreColor(score)
  const bg = scoreBg(score)

  return (
    <div
      onClick={() => router.push(`/artisan/${c.siret}`)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(250,246,241,0.94) 100%)',
        border: '1px solid rgba(220,208,193,0.9)',
        borderRadius: '28px',
        padding: '24px',
        cursor: 'pointer',
        transition: 'box-shadow 0.18s, border-color 0.18s, transform 0.18s',
        boxShadow: '0 22px 44px rgba(20,32,27,0.07)',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = 'rgba(21,59,46,0.32)'
        el.style.boxShadow = '0 28px 52px rgba(21,59,46,0.12)'
        el.style.transform = 'translateY(-3px)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = 'rgba(220,208,193,0.9)'
        el.style.boxShadow = '0 22px 44px rgba(20,32,27,0.07)'
        el.style.transform = 'none'
      }}
    >
      <div style={{
        position: 'absolute',
        top: '-32px',
        right: '-22px',
        width: '180px',
        height: '180px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(82,183,136,0.18) 0%, rgba(82,183,136,0.05) 40%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '18px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '7px 12px',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.76)',
              border: '1px solid rgba(226,217,204,0.9)',
              fontSize: '11px',
              fontWeight: 700,
              color: cv('muted'),
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>
              Lecture Rien qui cloche
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
            <span style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-display)', color: cv('text'), lineHeight: 1.1 }}>
              {c.nom}
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: 800,
              padding: '6px 10px',
              borderRadius: '999px',
              flexShrink: 0,
              background: isActif ? '#dcfce7' : '#fee2e2',
              color: isActif ? '#166534' : '#991b1b',
            }}>
              {isActif ? '● ACTIF' : '● FERMÉ'}
            </span>
            {c.rge && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 800,
                padding: '6px 10px',
                borderRadius: '999px',
                background: '#d1fae5',
                color: '#065f46',
                flexShrink: 0,
              }}>
                <Leaf size={12} strokeWidth={1.5} />
                RGE
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
            {c.formeJuridique && (
              <span style={{ fontSize: '12px', color: cv('muted'), background: 'rgba(255,255,255,0.82)', padding: '5px 10px', borderRadius: '999px', border: '1px solid rgba(226,217,204,0.9)' }}>
                {c.formeJuridique}
              </span>
            )}
            {c.activite && (
              <span style={{
                fontSize: '12px',
                color: cv('muted'),
                background: 'rgba(255,255,255,0.82)',
                padding: '5px 10px',
                borderRadius: '999px',
                border: '1px solid rgba(226,217,204,0.9)',
                maxWidth: '300px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {c.activite}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            {(c.ville || c.codePostal) && (
              <span style={{ fontSize: '13px', color: cv('muted'), display: 'inline-flex', alignItems: 'center', gap: '5px' }}><MapPin size={13} strokeWidth={1.5} />{c.codePostal} {c.ville}</span>
            )}
            {age !== null && (
              <span style={{ fontSize: '13px', color: cv('muted'), display: 'inline-flex', alignItems: 'center', gap: '5px' }}><HardHat size={13} strokeWidth={1.5} />{age} an{age > 1 ? 's' : ''} d&apos;activité</span>
            )}
          </div>
        </div>

        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px', minWidth: '148px' }}>
          <div style={{
            minWidth: '132px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '2px',
            background: bg,
            border: `1px solid ${color}22`,
            borderRadius: '22px',
            padding: '14px 16px 12px',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45)',
          }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color, opacity: 0.72, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Score Rien qui cloche</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
              <span style={{ fontSize: '30px', fontWeight: 800, color, fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                {score}
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, color, opacity: 0.7 }}>/100</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 700, color: cv('accent'), whiteSpace: 'nowrap' }}>
            Voir la fiche <ExternalLink size={12} />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── SkeletonCard ──────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{ background: cv('surface'), border: `1px solid ${cv('border')}`, borderRadius: '14px', padding: '16px 20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div className="skeleton" style={{ height: '20px', width: '200px', borderRadius: '6px' }} />
          <div className="skeleton" style={{ height: '18px', width: '52px', borderRadius: '10px' }} />
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <div className="skeleton" style={{ height: '16px', width: '56px', borderRadius: '8px' }} />
          <div className="skeleton" style={{ height: '16px', width: '160px', borderRadius: '8px' }} />
        </div>
        <div className="skeleton" style={{ height: '14px', width: '110px', borderRadius: '6px' }} />
      </div>
    </div>
  )
}

/* ─── Chip button ────────────────────────────────────────────── */
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '4px 12px', borderRadius: '20px', border: '1px solid',
        fontSize: '12px', fontWeight: 600, cursor: 'pointer',
        fontFamily: 'var(--font-body)', transition: 'all 0.12s',
        ...(active
          ? { background: cv('accent'), color: '#fff', borderColor: cv('accent') }
          : { background: 'transparent', color: cv('muted'), borderColor: cv('border') }),
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = cv('text') } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = cv('muted') } }}
    >
      {children}
    </button>
  )
}

/* ─── RechercheInner ─────────────────────────────────────────── */
function RechercheInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Read URL params
  const qParam = searchParams.get('q') || ''
  const villeParam = searchParams.get('ville') || ''
  const cpParam = searchParams.get('cp') || ''
  const deptParam = searchParams.get('dept') || ''
  const rgeParam = searchParams.get('rge') === 'true'
  const statutParam = searchParams.get('statut') || '' // 'A' | 'F' | ''
  const ancienneteParam = searchParams.get('anciennete') || ''
  const scoreminParam = searchParams.get('score_min') || ''
  const rayonParam = searchParams.get('rayon') || '25'

  // Form local state (typed values, not yet submitted)
  const [queryInput, setQueryInput] = useState(qParam)
  const [villeInput, setVilleInput] = useState(villeParam)
  const [villeSelection, setVilleSelection] = useState<VilleSelection | null>(
    cpParam ? { label: villeParam, type: 'commune', codePostal: cpParam }
    : deptParam ? { label: villeParam, type: 'departement', deptCode: deptParam }
    : null
  )

  // Filter UI state (mirrors URL, drives updateFilters calls)
  const [filterRge, setFilterRge] = useState(rgeParam)
  const [filterStatut, setFilterStatut] = useState(statutParam)
  const [filterAnciennete, setFilterAnciennete] = useState(ancienneteParam)
  const [filterScoreMin, setFilterScoreMin] = useState(scoreminParam)
  const [rayon, setRayon] = useState(rayonParam)
  const [sortBy, setSortBy] = useState<SortBy>('pertinence')

  // Results state
  const [results, setResults] = useState<CandidateResult[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [retryKey, setRetryKey] = useState(0)

  const hasQuery = !!(qParam || cpParam || deptParam)

  // Sync form inputs when URL changes (e.g. browser back)
  useEffect(() => { setQueryInput(qParam) }, [qParam])
  useEffect(() => { setVilleInput(villeParam) }, [villeParam])
  useEffect(() => { setFilterRge(rgeParam) }, [rgeParam])
  useEffect(() => { setFilterStatut(statutParam) }, [statutParam])
  useEffect(() => { setFilterAnciennete(ancienneteParam) }, [ancienneteParam])
  useEffect(() => { setFilterScoreMin(scoreminParam) }, [scoreminParam])

  // Main search effect — triggered by URL params change
  useEffect(() => {
    if (!qParam && !cpParam && !deptParam) {
      setResults([]); setTotal(0); setHasMore(false); setCurrentPage(1); setHasError(false)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setHasError(false)
    setResults([])
    setHasMore(false)
    setCurrentPage(1)

    const params = new URLSearchParams()
    if (qParam) params.set('q', qParam)
    if (cpParam) params.set('code_postal', cpParam)
    if (deptParam) params.set('departement', deptParam)
    if (rgeParam) params.set('rge', '1')
    if (statutParam) params.set('statut', statutParam)
    if (ancienneteParam) params.set('anciennete', ancienneteParam)
    params.set('page', '1')

    fetch(`/api/recherche?${params}`, { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        if (data.isExact) { router.push(`/artisan/${data.siret}`); return }
        if (data.error) { setHasError(true); return }
        setResults(data.results || [])
        setTotal(data.total || 0)
        setHasMore(data.hasMore ?? false)
        setCurrentPage(1)
      })
      .catch((e: unknown) => { if ((e as Error).name !== 'AbortError') setHasError(true) })
      .finally(() => setLoading(false))

    return () => controller.abort()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qParam, cpParam, deptParam, rgeParam, statutParam, ancienneteParam, retryKey])

  // Load more handler
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    const nextPage = currentPage + 1
    setLoadingMore(true)

    const params = new URLSearchParams()
    if (qParam) params.set('q', qParam)
    if (cpParam) params.set('code_postal', cpParam)
    if (deptParam) params.set('departement', deptParam)
    if (rgeParam) params.set('rge', '1')
    if (statutParam) params.set('statut', statutParam)
    if (ancienneteParam) params.set('anciennete', ancienneteParam)
    params.set('page', String(nextPage))

    try {
      const res = await fetch(`/api/recherche?${params}`)
      const data = await res.json()
      if (!data.error) {
        setResults(prev => [...prev, ...(data.results || [])])
        setCurrentPage(nextPage)
        setHasMore(data.hasMore ?? false)
      }
    } catch { /* silent */ }
    finally { setLoadingMore(false) }
  }, [loadingMore, hasMore, currentPage, qParam, cpParam, deptParam, rgeParam, statutParam, ancienneteParam])

  // Build URL helper
  const buildURL = (overrides: Record<string, string> = {}) => {
    const p = new URLSearchParams()
    const q = overrides.q ?? qParam
    const ville = overrides.ville ?? villeParam
    const cp = overrides.cp ?? cpParam
    const dept = overrides.dept ?? deptParam
    const rge = overrides.rge ?? (filterRge ? 'true' : '')
    const statut = overrides.statut ?? filterStatut
    const anciennete = overrides.anciennete ?? filterAnciennete
    const score = overrides.score_min ?? filterScoreMin
    const ry = overrides.rayon ?? rayon
    if (q) p.set('q', q)
    if (ville) p.set('ville', ville)
    if (cp) p.set('cp', cp)
    if (dept) p.set('dept', dept)
    if (rge) p.set('rge', rge)
    if (statut) p.set('statut', statut)
    if (anciennete) p.set('anciennete', anciennete)
    if (score) p.set('score_min', score)
    if (ry !== '25') p.set('rayon', ry)
    return p.toString()
  }

  const updateFilters = (overrides: Record<string, string>) => {
    router.replace(`/recherche?${buildURL(overrides)}`, { scroll: false })
  }

  // Form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!queryInput.trim() && !villeInput.trim()) return
    const q = queryInput.trim()
    const ville = villeInput.trim()
    const isSameVille = ville === villeSelection?.label
    const cp = isSameVille && villeSelection?.type === 'commune' ? (villeSelection.codePostal || '') : ''
    const dept = isSameVille && villeSelection?.type === 'departement' ? (villeSelection.deptCode || '') : ''
    saveRecent(q, ville)
    router.push(`/recherche?${buildURL({ q, ville, cp, dept })}`)
  }

  const handleVilleChange = (v: string) => {
    setVilleInput(v)
    if (!v) setVilleSelection(null)
  }

  const handleVilleSelect = (sel: VilleSelection) => {
    setVilleSelection(sel)
  }

  const resetFilters = () => {
    setFilterRge(false); setFilterStatut(''); setFilterAnciennete(''); setFilterScoreMin('')
    updateFilters({ rge: '', statut: '', anciennete: '', score_min: '' })
  }

  const isFiltered = filterRge || !!filterStatut || !!filterAnciennete || !!filterScoreMin

  // Launch search (used by autocomplete work-type click)
  const launchSearch = (q: string) => {
    setQueryInput(q)
    const ville = villeInput.trim()
    const isSameVille = ville === villeSelection?.label
    const cp = isSameVille && villeSelection?.type === 'commune' ? (villeSelection.codePostal || '') : ''
    const dept = isSameVille && villeSelection?.type === 'departement' ? (villeSelection.deptCode || '') : ''
    saveRecent(q, ville)
    router.push(`/recherche?${buildURL({ q, ville, cp, dept })}`)
  }

  // Select a recent search
  const handleSelectRecent = (q: string, ville: string) => {
    setQueryInput(q)
    setVilleInput(ville)
    setVilleSelection(null)
    saveRecent(q, ville)
    router.push(`/recherche?${buildURL({ q, ville, cp: '', dept: '' })}`)
  }

  // Sort results client-side
  const sortedResults = sortBy === 'anciennete'
    ? [...results].sort((a, b) => {
        if (!a.dateCreation) return 1
        if (!b.dateCreation) return -1
        return new Date(a.dateCreation).getTime() - new Date(b.dateCreation).getTime()
      })
    : results

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f7f2ea 0%, #fcfaf7 18%, #f6f8f5 100%)' }}>
      <SiteHeader />

      <section style={{ position: 'relative', overflow: 'hidden', padding: hasQuery ? '34px 24px 18px' : '40px 24px 18px' }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 18% 12%, rgba(82,183,136,0.16), transparent 26%), radial-gradient(circle at 82% 10%, rgba(255,191,143,0.22), transparent 22%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', maxWidth: '1140px', margin: '0 auto' }}>
          {!hasQuery && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.15fr) minmax(300px, 0.85fr)',
              gap: '24px',
              alignItems: 'stretch',
              marginBottom: '24px',
            }}>
              <SurfaceCard style={{ padding: '32px', background: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(251,248,243,0.9) 100%)' }}>
                <SectionBadge text="Recherche d'artisans" />
                <h1 style={{ margin: '18px 0 12px', fontSize: 'clamp(36px, 6vw, 64px)', lineHeight: 0.98, letterSpacing: '-0.05em', color: cv('text') }}>
                  Choisissez un artisan avec plus de recul, pas juste un bon feeling.
                </h1>
                <p style={{ margin: '0 0 22px', maxWidth: '620px', fontSize: '17px', lineHeight: 1.75, color: cv('text-secondary') }}>
                  Rien qui cloche transforme une recherche brute en lecture de confiance immédiate: statut, ancienneté, score, zone d&apos;intervention et points de vigilance.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {['Lecture instantanée du profil', 'Résultats triés pour décider plus vite', 'Navigation pensée mobile'].map(item => (
                    <span key={item} style={{ display: 'inline-flex', alignItems: 'center', padding: '8px 12px', borderRadius: '999px', background: 'rgba(255,255,255,0.76)', border: '1px solid rgba(226,217,204,0.9)', fontSize: '12px', fontWeight: 700, color: cv('text-secondary') }}>
                      {item}
                    </span>
                  ))}
                </div>
              </SurfaceCard>

              <SurfaceCard style={{ padding: '28px', background: 'linear-gradient(135deg, #173428 0%, #1f4737 56%, #275540 100%)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)' }}>
                <SectionBadge text="Méthode Rien qui cloche" tone="light" />
                <div style={{ marginTop: '20px', display: 'grid', gap: '14px' }}>
                  {[
                    ['1', 'Vous cherchez un métier ou un nom', 'Par activité, ville, département ou SIRET.'],
                    ['2', 'On met les bons signaux en avant', 'Statut, RGE, score, ancienneté et zone.'],
                    ['3', 'Vous ouvrez la fiche qui mérite votre attention', 'Pour comparer plus finement avant de signer.'],
                  ].map(([step, title, text]) => (
                    <div key={step} style={{ display: 'grid', gridTemplateColumns: '40px 1fr', gap: '12px', alignItems: 'start', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '14px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800 }}>{step}</div>
                      <div>
                        <p style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: '#f7fbf8' }}>{title}</p>
                        <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: 'rgba(255,255,255,0.72)' }}>{text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </SurfaceCard>
            </div>
          )}

          <div style={{ position: 'sticky', top: 0, zIndex: 10, paddingBottom: '10px' }}>
            <SurfaceCard style={{
              padding: hasQuery ? '18px' : '22px',
              background: 'rgba(255,255,255,0.82)',
              backdropFilter: 'blur(18px)',
              boxShadow: '0 18px 38px rgba(20,32,27,0.08)',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
                <div>
                  <p style={{ margin: '0 0 5px', fontSize: '12px', fontWeight: 800, color: cv('accent'), letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Moteur de confiance
                  </p>
                  <p style={{ margin: 0, fontSize: '14px', color: cv('muted') }}>
                    Recherchez, filtrez, puis ouvrez la fiche qui mérite vraiment votre temps.
                  </p>
                </div>
                {hasQuery && !loading && total > 0 && (
                  <div style={{ padding: '10px 12px', borderRadius: '16px', background: 'rgba(244,238,230,0.88)', border: '1px solid rgba(226,217,204,0.9)', fontSize: '13px', color: cv('text-secondary') }}>
                    <strong style={{ color: cv('text') }}>{total.toLocaleString('fr-FR')}</strong> profil{total > 1 ? 's' : ''} disponibles
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} style={{ marginBottom: hasQuery ? '10px' : 0 }}>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <SearchAutocomplete
                    value={queryInput}
                    onChange={v => setQueryInput(v)}
                    villeLabel={villeInput}
                    onSearch={launchSearch}
                    onSelectRecent={handleSelectRecent}
                  />
                  <VilleAutocomplete value={villeInput} onChange={handleVilleChange} onSelect={handleVilleSelect} />
                  <button
                    type="submit"
                    style={{
                      height: '52px',
                      padding: '0 24px',
                      background: 'linear-gradient(135deg, #153b2e 0%, #245845 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '16px',
                      fontSize: '15px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-body)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      transition: 'opacity 0.15s, transform 0.15s',
                      boxShadow: '0 16px 34px rgba(21,59,46,0.2)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.95'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none' }}
                  >
                    Lancer la recherche
                  </button>
                </div>
              </form>

              {hasQuery && (
                <div style={{
                  display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center',
                  marginTop: '10px', paddingTop: '12px', borderTop: `1px solid ${cv('border')}`,
                }}>
              {/* RGE */}
              <Chip
                active={filterRge}
                onClick={() => { const n = !filterRge; setFilterRge(n); updateFilters({ rge: n ? 'true' : '' }) }}
              >
                <Leaf size={12} strokeWidth={1.5} style={{ marginRight: '3px' }} />RGE
              </Chip>

              {/* Statut */}
              <Chip
                active={filterStatut === 'A'}
                onClick={() => { const n = filterStatut === 'A' ? '' : 'A'; setFilterStatut(n); updateFilters({ statut: n }) }}
              >
                ● Actifs
              </Chip>

              {/* Ancienneté */}
              <select
                value={filterAnciennete}
                onChange={e => { setFilterAnciennete(e.target.value); updateFilters({ anciennete: e.target.value }) }}
                style={{
                  padding: '4px 10px', borderRadius: '20px',
                  border: `1px solid ${filterAnciennete ? cv('accent') : cv('border')}`,
                  background: filterAnciennete ? '#ecfdf5' : 'transparent',
                  color: filterAnciennete ? cv('accent') : cv('muted'),
                  fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'var(--font-body)', outline: 'none',
                }}
              >
                <option value="">Ancienneté ▾</option>
                <option value="2">+ 2 ans</option>
                <option value="5">+ 5 ans</option>
                <option value="10">+ 10 ans</option>
              </select>

              {/* Score min */}
              <select
                value={filterScoreMin}
                onChange={e => { setFilterScoreMin(e.target.value); updateFilters({ score_min: e.target.value }) }}
                style={{
                  padding: '4px 10px', borderRadius: '20px',
                  border: `1px solid ${filterScoreMin ? cv('accent') : cv('border')}`,
                  background: filterScoreMin ? '#ecfdf5' : 'transparent',
                  color: filterScoreMin ? cv('accent') : cv('muted'),
                  fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'var(--font-body)', outline: 'none',
                }}
              >
                <option value="">Score ▾</option>
                <option value="50">Score ≥ 50</option>
                <option value="70">Score ≥ 70</option>
                <option value="85">Score ≥ 85</option>
              </select>

              {/* Rayon */}
              {villeSelection && (
                <select
                  value={rayon}
                  onChange={e => { setRayon(e.target.value); updateFilters({ rayon: e.target.value }) }}
                  style={{
                    padding: '4px 10px', borderRadius: '20px',
                    border: `1px solid ${cv('border')}`,
                    background: 'transparent', color: cv('muted'),
                    fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'var(--font-body)', outline: 'none',
                  }}
                >
                  {RAYON_OPTIONS.map(r => <option key={r.v} value={r.v}>Rayon {r.label} ▾</option>)}
                </select>
              )}

              {/* Reset */}
              {isFiltered && (
                <button
                  type="button"
                  onClick={resetFilters}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '4px 10px', borderRadius: '20px',
                    border: `1px solid ${cv('border')}`, background: 'transparent',
                    color: cv('muted'), fontSize: '12px', fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'var(--font-body)',
                    transition: 'background 0.15s ease, color 0.15s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = cv('text') }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = cv('muted') }}
                >
                  <X size={12} /> Réinitialiser
                </button>
              )}
                </div>
              )}
            </SurfaceCard>
          </div>
        </div>
      </section>

      {/* ── Results section ── */}
      <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '8px 24px 80px' }}>

        {/* Initial state */}
        {!hasQuery && !loading && (
          <div style={{ padding: '18px 0 80px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '18px' }}>
              <div>
                <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 800, color: cv('accent'), letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Démarrer rapidement
                </p>
                <h2 style={{ margin: 0, fontSize: 'clamp(24px, 4vw, 34px)', lineHeight: 1.08, letterSpacing: '-0.04em', color: cv('text') }}>
                  Les recherches qui lancent le plus souvent un parcours de décision.
                </h2>
              </div>
              <div style={{ maxWidth: '340px', fontSize: '14px', lineHeight: 1.7, color: cv('text-secondary') }}>
                Des entrées simples pour tester le moteur, puis affiner par statut, score minimal ou ancienneté.
              </div>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '14px',
              marginBottom: '28px',
            }}>
              {QUICK_ACTIONS.map((action) => { const { label, kw } = action; return (
                <button
                  key={kw}
                  type="button"
                  onClick={() => {
                    setQueryInput(kw)
                    const url = buildURL({ q: kw })
                    router.push(`/recherche?${url}`)
                  }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between',
                    gap: '20px', padding: '22px 20px',
                    minHeight: '156px',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(247,243,237,0.92) 100%)',
                    border: '1px solid rgba(220,208,193,0.9)',
                    borderRadius: '26px', cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.1s',
                    fontFamily: 'var(--font-body)',
                    boxShadow: '0 18px 34px rgba(20,32,27,0.05)',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget
                    el.style.borderColor = 'rgba(21,59,46,0.32)'
                    el.style.boxShadow = '0 24px 44px rgba(21,59,46,0.11)'
                    el.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget
                    el.style.borderColor = 'rgba(220,208,193,0.9)'
                    el.style.boxShadow = '0 18px 34px rgba(20,32,27,0.05)'
                    el.style.transform = 'none'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '54px', height: '54px', borderRadius: '18px', color: cv('accent'), background: 'rgba(82,183,136,0.12)' }}>
                    {(() => { const Ic = action.Icon as React.ComponentType<{ size: number; strokeWidth: number }>; return <Ic size={28} strokeWidth={1.5} /> })()}
                  </span>
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ display: 'block', fontSize: '16px', fontWeight: 700, color: cv('text'), marginBottom: '4px' }}>{label}</span>
                    <span style={{ display: 'block', fontSize: '13px', color: cv('muted'), lineHeight: 1.6 }}>Lancer une recherche préremplie et consulter les profils les plus solides.</span>
                  </div>
                </button>
              )})}

            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: cv('muted'), flexShrink: 0, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Exemples populaires</span>
              {POPULAR.map((p, i) => (
                <span key={p.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {i > 0 && <span style={{ color: cv('border') }}>·</span>}
                  <button
                    type="button"
                    onClick={() => {
                      setQueryInput(p.kw); setVilleInput(p.ville); setVilleSelection(null)
                      router.push(`/recherche?${buildURL({ q: p.kw, ville: p.ville, cp: '', dept: '' })}`)
                    }}
                    style={{
                      background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                      fontSize: '12px', color: cv('muted'), fontFamily: 'var(--font-body)',
                      textDecoration: 'underline', textDecorationColor: 'transparent',
                      transition: 'color 0.12s, text-decoration-color 0.12s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color = cv('accent')
                      e.currentTarget.style.textDecorationColor = cv('accent')
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = cv('muted')
                      e.currentTarget.style.textDecorationColor = 'transparent'
                    }}
                  >
                    {p.label}
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
        )}

        {/* Error state */}
        {hasError && !loading && (
          <div style={{ textAlign: 'center', padding: '56px 16px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px', display: 'flex', justifyContent: 'center' }}><AlertTriangle size={40} strokeWidth={1} /></div>
            <p style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 600, color: cv('text') }}>
              Impossible de charger les résultats
            </p>
            <p style={{ margin: '0 0 24px', fontSize: '14px', color: cv('muted') }}>
              Vérifiez votre connexion et réessayez.
            </p>
            <button
              type="button"
              onClick={() => setRetryKey(k => k + 1)}
              style={{
                padding: '10px 24px', borderRadius: '12px',
                background: cv('accent'), color: 'white', border: 'none',
                fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#2D6A4F'}
              onMouseLeave={e => e.currentTarget.style.background = cv('accent')}
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Results list */}
        {!loading && !hasError && sortedResults.length > 0 && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <div>
                <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 800, color: cv('accent'), letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Résultats
                </p>
                <h2 style={{ margin: 0, fontSize: 'clamp(24px, 4vw, 34px)', lineHeight: 1.05, letterSpacing: '-0.04em', color: cv('text') }}>
                  Des profils présentés pour décider vite, pas pour tout relire.
                </h2>
              </div>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortBy)}
                style={{
                  padding: '10px 14px', borderRadius: '16px',
                  border: `1px solid ${cv('border')}`, background: 'rgba(255,255,255,0.86)',
                  color: cv('muted'), fontSize: '13px', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'var(--font-body)', outline: 'none',
                }}
              >
                <option value="pertinence">Trier : Pertinence</option>
                <option value="anciennete">Trier : Ancienneté</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {sortedResults.map(c => <CandidateCard key={c.siret} c={c} />)}
            </div>

            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: '28px' }}>
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  style={{
                    padding: '12px 36px', borderRadius: '12px',
                    border: `1px solid ${cv('border')}`,
                    background: loadingMore ? '#f9fafb' : 'white',
                    color: loadingMore ? cv('muted') : cv('text'),
                    fontSize: '14px', fontWeight: 600,
                    cursor: loadingMore ? 'default' : 'pointer',
                    fontFamily: 'var(--font-body)', transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => { if (!loadingMore) e.currentTarget.style.borderColor = cv('accent') }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = cv('border') }}
                >
                  {loadingMore ? 'Chargement…' : 'Charger plus de résultats'}
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty state */}
        {!loading && !hasError && hasQuery && results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '56px 16px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px', display: 'flex', justifyContent: 'center' }}><Search size={40} strokeWidth={1} /></div>
            <p style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 600, color: cv('text') }}>
              Aucun artisan trouvé pour cette recherche
            </p>
            <p style={{ margin: '0 0 24px', fontSize: '14px', color: cv('muted') }}>
              Essayez avec le SIRET directement ou élargissez votre zone de recherche.
            </p>
            <button
              type="button"
              onClick={() => {
                setVilleInput(''); setVilleSelection(null)
                router.push(`/recherche?${buildURL({ ville: '', cp: '', dept: '' })}`)
              }}
              style={{
                padding: '10px 24px', borderRadius: '12px',
                border: `1px solid ${cv('accent')}`, background: 'white',
                color: cv('accent'), fontSize: '14px', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'var(--font-body)',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#ecfdf5'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}
            >
              Élargir la recherche
            </button>
          </div>
        )}
      </div>

      <style>{`
        .skeleton {
          background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </main>
  )
}

/* ─── Page wrapper with Suspense ─────────────────────────────── */
export default function RecherchePage() {
  return (
    <Suspense fallback={
      <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid var(--color-border)', borderTopColor: '#1B4332' }} />
        </div>
      </main>
    }>
      <RechercheInner />
    </Suspense>
  )
}
