import type { Metadata } from 'next'
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import OnboardingModal from '@/components/OnboardingModal'
import CookieBanner from '@/components/CookieBanner'
import FadeUpObserver from '@/components/FadeUpObserver'

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-bricolage',
  display: 'swap',
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jakarta',
  display: 'swap',
})

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
    <html lang="fr" className={`${bricolage.variable} ${jakarta.variable}`}>
      <body>
        {children}
        <OnboardingModal />
        <CookieBanner />
        <FadeUpObserver />
      </body>
    </html>
  )
}
