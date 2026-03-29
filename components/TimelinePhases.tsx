'use client'

import { useState } from 'react'
import { Pencil, Image, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  type Chantier,
  type ChantierPhase,
  type ChantierPaiement,
  type ChantierPhoto,
  type PhaseNom,
  type PhaseStatut,
  PHASE_LABELS,
  PHASES_ORDER,
  totalPaye,
  dateProgress,
  formatEur,
} from '@/types/chantier'

interface TimelinePhasesProps {
  chantier: Chantier
  phases: ChantierPhase[]
  paiements: ChantierPaiement[]
  photos: ChantierPhoto[]
  onPhasesChange: () => void
}

const PHASE_COLORS: Record<PhaseNom, string> = {
  preparation: '#639922',
  travaux: '#185FA5',
  finitions: '#BA7517',
  reception: '#534AB7',
}

const STATUT_DOT: Record<PhaseStatut, string> = {
  terminee: '#3B6D11',
  en_cours: '#185FA5',
  en_attente: 'var(--color-border)',
}

const STATUT_BG: Record<PhaseStatut, string> = {
  terminee: '#EAF3DE',
  en_cours: '#E6F1FB',
  en_attente: 'transparent',
}

const STATUT_BADGE_BG: Record<PhaseStatut, string> = {
  terminee: '#EAF3DE',
  en_cours: '#E6F1FB',
  en_attente: 'var(--color-bg)',
}

const STATUT_BADGE_COLOR: Record<PhaseStatut, string> = {
  terminee: '#3B6D11',
  en_cours: '#185FA5',
  en_attente: 'var(--color-muted)',
}

const STATUT_BADGE_LABEL: Record<PhaseStatut, string> = {
  terminee: 'Terminée',
  en_cours: 'En cours',
  en_attente: 'En attente',
}

const PHASE_PHOTO_MAP: Record<PhaseNom, ChantierPhoto['phase']> = {
  preparation: 'avant',
  travaux: 'pendant',
  finitions: 'pendant',
  reception: 'apres',
}

