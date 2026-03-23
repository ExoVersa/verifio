import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5 Mo
const MAX_PAGES = 10
const MAX_MONTHLY_TRANQUILLITE = 20
const ABUSE_THRESHOLD_PER_HOUR = 5

const SYSTEM_PROMPT = `Tu es un expert juridique français spécialisé dans les contrats de travaux. Analyse ce devis et retourne UNIQUEMENT un JSON valide sans markdown ni backticks :
{
  "score": number (0-100),
  "verdict": "conforme" | "vigilance" | "suspect",
  "siret_trouve": string | null,
  "mentions_legales": [{ "label": string, "present": boolean, "detail": string }],
  "alertes": [{ "type": "danger" | "warn" | "info", "message": string }],
  "recommandations": string[],
  "prix_coherents": boolean | null,
  "commentaire_prix": string | null,
  "resume": string
}

Vérifie obligatoirement ces mentions légales (tableau de 9 éléments dans cet ordre) :
1. Numéro SIRET de l'entreprise
2. Assurance décennale (numéro de police + assureur)
3. Numéro de TVA intracommunautaire
4. Délai de rétractation 14 jours (obligatoire pour démarchage à domicile)
5. Acompte ≤ 30% du montant total
6. Coordonnées complètes de l'entreprise (adresse, téléphone)
7. Description détaillée des travaux
8. Matériaux et fournitures spécifiés
9. Délai d'exécution et date de validité du devis

Signale comme suspect si : devis vague, acompte > 30%, absence de décennale, pression temporelle ("offre valable 24h"), prix anormalement bas ou élevés, coordonnées incomplètes.
Score : 80-100 = conforme, 50-79 = vigilance, 0-49 = suspect.`

/** Estime le nombre de pages d'un PDF via regex sur le binaire */
function estimatePdfPages(pdfBytes: Buffer): number {
  const str = pdfBytes.toString('latin1')
  // /Type /Page (sans 's') = une page dans l'arbre de pages PDF
  const matches = str.match(/\/Type\s*\/Page[^s]/g)
  return matches ? matches.length : 0
}

function getBaseUrl(req: NextRequest): string {
  const host = req.headers.get('host')
  const proto = req.headers.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https')
  return process.env.NEXT_PUBLIC_BASE_URL || (host ? `${proto}://${host}` : 'http://localhost:3000')
}

