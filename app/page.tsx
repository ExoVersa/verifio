'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  MapPin,
  Bell,
  ClipboardList,
  Shield,
  AlertTriangle,
  Check,
  Wrench,
  Zap,
  Home,
  Square,
  Layers,
  Thermometer,
  FileSearch,
  HardHat,
  Gem,
  Star,
  HeartHandshake,
  ScanSearch,
  BadgeEuro,
} from 'lucide-react'
import SiteHeader from '@/components/SiteHeader'
import { scoreColor } from '@/lib/score'
import type { SearchCandidate } from '@/types'

const CURRENT_YEAR = new Date().getFullYear()

const CHIPS = [
  { icon: <Wrench size={13} strokeWidth={1.6} />, label: 'Plombier' },
  { icon: <Zap size={13} strokeWidth={1.6} />, label: 'Électricien' },
  { icon: <Layers size={13} strokeWidth={1.6} />, label: 'Maçon' },
  { icon: <Home size={13} strokeWidth={1.6} />, label: 'Couvreur' },
  { icon: <Thermometer size={13} strokeWidth={1.6} />, label: 'Chauffagiste' },
  { icon: <Square size={13} strokeWidth={1.6} />, label: 'Menuisier' },
]

const TRUST_METRICS = [
  { value: 26000, suffix: '+', label: 'signaux analysés pour mieux décider' },
  { value: 6, suffix: '', label: 'sources officielles recoupées' },
  { value: '30 s', suffix: '', label: 'pour obtenir une première lecture claire' },
  { value: '4,9/5', suffix: '', label: 'sur notre pack de vérification complet' },
]

const DECISION_MOMENTS = [
  {
    icon: ScanSearch,
    title: 'Avant de rappeler',
    text: 'Tu vois immédiatement si l’entreprise existe vraiment, depuis quand, et si elle présente déjà des signaux faibles.',
    accent: '#eef8f3',
    color: '#153b2e',
  },
  {
    icon: BadgeEuro,
    title: 'Avant de verser un acompte',
    text: 'Tu récupères une lecture concrète du devis, des prix et des points à challenger avant d’envoyer le moindre euro.',
    accent: '#fff1e6',
    color: '#b85d1e',
  },
  {
    icon: HeartHandshake,
    title: 'Avant de signer',
    text: 'Tu avances avec une checklist simple, des questions à poser et un vrai sentiment de contrôle sur la relation.',
    accent: '#edf4ff',
    color: '#205ecf',
  },
]

const EXPERIENCE_STEPS = [
  {
    number: '01',
    icon: Search,
    title: 'Tu recherches un artisan',
    text: 'Nom, SIRET ou entreprise: la première réponse est immédiate, sans jargon juridique.',
    points: ['Statut INSEE', 'ancienneté', 'zone d’activité'],
  },
  {
    number: '02',
    icon: ShieldCheck,
    title: 'Verifio traduit le risque',
    text: 'Les données officielles sont transformées en lecture simple: rassurant, à vérifier, ou vigilance forte.',
    points: ['certifications', 'BODACC', 'cohérence globale'],
  },
  {
    number: '03',
    icon: FileSearch,
    title: 'Tu sécurises le devis',
    text: 'Le rapport complet t’aide à poser les bonnes questions avant de t’engager.',
    points: ['clauses', 'prix du marché', 'points de vigilance'],
  },
  {
    number: '04',
    icon: HardHat,
    title: 'Tu suis ton chantier',
    text: 'Checklist, surveillances et espace de suivi évitent les oublis pendant les travaux.',
    points: ['paiements', 'documents', 'réception'],
  },
]

const TESTIMONIALS = [
  {
    name: 'Camille',
    city: 'Nantes',
    initials: 'CA',
    text: 'Je cherchais juste à me rassurer. En réalité, Verifio m’a évité de signer avec une entreprise déjà fragilisée.',
    highlight: 'Acompte évité à temps',
    color: '#153b2e',
    bg: '#eef8f3',
  },
  {
    name: 'Julien',
    city: 'Lyon',
    initials: 'JU',
    text: 'La différence, c’est le ton. On comprend vite quoi regarder et quoi demander, même sans être expert du bâtiment.',
    highlight: 'Décision prise en 1 soirée',
    color: '#b85d1e',
    bg: '#fff1e6',
  },
  {
    name: 'Sarah',
    city: 'Bordeaux',
    initials: 'SA',
    text: 'Le rapport m’a surtout aidée à avoir une conversation plus ferme avec l’artisan. J’étais beaucoup plus sereine.',
    highlight: 'Devis renégocié',
    color: '#205ecf',
    bg: '#edf4ff',
  },
]

