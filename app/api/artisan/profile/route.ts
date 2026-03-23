import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function PATCH(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  try {
    // Authentifier l'utilisateur via son JWT
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

    if (userError || !user) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
    }

    const body = await req.json() as { description?: string; telephone?: string }
    const updates: Record<string, string> = {}
    if (body.description !== undefined) updates.description = body.description
    if (body.telephone !== undefined) updates.telephone = body.telephone

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Aucun champ à mettre à jour.' }, { status: 400 })
    }

    const { error: updateError } = await supabaseAdmin
      .from('artisans')
      .update(updates)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json({ error: 'Erreur lors de la mise à jour.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    console.error('Profile error:', err)
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}
