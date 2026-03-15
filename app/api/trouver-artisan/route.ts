import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Real ADEME domaine values (verified directly from the API)
const TYPE_TO_DOMAINES: Record<string, string[]> = {
  'isolation': [
    'Isolation par l\'intérieur des murs ou rampants de toitures ou plafonds',
    'Isolation des combles perdus',
    'Isolation des murs par l\'extérieur',
    'Isolation des planchers bas',
  ],
  'toiture': [
    'Isolation des combles perdus',
    'Isolation par l\'intérieur des murs ou rampants de toitures ou plafonds',
  ],
  'chauffage': [
    'Chaudière condensation ou micro-cogénération gaz ou fioul',
    'Chaudière bois',
    'Radiateurs électriques, dont régulation.',
    'Chauffe-Eau Thermodynamique',
  ],
  'pac': [
    'Pompe à chaleur : chauffage',
  ],
  'photovoltaique': [
    'Panneaux solaires photovoltaïques',
  ],
  'fenetres': [
    'Fenêtres, volets, portes donnant sur l\'extérieur',
    'Fenêtres de toit',
  ],
  'plomberie': [
    'Chauffe-Eau Thermodynamique',
    'Chauffage et/ou eau chaude solaire',
  ],
  'salle-de-bain': [
    'Chauffe-Eau Thermodynamique',
  ],
  'electricite': [
    'Radiateurs électriques, dont régulation.',
    'Panneaux solaires photovoltaïques',
  ],
  // No RGE data for: carrelage, peinture, maconnerie, cuisine, extension
  'carrelage': [],
  'peinture': [],
  'maconnerie': [],
  'cuisine': [],
  'extension': [],
}

const TYPE_TO_NAF: Record<string, string[]> = {
  'isolation': ['4329A', '4332A'],
  'toiture': ['4391A', '4399E'],
  'plomberie': ['4322A'],
  'electricite': ['4321A'],
  'carrelage': ['4333Z'],
  'peinture': ['4334Z'],
  'maconnerie': ['4120A', '4399C'],
  'chauffage': ['4322B'],
  'fenetres': ['4332A', '4332B'],
  'salle-de-bain': ['4322A'],
  'cuisine': ['4332B', '4339Z'],
  'extension': ['4120A'],
  'photovoltaique': ['4321A'],
  'pac': ['4322B'],
}

interface ArtisanResult {
  siret: string
  nom: string
  adresse: string
  codePostal: string
  ville: string
  rge: boolean
  domaines: string[]
  qualifications: string[]
  lat?: number
  lon?: number
}

async function getCommunes(lat: string, lon: string, rayonKm: number): Promise<string[]> {
  const distanceMeters = rayonKm * 1000
  const url = `https://geo.api.gouv.fr/communes?lat=${lat}&lon=${lon}&distance=${distanceMeters}&fields=codesPostaux&limit=100&boost=population`
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = await res.json()
    const cps: string[] = []
    for (const commune of data) {
      if (commune.codesPostaux) cps.push(...commune.codesPostaux)
    }
    return [...new Set(cps)].slice(0, 20)
  } catch {
    return []
  }
}

