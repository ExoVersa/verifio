'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, Loader2, CheckCircle2, XCircle, AlertCircle, Leaf, Award, Sparkles, ArrowRight, FileSearch } from 'lucide-react'
import type { SearchResult } from '@/types'

interface SlotState {
  query: string
  loading: boolean
  result: SearchResult | null
  error: string | null
  verdict: string | null
  verdictLoading: boolean
}

const emptySlot = (): SlotState => ({
  query: '', loading: false, result: null, error: null, verdict: null, verdictLoading: false,
})

function getAnciennete(dateCreation: string) {
  if (!dateCreation) return null
  const ans = Math.floor((Date.now() - new Date(dateCreation).getTime()) / (1000 * 60 * 60 * 24 * 365))
  return ans
}

function formatAnciennete(ans: number | null) {
  if (ans === null) return '—'
  if (ans === 0) return '< 1 an'
  return `${ans} an${ans > 1 ? 's' : ''}`
}

interface RowDef {
  label: string
  getValue: (r: SearchResult) => string | number | null
  compare: 'higher' | 'lower' | 'bool' | 'none'
  render?: (r: SearchResult) => React.ReactNode
}

const ROWS: RowDef[] = [
  {
    label: 'Score de confiance',
    getValue: (r) => r.score,
    compare: 'higher',
    render: (r) => (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <span style={{
          display: 'inline-block', width: '36px', height: '36px', borderRadius: '50%',
          background: r.score >= 75 ? 'var(--color-safe-bg)' : r.score >= 50 ? '#fef3c7' : 'var(--color-danger-bg)',
          color: r.score >= 75 ? 'var(--color-safe)' : r.score >= 50 ? '#d97706' : 'var(--color-danger)',
          fontWeight: 700, fontSize: '14px', lineHeight: '36px', textAlign: 'center',
        }}>{r.score}</span>
        <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>/100</span>
      </span>
    ),
  },
  {
    label: 'Statut',
    getValue: (r) => r.statut === 'actif' ? 1 : 0,
    compare: 'higher',
    render: (r) => (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 600, color: r.statut === 'actif' ? 'var(--color-safe)' : 'var(--color-danger)' }}>
        {r.statut === 'actif' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
        {r.statut}
      </span>
    ),
  },
  {
    label: 'Ancienneté',
    getValue: (r) => getAnciennete(r.dateCreation),
    compare: 'higher',
    render: (r) => {
      const ans = getAnciennete(r.dateCreation)
      return <span style={{ fontSize: '13px', fontWeight: 500 }}>{formatAnciennete(ans)}</span>
    },
  },
  {
    label: 'Effectif',
    getValue: (r) => {
      if (!r.effectif) return null
      const m = r.effectif.match(/(\d+)/)
      return m ? parseInt(m[1]) : null
    },
    compare: 'higher',
    render: (r) => <span style={{ fontSize: '13px', fontWeight: 500 }}>{r.effectif || <span style={{ color: 'var(--color-muted)' }}>—</span>}</span>,
  },
  {
    label: 'Certification RGE',
    getValue: (r) => r.rge.certifie ? 1 : 0,
    compare: 'bool',
    render: (r) => (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 600, color: r.rge.certifie ? 'var(--color-safe)' : 'var(--color-muted)' }}>
        <Leaf size={13} />
        {r.rge.certifie ? 'Oui' : 'Non'}
      </span>
    ),
  },
  {
    label: 'Procédures collectives',
    getValue: (r) => r.bodacc.procedureCollective ? 0 : 1,
    compare: 'higher',
    render: (r) => (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 600, color: r.bodacc.procedureCollective ? 'var(--color-danger)' : 'var(--color-safe)' }}>
        {r.bodacc.procedureCollective ? <AlertCircle size={13} /> : <CheckCircle2 size={13} />}
        {r.bodacc.procedureCollective ? (r.bodacc.typeProcedure || 'Détectée') : 'Aucune'}
      </span>
    ),
  },
  {
    label: 'Capital social',
    getValue: (r) => r.capitalSocial ?? null,
    compare: 'higher',
    render: (r) => (
      <span style={{ fontSize: '13px', fontWeight: 500 }}>
        {r.capitalSocial !== undefined ? `${r.capitalSocial.toLocaleString('fr-FR')} €` : <span style={{ color: 'var(--color-muted)' }}>—</span>}
      </span>
    ),
  },
  {
    label: 'Convention collective',
    getValue: (r) => r.conventionCollective ? 1 : 0,
    compare: 'bool',
    render: (r) => (
      <span style={{ fontSize: '13px', fontWeight: r.conventionCollective ? 500 : 400, color: r.conventionCollective ? 'var(--color-text)' : 'var(--color-muted)' }}>
        {r.conventionCollective || 'Non déclarée'}
      </span>
    ),
  },
  {
    label: 'Forme juridique',
    getValue: () => null,
    compare: 'none',
    render: (r) => <span style={{ fontSize: '13px', fontWeight: 500 }}>{r.formeJuridique || <span style={{ color: 'var(--color-muted)' }}>—</span>}</span>,
  },
  {
    label: 'Annonces légales',
    getValue: (r) => -r.bodacc.annonces.length,
    compare: 'higher',
    render: (r) => {
      const n = r.bodacc.annonces.length
      return (
        <span style={{ fontSize: '13px', fontWeight: 500, color: n > 3 ? 'var(--color-warn)' : 'var(--color-text)' }}>
          {n === 0 ? <span style={{ color: 'var(--color-muted)' }}>Aucune</span> : `${n} annonce${n > 1 ? 's' : ''}`}
        </span>
      )
    },
  },
]

