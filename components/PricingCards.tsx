'use client'

import Link from 'next/link'
import { Shield, Zap, Sparkles, Diamond } from 'lucide-react'

// ── SVG helpers ──────────────────────────────────────────────────────────

function CheckIcon({ stroke }: { stroke: string }) {
  return (
    <svg width="9" height="7" viewBox="0 0 9 7" fill="none" aria-hidden="true">
      <polyline points="1 3.5 3.5 6 8 1" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DashIcon({ stroke }: { stroke: string }) {
  return (
    <svg width="8" height="2" viewBox="0 0 8 2" fill="none" aria-hidden="true">
      <line x1="0" y1="1" x2="8" y2="1" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

// ── PricingCards ─────────────────────────────────────────────────────────

interface PricingCardsProps {
  style?: React.CSSProperties
}

export default function PricingCards({ style }: PricingCardsProps) {
  return (
    <section style={{ padding: '80px 24px', ...style }}>
      <div style={{ maxWidth: '1040px', margin: '0 auto' }}>

        {/* En-tête */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '7px',
            padding: '6px 14px', borderRadius: '999px',
            background: 'rgba(21,59,46,0.07)', border: '1px solid rgba(21,59,46,0.12)',
            color: 'var(--color-accent)', fontSize: '11px', fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '20px',
          }}>
            <Diamond size={14} strokeWidth={1.5} />
            TARIFICATION LISIBLE
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: 'clamp(28px, 4vw, 42px)', color: 'var(--color-text-primary)',
            margin: '0 0 16px', letterSpacing: '-0.025em', lineHeight: 1.15,
          }}>
            Gratuit pour sentir le terrain,<br />
            complet quand tu veux vraiment&nbsp;s&#233;curiser
          </h2>
          <p style={{
            maxWidth: '600px', margin: '0 auto',
            fontSize: '17px', lineHeight: 1.7, color: 'var(--color-text-secondary)',
          }}>
            Pas d&apos;abonnement forc&#233;, pas de complexit&#233; inutile. Tu commences gratuitement,
            puis tu actives le niveau d&apos;accompagnement adapt&#233; &#224; ton chantier.
          </p>
        </div>

        {/* Grille 3 cartes */}
        <div className="pricing-cards-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: '16px',
        }}>

          {/* ── Essentiel ── */}
          <div style={{
            borderRadius: '20px',
            background: 'var(--color-surface)',
            border: '0.5px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{ padding: '1.5rem 1.5rem 1.25rem' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: '#EAF3DE',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '14px',
              }}>
                <Shield size={18} strokeWidth={1.5} color="#3B6D11" />
              </div>
              <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: '12px' }}>
                Essentiel
              </div>
              <div style={{ fontSize: 40, fontWeight: 500, lineHeight: 1, color: 'var(--color-text)', marginBottom: '6px' }}>
                0 &#8364;
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: '10px' }}>
                Gratuit pour toujours
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.55 }}>
                Pour v&#233;rifier rapidement avant de rappeler un artisan.
              </div>
            </div>
            <div style={{ height: '0.5px', background: 'var(--color-border)', margin: '0 1.5rem' }} />
            <div style={{ padding: '1.25rem 1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {([
                [true,  'Recherche par nom ou SIRET'],
                [true,  'Score de fiabilit\u00e9 0\u2013100'],
                [true,  'Statut l\u00e9gal INSEE'],
                [true,  'Certifications RGE ADEME'],
                [true,  '1 analyse de devis / mois'],
                [false, 'Rapport PDF complet'],
                [false, 'Analyse devis illimit\u00e9e'],
                [false, 'Surveillance 6 mois'],
                [false, 'Carnet de chantier'],
              ] as [boolean, string][]).map(([ok, text], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                    background: ok ? '#EAF3DE' : 'var(--color-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {ok ? <CheckIcon stroke="#3B6D11" /> : <DashIcon stroke="var(--color-muted)" />}
                  </div>
                  <span style={{ fontSize: 13, color: ok ? 'var(--color-text)' : 'var(--color-muted)' }}>
                    {text}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ padding: '0 1.5rem 1.5rem' }}>
              <Link href="/recherche" style={{
                display: 'block', width: '100%', padding: '12px',
                borderRadius: '12px', fontSize: 14, fontWeight: 500,
                background: 'var(--color-bg)', border: '0.5px solid var(--color-border)',
                color: 'var(--color-text)', textDecoration: 'none',
                textAlign: 'center', boxSizing: 'border-box',
                fontFamily: 'var(--font-body)',
              }}>
                V&#233;rifier maintenant &#8594;
              </Link>
            </div>
          </div>

          {/* ── Pack Sérénité ── */}
          <div style={{
            borderRadius: '20px',
            background: '#1B4332',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: '-1px', left: '50%',
              transform: 'translateX(-50%)',
              background: '#2DB56E', color: '#fff',
              fontSize: 11, fontWeight: 500,
              padding: '4px 14px',
              borderRadius: '0 0 10px 10px',
              whiteSpace: 'nowrap',
            }}>
              Le plus choisi
            </div>
            <div style={{ padding: '2.25rem 1.5rem 1.25rem' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '14px',
              }}>
                <Zap size={18} strokeWidth={1.5} color="rgba(255,255,255,0.9)" />
              </div>
              <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: '12px' }}>
                Pack S&#233;r&#233;nit&#233;
              </div>
              <div style={{ fontSize: 40, fontWeight: 500, lineHeight: 1, color: '#fff', marginBottom: '6px' }}>
                4,90 &#8364;
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: '10px' }}>
                Par rapport &#183; Un seul achat &#183; &#192; vie
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.55 }}>
                Pour signer en confiance et suivre votre chantier sereinement.
              </div>
            </div>
            <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.1)', margin: '0 1.5rem' }} />
            <div style={{ padding: '1.25rem 1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                'Tout ce qui est gratuit',
                'Rapport PDF complet',
                'Analyse compl\u00e8te du devis (prix + juridique)',
                'Historique BODACC complet',
                'Synth\u00e8se IA de l\u2019artisan',
                'Surveillance 6 mois \u2014 alertes email',
                'Carnet de chantier illimit\u00e9',
                'Mod\u00e8le de contrat pr\u00e9-rempli',
                'Guide recours en cas de litige',
                'Partage s\u00e9curis\u00e9 30 jours',
              ].map((text, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(255,255,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <CheckIcon stroke="rgba(255,255,255,0.9)" />
                  </div>
                  <span style={{ fontSize: 13, color: '#fff' }}>{text}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: '0 1.5rem 1.5rem' }}>
              <Link href="/recherche" style={{
                display: 'block', width: '100%', padding: '12px',
                borderRadius: '12px', fontSize: 14, fontWeight: 500,
                background: '#fff', color: '#1B4332', border: 'none',
                textDecoration: 'none', textAlign: 'center', boxSizing: 'border-box',
                fontFamily: 'var(--font-body)',
              }}>
                Obtenir le rapport &#8594;
              </Link>
            </div>
          </div>

          {/* ── Pack Tranquillité ── */}
          <div style={{
            borderRadius: '20px',
            background: 'var(--color-surface)',
            border: '0.5px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            opacity: 0.75,
          }}>
            <div style={{ padding: '1.5rem 1.5rem 1.25rem' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: '#EEEDFE',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '14px',
              }}>
                <Sparkles size={18} strokeWidth={1.5} color="#534AB7" />
              </div>
              <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: '12px' }}>
                Pack Tranquillit&#233;
              </div>
              <div style={{ fontSize: 28, fontWeight: 500, lineHeight: 1, color: 'var(--color-muted)', marginBottom: '6px' }}>
                Bient&#244;t
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: '10px' }}>
                Pour les multi-chantiers et les pros
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.55 }}>
                Acc&#232;s illimit&#233; &#224; tous les artisans, sans compter.
              </div>
            </div>
            <div style={{ height: '0.5px', background: 'var(--color-border)', margin: '0 1.5rem' }} />
            <div style={{ padding: '1.25rem 1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                'Tout du Pack S\u00e9r\u00e9nit\u00e9',
                'Rapports illimit\u00e9s tous artisans',
                'Surveillances illimit\u00e9es',
                'Support prioritaire',
              ].map((text, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                    background: '#EEEDFE',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <CheckIcon stroke="#534AB7" />
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>{text}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: '0 1.5rem 1.5rem' }}>
              <a href="mailto:hello@verifio.fr" style={{
                display: 'block', width: '100%', padding: '12px',
                borderRadius: '12px', fontSize: 14, fontWeight: 500,
                background: 'var(--color-bg)', border: '0.5px solid var(--color-border)',
                color: 'var(--color-text)', textDecoration: 'none',
                textAlign: 'center', boxSizing: 'border-box',
                fontFamily: 'var(--font-body)',
              }}>
                &#202;tre notifi&#233; &#8594;
              </a>
            </div>
          </div>

        </div>

        <style>{`
          @media (max-width: 768px) {
            .pricing-cards-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    </section>
  )
}
