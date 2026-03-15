'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, AlertCircle, Info, MapPin, Calendar, Building2, Hash, Leaf, ChevronRight, Users, Scale, Clock, Lock } from 'lucide-react'
import ScoreRing from './ScoreRing'
import type { SearchResult, Alert, AlertType, BodaccAnnonce } from '@/types'

interface Props {
  result: SearchResult
}

const alertIcons: Record<AlertType, React.ReactNode> = {
  safe: <CheckCircle2 size={15} />,
  warn: <AlertCircle size={15} />,
  danger: <XCircle size={15} />,
  info: <Info size={15} />,
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

// Bloc flouté avec CTA premium
function LockedBlock({ label, siret, nom }: { label: string; siret: string; nom: string }) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siret, nom }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        borderRadius: '10px',
        border: '1px dashed var(--color-border)',
        background: 'var(--color-bg)',
        cursor: loading ? 'not-allowed' : 'pointer',
        gap: '10px',
        textAlign: 'left',
        opacity: loading ? 0.7 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Lock size={13} color="var(--color-muted)" />
        <span style={{ fontSize: '13px', color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}>
          {label}
        </span>
      </div>
      <span style={{
        fontSize: '12px',
        fontWeight: 600,
        color: 'var(--color-text)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '20px',
        padding: '4px 10px',
        flexShrink: 0,
        fontFamily: 'var(--font-body)',
      }}>
        {loading ? '…' : '4,90\u00a0€'}
      </span>
    </button>
  )
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

function TimelineItem({ annonce }: { annonce: BodaccAnnonce }) {
  const color = FAMILLE_COLORS[annonce.famille] || 'var(--color-muted)'
  const isAlert = annonce.famille.toLowerCase().includes('procédure')
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, marginTop: '4px' }} />
        <div style={{ width: '1px', flex: 1, background: 'var(--color-border)', marginTop: '4px' }} />
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
      </div>
    </div>
  )
}

