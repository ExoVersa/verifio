import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const SYSTEM_PROMPT = `Tu es un expert juridique français spécialisé dans les contrats de travaux. Analyse ce devis et retourne UNIQUEMENT un JSON valide sans markdown ni backticks :
{
  "score": number (0-100),
  "verdict": "conforme" | "vigilance" | "suspect",
  "siret_trouve": string | null,
  "mentions_legales": [{ "label": string, "present": boolean, "detail": string }],
  "alertes": [{ "type": "danger" | "warn" | "info", "message": string }],
  "recommandations": string[],
  "prix_coherents": boolean | null,
  "commentaire_prix": string | null,
  "resume": string
}

Vérifie obligatoirement ces mentions légales (tableau de 9 éléments dans cet ordre) :
1. Numéro SIRET de l'entreprise
2. Assurance décennale (numéro de police + assureur)
3. Numéro de TVA intracommunautaire
4. Délai de rétractation 14 jours (obligatoire pour démarchage à domicile)
5. Acompte ≤ 30% du montant total
6. Coordonnées complètes de l'entreprise (adresse, téléphone)
7. Description détaillée des travaux
8. Matériaux et fournitures spécifiés
9. Délai d'exécution et date de validité du devis

Signale comme suspect si : devis vague, acompte > 30%, absence de décennale, pression temporelle ("offre valable 24h"), prix anormalement bas ou élevés, coordonnées incomplètes.
Score : 80-100 = conforme, 50-79 = vigilance, 0-49 = suspect.`

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Session invalide' }, { status: 401 })
  }

  const body = await req.json()
  const { fileBase64, mimeType, sessionId } = body

  if (!fileBase64 || !mimeType) {
    return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })
  }

  // Vérifier le quota gratuit
  const { data: existingAnalyses } = await supabase
    .from('devis_analyses')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)

  const hasFreeQuota = !existingAnalyses || existingAnalyses.length === 0

  // Vérifier le paiement Stripe si sessionId fourni
  const { default: Stripe } = await import('stripe')
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

  let isPaidAnalysis = false
  if (sessionId && !hasFreeQuota) {
    try {
      const stripeSession = await stripe.checkout.sessions.retrieve(sessionId)
      if (stripeSession.payment_status === 'paid') {
        const { data: usedSession } = await supabase
          .from('devis_analyses')
          .select('id')
          .eq('stripe_session_id', sessionId)
          .limit(1)
        if (!usedSession || usedSession.length === 0) {
          isPaidAnalysis = true
        }
      }
    } catch {
      // Session Stripe invalide
    }
  }

  // Bloquer et créer le checkout si ni gratuit ni payé
  if (!hasFreeQuota && !isPaidAnalysis) {
    const requestHost = req.headers.get('host')
    const requestProto = req.headers.get('x-forwarded-proto') || (requestHost?.includes('localhost') ? 'http' : 'https')
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (requestHost ? `${requestProto}://${requestHost}` : 'http://localhost:3000')

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          unit_amount: 990,
          product_data: {
            name: 'Analyse de devis IA — ArtisanCheck',
            description: 'Analyse complète : mentions légales, alertes, recommandations personnalisées.',
          },
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${baseUrl}/analyser-devis?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/analyser-devis`,
    })

    return NextResponse.json({ requiresPayment: true, checkoutUrl: checkoutSession.url })
  }

  // Analyser avec Claude
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Service IA non configuré' }, { status: 503 })
  }

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const fileContent = mimeType === 'application/pdf'
      ? {
          type: 'document' as const,
          source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: fileBase64 },
        }
      : {
          type: 'image' as const,
          source: { type: 'base64' as const, media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/webp', data: fileBase64 },
        }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [
          fileContent,
          { type: 'text', text: 'Analyse ce devis et retourne le JSON demandé.' },
        ],
      }],
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonText = rawText.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
    const analysis = JSON.parse(jsonText)

    // Croiser avec la fiche entreprise si SIRET trouvé
    let company = null
    if (analysis.siret_trouve) {
      try {
        const requestHost = req.headers.get('host')
        const requestProto = req.headers.get('x-forwarded-proto') || (requestHost?.includes('localhost') ? 'http' : 'https')
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (requestHost ? `${requestProto}://${requestHost}` : 'http://localhost:3000')
        const searchRes = await fetch(`${baseUrl}/api/search?q=${encodeURIComponent(analysis.siret_trouve)}`)
        if (searchRes.ok) company = await searchRes.json()
      } catch { /* ignore */ }
    }

    // Enregistrer en base
    await supabase.from('devis_analyses').insert({
      user_id: user.id,
      paid: !hasFreeQuota,
      stripe_session_id: sessionId || null,
      verdict: analysis.verdict,
      score: analysis.score,
    })

    return NextResponse.json({ analysis, company })
  } catch (err: any) {
    console.error('analyser-devis error:', err)
    return NextResponse.json({ error: 'Erreur lors de l\'analyse. Vérifiez le format du fichier.' }, { status: 500 })
  }
}
