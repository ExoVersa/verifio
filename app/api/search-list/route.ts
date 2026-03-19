import { NextRequest, NextResponse } from 'next/server'
import type { SearchCandidate } from '@/types'

const FORMES_JURIDIQUES: Record<string, string> = {
  '1000': 'EI', '1100': 'Artisan-commerçant', '1200': 'Commerçant', '1300': 'Artisan',
  '5308': 'EURL', '5499': 'SARL', '5520': 'SAS', '5710': 'SAS', '5720': 'SASU',
  '5522': 'SA', '5410': 'SA', '5415': 'SA',
}

function fj(code: string): string {
  return FORMES_JURIDIQUES[code] || code
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')?.trim()
  if (!query || query.length < 2) {
    return NextResponse.json({ error: 'Saisissez au moins 2 caractères.' }, { status: 400 })
  }

  const isSiret = /^\d{9,14}$/.test(query.replace(/\s/g, ''))

  try {
    const url = isSiret
      ? `https://recherche-entreprises.api.gouv.fr/search?q=${query.replace(/\s/g, '')}&page=1&per_page=1`
      : `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(query)}&page=1&per_page=10`

    const res = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' })
    if (!res.ok) throw new Error('API indisponible')

    const data = await res.json()
    const results: any[] = data.results || []

    if (results.length === 0) {
      return NextResponse.json({ error: 'Aucune entreprise trouvée.' }, { status: 404 })
    }

    // SIRET exact → signal pour aller directement à la fiche
    if (isSiret && results.length === 1) {
      return NextResponse.json({ isExact: true, siret: query.replace(/\s/g, '') })
    }

    const candidates: SearchCandidate[] = results.map((e: any) => {
      const siege = e.siege || {}
      return {
        siret: siege.siret || e.siret || '',
        siren: e.siren || '',
        nom: e.nom_complet || e.nom_raison_sociale || '',
        statut: siege.etat_administratif === 'A' ? 'actif' : 'fermé',
        formeJuridique: fj(e.nature_juridique || ''),
        ville: siege.libelle_commune || '',
        codePostal: siege.code_postal || '',
        codeNaf: siege.activite_principale || e.activite_principale || '',
        activite: siege.libelle_activite_principale || e.libelle_activite_principale || '',
      }
    })

    return NextResponse.json({ isExact: false, candidates })
  } catch (err: any) {
    return NextResponse.json({ error: 'Erreur lors de la recherche.' }, { status: 500 })
  }
}
