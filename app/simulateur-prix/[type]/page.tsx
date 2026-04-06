import type { Metadata } from 'next'
import SimulateurPrix from '@/components/SimulateurPrix'

const TYPES_SEO: Record<string, { label: string; description: string }> = {
  isolation: { label: 'Isolation', description: 'Combien coûte une isolation en 2025 ? Comparez votre devis avec les prix du marché français : isolation des combles, des murs, du sol. Fourchette par région.' },
  toiture: { label: 'Toiture', description: 'Prix d\'une toiture en 2025 : réfection, remplacement, zinguerie. Vérifiez si votre devis couvreur est dans la normale selon votre région.' },
  plomberie: { label: 'Plomberie', description: 'Combien coûte un travaux de plomberie en 2025 ? Vérifiez le prix de votre devis plombier selon la surface et votre région.' },
  electricite: { label: 'Électricité', description: 'Prix d\'une installation électrique en 2025. Vérifiez si votre devis électricien est dans la fourchette normale du marché français.' },
  carrelage: { label: 'Carrelage', description: 'Prix du carrelage en 2025 : pose, dépose, fourniture. Estimez le coût au m² selon votre région et votre gamme.' },
  peinture: { label: 'Peinture', description: 'Combien coûte une peinture en 2025 ? Prix au m² selon la région. Vérifiez si votre devis peintre est dans la normale.' },
  maconnerie: { label: 'Maçonnerie', description: 'Prix de la maçonnerie en 2025 : mur, enduit, démolition. Estimez le coût de vos travaux selon votre région et votre projet.' },
  chauffage: { label: 'Chauffage', description: 'Prix d\'une installation de chauffage en 2025 : pompe à chaleur, poêle, radiateurs. Vérifiez votre devis chauffagiste.' },
  fenetres: { label: 'Fenêtres / menuiserie', description: 'Prix d\'une fenêtre ou d\'une porte en 2025. Vérifiez si votre devis menuiserie est dans la fourchette normale.' },
  'salle-de-bain': { label: 'Salle de bain', description: 'Combien coûte une rénovation de salle de bain en 2025 ? Prix complets selon la gamme et la région.' },
  cuisine: { label: 'Cuisine', description: 'Prix d\'une cuisine en 2025 : installation, pose, aménagement. Estimez le coût selon la surface et votre région.' },
  extension: { label: 'Extension', description: 'Prix d\'une extension de maison en 2025 : surélévation, agrandissement. Estimez le coût selon la surface et la région.' },
}

export function generateStaticParams() {
  return Object.keys(TYPES_SEO).map(type => ({ type }))
}

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const { type } = await params
  const info = TYPES_SEO[type] || { label: type, description: 'Simulateur de prix travaux 2025.' }
  return {
    title: `Prix ${info.label} 2025 — Simulateur de devis | Rien qui cloche`,
    description: info.description,
  }
}

export default async function SimulateurTypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params
  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <header style={{
        padding: '16px 24px', borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface)', display: 'flex', alignItems: 'center',
        gap: '10px', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}>
            Rien qui cloche
          </span>
        </a>
        <span style={{ fontSize: '13px', color: 'var(--color-muted)', marginLeft: '4px' }}>/ Simulateur de prix</span>
      </header>
      <SimulateurPrix defaultType={type} />
    </main>
  )
}
