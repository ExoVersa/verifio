import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ShieldCheck, CheckCircle2, XCircle, AlertCircle, Info, MapPin, Calendar, Building2, Hash, Leaf, Users, Scale, Clock, Sparkles, ArrowLeft } from 'lucide-react'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { fetchCompany } from '@/lib/fetchCompany'
import ScoreRing from '@/components/ScoreRing'
import type { SearchResult, Alert, AlertType, BodaccAnnonce } from '@/types'

export const dynamic = 'force-dynamic'

const alertIcons: Record<AlertType, React.ReactNode> = {
  safe: <CheckCircle2 size={15} />,
  warn: <AlertCircle size={15} />,
  danger: <XCircle size={15} />,
  info: <Info size={15} />,
}

const FAMILLE_COLORS: Record<string, string> = {
  'Créations': 'var(--color-safe)',
  'Immatriculations': 'var(--color-safe)',
  'Modifications diverses': '#6366f1',
  'Procédures collectives': 'var(--color-danger)',
  'Procédures de conciliation': 'var(--color-danger)',
  'Procédures de rétablissement professionnel': 'var(--color-danger)',
  'Radiations': 'var(--color-muted)',
  'Ventes et cessions': '#f59e0b',
  'Dépôts des comptes': 'var(--color-muted)',
}

function formatDate(d: string) {
  if (!d) return undefined
  try { return new Date(d).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) }
  catch { return d }
}

async function getAISummary(result: SearchResult): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) return ''
  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const prompt = `Tu es un expert en vérification d'entreprises du bâtiment français. Rédige une synthèse concise (3-4 phrases max) en français pour aider un particulier à décider s'il peut faire confiance à cet artisan.

Données de l'entreprise :
- Nom : ${result.nom}
- Statut : ${result.statut}
- Score de fiabilité : ${result.score}/100
- Activité : ${result.activite}
- Ancienneté : créée le ${result.dateCreation ? formatDate(result.dateCreation) : 'inconnue'}
- Capital social : ${result.capitalSocial !== undefined ? result.capitalSocial.toLocaleString('fr-FR') + ' €' : 'non renseigné'}
- Effectif : ${result.effectif || 'non renseigné'}
- Certifié RGE : ${result.rge.certifie ? 'Oui (' + result.rge.domaines.slice(0, 2).join(', ') + ')' : 'Non'}
- Procédure collective : ${result.bodacc.procedureCollective ? 'OUI — ' + (result.bodacc.typeProcedure || 'type inconnu') : 'Non'}
- Changement dirigeant récent : ${result.bodacc.changementDirigeantRecent ? 'Oui' : 'Non'}
- Dirigeants : ${result.dirigeants.map(d => `${d.prenoms || ''} ${d.nom} (${d.qualite})`).join(', ') || 'inconnus'}
- Alertes : ${result.alerts.map(a => a.message).join(' | ')}

Synthèse (sans intro comme "Voici" ou "Cette entreprise") :`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    })
    const block = message.content[0]
    return block.type === 'text' ? block.text.trim() : ''
  } catch {
    return ''
  }
}

