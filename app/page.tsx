'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ShieldCheck, CheckCircle, ArrowRight, MapPin, Leaf, Bell, ClipboardList, Shield, AlertTriangle, Check, Wrench, Zap, Home, Square, Layers, Thermometer, FileSearch, HardHat, ClipboardCheck, Gem, ChevronDown, ChevronRight, Star } from 'lucide-react'
import SiteHeader from '@/components/SiteHeader'
import { scoreColor } from '@/lib/score'
import type { SearchCandidate } from '@/types'

const CHIPS = [
  { icon: <Wrench size={13} strokeWidth={1.5} />, label: 'Plombier' },
  { icon: <Zap size={13} strokeWidth={1.5} />, label: 'Électricien' },
  { icon: <Layers size={13} strokeWidth={1.5} />, label: 'Maçon' },
  { icon: <Home size={13} strokeWidth={1.5} />, label: 'Couvreur' },
  { icon: <Thermometer size={13} strokeWidth={1.5} />, label: 'Chauffagiste' },
  { icon: <Square size={13} strokeWidth={1.5} />, label: 'Menuisier' },
]

function getInitials(nom: string) {
  const w = nom.trim().split(/\s+/)
  if (w.length === 1) return w[0].slice(0, 2).toUpperCase()
  return ((w[0]?.[0] ?? '') + (w[1]?.[0] ?? '')).toUpperCase()
}

function getDept(cp?: string) {
  if (!cp) return ''
  return cp.startsWith('97') ? cp.slice(0, 3) : cp.slice(0, 2)
}

