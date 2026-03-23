import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface LigneDevis {
  description: string
  quantite: number
  unite: string
  prix_unitaire_ht: number
  total_ht: number
}

interface DevisPayload {
  clientNom: string
  clientEmail?: string
  clientTelephone?: string
  clientAdresse?: string
  lignes: LigneDevis[]
  totalHt: number
  tvaTaux: number
  totalTtc: number
  acompte: number
  statut?: 'brouillon' | 'envoye'
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  try {
    // Authentifier l'utilisateur
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

    // Récupérer l'artisan
    const { data: artisan, error: artisanError } = await supabaseAdmin
      .from('artisans')
      .select('id, statut')
      .eq('user_id', user.id)
      .single()

    if (artisanError || !artisan) {
      return NextResponse.json({ error: 'Profil artisan introuvable.' }, { status: 404 })
    }

    if (artisan.statut !== 'verifie') {
      return NextResponse.json({ error: 'Votre compte doit être vérifié pour créer des devis.' }, { status: 403 })
    }

    const body = await req.json() as DevisPayload

    if (!body.clientNom) {
      return NextResponse.json({ error: 'Le nom du client est requis.' }, { status: 400 })
    }

    // Calculer le prochain numéro de devis pour cet artisan
    const { count } = await supabaseAdmin
      .from('devis_artisan')
      .select('*', { count: 'exact', head: true })
      .eq('artisan_id', artisan.id)

    const numeroDevis = (count ?? 0) + 1

    const { data: devis, error: insertError } = await supabaseAdmin
      .from('devis_artisan')
      .insert({
        artisan_id: artisan.id,
        numero_devis: numeroDevis,
        client_nom: body.clientNom,
        client_email: body.clientEmail || null,
        client_telephone: body.clientTelephone || null,
        client_adresse: body.clientAdresse || null,
        lignes: body.lignes,
        total_ht: body.totalHt,
        tva_taux: body.tvaTaux,
        total_ttc: body.totalTtc,
        acompte: body.acompte,
        statut: body.statut || 'brouillon',
      })
      .select('id, numero_devis')
      .single()

    if (insertError) {
      console.error('Devis insert error:', insertError)
      return NextResponse.json({ error: 'Erreur lors de la création du devis.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, devisId: devis.id, numeroDevis: devis.numero_devis })
  } catch (err: unknown) {
    console.error('Devis create error:', err)
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}
