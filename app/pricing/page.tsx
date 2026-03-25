'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Shield, Zap, Gem, Check, X, ArrowRight,
  Mail, ChevronDown, ChevronUp,
} from 'lucide-react'
import SiteHeader from '@/components/SiteHeader'

// ── Types ─────────────────────────────────────────────────────────────────

interface PlanFeature {
  text: string
  ok: boolean
}

interface Plan {
  id: string
  name: string
  price: string
  priceNote: string
  desc: string
  badge: string | null
  featured: boolean
  features: PlanFeature[]
  cta: { label: string; href?: string; action?: 'modal' }
}

// ── Plans data ─────────────────────────────────────────────────────────────

const PLANS: Plan[] = [
  {
    id: 'gratuit',
    name: 'Essentiel',
    price: '0€',
    priceNote: 'Gratuit pour toujours',
    desc: 'Pour vérifier rapidement un artisan',
    badge: null,
    featured: false,
    cta: { label: 'Vérifier maintenant', href: '/recherche' },
    features: [
      { ok: true,  text: 'Recherche par nom / SIRET' },
      { ok: true,  text: 'Score de fiabilité 0–100' },
      { ok: true,  text: 'Statut légal INSEE' },
      { ok: true,  text: 'Certifications RGE ADEME' },
      { ok: false, text: 'Rapport PDF complet' },
      { ok: false, text: 'Analyse de devis par IA' },
      { ok: false, text: 'Alertes BODACC en temps réel' },
      { ok: false, text: 'Carnet de chantier illimité' },
    ],
  },
  {
    id: 'serenite',
    name: 'Pack Sérénité',
    price: '4,90€',
    priceNote: 'Par rapport · Un seul achat · À vie',
    desc: 'Rapport complet + protection complète',
    badge: 'Le plus populaire',
    featured: true,
    cta: { label: 'Obtenir le rapport', href: '/recherche' },
    features: [
      { ok: true,  text: 'Tout ce qui est gratuit' },
      { ok: true,  text: 'Rapport PDF complet de l\'artisan' },
      { ok: true,  text: 'Analyse juridique de votre devis (clauses abusives)' },
      { ok: true,  text: 'Surveillance 6 mois — alertes email automatiques' },
      { ok: true,  text: 'Checklist personnalisée avant de signer' },
      { ok: true,  text: 'Questions à poser à l\'artisan' },
      { ok: true,  text: 'Modèle de contrat pré-rempli' },
      { ok: true,  text: 'Guide recours en cas de litige' },
      { ok: true,  text: 'Partage sécurisé du rapport (30 jours)' },
      { ok: false, text: 'Accès multi-artisans' },
      { ok: false, text: 'Support prioritaire' },
    ],
  },
  {
    id: 'tranquillite',
    name: 'Pack Tranquillité',
    price: 'Bientôt',
    priceNote: 'Pour un suivi complet et illimité',
    desc: 'La solution pour les pros et multi-chantiers',
    badge: null,
    featured: false,
    cta: { label: 'Être notifié', action: 'modal' },
    features: [
      { ok: true, text: 'Tout du Pack Sérénité' },
      { ok: true, text: 'Accès multi-artisans' },
      { ok: true, text: 'Support prioritaire' },
      { ok: true, text: 'Alertes automatiques illimitées' },
      { ok: true, text: 'Exports comptables' },
      { ok: true, text: 'API accès professionnel' },
      { ok: true, text: 'Accompagnement dédié' },
    ],
  },
]

// ── FAQ ────────────────────────────────────────────────────────────────────

const FAQ = [
  {
    q: 'Le Pack Sérénité est-il valable à vie ?',
    r: 'Oui, c\'est un achat unique par rapport. Une fois acheté, vous avez accès à vie au rapport complet et à l\'analyse de devis de l\'artisan concerné. Aucun abonnement, aucun renouvellement.',
  },
  {
    q: 'Pourquoi seulement 4,90€ ?',
    r: 'Nous voulons que la protection soit accessible à tous. 4,90€ par rapport, c\'est moins qu\'un café — et ça peut vous éviter des milliers d\'euros de problèmes.',
  },
  {
    q: 'Mes données de paiement sont-elles sécurisées ?',
    r: 'Les paiements sont traités par Stripe, leader mondial des paiements en ligne. Verifio ne stocke aucune donnée de carte bancaire.',
  },
  {
    q: 'Puis-je utiliser le Pack Sérénité pour plusieurs artisans ?',
    r: 'Le Pack Sérénité est lié à un rapport spécifique. Pour surveiller plusieurs artisans ou gérer plusieurs chantiers, le Pack Tranquillité sera la solution idéale (bientôt disponible).',
  },
  {
    q: 'À quoi sert le carnet de chantier ?',
    r: 'Le carnet de chantier vous permet de centraliser journal, paiements, photos et documents pour chaque chantier. Il inclut une checklist en 4 phases pour ne rien oublier de la signature à la réception.',
  },
]

