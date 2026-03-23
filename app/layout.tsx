import type { Metadata } from 'next'
import './globals.css'
import OnboardingModal from '@/components/OnboardingModal'
import CookieBanner from '@/components/CookieBanner'
import FadeUpObserver from '@/components/FadeUpObserver'

export const metadata: Metadata = {
  title: 'ArtisanCheck — Vérifiez votre artisan avant de signer',
  description: 'Vérifiez la santé d\'une entreprise artisanale en 30 secondes : SIRET, décennale, certifications RGE, alertes juridiques.',
  openGraph: {
    title: 'ArtisanCheck',
    description: 'Protégez-vous des arnaques sur les chantiers.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>
        {children}
        <OnboardingModal />
        <CookieBanner />
        <FadeUpObserver />
      </body>
    </html>
  )
}
