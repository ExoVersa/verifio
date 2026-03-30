import { NextRequest, NextResponse } from 'next/server'

export interface SyntheseInput {
  nom: string
  siret: string
  score: number
  statut: string
  dateCreation: string
  formeJuridique: string
  effectif: string
  certifieRge: boolean
  domainesRge: string[]
  dirigeants: { nom: string; qualite: string; anneeNaissance?: string }[]
  nbAnnoncesBodacc: number
  proceduresCollectives: number
}

export interface SyntheseResult {
  resume: string
  points_forts: string[]
  points_attention: string[]
  recommandation?: 'FIABLE' | 'VIGILANCE' | 'RISQUE'
  recommandation_texte?: string
  verdict?: 'FIABLE' | 'VIGILANCE' | 'RISQUE'
  verdict_titre?: string
  verdict_explication?: string
  actions_recommandees?: string[]
  score_explication?: string
}

const FALLBACK: SyntheseResult = {
  resume: 'Analyse indisponible momentanément. Consultez les données ci-dessous pour évaluer cet artisan.',
  points_forts: [],
  points_attention: [],
  recommandation: 'VIGILANCE',
  recommandation_texte: 'Vérifiez manuellement les informations disponibles avant de vous engager.',
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(FALLBACK)
  }

  let input: SyntheseInput
  try {
    input = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system: `Tu es un expert en analyse juridique et financière d'entreprises du bâtiment en France. Tu analyses les données officielles d'un artisan pour aider un particulier à décider s'il peut lui faire confiance avant de signer un contrat de travaux. Tu dois être précis, direct et actionnable. Tu parles à un particulier non-expert. Réponds uniquement en JSON strict, sans markdown, sans backticks, sans texte avant ou après le JSON.`,
      messages: [
        {
          role: 'user',
          content: `Analyse cet artisan et génère une synthèse structurée en JSON avec exactement ces champs :
{
  "resume": "3-4 phrases. Présente l'entreprise (forme juridique, ancienneté, dirigeant), son score de fiabilité avec une explication chiffrée, et une conclusion directe sur la confiance qu'on peut lui accorder.",
  "verdict": "FIABLE" | "VIGILANCE" | "RISQUE",
  "verdict_titre": "Titre court et direct du verdict (ex: 'Artisan sérieux, quelques points à vérifier')",
  "verdict_explication": "2-3 phrases expliquant précisément POURQUOI ce verdict. Cite les éléments concrets du dossier.",
  "points_forts": ["Point fort concret et spécifique", "..."],
  "points_attention": ["Point d'attention concret avec explication du risque", "..."],
  "actions_recommandees": ["Action concrète à faire AVANT de signer", "...", "..."],
  "score_explication": "1 phrase expliquant le score chiffré : quels critères ont contribué positivement et lesquels ont pénalisé."
}
Règles : si aucun point d'attention retourner []. Les points doivent être spécifiques aux données fournies, jamais génériques. Les actions doivent être pratiques et réalisables par un particulier. Ne jamais inventer des données absentes du JSON fourni.
Données de l'artisan : ${JSON.stringify(input)}`,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const parsed = JSON.parse(cleaned) as SyntheseResult
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json(FALLBACK)
  }
}
