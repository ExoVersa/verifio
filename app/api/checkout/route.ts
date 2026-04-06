import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
})

function getBaseUrl(req: NextRequest): string {
  const requestHost = req.headers.get('host')
  const requestProto = req.headers.get('x-forwarded-proto') || (requestHost?.includes('localhost') ? 'http' : 'https')
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    (requestHost ? `${requestProto}://${requestHost}` : 'http://localhost:3000')
  )
}

export async function POST(req: NextRequest) {
  // Vérification auth obligatoire
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json(
      { error: 'non_connecte', message: 'Connexion requise pour accéder au paiement.' },
      { status: 401 }
    )
  }

  const supabaseAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)

  if (authError || !user) {
    return NextResponse.json(
      { error: 'non_connecte', message: 'Session invalide. Veuillez vous reconnecter.' },
      { status: 401 }
    )
  }

  const body = await req.json()
  const { plan, siret, nom, chantierId, user_id } = body
  const baseUrl = getBaseUrl(req)

  // ── Pack Sérénité — paiement unique 4,90€ ───────────────────────────────
  if (!plan || plan === 'serenite') {
    if (!siret && !chantierId) {
      return NextResponse.json({ error: 'SIRET ou chantierId requis pour le Pack Sérénité' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: 490,
            product_data: {
              name: 'Pack Sérénité — 4,90€' + (nom ? ` · ${nom}` : ''),
              description: 'Rapport complet artisan + analyse IA de devis + alertes BODACC + carnet de chantier illimité.',
              images: [],
            },
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: siret
        ? `${baseUrl}/rapport/succes?session_id={CHECKOUT_SESSION_ID}&siret=${siret}&new=true`
        : `${baseUrl}/rapport/succes?session_id={CHECKOUT_SESSION_ID}&new=true`,
      cancel_url: siret
        ? `${baseUrl}/artisan/${siret}`
        : `${baseUrl}/pricing`,
      metadata: { plan: 'serenite', siret: siret || '', nom: nom || '', chantierId: chantierId || '', user_id: user_id || '' },
      custom_fields: [
        {
          key: 'retractation',
          label: {
            type: 'custom',
            custom: 'Je renonce à mon droit de rétractation',
          },
          type: 'dropdown',
          dropdown: {
            options: [
              {
                label: 'Oui, je renonce à mon droit de rétractation',
                value: 'oui',
              },
            ],
          },
        },
      ],
    })

    return NextResponse.json({ url: session.url })
  }

  // ── Tranquillité — abonnement 4,90€/mois ────────────────────────────────
  if (plan === 'tranquillite') {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: 490,
            recurring: { interval: 'month' },
            product_data: {
              name: 'Tranquillité — Rien qui cloche',
              description: 'Analyses illimitées, surveillance illimitée, export PDF, historique complet. Sans engagement.',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${baseUrl}/mon-espace?plan=tranquillite&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      metadata: { plan: 'tranquillite' },
      custom_fields: [
        {
          key: 'retractation',
          label: {
            type: 'custom',
            custom: 'Je comprends que ce service est un contenu numérique fourni immédiatement et je renonce à mon droit de rétractation de 14 jours (Art. L221-28 Code conso.)',
          },
          type: 'dropdown',
          dropdown: {
            options: [
              {
                label: 'Oui, je renonce à mon droit de rétractation',
                value: 'oui',
              },
            ],
          },
        },
      ],
    })

    return NextResponse.json({ url: session.url })
  }

  return NextResponse.json({ error: 'Plan inconnu. Valeurs acceptées : serenite, tranquillite' }, { status: 400 })
}
