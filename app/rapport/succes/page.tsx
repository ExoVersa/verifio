import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ShieldCheck, CheckCircle2, XCircle, AlertCircle, Info, MapPin, Calendar, Building2, Hash, Leaf, Users, Scale, Clock, ArrowLeft } from 'lucide-react'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { fetchCompany } from '@/lib/fetchCompany'
import ScoreRing from '@/components/ScoreRing'
import SyntheseIA from '@/components/SyntheseIA'
import BoutonPDF from '@/components/BoutonPDF'
import type { SearchResult, AlertType, BodaccAnnonce } from '@/types'

export const dynamic = 'force-dynamic'

// ── Libellés BODACC en clair ────────────────────────────────────────────────
const LIBELLES_BODACC: Record<string, string> = {
  dpc: 'Dépôt de comptes',
  vente: 'Vente ou cession',
  immatriculation: 'Immatriculation',
  modification: 'Modification',
  radiation: 'Radiation',
  collective: 'Procédure collective',
  redressement: 'Redressement judiciaire',
  liquidation: 'Liquidation judiciaire',
  sauvegarde: 'Procédure de sauvegarde',
}

function getLibelleBodacc(type: string): string {
  if (!type) return ''
  const key = type.toLowerCase().trim()
  if (LIBELLES_BODACC[key]) return LIBELLES_BODACC[key]
  return key.charAt(0).toUpperCase() + key.slice(1)
}

function isProcedureCollective(annonce: BodaccAnnonce): boolean {
  const f = annonce.famille?.toLowerCase() ?? ''
  const t = annonce.type?.toLowerCase() ?? ''
  return (
    f.includes('procédure') ||
    f.includes('collective') ||
    f.includes('redressement') ||
    f.includes('liquidation') ||
    f.includes('sauvegarde') ||
    t === 'collective' ||
    t === 'redressement' ||
    t === 'liquidation' ||
    t === 'sauvegarde'
  )
}

