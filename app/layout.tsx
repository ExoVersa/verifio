import type { Metadata } from 'next'
import './globals.css'

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
      <body>{children}</body>
    </html>
  )
}
