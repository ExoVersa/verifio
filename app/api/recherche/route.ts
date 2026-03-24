import { NextRequest, NextResponse } from 'next/server'
import { calculateScore } from '@/lib/score'
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

async function checkRge(siret: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://data.ademe.fr/data-fair/api/v1/datasets/liste-des-entreprises-rge-2/lines?q=${siret}&q_fields=siret&size=1`,
      { next: { revalidate: 86400 } }
    )
    if (!res.ok) return false
    const data = await res.json()
    return (data.total || 0) > 0
  } catch {
    return false
  }
}

/** Fetch minimal BODACC data needed for score calculation only */
async function checkBodacc(siren: string): Promise<{
  disponible: boolean
  collectives: number
}> {
  try {
    const url = `https://bodacc-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/annonces-commerciales/records?where=registre%20like%20%22${siren}%22&limit=20&fields=familleavis_lib`
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 86400 },
    })
    if (!res.ok) return { disponible: true, collectives: 0 }
    const data = await res.json()
    const records: Array<{ familleavis_lib: string }> = data.results || []
    const isCollective = (lib: string) =>
      lib?.toLowerCase().includes('procédure') &&
      (lib?.toLowerCase().includes('collective') || lib?.toLowerCase().includes('rétablissement'))
    return {
      disponible: true,
      collectives: records.filter(r => isCollective(r.familleavis_lib)).length,
    }
  } catch {
    return { disponible: true, collectives: 0 }
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

    // Build base candidates from INSEE data
    const baseData = rawResults.map((e: any) => {
      const siege = e.siege || {}
      return {
        siret: siege.siret || e.siret || '',
        siren: e.siren || '',
        nom: e.nom_complet || e.nom_raison_sociale || '',
        statut: (siege.etat_administratif === 'A' ? 'actif' : 'fermé') as 'actif' | 'fermé',
        formeJuridique: fj(e.nature_juridique || ''),
        formeJuridiqueCode: e.nature_juridique || '',
        ville: siege.libelle_commune || '',
        codePostal: siege.code_postal || '',
        codeNaf: siege.activite_principale || e.activite_principale || '',
        activite: siege.libelle_activite_principale || e.libelle_activite_principale || '',
        dateCreation: (siege.date_creation || e.date_creation || undefined) as string | undefined,
        dirigeantsRaw: Array.isArray(e.dirigeants) ? e.dirigeants as unknown[] : [],
      }
    })

    // RGE + BODACC checks in parallel (cached 24h) — same data as fetchCompany for consistent scores
    const [rgeChecks, bodaccChecks] = await Promise.all([
      Promise.allSettled(baseData.map((c) => checkRge(c.siret))),
      Promise.allSettled(baseData.map((c) => checkBodacc(c.siren))),
    ])

    let candidates: SearchCandidate[] = baseData.map((c, i) => {
      const isRge = rgeChecks[i].status === 'fulfilled' && (rgeChecks[i] as PromiseFulfilledResult<boolean>).value
      const bodacc = bodaccChecks[i].status === 'fulfilled'
        ? (bodaccChecks[i] as PromiseFulfilledResult<{ disponible: boolean; collectives: number }>).value
        : { disponible: true, collectives: 0 }
      const { score } = calculateScore({
        statut: c.statut,
        dateCreation: c.dateCreation,
        procedures: {
          disponible: bodacc.disponible,
          collectives: bodacc.collectives,
        },
      })
      return { siret: c.siret, siren: c.siren, nom: c.nom, statut: c.statut, formeJuridique: c.formeJuridique, formeJuridiqueCode: c.formeJuridiqueCode, ville: c.ville, codePostal: c.codePostal, codeNaf: c.codeNaf, activite: c.activite, dateCreation: c.dateCreation, rge: isRge, score }
    })

    // RGE filter: keep only certified companies
    if (rge) {
      candidates = candidates.filter((c) => c.rge)
    }

    const hasMore = page * perPage < total

    return NextResponse.json({ results: candidates, total, page, hasMore })
  } catch {
    return NextResponse.json({ results: [], total: 0, page, hasMore: false, error: true })
  }
}
