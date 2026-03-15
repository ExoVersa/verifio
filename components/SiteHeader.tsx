'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  ChevronDown, Search, ArrowLeftRight, Calculator, FileSearch,
  ClipboardCheck, User, LogOut, Menu, X, ShieldCheck, Scale, MapPin,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface SiteHeaderProps {
  onLogoClick?: () => void
}

interface NavItem {
  href: string
  label: string
  desc: string
  icon: React.ReactNode
}

const VERIFIER_ITEMS: NavItem[] = [
  {
    href: '/trouver-artisan',
    icon: <MapPin size={15} />,
    label: 'Trouver un artisan',
    desc: 'Artisans certifiés RGE près de chez vous',
  },
  {
    href: '/',
    icon: <Search size={15} />,
    label: 'Vérifier un artisan',
    desc: 'Vérifiez SIRET, certifications et alertes légales',
  },
  {
    href: '/comparer',
    icon: <ArrowLeftRight size={15} />,
    label: 'Comparer des artisans',
    desc: 'Confrontez 2 ou 3 profils côte à côte',
  },
]

const OUTILS_ITEMS: NavItem[] = [
  {
    href: '/simulateur-prix',
    icon: <Calculator size={15} />,
    label: 'Simulateur de prix',
    desc: 'Votre devis est-il au bon tarif ?',
  },
  {
    href: '/analyser-devis',
    icon: <FileSearch size={15} />,
    label: 'Analyser un devis',
    desc: 'Conformité légale et mentions obligatoires',
  },
  {
    href: '/guide-chantier',
    icon: <ClipboardCheck size={15} />,
    label: 'Guide chantier',
    desc: 'Checklist de suivi en 4 phases',
  },
  {
    href: '/assistant-juridique',
    icon: <Scale size={15} />,
    label: 'Assistant juridique',
    desc: 'Droits et recours en cas de litige',
  },
]

function DropdownPanel({ items, onClose }: { items: NavItem[]; onClose: () => void }) {
  return (
    <div style={{
      position: 'absolute', top: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)',
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderRadius: '14px', boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
      padding: '6px', minWidth: '270px', zIndex: 100,
    }}>
      {items.map((item) => (
        <a
          key={item.href}
          href={item.href}
          onClick={onClose}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: '12px',
            padding: '10px 12px', borderRadius: '10px', textDecoration: 'none',
            color: 'var(--color-text)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'var(--color-bg)', border: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-accent)', flexShrink: 0,
          }}>
            {item.icon}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, lineHeight: 1.3 }}>{item.label}</p>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-muted)', lineHeight: 1.4 }}>{item.desc}</p>
          </div>
        </a>
      ))}
    </div>
  )
}

