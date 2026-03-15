'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, MapPin, ChevronDown, SlidersHorizontal, Star, ShieldCheck, AlertTriangle, ExternalLink, Loader2, Filter } from 'lucide-react'

const WORK_TYPES = [
  { value: 'isolation', label: 'Isolation (combles, murs)' },
  { value: 'toiture', label: 'Toiture / Couverture' },
  { value: 'plomberie', label: 'Plomberie' },
  { value: 'electricite', label: 'Électricité' },
  { value: 'chauffage', label: 'Chauffage / Chaudière' },
  { value: 'pac', label: 'Pompe à chaleur' },
  { value: 'photovoltaique', label: 'Panneaux solaires' },
  { value: 'fenetres', label: 'Fenêtres / Menuiseries' },
  { value: 'salle-de-bain', label: 'Salle de bain' },
  { value: 'cuisine', label: 'Cuisine' },
  { value: 'carrelage', label: 'Carrelage / Sol' },
  { value: 'peinture', label: 'Peinture / Décoration' },
  { value: 'maconnerie', label: 'Maçonnerie / Gros œuvre' },
  { value: 'extension', label: 'Extension / Agrandissement' },
]

interface Commune {
  nom: string
  code: string
  codesPostaux: string[]
}

interface ArtisanResult {
  siret: string
  nom: string
  adresse: string
  codePostal: string
  ville: string
  rge: boolean
  domaines: string[]
  qualifications: string[]
  lat?: number
  lon?: number
  score?: number
  scoreLoading?: boolean
}

interface TrouverArtisanProps {
  initialType?: string
  initialVille?: string
  initialCodePostal?: string
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? '#16a34a' : score >= 45 ? '#d97706' : '#dc2626'
  const bg = score >= 70 ? '#f0fdf4' : score >= 45 ? '#fffbeb' : '#fef2f2'
  const border = score >= 70 ? '#bbf7d0' : score >= 45 ? '#fde68a' : '#fecaca'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '2px 8px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
      background: bg, border: `1px solid ${border}`, color,
    }}>
      <Star size={10} fill={color} color={color} />
      {score}/100
    </span>
  )
}

