import type { Metadata } from 'next'
import SiteHeader from '@/components/SiteHeader'
import TrouverArtisan from '@/components/TrouverArtisan'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Trouver un artisan certifié RGE près de chez moi | Verifio',
  description: 'Trouvez des artisans certifiés RGE (isolation, chauffage, panneaux solaires, pompe à chaleur) près de chez vous. Score de confiance, vérification SIRET et certifications inclus.',
}

export default async function TrouverArtisanPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; ville?: string; cp?: string }>
}) {
  const { type, ville, cp } = await searchParams

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <SiteHeader />
      <TrouverArtisan
        initialType={type || ''}
        initialVille={ville || ''}
        initialCodePostal={cp || ''}
      />
    </main>
  )
}
