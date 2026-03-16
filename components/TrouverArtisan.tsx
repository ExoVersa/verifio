'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Search, MapPin, ChevronDown, ShieldCheck, AlertTriangle,
  ExternalLink, Loader2, Filter, ArrowLeftRight, Calendar,
  Building2, Zap, Star, SlidersHorizontal,
} from 'lucide-react'
import { NAF_LABELS, TYPE_TO_NAF } from '@/app/api/trouver-artisan/route'

const WORK_TYPES = [
  { value: 'isolation',     label: 'Isolation (combles, murs)' },
  { value: 'toiture',       label: 'Toiture / Couverture' },
  { value: 'plomberie',     label: 'Plomberie' },
  { value: 'electricite',   label: 'Électricité' },
  { value: 'chauffage',     label: 'Chauffage / Chaudière' },
  { value: 'pac',           label: 'Pompe à chaleur' },
  { value: 'photovoltaique',label: 'Panneaux solaires' },
  { value: 'fenetres',      label: 'Fenêtres / Menuiseries' },
  { value: 'salle-de-bain', label: 'Salle de bain' },
  { value: 'cuisine',       label: 'Cuisine' },
  { value: 'carrelage',     label: 'Carrelage / Sol' },
  { value: 'peinture',      label: 'Peinture / Décoration' },
  { value: 'maconnerie',    label: 'Maçonnerie / Gros œuvre' },
  { value: 'extension',     label: 'Extension / Agrandissement' },
]

interface Commune {
  nom: string
  code: string
  codesPostaux: string[]
}

interface ArtisanResult {
  siret: string
  siren: string
  nom: string
  formeJuridique: string
  activitePrincipale: string
  activiteLabel: string
  dateCreation: string
  adresse: string
  codePostal: string
  ville: string
  rge: boolean
  rgeQualifications: string[]
  lat?: number
  lon?: number
  effectif?: string
  score?: number
  scoreLoading?: boolean
}

interface TrouverArtisanProps {
  initialType?: string
  initialVille?: string
  initialCodePostal?: string
}

function getMaturite(dateCreation: string): { label: string; color: string; bg: string } {
  if (!dateCreation) return { label: '', color: '', bg: '' }
  const years = (Date.now() - new Date(dateCreation).getTime()) / (1000 * 60 * 60 * 24 * 365)
  if (years < 2) return { label: 'Nouvelle', color: '#dc2626', bg: '#fef2f2' }
  if (years < 5) return { label: 'Jeune', color: '#d97706', bg: '#fffbeb' }
  if (years < 10) return { label: 'Confirmée', color: '#0369a1', bg: '#eff6ff' }
  return { label: 'Établie', color: '#16a34a', bg: '#f0fdf4' }
}

function ScoreBadge({ score, loading }: { score?: number; loading?: boolean }) {
  if (loading) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '20px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', fontSize: '11px', color: 'var(--color-muted)' }}>
        <Loader2 size={9} style={{ animation: 'spin 1s linear infinite' }} />
        Score…
      </span>
    )
  }
  if (score === undefined || score === null) return null
  const color = score >= 70 ? '#16a34a' : score >= 45 ? '#d97706' : '#dc2626'
  const bg = score >= 70 ? '#f0fdf4' : score >= 45 ? '#fffbeb' : '#fef2f2'
  const border = score >= 70 ? '#bbf7d0' : score >= 45 ? '#fde68a' : '#fecaca'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 7px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: bg, border: `1px solid ${border}`, color }}>
      <Star size={9} fill={color} color={color} />
      {score}/100
    </span>
  )
}