async function searchAdemeRge(codePostal: string, domaines: string[]): Promise<ArtisanResult[]> {
  // Build the qs filter: code_postal + optional domaine OR clause
  let qs = `code_postal:"${codePostal}"`
  if (domaines.length > 0) {
    const domaineClause = domaines.map(d => `domaine:"${d}"`).join(' OR ')
    qs += ` AND (${domaineClause})`
  }

  const url = `https://data.ademe.fr/data-fair/api/v1/datasets/liste-des-entreprises-rge-2/lines?qs=${encodeURIComponent(qs)}&size=25&select=siret,nom_entreprise,adresse,code_postal,commune,domaine,nom_qualification,latitude,longitude`

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = await res.json()
    if (!data.results || !Array.isArray(data.results)) return []

    // Group by SIRET — one company can have multiple certifications
    const bySiret = new Map<string, ArtisanResult>()
    for (const r of data.results) {
      const siret = (r.siret || '').replace(/\s/g, '')
      if (!siret) continue
      if (bySiret.has(siret)) {
        const existing = bySiret.get(siret)!
        if (r.domaine && !existing.domaines.includes(r.domaine)) {
          existing.domaines.push(r.domaine)
        }
        if (r.nom_qualification && !existing.qualifications.includes(r.nom_qualification)) {
          existing.qualifications.push(r.nom_qualification)
        }
      } else {
        bySiret.set(siret, {
          siret,
          nom: r.nom_entreprise || 'Nom inconnu',
          adresse: r.adresse || '',
          codePostal: r.code_postal || codePostal,
          ville: r.commune || '',
          rge: true,
          domaines: r.domaine ? [r.domaine] : [],
          qualifications: r.nom_qualification ? [r.nom_qualification] : [],
          lat: r.latitude ? parseFloat(r.latitude) : undefined,
          lon: r.longitude ? parseFloat(r.longitude) : undefined,
        })
      }
    }
    return Array.from(bySiret.values())
  } catch {
    return []
  }
}

async function searchEntreprises(codePostal: string, nafCodes: string[]): Promise<ArtisanResult[]> {
  if (!nafCodes.length) return []
  const naf = nafCodes[0]
  const url = `https://recherche-entreprises.api.gouv.fr/search?code_postal=${codePostal}&activite_principale=${naf}&etat_administratif=A&per_page=10`
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = await res.json()
    if (!data.results) return []
    return data.results.map((r: any) => {
      const siege = r.siege || {}
      return {
        siret: siege.siret || r.siren || '',
        nom: r.nom_complet || r.nom_raison_sociale || 'Nom inconnu',
        adresse: siege.adresse || '',
        codePostal: siege.code_postal || codePostal,
        ville: siege.libelle_commune || '',
        rge: false,
        domaines: [],
        qualifications: [],
        lat: siege.latitude ? parseFloat(siege.latitude) : undefined,
        lon: siege.longitude ? parseFloat(siege.longitude) : undefined,
      }
    })
  } catch {
    return []
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

  if (!type || !codePostal) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  const domaines = TYPE_TO_DOMAINES[type] || []
  const nafCodes = TYPE_TO_NAF[type] || []
  const hasRgeData = domaines.length > 0

  // Get list of postal codes within radius
  let codesPostaux: string[] = [codePostal]
  if (lat && lon) {
    const nearby = await getCommunes(lat, lon, rayon)
    if (nearby.length > 0) {
      codesPostaux = [...new Set([codePostal, ...nearby])].slice(0, 12)
    }
  }

  // Search ADEME RGE across all postal codes
  const rgeResults: ArtisanResult[] = []
  const seen = new Set<string>()

  if (hasRgeData) {
    const rgePromises = codesPostaux.slice(0, 8).map((cp) => searchAdemeRge(cp, domaines))
    const nested = await Promise.all(rgePromises)
    for (const batch of nested) {
      for (const r of batch) {
        if (r.siret && !seen.has(r.siret)) {
          seen.add(r.siret)
          rgeResults.push(r)
        }
      }
    }
  }

  let results: ArtisanResult[] = [...rgeResults]

  // Fallback: search Recherche Entreprises if few/no RGE results
  if (!rgeOnly && results.length < 5 && nafCodes.length > 0) {
    const fallback = await searchEntreprises(codePostal, nafCodes)
    for (const r of fallback) {
      if (r.siret && !seen.has(r.siret)) {
        seen.add(r.siret)
        results.push(r)
      }
    }
  }

  if (rgeOnly) {
    results = results.filter((r) => r.rge)
  }

  return NextResponse.json({
    results: results.slice(0, 30),
    total: results.length,
    codesPostaux,
    rgeCount: rgeResults.length,
  })
}
