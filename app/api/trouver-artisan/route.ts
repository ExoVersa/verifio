import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// NAF codes (format "43.21A") grouped by work type for client-side filtering
// These match the activite_principale field in Recherche Entreprises API
export const TYPE_TO_NAF: Record<string, string[]> = {
  'electricite':   ['43.21A'],
  'plomberie':     ['43.22A'],
  'chauffage':     ['43.22B'],
  'pac':           ['43.22B'],
  'isolation':     ['43.29A'],
  'platerie':      ['43.31Z'],
  'fenetres':      ['43.32A', '43.32B', '43.32C'],
  'carrelage':     ['43.33Z'],
  'peinture':      ['43.34Z'],
  'finitions':     ['43.39Z'],
  'charpente':     ['43.91A'],
  'toiture':       ['43.91A', '43.91B'],
  'etancheite':    ['43.99A'],
  'ravalement':    ['43.99B'],
  'maconnerie':    ['43.99C', '41.20A', '41.20B'],
  'construction':  ['41.20A', '41.20B'],
  'extension':     ['41.20A', '41.20B'],
  'cuisine':       ['43.32B', '43.39Z'],
  'salle-de-bain': ['43.22A', '43.33Z'],
  'photovoltaique': ['43.21A'],
}

export const NAF_LABELS: Record<string, string> = {
  '43.21A': 'Électricité',
  '43.22A': 'Plomberie / Sanitaire',
  '43.22B': 'Chauffage / Climatisation',
  '43.29A': 'Isolation',
  '43.29B': 'Autres installations',
  '43.31Z': 'Plâtrerie',
  '43.32A': 'Menuiserie bois',
  '43.32B': 'Menuiserie PVC / alu',
  '43.32C': 'Agencement',
  '43.33Z': 'Carrelage / Dallage',
  '43.34Z': 'Peinture / Vitrerie',
  '43.39Z': 'Autres finitions',
  '43.91A': 'Charpente',
  '43.91B': 'Couverture',
  '43.99A': 'Étanchéité',
  '43.99B': 'Ravalement',
  '43.99C': 'Maçonnerie générale',
  '43.99D': 'Travaux spécialisés',
  '43.99E': 'Location de matériel',
  '41.20A': 'Construction maisons',
  '41.20B': 'Construction bâtiments',
  '41.10A': 'Promotion immobilière',
  '42.21Z': 'Canalisations',
  '42.22Z': 'Réseaux électriques',
}

export interface ArtisanResult {
  siret: string
  siren: string
  nom: string
  formeJuridique: string
  activitePrincipale: string
  activiteLabel: string
  dateCreation: string
  adresse: string
  codePostal: string
  ville: string
  rge: boolean
  rgeQualifications: string[]
  lat?: number
  lon?: number
  effectif?: string
}

function getFormeJuridique(code: string): string {
  const n = parseInt(code || '0', 10)
  if (n === 1000) return 'Auto-entrepreneur'
  if (n >= 1100 && n <= 1399) return 'Artisan'
  if (n >= 2110 && n <= 2120) return 'EIRL'
  if (n === 5485 || n === 5499 || n === 5498) return 'SAS / SASU'
  if (n === 5710 || n === 5720) return 'SARL'
  if (n === 5730) return 'EURL'
  if (n >= 5300 && n <= 5399) return 'SA'
  if (n >= 6000 && n <= 6999) return 'Sté civile'
  if (n >= 9200 && n <= 9299) return 'Association'
  if (n >= 1400 && n <= 1999) return 'Ind. / Autre'
  return 'Société'
}

function getEffectifLabel(tranche: string): string {
  const map: Record<string, string> = {
    'NN': '',
    '00': '0 salarié',
    '01': '1-2 salariés',
    '02': '3-5 salariés',
    '03': '6-9 salariés',
    '11': '10-19 salariés',
    '12': '20-49 salariés',
    '21': '50-99 salariés',
    '22': '100-199 salariés',
    '31': '200-249 salariés',
    '32': '250-499 salariés',
  }
  return map[tranche] || ''
}

async function getCommunes(lat: string, lon: string, rayonKm: number): Promise<string[]> {
  const url = `https://geo.api.gouv.fr/communes?lat=${lat}&lon=${lon}&distance=${rayonKm * 1000}&fields=codesPostaux&limit=80&boost=population`
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = await res.json()
    const cps: string[] = []
    for (const c of data) {
      if (c.codesPostaux) cps.push(...c.codesPostaux)
    }
    return [...new Set(cps)].slice(0, 15)
  } catch {
    return []
  }
}

