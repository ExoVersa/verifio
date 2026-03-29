'use client'

import { useState } from 'react'
import { Send, CheckCircle2, AlertCircle, Mail, MessageSquare, ShieldCheck } from 'lucide-react'
import SiteHeader from '@/components/SiteHeader'
import { PageHero, PrimaryLink, SectionBadge, SurfaceCard } from '@/components/ExperiencePrimitives'

const SUJETS = [
  'Question générale',
  'Signaler une erreur',
  'Artisan - demande de rectification',
  'Presse',
  'Autre',
]

export default function ContactPage() {
  const [form, setForm] = useState({ nom: '', email: '', sujet: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error || "Erreur lors de l'envoi.")
        setStatus('error')
      } else {
        setStatus('success')
      }
    } catch {
      setErrorMsg('Erreur reseau. Reessayez.')
      setStatus('error')
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '13px 14px',
    borderRadius: '14px',
    border: '1px solid rgba(224,214,199,0.92)',
    background: 'rgba(255,255,255,0.82)',
    fontSize: '15px',
    color: '#14201b',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'var(--font-body)',
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <SiteHeader />

      <PageHero
        badge={<SectionBadge text="Contact et demandes de rectification" tone="green" />}
        title={<>Parlons-nous comme une vraie equipe</>}
        subtitle={<>Chaque message est lu. Pour un signalement ou une demande de rectification, indique le SIRET si tu l&apos;as: cela nous aide a aller beaucoup plus vite.</>}
      >
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {[
            { icon: Mail, label: 'Reponse sous 48 h' },
            { icon: MessageSquare, label: 'Traitement humain' },
            { icon: ShieldCheck, label: 'Demandes sensibles priorisees' },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.label}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  borderRadius: '999px',
                  background: 'rgba(255,255,255,0.62)',
                  border: '1px solid rgba(226,217,204,0.86)',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#153b2e',
                }}
              >
                <Icon size={13} strokeWidth={1.8} />
                {item.label}
              </div>
            )
          })}
        </div>
      </PageHero>

      <section style={{ padding: '0 24px 88px' }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
          <div className="contact-grid" style={{ display: 'grid', gridTemplateColumns: '0.88fr 1.12fr', gap: '20px', alignItems: 'start' }}>
            <SurfaceCard style={{ padding: '28px' }}>
              <SectionBadge text="Comment bien nous ecrire" tone="blue" />
              <h2 style={{ margin: '18px 0 12px', fontSize: '30px' }}>
                Plus ton message est precis,
                <br />
                plus on peut agir vite
              </h2>
              <div style={{ display: 'grid', gap: '14px', marginTop: '20px' }}>
                {[
                  'Pour un artisan: ajoute son nom, son SIRET et le contexte.',
                  'Pour une erreur de fiche: indique ce qui est inexact ou incomplet.',
                  'Pour la presse ou un partenariat: precise ton besoin en une phrase.',
                ].map((point) => (
                  <div key={point} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '999px', background: '#eef8f3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CheckCircle2 size={12} strokeWidth={2.2} color="#15803d" />
                    </div>
                    <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.7, color: '#43524c' }}>{point}</p>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '24px', padding: '18px', borderRadius: '18px', background: '#f6f2eb', border: '1px solid #ece3d7' }}>
                <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 800, letterSpacing: '0.06em', color: '#70807a', textTransform: 'uppercase' }}>
                  Bon a savoir
                </p>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.7, color: '#43524c' }}>
                  Les demandes liees a une fiche publique ou a une rectification sont traitees avec une attention particuliere.
                </p>
              </div>
            </SurfaceCard>

            <SurfaceCard style={{ padding: '28px' }}>
              {status === 'success' ? (
                <div style={{ textAlign: 'center', padding: '24px 8px' }}>
                  <div style={{ width: '70px', height: '70px', borderRadius: '22px', background: '#eef8f3', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                    <CheckCircle2 size={34} color="#15803d" />
                  </div>
                  <h2 style={{ margin: '0 0 8px', fontSize: '30px' }}>Message bien recu</h2>
                  <p style={{ margin: '0 auto 24px', maxWidth: '420px', fontSize: '15px', lineHeight: 1.75, color: '#52615c' }}>
                    Merci. Nous revenons vers toi sous 48 h, souvent plus vite quand le message est documente.
                  </p>
                  <button
                    onClick={() => {
                      setForm({ nom: '', email: '', sujet: '', message: '' })
                      setStatus('idle')
                    }}
                    style={{
                      padding: '13px 18px',
                      borderRadius: '14px',
                      border: '1px solid rgba(224,214,199,0.92)',
                      background: '#fff',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      color: '#14201b',
                    }}
                  >
                    Envoyer un autre message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '18px' }}>
                  <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 700, color: '#14201b' }}>
                        Nom
                      </label>
                      <input
                        type="text"
                        required
                        value={form.nom}
                        onChange={(e) => setForm((prev) => ({ ...prev, nom: e.target.value }))}
                        placeholder="Jean Dupont"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 700, color: '#14201b' }}>
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                        placeholder="jean@exemple.fr"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 700, color: '#14201b' }}>
                      Sujet
                    </label>
                    <select
                      required
                      value={form.sujet}
                      onChange={(e) => setForm((prev) => ({ ...prev, sujet: e.target.value }))}
                      style={{ ...inputStyle, cursor: 'pointer', color: form.sujet ? '#14201b' : '#70807a' }}
                    >
                      <option value="" disabled>Choisir un sujet</option>
                      {SUJETS.map((sujet) => <option key={sujet} value={sujet}>{sujet}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 700, color: '#14201b' }}>
                      Message
                    </label>
                    <textarea
                      required
                      rows={7}
                      maxLength={2000}
                      value={form.message}
                      onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                      placeholder="Explique-nous la situation, le contexte et ce que tu attends."
                      style={{ ...inputStyle, minHeight: '190px', resize: 'vertical', lineHeight: 1.7 }}
                    />
                    <p style={{ margin: '6px 0 0', textAlign: 'right', fontSize: '12px', color: '#70807a' }}>
                      {form.message.length}/2000
                    </p>
                  </div>

                  {status === 'error' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '14px', background: '#fef2f2', border: '1px solid #fecaca' }}>
                      <AlertCircle size={18} color="#dc2626" />
                      <p style={{ margin: 0, fontSize: '14px', color: '#dc2626' }}>{errorMsg}</p>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#70807a' }}>
                      Reponse habituelle sous 48 h.
                    </p>
                    <button
                      type="submit"
                      disabled={status === 'loading'}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '14px 20px',
                        borderRadius: '16px',
                        border: 'none',
                        background: status === 'loading' ? '#7d8c86' : '#153b2e',
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: 800,
                        cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <Send size={15} strokeWidth={1.8} />
                      {status === 'loading' ? 'Envoi en cours...' : 'Envoyer le message'}
                    </button>
                  </div>
                </form>
              )}
            </SurfaceCard>
          </div>
        </div>
      </section>

      <section style={{ padding: '0 24px 88px' }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
          <SurfaceCard style={{ padding: '26px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 800, letterSpacing: '0.06em', color: '#70807a', textTransform: 'uppercase' }}>
                Besoin d&apos;agir tout de suite
              </p>
              <p style={{ margin: 0, fontSize: '15px', color: '#43524c' }}>
                Si ta demande concerne un artisan, tu peux aussi repartir d&apos;une recherche pour partager la bonne fiche.
              </p>
            </div>
            <PrimaryLink href="/recherche">Rechercher un artisan</PrimaryLink>
          </SurfaceCard>
        </div>
      </section>

      <style>{`
        @media (max-width: 900px) {
          .contact-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  )
}
