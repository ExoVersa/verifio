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
  recommandation: 'FIABLE' | 'VIGILANCE' | 'RISQUE'
  recommandation_texte: string
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
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: `Tu es un expert en analyse juridique et financière d'entreprises du bâtiment.
Tu analyses les données officielles d'un artisan pour aider un particulier à décider s'il peut lui faire confiance avant de signer un contrat.
Réponds toujours en JSON strict, sans markdown, sans backticks.`,
      messages: [
        {
          role: 'user',
          content: `Analyse cet artisan et génère une synthèse structurée en JSON :
{
  "resume": "2-3 phrases de synthèse générale rédigées",
  "points_forts": ["point 1", "point 2"],
  "points_attention": ["point 1"],
  "recommandation": "FIABLE" | "VIGILANCE" | "RISQUE",
  "recommandation_texte": "1 phrase expliquant la recommandation"
}
Si aucun point d'attention, retourner un tableau vide pour points_attention.
Données : ${JSON.stringify(input)}`,
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
