import Link from 'next/link'
import { ShieldCheck, CheckCircle2, XCircle, AlertCircle, Info, MapPin, Calendar, Building2, Hash, Leaf, Users, Scale, Clock, ArrowLeft, Share2 } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { fetchCompany } from '@/lib/fetchCompany'
import ScoreRing from '@/components/ScoreRing'
import SyntheseIA from '@/components/SyntheseIA'
import type { SearchResult, AlertType, BodaccAnnonce } from '@/types'

export const dynamic = 'force-dynamic'

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
  return LIBELLES_BODACC[key] ?? (key.charAt(0).toUpperCase() + key.slice(1))
}

function isProcedureCollective(annonce: BodaccAnnonce): boolean {
  const f = annonce.famille?.toLowerCase() ?? ''
  const t = annonce.type?.toLowerCase() ?? ''
  return f.includes('procédure') || f.includes('collective') || f.includes('redressement') ||
    f.includes('liquidation') || f.includes('sauvegarde') || t === 'collective' ||
    t === 'redressement' || t === 'liquidation' || t === 'sauvegarde'
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

interface InseeEtab {
  siret: string
  adresse: string
  etat_administratif: string
  activite_principale?: string
  est_siege?: boolean
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
  } catch {
    return []
  }
}

function PageExpired() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <div style={{ marginBottom: '20px' }}>
          <Share2 size={40} color="var(--color-border)" strokeWidth={1.5} />
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px' }}>Lien expiré</h1>
        <p style={{ fontSize: '14px', color: 'var(--color-muted)', margin: '0 0 24px' }}>
          Ce lien de partage a expiré ou est invalide.
        </p>
        <Link
          href="/recherche"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'var(--color-accent)', color: 'white',
            padding: '12px 24px', borderRadius: '10px',
            textDecoration: 'none', fontWeight: 600, fontSize: '14px',
          }}
        >
          Vérifier un artisan →
        </Link>
      </div>
    </main>
  )
}

