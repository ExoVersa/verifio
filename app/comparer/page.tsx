import type { Metadata } from 'next'
import ComparateurArtisans from '@/components/ComparateurArtisans'
import SiteHeader from '@/components/SiteHeader'

export const metadata: Metadata = {
  title: 'Comparer des artisans — Choisissez le plus fiable | Verifio',
  description: 'Comparez 2 ou 3 artisans côte à côte : score de confiance, ancienneté, RGE, procédures légales, capital social. Obtenez un verdict IA en 1 phrase pour choisir le meilleur profil.',
}

export default async function ComparerPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <SiteHeader />
      <ComparateurArtisans initialSiret={q} />
    </main>
  )
}
