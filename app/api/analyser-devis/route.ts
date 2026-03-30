import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 Mo
const MAX_PAGES = 10

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

function parseJson(raw: string): any {
  const clean = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
  return JSON.parse(clean)
}

export async function POST(req: NextRequest) {
  // ── 1. Clients Supabase ───────────────────────────────────────────────────
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
  const { fileBase64, mimeType, nomFichier } = body

  if (!fileBase64 || !mimeType) {
    return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })
  }

  const fileBytes = Buffer.from(fileBase64, 'base64')

  if (fileBytes.length > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({
      error: 'Votre devis dépasse la taille autorisée (10 Mo).',
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
              text: 'Lis ce devis et retourne UNIQUEMENT un JSON : { "siret": "XXXXXXXXXXXXXXXX" ou null }. Ne retourne rien d\'autre. Le SIRET est un numéro à 14 chiffres dans les mentions légales.',
            },
          ],
        }],
      })
      const raw = extractResult.content[0].type === 'text' ? extractResult.content[0].text.trim() : '{}'
      const parsed = parseJson(raw)
      siretExtrait = typeof parsed.siret === 'string' && parsed.siret.replace(/\s/g, '').length === 14
        ? parsed.siret.replace(/\s/g, '')
        : null
    } catch { /* SIRET extraction échouée */ }
  }

  // ── 5. Vérifier les droits d'analyse ─────────────────────────────────────
  let analyseGratuite = false
  let packSereniteActif = false

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

  // ── 6. Analyses parallèles : prix + juridique ─────────────────────────────
  const docContent = mimeType === 'application/pdf'
    ? { type: 'document' as const, source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: fileBase64 } }
    : { type: 'image' as const, source: { type: 'base64' as const, media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/webp', data: fileBase64 } }

  let prixRaw: any = null
  let juridiqueRaw: any = null

  try {
    const [prixMsg, juridiqueMsg] = await Promise.all([
      // Appel 1 — Analyse des prix
      anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: [
            docContent,
            {
              type: 'text',
              text: `Analyse ce devis et retourne UNIQUEMENT ce JSON valide (sans markdown, sans backticks) :
{
  "siret": "14 chiffres ou null",
  "nom_artisan": "string ou null",
  "type_travaux": "string (ex: Isolation, Plomberie, Toiture...)",
  "region": "région française ou null",
  "montant_devis": number ou null,
  "fourchette_basse": number,
  "fourchette_haute": number,
  "prix_moyen": number,
  "verdict_prix": "normal" | "sous-evalue" | "surevalue",
  "ecart_pourcentage": number,
  "facteurs": ["string", "string", "string"],
  "alerte": "string ou null"
}
Base-toi sur les prix du marché français 2024-2025 (main d'œuvre + matériaux). Si la région n'est pas précisée, utilise une moyenne nationale. Sois précis et réaliste.`,
            },
          ],
        }],
      }),
      // Appel 2 — Analyse juridique
      anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: [
            docContent,
            {
              type: 'text',
              text: `Analyse la conformité juridique de ce devis français et retourne UNIQUEMENT ce JSON valide (sans markdown, sans backticks) :
{
  "score_conformite": number (0-10),
  "mentions_presentes": ["string", ...],
  "mentions_manquantes": ["string", ...],
  "clauses_abusives": ["string", ...],
  "verdict_juridique": "conforme" | "a_corriger" | "non_conforme",
  "recommandations": ["string", "string", "string"]
}
Vérifie obligatoirement : SIRET de l'artisan, numéro d'assurance décennale, délai d'exécution, conditions de paiement (acompte ≤ 30%), droit de rétractation 14 jours si démarchage, garanties mentionnées, coordonnées complètes artisan, description détaillée des travaux et matériaux.
Score 8-10 = conforme, 5-7 = à corriger, 0-4 = non conforme.`,
            },
          ],
        }],
      }),
    ])

    const prixText = prixMsg.content[0].type === 'text' ? prixMsg.content[0].text : '{}'
    const juridiqueText = juridiqueMsg.content[0].type === 'text' ? juridiqueMsg.content[0].text : '{}'

    try { prixRaw = parseJson(prixText) } catch {
      console.error('[analyser-devis] Prix JSON parse failed:', prixText.slice(0, 200))
    }
    try { juridiqueRaw = parseJson(juridiqueText) } catch {
      console.error('[analyser-devis] Juridique JSON parse failed:', juridiqueText.slice(0, 200))
    }
  } catch (err: any) {
    console.error('[analyser-devis] Erreur Claude:', err?.message)
    return NextResponse.json({ error: `Erreur IA : ${err?.message || 'Appel Claude échoué'}` }, { status: 500 })
  }

  if (!prixRaw || !juridiqueRaw) {
    return NextResponse.json({ error: 'Réponse IA invalide. Réessayez ou changez de fichier.' }, { status: 500 })
  }

  // SIRET final : prix analysis en priorité, extraction légère en fallback
  const siretFinal: string | null = prixRaw.siret || siretExtrait

  // ── Score global ─────────────────────────────────────────────────────────
  const scoreConformite: number = juridiqueRaw.score_conformite ?? 5
  const scorePrix = prixRaw.verdict_prix === 'normal' ? 10
    : prixRaw.verdict_prix === 'sous-evalue' ? 4
    : 6 // surevalue
  const scoreGlobal = Math.round((scoreConformite + scorePrix) / 2)

  const resultatComplet = {
    prix: prixRaw,
    juridique: juridiqueRaw,
    score_global: scoreGlobal,
    siret_artisan: siretFinal,
    est_gratuite: analyseGratuite,
    pack_serenite_actif: packSereniteActif,
  }

  // ── 7. Logger l'analyse ──────────────────────────────────────────────────
  try {
    const { error: insertError } = await supabaseAdmin.from('analyses_devis').insert({
      user_id: user?.id || null,
      ip_address: ipAddress || null,
      siret_artisan: siretFinal || null,
      pages_pdf: pagesCount || null,
      taille_pdf_bytes: fileBytes.length || null,
      nom_fichier: nomFichier || null,
      resultat_json: resultatComplet,
    })
    if (insertError) {
      console.error('INSERT analyses_devis failed:', JSON.stringify(insertError))
    }
  } catch (e) {
    console.error('INSERT analyses_devis exception:', e)
  }

  return NextResponse.json(resultatComplet)
}
