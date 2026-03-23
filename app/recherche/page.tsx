'use client'

import { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, AlertTriangle, Filter, X, ChevronDown } from 'lucide-react'
import SiteHeader from '@/components/SiteHeader'
import ShareButton from '@/components/ShareButton'
import type { SearchCandidate } from '@/types'

/* ── Types de travaux ─────────────────────────────────────── */
const TRAVAUX_TYPES = [
  { id: 'plomberie', label: 'Plomberie', keywords: ['plomb', 'sanitaire'] },
  { id: 'electricite', label: 'Électricité', keywords: ['électr', 'electr'] },
  { id: 'maconnerie', label: 'Maçonnerie', keywords: ['maçon', 'macon', 'béton', 'beton', 'construct'] },
  { id: 'charpente', label: 'Charpente', keywords: ['charpen'] },
  { id: 'couverture', label: 'Couverture', keywords: ['couver', 'toiture', 'toit'] },
  { id: 'isolation', label: 'Isolation', keywords: ['isol'] },
  { id: 'menuiserie', label: 'Menuiserie', keywords: ['menuiser'] },
  { id: 'peinture', label: 'Peinture', keywords: ['peint', 'décor', 'decor'] },
  { id: 'carrelage', label: 'Carrelage', keywords: ['carrel', 'revêtem'] },
  { id: 'chauffage', label: 'Chauffage', keywords: ['chauf', 'pomp', 'therm'] },
  { id: 'climatisation', label: 'Climatisation', keywords: ['clim', 'frigori', 'froid'] },
  { id: 'serrurerie', label: 'Serrurerie', keywords: ['serr', 'metal', 'métal'] },
]

