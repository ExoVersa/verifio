import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5 Mo
const MAX_PAGES = 10

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

function estimatePdfPages(pdfBytes: Buffer): number {
  const str = pdfBytes.toString('latin1')
  const matches = str.match(/\/Type\s*\/Page[^s]/g)
  return matches ? matches.length : 0
}

function getIpAddress(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

export async function POST(req: NextRequest) {
  // ── 1. Clients Supabase ───────────────────────────────────────────────────
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  // ── 2. Authentification optionnelle ──────────────────────────────────────
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  let user: { id: string; email?: string } | null = null
  if (token) {
    try {
      const userSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } },
      )
      const { data } = await userSupabase.auth.getUser()
      user = data.user
    } catch { /* auth optionnelle */ }
  }

  const ipAddress = getIpAddress(req)

  // ── 3. Valider le fichier ─────────────────────────────────────────────────
  const body = await req.json()
  const { fileBase64, mimeType } = body

  if (!fileBase64 || !mimeType) {
    return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })
  }

  const fileBytes = Buffer.from(fileBase64, 'base64')

  if (fileBytes.length > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({
      error: 'Votre devis dépasse la taille autorisée (5 Mo). Un vrai devis artisan fait rarement plus de 3-4 pages.',
    }, { status: 400 })
  }

  let pagesCount = 0
  if (mimeType === 'application/pdf') {
    pagesCount = estimatePdfPages(fileBytes)
    if (pagesCount > MAX_PAGES && pagesCount > 0) {
      return NextResponse.json({
        error: `Votre devis dépasse la limite de ${MAX_PAGES} pages (${pagesCount} pages détectées).`,
      }, { status: 400 })
    }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Service IA non configuré' }, { status: 503 })
  }

  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  // ── 4. Extraire le SIRET (appel léger) ───────────────────────────────────
  let siretExtrait: string | null = null
  if (mimeType === 'application/pdf') {
    try {
      const extractResult = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: fileBase64 },
            },
            {
              type: 'text',
              text: 'Lis ce devis et retourne UNIQUEMENT un JSON : { "siret": "XXXXXXXXXXXXXXXX" ou null }. Ne retourne rien d\'autre. Le SIRET est un numéro à 14 chiffres présent dans les mentions légales du devis.',
            },
          ],
        }],
      })
      const raw = extractResult.content[0].type === 'text' ? extractResult.content[0].text.trim() : '{}'
      const clean = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
      const parsed = JSON.parse(clean)
      siretExtrait = typeof parsed.siret === 'string' && parsed.siret.length === 14 ? parsed.siret : null
    } catch {
      // SIRET extraction échouée — on continue sans
    }
  }

  // ── 5. Vérifier les droits d'analyse ─────────────────────────────────────
  let analyseGratuite = false
  let packSereniteActif = false

  // Vérifier si Pack Sérénité acheté pour ce SIRET
  if (user && siretExtrait) {
    const { data: rapport } = await supabaseAdmin
      .from('rapports')
      .select('id')
      .eq('user_id', user.id)
      .eq('siret', siretExtrait)
      .maybeSingle()
    if (rapport) packSereniteActif = true
  }

  if (!packSereniteActif) {
    // Vérifier quota mensuel (1 analyse gratuite / mois)
    const debutMois = new Date()
    debutMois.setDate(1)
    debutMois.setHours(0, 0, 0, 0)

    let quotaQuery = supabaseAdmin
      .from('analyses_devis')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', debutMois.toISOString())

    if (user) {
      quotaQuery = quotaQuery.eq('user_id', user.id)
    } else {
      quotaQuery = quotaQuery.eq('ip_address', ipAddress)
    }

    const { count } = await quotaQuery

    if ((count ?? 0) === 0) {
      analyseGratuite = true
    } else {
      return NextResponse.json({
        error: 'quota_depasse',
        siret: siretExtrait,
        message: 'Vous avez utilisé votre analyse gratuite ce mois-ci.',
      }, { status: 429 })
    }
  }

  // ── 6. Analyse complète ───────────────────────────────────────────────────
  const fileContent = mimeType === 'application/pdf'
    ? {
        type: 'document' as const,
        source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: fileBase64 },
      }
    : {
        type: 'image' as const,
        source: {
          type: 'base64' as const,
          media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/webp',
          data: fileBase64,
        },
      }

  let rawText = ''
  try {
    const message = await anthropic.messages.create({
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

  let analysis: any
  try {
    const jsonText = rawText.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
    analysis = JSON.parse(jsonText)
  } catch {
    console.error('[analyser-devis] JSON.parse failed. Raw:', rawText.slice(0, 300))
    return NextResponse.json({ error: 'Réponse IA invalide. Réessayez ou changez de fichier.' }, { status: 500 })
  }

  // SIRET final : analyse principale en priorité, extraction légère en fallback
  const siretFinal = analysis.siret_trouve || siretExtrait

  // ── Croiser avec fiche entreprise si SIRET trouvé ─────────────────────────
  let company = null
  if (siretFinal) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://verifio-eight.vercel.app'
      const searchRes = await fetch(`${baseUrl}/api/search?q=${encodeURIComponent(siretFinal)}`)
      if (searchRes.ok) company = await searchRes.json()
    } catch { /* ignore */ }
  }

  // ── 7. Logger l'analyse ──────────────────────────────────────────────────
  await supabaseAdmin.from('analyses_devis').insert({
    user_id: user?.id ?? null,
    siret_artisan: siretFinal,
    ip_address: ipAddress,
    pages_pdf: pagesCount,
    taille_pdf_bytes: fileBytes.length,
  }).then(({ error }) => {
    if (error) console.warn('[analyser-devis] Log insert failed:', error.message)
  })

  return NextResponse.json({
    analysis,
    company,
    siret_artisan: siretFinal,
    est_gratuite: analyseGratuite,
    pack_serenite_actif: packSereniteActif,
  })
}
