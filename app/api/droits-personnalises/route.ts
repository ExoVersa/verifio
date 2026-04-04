import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { formeJuridique, codeNaf, activite, dateCreation, score, rge, bodacc, effectif } = await req.json()

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ droits: [] })
    }

    const anciennete = dateCreation
      ? Math.floor((Date.now() - new Date(dateCreation).getTime()) / (1000 * 60 * 60 * 24 * 365))
      : null

    const prompt = `Tu es un expert juridique en droit de la construction et de la consommation en France.

Un particulier s'apprête à signer un contrat avec cet artisan :
- Forme juridique : ${formeJuridique || 'inconnue'}
- Activité : ${activite || 'inconnue'} (code NAF : ${codeNaf || 'inconnu'})
- Ancienneté : ${anciennete !== null ? `${anciennete} an(s)` : 'inconnue'}
- Score de fiabilité : ${score}/100
- Certifié RGE : ${rge?.certifie ? `oui (${rge.domaines?.join(', ')})` : 'non'}
- Procédure collective BODACC : ${bodacc?.procedureCollective ? 'oui' : 'non'}
- Effectif : ${effectif || 'non renseigné'}

Génère exactement 2 ou 3 droits ou points de vigilance SPÉCIFIQUES à ce profil que le particulier doit absolument connaître avant de signer. Ces droits doivent être différents des 4 droits universels déjà affichés (garantie décennale, devis écrit, acompte 30%, PV réception).

Réponds UNIQUEMENT en JSON strict, sans markdown, sans backticks :
[
  {
    "titre": "Titre court et direct (max 6 mots)",
    "badge": "Label court (max 3 mots)",
    "badgeType": "danger" | "warning" | "info" | "success",
    "texte": "Explication pratique et actionnable en 2-3 phrases max. Tutoyer le lecteur."
  }
]

Exemples de droits spécifiques pertinents selon le contexte :
- Auto-entrepreneur → plafond de CA, absence de garantie décennale obligatoire dans certains cas
- Entreprise < 2 ans → risque de défaillance, demander des références récentes
- Certifié RGE → droits aux aides MaPrimeRénov', vérifier la validité de la certification
- Procédure collective → ne pas verser d'acompte, contacter le mandataire
- Électricien (NAF 4321A) → conformité NF C 15-100, attestation Consuel obligatoire
- Couvreur/charpentier → décennale critique, vérifier la couverture pour les dommages structurels
- Plombier chauffagiste → attestation RGE si travaux éligibles CEE, garantie biennale équipements
- Score < 50 → vigilance renforcée, ne pas verser plus de 10% avant démarrage
- Non employeur → risque de sous-traitance non déclarée, demander la liste des intervenants`

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const droits = JSON.parse(text.trim())

    return NextResponse.json({ droits })
  } catch (e) {
    console.error('droits-personnalises error:', e)
    return NextResponse.json({ droits: [] })
  }
}
