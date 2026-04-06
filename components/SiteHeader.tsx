'use client'

import { useState, useEffect, useRef, Fragment } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChevronDown, Search, ArrowLeftRight, Calculator, FileSearch,
  User, LogOut, Menu, X, Scale, HardHat,
  Euro, Bell, Shield, ShieldCheck, LayoutDashboard, FileText,
  BarChart2, ClipboardList, Wrench, Gem,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

// ── Types ──────────────────────────────────────────────────────────────────

interface NavItem {
  href: string | null
  label: string
  desc: string
  Icon: React.ComponentType<{ size: number; color?: string }>
  soon?: boolean
  badge?: string
}

interface NavMenu {
  id: string
  Icon: React.ComponentType<{ size: number; strokeWidth?: number; color?: string }>
  label: string
  items: NavItem[]
  stat: { value: string; label: string; tip: string }
  ctaHref: string
  ctaLabel: string
}

interface SiteHeaderProps {
  onLogoClick?: () => void
}

// ── Nav data ───────────────────────────────────────────────────────────────

const NAV_MENUS: NavMenu[] = [
  {
    id: 'verifier',
    Icon: Search,
    label: 'Vérifier',
    ctaHref: '/recherche',
    ctaLabel: 'Vérifier un artisan',
    stat: { value: '26 000', label: 'arnaques signalées en 2024', tip: 'Vérifiez avant de signer' },
    items: [
      { href: '/recherche', Icon: Search, label: 'Rechercher un artisan', desc: 'Vérifiez SIRET, certifications et alertes légales' },
      { href: '/comparer', Icon: ArrowLeftRight, label: 'Comparer des artisans', desc: 'Confrontez 2 ou 3 profils côte à côte' },
    ],
  },
  {
    id: 'analyser',
    Icon: BarChart2,
    label: 'Analyser',
    ctaHref: '/simulateur-prix',
    ctaLabel: 'Simuler mon devis',
    stat: { value: '3 500€', label: 'économisés en moyenne', tip: 'Grâce au simulateur de prix' },
    items: [
      { href: '/simulateur-prix', Icon: Calculator, label: 'Simulateur de prix', desc: 'Votre devis est-il au bon tarif ?' },
      { href: '/analyser-devis', Icon: FileSearch, label: 'Analyser & vérifier mon devis', desc: '5 analyses par mois par artisan vérifié', badge: 'Pack Sérénité' },
      { href: '/calculateur-aides', Icon: Euro, label: "Calculateur d'aides État", desc: "MaPrimeRénov', CEE et plus" },
    ],
  },
  {
    id: 'proteger',
    Icon: Scale,
    label: 'Se protéger',
    ctaHref: '/assistant-juridique',
    ctaLabel: 'Assistant juridique',
    stat: { value: '78%', label: 'des litiges évités', tip: 'Avec notre checklist complète' },
    items: [
      { href: '/assistant-juridique', Icon: Scale, label: 'Assistant juridique', desc: 'Vos droits et recours en cas de litige' },
      { href: '/pricing', Icon: Gem, label: 'Pack Sérénité', desc: 'Rapport complet + analyse de devis par IA' },
    ],
  },
  {
    id: 'chantier',
    Icon: ClipboardList,
    label: 'Mon chantier',
    ctaHref: '/mes-chantiers',
    ctaLabel: 'Mon carnet de chantier',
    stat: { value: '1 200+', label: 'chantiers suivis', tip: "Sur Rien qui cloche aujourd'hui" },
    items: [
      { href: '/mes-chantiers', Icon: HardHat, label: 'Carnet de chantier', desc: 'Suivez vos travaux, paiements et checklist' },
      { href: '/mon-espace', Icon: Bell, label: 'Mon espace', desc: 'Surveillances et historique de recherches' },
    ],
  },
]

// ── Mega Menu Panel ────────────────────────────────────────────────────────

