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

  // Connexion obligatoire
  if (!user) {
    return NextResponse.json(
      { error: 'non_connecte', message: 'Connexion requise pour analyser un devis.' },
      { status: 401 }
    )
  }

  // ── 3. Valider le fichier ─────────────────────────────────────────────────
  const body = await req.json()
  const { fileBase64, mimeType, nomFichier, siretArtisan: siretClient } = body

  // ── 3b. Vérification des droits d'accès basée sur le SIRET client ────────
  if (!siretClient) {
    return NextResponse.json(
      { error: 'siret_manquant', message: 'Aucun artisan sélectionné.' },
      { status: 400 }
    )
  }

  const { data: rapportPack } = await supabaseAdmin
    .from('rapports')
    .select('id')
    .eq('user_id', user.id)
    .eq('siret', siretClient)
    .maybeSingle()

  if (!rapportPack) {
    return NextResponse.json(
      {
        error: 'pack_requis',
        message: 'Un Pack Sérénité est requis pour analyser le devis de cet artisan.',
        siret_artisan: siretClient,
      },
      { status: 403 }
    )
  }

  const debutMois = new Date()
  debutMois.setDate(1)
  debutMois.setHours(0, 0, 0, 0)

  const { count: analysesCount } = await supabaseAdmin
    .from('analyses_devis')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('siret_artisan', siretClient)
    .gte('created_at', debutMois.toISOString())

  if ((analysesCount ?? 0) >= 5) {
    return NextResponse.json(
      {
        error: 'quota_depasse',
        message: 'Quota atteint pour cet artisan (5/mois). Revenez le 1er du mois prochain.',
        analyses_utilisees: analysesCount,
        quota_max: 5,
      },
      { status: 429 }
    )
  }

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

  // ── 5. Analyse unifiée (prix + juridique en un seul appel) ───────────────
  const docContent = mimeType === 'application/pdf'
    ? { type: 'document' as const, source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: fileBase64 } }
    : { type: 'image' as const, source: { type: 'base64' as const, media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/webp', data: fileBase64 } }

  let analysisRaw: any = null

  const SYSTEM_PROMPT = `Tu es un expert juridique et commercial spécialisé dans l'analyse de devis de travaux en France.

Tu analyses le devis fourni et retournes un JSON structuré UNIQUEMENT, sans backticks, sans markdown.

RÈGLES DE SCORING STRICTES :
- Commence à 10/10
- Chaque mention légale obligatoire manquante : -1.5 point
- Chaque mention importante manquante : -0.5 point
- Le score final NE PEUT PAS dépasser le plafond selon les manquements légaux :
  * 0 manquement légal → max 10
  * 1 manquement légal → max 8
  * 2 manquements légaux → max 7
  * 3 manquements légaux → max 6
  * 4+ manquements légaux → max 5
- Arrondis toujours à l'entier inférieur
- Le verdict DOIT être cohérent avec le score (voir barème)

MENTIONS LÉGALES OBLIGATOIRES (absence = -1.5 pt) :
1. Délai d'exécution précis (date début et fin prévues)
2. Droit de rétractation 14 jours (art. L.221-18 si applicable)
3. Conditions de garantie explicites (parfait achèvement, biennale, décennale)
4. Conditions générales de vente ou référence à un document joint
5. Modalités de facturation et d'exécution

MENTIONS IMPORTANTES (absence = -0.5 pt) :
1. Pourcentage d'acompte justifié
2. Clause de révision de prix
3. Responsabilité civile avec montant de couverture

ANALYSE DES PRIX :
- Estime d'abord la fourchette de marché pour ce type de travaux et cette région SANS regarder le montant du devis
- Compare ensuite avec le montant réel
- Sois critique : un devis 30% au-dessus de la fourchette haute = "Élevé", pas "Dans la norme"

BARÈME VERDICTS :
- 9-10 : "Devis excellent — vous pouvez signer en confiance"
- 7-8 : "Devis correct — quelques points à clarifier avant de signer"
- 5-6 : "Devis à corriger — demandez les éléments manquants avant tout engagement"
- 3-4 : "Devis insuffisant — ne signez pas sans corrections importantes"
- 1-2 : "Devis à rejeter — mentions légales obligatoires absentes"

Retourne UNIQUEMENT ce JSON (pas de backticks, pas de markdown) :
{
  "score": <entier 1-10>,
  "verdict": "<texte du verdict selon barème>",
  "mentions_presentes": ["<liste des mentions trouvées>"],
  "mentions_manquantes": ["<liste des mentions absentes>"],
  "recommandations": ["<liste des actions concrètes à faire>"],
  "analyse_prix": {
    "montant_devis": <nombre>,
    "fourchette_min": <nombre>,
    "fourchette_max": <nombre>,
    "prix_moyen_marche": <nombre>,
    "position": "<Trop bas|Dans la norme|Légèrement élevé|Élevé|Excessif>",
    "commentaire": "<explication courte>"
  },
  "facteurs_variation": ["<liste des facteurs qui justifient le prix>"],
  "type_travaux": "<catégorie détectée>",
  "region": "<région détectée si mentionnée>"
}`

  try {
    const analysisMsg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [docContent, { type: 'text', text: 'Analyse ce devis.' }],
      }],
    })

    const analysisText = analysisMsg.content[0].type === 'text' ? analysisMsg.content[0].text : '{}'
    try {
      analysisRaw = parseJson(analysisText)
    } catch {
      console.error('[analyser-devis] JSON parse failed:', analysisText.slice(0, 200))
    }
  } catch (err: any) {
    console.error('[analyser-devis] Erreur Claude:', err?.message)
    return NextResponse.json({ error: `Erreur IA : ${err?.message || 'Appel Claude échoué'}` }, { status: 500 })
  }

  if (!analysisRaw) {
    return NextResponse.json({ error: 'Réponse IA invalide. Réessayez ou changez de fichier.' }, { status: 500 })
  }

  // ── Mapper vers la structure attendue par le frontend ────────────────────
  const positionToVerdictPrix = (position: string): 'normal' | 'sous-evalue' | 'surevalue' => {
    if (position === 'Trop bas') return 'sous-evalue'
    if (position === 'Dans la norme' || position === 'Légèrement élevé') return 'normal'
    return 'surevalue' // Élevé, Excessif
  }

  const scoreToVerdictJuridique = (score: number): 'conforme' | 'a_corriger' | 'non_conforme' => {
    if (score >= 8) return 'conforme'
    if (score >= 5) return 'a_corriger'
    return 'non_conforme'
  }

  const ap = analysisRaw.analyse_prix ?? {}
  const scoreGlobal: number = analysisRaw.score ?? 5

  const prixRaw = {
    siret: siretExtrait,
    nom_artisan: null,
    type_travaux: analysisRaw.type_travaux ?? null,
    region: analysisRaw.region ?? null,
    montant_devis: ap.montant_devis ?? null,
    fourchette_basse: ap.fourchette_min ?? 0,
    fourchette_haute: ap.fourchette_max ?? 0,
    prix_moyen: ap.prix_moyen_marche ?? 0,
    verdict_prix: positionToVerdictPrix(ap.position ?? 'Dans la norme'),
    ecart_pourcentage: ap.montant_devis && ap.prix_moyen_marche
      ? Math.round(((ap.montant_devis - ap.prix_moyen_marche) / ap.prix_moyen_marche) * 100)
      : 0,
    facteurs: analysisRaw.facteurs_variation ?? [],
    alerte: ap.commentaire ?? null,
  }

  const juridiqueRaw = {
    score_conformite: scoreGlobal,
    mentions_presentes: analysisRaw.mentions_presentes ?? [],
    mentions_manquantes: analysisRaw.mentions_manquantes ?? [],
    clauses_abusives: [],
    verdict_juridique: scoreToVerdictJuridique(scoreGlobal),
    recommandations: analysisRaw.recommandations ?? [],
  }

  const resultatComplet = {
    prix: prixRaw,
    juridique: juridiqueRaw,
    score_global: scoreGlobal,
    verdict: analysisRaw.verdict ?? null,
    siret_artisan: siretClient,
    est_gratuite: false,
    pack_serenite_actif: true,
    analyses_utilisees: (analysesCount ?? 0) + 1,
    quota_max: 5,
    quota_restant: Math.max(0, 5 - ((analysesCount ?? 0) + 1)),
  }

  // ── 7. Logger l'analyse ──────────────────────────────────────────────────
  try {
    const { error: insertError } = await supabaseAdmin.from('analyses_devis').insert({
      user_id: user.id,
      siret_artisan: siretClient || null,
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