/* ── Candidate card ──────────────────────────────────────── */
function CandidateCard({ c, onClick }: { c: SearchCandidate; onClick: () => void }) {
  const isActif = c.statut === 'actif'
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: '14px', padding: '16px 20px', cursor: 'pointer',
        transition: 'box-shadow 0.15s, border-color 0.15s',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-accent)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(27,67,50,0.10)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', fontFamily: 'var(--font-display)', lineHeight: 1.3 }}>
            {c.nom}
          </span>
          <span style={{
            fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '10px',
            background: isActif ? '#dcfce7' : '#fee2e2',
            color: isActif ? '#166534' : '#991b1b',
          }}>
            {isActif ? '● ACTIF' : '● FERMÉ'}
          </span>
          {c.formeJuridique && (
            <span style={{ fontSize: '11px', color: 'var(--color-muted)', background: 'var(--color-neutral-bg)', padding: '2px 7px', borderRadius: '8px' }}>
              {c.formeJuridique}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {(c.ville || c.codePostal) && (
            <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
              📍 {c.codePostal} {c.ville}
            </span>
          )}
          {c.activite && (
            <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
              🏷 {c.activite}
            </span>
          )}
          {c.dateCreation && (
            <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
              📅 {new Date(c.dateCreation).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
      </div>
      <div style={{ flexShrink: 0, color: 'var(--color-muted)' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </div>
  )
}

/* ── Ville autocomplete ──────────────────────────────────── */
interface GeoCommune { nom: string; codeDepartement: string }

function VilleAutocomplete({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [suggestions, setSuggestions] = useState<GeoCommune[]>([])
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (value.length < 2) { setSuggestions([]); setOpen(false); return }
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(value)}&limit=8&fields=nom,codeDepartement`
        )
        const data = await res.json()
        const list: GeoCommune[] = Array.isArray(data) ? data : []
        setSuggestions(list)
        setOpen(list.length > 0)
      } catch {
        setSuggestions([])
      }
    }, 250)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [value])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const select = (nom: string) => {
    onChange(nom)
    setOpen(false)
    setSuggestions([])
  }

  return (
    <div ref={wrapperRef} style={{ flex: '1 1 160px', position: 'relative' }}>
      <span style={{
        position: 'absolute', left: '14px', top: '50%',
        transform: 'translateY(-50%)', fontSize: '16px',
        pointerEvents: 'none', zIndex: 1,
      }}>
        📍
      </span>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Ville ou département"
        autoComplete="off"
        style={{
          width: '100%', height: '56px', paddingLeft: '40px', paddingRight: '16px',
          border: '2px solid var(--color-border)', borderRadius: '14px',
          background: 'white', fontSize: '15px', fontFamily: 'var(--font-body)',
          color: 'var(--color-text)', outline: 'none',
          transition: 'border-color 0.15s',
          boxSizing: 'border-box',
        }}
        onFocus={e => {
          e.target.style.borderColor = 'var(--color-accent)'
          if (suggestions.length > 0) setOpen(true)
        }}
        onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
      />
      {open && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: 'white', border: '1px solid var(--color-border)',
          borderRadius: '14px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          zIndex: 200, overflow: 'hidden',
          maxHeight: '280px', overflowY: 'auto',
        }}>
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={() => select(s.nom)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                width: '100%', padding: '10px 16px',
                background: 'none', border: 'none',
                borderBottom: i < suggestions.length - 1 ? '1px solid var(--color-border)' : 'none',
                cursor: 'pointer', textAlign: 'left',
                fontFamily: 'var(--font-body)', fontSize: '14px',
                color: 'var(--color-text)', transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <span style={{ fontSize: '13px', flexShrink: 0 }}>📍</span>
              <span style={{ fontWeight: 600, flex: 1 }}>{s.nom}</span>
              <span style={{ color: 'var(--color-muted)', fontSize: '12px', flexShrink: 0 }}>
                ({s.codeDepartement})
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Inner component (uses useSearchParams) ──────────────── */
function RechercheInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const qParam = searchParams.get('q') || ''
  const villeParam = searchParams.get('ville') || ''
  const statutParam = (searchParams.get('statut') || 'actif') as 'tous' | 'actif' | 'fermé'
  const ancienneteParam = searchParams.get('anciennete') || 'tous'
  const sortParam = (searchParams.get('sort') || 'pertinence') as 'pertinence' | 'anciennete'
  const typesParam = searchParams.get('types') || ''
  const rgeParam = searchParams.get('rge') === '1'

  // Form state (local, not yet submitted)
  const [queryInput, setQueryInput] = useState(qParam)
  const [villeInput, setVilleInput] = useState(villeParam)

  // Filter state
  const [filterStatut, setFilterStatut] = useState<'tous' | 'actif' | 'fermé'>(statutParam)
  const [filterAnciennete, setFilterAnciennete] = useState(ancienneteParam)
  const [sortBy, setSortBy] = useState<'pertinence' | 'anciennete'>(sortParam)
  const [selectedTravaux, setSelectedTravaux] = useState<string[]>(typesParam ? typesParam.split(',').filter(Boolean) : [])
  const [filterRge, setFilterRge] = useState(rgeParam)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Results state
  const [candidates, setCandidates] = useState<SearchCandidate[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)

  const sentinelRef = useRef<HTMLDivElement>(null)

  // Sync local inputs when URL params change
  useEffect(() => { setQueryInput(qParam) }, [qParam])
  useEffect(() => { setVilleInput(villeParam) }, [villeParam])

  // Update URL when filters change
  const buildParams = useCallback((overrides: Record<string, string> = {}) => {
    const params = new URLSearchParams()
    const q = overrides.q ?? qParam
    const ville = overrides.ville ?? villeParam
    const st = overrides.statut ?? filterStatut
    const an = overrides.anciennete ?? filterAnciennete
    const so = overrides.sort ?? sortBy
    const ty = overrides.types ?? selectedTravaux.join(',')
    const rg = overrides.rge ?? (filterRge ? '1' : '')
    if (q) params.set('q', q)
    if (ville.trim()) params.set('ville', ville.trim())
    if (st !== 'actif') params.set('statut', st) // 'actif' is the default, omit from URL
    if (an !== 'tous') params.set('anciennete', an)
    if (so !== 'pertinence') params.set('sort', so)
    if (ty) params.set('types', ty)
    if (rg) params.set('rge', rg)
    return params.toString()
  }, [qParam, villeParam, filterStatut, filterAnciennete, sortBy, selectedTravaux, filterRge])

  const updateURL = useCallback((overrides: Record<string, string> = {}) => {
    router.replace(`/recherche?${buildParams(overrides)}`, { scroll: false })
  }, [router, buildParams])

  // Fetch when qParam changes
  useEffect(() => {
    if (!qParam || qParam.length < 2) { setCandidates([]); return }
    setLoading(true)
    setError(null)
    setCandidates([])
    setCurrentPage(1)
    setHasMore(false)
    setTotalCount(0)

    fetch(`/api/search-list?q=${encodeURIComponent(qParam)}&page=1`)
      .then(res => res.json())
      .then(data => {
        if (data.isExact) {
          router.push(`/artisan/${data.siret}`)
          return
        }
        if (data.error) {
          setError(data.error)
        } else {
          setCandidates(data.candidates || [])
          setHasMore(data.hasMore ?? false)
          setTotalCount(data.total ?? 0)
        }
      })
      .catch(() => setError('Erreur réseau. Vérifiez votre connexion.'))
      .finally(() => setLoading(false))
  }, [qParam]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || loading) return
    setLoadingMore(true)
    const nextPage = currentPage + 1
    try {
      const res = await fetch(`/api/search-list?q=${encodeURIComponent(qParam)}&page=${nextPage}`)
      const data = await res.json()
      if (!data.error && data.candidates) {
        setCandidates(prev => [...prev, ...data.candidates])
        setCurrentPage(nextPage)
        setHasMore(data.hasMore)
      }
    } catch { /* silent */ }
    finally { setLoadingMore(false) }
  }, [hasMore, loadingMore, loading, currentPage, qParam])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) loadMore()
    }, { threshold: 0.1 })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  const filteredCandidates = useMemo(() => {
    let list = candidates

    if (filterStatut !== 'tous') list = list.filter(c => c.statut === filterStatut)

    // Ville/département client-side filter
    const v = villeParam.trim().toLowerCase()
    if (v) {
      list = list.filter(c => {
        const villeMatch = c.ville?.toLowerCase().includes(v)
        const cpMatch = c.codePostal?.startsWith(v)
        return villeMatch || cpMatch
      })
    }

    // Type de travaux filter (match on activite)
    if (selectedTravaux.length > 0) {
      list = list.filter(c => {
        if (!c.activite) return false
        const act = c.activite.toLowerCase()
        return selectedTravaux.some(typeId => {
          const t = TRAVAUX_TYPES.find(t => t.id === typeId)
          return t ? t.keywords.some(kw => act.includes(kw)) : false
        })
      })
    }

    // Ancienneté filter
    if (filterAnciennete !== 'tous') {
      const now = Date.now()
      list = list.filter(c => {
        if (!c.dateCreation) return false
        const years = (now - new Date(c.dateCreation).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
        return years >= Number(filterAnciennete)
      })
    }

    if (sortBy === 'anciennete') {
      list = [...list].sort((a, b) => {
        if (!a.dateCreation) return 1
        if (!b.dateCreation) return -1
        return new Date(a.dateCreation).getTime() - new Date(b.dateCreation).getTime()
      })
    }
    return list
  }, [candidates, filterStatut, villeParam, selectedTravaux, filterAnciennete, sortBy])

  const hasActiveFilters = filterStatut !== 'actif' || filterAnciennete !== 'tous' || selectedTravaux.length > 0 || filterRge

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!queryInput.trim()) return
    const params = buildParams({ q: queryInput.trim(), ville: villeInput.trim() })
    router.push(`/recherche?${params}`)
  }

  const handleSelectCandidate = (siret: string) => router.push(`/artisan/${siret}`)

  const toggleTravaux = (id: string) => {
    const next = selectedTravaux.includes(id)
      ? selectedTravaux.filter(t => t !== id)
      : [...selectedTravaux, id]
    setSelectedTravaux(next)
    updateURL({ types: next.join(',') })
  }

  const resetFilters = () => {
    setFilterStatut('actif')
    setFilterAnciennete('tous')
    setSelectedTravaux([])
    setFilterRge(false)
    updateURL({ statut: 'actif', anciennete: 'tous', types: '', rge: '' })
  }

  const hasResults = !loading && candidates.length > 0
  const hasQuery = !!qParam

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <SiteHeader />

      {/* ── Page header ── */}
      <div style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        padding: '32px 24px 0',
      }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          {!hasQuery && (
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: 'clamp(24px, 4vw, 36px)',
                color: 'var(--color-text)',
                margin: '0 0 8px',
                lineHeight: 1.2,
              }}>
                Trouver et vérifier un artisan
              </h1>
              <p style={{ margin: 0, fontSize: '16px', color: 'var(--color-muted)', lineHeight: 1.5 }}>
                Recherchez parmi les entreprises du bâtiment vérifiées sur les données officielles
              </p>
            </div>
          )}

          {/* ── Search bar ── */}
          <form onSubmit={handleSearch} style={{ marginBottom: '20px' }}>
            <div style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
            }}>
              {/* Query field */}
              <div style={{ flex: '2 1 240px', position: 'relative' }}>
                <Search
                  size={18}
                  style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)', pointerEvents: 'none' }}
                />
                <input
                  type="text"
                  value={queryInput}
                  onChange={e => setQueryInput(e.target.value)}
                  placeholder="Nom d'artisan, SIRET, activité..."
                  style={{
                    width: '100%', height: '56px', paddingLeft: '44px', paddingRight: '16px',
                    border: '2px solid var(--color-border)', borderRadius: '14px',
                    background: 'white', fontSize: '15px', fontFamily: 'var(--font-body)',
                    color: 'var(--color-text)', outline: 'none',
                    transition: 'border-color 0.15s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'var(--color-accent)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
                />
              </div>
              {/* Ville field with autocomplete */}
              <VilleAutocomplete value={villeInput} onChange={setVilleInput} />
              {/* Submit button */}
              <button
                type="submit"
                style={{
                  height: '56px', padding: '0 24px',
                  background: 'var(--color-accent)', color: 'white',
                  border: 'none', borderRadius: '14px',
                  fontSize: '15px', fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  whiteSpace: 'nowrap',
                  transition: 'opacity 0.15s',
                  flexShrink: 0,
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                Rechercher →
              </button>
            </div>
          </form>

          {/* ── Filters toggle (mobile) ── */}
          <button
            onClick={() => setFiltersOpen(o => !o)}
            className="filters-toggle-mobile"
            style={{
              display: 'none',
              alignItems: 'center', gap: '6px',
              background: 'none', border: '1px solid var(--color-border)',
              borderRadius: '10px', padding: '8px 14px',
              fontSize: '13px', fontWeight: 600,
              color: 'var(--color-text)', cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              marginBottom: '12px',
            }}
          >
            <Filter size={14} />
            Filtres {hasActiveFilters && <span style={{ background: 'var(--color-accent)', color: 'white', borderRadius: '100px', padding: '0 6px', fontSize: '11px', fontWeight: 700 }}>{selectedTravaux.length + (filterStatut !== 'actif' ? 1 : 0) + (filterAnciennete !== 'tous' ? 1 : 0) + (filterRge ? 1 : 0)}</span>}
            <ChevronDown size={14} style={{ transform: filtersOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {/* ── Filters panel ── */}
          <div className={`filters-panel${filtersOpen ? ' open' : ''}`} style={{ paddingBottom: '16px' }}>
              {/* Type de travaux chips */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {TRAVAUX_TYPES.map(t => {
                  const active = selectedTravaux.includes(t.id)
                  return (
                    <button
                      key={t.id}
                      onClick={() => toggleTravaux(t.id)}
                      style={{
                        padding: '5px 12px', borderRadius: '20px', border: '1px solid',
                        fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                        fontFamily: 'var(--font-body)',
                        transition: 'all 0.12s',
                        ...(active
                          ? { background: 'var(--color-accent)', color: '#fff', borderColor: 'var(--color-accent)' }
                          : { background: 'transparent', color: 'var(--color-muted)', borderColor: 'var(--color-border)' }),
                      }}
                    >
                      {t.label}
                    </button>
                  )
                })}
              </div>

              {/* Row 2: RGE, Statut, Ancienneté, Sort, Reset */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* RGE toggle */}
                <button
                  onClick={() => { setFilterRge(r => !r); updateURL({ rge: filterRge ? '' : '1' }) }}
                  style={{
                    padding: '5px 12px', borderRadius: '20px', border: '1px solid',
                    fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    ...(filterRge
                      ? { background: '#d1fae5', color: '#065f46', borderColor: '#6ee7b7' }
                      : { background: 'transparent', color: 'var(--color-muted)', borderColor: 'var(--color-border)' }),
                  }}
                >
                  🌿 RGE uniquement
                </button>

                {/* Statut */}
                <div style={{ display: 'flex', gap: '3px' }}>
                  {(['actif', 'tous', 'fermé'] as const).map(s => (
                    <button key={s} onClick={() => { setFilterStatut(s); updateURL({ statut: s }) }}
                      style={{
                        padding: '5px 10px', borderRadius: '20px', border: '1px solid',
                        fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                        fontFamily: 'var(--font-body)',
                        ...(filterStatut === s
                          ? { background: 'var(--color-accent)', color: '#fff', borderColor: 'var(--color-accent)' }
                          : { background: 'transparent', color: 'var(--color-muted)', borderColor: 'var(--color-border)' }),
                      }}
                    >
                      {s === 'actif' ? '🟢 Actifs' : s === 'tous' ? 'Tous' : '🔴 Fermés'}
                    </button>
                  ))}
                </div>

                {/* Ancienneté */}
                <select
                  value={filterAnciennete}
                  onChange={e => { setFilterAnciennete(e.target.value); updateURL({ anciennete: e.target.value }) }}
                  style={{
                    padding: '5px 10px', borderRadius: '20px',
                    border: `1px solid ${filterAnciennete !== 'tous' ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    background: filterAnciennete !== 'tous' ? 'var(--color-accent-light)' : 'transparent',
                    color: filterAnciennete !== 'tous' ? 'var(--color-accent)' : 'var(--color-muted)',
                    fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'var(--font-body)', outline: 'none',
                  }}
                >
                  <option value="tous">Ancienneté</option>
                  <option value="2">+ 2 ans</option>
                  <option value="5">+ 5 ans</option>
                  <option value="10">+ 10 ans</option>
                </select>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={e => { setSortBy(e.target.value as 'pertinence' | 'anciennete'); updateURL({ sort: e.target.value }) }}
                  style={{
                    padding: '5px 10px', borderRadius: '20px',
                    border: '1px solid var(--color-border)',
                    background: 'transparent', color: 'var(--color-muted)',
                    fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'var(--font-body)', outline: 'none',
                  }}
                >
                  <option value="pertinence">Pertinence</option>
                  <option value="anciennete">Ancienneté</option>
                </select>

                {/* Reset */}
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '4px',
                      padding: '5px 10px', borderRadius: '20px',
                      border: '1px solid var(--color-border)',
                      background: 'transparent', color: 'var(--color-muted)',
                      fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    <X size={12} /> Réinitialiser
                  </button>
                )}

                {/* Share */}
                {hasQuery && (
                  <ShareButton
                    url={typeof window !== 'undefined' ? window.location.href : ''}
                    nom={qParam}
                    label="Partager"
                    compact
                  />
                )}
              </div>
            </div>
          </div>
        </div>

      {/* ── Results ── */}
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '20px 24px 80px' }}>

        {/* Error */}
        {error && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '16px', background: 'var(--color-danger-bg)', borderRadius: '14px', border: '1px solid var(--color-danger-border)', marginBottom: '16px' }}>
            <AlertTriangle size={18} color="var(--color-danger)" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-danger)' }}>{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '60px 0', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--color-accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(27,67,50,0.15)' }}>
              <Search size={22} color="var(--color-accent)" style={{ animation: 'spin 1.5s linear infinite' }} />
            </div>
            <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--color-text)' }}>Recherche en cours…</p>
          </div>
        )}

        {/* Results list */}
        {!loading && candidates.length > 0 && (
          <>
            <p style={{ margin: '0 0 14px', fontSize: '13px', color: 'var(--color-muted)' }}>
              <strong style={{ color: 'var(--color-text)' }}>{totalCount.toLocaleString('fr-FR')}</strong>
              {' '}entreprise{totalCount > 1 ? 's' : ''} trouvée{totalCount > 1 ? 's' : ''} pour{' '}
              <strong style={{ color: 'var(--color-text)' }}>« {qParam} »</strong>
              {filteredCandidates.length < candidates.length && (
                <span style={{ color: 'var(--color-accent)' }}> — {filteredCandidates.length} après filtres</span>
              )}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredCandidates.map(c => (
                <CandidateCard key={c.siret} c={c} onClick={() => handleSelectCandidate(c.siret)} />
              ))}
            </div>

            <div ref={sentinelRef} style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {loadingMore && (
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2.5px solid var(--color-border)', borderTopColor: 'var(--color-accent)' }} className="spin" />
              )}
            </div>
          </>
        )}

        {/* Empty state — no query */}
        {!loading && !error && !qParam && (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <p style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>
              Qui cherchez-vous ?
            </p>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-muted)' }}>
              Entrez le nom d&apos;un artisan, son SIRET ou son activité pour démarrer.
            </p>
          </div>
        )}

        {/* Empty state — query but no results */}
        {!loading && !error && qParam && candidates.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600, color: 'var(--color-text)' }}>
              Aucun résultat pour « {qParam} »
            </p>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-muted)' }}>
              Essayez avec un SIRET ou un nom différent.
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }
        @media (max-width: 640px) {
          .filters-toggle-mobile { display: flex !important; }
          .filters-panel { display: none; }
          .filters-panel.open { display: block; }
        }
      `}</style>
    </main>
  )
}

/* ── Wrapped with Suspense ── */
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
