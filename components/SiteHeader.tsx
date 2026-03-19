'use client'

import { useState, useEffect, useRef, Fragment } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChevronDown, Search, ArrowLeftRight, Calculator, FileSearch,
  ClipboardCheck, User, LogOut, Menu, X, Scale, MapPin, HardHat,
  AlertTriangle, Euro, Wrench,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

// ── Types ──────────────────────────────────────────────────────────────────

interface NavItem {
  href: string | null
  label: string
  desc: string
  icon: React.ReactNode
  soon?: boolean
}

interface NavMenu {
  id: string
  label: string
  items: NavItem[]
}

interface SiteHeaderProps {
  onLogoClick?: () => void
}

// ── Nav data ───────────────────────────────────────────────────────────────

const NAV_MENUS: NavMenu[] = [
  {
    id: 'verifier',
    label: 'Vérifier',
    items: [
      { href: '/', icon: <Search size={15} />, label: 'Rechercher un artisan', desc: 'Vérifiez SIRET, certifications et alertes légales' },
      { href: '/comparer', icon: <ArrowLeftRight size={15} />, label: 'Comparer des artisans', desc: 'Confrontez 2 ou 3 profils côte à côte' },
      { href: '/trouver-artisan', icon: <MapPin size={15} />, label: 'Trouver près de moi', desc: 'Artisans certifiés RGE près de chez vous' },
    ],
  },
  {
    id: 'analyser',
    label: 'Analyser',
    items: [
      { href: '/simulateur-prix', icon: <Calculator size={15} />, label: 'Simulateur de prix', desc: 'Votre devis est-il au bon tarif ?' },
      { href: '/analyser-devis', icon: <FileSearch size={15} />, label: 'Analyser un devis IA', desc: 'Conformité légale et mentions obligatoires' },
      { href: null, icon: <ArrowLeftRight size={15} />, label: 'Comparer des devis', desc: 'Comparez plusieurs devis entre eux', soon: true },
    ],
  },
  {
    id: 'proteger',
    label: 'Se protéger',
    items: [
      { href: '/guide-chantier', icon: <ClipboardCheck size={15} />, label: 'Guide chantier', desc: 'Checklist de suivi en 4 phases' },
      { href: '/assistant-juridique', icon: <Scale size={15} />, label: 'Assistant juridique', desc: 'Droits et recours en cas de litige' },
      { href: null, icon: <AlertTriangle size={15} />, label: 'Signaler un artisan', desc: 'Alertez la communauté', soon: true },
    ],
  },
  {
    id: 'outils',
    label: 'Outils',
    items: [
      { href: '/mes-chantiers', icon: <HardHat size={15} />, label: 'Carnet de chantier', desc: 'Suivez vos travaux et paiements' },
      { href: null, icon: <Euro size={15} />, label: "Calculateur d'aides", desc: "MaPrimeRénov', CEE et plus", soon: true },
    ],
  },
]

// ── Dropdown panel ─────────────────────────────────────────────────────────

