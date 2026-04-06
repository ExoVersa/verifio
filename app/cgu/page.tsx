import type { Metadata } from 'next'
import Link from 'next/link'
import { Scale } from 'lucide-react'
import SiteHeader from '@/components/SiteHeader'

export const metadata: Metadata = {
  title: 'CGU — Conditions Générales d\'Utilisation | Rien qui cloche',
  description: 'Conditions générales d\'utilisation de la plateforme Rien qui cloche.',
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

export default function CguPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <SiteHeader />

      {/* Hero */}
      <section style={{ background: '#1B4332', padding: '56px 24px 48px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '5px 14px', borderRadius: '20px', marginBottom: '20px', border: '1px solid rgba(216,243,220,0.2)' }}>
            <Scale size={12} color="#D8F3DC" />
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#D8F3DC' }}>Conditions d&apos;utilisation</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>
            Conditions Générales d&apos;Utilisation
          </h1>
          <p style={{ margin: '12px 0 0', fontSize: '15px', color: 'rgba(216,243,220,0.7)', lineHeight: 1.6 }}>
            En utilisant Rien qui cloche, vous acceptez les présentes conditions.
          </p>
        </div>
      </section>

      {/* Content */}
      <section style={{ padding: '64px 24px', maxWidth: '720px', margin: '0 auto' }}>

        <Section title="1. Objet">
          <p style={{ margin: 0 }}>
            Rien qui cloche est une plateforme numérique permettant aux particuliers de vérifier la fiabilité d&apos;artisans du bâtiment avant de signer un devis ou un contrat. Elle agrège et présente des données issues de sources officielles publiques (INSEE, ADEME, BODACC, INPI).
          </p>
        </Section>

        <Section title="2. Accès au service">
          <p style={{ margin: '0 0 8px' }}>
            L&apos;accès à Rien qui cloche est <strong style={{ color: 'var(--color-text)' }}>gratuit pour les particuliers</strong> pour les fonctionnalités de base (recherche, vérification, score de confiance).
          </p>
          <p style={{ margin: 0 }}>
            Certaines fonctionnalités avancées (surveillance, rapport complet IA, comparaison multiple) nécessitent la création d&apos;un compte. L&apos;inscription est gratuite.
          </p>
        </Section>

        <Section title="3. Exactitude des données">
          <p style={{ margin: '0 0 8px' }}>
            Les données affichées sur Rien qui cloche sont issues de bases de données officielles de l&apos;État français. Elles sont récupérées en temps réel ou mises à jour régulièrement.
          </p>
          <p style={{ margin: '0 0 8px' }}>
            Cependant, <strong style={{ color: 'var(--color-text)' }}>Rien qui cloche ne garantit pas l&apos;exactitude, l&apos;exhaustivité ou la mise à jour à 100 % des informations présentées.</strong> Les bases de données sources peuvent contenir des délais de mise à jour ou des erreurs.
          </p>
          <p style={{ margin: 0 }}>
            En cas d&apos;erreur constatée, vous pouvez nous contacter via le formulaire de <Link href="/contact" style={{ color: 'var(--color-accent)' }}>contact</Link> avec la mention &quot;Demande de rectification&quot;.
          </p>
        </Section>

        <Section title="4. Limitation de responsabilité">
          <p style={{ margin: '0 0 8px' }}>
            Rien qui cloche est un outil d&apos;aide à la décision, <strong style={{ color: 'var(--color-text)' }}>non un conseil juridique ou professionnel.</strong>
          </p>
          <p style={{ margin: '0 0 8px' }}>
            Rien qui cloche ne saurait être tenu responsable des décisions prises par les utilisateurs sur la base des informations affichées, ni des préjudices directs ou indirects qui pourraient en résulter.
          </p>
          <p style={{ margin: 0 }}>
            L&apos;utilisateur reste seul responsable de ses choix contractuels avec les artisans.
          </p>
        </Section>

        <Section title="5. Usages interdits">
          <p style={{ margin: '0 0 12px' }}>Il est strictement interdit d&apos;utiliser Rien qui cloche pour :</p>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li style={{ marginBottom: '6px' }}>La prospection commerciale ou le démarchage d&apos;artisans à partir des données affichées</li>
            <li style={{ marginBottom: '6px' }}>La collecte automatisée de données (scraping, bots) sans autorisation écrite préalable</li>
            <li style={{ marginBottom: '6px' }}>Toute utilisation contraire à la législation française en vigueur</li>
            <li style={{ marginBottom: '6px' }}>La revente ou la redistribution des données issues de la plateforme</li>
            <li>Toute atteinte aux droits de propriété intellectuelle de Rien qui cloche</li>
          </ul>
        </Section>

        <Section title="6. Comptes utilisateurs">
          <p style={{ margin: '0 0 8px' }}>
            Chaque utilisateur est responsable de la confidentialité de ses identifiants de connexion. Tout accès non autorisé au compte doit être signalé immédiatement à <a href="mailto:contact@rienquicloche.fr" style={{ color: 'var(--color-accent)' }}>contact@rienquicloche.fr</a>.
          </p>
          <p style={{ margin: 0 }}>
            Rien qui cloche se réserve le droit de suspendre ou supprimer tout compte dont l&apos;utilisation ne respecterait pas les présentes CGU.
          </p>
        </Section>

        <Section title="7. Propriété intellectuelle">
          <p style={{ margin: 0 }}>
            L&apos;ensemble des éléments constituant Rien qui cloche (code source, design, textes, logo, marque) est protégé par le droit de la propriété intellectuelle. Toute reproduction partielle ou totale sans autorisation écrite est interdite.
          </p>
        </Section>

        <Section title="8. Modification des CGU">
          <p style={{ margin: 0 }}>
            Rien qui cloche se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés par email en cas de modification substantielle. La poursuite de l&apos;utilisation du service après notification vaut acceptation des nouvelles conditions.
          </p>
        </Section>

        <Section title="9. Droit applicable et juridiction compétente">
          <p style={{ margin: '0 0 8px' }}>
            Les présentes CGU sont soumises au <strong style={{ color: 'var(--color-text)' }}>droit français</strong>.
          </p>
          <p style={{ margin: 0 }}>
            En cas de litige, et à défaut de résolution amiable, les tribunaux compétents sont ceux du ressort de la Cour d&apos;appel de <strong style={{ color: 'var(--color-text)' }}>Tours</strong>.
          </p>
        </Section>

        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '24px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)' }}>Dernière mise à jour : mars 2026</p>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Link href="/mentions-legales" style={{ fontSize: '13px', color: 'var(--color-accent)', textDecoration: 'none' }}>Mentions légales</Link>
            <Link href="/politique-confidentialite" style={{ fontSize: '13px', color: 'var(--color-accent)', textDecoration: 'none' }}>Politique de confidentialité</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