function formatDateShort(d?: string | null): string {
  if (!d) return '–'
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function TimelinePhases({
  chantier,
  phases,
  paiements,
  photos,
  onPhasesChange,
}: TimelinePhasesProps) {
  const [selectedPhase, setSelectedPhase] = useState<PhaseNom | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editData, setEditData] = useState<Partial<ChantierPhase> & { budget?: number }>({})

  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile on mount
  if (typeof window !== 'undefined' && !isMobile && window.innerWidth < 768) {
    setIsMobile(true)
  }

  const phaseMap = Object.fromEntries(phases.map(p => [p.nom, p])) as Partial<Record<PhaseNom, ChantierPhase>>

  function handleSelectPhase(nom: PhaseNom) {
    if (selectedPhase === nom) {
      setSelectedPhase(null)
      setEditing(false)
    } else {
      setSelectedPhase(nom)
      setEditing(false)
    }
  }

  function startEdit(phase: ChantierPhase) {
    setEditData({
      statut: phase.statut,
      date_debut_prevue: phase.date_debut_prevue || '',
      date_fin_prevue: phase.date_fin_prevue || '',
      date_debut_reelle: phase.date_debut_reelle || '',
      date_fin_reelle: phase.date_fin_reelle || '',
      budget: phase.budget !== null ? phase.budget / 100 : undefined,
    })
    setEditing(true)
  }

  async function handleSave() {
    if (!selectedPhase) return
    setSaving(true)
    const phase = phases.find(p => p.nom === selectedPhase)
    if (!phase) { setSaving(false); return }
    await supabase
      .from('chantier_phases')
      .update({
        statut: editData.statut,
        date_debut_prevue: editData.date_debut_prevue || null,
        date_fin_prevue: editData.date_fin_prevue || null,
        date_debut_reelle: editData.date_debut_reelle || null,
        date_fin_reelle: editData.date_fin_reelle || null,
        budget: editData.budget != null ? Math.round((editData.budget as number) * 100) : null,
      })
      .eq('id', phase.id)
    setSaving(false)
    setEditing(false)
    onPhasesChange()
  }

  const setEdit = (k: string, v: string | number) =>
    setEditData(d => ({ ...d, [k]: v }))

  const inp: React.CSSProperties = {
    width: '100%', padding: '9px 12px', border: '1.5px solid var(--color-border)',
    borderRadius: '8px', fontSize: '13px', fontFamily: 'var(--font-body)',
    background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none',
    boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = {
    display: 'block', fontSize: '11px', fontWeight: 600,
    color: 'var(--color-muted)', marginBottom: '4px',
    textTransform: 'uppercase', letterSpacing: '0.04em',
  }

  return (
    <div>
      {/* ── BARRE DE PHASES ── */}
      <div style={{
        display: isMobile ? 'grid' : 'flex',
        gridTemplateColumns: isMobile ? '1fr 1fr' : undefined,
        border: '0.5px solid var(--color-border)',
        borderRadius: 'var(--border-radius-lg, 14px)',
        overflow: 'hidden',
        marginBottom: '1.5rem',
      }}>
        {PHASES_ORDER.map((nom, idx) => {
          const phase = phaseMap[nom]
          const statut: PhaseStatut = phase?.statut ?? 'en_attente'
          const isLast = idx === PHASES_ORDER.length - 1
          const isSelected = selectedPhase === nom

          return (
            <div
              key={nom}
              onClick={() => handleSelectPhase(nom)}
              style={{
                flex: 1,
                padding: '12px 14px',
                cursor: 'pointer',
                transition: 'background 0.15s',
                borderRight: isLast ? undefined : '0.5px solid var(--color-border)',
                background: isSelected
                  ? statut === 'terminee' ? '#D6EDCA' : statut === 'en_cours' ? '#D1E8F7' : 'var(--color-neutral-bg)'
                  : STATUT_BG[statut],
                outline: isSelected ? `2px solid ${PHASE_COLORS[nom]}` : undefined,
                outlineOffset: '-2px',
              }}
            >
              {/* Dot + label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '4px' }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                  background: STATUT_DOT[statut],
                }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)' }}>
                  {PHASE_LABELS[nom]}
                </span>
              </div>

              {/* Dates courtes */}
              <p style={{ margin: '0 0 6px', fontSize: '11px', color: 'var(--color-muted)' }}>
                {phase?.date_debut_prevue || phase?.date_fin_prevue
                  ? `${formatDateShort(phase?.date_debut_prevue)} – ${formatDateShort(phase?.date_fin_prevue)}`
                  : '–'}
              </p>

              {/* Badge statut */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '2px 7px', borderRadius: '20px', fontSize: '10px', fontWeight: 700,
                background: STATUT_BADGE_BG[statut],
                color: STATUT_BADGE_COLOR[statut],
                border: statut === 'en_attente' ? '0.5px solid var(--color-border)' : undefined,
              }}>
                {statut === 'terminee' && <Check size={9} strokeWidth={2.5} />}
                {STATUT_BADGE_LABEL[statut]}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── CARTE DÉTAIL ── */}
      {selectedPhase !== null && (() => {
        const phase = phaseMap[selectedPhase]
        if (!phase) return null

        const phasePhotos = photos.filter(ph => ph.phase === PHASE_PHOTO_MAP[selectedPhase]).slice(0, 3)
        const budgetEur = phase.budget !== null ? phase.budget / 100 : null
        const budgetPct = budgetEur && budgetEur > 0
          ? Math.min(100, Math.round(totalPaye(paiements) / budgetEur * 100))
          : 0
        const tempoPct = dateProgress(phase.date_debut_prevue ?? undefined, phase.date_fin_prevue ?? undefined)
        const color = PHASE_COLORS[selectedPhase]

        return (
          <div style={{
            background: 'var(--color-surface)',
            border: '0.5px solid var(--color-border)',
            borderRadius: 'var(--border-radius-lg, 14px)',
            padding: '1.25rem',
            marginBottom: '1.5rem',
          }}>
            {!editing ? (
              <>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)' }}>
                      {PHASE_LABELS[selectedPhase]}
                    </span>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                      background: STATUT_BADGE_BG[phase.statut],
                      color: STATUT_BADGE_COLOR[phase.statut],
                      border: phase.statut === 'en_attente' ? '0.5px solid var(--color-border)' : undefined,
                    }}>
                      {phase.statut === 'terminee' && <Check size={10} strokeWidth={2.5} />}
                      {STATUT_BADGE_LABEL[phase.statut]}
                    </div>
                  </div>
                  <button
                    onClick={() => startEdit(phase)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '7px 12px', borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-muted)', fontSize: '12px', fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'var(--font-body)',
                    }}
                  >
                    <Pencil size={14} strokeWidth={1.5} />
                    Modifier
                  </button>
                </div>

                {/* Grille infos */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: '10px',
                  marginBottom: '16px',
                }}>
                  <div style={{ background: 'var(--color-bg)', borderRadius: 'var(--border-radius-md, 10px)', padding: '10px 12px' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Dates prévues</p>
                    {phase.date_debut_prevue || phase.date_fin_prevue ? (
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text)', fontWeight: 500, lineHeight: 1.5 }}>
                        {formatDateShort(phase.date_debut_prevue)}<br />
                        <span style={{ color: 'var(--color-muted)' }}>→</span> {formatDateShort(phase.date_fin_prevue)}
                      </p>
                    ) : (
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)' }}>Non définies</p>
                    )}
                  </div>
                  <div style={{ background: 'var(--color-bg)', borderRadius: 'var(--border-radius-md, 10px)', padding: '10px 12px' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Dates réelles</p>
                    {phase.date_debut_reelle || phase.date_fin_reelle ? (
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text)', fontWeight: 500, lineHeight: 1.5 }}>
                        {formatDateShort(phase.date_debut_reelle)}<br />
                        <span style={{ color: 'var(--color-muted)' }}>→</span> {formatDateShort(phase.date_fin_reelle)}
                      </p>
                    ) : (
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)' }}>–</p>
                    )}
                  </div>
                  <div style={{ background: 'var(--color-bg)', borderRadius: 'var(--border-radius-md, 10px)', padding: '10px 12px' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Budget</p>
                    {budgetEur !== null ? (
                      <>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text)', fontWeight: 600 }}>{formatEur(budgetEur)}</p>
                        {chantier.montant_total && (
                          <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-muted)' }}>sur {formatEur(chantier.montant_total)} total</p>
                        )}
                      </>
                    ) : (
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)' }}>Non défini</p>
                    )}
                  </div>
                </div>

                {/* Barre temporelle */}
                {phase.date_debut_prevue && phase.date_fin_prevue && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: 500 }}>Avancement prévu</span>
                      <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: 600 }}>{tempoPct}%</span>
                    </div>
                    <div style={{ height: '6px', borderRadius: '99px', background: 'var(--color-border)' }}>
                      <div style={{ height: '100%', borderRadius: '99px', width: `${tempoPct}%`, background: color, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                )}

                {/* Barre budgétaire */}
                {budgetEur !== null && budgetEur > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: 500 }}>Paiements / budget phase</span>
                      <span style={{ fontSize: '11px', color: '#BA7517', fontWeight: 600 }}>{budgetPct}%</span>
                    </div>
                    <div style={{ height: '6px', borderRadius: '99px', background: 'var(--color-border)' }}>
                      <div style={{ height: '100%', borderRadius: '99px', width: `${budgetPct}%`, background: '#BA7517', transition: 'width 0.3s' }} />
                    </div>
                  </div>
                )}

                {/* Photos de phase */}
                <div>
                  <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-muted)' }}>
                    Photos de phase
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {phasePhotos.map(ph => (
                      <div key={ph.id} style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                        <img src={ph.url} alt={ph.legende || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                    {phasePhotos.length === 0 && (
                      <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Image size={18} color="var(--color-muted)" strokeWidth={1.5} />
                      </div>
                    )}
                    <div style={{ width: '48px', height: '48px', borderRadius: '8px', border: '1.5px dashed var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, color: 'var(--color-muted)', fontSize: '20px', fontWeight: 300 }}>
                      +
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* ── MODE ÉDITION ── */
              <div>
                <p style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700 }}>
                  Modifier — {PHASE_LABELS[selectedPhase]}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Statut */}
                  <div>
                    <label style={lbl}>Statut</label>
                    <select
                      style={{ ...inp, appearance: 'none' }}
                      value={editData.statut ?? 'en_attente'}
                      onChange={e => setEdit('statut', e.target.value)}
                    >
                      <option value="en_attente">En attente</option>
                      <option value="en_cours">En cours</option>
                      <option value="terminee">Terminée</option>
                    </select>
                  </div>

                  {/* Dates prévues */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={lbl}>Début prévu</label>
                      <input style={inp} type="date" value={editData.date_debut_prevue ?? ''} onChange={e => setEdit('date_debut_prevue', e.target.value)} />
                    </div>
                    <div>
                      <label style={lbl}>Fin prévue</label>
                      <input style={inp} type="date" value={editData.date_fin_prevue ?? ''} onChange={e => setEdit('date_fin_prevue', e.target.value)} />
                    </div>
                  </div>

                  {/* Dates réelles */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={lbl}>Début réel</label>
                      <input style={inp} type="date" value={editData.date_debut_reelle ?? ''} onChange={e => setEdit('date_debut_reelle', e.target.value)} />
                    </div>
                    <div>
                      <label style={lbl}>Fin réelle</label>
                      <input style={inp} type="date" value={editData.date_fin_reelle ?? ''} onChange={e => setEdit('date_fin_reelle', e.target.value)} />
                    </div>
                  </div>

                  {/* Budget */}
                  <div>
                    <label style={lbl}>Budget (€)</label>
                    <input
                      style={inp}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Ex : 3500"
                      value={editData.budget ?? ''}
                      onChange={e => setEdit('budget', e.target.value ? parseFloat(e.target.value) : '')}
                    />
                  </div>

                  {/* Boutons */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setEditing(false)}
                      style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      style={{ flex: 2, padding: '10px', borderRadius: '10px', border: 'none', background: saving ? 'var(--color-muted)' : 'var(--color-accent)', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)' }}
                    >
                      {saving ? 'Enregistrement…' : 'Enregistrer'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}
