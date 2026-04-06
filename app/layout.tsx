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
  title: {
    default: 'Rien qui cloche — Vérifiez et suivez votre chantier, en toute autonomie',
    template: '%s — Rien qui cloche',
  },
  description: 'La plateforme en ligne pour les particuliers : vérifiez un artisan en quelques secondes, consultez ses certifications et son historique légal, puis pilotez votre chantier de A à Z. Sans intermédiaire, sans prise de tête.',
  keywords: ['vérification artisan', 'score fiabilité', 'RGE', 'BODACC', 'rapport artisan', 'chantier', 'suivi chantier', 'particulier', 'arnaque artisan'],
  authors: [{ name: 'Rien qui cloche' }],
  creator: 'Rien qui cloche',
  metadataBase: new URL('https://www.rienquicloche.fr'),
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://www.rienquicloche.fr',
    siteName: 'Rien qui cloche',
    title: 'Rien qui cloche — La plateforme chantier pour les particuliers',
    description: 'Vérification d\'artisan, score de fiabilité, suivi de chantier par phases — tout en autonomie, directement en ligne. Pensé pour les particuliers qui veulent garder le contrôle.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Rien qui cloche — La plateforme chantier pour les particuliers',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rien qui cloche — La plateforme chantier pour les particuliers',
    description: 'Vérification d\'artisan, score de fiabilité, suivi de chantier par phases — tout en autonomie, directement en ligne.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
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
