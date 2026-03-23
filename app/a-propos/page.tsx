'use client'

import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'

export default function AProposPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#F8F4EF' }}>
      <SiteHeader />

      {/* 1. HERO SECTION */}
      <section style={{ background: '#1B4332', padding: '80px 24px 72px', textAlign: 'center' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.12)',
            color: '#D8F3DC',
            fontSize: '12px',
            fontWeight: 700,
            padding: '5px 16px',
            borderRadius: '20px',
            border: '1px solid rgba(216,243,220,0.2)',
            marginBottom: '24px',
          }}>
            Notre mission
          </div>
          <h1 style={{
            fontFamily: 'Bricolage Grotesque, sans-serif',
            fontWeight: 800,
            color: '#fff',
            fontSize: 'clamp(32px, 5vw, 52px)',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            maxWidth: '680px',
            margin: '0 auto 20px',
          }}>
            Nous croyons que vérifier un artisan devrait être accessible à tous
          </h1>
          <p style={{
            color: 'rgba(216,243,220,0.85)',
            fontSize: '17px',
            lineHeight: 1.7,
            maxWidth: '600px',
            margin: '0 auto',
          }}>
            Verifio est né d&apos;un constat simple : 34% des Français ont été victimes d&apos;arnaques sur les chantiers. Nous avons décidé que ça devait changer.
          </p>
        </div>
      </section>

      {/* 2. HISTOIRE SECTION */}
      <section style={{ background: '#fff', padding: '80px 24px' }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '60px',
        }}>
          {/* Left column */}
          <div>
            <p style={{
              fontSize: '11px',
              fontWeight: 800,
              color: '#52B788',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '12px',
              margin: '0 0 12px',
            }}>
              Le problème
            </p>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 800,
              color: '#1B4332',
              marginBottom: '16px',
              margin: '0 0 16px',
            }}>
              Le problème que nous résolvons
            </h2>
            <p style={{ fontSize: '15px', color: '#374151', lineHeight: 1.75, margin: '0 0 14px' }}>
              Chaque année, des milliers de particuliers font confiance à des artisans sans pouvoir les vérifier facilement. Les données existent — INSEE, ADEME, BODACC — mais elles sont éparpillées, techniques et illisibles pour un particulier.
            </p>
            <p style={{ fontSize: '15px', color: '#374151', lineHeight: 1.75, margin: 0 }}>
              Un particulier ne devrait pas avoir besoin d&apos;être juriste ou comptable pour savoir si l&apos;artisan qu&apos;il s&apos;apprête à payer plusieurs milliers d&apos;euros est fiable.
            </p>
          </div>

          {/* Right column */}
          <div>
            <p style={{
              fontSize: '11px',
              fontWeight: 800,
              color: '#52B788',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              margin: '0 0 12px',
            }}>
              Notre réponse
            </p>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 800,
              color: '#1B4332',
              margin: '0 0 16px',
            }}>
              Comment nous aidons
            </h2>
            <p style={{ fontSize: '15px', color: '#374151', lineHeight: 1.75, margin: '0 0 14px' }}>
              Verifio agrège ces données officielles et les transforme en un score de confiance simple, gratuit et accessible à tous en 30 secondes.
            </p>
            <p style={{ fontSize: '15px', color: '#374151', lineHeight: 1.75, margin: 0 }}>
              Nous ne créons pas de données — nous les rendons lisibles. Tout ce que vous voyez sur Verifio vient de sources gouvernementales officielles et est mis à jour quotidiennement.
            </p>
          </div>
        </div>
      </section>

      {/* 3. STATS STRIP */}
      <section style={{ background: '#1B4332', padding: '48px 24px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '60px',
          flexWrap: 'wrap',
        }}>
          {[
            { number: '26 000+', label: "Signalements d'arnaques en 2024" },
            { number: '100%', label: 'Données officielles' },
            { number: '30s', label: 'Pour vérifier un artisan' },
          ].map(({ number, label }) => (
            <div key={number} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '40px',
                fontWeight: 900,
                color: '#fff',
                letterSpacing: '-0.04em',
                lineHeight: 1.1,
              }}>
                {number}
              </div>
              <div style={{
                fontSize: '14px',
                color: 'rgba(216,243,220,0.75)',
                marginTop: '4px',
              }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. VALEURS SECTION */}
      <section style={{ background: '#F8F4EF', padding: '80px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '32px',
            fontWeight: 800,
            color: '#1B4332',
            textAlign: 'center',
            margin: '0 0 8px',
          }}>
            Nos valeurs
          </h2>
          <p style={{
            textAlign: 'center',
            color: '#6B7280',
            fontSize: '15px',
            margin: '0 0 48px',
          }}>
            Les principes qui guident chaque décision
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '20px',
          }}>
            {[
              {
                icon: '🛡️',
                title: 'Données officielles uniquement',
                body: "Jamais de données inventées ou estimées. Tout vient de sources gouvernementales vérifiées : INSEE, ADEME, BODACC.",
              },
              {
                icon: '🎁',
                title: 'Gratuit pour les particuliers',
                body: "La vérification de base sera toujours gratuite. Nous croyons que se protéger ne devrait pas avoir un prix.",
              },
              {
                icon: '🇫🇷',
                title: 'Fait en France',
                body: "Données françaises, équipe française, hébergement européen. Vos données ne quittent jamais l'Europe.",
              },
            ].map(({ icon, title, body }) => (
              <div key={title} style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '28px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}>
                <div style={{ fontSize: '36px', marginBottom: '16px' }}>{icon}</div>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  color: '#1B4332',
                  margin: '0 0 10px',
                }}>
                  {title}
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#6B7280',
                  lineHeight: 1.65,
                  margin: 0,
                }}>
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. SOURCES DE DONNÉES SECTION */}
      <section style={{ background: '#fff', padding: '80px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '32px',
            fontWeight: 800,
            color: '#1B4332',
            textAlign: 'center',
            margin: '0 0 8px',
          }}>
            Nos sources de données
          </h2>
          <p style={{
            textAlign: 'center',
            color: '#6B7280',
            fontSize: '15px',
            margin: '0 0 48px',
          }}>
            Des données officielles, actualisées quotidiennement
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
          }}>
            {[
              {
                badge: '🏛️',
                title: 'INSEE / Sirene',
                desc: 'Statut légal, dirigeants, capital social, forme juridique',
                link: 'data.gouv.fr →',
                href: 'https://data.gouv.fr',
              },
              {
                badge: '🌱',
                title: 'ADEME',
                desc: 'Certifications RGE — Reconnu Garant de l\'Environnement',
                link: 'data.ademe.fr →',
                href: 'https://data.ademe.fr',
              },
              {
                badge: '⚖️',
                title: 'BODACC',
                desc: 'Procédures judiciaires, liquidations, redressements',
                link: 'bodacc.fr →',
                href: 'https://bodacc.fr',
              },
              {
                badge: '🗺️',
                title: 'API Géo',
                desc: 'Données géographiques, communes, départements',
                link: 'geo.api.gouv.fr →',
                href: 'https://geo.api.gouv.fr',
              },
            ].map(({ badge, title, desc, link, href }) => (
              <div key={title} style={{
                background: '#f9fafb',
                border: '1.5px solid #e5e7eb',
                borderRadius: '14px',
                padding: '20px',
              }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>{badge}</div>
                <h3 style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#1B4332',
                  margin: '0 0 8px',
                }}>
                  {title}
                </h3>
                <p style={{
                  fontSize: '13px',
                  color: '#6B7280',
                  lineHeight: 1.55,
                  margin: '0 0 12px',
                }}>
                  {desc}
                </p>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '12px',
                    color: '#52B788',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  {link}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. CTA SECTION */}
      <section style={{ background: '#1B4332', padding: '72px 24px', textAlign: 'center' }}>
        <h2 style={{
          color: '#fff',
          fontSize: '32px',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          margin: '0 0 12px',
        }}>
          Commencez à vous protéger
        </h2>
        <p style={{
          color: 'rgba(216,243,220,0.75)',
          fontSize: '15px',
          margin: '0',
        }}>
          Vérification 100% gratuite · Résultats en 30 secondes · Données officielles
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            background: '#fff',
            color: '#1B4332',
            fontSize: '16px',
            fontWeight: 800,
            padding: '16px 36px',
            borderRadius: '14px',
            border: 'none',
            cursor: 'pointer',
            marginTop: '28px',
            textDecoration: 'none',
          }}
        >
          Vérifier un artisan gratuitement →
        </Link>
      </section>
    </main>
  )
}
