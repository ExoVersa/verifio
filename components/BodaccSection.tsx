'use client'

import { useState } from 'react'
import { Scale, AlertTriangle, ChevronRight } from 'lucide-react'
import type { BodaccAnnonce } from '@/types'

const LIBELLES: Record<string, string> = {
  dpc: 'Dépôt de comptes',
  vente: 'Vente ou cession',
  immatriculation: 'Immatriculation',
  modification: 'Modification',
  radiation: 'Radiation',
  collective: 'Procédure collective',
  redressement: 'Redressement judiciaire',
  liquidation: 'Liquidation judiciaire',
  sauvegarde: 'Procédure de sauvegarde',
  bilan: 'Dépôt de bilan',
}

function getLibelle(annonce: BodaccAnnonce): string {
  if (annonce.familleLible) return annonce.familleLible
  if (annonce.famille) return annonce.famille
  const key = (annonce.type || '').toLowerCase().trim()
  return LIBELLES[key] || (key.charAt(0).toUpperCase() + key.slice(1))
}

function getAnnonceStyle(annonce: BodaccAnnonce): {
  borderColor: string
  background: string
  badgeBg: string
  badgeColor: string
  isProc: boolean
} {
  const f = (annonce.famille ?? '').toLowerCase()
  const t = (annonce.type ?? '').toLowerCase()

  const isProc =
    f.includes('procédure') || f.includes('collective') || f.includes('redressement') ||
    f.includes('liquidation') || f.includes('sauvegarde') ||
    t === 'collective' || t === 'redressement' || t === 'liquidation' || t === 'sauvegarde'

  if (isProc) return {
    borderColor: '#ef4444',
    background: 'rgba(239,68,68,0.04)',
    badgeBg: '#fee2e2',
    badgeColor: '#dc2626',
    isProc: true,
  }

  const isDpc = t === 'dpc' || f.includes('dépôt')
  if (isDpc) return {
    borderColor: '#3B82F6',
    background: '#fff',
    badgeBg: '#eff6ff',
    badgeColor: '#1d4ed8',
    isProc: false,
  }

  const isModif = t === 'modification' || f.includes('modification')
  if (isModif) return {
    borderColor: '#F59E0B',
    background: '#fff',
    badgeBg: '#fffbeb',
    badgeColor: '#92400e',
    isProc: false,
  }

  const isVente = t === 'vente' || f.includes('vente') || f.includes('cession')
  if (isVente) return {
    borderColor: '#8B5CF6',
    background: '#fff',
    badgeBg: '#f5f3ff',
    badgeColor: '#6d28d9',
    isProc: false,
  }

  const isImmat = t === 'immatriculation' || f.includes('immatriculation')
  if (isImmat) return {
    borderColor: 'var(--color-safe)',
    background: '#fff',
    badgeBg: 'var(--color-safe-bg)',
    badgeColor: 'var(--color-safe)',
    isProc: false,
  }

  const isRadiation = t === 'radiation' || f.includes('radiation')
  if (isRadiation) return {
    borderColor: 'var(--color-danger)',
    background: '#fff',
    badgeBg: 'var(--color-danger-bg)',
    badgeColor: 'var(--color-danger)',
    isProc: false,
  }

  // default
  return {
    borderColor: 'var(--color-border)',
    background: '#fff',
    badgeBg: 'var(--color-neutral-bg)',
    badgeColor: 'var(--color-muted)',
    isProc: false,
  }
}

function getDetails(a: BodaccAnnonce): string[] {
  const lines: string[] = []
  if (a.jugementNature) lines.push(a.jugementNature + (a.jugementComplement ? ` — ${a.jugementComplement}` : ''))
  if (a.acteDescriptif) lines.push(a.acteDescriptif)
  if (a.acteCategorie) lines.push(`Catégorie : ${a.acteCategorie}`)
  if (a.modificationDescriptif) lines.push(a.modificationDescriptif)
  if (a.etablissementActivite) lines.push(`Activité : ${a.etablissementActivite}`)
  if (a.etablissementAdresse) lines.push(`Lieu : ${a.etablissementAdresse}`)
  if (a.vendeurNom) lines.push(`Vendeur : ${a.vendeurNom}`)
  if (a.personnesDenomination) lines.push(a.personnesDenomination)
  if (a.personnesActivite) lines.push(a.personnesActivite)
  if (a.radiationDate) lines.push(`Date radiation : ${a.radiationDate}`)
  if (a.radiationCommentaire) lines.push(a.radiationCommentaire)
  if (a.details && !lines.some(l => l === a.details)) lines.push(a.details)
  return lines.filter(Boolean)
}

const PAGE_SIZE = 5

export default function BodaccSection({ annonces }: { annonces: BodaccAnnonce[] }) {
  const [limit, setLimit] = useState(PAGE_SIZE)
  const visible = annonces.slice(0, limit)
  const remaining = annonces.length - limit

  return (
    <div>
      {/* Titre */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Scale size={20} color="var(--color-accent)" strokeWidth={1.5} />
        <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Historique BODACC</h2>
        <span style={{
          marginLeft: 4, fontSize: '11px', fontWeight: 600,
          background: 'var(--color-neutral-bg)', color: 'var(--color-muted)',
          padding: '2px 8px', borderRadius: '20px',
        }}>
          {annonces.length} annonce{annonces.length > 1 ? 's' : ''}
        </span>
      </div>

      {annonces.length === 0 ? (
        <p style={{ fontSize: '13px', color: 'var(--color-muted)', fontStyle: 'italic' }}>
          Aucune annonce BODACC trouvée.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {visible.map((a, i) => {
            const { borderColor, background, badgeBg, badgeColor, isProc } = getAnnonceStyle(a)
            const libelle = getLibelle(a)
            const details = getDetails(a)
            const dateLabel = a.date
              ? new Date(a.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
              : '—'

            return (
              <div key={i} style={{
                background,
                borderLeft: `3px solid ${borderColor}`,
                borderRadius: '0 8px 8px 0',
                padding: '12px 16px',
                marginBottom: 8,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: isProc || details.length > 0 ? '8px' : 0, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isProc && <AlertTriangle size={14} color="#dc2626" strokeWidth={2} style={{ flexShrink: 0 }} />}
                    <span style={{
                      display: 'inline-flex', alignItems: 'center',
                      fontSize: '11px', fontWeight: 700,
                      padding: '2px 8px', borderRadius: '4px',
                      background: badgeBg, color: badgeColor,
                    }}>
                      {libelle}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--color-muted)', flexShrink: 0 }}>
                    {dateLabel}
                  </span>
                </div>

                {/* Procédure collective — mention rouge */}
                {isProc && (
                  <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 700, color: '#dc2626' }}>
                    Procédure judiciaire détectée
                  </p>
                )}

                {/* Corps */}
                {(a.tribunal || details.length > 0) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {a.tribunal && (
                      <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                        {a.tribunal}
                      </span>
                    )}
                    {details.map((line, j) => (
                      <p key={j} style={{ margin: 0, fontSize: '12px', color: 'var(--color-text)', lineHeight: 1.5 }}>
                        {line}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {remaining > 0 && (
            <button
              onClick={() => setLimit(l => l + PAGE_SIZE)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                alignSelf: 'flex-start',
                background: 'transparent',
                border: '1.5px solid var(--color-border)',
                borderRadius: '8px',
                padding: '7px 14px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--color-accent)',
                marginTop: '4px',
              }}
            >
              Voir les {Math.min(remaining, PAGE_SIZE)} annonces suivantes
              <ChevronRight size={13} strokeWidth={2} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
