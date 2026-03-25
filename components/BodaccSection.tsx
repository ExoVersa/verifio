'use client'

import { useState } from 'react'
import { Clock, ChevronDown, ChevronUp, Scale } from 'lucide-react'
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
  if (annonce.famille) return annonce.famille
  const key = (annonce.type || '').toLowerCase().trim()
  return LIBELLES[key] || (key.charAt(0).toUpperCase() + key.slice(1))
}

function isProc(annonce: BodaccAnnonce): boolean {
  const f = (annonce.famille ?? '').toLowerCase()
  const t = (annonce.type ?? '').toLowerCase()
  return (
    f.includes('procédure') || f.includes('collective') || f.includes('redressement') ||
    f.includes('liquidation') || f.includes('sauvegarde') ||
    t === 'collective' || t === 'redressement' || t === 'liquidation' || t === 'sauvegarde'
  )
}

function isDpc(annonce: BodaccAnnonce): boolean {
  return (annonce.type ?? '').toLowerCase() === 'dpc' || (annonce.famille ?? '').toLowerCase().includes('dépôt')
}

function isModif(annonce: BodaccAnnonce): boolean {
  const t = (annonce.type ?? '').toLowerCase()
  const f = (annonce.famille ?? '').toLowerCase()
  return t === 'modification' || f.includes('modification')
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
  if (a.tribunal) lines.push(`Tribunal : ${a.tribunal}`)
  if (a.details && !lines.some(l => l === a.details)) lines.push(a.details)
  return lines.filter(Boolean)
}

const LIMIT = 5

export default function BodaccSection({ annonces }: { annonces: BodaccAnnonce[] }) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? annonces : annonces.slice(0, LIMIT)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Scale size={20} color="var(--color-accent)" strokeWidth={1.5} />
        <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
          Historique BODACC
        </h2>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {visible.map((a, i) => {
            const proc = isProc(a)
            const dpc = !proc && isDpc(a)
            const modif = !proc && !dpc && isModif(a)
            const libelle = getLibelle(a)
            const details = getDetails(a)

            let dotColor = 'var(--color-muted)'
            let bg = 'transparent'
            let border = '1px solid var(--color-border)'
            let badgeEl: React.ReactNode = null

            if (proc) {
              dotColor = 'var(--color-danger)'
              bg = 'rgba(239,68,68,0.04)'
              border = '1px solid color-mix(in srgb, var(--color-danger) 25%, transparent)'
              badgeEl = (
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: 'var(--color-danger-bg)', color: 'var(--color-danger)', flexShrink: 0 }}>
                  Procédure collective
                </span>
              )
            } else if (dpc) {
              dotColor = '#3b82f6'
              badgeEl = (
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: '#eff6ff', color: '#1d4ed8', flexShrink: 0 }}>
                  Dépôt de comptes
                </span>
              )
            } else if (modif) {
              dotColor = '#f59e0b'
              badgeEl = (
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: '#fffbeb', color: '#92400e', flexShrink: 0 }}>
                  Modification
                </span>
              )
            }

            return (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                {/* Ligne + puce */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: dotColor, marginTop: 4 }} />
                  {i < visible.length - 1 && (
                    <div style={{ width: 1, flex: 1, background: 'var(--color-border)', marginTop: 4, minHeight: 20 }} />
                  )}
                </div>

                {/* Contenu */}
                <div style={{
                  flex: 1,
                  paddingBottom: '12px',
                  padding: '10px 12px',
                  background: bg,
                  border,
                  borderRadius: '10px',
                  marginBottom: i < visible.length - 1 ? '4px' : 0,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                        {a.date ? new Date(a.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </span>
                    </div>
                    {badgeEl}
                  </div>
                  <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: proc ? 700 : 600, color: proc ? 'var(--color-danger)' : 'var(--color-text)' }}>
                    {libelle}
                  </p>
                  {details.map((line, j) => (
                    <p key={j} style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-muted)', lineHeight: 1.5 }}>
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            )
          })}

          {annonces.length > LIMIT && (
            <button
              onClick={() => setShowAll(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'transparent', border: '1.5px solid var(--color-border)',
                borderRadius: '8px', padding: '8px 16px',
                cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                color: 'var(--color-accent)', alignSelf: 'flex-start',
                marginTop: '4px',
              }}
            >
              {showAll
                ? <><ChevronUp size={14} strokeWidth={1.5} /> Réduire</>
                : <><ChevronDown size={14} strokeWidth={1.5} /> Voir toutes les {annonces.length} annonces</>
              }
            </button>
          )}
        </div>
      )}
    </div>
  )
}
