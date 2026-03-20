import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const email = req.nextUrl.searchParams.get('email')
  const siret = req.nextUrl.searchParams.get('siret')

  if (!email || !siret) {
    return new NextResponse(html('Lien invalide', 'Le lien de désabonnement est invalide ou expiré.', false), {
      status: 400, headers: { 'Content-Type': 'text/html' },
    })
  }

  const { error } = await supabase
    .from('surveillances')
    .delete()
    .eq('email', email)
    .eq('siret', siret)

  if (error) {
    return new NextResponse(html('Erreur', 'Une erreur est survenue. Veuillez réessayer.', false), {
      status: 500, headers: { 'Content-Type': 'text/html' },
    })
  }

  return new NextResponse(html('Désabonné ✓', `Vous ne recevrez plus d'alertes pour le SIRET ${siret}.`, true), {
    status: 200, headers: { 'Content-Type': 'text/html' },
  })
}

function html(title: string, message: string, ok: boolean) {
  const color = ok ? '#16a34a' : '#dc2626'
  const bg = ok ? '#f0fdf4' : '#fef2f2'
  const border = ok ? '#bbf7d0' : '#fecaca'
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — Verifio</title>
<style>body{margin:0;padding:0;background:#f4f4f0;font-family:'DM Sans',Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;}</style>
</head>
<body>
  <div style="max-width:480px;width:90%;text-align:center;">
    <div style="background:#1B4332;color:#D8F3DC;display:inline-block;padding:10px 20px;border-radius:12px;font-weight:700;margin-bottom:24px;">🛡 Verifio</div>
    <div style="background:${bg};border:1px solid ${border};border-radius:20px;padding:32px;">
      <div style="font-size:48px;margin-bottom:16px;">${ok ? '✅' : '❌'}</div>
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:${color};">${title}</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#6B7280;line-height:1.6;">${message}</p>
      <a href="/" style="display:inline-block;padding:12px 24px;border-radius:12px;background:#1B4332;color:#fff;font-size:14px;font-weight:600;text-decoration:none;">Retour à Verifio</a>
    </div>
  </div>
</body>
</html>`
}