// ── Couleurs famille BODACC ──────────────────────────────────────────────────
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

    // Persistance dans rapports (non bloquant)
    if (siret) {
      try {
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
        )
        await supabaseAdmin.from('rapports').upsert(
          { siret, stripe_session_id: session_id, montant: 490, statut: 'genere' },
          { onConflict: 'stripe_session_id', ignoreDuplicates: true },
        )
      } catch { /* non bloquant */ }
    }
  } catch {
    redirect('/recherche')
  }

  // ── Données artisan manquantes ───────────────────────────────────────────
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

  // ── Chargement données entreprise ────────────────────────────────────────
  let result: SearchResult | null = null
  let fetchError = ''

  try {
    result = await fetchCompany(siret)
  } catch (err: any) {
    fetchError = err.message || 'Erreur lors du chargement des données.'
  }

  const statutColor = result?.statut === 'actif' ? 'var(--color-safe)' : 'var(--color-danger)'
  const statutBg = result?.statut === 'actif' ? 'var(--color-safe-bg)' : 'var(--color-danger-bg)'

  // Input pour la synthèse IA (passé au composant client)
  const syntheseInput = result ? {
    nom: result.nom,
    siret: result.siret,
    score: result.score,
    statut: result.statut,
    dateCreation: result.dateCreation,
    formeJuridique: result.formeJuridique,
    effectif: result.effectif || '',
    certifieRge: result.rge.certifie,
    domainesRge: result.rge.domaines,
    dirigeants: result.dirigeants.map(d => ({ nom: d.nom, qualite: d.qualite, anneeNaissance: d.anneeNaissance })),
    nbAnnoncesBodacc: result.bodacc.annonces.length,
    proceduresCollectives: result.bodacc.annonces.filter(isProcedureCollective).length,
  } : null

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
        flexWrap: 'wrap',
      }}>
        <ShieldCheck size={22} color="var(--color-accent)" strokeWidth={2} />
        <span className="font-display" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-accent)' }}>
          Verifio
        </span>
        <span style={{
          fontSize: '12px', fontWeight: 600,
          color: 'var(--color-safe)',
          background: 'var(--color-safe-bg)',
          padding: '4px 10px', borderRadius: '20px',
          display: 'flex', alignItems: 'center', gap: '5px',
        }}>
          <CheckCircle2 size={12} />
          Rapport complet débloqué
        </span>
        {result && (
          <div style={{ marginLeft: 'auto' }}>
            <BoutonPDF siret={siret} sessionId={session_id} />
          </div>
        )}
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

            {/* 1. Bannière confirmation */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '12px 16px', borderRadius: '10px',
              background: 'var(--color-safe-bg)',
              border: '1px solid color-mix(in srgb, var(--color-safe) 30%, transparent)',
              marginBottom: '16px',
            }}>
              <CheckCircle2 size={18} color="var(--color-safe)" />
              <div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--color-safe)' }}>Paiement confirmé — Rapport complet</p>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)' }}>Toutes les données sont débloquées ci-dessous</p>
              </div>
            </div>

            {/* 2. Bouton PDF en haut (mobile) */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
              <BoutonPDF siret={siret} sessionId={session_id} />
            </div>

            {/* 3. Synthèse IA */}
            {syntheseInput && <SyntheseIA input={syntheseInput} />}

            {/* 4. Score + statut + alertes */}
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

            {/* 5. Données identité */}
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

            {result.effectif && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ color: 'var(--color-muted)', flexShrink: 0, marginTop: '1px' }}><Users size={15} /></div>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)', marginBottom: '2px' }}>Effectif</p>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>{result.effectif}</p>
                </div>
              </div>
            )}

            {/* 6. RGE */}
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

            {/* 7. Section premium : dirigeants + BODACC */}
            <div style={{ marginTop: '20px', border: '1px solid color-mix(in srgb, var(--color-safe) 40%, transparent)', borderRadius: '14px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', background: 'var(--color-safe-bg)', borderBottom: '1px solid color-mix(in srgb, var(--color-safe) 20%, transparent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Scale size={16} color="var(--color-safe)" />
                <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--color-safe)' }}>
                  Santé financière &amp; historique légal — Complet
                </span>
              </div>

              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

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

                {/* 7a. Dirigeants */}
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

                {/* 8. BODACC avec libellés en clair */}
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
                        const isProc = isProcedureCollective(annonce)
                        const color = isProc ? 'var(--color-danger)' : (FAMILLE_COLORS[annonce.famille] || 'var(--color-muted)')
                        const libelle = annonce.famille || getLibelleBodacc(annonce.type)
                        return (
                          <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, marginTop: '4px' }} />
                              {i < result!.bodacc.annonces.length - 1 && (
                                <div style={{ width: '1px', flex: 1, background: 'var(--color-border)', marginTop: '4px', minHeight: '20px' }} />
                              )}
                            </div>
                            <div style={{ paddingBottom: '16px', flex: 1 }}>
                              <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)', marginBottom: '2px' }}>
                                {annonce.date ? new Date(annonce.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                              </p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <p style={{ margin: 0, fontSize: '13px', fontWeight: isProc ? 600 : 500, color: isProc ? color : 'var(--color-text)' }}>
                                  {libelle}
                                </p>
                                {isProc && (
                                  <span style={{
                                    fontSize: '10px', fontWeight: 700,
                                    background: 'var(--color-danger-bg)',
                                    color: 'var(--color-danger)',
                                    padding: '1px 6px', borderRadius: '4px',
                                  }}>
                                    Procédure collective
                                  </span>
                                )}
                              </div>
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

            {/* 9. Bouton PDF en bas */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0 8px' }}>
              <BoutonPDF siret={siret} sessionId={session_id} />
            </div>

            {/* 10. Disclaimer */}
            <p style={{ margin: '8px 0 0', fontSize: '11px', color: 'var(--color-muted)', lineHeight: 1.6, padding: '12px', background: 'var(--color-bg)', borderRadius: '8px' }}>
              Données issues de l&apos;INSEE (Sirene), de l&apos;ADEME, du Registre National des Entreprises et du BODACC. Vérifiez toujours l&apos;assurance décennale en demandant l&apos;attestation directement à l&apos;artisan. Verifio n&apos;est pas responsable des décisions prises sur la base de ces données.
            </p>
          </div>
        )}
      </section>
    </main>
  )
}
