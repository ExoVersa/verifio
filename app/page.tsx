'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  Search, ShieldCheck, AlertTriangle, CheckCircle2, Leaf, Scale, Clock, Users,
  TrendingDown, Lock, Star, ChevronRight, Quote, FileSearch, Calculator,
  ArrowLeftRight, ClipboardCheck, MessageSquare, MapPin, Zap,
} from 'lucide-react'
import Link from 'next/link'
import SearchBar from '@/components/SearchBar'
import ResultCard from '@/components/ResultCard'
import SiteHeader from '@/components/SiteHeader'
import type { SearchResult, SearchCandidate } from '@/types'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

/* ── Hero SVG Illustration ─────────────────────────────── */
function HeroIllustration() {
  return (
    <svg viewBox="0 0 380 340" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Background circles */}
      <circle cx="190" cy="170" r="150" fill="#1B4332" fillOpacity="0.04" />
      <circle cx="190" cy="170" r="110" fill="#1B4332" fillOpacity="0.05" />

      {/* Main shield */}
      <path d="M190 40 L260 70 L260 160 C260 205 228 240 190 255 C152 240 120 205 120 160 L120 70 Z" fill="#1B4332" />
      <path d="M190 52 L252 78 L252 160 C252 200 223 233 190 246 C157 233 128 200 128 160 L128 78 Z" fill="#D8F3DC" />

      {/* Checkmark */}
      <path d="M162 168 L180 186 L220 148" stroke="#1B4332" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />

      {/* Stars around shield */}
      <circle cx="96" cy="90" r="6" fill="#1B4332" fillOpacity="0.15" />
      <circle cx="284" cy="90" r="4" fill="#1B4332" fillOpacity="0.20" />
      <circle cx="80" cy="200" r="5" fill="#1B4332" fillOpacity="0.12" />
      <circle cx="305" cy="190" r="7" fill="#1B4332" fillOpacity="0.10" />

      {/* Score badge — top right */}
      <rect x="270" y="50" width="90" height="52" rx="14" fill="white" filter="drop-shadow(0 4px 12px rgba(0,0,0,0.10))" />
      <text x="315" y="74" textAnchor="middle" fontFamily="Syne, sans-serif" fontSize="18" fontWeight="800" fill="#1B4332">84</text>
      <text x="315" y="90" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="9" fill="#6B7280">SCORE</text>
      {/* Stars in badge */}
      {[298, 308, 318, 328, 338].map((x, i) => (
        <polygon key={i} points={`${x},96 ${x+3},102 ${x+6},102 ${x+3},105 ${x+4},111 ${x},108 ${x-4},111 ${x-3},105 ${x-6},102 ${x-3},102`} fill={i < 4 ? '#f59e0b' : '#e5e7eb'} transform="scale(0.55) translate(260, 80)" />
      ))}

      {/* FIABLE badge — bottom left */}
      <rect x="18" y="230" width="110" height="42" rx="12" fill="#1B4332" />
      <text x="73" y="248" textAnchor="middle" fontFamily="Syne, sans-serif" fontSize="10" fontWeight="700" fill="#D8F3DC" letterSpacing="1">✓ FIABLE</text>
      <text x="73" y="262" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="9" fill="#D8F3DC" fillOpacity="0.7">6 sources vérifiées</text>

      {/* RGE badge — bottom right */}
      <rect x="258" y="250" width="108" height="42" rx="12" fill="white" filter="drop-shadow(0 2px 8px rgba(0,0,0,0.08))" stroke="#D8F3DC" strokeWidth="1.5" />
      <text x="312" y="268" textAnchor="middle" fontFamily="Syne, sans-serif" fontSize="10" fontWeight="700" fill="#1B4332" letterSpacing="0.5">🌿 RGE</text>
      <text x="312" y="282" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="9" fill="#6B7280">Certifié ADEME</text>

      {/* BODACC badge — left side */}
      <rect x="8" y="130" width="100" height="38" rx="10" fill="white" filter="drop-shadow(0 2px 8px rgba(0,0,0,0.07))" stroke="#E4E2D9" strokeWidth="1" />
      <text x="58" y="147" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="9" fontWeight="600" fill="#6B7280">BODACC</text>
      <text x="58" y="160" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="9" fontWeight="700" fill="#166534">✓ Aucune alerte</text>

      {/* Floating dots */}
      <circle cx="150" cy="50" r="3" fill="#1B4332" fillOpacity="0.25" />
      <circle cx="240" cy="310" r="4" fill="#1B4332" fillOpacity="0.18" />
      <circle cx="340" cy="140" r="3" fill="#1B4332" fillOpacity="0.20" />
      <circle cx="60" cy="310" r="2.5" fill="#1B4332" fillOpacity="0.15" />
    </svg>
  )
}

/* ── Animated Counter ───────────────────────────────────── */
function AnimatedCounter({ target, suffix = '', duration = 1800 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const start = performance.now()
        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1)
          const ease = 1 - Math.pow(1 - progress, 3)
          setCount(Math.round(ease * target))
          if (progress < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.3 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [target, duration])

  return <span ref={ref}>{count.toLocaleString('fr-FR')}{suffix}</span>
}

/* ── Section observer (fade-in on scroll) ──────────────── */
function useSectionObserver() {
  useEffect(() => {
    const els = document.querySelectorAll('.section-hidden')
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('section-visible')
          entry.target.classList.remove('section-hidden')
        }
      })
    }, { threshold: 0.1 })
    els.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}

