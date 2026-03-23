import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  // Instancier à l'intérieur du handler pour éviter les erreurs au build time
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const resend = new Resend(process.env.RESEND_API_KEY)
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://verifio.vercel.app'

  try {
    const formData = await req.formData()

    const siret = formData.get('siret') as string
    const nomEntreprise = formData.get('nomEntreprise') as string
    const adresse = formData.get('adresse') as string
    const typesTravaux = JSON.parse((formData.get('typesTravaux') as string) || '[]') as string[]
    const zoneIntervention = ((formData.get('zoneIntervention') as string) || '')
      .split(',').map(z => z.trim()).filter(Boolean)
    const siteWeb = (formData.get('siteWeb') as string) || ''
    const nomDirigeant = formData.get('nomDirigeant') as string
    const email = formData.get('email') as string
    const telephone = formData.get('telephone') as string
    const motDePasse = formData.get('motDePasse') as string
    const justificatif = formData.get('justificatif') as File | null

    // Validation basique
    if (!siret || !nomEntreprise || !nomDirigeant || !email || !telephone || !motDePasse) {
      return NextResponse.json({ error: 'Champs obligatoires manquants.' }, { status: 400 })
    }

    // 1. Créer l'utilisateur Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: motDePasse,
      email_confirm: true,
    })

    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
        return NextResponse.json({ error: 'Un compte existe déjà avec cet email.' }, { status: 409 })
      }
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Erreur lors de la création du compte.' }, { status: 500 })
    }

    const userId = authData.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'Erreur lors de la création du compte.' }, { status: 500 })
    }

    // 2. Upload du justificatif
    let justificatifUrl: string | null = null
    if (justificatif && justificatif.size > 0) {
      const ext = justificatif.name.split('.').pop() || 'pdf'
      const path = `${siret}/${Date.now()}.${ext}`
      const buffer = await justificatif.arrayBuffer()

      const { error: uploadError } = await supabaseAdmin.storage
        .from('justificatifs')
        .upload(path, buffer, {
          contentType: justificatif.type,
          upsert: false,
        })

      if (!uploadError) {
        const { data: urlData } = supabaseAdmin.storage
          .from('justificatifs')
          .getPublicUrl(path)
        justificatifUrl = urlData.publicUrl
      } else {
        console.error('Upload error:', uploadError)
        // Non bloquant — on continue sans justificatif uploadé
      }
    }

    // 3. Insérer dans la table artisans
    const { error: dbError } = await supabaseAdmin.from('artisans').insert({
      user_id: userId,
      siret,
      nom_entreprise: nomEntreprise,
      adresse,
      types_travaux: typesTravaux,
      zone_intervention: zoneIntervention,
      site_web: siteWeb || null,
      nom_dirigeant: nomDirigeant,
      email,
      telephone,
      justificatif_url: justificatifUrl,
      statut: 'en_attente',
    })

    if (dbError) {
      console.error('DB error:', dbError)
      // Supprimer le user si l'insertion échoue
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: 'Erreur lors de l\'enregistrement.' }, { status: 500 })
    }

    // 4. Email de notification admin
    await resend.emails.send({
      from: 'Verifio <onboarding@resend.dev>',
      to: process.env.ADMIN_EMAIL || 'couratincharlie@gmail.com',
      subject: `Nouvelle inscription artisan — ${nomEntreprise}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f0;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="background:#fff;border-radius:16px;padding:28px;border:1px solid #e5e7eb;">
      <h2 style="margin:0 0 20px;font-size:20px;font-weight:800;color:#111827;">
        Nouvelle demande d'inscription artisan
      </h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:8px 0;color:#6B7280;width:140px;">SIRET</td><td style="padding:8px 0;font-weight:600;color:#111827;">${siret}</td></tr>
        <tr><td style="padding:8px 0;color:#6B7280;">Entreprise</td><td style="padding:8px 0;font-weight:600;color:#111827;">${nomEntreprise}</td></tr>
        <tr><td style="padding:8px 0;color:#6B7280;">Dirigeant</td><td style="padding:8px 0;font-weight:600;color:#111827;">${nomDirigeant}</td></tr>
        <tr><td style="padding:8px 0;color:#6B7280;">Email</td><td style="padding:8px 0;font-weight:600;color:#111827;">${email}</td></tr>
        <tr><td style="padding:8px 0;color:#6B7280;">Téléphone</td><td style="padding:8px 0;font-weight:600;color:#111827;">${telephone}</td></tr>
        ${justificatifUrl ? `<tr><td style="padding:8px 0;color:#6B7280;">Justificatif</td><td style="padding:8px 0;"><a href="${justificatifUrl}" style="color:#1B4332;font-weight:600;">Voir le fichier →</a></td></tr>` : ''}
      </table>
      <div style="margin-top:24px;text-align:center;">
        <a href="${BASE_URL}/admin" style="display:inline-block;padding:12px 24px;background:#1B4332;color:#fff;border-radius:10px;text-decoration:none;font-size:14px;font-weight:700;">
          Gérer les demandes →
        </a>
      </div>
    </div>
  </div>
</body>
</html>
      `.trim(),
    })

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    console.error('Register error:', err)
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}
