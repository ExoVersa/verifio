'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ShieldCheck, CheckCircle, ArrowRight, MapPin } from 'lucide-react'
import SiteHeader from '@/components/SiteHeader'

/* ─── Noise SVG overlay ─────────────────────────────────── */
const NoiseSVG = () => (
  <svg
    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.04, pointerEvents: 'none' }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <filter id="noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#noise)" />
  </svg>
)

/* ─── Hero Search bar ───────────────────────────────────── */
function HeroSearch() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Array<{ siret: string; nom: string; ville: string; statut: string }>>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const router = useRouter()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleChange(val: string) {
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.trim().length < 2) {
      setResults([])
      setShowDropdown(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(val.trim())}`)
        const data = await res.json()
        if (Array.isArray(data)) {
          setResults(data.slice(0, 5))
          setShowDropdown(true)
        } else if (data.siret) {
          setResults([data])
          setShowDropdown(true)
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }, 350)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    router.push(`/recherche?q=${encodeURIComponent(query.trim())}`)
  }

  function handleSuggestion(tag: string) {
    setQuery(tag)
    handleChange(tag)
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <form onSubmit={handleSubmit}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          height: '64px',
        }}>
          <div style={{ padding: '0 16px', color: '#8A8A8A', flexShrink: 0 }}>
            <Search size={20} />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Nom de l'artisan, SIRET, ville..."
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '16px',
              fontFamily: 'var(--font-body)',
              color: '#1A1A1A',
              background: 'transparent',
              height: '100%',
              padding: '0 8px',
            }}
          />
          <button
            type="submit"
            style={{
              background: '#1B4332',
              color: 'white',
              border: 'none',
              height: '100%',
              padding: '0 24px',
              fontSize: '15px',
              fontWeight: 700,
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {loading ? (
              <span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite' }}>⟳</span>
            ) : (
              <>Vérifier <ArrowRight size={16} /></>
            )}
          </button>
        </div>
      </form>

      {/* Dropdown */}
      {showDropdown && results.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '68px',
          left: 0,
          right: 0,
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.15)',
          zIndex: 50,
          overflow: 'hidden',
        }}>
          {results.map((r, i) => (
            <button
              key={r.siret}
              onClick={() => router.push(`/artisan/${r.siret}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '14px 20px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                borderBottom: i < results.length - 1 ? '1px solid #F0EFE9' : 'none',
                fontFamily: 'var(--font-body)',
              }}
            >
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: '#E8F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontSize: '13px', fontWeight: 700, color: '#1B4332',
              }}>
                {r.nom.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#1A1A1A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.nom}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#8A8A8A' }}>{r.ville} · SIRET {r.siret}</p>
              </div>
              <span style={{
                fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px',
                background: r.statut === 'actif' ? '#f0fdf4' : '#fef2f2',
                color: r.statut === 'actif' ? '#16a34a' : '#dc2626',
                flexShrink: 0,
              }}>
                {r.statut === 'actif' ? 'Actif' : 'Fermé'}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Suggestion tags */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
        {['Plombier Paris', 'Électricien Lyon', 'Maçon Bordeaux'].map((tag) => (
          <button
            key={tag}
            onClick={() => handleSuggestion(tag)}
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.8)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '100px',
              padding: '6px 14px',
              fontSize: '13px',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.2)'
            }}
            onMouseLeave={e => {
              (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'
            }}
          >
            #{tag}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ─── Animated Stats ────────────────────────────────────── */
function AnimatedStat({ value, label, suffix = '' }: { value: number | string; label: string; suffix?: string }) {
  const [display, setDisplay] = useState(typeof value === 'number' ? '0' : value)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    if (typeof value !== 'number') return
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
          setDisplay(Math.round(ease * (value as number)).toLocaleString('fr-FR'))
          if (progress < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.3 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [value])

  return (
    <div ref={ref} style={{ textAlign: 'center', padding: '8px 24px' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '48px', color: '#1B4332', lineHeight: 1 }}>
        {display}{suffix}
      </div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#4A4A4A', marginTop: '8px', lineHeight: 1.4 }}>
        {label}
      </div>
    </div>
  )
}

/* ─── Hero Mockup Card ──────────────────────────────────── */
function HeroMockupCard() {
  const circumference = 2 * Math.PI * 52
  const score = 87
  const dasharray = `${(score / 100) * circumference} ${circumference}`

  return (
    <div
      className="animate-float"
      style={{
        background: 'white',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
        maxWidth: '320px',
        width: '100%',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px',
          background: '#1B4332', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', fontWeight: 700, color: '#D8F3DC', fontFamily: 'var(--font-display)',
          flexShrink: 0,
        }}>
          MB
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1A1A1A', fontFamily: 'var(--font-display)' }}>
            Martin Bâtiment SARL
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: '#52B788', fontWeight: 600 }}>
            SIRET vérifié ✓
          </p>
        </div>
      </div>

      {/* Score ring */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', position: 'relative' }}>
        <svg viewBox="0 0 120 120" width="100" height="100">
          <circle cx="60" cy="60" r="52" fill="none" stroke="#E8E3DC" strokeWidth="8" />
          <circle
            cx="60" cy="60" r="52" fill="none"
            stroke="#52B788"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={dasharray}
            transform="rotate(-90 60 60)"
          />
        </svg>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '28px', color: '#1B4332', lineHeight: 1 }}>
            {score}
          </div>
          <div style={{ fontSize: '11px', color: '#8A8A8A' }}>/100</div>
        </div>
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac', borderRadius: '20px', padding: '4px 10px', fontSize: '12px', fontWeight: 600 }}>
          ✓ SIRET actif
        </span>
        <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac', borderRadius: '20px', padding: '4px 10px', fontSize: '12px', fontWeight: 600 }}>
          ✓ Certifié RGE
        </span>
        <span style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', borderRadius: '20px', padding: '4px 10px', fontSize: '12px', fontWeight: 600 }}>
          ⚠ 1 alerte
        </span>
      </div>
    </div>
  )
}