// ── Notify Modal ───────────────────────────────────────────────────────────

function NotifyModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    console.log('Notify signup:', email)
    setSent(true)
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        zIndex: 300, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '20px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--color-surface)', borderRadius: '24px',
        padding: '40px 36px', maxWidth: '420px', width: '100%',
        boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
        position: 'relative',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-muted)', padding: '4px',
          }}
        >
          <X size={20} strokeWidth={1.5} />
        </button>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: '#f0fdf4', border: '1px solid #86efac',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <Check size={24} color="#16a34a" strokeWidth={2} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 10px' }}>
              C&apos;est noté !
            </h3>
            <p style={{ fontSize: '15px', color: 'var(--color-muted)', lineHeight: 1.6, margin: '0 0 24px' }}>
              On vous préviendra dès que le Pack Tranquillité sera disponible.
            </p>
            <button
              onClick={onClose}
              style={{
                padding: '11px 24px', borderRadius: '12px',
                background: '#1B4332', color: 'white', border: 'none',
                fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              Fermer
            </button>
          </div>
        ) : (
          <>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px',
              background: 'var(--color-accent-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '20px',
            }}>
              <Gem size={22} color="#1B4332" strokeWidth={1.5} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 8px' }}>
              Pack Tranquillité — Bientôt
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-muted)', lineHeight: 1.6, margin: '0 0 28px' }}>
              Laissez votre email et soyez parmi les premiers informés du lancement.
            </p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16} strokeWidth={1.5}
                  style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }}
                />
                <input
                  type="email"
                  required
                  placeholder="votre@email.fr"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 14px 12px 40px',
                    borderRadius: '12px', border: '1.5px solid var(--color-border)',
                    fontSize: '14px', fontFamily: 'var(--font-body)',
                    background: 'var(--color-bg)', color: '#1A1A1A',
                    outline: 'none',
                  }}
                />
              </div>
              <button
                type="submit"
                style={{
                  padding: '13px', borderRadius: '12px',
                  background: '#1B4332', color: 'white', border: 'none',
                  fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                Me prévenir <ArrowRight size={14} strokeWidth={1.5} />
              </button>
              <p style={{ fontSize: '12px', color: 'var(--color-muted)', textAlign: 'center', margin: 0 }}>
                Pas de spam. Désabonnement en un clic.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

// ── FAQ Item ───────────────────────────────────────────────────────────────

function FaqItem({ q, r }: { q: string; r: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: '1px solid var(--color-border)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', gap: '16px', padding: '20px 0',
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-body)', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A1A', lineHeight: 1.4 }}>{q}</span>
        <span style={{ flexShrink: 0, color: 'var(--color-muted)' }}>
          {open
            ? <ChevronUp size={18} strokeWidth={1.5} />
            : <ChevronDown size={18} strokeWidth={1.5} />
          }
        </span>
      </button>
      {open && (
        <p style={{ margin: '0 0 20px', fontSize: '14px', color: 'var(--color-muted)', lineHeight: 1.7 }}>{r}</p>
      )}
    </div>
  )
}

// ── Plan Card ──────────────────────────────────────────────────────────────

