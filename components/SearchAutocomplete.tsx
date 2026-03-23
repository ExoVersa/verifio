'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

/* ── Types ──────────────────────────────────────────────────── */
interface CompanyResult {
  siret: string
  nom: string
  ville: string
  dept: string
  formeJuridique: string
  activite: string
}

export interface RecentSearch {
  query: string
  ville: string
  timestamp: number
}

type Item =
  | { kind: 'company'; data: CompanyResult }
  | { kind: 'worktype'; label: string }
  | { kind: 'recent'; data: RecentSearch }

/* ── Static list ────────────────────────────────────────────── */
const WORK_TYPES = [
  'Plomberie', 'Électricité', 'Maçonnerie', 'Charpente',
  'Couverture', 'Isolation', 'Menuiserie', 'Peinture',
  'Carrelage', 'Chauffage', 'Climatisation', 'Serrurerie',
  'Plombier', 'Électricien', 'Maçon', 'Couvreur',
  'Chauffagiste', 'Menuisier', 'Peintre', 'Carreleur',
]

/* ── Cache ──────────────────────────────────────────────────── */
const CACHE_TTL = 60_000
const companyCache = new Map<string, { data: CompanyResult[]; ts: number }>()

/* ── LocalStorage helpers (exported for page use) ───────────── */
const LS_KEY = 'verifio_recent_searches'

export function getRecents(): RecentSearch[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] }
}

export function saveRecent(query: string, ville: string) {
  if (typeof window === 'undefined' || !query.trim()) return
  try {
    const existing = getRecents().filter(r => !(r.query === query && r.ville === ville))
    const updated = [{ query, ville, timestamp: Date.now() }, ...existing].slice(0, 5)
    localStorage.setItem(LS_KEY, JSON.stringify(updated))
  } catch { /* silent */ }
}

function clearRecents() {
  if (typeof window === 'undefined') return
  try { localStorage.removeItem(LS_KEY) } catch { /* silent */ }
}

/* ── Props ──────────────────────────────────────────────────── */
interface SearchAutocompleteProps {
  value: string
  onChange: (v: string) => void
  villeLabel: string
  onSearch: (q: string) => void
  onSelectRecent: (q: string, ville: string) => void
}