export default function TrouverArtisan({ initialType = '', initialVille = '', initialCodePostal = '' }: TrouverArtisanProps) {
  const [type, setType] = useState(initialType)
  const [ville, setVille] = useState(initialVille)
  const [codePostal, setCodePostal] = useState(initialCodePostal)
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const [rayon, setRayon] = useState(20)
  const [rgeOnly, setRgeOnly] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ArtisanResult[]>([])
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [communeSuggestions, setCommuneSuggestions] = useState<Commune[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [sortBy, setSortBy] = useState<'score' | 'rge' | 'nom'>('rge')
  const [minScore, setMinScore] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const villeInputRef = useRef<HTMLInputElement>(null)
  const scoreTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-search if initial params provided
  useEffect(() => {
    if (initialType && initialCodePostal) {
      handleSearch()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Close suggestions on outside click
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
      const url = `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(query)}&fields=nom,code,codesPostaux&limit=6&boost=population`
      const res = await fetch(url)
      if (!res.ok) return
      const data: Commune[] = await res.json()
      setCommuneSuggestions(data)
      setShowSuggestions(true)
    } catch {
      // ignore
    }
  }, [])

  const handleVilleChange = (val: string) => {
    setVille(val)
    setLat('')
    setLon('')
    // If user typed a postal code directly (5 digits), use it immediately
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
    setVille(commune.nom)
    setCodePostal(commune.codesPostaux?.[0] || commune.code)
    setShowSuggestions(false)
    // Try to get coordinates
    fetch(`https://geo.api.gouv.fr/communes/${commune.code}?fields=centre`)
      .then(r => r.json())
      .then(data => {
        if (data.centre?.coordinates) {
          setLon(String(data.centre.coordinates[0]))
          setLat(String(data.centre.coordinates[1]))
        }
      })
      .catch(() => {})
  }

  const loadScores = async (artisans: ArtisanResult[]) => {
    // Mark all as loading
    const withLoading = artisans.map(a =>
      a.siret && a.siret.length >= 9 ? { ...a, scoreLoading: true } : a
    )
    setResults(withLoading)

    // Load in batches of 3
    const batchSize = 3
    const working = [...withLoading]
    for (let i = 0; i < working.length; i += batchSize) {
      const batch = working.slice(i, i + batchSize)
      await Promise.all(batch.map(async (artisan, idx) => {
        if (!artisan.siret || artisan.siret.length < 9) return
        try {
          const res = await fetch(`/api/search?q=${artisan.siret}`)
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
  }

  const handleSearch = async (cpOverride?: string) => {
    const cp = cpOverride || codePostal
    if (!type || !cp) return
    setLoading(true)
    setError(null)
    setSearched(true)
    setResults([])

    try {
      const params = new URLSearchParams({
        type,
        codePostal: cp,
        rayon: String(rayon),
        rgeOnly: rgeOnly ? '1' : '0',
      })
      if (lat) params.set('lat', lat)
      if (lon) params.set('lon', lon)

      const res = await fetch(`/api/trouver-artisan?${params}`)
      if (!res.ok) throw new Error('Erreur serveur')
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      const artisans: ArtisanResult[] = data.results || []
      setResults(artisans)
      // Load scores progressively
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
    if (!codePostal && ville) {
      // Auto-resolve commune name → code postal before searching
      try {
        const res = await fetch(`https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(ville)}&fields=nom,code,codesPostaux&limit=1&boost=population`)
        const data: Commune[] = await res.json()
        if (data[0]) {
          const cp = data[0].codesPostaux?.[0] || data[0].code
          setCodePostal(cp)
          setVille(data[0].nom)
          // Fetch coordinates too
          fetch(`https://geo.api.gouv.fr/communes/${data[0].code}?fields=centre`)
            .then(r => r.json())
            .then(d => {
              if (d.centre?.coordinates) {
                setLon(String(d.centre.coordinates[0]))
                setLat(String(d.centre.coordinates[1]))
              }
            })
            .catch(() => {})
          handleSearch(cp)
        }
      } catch {
        // ignore, handleSearch will show error
      }
      return
    }
    handleSearch()
  }

  const sortedResults = [...results].filter(r => {
    if (rgeOnly && !r.rge) return false
    if (minScore > 0 && r.score !== undefined && r.score < minScore) return false
    return true
  }).sort((a, b) => {
    if (sortBy === 'score') return (b.score ?? 0) - (a.score ?? 0)
    if (sortBy === 'rge') {
      if (a.rge && !b.rge) return -1
      if (!a.rge && b.rge) return 1
      return (b.score ?? 0) - (a.score ?? 0)
    }
    return a.nom.localeCompare(b.nom)
  })

  const rgeCount = results.filter(r => r.rge).length

  // Build OSM map URL from first results with coordinates
  const mapCenter = lat && lon ? { lat: parseFloat(lat), lon: parseFloat(lon) } : null
  const mapUrl = mapCenter
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${mapCenter.lon - 0.15},${mapCenter.lat - 0.12},${mapCenter.lon + 0.15},${mapCenter.lat + 0.12}&layer=mapnik`
    : null

  const typeLabel = WORK_TYPES.find(t => t.value === type)?.label || type

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 16px 60px' }}>

      {/* HEADER */}
      <div style={{ padding: '32px 0 24px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)', border: '1px solid var(--color-border)', marginBottom: '16px' }}>
          <MapPin size={22} color="var(--color-accent)" />
        </div>
        <h1 className="font-display" style={{ margin: '0 0 8px', fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 800, letterSpacing: '-0.02em' }}>
          Trouver un artisan certifié
        </h1>
        <p style={{ margin: '0 auto', fontSize: '15px', color: 'var(--color-muted)', lineHeight: 1.6, maxWidth: '520px' }}>
          Artisans RGE et vérifiés près de chez vous — avec score de confiance.
        </p>
      </div>

      {/* SEARCH FORM */}
      <form onSubmit={handleSubmit} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '20px', marginBottom: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'end' }}>

          {/* Type de travaux */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
              Type de travaux
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                required
                style={{
                  width: '100%', padding: '10px 32px 10px 12px',
                  borderRadius: '10px', border: '1px solid var(--color-border)',
                  background: 'var(--color-bg)', color: 'var(--color-text)',
                  fontSize: '14px', fontFamily: 'var(--font-body)', appearance: 'none',
                  cursor: 'pointer', outline: 'none',
                }}
              >
                <option value="">Choisir...</option>
                {WORK_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
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
                ref={villeInputRef}
                type="text"
                value={ville}
                onChange={e => handleVilleChange(e.target.value)}
                placeholder="Paris, Lyon, 75001..."
                required
                style={{
                  width: '100%', padding: '10px 12px 10px 30px',
                  borderRadius: '10px', border: '1px solid var(--color-border)',
                  background: 'var(--color-bg)', color: 'var(--color-text)',
                  fontSize: '14px', fontFamily: 'var(--font-body)', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            {/* Autocomplete suggestions */}
            {showSuggestions && communeSuggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                  borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
                  marginTop: '4px', overflow: 'hidden',
                }}
              >
                {communeSuggestions.map(c => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => selectCommune(c)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      width: '100%', padding: '10px 12px', border: 'none',
                      background: 'transparent', cursor: 'pointer', textAlign: 'left',
                      fontFamily: 'var(--font-body)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <MapPin size={12} color="var(--color-muted)" />
                    <span style={{ fontSize: '13px', color: 'var(--color-text)', fontWeight: 500 }}>{c.nom}</span>
                    <span style={{ fontSize: '12px', color: 'var(--color-muted)', marginLeft: 'auto' }}>
                      {c.codesPostaux?.[0] || c.code}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search button */}
          <button
            type="submit"
            disabled={loading || !type || !ville}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '10px 20px', borderRadius: '10px', border: 'none',
              background: (!loading && type && ville) ? 'var(--color-accent)' : 'var(--color-border)',
              color: '#fff', fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-body)',
              cursor: (!loading && type && ville) ? 'pointer' : 'not-allowed',
              whiteSpace: 'nowrap', minWidth: '120px', height: '42px',
            }}
          >
            {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={16} />}
            {loading ? 'Recherche...' : 'Rechercher'}
          </button>
        </div>

        {/* Options row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '14px', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '13px', color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <span style={{ fontWeight: 600 }}>Rayon :</span>
            {[10, 20, 50].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRayon(r)}
                style={{
                  padding: '3px 10px', borderRadius: '20px', border: '1px solid',
                  borderColor: rayon === r ? 'var(--color-accent)' : 'var(--color-border)',
                  background: rayon === r ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)' : 'transparent',
                  color: rayon === r ? 'var(--color-accent)' : 'var(--color-muted)',
                  fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
                }}
              >
                {r} km
              </button>
            ))}
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-muted)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={rgeOnly}
              onChange={e => setRgeOnly(e.target.checked)}
              style={{ accentColor: 'var(--color-accent)', cursor: 'pointer' }}
            />
            <ShieldCheck size={13} color="#16a34a" />
            <span>RGE uniquement</span>
          </label>
        </div>
      </form>

      {/* RESULTS */}
      {searched && (
        <>
          {/* Stats bar */}
          {!loading && results.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-muted)' }}>
                  <strong style={{ color: 'var(--color-text)' }}>{sortedResults.length}</strong> artisan{sortedResults.length > 1 ? 's' : ''} trouvé{sortedResults.length > 1 ? 's' : ''}
                  {typeLabel ? ` · ${typeLabel}` : ''}
                  {ville ? ` · ${ville}` : ''}
                </p>
                {rgeCount > 0 && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '20px', background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: '11px', fontWeight: 700, color: '#16a34a' }}>
                    <ShieldCheck size={10} />
                    {rgeCount} RGE
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Sort */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-muted)', fontWeight: 600 }}>Trier :</span>
                  {(['rge', 'score', 'nom'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setSortBy(s)}
                      style={{
                        padding: '3px 8px', borderRadius: '6px', border: '1px solid',
                        borderColor: sortBy === s ? 'var(--color-accent)' : 'var(--color-border)',
                        background: sortBy === s ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)' : 'transparent',
                        color: sortBy === s ? 'var(--color-accent)' : 'var(--color-muted)',
                        fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
                      }}
                    >
                      {s === 'rge' ? 'RGE d\'abord' : s === 'score' ? 'Score' : 'Nom'}
                    </button>
                  ))}
                </div>
                {/* Filter toggle */}
                <button
                  onClick={() => setShowFilters(f => !f)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '3px 8px', borderRadius: '6px', border: '1px solid var(--color-border)',
                    background: showFilters ? 'var(--color-bg)' : 'transparent',
                    color: 'var(--color-muted)', fontSize: '12px', fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'var(--font-body)',
                  }}
                >
                  <Filter size={11} />Filtres
                </button>
              </div>
            </div>
          )}

          {/* Filter panel */}
          {showFilters && (
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-muted)' }}>
                Score minimum :
                <select
                  value={minScore}
                  onChange={e => setMinScore(Number(e.target.value))}
                  style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: '13px', fontFamily: 'var(--font-body)' }}
                >
                  <option value={0}>Tous</option>
                  <option value={45}>≥ 45</option>
                  <option value={70}>≥ 70 (Fiable)</option>
                  <option value={85}>≥ 85 (Excellent)</option>
                </select>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-muted)', cursor: 'pointer' }}>
                <input type="checkbox" checked={rgeOnly} onChange={e => setRgeOnly(e.target.checked)} style={{ accentColor: 'var(--color-accent)' }} />
                RGE uniquement
              </label>
            </div>
          )}

          {/* Map */}
          {mapUrl && results.length > 0 && (
            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--color-border)', marginBottom: '20px', height: '220px' }}>
              <iframe
                src={mapUrl}
                width="100%"
                height="220"
                style={{ border: 'none', display: 'block' }}
                title={`Carte artisans ${ville}`}
                loading="lazy"
              />
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-muted)' }}>
              <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} color="var(--color-accent)" />
              <p style={{ margin: 0, fontSize: '14px' }}>Recherche en cours…</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ padding: '14px 16px', borderRadius: '10px', background: 'var(--color-danger-bg)', border: '1px solid color-mix(in srgb, var(--color-danger) 30%, transparent)', fontSize: '14px', color: 'var(--color-danger)', marginBottom: '16px' }}>
              <AlertTriangle size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              {error}
            </div>
          )}

          {/* No results */}
          {!loading && !error && searched && results.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <p style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</p>
              <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>Aucun artisan trouvé</p>
              <p style={{ fontSize: '14px', color: 'var(--color-muted)' }}>Essayez d&apos;élargir le rayon ou de décocher «&nbsp;RGE uniquement&nbsp;».</p>
            </div>
          )}

          {/* Results list */}
          {!loading && sortedResults.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {sortedResults.map((artisan) => (
                <ArtisanCard key={artisan.siret} artisan={artisan} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Empty state before search */}
      {!searched && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-muted)' }}>
          <p style={{ fontSize: '40px', marginBottom: '16px' }}>🏗️</p>
          <p style={{ fontSize: '14px', lineHeight: 1.6 }}>
            Renseignez le type de travaux et votre ville pour trouver des artisans certifiés près de chez vous.
          </p>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          .artisan-form-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

function ArtisanCard({ artisan }: { artisan: ArtisanResult }) {
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderRadius: '12px', padding: '16px',
      borderLeft: artisan.rge ? '3px solid #16a34a' : '1px solid var(--color-border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }}>
              {artisan.nom}
            </h3>
            {artisan.rge && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 7px', borderRadius: '20px', background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: '10px', fontWeight: 700, color: '#16a34a', flexShrink: 0 }}>
                <ShieldCheck size={9} />RGE
              </span>
            )}
          </div>
          <p style={{ margin: '0 0 8px', fontSize: '12px', color: 'var(--color-muted)', lineHeight: 1.4 }}>
            <MapPin size={10} style={{ verticalAlign: 'middle', marginRight: '3px' }} />
            {artisan.adresse ? `${artisan.adresse}, ` : ''}{artisan.codePostal} {artisan.ville}
          </p>
          {artisan.domaines.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {artisan.domaines.slice(0, 3).map(d => (
                <span key={d} style={{ padding: '2px 8px', borderRadius: '20px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', fontSize: '11px', color: 'var(--color-muted)' }}>
                  {d}
                </span>
              ))}
            </div>
          )}
          {artisan.siret && (
            <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'var(--color-muted)' }}>
              SIRET : {artisan.siret}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
          {artisan.scoreLoading ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '20px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', fontSize: '11px', color: 'var(--color-muted)' }}>
              <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} />Analyse...
            </span>
          ) : artisan.score !== undefined ? (
            <ScoreBadge score={artisan.score} />
          ) : null}
          {artisan.siret && (
            <a
              href={`/?q=${artisan.siret}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '6px 12px', borderRadius: '8px',
                border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                color: 'var(--color-text)', fontSize: '12px', fontWeight: 600,
                textDecoration: 'none', whiteSpace: 'nowrap',
              }}
            >
              <ExternalLink size={11} />
              Voir la fiche
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
