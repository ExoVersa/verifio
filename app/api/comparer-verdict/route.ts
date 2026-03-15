import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const nom = searchParams.get('nom') || ''
  const statut = searchParams.get('statut') || ''
  const score = searchParams.get('score') || ''
  const dateCreation = searchParams.get('dateCreation') || ''
  const rge = searchParams.get('rge') || 'false'
  const procedureCollective = searchParams.get('procedureCollective') || 'false'
  const effectif = searchParams.get('effectif') || ''
  const conventionCollective = searchParams.get('conventionCollective') || ''

  if (!nom) {
    return NextResponse.json({ error: 'Paramètre nom manquant' }, { status: 400 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ verdict: null }, { status: 200 })
  }

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const ans = dateCreation
      ? Math.floor((Date.now() - new Date(dateCreation).getTime()) / (1000 * 60 * 60 * 24 * 365))
      : null

    const prompt = `Tu es un expert en vérification d'artisans français. Voici les données de l'entreprise "${nom}" :
- Statut : ${statut}
- Score de confiance : ${score}/100
- Ancienneté : ${ans !== null ? `${ans} an${ans > 1 ? 's' : ''}` : 'inconnue'}
- Certifié RGE : ${rge === 'true' ? 'oui' : 'non'}
- Procédure collective : ${procedureCollective === 'true' ? 'oui (alerte !)' : 'non'}
- Effectif : ${effectif || 'non renseigné'}
- Convention collective : ${conventionCollective || 'non déclarée'}

En 1 phrase courte (max 20 mots), donne un verdict clair et objectif sur la fiabilité de cet artisan. Sois direct et utile pour un particulier. Ne commence pas par "Cet artisan" ni par le nom de l'entreprise. Réponds uniquement la phrase, sans ponctuation finale.`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 80,
      messages: [{ role: 'user', content: prompt }],
    })

    const verdict = message.content[0].type === 'text' ? message.content[0].text.trim() : null
    return NextResponse.json({ verdict })
  } catch (err: any) {
    console.error('[comparer-verdict] Erreur:', err?.message || err)
    return NextResponse.json({ verdict: null })
  }
}
