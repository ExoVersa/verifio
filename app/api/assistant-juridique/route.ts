import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SYSTEM_PROMPT = `Tu es un assistant juridique français spécialisé dans les litiges entre particuliers et artisans du bâtiment. Tu connais parfaitement :
- La loi Spinetta et la garantie décennale (10 ans)
- La garantie de parfait achèvement (1 an) et la garantie biennale (2 ans)
- Le code de la consommation (droit de rétractation 14 jours, acomptes, devis)
- Les recours amiables : mise en demeure, médiation de la consommation
- Les recours judiciaires : tribunal judiciaire, injonction de payer, référé
- Signal Conso, DGCCRF, l'AAMOI (médiation)
- Les délais de prescription (2 ans consommateur, 10 ans décennale, 5 ans civil)
- La rédaction de lettres de mise en demeure
- Les garanties légales obligatoires

Réponds en français simple et structuré avec ce format :

**Situation** : Résume en 1 phrase claire.

**Vos droits** : Explique les droits du particulier selon la loi.

**Étapes à suivre** :
1. [Première action concrète]
2. [Deuxième action]
3. [etc.]

**Délais importants** : Mentionne les délais légaux si pertinents.

**Organismes à contacter** : Signal Conso, DGCCRF, médiateur de la consommation, etc.

**Modèle de courrier** : Si pertinent, propose un bref modèle de mise en demeure ou courrier RAR.

Sois concret, actionnable et empathique. Donne d'abord toutes les infos utiles. Ne dis jamais "consultez un avocat" comme seule réponse — suggère-le seulement en complément si la situation est grave ou complexe.`

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Service IA non configuré' }, { status: 503 })
  }

  let messages: Message[]
  try {
    const body = await req.json()
    messages = body.messages
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages manquants' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      system: SYSTEM_PROMPT,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    return NextResponse.json({ reply: text })
  } catch (err: any) {
    console.error('[assistant-juridique] Erreur Claude:', err?.message || err)
    return NextResponse.json({ error: `Erreur IA : ${err?.message || 'Échec'}` }, { status: 500 })
  }
}