export async function POST(req: NextRequest) {
  // ── 1. Authentification ──────────────────────────────────────────────────
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const userSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  )
  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const { data: { user }, error: authError } = await userSupabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Session invalide' }, { status: 401 })

  // ── 2. Vérifier le plan actif ────────────────────────────────────────────
  const { data: activePlan } = await serviceSupabase
    .from('user_plans')
    .select('*')
    .eq('user_id', user.id)
    .eq('actif', true)
    .in('plan', ['serenite', 'tranquillite'])
    .order('date_achat', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!activePlan) {
    return NextResponse.json({
      requiresPayment: true,
      message: 'L\'analyse de devis est incluse dans le Pack Sérénité (19,90€ achat unique) ou l\'abonnement Tranquillité (4,90€/mois).',
    }, { status: 402 })
  }

  // ── 3. Limites par plan ──────────────────────────────────────────────────
  if (activePlan.plan === 'serenite') {
    if (activePlan.devis_analyse_used) {
      return NextResponse.json({
        limitReached: true,
        plan: 'serenite',
        message: 'Vous avez déjà utilisé votre analyse pour cet achat. Vous avez un nouveau devis ? Achetez un nouveau Pack Sérénité.',
      }, { status: 429 })
    }
  } else if (activePlan.plan === 'tranquillite') {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: monthCount } = await serviceSupabase
      .from('analyses_devis')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('plan', 'tranquillite')
      .gte('created_at', startOfMonth.toISOString())

    if ((monthCount ?? 0) >= MAX_MONTHLY_TRANQUILLITE) {
      const nextMonth = new Date(startOfMonth)
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      const renewDate = nextMonth.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      return NextResponse.json({
        limitReached: true,
        plan: 'tranquillite',
        message: `Vous avez atteint votre limite de ${MAX_MONTHLY_TRANQUILLITE} analyses ce mois-ci. Votre quota se renouvelle le ${renewDate}.`,
        renewDate: nextMonth.toISOString(),
      }, { status: 429 })
    }
  }

  // ── 4. Détection d'abus (>5 analyses en <1h) ────────────────────────────
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count: recentCount } = await serviceSupabase
    .from('analyses_devis')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', oneHourAgo)

  if ((recentCount ?? 0) >= ABUSE_THRESHOLD_PER_HOUR) {
    // Logger l'alerte (silencieux si table absente)
    await serviceSupabase.from('alertes_abus').insert({
      user_id: user.id,
      type: 'analyses_excessives',
      details: { count_last_hour: recentCount, threshold: ABUSE_THRESHOLD_PER_HOUR },
    }).then(() => {})
    return NextResponse.json({
      error: 'Trop de requêtes. Vous avez atteint la limite horaire. Réessayez dans une heure.',
    }, { status: 429 })
  }

  // ── 5. Valider le fichier ────────────────────────────────────────────────
  const body = await req.json()
  const { fileBase64, mimeType } = body

  if (!fileBase64 || !mimeType) {
    return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })
  }

  const fileBytes = Buffer.from(fileBase64, 'base64')
  const fileSizeBytes = fileBytes.length

  if (fileSizeBytes > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({
      error: `Votre devis dépasse la taille autorisée (5 Mo). Un vrai devis artisan fait rarement plus de 3-4 pages.`,
    }, { status: 400 })
  }

  let pagesCount = 0
  if (mimeType === 'application/pdf') {
    pagesCount = estimatePdfPages(fileBytes)
    if (pagesCount > MAX_PAGES && pagesCount > 0) {
      return NextResponse.json({
        error: `Votre devis dépasse la limite de ${MAX_PAGES} pages (${pagesCount} pages détectées). Un vrai devis artisan fait rarement plus de 3-4 pages.`,
      }, { status: 400 })
    }
  }

  // ── 6. Appel Claude Haiku ────────────────────────────────────────────────
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Service IA non configuré' }, { status: 503 })
  }

  let rawText = ''
  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const fileContent = mimeType === 'application/pdf'
      ? {
          type: 'document' as const,
          source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: fileBase64 },
        }
      : {
          type: 'image' as const,
          source: { type: 'base64' as const, media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/webp', data: fileBase64 },
        }

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [fileContent, { type: 'text', text: 'Analyse ce devis et retourne le JSON demandé.' }],
      }],
    })

    rawText = message.content[0].type === 'text' ? message.content[0].text : ''
  } catch (err: any) {
    console.error('[analyser-devis] Erreur Claude:', err?.message)
    return NextResponse.json({ error: `Erreur IA : ${err?.message || 'Appel Claude échoué'}` }, { status: 500 })
  }

  // ── Parse JSON ───────────────────────────────────────────────────────────
  let analysis: any
  try {
    const jsonText = rawText.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
    analysis = JSON.parse(jsonText)
  } catch {
    console.error('[analyser-devis] JSON.parse failed. Raw:', rawText.slice(0, 300))
    return NextResponse.json({ error: 'Réponse IA invalide. Réessayez ou changez de fichier.' }, { status: 500 })
  }

  // ── Croiser avec fiche entreprise si SIRET trouvé ────────────────────────
  let company = null
  if (analysis.siret_trouve) {
    try {
      const baseUrl = getBaseUrl(req)
      const searchRes = await fetch(`${baseUrl}/api/search?q=${encodeURIComponent(analysis.siret_trouve)}`)
      if (searchRes.ok) company = await searchRes.json()
    } catch { /* ignore */ }
  }

  // ── 7. Logger l'analyse ──────────────────────────────────────────────────
  await serviceSupabase.from('analyses_devis').insert({
    user_id: user.id,
    stripe_payment_id: activePlan.stripe_payment_id || null,
    plan: activePlan.plan,
    pages_pdf: pagesCount,
    taille_pdf_bytes: fileSizeBytes,
  }).then(({ error }) => {
    if (error) console.warn('[analyser-devis] Log insert failed:', error.message)
  })

  // ── 8. Marquer sérénité comme utilisée ──────────────────────────────────
  if (activePlan.plan === 'serenite') {
    await serviceSupabase
      .from('user_plans')
      .update({ devis_analyse_used: true })
      .eq('id', activePlan.id)
      .then(({ error }) => {
        if (error) console.warn('[analyser-devis] Update devis_analyse_used failed:', error.message)
      })
  }

  return NextResponse.json({ analysis, company })
}