/* ─── Main Page ─────────────────────────────────────────── */
export default function HomePage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-cream)' }}>
      <SiteHeader />

      {/* ── SECTION 1 : HERO ── */}
      <section style={{
        background: '#1B4332',
        padding: '80px 0 96px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <NoiseSVG />
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '64px',
            alignItems: 'center',
          }}>
            {/* Colonne gauche */}
            <div style={{ maxWidth: '600px' }}>
              {/* Badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: 'rgba(82,183,136,0.2)',
                border: '1px solid rgba(82,183,136,0.4)',
                borderRadius: '100px',
                padding: '8px 16px',
                fontSize: '13px',
                color: '#52B788',
                marginBottom: '24px',
              }}>
                🛡️ Données officielles · Gratuit pour les particuliers
              </div>

              {/* H1 */}
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: 'clamp(40px, 5vw, 64px)',
                color: 'white',
                lineHeight: 1.1,
                margin: '0 0 20px',
                letterSpacing: '-0.02em',
              }}>
                Vérifiez votre{' '}
                <span style={{ color: '#52B788' }}>artisan</span>
                <br />
                avant qu&apos;il soit trop tard
              </h1>

              {/* Sous-titre */}
              <p style={{
                fontSize: '18px',
                color: 'rgba(255,255,255,0.8)',
                lineHeight: 1.6,
                margin: '0 0 36px',
                fontFamily: 'var(--font-body)',
              }}>
                26 000 arnaques signalées en 2024. Vérifiez gratuitement en 30 secondes avec les données officielles.
              </p>

              {/* Barre de recherche */}
              <HeroSearch />
            </div>

            {/* Colonne droite — mockup */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <HeroMockupCard />
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2 : STATS ── */}
      <section style={{ background: 'white', padding: '64px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0',
          }}>
            {[
              { value: 26000, label: 'Arnaques signalées en 2024', suffix: '+' },
              { value: 6, label: 'Sources officielles vérifiées', suffix: '' },
              { value: '30s', label: 'Pour obtenir un verdict', suffix: '' },
              { value: '100%', label: 'Gratuit pour les particuliers', suffix: '' },
            ].map((stat, i) => (
              <div key={i} style={{
                borderRight: i < 3 ? '1px solid #E8E3DC' : 'none',
                padding: '8px 24px',
                textAlign: 'center',
              }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: 'clamp(32px, 4vw, 48px)',
                  color: '#1B4332',
                  lineHeight: 1,
                }}>
                  {typeof stat.value === 'number' ? (
                    <AnimatedStatInline value={stat.value} suffix={stat.suffix} />
                  ) : (
                    stat.value
                  )}
                </div>
                <div style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  color: '#4A4A4A',
                  marginTop: '8px',
                  lineHeight: 1.4,
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
        <style>{`
          @media (max-width: 640px) {
            .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          }
        `}</style>
      </section>

      {/* ── SECTION 3 : COMMENT ÇA MARCHE ── */}
      <section style={{ background: '#F8F4EF', padding: '96px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 'clamp(28px, 4vw, 40px)',
              color: '#1A1A1A',
              margin: '0 0 12px',
            }}>
              Vérifiez en 3 étapes
            </h2>
            <p style={{ fontSize: '18px', color: '#4A4A4A', margin: 0 }}>
              Simple, rapide, gratuit.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }}>
            {[
              {
                num: '01',
                icon: <Search size={24} color="white" />,
                title: 'Entrez le nom ou SIRET',
                text: 'Recherchez par nom d\'entreprise, SIRET ou type de travaux près de chez vous.',
                delay: '',
              },
              {
                num: '02',
                icon: <ShieldCheck size={24} color="white" />,
                title: 'On vérifie 6 sources officielles',
                text: 'INSEE, ADEME RGE, BODACC, INPI, dirigeants et certifications — tout en temps réel.',
                delay: 'fade-up-delay-1',
              },
              {
                num: '03',
                icon: <CheckCircle size={24} color="white" />,
                title: 'Recevez votre verdict',
                text: 'Score de confiance 0-100, alertes, checklist personnalisée et rapport complet.',
                delay: 'fade-up-delay-2',
              },
            ].map((step, i) => (
              <div
                key={i}
                className={`card-hover fade-up ${step.delay}`}
                style={{
                  background: 'white',
                  borderRadius: '20px',
                  padding: '32px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Big number background */}
                <div style={{
                  position: 'absolute',
                  top: '-16px',
                  right: '16px',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: '72px',
                  color: '#E8E3DC',
                  lineHeight: 1,
                  userSelect: 'none',
                }}>
                  {step.num}
                </div>

                {/* Icon */}
                <div style={{
                  width: '48px', height: '48px', borderRadius: '14px',
                  background: '#1B4332',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '20px',
                  position: 'relative',
                  zIndex: 1,
                }}>
                  {step.icon}
                </div>

                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '18px',
                  color: '#1A1A1A',
                  margin: '0 0 10px',
                  position: 'relative',
                  zIndex: 1,
                }}>
                  {step.title}
                </h3>
                <p style={{
                  fontSize: '15px',
                  color: '#4A4A4A',
                  lineHeight: 1.6,
                  margin: 0,
                  position: 'relative',
                  zIndex: 1,
                }}>
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4 : POURQUOI VERIFIO ── */}
      <section style={{ background: 'white', padding: '96px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '64px',
            alignItems: 'center',
          }}>
            {/* Colonne gauche — image */}
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600"
                alt="Particulier et artisan"
                style={{
                  width: '100%',
                  borderRadius: '24px',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
                }}
              />
            </div>

            {/* Colonne droite — texte */}
            <div>
              <div style={{
                display: 'inline-flex',
                background: '#fff7ed',
                color: '#c2410c',
                border: '1px solid #fdba74',
                borderRadius: '100px',
                padding: '6px 14px',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '20px',
              }}>
                Le problème
              </div>

              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 'clamp(26px, 3.5vw, 40px)',
                color: '#1A1A1A',
                margin: '0 0 16px',
                lineHeight: 1.2,
              }}>
                34% des Français victimes d&apos;arnaques sur les chantiers
              </h2>

              <p style={{
                fontSize: '16px',
                color: '#4A4A4A',
                lineHeight: 1.7,
                margin: '0 0 28px',
              }}>
                Faux artisans, devis non respectés, acomptes disparus... Le secteur du bâtiment est le plus touché par les arnaques en France.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                {[
                  'Vérification du statut légal en temps réel',
                  'Détection des procédures judiciaires',
                  'Contrôle des certifications RGE',
                  'Analyse de votre devis par IA',
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <ShieldCheck size={18} color="#52B788" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '15px', color: '#1A1A1A' }}>{item}</span>
                  </div>
                ))}
              </div>

              <a
                href="/"
                className="btn-primary"
                style={{ display: 'inline-flex' }}
              >
                Vérifier mon artisan gratuitement <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 5 : TÉMOIGNAGES ── */}
      <section style={{ background: '#F8F4EF', padding: '96px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 'clamp(28px, 4vw, 40px)',
              color: '#1A1A1A',
              margin: '0 0 12px',
            }}>
              Ils ont évité le pire
            </h2>
            <p style={{ fontSize: '16px', color: '#4A4A4A', margin: 0 }}>
              Des milliers de particuliers nous font confiance chaque mois.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }}>
            {[
              {
                name: 'Marie D.',
                ville: 'Tours',
                avatarUrl: 'https://ui-avatars.com/api/?name=Marie+D&background=1B4332&color=D8F3DC&size=48',
                text: 'J\'allais signer pour 18 000€ de travaux. Verifio m\'a montré que l\'entreprise était en liquidation judiciaire depuis 2 mois. Incroyable.',
                badge: '✓ 18 000€ économisés',
                badgeBg: '#f0fdf4',
                badgeColor: '#16a34a',
                badgeBorder: '#86efac',
                delay: '',
              },
              {
                name: 'Thomas L.',
                ville: 'Lyon',
                avatarUrl: 'https://ui-avatars.com/api/?name=Thomas+L&background=2D6A4F&color=D8F3DC&size=48',
                text: 'En 30 secondes j\'ai su que l\'artisan n\'avait aucune certification RGE malgré ce qu\'il prétendait. J\'ai pu négocier.',
                badge: '✓ Arnaque déjouée',
                badgeBg: '#fff7ed',
                badgeColor: '#c2410c',
                badgeBorder: '#fdba74',
                delay: 'fade-up-delay-1',
              },
              {
                name: 'Sophie M.',
                ville: 'Bordeaux',
                avatarUrl: 'https://ui-avatars.com/api/?name=Sophie+M&background=52B788&color=fff&size=48',
                text: 'Le Pack Sérénité a analysé mon devis et trouvé 3 clauses abusives. Mon notaire était impressionné.',
                badge: '✓ Devis sécurisé',
                badgeBg: '#eff6ff',
                badgeColor: '#1d4ed8',
                badgeBorder: '#93c5fd',
                delay: 'fade-up-delay-2',
              },
            ].map((t, i) => (
              <div
                key={i}
                className={`card-hover fade-up ${t.delay}`}
                style={{
                  background: 'white',
                  borderRadius: '20px',
                  padding: '32px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={t.avatarUrl}
                    alt={t.name}
                    style={{ width: '48px', height: '48px', borderRadius: '50%' }}
                  />
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '15px', color: '#1A1A1A' }}>{t.name}</p>
                    <p style={{ margin: 0, fontSize: '13px', color: '#8A8A8A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} /> {t.ville}
                    </p>
                  </div>
                </div>

                <div style={{ color: '#f59e0b', marginBottom: '14px', fontSize: '16px' }}>
                  ⭐⭐⭐⭐⭐
                </div>

                <p style={{
                  fontSize: '15px',
                  color: '#4A4A4A',
                  lineHeight: 1.7,
                  margin: '0 0 20px',
                  fontStyle: 'italic',
                }}>
                  &quot;{t.text}&quot;
                </p>

                <span style={{
                  display: 'inline-block',
                  background: t.badgeBg,
                  color: t.badgeColor,
                  border: `1px solid ${t.badgeBorder}`,
                  borderRadius: '20px',
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                }}>
                  {t.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 6 : SOURCES ── */}
      <section style={{ background: 'white', padding: '64px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <p style={{
            fontSize: '12px',
            letterSpacing: '0.12em',
            color: '#8A8A8A',
            textTransform: 'uppercase',
            marginBottom: '32px',
            fontWeight: 600,
          }}>
            Données issues de
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {['INSEE', 'ADEME', 'BODACC', 'INPI'].map((src, i) => (
              <span key={src} style={{ display: 'inline-flex', alignItems: 'center', gap: '16px' }}>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '24px',
                  color: '#C8C2BB',
                  cursor: 'default',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => { (e.target as HTMLSpanElement).style.color = '#1B4332' }}
                onMouseLeave={e => { (e.target as HTMLSpanElement).style.color = '#C8C2BB' }}
                >
                  {src}
                </span>
                {i < 3 && (
                  <span style={{ color: '#C8C2BB', fontSize: '20px' }}>·</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 7 : CTA FINALE ── */}
      <section style={{ background: '#1B4332', padding: '96px 0', position: 'relative', overflow: 'hidden' }}>
        <NoiseSVG />
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 'clamp(28px, 4vw, 48px)',
            color: 'white',
            margin: '0 0 16px',
            letterSpacing: '-0.02em',
          }}>
            Votre prochain chantier mérite d&apos;être sécurisé
          </h2>
          <p style={{
            fontSize: '18px',
            color: 'rgba(255,255,255,0.7)',
            margin: '0 0 40px',
            lineHeight: 1.6,
          }}>
            Rejoignez 10 000+ particuliers qui vérifient avant de signer.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="/"
              style={{
                background: 'white',
                color: '#1B4332',
                border: 'none',
                borderRadius: '12px',
                padding: '14px 28px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: 'var(--font-body)',
                transition: 'all 0.2s',
              }}
            >
              Vérifier un artisan <ArrowRight size={16} />
            </a>
            <a
              href="/pricing"
              style={{
                background: 'transparent',
                color: 'white',
                border: '1.5px solid rgba(255,255,255,0.6)',
                borderRadius: '12px',
                padding: '14px 28px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: 'var(--font-body)',
                transition: 'all 0.2s',
              }}
            >
              Voir les tarifs
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        background: '#1A1A1A',
        color: 'white',
        padding: '48px 0 32px',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '40px',
            marginBottom: '40px',
          }}>
            <div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '20px',
                color: 'white',
                marginBottom: '12px',
              }}>
                Verifio
              </div>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>
                Vérifiez votre artisan en 30 secondes avec les données officielles.
              </p>
            </div>
            <div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '12px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Produit
              </h4>
              {['Rechercher un artisan', 'Tarifs', 'Espace artisan', 'API'].map(link => (
                <div key={link} style={{ marginBottom: '8px' }}>
                  <a href="/" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', transition: 'color 0.2s' }}>
                    {link}
                  </a>
                </div>
              ))}
            </div>
            <div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '12px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Légal
              </h4>
              {['CGU', 'Politique de confidentialité', 'Mentions légales'].map(link => (
                <div key={link} style={{ marginBottom: '8px' }}>
                  <a href="/" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', transition: 'color 0.2s' }}>
                    {link}
                  </a>
                </div>
              ))}
            </div>
          </div>
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
              © 2024 Verifio. Tous droits réservés.
            </p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
              Données : INSEE · ADEME · BODACC · INPI
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}

/* ─── Animated stat inline (for stats section) ─────────── */
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
