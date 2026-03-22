import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// NAF codes (format "43.21A") grouped by work type
// These match the activite_principale field in Recherche Entreprises API
export const TYPE_TO_NAF: Record<string, string[]> = {
  'electricite':    ['43.21A'],
  'plomberie':      ['43.22A'],
  'chauffage':      ['43.22B'],
  'pac':            ['43.22B'],
  'isolation':      ['43.29A'],
  'platerie':       ['43.31Z'],
  'fenetres':       ['43.32A', '43.32B', '43.32C'],
  'carrelage':      ['43.33Z'],
  'peinture':       ['43.34Z'],
  'finitions':      ['43.39Z'],
  'charpente':      ['43.91A'],
  'toiture':        ['43.91A', '43.91B'],
  'etancheite':     ['43.99A'],
  'ravalement':     ['43.99B'],
  'maconnerie':     ['43.99C', '41.20A', '41.20B'],
  'construction':   ['41.20A', '41.20B'],
  'extension':      ['41.20A', '41.20B'],
  'cuisine':        ['43.32B', '43.39Z'],
  'salle-de-bain':  ['43.22A', '43.33Z'],
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
    'NN': '', '00': '0 salarié', '01': '1-2 salariés',
    '02': '3-5 salariés', '03': '6-9 salariés', '11': '10-19 salariés',
    '12': '20-49 salariés', '21': '50-99 salariés',
    '22': '100-199 salariés', '31': '200-249 salariés', '32': '250-499 salariés',
  }
  return map[tranche] || ''
}

/** Resolve a postal code → list of INSEE commune codes (one CP can cover several communes) */
async function getCommuneCodesForPostalCode(codePostal: string): Promise<string[]> {
  // Primary: geo.api.gouv.fr
  try {
    const res = await fetch(
      `https://geo.api.gouv.fr/communes?codePostal=${codePostal}&fields=code&limit=10`,
      { next: { revalidate: 86400 } },
    )
    if (res.ok) {
      const data = await res.json()
      const codes = (data as { code: string }[]).map(c => c.code).filter(Boolean)
      if (codes.length > 0) return codes
    }
  } catch { /* fallback below */ }
  // Fallback: api-adresse.data.gouv.fr
  try {
    const res = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${codePostal}&type=municipality&autocomplete=0&limit=10`,
      { next: { revalidate: 86400 } },
    )
    if (res.ok) {
      const data = await res.json()
      const codes = (data.features || [])
        .map((f: any) => f.properties?.citycode)
        .filter(Boolean)
      return [...new Set<string>(codes)]
    }
  } catch { /* ignore */ }
  return []
}

/** Get INSEE codes of communes within a radius of lat/lon */
async function getNearbyCommuneCodes(lat: string, lon: string, rayonKm: number): Promise<string[]> {
  try {
    const url = `https://geo.api.gouv.fr/communes?lat=${lat}&lon=${lon}&distance=${rayonKm * 1000}&fields=code&limit=40&boost=population`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (res.ok) {
      const data = await res.json()
      const codes = (data as { code: string }[]).map(c => c.code).filter(Boolean)
      if (codes.length > 0) return codes
    }
  } catch { /* fallback below */ }
  // Fallback: api-adresse.data.gouv.fr reverse geocode + nearby
  try {
    const url = `https://api-adresse.data.gouv.fr/search/?q=${lat},${lon}&type=municipality&limit=20`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (res.ok) {
      const data = await res.json()
      return (data.features || []).map((f: any) => f.properties?.citycode).filter(Boolean)
    }
  } catch { /* ignore */ }
  return []
}

function parseApiResult(r: any, codePostalFallback: string): ArtisanResult {
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
    codePostal: siege.code_postal || codePostalFallback,
    ville: siege.libelle_commune || '',
    rge: rgeQualifications.length > 0,
    rgeQualifications,
    lat: siege.latitude ? parseFloat(siege.latitude) : undefined,
    lon: siege.longitude ? parseFloat(siege.longitude) : undefined,
    effectif: getEffectifLabel(r.tranche_effectif_salarie || siege.tranche_effectif_salarie || 'NN'),
  }
}

