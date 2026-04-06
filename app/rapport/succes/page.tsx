import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ShieldCheck, CheckCircle2, XCircle, AlertCircle, Info, MapPin, Calendar,
  Building2, Hash, Leaf, Users, Scale, ArrowLeft, Shield, FileText,
  CreditCard, ClipboardCheck, FileSignature, FolderOpen,
  Flame, Thermometer, Sun, Home, Wind, Zap, Droplets, BellRing, FileSearch,
  Search, MessageSquare,
} from 'lucide-react'
import Anthropic from '@anthropic-ai/sdk'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { fetchCompany } from '@/lib/fetchCompany'
import ScoreRing from '@/components/ScoreRing'
import SyntheseIA from '@/components/SyntheseIA'
import BoutonPDF from '@/components/BoutonPDF'
import BoutonPartage from '@/components/BoutonPartage'
import ModeleContrat from '@/components/ModeleContrat'
import GuideRecours from '@/components/GuideRecours'
import BodaccSection from '@/components/BodaccSection'
import WelcomeModal from '@/components/WelcomeModal'
import SiteHeader from '@/components/SiteHeader'
import PackBadge from '@/components/PackBadge'
import AnalyserDevisButton from '@/components/AnalyserDevisButton'
import { SectionBadge, SurfaceCard } from '@/components/ExperiencePrimitives'
import { dirigeantSlug } from '@/lib/dirigeant'
import type { SearchResult, AlertType, BodaccAnnonce } from '@/types'

export const dynamic = 'force-dynamic'

interface DroitPersonnalise {
  titre: string
  badge: string
  badgeType: 'danger' | 'warning' | 'info' | 'success'
  texte: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function isProcedureCollective(a: BodaccAnnonce): boolean {
  const f = (a.famille ?? '').toLowerCase()
  const t = (a.type ?? '').toLowerCase()
  return (
    f.includes('procédure') || f.includes('collective') || f.includes('redressement') ||
    f.includes('liquidation') || f.includes('sauvegarde') ||
    t === 'collective' || t === 'redressement' || t === 'liquidation' || t === 'sauvegarde'
  )
}

const alertIcons: Record<AlertType, React.ReactNode> = {
  safe: <CheckCircle2 size={15} />,
  warn: <AlertCircle size={15} />,
  danger: <XCircle size={15} />,
  info: <Info size={15} />,
}

function formatDate(d: string) {
  if (!d) return undefined
  try { return new Date(d).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) }
  catch { return d }
}

// ── Fetch établissements ──────────────────────────────────────────────────────
interface InseeEtab {
  siret: string; adresse: string; etat_administratif: string
  activite_principale?: string; est_siege?: boolean
}

async function fetchEtablissements(siren: string): Promise<InseeEtab[]> {
  try {
    const res = await fetch(
      `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(siren)}&per_page=20`,
      { next: { revalidate: 3600 } }
    )
    const data = await res.json()
    return (data.results?.[0]?.matching_etablissements ?? []).map((e: Record<string, unknown>) => ({
      siret: String(e.siret ?? ''),
      adresse: [e.numero_voie, e.type_voie, e.libelle_voie, e.code_postal, e.libelle_commune].filter(Boolean).join(' '),
      etat_administratif: String(e.etat_administratif ?? 'A'),
      activite_principale: e.activite_principale ? String(e.activite_principale) : undefined,
      est_siege: Boolean(e.est_siege),
    })) as InseeEtab[]
  } catch { return [] }
}

// ── RGE icon helper ───────────────────────────────────────────────────────────
function getRgeIcon(domaine: string): React.ReactNode {
  const d = domaine.toLowerCase()
  if (d.includes('chaudière') || d.includes('chaudiere')) return <Flame size={18} strokeWidth={1.5} />
  if (d.includes('pompe') || d.includes('chaleur')) return <Thermometer size={18} strokeWidth={1.5} />
  if (d.includes('solaire') || d.includes('photovoltaïque') || d.includes('photovoltaique')) return <Sun size={18} strokeWidth={1.5} />
  if (d.includes('isolation')) return <Home size={18} strokeWidth={1.5} />
  if (d.includes('ventilation') || d.includes('vmc')) return <Wind size={18} strokeWidth={1.5} />
  if (d.includes('radiateur') || d.includes('électrique') || d.includes('electrique')) return <Zap size={18} strokeWidth={1.5} />
  if (d.includes('chauffe-eau') || d.includes('eau chaude') || d.includes('sanitaire')) return <Droplets size={18} strokeWidth={1.5} />
  return <Leaf size={18} strokeWidth={1.5} />
}

// ── Section title helper ──────────────────────────────────────────────────────
function SectionTitle({ icon, title }: { icon: React.ReactNode; title: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '14px 16px', marginBottom: '18px',
      background: 'linear-gradient(180deg, rgba(248,243,236,0.92) 0%, rgba(255,255,255,0.9) 100%)',
      borderRadius: '16px',
      border: '1px solid rgba(226,217,204,0.8)',
    }}>
      <span style={{
        color: 'var(--color-accent)',
        width: '36px',
        height: '36px',
        borderRadius: '12px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(21,59,46,0.08)',
        flexShrink: 0,
      }}>{icon}</span>
      <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 800, letterSpacing: '-0.02em' }}>{title}</h2>
    </div>
  )
}