function MegaMenuPanel({
  menu,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: {
  menu: NavMenu
  onClose: () => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}) {
  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginTop: '8px',
        background: 'rgba(255,255,255,0.92)',
        border: '1px solid rgba(230,223,213,0.9)',
        borderRadius: '24px',
        boxShadow: '0 30px 70px rgba(20,32,27,0.14), 0 10px 24px rgba(20,32,27,0.05)',
        padding: '10px',
        minWidth: '560px',
        zIndex: 200,
        display: 'grid',
        gridTemplateColumns: '1fr 200px',
        gap: '8px',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Left: items */}
      <div style={{ padding: '8px 0' }}>
        {menu.items.map((item) => {
          const iconEl = (
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
              background: item.soon ? 'var(--color-border)' : 'var(--color-accent-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <item.Icon
                size={16}
                color={item.soon ? 'var(--color-muted)' : 'var(--color-accent)'}
              />
            </div>
          )

          const content = (
            <>
              {iconEl}
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
                  {item.badge && !item.soon && (
                    <span style={{
                      fontSize: '10px', fontWeight: 700, padding: '2px 6px',
                      borderRadius: '20px', background: 'rgba(45,185,110,0.12)', color: 'var(--color-accent)', flexShrink: 0,
                    }}>
                      {item.badge}
                    </span>
                  )}
                </div>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--color-muted)', lineHeight: 1.4 }}>
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
                  padding: '10px 14px', borderRadius: '12px', opacity: 0.6, cursor: 'not-allowed',
                }}
              >
                {content}
              </div>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                padding: '10px 14px', borderRadius: '12px',
                textDecoration: 'none', color: 'var(--color-text)',
                transition: 'background 0.12s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {content}
            </Link>
          )
        })}
      </div>

      {/* Right: stat panel */}
      <div style={{
        background: '#1B4332',
        borderRadius: '12px',
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '16px',
      }}>
        <div>
          <p style={{
            margin: '0 0 4px',
            fontSize: '28px',
            fontWeight: 800,
            color: '#D8F3DC',
            fontFamily: 'var(--font-display)',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
          }}>
            {menu.stat.value}
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: '#74C69D', lineHeight: 1.4 }}>
            {menu.stat.label}
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#B7E4C7', fontStyle: 'italic', lineHeight: 1.4 }}>
            « {menu.stat.tip} »
          </p>
        </div>

        <Link
          href={menu.ctaHref}
          onClick={onClose}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '9px 12px',
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            color: '#fff',
            textDecoration: 'none',
            fontSize: '12px',
            fontWeight: 600,
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
        >
          {menu.ctaLabel} →
        </Link>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export default function SiteHeader({ onLogoClick }: SiteHeaderProps) {
  const pathname = usePathname()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [isArtisan, setIsArtisan] = useState(false)
  const [survCount, setSurvCount] = useState(0)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileSection, setMobileSection] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  async function checkArtisan(userId: string) {
    const { data } = await supabase
      .from('artisans')
      .select('id')
      .eq('user_id', userId)
      .eq('statut', 'verifie')
      .maybeSingle()
    setIsArtisan(!!data)
  }

  async function loadSurvCount(email: string) {
    const { count } = await supabase
      .from('surveillances')
      .select('*', { count: 'exact', head: true })
      .eq('email', email)
    setSurvCount(count ?? 0)
  }

  // Auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) {
        loadSurvCount(data.user.email!)
        // B2B masqué : checkArtisan(data.user.id)
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadSurvCount(session.user.email!)
        // B2B masqué : checkArtisan(session.user.id)
      } else {
        setSurvCount(0)
        setIsArtisan(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Click outside
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

  // Close on route change
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setOpenMenu(null)
      setUserMenuOpen(false)
      setMobileOpen(false)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [pathname])

  // Cleanup timer on unmount
  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current) }, [])

  // ── Hover mega menu handlers ──────────────────────────────────────────

  const handleNavEnter = (menuId: string) => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null }
    setOpenMenu(menuId)
    setUserMenuOpen(false)
  }

  const handleNavLeave = () => {
    closeTimer.current = setTimeout(() => setOpenMenu(null), 150)
  }

  const handlePanelEnter = () => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null }
  }

  const closeAll = () => {
    setOpenMenu(null)
    setUserMenuOpen(false)
    setMobileOpen(false)
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

  // ── Bottom nav links ──────────────────────────────────────────────────

  const bottomNavLinks = [
    { href: '/', Icon: Search, label: 'Rechercher' },
    { href: '/simulateur-prix', Icon: Calculator, label: 'Analyser' },
    { href: '/guide-chantier', Icon: Shield, label: 'Protéger' },
    {
      href: isArtisan ? '/artisan/dashboard' : (user ? '/mon-espace' : '/auth'),
      Icon: isArtisan ? LayoutDashboard : User,
      label: isArtisan ? 'Dashboard' : 'Mon espace',
    },
  ]

  return (
    <Fragment>
      {/* ── STICKY WRAPPER (top bar + header) ── */}
      <div
        ref={headerRef}
        style={{ position: 'sticky', top: 0, zIndex: 100 }}
      >
        {/* ── TOP BAR ── */}
        <div style={{
          background: 'linear-gradient(90deg, #10251d 0%, #153b2e 45%, #1b4332 100%)',
          color: 'rgba(255,255,255,0.9)',
          fontSize: 12,
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          textAlign: 'center',
          lineHeight: 1.4,
        }}>
          <style>{`
            @media (max-width: 768px) {
              .topbanner-secondary { display: none !important; }
              .topbanner-primary { font-size: 11px !important; }
            }
          `}</style>

          <span className="topbanner-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Données officielles INSEE · ADEME · BODACC · Mise à jour quotidienne
          </span>

          <span className="topbanner-secondary" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            borderLeft: '1px solid rgba(255,255,255,0.2)',
            paddingLeft: 24,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            Plus de 10 000 particuliers déjà accompagnés
          </span>
        </div>

        {/* ── MAIN HEADER ── */}
        <header
          style={{
            padding: '0 24px',
            height: '78px',
            borderBottom: '1px solid rgba(214, 206, 193, 0.75)',
            background: 'rgba(252,249,245,0.82)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'box-shadow 0.2s, backdrop-filter 0.2s',
            boxShadow: scrolled ? '0 22px 50px rgba(20,32,27,0.10)' : 'none',
            backdropFilter: 'blur(18px)',
          }}
        >
          {/* ── LOGO ── */}
          <div style={{ flexShrink: 0 }}>
            {onLogoClick ? (
              <button
                onClick={() => { onLogoClick(); closeAll() }}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <LogoContent />
              </button>
            ) : (
              <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                <LogoContent />
              </Link>
            )}
          </div>

          {/* ── CENTER: Desktop mega-menu nav ── */}
          <nav className="nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: '2px', position: 'relative' }}>
            {NAV_MENUS.map((menu) => (
              <div
                key={menu.id}
                style={{ position: 'relative' }}
                onMouseEnter={() => handleNavEnter(menu.id)}
                onMouseLeave={handleNavLeave}
              >
                <button
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    background: openMenu === menu.id ? 'rgba(21,59,46,0.07)' : 'transparent',
                    border: 'none', cursor: 'pointer', padding: '9px 14px', borderRadius: '12px',
                    fontSize: '13.5px', fontWeight: 600,
                    color: openMenu === menu.id ? 'var(--color-accent)' : 'var(--color-text)',
                    fontFamily: 'var(--font-body)', transition: 'background 0.15s, color 0.15s',
                  }}
                >
                  <menu.Icon size={14} strokeWidth={1.5} />
                  {menu.label}
                  <ChevronDown
                    size={12}
                    style={{
                      transition: 'transform 0.2s',
                      transform: openMenu === menu.id ? 'rotate(180deg)' : 'rotate(0deg)',
                      color: 'var(--color-muted)',
                    }}
                  />
                </button>

                {openMenu === menu.id && (
                  <MegaMenuPanel
                    menu={menu}
                    onClose={closeAll}
                    onMouseEnter={handlePanelEnter}
                    onMouseLeave={handleNavLeave}
                  />
                )}
              </div>
            ))}
            <Link
              href="/pricing"
              style={{
                display: 'flex', alignItems: 'center',
                background: pathname === '/pricing' ? 'rgba(21,59,46,0.07)' : 'transparent',
                border: 'none', cursor: 'pointer', padding: '9px 14px', borderRadius: '12px',
                fontSize: '13.5px', fontWeight: 600,
                color: pathname === '/pricing' ? 'var(--color-accent)' : 'var(--color-text)',
                textDecoration: 'none', transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = pathname === '/pricing' ? 'rgba(21,59,46,0.07)' : 'transparent' }}
            >
              <Gem size={14} strokeWidth={1.5} style={{ marginRight: '5px' }} />Tarifs
            </Link>
            <Link
              href="/a-propos"
              style={{
                display: 'flex', alignItems: 'center',
                background: pathname === '/a-propos' ? 'rgba(21,59,46,0.07)' : 'transparent',
                border: 'none', cursor: 'pointer', padding: '9px 14px', borderRadius: '12px',
                fontSize: '13.5px', fontWeight: 600,
                color: pathname === '/a-propos' ? 'var(--color-accent)' : 'var(--color-text)',
                textDecoration: 'none', transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = pathname === '/a-propos' ? 'rgba(21,59,46,0.07)' : 'transparent' }}
            >
              À propos
            </Link>
            {/* B2B masqué — Espace Artisan lien desktop supprimé pour le lancement B2C */}
          </nav>

          {/* ── RIGHT ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <div className="nav-desktop">
              {user ? (
                isArtisan ? (
                  /* ── ARTISAN VÉRIFIÉ ── */
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Badge vérifié */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '5px 10px', borderRadius: '20px',
                      background: '#f0fdf4', border: '1px solid #86efac',
                    }}>
                      <ShieldCheck size={13} color="#16a34a" />
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#15803d' }}>Artisan vérifié</span>
                    </div>

                    {/* CTA espace artisan */}
                    <Link
                      href="/artisan/dashboard"
                      style={{
                        fontSize: '13px', fontWeight: 700, color: '#fff',
                        textDecoration: 'none', padding: '8px 14px', borderRadius: '9px',
                        background: '#1B4332', display: 'flex', alignItems: 'center', gap: '5px',
                        transition: 'opacity 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                    >
                      Mon espace artisan →
                    </Link>

                    {/* Avatar artisan */}
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={toggleUserMenu}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          background: userMenuOpen ? 'var(--color-bg)' : 'transparent',
                          border: `1px solid ${userMenuOpen ? 'var(--color-border)' : 'transparent'}`,
                          borderRadius: '10px', cursor: 'pointer', padding: '4px 8px 4px 4px',
                          fontFamily: 'var(--font-body)', transition: 'all 0.15s',
                        }}
                      >
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: '#1B4332', color: '#D8F3DC',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '12px', fontWeight: 700, flexShrink: 0,
                        }}>
                          {initials}
                        </div>
                        <ChevronDown size={12} style={{ color: 'var(--color-muted)', transition: 'transform 0.2s', transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                      </button>

                      {userMenuOpen && (
                        <div style={{
                          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                          borderRadius: '16px', boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
                          padding: '6px', minWidth: '220px', zIndex: 200,
                        }}>
                          <div style={{ padding: '10px 12px 12px', borderBottom: '1px solid var(--color-border)', marginBottom: '4px' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#1B4332', color: '#D8F3DC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>
                              {initials}
                            </div>
                            <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-muted)' }}>Artisan vérifié</p>
                            <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
                          </div>
                          {[
                            { href: '/artisan/dashboard', label: 'Mon dashboard', Icon: LayoutDashboard },
                            { href: '/artisan/dashboard?tab=devis', label: 'Mes devis', Icon: FileText },
                            { href: `/artisan/dashboard?tab=profil`, label: 'Mon profil public', Icon: User },
                          ].map(({ href, label, Icon }) => (
                            <Link key={href} href={href} onClick={closeAll} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '10px', textDecoration: 'none', color: 'var(--color-text)', fontSize: '13px', fontWeight: 500, transition: 'background 0.12s' }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg)')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                              <Icon size={14} color="var(--color-muted)" />{label}
                            </Link>
                          ))}
                          <div style={{ height: '0.5px', background: 'var(--color-border)', margin: '4px 0' }} />
                          <Link href="/mon-profil" onClick={closeAll} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', fontSize: 13, color: 'var(--color-text)', textDecoration: 'none' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                              <circle cx="12" cy="7" r="4"/>
                            </svg>
                            Mon profil
                          </Link>
                          <div style={{ height: '0.5px', background: 'var(--color-border)', margin: '4px 0' }} />
                          <button onClick={() => { supabase.auth.signOut(); closeAll() }}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '13px', fontWeight: 500, fontFamily: 'var(--font-body)', width: '100%', textAlign: 'left', transition: 'background 0.12s' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                            <LogOut size={14} />Se déconnecter
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* ── PARTICULIER CONNECTÉ ── */
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Bell */}
                    <Link
                      href="/mon-espace?tab=surveillances"
                      style={{
                        position: 'relative',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                        color: 'var(--color-text)', textDecoration: 'none',
                        transition: 'background 0.15s',
                      }}
                      title="Mes surveillances"
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-border)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-bg)')}
                    >
                      <Bell size={16} />
                      {survCount > 0 && (
                        <span style={{
                          position: 'absolute', top: '-3px', right: '-3px',
                          width: '16px', height: '16px', borderRadius: '50%',
                          background: 'var(--color-accent)', color: '#fff',
                          fontSize: '9px', fontWeight: 800,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: '2px solid var(--color-surface)',
                        }}>
                          {survCount > 9 ? '9+' : survCount}
                        </span>
                      )}
                    </Link>

                    {/* Avatar + user menu */}
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={toggleUserMenu}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          background: userMenuOpen ? 'var(--color-bg)' : 'transparent',
                          border: `1px solid ${userMenuOpen ? 'var(--color-border)' : 'transparent'}`,
                          borderRadius: '10px', cursor: 'pointer', padding: '4px 10px 4px 4px',
                          fontFamily: 'var(--font-body)', transition: 'all 0.15s',
                        }}
                      >
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: '#1B4332', color: '#D8F3DC',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '12px', fontWeight: 700, flexShrink: 0,
                        }}>
                          {initials}
                        </div>
                        <ChevronDown size={12} style={{ color: 'var(--color-muted)', transition: 'transform 0.2s', transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                      </button>

                      {userMenuOpen && (
                        <div style={{
                          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                          borderRadius: '16px', boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
                          padding: '6px', minWidth: '220px', zIndex: 200,
                        }}>
                          <div style={{ padding: '10px 12px 12px', borderBottom: '1px solid var(--color-border)', marginBottom: '4px' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#1B4332', color: '#D8F3DC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>
                              {initials}
                            </div>
                            <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-muted)' }}>Connecté en tant que</p>
                            <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
                          </div>
                          {[
                            { href: '/mon-espace', label: 'Mon espace', Icon: User },
                            { href: '/mes-chantiers', label: 'Mes chantiers', Icon: HardHat },
                            { href: '/mon-espace?tab=surveillances', label: `Mes surveillances${survCount > 0 ? ` (${survCount})` : ''}`, Icon: Bell },
                          ].map(({ href, label, Icon }) => (
                            <Link key={href} href={href} onClick={closeAll} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '10px', textDecoration: 'none', color: 'var(--color-text)', fontSize: '13px', fontWeight: 500, transition: 'background 0.12s' }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg)')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                              <Icon size={14} color="var(--color-muted)" />{label}
                            </Link>
                          ))}
                          <div style={{ height: '0.5px', background: 'var(--color-border)', margin: '4px 0' }} />
                          <Link href="/mon-profil" onClick={closeAll} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', fontSize: 13, color: 'var(--color-text)', textDecoration: 'none' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                              <circle cx="12" cy="7" r="4"/>
                            </svg>
                            Mon profil
                          </Link>
                          <div style={{ height: '0.5px', background: 'var(--color-border)', margin: '4px 0' }} />
                          <button onClick={() => { supabase.auth.signOut(); closeAll() }}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '13px', fontWeight: 500, fontFamily: 'var(--font-body)', width: '100%', textAlign: 'left', transition: 'background 0.12s' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                            <LogOut size={14} />Se déconnecter
                          </button>
                        </div>
                      )}
                    </div>

                    {/* CTA vérifier artisan */}
                    <Link
                      href="/recherche"
                      style={{
                        fontSize: '13px', fontWeight: 700, color: '#fff',
                        textDecoration: 'none', padding: '8px 16px', borderRadius: '9px',
                        background: '#1B4332',
                        display: 'flex', alignItems: 'center', gap: '5px',
                        transition: 'opacity 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                    >
                      Vérifier un artisan →
                    </Link>
                  </div>
                )
              ) : (
                /* ── NON CONNECTÉ ── */
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Link
                    href="/auth"
                    style={{
                      fontSize: '13px', fontWeight: 500, color: 'var(--color-text)',
                      textDecoration: 'none', padding: '7px 14px',
                      borderRadius: '9px', transition: 'background 0.15s, color 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg)'; e.currentTarget.style.color = 'var(--color-accent)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text)' }}
                  >
                    Se connecter
                  </Link>
                  <Link
                    href="/recherche"
                    style={{
                      fontSize: '13px', fontWeight: 700, color: '#fff',
                      textDecoration: 'none', padding: '8px 16px', borderRadius: '9px',
                      background: '#1B4332',
                      display: 'flex', alignItems: 'center', gap: '5px',
                      transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                  >
                    Vérifier un artisan →
                  </Link>
                </div>
              )}
            </div>

            {/* Hamburger */}
            <button
              className="nav-hamburger"
              onClick={() => setMobileOpen((o) => !o)}
              style={{
                background: 'none', border: '1px solid var(--color-border)',
                borderRadius: '8px', cursor: 'pointer', padding: '7px 9px',
                display: 'flex', alignItems: 'center', color: 'var(--color-text)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </header>

        {/* ── MOBILE FULLSCREEN MENU ── */}
        {mobileOpen && (
          <div style={{
            position: 'fixed', inset: 0,
            top: '94px', // top bar + header height
            background: 'var(--color-surface)',
            zIndex: 49,
            overflowY: 'auto',
            padding: '16px 20px 100px',
          }}>
            {/* Nav sections */}
            {NAV_MENUS.map((menu) => (
              <div key={menu.id} style={{ marginBottom: '4px' }}>
                <button
                  onClick={() => setMobileSection(prev => prev === menu.id ? null : menu.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', padding: '13px 12px',
                    background: mobileSection === menu.id ? 'var(--color-bg)' : 'none',
                    border: 'none', borderRadius: '12px', cursor: 'pointer',
                    fontSize: '15px', fontWeight: 700,
                    color: 'var(--color-text)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <menu.Icon size={16} strokeWidth={1.5} />
                    {menu.label}
                  </span>
                  <ChevronDown
                    size={16}
                    style={{
                      color: 'var(--color-muted)', transition: 'transform 0.2s',
                      transform: mobileSection === menu.id ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  />
                </button>

                {mobileSection === menu.id && (
                  <div style={{ paddingBottom: '8px', paddingLeft: '8px' }}>
                    {menu.items.map((item) => {
                      const inner = (
                        <>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                            background: item.soon ? 'var(--color-border)' : 'var(--color-accent-light)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <item.Icon size={15} color={item.soon ? 'var(--color-muted)' : 'var(--color-accent)'} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: item.soon ? 'var(--color-muted)' : 'var(--color-text)' }}>
                              {item.label}
                            </p>
                            <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-muted)' }}>
                              {item.desc}
                            </p>
                          </div>
                          {item.soon && (
                            <span style={{
                              fontSize: '10px', fontWeight: 700, padding: '2px 6px',
                              borderRadius: '20px', background: '#fef3c7', color: '#92400e',
                            }}>
                              Bientôt
                            </span>
                          )}
                        </>
                      )

                      if (item.soon || !item.href) {
                        return (
                          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', opacity: 0.6, cursor: 'not-allowed' }}>
                            {inner}
                          </div>
                        )
                      }
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={closeAll}
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', textDecoration: 'none', color: 'var(--color-text)', transition: 'background 0.12s' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          {inner}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}

            {/* À propos link */}
            <Link
              href="/a-propos"
              onClick={closeAll}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '13px 12px', borderRadius: '12px', marginBottom: '4px',
                background: pathname === '/a-propos' ? 'var(--color-bg)' : 'none',
                textDecoration: 'none', color: 'var(--color-text)',
                fontSize: '15px', fontWeight: 700,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = pathname === '/a-propos' ? 'var(--color-bg)' : 'transparent')}
            >
              À propos
            </Link>

            {/* B2B masqué — Espace Artisan lien mobile supprimé pour le lancement B2C */}

            <div style={{ height: '1px', background: 'var(--color-border)', margin: '16px 0' }} />

            {/* Auth section */}
            {user ? (
              <>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 12px',
                  background: 'var(--color-bg)', borderRadius: '12px', marginBottom: '8px',
                }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: '#1B4332', color: '#D8F3DC',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '15px', fontWeight: 700, flexShrink: 0,
                  }}>
                    {initials}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-muted)' }}>
                      {isArtisan ? 'Artisan vérifié' : 'Connecté'}
                    </p>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.email}
                    </p>
                  </div>
                  {isArtisan && (
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '20px', background: '#f0fdf4', border: '1px solid #86efac' }}>
                      <ShieldCheck size={12} color="#16a34a" />
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#15803d' }}>Vérifié</span>
                    </div>
                  )}
                </div>

                {(isArtisan ? [
                  { href: '/artisan/dashboard', label: 'Mon dashboard', Icon: LayoutDashboard },
                  { href: '/artisan/dashboard?tab=devis', label: 'Mes devis', Icon: FileText },
                  { href: '/artisan/dashboard?tab=profil', label: 'Mon profil public', Icon: User },
                ] : [
                  { href: '/mon-espace', label: 'Mon espace', Icon: User },
                  { href: '/mes-chantiers', label: 'Mes chantiers', Icon: HardHat },
                  { href: '/mon-espace?tab=surveillances', label: 'Mes surveillances', Icon: Bell },
                ]).map(({ href, label, Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={closeAll}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px', borderRadius: '12px', marginBottom: '4px',
                      textDecoration: 'none', color: 'var(--color-text)',
                      fontSize: '14px', fontWeight: 600, transition: 'background 0.12s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Icon size={16} color="var(--color-accent)" />
                    {label}
                  </Link>
                ))}

                <div style={{ height: '0.5px', background: 'var(--color-border)', margin: '4px 0' }} />
                <Link href="/mon-profil" onClick={closeAll} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', fontSize: 13, color: 'var(--color-text)', textDecoration: 'none' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  Mon profil
                </Link>
                <div style={{ height: '0.5px', background: 'var(--color-border)', margin: '4px 0' }} />
                <button
                  onClick={() => { supabase.auth.signOut(); closeAll() }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px', borderRadius: '12px', width: '100%',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#dc2626', fontSize: '14px', fontWeight: 600,
                    fontFamily: 'var(--font-body)', marginTop: '4px',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <LogOut size={16} />
                  Se déconnecter
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                <Link
                  href="/auth"
                  onClick={closeAll}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '14px', borderRadius: '12px',
                    border: '1px solid var(--color-border)',
                    textDecoration: 'none', color: 'var(--color-text)',
                    fontSize: '14px', fontWeight: 600,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  Se connecter
                </Link>
                <Link
                  href="/auth"
                  onClick={closeAll}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '14px', borderRadius: '12px',
                    background: '#1B4332',
                    textDecoration: 'none', color: '#fff',
                    fontSize: '14px', fontWeight: 700,
                    transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88' }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                >
                  S&apos;inscrire
                </Link>
              </div>
            )}
          </div>
        )}

        <style>{`
          .nav-desktop { display: flex; }
          .nav-hamburger { display: none !important; }
          .nav-bottom { display: none !important; }
          @media (max-width: 900px) {
            .nav-desktop { display: none !important; }
            .nav-hamburger { display: flex !important; }
          }
          @media (max-width: 640px) {
            .nav-bottom { display: flex !important; }
            body { padding-bottom: 64px; }
          }
        `}</style>
      </div>

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
            <Link
              key={label}
              href={href}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '3px',
                textDecoration: 'none',
                color: isActive ? 'var(--color-accent)' : 'var(--color-muted)',
                fontSize: '10px', fontWeight: isActive ? 700 : 500,
                fontFamily: 'var(--font-body)',
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--color-text)' }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--color-muted)' }}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
    </Fragment>
  )
}

// ── Logo subcomponent ──────────────────────────────────────────────────────

function LogoContent() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{
        width: '42px',
        height: '42px',
        borderRadius: '14px',
        background: 'linear-gradient(135deg, #153b2e 0%, #2f7a5f 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 14px 30px rgba(21,59,46,0.18)',
        flexShrink: 0,
      }}>
        <svg width="24" height="26" viewBox="0 0 26 28" fill="none" aria-hidden="true">
        <path
          d="M13 1L2 6V13c0 5.8 4.8 11.2 11 12.5C19.2 24.2 24 18.8 24 13V6L13 1Z"
          fill="#ffffff"
        />
        <path
          d="M9 14l3 3L18 11"
          stroke="#36a376" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"
        />
        </svg>
      </div>
      <div>
        <p className="font-display" style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#153b2e', letterSpacing: '-0.04em', lineHeight: 1.05, fontFamily: 'var(--font-display)' }}>
          Rien qui cloche
        </p>
        <p style={{ margin: '2px 0 0', fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Confiance chantier
        </p>
      </div>
    </div>
  )
}
