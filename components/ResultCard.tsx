'use client'

import { useState, useEffect } from 'react'
import {
  CheckCircle2, XCircle, AlertCircle, Info, MapPin, Calendar, Building2, Hash,
  Leaf, ChevronRight, Users, Scale, Clock, Sparkles, Award, Briefcase,
  ClipboardList, ArrowLeftRight, Download,
} from 'lucide-react'
import ScoreRing from './ScoreRing'
import type { SearchResult, Alert, AlertType, BodaccAnnonce } from '@/types'

interface Props {
  result: SearchResult
}

interface EnrichState {
  loading: boolean
  aiSummary?: string | null
  aiChecklist?: string[] | null
}

const alertIcons: Record<AlertType, React.ReactNode> = {
  safe: <CheckCircle2 size={15} />,
  warn: <AlertCircle size={15} />,
  danger: <XCircle size={15} />,
  info: <Info size={15} />,
}

function computeScoreMaturite(dateCreation: string, rge: boolean, hasCC: boolean) {
  if (!dateCreation) return null
  const ans = (Date.now() - new Date(dateCreation).getTime()) / (1000 * 60 * 60 * 24 * 365)
  if (ans < 1) return { label: 'Jeune', bg: '#fef3c7', color: '#d97706', ans: Math.floor(ans) }
  if (ans < 5) {
    if (rge || hasCC) return { label: 'Établie', bg: 'var(--color-safe-bg)', color: 'var(--color-safe)', ans: Math.floor(ans) }
    return { label: 'En développement', bg: '#dbeafe', color: '#2563eb', ans: Math.floor(ans) }
  }
  if (ans < 10) {
    if (rge && hasCC) return { label: 'Expérimentée', bg: '#d1fae5', color: '#065f46', ans: Math.floor(ans) }
    return { label: 'Établie', bg: 'var(--color-safe-bg)', color: 'var(--color-safe)', ans: Math.floor(ans) }
  }
  return { label: 'Expérimentée', bg: '#d1fae5', color: '#065f46', ans: Math.floor(ans) }
}

function AlertBadge({ alert }: { alert: Alert }) {
  return (
    <div className={`badge badge-${alert.type}`} style={{ marginBottom: '6px', width: '100%', justifyContent: 'flex-start' }}>
      {alertIcons[alert.type]}
      <span>{alert.message}</span>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | number }) {
  if (!value && value !== 0) return null
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
      <div style={{ color: 'var(--color-muted)', flexShrink: 0, marginTop: '1px' }}>{icon}</div>
      <div>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)', marginBottom: '2px' }}>{label}</p>
        <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>{value}</p>
      </div>
    </div>
  )
}

const FAMILLE_COLORS: Record<string, string> = {
  'Créations': 'var(--color-safe)', 'Immatriculations': 'var(--color-safe)',
  'Modifications diverses': '#6366f1', 'Procédures collectives': 'var(--color-danger)',
  'Procédures de conciliation': 'var(--color-danger)', 'Procédures de rétablissement professionnel': 'var(--color-danger)',
  'Radiations': 'var(--color-muted)', 'Ventes et cessions': '#f59e0b', 'Dépôts des comptes': 'var(--color-muted)',
}

function TimelineItem({ annonce, last }: { annonce: BodaccAnnonce; last: boolean }) {
  const color = FAMILLE_COLORS[annonce.famille] || 'var(--color-muted)'
  const isAlert = annonce.famille.toLowerCase().includes('procédure')
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, marginTop: '4px' }} />
        {!last && <div style={{ width: '1px', flex: 1, background: 'var(--color-border)', marginTop: '4px' }} />}
      </div>
      <div style={{ paddingBottom: '16px', flex: 1 }}>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)', marginBottom: '2px' }}>
          {annonce.date ? new Date(annonce.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
        </p>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: isAlert ? 600 : 500, color: isAlert ? color : 'var(--color-text)' }}>{annonce.famille}</p>
        {annonce.tribunal && <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-muted)' }}>{annonce.tribunal}</p>}
        {annonce.details && <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-muted)' }}>{annonce.details}</p>}
      </div>
    </div>
  )
}

