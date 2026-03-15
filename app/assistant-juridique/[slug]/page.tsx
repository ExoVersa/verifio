import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import SiteHeader from '@/components/SiteHeader'
import AssistantJuridique from '@/components/AssistantJuridique'

interface SlugConfig {
  question: string
  title: string
  description: string
}

const SLUGS: Record<string, SlugConfig> = {
  'artisan-disparu': {
    question: 'Mon artisan a disparu avec l\'acompte',
    title: 'Artisan disparu avec l\'acompte — Que faire ? | Verifio',
    description: 'Votre artisan a encaissé l\'acompte et a disparu ? Découvrez vos droits, les recours légaux et les démarches à suivre : mise en demeure, Signal Conso, tribunal.',
  },
  'travaux-mal-faits': {
    question: 'Les travaux réalisés sont mal faits, avec des malfaçons importantes',
    title: 'Travaux mal faits — Recours et droits face aux malfaçons | Verifio',
    description: 'Malfaçons, non-conformités, travaux bâclés : découvrez vos droits (garantie décennale, parfait achèvement), les recours amiables et judiciaires contre votre artisan.',
  },
  'chantier-non-termine': {
    question: 'Le chantier n\'est pas terminé et l\'artisan ne revient plus finir les travaux',
    title: 'Chantier non terminé — Que faire si l\'artisan ne revient pas ? | Verifio',
    description: 'Chantier abandonné, artisan qui ne revient pas finir les travaux : vos droits, la mise en demeure, les recours et comment faire terminer les travaux.',
  },
}

export function generateStaticParams() {
  return Object.keys(SLUGS).map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const config = SLUGS[slug]
  if (!config) return {}
  return {
    title: config.title,
    description: config.description,
  }
}

export default async function AssistantJuridiqueSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const config = SLUGS[slug]
  if (!config) notFound()

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <SiteHeader />
      <AssistantJuridique initialQuestion={config.question} />
    </main>
  )
}
