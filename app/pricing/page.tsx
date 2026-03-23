'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, X, Zap, Shield, Infinity } from 'lucide-react'
import SiteHeader from '@/components/SiteHeader'

export default function PricingPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  async function startCheckout(plan: 'serenite' | 'tranquillite') {
    setLoadingPlan(plan)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      alert('Erreur lors de la connexion à Stripe. Réessayez.')
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <SiteHeader />

      {/* Hero */}
      <section style={{ background: '#1B4332', padding: '64px 24px 56px', textAlign: 'center' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '5px 14px', borderRadius: '20px', marginBottom: '20px', border: '1px solid rgba(216,243,220,0.2)' }}>
            <Shield size={12} color="#D8F3DC" />
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#D8F3DC' }}>Tarifs simples et transparents</span>
          </div>
          <h1 style={{ margin: '0 0 16px', fontSize: 'clamp(30px, 5vw, 48px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            La protection que vous méritez,<br />
            <span style={{ color: '#74C69D' }}>au prix juste</span>
          </h1>
          <p style={{ margin: 0, fontSize: '16px', color: 'rgba(216,243,220,0.8)', lineHeight: 1.65 }}>
            La vérification est 100&nbsp;% gratuite. Payez uniquement si vous avez besoin de plus.
          </p>
        </div>
      </section>

      {/* Pricing cards */}
      <section style={{ padding: '64px 24px 80px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', alignItems: 'stretch' }}>

          {/* ── Essentiel (Gratuit) ── */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '24px', padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: '0' }}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={16} color="#16a34a" />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Essentiel</span>
              </div>
              <p style={{ margin: '0 0 4px', fontSize: '44px', fontWeight: 900, color: 'var(--color-text)', letterSpacing: '-0.04em', lineHeight: 1 }}>Gratuit</p>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)' }}>Pour toujours · Sans inscription</p>
            </div>

            <ul style={{ margin: '0 0 28px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', flexGrow: 1 }}>
              {[
                'Score de confiance /100',
                'Statut légal INSEE & BODACC',
                'Certifications RGE ADEME',
                'Dirigeants & capital social',
                'Synthèse IA personnalisée',
                'Checklist documents légaux',
                '1 artisan surveillé',
              ].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--color-text)' }}>
                  <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink: 0 }} />
                  {f}
                </li>
              ))}
              {[
                'Analyse de devis IA',
                'Rapport complet artisan',
                'Surveillance illimitée',
              ].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--color-muted)' }}>
                  <X size={16} color="var(--color-muted)" style={{ flexShrink: 0 }} />
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              style={{ padding: '13px', borderRadius: '12px', border: '1.5px solid var(--color-border)', background: 'var(--color-bg)', fontSize: '14px', fontWeight: 700, cursor: 'pointer', color: 'var(--color-text)', fontFamily: 'var(--font-body)', marginTop: 'auto' }}
            >
              Vérifier maintenant →
            </button>
          </div>

          {/* ── Pack Sérénité ── */}
          <div style={{ background: '#1B4332', borderRadius: '24px', padding: '32px 28px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', transform: 'scale(1.03)', transformOrigin: 'center top', zIndex: 1 }}>
            <div style={{ position: 'absolute', top: '16px', right: '16px', background: '#52B788', color: '#fff', fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '20px', letterSpacing: '0.04em' }}>
              LE PLUS POPULAIRE
            </div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={16} color="#D8F3DC" />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#74C69D', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pack Sérénité</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '4px' }}>
                <p style={{ margin: 0, fontSize: '44px', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>19,90&nbsp;€</p>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#74C69D' }}>Achat unique par chantier · À vie</p>
            </div>

            <ul style={{ margin: '0 0 28px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', flexGrow: 1 }}>
              {[
                'Tout l\'Essentiel inclus',
                'Analyse IA de votre devis PDF',
                'Rapport complet artisan',
                'Surveillance 6 mois de l\'artisan',
                'Clauses abusives détectées',
                'Mentions légales vérifiées',
                'Rapport téléchargeable',
              ].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#D8F3DC' }}>
                  <CheckCircle2 size={16} color="#52B788" style={{ flexShrink: 0 }} />
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => startCheckout('serenite')}
              disabled={loadingPlan === 'serenite'}
              style={{ padding: '14px', borderRadius: '12px', border: 'none', background: '#52B788', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', marginTop: 'auto', opacity: loadingPlan === 'serenite' ? 0.7 : 1 }}
            >
              {loadingPlan === 'serenite' ? 'Redirection…' : 'Activer le Pack Sérénité →'}
            </button>
          </div>

          {/* ── Tranquillité ── */}
          <div style={{ background: 'var(--color-surface)', border: '2px solid var(--color-accent)', borderRadius: '24px', padding: '32px 28px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--color-accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Infinity size={16} color="var(--color-accent)" />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tranquillité</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '4px' }}>
                <p style={{ margin: 0, fontSize: '44px', fontWeight: 900, color: 'var(--color-text)', letterSpacing: '-0.04em', lineHeight: 1 }}>4,90&nbsp;€</p>
                <span style={{ fontSize: '15px', color: 'var(--color-muted)' }}>/mois</span>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)' }}>Sans engagement · Résiliable à tout moment</p>
            </div>

            <ul style={{ margin: '0 0 28px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', flexGrow: 1 }}>
              {[
                'Tout le Pack Sérénité inclus',
                'Analyses de devis illimitées',
                'Surveillance illimitée d\'artisans',
                'Alertes SMS (bientôt)',
                'Export PDF du carnet de chantier',
                'Historique complet',
                'Support prioritaire',
              ].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--color-text)' }}>
                  <CheckCircle2 size={16} color="var(--color-accent)" style={{ flexShrink: 0 }} />
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => startCheckout('tranquillite')}
              disabled={loadingPlan === 'tranquillite'}
              style={{ padding: '14px', borderRadius: '12px', border: 'none', background: 'var(--color-accent)', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', marginTop: 'auto', opacity: loadingPlan === 'tranquillite' ? 0.7 : 1 }}
            >
              {loadingPlan === 'tranquillite' ? 'Redirection…' : 'Commencer l\'abonnement →'}
            </button>
          </div>
        </div>

        {/* Pro link */}
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <Link href="/pricing-pro" style={{ fontSize: '14px', color: 'var(--color-muted)', textDecoration: 'none', borderBottom: '1px dashed var(--color-border)' }}>
            Voir les offres professionnelles (artisans) →
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '0 24px 80px', maxWidth: '680px', margin: '0 auto' }}>
        <h2 style={{ margin: '0 0 32px', fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', textAlign: 'center' }}>Questions fréquentes</h2>
        {[
          { q: 'Le Pack Sérénité est-il valable à vie ?', r: 'Oui, c\'est un achat unique par chantier. Une fois acheté, vous avez accès à vie à l\'analyse de votre devis et au rapport complet de l\'artisan concerné.' },
          { q: 'Puis-je résilier l\'abonnement Tranquillité ?', r: 'Oui, à tout moment et sans frais. La résiliation prend effet à la fin de la période payée en cours.' },
          { q: 'Mes données de paiement sont-elles sécurisées ?', r: 'Les paiements sont traités par Stripe, leader mondial des paiements en ligne. Verifio ne stocke aucune donnée de carte bancaire.' },
          { q: 'Puis-je utiliser le Pack Sérénité pour plusieurs artisans ?', r: 'Le Pack Sérénité est lié à un chantier spécifique. Pour plusieurs artisans ou chantiers, l\'abonnement Tranquillité est plus adapté.' },
        ].map(({ q, r }) => (
          <div key={q} style={{ padding: '20px 0', borderBottom: '1px solid var(--color-border)' }}>
            <p style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 700, color: 'var(--color-text)' }}>{q}</p>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-muted)', lineHeight: 1.65 }}>{r}</p>
          </div>
        ))}
      </section>
    </main>
  )
}
