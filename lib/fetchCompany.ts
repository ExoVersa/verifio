import type { SearchResult, Alert, BodaccInfo, BodaccAnnonce, Dirigeant, RGEInfo } from '@/types'
import { calculateScore } from '@/lib/score'

const FORMES_JURIDIQUES: Record<string, string> = {
  '1000': 'Entrepreneur individuel',
  '1100': 'Artisan-commerçant',
  '1200': 'Commerçant',
  '1300': 'Artisan',
  '1400': 'Officier public ou ministériel',
  '1500': 'Officier public et ministériel',
  '1600': 'Exploitant agricole',
  '1700': 'Agent commercial',
  '1800': 'Associé-gérant de société',
  '1900': 'Autre personne physique',
  '2110': 'Indivision entre personnes physiques',
  '2120': 'Indivision avec personne morale',
  '2210': 'Société créée de fait entre personnes physiques',
  '2220': 'Société créée de fait avec personne morale',
  '2310': 'Société en participation entre personnes physiques',
  '2320': 'Société en participation avec personne morale',
  '2385': 'Société en participation de professions libérales',
  '2400': 'Fiducie',
  '2700': 'Paroisse hors zone concordataire',
  '2900': 'Autre groupement de droit privé non doté de la personnalité morale',
  '3110': 'Représentation ou agence commerciale d\'état ou organisme public étranger',
  '3120': 'Société étrangère immatriculée au RCS',
  '3205': 'Organisation internationale',
  '3210': 'État, collectivité ou établissement public étranger',
  '3220': 'Société étrangère non immatriculée au RCS',
  '3290': 'Autre personne morale de droit étranger',
  '4110': 'Établissement public national à caractère industriel ou commercial doté d\'un comptable public',
  '4120': 'Établissement public national à caractère industriel ou commercial non doté d\'un comptable public',
  '4130': 'Exploitant public',
  '4140': 'Établissement public local à caractère industriel ou commercial',
  '4150': 'Régie d\'une collectivité locale à caractère industriel ou commercial',
  '4160': 'Institution Banque de France',
  '5191': 'Société de caution mutuelle',
  '5192': 'Société coopérative de banque populaire',
  '5193': 'Crédit mutuel',
  '5194': 'Caisse fédérale de crédit mutuel',
  '5195': 'Société anonyme coopérative d\'intérêt maritime',
  '5196': 'Caisse d\'épargne et de prévoyance',
  '5202': 'SARL nationale',
  '5203': 'SARL régionale',
  '5205': 'SARL d\'intérêt collectif',
  '5206': 'Société anonyme à directoire',
  '5207': 'Société anonyme à conseil d\'administration',
  '5208': 'Société anonyme mixte',
  '5209': 'Autre société anonyme',
  '5210': 'Société nominative',
  '5285': 'Société d\'exercice libéral à forme anonyme',
  '5290': 'Autre société anonyme',
  '5305': 'SARL coopérative à gérance majoritaire',
  '5306': 'SARL coopérative entre médecins',
  '5307': 'SARL coopérative d\'intérêt collectif',
  '5308': 'EURL (entreprise unipersonnelle à responsabilité limitée)',
  '5309': 'Autre SARL coopérative',
  '5385': 'Société d\'exercice libéral à responsabilité limitée',
  '5410': 'SA à directoire',
  '5415': 'SA à conseil d\'administration',
  '5422': 'Société coopérative ouvrière de production',
  '5426': 'SA coopérative d\'intérêt collectif',
  '5430': 'SA coopérative de consommation',
  '5440': 'SA coopérative artisanale',
  '5450': 'SA coopérative d\'intérêt maritime',
  '5460': 'SA coopérative de transport',
  '5485': 'Société d\'exercice libéral à forme anonyme',
  '5498': 'EURL (ancienne forme)',
  '5499': 'SARL',
  '5505': 'SAS (société par actions simplifiée) coopérative',
  '5510': 'SCA (société en commandite par actions)',
  '5515': 'SCOP SA',
  '5520': 'SAS',
  '5522': 'SA',
  '5525': 'SA coopérative',
  '5530': 'SCA',
  '5531': 'SA coopérative de HLM',
  '5532': 'SE (société européenne)',
  '5542': 'Société coopérative de construction',
  '5547': 'SA coopérative de crédit maritime',
  '5548': 'Caisse régionale de crédit agricole mutuel',
  '5551': 'SA coopérative de production de HLM',
  '5552': 'SA d\'HLM',
  '5553': 'SA coopérative de production',
  '5554': 'SA coopérative agricole',
  '5555': 'SA coopérative mixte',
  '5560': 'SA de gérance immobilière',
  '5570': 'SAS d\'exercice libéral',
  '5585': 'Société d\'exercice libéral par actions simplifiée',
  '5590': 'Autre SA',
  '5600': 'SA à conseil d\'administration',
  '5605': 'SA coopérative d\'HLM',
  '5610': 'SA non coopérative',
  '5615': 'Société d\'économie mixte',
  '5620': 'SAEM (société d\'aménagement et d\'équipement)',
  '5630': 'Organisme d\'HLM',
  '5640': 'Société coopérative de construction',
  '5650': 'Union d\'économie sociale',
  '5660': 'Caisse d\'épargne',
  '5670': 'Banque mutualiste ou coopérative',
  '5680': 'Organisme de financement',
  '5690': 'Autre SA non coopérative',
  '5710': 'SAS',
  '5720': 'SASU',
  '5785': 'Société d\'exercice libéral par actions simplifiée',
  '5790': 'Autre SAS',
  '5800': 'Société européenne',
  '6100': 'Caisse d\'épargne et de prévoyance',
  '6210': 'GIE (groupement d\'intérêt économique)',
  '6220': 'GEIE (groupement européen d\'intérêt économique)',
  '6316': 'CUMA (coopérative d\'utilisation de matériel agricole)',
  '6317': 'Société coopérative agricole',
  '6318': 'Union de sociétés coopératives agricoles',
  '6411': 'Société d\'assurance mutuelle',
  '6421': 'Mutuelle',
  '6422': 'Union de mutuelles',
  '6431': 'Institut de prévoyance',
  '6432': 'Union d\'instituts de prévoyance',
  '6441': 'Société de groupe d\'assurance mutuelle',
  '6451': 'Union de mutuelles du Code de la mutualité',
  '6453': 'Autre personne morale',
  '6454': 'Groupement de coopération sanitaire',
  '7111': 'Autorité constitutionnelle',
  '7112': 'Autorité administrative indépendante',
  '7113': 'Ministère',
  '7120': 'Service central d\'un ministère',
  '7150': 'Service du ministère de la Défense',
  '7160': 'Service déconcentré non régional d\'un ministère',
  '7171': 'Service déconcentré régional ou interrégional d\'un ministère',
  '7172': 'Service déconcentré départemental ou arrondissement d\'un ministère',
  '7179': 'Service déconcentré d\'un ministère',
  '7190': 'Service de l\'État',
  '7210': 'Commune',
  '7220': 'Département',
  '7225': 'Collectivité territoriale unique',
  '7229': 'Autre collectivité territoriale',
  '7230': 'Région',
  '7240': 'Commune associée ou fusionnée',
  '7312': 'Commune nouvelle',
  '7321': 'Établissement public local d\'enseignement',
  '7331': 'Syndicat de communes',
  '7340': 'Établissement public local',
  '7341': 'Établissement public local regroupant des communes',
  '7342': 'Établissement public local non spécialisé',
  '7343': 'Établissement public local médico-social',
  '7344': 'Établissement public local social',
  '7345': 'Établissement public local d\'hébergement',
  '7346': 'Établissement public local d\'hospitalisation',
  '7347': 'Autre établissement public local',
  '7348': 'Établissement public local de santé',
  '7349': 'Autre établissement public local sanitaire',
  '7351': 'Établissement public régional',
  '7352': 'Établissement public national',
  '7353': 'Groupement de communes',
  '7354': 'Établissement public local de coopération intercommunale',
  '7355': 'Commune de Polynésie française',
  '7356': 'Établissement public de coopération intercommunale',
  '7357': 'Communauté de communes',
  '7358': 'Communauté urbaine',
  '7359': 'Métropole',
  '7361': 'Organisme consulaire',
  '7362': 'Chambre de commerce et d\'industrie',
  '7363': 'Chambre des métiers',
  '7364': 'Chambre d\'agriculture',
  '7365': 'Organisme interprofessionnel',
  '7366': 'Organisme professionnel',
  '7367': 'Union professionnelle artisanale',
  '7371': 'Centre communal d\'action sociale',
  '7372': 'Centre intercommunal d\'action sociale',
  '7378': 'Autre établissement public administratif local',
  '7379': 'Autre établissement public local',
  '7381': 'Office public de l\'habitat',
  '7382': 'Établissement public local industriel et commercial',
  '7383': 'Établissement public local de santé',
  '7384': 'Établissement public local culturel',
  '7385': 'Établissement public local sportif',
  '7386': 'Établissement public local autre',
  '7389': 'Autre établissement public local',
  '7410': 'Groupement d\'intérêt public',
  '7430': 'Établissement public national administratif',
  '7450': 'Établissement public national non administratif',
  '7490': 'Autre établissement public national',
  '7510': 'Autorité administrative indépendante',
  '7520': 'Autorité publique indépendante',
  '7530': 'Établissement public national à caractère administratif',
  '7540': 'Établissement public national scientifique et technologique',
  '7550': 'Établissement public national culturel',
  '7560': 'Établissement public national d\'enseignement',
  '7570': 'Établissement public national sportif',
  '7580': 'Établissement public national de santé',
  '7590': 'Autre établissement public national',
  '7610': 'Caisse des dépôts et consignations',
  '7620': 'Organisme gérant un régime de protection sociale',
  '7630': 'Organisme mutualiste',
  '7640': 'Comité d\'entreprise',
  '7650': 'Organisme professionnel',
  '7670': 'Association syndicale autorisée',
  '7680': 'Association',
  '7690': 'Autre personne morale de droit public administratif',
  '8110': 'Établissement d\'enseignement sous contrat d\'association',
  '8120': 'Établissement d\'enseignement privé hors contrat',
  '8130': 'Établissement d\'enseignement à distance',
  '8140': 'Autre établissement d\'enseignement',
  '8210': 'Groupement agricole d\'exploitation en commun',
  '8220': 'Groupement foncier agricole',
  '8230': 'Groupement agricole foncier',
  '8290': 'Autre groupement de droit agricole',
  '8310': 'Association régie par la loi du 1er juillet 1901',
  '8311': 'Association non déclarée',
  '8321': 'Association déclarée d\'utilité publique',
  '8322': 'Association intermédiaire',
  '8323': 'Association syndicale de propriétaires',
  '8324': 'Association de copropriétaires',
  '8325': 'Syndicat de copropriétaires',
  '8329': 'Autre association déclarée',
  '8390': 'Autre association',
  '8410': 'Syndicat professionnel',
  '8420': 'Syndicat professionnel représentatif',
  '8450': 'Autre syndicat',
  '8470': 'Comité social et économique',
  '8480': 'Comité de groupe',
  '8490': 'Autre',
  '8510': 'Fondation',
  '8520': 'Fonds de dotation',
  '8530': 'Association d\'utilité publique',
  '8540': 'Fondation d\'utilité publique',
  '8550': 'Autre personne morale',
  '8590': 'Autre',
  '9110': 'Autre personne morale de droit privé',
  '9150': 'Autre personne morale',
  '9210': 'Groupement d\'intérêt économique et environnemental forestier',
  '9220': 'Association syndicale libre',
  '9221': 'Association foncière pastorale',
  '9230': 'Association foncière urbaine',
  '9240': 'Groupement d\'employeurs',
  '9260': 'Autre groupement de droit privé',
}

