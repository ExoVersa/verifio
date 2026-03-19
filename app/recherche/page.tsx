'use client'

import { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, AlertTriangle, ArrowLeft } from 'lucide-react'
import SiteHeader from '@/components/SiteHeader'
import SearchBar from '@/components/SearchBar'
import type { SearchCandidate } from '@/types'

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

/* ── Inner component (uses useSearchParams) ──────────────── */
function RechercheInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const qParam = searchParams.get('q') || ''
  const statutParam = (searchParams.get('statut') || 'tous') as 'tous' | 'actif' | 'fermé'
  const formeParam = searchParams.get('forme') || 'tous'
  const deptParam = searchParams.get('dept') || ''
  const ancienneteParam = searchParams.get('anciennete') || 'tous'
  const sortParam = (searchParams.get('sort') || 'pertinence') as 'pertinence' | 'anciennete'

  const [candidates, setCandidates] = useState<SearchCandidate[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)

  const [filterStatut, setFilterStatut] = useState<'tous' | 'actif' | 'fermé'>(statutParam)
  const [filterForme, setFilterForme] = useState(formeParam)
  const [filterDept, setFilterDept] = useState(deptParam)
  const [filterAnciennete, setFilterAnciennete] = useState(ancienneteParam)
  const [sortBy, setSortBy] = useState<'pertinence' | 'anciennete'>(sortParam)

  const sentinelRef = useRef<HTMLDivElement>(null)

  // Update URL when filters change (without navigation)
  const updateURL = useCallback((overrides: Record<string, string> = {}) => {
    const params = new URLSearchParams()
    if (qParam) params.set('q', qParam)
    const st = overrides.statut ?? filterStatut
    const fo = overrides.forme ?? filterForme
    const de = overrides.dept ?? filterDept
    const an = overrides.anciennete ?? filterAnciennete
    const so = overrides.sort ?? sortBy
    if (st !== 'tous') params.set('statut', st)
    if (fo !== 'tous') params.set('forme', fo)
    if (de.trim()) params.set('dept', de.trim())
    if (an !== 'tous') params.set('anciennete', an)
    if (so !== 'pertinence') params.set('sort', so)
    router.replace(`/recherche?${params.toString()}`, { scroll: false })
  }, [qParam, filterStatut, filterForme, filterDept, filterAnciennete, sortBy, router])

  // Initial fetch when q changes
  useEffect(() => {
    if (!qParam || qParam.length < 2) return
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
    if (filterForme !== 'tous') list = list.filter(c => c.formeJuridique === filterForme)
    if (filterDept.trim()) list = list.filter(c => c.codePostal.startsWith(filterDept.trim()))
    if (filterAnciennete !== 'tous') {
      const now = Date.now()
      list = list.filter(c => {
        if (!c.dateCreation) return false
        const years = (now - new Date(c.dateCreation).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
        if (filterAnciennete === '1') return years >= 1
        if (filterAnciennete === '3') return years >= 3
        if (filterAnciennete === '10') return years >= 10
        return true
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
  }, [candidates, filterStatut, filterForme, filterDept, filterAnciennete, sortBy])

  const formesPresentes = useMemo(() => {
    const set = new Set(candidates.map(c => c.formeJuridique).filter(Boolean))
    return Array.from(set)
  }, [candidates])

  const handleNewSearch = (query: string) => {
    router.push(`/recherche?q=${encodeURIComponent(query)}`)
  }

  const handleSelectCandidate = (siret: string) => {
    router.push(`/artisan/${siret}`)
  }

  const handleFilterStatut = (v: 'tous' | 'actif' | 'fermé') => {
    setFilterStatut(v)
    updateURL({ statut: v })
  }
  const handleFilterForme = (v: string) => {
    setFilterForme(v)
    updateURL({ forme: v })
  }
  const handleFilterDept = (v: string) => {
    setFilterDept(v)
    // debounce-like: update only on blur or enter
  }
  const handleSortBy = (v: 'pertinence' | 'anciennete') => {
    setSortBy(v)
    updateURL({ sort: v })
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <SiteHeader />

      {/* Search bar */}
      <div style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: '20px 24px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <button
            onClick={() => router.push('/')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-muted)', fontSize: '12px', fontWeight: 500,
              padding: 0, marginBottom: '12px', fontFamily: 'var(--font-body)',
            }}
          >
            <ArrowLeft size={13} />
            Accueil
          </button>
          <SearchBar onSearch={handleNewSearch} loading={loading} initialValue={qParam} />
        </div>
      </div>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '20px 24px 80px' }}>

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
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Results */}
        {!loading && candidates.length > 0 && (
          <>
            {/* Compteur + tri */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)' }}>
                <strong style={{ color: 'var(--color-text)' }}>{totalCount.toLocaleString('fr-FR')}</strong>
                {' '}entreprise{totalCount > 1 ? 's' : ''} trouvée{totalCount > 1 ? 's' : ''} pour{' '}
                <strong style={{ color: 'var(--color-text)' }}>« {qParam} »</strong>
                {filteredCandidates.length < candidates.length && (
                  <span style={{ color: 'var(--color-accent)' }}> — {filteredCandidates.length} après filtres</span>
                )}
              </p>
              <div style={{ display: 'flex', gap: '4px' }}>
                {(['pertinence', 'anciennete'] as const).map(s => (
                  <button key={s} onClick={() => handleSortBy(s)}
                    style={{ padding: '5px 12px', borderRadius: '8px', border: '1px solid', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', ...(sortBy === s ? { background: 'var(--color-accent)', color: '#fff', borderColor: 'var(--color-accent)' } : { background: 'var(--color-surface)', color: 'var(--color-muted)', borderColor: 'var(--color-border)' }) }}
                  >{s === 'pertinence' ? 'Pertinence' : 'Ancienneté'}</button>
                ))}
              </div>
            </div>

            {/* Barre de filtres */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px', padding: '12px 14px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '14px' }}>
              {/* Statut */}
              <div style={{ display: 'flex', gap: '4px' }}>
                {(['tous', 'actif', 'fermé'] as const).map(s => (
                  <button key={s} onClick={() => handleFilterStatut(s)}
                    style={{ padding: '4px 10px', borderRadius: '20px', border: '1px solid', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', ...(filterStatut === s ? { background: 'var(--color-accent)', color: '#fff', borderColor: 'var(--color-accent)' } : { background: 'transparent', color: 'var(--color-muted)', borderColor: 'var(--color-border)' }) }}
                  >{s === 'tous' ? 'Tous statuts' : s === 'actif' ? '🟢 Actif' : '🔴 Fermé'}</button>
                ))}
              </div>
              {/* Forme juridique */}
              <select value={filterForme} onChange={e => handleFilterForme(e.target.value)}
                style={{ padding: '4px 10px', borderRadius: '20px', border: '1px solid var(--color-border)', background: filterForme !== 'tous' ? 'var(--color-accent-light)' : 'transparent', color: filterForme !== 'tous' ? 'var(--color-accent)' : 'var(--color-muted)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', outline: 'none' }}>
                <option value="tous">Forme jur.</option>
                {formesPresentes.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              {/* Ancienneté */}
              <select value={filterAnciennete} onChange={e => { setFilterAnciennete(e.target.value); updateURL({ anciennete: e.target.value }) }}
                style={{ padding: '4px 10px', borderRadius: '20px', border: '1px solid var(--color-border)', background: filterAnciennete !== 'tous' ? 'var(--color-accent-light)' : 'transparent', color: filterAnciennete !== 'tous' ? 'var(--color-accent)' : 'var(--color-muted)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', outline: 'none' }}>
                <option value="tous">Ancienneté</option>
                <option value="1">+ 1 an</option>
                <option value="3">+ 3 ans</option>
                <option value="10">+ 10 ans</option>
              </select>
              {/* Département */}
              <input
                type="text" placeholder="Dépt. (ex: 75)" value={filterDept}
                onChange={e => handleFilterDept(e.target.value)}
                onBlur={e => updateURL({ dept: e.target.value })}
                onKeyDown={e => { if (e.key === 'Enter') updateURL({ dept: filterDept }) }}
                style={{ padding: '4px 10px', borderRadius: '20px', border: `1px solid ${filterDept ? 'var(--color-accent)' : 'var(--color-border)'}`, background: filterDept ? 'var(--color-accent-light)' : 'transparent', color: filterDept ? 'var(--color-accent)' : 'var(--color-muted)', fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-body)', outline: 'none', width: '90px' }}
              />
              {/* Reset */}
              {(filterStatut !== 'tous' || filterForme !== 'tous' || filterDept || filterAnciennete !== 'tous') && (
                <button
                  onClick={() => { setFilterStatut('tous'); setFilterForme('tous'); setFilterDept(''); setFilterAnciennete('tous'); updateURL({ statut: 'tous', forme: 'tous', dept: '', anciennete: 'tous' }) }}
                  style={{ padding: '4px 10px', borderRadius: '20px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-muted)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                >
                  ✕ Réinitialiser
                </button>
              )}
            </div>

            {/* Liste */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredCandidates.map(c => (
                <CandidateCard key={c.siret} c={c} onClick={() => handleSelectCandidate(c.siret)} />
              ))}
            </div>

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {loadingMore && (
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2.5px solid var(--color-border)', borderTopColor: 'var(--color-accent)' }} className="spin" />
              )}
            </div>
          </>
        )}

        {/* Empty query */}
        {!loading && !error && !qParam && (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--color-muted)', fontSize: '15px' }}>
            Saisissez une recherche pour trouver un artisan.
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }
      `}</style>
    </main>
  )
}

/* ── Wrapped with Suspense (required for useSearchParams in Next.js 15) ── */
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
