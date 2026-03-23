import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const resend = new Resend(process.env.RESEND_API_KEY)
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://verifio.vercel.app'
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'contact@verifio.fr'

  try {
    // Vérification admin : récupérer le JWT depuis l'Authorization header
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

    const { artisanId } = await req.json() as { artisanId: string }
    if (!artisanId) {
      return NextResponse.json({ error: 'artisanId requis.' }, { status: 400 })
    }

    const now = new Date()
    const essaiFin = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

    // 1. Mettre à jour le statut
    const { data: artisan, error: updateError } = await supabaseAdmin
      .from('artisans')
      .update({
        statut: 'verifie',
        badge_actif: true,
        essai_debut: now.toISOString(),
        essai_fin: essaiFin.toISOString(),
        abonnement_actif: true,
      })
      .eq('id', artisanId)
      .select('email, nom_dirigeant, nom_entreprise, siret')
      .single()

    if (updateError || !artisan) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Artisan introuvable.' }, { status: 404 })
    }

    // 2. Email de confirmation à l'artisan
    const prenom = artisan.nom_dirigeant?.split(' ')[0] || artisan.nom_dirigeant || 'Bonjour'
    await resend.emails.send({
      from: 'Verifio <onboarding@resend.dev>',
      to: artisan.email,
      subject: 'Bienvenue sur Verifio — Votre espace est prêt ✓',
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
    <div style="background:#fff;border-radius:20px;padding:32px;border:1px solid #e5e7eb;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:40px;margin-bottom:12px;">🎉</div>
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111827;">Votre dossier est validé !</h1>
        <p style="margin:0;font-size:15px;color:#6B7280;line-height:1.6;">
          Bonjour <strong style="color:#111827;">${prenom}</strong>,<br>
          <strong style="color:#111827;">${artisan.nom_entreprise}</strong> est maintenant certifiée Verifio.
        </p>
      </div>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:14px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#14532d;text-transform:uppercase;letter-spacing:0.06em;">Votre essai gratuit</p>
        <p style="margin:0;font-size:14px;color:#166534;line-height:1.6;">
          ✓ 14 jours d'essai offerts à partir d'aujourd'hui<br>
          ✓ Badge de confiance actif sur votre fiche<br>
          ✓ Accès complet à l'espace artisan
        </p>
      </div>
      <div style="text-align:center;margin-bottom:16px;">
        <a href="${BASE_URL}/artisan/dashboard" style="display:inline-block;padding:13px 28px;border-radius:12px;background:#1B4332;color:#fff;font-size:14px;font-weight:600;text-decoration:none;">
          Accéder à mon espace →
        </a>
      </div>
      <p style="margin:0;font-size:12px;color:#9CA3AF;text-align:center;">
        Une question ? Répondez à cet email ou écrivez à contact@verifio.fr
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
    console.error('Validate error:', err)
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}