function libelleFormeJuridique(code: string): string {
  return FORMES_JURIDIQUES[code] || code
}

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
    url = `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(query)}&page=1&per_page=5`
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
    const url = `https://data.ademe.fr/data-fair/api/v1/datasets/liste-des-entreprises-rge-2/lines?q=${siret}&q_fields=siret&size=10`
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
      famille: r.familleavis || r.familleavis_lib || '',
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
      fetched: true,
    }
  } catch {
    return emptyBodacc()
  }
}

function emptyBodacc(): BodaccInfo {
  return { procedureCollective: false, annonces: [], changementDirigeantRecent: false, fetched: false }
}

function extractBodaccDetails(r: any): string {
  try {
    if (r.jugement) {
      const j = typeof r.jugement === 'string' ? JSON.parse(r.jugement) : r.jugement
      return j.nature || j.complementJugement || j.type || ''
    }
    if (r.acte) {
      const a = typeof r.acte === 'string' ? JSON.parse(r.acte) : r.acte
      return a.typeActe || a.categorieCreation || ''
    }
    if (r.modificationsgenerales) {
      const m = typeof r.modificationsgenerales === 'string' ? JSON.parse(r.modificationsgenerales) : r.modificationsgenerales
      const mods = Array.isArray(m?.modification) ? m.modification : (m?.modification ? [m.modification] : [])
      const desc = mods.map((x: any) => x?.descriptif || x?.type || '').filter(Boolean).join(', ')
      return desc || 'Modification générale'
    }
    if (r.depot) {
      const d = typeof r.depot === 'string' ? JSON.parse(r.depot) : r.depot
      return d?.categorieDepot || 'Dépôt de documents'
    }
    if (r.radiationaurcs) return 'Radiation au RCS'
  } catch {
    // ignore parse errors
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

/* calculateScore is now imported from lib/score.ts (single source of truth) */

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

  // Build RGEInfo for the canonical score function
  const rgeLines = rgeData?.results || rgeData?.data || []
  const rgeInfo: RGEInfo = {
    certifie: rgeLines.length > 0,
    domaines: rgeLines.map((r: any) => r.domaine || r.domaine_travaux).filter(Boolean),
    organismes: rgeLines.map((r: any) => r.organisme).filter(Boolean),
  }
  const dirigeants = parseDirigeants(e.dirigeants || [])

  // Compte les procédures collectives distinctes pour le score
  const nbProceduresCollectives = bodacc.annonces.filter(a =>
    a.famille?.toLowerCase().includes('procédure') &&
    (a.famille?.toLowerCase().includes('collective') || a.famille?.toLowerCase().includes('rétablissement')) ||
    a.type?.toLowerCase().includes('liquidation') ||
    a.type?.toLowerCase().includes('redressement') ||
    a.type?.toLowerCase().includes('sauvegarde')
  ).length

  // Score via fonction canonique (même logique que /api/recherche)
  const { score } = calculateScore({
    statut: siege.etat_administratif === 'A' ? 'actif' : 'fermé',
    dateCreation: siege.date_creation || e.date_creation,
    bodacc: {
      disponible: true,
      procedureCollective: bodacc.procedureCollective,
      nbProceduresCollectives,
    },
  })

  // Build alerts
  const alerts: Alert[] = []
  if (siege.etat_administratif !== 'A') {
    alerts.push({ type: 'danger', message: "Entreprise fermée ou en cessation d'activité" })
  }
  const dateStr = siege.date_creation || e.date_creation
  if (dateStr) {
    const yrs = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24 * 365)
    if (yrs < 1) alerts.push({ type: 'warn', message: "Entreprise très récente (créée il y a moins d'un an)" })
  }
  const capital = e.capital_social
  if (capital !== undefined && capital !== null && capital < 1000) {
    alerts.push({ type: 'warn', message: `Capital social très faible (${capital.toLocaleString('fr-FR')} €)` })
  }
  if (rgeInfo.certifie) {
    const domaines = [...new Set(rgeInfo.domaines)] as string[]
    alerts.push({ type: 'safe', message: `Certifié RGE — ${domaines.length} domaine(s) : ${domaines.slice(0, 2).join(', ')}` })
  }
  if (bodacc.procedureCollective) {
    alerts.push({ type: 'danger', message: `Procédure collective détectée : ${bodacc.typeProcedure || 'redressement/liquidation'}` })
  }
  if (bodacc.changementDirigeantRecent) {
    alerts.push({ type: 'warn', message: 'Changement de dirigeant dans les 6 derniers mois' })
  }
  if (score >= 70) alerts.unshift({ type: 'safe', message: 'Profil globalement rassurant' })
  else if (score >= 45) alerts.unshift({ type: 'warn', message: 'Quelques points de vigilance' })
  else alerts.unshift({ type: 'danger', message: 'Profil à risque — vérifiez avant de signer' })

  // Convention collective
  const cc: string | undefined =
    e.conventions_collectives?.[0]?.libelle ||
    siege.conventions_collectives?.[0]?.libelle ||
    undefined

  // Code NAF brut
  const nafCode: string = siege.activite_principale || e.activite_principale || ''

  // Alerte convention collective manquante pour le bâtiment
  const isBatiment = /^(41|42|43)/.test(nafCode)
  if (isBatiment && !cc) {
    alerts.push({ type: 'warn', message: 'Aucune convention collective déclarée (secteur bâtiment)' })
  }

  // Détection cession/succession via BODACC (Ventes et cessions)
  const threeYearsAgo = new Date()
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3)
  const cessionDetectee = bodacc.annonces.some((a) => a.famille === 'Ventes et cessions')
  const cessionRecente = bodacc.annonces.some(
    (a) => a.famille === 'Ventes et cessions' && a.date && new Date(a.date) > threeYearsAgo
  )
  if (cessionRecente) {
    alerts.push({ type: 'warn', message: 'Transfert de fonds de commerce détecté (< 3 ans)' })
  }

  return {
    siret: siret || '',
    siren,
    nom: e.nom_complet || e.nom_raison_sociale || 'Entreprise inconnue',
    statut: siege.etat_administratif === 'A' ? 'actif' : 'fermé',
    formeJuridique: libelleFormeJuridique(e.nature_juridique || ''),
    dateCreation: siege.date_creation || e.date_creation || '',
    adresse: [siege.numero_voie, siege.type_voie, siege.libelle_voie, siege.code_postal, siege.libelle_commune]
      .filter(Boolean).join(' '),
    activite: siege.libelle_activite_principale || e.libelle_activite_principale || '',
    codeNaf: nafCode,
    conventionCollective: cc,
    capitalSocial: e.capital_social,
    effectif: TRANCHES[siege.tranche_effectif_salarie || e.tranche_effectif_salarie] || undefined,
    score,
    alerts,
    rge: rgeInfo,
    dirigeants,
    bodacc,
    successionInfo: { cessionDetectee, cessionRecente },
    autresResultats: results.slice(1, 4).map((r: any) => ({
      siren: r.siren,
      nom: r.nom_complet || r.nom_raison_sociale,
      adresse: [r.siege?.code_postal, r.siege?.libelle_commune].filter(Boolean).join(' '),
    })),
  }
}
