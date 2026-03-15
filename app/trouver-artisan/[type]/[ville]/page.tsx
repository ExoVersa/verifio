import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import SiteHeader from '@/components/SiteHeader'
import TrouverArtisan from '@/components/TrouverArtisan'

interface SlugConfig {
  type: string
  typeLabel: string
  ville: string
  villeLabel: string
  codePostal: string
}

const SLUGS: Record<string, Record<string, SlugConfig>> = {
  isolation: {
    paris: {
      type: 'isolation', typeLabel: 'Isolation',
      ville: 'paris', villeLabel: 'Paris', codePostal: '75001',
    },
    lyon: {
      type: 'isolation', typeLabel: 'Isolation',
      ville: 'lyon', villeLabel: 'Lyon', codePostal: '69001',
    },
    marseille: {
      type: 'isolation', typeLabel: 'Isolation',
      ville: 'marseille', villeLabel: 'Marseille', codePostal: '13001',
    },
  },
  plombier: {
    paris: {
      type: 'plomberie', typeLabel: 'Plomberie',
      ville: 'paris', villeLabel: 'Paris', codePostal: '75001',
    },
    lyon: {
      type: 'plomberie', typeLabel: 'Plomberie',
      ville: 'lyon', villeLabel: 'Lyon', codePostal: '69001',
    },
    marseille: {
      type: 'plomberie', typeLabel: 'Plomberie',
      ville: 'marseille', villeLabel: 'Marseille', codePostal: '13001',
    },
  },
  electricien: {
    paris: {
      type: 'electricite', typeLabel: 'Électricité',
      ville: 'paris', villeLabel: 'Paris', codePostal: '75001',
    },
    lyon: {
      type: 'electricite', typeLabel: 'Électricité',
      ville: 'lyon', villeLabel: 'Lyon', codePostal: '69001',
    },
    marseille: {
      type: 'electricite', typeLabel: 'Électricité',
      ville: 'marseille', villeLabel: 'Marseille', codePostal: '13001',
    },
  },
  toiture: {
    toulouse: {
      type: 'toiture', typeLabel: 'Toiture',
      ville: 'toulouse', villeLabel: 'Toulouse', codePostal: '31000',
    },
    bordeaux: {
      type: 'toiture', typeLabel: 'Toiture',
      ville: 'bordeaux', villeLabel: 'Bordeaux', codePostal: '33000',
    },
  },
  chauffage: {
    bordeaux: {
      type: 'chauffage', typeLabel: 'Chauffage',
      ville: 'bordeaux', villeLabel: 'Bordeaux', codePostal: '33000',
    },
    toulouse: {
      type: 'chauffage', typeLabel: 'Chauffage',
      ville: 'toulouse', villeLabel: 'Toulouse', codePostal: '31000',
    },
  },
  pac: {
    nantes: {
      type: 'pac', typeLabel: 'Pompe à chaleur',
      ville: 'nantes', villeLabel: 'Nantes', codePostal: '44000',
    },
    bordeaux: {
      type: 'pac', typeLabel: 'Pompe à chaleur',
      ville: 'bordeaux', villeLabel: 'Bordeaux', codePostal: '33000',
    },
  },
}

export function generateStaticParams() {
  const params: { type: string; ville: string }[] = []
  for (const [type, villes] of Object.entries(SLUGS)) {
    for (const ville of Object.keys(villes)) {
      params.push({ type, ville })
    }
  }
  return params
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string; ville: string }>
}): Promise<Metadata> {
  const { type, ville } = await params
  const config = SLUGS[type]?.[ville]
  if (!config) return {}
  return {
    title: `${config.typeLabel} à ${config.villeLabel} — Artisans certifiés RGE | Verifio`,
    description: `Trouvez les meilleurs artisans certifiés pour ${config.typeLabel.toLowerCase()} à ${config.villeLabel}. Vérification SIRET, certifications RGE et score de confiance.`,
  }
}

export default async function TrouverArtisanSlugPage({
  params,
}: {
  params: Promise<{ type: string; ville: string }>
}) {
  const { type, ville } = await params
  const config = SLUGS[type]?.[ville]
  if (!config) notFound()

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <SiteHeader />
      <TrouverArtisan
        initialType={config.type}
        initialVille={config.villeLabel}
        initialCodePostal={config.codePostal}
      />
    </main>
  )
}
