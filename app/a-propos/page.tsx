import type { Metadata } from 'next'
import Link from 'next/link'
import { ShieldCheck, Database, Zap, Heart, ExternalLink } from 'lucide-react'
import SiteHeader from '@/components/SiteHeader'

export const metadata: Metadata = {
  title: 'À propos — Notre mission | Verifio',
  description: 'Verifio est né d\'un constat simple : 34% des Français ont été victimes d\'arnaques sur les chantiers. Découvrez notre mission et nos engagements.',
}

export default function AProposPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <SiteHeader />

      {/* Hero */}
      <section style={{ background: '#1B4332', padding: '80px 24px 64px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '6px 16px', borderRadius: '20px', marginBottom: '24px', border: '1px solid rgba(216,243,220,0.2)' }}>
            <Heart size={13} color="#D8F3DC" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#D8F3DC' }}>Notre mission</span>
          </div>
          <h1 style={{ margin: '0 0 20px', fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.03em' }}>
            Protéger chaque Français<br />
            <span style={{ color: '#74C69D' }}>avant qu&apos;il soit victime</span>
          </h1>
          <p style={{ fontSize: '18px', color: 'rgba(216,243,220,0.8)', lineHeight: 1.65, maxWidth: '560px', margin: '0 auto' }}>
            Verifio est né d&apos;un constat simple : <strong style={{ color: '#D8F3DC' }}>34% des Français ont été victimes d&apos;arnaques sur les chantiers.</strong> Nous avons décidé que ça devait changer.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section style={{ padding: '72px 24px', background: 'var(--color-bg)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px', alignItems: 'center' }}>
            <div>
              <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Notre histoire</p>
              <h2 style={{ margin: '0 0 16px', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Pourquoi Verifio&nbsp;?
              </h2>
              <p style={{ margin: '0 0 14px', fontSize: '15px', color: 'var(--color-muted)', lineHeight: 1.7 }}>
                Chaque année en France, des milliers de particuliers font confiance à des artisans qui disparaissent avec l&apos;acompte, livrent des travaux bâclés, ou opèrent sans assurance.
              </p>
              <p style={{ margin: '0 0 14px', fontSize: '15px', color: 'var(--color-muted)', lineHeight: 1.7 }}>
                Ces informations existent — dans les bases de données officielles de l&apos;État. Mais elles sont dispersées, techniques, et inaccessibles au grand public.
              </p>
              <p style={{ margin: 0, fontSize: '15px', color: 'var(--color-muted)', lineHeight: 1.7 }}>
                <strong style={{ color: 'var(--color-text)' }}>Verifio les centralise</strong> et les transforme en un verdict clair en 30 secondes — gratuitement.
              </p>
            </div>
            <div style={{ background: 'var(--color-surface)', borderRadius: '20px', border: '1px solid var(--color-border)', padding: '32px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🛡️</div>
              <p style={{ margin: '0 0 4px', fontSize: '40px', fontWeight: 900, color: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}>34&nbsp;%</p>
              <p style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>des Français victimes</p>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)' }}>d&apos;arnaques sur les chantiers chaque année</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sources */}
      <section style={{ padding: '72px 24px', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>Transparence</p>
          <h2 style={{ margin: '0 0 12px', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', textAlign: 'center' }}>
            Comment ça marche&nbsp;?
          </h2>
          <p style={{ margin: '0 0 40px', fontSize: '15px', color: 'var(--color-muted)', textAlign: 'center', lineHeight: 1.6 }}>
            Nous interrogeons 6 bases de données publiques et officielles pour chaque recherche.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { icon: <Database size={18} />, source: 'INSEE — SIRENE', desc: 'Vérifie l\'existence légale de l\'entreprise : numéro SIRET, statut actif/fermé, date de création, forme juridique.' },
              { icon: <ShieldCheck size={18} />, source: 'ADEME — Registre RGE', desc: 'Contrôle les certifications Reconnu Garant de l\'Environnement, obligatoires pour les aides de l\'État (MaPrimeRénov\').' },
              { icon: <Zap size={18} />, source: 'BODACC', desc: 'Consulte le Bulletin Officiel des Annonces Civiles et Commerciales pour détecter redressements, liquidations et procédures collectives.' },
              { icon: <Database size={18} />, source: 'RNE / INPI', desc: 'Identifie les dirigeants, leur rôle et les changements récents de gouvernance qui peuvent signaler des risques.' },
              { icon: <Database size={18} />, source: 'API Entreprise', desc: 'Consolide les données économiques : capital social, effectifs, chiffre d\'affaires et conventions collectives déclarées.' },
              { icon: <Zap size={18} />, source: 'IA Anthropic (Claude)', desc: 'Génère une synthèse personnalisée et la checklist des documents à demander selon le secteur d\'activité.' },
            ].map(({ icon, source, desc }) => (
              <div key={source} style={{ display: 'flex', gap: '16px', padding: '18px', borderRadius: '14px', background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--color-accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)', flexShrink: 0 }}>
                  {icon}
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>{source}</p>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)', lineHeight: 1.55 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Engagements */}
      <section style={{ padding: '72px 24px', background: 'var(--color-bg)', borderTop: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>Nos engagements</p>
          <h2 style={{ margin: '0 0 40px', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', textAlign: 'center' }}>
            Ce que nous vous promettons
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '40px' }}>
            {[
              { icon: '📋', title: 'Données officielles', desc: 'Toutes nos données proviennent de sources gouvernementales vérifiables.' },
              { icon: '🆓', title: 'Gratuit pour tous', desc: 'La vérification de base est et restera toujours gratuite, sans inscription.' },
              { icon: '🎯', title: 'Mission claire', desc: 'Nous n\'avons aucun intérêt commercial à promouvoir un artisan plutôt qu\'un autre.' },
              { icon: '🔒', title: 'Données sécurisées', desc: 'Vos recherches sont privées. Nous ne revendons aucune donnée personnelle.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '24px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>{icon}</div>
                <p style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>{title}</p>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)', lineHeight: 1.55 }}>{desc}</p>
              </div>
            ))}
          </div>
          <div style={{ background: '#1B4332', borderRadius: '20px', padding: '32px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 6px', fontSize: '14px', color: '#74C69D', fontWeight: 600 }}>Notre promesse</p>
            <p style={{ margin: '0 0 24px', fontSize: '20px', fontWeight: 700, color: '#D8F3DC', lineHeight: 1.4 }}>
              &ldquo;Nos données sont officielles, notre service est gratuit, notre mission est claire.&rdquo;
            </p>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 28px', borderRadius: '12px', background: '#52B788', color: '#fff', fontSize: '15px', fontWeight: 700, textDecoration: 'none' }}>
              <ShieldCheck size={17} />
              Vérifiez votre artisan maintenant
            </Link>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" style={{ padding: '72px 24px', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Contact</p>
          <h2 style={{ margin: '0 0 12px', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em' }}>Vous avez une question&nbsp;?</h2>
          <p style={{ margin: '0 0 28px', fontSize: '15px', color: 'var(--color-muted)', lineHeight: 1.6 }}>
            Nous lisons chaque message. Pour les signalements d&apos;erreurs ou suggestions d&apos;amélioration, contactez-nous directement.
          </p>
          <a
            href="mailto:contact@verifio.fr"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 24px', borderRadius: '12px', background: 'var(--color-accent)', color: '#fff', fontSize: '15px', fontWeight: 700, textDecoration: 'none' }}
          >
            <ExternalLink size={16} />
            contact@verifio.fr
          </a>
        </div>
      </section>
    </main>
  )
}