/* ── Component ──────────────────────────────────────────────── */
export function SearchAutocomplete({
  value,
  onChange,
  onSearch,
  onSelectRecent,
}: SearchAutocompleteProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [companies, setCompanies] = useState<CompanyResult[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [recents, setRecents] = useState<RecentSearch[]>([])

  const wrapperRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* ── Derived state ── */
  const showRecents = value.length === 0
  const filteredTypes = value.length >= 1
    ? WORK_TYPES.filter(t => t.toLowerCase().includes(value.toLowerCase())).slice(0, 5)
    : []
  const showCompanies = value.length >= 2

  /* ── Flat item list for keyboard nav ── */
  const recentCount = showRecents ? recents.length : 0
  const recentStart = 0
  const worktypeStart = recentCount
  const companyStart = recentCount + filteredTypes.length

  const items: Item[] = [
    ...(showRecents ? recents.map(r => ({ kind: 'recent' as const, data: r })) : []),
    ...filteredTypes.map(label => ({ kind: 'worktype' as const, label })),
    ...(showCompanies ? companies.map(data => ({ kind: 'company' as const, data })) : []),
  ]

  const isVisible = open && (
    (showRecents && recents.length > 0) ||
    filteredTypes.length > 0 ||
    showCompanies
  )

  /* ── Load recents ── */
  const loadRecents = () => setRecents(getRecents())

  /* ── Fetch companies (debounce + cache + abort) ── */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!showCompanies) { setCompanies([]); setLoadingCompanies(false); return }

    const cached = companyCache.get(value)
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setCompanies(cached.data); return
    }

    setLoadingCompanies(true)
    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort()
      abortRef.current = new AbortController()
      try {
        const params = new URLSearchParams({
          q: value, per_page: '5',
          activite_principale: '41,42,43,45,47,71,81',
        })
        const res = await fetch(
          `https://recherche-entreprises.api.gouv.fr/search?${params}`,
          { signal: abortRef.current.signal }
        )
        const json = await res.json()
        const results: CompanyResult[] = (json.results || []).map((r: Record<string, unknown>) => {
          const siege = (r.siege || {}) as Record<string, unknown>
          return {
            siret: String(siege.siret || ''),
            nom: String(r.nom_raison_sociale || r.nom_complet || ''),
            ville: String(siege.libelle_commune || ''),
            dept: String(siege.code_departement || ''),
            formeJuridique: String(r.nature_juridique_libelle || r.categorie_juridique_libelle || ''),
            activite: String(siege.libelle_activite_principale || r.activite_principale_libelle || ''),
          }
        })
        companyCache.set(value, { data: results, ts: Date.now() })
        setCompanies(results)
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setCompanies([])
      } finally {
        setLoadingCompanies(false)
      }
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  /* ── Click outside to close ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false); setActiveIndex(-1)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  /* ── Select item ── */
  const handleSelect = useCallback((item: Item) => {
    setOpen(false); setActiveIndex(-1)
    if (item.kind === 'company') {
      saveRecent(item.data.nom, item.data.ville)
      router.push(`/artisan/${item.data.siret}`)
    } else if (item.kind === 'worktype') {
      onChange(item.label)
      onSearch(item.label)
    } else {
      onSelectRecent(item.data.query, item.data.ville)
    }
  }, [onChange, onSearch, onSelectRecent, router])

  /* ── Keyboard nav ── */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') { setOpen(false); setActiveIndex(-1); return }
    if (!isVisible) {
      if (e.key === 'ArrowDown') { loadRecents(); setOpen(true) }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault(); setActiveIndex(i => Math.min(i + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); setActiveIndex(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && activeIndex >= 0 && items[activeIndex]) {
      e.preventDefault(); handleSelect(items[activeIndex])
    }
  }

  /* ── Section header ── */
  const SectionHeader = ({ label, action }: { label: string; action?: React.ReactNode }) => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 16px 5px', background: '#fafafa',
      borderBottom: '1px solid #f3f4f6',
    }}>
      <span style={{
        fontSize: '10px', fontWeight: 700, color: '#9ca3af',
        textTransform: 'uppercase', letterSpacing: '0.08em',
      }}>
        {label}
      </span>
      {action}
    </div>
  )

  /* ── Item renderer ── */
  const renderItem = (item: Item, idx: number) => {
    const isActive = idx === activeIndex
    const base: React.CSSProperties = {
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '12px 16px', cursor: 'pointer',
      background: isActive ? '#F8F4EF' : 'white',
      borderBottom: '1px solid #f3f4f6',
      transition: 'background 0.1s',
    }

    if (item.kind === 'company') {
      return (
        <div key={`c-${item.data.siret}`} style={base}
          onMouseDown={() => handleSelect(item)}
          onMouseEnter={() => setActiveIndex(idx)}
          onMouseLeave={() => setActiveIndex(-1)}
        >
          <span style={{ fontSize: '16px', width: '20px', textAlign: 'center', flexShrink: 0 }}>🔍</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 500,
              fontSize: '14px', color: '#111827',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {item.data.nom}
            </div>
            {(item.data.formeJuridique || item.data.activite) && (
              <div style={{
                fontSize: '12px', color: '#8A8A8A', marginTop: '2px',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {[item.data.formeJuridique, item.data.activite].filter(Boolean).join(' · ')}
              </div>
            )}
          </div>
          {(item.data.ville || item.data.dept) && (
            <span style={{ fontSize: '12px', color: '#8A8A8A', flexShrink: 0, textAlign: 'right' }}>
              {item.data.ville}{item.data.dept ? ` (${item.data.dept})` : ''}
            </span>
          )}
        </div>
      )
    }

    if (item.kind === 'worktype') {
      return (
        <div key={`w-${item.label}`} style={base}
          onMouseDown={() => handleSelect(item)}
          onMouseEnter={() => setActiveIndex(idx)}
          onMouseLeave={() => setActiveIndex(-1)}
        >
          <span style={{ fontSize: '16px', width: '20px', textAlign: 'center', flexShrink: 0 }}>📂</span>
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 500,
            fontSize: '14px', color: '#111827', flex: 1,
          }}>
            {item.label}
          </span>
          <span style={{ fontSize: '12px', color: '#8A8A8A', flexShrink: 0 }}>Types de travaux</span>
        </div>
      )
    }

    /* recent */
    return (
      <div key={`r-${item.data.timestamp}`} style={base}
        onMouseDown={() => handleSelect(item)}
        onMouseEnter={() => setActiveIndex(idx)}
        onMouseLeave={() => setActiveIndex(-1)}
      >
        <span style={{ fontSize: '16px', width: '20px', textAlign: 'center', flexShrink: 0 }}>🕐</span>
        <span style={{
          fontFamily: 'var(--font-display)', fontWeight: 500,
          fontSize: '14px', color: '#111827', flex: 1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {item.data.query}
        </span>
        {item.data.ville && (
          <span style={{ fontSize: '12px', color: '#8A8A8A', flexShrink: 0 }}>
            {item.data.ville}
          </span>
        )}
      </div>
    )
  }

  /* ── Render ── */
  return (
    <div ref={wrapperRef} style={{ flex: '2 1 240px', position: 'relative' }}>
      {/* Search icon */}
      <Search size={17} style={{
        position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
        color: 'var(--color-muted)', pointerEvents: 'none', zIndex: 1,
      }} />

      {/* Loading spinner */}
      {loadingCompanies && (
        <div style={{
          position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
          width: '16px', height: '16px', borderRadius: '50%',
          border: '2px solid #e5e7eb', borderTopColor: '#1B4332',
          animation: 'sa-spin 0.7s linear infinite', zIndex: 1, pointerEvents: 'none',
        }} />
      )}

      {/* Input */}
      <input
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); setActiveIndex(-1) }}
        onFocus={e => {
          e.target.style.borderColor = 'var(--color-accent)'
          loadRecents()
          setOpen(true)
        }}
        onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
        onKeyDown={handleKeyDown}
        placeholder="Nom, SIRET, activité..."
        autoComplete="off"
        style={{
          width: '100%', height: '52px',
          paddingLeft: '42px', paddingRight: loadingCompanies ? '40px' : '16px',
          border: '2px solid var(--color-border)', borderRadius: '12px',
          background: 'white', fontSize: '15px', fontFamily: 'var(--font-body)',
          color: 'var(--color-text)', outline: 'none',
          transition: 'border-color 0.15s', boxSizing: 'border-box',
        }}
      />

      {/* Dropdown */}
      {isVisible && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
          background: 'white', borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          border: '1px solid #e5e7eb',
          zIndex: 300, overflow: 'hidden',
        }}>
          <div style={{ maxHeight: '420px', overflowY: 'auto' }}>

            {/* Section: Récents */}
            {showRecents && recents.length > 0 && (
              <>
                <SectionHeader label="Récents" action={
                  <button
                    type="button"
                    onMouseDown={e => { e.preventDefault(); clearRecents(); setRecents([]) }}
                    style={{
                      background: 'none', border: 'none', fontSize: '11px', color: '#9ca3af',
                      cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 0,
                    }}
                  >
                    Effacer
                  </button>
                } />
                {recents.map((r, i) => renderItem({ kind: 'recent', data: r }, recentStart + i))}
              </>
            )}

            {/* Section: Types de travaux */}
            {filteredTypes.length > 0 && (
              <>
                <SectionHeader label="Types de travaux" />
                {filteredTypes.map((label, i) => renderItem({ kind: 'worktype', label }, worktypeStart + i))}
              </>
            )}

            {/* Section: Entreprises */}
            {showCompanies && (
              <>
                <SectionHeader label="Entreprises" />
                {loadingCompanies && companies.length === 0 && (
                  <div style={{ padding: '14px 16px', textAlign: 'center', fontSize: '13px', color: '#9ca3af' }}>
                    Recherche en cours…
                  </div>
                )}
                {!loadingCompanies && companies.length === 0 && (
                  <div style={{ padding: '14px 16px', fontSize: '13px', color: '#9ca3af' }}>
                    Aucune entreprise trouvée — essayez avec le SIRET directement
                  </div>
                )}
                {companies.map((data, i) => renderItem({ kind: 'company', data }, companyStart + i))}
              </>
            )}

          </div>
        </div>
      )}

      <style>{`@keyframes sa-spin { to { transform: translateY(-50%) rotate(360deg); } }`}</style>
    </div>
  )
}
