import type { SearchResult, Alert, BodaccInfo, BodaccAnnonce, Dirigeant } from '@/types'

const TRANCHES: Record<string, string> = {
  NN: 'Non employeur',
  '00': '0 salarié',
  '01': '1 à 2 salariés',
  '02': '3 à 5 salariés',
  '03': '6 à 9 salariés',
  '11': '10 à 19 salariés',
  '12': '20 à 49 salariés',
  '21': '50 à 99 salariés',
  '22': '100 à 199 salariés',
  '31': '200 à 249 salariés',
  '32': '250 à 499 salariés',
  '41': '500 à 999 salariés',
  '42': '1 000 à 1 999 salariés',
  '51': '2 000 à 4 999 salariés',
  '52': '5 000 à 9 999 salariés',
  '53': '10 000 salariés et plus',
}

const TRANCHES_GT5 = ['03', '11', '12', '21', '22', '31', '32', '41', '42', '51', '52', '53']

async function fetchEntreprise(query: string) {
  const isSiret = /^\d{9,14}$/.test(query.replace(/\s/g, ''))
  let url: string

  if (isSiret) {
    const siret = query.replace(/\s/g, '')
    url = `https://recherche-entreprises.api.gouv.fr/search?q=${siret}&page=1&per_page=1`
  } else {
    url = `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(query)}&page=1&per_page=5&section_activite_principale=F`
  }

  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    next: { revalidate: 3600 },
  })

  if (!res.ok) throw new Error('API entreprises indisponible')
  return res.json()
}