/** Search Recherche Entreprises by INSEE commune code */
async function searchByCommune(
  codeCommune: string,
  rgeOnly: boolean,
  nafCode: string | null,
  perPage = 25,
  page = 1,
): Promise<{ results: ArtisanResult[]; total: number }> {
  // NOTE: parameter order matters for this API — section_activite_principale must come
  // before etat_administratif or the API returns 400.
  const params = new URLSearchParams({ code_commune: codeCommune })

  if (nafCode) {
    params.set('activite_principale', nafCode)
  } else {
    params.set('section_activite_principale', 'F') // Section F = Construction
  }

  if (rgeOnly) {
    params.set('est_rge', 'true')
  }

  // per_page max is 25; etat_administratif must come after per_page+page (API quirk)
  params.set('per_page', String(Math.min(perPage, 25)))
  params.set('page', String(page))
  params.set('etat_administratif', 'A')

  const url = `https://recherche-entreprises.api.gouv.fr/search?${params}`
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return { results: [], total: 0 }
    const data = await res.json()
    if (!data.results) return { results: [], total: 0 }
    return {
      results: data.results.map((r: any) => parseApiResult(r, codeCommune)),
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
  const codeCommune = searchParams.get('codeCommune') || '' // INSEE code, preferred
  const lat = searchParams.get('lat') || ''
  const lon = searchParams.get('lon') || ''
  const rayon = parseInt(searchParams.get('rayon') || '20', 10)
  const rgeOnly = searchParams.get('rgeOnly') === '1'

  if (!codePostal && !codeCommune) {
    return NextResponse.json({ error: 'Code postal manquant' }, { status: 400 })
  }

  const typeNafs = type && TYPE_TO_NAF[type] ? TYPE_TO_NAF[type] : null
  const primaryNaf = typeNafs?.[0] ?? null

  // --- Resolve commune codes ---
  // If client already sent codeCommune, use it. Otherwise resolve from postal code.
  let mainCommuneCodes: string[] = codeCommune
    ? [codeCommune]
    : await getCommuneCodesForPostalCode(codePostal)

  // Fallback: if geo lookup failed, fall back to postal code search directly
  // (won't happen often, but avoids empty results)
  const useFallbackPostalCode = mainCommuneCodes.length === 0

  // Get nearby commune codes for radius search
  let nearbyCommuneCodes: string[] = []
  if (lat && lon && rayon > 5) {
    nearbyCommuneCodes = await getNearbyCommuneCodes(lat, lon, rayon)
  }

  // Merge: main communes first, then nearby — deduplicated, max 20 communes total
  const allCommuneCodes = [...new Set([...mainCommuneCodes, ...nearbyCommuneCodes])].slice(0, 20)

  // --- Build search promises ---
  const searchPromises: Promise<{ results: ArtisanResult[]; total: number }>[] = []

  if (useFallbackPostalCode) {
    // Fallback: use code_postal directly — this path is rarely hit (when geo API fails)
    // section_activite_principale must come before etat_administratif (API quirk)
    const fallbackParams = new URLSearchParams({ code_postal: codePostal })
    if (primaryNaf) fallbackParams.set('activite_principale', primaryNaf)
    else fallbackParams.set('section_activite_principale', 'F')
    if (rgeOnly) fallbackParams.set('est_rge', 'true')
    fallbackParams.set('per_page', '25')
    fallbackParams.set('page', '1')
    fallbackParams.set('etat_administratif', 'A')
    searchPromises.push(
      fetch(`https://recherche-entreprises.api.gouv.fr/search?${fallbackParams}`, { next: { revalidate: 3600 } })
        .then(r => r.ok ? r.json() : { results: [], total_results: 0 })
        .then(d => ({
          results: (d.results || []).map((r: any) => parseApiResult(r, codePostal)),
          total: d.total_results || 0,
        }))
        .catch(() => ({ results: [], total: 0 })),
    )
  } else {
    // Main path: one call per commune code
    // Specific type → higher per_page on first communes, lower on the rest
    // Generic section=F → lower per_page to cap results
    // API hard limit: per_page ≤ 25
    const perPageMain = 25
    const perPageOther = 15

    allCommuneCodes.forEach((code, i) => {
      searchPromises.push(searchByCommune(code, rgeOnly, primaryNaf, i === 0 ? perPageMain : perPageOther, 1))
    })
  }

  const nested = await Promise.all(searchPromises)

  // Fetch page 2 for the first commune if it has many more results (specific type only)
  if (!useFallbackPostalCode && primaryNaf && allCommuneCodes.length > 0 && nested[0].total > 25) {
    const page2 = await searchByCommune(allCommuneCodes[0], rgeOnly, primaryNaf, 25, 2)
    nested.push(page2)
  }

  // Deduplicate by SIRET/SIREN
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
    results: all.slice(0, 100),
    total: all.length,
    rgeCount,
    communeCodes: allCommuneCodes,
  })
}
