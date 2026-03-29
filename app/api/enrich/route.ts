import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const siret = searchParams.get('siret')
  const nom = searchParams.get('nom') || ''
  const codeNaf = searchParams.get('codeNaf') || ''
  const activite = searchParams.get('activite') || ''
  const dateCreation = searchParams.get('dateCreation') || ''
  const adresse = searchParams.get('adresse') || ''
  const score = searchParams.get('score') || ''
  const statut = searchParams.get('statut') || ''
  const rge = searchParams.get('rge') === 'true'
  const cc = searchParams.get('cc') || ''
  const alertes = searchParams.get('alertes') || ''

  if (!siret) return NextResponse.json({ aiSummary: null, aiChecklist: null })
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ aiSummary: null, aiChecklist: null })

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const ans = dateCreation
      ? Math.floor((Date.now() - new Date(dateCreation).getTime()) / (1000 * 60 * 60 * 24 * 365))
      : null

    const prompt = `Tu es un expert en vérification d'artisans et d'entreprises du bâtiment en France.
Analyse cette entreprise et génère une réponse JSON stricte (SANS markdown, SANS backticks).

Données :
- Nom : ${nom}
- SIRET : ${siret}
- Activité (NAF ${codeNaf}) : ${activite}
- Localisation : ${adresse}
- Ancienneté : ${ans !== null ? `${ans} an(s)` : 'inconnue'}
- Statut : ${statut}
- Score de confiance : ${score}/100
- Certifié RGE : ${rge ? 'Oui' : 'Non'}
- Convention collective : ${cc || 'Non déclarée'}
- Alertes détectées : ${alertes || 'Aucune'}

Génère exactement ce JSON :
{
  "resume": "2 à 3 phrases factuelles en français. Commence par un point fort de l'entreprise. Termine par le principal point de vigilance s'il y en a un, sinon confirme la fiabilité.",
  "checklist": [
    "Document ou vérification n°1 à demander avant de signer",
    "Document ou vérification n°2",
    "Document ou vérification n°3",
    "Document ou vérification n°4",
    "Document ou vérification n°5",
    "Document ou vérification n°6"
  ]
}

La checklist doit être adaptée au code NAF "${codeNaf}" (${activite}). Commence toujours par l'attestation d'assurance décennale (obligatoire BTP), puis le KBIS récent, puis les documents spécifiques au métier (habilitations, certifications, etc.). Sois concis et actionnable.`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    // Nettoie les éventuels blocs markdown
    const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(clean)

    return NextResponse.json({
      aiSummary: typeof parsed.resume === 'string' ? parsed.resume : null,
      aiChecklist: Array.isArray(parsed.checklist) ? parsed.checklist.slice(0, 7) : null,
    })
  } catch (err) {
    console.error('[/api/enrich] Erreur:', err)
    return NextResponse.json({ aiSummary: null, aiChecklist: null })
  }
}
