import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const TYPE_TO_DOMAINE: Record<string, string> = {
  'isolation': 'Isolation thermique',
  'toiture': 'Isolation thermique',
  'plomberie': 'Plomberie chauffage',
  'electricite': 'Électricité',
  'carrelage': '',
  'peinture': '',
  'maconnerie': '',
  'chauffage': 'Plomberie chauffage',
  'fenetres': 'Menuiseries',
  'salle-de-bain': 'Plomberie chauffage',
  'cuisine': '',
  'extension': '',
  'photovoltaique': 'Photovoltaïque',
  'pac': 'Pompe à chaleur',
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
      if (commune.codesPostaux) {
        cps.push(...commune.codesPostaux)
      }
    }
    return [...new Set(cps)].slice(0, 20)
  } catch {
    return []
  }
}

async function searchAdemeRge(codePostal: string, domaine: string): Promise<ArtisanResult[]> {
  const domaineFilter = domaine ? ` AND domaine:"${domaine}"` : ''
  const url = `https://data.ademe.fr/data-fair/api/v1/datasets/liste-des-entreprises-rge-2/lines?qs=code_postal_entreprise:"${codePostal}"${domaineFilter}&size=20&select=siret,nom_entreprise,adresse_entreprise,code_postal_entreprise,commune_entreprise,domaine,qualif_reconue`
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = await res.json()
    if (!data.results || !Array.isArray(data.results)) return []

    // Group by SIRET
    const bySiret = new Map<string, ArtisanResult>()
    for (const r of data.results) {
      const siret = r.siret || ''
      if (!siret) continue
      if (bySiret.has(siret)) {
        const existing = bySiret.get(siret)!
        if (r.domaine && !existing.domaines.includes(r.domaine)) {
          existing.domaines.push(r.domaine)
        }
        if (r.qualif_reconue && !existing.qualifications.includes(r.qualif_reconue)) {
          existing.qualifications.push(r.qualif_reconue)
        }
      } else {
        bySiret.set(siret, {
          siret,
          nom: r.nom_entreprise || 'Nom inconnu',
          adresse: r.adresse_entreprise || '',
          codePostal: r.code_postal_entreprise || codePostal,
          ville: r.commune_entreprise || '',
          rge: true,
          domaines: r.domaine ? [r.domaine] : [],
          qualifications: r.qualif_reconue ? [r.qualif_reconue] : [],
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
  const results: ArtisanResult[] = []
  // Try first NAF code only to avoid too many requests
  const naf = nafCodes[0]
  const url = `https://recherche-entreprises.api.gouv.fr/search?code_postal=${codePostal}&activite_principale=${naf}&etat_administratif=A&per_page=10`
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = await res.json()
    if (!data.results) return []
    for (const r of data.results) {
      const siege = r.siege || {}
      results.push({
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
      })
    }
  } catch {
    // ignore
  }
  return results
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

  const domaine = TYPE_TO_DOMAINE[type] || ''
  const nafCodes = TYPE_TO_NAF[type] || []

  // Get list of postal codes within radius
  let codesPostaux: string[] = [codePostal]
  if (lat && lon) {
    const nearby = await getCommunes(lat, lon, rayon)
    if (nearby.length > 0) {
      codesPostaux = [...new Set([codePostal, ...nearby])].slice(0, 15)
    }
  }

  // Search ADEME RGE for all postal codes
  const rgePromises = domaine
    ? codesPostaux.slice(0, 8).map((cp) => searchAdemeRge(cp, domaine))
    : []
  const rgeResultsNested = await Promise.all(rgePromises)
  const rgeResults = rgeResultsNested.flat()

  // Deduplicate by SIRET
  const seen = new Set<string>()
  const dedupedRge: ArtisanResult[] = []
  for (const r of rgeResults) {
    if (r.siret && !seen.has(r.siret)) {
      seen.add(r.siret)
      dedupedRge.push(r)
    }
  }

  let results = dedupedRge

  // If not rgeOnly and we have few results, add fallback entreprises
  if (!rgeOnly && results.length < 5 && nafCodes.length > 0) {
    const fallbackResults = await searchEntreprises(codePostal, nafCodes)
    for (const r of fallbackResults) {
      if (r.siret && !seen.has(r.siret)) {
        seen.add(r.siret)
        results.push(r)
      }
    }
  } else if (rgeOnly) {
    results = results.filter((r) => r.rge)
  }

  return NextResponse.json({
    results: results.slice(0, 30),
    total: results.length,
    codesPostaux,
    rgeCount: dedupedRge.length,
  })
}