export default async function SuccesPage({
  searchParams,
}: {
  searchParams: Promise<{ siret?: string; session_id?: string }>
}) {
  const params = await searchParams
  const siret = params.siret
  const session_id = params.session_id

  // ── Vérification Stripe obligatoire ─────────────────────────────────────
  if (!session_id) {
    redirect('/recherche')
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-02-25.clover',
    })
    const stripeSession = await stripe.checkout.sessions.retrieve(session_id)

    if (stripeSession.payment_status !== 'paid') {
      redirect('/recherche')
    }

    // ── Persistance dans la table rapports ──────────────────────────────
    if (siret) {
      try {
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
        )
        await supabaseAdmin.from('rapports').upsert(
          {
            siret,
            stripe_session_id: session_id,
            montant: 490,
            statut: 'genere',
          },
          { onConflict: 'stripe_session_id', ignoreDuplicates: true },
        )
      } catch {
        // Non bloquant — le rapport s'affiche même si l'insert échoue
      }
    }
  } catch {
    // Session Stripe invalide, expirée ou clé manquante
    redirect('/recherche')
  }

  // ── Chargement des données entreprise ────────────────────────────────────
  if (!siret) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--color-bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--color-muted)', marginBottom: '16px' }}>Paramètre SIRET manquant.</p>
          <Link href="/" style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600 }}>← Retour</Link>
        </div>
      </main>
    )
  }

  let result: SearchResult | null = null
  let fetchError = ''
  let aiSummary = ''

  try {
    result = await fetchCompany(siret)
    aiSummary = await getAISummary(result)
  } catch (err: any) {
    fetchError = err.message || 'Erreur lors du chargement des données.'
  }

  const statutColor = result?.statut === 'actif' ? 'var(--color-safe)' : 'var(--color-danger)'
  const statutBg = result?.statut === 'actif' ? 'var(--color-safe-bg)' : 'var(--color-danger-bg)'

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>

      {/* Header */}
      <header style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <ShieldCheck size={22} color="var(--color-accent)" strokeWidth={2} />
        <span className="font-display" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-accent)' }}>
          Verifio
        </span>
        <span style={{
          marginLeft: 'auto',
          fontSize: '12px', fontWeight: 600,
          color: 'var(--color-safe)',
          background: 'var(--color-safe-bg)',
          padding: '4px 10px', borderRadius: '20px',
          display: 'flex', alignItems: 'center', gap: '5px',
        }}>
          <CheckCircle2 size={12} />
          Rapport complet débloqué
        </span>
      </header>

      <section style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 24px' }}>
        <Link href="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          fontSize: '13px', color: 'var(--color-muted)', textDecoration: 'none',
          marginBottom: '24px',
        }}>
          <ArrowLeft size={14} />
          Nouvelle recherche
        </Link>

        {fetchError && (
          <div style={{ padding: '20px', background: 'var(--color-danger-bg)', borderRadius: '12px', color: 'var(--color-danger)', fontSize: '14px' }}>
            {fetchError}
          </div>
        )}

        {result && (
          <div className="result-card fade-up">

            {/* Confirmation banner */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '12px 16px', borderRadius: '10px',
              background: 'var(--color-safe-bg)',
              border: '1px solid color-mix(in srgb, var(--color-safe) 30%, transparent)',
              marginBottom: '24px',
            }}>
              <CheckCircle2 size={18} color="var(--color-safe)" />
              <div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--color-safe)' }}>Paiement confirmé — Rapport complet</p>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)' }}>Toutes les données sont débloquées ci-dessous</p>
              </div>
            </div>

            {/* Header entreprise */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap' }}>
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
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-muted)', marginBottom: '12px' }}>
                    {result.activite}
                  </p>
                )}
                <div>
                  {result.alerts.map((alert, i) => (
                    <div key={i} className={`badge badge-${alert.type}`} style={{ marginBottom: '6px', width: '100%', justifyContent: 'flex-start' }}>
                      {alertIcons[alert.type]}
                      <span>{alert.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ height: '1px', background: 'var(--color-border)', marginBottom: '16px' }} />

            {/* Résumé IA */}
            {aiSummary && (
              <div style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 8%, transparent), color-mix(in srgb, var(--color-accent) 4%, transparent))',
                border: '1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)',
                marginBottom: '20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Sparkles size={16} color="var(--color-accent)" />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Synthèse IA
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.7, color: 'var(--color-text)' }}>
                  {aiSummary}
                </p>
              </div>
            )}

            {/* Infos de base */}
            {[
              { icon: <Hash size={15} />, label: 'SIRET', value: result.siret },
              { icon: <Building2 size={15} />, label: 'Forme juridique', value: result.formeJuridique },
              { icon: <Calendar size={15} />, label: 'Date de création', value: formatDate(result.dateCreation) },
              { icon: <MapPin size={15} />, label: 'Adresse', value: result.adresse },
              ...(result.capitalSocial !== undefined ? [{ icon: <Building2 size={15} />, label: 'Capital social', value: `${result.capitalSocial.toLocaleString('fr-FR')} €` }] : []),
            ].map((row, i) => row.value ? (
              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ color: 'var(--color-muted)', flexShrink: 0, marginTop: '1px' }}>{row.icon}</div>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)', marginBottom: '2px' }}>{row.label}</p>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>{row.value}</p>
                </div>
              </div>
            ) : null)}

            {/* Effectif — DÉBLOQUÉ */}
            {result.effectif && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ color: 'var(--color-muted)', flexShrink: 0, marginTop: '1px' }}><Users size={15} /></div>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)', marginBottom: '2px' }}>Effectif</p>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>{result.effectif}</p>
                </div>
              </div>
            )}

            {/* RGE */}
            <div style={{ marginTop: '20px', padding: '16px', borderRadius: '12px', background: result.rge.certifie ? 'var(--color-safe-bg)' : 'var(--color-neutral-bg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: result.rge.certifie ? '10px' : '0' }}>
                <Leaf size={17} color={result.rge.certifie ? 'var(--color-safe)' : 'var(--color-muted)'} />
                <span style={{ fontWeight: 600, fontSize: '14px', color: result.rge.certifie ? 'var(--color-safe)' : 'var(--color-muted)' }}>
                  {result.rge.certifie ? 'Certifié RGE (Reconnu Garant de l\'Environnement)' : 'Pas de certification RGE trouvée'}
                </span>
              </div>
              {result.rge.certifie && result.rge.domaines.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[...new Set(result.rge.domaines)].slice(0, 6).map((d, i) => (
                    <span key={i} className="badge badge-safe" style={{ fontSize: '11px' }}>{d}</span>
                  ))}
                </div>
              )}
              {result.rge.certifie && result.rge.organismes.length > 0 && (
                <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--color-muted)' }}>
                  Organisme(s) : {[...new Set(result.rge.organismes)].slice(0, 3).join(', ')}
                </p>
              )}
            </div>

            {/* Section premium débloquée */}
            <div style={{ marginTop: '20px', border: '1px solid color-mix(in srgb, var(--color-safe) 40%, transparent)', borderRadius: '14px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', background: 'var(--color-safe-bg)', borderBottom: '1px solid color-mix(in srgb, var(--color-safe) 20%, transparent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Scale size={16} color="var(--color-safe)" />
                <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--color-safe)' }}>
                  Santé financière &amp; historique légal — Complet
                </span>
              </div>

              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Procédure collective */}
                {result.bodacc.procedureCollective && (
                  <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--color-danger-bg)', border: '1px solid color-mix(in srgb, var(--color-danger) 30%, transparent)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <XCircle size={16} color="var(--color-danger)" style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--color-danger)' }}>
                        Procédure collective : {result.bodacc.typeProcedure || 'détectée'}
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-muted)' }}>
                        Voir les annonces BODACC ci-dessous pour le détail
                      </p>
                    </div>
                  </div>
                )}

                {/* Dirigeants — COMPLETS */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                    <Users size={14} color="var(--color-muted)" />
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Dirigeants
                    </p>
                  </div>
                  {result.dirigeants.length === 0 ? (
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)', fontStyle: 'italic' }}>Aucun dirigeant trouvé</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {result.dirigeants.map((d, i) => (
                        <div key={i} style={{ padding: '10px 12px', background: 'var(--color-bg)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                          <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
                            {[d.prenoms, d.nom].filter(Boolean).join(' ')}
                          </p>
                          <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--color-muted)' }}>
                            {d.qualite}{d.anneeNaissance ? ` · né en ${d.anneeNaissance}` : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* BODACC — COMPLET */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                    <Clock size={14} color="var(--color-muted)" />
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Annonces légales BODACC ({result.bodacc.annonces.length})
                    </p>
                  </div>
                  {result.bodacc.annonces.length === 0 ? (
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)', fontStyle: 'italic' }}>Aucune annonce trouvée</p>
                  ) : (
                    <div>
                      {result.bodacc.annonces.map((annonce, i) => {
                        const color = FAMILLE_COLORS[annonce.famille] || 'var(--color-muted)'
                        const isAlert = annonce.famille.toLowerCase().includes('procédure')
                        return (
                          <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, marginTop: '4px' }} />
                              {i < result.bodacc.annonces.length - 1 && (
                                <div style={{ width: '1px', flex: 1, background: 'var(--color-border)', marginTop: '4px', minHeight: '20px' }} />
                              )}
                            </div>
                            <div style={{ paddingBottom: '16px', flex: 1 }}>
                              <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)', marginBottom: '2px' }}>
                                {annonce.date ? new Date(annonce.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                              </p>
                              <p style={{ margin: 0, fontSize: '13px', fontWeight: isAlert ? 600 : 500, color: isAlert ? color : 'var(--color-text)' }}>
                                {annonce.famille}
                              </p>
                              {annonce.tribunal && (
                                <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-muted)' }}>{annonce.tribunal}</p>
                              )}
                              {annonce.details && (
                                <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-muted)' }}>{annonce.details}</p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Disclaimer */}
            <p style={{ margin: '16px 0 0', fontSize: '11px', color: 'var(--color-muted)', lineHeight: 1.6, padding: '12px', background: 'var(--color-bg)', borderRadius: '8px' }}>
              Données issues de l&apos;INSEE (Sirene), de l&apos;ADEME, du Registre National des Entreprises et du BODACC. Vérifiez toujours l&apos;assurance décennale en demandant l&apos;attestation directement à l&apos;artisan. Verifio n&apos;est pas responsable des décisions prises sur la base de ces données.
            </p>
          </div>
        )}
      </section>
    </main>
  )
}
