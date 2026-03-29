'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Scale, CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react'
import SiteHeader from '@/components/SiteHeader'
import { supabase } from '@/lib/supabase'
import { PageHero, PrimaryLink, SectionBadge, SurfaceCard } from '@/components/ExperiencePrimitives'

export default function AssistantJuridiquePage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)

    try {
      await supabase.from('waitlist').insert({ email, feature: 'juridique' })
    } catch {
      // Table may not exist yet.
    } finally {
      setLoading(false)
      setSubmitted(true)
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <SiteHeader />

      <PageHero
        badge={<SectionBadge text="Assistant juridique en preparation" tone="sand" />}
        title={<>Des reponses juridiques claires, sans langage opaque</>}
        subtitle={<>Cette brique aidera les particuliers a comprendre leurs droits avant signature, pendant le chantier et en cas de litige, avec un ton simple et actionnable.</>}
      >
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {['Droit francais du chantier', 'Reponses pedagogiques', 'Aide avant decision'].map((item) => (
            <div key={item} style={{ padding: '9px 12px', borderRadius: '999px', background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(226,217,204,0.86)', fontSize: '12px', fontWeight: 700, color: '#153b2e' }}>
              {item}
            </div>
          ))}
        </div>
      </PageHero>

      <section style={{ padding: '0 24px 88px' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>
          <div className="juridique-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 0.92fr', gap: '20px', alignItems: 'start' }}>
            <SurfaceCard style={{ padding: '30px' }}>
              <SectionBadge text="Ce que l&apos;assistant aidera a faire" tone="blue" />
              <h2 style={{ margin: '18px 0 12px', fontSize: '30px' }}>
                Comprendre, poser les bonnes questions,
                <br />
                puis agir avec plus de maitrise
              </h2>

              <div style={{ display: 'grid', gap: '14px', marginTop: '20px' }}>
                {[
                  { icon: ShieldCheck, title: 'Avant signature', text: 'Comprendre les clauses sensibles d&apos;un devis et les garanties a demander.' },
                  { icon: Scale, title: 'Pendant le chantier', text: 'Identifier ce qui releve d&apos;un retard, d&apos;un ecart ou d&apos;un vrai manquement.' },
                  { icon: Sparkles, title: 'En cas de tension', text: 'Structurer un recours ou un echange de facon plus claire et plus professionnelle.' },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.title} style={{ display: 'grid', gridTemplateColumns: '42px 1fr', gap: '12px', alignItems: 'start', padding: '14px 0', borderBottom: item.title !== 'En cas de tension' ? '1px solid #efe7dc' : 'none' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: '#eef8f3', color: '#153b2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={18} strokeWidth={1.8} />
                      </div>
                      <div>
                        <h3 style={{ margin: '0 0 6px', fontSize: '18px' }}>{item.title}</h3>
                        <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.7, color: '#43524c' }}>{item.text}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </SurfaceCard>

            <SurfaceCard style={{ padding: '28px' }}>
              {!submitted ? (
                <>
                  <div style={{ width: '52px', height: '52px', borderRadius: '18px', background: '#fff3e8', color: '#b85d1e', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                    <Scale size={24} strokeWidth={1.8} />
                  </div>
                  <h2 style={{ margin: '0 0 10px', fontSize: '28px' }}>Me prevenir des l&apos;ouverture</h2>
                  <p style={{ margin: '0 0 20px', fontSize: '15px', lineHeight: 1.75, color: '#52615c' }}>
                    Tu recevras l&apos;invitation prioritaire quand l&apos;assistant juridique sera pret.
                  </p>
                  <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px' }}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre@email.fr"
                      required
                      style={{ width: '100%', padding: '13px 14px', borderRadius: '14px', border: '1px solid rgba(224,214,199,0.92)', background: 'rgba(255,255,255,0.86)', fontSize: '15px', outline: 'none', color: '#14201b' }}
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      style={{ padding: '14px 18px', borderRadius: '16px', border: 'none', background: loading ? '#7d8c86' : '#153b2e', color: '#fff', fontSize: '14px', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer' }}
                    >
                      {loading ? 'Envoi...' : 'Me notifier'}
                    </button>
                  </form>
                  <p style={{ margin: '12px 0 0', fontSize: '12px', color: '#70807a' }}>
                    Pas de spam. Uniquement le lancement et les nouveautes utiles.
                  </p>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{ width: '66px', height: '66px', borderRadius: '22px', background: '#eef8f3', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                    <CheckCircle2 size={34} color="#15803d" />
                  </div>
                  <h2 style={{ margin: '0 0 8px', fontSize: '28px' }}>C&apos;est note</h2>
                  <p style={{ margin: '0 auto 20px', maxWidth: '320px', fontSize: '15px', lineHeight: 1.7, color: '#52615c' }}>
                    Tu seras informe en priorite des que cette experience sera disponible.
                  </p>
                </div>
              )}

              <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #efe7dc' }}>
                <Link href="/" style={{ color: '#153b2e', textDecoration: 'none', fontSize: '14px', fontWeight: 700 }}>
                  Retour a l&apos;accueil
                </Link>
              </div>
            </SurfaceCard>
          </div>
        </div>
      </section>

      <section style={{ padding: '0 24px 88px' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>
          <SurfaceCard style={{ padding: '28px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 800, letterSpacing: '0.06em', color: '#70807a', textTransform: 'uppercase' }}>
                En attendant
              </p>
              <p style={{ margin: 0, fontSize: '15px', color: '#43524c' }}>
                Tu peux deja verifier un artisan ou analyser un devis avec les briques disponibles aujourd&apos;hui.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <PrimaryLink href="/recherche">Verifier un artisan</PrimaryLink>
              <PrimaryLink href="/analyser-devis" light>Analyser un devis</PrimaryLink>
            </div>
          </SurfaceCard>
        </div>
      </section>

      <style>{`
        @media (max-width: 900px) {
          .juridique-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  )
}