async function fetchRGE(siret: string) {
  try {
    const url = `https://data.ademe.fr/data-fair/api/v1/datasets/liste-des-entreprises-rge-2/lines?siret=${siret}&size=10`
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

async function fetchBODACC(siren: string): Promise<BodaccInfo> {
  try {
    const url = `https://bodacc-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/annonces-commerciales/records?where=registre%20like%20%22${siren}%22&order_by=dateparution%20desc&limit=20`
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return emptyBodacc()
    const data = await res.json()
    const records: any[] = data.results || []

    const annonces: BodaccAnnonce[] = records.map((r: any) => ({
      id: r.id || '',
      date: r.dateparution || '',
      famille: r.familleavis_lib || '',
      type: r.typeavis_lib || '',
      tribunal: r.tribunal || undefined,
      details: extractBodaccDetails(r),
    }))

    const procedureRecord = records.find((r: any) =>
      r.familleavis_lib?.toLowerCase().includes('procédure') &&
      (r.familleavis_lib?.toLowerCase().includes('collective') ||
        r.familleavis_lib?.toLowerCase().includes('rétablissement'))
    )

    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const changementDirigeantRecent = records.some((r: any) => {
      if (!r.dateparution) return false
      const date = new Date(r.dateparution)
      if (date < sixMonthsAgo) return false
      const modif = r.modificationsgenerales
      if (!modif) return false
      const modifStr = typeof modif === 'string' ? modif.toLowerCase() : JSON.stringify(modif).toLowerCase()
      return modifStr.includes('administration') || modifStr.includes('gérant') ||
        modifStr.includes('président') || modifStr.includes('directeur')
    })

    return {
      procedureCollective: !!procedureRecord,
      typeProcedure: procedureRecord?.familleavis_lib,
      annonces,
      changementDirigeantRecent,
    }
  } catch {
    return emptyBodacc()
  }
}

function emptyBodacc(): BodaccInfo {
  return { procedureCollective: false, annonces: [], changementDirigeantRecent: false }
}

function extractBodaccDetails(r: any): string {
  if (r.jugement) {
    const j = typeof r.jugement === 'string' ? JSON.parse(r.jugement) : r.jugement
    return j.complementJugement || j.type || ''
  }
  if (r.acte) {
    const a = typeof r.acte === 'string' ? JSON.parse(r.acte) : r.acte
    return a.categorieCreation || ''
  }
  return ''
}

function parseDirigeants(raw: any[]): Dirigeant[] {
  if (!Array.isArray(raw)) return []
  return raw.slice(0, 5).map((d: any) => ({
    nom: d.nom || '',
    prenoms: d.prenoms || undefined,
    qualite: d.qualite || d.role || 'Dirigeant',
    type: d.type_dirigeant || '',
    anneeNaissance: d.annee_de_naissance || undefined,
  }))
}

function calculateScore(
  entreprise: any,
  rgeData: any,
  bodacc: BodaccInfo
): { score: number; alerts: Alert[] } {
  let score = 50
  const alerts: Alert[] = []

  if (entreprise.etat_administratif === 'A') {
    score += 15
  } else {
    score -= 30
    alerts.push({ type: 'danger', message: 'Entreprise fermée ou en cessation d\'activité' })
  }

  const dateCreation = entreprise.date_creation
  if (dateCreation) {
    const years = (Date.now() - new Date(dateCreation).getTime()) / (1000 * 60 * 60 * 24 * 365)
    if (years < 1) {
      score -= 15
      alerts.push({ type: 'warn', message: 'Entreprise très récente (créée il y a moins d\'un an)' })
    } else if (years >= 3) {
      score += 10
    }
  }

  const capital = entreprise.capital_social
  if (capital !== undefined && capital !== null) {
    if (capital < 1000) {
      alerts.push({ type: 'warn', message: `Capital social très faible (${capital.toLocaleString('fr-FR')} €)` })
      score -= 5
    } else if (capital >= 10000) {
      score += 5
    }
  }

  const rgeLines = rgeData?.results || rgeData?.data || []
  if (rgeLines.length > 0) {
    score += 15
    const domaines = [...new Set(rgeLines.map((r: any) => r.domaine || r.domaine_travaux).filter(Boolean))]
    alerts.push({ type: 'safe', message: `Certifié RGE — ${domaines.length} domaine(s) : ${(domaines as string[]).slice(0, 2).join(', ')}` })
  }

  const naf = entreprise.activite_principale || ''
  if (naf.startsWith('41') || naf.startsWith('42') || naf.startsWith('43')) score += 5

  if (bodacc.procedureCollective) {
    score -= 20
    alerts.push({ type: 'danger', message: `Procédure collective détectée : ${bodacc.typeProcedure || 'redressement/liquidation'}` })
  }

  if (bodacc.changementDirigeantRecent) {
    score -= 10
    alerts.push({ type: 'warn', message: 'Changement de dirigeant dans les 6 derniers mois' })
  }

  const tranche = entreprise.tranche_effectif_salarie
  if (tranche && TRANCHES_GT5.includes(tranche)) {
    score += 5
  }

  score = Math.max(0, Math.min(100, score))

  if (score >= 70) {
    alerts.unshift({ type: 'safe', message: 'Profil globalement rassurant' })
  } else if (score >= 45) {
    alerts.unshift({ type: 'warn', message: 'Quelques points de vigilance' })
  } else {
    alerts.unshift({ type: 'danger', message: 'Profil à risque — vérifiez avant de signer' })
  }

  return { score, alerts }
}

export async function fetchCompany(query: string): Promise<SearchResult> {
  const data = await fetchEntreprise(query)
  const results = data.results || []

  if (results.length === 0) {
    throw new Error('Aucune entreprise trouvée.')
  }

  const e = results[0]
  const siege = e.siege || e
  const siret = siege.siret || e.siret
  const siren = e.siren || siret?.slice(0, 9) || ''

  const [rgeData, bodacc] = await Promise.all([
    siret ? fetchRGE(siret) : Promise.resolve(null),
    siren ? fetchBODACC(siren) : Promise.resolve(emptyBodacc()),
  ])

  const { score, alerts } = calculateScore({ ...e, ...siege }, rgeData, bodacc)

  return {
    siret: siret || '',
    siren,
    nom: e.nom_complet || e.nom_raison_sociale || 'Entreprise inconnue',
    statut: siege.etat_administratif === 'A' ? 'actif' : 'fermé',
    formeJuridique: e.nature_juridique || '',
    dateCreation: siege.date_creation || e.date_creation || '',
    adresse: [siege.numero_voie, siege.type_voie, siege.libelle_voie, siege.code_postal, siege.libelle_commune]
      .filter(Boolean).join(' '),
    activite: siege.libelle_activite_principale || e.libelle_activite_principale || '',
    capitalSocial: e.capital_social,
    effectif: TRANCHES[siege.tranche_effectif_salarie || e.tranche_effectif_salarie] || undefined,
    score,
    alerts,
    rge: {
      certifie: (rgeData?.results || rgeData?.data || []).length > 0,
      domaines: (rgeData?.results || rgeData?.data || []).map((r: any) => r.domaine || r.domaine_travaux).filter(Boolean),
      organismes: (rgeData?.results || rgeData?.data || []).map((r: any) => r.organisme).filter(Boolean),
    },
    dirigeants: parseDirigeants(e.dirigeants || []),
    bodacc,
    autresResultats: results.slice(1, 4).map((r: any) => ({
      siren: r.siren,
      nom: r.nom_complet || r.nom_raison_sociale,
      adresse: [r.siege?.code_postal, r.siege?.libelle_commune].filter(Boolean).join(' '),
    })),
  }
}
