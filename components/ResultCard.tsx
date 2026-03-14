'use client'

import { CheckCircle2, XCircle, AlertCircle, Info, MapPin, Calendar, Building2, Hash, Leaf, ChevronRight } from 'lucide-react'
import ScoreRing from './ScoreRing'
import type { SearchResult, Alert, AlertType } from '@/types'

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
    <div style={{
      display: 'flex',
      gap: '10px',
      alignItems: 'flex-start',
      padding: '10px 0',
      borderBottom: '1px solid var(--color-border)',
    }}>
      <div style={{ color: 'var(--color-muted)', flexShrink: 0, marginTop: '1px' }}>{icon}</div>
      <div>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)', marginBottom: '2px' }}>{label}</p>
        <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>{value}</p>
      </div>
    </div>
  )
}

export default function ResultCard({ result }: Props) {
  const formatDate = (d: string) => {
    if (!d) return undefined
    try {
      return new Date(d).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
    } catch { return d }
  }

  const statutColor = result.statut === 'actif' ? 'var(--color-safe)' : 'var(--color-danger)'
  const statutBg = result.statut === 'actif' ? 'var(--color-safe-bg)' : 'var(--color-danger-bg)'

  return (
    <div>
      {/* Main card */}
      <div className="result-card fade-up">
        {/* Header */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap' }}>
          <ScoreRing score={result.score} />
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <h2 className="font-display" style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 700,
                letterSpacing: '-0.01em',
              }}>
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
            {/* Alerts */}
            <div>
              {result.alerts.map((alert, i) => (
                <AlertBadge key={i} alert={alert} />
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'var(--color-border)', marginBottom: '16px' }} />

        {/* Info grid */}
        <div>
          <InfoRow icon={<Hash size={15} />} label="SIRET" value={result.siret} />
          <InfoRow icon={<Building2 size={15} />} label="Forme juridique" value={result.formeJuridique} />
          <InfoRow icon={<Calendar size={15} />} label="Date de création" value={formatDate(result.dateCreation)} />
          <InfoRow icon={<MapPin size={15} />} label="Adresse" value={result.adresse} />
          {result.capitalSocial !== undefined && (
            <InfoRow
              icon={<Building2 size={15} />}
              label="Capital social"
              value={`${result.capitalSocial.toLocaleString('fr-FR')} €`}
            />
          )}
        </div>

        {/* RGE Section */}
        <div style={{ marginTop: '20px', padding: '16px', borderRadius: '12px', background: result.rge.certifie ? 'var(--color-safe-bg)' : 'var(--color-neutral-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: result.rge.certifie ? '10px' : '0' }}>
            <Leaf size={17} color={result.rge.certifie ? 'var(--color-safe)' : 'var(--color-muted)'} />
            <span style={{
              fontWeight: 600,
              fontSize: '14px',
              color: result.rge.certifie ? 'var(--color-safe)' : 'var(--color-muted)',
            }}>
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

        {/* Disclaimer */}
        <p style={{
          margin: '16px 0 0',
          fontSize: '11px',
          color: 'var(--color-muted)',
          lineHeight: 1.6,
          padding: '12px',
          background: 'var(--color-bg)',
          borderRadius: '8px',
        }}>
          Données issues de l'INSEE (Sirene), de l'ADEME et du Registre National des Entreprises. Vérifiez toujours l'assurance décennale en demandant l'attestation directement à l'artisan. ArtisanCheck n'est pas responsable des décisions prises sur la base de ces données.
        </p>
      </div>

      {/* Autres résultats */}
      {result.autresResultats.length > 0 && (
        <div className="fade-up fade-up-delay-1" style={{ marginTop: '12px' }}>
          <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '8px', paddingLeft: '4px' }}>
            Autres résultats similaires
          </p>
          {result.autresResultats.map((r) => (
            <div
              key={r.siren}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
              }}
            >
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
