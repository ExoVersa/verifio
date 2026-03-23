import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'contact@verifio.fr'

  try {
    // Vérification admin
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
    }
    const token = authHeader.slice(7)

    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser(token)

    if (userError || !user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const statut = searchParams.get('statut')

    let query = supabaseAdmin
      .from('artisans')
      .select('id, siret, nom_entreprise, nom_dirigeant, email, telephone, statut, justificatif_url, abonnement_actif, badge_actif, essai_fin, created_at, motif_refus')
      .order('created_at', { ascending: false })

    if (statut) {
      query = query.eq('statut', statut)
    }

    const { data, error } = await query

    if (error) {
      console.error('List error:', error)
      return NextResponse.json({ error: 'Erreur base de données.' }, { status: 500 })
    }

    return NextResponse.json({ artisans: data })
  } catch (err: unknown) {
    console.error('List error:', err)
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}
