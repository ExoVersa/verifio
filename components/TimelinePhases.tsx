'use client'

import { useState } from 'react'
import { Wrench, Pencil, Image } from 'lucide-react'
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
  daysUntil,
} from '@/types/chantier'

interface TimelinePhasesProps {
  chantier: Chantier
  phases: ChantierPhase[]
  paiements: ChantierPaiement[]
  photos: ChantierPhoto[]
  onPhasesChange: () => void
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

function circleStyle(statut: PhaseStatut, isSelected: boolean): React.CSSProperties {
  const base: React.CSSProperties = {
    width: 56,
    height: 56,
    borderRadius: '50%',
    marginBottom: 10,
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s',
    position: 'relative',
    zIndex: 1,
    flexShrink: 0,
  }
  if (statut === 'terminee') {
    return {
      ...base,
      background: '#EAF3DE',
      borderColor: '#3B6D11',
      boxShadow: isSelected ? '0 0 0 4px rgba(24,95,165,0.18)' : undefined,
    }
  }
  if (statut === 'en_cours') {
    return {
      ...base,
      background: '#E6F1FB',
      borderColor: '#185FA5',
      boxShadow: isSelected
        ? '0 0 0 4px rgba(24,95,165,0.18)'
        : '0 0 0 4px rgba(24,95,165,0.12)',
    }
  }
  return {
    ...base,
    background: 'var(--color-neutral-bg)',
    borderColor: 'var(--color-border)',
    boxShadow: isSelected ? '0 0 0 4px rgba(24,95,165,0.18)' : undefined,
  }
}

function headerBg(statut: PhaseStatut): string {
  if (statut === 'terminee') return '#EAF3DE'
  if (statut === 'en_cours') return '#E6F1FB'
  return 'var(--color-neutral-bg)'
}

function iconCircleBg(statut: PhaseStatut): string {
  if (statut === 'terminee') return '#3B6D11'
  if (statut === 'en_cours') return '#185FA5'
  return 'var(--color-border)'
}

function headerTitleColor(statut: PhaseStatut): string {
  if (statut === 'terminee') return '#27500A'
  if (statut === 'en_cours') return '#0C447C'
  return 'var(--color-text-primary)'
}

function headerSubtitleColor(statut: PhaseStatut): string {
  if (statut === 'terminee') return '#3B6D11'
  if (statut === 'en_cours') return '#185FA5'
  return 'var(--color-muted)'
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

  const phaseMap = Object.fromEntries(phases.map(p => [p.nom, p])) as Partial<Record<PhaseNom, ChantierPhase>>

  const doneCount = phases.filter(p => p.statut === 'terminee').length
  const fillWidth = `${Math.round((doneCount / 3) * 100)}%`

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
    <div style={{ marginBottom: '1.5rem' }}>

      {/* ── STEPPER ── */}
      <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
        {/* Ligne de connexion */}
        <div style={{
          position: 'absolute',
          top: 28,
          left: 'calc(12.5% + 16px)',
          right: 'calc(12.5% + 16px)',
          height: 2,
          background: 'rgba(20,32,27,0.10)',
          zIndex: 0,
        }}>
          <div style={{
            height: '100%',
            width: fillWidth,
            background: '#3B6D11',
            borderRadius: 2,
            transition: 'width 0.4s',
          }} />
        </div>

        {/* Items */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          position: 'relative',
          zIndex: 1,
        }}>
          {PHASES_ORDER.map((nom, idx) => {
            const phase = phaseMap[nom]
            const statut: PhaseStatut = phase?.statut ?? 'en_attente'
            const isSelected = selectedPhase === nom
            const cs = circleStyle(statut, isSelected)

            return (
              <div
                key={nom}
                onClick={() => handleSelectPhase(nom)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  padding: '0 8px',
                }}
              >
                {/* Cercle */}
                <div style={cs}>
                  {statut === 'terminee' ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <polyline points="3 8 6.5 11.5 13 5" stroke="#27500A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <span style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: statut === 'en_cours' ? '#0C447C' : 'var(--color-muted)',
                      fontFamily: 'var(--font-display)',
                    }}>
                      {idx + 1}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span style={{
                  fontSize: 13,
                  fontWeight: 500,
                  textAlign: 'center',
                  color: statut === 'en_attente' ? 'var(--color-muted)' : 'var(--color-text-primary)',
                  marginBottom: 4,
                }}>
                  {PHASE_LABELS[nom]}
                </span>

                {/* Dates */}
                <span style={{
                  fontSize: 11,
                  color: 'var(--color-muted)',
                  textAlign: 'center',
                  lineHeight: 1.4,
                }}>
                  {phase?.date_debut_prevue || phase?.date_fin_prevue
                    ? `${formatDateShort(phase.date_debut_prevue)} – ${formatDateShort(phase.date_fin_prevue)}`
                    : '–'}
                </span>
              </div>
            )
          })}
        </div>
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
        const hasProgressData = (phase.date_debut_prevue && phase.date_fin_prevue) || (budgetEur !== null && budgetEur > 0)

        const daysSinceStart = phase.date_debut_reelle
          ? Math.abs(daysUntil(phase.date_debut_reelle) ?? 0)
          : null

        return (
          <div style={{
            background: 'var(--color-surface)',
            border: '0.5px solid var(--color-border)',
            borderRadius: 16,
            overflow: 'hidden',
            marginBottom: '1rem',
          }}>
            {!editing ? (
              <>
                {/* Header coloré */}
                <div style={{
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '0.5px solid rgba(20,32,27,0.08)',
                  background: headerBg(phase.statut),
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Icône ronde */}
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: iconCircleBg(phase.statut),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Wrench size={16} strokeWidth={1.5} color="#fff" />
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 500, color: headerTitleColor(phase.statut) }}>
                        Phase {PHASE_LABELS[selectedPhase]}
                      </div>
                      <div style={{ fontSize: 12, color: headerSubtitleColor(phase.statut), marginTop: 1 }}>
                        {phase.statut === 'en_cours'
                          ? daysSinceStart !== null
                            ? `En cours · démarrée il y a ${daysSinceStart} jour${daysSinceStart !== 1 ? 's' : ''}`
                            : 'En cours'
                          : phase.statut === 'terminee'
                          ? 'Terminée'
                          : 'En attente'}
                      </div>
                    </div>
                  </div>

                  {/* Bouton Modifier */}
                  <button
                    onClick={() => startEdit(phase)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: 12,
                      color: 'var(--color-muted)',
                      background: 'var(--color-surface)',
                      border: '0.5px solid var(--color-border)',
                      borderRadius: 8,
                      padding: '6px 12px',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-body)',
                      flexShrink: 0,
                    }}
                  >
                    <Pencil size={12} strokeWidth={1.5} />
                    Modifier
                  </button>
                </div>

                {/* Grille métriques */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: 1,
                  background: 'rgba(20,32,27,0.08)',
                }}>
                  {/* Dates prévues */}
                  <div style={{ background: 'var(--color-surface)', padding: '1rem 1.25rem' }}>
                    <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-muted)', marginBottom: 6 }}>Dates prévues</div>
                    {phase.date_debut_prevue || phase.date_fin_prevue ? (
                      <>
                        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 3 }}>
                          {formatDateShort(phase.date_debut_prevue)}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                          → {formatDateShort(phase.date_fin_prevue)}
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-muted)' }}>Non définies</div>
                    )}
                  </div>

                  {/* Dates réelles */}
                  <div style={{ background: 'var(--color-surface)', padding: '1rem 1.25rem' }}>
                    <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-muted)', marginBottom: 6 }}>Dates réelles</div>
                    {phase.date_debut_reelle ? (
                      <>
                        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 3 }}>
                          {formatDateShort(phase.date_debut_reelle)}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                          → {phase.date_fin_reelle ? formatDateShort(phase.date_fin_reelle) : 'en cours'}
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-muted)' }}>–</div>
                    )}
                  </div>

                  {/* Budget */}
                  <div style={{ background: 'var(--color-surface)', padding: '1rem 1.25rem' }}>
                    <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-muted)', marginBottom: 6 }}>Budget</div>
                    {budgetEur !== null ? (
                      <>
                        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 3 }}>
                          {formatEur(budgetEur)}
                        </div>
                        {chantier.montant_total && (
                          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                            sur {formatEur(chantier.montant_total / 100)} total
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-muted)' }}>Non défini</div>
                    )}
                  </div>
                </div>

                {/* Barres de progression */}
                {hasProgressData && (
                  <div style={{
                    padding: '1rem 1.25rem',
                    borderTop: '0.5px solid rgba(20,32,27,0.08)',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                  }}>
                    {/* Temporelle */}
                    {phase.date_debut_prevue && phase.date_fin_prevue && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>Avancement prévu</span>
                          <span style={{ fontSize: 15, fontWeight: 500, color: '#0C447C' }}>{tempoPct}%</span>
                        </div>
                        <div style={{ height: 8, background: 'var(--color-neutral-bg)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${tempoPct}%`, background: '#185FA5', borderRadius: 99, transition: 'width 0.4s' }} />
                        </div>
                      </div>
                    )}

                    {/* Budgétaire */}
                    {budgetEur !== null && budgetEur > 0 && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>Paiements / budget</span>
                          <span style={{ fontSize: 15, fontWeight: 500, color: '#854F0B' }}>{budgetPct}%</span>
                        </div>
                        <div style={{ height: 8, background: 'var(--color-neutral-bg)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${budgetPct}%`, background: '#BA7517', borderRadius: 99, transition: 'width 0.4s' }} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Photos */}
                <div style={{
                  padding: '0.875rem 1.25rem',
                  borderTop: '0.5px solid rgba(20,32,27,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <span style={{
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'var(--color-muted)',
                    marginRight: 4,
                    flexShrink: 0,
                  }}>Photos</span>

                  {phasePhotos.map(ph => (
                    <div key={ph.id} style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                      <img src={ph.url} alt={ph.legende || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}

                  {phasePhotos.length === 0 && (
                    <div style={{
                      width: 44, height: 44, borderRadius: 8,
                      background: 'var(--color-neutral-bg)',
                      border: '0.5px solid var(--color-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Image size={18} strokeWidth={1.5} color="var(--color-muted)" />
                    </div>
                  )}

                  <div style={{
                    width: 44, height: 44, borderRadius: 8,
                    border: '1px dashed var(--color-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', flexShrink: 0,
                    color: 'var(--color-muted)', fontSize: 20, fontWeight: 300,
                  }}>
                    +
                  </div>
                </div>
              </>
            ) : (
              /* ── MODE ÉDITION ── */
              <div style={{ padding: '1.25rem' }}>
                <p style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  Modifier — {PHASE_LABELS[selectedPhase]}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
