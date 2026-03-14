import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
})

export async function POST(req: NextRequest) {
  const { siret, nom } = await req.json()

  if (!siret) {
    return NextResponse.json({ error: 'SIRET manquant' }, { status: 400 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          unit_amount: 490,
          product_data: {
            name: `Rapport complet — ${nom || siret}`,
            description: `Vérification approfondie de l'artisan : assurance décennale, avis clients, historique judiciaire.`,
          },
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${baseUrl}/rapport/succes?siret=${siret}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/?q=${encodeURIComponent(nom || siret)}`,
    metadata: { siret, nom: nom || '' },
  })

  return NextResponse.json({ url: session.url })
}
