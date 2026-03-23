import { NextRequest, NextResponse } from 'next/server'
import type { SearchCandidate } from '@/types'

const FORMES_JURIDIQUES: Record<string, string> = {
  '1000': 'EI', '1100': 'Artisan-commerçant', '1200': 'Commerçant', '1300': 'Artisan',
  '5308': 'EURL', '5499': 'SARL', '5520': 'SAS', '5710': 'SAS', '5720': 'SASU',
  '5522': 'SA', '5410': 'SA', '5415': 'SA', '5485': 'SELAS', '5570': 'SELAS',
  '1400': 'Officier public', '2110': 'Indivision',
}

function fj(code: string): string {
  return FORMES_JURIDIQUES[code] || code
}

async function checkRge(siren: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://data.ademe.fr/data-fair/api/v1/datasets/liste-des-entreprises-rge-2/lines?q=${siren}&size=1`,
      { next: { revalidate: 86400 } }
    )
    if (!res.ok) return false
    const data = await res.json()
    return (data.total || 0) > 0
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const q = sp.get('q')?.trim() || ''
  const codePostal = sp.get('code_postal')?.trim() || ''
  const departement = sp.get('departement')?.trim() || ''
  const rge = sp.get('rge') === '1' || sp.get('rge') === 'true'
  const statut = sp.get('statut') || '' // 'A' | 'F' | ''
  const anciennete = sp.get('anciennete') || '' // '2' | '5' | '10' | ''
  const page = Math.max(1, parseInt(sp.get('page') || '1'))
  const perPage = 20

  if (!q && !codePostal && !departement) {
    return NextResponse.json({ results: [], total: 0, page: 1, hasMore: false })
  }

  try {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (codePostal) params.set('code_postal', codePostal)
    if (departement) params.set('departement', departement)
    params.set('per_page', String(perPage))
    params.set('page', String(page))

    const url = `https://recherche-entreprises.api.gouv.fr/search?${params}`
    const res = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' })

    if (!res.ok) {
      return NextResponse.json({ results: [], total: 0, page, hasMore: false, error: true })
    }

    const data = await res.json()
    let rawResults: any[] = data.results || []
    const total: number = data.total_results ?? rawResults.length

    // SIRET exact match → redirect signal
    const normalizedQ = q.replace(/\s/g, '')
    if (/^\d{9,14}$/.test(normalizedQ) && rawResults.length === 1) {
      return NextResponse.json({ isExact: true, siret: normalizedQ })
    }

    // Server-side statut filter
    if (statut === 'A' || statut === 'F') {
      rawResults = rawResults.filter(
        (e) => (e.siege?.etat_administratif || e.etat_administratif) === statut
      )
    }

    // Server-side ancienneté filter
    if (anciennete) {
      const cutoff = new Date()
      cutoff.setFullYear(cutoff.getFullYear() - Number(anciennete))
      rawResults = rawResults.filter((e) => {
        const d = e.siege?.date_creation || e.date_creation
        return d ? new Date(d) <= cutoff : false
      })
    }

    let candidates: (SearchCandidate & { rge?: boolean })[] = rawResults.map((e: any) => {
      const siege = e.siege || {}
      return {
        siret: siege.siret || e.siret || '',
        siren: e.siren || '',
        nom: e.nom_complet || e.nom_raison_sociale || '',
        statut: siege.etat_administratif === 'A' ? 'actif' : 'fermé',
        formeJuridique: fj(e.nature_juridique || ''),
        formeJuridiqueCode: e.nature_juridique || '',
        ville: siege.libelle_commune || '',
        codePostal: siege.code_postal || '',
        codeNaf: siege.activite_principale || e.activite_principale || '',
        activite: siege.libelle_activite_principale || e.libelle_activite_principale || '',
        dateCreation: siege.date_creation || e.date_creation || undefined,
      }
    })

    // RGE filter via ADEME (parallel checks)
    if (rge && candidates.length > 0) {
      const checks = await Promise.allSettled(candidates.map((c) => checkRge(c.siren)))
      candidates = candidates
        .map((c, i) => ({
          ...c,
          rge: checks[i].status === 'fulfilled' && (checks[i] as PromiseFulfilledResult<boolean>).value,
        }))
        .filter((c) => c.rge)
    }

    const hasMore = page * perPage < total

    return NextResponse.json({ results: candidates, total, page, hasMore })
  } catch {
    return NextResponse.json({ results: [], total: 0, page, hasMore: false, error: true })
  }
}