export default function ResultCard({ result }: Props) {
  const formatDate = (d: string) => {
    if (!d) return undefined
    try { return new Date(d).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) }
    catch { return d }
  }

  const statutColor = result.statut === 'actif' ? 'var(--color-safe)' : 'var(--color-danger)'
  const statutBg = result.statut === 'actif' ? 'var(--color-safe-bg)' : 'var(--color-danger-bg)'

  const nbDirigeants = result.dirigeants.length
  const nbAnnonces = result.bodacc.annonces.length
  const premiereAnnonce = result.bodacc.annonces[0]

  return (
    <div>
      <div className="result-card fade-up">

        {/* Header */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap' }}>
          <ScoreRing score={result.score} />
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <h2 className="font-display" style={{ margin: 0, fontSize: '20px', fontWeight: 700, letterSpacing: '-0.01em' }}>
                {result.nom}
              </h2>
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
                <AlertBadge key={i} alert={alert} />
              ))}
            </div>
          </div>
        </div>

        <div style={{ height: '1px', background: 'var(--color-border)', marginBottom: '16px' }} />

        {/* Infos de base — GRATUITES */}
        <div>
          <InfoRow icon={<Hash size={15} />} label="SIRET" value={result.siret} />
          <InfoRow icon={<Building2 size={15} />} label="Forme juridique" value={result.formeJuridique} />
          <InfoRow icon={<Calendar size={15} />} label="Date de création" value={formatDate(result.dateCreation)} />
          <InfoRow icon={<MapPin size={15} />} label="Adresse" value={result.adresse} />
          {result.capitalSocial !== undefined && (
            <InfoRow icon={<Building2 size={15} />} label="Capital social" value={`${result.capitalSocial.toLocaleString('fr-FR')} €`} />
          )}
        </div>

        {/* Effectif — VERROUILLÉ */}
        {result.effectif && (
          <div style={{ padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Users size={15} color="var(--color-muted)" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)', marginBottom: '4px' }}>Effectif</p>
                <LockedBlock
                  label={result.effectif}
                  siret={result.siret}
                  nom={result.nom}
                />
              </div>
            </div>
          </div>
        )}

        {/* RGE — GRATUIT */}
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
          {!result.rge.certifie && (
            <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--color-muted)' }}>
              Non obligatoire pour tous les travaux, mais requis pour bénéficier des aides de l'État (MaPrimeRénov').
            </p>
          )}
        </div>

        {/* ─── SECTION PREMIUM : Santé financière & historique légal ─── */}
        <div style={{ marginTop: '20px', border: '1px solid var(--color-border)', borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Scale size={16} color="var(--color-accent)" />
            <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '-0.01em' }}>
              Santé financière &amp; historique légal
            </span>
          </div>

          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Procédure collective — alerte affichée si détectée */}
            {result.bodacc.procedureCollective && (
              <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--color-danger-bg)', border: '1px solid color-mix(in srgb, var(--color-danger) 30%, transparent)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <XCircle size={16} color="var(--color-danger)" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--color-danger)' }}>Procédure collective détectée</p>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-muted)' }}>Détails disponibles dans le rapport complet</p>
                </div>
              </div>
            )}

            {/* Dirigeants — VERROUILLÉS */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <Users size={14} color="var(--color-muted)" />
                <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Dirigeants
                </p>
              </div>
              {nbDirigeants === 0 ? (
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)', fontStyle: 'italic' }}>Aucun dirigeant trouvé</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Premier dirigeant : prénom/nom masqué */}
                  <div style={{ padding: '8px 12px', background: 'var(--color-bg)', borderRadius: '8px' }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--color-muted)', filter: 'blur(4px)', userSelect: 'none' }}>
                      {'●●●●● ●●●●●●●●●'}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--color-muted)' }}>
                      {result.dirigeants[0].qualite}
                    </p>
                  </div>
                  {/* Reste verrouillé */}
                  <LockedBlock
                    label={nbDirigeants > 1 ? `${nbDirigeants - 1} autre${nbDirigeants > 2 ? 's' : ''} dirigeant${nbDirigeants > 2 ? 's' : ''} — identités complètes` : 'Identité complète des dirigeants'}
                    siret={result.siret}
                    nom={result.nom}
                  />
                </div>
              )}
            </div>

            {/* Annonces BODACC — première visible, reste verrouillé */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <Clock size={14} color="var(--color-muted)" />
                <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Annonces légales BODACC
                </p>
              </div>

              {nbAnnonces === 0 ? (
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)', fontStyle: 'italic' }}>Aucune annonce trouvée</p>
              ) : (
                <div>
                  {/* Première annonce visible */}
                  {premiereAnnonce && <TimelineItem annonce={premiereAnnonce} />}

                  {/* Reste verrouillé */}
                  {nbAnnonces > 1 && (
                    <LockedBlock
                      label={`${nbAnnonces - 1} autre${nbAnnonces > 2 ? 's' : ''} annonce${nbAnnonces > 2 ? 's' : ''} légale${nbAnnonces > 2 ? 's' : ''} trouvée${nbAnnonces > 2 ? 's' : ''}`}
                      siret={result.siret}
                      nom={result.nom}
                    />
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* CTA principal */}
        <div style={{ marginTop: '20px' }}>
          <button
            onClick={async () => {
              const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siret: result.siret, nom: result.nom }),
              })
              const data = await res.json()
              if (data.url) window.location.href = data.url
            }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              width: '100%', padding: '14px 20px', borderRadius: '12px', border: 'none',
              background: 'var(--color-text)', color: 'var(--color-bg)',
              fontSize: '15px', fontWeight: 600, cursor: 'pointer',
              letterSpacing: '-0.01em', fontFamily: 'var(--font-body)',
            }}
          >
            <Lock size={16} />
            Rapport complet — 4,90&nbsp;€
          </button>
          <p style={{ margin: '8px 0 0', fontSize: '11px', color: 'var(--color-muted)', textAlign: 'center' }}>
            Dirigeants · Assurance décennale · Toutes les annonces BODACC
          </p>
        </div>

        {/* Disclaimer */}
        <p style={{ margin: '16px 0 0', fontSize: '11px', color: 'var(--color-muted)', lineHeight: 1.6, padding: '12px', background: 'var(--color-bg)', borderRadius: '8px' }}>
          Données issues de l'INSEE (Sirene), de l'ADEME, du Registre National des Entreprises et du BODACC. Vérifiez toujours l'assurance décennale en demandant l'attestation directement à l'artisan. ArtisanCheck n'est pas responsable des décisions prises sur la base de ces données.
        </p>
      </div>

      {/* Autres résultats */}
      {result.autresResultats.length > 0 && (
        <div className="fade-up fade-up-delay-1" style={{ marginTop: '12px' }}>
          <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '8px', paddingLeft: '4px' }}>
            Autres résultats similaires
          </p>
          {result.autresResultats.map((r) => (
            <div key={r.siren} style={{
              background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px',
              padding: '12px 16px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
            }}>
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