function getBestIndex(slots: SlotState[], row: RowDef): number | null {
  if (row.compare === 'none') return null
  const results = slots.map((s) => (s.result ? row.getValue(s.result) : null))
  const values = results.filter((v): v is number => v !== null)
  if (values.length < 2) return null
  const best = row.compare === 'lower' ? Math.min(...values) : Math.max(...values)
  const idx = results.findIndex((v) => v === best)
  const ties = results.filter((v) => v === best).length
  if (ties > 1) return null
  return idx
}

function getBestScoreIndex(slots: SlotState[]): number | null {
  const scores = slots.map((s) => (s.result ? s.result.score : null))
  const valid = scores.filter((v): v is number => v !== null)
  if (valid.length < 2) return null
  const best = Math.max(...valid)
  const idx = scores.findIndex((v) => v === best)
  const ties = scores.filter((v) => v === best).length
  if (ties > 1) return null
  return idx
}

interface SearchInputProps {
  slot: SlotState
  index: number
  onSearch: (index: number, query: string) => void
  onClear: (index: number) => void
}

function SearchInput({ slot, index, onSearch, onClear }: SearchInputProps) {
  const [input, setInput] = useState(slot.query)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleChange = (val: string) => {
    setInput(val)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (val.trim().length >= 2) {
      timeoutRef.current = setTimeout(() => onSearch(index, val.trim()), 500)
    }
  }

  const handleClear = () => {
    setInput('')
    onClear(index)
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '8px 12px' }}>
        {slot.loading ? <Loader2 size={15} color="var(--color-muted)" style={{ flexShrink: 0, animation: 'spin 1s linear infinite' }} /> : <Search size={15} color="var(--color-muted)" style={{ flexShrink: 0 }} />}
        <input
          type="text"
          value={input}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={`Artisan ${index + 1} (nom, SIRET…)`}
          style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', fontFamily: 'var(--font-body)', color: 'var(--color-text)' }}
        />
        {(input || slot.result) && (
          <button onClick={handleClear} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--color-muted)' }}>
            <X size={14} />
          </button>
        )}
      </div>
      {slot.error && <p style={{ margin: '4px 0 0 4px', fontSize: '11px', color: 'var(--color-danger)' }}>{slot.error}</p>}
    </div>
  )
}