export default function SiteHeader({ onLogoClick }: SiteHeaderProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [verifierOpen, setVerifierOpen] = useState(false)
  const [outilsOpen, setOutilsOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setVerifierOpen(false)
        setOutilsOpen(false)
        setMobileOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const closeAll = () => {
    setVerifierOpen(false)
    setOutilsOpen(false)
    setMobileOpen(false)
  }

  const toggleVerifier = () => {
    setVerifierOpen((v) => !v)
    setOutilsOpen(false)
  }

  const toggleOutils = () => {
    setOutilsOpen((o) => !o)
    setVerifierOpen(false)
  }

  const logoContent = (
    <>
      <ShieldCheck size={20} color="var(--color-accent)" strokeWidth={2} />
      <span className="font-display" style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-accent)' }}>
        Verifio
      </span>
    </>
  )

  return (
    <header
      ref={headerRef}
      style={{
        padding: '0 24px', height: '56px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
      }}
    >
      {/* ── LEFT: Logo ── */}
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
      <nav className="site-nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>

        {/* Vérifier */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={toggleVerifier}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              background: verifierOpen ? 'var(--color-bg)' : 'transparent',
              border: 'none', cursor: 'pointer', padding: '7px 12px', borderRadius: '8px',
              fontSize: '13px', fontWeight: 600,
              color: verifierOpen ? 'var(--color-accent)' : 'var(--color-text)',
              fontFamily: 'var(--font-body)', transition: 'background 0.15s, color 0.15s',
            }}
          >
            Vérifier
            <ChevronDown
              size={13}
              style={{ transition: 'transform 0.2s', transform: verifierOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>
          {verifierOpen && <DropdownPanel items={VERIFIER_ITEMS} onClose={closeAll} />}
        </div>

        {/* Outils */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={toggleOutils}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              background: outilsOpen ? 'var(--color-bg)' : 'transparent',
              border: 'none', cursor: 'pointer', padding: '7px 12px', borderRadius: '8px',
              fontSize: '13px', fontWeight: 600,
              color: outilsOpen ? 'var(--color-accent)' : 'var(--color-text)',
              fontFamily: 'var(--font-body)', transition: 'background 0.15s, color 0.15s',
            }}
          >
            Outils
            <ChevronDown
              size={13}
              style={{ transition: 'transform 0.2s', transform: outilsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>
          {outilsOpen && <DropdownPanel items={OUTILS_ITEMS} onClose={closeAll} />}
        </div>
      </nav>

      {/* ── RIGHT: Mon compte + hamburger ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>

        {/* Account — desktop */}
        <div className="site-nav-desktop">
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <a
                href="/historique"
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  fontSize: '13px', fontWeight: 600, color: 'var(--color-text)',
                  textDecoration: 'none', padding: '7px 12px', borderRadius: '8px',
                  background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                }}
              >
                <User size={14} />
                Mon compte
              </a>
              <button
                onClick={() => supabase.auth.signOut()}
                title="Déconnexion"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '34px', height: '34px', borderRadius: '8px',
                  background: 'none', border: '1px solid var(--color-border)',
                  cursor: 'pointer', color: 'var(--color-muted)',
                }}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <Link
              href="/auth"
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '13px', fontWeight: 600, color: 'var(--color-text)',
                textDecoration: 'none', padding: '7px 12px', borderRadius: '8px',
                background: 'var(--color-bg)', border: '1px solid var(--color-border)',
              }}
            >
              <User size={14} />
              Mon compte
            </Link>
          )}
        </div>

        {/* Hamburger — mobile */}
        <button
          className="site-nav-mobile"
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

      {/* ── MOBILE MENU (absolute panel) ── */}
      {mobileOpen && (
        <div style={{
          position: 'absolute', top: '56px', left: 0, right: 0,
          background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)',
          padding: '12px 16px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', zIndex: 49,
        }}>
          <p style={{ margin: '0 0 6px', fontSize: '10px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '0 8px' }}>
            Vérifier
          </p>
          {VERIFIER_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={closeAll}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '10px', textDecoration: 'none', color: 'var(--color-text)' }}
            >
              <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)', flexShrink: 0 }}>
                {item.icon}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>{item.label}</p>
                <p style={{ margin: '1px 0 0', fontSize: '11px', color: 'var(--color-muted)' }}>{item.desc}</p>
              </div>
            </a>
          ))}

          <div style={{ height: '1px', background: 'var(--color-border)', margin: '8px 0' }} />

          <p style={{ margin: '0 0 6px', fontSize: '10px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '0 8px' }}>
            Outils
          </p>
          {OUTILS_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={closeAll}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '10px', textDecoration: 'none', color: 'var(--color-text)' }}
            >
              <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)', flexShrink: 0 }}>
                {item.icon}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>{item.label}</p>
                <p style={{ margin: '1px 0 0', fontSize: '11px', color: 'var(--color-muted)' }}>{item.desc}</p>
              </div>
            </a>
          ))}

          <div style={{ height: '1px', background: 'var(--color-border)', margin: '8px 0' }} />

          {user ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <a
                href="/historique"
                onClick={closeAll}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '11px', borderRadius: '10px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', textDecoration: 'none', color: 'var(--color-text)', fontSize: '13px', fontWeight: 600 }}
              >
                <User size={14} />Mon compte
              </a>
              <button
                onClick={() => { supabase.auth.signOut(); closeAll() }}
                style={{ padding: '11px 14px', borderRadius: '10px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', cursor: 'pointer', color: 'var(--color-muted)', fontSize: '12px', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <LogOut size={14} />Déconnexion
              </button>
            </div>
          ) : (
            <a
              href="/auth"
              onClick={closeAll}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '12px', borderRadius: '10px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', textDecoration: 'none', color: 'var(--color-text)', fontSize: '13px', fontWeight: 600 }}
            >
              <User size={14} />Mon compte
            </a>
          )}
        </div>
      )}

      <style>{`
        .site-nav-mobile { display: none !important; }
        @media (max-width: 640px) {
          .site-nav-desktop { display: none !important; }
          .site-nav-mobile { display: flex !important; }
        }
      `}</style>
    </header>
  )
}