function DropdownPanel({ items, onClose }: { items: NavItem[]; onClose: () => void }) {
  return (
    <div style={{
      position: 'absolute', top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderRadius: '14px', boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
      padding: '6px', minWidth: '280px', zIndex: 100,
    }}>
      {items.map((item) => {
        const inner = (
          <>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: item.soon ? 'var(--color-border)' : 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: item.soon ? 'var(--color-muted)' : 'var(--color-accent)', flexShrink: 0,
            }}>
              {item.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <p style={{
                  margin: 0, fontSize: '13px', fontWeight: 600, lineHeight: 1.3,
                  color: item.soon ? 'var(--color-muted)' : 'var(--color-text)',
                }}>
                  {item.label}
                </p>
                {item.soon && (
                  <span style={{
                    fontSize: '10px', fontWeight: 700, padding: '2px 6px',
                    borderRadius: '20px', background: '#fef3c7', color: '#92400e', flexShrink: 0,
                  }}>
                    Bientôt
                  </span>
                )}
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-muted)', lineHeight: 1.4 }}>
                {item.desc}
              </p>
            </div>
          </>
        )

        if (item.soon || !item.href) {
          return (
            <div
              key={item.label}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                padding: '10px 12px', borderRadius: '10px', cursor: 'not-allowed', opacity: 0.65,
              }}
            >
              {inner}
            </div>
          )
        }
        return (
          <a
            key={item.href}
            href={item.href}
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: '12px',
              padding: '10px 12px', borderRadius: '10px', textDecoration: 'none',
              color: 'var(--color-text)', transition: 'background 0.12s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            {inner}
          </a>
        )
      })}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export default function SiteHeader({ onLogoClick }: SiteHeaderProps) {
  const pathname = usePathname()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileSection, setMobileSection] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const headerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpenMenu(null)
        setUserMenuOpen(false)
        setMobileOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close everything on route change
  useEffect(() => {
    setOpenMenu(null)
    setUserMenuOpen(false)
    setMobileOpen(false)
  }, [pathname])

  const closeAll = () => {
    setOpenMenu(null)
    setUserMenuOpen(false)
    setMobileOpen(false)
  }

  const toggleMenu = (id: string) => {
    setOpenMenu(prev => prev === id ? null : id)
    setUserMenuOpen(false)
  }

  const toggleUserMenu = () => {
    setUserMenuOpen(prev => !prev)
    setOpenMenu(null)
  }

  const initials = (() => {
    const meta = user?.user_metadata
    if (meta?.full_name) {
      return (meta.full_name as string).split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    }
    return user?.email?.charAt(0).toUpperCase() || 'U'
  })()

  const logoContent = (
    <>
      <svg width="24" height="26" viewBox="0 0 24 26" fill="none" aria-hidden="true">
        <path
          d="M12 1L2 5.5V12c0 5.25 4.3 10.15 10 11.5C17.7 22.15 22 17.25 22 12V5.5L12 1Z"
          fill="var(--color-accent)"
        />
        <path
          d="M8 13l2.5 2.5L16 10"
          stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
      <span className="font-display" style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-accent)', letterSpacing: '-0.02em' }}>
        Verifio
      </span>
    </>
  )

  // ── Bottom nav items ────────────────────────────────────────────────────

  const bottomNavLinks = [
    { href: '/', Icon: Search, label: 'Rechercher' },
    { href: '/simulateur-prix', Icon: Wrench, label: 'Outils' },
    { href: user ? '/mon-espace' : '/auth', Icon: User, label: 'Mon espace' },
  ]

  return (
    <Fragment>
      {/* ── HEADER ── */}
      <header
        ref={headerRef}
        className={scrolled ? 'header-scrolled' : ''}
        style={{
          padding: '0 24px', height: '58px',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 50,
          transition: 'box-shadow 0.2s',
        }}
      >
        {/* Logo */}
        <div style={{ flexShrink: 0 }}>
          {onLogoClick ? (
            <button
              onClick={() => { onLogoClick(); closeAll() }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              {logoContent}
            </button>
          ) : (
            <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
              {logoContent}
            </a>
          )}
        </div>

        {/* ── CENTER: Desktop dropdown nav ── */}
        <nav className="nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          {NAV_MENUS.map((menu) => (
            <div key={menu.id} style={{ position: 'relative' }}>
              <button
                onClick={() => toggleMenu(menu.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  background: openMenu === menu.id ? 'var(--color-bg)' : 'transparent',
                  border: 'none', cursor: 'pointer', padding: '7px 12px', borderRadius: '8px',
                  fontSize: '13px', fontWeight: 600,
                  color: openMenu === menu.id ? 'var(--color-accent)' : 'var(--color-text)',
                  fontFamily: 'var(--font-body)', transition: 'background 0.15s, color 0.15s',
                }}
              >
                {menu.label}
                <ChevronDown
                  size={13}
                  style={{
                    transition: 'transform 0.2s',
                    transform: openMenu === menu.id ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                />
              </button>
              {openMenu === menu.id && <DropdownPanel items={menu.items} onClose={closeAll} />}
            </div>
          ))}
        </nav>

        {/* ── RIGHT ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>

          {/* Desktop auth / user menu */}
          <div className="nav-desktop">
            {user ? (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={toggleUserMenu}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: userMenuOpen ? 'var(--color-bg)' : 'transparent',
                    border: `1px solid ${userMenuOpen ? 'var(--color-border)' : 'transparent'}`,
                    borderRadius: '10px', cursor: 'pointer', padding: '5px 10px 5px 5px',
                    fontFamily: 'var(--font-body)', transition: 'background 0.15s',
                  }}
                >
                  <div style={{
                    width: '30px', height: '30px', borderRadius: '50%',
                    background: 'var(--color-accent)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 700, flexShrink: 0,
                  }}>
                    {initials}
                  </div>
                  <ChevronDown
                    size={13}
                    style={{
                      color: 'var(--color-muted)', transition: 'transform 0.2s',
                      transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  />
                </button>

                {/* User dropdown */}
                {userMenuOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                    borderRadius: '14px', boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
                    padding: '6px', minWidth: '210px', zIndex: 100,
                  }}>
                    <div style={{
                      padding: '10px 12px 10px',
                      borderBottom: '1px solid var(--color-border)',
                      marginBottom: '4px',
                    }}>
                      <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-muted)', fontWeight: 500 }}>
                        Connecté en tant que
                      </p>
                      <p style={{
                        margin: '2px 0 0', fontSize: '13px', fontWeight: 600,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        color: 'var(--color-text)',
                      }}>
                        {user.email}
                      </p>
                    </div>
                    {[
                      { href: '/mon-espace', label: 'Mon espace', Icon: User },
                      { href: '/mes-chantiers', label: 'Mes chantiers', Icon: HardHat },
                    ].map(({ href, label, Icon }) => (
                      <a
                        key={href}
                        href={href}
                        onClick={closeAll}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '9px 12px', borderRadius: '10px',
                          textDecoration: 'none', color: 'var(--color-text)',
                          fontSize: '13px', fontWeight: 500, transition: 'background 0.12s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <Icon size={14} color="var(--color-muted)" />
                        {label}
                      </a>
                    ))}
                    <div style={{ height: '1px', background: 'var(--color-border)', margin: '4px 0' }} />
                    <button
                      onClick={() => { supabase.auth.signOut(); closeAll() }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '9px 12px', borderRadius: '10px',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#dc2626', fontSize: '13px', fontWeight: 500,
                        fontFamily: 'var(--font-body)', width: '100%', textAlign: 'left',
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <LogOut size={14} />
                      Se déconnecter
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link
                  href="/auth"
                  style={{
                    fontSize: '13px', fontWeight: 600, color: 'var(--color-text)',
                    textDecoration: 'none', padding: '7px 14px', borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  Connexion
                </Link>
                <Link
                  href="/auth"
                  style={{
                    fontSize: '13px', fontWeight: 600, color: '#fff',
                    textDecoration: 'none', padding: '7px 14px', borderRadius: '8px',
                    background: 'var(--color-accent)',
                  }}
                >
                  S'inscrire
                </Link>
              </div>
            )}
          </div>

          {/* Hamburger — tablet/mobile */}
          <button
            className="nav-hamburger"
            onClick={() => setMobileOpen((o) => !o)}
            style={{
              background: 'none', border: '1px solid var(--color-border)',
              borderRadius: '8px', cursor: 'pointer', padding: '7px 9px',
              display: 'flex', alignItems: 'center', color: 'var(--color-text)',
            }}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* ── MOBILE MENU (slide panel) ── */}
        {mobileOpen && (
          <div style={{
            position: 'absolute', top: '58px', left: 0, right: 0,
            background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)',
            padding: '8px 16px 20px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)', zIndex: 49,
            maxHeight: 'calc(100vh - 58px - 64px)', overflowY: 'auto',
          }}>
            {/* Accordion nav sections */}
            {NAV_MENUS.map((menu) => (
              <div key={menu.id} style={{ marginBottom: '2px' }}>
                <button
                  onClick={() => setMobileSection(prev => prev === menu.id ? null : menu.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', padding: '11px 8px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '12px', fontWeight: 700, color: 'var(--color-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.07em',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {menu.label}
                  <ChevronDown
                    size={14}
                    style={{
                      color: 'var(--color-muted)', transition: 'transform 0.2s',
                      transform: mobileSection === menu.id ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  />
                </button>
                {mobileSection === menu.id && (
                  <div style={{ paddingBottom: '4px' }}>
                    {menu.items.map((item) => {
                      const inner = (
                        <>
                          <div style={{
                            width: '30px', height: '30px', borderRadius: '7px',
                            background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: item.soon ? 'var(--color-muted)' : 'var(--color-accent)', flexShrink: 0,
                          }}>
                            {item.icon}
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: item.soon ? 'var(--color-muted)' : 'var(--color-text)' }}>
                              {item.label}
                            </p>
                            <p style={{ margin: '1px 0 0', fontSize: '11px', color: 'var(--color-muted)' }}>
                              {item.desc}
                            </p>
                          </div>
                          {item.soon && (
                            <span style={{
                              fontSize: '10px', fontWeight: 700, padding: '2px 6px',
                              borderRadius: '20px', background: '#fef3c7', color: '#92400e', flexShrink: 0,
                            }}>
                              Bientôt
                            </span>
                          )}
                        </>
                      )
                      if (item.soon || !item.href) {
                        return (
                          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '10px', opacity: 0.65, cursor: 'not-allowed' }}>
                            {inner}
                          </div>
                        )
                      }
                      return (
                        <a
                          key={item.href}
                          href={item.href}
                          onClick={closeAll}
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '10px', textDecoration: 'none', color: 'var(--color-text)' }}
                        >
                          {inner}
                        </a>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}

            <div style={{ height: '1px', background: 'var(--color-border)', margin: '10px 0' }} />

            {/* User section */}
            {user ? (
              <>
                <div style={{ padding: '6px 8px 2px', fontSize: '11px', color: 'var(--color-muted)', fontWeight: 500 }}>
                  {user.email}
                </div>
                {[
                  { href: '/mon-espace', label: 'Mon espace', Icon: User },
                  { href: '/mes-chantiers', label: 'Mes chantiers', Icon: HardHat },
                ].map(({ href, label, Icon }) => (
                  <a
                    key={href}
                    href={href}
                    onClick={closeAll}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '11px 8px', borderRadius: '10px',
                      textDecoration: 'none', color: 'var(--color-text)',
                      fontSize: '13px', fontWeight: 600,
                    }}
                  >
                    <Icon size={15} color="var(--color-accent)" />
                    {label}
                  </a>
                ))}
                <button
                  onClick={() => { supabase.auth.signOut(); closeAll() }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '11px 8px', borderRadius: '10px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#dc2626', fontSize: '13px', fontWeight: 600,
                    fontFamily: 'var(--font-body)', width: '100%',
                  }}
                >
                  <LogOut size={15} />
                  Déconnexion
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', gap: '8px', padding: '4px 0' }}>
                <a
                  href="/auth"
                  onClick={closeAll}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '12px', borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                    textDecoration: 'none', color: 'var(--color-text)',
                    fontSize: '13px', fontWeight: 600,
                  }}
                >
                  Connexion
                </a>
                <a
                  href="/auth"
                  onClick={closeAll}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '12px', borderRadius: '10px',
                    background: 'var(--color-accent)',
                    textDecoration: 'none', color: '#fff',
                    fontSize: '13px', fontWeight: 600,
                  }}
                >
                  S'inscrire
                </a>
              </div>
            )}
          </div>
        )}

        <style>{`
          .nav-desktop { display: flex; }
          .nav-hamburger { display: none !important; }
          .nav-bottom { display: none !important; }
          @media (max-width: 768px) {
            .nav-desktop { display: none !important; }
            .nav-hamburger { display: flex !important; }
          }
          @media (max-width: 640px) {
            .nav-bottom { display: flex !important; }
            body { padding-bottom: 64px; }
          }
        `}</style>
      </header>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav
        className="nav-bottom"
        aria-label="Navigation mobile"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 48,
          height: '64px',
          background: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border)',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
          alignItems: 'stretch',
        }}
      >
        {bottomNavLinks.map(({ href, Icon, label }) => {
          const isActive = pathname === href
          return (
            <a
              key={href}
              href={href}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '3px',
                textDecoration: 'none',
                color: isActive ? 'var(--color-accent)' : 'var(--color-muted)',
                fontSize: '10px', fontWeight: isActive ? 700 : 500,
                fontFamily: 'var(--font-body)',
              }}
            >
              <Icon size={22} />
              <span>{label}</span>
            </a>
          )
        })}
        <button
          onClick={() => setMobileOpen(o => !o)}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '3px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: mobileOpen ? 'var(--color-accent)' : 'var(--color-muted)',
            fontSize: '10px', fontWeight: mobileOpen ? 700 : 500,
            fontFamily: 'var(--font-body)',
          }}
        >
          <Menu size={22} />
          <span>Menu</span>
        </button>
      </nav>
    </Fragment>
  )
}