export default async function PartageRapportPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Récupérer le rapport via share_token
  const { data: rapport } = await supabaseAdmin
    .from('rapports')
    .select('siret, share_expires_at')
    .eq('share_token', token)
    .single()

  if (!rapport) return <PageExpired />

  // Vérifier l'expiration
  if (!rapport.share_expires_at || new Date(rapport.share_expires_at) <= new Date()) {
    return <PageExpired />
  }

  const expiresLabel = new Date(rapport.share_expires_at).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const siret: string = rapport.siret

  let result: SearchResult | null = null
  let fetchError = ''
  let etablissements: InseeEtab[] = []

  try {
    result = await fetchCompany(siret)
    if (result.siren) {
      etablissements = await fetchEtablissements(result.siren)
    }
  } catch (err: any) {
    fetchError = err.message || 'Erreur lors du chargement des données.'
  }

  const statutColor = result?.statut === 'actif' ? 'var(--color-safe)' : 'var(--color-danger)'
  const statutBg = result?.statut === 'actif' ? 'var(--color-safe-bg)' : 'var(--color-danger-bg)'

  const syntheseInput = result ? {
    nom: result.nom, siret: result.siret, score: result.score,
    statut: result.statut, dateCreation: result.dateCreation,
    formeJuridique: result.formeJuridique, effectif: result.effectif || '',
    certifieRge: result.rge.certifie, domainesRge: result.rge.domaines,
    dirigeants: result.dirigeants.map(d => ({ nom: d.nom, qualite: d.qualite, anneeNaissance: d.anneeNaissance })),
    nbAnnoncesBodacc: result.bodacc.annonces.length,
    proceduresCollectives: result.bodacc.annonces.filter(isProcedureCollective).length,
  } : null

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Header */}
      <header style={{
        padding: '16px 24px', borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface)', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
      }}>
        <ShieldCheck size={22} color="var(--color-accent)" strokeWidth={2} />
        <span className="font-display" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-accent)' }}>
          Verifio
        </span>
        <span style={{
          fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)',
          background: 'var(--color-neutral-bg)', padding: '4px 10px', borderRadius: '20px',
          display: 'flex', alignItems: 'center', gap: '5px',
        }}>
          <Share2 size={12} />
          Rapport partagé
        </span>
      </header>

      <section style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Bannière partage */}
        <div style={{
          padding: '12px 16px', borderRadius: '10px', marginBottom: '24px',
          background: 'var(--color-neutral-bg)',
          border: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <Share2 size={16} color="var(--color-muted)" />
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)' }}>
            Rapport partagé par un utilisateur Verifio · Valable jusqu&apos;au {expiresLabel}
          </p>
        </div>

        <Link href="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          fontSize: '13px', color: 'var(--color-muted)', textDecoration: 'none', marginBottom: '24px',
        }}>
          <ArrowLeft size={14} />
          Accueil
        </Link>

        {fetchError && (
          <div style={{ padding: '20px', background: 'var(--color-danger-bg)', borderRadius: '12px', color: 'var(--color-danger)', fontSize: '14px' }}>
            {fetchError}
          </div>
        )}

        {result && (
          <div className="result-card fade-up">
            {/* Synthèse IA */}
            {syntheseInput && <SyntheseIA input={syntheseInput} />}

            {/* Score + statut */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap' }}>
              <ScoreRing score={result.score} />
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <h1 className="font-display" style={{ margin: 0, fontSize: '20px', fontWeight: 700, letterSpacing: '-0.01em' }}>{result.nom}</h1>
                  <span className="badge" style={{ background: statutBg, color: statutColor }}>
                    {result.statut === 'actif' ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                    {result.statut}
                  </span>
                </div>
                {result.activite && <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-muted)', marginBottom: '12px' }}>{result.activite}</p>}
                <div>
                  {result.alerts.map((alert, i) => (
                    <div key={i} className={`badge badge-${alert.type}`} style={{ marginBottom: '6px', width: '100%', justifyContent: 'flex-start' }}>
                      {alertIcons[alert.type]}<span>{alert.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ height: '1px', background: 'var(--color-border)', marginBottom: '16px' }} />

            {/* Données identité */}
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

            {/* Carte siège */}
            {result.adresse && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <MapPin size={16} color="var(--color-muted)" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Localisation du siège</span>
                </div>
                <iframe
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(result.adresse)}&output=embed`}
                  width="100%" height="220"
                  style={{ border: 0, borderRadius: '12px', display: 'block' }}
                  allowFullScreen loading="lazy"
                />
                <p style={{ margin: '8px 0 4px', fontSize: '13px', color: 'var(--color-text)' }}>{result.adresse}</p>
                <a
                  href={`https://www.google.com/maps/search/${encodeURIComponent(result.adresse)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: '12px', color: 'var(--color-accent)', textDecoration: 'none' }}
                >
                  Ouvrir dans Google Maps →
                </a>
              </div>
            )}

            {/* Établissements */}
            {etablissements.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Building2 size={16} color="var(--color-muted)" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Établissements ({etablissements.length})
                  </span>
                </div>
                {etablissements.length === 1 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', background: 'var(--color-safe-bg)', border: '1px solid color-mix(in srgb, var(--color-safe) 30%, transparent)' }}>
                    <CheckCircle2 size={14} color="var(--color-safe)" />
                    <span style={{ fontSize: '13px', color: 'var(--color-safe)', fontWeight: 600 }}>Siège unique — pas d&apos;établissement secondaire</span>
                    <span className="badge badge-safe" style={{ fontSize: '10px', marginLeft: 'auto' }}>Structure simple</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {etablissements.map((etab, i) => (
                      <div key={i} style={{ padding: '10px 12px', background: 'var(--color-bg)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)' }}>
                            {etab.est_siege ? 'Siège social' : 'Établissement secondaire'}
                          </span>
                          <span className={`badge badge-${etab.etat_administratif === 'A' ? 'safe' : 'neutral'}`} style={{ fontSize: '10px' }}>
                            {etab.etat_administratif === 'A' ? 'Actif' : 'Fermé'}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '13px' }}>{etab.adresse || '—'}</p>
                        {etab.activite_principale && (
                          <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-muted)' }}>{etab.activite_principale}</p>
                        )}
                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-muted)' }}>SIRET : {etab.siret}</p>
                      </div>
                    ))}
                  </div>
                )}
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

            {/* Dirigeants + BODACC */}
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
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--color-danger)' }}>Procédure collective : {result.bodacc.typeProcedure || 'détectée'}</p>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-muted)' }}>Voir les annonces BODACC ci-dessous pour le détail</p>
                    </div>
                  </div>
                )}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                    <Users size={14} color="var(--color-muted)" />
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dirigeants</p>
                  </div>
                  {result.dirigeants.length === 0 ? (
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)', fontStyle: 'italic' }}>Aucun dirigeant trouvé</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {result.dirigeants.map((d, i) => (
                        <div key={i} style={{ padding: '10px 12px', background: 'var(--color-bg)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                          <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{[d.prenoms, d.nom].filter(Boolean).join(' ')}</p>
                          <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--color-muted)' }}>{d.qualite}{d.anneeNaissance ? ` · né en ${d.anneeNaissance}` : ''}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
                              {i < result!.bodacc.annonces.length - 1 && <div style={{ width: '1px', flex: 1, background: 'var(--color-border)', marginTop: '4px', minHeight: '20px' }} />}
                            </div>
                            <div style={{ paddingBottom: '16px', flex: 1 }}>
                              <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)', marginBottom: '2px' }}>
                                {annonce.date ? new Date(annonce.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                              </p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <p style={{ margin: 0, fontSize: '13px', fontWeight: isProc ? 600 : 500, color: isProc ? color : 'var(--color-text)' }}>{libelle}</p>
                                {isProc && <span style={{ fontSize: '10px', fontWeight: 700, background: 'var(--color-danger-bg)', color: 'var(--color-danger)', padding: '1px 6px', borderRadius: '4px' }}>Procédure collective</span>}
                              </div>
                              {annonce.tribunal && <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-muted)' }}>{annonce.tribunal}</p>}
                              {annonce.details && <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-muted)' }}>{annonce.details}</p>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CTA bas */}
            <div style={{ marginTop: '24px', padding: '20px', background: 'var(--color-neutral-bg)', borderRadius: '12px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600 }}>Vérifiez votre artisan avec Verifio</p>
              <Link
                href="/recherche"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: 'var(--color-accent)', color: 'white',
                  padding: '10px 22px', borderRadius: '8px',
                  textDecoration: 'none', fontWeight: 600, fontSize: '14px',
                }}
              >
                Vérifier gratuitement →
              </Link>
            </div>

            <p style={{ margin: '16px 0 0', fontSize: '11px', color: 'var(--color-muted)', lineHeight: 1.6, padding: '12px', background: 'var(--color-bg)', borderRadius: '8px' }}>
              Données issues de l&apos;INSEE (Sirene), de l&apos;ADEME, du Registre National des Entreprises et du BODACC. Verifio n&apos;est pas responsable des décisions prises sur la base de ces données.
            </p>
          </div>
        )}
      </section>
    </main>
  )
}
