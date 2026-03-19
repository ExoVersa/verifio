import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

const resend = new Resend(process.env.RESEND_API_KEY)

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://verifio-eight.vercel.app'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, siret, nom, score, statut } = body

    if (!email || !siret) {
      return NextResponse.json({ error: 'Email et SIRET requis.' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Email invalide.' }, { status: 400 })
    }

    // Insérer dans Supabase (UNIQUE(email, siret) = upsert silencieux)
    const { error: dbError } = await supabase.from('surveillances').upsert(
      { email, siret, nom_artisan: nom, score_initial: score, statut_initial: statut },
      { onConflict: 'email,siret', ignoreDuplicates: true },
    )

    if (dbError) {
      console.error('DB error:', dbError)
      return NextResponse.json({ error: 'Erreur base de données.' }, { status: 500 })
    }

    // Email de confirmation
    const unsubLink = `${BASE_URL}/api/surveillance/unsubscribe?email=${encodeURIComponent(email)}&siret=${encodeURIComponent(siret)}`
    const ficheLink = `${BASE_URL}/artisan/${siret}`

    await resend.emails.send({
      from: 'Verifio <onboarding@resend.dev>',
      to: email,
      subject: `✓ Alerte activée pour ${nom || siret}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f0;font-family:'DM Sans',Arial,sans-serif;">
  <div style="max-width:580px;margin:0 auto;padding:32px 16px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-flex;align-items:center;gap:8px;background:#1B4332;color:#D8F3DC;padding:10px 20px;border-radius:12px;font-size:15px;font-weight:700;letter-spacing:0.04em;">
        🛡 Verifio
      </div>
    </div>

    <!-- Card -->
    <div style="background:#fff;border-radius:20px;padding:32px;border:1px solid #e5e7eb;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:40px;margin-bottom:12px;">🔔</div>
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111827;font-family:Syne,Arial,sans-serif;">Alerte activée !</h1>
        <p style="margin:0;font-size:15px;color:#6B7280;line-height:1.6;">
          Vous surveillez maintenant <strong style="color:#111827;">${nom || siret}</strong><br>
          <span style="font-size:12px;color:#9CA3AF;">SIRET : ${siret}</span>
        </p>
      </div>

      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:14px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#14532d;text-transform:uppercase;letter-spacing:0.06em;">Vous serez alerté en cas de :</p>
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${[
            'Changement de statut (actif → fermé)',
            'Procédure judiciaire (redressement, liquidation)',
            'Changement de dirigeant',
          ].map(item => `
          <div style="display:flex;align-items:flex-start;gap:10px;">
            <span style="color:#16a34a;font-weight:700;flex-shrink:0;">✓</span>
            <span style="font-size:14px;color:#166534;">${item}</span>
          </div>`).join('')}
        </div>
      </div>

      <div style="text-align:center;margin-bottom:24px;">
        <a href="${ficheLink}" style="display:inline-block;padding:13px 28px;border-radius:12px;background:#1B4332;color:#fff;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:-0.01em;">
          Voir la fiche complète →
        </a>
      </div>

      <p style="margin:0;font-size:12px;color:#9CA3AF;text-align:center;border-top:1px solid #f3f4f6;padding-top:16px;">
        Données officielles · INSEE · ADEME · BODACC<br>
        <a href="${unsubLink}" style="color:#9CA3AF;text-decoration:underline;">Se désabonner</a>
      </p>
    </div>

    <p style="text-align:center;font-size:11px;color:#9CA3AF;margin-top:16px;">
      © Verifio — ${new Date().getFullYear()}
    </p>
  </div>
</body>
</html>
      `.trim(),
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Surveillance error:', err)
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}
