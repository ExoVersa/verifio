import { redirect } from 'next/navigation'
redirect('/')

import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import { BadgeCheck, FileText, BarChart3, ArrowRight } from 'lucide-react'
import { PageHero, PrimaryLink, SectionBadge, SurfaceCard } from '@/components/ExperiencePrimitives'

export const metadata = {
  title: 'Espace Artisan — Verifio',
  description: 'Rejoignez Verifio, la plateforme qui certifie les artisans honnêtes. Badge de confiance, constructeur de devis pro, tableau de bord visibilité.',
}

export default function EspaceArtisanPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <SiteHeader />

      <PageHero
        dark
        badge={<SectionBadge text="Programme artisans de confiance" tone="light" />}
        title={<>Vous etes un artisan serieux ? Faites-le ressentir des le premier regard.</>}
        subtitle={<>Badge Verifio, espace pro, outils de devis et meilleure lisibilite pour les particuliers qui cherchent un artisan rassurant avant de signer.</>}
      >
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <PrimaryLink href="/espace-artisan/inscription" light>
            Rejoindre Verifio
            <ArrowRight size={15} strokeWidth={1.8} />
          </PrimaryLink>
          <div style={{ padding: '14px 18px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.16)', color: 'rgba(255,255,255,0.82)', fontSize: '13px', fontWeight: 700, background: 'rgba(255,255,255,0.08)' }}>
            14 jours d&apos;essai
          </div>
        </div>
      </PageHero>

      {/* ── BÉNÉFICES ── */}
      <section style={{ padding: '72px 24px', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 className="font-display" style={{
            margin: '0 0 12px', fontSize: 'clamp(24px, 4vw, 36px)',
            fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em',
          }}>
            Ce que vous obtenez
          </h2>
          <p style={{ margin: 0, fontSize: '16px', color: 'var(--color-muted)' }}>
            Tout ce dont un artisan honnête a besoin pour se démarquer.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
        }}>
          {[
            {
              icon: BadgeCheck,
              title: 'Badge de confiance',
              desc: 'Un badge certifié "Artisan Vérifié Verifio" à afficher sur votre site, vos emails et vos devis. Vos clients vérifient avant de signer — soyez celui qu\'ils trouvent.',
              highlight: 'Visible sur Verifio.fr',
            },
            {
              icon: FileText,
              title: 'Constructeur de devis pro',
              desc: 'Créez des devis professionnels en 2 minutes avec toutes les mentions légales obligatoires. Calcul TVA automatique, gestion des acomptes, suivi client.',
              highlight: 'Inclus dans l\'abonnement',
            },
            {
              icon: BarChart3,
              title: 'Tableau de bord visibilité',
              desc: 'Suivez combien de particuliers ont consulté votre fiche. Gérez votre profil, votre description et vos certifications depuis un espace centralisé.',
              highlight: 'Statistiques en temps réel',
            },
          ].map(({ icon: Icon, title, desc, highlight }) => (
            <SurfaceCard
              key={title}
              style={{
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px',
                background: 'rgba(27,67,50,0.08)', border: '1px solid rgba(27,67,50,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#153b2e',
              }}>
                <Icon size={24} strokeWidth={1.8} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: 700, color: 'var(--color-text)' }}>
                  {title}
                </h3>
                <p style={{ margin: '0 0 12px', fontSize: '14px', color: 'var(--color-muted)', lineHeight: 1.65 }}>
                  {desc}
                </p>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  fontSize: '12px', fontWeight: 700, color: '#1B4332',
                  background: 'rgba(27,67,50,0.08)', padding: '4px 10px', borderRadius: '100px',
                }}>
                  ✓ {highlight}
                </span>
              </div>
            </SurfaceCard>
          ))}
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ── */}
      <section style={{
        padding: '72px 24px',
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 className="font-display" style={{
              margin: '0 0 12px', fontSize: 'clamp(24px, 4vw, 36px)',
              fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em',
            }}>
              Comment ça marche ?
            </h2>
            <p style={{ margin: 0, fontSize: '16px', color: 'var(--color-muted)' }}>
              Validation manuelle pour garantir la qualité.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {[
              {
                num: '1',
                title: 'Vous remplissez le formulaire',
                desc: 'SIRET, informations entreprise, justificatif d\'identité ou Kbis de moins de 3 mois. Prend moins de 5 minutes.',
              },
              {
                num: '2',
                title: 'Notre équipe vérifie votre dossier',
                desc: 'Nous contrôlons votre existence légale, votre activité et vos documents. Réponse sous 24h ouvrées.',
              },
              {
                num: '3',
                title: 'Votre espace est activé',
                desc: 'Vous recevez un email de confirmation avec l\'accès à votre dashboard, votre badge et votre outil de devis.',
              },
              {
                num: '4',
                title: 'Vous gagnez en visibilité',
                desc: 'Votre fiche est mise en avant sur Verifio. Les particuliers qui recherchent votre SIRET voient votre badge de confiance.',
              },
            ].map(({ num, title, desc }, i, arr) => (
              <div key={num} style={{ display: 'flex', gap: '20px', paddingBottom: i < arr.length - 1 ? '32px' : '0', position: 'relative' }}>
                {/* Vertical line */}
                {i < arr.length - 1 && (
                  <div style={{
                    position: 'absolute',
                    left: '19px', top: '44px', bottom: '0',
                    width: '2px', background: 'var(--color-border)',
                  }} />
                )}
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: '#1B4332', color: '#D8F3DC',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontWeight: 800, flexShrink: 0, zIndex: 1,
                }}>
                  {num}
                </div>
                <div style={{ paddingTop: '8px' }}>
                  <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>
                    {title}
                  </h3>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-muted)', lineHeight: 1.65 }}>
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section style={{ padding: '72px 24px', maxWidth: '560px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          background: 'var(--color-surface)',
          border: '2px solid #1B4332',
          borderRadius: '24px',
          padding: '40px 32px',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: '#1B4332', color: '#D8F3DC',
            borderRadius: '100px', padding: '5px 14px', marginBottom: '20px',
            fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            ✓ Offre lancement
          </div>

          <h2 className="font-display" style={{
            margin: '0 0 8px', fontSize: '32px', fontWeight: 900,
            color: 'var(--color-text)', letterSpacing: '-0.02em',
          }}>
            14 jours gratuits
          </h2>
          <p style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 700, color: 'var(--color-text)' }}>
            puis <span style={{ color: '#1B4332' }}>29€/mois</span>
          </p>
          <p style={{ margin: '0 0 32px', fontSize: '13px', color: 'var(--color-muted)' }}>
            Sans engagement — Résiliation en 1 clic
          </p>

          <div style={{ textAlign: 'left', marginBottom: '32px' }}>
            {[
              'Badge "Artisan Vérifié Verifio" sur votre fiche publique',
              'Constructeur de devis professionnel illimité',
              'Tableau de bord statistiques de visibilité',
              'Fiche entreprise enrichie (description, photo)',
              'Code HTML badge à intégrer sur votre site',
              'Support prioritaire par email',
              'Accès à toutes les nouvelles fonctionnalités',
            ].map((feature) => (
              <div key={feature} style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                padding: '8px 0',
                borderBottom: '1px solid var(--color-border)',
              }}>
                <span style={{ color: '#1B4332', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>✓</span>
                <span style={{ fontSize: '14px', color: 'var(--color-text)', lineHeight: 1.5 }}>{feature}</span>
              </div>
            ))}
          </div>

          <Link
            href="/espace-artisan/inscription"
            style={{
              display: 'block', width: '100%', padding: '15px 24px',
              background: '#1B4332', color: '#fff',
              borderRadius: '12px', fontSize: '15px', fontWeight: 700,
              textDecoration: 'none', textAlign: 'center',
              boxShadow: '0 4px 16px rgba(27,67,50,0.25)',
            }}
          >
            Commencer l&apos;essai gratuit →
          </Link>

          <p style={{ margin: '12px 0 0', fontSize: '12px', color: 'var(--color-muted)' }}>
            Carte bancaire non requise pendant l&apos;essai
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{
        padding: '72px 24px',
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
      }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 className="font-display" style={{
              margin: '0 0 12px', fontSize: 'clamp(24px, 4vw, 36px)',
              fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em',
            }}>
              Questions fréquentes
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              {
                q: 'Qui peut rejoindre Verifio ?',
                a: 'Tout artisan immatriculé au RCS ou au RNCS avec un SIRET valide. Nous vérifions que votre entreprise est active et que votre activité correspond aux travaux déclarés. Auto-entrepreneurs bienvenus.',
              },
              {
                q: 'Comment se passe la vérification de mon dossier ?',
                a: 'Nous contrôlons votre SIRET auprès des bases officielles INSEE, puis nous vérifions votre justificatif (Kbis ou pièce d\'identité). Notre équipe traite chaque dossier manuellement sous 24h ouvrées.',
              },
              {
                q: 'Puis-je résilier à tout moment ?',
                a: 'Oui, sans préavis ni pénalité. Votre badge reste actif jusqu\'à la fin de la période en cours. Aucune reconduction automatique sans votre accord explicite.',
              },
            ].map(({ q, a }) => (
              <div
                key={q}
                style={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '16px',
                  padding: '24px',
                }}
              >
                <h3 style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: 700, color: 'var(--color-text)' }}>
                  {q}
                </h3>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-muted)', lineHeight: 1.65 }}>
                  {a}
                </p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <p style={{ margin: '0 0 16px', fontSize: '14px', color: 'var(--color-muted)' }}>
              Une autre question ? Écrivez-nous.
            </p>
            <a
              href="mailto:contact@verifio.fr"
              style={{
                fontSize: '14px', fontWeight: 600, color: '#1B4332',
                textDecoration: 'none',
              }}
            >
              contact@verifio.fr →
            </a>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{
        padding: '72px 24px',
        textAlign: 'center',
        background: '#1B4332',
      }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <h2 className="font-display" style={{
            margin: '0 0 16px', fontSize: 'clamp(24px, 4vw, 36px)',
            fontWeight: 900, color: '#fff', letterSpacing: '-0.02em',
          }}>
            Prêt à rejoindre les artisans certifiés ?
          </h2>
          <p style={{ margin: '0 0 32px', fontSize: '16px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
            14 jours gratuits, aucune carte bancaire requise.
          </p>
          <Link
            href="/espace-artisan/inscription"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: '#fff', color: '#1B4332',
              padding: '16px 32px', borderRadius: '14px',
              fontSize: '16px', fontWeight: 800,
              textDecoration: 'none',
            }}
          >
            Créer mon dossier gratuit →
          </Link>
        </div>
      </section>
    </main>
  )
}