const FOOTER_LINKS = {
  produit: [
    { label: 'Rechercher un artisan', href: '/recherche' },
    { label: 'Tarifs', href: '/pricing' },
    { label: 'À propos', href: '/a-propos' },
    { label: 'Espace artisan', href: '/espace-artisan' },
    { label: 'Contact', href: '/contact' },
  ],
  legal: [
    { label: 'CGU', href: '/cgu' },
    { label: 'Politique de confidentialité', href: '/politique-confidentialite' },
    { label: 'Mentions légales', href: '/mentions-legales' },
  ],
}

function getInitials(nom: string) {
  const words = nom.trim().split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0]?.[0] ?? ''}${words[1]?.[0] ?? ''}`.toUpperCase()
}

function getDept(cp?: string) {
  if (!cp) return ''
  return cp.startsWith('97') ? cp.slice(0, 3) : cp.slice(0, 2)
}

function SectionEyebrow({ icon: Icon, text, tone = 'green' }: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
  text: string
  tone?: 'green' | 'sand' | 'blue'
}) {
  const toneMap = {
    green: { bg: 'rgba(21,59,46,0.04)', border: 'rgba(21,59,46,0.10)', color: '#153b2e' },
    sand: { bg: 'rgba(184,93,30,0.05)', border: 'rgba(184,93,30,0.12)', color: '#b85d1e' },
    blue: { bg: 'rgba(32,94,207,0.05)', border: 'rgba(32,94,207,0.12)', color: '#205ecf' },
  }
  const current = toneMap[tone]

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '7px 12px',
      borderRadius: '999px',
      background: current.bg,
      border: `1px solid ${current.border}`,
      color: current.color,
      fontSize: '11px',
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
    }}>
      <Icon size={14} strokeWidth={1.7} />
      {text}
    </div>
  )
}

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

    if (val.trim().length < 2) {
      setResults([])
      setEmpty(false)
      setShowDropdown(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      abortRef.current = new AbortController()
      setLoading(true)

      try {
        const res = await fetch(`/api/recherche?q=${encodeURIComponent(val.trim())}&per_page=6`, {
          signal: abortRef.current.signal,
        })
        const data = await res.json()

        if (data.isExact && data.siret) {
          router.push(`/artisan/${data.siret}`)
          return
        }

        const list: SearchCandidate[] = data.results || []
        setResults(list.slice(0, 6))
        setEmpty(list.length === 0)
        setShowDropdown(true)
      } catch {
        // aborted or network
      } finally {
        setLoading(false)
      }
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
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <form onSubmit={handleSubmit}>
        <div className="hero-search-shell" style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: '8px',
          padding: '8px',
          borderRadius: '24px',
          background: 'rgba(255,255,255,0.88)',
          border: '1px solid rgba(227,219,208,0.9)',
          boxShadow: '0 18px 42px rgba(20,32,27,0.08)',
          backdropFilter: 'blur(14px)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            minWidth: 0,
            padding: '10px 14px',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '14px',
              background: '#f1f6f3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#153b2e',
              flexShrink: 0,
            }}>
              <Search size={20} strokeWidth={1.8} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#7a8983', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Recherche artisan
              </div>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleChange(e.target.value)}
                onFocus={() => results.length > 0 && setShowDropdown(true)}
                placeholder="Nom, SIRET ou entreprise"
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  fontSize: '16px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-body)',
                  color: '#14201b',
                  background: 'transparent',
                  padding: 0,
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            style={{
              minHeight: '58px',
              borderRadius: '18px',
              border: 'none',
              padding: '0 20px',
              background: 'linear-gradient(135deg, #153b2e 0%, #2c6a53 100%)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 700,
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 12px 24px rgba(21,59,46,0.18)',
              whiteSpace: 'nowrap',
            }}
          >
            {loading
              ? <span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite' }}>⟳</span>
              : <>Lancer la vérification <ArrowRight size={16} strokeWidth={1.8} /></>
            }
          </button>
        </div>
      </form>

      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 12px)',
          left: 0,
          right: 0,
          zIndex: 40,
          background: 'rgba(255,255,255,0.96)',
          borderRadius: '24px',
          border: '1px solid rgba(233,226,215,0.9)',
          boxShadow: '0 24px 60px rgba(20,32,27,0.14)',
          overflow: 'hidden',
          backdropFilter: 'blur(16px)',
        }}>
          {loading && results.length === 0 && (
            <div style={{ padding: '16px 18px' }}>
              {[1, 2, 3].map((item) => (
                <div key={item} style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: item < 3 ? '1px solid #f0ebe3' : 'none',
                }}>
                  <div style={{ width: 42, height: 42, borderRadius: 14, background: '#f4f1eb', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 14, width: '58%', borderRadius: 999, background: '#f4f1eb', marginBottom: '8px' }} />
                    <div style={{ height: 10, width: '34%', borderRadius: 999, background: '#f4f1eb' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && empty && (
            <div style={{ padding: '30px 24px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 700, color: '#14201b' }}>
                Aucune entreprise trouvée
              </p>
              <p style={{ margin: 0, fontSize: '14px', color: '#70807a' }}>
                Essaie avec le SIRET ou une autre orthographe.
              </p>
            </div>
          )}

          {results.map((result, index) => {
            const dept = getDept(result.codePostal)
            const score = result.score ?? 0
            const scoreCol = scoreColor(score)

            return (
              <button
                key={result.siret}
                onClick={() => {
                  setShowDropdown(false)
                  router.push(`/artisan/${result.siret}`)
                }}
                style={{
                  width: '100%',
                  border: 'none',
                  background: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  padding: '15px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  borderBottom: index < results.length - 1 ? '1px solid #f0ebe3' : 'none',
                  fontFamily: 'var(--font-body)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#fbf8f4' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{
                  width: 46,
                  height: 46,
                  borderRadius: 16,
                  background: '#eef8f3',
                  color: '#153b2e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 800,
                  flexShrink: 0,
                }}>
                  {getInitials(result.nom)}
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
                    <p style={{
                      margin: 0,
                      fontSize: '15px',
                      fontWeight: 700,
                      color: '#14201b',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {result.nom}
                    </p>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '999px',
                      fontSize: '10px',
                      fontWeight: 800,
                      background: result.statut === 'actif' ? '#eef8f3' : '#fef2f2',
                      color: result.statut === 'actif' ? '#15803d' : '#dc2626',
                    }}>
                      {result.statut === 'actif' ? 'ACTIF' : 'FERMÉ'}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#5a6a64' }}>
                    {result.formeJuridique && <span>{result.formeJuridique} · </span>}
                    {result.ville && <span>{result.ville}{dept ? ` (${dept})` : ''}</span>}
                  </p>
                </div>

                {score > 0 && (
                  <div style={{
                    padding: '7px 10px',
                    borderRadius: '999px',
                    background: 'rgba(21,59,46,0.05)',
                    fontSize: '12px',
                    fontWeight: 800,
                    color: scoreCol,
                    flexShrink: 0,
                  }}>
                    {score}/100
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginTop: '14px',
      }}>
        {CHIPS.map(({ icon, label }) => (
          <button
            key={label}
            onClick={() => handleChip(label)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '999px',
              border: '1px solid rgba(224,214,199,0.82)',
              background: 'rgba(255,255,255,0.56)',
              color: '#153b2e',
              fontSize: '12px',
              fontWeight: 700,
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#ffffff' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.7)' }}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

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
    }, { threshold: 0.35 })

    observer.observe(el)
    return () => observer.disconnect()
  }, [value])

  return <span ref={ref}>{display}{suffix}</span>
}

function PricingSection() {
  const plans = [
    {
      name: 'Lecture gratuite',
      price: '0€',
      desc: 'Pour vérifier rapidement avant de rappeler un artisan.',
      bg: 'rgba(255,255,255,0.8)',
      border: 'rgba(226,217,204,0.9)',
      text: '#14201b',
      badge: null,
      ctaHref: '/recherche',
      ctaLabel: 'Commencer maintenant',
      primary: false,
      features: [
        'Recherche par nom ou SIRET',
        'Lecture de confiance instantanée',
        'Statut légal et activité',
        'Premiers signaux à surveiller',
      ],
    },
    {
      name: 'Pack Sérénité',
      price: '4,90€',
      desc: 'Quand tu veux vraiment sécuriser ton choix et ton devis.',
      bg: 'linear-gradient(145deg, #153b2e 0%, #214d3d 100%)',
      border: 'rgba(21,59,46,0.95)',
      text: '#ffffff',
      badge: 'Le plus choisi',
      ctaHref: '/pricing',
      ctaLabel: 'Voir le rapport complet',
      primary: true,
      features: [
        'Rapport PDF complet',
        'Analyse de devis par IA',
        'Surveillance pendant 6 mois',
        'Checklist avant signature',
      ],
    },
  ]

  return (
    <section style={{ padding: '96px 0 88px', background: 'transparent' }}>
      <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '42px' }}>
          <SectionEyebrow icon={Gem} text="Tarification lisible" tone="sand" />
          <h2 style={{ margin: '18px 0 12px', fontSize: 'clamp(30px, 4vw, 48px)' }}>
            Gratuit pour sentir le terrain,
            <br />
            complet quand tu veux vraiment sécuriser
          </h2>
          <p style={{ maxWidth: '720px', margin: '0 auto', fontSize: '17px', color: '#43524c', lineHeight: 1.7 }}>
            Pas d’abonnement forcé, pas de complexité inutile. Tu commences gratuitement,
            puis tu actives le niveau d’accompagnement adapté à ton chantier.
          </p>
        </div>

        <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '22px' }}>
          {plans.map((plan) => (
            <div
              key={plan.name}
              style={{
                position: 'relative',
                padding: '30px',
                borderRadius: '26px',
                background: plan.bg,
                border: `1px solid ${plan.border}`,
                color: plan.text,
                boxShadow: plan.primary
                  ? '0 22px 48px rgba(21,59,46,0.16)'
                  : '0 12px 28px rgba(20,32,27,0.05)',
              }}
            >
              {plan.badge && (
                <div style={{
                  position: 'absolute',
                  top: '18px',
                  right: '18px',
                  padding: '6px 10px',
                  borderRadius: '999px',
                  background: 'rgba(255,255,255,0.14)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#d9f5e8',
                }}>
                  {plan.badge}
                </div>
              )}

              <p style={{
                margin: '0 0 6px',
                fontSize: '14px',
                fontWeight: 700,
                color: plan.primary ? 'rgba(255,255,255,0.72)' : '#70807a',
              }}>
                {plan.name}
              </p>
              <div style={{
                marginBottom: '10px',
                fontSize: '38px',
                lineHeight: 1,
                fontWeight: 800,
                fontFamily: 'var(--font-display)',
              }}>
                {plan.price}
              </div>
              <p style={{
                margin: '0 0 24px',
                fontSize: '14px',
                lineHeight: 1.6,
                color: plan.primary ? 'rgba(255,255,255,0.78)' : '#43524c',
                maxWidth: '440px',
              }}>
                {plan.desc}
              </p>

              <div style={{ display: 'grid', gap: '12px', marginBottom: '28px' }}>
                {plan.features.map((feature) => (
                  <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '999px',
                      background: plan.primary ? 'rgba(255,255,255,0.12)' : '#eef8f3',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Check size={12} strokeWidth={2.3} color={plan.primary ? '#9ce2c0' : '#15803d'} />
                    </div>
                    <span style={{
                      fontSize: '14px',
                      color: plan.primary ? 'rgba(255,255,255,0.94)' : '#14201b',
                    }}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              <Link
                href={plan.ctaHref}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '13px 18px',
                  borderRadius: '14px',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: 800,
                  color: plan.primary ? '#153b2e' : '#153b2e',
                  background: '#ffffff',
                  boxShadow: plan.primary ? '0 12px 28px rgba(0,0,0,0.12)' : 'none',
                }}
              >
                {plan.ctaLabel}
                <ArrowRight size={15} strokeWidth={1.8} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  return (
    <main style={{ minHeight: '100vh', background: 'transparent' }}>
      <SiteHeader />

      <section style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '52px 0 34px',
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 12% 18%, rgba(84,164,124,0.18), transparent 26%), radial-gradient(circle at 86% 14%, rgba(255,196,153,0.24), transparent 22%), linear-gradient(180deg, #fbf8f4 0%, #f5efe7 100%)',
        }} />
        <div style={{
          position: 'absolute',
          top: '-80px',
          right: '-40px',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'rgba(21,59,46,0.05)',
          filter: 'blur(8px)',
        }} />

        <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
          <div className="home-hero-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.08fr) minmax(360px, 0.92fr)',
            gap: '42px',
            alignItems: 'center',
          }}>
            <div>
              <SectionEyebrow icon={Shield} text="Plateforme de confiance pour particuliers" />
              <h1 style={{
                margin: '18px 0 18px',
                maxWidth: '780px',
                fontSize: 'clamp(38px, 5.8vw, 72px)',
                lineHeight: 1.04,
                letterSpacing: '-0.045em',
              }}>
                Choisir un artisan devrait
                <br />
                inspirer la confiance,
                <br />
                pas le doute.
              </h1>
              <p style={{
                maxWidth: '640px',
                margin: '0 0 28px',
                fontSize: '18px',
                lineHeight: 1.78,
                color: '#43524c',
              }}>
                Verifio transforme des données officielles complexes en lecture simple, humaine et rassurante.
                Tu comprends vite si tu peux avancer, creuser, ou t’arrêter.
              </p>

              <HeroSearch />

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: '10px',
                marginTop: '20px',
              }} className="hero-mini-proof">
                {[
                  'Lecture claire du risque',
                  'Parcours pensé pour la décision',
                  'Ton rassurant, données officielles',
                ].map((item) => (
                  <div key={item} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    borderRadius: '16px',
                    background: 'rgba(255,255,255,0.56)',
                    border: '1px solid rgba(228,220,208,0.82)',
                    color: '#153b2e',
                    fontSize: '12px',
                    fontWeight: 700,
                    backdropFilter: 'blur(8px)',
                  }}>
                    <CheckCircle size={14} strokeWidth={1.9} />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              position: 'relative',
              padding: '16px',
              borderRadius: '30px',
              background: 'linear-gradient(160deg, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0.42) 100%)',
              border: '1px solid rgba(231,223,212,0.82)',
              boxShadow: '0 22px 56px rgba(20,32,27,0.10)',
              backdropFilter: 'blur(14px)',
            }}>
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '18px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '999px',
                background: '#153b2e',
                color: '#fff',
                boxShadow: '0 12px 24px rgba(21,59,46,0.14)',
                fontSize: '11px',
                fontWeight: 800,
              }}>
                <ShieldCheck size={14} strokeWidth={1.8} />
                Lecture confiance en moins de 30 secondes
              </div>

              <div style={{
                borderRadius: '24px',
                background: 'linear-gradient(180deg, #153b2e 0%, #214d3d 100%)',
                padding: '24px',
                color: '#fff',
                overflow: 'hidden',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-50px',
                  right: '-20px',
                  width: '160px',
                  height: '160px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.07)',
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '16px',
                      background: 'rgba(255,255,255,0.14)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#d8f3dc',
                      fontSize: '15px',
                      fontWeight: 800,
                      flexShrink: 0,
                    }}>
                      MB
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Martin Bâtiment SARL</p>
                      <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.72)' }}>
                        Plomberie · Tours (37) · 18 ans d’activité
                      </p>
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '118px 1fr',
                    gap: '18px',
                    alignItems: 'center',
                    marginBottom: '20px',
                  }} className="hero-score-grid">
                    <div style={{
                      borderRadius: '22px',
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      padding: '16px 12px',
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '40px', lineHeight: 1, fontWeight: 800, fontFamily: 'var(--font-display)' }}>87</div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#9ce2c0', marginTop: '6px', letterSpacing: '0.03em' }}>
                        Score de confiance
                      </div>
                    </div>

                    <div style={{ display: 'grid', gap: '10px' }}>
                      {[
                        { icon: Check, text: 'Entreprise active et cohérente', color: '#9ce2c0' },
                        { icon: ShieldCheck, text: 'Certification RGE retrouvée', color: '#9ce2c0' },
                        { icon: AlertTriangle, text: '1 publication BODACC à comprendre', color: '#ffd39d' },
                      ].map((item) => {
                        const Icon = item.icon
                        return (
                          <div key={item.text} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '9px 11px',
                            borderRadius: '14px',
                            background: 'rgba(255,255,255,0.06)',
                          }}>
                            <div style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '999px',
                              background: 'rgba(255,255,255,0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}>
                              <Icon size={13} strokeWidth={2} color={item.color} />
                            </div>
                            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.9)' }}>{item.text}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                  }} className="hero-side-panels">
                    <div style={{
                      padding: '15px',
                      borderRadius: '16px',
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', color: '#9ce2c0', marginBottom: '8px' }}>
                        CE QUE TU COMPRENDS
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.65, color: 'rgba(255,255,255,0.88)' }}>
                        Rien d’alarmant, mais un point mérite une question avant signature.
                      </p>
                    </div>
                    <div style={{
                      padding: '15px',
                      borderRadius: '16px',
                      background: '#fff8ef',
                      color: '#14201b',
                    }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', color: '#b85d1e', marginBottom: '8px' }}>
                        QUESTION À POSER
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6 }}>
                        “Pouvez-vous m’expliquer cette publication BODACC et me partager votre assurance actuelle ?”
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                marginTop: '14px',
              }}>
                {[
                  { icon: Bell, label: 'Alerte activable' },
                  { icon: ClipboardList, label: 'Checklist avant signature' },
                  { icon: FileSearch, label: 'Analyse de devis' },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.label} style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: '999px',
                      background: 'rgba(255,255,255,0.62)',
                      border: '1px solid rgba(231,223,212,0.82)',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#153b2e',
                    }}>
                      <Icon size={13} strokeWidth={1.8} />
                      {item.label}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '8px 0 62px' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 24px' }}>
          <div className="proof-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: '14px',
          }}>
            {TRUST_METRICS.map((item, index) => (
              <div key={index} style={{
                padding: '24px 20px',
                borderRadius: '22px',
                background: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(226,217,204,0.85)',
                boxShadow: '0 10px 24px rgba(20,32,27,0.05)',
              }}>
                <div style={{ width: '42px', height: '3px', borderRadius: '999px', background: '#dcefe6', marginBottom: '16px' }} />
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: 'clamp(28px, 4vw, 40px)',
                  lineHeight: 1,
                  color: '#153b2e',
                  marginBottom: '8px',
                }}>
                  {typeof item.value === 'number'
                    ? <AnimatedStatInline value={item.value} suffix={item.suffix} />
                    : item.value}
                </div>
                <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: '#52615c' }}>
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '0 0 88px' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ maxWidth: '760px', marginBottom: '30px' }}>
            <SectionEyebrow icon={HeartHandshake} text="Une plateforme pensée pour la vraie vie" tone="blue" />
            <h2 style={{ margin: '18px 0 12px', fontSize: 'clamp(30px, 4vw, 48px)' }}>
              Moins de jargon, plus de clarté
              <br />
              au moment où tu dois choisir
            </h2>
            <p style={{ margin: 0, fontSize: '17px', color: '#43524c', lineHeight: 1.7 }}>
              L’enjeu n’est pas d’afficher le plus de données possible. L’enjeu, c’est de te permettre
              de prendre une bonne décision au bon moment, avec un niveau de confiance plus élevé.
            </p>
          </div>

          <div className="decision-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px' }}>
            {DECISION_MOMENTS.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className="card-hover"
                  style={{
                    padding: '26px',
                    borderRadius: '24px',
                    background: 'rgba(255,255,255,0.72)',
                    border: '1px solid rgba(226,217,204,0.84)',
                    boxShadow: '0 12px 28px rgba(20,32,27,0.05)',
                  }}
                >
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '15px',
                    background: item.accent,
                    color: item.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                  }}>
                    <Icon size={20} strokeWidth={1.8} />
                  </div>
                  <h3 style={{ margin: '0 0 8px', fontSize: '20px', lineHeight: 1.2 }}>{item.title}</h3>
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.75, color: '#43524c' }}>{item.text}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section style={{ padding: '0 0 92px' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '0 24px' }}>
          <div className="story-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 0.95fr) minmax(0, 1.05fr)',
            gap: '22px',
            alignItems: 'stretch',
          }}>
            <div style={{
              padding: '32px',
              borderRadius: '28px',
              background: 'linear-gradient(180deg, #153b2e 0%, #214d3d 100%)',
              color: '#fff',
              boxShadow: '0 22px 48px rgba(21,59,46,0.14)',
            }}>
              <SectionEyebrow icon={ShieldCheck} text="La promesse Verifio" />
              <h2 style={{ margin: '18px 0 14px', color: '#fff', fontSize: 'clamp(30px, 4vw, 44px)' }}>
                Une lecture rassurante,
                <br />
                sans minimiser les risques
              </h2>
              <p style={{ margin: '0 0 26px', color: 'rgba(255,255,255,0.76)', fontSize: '16px', lineHeight: 1.75 }}>
                On ne dramatise pas pour vendre. On ne simplifie pas au point de masquer le réel.
                On t’aide à voir ce qui compte, avec un langage que tu peux utiliser tout de suite.
              </p>

              <div style={{ display: 'grid', gap: '12px' }}>
                {[
                  'Données officielles recoupées automatiquement',
                  'Aide à la compréhension avant la décision',
                  'Questions concrètes à poser à l’artisan',
                  'Surveillance utile si la situation évolue après signature',
                ].map((point) => (
                  <div key={point} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '999px',
                      background: 'rgba(255,255,255,0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Check size={12} strokeWidth={2.3} color="#9ce2c0" />
                    </div>
                    <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.92)' }}>{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              padding: '32px',
              borderRadius: '28px',
              background: 'rgba(255,255,255,0.78)',
              border: '1px solid rgba(226,217,204,0.84)',
              boxShadow: '0 14px 30px rgba(20,32,27,0.06)',
            }}>
              <SectionEyebrow icon={ClipboardList} text="Le parcours en 4 temps" tone="sand" />
              <div style={{ display: 'grid', gap: '16px', marginTop: '20px' }}>
                {EXPERIENCE_STEPS.map((step) => {
                  const Icon = step.icon
                  return (
                    <div key={step.number} style={{
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr',
                      gap: '14px',
                      alignItems: 'start',
                      padding: '16px 0',
                      borderBottom: step.number !== '04' ? '1px solid #efe7dc' : 'none',
                    }}>
                      <div style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '18px',
                        background: '#eef8f3',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#153b2e',
                        flexShrink: 0,
                      }}>
                        <Icon size={22} strokeWidth={1.8} />
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', color: '#70807a', marginBottom: '6px' }}>
                          ÉTAPE {step.number}
                        </div>
                        <h3 style={{ margin: '0 0 8px', fontSize: '21px' }}>{step.title}</h3>
                        <p style={{ margin: '0 0 10px', fontSize: '15px', lineHeight: 1.7, color: '#43524c' }}>{step.text}</p>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {step.points.map((point) => (
                            <span key={point} style={{
                              padding: '6px 9px',
                              borderRadius: '999px',
                              background: '#fbf8f4',
                              border: '1px solid #efe7dc',
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#153b2e',
                            }}>
                              {point}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <PricingSection />

      <section style={{ padding: '0 0 94px' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '34px' }}>
            <SectionEyebrow icon={Star} text="Des retours qui parlent de confiance retrouvée" tone="blue" />
            <h2 style={{ margin: '18px 0 12px', fontSize: 'clamp(30px, 4vw, 46px)' }}>
              Ce que les particuliers retiennent,
              <br />
              ce n’est pas juste la donnée
            </h2>
            <p style={{ maxWidth: '720px', margin: '0 auto', fontSize: '17px', lineHeight: 1.7, color: '#43524c' }}>
              C’est la sensation d’être enfin accompagné, avec des éléments concrets pour parler, comparer et décider.
            </p>
          </div>

          <div className="decision-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px' }}>
            {TESTIMONIALS.map((testimonial) => (
              <div key={testimonial.name} style={{
                padding: '26px',
                borderRadius: '24px',
                background: 'rgba(255,255,255,0.76)',
                border: '1px solid rgba(226,217,204,0.84)',
                boxShadow: '0 12px 26px rgba(20,32,27,0.05)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '14px',
                    background: testimonial.bg,
                    color: testimonial.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '14px',
                    flexShrink: 0,
                  }}>
                    {testimonial.initials}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#14201b' }}>{testimonial.name}</p>
                    <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#70807a', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <MapPin size={12} strokeWidth={1.8} />
                      {testimonial.city}
                    </p>
                  </div>
                </div>

                <p style={{ margin: '0 0 18px', fontSize: '15px', lineHeight: 1.82, color: '#43524c' }}>
                  &quot;{testimonial.text}&quot;
                </p>

                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 11px',
                  borderRadius: '999px',
                  background: testimonial.bg,
                  color: testimonial.color,
                  fontSize: '11px',
                  fontWeight: 800,
                }}>
                  <Check size={12} strokeWidth={2.2} />
                  {testimonial.highlight}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '0 0 96px' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '32px',
            padding: '36px 30px',
            background: 'linear-gradient(135deg, #153b2e 0%, #234a3b 58%, #315a49 100%)',
            boxShadow: '0 24px 52px rgba(21,59,46,0.16)',
          }}>
            <div style={{
              position: 'absolute',
              top: '-40px',
              right: '-10px',
              width: '220px',
              height: '220px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
            }} />
            <div className="cta-grid" style={{
              position: 'relative',
              zIndex: 1,
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) auto',
              gap: '24px',
              alignItems: 'center',
            }}>
              <div>
                <SectionEyebrow icon={ShieldCheck} text="Le bon artisan, avec un vrai sentiment de maîtrise" />
                <h2 style={{ margin: '18px 0 12px', color: '#fff', fontSize: 'clamp(30px, 4vw, 48px)' }}>
                  Commence par une vérification simple.
                  <br />
                  Décide ensuite avec plus de sérénité.
                </h2>
                <p style={{ margin: 0, fontSize: '17px', lineHeight: 1.7, color: 'rgba(255,255,255,0.76)', maxWidth: '720px' }}>
                  Recherche gratuite, lecture immédiate, puis accompagnement plus poussé si tu veux vraiment sécuriser ton devis et ton chantier.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link
                  href="/recherche"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '14px 20px',
                    borderRadius: '16px',
                    background: '#fff',
                    color: '#153b2e',
                    textDecoration: 'none',
                    fontSize: '13px',
                    fontWeight: 800,
                  }}
                >
                  Vérifier un artisan
                  <ArrowRight size={15} strokeWidth={1.8} />
                </Link>
                <Link
                  href="/pricing"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '14px 20px',
                    borderRadius: '16px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.16)',
                    color: '#fff',
                    textDecoration: 'none',
                    fontSize: '13px',
                    fontWeight: 700,
                  }}
                >
                  Voir les tarifs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer style={{ background: '#10211c', color: '#fff', padding: '56px 0 34px' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '0 24px' }}>
          <div className="footer-grid" style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.9fr 0.9fr',
            gap: '32px',
            marginBottom: '34px',
          }}>
            <div>
              <div style={{ marginBottom: '12px', fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800 }}>
                Verifio
              </div>
              <p style={{ margin: '0 0 14px', color: 'rgba(255,255,255,0.66)', fontSize: '15px', lineHeight: 1.75, maxWidth: '420px' }}>
                Une plateforme pensée pour aider les particuliers à choisir un artisan avec plus de clarté, plus de confiance et moins d’angles morts.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {['INSEE', 'ADEME', 'BODACC', 'INPI', 'Qualibat'].map((source) => (
                  <span key={source} style={{
                    padding: '8px 12px',
                    borderRadius: '999px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.74)',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}>
                    {source}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 style={{ margin: '0 0 14px', fontSize: '14px', color: 'rgba(255,255,255,0.72)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Produit
              </h3>
              <div style={{ display: 'grid', gap: '10px' }}>
                {FOOTER_LINKS.produit.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{ color: 'rgba(255,255,255,0.62)', textDecoration: 'none', fontSize: '14px' }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h3 style={{ margin: '0 0 14px', fontSize: '14px', color: 'rgba(255,255,255,0.72)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Légal
              </h3>
              <div style={{ display: 'grid', gap: '10px' }}>
                {FOOTER_LINKS.legal.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{ color: 'rgba(255,255,255,0.62)', textDecoration: 'none', fontSize: '14px' }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}>
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.42)' }}>
              © {CURRENT_YEAR} Verifio. Tous droits réservés.
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.42)' }}>
              Vérification, accompagnement et lecture de confiance pour particuliers.
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 1100px) {
          .home-hero-grid,
          .story-grid,
          .cta-grid,
          .pricing-grid,
          .decision-grid {
            grid-template-columns: 1fr !important;
          }

          .proof-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 900px) {
          .hero-mini-proof,
          .hero-score-grid,
          .hero-side-panels,
          .footer-grid {
            grid-template-columns: 1fr !important;
          }

          .hero-search-shell {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 640px) {
          .proof-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  )
}