// ── Email de confirmation ─────────────────────────────────────────────────────
function buildConfirmationEmail({ nomEntreprise, siret, score, scoreLabel, rapportUrl, surveillanceExpiry }: {
  nomEntreprise: string; siret: string; score: number; scoreLabel: string
  rapportUrl: string; surveillanceExpiry: string | null
}) {
  const scoreColor = score >= 75 ? '#15803d' : score >= 45 ? '#92400e' : '#dc2626'
  const scoreEmoji = score >= 75 ? '✓' : score >= 45 ? '⚠' : '✗'
  const exp = surveillanceExpiry
    ? new Date(surveillanceExpiry).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f0;font-family:'DM Sans',Arial,sans-serif;">
<div style="max-width:580px;margin:0 auto;padding:32px 16px;">
  <div style="text-align:center;margin-bottom:24px;">
    <div style="display:inline-flex;align-items:center;gap:8px;background:#1B4332;color:#D8F3DC;padding:10px 20px;border-radius:12px;font-size:15px;font-weight:700;letter-spacing:0.04em;">
      Rien qui cloche
    </div>
  </div>
  <div style="background:#fff;border-radius:20px;padding:32px;border:1px solid #e5e7eb;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
    <div style="text-align:center;margin-bottom:24px;">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111827;">Rapport débloqué !</h1>
      <p style="margin:0;font-size:15px;color:#6B7280;">Votre rapport complet pour <strong style="color:#111827;">${nomEntreprise}</strong> est prêt.</p>
    </div>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:14px;padding:20px;margin-bottom:24px;">
      <div style="display:flex;align-items:center;gap:16px;">
        <div style="width:56px;height:56px;border-radius:50%;background:${scoreColor};display:flex;align-items:center;justify-content:center;color:white;font-size:20px;font-weight:800;flex-shrink:0;">${score}</div>
        <div>
          <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#14532d;">Score de fiabilité : ${scoreEmoji} ${scoreLabel}</p>
          <p style="margin:0;font-size:12px;color:#166534;">SIRET : ${siret}</p>
        </div>
      </div>
    </div>
    ${exp ? `<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:14px 16px;margin-bottom:20px;">
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#1e40af;">Surveillance activée</p>
      <p style="margin:0;font-size:12px;color:#1d4ed8;">Vous serez alerté de tout changement jusqu'au ${exp}.</p>
    </div>` : ''}
    <div style="margin:0 0 24px;">
      <p style="font-weight:700;font-size:14px;color:#111827;margin:0 0 12px;">Ce que vous avez débloqué :</p>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;color:#374151;">Rapport PDF complet</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;color:#2DB96E;text-align:right;font-weight:600;">Disponible</td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;color:#374151;">Analyse juridique de devis</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;color:#2DB96E;text-align:right;font-weight:600;">Disponible</td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;color:#374151;">Surveillance 6 mois</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;color:#2DB96E;text-align:right;font-weight:600;">${exp ? `Activée jusqu'au ${exp}` : 'Disponible'}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;color:#374151;">Checklist personnalisée</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;color:#2DB96E;text-align:right;font-weight:600;">Disponible</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#374151;">Guide droits &amp; recours</td>
          <td style="padding:8px 0;color:#2DB96E;text-align:right;font-weight:600;">Disponible</td>
        </tr>
      </table>
    </div>
    <div style="text-align:center;margin-bottom:20px;">
      <a href="${rapportUrl}" style="display:inline-block;padding:13px 28px;border-radius:12px;background:#1B4332;color:#fff;font-size:14px;font-weight:600;text-decoration:none;">
        Accéder au rapport complet →
      </a>
    </div>
    <p style="margin:0;font-size:12px;color:#9CA3AF;text-align:center;border-top:1px solid #f3f4f6;padding-top:16px;">
      Données officielles · INSEE · ADEME · BODACC<br>
      © Rien qui cloche ${new Date().getFullYear()}
    </p>
  </div>
</div>
</body></html>`.trim()
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function SuccesPage({
  searchParams,
}: {
  searchParams: Promise<{ siret?: string; session_id?: string; from?: string; new?: string }>
}) {
  const params = await searchParams
  const siret = params.siret
  const session_id = params.session_id
  const from = params.from
  const isNew = params.new === 'true'

  if (!session_id) redirect('/recherche')

  // 1. Stripe verification
  let userId: string | null = null
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })
    const stripeSession = await stripe.checkout.sessions.retrieve(session_id)
    if (stripeSession.payment_status !== 'paid') redirect('/recherche')
    userId = stripeSession.metadata?.user_id || null
  } catch { redirect('/recherche') }

  if (!siret) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--color-bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--color-muted)', marginBottom: '16px' }}>Paramètre SIRET manquant.</p>
          <Link href="/" style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}><ArrowLeft size={14} strokeWidth={1.5} />Retour</Link>
        </div>
      </main>
    )
  }

  // 2. Company data
  let result: SearchResult | null = null
  let fetchError = ''
  let etablissements: InseeEtab[] = []

  try {
    result = await fetchCompany(siret)
    if (result.siren) etablissements = await fetchEtablissements(result.siren)
  } catch (err: unknown) {
    fetchError = err instanceof Error ? err.message : 'Erreur lors du chargement des données.'
  }

  // Droits personnalisés par IA — appel direct Anthropic
  let droitsPersonnalises: DroitPersonnalise[] = []
  if (result && process.env.ANTHROPIC_API_KEY) {
    try {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

      const anciennete = result.dateCreation
        ? Math.floor((Date.now() - new Date(result.dateCreation).getTime()) / (1000 * 60 * 60 * 24 * 365))
        : null

      const droitsResponse = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: `Tu es un expert juridique en droit de la construction et de la consommation en France.

Un particulier s'apprête à signer un contrat avec cet artisan :
- Forme juridique : ${result.formeJuridique || 'inconnue'}
- Activité : ${result.activite || 'inconnue'} (code NAF : ${result.codeNaf || 'inconnu'})
- Ancienneté : ${anciennete !== null ? `${anciennete} an(s)` : 'inconnue'}
- Score de fiabilité : ${result.score}/100
- Certifié RGE : ${result.rge?.certifie ? `oui (${result.rge.domaines?.join(', ')})` : 'non'}
- Procédure collective BODACC : ${result.bodacc?.procedureCollective ? 'oui' : 'non'}
- Effectif : ${result.effectif || 'non renseigné'}

Génère exactement 2 ou 3 droits ou points de vigilance SPÉCIFIQUES à ce profil que le particulier doit absolument connaître avant de signer. Ces droits doivent être différents des 4 droits universels déjà affichés (garantie décennale, devis écrit, acompte 30%, PV réception).

Réponds UNIQUEMENT en JSON strict, sans markdown, sans backticks :
[
  {
    "titre": "Titre court et direct (max 6 mots)",
    "badge": "Label court (max 3 mots)",
    "badgeType": "danger" ou "warning" ou "info" ou "success",
    "texte": "Explication pratique et actionnable en 2-3 phrases max."
  }
]`,
        }],
      })

      const text = droitsResponse.content[0].type === 'text' ? droitsResponse.content[0].text : ''
      const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
      const parsed = JSON.parse(cleaned)
      if (Array.isArray(parsed)) droitsPersonnalises = parsed
    } catch (e) {
      console.error('droits personnalisés error:', e)
    }
  }

  // 3. Rapport persistence + surveillance + email
  let rapportId: string | null = null
  let surveillanceExpiresAt: string | null = null
  let devisUploads: Array<{ id: string; version: number; nom_fichier: string | null; created_at: string }> = []

  console.log('=== RAPPORT SUCCES DEBUG ===')
  console.log('session_id:', session_id)
  console.log('siret:', siret)
  console.log('userId from Stripe metadata:', userId)
  console.log('SUPABASE_SERVICE_ROLE_KEY set:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
  console.log('NEXT_PUBLIC_SUPABASE_URL set:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)

  if (userId) {
    try {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      )

      // Check existing rapport
      const { data: existing, error: existingErr } = await supabaseAdmin
        .from('rapports').select('id').eq('stripe_session_id', session_id).maybeSingle()
      if (existingErr) console.error('CHECK EXISTING ERROR:', existingErr)

      if (!existing) {
        // New rapport — insert
        console.log('Tentative insertion rapport...')
        const { data: inserted, error: rapportError } = await supabaseAdmin.from('rapports').insert({
          user_id: userId, siret, stripe_session_id: session_id, montant: 490, statut: 'genere',
          nom_entreprise: result?.nom || null,
        }).select('id').single()
        console.log('Rapport inséré:', inserted)
        console.log('Rapport erreur:', rapportError)
        rapportId = inserted?.id ?? null

        // Récupérer l'email de l'utilisateur (requis pour surveillances)
        const { data: authData } = await supabaseAdmin.auth.admin.getUserById(userId)
        const userEmail = authData?.user?.email

        // Auto-activate surveillance 6 months
        const exp = new Date()
        exp.setMonth(exp.getMonth() + 6)
        surveillanceExpiresAt = exp.toISOString()
        console.log('Tentative insertion surveillance...')
        // Normaliser le statut pour éviter les faux positifs (A → actif, F → ferme)
        const normalizeStatut = (s: string | null | undefined): string => {
          if (!s) return 'actif'
          const l = s.toLowerCase().trim()
          if (l === 'a' || l === 'actif' || l === 'active') return 'actif'
          if (l === 'f' || l === 'fermé' || l === 'ferme' || l === 'ceased') return 'ferme'
          return l
        }
        const { data: survData, error: survError } = await supabaseAdmin.from('surveillances').upsert({
          user_id: userId, siret,
          email: userEmail ?? null,
          nom_artisan: result?.nom || siret,
          expires_at: surveillanceExpiresAt,
          statut_initial: normalizeStatut(result?.statut),
        }, { onConflict: 'email,siret', ignoreDuplicates: false }).select('id').single()
        console.log('Surveillance insérée:', survData)
        console.log('Surveillance erreur:', survError)

        // Send confirmation email
        try {
          console.log('User email for confirmation:', userEmail)
          if (userEmail && result) {
            const resend = new Resend(process.env.RESEND_API_KEY)
            const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.rienquicloche.fr'
            const scoreLabel = result.score >= 75 ? 'Fiable' : result.score >= 45 ? 'Vigilance' : 'Risque'
            await resend.emails.send({
              from: 'Rien qui cloche <contact@rienquicloche.fr>',
              to: userEmail,
              subject: `Votre rapport complet — ${result.nom}`,
              html: buildConfirmationEmail({
                nomEntreprise: result.nom, siret,
                score: result.score, scoreLabel,
                rapportUrl: `${BASE_URL}/rapport/succes?siret=${siret}&session_id=${session_id}`,
                surveillanceExpiry: surveillanceExpiresAt,
              }),
            })
            console.log('Email de confirmation envoyé à', userEmail)
          }
        } catch (emailErr) { console.error('EMAIL ERROR:', emailErr) }
      } else {
        console.log('Rapport déjà en base, id:', existing.id)
        rapportId = existing.id
        // Fetch existing surveillance
        const { data: surv } = await supabaseAdmin.from('surveillances')
          .select('expires_at').eq('user_id', userId).eq('siret', siret).maybeSingle()
        surveillanceExpiresAt = surv?.expires_at ?? null
      }

      // Devis uploads for this rapport
      if (rapportId) {
        const { data: uploads } = await supabaseAdmin.from('devis_uploads')
          .select('id, version, nom_fichier, created_at')
          .eq('rapport_id', rapportId)
          .order('created_at', { ascending: false })
        devisUploads = (uploads ?? []) as typeof devisUploads
      }
    } catch (e) { console.error('RAPPORT PERSISTENCE ERROR:', e) }
  } else {
    console.error('userId null — insertion ignorée. Vérifier Stripe metadata.user_id dans le checkout.')
  }

  const statutColor = result?.statut === 'actif' ? 'var(--color-safe)' : 'var(--color-danger)'
  const statutBg = result?.statut === 'actif' ? 'var(--color-safe-bg)' : 'var(--color-danger-bg)'

  const nomDirigeant = result && result.dirigeants.length > 0
    ? [result.dirigeants[0].prenoms, result.dirigeants[0].nom].filter(Boolean).join(' ')
    : ''

  const syntheseInput = result ? {
    nom: result.nom, siret: result.siret, score: result.score, statut: result.statut,
    dateCreation: result.dateCreation, formeJuridique: result.formeJuridique,
    effectif: result.effectif || '',
    certifieRge: result.rge.certifie, domainesRge: result.rge.domaines,
    dirigeants: result.dirigeants.map(d => ({ nom: d.nom, qualite: d.qualite, anneeNaissance: d.anneeNaissance })),
    nbAnnoncesBodacc: result.bodacc.annonces.length,
    proceduresCollectives: result.bodacc.annonces.filter(isProcedureCollective).length,
  } : null

  // Bouton retour contextuel
  const backLabel = from === 'mon-espace' ? 'Mes rapports' : 'Retour à la fiche'
  const backHref = from === 'mon-espace' ? '/mon-espace?tab=rapports' : `/artisan/${siret}`

  // Score label pour sidebar
  const scoreLabel = result
    ? result.score >= 75 ? 'FIABLE' : result.score >= 45 ? 'VIGILANCE' : 'RISQUE'
    : null
  const scoreLabelStyle: Record<string, { bg: string; color: string }> = {
    FIABLE: { bg: 'var(--color-safe-bg)', color: 'var(--color-safe)' },
    VIGILANCE: { bg: '#fffbeb', color: '#92400e' },
    RISQUE: { bg: 'var(--color-danger-bg)', color: 'var(--color-danger)' },
  }

  // RGE domaines uniques avec organismes
  const domainesUniques = result ? [...new Set(result.rge.domaines)] : []
  const organismeParDomaine: Record<string, string> = {}
  if (result) {
    result.rge.domaines.forEach((d, i) => {
      if (!organismeParDomaine[d] && result.rge.organismes[i]) {
        organismeParDomaine[d] = result.rge.organismes[i]
      }
    })
  }

  return (
    <>
    <SiteHeader />
    <main style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8f4ee 0%, #f5efe7 34%, #fcfaf7 100%)', overflowX: 'hidden' }}>

      {/* Sub-header rapport */}
      <header style={{
        padding: '14px 24px', borderBottom: '1px solid rgba(226,217,204,0.82)',
        background: 'rgba(252,249,245,0.86)',
        backdropFilter: 'blur(18px)',
        display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <ShieldCheck size={22} color="var(--color-accent)" strokeWidth={2} />
        <span className="font-display" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-accent)' }}>
          Rien qui cloche
        </span>
        <span style={{
          fontSize: '12px', fontWeight: 600, color: 'var(--color-safe)',
          background: 'var(--color-safe-bg)', padding: '4px 10px', borderRadius: '20px',
          display: 'flex', alignItems: 'center', gap: '5px',
        }}>
          <CheckCircle2 size={12} />
          Rapport complet débloqué
        </span>
        <Link href={backHref} style={{
          marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '6px',
          fontSize: '13px', color: 'var(--color-muted)', textDecoration: 'none',
        }}>
          <ArrowLeft size={14} />
          {backLabel}
        </Link>
      </header>

      {fetchError && (
        <div style={{ maxWidth: 900, margin: '24px auto', padding: '16px 24px', background: 'var(--color-danger-bg)', borderRadius: '12px', color: 'var(--color-danger)', fontSize: '14px' }}>
          {fetchError}
        </div>
      )}

      {result && (
        <div className="rapport-layout" style={{ paddingTop: '28px', paddingBottom: '52px' }}>

          {/* ══════════════ COLONNE PRINCIPALE ══════════════ */}
          <div className="rapport-main">

            {/* 0. Bandeau features débloquées */}
            <SurfaceCard style={{
              position: 'relative',
              overflow: 'hidden',
              padding: '26px 24px',
              marginBottom: '18px',
              background: 'linear-gradient(135deg, #153b2e 0%, #1e4d3d 62%, #2a5d49 100%)',
              border: '1px solid rgba(21,59,46,0.08)',
              boxShadow: '0 24px 60px rgba(21,59,46,0.18)',
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at 14% 18%, rgba(255,255,255,0.10), transparent 24%), radial-gradient(circle at 82% 20%, rgba(123,242,193,0.16), transparent 20%)',
              }} />
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '18px' }}>
                  <div style={{ maxWidth: '560px' }}>
                    <SectionBadge text="Pack Serenite active" tone="light" />
                    <h1 className="font-display" style={{ margin: '16px 0 8px', fontSize: 'clamp(28px, 4vw, 40px)', lineHeight: 1.02, letterSpacing: '-0.05em', color: '#ffffff', fontWeight: 800 }}>
                      Votre lecture complete de {result.nom}
                    </h1>
                    <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.7, color: 'rgba(240,248,243,0.78)' }}>
                      Toutes les donnees utiles sont reunies ici pour vous aider a choisir, signer et suivre avec plus de confiance.
                    </p>
                  </div>
                  <div style={{
                    minWidth: '180px',
                    padding: '14px 16px',
                    borderRadius: '18px',
                    background: 'rgba(255,255,255,0.10)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    color: '#eff8f3',
                  }}>
                    <p style={{ margin: '0 0 6px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.78 }}>Statut du rapport</p>
                    <p style={{ margin: 0, fontSize: '24px', fontWeight: 800, letterSpacing: '-0.04em' }}>Debloque</p>
                    <p style={{ margin: '8px 0 0', fontSize: '12px', lineHeight: 1.5, opacity: 0.76 }}>
                      Paiement verifie, surveillance activee et outils premium disponibles.
                    </p>
                  </div>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
                  gap: '10px',
                }}>
                  {([
                    { Icon: FileText, label: 'PDF' },
                    { Icon: Search, label: 'Analyse devis' },
                    { Icon: BellRing, label: 'Surveillance 6 mois' },
                    { Icon: Scale, label: 'Droits & recours' },
                    { Icon: ClipboardCheck, label: 'Checklist' },
                    { Icon: MessageSquare, label: 'Questions utiles' },
                  ] as const).map(({ Icon, label }) => (
                    <div key={label} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 14px',
                      borderRadius: '16px',
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}>
                      <Icon size={14} color="#d8f3dc" strokeWidth={1.6} />
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#eef8f3' }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </SurfaceCard>

            {/* 1. Bannière confirmation */}
            <SurfaceCard style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '16px 18px',
              background: 'linear-gradient(180deg, rgba(234,243,222,0.9) 0%, rgba(255,255,255,0.94) 100%)',
              border: '1px solid rgba(59,109,17,0.16)',
              marginBottom: '24px',
              boxShadow: '0 14px 28px rgba(39,80,10,0.08)',
            }}>
              <CheckCircle2 size={18} color="var(--color-safe)" />
              <div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--color-safe)' }}>Paiement confirme, rapport complet disponible</p>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)' }}>Toutes les données sont débloquées ci-dessous</p>
              </div>
            </SurfaceCard>

            {/* 2. Score + statut + identité */}
            <SurfaceCard style={{ padding: '24px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap' }}>
                <ScoreRing score={result.score} />
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <h1 className="font-display" style={{ margin: 0, fontSize: '20px', fontWeight: 700, letterSpacing: '-0.01em' }}>
                      {result.nom}
                    </h1>
                    <span className="badge" style={{ background: statutBg, color: statutColor }}>
                      {result.statut === 'actif' ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      {result.statut}
                    </span>
                  </div>
                  {result.activite && (
                    <p style={{ margin: '0 0 12px', fontSize: '14px', color: 'var(--color-muted)' }}>{result.activite}</p>
                  )}
                  <div>
                    {result.alerts.map((alert, i) => (
                      <div key={i} className={`badge badge-${alert.type}`} style={{ marginBottom: '6px', width: '100%', justifyContent: 'flex-start', background: 'rgba(255,255,255,0.72)' }}>
                        {alertIcons[alert.type]}
                        <span>{alert.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ height: '1px', background: 'var(--color-border)', margin: '0 0 16px' }} />

              {/* Identité */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                {[
                  { icon: <Hash size={14} />, label: 'SIRET', value: result.siret },
                  { icon: <Building2 size={14} />, label: 'Forme juridique', value: result.formeJuridique },
                  { icon: <Calendar size={14} />, label: 'Créé le', value: formatDate(result.dateCreation) },
                  { icon: <MapPin size={14} />, label: 'Adresse', value: result.adresse },
                  ...(result.capitalSocial !== undefined ? [{ icon: <Building2 size={14} />, label: 'Capital social', value: `${result.capitalSocial.toLocaleString('fr-FR')} €` }] : []),
                  ...(result.effectif ? [{ icon: <Users size={14} />, label: 'Effectif', value: result.effectif }] : []),
                ].filter(r => r.value).map((row, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', background: 'rgba(248,243,236,0.8)', border: '1px solid rgba(226,217,204,0.76)', borderRadius: '16px', padding: '14px 15px' }}>
                    <span style={{ color: 'var(--color-muted)', flexShrink: 0, marginTop: '1px', width: '30px', height: '30px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(21,59,46,0.06)' }}>{row.icon}</span>
                    <div>
                      <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-muted)' }}>{row.label}</p>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: 500 }}>{row.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SurfaceCard>

            {/* 3. Carte localisation */}
            {result.adresse && (
              <SurfaceCard style={{ padding: '20px', marginBottom: '20px' }}>
                <SectionTitle icon={<MapPin size={18} />} title="Localisation du siège" />
                <iframe
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(result.adresse)}&output=embed`}
                  width="100%" height="200"
                  style={{ border: 0, borderRadius: '10px', display: 'block' }}
                  allowFullScreen loading="lazy"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text)' }}>{result.adresse}</p>
                  <a href={`https://www.google.com/maps/search/${encodeURIComponent(result.adresse)}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: '12px', color: 'var(--color-accent)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                    Ouvrir Maps →
                  </a>
                </div>
              </SurfaceCard>
            )}

            {/* 4. Établissements */}
            {etablissements.length > 0 && (
              <SurfaceCard style={{ padding: '20px', marginBottom: '20px' }}>
                <SectionTitle icon={<Building2 size={18} />} title={`Établissements (${etablissements.length})`} />
                {etablissements.length === 1 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', background: 'var(--color-safe-bg)', border: '1px solid color-mix(in srgb, var(--color-safe) 30%, transparent)' }}>
                    <CheckCircle2 size={14} color="var(--color-safe)" />
                    <span style={{ fontSize: '13px', color: 'var(--color-safe)', fontWeight: 600, flex: 1 }}>Siège unique — pas d&apos;établissement secondaire</span>
                    <span className="badge badge-safe" style={{ fontSize: '10px' }}>Structure simple</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {etablissements.map((etab, i) => (
                      <div key={i} style={{ padding: '10px 12px', background: 'var(--color-bg)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)' }}>{etab.est_siege ? 'Siège social' : 'Établissement secondaire'}</span>
                          <span className={`badge badge-${etab.etat_administratif === 'A' ? 'safe' : 'neutral'}`} style={{ fontSize: '10px' }}>
                            {etab.etat_administratif === 'A' ? 'Actif' : 'Fermé'}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '13px' }}>{etab.adresse || '—'}</p>
                        {etab.activite_principale && <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-muted)' }}>{etab.activite_principale}</p>}
                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-muted)' }}>SIRET : {etab.siret}</p>
                      </div>
                    ))}
                  </div>
                )}
              </SurfaceCard>
            )}

            {/* 5. Certifications RGE */}
            <SurfaceCard style={{ padding: '20px', marginBottom: '20px' }}>
              <SectionTitle icon={<Leaf size={18} />} title="Certifications RGE" />
              {!result.rge.certifie ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '10px', background: 'var(--color-neutral-bg)' }}>
                  <Leaf size={16} color="var(--color-muted)" strokeWidth={1.5} />
                  <span style={{ fontSize: '13px', color: 'var(--color-muted)' }}>Pas de certification RGE trouvée pour cet artisan.</span>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                  {domainesUniques.map((domaine, i) => (
                    <div key={i} style={{
                      padding: '12px', borderRadius: '10px',
                      background: 'rgba(45,185,110,0.06)',
                      border: '1px solid color-mix(in srgb, var(--color-safe) 30%, transparent)',
                      display: 'flex', flexDirection: 'column', gap: '6px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--color-safe)' }}>{getRgeIcon(domaine)}</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, lineHeight: 1.3 }}>{domaine}</span>
                      </div>
                      {organismeParDomaine[domaine] && (
                        <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: 'var(--color-neutral-bg)', color: 'var(--color-muted)', alignSelf: 'flex-start', fontWeight: 600 }}>
                          {organismeParDomaine[domaine]}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SurfaceCard>

            {/* 6. Dirigeants */}
            <SurfaceCard style={{ padding: '20px', marginBottom: '20px' }}>
              <SectionTitle icon={<Users size={18} />} title="Dirigeants" />
              {result.dirigeants.length === 0 ? (
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)', fontStyle: 'italic' }}>Aucun dirigeant trouvé</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {result.dirigeants.map((d, i) => (
                    <div key={i} style={{ padding: '10px 14px', background: 'var(--color-bg)', borderRadius: '8px', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <a
                          href={`/dirigeant/${dirigeantSlug(d.nom, d.prenoms)}`}
                          style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--color-accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          {[d.prenoms, d.nom].filter(Boolean).join(' ')}
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                            <polyline points="15 3 21 3 21 9"/>
                            <line x1="10" y1="14" x2="21" y2="3"/>
                          </svg>
                        </a>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--color-muted)' }}>
                          {d.qualite}{d.anneeNaissance ? ` · né en ${d.anneeNaissance}` : ''}
                        </p>
                      </div>
                      <a
                        href={`/dirigeant/${dirigeantSlug(d.nom, d.prenoms)}`}
                        style={{ fontSize: '12px', color: 'var(--color-accent)', textDecoration: 'none', background: 'var(--color-accent-light)', padding: '4px 10px', borderRadius: '99px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                          <polyline points="9 22 9 12 15 12 15 22"/>
                        </svg>
                        Voir ses entreprises →
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </SurfaceCard>

            {/* 7. BODACC */}
            <SurfaceCard style={{ padding: '20px', marginBottom: '20px' }}>
              {result.bodacc.procedureCollective && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '12px 14px', borderRadius: '10px', background: 'var(--color-danger-bg)', border: '1px solid color-mix(in srgb, var(--color-danger) 30%, transparent)', marginBottom: '16px' }}>
                  <XCircle size={16} color="var(--color-danger)" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--color-danger)' }}>
                      Procédure collective : {result.bodacc.typeProcedure || 'détectée'}
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-muted)' }}>Voir le détail dans les annonces ci-dessous</p>
                  </div>
                </div>
              )}
              <BodaccSection annonces={result.bodacc.annonces} />
            </SurfaceCard>

            {/* 7b. Marchés publics BOAMP */}
            {result.boampMarches && result.boampMarches.length > 0 && (
              <SurfaceCard style={{ padding: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '16px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-text)' }}>
                    Marchés publics gagnés
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 500, padding: '2px 8px',
                    borderRadius: 99, background: '#EAF3DE', color: '#27500A',
                  }}>
                    {result.boampMarches.length} trouvé{result.boampMarches.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {result.boampMarches.map((m, i) => (
                    <div key={i} style={{
                      padding: '10px 14px',
                      background: 'var(--color-bg)',
                      borderRadius: 10,
                      border: '0.5px solid var(--color-border)',
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', marginBottom: 4 }}>
                        {m.objet}
                      </div>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11, color: 'var(--color-muted)' }}>
                        {m.date && (
                          <span>{new Date(m.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        )}
                        {m.montant && <span style={{ color: '#27500A', fontWeight: 500 }}>{m.montant}</span>}
                        {m.procedure && <span>{m.procedure}</span>}
                        {m.acheteur && <span>{m.acheteur}</span>}
                      </div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 10, marginBottom: 0 }}>
                  Source : BOAMP — Bulletin officiel des annonces des marchés publics
                </p>
              </SurfaceCard>
            )}

            {/* 8. Vos droits avant de signer */}
            <SurfaceCard style={{ padding: '20px', marginBottom: '20px' }}>
              <SectionTitle icon={<Scale size={18} />} title={<>Vos droits avant de signer<PackBadge /></>} />
              <p style={{ margin: '-8px 0 16px', fontSize: '13px', color: 'var(--color-muted)' }}>Ce que la loi vous garantit</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {[
                  { Icon: Shield, color: 'var(--color-danger)', title: 'Garantie décennale — obligatoire', badge: 'Obligatoire par la loi', badgeBg: 'var(--color-danger-bg)', badgeColor: 'var(--color-danger)', text: "Tout artisan du bâtiment doit être couvert par une assurance décennale. Elle couvre les dommages compromettant la solidité de l'ouvrage pendant 10 ans après réception des travaux. Exigez l'attestation avant signature." },
                  { Icon: FileText, color: '#c2410c', title: 'Devis écrit obligatoire', badge: 'Au-dessus de 150€', badgeBg: '#ffedd5', badgeColor: '#c2410c', text: 'Pour tout chantier supérieur à 150€, le devis doit être écrit et détaillé : nature des travaux, matériaux utilisés, prix unitaires, délai d\'exécution, conditions de paiement.' },
                  { Icon: CreditCard, color: '#c2410c', title: 'Acompte limité à 30%', badge: '30% maximum', badgeBg: '#ffedd5', badgeColor: '#c2410c', text: 'Aucun artisan ne peut légalement exiger plus de 30% d\'acompte avant le début des travaux. Un acompte supérieur est un signal d\'alarme. Le solde se règle à la réception.' },
                  { Icon: ClipboardCheck, color: 'var(--color-safe)', title: 'Procès-verbal de réception', badge: 'Déclenche vos garanties', badgeBg: 'var(--color-safe-bg)', badgeColor: 'var(--color-safe)', text: 'À la fin du chantier, exigez un procès-verbal de réception signé par les deux parties. Ce document déclenche les garanties légales (parfait achèvement 1 an, biennale 2 ans, décennale 10 ans).' },
                ].map(({ Icon, color, title, badge, badgeBg, badgeColor, text }, i) => (
                  <div key={i} style={{ flex: '1 1 calc(50% - 6px)', minWidth: '200px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '14px', position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: badgeBg, color: badgeColor }}>
                      {badge}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', paddingRight: '120px' }}>
                      <Icon size={15} color={color} strokeWidth={1.5} />
                      <span style={{ fontSize: '12px', fontWeight: 700 }}>{title}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)', lineHeight: 1.6 }}>{text}</p>
                  </div>
                ))}

                {/* Droits personnalisés par IA */}
                {droitsPersonnalises.length > 0 && (
                  <>
                    <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0 4px', fontSize: 11, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                      </svg>
                      Spécifique à cet artisan
                    </div>
                    {droitsPersonnalises.map((droit, i) => {
                      const badgeColors = {
                        danger:  { bg: 'var(--color-danger-bg)',  color: 'var(--color-danger)',  icon: 'var(--color-danger)' },
                        warning: { bg: '#ffedd5',                  color: '#c2410c',              icon: '#c2410c' },
                        info:    { bg: '#e0f2fe',                  color: '#0369a1',              icon: '#0369a1' },
                        success: { bg: 'var(--color-safe-bg)',     color: 'var(--color-safe)',    icon: 'var(--color-safe)' },
                      }
                      const colors = badgeColors[droit.badgeType] || badgeColors.info
                      return (
                        <div key={`custom-${i}`} style={{ flex: '1 1 calc(50% - 6px)', minWidth: '200px', background: 'var(--color-bg)', border: `1px solid ${colors.color}33`, borderRadius: '12px', padding: '14px', position: 'relative' }}>
                          <span style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: colors.bg, color: colors.color }}>
                            {droit.badge}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', paddingRight: '120px' }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={colors.icon} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"/>
                              <line x1="12" y1="8" x2="12" y2="12"/>
                              <line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                            <span style={{ fontSize: '12px', fontWeight: 700 }}>{droit.titre}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)', lineHeight: 1.6 }}>{droit.texte}</p>
                        </div>
                      )
                    })}
                  </>
                )}
              </div>
            </SurfaceCard>

            {/* 9. Modèle de contrat */}
            <SurfaceCard style={{ padding: '20px', marginBottom: '20px' }}>
              <ModeleContrat
                nomEntreprise={result.nom}
                siret={result.siret}
                adresse={result.adresse || ''}
                nomDirigeant={nomDirigeant}
                sessionId={session_id}
              />
            </SurfaceCard>

            {/* 10. Guide si ça se passe mal */}
            <SurfaceCard style={{ padding: '20px', marginBottom: '20px' }}>
              <GuideRecours />
            </SurfaceCard>

            {/* Disclaimer */}
            <p style={{ fontSize: '11px', color: 'var(--color-muted)', lineHeight: 1.6, padding: '12px', background: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              Données issues de l&apos;INSEE (Sirene), de l&apos;ADEME, du Registre National des Entreprises et du BODACC. Vérifiez toujours l&apos;assurance décennale en demandant l&apos;attestation directement à l&apos;artisan. Rien qui cloche n&apos;est pas responsable des décisions prises sur la base de ces données.
            </p>
          </div>

          {/* ══════════════ SIDEBAR STICKY ══════════════ */}
          <div className="rapport-sidebar">
            <SurfaceCard style={{ overflow: 'hidden', position: 'sticky', top: '92px' }}>

              {/* PDF + Partager */}
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid var(--color-border)' }}>
                <BoutonPDF siret={siret} sessionId={session_id} fullWidth />
                <BoutonPartage sessionId={session_id} />
              </div>

              {/* Analyse de devis */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: devisUploads.length > 0 ? '10px' : '8px' }}>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center' }}>
                    Analyser un devis<PackBadge />
                  </p>
                  {devisUploads.length > 0 && (
                    <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>{devisUploads.length} version{devisUploads.length > 1 ? 's' : ''}</span>
                  )}
                </div>
                {devisUploads.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '10px' }}>
                    {devisUploads.slice(0, 3).map((d) => (
                      <a key={d.id}
                        href={`/analyser-devis?siret=${siret}&rapport_id=${rapportId}&version=${d.version}`}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '8px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', textDecoration: 'none' }}>
                        <FileSearch size={13} color="var(--color-accent)" strokeWidth={1.5} style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: '12px', color: 'var(--color-text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {d.nom_fichier || `Devis v${d.version}`}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--color-muted)', flexShrink: 0 }}>
                          {new Date(d.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: '0 0 10px', fontSize: '12px', color: 'var(--color-muted)', lineHeight: 1.5 }}>
                    Importez votre devis pour détecter les clauses abusives et mentions manquantes.
                  </p>
                )}
                <AnalyserDevisButton
                  href={`/analyser-devis?siret=${siret}&rapport_id=${rapportId ?? ''}&version=${(devisUploads[0]?.version ?? 0) + 1}&nom=${encodeURIComponent(result?.nom ?? '')}`}
                  label={devisUploads.length > 0 ? 'Analyser une nouvelle version' : 'Analyser mon devis'}
                />
              </div>

              {/* Score résumé */}
              {scoreLabel && (
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: scoreLabelStyle[scoreLabel].bg,
                    border: `2px solid ${scoreLabelStyle[scoreLabel].color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: scoreLabelStyle[scoreLabel].color }}>
                      {result.score === -1 ? '?' : result.score}
                    </span>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '11px', color: 'var(--color-muted)' }}>Score de fiabilité</p>
                    <span style={{
                      fontSize: '12px', fontWeight: 700,
                      padding: '2px 10px', borderRadius: '20px',
                      background: scoreLabelStyle[scoreLabel].bg,
                      color: scoreLabelStyle[scoreLabel].color,
                    }}>
                      {scoreLabel === 'FIABLE' ? 'Fiable' : scoreLabel === 'VIGILANCE' ? 'Vigilance' : 'Risque'}
                    </span>
                  </div>
                </div>
              )}

              {/* Bandeau entreprise fermée */}
              {(result.statut as string)?.toLowerCase().trim() !== 'a' &&
               (result.statut as string)?.toLowerCase().trim() !== 'actif' && (
                <div style={{
                  background: '#FCEBEB',
                  border: '1.5px solid #E24B4A',
                  borderRadius: '12px',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  margin: '0 16px 12px',
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="#A32D2D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ flexShrink: 0, marginTop: 1 }}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#791F1F', marginBottom: 4 }}>
                      Entreprise fermée — ne signez aucun contrat
                    </div>
                    <div style={{ fontSize: 13, color: '#A32D2D', lineHeight: 1.5 }}>
                      Cette entreprise n&apos;est plus en activité selon les données INSEE. Tout paiement ou engagement contractuel avec une entreprise fermée présente un risque juridique et financier majeur.
                    </div>
                  </div>
                </div>
              )}

              {/* Synthèse IA compacte */}
              {syntheseInput && (
                <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
                  <SyntheseIA input={syntheseInput} compact />
                </div>
              )}

              {/* Checklist rapide */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)' }}>
                <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center' }}>
                  Checklist avant de signer<PackBadge />
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {[
                    { ok: result.statut === 'actif', label: 'Artisan enregistré et actif' },
                    { ok: !result.bodacc.procedureCollective, label: 'Aucune procédure collective' },
                    { ok: result.rge.certifie, label: 'Certifié RGE' },
                    { ok: result.dirigeants.length > 0, label: 'Dirigeant identifié' },
                    { ok: true, label: 'Demander l\'attestation décennale' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {item.ok
                        ? <CheckCircle2 size={14} color="var(--color-safe)" strokeWidth={1.5} />
                        : <XCircle size={14} color="var(--color-danger)" strokeWidth={1.5} />
                      }
                      <span style={{ fontSize: '12px', color: item.ok ? 'var(--color-text)' : 'var(--color-danger)', fontWeight: item.ok ? 400 : 600 }}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Surveillance */}
              {surveillanceExpiresAt && (
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <BellRing size={15} color="var(--color-safe)" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: '12px', fontWeight: 700, color: 'var(--color-safe)' }}>Surveillance activée</p>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-muted)' }}>
                      Valable jusqu&apos;au {new Date(surveillanceExpiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              )}

              {/* CTAs */}
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <a
                  href={`/nouveau-chantier?siret=${siret}&nom=${encodeURIComponent(result?.nom ?? '')}&adresse=${encodeURIComponent(result?.adresse ?? '')}&from=rapport&session_id=${session_id}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '8px', background: 'var(--color-accent)', color: '#fff', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}
                >
                  <FolderOpen size={15} strokeWidth={1.5} />
                  Ouvrir un carnet de chantier
                </a>
                <a href={`/mon-espace?tab=rapports`} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '8px', background: 'transparent', border: '1.5px solid var(--color-border)', color: 'var(--color-text)', textDecoration: 'none', fontSize: '13px', fontWeight: 500 }}>
                  <FileSignature size={15} strokeWidth={1.5} color="var(--color-muted)" />
                  Mes rapports
                </a>
              </div>

            </SurfaceCard>
          </div>

        </div>
      )}

      {/* Modal bienvenue — premier chargement uniquement */}
      {session_id && (
        <WelcomeModal
          sessionId={session_id}
          isNew={isNew}
          nomEntreprise={result?.nom}
        />
      )}

      <style>{`
        @media (max-width: 768px) {
          .rapport-layout { padding: 16px 12px !important; }
          .rapport-sidebar { padding-bottom: 80px; }
        }
      `}</style>
    </main>
    </>
  )
}