function ArtisanCard({ artisan }: { artisan: ArtisanResult }) {
  const maturite = getMaturite(artisan.dateCreation)

  return (
    <div style={{
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderRadius: '12px', padding: '16px 16px 14px',
      borderLeft: artisan.rge ? '3px solid #16a34a' : undefined,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
        {/* Left: main info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name + badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '5px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.3 }}>
              {artisan.nom}
            </h3>
            {artisan.rge && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '1px 6px', borderRadius: '20px', background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: '10px', fontWeight: 700, color: '#16a34a', flexShrink: 0 }}>
                <ShieldCheck size={9} />RGE
              </span>
            )}
            {artisan.formeJuridique && (
              <span style={{ padding: '1px 6px', borderRadius: '20px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', fontSize: '10px', color: 'var(--color-muted)', flexShrink: 0 }}>
                {artisan.formeJuridique}
              </span>
            )}
          </div>

          {/* Activity + maturité */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
            {artisan.activiteLabel && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '12px', color: 'var(--color-accent)', fontWeight: 600 }}>
                <Zap size={10} />
                {artisan.activiteLabel}
              </span>
            )}
            {maturite.label && (
              <span style={{ padding: '1px 7px', borderRadius: '20px', background: maturite.bg, fontSize: '10px', fontWeight: 600, color: maturite.color }}>
                {maturite.label}
                {artisan.dateCreation ? ` · ${new Date(artisan.dateCreation).getFullYear()}` : ''}
              </span>
            )}
            {artisan.effectif && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: 'var(--color-muted)' }}>
                <Building2 size={9} />
                {artisan.effectif}
              </span>
            )}
          </div>

          {/* Address */}
          {(artisan.adresse || artisan.ville) && (
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)', lineHeight: 1.4 }}>
              <MapPin size={10} style={{ verticalAlign: 'middle', marginRight: '3px' }} />
              {artisan.adresse ? `${artisan.adresse}` : ''}{artisan.adresse && artisan.ville ? ' — ' : ''}{artisan.ville}
            </p>
          )}

          {artisan.siret && (
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--color-muted)' }}>
              SIRET : {artisan.siret}
            </p>
          )}
        </div>

        {/* Right: score + actions */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
          <ScoreBadge score={artisan.score} loading={artisan.scoreLoading} />
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <a
              href={`/?q=${artisan.siret || artisan.siren}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '5px 10px', borderRadius: '7px',
                border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                color: 'var(--color-text)', fontSize: '12px', fontWeight: 600,
                textDecoration: 'none', whiteSpace: 'nowrap',
              }}
            >
              <ExternalLink size={10} />
              Fiche
            </a>
            <a
              href={`/comparer?q=${artisan.siret || artisan.siren}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '5px 10px', borderRadius: '7px',
                border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                color: 'var(--color-muted)', fontSize: '12px', fontWeight: 600,
                textDecoration: 'none', whiteSpace: 'nowrap',
              }}
            >
              <ArrowLeftRight size={10} />
              Comparer
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TrouverArtisan({ initialType = '', initialVille = '', initialCodePostal = '' }: TrouverArtisanProps) {
  const [type, setType] = useState(initialType)
  const [ville, setVille] = useState(initialVille)
  const [codePostal, setCodePostal] = useState(initialCodePostal)
  const [codeCommune, setCodeCommune] = useState('') // INSEE code (e.g. "37018"), resolved from commune name
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const [rayon, setRayon] = useState(20)
  const [rgeOnly, setRgeOnly] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ArtisanResult[]>([])
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [rgeCount, setRgeCount] = useState(0)
  const [communeSuggestions, setCommuneSuggestions] = useState<Commune[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [sortBy, setSortBy] = useState<'score' | 'anciennete' | 'pertinence'>('score')
  const [minScore, setMinScore] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (initialCodePostal) {
      // CP already resolved (SSG slug pages or ?cp= param) — resolve INSEE code server-side
      handleSearch(initialCodePostal)
    } else if (initialVille) {
      // Resolve ville name → INSEE code + postal code then search
      const isCP = /^\d{5}$/.test(initialVille.trim())
      if (isCP) {
        setCodePostal(initialVille.trim())
        handleSearch(initialVille.trim())
      } else {
        fetch(`https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(initialVille)}&fields=nom,code,codesPostaux&limit=1&boost=population`)
          .then(r => r.json())
          .then((data: Commune[]) => {
            if (data[0]) {
              const cp = data[0].codesPostaux?.[0] || ''
              const cc = data[0].code // INSEE code (e.g. "37018")
              setCodePostal(cp)
              setCodeCommune(cc)
              setVille(data[0].nom)
              // Get coordinates too
              fetch(`https://geo.api.gouv.fr/communes/${cc}?fields=centre`)
                .then(r => r.json())
                .then(d => {
                  if (d.centre?.coordinates) {
                    setLon(String(d.centre.coordinates[0]))
                    setLat(String(d.centre.coordinates[1]))
                  }
                })
                .catch(() => {})
              handleSearch(cp, cc) // pass both CP and INSEE code
            }
          })
          .catch(() => {})
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchCommunes = useCallback(async (query: string) => {
    if (query.length < 2) { setCommuneSuggestions([]); return }
    try {
      const res = await fetch(`https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(query)}&fields=nom,code,codesPostaux&limit=6&boost=population`)
      if (!res.ok) return
      const data: Commune[] = await res.json()
      setCommuneSuggestions(data)
      setShowSuggestions(true)
    } catch { /* ignore */ }
  }, [])

  const handleVilleChange = (val: string) => {
    setVille(val)
    setLat('')
    setLon('')
    setCodeCommune('') // Reset INSEE code when user starts typing
    if (/^\d{5}$/.test(val.trim())) {
      setCodePostal(val.trim())
      setCommuneSuggestions([])
      setShowSuggestions(false)
    } else {
      setCodePostal('')
      fetchCommunes(val)
    }
  }

  const selectCommune = (commune: Commune) => {
    const cp = commune.codesPostaux?.[0] || ''
    setVille(commune.nom)
    setCodePostal(cp)
    setCodeCommune(commune.code) // Store INSEE code
    setShowSuggestions(false)
    fetch(`https://geo.api.gouv.fr/communes/${commune.code}?fields=centre`)
      .then(r => r.json())
      .then(d => {
        if (d.centre?.coordinates) {
          setLon(String(d.centre.coordinates[0]))
          setLat(String(d.centre.coordinates[1]))
        }
      })
      .catch(() => {})
  }

  const loadScores = async (artisans: ArtisanResult[]) => {
    const eligible = artisans.map(a =>
      (a.siret || a.siren) ? { ...a, scoreLoading: true } : a
    )
    setResults(eligible)

    const working = [...eligible]
    const batchSize = 3
    // Cap at 20 to avoid too many API calls
    const limit = Math.min(working.length, 20)

    for (let i = 0; i < limit; i += batchSize) {
      const batch = working.slice(i, i + batchSize)
      await Promise.all(batch.map(async (artisan, idx) => {
        const id = artisan.siret || artisan.siren
        if (!id) return
        try {
          const res = await fetch(`/api/search?q=${id}`)
          if (res.ok) {
            const data = await res.json()
            const score = data.score ?? data.result?.score ?? null
            working[i + idx] = { ...working[i + idx], score, scoreLoading: false }
          } else {
            working[i + idx] = { ...working[i + idx], scoreLoading: false }
          }
        } catch {
          working[i + idx] = { ...working[i + idx], scoreLoading: false }
        }
      }))
      setResults([...working])
    }
    // Mark remaining (>20) as not loading
    for (let i = limit; i < working.length; i++) {
      working[i] = { ...working[i], scoreLoading: false }
    }
    setResults([...working])
  }

  const handleSearch = async (cpOverride?: string, communeOverride?: string) => {
    const cp = cpOverride || codePostal
    const cc = communeOverride || codeCommune
    if (!cp && !cc) return
    setLoading(true)
    setError(null)
    setSearched(true)
    setResults([])
    setTotalCount(0)
    setRgeCount(0)

    try {
      const params = new URLSearchParams({
        rayon: String(rayon),
        rgeOnly: rgeOnly ? '1' : '0',
      })
      if (cp) params.set('codePostal', cp)
      if (cc) params.set('codeCommune', cc) // INSEE code — preferred
      if (type) params.set('type', type)
      if (lat) params.set('lat', lat)
      if (lon) params.set('lon', lon)

      const res = await fetch(`/api/trouver-artisan?${params}`)
      if (!res.ok) throw new Error('Erreur serveur')
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      const artisans: ArtisanResult[] = data.results || []
      setTotalCount(data.total || artisans.length)
      setRgeCount(data.rgeCount || artisans.filter((a: ArtisanResult) => a.rge).length)
      setResults(artisans)
      if (artisans.length > 0) {
        loadScores(artisans)
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la recherche')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!codeCommune || !codePostal) {
      // Resolve city name → INSEE code + postal code
      const query = ville.trim()
      if (!query) return
      try {
        const res = await fetch(`https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(query)}&fields=nom,code,codesPostaux&limit=1&boost=population`)
        const data: Commune[] = await res.json()
        if (data[0]) {
          const cp = data[0].codesPostaux?.[0] || ''
          const cc = data[0].code // INSEE code
          setCodePostal(cp)
          setCodeCommune(cc)
          setVille(data[0].nom)
          fetch(`https://geo.api.gouv.fr/communes/${cc}?fields=centre`)
            .then(r => r.json())
            .then(d => {
              if (d.centre?.coordinates) {
                setLon(String(d.centre.coordinates[0]))
                setLat(String(d.centre.coordinates[1]))
              }
            })
            .catch(() => {})
          handleSearch(cp, cc)
        }
      } catch { /* ignore */ }
      return
    }
    handleSearch()
  }

  // Client-side filtering
  const filteredResults = results.filter(r => {
    if (rgeOnly && !r.rge) return false
    if (minScore > 0 && r.score !== undefined && r.score !== null && r.score < minScore) return false
    return true
  })

  // Sorting
  const sortedResults = [...filteredResults].sort((a, b) => {
    if (sortBy === 'score') {
      // RGE first, then by score
      if (a.rge && !b.rge) return -1
      if (!a.rge && b.rge) return 1
      const sa = a.score ?? -1
      const sb = b.score ?? -1
      return sb - sa
    }
    if (sortBy === 'anciennete') {
      const da = a.dateCreation ? new Date(a.dateCreation).getTime() : 0
      const db = b.dateCreation ? new Date(b.dateCreation).getTime() : 0
      return da - db // oldest first = most established
    }
    return 0 // pertinence = API order
  })

  const displayRgeCount = filteredResults.filter(r => r.rge).length
  const typeLabel = WORK_TYPES.find(t => t.value === type)?.label || ''

  // OSM map
  const mapUrl = lat && lon
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(lon) - 0.12},${parseFloat(lat) - 0.09},${parseFloat(lon) + 0.12},${parseFloat(lat) + 0.09}&layer=mapnik`
    : null

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 16px 60px' }}>

      {/* HEADER */}
      <div style={{ padding: '32px 0 24px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)', border: '1px solid var(--color-border)', marginBottom: '16px' }}>
          <MapPin size={22} color="var(--color-accent)" />
        </div>
        <h1 className="font-display" style={{ margin: '0 0 8px', fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 800, letterSpacing: '-0.02em' }}>
          Trouver un artisan
        </h1>
        <p style={{ margin: '0 auto', fontSize: '15px', color: 'var(--color-muted)', lineHeight: 1.6, maxWidth: '520px' }}>
          Tous les artisans du bâtiment actifs près de chez vous — avec badge RGE et score de confiance.
        </p>
      </div>

      {/* SEARCH FORM */}
      <form onSubmit={handleSubmit} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '20px', marginBottom: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'end' }}>

          {/* Type */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
              Type de travaux
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                style={{ width: '100%', padding: '10px 28px 10px 12px', borderRadius: '10px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: '14px', fontFamily: 'var(--font-body)', appearance: 'none', cursor: 'pointer', outline: 'none' }}
              >
                <option value="">Tous types</option>
                {WORK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <ChevronDown size={14} color="var(--color-muted)" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Ville */}
          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
              Ville ou code postal
            </label>
            <div style={{ position: 'relative' }}>
              <MapPin size={14} color="var(--color-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="text"
                value={ville}
                onChange={e => handleVilleChange(e.target.value)}
                placeholder="Paris, Lyon, 75011…"
                required
                style={{ width: '100%', padding: '10px 12px 10px 30px', borderRadius: '10px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: '14px', fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            {showSuggestions && communeSuggestions.length > 0 && (
              <div ref={suggestionsRef} style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.10)', marginTop: '4px', overflow: 'hidden' }}>
                {communeSuggestions.map(c => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => selectCommune(c)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 12px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <MapPin size={12} color="var(--color-muted)" />
                    <span style={{ fontSize: '13px', color: 'var(--color-text)', fontWeight: 500 }}>{c.nom}</span>
                    <span style={{ fontSize: '12px', color: 'var(--color-muted)', marginLeft: 'auto' }}>{c.codesPostaux?.[0]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search button */}
          <button
            type="submit"
            disabled={loading || !ville}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', border: 'none', background: (!loading && ville) ? 'var(--color-accent)' : 'var(--color-border)', color: '#fff', fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-body)', cursor: (!loading && ville) ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap', minWidth: '130px', height: '42px' }}
          >
            {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={16} />}
            {loading ? 'Recherche…' : 'Rechercher'}
          </button>
        </div>

        {/* Options */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '14px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-muted)', fontWeight: 600 }}>Rayon :</span>
            {[10, 20, 50].map(r => (
              <button key={r} type="button" onClick={() => setRayon(r)} style={{ padding: '3px 10px', borderRadius: '20px', border: '1px solid', borderColor: rayon === r ? 'var(--color-accent)' : 'var(--color-border)', background: rayon === r ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)' : 'transparent', color: rayon === r ? 'var(--color-accent)' : 'var(--color-muted)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                {r} km
              </button>
            ))}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-muted)', cursor: 'pointer' }}>
            <input type="checkbox" checked={rgeOnly} onChange={e => setRgeOnly(e.target.checked)} style={{ accentColor: '#16a34a' }} />
            <ShieldCheck size={13} color="#16a34a" />
            RGE certifiés uniquement
          </label>
        </div>
      </form>

      {/* RESULTS */}
      {searched && (
        <>
          {/* Counter + sort bar */}
          {!loading && sortedResults.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', gap: '8px', flexWrap: 'wrap' }}>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-muted)', fontWeight: 500 }}>
                <strong style={{ color: 'var(--color-text)', fontWeight: 700 }}>{sortedResults.length} artisan{sortedResults.length > 1 ? 's' : ''}</strong>
                {typeLabel ? ` · ${typeLabel}` : ''}
                {ville ? ` · ${ville}` : ''}
                {displayRgeCount > 0 && (
                  <> dont{' '}
                    <span style={{ color: '#16a34a', fontWeight: 700 }}>{displayRgeCount} certifié{displayRgeCount > 1 ? 's' : ''} RGE</span>
                  </>
                )}
              </p>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-muted)', fontWeight: 600 }}>Trier :</span>
                {([['score', 'Score'], ['anciennete', 'Ancienneté'], ['pertinence', 'Pertinence']] as const).map(([val, lbl]) => (
                  <button key={val} onClick={() => setSortBy(val)} style={{ padding: '3px 8px', borderRadius: '6px', border: '1px solid', borderColor: sortBy === val ? 'var(--color-accent)' : 'var(--color-border)', background: sortBy === val ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)' : 'transparent', color: sortBy === val ? 'var(--color-accent)' : 'var(--color-muted)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                    {lbl}
                  </button>
                ))}
                <button onClick={() => setShowFilters(f => !f)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '6px', border: '1px solid var(--color-border)', background: showFilters ? 'var(--color-bg)' : 'transparent', color: 'var(--color-muted)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  <SlidersHorizontal size={11} />Filtres
                </button>
              </div>
            </div>
          )}

          {/* Filter panel */}
          {showFilters && (
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '14px 16px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-muted)' }}>
                Score minimum :
                <select value={minScore} onChange={e => setMinScore(Number(e.target.value))} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: '13px', fontFamily: 'var(--font-body)' }}>
                  <option value={0}>Tous</option>
                  <option value={45}>≥ 45</option>
                  <option value={70}>≥ 70 (Fiable)</option>
                  <option value={85}>≥ 85 (Excellent)</option>
                </select>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-muted)', cursor: 'pointer' }}>
                <input type="checkbox" checked={rgeOnly} onChange={e => setRgeOnly(e.target.checked)} style={{ accentColor: '#16a34a' }} />
                RGE uniquement
              </label>
            </div>
          )}

          {/* Map */}
          {mapUrl && sortedResults.length > 0 && (
            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--color-border)', marginBottom: '18px', height: '200px' }}>
              <iframe src={mapUrl} width="100%" height="200" style={{ border: 'none', display: 'block' }} title={`Carte artisans ${ville}`} loading="lazy" />
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-muted)' }}>
              <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} color="var(--color-accent)" />
              <p style={{ margin: 0, fontSize: '14px' }}>Recherche en cours…</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ padding: '14px 16px', borderRadius: '10px', background: 'var(--color-danger-bg)', border: '1px solid color-mix(in srgb, var(--color-danger) 30%, transparent)', fontSize: '14px', color: 'var(--color-danger)', marginBottom: '16px' }}>
              <AlertTriangle size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />{error}
            </div>
          )}

          {/* No results */}
          {!loading && !error && sortedResults.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <p style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</p>
              <p style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>Aucun artisan trouvé</p>
              <p style={{ fontSize: '14px', color: 'var(--color-muted)' }}>Essayez d&apos;élargir le rayon ou de décocher «&nbsp;RGE uniquement&nbsp;».</p>
            </div>
          )}

          {/* Results list */}
          {!loading && sortedResults.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sortedResults.map((artisan) => (
                <ArtisanCard key={artisan.siret || artisan.siren} artisan={artisan} />
              ))}
              {totalCount > sortedResults.length && (
                <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--color-muted)', margin: '8px 0 0', padding: '12px' }}>
                  Affichage des {sortedResults.length} premiers artisans trouvés dans votre zone.
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!searched && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-muted)' }}>
          <p style={{ fontSize: '40px', marginBottom: '16px' }}>🏗️</p>
          <p style={{ fontSize: '14px', lineHeight: 1.6 }}>
            Renseignez votre ville pour trouver tous les artisans du bâtiment actifs près de chez vous.
          </p>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
