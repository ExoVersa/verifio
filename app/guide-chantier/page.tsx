import type { Metadata } from 'next'
import GuideChantier from '@/components/GuideChantier'

export const metadata: Metadata = {
  title: 'Guide de suivi de chantier — Checklist complète | ArtisanCheck',
  description: 'Checklist interactive en 4 phases pour suivre vos travaux : avant de signer, au démarrage, pendant les travaux et à la réception. Vérifiez chaque étape pour vous protéger.',
}

export default async function GuideChantierPage({
  searchParams,
}: {
  searchParams: Promise<{ artisan?: string }>
}) {
  const { artisan } = await searchParams
  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <header style={{
        padding: '16px 24px', borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface)', display: 'flex', alignItems: 'center',
        gap: '10px', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}>
            ArtisanCheck
          </span>
        </a>
        <span style={{ fontSize: '13px', color: 'var(--color-muted)', marginLeft: '4px' }}>/ Guide chantier</span>
      </header>
      <GuideChantier initialArtisan={artisan} />
    </main>
  )
}
