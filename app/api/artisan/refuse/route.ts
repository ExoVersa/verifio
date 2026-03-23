import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const resend = new Resend(process.env.RESEND_API_KEY)
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'couratincharlie@gmail.com'

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

    const { artisanId, motif } = await req.json() as { artisanId: string; motif: string }
    if (!artisanId) {
      return NextResponse.json({ error: 'artisanId requis.' }, { status: 400 })
    }

    // 1. Mettre à jour le statut
    const { data: artisan, error: updateError } = await supabaseAdmin
      .from('artisans')
      .update({
        statut: 'refuse',
        motif_refus: motif || null,
      })
      .eq('id', artisanId)
      .select('email, nom_dirigeant, nom_entreprise')
      .single()

    if (updateError || !artisan) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Artisan introuvable.' }, { status: 404 })
    }

    // 2. Email de refus à l'artisan
    const prenom = artisan.nom_dirigeant?.split(' ')[0] || artisan.nom_dirigeant || 'Bonjour'
    await resend.emails.send({
      from: 'Verifio <onboarding@resend.dev>',
      to: artisan.email,
      subject: 'Votre demande Verifio — Informations complémentaires requises',
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f0;font-family:'DM Sans',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-flex;align-items:center;gap:8px;background:#1B4332;color:#D8F3DC;padding:10px 20px;border-radius:12px;font-size:15px;font-weight:700;letter-spacing:0.04em;">
        🛡 Verifio
      </div>
    </div>
    <div style="background:#fff;border-radius:20px;padding:32px;border:1px solid #e5e7eb;">
      <h1 style="margin:0 0 16px;font-size:20px;font-weight:800;color:#111827;">
        Bonjour ${prenom},
      </h1>
      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.65;">
        Nous avons examiné votre dossier pour <strong>${artisan.nom_entreprise}</strong>.
      </p>
      <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.65;">
        Malheureusement, nous ne sommes pas en mesure de valider votre inscription pour le motif suivant :
      </p>
      ${motif ? `
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
        <p style="margin:0;font-size:14px;color:#dc2626;line-height:1.65;">${motif}</p>
      </div>
      ` : ''}
      <p style="margin:0 0 24px;font-size:14px;color:#6B7280;line-height:1.65;">
        Si vous souhaitez contester cette décision ou fournir des documents supplémentaires, répondez directement à cet email ou contactez-nous à <a href="mailto:contact@verifio.fr" style="color:#1B4332;">contact@verifio.fr</a>.
      </p>
      <p style="margin:0;font-size:13px;color:#9CA3AF;">
        L'équipe Verifio
      </p>
    </div>
    <p style="text-align:center;font-size:11px;color:#9CA3AF;margin-top:16px;">© Verifio — ${new Date().getFullYear()}</p>
  </div>
</body>
</html>
      `.trim(),
    })

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    console.error('Refuse error:', err)
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}
