'use client'

import Link from 'next/link'
import { Database, ShieldCheck, Eye, HeartHandshake, Building2, BadgeCheck, ArrowRight } from 'lucide-react'
import SiteHeader from '@/components/SiteHeader'
import { PageHero, PrimaryLink, SectionBadge, SurfaceCard } from '@/components/ExperiencePrimitives'

export default function AProposPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <SiteHeader />

      <PageHero
        badge={<SectionBadge text="Notre mission" tone="green" />}
        title={<>Verifier un artisan devrait etre simple, lisible et rassurant</>}
        subtitle={<>Verifio est ne d&apos;une conviction tres simple: un particulier ne devrait pas avoir besoin d&apos;etre juriste, comptable ou expert du BTP pour savoir si un artisan inspire confiance.</>}
      >
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {['Donnees officielles', 'Lecture pedagogique', 'Protection accessible'].map((item) => (
            <div key={item} style={{ padding: '9px 12px', borderRadius: '999px', background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(226,217,204,0.86)', fontSize: '12px', fontWeight: 700, color: '#153b2e' }}>
              {item}
            </div>
          ))}
        </div>
      </PageHero>

      <section style={{ padding: '0 24px 88px' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          <div className="about-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <SurfaceCard style={{ padding: '30px' }}>
              <SectionBadge text="Le probleme" tone="sand" />
              <h2 style={{ margin: '18px 0 12px', fontSize: '32px' }}>
                Les donnees existent,
                <br />
                mais elles sont rarement exploitables
              </h2>
              <p style={{ margin: '0 0 14px', fontSize: '15px', lineHeight: 1.8, color: '#43524c' }}>
                INSEE, ADEME, BODACC et d&apos;autres sources publiques contiennent deja beaucoup de verite sur une entreprise.
                Le probleme, c&apos;est leur dispersion, leur technicite et le manque de traduction pour un particulier.
              </p>
              <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.8, color: '#43524c' }}>
                Quand il faut signer un devis ou verser un acompte, ce n&apos;est pas juste une question de data. C&apos;est une question de confiance, de rythme et de clarte.
              </p>
            </SurfaceCard>

            <SurfaceCard style={{ padding: '30px' }}>
              <SectionBadge text="Notre reponse" tone="blue" />
              <h2 style={{ margin: '18px 0 12px', fontSize: '32px' }}>
                Nous transformons des signaux officiels
                <br />
                en aide a la decision
              </h2>
              <p style={{ margin: '0 0 14px', fontSize: '15px', lineHeight: 1.8, color: '#43524c' }}>
                Verifio ne cree pas de donnees. Nous les croisons, les traduisons et les mettons dans un parcours que l&apos;on peut comprendre vite.
              </p>
              <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.8, color: '#43524c' }}>
                L&apos;objectif n&apos;est pas de faire peur ni de vendre de l&apos;anxiete. L&apos;objectif est d&apos;aider chacun a avancer avec plus de maitrise, de recul et de serenite.
              </p>
            </SurfaceCard>
          </div>
        </div>
      </section>

      <section style={{ padding: '0 24px 88px' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          <SurfaceCard style={{ padding: '28px 30px' }}>
            <div className="stats-strip" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px' }}>
              {[
                { value: '26 000+', label: "signalements d'arnaques remontes en 2024" },
                { value: '100 %', label: 'sources officielles et gouvernementales' },
                { value: '30 s', label: 'pour obtenir une premiere lecture' },
                { value: '1', label: 'meme obsession: aider a mieux choisir' },
              ].map((item) => (
                <div key={item.value} style={{ padding: '10px 6px' }}>
                  <div style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#153b2e', lineHeight: 1, marginBottom: '8px' }}>
                    {item.value}
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: '#52615c' }}>{item.label}</p>
                </div>
              ))}
            </div>
          </SurfaceCard>
        </div>
      </section>

      <section style={{ padding: '0 24px 88px' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <SectionBadge text="Nos principes de conception" tone="green" />
            <h2 style={{ margin: '18px 0 10px', fontSize: '40px' }}>Ce que nous voulons proteger</h2>
            <p style={{ margin: '0 auto', maxWidth: '700px', fontSize: '16px', lineHeight: 1.75, color: '#52615c' }}>
              Le temps, l&apos;argent et la tranquillite d&apos;esprit des particuliers, sans sacrifier la nuance ni la verite des donnees.
            </p>
          </div>

          <div className="about-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '18px' }}>
            {[
              { icon: Database, title: 'Verifier avec rigueur', text: 'Uniquement des sources officielles, recoupees et remises a jour regulierement.' },
              { icon: Eye, title: 'Rendre visible ce qui compte', text: 'Pas une avalanche de details. Une lecture claire de ce qui peut faire avancer ou freiner une decision.' },
              { icon: HeartHandshake, title: 'Rester humain dans le ton', text: 'Parce que choisir un artisan touche au foyer, au budget et souvent a une vraie charge mentale.' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <SurfaceCard key={item.title} style={{ padding: '28px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#eef8f3', color: '#153b2e', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    <Icon size={22} strokeWidth={1.8} />
                  </div>
                  <h3 style={{ margin: '0 0 8px', fontSize: '20px' }}>{item.title}</h3>
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.75, color: '#52615c' }}>{item.text}</p>
                </SurfaceCard>
              )
            })}
          </div>
        </div>
      </section>

      <section style={{ padding: '0 24px 88px' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <SectionBadge text="Sources de donnees" tone="blue" />
            <h2 style={{ margin: '18px 0 10px', fontSize: '40px' }}>Nos fondations sont publiques</h2>
            <p style={{ margin: '0 auto', maxWidth: '720px', fontSize: '16px', lineHeight: 1.75, color: '#52615c' }}>
              Verifio s&apos;appuie sur des bases ouvertes et officielles. Nous les rendons simplement lisibles et utiles dans un parcours de decision.
            </p>
          </div>

          <div className="about-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px' }}>
            {[
              { icon: Building2, title: 'INSEE / Sirene', desc: 'Statut legal, forme juridique, identite entreprise', href: 'https://data.gouv.fr' },
              { icon: BadgeCheck, title: 'ADEME', desc: 'Certifications RGE et signaux environnementaux', href: 'https://data.ademe.fr' },
              { icon: ShieldCheck, title: 'BODACC', desc: 'Procedures, annonces et alertes juridiques', href: 'https://bodacc.fr' },
              { icon: Database, title: 'Geo API', desc: 'Communes, territoires et informations geo utiles', href: 'https://geo.api.gouv.fr' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <SurfaceCard key={item.title} style={{ padding: '24px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: '#f6f2eb', color: '#153b2e', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                    <Icon size={20} strokeWidth={1.8} />
                  </div>
                  <h3 style={{ margin: '0 0 8px', fontSize: '18px' }}>{item.title}</h3>
                  <p style={{ margin: '0 0 12px', fontSize: '13px', lineHeight: 1.7, color: '#52615c' }}>{item.desc}</p>
                  <a href={item.href} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', fontWeight: 700, color: '#153b2e', textDecoration: 'none' }}>
                    Voir la source
                  </a>
                </SurfaceCard>
              )
            })}
          </div>
        </div>
      </section>

      <section style={{ padding: '0 24px 96px' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          <SurfaceCard style={{ padding: '34px 32px', background: 'linear-gradient(135deg, #153b2e 0%, #234a3b 100%)', border: '1px solid rgba(21,59,46,0.92)', boxShadow: '0 22px 48px rgba(21,59,46,0.14)' }}>
            <div className="about-cta" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px', alignItems: 'center' }}>
              <div>
                <SectionBadge text="Commencer maintenant" tone="light" />
                <h2 style={{ margin: '18px 0 10px', color: '#fff', fontSize: '40px' }}>
                  La meilleure facon de comprendre Verifio,
                  <br />
                  c&apos;est de tester une verification
                </h2>
                <p style={{ margin: 0, fontSize: '16px', lineHeight: 1.75, color: 'rgba(255,255,255,0.76)' }}>
                  Recherche gratuite, lecture immediate, puis accompagnement plus pousse si tu veux vraiment securiser ton choix.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <PrimaryLink href="/recherche" light>
                  Verifier un artisan
                  <ArrowRight size={15} strokeWidth={1.8} />
                </PrimaryLink>
                <Link href="/contact" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.16)', color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: 700, background: 'rgba(255,255,255,0.08)' }}>
                  Nous contacter
                </Link>
              </div>
            </div>
          </SurfaceCard>
        </div>
      </section>

      <style>{`
        @media (max-width: 980px) {
          .about-grid,
          .about-cards,
          .about-cta,
          .stats-strip {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  )
}
