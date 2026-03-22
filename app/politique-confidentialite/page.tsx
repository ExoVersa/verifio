import type { Metadata } from 'next'
import Link from 'next/link'
import { Lock } from 'lucide-react'
import SiteHeader from '@/components/SiteHeader'

export const metadata: Metadata = {
  title: 'Politique de confidentialité | Verifio',
  description: 'Politique de confidentialité et traitement des données personnelles — Verifio.',
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

export default function PolitiqueConfidentialitePage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <SiteHeader />

      {/* Hero */}
      <section style={{ background: '#1B4332', padding: '56px 24px 48px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '5px 14px', borderRadius: '20px', marginBottom: '20px', border: '1px solid rgba(216,243,220,0.2)' }}>
            <Lock size={12} color="#D8F3DC" />
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#D8F3DC' }}>RGPD</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>
            Politique de confidentialité
          </h1>
          <p style={{ margin: '12px 0 0', fontSize: '15px', color: 'rgba(216,243,220,0.7)', lineHeight: 1.6 }}>
            Vos données vous appartiennent. Voici comment nous les utilisons.
          </p>
        </div>
      </section>

      {/* Content */}
      <section style={{ padding: '64px 24px', maxWidth: '720px', margin: '0 auto' }}>

        <Section title="1. Responsable du traitement">
          <p style={{ margin: '0 0 8px' }}><strong style={{ color: 'var(--color-text)' }}>Responsable :</strong> Charlie Couratin</p>
          <p style={{ margin: 0 }}><strong style={{ color: 'var(--color-text)' }}>Contact :</strong>{' '}
            <a href="mailto:contact@verifio.fr" style={{ color: 'var(--color-accent)' }}>contact@verifio.fr</a>
          </p>
        </Section>

        <Section title="2. Données collectées">
          <p style={{ margin: '0 0 12px' }}>Verifio collecte uniquement les données strictement nécessaires au fonctionnement du service :</p>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li style={{ marginBottom: '8px' }}>
              <strong style={{ color: 'var(--color-text)' }}>Adresse email</strong> — lors de la création d&apos;un compte, de l&apos;activation des alertes de surveillance ou du formulaire de contact
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong style={{ color: 'var(--color-text)' }}>Historique des recherches</strong> — les SIRET et noms d&apos;entreprises recherchés, associés au compte utilisateur
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong style={{ color: 'var(--color-text)' }}>Données chantiers</strong> — les informations renseignées dans la section &quot;Mes chantiers&quot; (nom du chantier, artisan, statut)
            </li>
            <li>
              <strong style={{ color: 'var(--color-text)' }}>Données de navigation</strong> — via des cookies techniques nécessaires à l&apos;authentification (voir section 6)
            </li>
          </ul>
        </Section>

        <Section title="3. Finalité du traitement">
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li style={{ marginBottom: '6px' }}>Fournir le service de vérification d&apos;artisans</li>
            <li style={{ marginBottom: '6px' }}>Envoyer des alertes de surveillance par email (si activées)</li>
            <li style={{ marginBottom: '6px' }}>Permettre l&apos;accès à l&apos;espace personnel et à l&apos;historique</li>
            <li style={{ marginBottom: '6px' }}>Répondre aux demandes de contact</li>
            <li>Améliorer le service (statistiques agrégées, anonymisées)</li>
          </ul>
          <p style={{ margin: '12px 0 0' }}>
            Base légale : exécution d&apos;un contrat (art. 6.1.b RGPD) et intérêt légitime (art. 6.1.f RGPD) pour les statistiques.
          </p>
        </Section>

        <Section title="4. Durée de conservation">
          <p style={{ margin: '0 0 8px' }}>Les données sont conservées <strong style={{ color: 'var(--color-text)' }}>3 ans après la dernière activité</strong> sur le compte.</p>
          <p style={{ margin: 0 }}>Les données des formulaires de contact sont supprimées dans un délai de 12 mois après traitement.</p>
        </Section>

        <Section title="5. Vos droits (RGPD)">
          <p style={{ margin: '0 0 12px' }}>Conformément au Règlement Général sur la Protection des Données, vous disposez des droits suivants :</p>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li style={{ marginBottom: '6px' }}><strong style={{ color: 'var(--color-text)' }}>Droit d&apos;accès</strong> — obtenir une copie de vos données</li>
            <li style={{ marginBottom: '6px' }}><strong style={{ color: 'var(--color-text)' }}>Droit de rectification</strong> — corriger des données inexactes</li>
            <li style={{ marginBottom: '6px' }}><strong style={{ color: 'var(--color-text)' }}>Droit à l&apos;effacement</strong> — supprimer vos données (&quot;droit à l&apos;oubli&quot;)</li>
            <li style={{ marginBottom: '6px' }}><strong style={{ color: 'var(--color-text)' }}>Droit à la portabilité</strong> — recevoir vos données dans un format structuré</li>
            <li style={{ marginBottom: '6px' }}><strong style={{ color: 'var(--color-text)' }}>Droit d&apos;opposition</strong> — vous opposer à certains traitements</li>
            <li><strong style={{ color: 'var(--color-text)' }}>Droit de limitation</strong> — limiter le traitement de vos données</li>
          </ul>
          <p style={{ margin: '12px 0 0' }}>
            Pour exercer ces droits : <a href="mailto:contact@verifio.fr" style={{ color: 'var(--color-accent)' }}>contact@verifio.fr</a>.
            Vous pouvez également adresser une réclamation à la <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)' }}>CNIL</a>.
          </p>
        </Section>

        <Section title="6. Cookies">
          <p style={{ margin: '0 0 12px' }}>Verifio utilise uniquement des cookies techniques indispensables au fonctionnement du service :</p>
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg)' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: 'var(--color-text)', borderBottom: '1px solid var(--color-border)' }}>Cookie</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: 'var(--color-text)', borderBottom: '1px solid var(--color-border)' }}>Finalité</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: 'var(--color-text)', borderBottom: '1px solid var(--color-border)' }}>Durée</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '10px 16px', color: 'var(--color-text)', fontWeight: 600, borderBottom: '1px solid var(--color-border)' }}>sb-* (Supabase)</td>
                  <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-border)' }}>Authentification et session utilisateur</td>
                  <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-border)' }}>Session / 1 an</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px 16px', color: 'var(--color-text)', fontWeight: 600 }}>verifio_cookie_consent</td>
                  <td style={{ padding: '10px 16px' }}>Sauvegarde votre choix concernant les cookies</td>
                  <td style={{ padding: '10px 16px' }}>1 an</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p style={{ margin: '12px 0 0' }}>Aucun cookie publicitaire ou de pistage tiers n&apos;est utilisé sur Verifio.</p>
        </Section>

        <Section title="7. Partage des données">
          <p style={{ margin: '0 0 8px' }}>Verifio <strong style={{ color: 'var(--color-text)' }}>ne vend aucune donnée personnelle</strong> à des tiers.</p>
          <p style={{ margin: '0 0 8px' }}>Les données peuvent être transmises à nos sous-traitants techniques dans le cadre strict de la fourniture du service :</p>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li style={{ marginBottom: '6px' }}><strong style={{ color: 'var(--color-text)' }}>Supabase</strong> — hébergement de la base de données et authentification</li>
            <li><strong style={{ color: 'var(--color-text)' }}>Resend</strong> — envoi des emails transactionnels (alertes, contact)</li>
          </ul>
        </Section>

        <Section title="8. Hébergement et transferts">
          <p style={{ margin: 0 }}>
            Le site est hébergé par <strong style={{ color: 'var(--color-text)' }}>Vercel Inc.</strong> (San Francisco, USA). Ce transfert vers les États-Unis est encadré par des garanties appropriées conformément au RGPD (clauses contractuelles types).
          </p>
        </Section>

        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '24px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)' }}>Dernière mise à jour : mars 2026</p>
          <Link href="/mentions-legales" style={{ fontSize: '13px', color: 'var(--color-accent)', textDecoration: 'none' }}>Mentions légales →</Link>
        </div>
      </section>
    </main>
  )
}
