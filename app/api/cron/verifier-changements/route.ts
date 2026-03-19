import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

const resend = new Resend(process.env.RESEND_API_KEY)
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://verifio-eight.vercel.app'

// ── Vérification Vercel Cron signature ─────────────────────────────────────────
function isCronRequest(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization')
  // En production, Vercel envoie un header Authorization avec le CRON_SECRET
  if (process.env.CRON_SECRET) {
    return authHeader === `Bearer ${process.env.CRON_SECRET}`
  }
  // En dev, pas de secret requis
  return true
}

// ── Récupère le statut actuel d'un SIRET via l'API gouvernementale ─────────────
async function fetchStatutActuel(siret: string): Promise<{ statut: string; nom: string } | null> {
  try {
    const res = await fetch(
      `https://recherche-entreprises.api.gouv.fr/search?q=${siret}&page=1&per_page=1`,
      { headers: { Accept: 'application/json' }, cache: 'no-store' },
    )
    if (!res.ok) return null
    const data = await res.json()
    const e = data.results?.[0]
    if (!e) return null
    const siege = e.siege || {}
    return {
      statut: siege.etat_administratif === 'A' ? 'actif' : 'fermé',
      nom: e.nom_complet || e.nom_raison_sociale || '',
    }
  } catch {
    return null
  }
}

// ── Email d'alerte ─────────────────────────────────────────────────────────────
async function sendAlertEmail(opts: {
  email: string
  siret: string
  nom: string
  statutAvant: string
  statutApres: string
}) {
  const unsubLink = `${BASE_URL}/api/surveillance/unsubscribe?email=${encodeURIComponent(opts.email)}&siret=${encodeURIComponent(opts.siret)}`
  const ficheLink = `${BASE_URL}/artisan/${opts.siret}`

  await resend.emails.send({
    from: 'Verifio <onboarding@resend.dev>',
    to: opts.email,
    subject: `⚠️ Alerte : ${opts.nom} a changé de statut`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f0;font-family:'DM Sans',Arial,sans-serif;">
  <div style="max-width:580px;margin:0 auto;padding:32px 16px;">

    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:#1B4332;color:#D8F3DC;padding:10px 20px;border-radius:12px;font-size:15px;font-weight:700;">
        🛡 Verifio
      </div>
    </div>

    <div style="background:#fff;border-radius:20px;padding:32px;border:1px solid #fecaca;box-shadow:0 2px 12px rgba(220,38,38,0.08);">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:40px;margin-bottom:12px;">⚠️</div>
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#dc2626;font-family:Syne,Arial,sans-serif;">Changement détecté !</h1>
        <p style="margin:0;font-size:15px;color:#6B7280;">
          L'artisan que vous surveillez a changé de statut.
        </p>
      </div>

      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:14px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#991b1b;text-transform:uppercase;letter-spacing:0.06em;">
          ${opts.nom}
        </p>
        <div style="display:flex;align-items:center;gap:12px;justify-content:center;font-size:18px;font-weight:800;font-family:Syne,Arial,sans-serif;">
          <span style="color:${opts.statutAvant === 'actif' ? '#16a34a' : '#dc2626'};background:${opts.statutAvant === 'actif' ? '#dcfce7' : '#fee2e2'};padding:6px 16px;border-radius:20px;font-size:14px;">
            ${opts.statutAvant === 'actif' ? '● Actif' : '● Fermé'}
          </span>
          <span style="color:#9CA3AF;">→</span>
          <span style="color:${opts.statutApres === 'actif' ? '#16a34a' : '#dc2626'};background:${opts.statutApres === 'actif' ? '#dcfce7' : '#fee2e2'};padding:6px 16px;border-radius:20px;font-size:14px;">
            ${opts.statutApres === 'actif' ? '● Actif' : '● Fermé'}
          </span>
        </div>
        <p style="margin:14px 0 0;font-size:12px;color:#9CA3AF;text-align:center;">SIRET : ${opts.siret}</p>
      </div>

      <div style="text-align:center;margin-bottom:24px;">
        <a href="${ficheLink}" style="display:inline-block;padding:13px 28px;border-radius:12px;background:#1B4332;color:#fff;font-size:14px;font-weight:600;text-decoration:none;">
          Voir la fiche complète →
        </a>
      </div>

      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:14px 16px;margin-bottom:20px;">
        <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
          <strong>💡 Que faire ?</strong><br>
          Consultez la fiche complète pour voir les dernières informations BODACC et dirigeants.
          Si vous avez signé un contrat ou versé un acompte, consultez notre assistant juridique.
        </p>
      </div>

      <p style="margin:0;font-size:12px;color:#9CA3AF;text-align:center;border-top:1px solid #f3f4f6;padding-top:16px;">
        Données officielles · INSEE · ADEME · BODACC<br>
        <a href="${unsubLink}" style="color:#9CA3AF;text-decoration:underline;">Se désabonner de cette alerte</a>
      </p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  })
}

export async function GET(req: NextRequest) {
  if (!isCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Récupérer toutes les surveillances
    const { data: surveillances, error } = await supabase
      .from('surveillances')
      .select('*')

    if (error || !surveillances) {
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }

    // Grouper par SIRET pour ne faire qu'une requête API par SIRET
    const bySiret = new Map<string, typeof surveillances>()
    for (const s of surveillances) {
      if (!bySiret.has(s.siret)) bySiret.set(s.siret, [])
      bySiret.get(s.siret)!.push(s)
    }

    let alertesSent = 0
    const results: { siret: string; changed: boolean; error?: string }[] = []

    for (const [siret, group] of bySiret) {
      const current = await fetchStatutActuel(siret)
      if (!current) {
        results.push({ siret, changed: false, error: 'API unreachable' })
        continue
      }

      // Vérifier si au moins une surveillance a un statut différent
      const changed = group.some(s => s.statut_initial !== current.statut)
      results.push({ siret, changed })

      if (changed) {
        // Envoyer un email à chaque email qui surveille ce SIRET
        for (const surveillance of group) {
          if (surveillance.statut_initial !== current.statut) {
            try {
              await sendAlertEmail({
                email: surveillance.email,
                siret,
                nom: current.nom || surveillance.nom_artisan || siret,
                statutAvant: surveillance.statut_initial || 'inconnu',
                statutApres: current.statut,
              })
              alertesSent++

              // Mettre à jour le statut en DB pour éviter les re-alertes
              await supabase
                .from('surveillances')
                .update({ statut_initial: current.statut })
                .eq('id', surveillance.id)
            } catch (mailErr) {
              console.error(`Email error for ${surveillance.email}:`, mailErr)
            }
          }
        }
      }
    }

    return NextResponse.json({
      ok: true,
      sirets_checked: bySiret.size,
      alertes_sent: alertesSent,
      results,
    })
  } catch (err: any) {
    console.error('Cron error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