function PlanCard({ plan, onNotify }: { plan: Plan; onNotify: () => void }) {
  const PlanIcon = plan.id === 'gratuit' ? Shield : plan.id === 'serenite' ? Zap : Gem

  const isDark = plan.featured
  const bg = isDark ? '#1B4332' : 'var(--color-surface)'
  const border = isDark ? '#1B4332' : 'var(--color-border)'
  const textPrimary = isDark ? '#ffffff' : '#1A1A1A'
  const textMuted = isDark ? 'rgba(255,255,255,0.6)' : 'var(--color-muted)'
  const iconBg = isDark ? 'rgba(255,255,255,0.12)' : 'var(--color-accent-light)'
  const iconColor = isDark ? '#D8F3DC' : '#1B4332'
  const checkBg = isDark ? 'rgba(82,183,136,0.2)' : '#f0fdf4'
  const checkColor = isDark ? '#52B788' : '#16a34a'
  const dividerColor = isDark ? 'rgba(255,255,255,0.12)' : 'var(--color-border)'

  return (
    <div
      style={{
        background: bg,
        border: `2px solid ${border}`,
        borderRadius: '24px',
        padding: '32px 28px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        boxShadow: isDark
          ? '0 20px 60px rgba(27,67,50,0.28)'
          : '0 2px 8px rgba(0,0,0,0.06)',
        transform: isDark ? 'scale(1.04)' : 'none',
      }}
    >
      {/* Badge */}
      {plan.badge && (
        <div style={{
          position: 'absolute', top: '-14px', left: '50%',
          transform: 'translateX(-50%)',
          background: '#52B788', color: 'white',
          borderRadius: '100px', padding: '5px 16px',
          fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap',
        }}>
          {plan.badge}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: iconBg, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <PlanIcon size={18} color={iconColor} strokeWidth={1.5} />
        </div>
        <span style={{ fontSize: '13px', fontWeight: 700, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {plan.name}
        </span>
      </div>

      {/* Price */}
      <div style={{ marginBottom: '6px' }}>
        <span style={{
          fontFamily: 'var(--font-display)', fontWeight: 800,
          fontSize: plan.price === 'Bientôt' ? '32px' : '40px',
          color: textPrimary, lineHeight: 1, letterSpacing: '-0.03em',
        }}>
          {plan.price}
        </span>
      </div>
      <p style={{ fontSize: '13px', color: textMuted, margin: '0 0 6px', lineHeight: 1.4 }}>
        {plan.priceNote}
      </p>
      <p style={{ fontSize: '13px', color: isDark ? 'rgba(255,255,255,0.7)' : '#4A4A4A', margin: '0 0 24px', lineHeight: 1.4 }}>
        {plan.desc}
      </p>

      <hr style={{ border: 'none', borderTop: `1px solid ${dividerColor}`, margin: '0 0 20px' }} />

      {/* Features */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, marginBottom: '28px' }}>
        {plan.features.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '20px', height: '20px', borderRadius: '50%',
              flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: f.ok ? checkBg : 'transparent',
            }}>
              {f.ok
                ? <Check size={11} color={checkColor} strokeWidth={2.5} />
                : <span style={{ display: 'block', width: '10px', height: '1.5px', background: isDark ? 'rgba(255,255,255,0.2)' : '#D1CBC3', borderRadius: '1px' }} />
              }
            </div>
            <span style={{
              fontSize: '13px',
              color: f.ok
                ? (isDark ? 'rgba(255,255,255,0.9)' : '#1A1A1A')
                : (isDark ? 'rgba(255,255,255,0.3)' : '#B0AAA3'),
            }}>
              {f.text}
            </span>
          </div>
        ))}
      </div>

      {/* CTA */}
      {plan.cta.action === 'modal' ? (
        <button
          onClick={onNotify}
          style={{
            padding: '13px 20px', borderRadius: '12px',
            background: 'transparent',
            color: 'var(--color-accent)',
            border: '1.5px solid var(--color-accent)',
            fontSize: '14px', fontWeight: 700, cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#1B4332'; e.currentTarget.style.color = 'white' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-accent)' }}
        >
          {plan.cta.label} <ArrowRight size={14} strokeWidth={1.5} />
        </button>
      ) : (
        <Link
          href={plan.cta.href!}
          style={{
            padding: '13px 20px', borderRadius: '12px',
            textDecoration: 'none', fontFamily: 'var(--font-body)',
            fontSize: '14px', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'all 0.2s',
            ...(isDark
              ? { background: 'white', color: '#1B4332', border: 'none' }
              : { background: 'transparent', color: '#1B4332', border: '1.5px solid #1B4332' }
            ),
          }}
          onMouseEnter={e => {
            if (isDark) { e.currentTarget.style.background = '#f0fdf4' }
            else { e.currentTarget.style.background = '#1B4332'; e.currentTarget.style.color = 'white' }
          }}
          onMouseLeave={e => {
            if (isDark) { e.currentTarget.style.background = 'white' }
            else { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#1B4332' }
          }}
        >
          {plan.cta.label} <ArrowRight size={14} strokeWidth={1.5} />
        </Link>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [showModal, setShowModal] = useState(false)

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <SiteHeader />

      {/* ── Hero ── */}
      <section style={{ background: '#1B4332', padding: '72px 24px 64px', textAlign: 'center' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(216,243,220,0.25)',
            borderRadius: '100px', padding: '7px 16px', marginBottom: '24px',
          }}>
            <Shield size={13} color="#D8F3DC" strokeWidth={1.5} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#D8F3DC', letterSpacing: '0.04em' }}>
              Tarifs simples et transparents
            </span>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: 'clamp(28px, 5vw, 48px)', color: 'white',
            letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 16px',
          }}>
            La protection que vous méritez,<br />
            <span style={{ color: '#74C69D' }}>au prix juste</span>
          </h1>
          <p style={{ fontSize: '16px', color: 'rgba(216,243,220,0.8)', lineHeight: 1.65, margin: 0 }}>
            La vérification est 100&nbsp;% gratuite. Payez uniquement si vous avez besoin de plus.
          </p>
        </div>
      </section>

      {/* ── Cards ── */}
      <section style={{ padding: '64px 24px 80px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div className="pricing-grid">
            {PLANS.map(plan => (
              <PlanCard key={plan.id} plan={plan} onNotify={() => setShowModal(true)} />
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--color-muted)', marginTop: '40px' }}>
            Paiement sécurisé par{' '}
            <span style={{ fontWeight: 700, color: '#1A1A1A' }}>Stripe</span>
            {' '}· Sans abonnement imposé · Données officielles INSEE, ADEME, BODACC
          </p>
        </div>
      </section>

      {/* ── Comparaison rapide ── */}
      <section style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', padding: '64px 24px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(22px, 3vw, 32px)', color: '#1A1A1A', textAlign: 'center', margin: '0 0 40px', letterSpacing: '-0.02em' }}>
            Pourquoi passer au Pack Sérénité ?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', textAlign: 'center' }}>
            {[
              { icon: Shield, title: '1 achat = 1 rapport', desc: 'Pas d\'abonnement. Vous payez une seule fois et accédez à vie au rapport de cet artisan.' },
              { icon: Zap, title: '4,90€ seulement', desc: 'Moins cher qu\'un café, pour éviter des milliers d\'euros de problèmes sur votre chantier.' },
              { icon: Gem, title: 'Données officielles', desc: 'BODACC, INSEE, RGE ADEME — les mêmes sources que les notaires et professionnels.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} style={{ padding: '24px 16px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '14px',
                  background: 'var(--color-accent-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <Icon size={22} color="#1B4332" strokeWidth={1.5} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '16px', color: '#1A1A1A', margin: '0 0 8px' }}>{title}</h3>
                <p style={{ fontSize: '13px', color: 'var(--color-muted)', lineHeight: 1.6, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: '80px 24px', maxWidth: '680px', margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(22px, 3vw, 32px)', color: '#1A1A1A', textAlign: 'center', margin: '0 0 48px', letterSpacing: '-0.02em' }}>
          Questions fréquentes
        </h2>
        {FAQ.map(({ q, r }) => <FaqItem key={q} q={q} r={r} />)}
      </section>

      {/* ── CTA finale ── */}
      <section style={{ background: '#F8F4EF', borderTop: '1px solid var(--color-border)', padding: '64px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '520px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(22px, 3vw, 32px)', color: '#1A1A1A', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
            Commencez gratuitement
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--color-muted)', margin: '0 0 28px', lineHeight: 1.6 }}>
            La vérification de base est gratuite et immédiate. Passez au Pack Sérénité si l&apos;artisan vous convainc.
          </p>
          <Link
            href="/recherche"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: '#1B4332', color: 'white', borderRadius: '12px',
              padding: '14px 28px', fontSize: '15px', fontWeight: 700,
              textDecoration: 'none', fontFamily: 'var(--font-body)',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#2D6A4F')}
            onMouseLeave={e => (e.currentTarget.style.background = '#1B4332')}
          >
            Rechercher un artisan <ArrowRight size={16} strokeWidth={1.5} />
          </Link>
          <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '16px' }}>
            Voir aussi :{' '}
            <Link href="/espace-artisan" style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600 }}>
              offres pour les artisans →
            </Link>
          </p>
        </div>
      </section>

      {/* ── Disclaimer ── */}
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: '12px', color: '#9ca3af', lineHeight: 1.7, maxWidth: '600px', margin: '0 auto' }}>
          Verifio vérifie la solidité juridique des entreprises à partir de données officielles publiques (INSEE, ADEME, BODACC). Ces informations ne constituent pas un conseil juridique et ne garantissent pas la qualité des prestations réalisées.
        </p>
      </div>

      {/* ── Modal ── */}
      {showModal && <NotifyModal onClose={() => setShowModal(false)} />}
    </main>
  )
}