export default function ResultCard({ result }: Props) {
  const [enrich, setEnrich] = useState<EnrichState>({ loading: false })
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    setEnrich({ loading: true })
    const params = new URLSearchParams({
      siret: result.siret, nom: result.nom, codeNaf: result.codeNaf || '',
      activite: result.activite, dateCreation: result.dateCreation, adresse: result.adresse,
      score: String(result.score), statut: result.statut,
      rge: result.rge.certifie ? 'true' : 'false', cc: result.conventionCollective || '',
      alertes: result.alerts.filter((a) => a.type !== 'safe').map((a) => a.message).join('; '),
    })
    fetch(`/api/enrich?${params}`)
      .then((r) => r.json())
      .then((data) => setEnrich({ loading: false, aiSummary: data.aiSummary, aiChecklist: data.aiChecklist }))
      .catch(() => setEnrich({ loading: false }))
  }, [result.siret])

  const formatDate = (d: string) => {
    if (!d) return undefined
    try { return new Date(d).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) }
    catch { return d }
  }

  const statutColor = result.statut === 'actif' ? 'var(--color-safe)' : 'var(--color-danger)'
  const statutBg = result.statut === 'actif' ? 'var(--color-safe-bg)' : 'var(--color-danger-bg)'
  const maturite = computeScoreMaturite(result.dateCreation, result.rge.certifie, !!result.conventionCollective)
  const nbAnnonces = result.bodacc.annonces.length

  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
  const mapsUrl = result.adresse
    ? mapsKey
      ? `https://www.google.com/maps/embed/v1/place?q=${encodeURIComponent(result.adresse)}&key=${mapsKey}`
      : `https://www.google.com/maps?q=${encodeURIComponent(result.adresse)}&output=embed`
    : null

  return (
    <div>
      <div className="result-card fade-up">

        {/* HEADER */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap' }}>
          <ScoreRing score={result.score} />
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <h2 className="font-display" style={{ margin: 0, fontSize: '20px', fontWeight: 700, letterSpacing: '-0.01em' }}>{result.nom}</h2>
              <span className="badge" style={{ background: statutBg, color: statutColor }}>
                {result.statut === 'actif' ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                {result.statut}
              </span>
              {maturite && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '20px', background: maturite.bg, color: maturite.color, fontFamily: 'var(--font-body)' }}>
                  <Award size={11} />
                  {maturite.label} · {maturite.ans} an{maturite.ans > 1 ? 's' : ''}
                </span>
              )}
            </div>
            {result.activite && (
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-muted)', marginBottom: '12px' }}>
                {result.activite}
                {result.codeNaf && <span style={{ marginLeft: '6px', fontSize: '11px', opacity: 0.7 }}>NAF {result.codeNaf}</span>}
              </p>
            )}
            <div>{result.alerts.map((alert, i) => <AlertBadge key={i} alert={alert} />)}</div>
          </div>
        </div>

        {/* RÉSUMÉ IA */}
        {(enrich.loading || enrich.aiSummary) && (
          <div style={{ margin: '0 0 20px', padding: '14px 16px', borderRadius: '12px', background: 'linear-gradient(135deg, #f0fdf4 0%, #f0f9ff 100%)', border: '1px solid #bbf7d0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Sparkles size={14} color="#16a34a" />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Analyse IA</span>
            </div>
            {enrich.loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[90, 75].map((w, i) => <div key={i} style={{ height: '11px', borderRadius: '6px', background: 'rgba(0,0,0,0.07)', width: `${w}%` }} />)}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.65 }}>{enrich.aiSummary}</p>
            )}
          </div>
        )}

        <div style={{ height: '1px', background: 'var(--color-border)', marginBottom: '16px' }} />

        {/* INFOS DE BASE */}
        <div>
          <InfoRow icon={<Hash size={15} />} label="SIRET" value={result.siret} />
          <InfoRow icon={<Building2 size={15} />} label="Forme juridique" value={result.formeJuridique} />
          <InfoRow icon={<Calendar size={15} />} label="Date de création" value={formatDate(result.dateCreation)} />
          <InfoRow icon={<MapPin size={15} />} label="Adresse du siège" value={result.adresse} />
          {result.capitalSocial !== undefined && (
            <InfoRow icon={<Building2 size={15} />} label="Capital social" value={`${result.capitalSocial.toLocaleString('fr-FR')} €`} />
          )}
          {result.effectif && (
            <InfoRow icon={<Users size={15} />} label="Effectif" value={result.effectif} />
          )}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
            <Briefcase size={15} color="var(--color-muted)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)', marginBottom: '2px' }}>Convention collective</p>
              {result.conventionCollective
                ? <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>{result.conventionCollective}</p>
                : <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)', fontStyle: 'italic' }}>Non déclarée</p>}
            </div>
          </div>
        </div>

        {/* CARTE MAPS */}
        {mapsUrl && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <MapPin size={13} color="var(--color-muted)" />
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Localisation</span>
              {mapLoaded && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-safe)', fontWeight: 600 }}>
                  <CheckCircle2 size={11} />Adresse vérifiée
                </span>
              )}
            </div>
            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--color-border)', height: '200px' }}>
              <iframe src={mapsUrl} width="100%" height="200" style={{ border: 0, display: 'block' }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" onLoad={() => setMapLoaded(true)} title={`Localisation : ${result.adresse}`} />
            </div>
          </div>
        )}

        {/* ALERTE CESSION */}
        {result.successionInfo?.cessionDetectee && (
          <div style={{ marginTop: '16px', padding: '12px 14px', borderRadius: '10px', background: '#fffbeb', border: '1px solid #fde68a', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <ArrowLeftRight size={15} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#92400e' }}>
                Transfert de fonds de commerce détecté{result.successionInfo.cessionRecente && ' (moins de 3 ans)'}
              </p>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#78350f' }}>
                Une cession d'activité est publiée au BODACC. Vérifiez les conditions avant de vous engager.
              </p>
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
              {[...new Set(result.rge.domaines)].slice(0, 6).map((d, i) => <span key={i} className="badge badge-safe" style={{ fontSize: '11px' }}>{d}</span>)}
            </div>
          )}
          {!result.rge.certifie && <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--color-muted)' }}>Non obligatoire pour tous les travaux, mais requis pour bénéficier des aides de l'État (MaPrimeRénov').</p>}
        </div>

        {/* CHECKLIST LÉGALE — COMPLÈTE */}
        {(enrich.loading || (enrich.aiChecklist && enrich.aiChecklist.length > 0)) && (
          <div style={{ marginTop: '20px', border: '1px solid var(--color-border)', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ClipboardList size={16} color="#7c3aed" />
              <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '-0.01em' }}>Avant de signer — documents à demander</span>
              <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', background: '#f3f0ff', color: '#7c3aed' }}>
                IA · NAF {result.codeNaf || '—'}
              </span>
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {enrich.loading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(0,0,0,0.06)', flexShrink: 0 }} />
                    <div style={{ height: '11px', borderRadius: '6px', background: 'rgba(0,0,0,0.06)', flex: 1 }} />
                  </div>
                ))
              ) : (
                enrich.aiChecklist!.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0, background: '#f3f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1px' }}>
                      <CheckCircle2 size={12} color="#7c3aed" />
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.55 }}>{item}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SANTÉ FINANCIÈRE & HISTORIQUE */}
        <div style={{ marginTop: '20px', border: '1px solid var(--color-border)', borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Scale size={16} color="var(--color-accent)" />
            <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '-0.01em' }}>Santé financière &amp; historique légal</span>
          </div>
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Procédure collective */}
            {result.bodacc.procedureCollective && (
              <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--color-danger-bg)', border: '1px solid color-mix(in srgb, var(--color-danger) 30%, transparent)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <XCircle size={16} color="var(--color-danger)" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--color-danger)' }}>Procédure collective : {result.bodacc.typeProcedure || 'détectée'}</p>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-muted)' }}>Voir le détail dans les annonces BODACC ci-dessous.</p>
                </div>
              </div>
            )}

            {/* Dirigeants — COMPLETS */}
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

            {/* BODACC — TOUTES LES ANNONCES */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <Clock size={14} color="var(--color-muted)" />
                <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Annonces légales BODACC {nbAnnonces > 0 && `(${nbAnnonces})`}
                </p>
              </div>
              {nbAnnonces === 0 ? (
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)', fontStyle: 'italic' }}>Aucune annonce trouvée</p>
              ) : (
                <div>
                  {result.bodacc.annonces.map((annonce, i) => (
                    <TimelineItem key={i} annonce={annonce} last={i === nbAnnonces - 1} />
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* BOUTON TÉLÉCHARGER PDF */}
        <div style={{ marginTop: '20px' }}>
          <button
            onClick={() => window.print()}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', padding: '14px 20px', borderRadius: '12px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '15px', fontWeight: 600, cursor: 'pointer', letterSpacing: '-0.01em', fontFamily: 'var(--font-body)' }}
          >
            <Download size={16} />
            Télécharger le rapport PDF
          </button>
        </div>

        {/* DISCLAIMER */}
        <p style={{ margin: '16px 0 0', fontSize: '11px', color: 'var(--color-muted)', lineHeight: 1.6, padding: '12px', background: 'var(--color-bg)', borderRadius: '8px' }}>
          Données issues de l'INSEE (Sirene), de l'ADEME, du Registre National des Entreprises et du BODACC. Vérifiez toujours l'assurance décennale en demandant l'attestation directement à l'artisan. ArtisanCheck n'est pas responsable des décisions prises sur la base de ces données.
        </p>
      </div>

      {/* AUTRES RÉSULTATS */}
      {result.autresResultats.length > 0 && (
        <div className="fade-up fade-up-delay-1" style={{ marginTop: '12px' }}>
          <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '8px', paddingLeft: '4px' }}>Autres résultats similaires</p>
          {result.autresResultats.map((r) => (
            <div key={r.siren} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '12px 16px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <div>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>{r.nom}</p>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)' }}>{r.adresse}</p>
              </div>
              <ChevronRight size={16} color="var(--color-muted)" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
