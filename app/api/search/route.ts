import { NextRequest, NextResponse } from 'next/server'
import type { SearchResult, Alert } from '@/types'

// Appel à l'API Recherche d'Entreprises (open data, sans clé)
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

// Appel à l'API RGE de l'ADEME (open data)
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

// Calcul du score de confiance (0–100)
function calculateScore(entreprise: any, rgeData: any): { score: number; alerts: Alert[] } {
  let score = 50
  const alerts: Alert[] = []

  // Statut actif
  if (entreprise.etat_administratif === 'A') {
    score += 15
  } else {
    score -= 30
    alerts.push({
      type: 'danger',
      message: 'Entreprise fermée ou en cessation d\'activité',
    })
  }

  // Ancienneté
  const dateCreation = entreprise.date_creation
  if (dateCreation) {
    const years = (Date.now() - new Date(dateCreation).getTime()) / (1000 * 60 * 60 * 24 * 365)
    if (years < 1) {
      score -= 15
      alerts.push({
        type: 'warn',
        message: `Entreprise très récente (créée il y a moins d'un an)`,
      })
    } else if (years >= 3) {
      score += 10
    }
  }

  // Capital social
  const capital = entreprise.capital_social
  if (capital !== undefined && capital !== null) {
    if (capital < 1000) {
      alerts.push({
        type: 'warn',
        message: `Capital social très faible (${capital.toLocaleString('fr-FR')} €)`,
      })
      score -= 5
    } else if (capital >= 10000) {
      score += 5
    }
  }

  // Certifications RGE
  const rgeLines = rgeData?.results || rgeData?.data || []
  if (rgeLines.length > 0) {
    score += 15
    const domaines = [...new Set(rgeLines.map((r: any) => r.domaine || r.domaine_travaux).filter(Boolean))]
    alerts.push({
      type: 'safe',
      message: `Certifié RGE — ${domaines.length} domaine(s) : ${domaines.slice(0, 2).join(', ')}`,
    })
  }

  // NAF bâtiment
  const naf = entreprise.activite_principale || ''
  const isBatiment = naf.startsWith('41') || naf.startsWith('42') || naf.startsWith('43')
  if (isBatiment) score += 5

  // Borne le score
  score = Math.max(0, Math.min(100, score))

  // Message selon score
  if (score >= 70) {
    alerts.unshift({ type: 'safe', message: 'Profil globalement rassurant' })
  } else if (score >= 45) {
    alerts.unshift({ type: 'warn', message: 'Quelques points de vigilance' })
  } else {
    alerts.unshift({ type: 'danger', message: 'Profil à risque — vérifiez avant de signer' })
  }

  return { score, alerts }
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')?.trim()
  if (!query || query.length < 2) {
    return NextResponse.json({ error: 'Saisissez au moins 2 caractères.' }, { status: 400 })
  }

  try {
    const data = await fetchEntreprise(query)
    const results = data.results || []

    if (results.length === 0) {
      return NextResponse.json({ error: 'Aucune entreprise trouvée. Essayez avec le SIRET.' }, { status: 404 })
    }

    // On prend le premier résultat
    const e = results[0]
    const siege = e.siege || e

    // Récupération du SIRET du siège
    const siret = siege.siret || e.siret

    // Fetch RGE en parallèle
    const rgeData = siret ? await fetchRGE(siret) : null

    // Calcul du score
    const { score, alerts } = calculateScore({ ...e, ...siege }, rgeData)

    const result: SearchResult = {
      siret: siret || '',
      siren: e.siren || '',
      nom: e.nom_complet || e.nom_raison_sociale || 'Entreprise inconnue',
      statut: siege.etat_administratif === 'A' ? 'actif' : 'fermé',
      formeJuridique: e.nature_juridique || '',
      dateCreation: siege.date_creation || e.date_creation || '',
      adresse: [siege.numero_voie, siege.type_voie, siege.libelle_voie, siege.code_postal, siege.libelle_commune]
        .filter(Boolean).join(' '),
      activite: siege.libelle_activite_principale || e.libelle_activite_principale || '',
      capitalSocial: e.capital_social,
      score,
      alerts,
      rge: {
        certifie: (rgeData?.results || rgeData?.data || []).length > 0,
        domaines: (rgeData?.results || rgeData?.data || [])
          .map((r: any) => r.domaine || r.domaine_travaux)
          .filter(Boolean),
        organismes: (rgeData?.results || rgeData?.data || [])
          .map((r: any) => r.organisme)
          .filter(Boolean),
      },
      autresResultats: results.slice(1, 4).map((r: any) => ({
        siren: r.siren,
        nom: r.nom_complet || r.nom_raison_sociale,
        adresse: [r.siege?.code_postal, r.siege?.libelle_commune].filter(Boolean).join(' '),
      })),
    }

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('Search error:', err)
    return NextResponse.json({ error: 'Erreur lors de la recherche. Réessayez.' }, { status: 500 })
  }
}
