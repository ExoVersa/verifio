import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function DELETE(req: NextRequest) {
  // Auth
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) {
    return NextResponse.json({ error: 'non_connecte' }, { status: 401 })
  }

  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'session_invalide' }, { status: 401 })
  }

  const userId = user.id
  const userEmail = user.email

  try {
    // Supprimer surveillances par user_id ET par email (double sécurité)
    await supabaseAdmin.from('surveillances').delete().eq('user_id', userId)
    if (userEmail) {
      await supabaseAdmin.from('surveillances').delete().eq('email', userEmail)
    }

    // Supprimer le reste par user_id
    await supabaseAdmin.from('rapports').delete().eq('user_id', userId)
    await supabaseAdmin.from('user_plans').delete().eq('user_id', userId)
    await supabaseAdmin.from('analyses_devis').delete().eq('user_id', userId)
    await supabaseAdmin.from('devis_uploads').delete().eq('user_id', userId)
    await supabaseAdmin.from('artisans').delete().eq('user_id', userId)

    // Supprimer le compte Auth en dernier
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteError) throw deleteError
  } catch (err) {
    console.error('[delete-user] erreur suppression:', err)
    return NextResponse.json({ error: 'erreur_suppression' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
