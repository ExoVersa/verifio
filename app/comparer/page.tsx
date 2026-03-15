import type { Metadata } from 'next'
import ComparateurArtisans from '@/components/ComparateurArtisans'

export const metadata: Metadata = {
  title: 'Comparer des artisans — Choisissez le plus fiable | ArtisanCheck',
  description: 'Comparez 2 ou 3 artisans côte à côte : score de confiance, ancienneté, RGE, procédures légales, capital social. Obtenez un verdict IA en 1 phrase pour choisir le meilleur profil.',
}

export default async function ComparerPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
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
        <span style={{ fontSize: '13px', color: 'var(--color-muted)', marginLeft: '4px' }}>/ Comparer</span>
      </header>
      <ComparateurArtisans initialSiret={q} />
    </main>
  )
}