function parseApiResult(r: any, codePostal: string): ArtisanResult {
  const siege = r.siege || {}
  const rgeQualifications: string[] = siege.liste_rge
    ? (Array.isArray(siege.liste_rge) ? siege.liste_rge : [siege.liste_rge])
    : []
  const nafForLabel = r.activite_principale || siege.activite_principale || ''
  return {
    siret: siege.siret || '',
    siren: r.siren || '',
    nom: r.nom_complet || r.nom_raison_sociale || 'Nom inconnu',
    formeJuridique: getFormeJuridique(r.nature_juridique || ''),
    activitePrincipale: nafForLabel,
    activiteLabel: NAF_LABELS[nafForLabel] || nafForLabel || '',
    dateCreation: r.date_creation || siege.date_creation || '',
    adresse: siege.adresse || siege.geo_adresse || '',
    codePostal: siege.code_postal || codePostal,
    ville: siege.libelle_commune || '',
    rge: rgeQualifications.length > 0,
    rgeQualifications,
    lat: siege.latitude ? parseFloat(siege.latitude) : undefined,
    lon: siege.longitude ? parseFloat(siege.longitude) : undefined,
    effectif: getEffectifLabel(r.tranche_effectif_salarie || siege.tranche_effectif_salarie || 'NN'),
  }
}

async function searchByPostalCode(
  codePostal: string,
  rgeOnly: boolean,
  nafCode: string | null,
  perPage: number = 25,
  page: number = 1,
): Promise<{ results: ArtisanResult[]; total: number }> {
  const params = new URLSearchParams({
    code_postal: codePostal,
    etat_administratif: 'A',
    per_page: String(perPage),
    page: String(page),
  })

  if (nafCode) {
    params.set('activite_principale', nafCode)
  } else {
    params.set('section_activite_principale', 'F') // Section F = Construction
  }

  if (rgeOnly) {
    params.set('est_rge', 'true')
  }

  const url = `https://recherche-entreprises.api.gouv.fr/search?${params}`
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return { results: [], total: 0 }
    const data = await res.json()
    if (!data.results) return { results: [], total: 0 }
    return {
      results: data.results.map((r: any) => parseApiResult(r, codePostal)),
      total: data.total_results || 0,
    }
  } catch {
    return { results: [], total: 0 }
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || ''
  const codePostal = searchParams.get('codePostal') || ''
  const lat = searchParams.get('lat') || ''
  const lon = searchParams.get('lon') || ''
  const rayon = parseInt(searchParams.get('rayon') || '20', 10)
  const rgeOnly = searchParams.get('rgeOnly') === '1'

  if (!codePostal) {
    return NextResponse.json({ error: 'Code postal manquant' }, { status: 400 })
  }

  // Determine NAF codes for type filtering (use first NAF code as API filter)
  const typeNafs = type && TYPE_TO_NAF[type] ? TYPE_TO_NAF[type] : null
  const primaryNaf = typeNafs?.[0] ?? null // Send one NAF code to API

  // Build list of postal codes in radius
  let codesPostaux: string[] = [codePostal]
  if (lat && lon && rayon > 5) {
    const nearby = await getCommunes(lat, lon, rayon)
    if (nearby.length > 0) {
      codesPostaux = [...new Set([codePostal, ...nearby])].slice(0, 10)
    }
  }

  // For specific NAF: search up to 4 postal codes with pagination on the main CP
  // For generic section=F: search up to 4 postal codes, first page only (too many results anyway)
  const searchPromises: Promise<{ results: ArtisanResult[]; total: number }>[] = []

  if (primaryNaf) {
    // Specific type: search main CP with higher perPage + page 2 if needed, plus nearby CPs
    searchPromises.push(searchByPostalCode(codePostal, rgeOnly, primaryNaf, 50, 1))
    for (const cp of codesPostaux.slice(1, 4)) {
      searchPromises.push(searchByPostalCode(cp, rgeOnly, primaryNaf, 25, 1))
    }
  } else {
    // Generic: search up to 4 postal codes, page 1 only
    codesPostaux.slice(0, 4).forEach((cp, i) => {
      searchPromises.push(searchByPostalCode(cp, rgeOnly, null, i === 0 ? 50 : 25, 1))
    })
  }

  const nested = await Promise.all(searchPromises)

  // If specific type and main CP has more results, fetch page 2
  if (primaryNaf && nested[0].total > 50) {
    const page2 = await searchByPostalCode(codePostal, rgeOnly, primaryNaf, 50, 2)
    nested.push(page2)
  }

  // Deduplicate by SIRET
  const seen = new Set<string>()
  const all: ArtisanResult[] = []
  for (const batch of nested) {
    for (const r of batch.results) {
      const key = r.siret || r.siren
      if (key && !seen.has(key)) {
        seen.add(key)
        all.push(r)
      }
    }
  }

  const rgeCount = all.filter(r => r.rge).length

  return NextResponse.json({
    results: all.slice(0, 80),
    total: all.length,
    rgeCount,
    codesPostaux,
  })
}
