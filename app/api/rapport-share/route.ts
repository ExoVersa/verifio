import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.rienquicloche.fr'

export async function POST(req: NextRequest) {
  // Auth via Authorization header (Bearer token from Supabase session)
  const authHeader = req.headers.get('authorization')
  const accessToken = authHeader?.replace('Bearer ', '')

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Vérifier l'utilisateur connecté
  let userId: string | null = null
  if (accessToken) {
    const { data: { user } } = await supabaseAdmin.auth.getUser(accessToken)
    userId = user?.id ?? null
  }

  if (!userId) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let body: { stripe_session_id: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const { stripe_session_id } = body
  if (!stripe_session_id) {
    return NextResponse.json({ error: 'stripe_session_id requis' }, { status: 400 })
  }

  // Vérifier que le rapport appartient à cet utilisateur
  const { data: rapport, error: fetchError } = await supabaseAdmin
    .from('rapports')
    .select('id, share_token, share_expires_at')
    .eq('stripe_session_id', stripe_session_id)
    .eq('user_id', userId)
    .single()

  if (fetchError || !rapport) {
    return NextResponse.json({ error: 'Rapport introuvable ou accès refusé' }, { status: 404 })
  }

  // Si un token valide existe déjà, le réutiliser
  if (rapport.share_token && rapport.share_expires_at) {
    const expiresAt = new Date(rapport.share_expires_at)
    if (expiresAt > new Date()) {
      return NextResponse.json({
        share_url: `${BASE_URL}/rapport/partage/${rapport.share_token}`,
        expires_at: rapport.share_expires_at,
      })
    }
  }

  // Générer un nouveau token
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 jours

  const { error: updateError } = await supabaseAdmin
    .from('rapports')
    .update({ share_token: token, share_expires_at: expiresAt.toISOString() })
    .eq('id', rapport.id)

  if (updateError) {
    return NextResponse.json({ error: 'Erreur lors de la génération du lien' }, { status: 500 })
  }

  return NextResponse.json({
    share_url: `${BASE_URL}/rapport/partage/${token}`,
    expires_at: expiresAt.toISOString(),
  })
}
