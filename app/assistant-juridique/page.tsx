import type { Metadata } from 'next'
import SiteHeader from '@/components/SiteHeader'
import AssistantJuridique from '@/components/AssistantJuridique'

export const metadata: Metadata = {
  title: 'Assistant juridique artisan — Que faire en cas de litige ?',
  description: 'Votre assistant gratuit pour les litiges artisans : artisan disparu, travaux mal faits, chantier non terminé, acompte non remboursé. Droits, recours et démarches en français simple.',
}

export default function AssistantJuridiqueePage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <SiteHeader />
      <AssistantJuridique />
    </main>
  )
}
