import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export interface SyntheseInput {
  nom: string
  siret: string
  score: number
  statut: string
  dateCreation: string
  formeJuridique: string
  effectif: string
  certifieRge: boolean
  domainesRge: string[]
  dirigeants: { nom: string; qualite: string; anneeNaissance?: string }[]
  nbAnnoncesBodacc: number
  proceduresCollectives: number
}

export interface SyntheseResult {
  resume: string
  points_forts: string[]
  points_attention: string[]
  recommandation?: 'FIABLE' | 'VIGILANCE' | 'RISQUE'
  recommandation_texte?: string
  verdict?: 'FIABLE' | 'VIGILANCE' | 'RISQUE'
  verdict_titre?: string
  verdict_explication?: string
  actions_recommandees?: string[]
  score_explication?: string
}

const FALLBACK: SyntheseResult = {
  resume: 'Analyse indisponible momentanément. Consultez les données ci-dessous pour évaluer cet artisan.',
  points_forts: [],
  points_attention: [],
  recommandation: 'VIGILANCE',
  recommandation_texte: 'Vérifiez manuellement les informations disponibles avant de vous engager.',
}

function normalizeSiret(s: string): string {
  return s.replace(/\s/g, '')
}

/** null = autorisé ; sinon réponse d’erreur à retourner */
async function assertCanGenerateSynthese(opts: {
  siretNorm: string
  shareToken?: string
  authHeader: string | null
}): Promise<NextResponse | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return NextResponse.json({ error: 'configuration_serveur' }, { status: 503 })
  }
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (opts.shareToken) {
    const admin = createClient(url, serviceKey)
    const { data } = await admin
      .from('rapports')
      .select('siret, share_expires_at')
      .eq('share_token', opts.shareToken)
      .maybeSingle()
    if (!data) {
      return NextResponse.json({ error: 'acces_refuse' }, { status: 403 })
    }
    const rowSiret = normalizeSiret(String(data.siret || ''))
    if (rowSiret !== opts.siretNorm) {
      return NextResponse.json({ error: 'acces_refuse' }, { status: 403 })
    }
    if (!data.share_expires_at || new Date(data.share_expires_at) <= new Date()) {
      return NextResponse.json({ error: 'lien_expire' }, { status: 403 })
    }
    return null
  }

  const bearer = opts.authHeader?.replace(/^Bearer\s+/i, '')?.trim()
  if (!bearer) {
    return NextResponse.json({ error: 'non_connecte' }, { status: 401 })
  }
  const userClient = createClient(url, anonKey)
  const { data: { user }, error } = await userClient.auth.getUser(bearer)
  if (error || !user) {
    return NextResponse.json({ error: 'session_invalide' }, { status: 401 })
  }
  const admin = createClient(url, serviceKey)
  const { data: rapport } = await admin
    .from('rapports')
    .select('id')
    .eq('user_id', user.id)
    .eq('siret', opts.siretNorm)
    .maybeSingle()
  if (!rapport) {
    return NextResponse.json({ error: 'rapport_non_autorise' }, { status: 403 })
  }
  return null
}

export async function POST(req: NextRequest) {
  let raw: Record<string, unknown>
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const share_token = typeof raw.share_token === 'string' ? raw.share_token.trim() : undefined
  const { share_token: _drop, ...rawRest } = raw
  const input = rawRest as unknown as SyntheseInput
  const siretNorm = typeof input?.siret === 'string' ? normalizeSiret(input.siret) : ''
  if (!siretNorm || siretNorm.length < 9) {
    return NextResponse.json({ error: 'siret_invalide' }, { status: 400 })
  }

  const authBlock = await assertCanGenerateSynthese({
    siretNorm,
    shareToken: share_token || undefined,
    authHeader: req.headers.get('authorization'),
  })
  if (authBlock) return authBlock

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(FALLBACK)
  }

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system: `Tu es un expert en analyse juridique et financière d'entreprises du bâtiment en France. Tu analyses les données officielles d'un artisan pour aider un particulier à décider s'il peut lui faire confiance avant de signer un contrat de travaux. Tu dois être précis, direct et actionnable. Tu parles à un particulier non-expert. Réponds uniquement en JSON strict, sans markdown, sans backticks, sans texte avant ou après le JSON.`,
      messages: [
        {
          role: 'user',
          content: `Analyse cet artisan et génère une synthèse structurée en JSON avec exactement ces champs :
{
  "resume": "3-4 phrases. Présente l'entreprise (forme juridique, ancienneté, dirigeant), son score de fiabilité avec une explication chiffrée, et une conclusion directe sur la confiance qu'on peut lui accorder.",
  "verdict": "FIABLE" | "VIGILANCE" | "RISQUE",
  "verdict_titre": "Titre court et direct du verdict (ex: 'Artisan sérieux, quelques points à vérifier')",
  "verdict_explication": "2-3 phrases expliquant précisément POURQUOI ce verdict. Cite les éléments concrets du dossier.",
  "points_forts": ["Point fort concret et spécifique", "..."],
  "points_attention": ["Point d'attention concret avec explication du risque", "..."],
  "actions_recommandees": ["Action concrète à faire AVANT de signer", "...", "..."],
  "score_explication": "1 phrase expliquant le score chiffré : quels critères ont contribué positivement et lesquels ont pénalisé."
}
Règles : si aucun point d'attention retourner []. Les points doivent être spécifiques aux données fournies, jamais génériques. Les actions doivent être pratiques et réalisables par un particulier. Ne jamais inventer des données absentes du JSON fourni.
Données de l'artisan : ${JSON.stringify(input)}`,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const parsed = JSON.parse(cleaned) as SyntheseResult
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json(FALLBACK)
  }
}
