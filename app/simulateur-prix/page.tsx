import type { Metadata } from 'next'
import SimulateurPrix from '@/components/SimulateurPrix'
import SiteHeader from '@/components/SiteHeader'

export const metadata: Metadata = {
  title: 'Simulateur de prix travaux 2025 — Vérifiez si votre devis est normal',
  description: 'Comparez votre devis avec les prix réels du marché français 2024-2025. Isolation, toiture, plomberie, électricité, cuisine, salle de bain… Obtenez une fourchette de prix fiable en 30 secondes.',
}

export default function SimulateurPrixPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <SiteHeader />
      <SimulateurPrix />
    </main>
  )
}
