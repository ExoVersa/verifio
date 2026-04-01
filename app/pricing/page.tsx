'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Shield, Zap, Gem,
  ChevronDown, ChevronUp,
} from 'lucide-react'
import SiteHeader from '@/components/SiteHeader'
import { SectionBadge, SurfaceCard, PrimaryLink } from '@/components/ExperiencePrimitives'
import PricingCards from '@/components/PricingCards'

// ── FAQ ────────────────────────────────────────────────────────────────────

const FAQ = [
  {
    q: 'Le Pack S\u00e9r\u00e9nit\u00e9 est-il valable \u00e0 vie\u00a0?',
    r: 'Oui, c\u2019est un achat unique par rapport. Une fois achet\u00e9, vous avez acc\u00e8s \u00e0 vie au rapport complet et \u00e0 l\u2019analyse de devis de l\u2019artisan concern\u00e9. Aucun abonnement, aucun renouvellement.',
  },
  {
    q: 'Pourquoi seulement 4,90\u00a0\u20ac\u00a0?',
    r: 'Nous voulons que la protection soit accessible \u00e0 tous. 4,90\u00a0\u20ac par rapport, c\u2019est moins qu\u2019un caf\u00e9 \u2014 et \u00e7a peut vous \u00e9viter des milliers d\u2019euros de probl\u00e8mes.',
  },
  {
    q: 'Mes donn\u00e9es de paiement sont-elles s\u00e9curis\u00e9es\u00a0?',
    r: 'Les paiements sont trait\u00e9s par Stripe, leader mondial des paiements en ligne. Verifio ne stocke aucune donn\u00e9e de carte bancaire.',
  },
  {
    q: 'Puis-je utiliser le Pack S\u00e9r\u00e9nit\u00e9 pour plusieurs artisans\u00a0?',
    r: 'Le Pack S\u00e9r\u00e9nit\u00e9 est li\u00e9 \u00e0 un rapport sp\u00e9cifique. Pour surveiller plusieurs artisans ou g\u00e9rer plusieurs chantiers, le Pack Tranquillit\u00e9 sera la solution id\u00e9ale (bient\u00f4t disponible).',
  },
  {
    q: '\u00c0 quoi sert le carnet de chantier\u00a0?',
    r: 'Le carnet de chantier vous permet de centraliser journal, paiements, photos et documents pour chaque chantier. Il inclut une checklist en 4 phases pour ne rien oublier de la signature \u00e0 la r\u00e9ception.',
  },
]

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

// ── Page ───────────────────────────────────────────────────────────────────

export default function PricingPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8f4ee 0%, #f5efe7 34%, #fcfaf7 100%)' }}>
      <SiteHeader />

      {/* ── Cartes pricing ── */}
      <PricingCards style={{ paddingBottom: '56px' }} />

      {/* ── Pourquoi monter en gamme ── */}
      <section style={{ padding: '0 24px 72px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '26px' }}>
            <SectionBadge text="Pourquoi monter en gamme" tone="sand" />
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: 'clamp(22px, 3vw, 32px)', color: '#1A1A1A',
            textAlign: 'center', margin: '0 0 40px', letterSpacing: '-0.02em',
          }}>
            Pourquoi passer au Pack S&#233;r&#233;nit&#233;&nbsp;?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px', textAlign: 'center' }} className="pricing-why-grid">
            {[
              { icon: Shield, title: '1 achat = 1 rapport', desc: "Pas d\u2019abonnement. Vous payez une seule fois et acc\u00e9dez \u00e0 vie au rapport de cet artisan." },
              { icon: Zap, title: '4,90\u00a0\u20ac seulement', desc: "Moins cher qu\u2019un caf\u00e9, pour \u00e9viter des milliers d\u2019euros de probl\u00e8mes sur votre chantier." },
              { icon: Gem, title: 'Donn\u00e9es officielles', desc: "BODACC, INSEE, RGE ADEME \u2014 les m\u00eames sources que les notaires et professionnels." },
            ].map(({ icon: Icon, title, desc }) => (
              <SurfaceCard key={title} style={{ padding: '26px 20px', background: 'linear-gradient(180deg, rgba(255,255,255,0.84) 0%, rgba(248,243,236,0.94) 100%)' }}>
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
              </SurfaceCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: '80px 24px', maxWidth: '680px', margin: '0 auto' }}>
        <SurfaceCard style={{ padding: '30px 30px 14px', background: 'rgba(255,255,255,0.78)' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: 'clamp(22px, 3vw, 32px)', color: '#1A1A1A',
            textAlign: 'center', margin: '0 0 36px', letterSpacing: '-0.02em',
          }}>
            Questions fr&#233;quentes
          </h2>
          {FAQ.map(({ q, r }) => <FaqItem key={q} q={q} r={r} />)}
        </SurfaceCard>
      </section>

      {/* ── CTA finale ── */}
      <section style={{ padding: '0 24px 80px', textAlign: 'center' }}>
        <div style={{ maxWidth: '520px', margin: '0 auto' }}>
          <SurfaceCard style={{ padding: '32px 30px', background: 'linear-gradient(180deg, rgba(255,255,255,0.84) 0%, rgba(244,238,230,0.94) 100%)' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: 'clamp(22px, 3vw, 32px)', color: '#1A1A1A',
              margin: '0 0 12px', letterSpacing: '-0.02em',
            }}>
              Commencez gratuitement
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--color-muted)', margin: '0 0 24px', lineHeight: 1.7 }}>
              La v&#233;rification de base est gratuite et imm&#233;diate. Passez au Pack S&#233;r&#233;nit&#233; si l&apos;artisan vous convainc.
            </p>
            <PrimaryLink href="/recherche">Rechercher un artisan</PrimaryLink>
            <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '16px' }}>
              Voir aussi&nbsp;:{' '}
              <Link href="/espace-artisan" style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600 }}>
                offres pour les artisans &#8594;
              </Link>
            </p>
          </SurfaceCard>
        </div>
      </section>

      {/* ── Disclaimer ── */}
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: '12px', color: '#9ca3af', lineHeight: 1.7, maxWidth: '600px', margin: '0 auto' }}>
          Verifio v&#233;rifie la solidit&#233; juridique des entreprises \u00e0 partir de donn&#233;es officielles publiques (INSEE, ADEME, BODACC). Ces informations ne constituent pas un conseil juridique et ne garantissent pas la qualit&#233; des prestations r&#233;alis&#233;es.
        </p>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .pricing-why-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  )
}
