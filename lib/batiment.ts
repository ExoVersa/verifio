// Codes NAF du secteur bâtiment et travaux
// Section F — Construction + activités connexes
export const CODES_NAF_BATIMENT = [
  // Construction de bâtiments
  '4110A', '4110B', '4110C', '4110D',
  '4120A', '4120B',
  // Génie civil
  '4211Z', '4212Z', '4213A', '4213B',
  '4221Z', '4222Z', '4291Z', '4299Z',
  // Travaux de construction spécialisés
  '4311Z', '4312A', '4312B', '4313Z',
  '4321A', '4321B', // Électricité
  '4322A', '4322B', // Plomberie, chauffage
  '4329A', '4329B',
  '4331Z', // Plâtrerie
  '4332A', '4332B', '4332C', // Menuiserie
  '4333Z', // Carrelage, parquet
  '4334Z', // Peinture, vitrerie
  '4335Z', // Couverture, étanchéité
  '4339Z',
  '4341Z', '4342Z',
  '4391A', '4391B', // Charpente
  '4399A', '4399B', '4399C', '4399D', '4399E',
  // Activités connexes
  '7112B', // Ingénierie, études techniques
  '4322Z', // Installation équipements thermiques
  '2370Z', // Taille de pierres
  '2351Z', // Fabrication ciment
  '2363Z', // Béton prêt à l'emploi
  '4941A', // Transport matériaux (livraison chantier)
]

export function isEntrepriseBatiment(codeNaf?: string | null): boolean {
  if (!codeNaf) return false
  const code = codeNaf.replace('.', '').toUpperCase().trim()
  return CODES_NAF_BATIMENT.some(c => code.startsWith(c.substring(0, 4)))
}

export function getCategorieBatiment(codeNaf?: string | null): string | null {
  if (!codeNaf) return null
  const code = codeNaf.replace('.', '').toUpperCase().trim()

  if (code.startsWith('411') || code.startsWith('412')) return 'Promotion / Construction'
  if (code.startsWith('4321')) return 'Électricité'
  if (code.startsWith('4322')) return 'Plomberie / Chauffage'
  if (code.startsWith('4331')) return 'Plâtrerie'
  if (code.startsWith('4332')) return 'Menuiserie'
  if (code.startsWith('4333')) return 'Carrelage / Parquet'
  if (code.startsWith('4334')) return 'Peinture / Vitrerie'
  if (code.startsWith('4335')) return 'Couverture / Étanchéité'
  if (code.startsWith('4391')) return 'Charpente'
  if (code.startsWith('43')) return 'Travaux spécialisés'
  if (code.startsWith('41') || code.startsWith('42')) return 'Gros œuvre / Génie civil'
  return null
}
