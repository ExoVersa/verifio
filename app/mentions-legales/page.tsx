import type { Metadata } from 'next'
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import SiteHeader from '@/components/SiteHeader'

export const metadata: Metadata = {
  title: 'Mentions légales | Rien qui cloche',
  description: 'Mentions légales de Rien qui cloche — éditeur, hébergeur, données sources.',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '40px' }}>
      <h2 style={{ margin: '0 0 16px', fontSize: '20px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>{title}</h2>
      <div style={{ fontSize: '15px', color: 'var(--color-muted)', lineHeight: 1.75 }}>
        {children}
      </div>
    </div>
  )
}

export default function MentionsLegalesPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <SiteHeader />

      {/* Hero */}
      <section style={{ background: '#1B4332', padding: '56px 24px 48px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '5px 14px', borderRadius: '20px', marginBottom: '20px', border: '1px solid rgba(216,243,220,0.2)' }}>
            <ShieldCheck size={12} color="#D8F3DC" />
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#D8F3DC' }}>Informations légales</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>
            Mentions légales
          </h1>
          <p style={{ margin: '12px 0 0', fontSize: '15px', color: 'rgba(216,243,220,0.7)', lineHeight: 1.6 }}>
            Conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l&apos;économie numérique.
          </p>
        </div>
      </section>

      {/* Content */}
      <section style={{ padding: '64px 24px', maxWidth: '720px', margin: '0 auto' }}>

        <Section title="1. Éditeur du site">
          <p style={{ margin: '0 0 8px' }}><strong style={{ color: 'var(--color-text)' }}>Raison sociale :</strong> Rien qui cloche</p>
          <p style={{ margin: '0 0 8px' }}><strong style={{ color: 'var(--color-text)' }}>Responsable :</strong> Charlie Couratin</p>
          <p style={{ margin: '0 0 8px' }}><strong style={{ color: 'var(--color-text)' }}>Adresse :</strong> France</p>
          <p style={{ margin: 0 }}><strong style={{ color: 'var(--color-text)' }}>Email :</strong>{' '}
            <a href="mailto:contact@rienquicloche.fr" style={{ color: 'var(--color-accent)' }}>contact@rienquicloche.fr</a>
          </p>
        </Section>

        <Section title="2. Directeur de la publication">
          <p style={{ margin: 0 }}>Charlie Couratin</p>
        </Section>

        <Section title="3. Hébergement">
          <p style={{ margin: '0 0 8px' }}><strong style={{ color: 'var(--color-text)' }}>Société :</strong> Vercel Inc.</p>
          <p style={{ margin: '0 0 8px' }}><strong style={{ color: 'var(--color-text)' }}>Adresse :</strong> 340 Pine Street, Suite 603, San Francisco, CA 94104, États-Unis</p>
          <p style={{ margin: 0 }}><strong style={{ color: 'var(--color-text)' }}>Site :</strong>{' '}
            <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)' }}>vercel.com</a>
          </p>
        </Section>

        <Section title="4. Développement">
          <p style={{ margin: 0 }}>Rien qui cloche — développé avec Next.js (React), TypeScript et Tailwind CSS.</p>
        </Section>

        <Section title="5. Sources des données affichées">
          <p style={{ margin: '0 0 12px' }}>Les informations présentées sur Rien qui cloche sont issues de bases de données publiques et open data :</p>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li style={{ marginBottom: '6px' }}><strong style={{ color: 'var(--color-text)' }}>INSEE — base SIRENE :</strong> données légales des entreprises (SIRET, statut, forme juridique)</li>
            <li style={{ marginBottom: '6px' }}><strong style={{ color: 'var(--color-text)' }}>ADEME — registre RGE :</strong> certifications Reconnu Garant de l&apos;Environnement</li>
            <li style={{ marginBottom: '6px' }}><strong style={{ color: 'var(--color-text)' }}>BODACC :</strong> procédures collectives, redressements et liquidations judiciaires</li>
            <li style={{ marginBottom: '6px' }}><strong style={{ color: 'var(--color-text)' }}>INPI — RNE :</strong> dirigeants et gouvernance des sociétés</li>
          </ul>
          <p style={{ margin: '12px 0 0' }}>Ces données sont fournies à titre informatif. Rien qui cloche ne garantit pas leur exhaustivité ni leur exactitude à 100 % et décline toute responsabilité quant aux décisions prises sur leur base.</p>
        </Section>

        <Section title="6. Propriété intellectuelle">
          <p style={{ margin: 0 }}>Le code source, le design, les textes et les logos de Rien qui cloche sont la propriété exclusive de leurs auteurs. Toute reproduction ou utilisation sans autorisation écrite préalable est interdite.</p>
        </Section>

        <Section title="7. Cookies et données personnelles">
          <p style={{ margin: 0 }}>
            Pour toute information sur la collecte et le traitement de vos données, consultez notre{' '}
            <Link href="/politique-confidentialite" style={{ color: 'var(--color-accent)' }}>Politique de confidentialité</Link>.
          </p>
        </Section>

        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '24px', marginTop: '8px' }}>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)' }}>Dernière mise à jour : mars 2026</p>
        </div>
      </section>
    </main>
  )
}
