import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  try {
    const { searchParams } = new URL(req.url)
    const siret = searchParams.get('siret')

    if (!siret) {
      return NextResponse.json({ error: 'SIRET requis.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('artisans')
      .select('nom_entreprise, description, statut, badge_actif')
      .eq('siret', siret)
      .single()

    if (error || !data) {
      // Pas d'artisan enregistré — ce n'est pas une erreur
      return NextResponse.json({ verifie: false, badgeActif: false, nomEntreprise: null, description: null })
    }

    return NextResponse.json({
      verifie: data.statut === 'verifie',
      badgeActif: data.badge_actif === true,
      nomEntreprise: data.nom_entreprise,
      description: data.description,
    })
  } catch (err: unknown) {
    console.error('Public artisan error:', err)
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}