export default function ComparateurArtisans({ initialSiret }: { initialSiret?: string }) {
  const [slots, setSlots] = useState<SlotState[]>([emptySlot(), emptySlot()])
  const [thirdSlot, setThirdSlot] = useState(false)

  useEffect(() => {
    if (initialSiret) {
      searchByQuery(0, initialSiret)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSiret])

  const allSlots = thirdSlot ? [...slots, slots[2] ?? emptySlot()] : slots
  // Keep slots array always in sync
  const activeSlots = thirdSlot
    ? (slots.length >= 3 ? slots : [...slots, emptySlot()])
    : slots.slice(0, 2)

  const fetchVerdict = async (idx: number, result: SearchResult) => {
    setSlots((prev) => {
      const next = [...prev]
      if (!next[idx]) return prev
      next[idx] = { ...next[idx], verdictLoading: true, verdict: null }
      return next
    })
    try {
      const params = new URLSearchParams({
        nom: result.nom,
        statut: result.statut,
        score: String(result.score),
        dateCreation: result.dateCreation,
        rge: result.rge.certifie ? 'true' : 'false',
        procedureCollective: result.bodacc.procedureCollective ? 'true' : 'false',
        effectif: result.effectif || '',
        conventionCollective: result.conventionCollective || '',
      })
      const res = await fetch(`/api/comparer-verdict?${params}`)
      const data = await res.json()
      setSlots((prev) => {
        const next = [...prev]
        if (!next[idx]) return prev
        next[idx] = { ...next[idx], verdictLoading: false, verdict: data.verdict || null }
        return next
      })
    } catch {
      setSlots((prev) => {
        const next = [...prev]
        if (!next[idx]) return prev
        next[idx] = { ...next[idx], verdictLoading: false }
        return next
      })
    }
  }

  const searchByQuery = async (idx: number, query: string) => {
    setSlots((prev) => {
      const next = [...prev]
      while (next.length <= idx) next.push(emptySlot())
      next[idx] = { ...emptySlot(), query, loading: true }
      return next
    })
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      if (data.error || !data.siret) {
        setSlots((prev) => {
          const next = [...prev]
          next[idx] = { ...next[idx], loading: false, error: 'Artisan introuvable', result: null }
          return next
        })
      } else {
        setSlots((prev) => {
          const next = [...prev]
          next[idx] = { ...next[idx], loading: false, result: data, query }
          return next
        })
        fetchVerdict(idx, data)
      }
    } catch {
      setSlots((prev) => {
        const next = [...prev]
        next[idx] = { ...next[idx], loading: false, error: 'Erreur réseau' }
        return next
      })
    }
  }

  const handleSearch = (idx: number, query: string) => searchByQuery(idx, query)

  const handleClear = (idx: number) => {
    setSlots((prev) => {
      const next = [...prev]
      next[idx] = emptySlot()
      return next
    })
  }

  const bestScoreIdx = getBestScoreIndex(activeSlots)
  const hasAnyResult = activeSlots.some((s) => s.result)

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 16px 40px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 className="font-display" style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 6px' }}>
          Comparer des artisans
        </h1>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-muted)' }}>
          Cherchez 2 ou 3 artisans pour les comparer côte à côte sur les critères clés.
        </p>
      </div>

      {/* Search inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${activeSlots.length}, 1fr)`, gap: '12px', marginBottom: '24px', alignItems: 'start' }}>
        {activeSlots.map((slot, idx) => (
          <SearchInput key={idx} slot={slot} index={idx} onSearch={handleSearch} onClear={handleClear} />
        ))}
      </div>

      {!thirdSlot && (
        <button
          onClick={() => { setThirdSlot(true); setSlots((prev) => prev.length >= 3 ? prev : [...prev, emptySlot()]) }}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-muted)', background: 'none', border: '1px dashed var(--color-border)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', marginBottom: '24px', fontFamily: 'var(--font-body)' }}
        >
          + Ajouter un 3ème artisan
        </button>
      )}

      {!hasAnyResult && (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--color-muted)' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--color-surface)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Search size={22} color="var(--color-muted)" />
          </div>
          <p style={{ margin: 0, fontSize: '14px' }}>Recherchez un artisan par nom ou SIRET pour commencer la comparaison.</p>
        </div>
      )}

      {hasAnyResult && (
        <div style={{ border: '1px solid var(--color-border)', borderRadius: '16px', overflow: 'hidden', background: 'var(--color-surface)' }}>

          {/* Header columns */}
          <div style={{ display: 'grid', gridTemplateColumns: `200px repeat(${activeSlots.length}, 1fr)`, borderBottom: '2px solid var(--color-border)' }}>
            <div style={{ padding: '16px', background: 'var(--color-bg)' }} />
            {activeSlots.map((slot, idx) => (
              <div key={idx} style={{ padding: '16px', borderLeft: '1px solid var(--color-border)', position: 'relative', background: bestScoreIdx === idx ? 'linear-gradient(135deg, #f0fdf4 0%, #f0f9ff 100%)' : 'var(--color-surface)' }}>
                {bestScoreIdx === idx && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                    <Award size={12} color="#16a34a" />
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Meilleur profil</span>
                  </div>
                )}
                {slot.result ? (
                  <>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.3 }}>{slot.result.nom}</p>
                    <p style={{ margin: '3px 0 0', fontSize: '11px', color: 'var(--color-muted)' }}>{slot.result.activite}</p>
                    {/* Verdict IA */}
                    <div style={{ marginTop: '10px', padding: '8px 10px', borderRadius: '8px', background: 'color-mix(in srgb, var(--color-accent) 5%, transparent)', border: '1px solid color-mix(in srgb, var(--color-accent) 15%, transparent)', minHeight: '36px' }}>
                      {slot.verdictLoading ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Loader2 size={11} color="var(--color-muted)" style={{ animation: 'spin 1s linear infinite' }} />
                          <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>Analyse IA…</span>
                        </div>
                      ) : slot.verdict ? (
                        <div style={{ display: 'flex', gap: '5px', alignItems: 'flex-start' }}>
                          <Sparkles size={11} color="var(--color-accent)" style={{ flexShrink: 0, marginTop: '1px' }} />
                          <p style={{ margin: 0, fontSize: '11px', lineHeight: 1.55, color: 'var(--color-text)', fontStyle: 'italic' }}>{slot.verdict}</p>
                        </div>
                      ) : null}
                    </div>
                  </>
                ) : slot.loading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' }}>
                    <Loader2 size={14} color="var(--color-muted)" style={{ animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontSize: '13px', color: 'var(--color-muted)' }}>Recherche…</span>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)', fontStyle: 'italic' }}>En attente</p>
                )}
              </div>
            ))}
          </div>

          {/* Comparison rows */}
          {ROWS.map((row, rowIdx) => {
            const bestIdx = getBestIndex(activeSlots, row)
            const isOdd = rowIdx % 2 === 1
            return (
              <div key={rowIdx} style={{ display: 'grid', gridTemplateColumns: `200px repeat(${activeSlots.length}, 1fr)`, borderBottom: rowIdx < ROWS.length - 1 ? '1px solid var(--color-border)' : 'none', background: isOdd ? 'var(--color-bg)' : 'transparent' }}>
                <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)' }}>{row.label}</span>
                </div>
                {activeSlots.map((slot, colIdx) => {
                  const isHighlighted = bestIdx === colIdx
                  return (
                    <div key={colIdx} style={{ padding: '12px 16px', borderLeft: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', background: isHighlighted ? 'rgba(22, 163, 74, 0.06)' : 'transparent', position: 'relative' }}>
                      {isHighlighted && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: 'var(--color-safe)' }} />}
                      {slot.result
                        ? (row.render ? row.render(slot.result) : <span style={{ fontSize: '13px' }}>{String(row.getValue(slot.result) ?? '—')}</span>)
                        : <span style={{ fontSize: '13px', color: 'var(--color-muted)' }}>—</span>}
                    </div>
                  )
                })}
              </div>
            )
          })}

          {/* CTA row */}
          <div style={{ display: 'grid', gridTemplateColumns: `200px repeat(${activeSlots.length}, 1fr)`, borderTop: '2px solid var(--color-border)', background: 'var(--color-bg)' }}>
            <div style={{ padding: '16px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)' }}>Actions</span>
            </div>
            {activeSlots.map((slot, idx) => (
              <div key={idx} style={{ padding: '12px', borderLeft: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {slot.result ? (
                  <>
                    <a
                      href={`/?q=${encodeURIComponent(slot.result.siret)}`}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', background: 'var(--color-accent)', color: '#fff', fontSize: '12px', fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}
                    >
                      <ArrowRight size={12} />
                      Voir la fiche
                    </a>
                    <a
                      href={`/analyser-devis?artisan=${encodeURIComponent(slot.result.nom)}`}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)', fontSize: '12px', fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}
                    >
                      <FileSearch size={12} />
                      Analyser un devis
                    </a>
                  </>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