/* ── Mini form for FindArtisan ──────────────────────────── */
const MINI_WORK_TYPES = [
  { value: 'isolation', label: 'Isolation' }, { value: 'toiture', label: 'Toiture' },
  { value: 'plomberie', label: 'Plomberie' }, { value: 'electricite', label: 'Électricité' },
  { value: 'chauffage', label: 'Chauffage' }, { value: 'pac', label: 'Pompe à chaleur' },
  { value: 'photovoltaique', label: 'Panneaux solaires' }, { value: 'fenetres', label: 'Fenêtres' },
  { value: 'salle-de-bain', label: 'Salle de bain' }, { value: 'cuisine', label: 'Cuisine' },
  { value: 'carrelage', label: 'Carrelage' }, { value: 'maconnerie', label: 'Maçonnerie' },
]

function FindArtisanMiniForm() {
  const [type, setType] = useState('')
  const [ville, setVille] = useState('')
  const handleGo = () => {
    if (!type || !ville) return
    const isCP = /^\d{5}$/.test(ville.trim())
    const params = new URLSearchParams({ type })
    if (isCP) params.set('cp', ville.trim())
    else params.set('ville', ville.trim())
    window.location.href = `/trouver-artisan?${params}`
  }
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap', justifyContent: 'center' }}>
      <div style={{ flex: '1', minWidth: '160px', maxWidth: '210px' }}>
        <div style={{ position: 'relative' }}>
          <select value={type} onChange={e => setType(e.target.value)} style={{ width: '100%', padding: '12px 28px 12px 14px', borderRadius: '12px', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', color: type ? 'var(--color-text)' : 'var(--color-muted)', fontSize: '14px', fontFamily: 'var(--font-body)', appearance: 'none', cursor: 'pointer', outline: 'none' }}>
            <option value="">Type de travaux</option>
            {MINI_WORK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <ChevronRight size={13} color="var(--color-muted)" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%) rotate(90deg)', pointerEvents: 'none' }} />
        </div>
      </div>
      <div style={{ flex: '1', minWidth: '160px', maxWidth: '210px' }}>
        <div style={{ position: 'relative' }}>
          <MapPin size={14} color="var(--color-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input type="text" value={ville} onChange={e => setVille(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleGo()} placeholder="Ville ou code postal" style={{ width: '100%', padding: '12px 14px 12px 32px', borderRadius: '12px', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '14px', fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' }} />
        </div>
      </div>
      <button onClick={handleGo} disabled={!type || !ville} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '12px 22px', borderRadius: '12px', border: 'none', background: (type && ville) ? 'var(--color-accent)' : 'var(--color-border)', color: '#fff', fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-body)', cursor: (type && ville) ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap', height: '46px', transition: 'background 0.15s' }}>
        <Search size={15} />
        Trouver
      </button>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function Home() {
  const [result, setResult] = useState<SearchResult | null>(null)
  const [candidates, setCandidates] = useState<SearchCandidate[]>([])
  const [showCandidates, setShowCandidates] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingFiche, setLoadingFiche] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastQuery, setLastQuery] = useState('')
  const [selectedSiret, setSelectedSiret] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  // Filtres
  const [filterStatut, setFilterStatut] = useState<'tous' | 'actif' | 'fermé'>('tous')
  const [filterForme, setFilterForme] = useState('tous')
  const [filterAnciennete, setFilterAnciennete] = useState('tous')
  const [filterDept, setFilterDept] = useState('')
  const [sortBy, setSortBy] = useState<'pertinence' | 'anciennete'>('pertinence')
  const [user, setUser] = useState<User | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Scroll infini : observe le sentinel en bas de la liste
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || loading) return
    setLoadingMore(true)
    const nextPage = currentPage + 1
    try {
      const res = await fetch(`/api/search-list?q=${encodeURIComponent(lastQuery)}&page=${nextPage}`)
      const data = await res.json()
      if (!data.error && data.candidates) {
        setCandidates(prev => [...prev, ...data.candidates])
        setCurrentPage(nextPage)
        setHasMore(data.hasMore)
      }
    } catch { /* silent */ }
    finally { setLoadingMore(false) }
  }, [hasMore, loadingMore, loading, currentPage, lastQuery])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !showCandidates) return
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) loadMore()
    }, { threshold: 0.1 })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [showCandidates, loadMore])

  // Filtres appliqués côté client
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

  // Formes juridiques présentes dans les candidats
  const formesPresentes = useMemo(() => {
    const set = new Set(candidates.map(c => c.formeJuridique).filter(Boolean))
    return Array.from(set)
  }, [candidates])

  const saveSearch = async (data: SearchResult) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('searches').insert({ user_id: user.id, siret: data.siret, nom: data.nom, score: data.score, statut: data.statut })
  }

  const loadFiche = async (siret: string) => {
    setLoadingFiche(true)
    setError(null)
    setResult(null)
    setSelectedSiret(siret)
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(siret)}`)
      const data = await res.json()
      if (!res.ok || data.error) setError(data.error || 'Erreur lors du chargement.')
      else { setResult(data); setShowCandidates(false); saveSearch(data) }
    } catch { setError('Erreur réseau. Vérifiez votre connexion.') }
    finally { setLoadingFiche(false) }
  }

  const handleSearch = async (query: string) => {
    setLoading(true)
    setError(null)
    setResult(null)
    setCandidates([])
    setShowCandidates(false)
    setLastQuery(query)
    setCurrentPage(1)
    setHasMore(false)
    setTotalCount(0)
    setFilterStatut('tous')
    setFilterForme('tous')
    setFilterAnciennete('tous')
    setFilterDept('')
    setSortBy('pertinence')
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    try {
      const res = await fetch(`/api/search-list?q=${encodeURIComponent(query)}&page=1`)
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error || 'Aucun résultat trouvé.')
      } else if (data.isExact) {
        await loadFiche(data.siret)
      } else {
        setCandidates(data.candidates || [])
        setShowCandidates(true)
        setHasMore(data.hasMore ?? false)
        setTotalCount(data.total ?? 0)
      }
    } catch { setError('Erreur réseau. Vérifiez votre connexion.') }
    finally { setLoading(false) }
  }

  const handleBackToList = () => {
    setResult(null)
    setError(null)
    setSelectedSiret(null)
    setShowCandidates(true)
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }

  const showLanding = !result && !loading && !loadingFiche && !error && !showCandidates

  useSectionObserver()

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>

      {/* ── HEADER ── */}
      <SiteHeader onLogoClick={() => { setResult(null); setError(null) }} />

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section style={{
        background: showLanding ? 'var(--color-bg)' : 'var(--color-bg)',
        padding: showLanding ? '0' : '40px 24px 24px',
        transition: 'padding 0.3s',
        borderBottom: showLanding ? 'none' : 'none',
      }}>
        {showLanding ? (
          <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
            {/* Hero 2-column */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,0.9fr)',
              gap: '48px',
              alignItems: 'center',
              padding: '80px 0 64px',
            }} className="hero-grid">

              {/* LEFT — text + search */}
              <div className="fade-up">
                {/* Trust badge */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '12px', fontWeight: 600, color: 'var(--color-accent)', background: 'var(--color-accent-light)', padding: '5px 14px', borderRadius: '20px', marginBottom: '28px', border: '1px solid rgba(27,67,50,0.2)' }}>
                  <ShieldCheck size={13} />
                  Données 100% officielles — INSEE · ADEME · BODACC
                </div>

                <h1 className="font-display" style={{ margin: '0 0 20px', fontSize: 'clamp(36px, 5.5vw, 60px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.03em' }}>
                  Vérifiez votre artisan<br />
                  <span style={{ color: 'var(--color-accent)' }}>avant de signer.</span>
                </h1>

                <p style={{ margin: '0 0 36px', fontSize: '18px', color: 'var(--color-muted)', lineHeight: 1.65, maxWidth: '480px' }}>
                  26&nbsp;000 arnaques signalées en 2024. Protégez-vous en 30 secondes — <strong style={{ color: 'var(--color-text)' }}>100% gratuit</strong>.
                </p>

                {/* Search bar */}
                <div style={{ marginBottom: '12px' }}>
                  <SearchBar onSearch={handleSearch} loading={loading} />
                </div>

                {/* Quick filter pills */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
                  {[
                    { label: '🔧 Plomberie', q: 'plombier' },
                    { label: '⚡ Électricité', q: 'electricien' },
                    { label: '🧱 Maçonnerie', q: 'maçonnerie' },
                    { label: '🌿 Certifié RGE', q: 'RGE isolation' },
                    { label: '✅ Actif uniquement', q: lastQuery || 'artisan', statut: 'actif' },
                  ].map(({ label, q }) => (
                    <button key={label} onClick={() => handleSearch(q)}
                      style={{ padding: '5px 12px', borderRadius: '20px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-muted)', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--color-accent)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)'; (e.currentTarget as HTMLElement).style.color = 'var(--color-muted)' }}
                    >{label}</button>
                  ))}
                </div>

                {/* Trust badges row */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {[
                    { icon: '🏛️', label: 'Données INSEE officielles' },
                    { icon: '📋', label: 'BODACC en temps réel' },
                    { icon: '🆓', label: '100% gratuit' },
                  ].map(({ icon, label }) => (
                    <div key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 500, color: 'var(--color-muted)', background: 'var(--color-surface)', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--color-border)' }}>
                      <span>{icon}</span>
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT — illustration */}
              <div className="fade-up fade-up-delay-2" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ width: '100%', maxWidth: '380px' }}>
                  <HeroIllustration />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Compact search when result/list showing */
          <div style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 24px 24px' }}>
            <SearchBar onSearch={handleSearch} loading={loading || loadingFiche} />
          </div>
        )}
      </section>

      {/* ── RESULTS ZONE ── */}
      <div ref={resultsRef}>
        {error && (
          <section style={{ maxWidth: '680px', margin: '0 auto', padding: '20px 24px' }}>
            <div className="fade-up" style={{ padding: '16px', background: 'var(--color-danger-bg)', borderRadius: '14px', display: 'flex', gap: '10px', alignItems: 'flex-start', border: '1px solid var(--color-danger-border)' }}>
              <AlertTriangle size={18} color="var(--color-danger)" style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-danger)' }}>{error}</p>
            </div>
          </section>
        )}

        {/* ── Recherche en cours (liste) ── */}
        {loading && (
          <section style={{ maxWidth: '680px', margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--color-accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(27,67,50,0.15)' }}>
                <Search size={22} color="var(--color-accent)" style={{ animation: 'spin 1.5s linear infinite' }} />
              </div>
              <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--color-text)' }}>Recherche en cours…</p>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </section>
        )}

        {/* ── Liste des candidats ── */}
        {showCandidates && !loading && !loadingFiche && candidates.length > 0 && (
          <section style={{ maxWidth: '760px', margin: '0 auto', padding: '8px 24px 32px' }}>

            {/* Compteur + tri */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)' }}>
                <strong style={{ color: 'var(--color-text)' }}>{totalCount.toLocaleString('fr-FR')}</strong> entreprise{totalCount > 1 ? 's' : ''} trouvée{totalCount > 1 ? 's' : ''} pour <strong style={{ color: 'var(--color-text)' }}>« {lastQuery} »</strong>
                {filteredCandidates.length < candidates.length && (
                  <span style={{ color: 'var(--color-accent)' }}> — {filteredCandidates.length} après filtres</span>
                )}
              </p>
              <div style={{ display: 'flex', gap: '4px' }}>
                {(['pertinence', 'anciennete'] as const).map(s => (
                  <button key={s} onClick={() => setSortBy(s)}
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
                  <button key={s} onClick={() => setFilterStatut(s)}
                    style={{ padding: '4px 10px', borderRadius: '20px', border: '1px solid', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', ...(filterStatut === s ? { background: 'var(--color-accent)', color: '#fff', borderColor: 'var(--color-accent)' } : { background: 'transparent', color: 'var(--color-muted)', borderColor: 'var(--color-border)' }) }}
                  >{s === 'tous' ? 'Tous statuts' : s === 'actif' ? '🟢 Actif' : '🔴 Fermé'}</button>
                ))}
              </div>
              {/* Forme juridique */}
              <select value={filterForme} onChange={e => setFilterForme(e.target.value)}
                style={{ padding: '4px 10px', borderRadius: '20px', border: '1px solid var(--color-border)', background: filterForme !== 'tous' ? 'var(--color-accent-light)' : 'transparent', color: filterForme !== 'tous' ? 'var(--color-accent)' : 'var(--color-muted)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', outline: 'none' }}>
                <option value="tous">Forme jur.</option>
                {formesPresentes.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              {/* Ancienneté */}
              <select value={filterAnciennete} onChange={e => setFilterAnciennete(e.target.value)}
                style={{ padding: '4px 10px', borderRadius: '20px', border: '1px solid var(--color-border)', background: filterAnciennete !== 'tous' ? 'var(--color-accent-light)' : 'transparent', color: filterAnciennete !== 'tous' ? 'var(--color-accent)' : 'var(--color-muted)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', outline: 'none' }}>
                <option value="tous">Ancienneté</option>
                <option value="1">+1 an</option>
                <option value="3">+3 ans</option>
                <option value="10">+10 ans</option>
              </select>
              {/* Département */}
              <input type="text" placeholder="Dép. (ex: 75)" value={filterDept} onChange={e => setFilterDept(e.target.value)} maxLength={3}
                style={{ padding: '4px 10px', borderRadius: '20px', border: `1px solid ${filterDept ? 'var(--color-accent)' : 'var(--color-border)'}`, background: filterDept ? 'var(--color-accent-light)' : 'transparent', color: filterDept ? 'var(--color-accent)' : 'var(--color-muted)', fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-body)', outline: 'none', width: '90px' }} />
              {/* Reset */}
              {(filterStatut !== 'tous' || filterForme !== 'tous' || filterAnciennete !== 'tous' || filterDept) && (
                <button onClick={() => { setFilterStatut('tous'); setFilterForme('tous'); setFilterAnciennete('tous'); setFilterDept('') }}
                  style={{ padding: '4px 10px', borderRadius: '20px', border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  ✕ Réinitialiser
                </button>
              )}
            </div>

            {/* Liste */}
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px', overflow: 'hidden' }}>
              {filteredCandidates.length === 0 ? (
                <p style={{ padding: '24px', textAlign: 'center', color: 'var(--color-muted)', fontSize: '13px', margin: 0 }}>
                  Aucun résultat avec ces filtres.
                </p>
              ) : filteredCandidates.map((c, i) => (
                <button
                  key={c.siret}
                  onClick={() => loadFiche(c.siret)}
                  style={{
                    width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '14px 20px', background: selectedSiret === c.siret ? 'var(--color-accent-light)' : 'transparent',
                    border: 'none', borderBottom: i < filteredCandidates.length - 1 ? '1px solid var(--color-border)' : 'none',
                    cursor: 'pointer', transition: 'background 0.15s', fontFamily: 'var(--font-body)',
                  }}
                  onMouseEnter={e => { if (selectedSiret !== c.siret) (e.currentTarget as HTMLElement).style.background = 'var(--color-bg)' }}
                  onMouseLeave={e => { if (selectedSiret !== c.siret) (e.currentTarget as HTMLElement).style.background = selectedSiret === c.siret ? 'var(--color-accent-light)' : 'transparent' }}
                >
                  <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: c.statut === 'actif' ? '#22c55e' : '#ef4444', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '3px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>{c.nom}</span>
                      <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '20px', background: c.statut === 'actif' ? '#dcfce7' : '#fee2e2', color: c.statut === 'actif' ? '#166534' : '#991b1b' }}>
                        {c.statut === 'actif' ? 'Actif' : 'Fermé'}
                      </span>
                      {c.formeJuridique && <span style={{ fontSize: '10px', color: 'var(--color-muted)', fontWeight: 500 }}>{c.formeJuridique}</span>}
                      {c.dateCreation && <span style={{ fontSize: '10px', color: 'var(--color-muted)' }}>· depuis {new Date(c.dateCreation).getFullYear()}</span>}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-muted)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {(c.ville || c.codePostal) && <span>📍 {c.codePostal} {c.ville}</span>}
                      {c.activite && <span>· {c.activite}</span>}
                    </div>
                  </div>
                  <ChevronRight size={15} color="var(--color-muted)" style={{ flexShrink: 0 }} />
                </button>
              ))}
            </div>

            {/* Sentinel scroll infini */}
            <div ref={sentinelRef} style={{ height: '1px' }} />
            {loadingMore && (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-muted)', fontSize: '13px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <Search size={14} style={{ animation: 'spin 1.5s linear infinite' }} />
                  Chargement…
                </div>
              </div>
            )}
            {!hasMore && candidates.length > 0 && (
              <p style={{ textAlign: 'center', padding: '12px', color: 'var(--color-muted)', fontSize: '12px', margin: 0 }}>
                {candidates.length} entreprise{candidates.length > 1 ? 's' : ''} affichée{candidates.length > 1 ? 's' : ''}
              </p>
            )}
          </section>
        )}

        {/* ── Chargement fiche complète ── */}
        {loadingFiche && (
          <section style={{ maxWidth: '680px', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--color-accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(27,67,50,0.15)' }}>
                <ShieldCheck size={28} color="var(--color-accent)" style={{ animation: 'spin 2s linear infinite' }} />
              </div>
              <div>
                <p style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 600, color: 'var(--color-text)' }}>Vérification en cours…</p>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)' }}>Interrogation de 6 sources officielles</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '320px' }}>
                {['INSEE', 'ADEME', 'BODACC', 'INPI', 'RNE', 'Score'].map((src, i) => (
                  <span key={src} style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-muted)', animation: `fadeUp 0.3s ease-out ${i * 0.1}s forwards`, opacity: 0 }}>{src}</span>
                ))}
              </div>
            </div>
          </section>
        )}

        {result && !loadingFiche && (
          <section style={{ maxWidth: '680px', margin: '0 auto', padding: '16px 24px 80px' }}>
            {/* Bouton retour à la liste */}
            {candidates.length > 0 && (
              <button
                onClick={handleBackToList}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '16px', padding: '8px 14px', borderRadius: '10px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-muted)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--color-text)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--color-muted)'}
              >
                ← Modifier la recherche
              </button>
            )}
            <div className="fade-up">
              <ResultCard result={result} onSelect={handleSearch} />
            </div>
          </section>
        )}
      </div>

      {/* ══════════════════════════════════════════
          LANDING SECTIONS
      ══════════════════════════════════════════ */}
      {showLanding && (
        <>

          {/* ── ANIMATED STATISTICS ── */}
          <section style={{ padding: '72px 24px', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
            <div className="section-hidden" style={{ maxWidth: '860px', margin: '0 auto' }}>
              <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.10em', textAlign: 'center' }}>
                En France, chaque année
              </p>
              <h2 className="font-display" style={{ margin: '0 0 48px', fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, letterSpacing: '-0.02em', textAlign: 'center' }}>
                La fraude artisanale, un fléau sous-estimé
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {[
                  { target: 26000, suffix: '', label: 'signalements d\'arnaques', sub: 'DGCCRF 2024', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
                  { target: 34, suffix: '%', label: 'des foyers touchés', sub: 'par au moins 1 malfaçon', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
                  { target: 20000, suffix: '€', label: 'perte moyenne', sub: 'par sinistre non couvert', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
                ].map(({ target, suffix, label, sub, color, bg, border }) => (
                  <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: '20px', padding: '28px 20px', textAlign: 'center' }}>
                    <p style={{ margin: '0 0 8px', fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, letterSpacing: '-0.03em', color, fontFamily: 'var(--font-display)' }}>
                      <AnimatedCounter target={target} suffix={suffix} />
                    </p>
                    <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 600, lineHeight: 1.3, color: 'var(--color-text)' }}>{label}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-muted)' }}>{sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── HOW IT WORKS ── */}
          <section style={{ padding: '88px 24px', background: 'var(--color-bg)' }}>
            <div className="section-hidden" style={{ maxWidth: '860px', margin: '0 auto' }}>
              <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.10em', textAlign: 'center' }}>Simple & rapide</p>
              <h2 className="font-display" style={{ margin: '0 0 56px', fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 800, letterSpacing: '-0.02em', textAlign: 'center' }}>
                Comment ça marche
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
                {[
                  {
                    num: '01', color: '#1B4332', bg: '#D8F3DC',
                    svg: <svg viewBox="0 0 40 40" width="24" height="24" fill="none"><circle cx="18" cy="18" r="10" stroke="#1B4332" strokeWidth="2.5"/><line x1="26" y1="26" x2="34" y2="34" stroke="#1B4332" strokeWidth="2.5" strokeLinecap="round"/></svg>,
                    title: 'Tapez le nom ou SIRET', desc: 'Nom de l\'artisan, de l\'entreprise ou son numéro SIRET à 14 chiffres.',
                  },
                  {
                    num: '02', color: '#1B4332', bg: '#D8F3DC',
                    svg: <svg viewBox="0 0 40 40" width="24" height="24" fill="none"><path d="M20 4 L30 8 L30 22 C30 29 25 34 20 36 C15 34 10 29 10 22 L10 8 Z" stroke="#1B4332" strokeWidth="2.5" strokeLinejoin="round"/><path d="M14 21 L18 25 L26 17" stroke="#1B4332" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
                    title: 'On vérifie 6 sources', desc: 'INSEE, ADEME, BODACC, INPI, RNE et procédures collectives — en temps réel.',
                  },
                  {
                    num: '03', color: '#1B4332', bg: '#D8F3DC',
                    svg: <svg viewBox="0 0 40 40" width="24" height="24" fill="none"><circle cx="20" cy="20" r="14" stroke="#1B4332" strokeWidth="2.5"/><text x="20" y="25" textAnchor="middle" fill="#1B4332" fontSize="12" fontWeight="800" fontFamily="Syne,sans-serif">84</text></svg>,
                    title: 'Score + alertes instantanés', desc: 'Un score de confiance sur 100 avec toutes les alertes clés pour décider.',
                  },
                ].map(({ num, color, bg, svg, title, desc }) => (
                  <div key={num} className="card-hover" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: 'var(--shadow-card)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {svg}
                      </div>
                      <span style={{ fontSize: '28px', fontWeight: 800, color: 'rgba(27,67,50,0.15)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{num}</span>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 700, letterSpacing: '-0.01em' }}>{title}</p>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)', lineHeight: 1.6 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── WHAT WE CHECK ── */}
          <section style={{ padding: '88px 24px', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}>
            <div className="section-hidden" style={{ maxWidth: '860px', margin: '0 auto' }}>
              <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.10em', textAlign: 'center' }}>6 sources officielles</p>
              <h2 className="font-display" style={{ margin: '0 0 14px', fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 800, letterSpacing: '-0.02em', textAlign: 'center' }}>
                Ce qu'on vérifie
              </h2>
              <p style={{ margin: '0 0 52px', fontSize: '15px', color: 'var(--color-muted)', textAlign: 'center', lineHeight: 1.6 }}>
                Chaque rapport inclut ces 6 vérifications en temps réel, pour chaque artisan.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                {[
                  { icon: <CheckCircle2 size={20} />, color: '#166534', bg: '#dcfce7', title: 'Statut légal INSEE', source: 'Sirene officiel', desc: 'Active, fermée ou en cessation — vérification instantanée.', free: true },
                  { icon: <Leaf size={20} />, color: '#166534', bg: '#dcfce7', title: 'Certifications RGE', source: 'ADEME', desc: 'Obligatoire pour les aides MaPrimeRénov\'. Domaines et validité.', free: true },
                  { icon: <TrendingDown size={20} />, color: '#dc2626', bg: '#fee2e2', title: 'Procédures judiciaires', source: 'BODACC', desc: 'Redressement, liquidation, conciliation — détection automatique.', free: true },
                  { icon: <Users size={20} />, color: '#d97706', bg: '#fef3c7', title: 'Dirigeants & historique', source: 'RNE / INPI', desc: 'Identité complète, rôle et changements récents des gérants.', free: false },
                  { icon: <Clock size={20} />, color: '#7c3aed', bg: '#f3e8ff', title: 'Annonces légales', source: 'BODACC complet', desc: 'Toutes les publications officielles depuis la création.', free: false },
                  { icon: <Scale size={20} />, color: '#1B4332', bg: '#D8F3DC', title: 'Score de confiance', source: '0 → 100', desc: 'Calculé en temps réel à partir de tous les indicateurs.', free: true },
                ].map(({ icon, color, bg, title, source, desc, free }) => (
                  <div key={title} className="card-hover" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '18px', padding: '22px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
                        {icon}
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: free ? '#166534' : 'var(--color-muted)', background: free ? '#dcfce7' : 'var(--color-bg)', border: `1px solid ${free ? '#bbf7d0' : 'var(--color-border)'}`, padding: '3px 9px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                        {!free && <Lock size={8} />}
                        {free ? 'Gratuit' : 'Premium'}
                      </span>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 3px', fontSize: '14px', fontWeight: 700 }}>{title}</p>
                      <p style={{ margin: '0 0 7px', fontSize: '11px', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{source}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)', lineHeight: 1.55 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── ANALYZE QUOTE ── */}
          <section style={{ padding: '88px 24px', background: 'var(--color-bg)', borderTop: '1px solid var(--color-border)' }}>
            <div className="section-hidden" style={{ maxWidth: '860px', margin: '0 auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '56px', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--color-accent)', background: 'var(--color-accent-light)', padding: '5px 14px', borderRadius: '20px', marginBottom: '20px', border: '1px solid rgba(27,67,50,0.2)' }}>
                    <Zap size={12} />
                    Nouveau — Analyse IA
                  </div>
                  <h2 className="font-display" style={{ margin: '0 0 16px', fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 800, letterSpacing: '-0.02em' }}>
                    Votre devis est-il<br /><span style={{ color: 'var(--color-accent)' }}>vraiment conforme ?</span>
                  </h2>
                  <p style={{ margin: '0 0 24px', fontSize: '15px', color: 'var(--color-muted)', lineHeight: 1.7 }}>
                    Notre IA analyse en 30 secondes les 9 mentions légales obligatoires, les incohérences de prix et les clauses abusives.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
                    {['9 mentions légales vérifiées (SIRET, décennale, TVA…)', 'Alertes sur les clauses abusives', 'Cohérence des prix par IA', '1ère analyse gratuite'].map(item => (
                      <div key={item} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <CheckCircle2 size={16} color="#166534" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span style={{ fontSize: '14px', lineHeight: 1.5 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/analyser-devis" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 24px', borderRadius: '12px', background: 'var(--color-accent)', color: 'white', fontSize: '15px', fontWeight: 700, textDecoration: 'none', letterSpacing: '-0.01em', transition: 'background 0.15s' }}>
                    <FileSearch size={18} />Analyser mon devis<ChevronRight size={16} />
                  </Link>
                </div>
                {/* Mock card */}
                <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '15px', fontWeight: 800 }}>72</div>
                    <div>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: 700 }}>Analyse devis — 2 alertes</p>
                      <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-muted)' }}>Rénovation cuisine · 4 200&nbsp;€</p>
                    </div>
                  </div>
                  {[
                    { label: 'Numéro SIRET', ok: true }, { label: 'Assurance décennale', ok: false },
                    { label: 'TVA intracommunautaire', ok: true }, { label: 'Délai de rétractation 14j', ok: false },
                    { label: 'Acompte ≤ 30%', ok: true }, { label: 'Description des travaux', ok: true },
                  ].map(({ label, ok }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                      {ok ? <CheckCircle2 size={14} color="#166534" /> : <AlertTriangle size={14} color="#dc2626" />}
                      <span style={{ fontSize: '12px', color: ok ? 'var(--color-text)' : '#dc2626', fontWeight: ok ? 400 : 600 }}>{label}</span>
                    </div>
                  ))}
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#dc2626', fontWeight: 600 }}>⚠ 2 mentions manquantes — vérifiez avant de signer</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── FIND ARTISAN ── */}
          <section style={{ padding: '88px 24px', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}>
            <div className="section-hidden" style={{ maxWidth: '720px', margin: '0 auto' }}>
              <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.10em', textAlign: 'center' }}>Annuaire certifié</p>
              <h2 className="font-display" style={{ margin: '0 0 14px', fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 800, letterSpacing: '-0.02em', textAlign: 'center' }}>
                Trouver un artisan certifié RGE
              </h2>
              <p style={{ margin: '0 0 40px', fontSize: '15px', color: 'var(--color-muted)', textAlign: 'center', lineHeight: 1.6 }}>
                Score de confiance, certifications vérifiées, près de chez vous.
              </p>
              <FindArtisanMiniForm />
            </div>
          </section>

          {/* ── ASSISTANT JURIDIQUE ── */}
          <section style={{ padding: '88px 24px', background: 'var(--color-bg)', borderTop: '1px solid var(--color-border)' }}>
            <div className="section-hidden" style={{ maxWidth: '720px', margin: '0 auto' }}>
              <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.10em', textAlign: 'center' }}>IA Juridique</p>
              <h2 className="font-display" style={{ margin: '0 0 14px', fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 800, letterSpacing: '-0.02em', textAlign: 'center' }}>
                Que faire en cas de litige ?
              </h2>
              <p style={{ margin: '0 0 40px', fontSize: '15px', color: 'var(--color-muted)', textAlign: 'center', lineHeight: 1.6 }}>
                Vos droits et recours expliqués en français simple — gratuitement.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '32px' }}>
                {[
                  { href: '/assistant-juridique/artisan-disparu', icon: '🚨', label: 'Artisan disparu avec l\'acompte', desc: 'Mise en demeure, Signal Conso, tribunal' },
                  { href: '/assistant-juridique/travaux-mal-faits', icon: '🔨', label: 'Travaux mal faits', desc: 'Garantie décennale, recours amiables' },
                  { href: '/assistant-juridique/chantier-non-termine', icon: '🏗️', label: 'Chantier non terminé', desc: 'Abandonné, délai dépassé, recours' },
                ].map(({ href, icon, label, desc }) => (
                  <Link key={href} href={href} className="card-hover" style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '18px', borderRadius: '16px', textDecoration: 'none', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
                    <span style={{ fontSize: '24px', flexShrink: 0 }}>{icon}</span>
                    <div>
                      <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.3 }}>{label}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-muted)', lineHeight: 1.4 }}>{desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
              <div style={{ textAlign: 'center' }}>
                <Link href="/assistant-juridique" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 24px', borderRadius: '12px', background: '#7c3aed', color: '#fff', fontSize: '14px', fontWeight: 700, textDecoration: 'none' }}>
                  <MessageSquare size={16} />
                  Poser ma question juridique
                  <ChevronRight size={15} />
                </Link>
              </div>
            </div>
          </section>

          {/* ── TESTIMONIALS ── */}
          <section style={{ padding: '88px 24px', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}>
            <div className="section-hidden" style={{ maxWidth: '860px', margin: '0 auto' }}>
              <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.10em', textAlign: 'center' }}>Témoignages</p>
              <h2 className="font-display" style={{ margin: '0 0 12px', fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 800, letterSpacing: '-0.02em', textAlign: 'center' }}>
                Ils ont évité le pire
              </h2>
              <p style={{ margin: '0 0 52px', fontSize: '15px', color: 'var(--color-muted)', textAlign: 'center', lineHeight: 1.6 }}>
                30 secondes qui ont fait toute la différence.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                {[
                  { initials: 'SM', color: '#dc2626', bg: '#fee2e2', name: 'Sophie M.', location: 'Lyon', works: 'Salle de bain', tag: 'Liquidation judiciaire', tagColor: '#dc2626', tagBg: '#fee2e2', text: 'J\'allais signer un devis de 8 000€. Verifio m\'a montré que la société était en liquidation judiciaire depuis 3 mois. Sauvée !', stars: 5 },
                  { initials: 'TB', color: '#d97706', bg: '#fef3c7', name: 'Thierry B.', location: 'Nantes', works: 'Plomberie', tag: 'SIRET invalide', tagColor: '#dc2626', tagBg: '#fee2e2', text: 'Le plombier avait un SIRET qui n\'existait pas. Score de 18/100. J\'ai trouvé un artisan RGE avec un score de 84 grâce à l\'annuaire.', stars: 5 },
                  { initials: 'IR', color: '#7c3aed', bg: '#f3e8ff', name: 'Isabelle R.', location: 'Bordeaux', works: 'Isolation', tag: 'Changement de dirigeant', tagColor: '#d97706', tagBg: '#fef3c7', text: 'La société avait changé de gérant 2 fois en 6 mois. Un signal que je n\'aurais jamais vu sans Verifio. J\'ai pu demander des garanties.', stars: 5 },
                ].map(({ initials, color, bg, name, location, works, tag, tagColor, tagBg, text, stars }) => (
                  <div key={name} className="card-hover" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: 'var(--shadow-card)' }}>
                    <Quote size={18} color="var(--color-border)" />
                    <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.75, color: 'var(--color-text)', flex: 1 }}>{text}</p>
                    <div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 600, color: tagColor, background: tagBg, padding: '3px 10px', borderRadius: '20px', marginBottom: '14px' }}>
                        <AlertTriangle size={10} />{tag}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {/* Initials circle */}
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: bg, border: `2px solid ${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: '13px', fontWeight: 800, color }}>{initials}</span>
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: '13px', fontWeight: 700 }}>{name}</p>
                            <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-muted)' }}>{location} · {works}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {Array.from({ length: stars }).map((_, i) => <Star key={i} size={12} color="#f59e0b" fill="#f59e0b" />)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── PRICING ── */}
          <section style={{ padding: '88px 24px', background: 'var(--color-bg)', borderTop: '1px solid var(--color-border)' }}>
            <div className="section-hidden" style={{ maxWidth: '680px', margin: '0 auto' }}>
              <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.10em', textAlign: 'center' }}>Tarif</p>
              <h2 className="font-display" style={{ margin: '0 0 52px', fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 800, letterSpacing: '-0.02em', textAlign: 'center' }}>
                Gratuit + rapport complet à 4,90&nbsp;€
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '28px 24px', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-card)' }}>
                  <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Gratuit</p>
                  <p style={{ margin: '0 0 4px', fontSize: '40px', fontWeight: 800, letterSpacing: '-0.03em', fontFamily: 'var(--font-display)' }}>0&nbsp;€</p>
                  <p style={{ margin: '0 0 24px', fontSize: '12px', color: 'var(--color-muted)' }}>Sans inscription, sans CB</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px', flex: 1 }}>
                    {['Score de confiance /100', 'Statut légal actif / fermé', 'Certification RGE', 'Alertes procédures', 'Adresse & activité'].map(f => (
                      <div key={f} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <CheckCircle2 size={15} color="#166534" />
                        <span style={{ fontSize: '13px' }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ width: '100%', padding: '13px', borderRadius: '12px', border: '1.5px solid var(--color-border)', background: 'var(--color-bg)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'background 0.15s' }}>
                    Vérifier gratuitement
                  </button>
                </div>
                <div style={{ background: 'var(--color-accent)', borderRadius: '20px', padding: '28px 24px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '16px', right: '16px', background: '#D8F3DC', color: '#1B4332', fontSize: '10px', fontWeight: 800, padding: '4px 10px', borderRadius: '20px', letterSpacing: '0.05em' }}>RECOMMANDÉ</div>
                  <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 700, color: 'rgba(216,243,220,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rapport complet</p>
                  <p style={{ margin: '0 0 4px', fontSize: '40px', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff', fontFamily: 'var(--font-display)' }}>4,90&nbsp;€</p>
                  <p style={{ margin: '0 0 24px', fontSize: '12px', color: 'rgba(216,243,220,0.7)' }}>Rapport PDF · Valable 30 jours</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px', flex: 1 }}>
                    {['Tout du gratuit inclus', 'Dirigeants complets (INPI)', 'Historique BODACC complet', 'Capital social & finances', 'Synthèse IA personnalisée', 'Checklist documents légaux'].map(f => (
                      <div key={f} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <CheckCircle2 size={15} color="#D8F3DC" />
                        <span style={{ fontSize: '13px', color: '#fff' }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ width: '100%', padding: '13px', borderRadius: '12px', border: 'none', background: '#fff', color: 'var(--color-accent)', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'opacity 0.15s' }}>
                    Obtenir le rapport complet
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ── FINAL CTA ── */}
          <section style={{ background: 'var(--color-accent)', padding: '88px 24px' }}>
            <div className="section-hidden" style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
                <ShieldCheck size={20} color="#D8F3DC" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#D8F3DC', letterSpacing: '0.05em' }}>VERIFIO</span>
              </div>
              <h2 className="font-display" style={{ margin: '0 0 16px', fontSize: 'clamp(26px, 5vw, 44px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff', lineHeight: 1.1 }}>
                Vérifiez votre artisan maintenant
              </h2>
              <p style={{ margin: '0 0 36px', fontSize: '17px', color: 'rgba(216,243,220,0.85)', lineHeight: 1.6 }}>
                C&apos;est gratuit, sans inscription, en 30 secondes.
              </p>
              <div style={{ maxWidth: '520px', margin: '0 auto' }}>
                <SearchBar onSearch={handleSearch} loading={loading} dark />
              </div>
              <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '24px', flexWrap: 'wrap' }}>
                {['Sans inscription', 'Données officielles', 'Résultat immédiat'].map(t => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'rgba(216,243,220,0.8)', fontWeight: 500 }}>
                    <CheckCircle2 size={14} color="#D8F3DC" />
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── FOOTER ── */}
          <footer style={{ background: 'var(--color-text)', padding: '40px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} color="#D8F3DC" />
                <span className="font-display" style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>Verifio</span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                Données INSEE · ADEME · BODACC · INPI — À des fins d&apos;information uniquement
              </p>
              <div style={{ display: 'flex', gap: '20px' }}>
                {[
                  { href: '/trouver-artisan', label: 'Annuaire RGE' },
                  { href: '/simulateur-prix', label: 'Simulateur' },
                  { href: '/analyser-devis', label: 'Analyser devis' },
                  { href: '/assistant-juridique', label: 'Assistant IA' },
                ].map(({ href, label }) => (
                  <Link key={href} href={href} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', transition: 'color 0.15s' }}>{label}</Link>
                ))}
              </div>
            </div>
          </footer>

        </>
      )}

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="mobile-bottom-nav">
        {[
          { href: '/', icon: <Search size={20} />, label: 'Vérifier' },
          { href: '/trouver-artisan', icon: <MapPin size={20} />, label: 'Trouver' },
          { href: '/simulateur-prix', icon: <Calculator size={20} />, label: 'Simulateur' },
          { href: '/auth', icon: <ShieldCheck size={20} />, label: 'Compte' },
        ].map(({ href, icon, label }) => (
          <a key={href} href={href} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', textDecoration: 'none', color: 'var(--color-muted)', padding: '4px 0' }}>
            {icon}
            <span style={{ fontSize: '10px', fontWeight: 600 }}>{label}</span>
          </a>
        ))}
      </nav>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 720px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-grid > div:last-child { display: none !important; }
        }
      `}</style>
    </main>
  )
}
