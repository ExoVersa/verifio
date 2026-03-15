import type { Metadata } from 'next'
import GuideChantier from '@/components/GuideChantier'
import SiteHeader from '@/components/SiteHeader'

export const metadata: Metadata = {
  title: 'Guide de suivi de chantier — Checklist complète | Verifio',
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
      <SiteHeader />
      <GuideChantier initialArtisan={artisan} />
    </main>
  )
}
