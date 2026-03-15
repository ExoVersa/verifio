import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? 'définie' : 'manquante',
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'définie' : 'manquante',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'définie' : 'manquante',
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'non définie',
    NODE_ENV: process.env.NODE_ENV,
  })
}