/* ─── Hero Search ────────────────────────────────────────── */
function HeroSearch() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchCandidate[]>([])
  const [empty, setEmpty] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const router = useRouter()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function search(val: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (abortRef.current) abortRef.current.abort()
    if (val.trim().length < 2) { setResults([]); setEmpty(false); setShowDropdown(false); return }
    debounceRef.current = setTimeout(async () => {
      abortRef.current = new AbortController()
      setLoading(true)
      try {
        const res = await fetch(`/api/recherche?q=${encodeURIComponent(val.trim())}&per_page=6`, { signal: abortRef.current.signal })
        const data = await res.json()
        if (data.isExact && data.siret) { router.push(`/artisan/${data.siret}`); return }
        const list: SearchCandidate[] = data.results || []
        setResults(list.slice(0, 6))
        setEmpty(list.length === 0)
        setShowDropdown(true)
      } catch { /* aborted or network */ }
      finally { setLoading(false) }
    }, 300)
  }

  function handleChange(val: string) {
    setQuery(val)
    search(val)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setShowDropdown(false)
    router.push(`/recherche?q=${encodeURIComponent(query.trim())}`)
  }

  function handleChip(label: string) {
    setQuery(label)
    inputRef.current?.focus()
    search(label)
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', maxWidth: '680px', margin: '0 auto' }}>
      <form onSubmit={handleSubmit}>
        <div style={{
          display: 'flex', alignItems: 'center', background: 'white',
          borderRadius: '20px', boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
          overflow: 'hidden', height: '72px',
        }}>
          <div style={{ padding: '0 18px', color: '#9ca3af', flexShrink: 0 }}>
            <Search size={22} />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
            placeholder="Nom de l'artisan, SIRET, entreprise..."
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: '16px', fontFamily: 'var(--font-body)',
              color: '#1A1A1A', background: 'transparent', height: '100%', padding: '0 8px',
            }}
          />
          <div style={{ padding: '8px 8px 8px 0', flexShrink: 0 }}>
            <button
              type="submit"
              style={{
                background: '#52B788', color: 'white', border: 'none',
                height: '56px', padding: '0 28px', borderRadius: '14px',
                fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-body)',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                gap: '8px', whiteSpace: 'nowrap',
              }}
            >
              {loading
                ? <span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite' }}>⟳</span>
                : <>Vérifier <ArrowRight size={16} /></>
              }
            </button>
          </div>
        </div>
      </form>

      {/* Dropdown */}
      {showDropdown && (
        <div style={{
          position: 'absolute', top: '78px', left: 0, right: 0,
          background: 'white', borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.22)', zIndex: 300, overflow: 'hidden',
        }}>
          {/* Skeleton */}
          {loading && results.length === 0 && (
            <div style={{ padding: '12px 16px' }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px 0', borderBottom: i < 3 ? '1px solid #f3f4f6' : 'none' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#f3f4f6', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 14, background: '#f3f4f6', borderRadius: 4, width: '60%', marginBottom: 6 }} />
                    <div style={{ height: 11, background: '#f3f4f6', borderRadius: 4, width: '40%' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Empty state */}
          {!loading && empty && (
            <div style={{ padding: '28px 20px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>Aucune entreprise trouvée</p>
              <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>Essayez avec le SIRET directement</p>
            </div>
          )}
          {/* Results */}
          {results.map((r, i) => {
            const dept = getDept(r.codePostal)
            const sc = r.score ?? 0
            const col = scoreColor(sc)
            return (
              <button key={r.siret} onClick={() => { setShowDropdown(false); router.push(`/artisan/${r.siret}`) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  width: '100%', padding: '12px 16px', border: 'none',
                  background: 'transparent', cursor: 'pointer', textAlign: 'left',
                  borderBottom: i < results.length - 1 ? '1px solid #f3f4f6' : 'none',
                  fontFamily: 'var(--font-body)',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Avatar */}
                <div style={{
                  width: 40, height: 40, borderRadius: '10px', flexShrink: 0,
                  background: '#E8F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: 700, color: '#1B4332',
                }}>
                  {getInitials(r.nom)}
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.nom}</p>
                    <span style={{
                      fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '20px', flexShrink: 0,
                      background: r.statut === 'actif' ? '#f0fdf4' : '#fef2f2',
                      color: r.statut === 'actif' ? '#16a34a' : '#dc2626',
                    }}>
                      {r.statut === 'actif' ? 'ACTIF' : 'FERMÉ'}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                    {r.formeJuridique && <span>{r.formeJuridique} · </span>}
                    {r.ville && <span>{r.ville}{dept ? ` (${dept})` : ''}</span>}
                  </p>
                </div>
                {/* Score */}
                {sc > 0 && (
                  <span style={{ fontSize: '12px', fontWeight: 700, color: col, flexShrink: 0 }}>
                    {sc}/100
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Chips */}
      <div style={{
        display: 'flex', gap: '8px', marginTop: '16px',
        flexWrap: 'wrap', justifyContent: 'center',
      }}>
        {CHIPS.map(({ icon, label }) => (
          <button
            key={label}
            onClick={() => handleChip(label)}
            style={{
              background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)',
              border: '1px solid rgba(255,255,255,0.3)', borderRadius: '100px',
              padding: '7px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', flexShrink: 0,
              transition: 'background 0.15s',
              display: 'inline-flex', alignItems: 'center', gap: '5px',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
          >
            {icon} {label}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ─── Score Ring ─────────────────────────────────────────── */
function ScoreRing({ score }: { score: number }) {
  const [visible, setVisible] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const r = 44
  const circumference = 2 * Math.PI * r

  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const dashoffset = visible ? circumference * (1 - score / 100) : circumference

  return (
    <div style={{ position: 'relative', width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg ref={svgRef} width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#E8E3DC" strokeWidth="7" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke="#52B788" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashoffset}
          transform="rotate(-90 50 50)"
          style={{ transition: visible ? 'stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)' : 'none' }}
        />
      </svg>
      <div style={{ position: 'absolute', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '32px', color: '#1B4332', lineHeight: 1 }}>
          {score}
        </div>
        <div style={{ fontSize: '11px', color: '#8A8A8A', fontWeight: 600 }}>/100</div>
      </div>
    </div>
  )
}

/* ─── Hero Mockup Card ───────────────────────────────────── */
function HeroMockupCard() {
  return (
    <div style={{
      background: 'white', borderRadius: '24px', padding: '28px',
      boxShadow: '0 32px 80px rgba(0,0,0,0.28)',
      maxWidth: '340px', width: '100%',
      transform: 'rotate(-2deg)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
          background: '#1B4332', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', fontWeight: 800, color: '#D8F3DC', fontFamily: 'var(--font-display)',
        }}>
          MB
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1A1A1A', fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>
            Martin Bâtiment SARL
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: '#8A8A8A', marginTop: '2px' }}>
            Plombier · Tours (37)
          </p>
        </div>
      </div>

      {/* Score ring */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <ScoreRing score={87} />
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '16px' }}>
        <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac', borderRadius: '20px', padding: '4px 10px', fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
          <Check size={10} strokeWidth={1.5} /> SIRET actif
        </span>
        <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac', borderRadius: '20px', padding: '4px 10px', fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
          <Check size={10} strokeWidth={1.5} /> Certifié RGE
        </span>
        <span style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', borderRadius: '20px', padding: '4px 10px', fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
          <AlertTriangle size={10} strokeWidth={1.5} /> 1 alerte BODACC
        </span>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #F0EFE9', margin: '0 0 14px' }} />

      {/* Checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
        {[
          { ok: true,  text: 'Entreprise active depuis 8 ans' },
          { ok: true,  text: 'Certification RGE valide' },
          { ok: true,  text: 'Aucune liquidation judiciaire' },
          { ok: false, text: '1 procédure BODACC détectée' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ flexShrink: 0, color: item.ok ? '#16a34a' : '#d97706', display: 'flex' }}>
              {item.ok ? <Check size={13} strokeWidth={1.5} /> : <AlertTriangle size={13} strokeWidth={1.5} />}
            </span>
            <span style={{ fontSize: '12px', color: '#4A4A4A' }}>{item.text}</span>
          </div>
        ))}
      </div>

      {/* CTA button */}
      <button style={{
        width: '100%', padding: '12px', borderRadius: '12px',
        background: '#1B4332', color: 'white', border: 'none',
        fontSize: '13px', fontWeight: 700, cursor: 'pointer',
        fontFamily: 'var(--font-display)', letterSpacing: '0.01em',
      }}>
        Voir le rapport complet →
      </button>
    </div>
  )
}

/* ─── Floating Badge ─────────────────────────────────────── */
function FloatingBadge({ children, style, animClass }: {
  children: React.ReactNode
  style: React.CSSProperties
  animClass: string
}) {
  return (
    <div
      className={animClass}
      style={{
        position: 'absolute',
        borderRadius: '100px',
        padding: '8px 14px',
        fontSize: '12px', fontWeight: 700,
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        whiteSpace: 'nowrap', zIndex: 10,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/* ─── Animated stat inline ───────────────────────────────── */
function AnimatedStatInline({ value, suffix }: { value: number; suffix: string }) {
  const [display, setDisplay] = useState('0')
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const duration = 1800
        const start = performance.now()
        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1)
          const ease = 1 - Math.pow(1 - progress, 3)
          setDisplay(Math.round(ease * value).toLocaleString('fr-FR'))
          if (progress < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.3 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [value])

  return <span ref={ref}>{display}{suffix}</span>
}

/* ─── Timeline Section ───────────────────────────────────── */
const TIMELINE_STEPS = [
  {
    num: '01',
    icon: Search,
    title: 'Vous trouvez un artisan',
    desc: 'Recherchez par nom, SIRET ou type de travaux. Obtenez un score de confiance en 30 secondes.',
    cta: { href: '/recherche', label: 'Rechercher un artisan' },
    points: ['SIRET vérifié en temps réel', 'Certifications RGE officielles', 'Alertes BODACC et procédures', 'Score de fiabilité 0–100'],
  },
  {
    num: '02',
    icon: FileSearch,
    title: 'Vous analysez son devis',
    desc: 'Notre IA contrôle la conformité légale de votre devis et compare les prix du marché.',
    cta: { href: '/analyser-devis', label: 'Analyser mon devis' },
    points: ['Mentions obligatoires vérifiées', 'Prix comparés au marché local', 'Détection de clauses abusives', 'Rapport PDF téléchargeable'],
  },
  {
    num: '03',
    icon: ClipboardCheck,
    title: 'Vous signez en confiance',
    desc: 'La checklist pré-signature vous guide pour ne rien oublier avant le premier coup de marteau.',
    cta: { href: '/mes-chantiers', label: 'Ouvrir ma checklist' },
    points: ['Contrat et devis signés', 'Acompte ≤ 30 % vérifié', 'Assurance décennale contrôlée', 'Garanties contractuelles en place'],
  },
  {
    num: '04',
    icon: HardHat,
    title: 'Vous suivez le chantier',
    desc: 'Le carnet de chantier centralise journal, paiements, photos et documents en un seul endroit.',
    cta: { href: '/mes-chantiers', label: 'Mon carnet de chantier' },
    points: ['Journal des événements', 'Suivi des paiements et acomptes', 'Photos horodatées', 'Documents et factures'],
  },
  {
    num: '05',
    icon: CheckCircle,
    title: 'Vous réceptionnez les travaux',
    desc: 'La checklist de réception vous aide à constater et formaliser les éventuelles réserves.',
    cta: { href: '/mes-chantiers', label: 'Checklist de réception' },
    points: ['PV de réception guidé', 'Réserves documentées', 'Délai de rétractation rappelé', 'Garanties légales activées'],
  },
]

function TimelineSection() {
  const [active, setActive] = useState(0)
  const step = TIMELINE_STEPS[active]
  const StepIcon = step.icon
  return (
    <section style={{ background: '#F8F4EF', padding: '96px 0' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(27,67,50,0.08)', border: '1px solid rgba(27,67,50,0.15)', borderRadius: '100px', padding: '8px 18px', fontSize: '13px', color: '#1B4332', marginBottom: '16px', fontWeight: 600 }}>
            <ClipboardList size={13} strokeWidth={1.5} /> De la recherche à la réception
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(28px, 4vw, 40px)', color: '#1A1A1A', margin: '0 0 12px' }}>
            Verifio vous accompagne<br />à chaque étape
          </h2>
          <p style={{ fontSize: '17px', color: '#4A4A4A', margin: 0 }}>5 étapes pour un chantier sans surprise.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '40px', alignItems: 'start' }}>
          {/* Left: step list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {TIMELINE_STEPS.map((s, i) => {
              const Icon = s.icon
              const isActive = i === active
              return (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '16px 20px', borderRadius: '14px', cursor: 'pointer', textAlign: 'left',
                    border: isActive ? '1.5px solid #1B4332' : '1.5px solid transparent',
                    background: isActive ? 'white' : 'transparent',
                    boxShadow: isActive ? '0 4px 16px rgba(27,67,50,0.10)' : 'none',
                    transition: 'all 0.2s', fontFamily: 'var(--font-body)',
                  }}
                >
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
                    background: isActive ? '#1B4332' : '#E8E3DC',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.2s',
                  }}>
                    <Icon size={18} color={isActive ? 'white' : '#8A8A8A'} strokeWidth={1.5} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: isActive ? '#52B788' : '#8A8A8A', letterSpacing: '0.1em', marginBottom: '2px' }}>
                      ÉTAPE {s.num}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: isActive ? '#1A1A1A' : '#4A4A4A', lineHeight: 1.3 }}>
                      {s.title}
                    </div>
                  </div>
                  <ChevronRight size={16} color={isActive ? '#1B4332' : '#C8C2BB'} strokeWidth={1.5} style={{ flexShrink: 0 }} />
                </button>
              )
            })}
          </div>

          {/* Right: detail panel */}
          <div style={{ background: 'white', borderRadius: '24px', padding: '36px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', position: 'sticky', top: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: '#1B4332', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <StepIcon size={24} color="white" strokeWidth={1.5} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#52B788', letterSpacing: '0.1em', marginBottom: '2px' }}>ÉTAPE {step.num}</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '20px', color: '#1A1A1A', margin: 0 }}>{step.title}</h3>
              </div>
            </div>
            <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.7, margin: '0 0 24px' }}>{step.desc}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
              {step.points.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#f0fdf4', border: '1px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={11} color="#16a34a" strokeWidth={2.5} />
                  </div>
                  <span style={{ fontSize: '14px', color: '#1A1A1A' }}>{p}</span>
                </div>
              ))}
            </div>
            <a
              href={step.cta.href}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#1B4332', color: 'white', borderRadius: '12px', padding: '12px 22px', fontSize: '14px', fontWeight: 700, textDecoration: 'none', fontFamily: 'var(--font-body)', transition: 'background 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#2D6A4F')}
              onMouseLeave={e => (e.currentTarget.style.background = '#1B4332')}
            >
              {step.cta.label} <ArrowRight size={15} strokeWidth={1.5} />
            </a>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .timeline-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}

/* ─── Pricing Section ────────────────────────────────────── */
function PricingSection() {
  const PLANS = [
    {
      name: 'Gratuit',
      price: '0€',
      desc: 'Pour vérifier rapidement un artisan',
      color: '#4A4A4A',
      border: '#E8E3DC',
      bg: 'white',
      badge: null,
      cta: { href: '/recherche', label: 'Commencer gratuitement', style: 'outline' as const },
      features: [
        { ok: true,  text: 'Recherche par nom / SIRET' },
        { ok: true,  text: 'Score de fiabilité 0–100' },
        { ok: true,  text: 'Statut légal INSEE' },
        { ok: true,  text: 'Certifications RGE' },
        { ok: false, text: 'Rapport PDF complet' },
        { ok: false, text: 'Analyse de devis par IA' },
        { ok: false, text: 'Alertes BODACC en temps réel' },
        { ok: false, text: 'Carnet de chantier illimité' },
      ],
    },
    {
      name: 'Pack Sérénité',
      price: '4,90€',
      desc: 'Par rapport — un seul achat',
      color: 'white',
      border: '#1B4332',
      bg: '#1B4332',
      badge: '⭐ Le plus populaire',
      cta: { href: '/pricing', label: 'Obtenir le rapport', style: 'solid' as const },
      features: [
        { ok: true,  text: 'Tout ce qui est gratuit' },
        { ok: true,  text: 'Rapport PDF complet' },
        { ok: true,  text: 'Analyse de devis par IA' },
        { ok: true,  text: 'Alertes BODACC en temps réel' },
        { ok: true,  text: 'Détection clauses abusives' },
        { ok: true,  text: 'Carnet de chantier illimité' },
        { ok: false, text: 'Accès multi-artisans' },
        { ok: false, text: 'Support prioritaire' },
      ],
    },
    {
      name: 'Pack Tranquillité',
      price: 'Bientôt',
      desc: 'Pour un suivi complet et illimité',
      color: '#4A4A4A',
      border: '#E8E3DC',
      bg: 'white',
      badge: null,
      cta: { href: '/pricing', label: 'Être notifié', style: 'outline' as const },
      features: [
        { ok: true,  text: 'Tout du Pack Sérénité' },
        { ok: true,  text: 'Accès multi-artisans' },
        { ok: true,  text: 'Support prioritaire' },
        { ok: true,  text: 'Alertes automatiques illimitées' },
        { ok: true,  text: 'Espace artisan partagé' },
        { ok: true,  text: 'Exports comptables' },
        { ok: true,  text: 'API accès professionnel' },
        { ok: true,  text: 'Accompagnement dédié' },
      ],
    },
  ]
  return (
    <section style={{ background: 'white', padding: '96px 0' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: '100px', padding: '8px 18px', fontSize: '13px', color: '#c2410c', marginBottom: '16px', fontWeight: 600 }}>
            <Gem size={13} strokeWidth={1.5} /> Tarifs transparents
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(28px, 4vw, 40px)', color: '#1A1A1A', margin: '0 0 12px' }}>
            Gratuit pour commencer,<br />complet quand vous en avez besoin
          </h2>
          <p style={{ fontSize: '17px', color: '#4A4A4A', margin: 0 }}>Un seul achat, aucun abonnement imposé.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', alignItems: 'stretch' }}>
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              style={{
                background: plan.bg, border: `2px solid ${plan.border}`,
                borderRadius: '24px', padding: '32px', display: 'flex',
                flexDirection: 'column', gap: '0',
                boxShadow: plan.bg === '#1B4332' ? '0 16px 48px rgba(27,67,50,0.25)' : '0 2px 8px rgba(0,0,0,0.06)',
                transform: plan.bg === '#1B4332' ? 'scale(1.04)' : 'none',
                position: 'relative',
              }}
            >
              {plan.badge && (
                <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: '#52B788', color: 'white', borderRadius: '100px', padding: '5px 16px', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {plan.badge}
                </div>
              )}
              <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: plan.bg === '#1B4332' ? 'rgba(255,255,255,0.7)' : '#8A8A8A' }}>{plan.name}</span>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '36px', color: plan.color, lineHeight: 1, marginBottom: '6px' }}>
                {plan.price}
              </div>
              <p style={{ fontSize: '13px', color: plan.bg === '#1B4332' ? 'rgba(255,255,255,0.6)' : '#8A8A8A', margin: '0 0 24px', lineHeight: 1.4 }}>{plan.desc}</p>
              <hr style={{ border: 'none', borderTop: `1px solid ${plan.bg === '#1B4332' ? 'rgba(255,255,255,0.15)' : '#F0EFE9'}`, margin: '0 0 20px' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
                {plan.features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: f.ok ? (plan.bg === '#1B4332' ? 'rgba(82,183,136,0.2)' : '#f0fdf4') : 'transparent' }}>
                      {f.ok
                        ? <Check size={10} color={plan.bg === '#1B4332' ? '#52B788' : '#16a34a'} strokeWidth={2.5} />
                        : <span style={{ width: '10px', height: '1px', display: 'block', background: plan.bg === '#1B4332' ? 'rgba(255,255,255,0.2)' : '#D1CBC3' }} />
                      }
                    </div>
                    <span style={{ fontSize: '13px', color: f.ok ? (plan.bg === '#1B4332' ? 'rgba(255,255,255,0.9)' : '#1A1A1A') : (plan.bg === '#1B4332' ? 'rgba(255,255,255,0.35)' : '#B0AAA3') }}>
                      {f.text}
                    </span>
                  </div>
                ))}
              </div>
              <a
                href={plan.cta.href}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '13px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: 700,
                  textDecoration: 'none', fontFamily: 'var(--font-body)', transition: 'all 0.2s',
                  ...(plan.cta.style === 'solid'
                    ? { background: 'white', color: '#1B4332', border: 'none' }
                    : { background: 'transparent', color: plan.bg === '#1B4332' ? 'white' : '#1B4332', border: `1.5px solid ${plan.bg === '#1B4332' ? 'rgba(255,255,255,0.4)' : '#1B4332'}` }
                  ),
                }}
              >
                {plan.cta.label} <ArrowRight size={14} strokeWidth={1.5} />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Main Page ─────────────────────────────────────────── */
export default function HomePage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-cream)' }}>
      <SiteHeader />

      {/* ── SECTION 1 : HERO ── */}
      <section style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {/* Background photo */}
        <div className="hero-bg-photo" style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1400)',
          backgroundSize: 'cover', backgroundPosition: 'center',
        }} />
        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(27,67,50,0.92) 0%, rgba(27,67,50,0.78) 100%)',
        }} />

        {/* Floating badges */}
        <div className="fb fb-1" style={{ top: '28%', left: '5%', background: 'white', color: '#1B4332', display: 'flex', alignItems: 'center', gap: '5px' }}><Check size={13} strokeWidth={1.5} /> SIRET vérifié INSEE</div>
        <div className="fb fb-2" style={{ top: '22%', right: '6%', background: '#F0FDF4', color: '#166534', display: 'flex', alignItems: 'center', gap: '5px' }}><Leaf size={13} strokeWidth={1.5} /> Certifié RGE</div>
        <div className="fb fb-3" style={{ top: '55%', left: '4%', background: '#FFF8E7', color: '#B45309', display: 'flex', alignItems: 'center', gap: '5px' }}><AlertTriangle size={13} strokeWidth={1.5} /> Procédure BODACC</div>
        <div className="fb fb-4" style={{ top: '62%', right: '5%', background: 'white', color: '#1B4332', display: 'flex', alignItems: 'center', gap: '5px' }}><Bell size={13} strokeWidth={1.5} /> Alerte activée</div>
        <div className="fb fb-5" style={{ top: '14%', right: '10%', background: 'white', color: '#4A4A4A', display: 'flex', alignItems: 'center', gap: '5px' }}><ClipboardList size={13} strokeWidth={1.5} /> 18 ans d&apos;activité</div>

        <div style={{ position: 'relative', zIndex: 1, padding: '80px 24px 40px', textAlign: 'center' }}>
          {/* Badge pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(82,183,136,0.18)', border: '1px solid rgba(82,183,136,0.45)',
            borderRadius: '100px', padding: '8px 18px', fontSize: '13px', color: '#52B788',
            marginBottom: '16px', fontWeight: 600,
          }}>
            <Shield size={13} strokeWidth={1.5} /> Données officielles · Gratuit pour les particuliers
          </div>

          {/* H1 */}
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: 'clamp(32px, 5vw, 64px)',
            color: 'white', lineHeight: 1.1, margin: '0 auto 12px',
            letterSpacing: '-0.02em', maxWidth: '820px',
          }}>
            Vérifiez votre <span style={{ color: '#52B788' }}>artisan</span><br />
            avant qu&apos;il soit trop tard
          </h1>

          {/* Sous-titre */}
          <p style={{
            fontSize: '17px', color: 'rgba(255,255,255,0.8)',
            lineHeight: 1.6, margin: '0 auto 24px',
            fontFamily: 'var(--font-body)', maxWidth: '480px',
          }}>
            26 000 arnaques signalées en 2024 —<br />vérifiez en 30 secondes
          </p>

          {/* Search bar */}
          <div style={{ padding: '0 16px' }}>
            <HeroSearch />
          </div>
        </div>
      </section>

      {/* ── SECTION 2 : STATS ── */}
      <section style={{ background: 'white', padding: '0', borderBottom: '1px solid #F0EFE9' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {[
              { value: 26000, label: 'Arnaques analysées', suffix: '+' },
              { value: 6,     label: 'Sources officielles', suffix: '' },
              { value: '30s', label: 'Pour un verdict', suffix: '' },
              { value: '100%', label: 'Gratuit pour les particuliers', suffix: '' },
            ].map((stat, i) => (
              <div key={i} style={{
                padding: '40px 24px',
                borderRight: i < 3 ? '1px solid #F0EFE9' : 'none',
                textAlign: 'center',
              }}>
                <div style={{
                  fontFamily: 'var(--font-display)', fontWeight: 800,
                  fontSize: 'clamp(32px, 3.5vw, 48px)', color: '#1B4332', lineHeight: 1,
                }}>
                  {typeof stat.value === 'number'
                    ? <AnimatedStatInline value={stat.value} suffix={stat.suffix} />
                    : stat.value
                  }
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#4A4A4A', marginTop: '8px', lineHeight: 1.4 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3 : TIMELINE ── */}
      <TimelineSection />

      {/* ── SECTION 4 : PRICING ── */}
      <PricingSection />

      {/* ── SECTION 5 : TÉMOIGNAGES ── */}
      <section style={{ background: '#F8F4EF', padding: '96px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(28px, 4vw, 40px)', color: '#1A1A1A', margin: '0 0 12px' }}>
              Ils ont évité le pire
            </h2>
            <p style={{ fontSize: '16px', color: '#4A4A4A', margin: 0 }}>Des milliers de particuliers nous font confiance chaque mois.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {[
              { name: 'Marie D.', ville: 'Tours', avatarUrl: 'https://ui-avatars.com/api/?name=Marie+D&background=1B4332&color=D8F3DC&size=48', text: 'J\'allais signer pour 18 000€ de travaux. Verifio m\'a montré que l\'entreprise était en liquidation judiciaire depuis 2 mois. Incroyable.', badge: '18 000€ économisés', badgeBg: '#f0fdf4', badgeColor: '#16a34a', badgeBorder: '#86efac', delay: '' },
              { name: 'Thomas L.', ville: 'Lyon', avatarUrl: 'https://ui-avatars.com/api/?name=Thomas+L&background=2D6A4F&color=D8F3DC&size=48', text: 'En 30 secondes j\'ai su que l\'artisan n\'avait aucune certification RGE malgré ce qu\'il prétendait. J\'ai pu négocier.', badge: 'Arnaque déjouée', badgeBg: '#fff7ed', badgeColor: '#c2410c', badgeBorder: '#fdba74', delay: 'fade-up-delay-1' },
              { name: 'Sophie M.', ville: 'Bordeaux', avatarUrl: 'https://ui-avatars.com/api/?name=Sophie+M&background=52B788&color=fff&size=48', text: 'Le Pack Sérénité a analysé mon devis et trouvé 3 clauses abusives. Mon notaire était impressionné.', badge: 'Devis sécurisé', badgeBg: '#eff6ff', badgeColor: '#1d4ed8', badgeBorder: '#93c5fd', delay: 'fade-up-delay-2' },
            ].map((t, i) => (
              <div key={i} className={`card-hover fade-up ${t.delay}`} style={{ background: 'white', borderRadius: '20px', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.avatarUrl} alt={t.name} style={{ width: '48px', height: '48px', borderRadius: '50%' }} />
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '15px', color: '#1A1A1A' }}>{t.name}</p>
                    <p style={{ margin: 0, fontSize: '13px', color: '#8A8A8A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} /> {t.ville}
                    </p>
                  </div>
                </div>
                <div style={{ color: '#f59e0b', marginBottom: '14px', fontSize: '16px' }}>⭐⭐⭐⭐⭐</div>
                <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.7, margin: '0 0 20px', fontStyle: 'italic' }}>
                  &quot;{t.text}&quot;
                </p>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: t.badgeBg, color: t.badgeColor, border: `1px solid ${t.badgeBorder}`, borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: 700 }}>
                  <Check size={11} strokeWidth={1.5} /> {t.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 6 : SOURCES ── */}
      <section style={{ background: '#F8F4EF', padding: '64px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', letterSpacing: '0.12em', color: '#8A8A8A', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 600 }}>
            Données officielles mises à jour quotidiennement
          </p>
          <p style={{ fontSize: '14px', color: '#4A4A4A', margin: '0 0 32px' }}>
            Verifio agrège 6 sources gouvernementales pour vous donner une vue complète et fiable.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {['INSEE', 'ADEME', 'BODACC', 'INPI', 'data.gouv.fr', 'Qualibat'].map((src, i, arr) => (
              <span key={src} style={{ display: 'inline-flex', alignItems: 'center', gap: '16px' }}>
                <span
                  style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '20px', color: '#C8C2BB', cursor: 'default', transition: 'color 0.2s' }}
                  onMouseEnter={e => { (e.target as HTMLSpanElement).style.color = '#1B4332' }}
                  onMouseLeave={e => { (e.target as HTMLSpanElement).style.color = '#C8C2BB' }}
                >
                  {src}
                </span>
                {i < arr.length - 1 && <span style={{ color: '#C8C2BB', fontSize: '18px' }}>·</span>}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 7 : CTA FINALE ── */}
      <section style={{ background: '#1B4332', padding: '96px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(28px, 4vw, 48px)', color: 'white', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
            Votre prochain chantier mérite d&apos;être sécurisé
          </h2>
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.7)', margin: '0 0 40px', lineHeight: 1.6 }}>
            Rejoignez 10 000+ particuliers qui vérifient avant de signer.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/" style={{ background: 'white', color: '#1B4332', border: 'none', borderRadius: '12px', padding: '14px 28px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-body)', transition: 'all 0.2s' }}>
              Vérifier un artisan <ArrowRight size={16} />
            </a>
            <a href="/pricing" style={{ background: 'transparent', color: 'white', border: '1.5px solid rgba(255,255,255,0.6)', borderRadius: '12px', padding: '14px 28px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-body)', transition: 'all 0.2s' }}>
              Voir les tarifs
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#1A1A1A', color: 'white', padding: '48px 0 32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', marginBottom: '40px' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '20px', color: 'white', marginBottom: '12px' }}>Verifio</div>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>
                Vérifiez votre artisan en 30 secondes avec les données officielles.
              </p>
            </div>
            <div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '12px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Produit</h4>
              {[{ label: 'Rechercher un artisan', href: '/recherche' }, { label: 'Tarifs', href: '/pricing' }, { label: 'À propos', href: '/a-propos' }, { label: 'Espace artisan', href: '/espace-artisan' }, { label: 'Contact', href: '/contact' }].map(({ label, href }) => (
                <div key={label} style={{ marginBottom: '8px' }}>
                  <a href={href} style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
                  >{label}</a>
                </div>
              ))}
            </div>
            <div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '12px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Légal</h4>
              {[{ label: 'CGU', href: '/cgu' }, { label: 'Politique de confidentialité', href: '/politique-confidentialite' }, { label: 'Mentions légales', href: '/mentions-legales' }].map(({ label, href }) => (
                <div key={label} style={{ marginBottom: '8px' }}>
                  <a href={href} style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
                  >{label}</a>
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>© 2024 Verifio. Tous droits réservés.</p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Données : INSEE · ADEME · BODACC · INPI</p>
          </div>
        </div>
      </footer>

      {/* ── Global styles + animations ── */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .pricing-grid { grid-template-columns: 1fr !important; }
          .timeline-two-col { grid-template-columns: 1fr !important; }
        }
        @keyframes kenBurns { from { transform: scale(1.04); } to { transform: scale(1); } }
        @keyframes float {
          0%, 100% { transform: translateY(-8px); }
          50%       { transform: translateY(0px); }
        }
        .fb {
          position: absolute; z-index: 10;
          border-radius: 100px; padding: 10px 16px;
          font-size: 13px; font-weight: 700;
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
          white-space: nowrap;
          display: none;
        }
        @media (min-width: 1100px) {
          .fb { display: block; }
        }
        .fb-1 { animation: float 3.0s ease-in-out 0.0s infinite; }
        .fb-2 { animation: float 3.0s ease-in-out 0.7s infinite; }
        .fb-3 { animation: float 3.0s ease-in-out 1.4s infinite; }
        .fb-4 { animation: float 3.0s ease-in-out 2.1s infinite; }
        .fb-5 { animation: float 3.0s ease-in-out 0.3s infinite; }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(28px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes pulseBadge {
          0%, 100% { box-shadow: 0 0 0 0 rgba(82,183,136,0.4); }
          50%       { box-shadow: 0 0 0 6px rgba(82,183,136,0); }
        }

        /* Floating badge animations — fade in then float */
        @keyframes floatIn1 {
          0%   { opacity: 0; transform: translateY(8px); }
          20%  { opacity: 1; transform: translateY(0); }
          60%  { opacity: 1; transform: translateY(-6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatIn2 {
          0%   { opacity: 0; transform: translateY(8px); }
          20%  { opacity: 1; transform: translateY(0); }
          60%  { opacity: 1; transform: translateY(-6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatIn3 {
          0%   { opacity: 0; transform: translateY(8px); }
          20%  { opacity: 1; transform: translateY(0); }
          60%  { opacity: 1; transform: translateY(-6px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        /* Background photo Ken Burns */
        .hero-bg-photo {
          animation: kenBurns 8s ease-out forwards;
        }

        /* Badge pill */
        .hero-badge {
          animation: fadeInDown 0.4s ease-out 0s both, pulseBadge 2.5s ease-in-out 1s infinite;
        }

        /* H1 lines */
        .hero-h1-l1 { animation: fadeInUp 0.45s ease-out 0.10s both; }
        .hero-h1-l2 { animation: fadeInUp 0.45s ease-out 0.20s both; }
        .hero-h1-l3 { animation: fadeInUp 0.45s ease-out 0.30s both; }

        /* Subtitle */
        .hero-sub { animation: fadeInUp 0.45s ease-out 0.45s both; }

        /* Search bar */
        .hero-search { animation: fadeInScale 0.5s ease-out 0.55s both; }

        /* Card column */
        .hero-card-wrap { animation: fadeInLeft 0.6s ease-out 0.65s both; }

        /* Floating badges */
        .fb-1 { animation: floatIn1 3.5s ease-in-out 0.85s both infinite; }
        .fb-2 { animation: floatIn2 3.5s ease-in-out 1.10s both infinite; }
        .fb-3 { animation: floatIn3 3.5s ease-in-out 1.35s both infinite; }

        /* Card hover */
        .card-hover { transition: transform 0.2s, box-shadow 0.2s; }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.10) !important; }

        /* Fade up (for sections below) */
        .fade-up { opacity: 0; transform: translateY(20px); animation: fadeInUp 0.5s ease-out 0.1s both; }
        .fade-up-delay-1 { animation-delay: 0.2s; }
        .fade-up-delay-2 { animation-delay: 0.3s; }

        /* Responsive */
        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-card-col { display: none !important; }
        }
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </main>
  )
}
