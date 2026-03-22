import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    const { nom, email, sujet, message } = await req.json()

    if (!nom || !email || !sujet || !message) {
      return NextResponse.json({ error: 'Tous les champs sont requis.' }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email invalide.' }, { status: 400 })
    }

    if (message.length > 2000) {
      return NextResponse.json({ error: 'Message trop long (2000 caractères max).' }, { status: 400 })
    }

    await resend.emails.send({
      from: 'Verifio Contact <onboarding@resend.dev>',
      to: ['contact@verifio.fr'],
      replyTo: email,
      subject: `[Verifio Contact] ${sujet} — ${nom}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
          <div style="background: #1B4332; padding: 24px 32px; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; color: #D8F3DC; font-size: 20px;">Nouveau message — Verifio</h1>
          </div>
          <div style="background: #f9fafb; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: 600; width: 120px; color: #6b7280;">Nom</td><td style="padding: 8px 0;">${nom}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Email</td><td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #1B4332;">${email}</a></td></tr>
              <tr><td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Sujet</td><td style="padding: 8px 0;">${sujet}</td></tr>
            </table>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <h3 style="margin: 0 0 12px; font-size: 15px; color: #374151;">Message :</h3>
            <p style="margin: 0; font-size: 15px; line-height: 1.7; white-space: pre-wrap; background: #fff; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erreur lors de l\'envoi. Réessayez.' }, { status: 500 })
  }
}
