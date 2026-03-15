import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const type = searchParams.get('type') || ''
  const surface = searchParams.get('surface') || ''
  const region = searchParams.get('region') || ''
  const logement = searchParams.get('logement') || ''
  const gamme = searchParams.get('gamme') || ''

  if (!type || !surface || !region) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Service IA non configuré' }, { status: 503 })
  }

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const prompt = `Tu es un expert en prix de travaux en France. L'utilisateur veut faire : ${type}, surface/quantité : ${surface}m², région : ${region}, logement : ${logement}, gamme : ${gamme}.

Retourne UNIQUEMENT ce JSON valide (sans markdown, sans backticks) avec des prix en € total :
{
  "fourchette_basse": number,
  "fourchette_haute": number,
  "prix_moyen": number,
  "unite": "€ total",
  "facteurs_variation": ["facteur 1", "facteur 2", "facteur 3", "facteur 4"],
  "conseils": ["conseil 1", "conseil 2", "conseil 3"],
  "alerte_si_trop_bas": "message court si devis < fourchette_basse",
  "alerte_si_trop_haut": "message court si devis > fourchette_haute"
}

Base-toi sur les prix réels du marché français 2024-2025 (main d'œuvre + matériaux inclus). Tiens compte de la région (Île-de-France est 20-30% plus cher), du type de logement et de la gamme choisie. Sois précis et réaliste.`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    const clean = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const result = JSON.parse(clean)

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('[simulateur-prix] Erreur:', err?.message || err)
    return NextResponse.json({ error: `Erreur : ${err?.message || 'Erreur inconnue'}` }, { status: 500 })
  }
}
