'use client'

import Link from 'next/link'
import { useState, useEffect, useRef, use, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft, AlertCircle, Plus,
  MapPin, ExternalLink, FileText,
  Camera, Trash2, Download, Upload, X, CreditCard, ChevronDown,
  ClipboardCheck, Pencil, Image as ImageIcon, Check,
} from 'lucide-react'
import SiteHeader from '@/components/SiteHeader'
import GuideChantier from '@/components/GuideChantier'
import { SectionBadge, SurfaceCard } from '@/components/ExperiencePrimitives'
import { supabase } from '@/lib/supabase'
import {
  type Chantier, type ChantierPaiement, type ChantierEvenement,
  type ChantierPhoto, type ChantierDocument,
  type EvenementType, type PaiementType, type PhotoPhase, type DocumentType,
  type ChantierPhase, type PhaseNom,
  STATUT_LABELS, STATUT_COLORS, EVENEMENT_ICONS, PAIEMENT_LABELS, DOCUMENT_LABELS,
  PHASE_LABELS, PHASES_ORDER,
  totalPaye, dateProgress, daysUntil, formatEur,
} from '@/types/chantier'

// ─── Auto-alerts ──────────────────────────────────────────────────────────────
function computeAutoAlertes(
  chantier: Chantier,
  evenements: ChantierEvenement[],
  paiements: ChantierPaiement[],
): ChantierEvenement[] {
  const alerts: ChantierEvenement[] = []
  const now = Date.now()

  // 14 jours sans activité
  if (evenements.length > 0) {
    const last = new Date(evenements[0].date_evenement).getTime()
    if ((now - last) / (1000 * 60 * 60 * 24) >= 14) {
      alerts.push({ id: 'auto-inactif', chantier_id: chantier.id, titre: 'Aucune activité enregistrée depuis 2 semaines', description: 'Pensez à noter l\'avancement de vos travaux.', type: 'alerte', date_evenement: new Date(last + 14 * 86400000).toISOString(), created_at: '', _auto: true })
    }
  }

  // 7 jours avant fin prévue
  if (chantier.date_fin_prevue && chantier.statut === 'en_cours') {
    const j = daysUntil(chantier.date_fin_prevue)
    if (j !== null && j >= 0 && j <= 7) {
      alerts.push({ id: 'auto-fin', chantier_id: chantier.id, titre: `La date de fin prévue approche (dans ${j} jour${j > 1 ? 's' : ''})`, description: 'Vérifiez l\'avancement avec votre artisan.', type: 'alerte', date_evenement: chantier.date_fin_prevue + 'T00:00:00Z', created_at: '', _auto: true })
    }
  }

  // Acompte > 30 %
  if (chantier.montant_total) {
    const acomptes = paiements.filter(p => p.type === 'acompte').reduce((s, p) => s + p.montant, 0)
    if (acomptes > chantier.montant_total * 0.30) {
      alerts.push({ id: 'auto-acompte', chantier_id: chantier.id, titre: `⚠ Acompte supérieur à 30 % du total (${formatEur(acomptes)} versé)`, description: 'La loi Hoguet limite l\'acompte avant travaux. Vérifiez votre contrat.', type: 'alerte', date_evenement: paiements.find(p => p.type === 'acompte')?.date_paiement + 'T00:00:00Z' || new Date().toISOString(), created_at: '', _auto: true })
    }
  }

  return alerts
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-card)', padding: '28px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 className="font-display" style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── Signed URLs helper (private Storage buckets) ────────────────────────────
async function resolveSignedUrls<T extends { url: string }>(
  bucket: string,
  items: T[],
  expiresIn = 3600,
): Promise<T[]> {
  if (items.length === 0) return items
  const { data } = await supabase.storage
    .from(bucket)
    .createSignedUrls(items.map(i => i.url), expiresIn)
  if (!data) return items
  return items.map((item, idx) => ({
    ...item,
    url: data[idx]?.signedUrl ?? item.url,
  }))
}

// ─── Shared input style ───────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  width: '100%', padding: '10px 13px', border: '1.5px solid var(--color-border)',
  borderRadius: '10px', fontSize: '14px', fontFamily: 'var(--font-body)',
  background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none',
  boxSizing: 'border-box',
}
const lbl: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.04em' }

// ─── JOURNAL TAB ─────────────────────────────────────────────────────────────
function JournalTab({
  chantier, evenements, paiements, onRefresh,
}: {
  chantier: Chantier
  evenements: ChantierEvenement[]
  paiements: ChantierPaiement[]
  onRefresh: () => void
}) {
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ titre: '', description: '', type: 'note' as EvenementType, date_evenement: new Date().toISOString().slice(0, 16) })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const autoAlertes = computeAutoAlertes(chantier, evenements, paiements)
  const allEvents = [...evenements, ...autoAlertes].sort((a, b) =>
    new Date(b.date_evenement).getTime() - new Date(a.date_evenement).getTime()
  )

  async function saveNote() {
    setSaving(true)
    await supabase.from('chantier_evenements').insert({
      chantier_id: chantier.id,
      titre: form.titre.trim(),
      description: form.description.trim() || null,
      type: form.type,
      date_evenement: new Date(form.date_evenement).toISOString(),
    })
    setSaving(false)
    setShowModal(false)
    setForm({ titre: '', description: '', type: 'note', date_evenement: new Date().toISOString().slice(0, 16) })
    onRefresh()
  }

  const typeColors: Record<string, { bg: string; color: string }> = {
    alerte: { bg: '#fffbeb', color: '#d97706' },
    probleme: { bg: '#fef2f2', color: '#dc2626' },
    note: { bg: 'var(--color-neutral-bg)', color: 'var(--color-muted)' },
    appel: { bg: '#eff6ff', color: '#2563eb' },
    visite: { bg: '#f0fdf4', color: '#16a34a' },
    document: { bg: '#f5f3ff', color: '#7c3aed' },
    photo: { bg: '#fdf4ff', color: '#a21caf' },
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)' }}>
          {allEvents.length} événement{allEvents.length > 1 ? 's' : ''}
        </p>
        <button
          onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px', background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
        >
          <Plus size={14} />
          Ajouter une note
        </button>
      </div>

      {allEvents.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-muted)', fontSize: '14px', background: 'var(--color-surface)', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
          Aucun événement. Ajoutez votre première note.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {allEvents.map((ev, i) => {
          const tc = typeColors[ev.type] || typeColors.note
          const isLast = i === allEvents.length - 1
          return (
            <div key={ev.id} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              {/* Timeline line */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: '4px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: tc.bg, border: `2px solid color-mix(in srgb, ${tc.color} 20%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
                  {EVENEMENT_ICONS[ev.type] || '📝'}
                </div>
                {!isLast && <div style={{ width: '2px', flex: 1, background: 'var(--color-border)', margin: '6px 0', minHeight: '24px' }} />}
              </div>
              {/* Content */}
              <div style={{ flex: 1, paddingBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                  <p style={{ margin: '0 0 3px', fontSize: '14px', fontWeight: ev.type === 'alerte' || ev.type === 'probleme' ? 700 : 600, color: ev.type === 'alerte' || ev.type === 'probleme' ? tc.color : 'var(--color-text)', lineHeight: 1.4 }}>
                    {ev.titre}
                    {ev._auto && <span style={{ marginLeft: '6px', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '10px', background: tc.bg, color: tc.color }}>AUTO</span>}
                  </p>
                  <span style={{ fontSize: '11px', color: 'var(--color-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {new Date(ev.date_evenement).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                {ev.description && (
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)', lineHeight: 1.5 }}>{ev.description}</p>
                )}
                {ev.type === 'alerte' && ev.id === 'auto-litige' && (
                  <Link href="/assistant-juridique" style={{ display: 'inline-block', marginTop: '6px', fontSize: '12px', color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'none' }}>
                    → Consulter l&apos;assistant juridique
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {showModal && (
        <Modal title="Ajouter un événement" onClose={() => setShowModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={lbl}>Type d&apos;événement</label>
              <select style={inp} value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="note">📝 Note</option>
                <option value="appel">📞 Appel téléphonique</option>
                <option value="visite">🏗 Visite chantier</option>
                <option value="probleme">🚨 Problème constaté</option>
                <option value="document">📄 Document reçu</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Titre <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input style={inp} type="text" placeholder="Ex : Appel avec l'artisan" value={form.titre} onChange={e => set('titre', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Description</label>
              <textarea style={{ ...inp, minHeight: '80px', resize: 'vertical' }} placeholder="Détails…" value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Date</label>
              <input style={inp} type="datetime-local" value={form.date_evenement} onChange={e => set('date_evenement', e.target.value)} />
            </div>
            <button
              onClick={saveNote}
              disabled={saving || !form.titre.trim()}
              style={{ padding: '12px', background: saving || !form.titre.trim() ? 'var(--color-muted)' : 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
            >
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── PAIEMENTS TAB ───────────────────────────────────────────────────────────
function PaiementsTab({
  chantier, paiements, onRefresh,
}: {
  chantier: Chantier
  paiements: ChantierPaiement[]
  onRefresh: () => void
}) {
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ montant: '', date_paiement: new Date().toISOString().slice(0, 10), type: 'acompte' as PaiementType, description: '' })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const paye = totalPaye(paiements)
  const pct = chantier.montant_total && chantier.montant_total > 0 ? Math.min(100, Math.round(paye / chantier.montant_total * 100)) : 0
  const acomptes = paiements.filter(p => p.type === 'acompte').reduce((s, p) => s + p.montant, 0)
  const acomptePct = chantier.montant_total && chantier.montant_total > 0 ? acomptes / chantier.montant_total : 0

  async function savePaiement() {
    if (!form.montant || parseFloat(form.montant) <= 0) return
    setSaving(true)
    await supabase.from('chantier_paiements').insert({
      chantier_id: chantier.id,
      montant: parseFloat(form.montant),
      date_paiement: form.date_paiement,
      type: form.type,
      description: form.description.trim() || null,
    })
    // Log in journal
    await supabase.from('chantier_evenements').insert({
      chantier_id: chantier.id,
      titre: `${PAIEMENT_LABELS[form.type]} de ${formatEur(parseFloat(form.montant))}`,
      description: form.description.trim() || null,
      type: 'note',
      date_evenement: new Date(form.date_paiement).toISOString(),
    })
    setSaving(false)
    setShowModal(false)
    setForm({ montant: '', date_paiement: new Date().toISOString().slice(0, 10), type: 'acompte', description: '' })
    onRefresh()
  }

  return (
    <div>
      {/* Summary */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: '13px', color: 'var(--color-muted)' }}>Payé</p>
            <p className="font-display" style={{ margin: 0, fontSize: '26px', fontWeight: 800, color: 'var(--color-safe)', letterSpacing: '-0.02em' }}>{formatEur(paye)}</p>
          </div>
          {chantier.montant_total && (
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '0 0 2px', fontSize: '13px', color: 'var(--color-muted)' }}>Total devis</p>
              <p className="font-display" style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>{formatEur(chantier.montant_total)}</p>
            </div>
          )}
        </div>
        {chantier.montant_total && (
          <>
            <div style={{ height: '8px', borderRadius: '4px', background: 'var(--color-border)', overflow: 'hidden', marginBottom: '6px' }}>
              <div style={{ height: '100%', borderRadius: '4px', width: `${pct}%`, background: 'var(--color-safe)', transition: 'width 0.5s' }} />
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)' }}>
              {pct}% réglé · Reste {formatEur(Math.max(0, chantier.montant_total - paye))}
            </p>
          </>
        )}

        {/* Acompte alert */}
        {acomptePct > 0.30 && (
          <div style={{ marginTop: '12px', padding: '10px 12px', borderRadius: '10px', background: 'var(--color-warn-bg)', border: '1px solid var(--color-warn-border)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <AlertCircle size={14} color="var(--color-warn)" style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-warn)', fontWeight: 500 }}>
              L&apos;acompte versé ({Math.round(acomptePct * 100)}%) dépasse 30% du total. Vérifiez votre contrat.
            </p>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)' }}>{paiements.length} paiement{paiements.length > 1 ? 's' : ''}</p>
        <button
          onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px', background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
        >
          <Plus size={14} />Ajouter un paiement
        </button>
      </div>

      {paiements.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-muted)', fontSize: '14px', background: 'var(--color-surface)', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
          Aucun paiement enregistré.
        </div>
      )}

      {paiements.length > 0 && (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '14px', overflow: 'hidden' }}>
          {paiements.sort((a, b) => b.date_paiement.localeCompare(a.date_paiement)).map((p, i) => (
            <div key={p.id} style={{ padding: '14px 18px', borderBottom: i < paiements.length - 1 ? '1px solid var(--color-border)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{PAIEMENT_LABELS[p.type]}</span>
                  <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: p.type === 'solde' ? '#eff6ff' : p.type === 'acompte' ? '#fffbeb' : 'var(--color-neutral-bg)', color: p.type === 'solde' ? '#2563eb' : p.type === 'acompte' ? '#d97706' : 'var(--color-muted)', fontWeight: 600 }}>
                    {new Date(p.date_paiement).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                {p.description && <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)' }}>{p.description}</p>}
              </div>
              <span className="font-display" style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-safe)', flexShrink: 0 }}>
                +{formatEur(p.montant)}
              </span>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="Ajouter un paiement" onClose={() => setShowModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={lbl}>Type</label>
              <select style={inp} value={form.type} onChange={e => set('type', e.target.value)}>
                {(Object.keys(PAIEMENT_LABELS) as PaiementType[]).map(t => (
                  <option key={t} value={t}>{PAIEMENT_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={lbl}>Montant (€) *</label>
                <input style={inp} type="number" placeholder="0" min="0" step="0.01" value={form.montant} onChange={e => set('montant', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Date</label>
                <input style={inp} type="date" value={form.date_paiement} onChange={e => set('date_paiement', e.target.value)} />
              </div>
            </div>
            <div>
              <label style={lbl}>Description</label>
              <input style={inp} type="text" placeholder="Ex : Virement du 12 mars" value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
            <button
              onClick={savePaiement}
              disabled={saving || !form.montant}
              style={{ padding: '12px', background: saving || !form.montant ? 'var(--color-muted)' : 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
            >
              {saving ? 'Enregistrement…' : 'Enregistrer le paiement'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── PHOTOS TAB ──────────────────────────────────────────────────────────────
function PhotosTab({ chantier, photos, onRefresh }: { chantier: Chantier; photos: ChantierPhoto[]; onRefresh: () => void }) {
  const [phase, setPhase] = useState<PhotoPhase | 'toutes'>('toutes')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<ChantierPhoto | null>(null)
  const [legende, setLegende] = useState('')
  const [selectedPhase, setSelectedPhase] = useState<PhotoPhase>('pendant')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleDelete(photo: ChantierPhoto) {
    if (!confirm('Supprimer cette photo ?')) return
    setDeletingId(photo.id)
    await supabase.storage.from('chantier-photos').remove([photo.url])
    await supabase.from('chantier_photos').delete().eq('id', photo.id)
    setDeletingId(null)
    if (lightbox?.id === photo.id) setLightbox(null)
    onRefresh()
  }

  const filtered = phase === 'toutes' ? photos : photos.filter(p => p.phase === phase)
  const phaseLabels: Record<PhotoPhase, string> = { avant: 'Avant travaux', pendant: 'Pendant', apres: 'Après travaux' }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    setUploadError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setUploadError('Vous devez être connecté pour uploader des fichiers.')
      setUploading(false)
      return
    }

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()
      // Chemin : {user_id}/{chantier_id}/{timestamp}.{ext} — requis par les policies RLS Storage
      const path = `${user.id}/${chantier.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: upErr } = await supabase.storage.from('chantier-photos').upload(path, file)
      if (upErr) {
        setUploadError(`Erreur upload : ${upErr.message}`)
        continue
      }
      await supabase.from('chantier_photos').insert({ chantier_id: chantier.id, url: path, legende: legende || null, phase: selectedPhase })
    }
    setUploading(false)
    setLegende('')
    onRefresh()
  }

  return (
    <div>
      {/* Phase selector */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {(['toutes', 'avant', 'pendant', 'apres'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPhase(p)}
              style={{ padding: '7px 14px', borderRadius: '20px', border: '1px solid', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', ...(phase === p ? { background: 'var(--color-accent)', color: '#fff', borderColor: 'var(--color-accent)' } : { background: 'var(--color-surface)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }) }}
            >
              {p === 'toutes' ? `Toutes (${photos.length})` : `${phaseLabels[p]} (${photos.filter(ph => ph.phase === p).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Upload zone */}
      <div
        onClick={() => fileRef.current?.click()}
        style={{ border: '2px dashed var(--color-border)', borderRadius: '14px', padding: '28px', textAlign: 'center', cursor: 'pointer', marginBottom: '20px', background: 'var(--color-surface)', transition: 'border-color 0.15s' }}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleUpload(e.dataTransfer.files) }}
      >
        <Camera size={28} color="var(--color-muted)" style={{ margin: '0 auto 8px' }} />
        <p style={{ margin: '0 0 12px', fontSize: '14px', color: 'var(--color-muted)' }}>
          {uploading ? 'Upload en cours…' : 'Glissez des photos ou cliquez pour sélectionner'}
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <select
            style={{ ...inp, width: 'auto', fontSize: '12px', padding: '6px 10px' }}
            value={selectedPhase}
            onChange={e => { e.stopPropagation(); setSelectedPhase(e.target.value as PhotoPhase) }}
            onClick={e => e.stopPropagation()}
          >
            {(Object.entries(phaseLabels) as [PhotoPhase, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <input
            style={{ ...inp, width: '180px', fontSize: '12px', padding: '6px 10px' }}
            type="text"
            placeholder="Légende (optionnel)"
            value={legende}
            onChange={e => { e.stopPropagation(); setLegende(e.target.value) }}
            onClick={e => e.stopPropagation()}
          />
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => handleUpload(e.target.files)} />
      </div>

      {uploadError && (
        <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
          {uploadError}
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-muted)', fontSize: '14px' }}>
          Aucune photo dans cette phase.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
          {filtered.map(ph => (
            <div key={ph.id} style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', aspectRatio: '1' }} onClick={() => setLightbox(ph)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ph.url} alt={ph.legende || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: deletingId === ph.id ? 0.4 : 1 }} />
              {ph.legende && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.6))', padding: '16px 8px 6px', fontSize: '11px', color: '#fff', fontWeight: 500 }}>
                  {ph.legende}
                </div>
              )}
              <div style={{ position: 'absolute', top: '6px', right: '6px', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', color: '#fff' }}>
                {ph.phase.toUpperCase()}
              </div>
              <button
                onClick={e => { e.stopPropagation(); handleDelete(ph) }}
                disabled={deletingId === ph.id}
                style={{ position: 'absolute', top: '6px', left: '6px', background: 'rgba(220,38,38,0.85)', border: 'none', borderRadius: '6px', width: '26px', height: '26px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setLightbox(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox.url} alt={lightbox.legende || ''} style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '12px', objectFit: 'contain' }} />
          <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <X size={20} />
          </button>
          <button onClick={e => { e.stopPropagation(); handleDelete(lightbox) }} style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(220,38,38,0.85)', border: 'none', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#fff', fontSize: '13px', fontWeight: 600 }}>
            <Trash2 size={14} />
            Supprimer
          </button>
        </div>
      )}
    </div>
  )
}

// ─── DOCUMENTS TAB ───────────────────────────────────────────────────────────
function DocumentsTab({ chantier, documents, onRefresh }: { chantier: Chantier; documents: ChantierDocument[]; onRefresh: () => void }) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [docType, setDocType] = useState<DocumentType>('devis')
  const [docNom, setDocNom] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<DocumentType | 'tous'>('tous')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleDelete(doc: ChantierDocument) {
    if (!confirm(`Supprimer "${doc.nom}" ?`)) return
    setDeletingId(doc.id)
    await supabase.storage.from('chantier-documents').remove([doc.url])
    await supabase.from('chantier_documents').delete().eq('id', doc.id)
    setDeletingId(null)
    onRefresh()
  }

  async function handleUpload(file: File | null) {
    if (!file) return
    setUploading(true)
    setUploadError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setUploadError('Vous devez être connecté pour uploader des fichiers.')
      setUploading(false)
      return
    }

    const ext = file.name.split('.').pop()
    // Chemin : {user_id}/{chantier_id}/{timestamp}.{ext} — requis par les policies RLS Storage
    const path = `${user.id}/${chantier.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error: upErr } = await supabase.storage.from('chantier-documents').upload(path, file)
    if (upErr) {
      setUploadError(`Erreur storage : ${upErr.message}`)
      setUploading(false)
      return
    }
    const { error: insertErr } = await supabase.from('chantier_documents').insert({
      chantier_id: chantier.id,
      nom: docNom || file.name,
      type: docType,
      url: path,
    })
    if (insertErr) {
      setUploadError(`Erreur base de données : ${insertErr.message}`)
      setUploading(false)
      return
    }
    setUploading(false)
    setDocNom('')
    onRefresh()
  }

  const docIcons: Record<DocumentType, string> = {
    devis: '📋', contrat: '📝', decennale: '🛡', facture: '💶', pv_reception: '✅', correspondance: '📨', autre: '📎',
  }

  function formatSize(bytes?: number) {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} o`
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
  }

  const filtered = filterType === 'tous' ? documents : documents.filter(d => d.type === filterType)

  return (
    <div>
      {/* Filtre par type */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setFilterType('tous')}
          style={{ padding: '7px 14px', borderRadius: '20px', border: '1px solid', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', ...(filterType === 'tous' ? { background: 'var(--color-accent)', color: '#fff', borderColor: 'var(--color-accent)' } : { background: 'var(--color-surface)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }) }}
        >
          Tous ({documents.length})
        </button>
        {(Object.entries(DOCUMENT_LABELS) as [DocumentType, string][]).filter(([v]) => documents.some(d => d.type === v)).map(([v, l]) => (
          <button
            key={v}
            onClick={() => setFilterType(v)}
            style={{ padding: '7px 14px', borderRadius: '20px', border: '1px solid', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', ...(filterType === v ? { background: 'var(--color-accent)', color: '#fff', borderColor: 'var(--color-accent)' } : { background: 'var(--color-surface)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }) }}
          >
            {l} ({documents.filter(d => d.type === v).length})
          </button>
        ))}
      </div>

      {/* Upload zone */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
        <p style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: 600 }}>Ajouter un document</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
          <div>
            <label style={lbl}>Type de document</label>
            <select style={inp} value={docType} onChange={e => setDocType(e.target.value as DocumentType)}>
              {(Object.entries(DOCUMENT_LABELS) as [DocumentType, string][]).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={lbl}>Nom du fichier</label>
            <input style={inp} type="text" placeholder="Ex : Devis plomberie signé" value={docNom} onChange={e => setDocNom(e.target.value)} />
          </div>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', opacity: uploading ? 0.6 : 1 }}
        >
          <Upload size={14} />
          {uploading ? 'Upload en cours…' : 'Choisir un fichier'}
        </button>
        <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style={{ display: 'none' }} onChange={e => handleUpload(e.target.files?.[0] || null)} />
      </div>

      {uploadError && (
        <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
          {uploadError}
        </div>
      )}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-muted)', fontSize: '14px', background: 'var(--color-surface)', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
          {documents.length === 0 ? 'Aucun document déposé.' : 'Aucun document dans cette catégorie.'}
        </div>
      )}

      {filtered.length > 0 && (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '14px', overflow: 'hidden' }}>
          {filtered.map((doc, i) => (
            <div key={doc.id} style={{ padding: '14px 18px', borderBottom: i < filtered.length - 1 ? '1px solid var(--color-border)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '22px', flexShrink: 0 }}>{docIcons[doc.type]}</span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.nom}</p>
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-muted)' }}>
                    {DOCUMENT_LABELS[doc.type]} · {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                    {doc.taille ? ` · ${formatSize(doc.taille)}` : ''}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', textDecoration: 'none', fontSize: '12px', fontWeight: 600 }}>
                  <Download size={13} />
                  Ouvrir
                </a>
                <button
                  onClick={() => handleDelete(doc)}
                  disabled={deletingId === doc.id}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '34px', borderRadius: '8px', border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', opacity: deletingId === doc.id ? 0.5 : 1 }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface AnalyseDevis {
  id: string
  created_at: string
  nom_fichier: string | null
  siret_artisan: string | null
  resultat_json: Record<string, unknown> | null
}

// ─── ADD PAIEMENT MODAL ──────────────────────────────────────────────────────
function AddPaiementModal({
  chantierId, onClose, onSaved,
}: { chantierId: string; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    montant: '', date_paiement: new Date().toISOString().slice(0, 10),
    type: 'acompte' as PaiementType, description: '',
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.montant || parseFloat(form.montant) <= 0) return
    setSaving(true)
    await supabase.from('chantier_paiements').insert({
      chantier_id: chantierId, montant: parseFloat(form.montant),
      date_paiement: form.date_paiement, type: form.type,
      description: form.description.trim() || null,
    })
    await supabase.from('chantier_evenements').insert({
      chantier_id: chantierId,
      titre: `${PAIEMENT_LABELS[form.type]} de ${formatEur(parseFloat(form.montant))}`,
      description: form.description.trim() || null,
      type: 'note', date_evenement: new Date(form.date_paiement).toISOString(),
    })
    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <Modal title="Ajouter un paiement" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={lbl}>Type</label>
          <select style={inp} value={form.type} onChange={e => set('type', e.target.value)}>
            {(Object.keys(PAIEMENT_LABELS) as PaiementType[]).map(t => (
              <option key={t} value={t}>{PAIEMENT_LABELS[t]}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={lbl}>Montant (€) *</label>
            <input style={inp} type="number" placeholder="0" min="0" step="0.01" value={form.montant} onChange={e => set('montant', e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Date</label>
            <input style={inp} type="date" value={form.date_paiement} onChange={e => set('date_paiement', e.target.value)} />
          </div>
        </div>
        <div>
          <label style={lbl}>Description</label>
          <input style={inp} type="text" placeholder="Ex : Virement du 12 mars" value={form.description} onChange={e => set('description', e.target.value)} />
        </div>
        <button
          onClick={save} disabled={saving || !form.montant}
          style={{ padding: '12px', background: saving || !form.montant ? 'var(--color-muted)' : 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
        >
          {saving ? 'Enregistrement…' : 'Enregistrer le paiement'}
        </button>
      </div>
    </Modal>
  )
}

// ─── EDIT PHASE MODAL ─────────────────────────────────────────────────────────
function EditPhaseModal({
  phase, onClose, onSaved,
}: { phase: ChantierPhase; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    statut: phase.statut,
    date_debut_prevue: phase.date_debut_prevue || '',
    date_fin_prevue: phase.date_fin_prevue || '',
    budget: phase.budget !== null ? String(phase.budget) : '',
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    setSaving(true)
    await supabase.from('chantier_phases').update({
      statut: form.statut,
      date_debut_prevue: form.date_debut_prevue || null,
      date_fin_prevue: form.date_fin_prevue || null,
      budget: form.budget ? parseFloat(form.budget) : null,
    }).eq('id', phase.id)
    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <Modal title={`Modifier — ${PHASE_LABELS[phase.nom]}`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={lbl}>Statut</label>
          <select style={inp} value={form.statut} onChange={e => set('statut', e.target.value)}>
            <option value="en_attente">En attente</option>
            <option value="en_cours">En cours</option>
            <option value="terminee">Terminée</option>
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={lbl}>Début prévu</label>
            <input style={inp} type="date" value={form.date_debut_prevue} onChange={e => set('date_debut_prevue', e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Fin prévue</label>
            <input style={inp} type="date" value={form.date_fin_prevue} onChange={e => set('date_fin_prevue', e.target.value)} />
          </div>
        </div>
        <div>
          <label style={lbl}>Budget (€)</label>
          <input style={inp} type="number" placeholder="0" min="0" step="0.01" value={form.budget} onChange={e => set('budget', e.target.value)} />
        </div>
        <button
          onClick={save} disabled={saving}
          style={{ padding: '12px', background: saving ? 'var(--color-muted)' : 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </Modal>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
function ChantierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()

  const [chantier, setChantier] = useState<Chantier | null>(null)
  const [evenements, setEvenements] = useState<ChantierEvenement[]>([])
  const [paiements, setPaiements] = useState<ChantierPaiement[]>([])
  const [photos, setPhotos] = useState<ChantierPhoto[]>([])
  const [documents, setDocuments] = useState<ChantierDocument[]>([])
  const [phases, setPhases] = useState<ChantierPhase[]>([])

  const validTabs = ['chantier', 'checklist'] as const
  type TabKey = typeof validTabs[number]
  const tabParam = searchParams.get('tab') as TabKey | null
  const [tab, setTabState] = useState<TabKey>(validTabs.includes(tabParam as TabKey) ? (tabParam as TabKey) : 'chantier')
  const setTab = (t: TabKey) => {
    setTabState(t)
    router.replace(`/chantier/${id}?tab=${t}`, { scroll: false })
  }

  const [loading, setLoading] = useState(true)
  const [savingStatut, setSavingStatut] = useState(false)

  const [analyses, setAnalyses] = useState<AnalyseDevis[]>([])

  // New states
  const [phaseOuverte, setPhaseOuverte] = useState<string | null>(null)
  const [showModalPaiement, setShowModalPaiement] = useState(false)
  const [editPhase, setEditPhase] = useState<ChantierPhase | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [currentPhasePhoto, setCurrentPhasePhoto] = useState<PhotoPhase>('pendant')
  const [lightboxPhoto, setLightboxPhoto] = useState<ChantierPhoto | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const loadAll = useCallback(async () => {
    setLoading(true)
    const [{ data: c }, { data: ev }, { data: pa }, { data: ph }, { data: do_ }] = await Promise.all([
      supabase.from('chantiers').select('*').eq('id', id).single(),
      supabase.from('chantier_evenements').select('*').eq('chantier_id', id).order('date_evenement', { ascending: false }),
      supabase.from('chantier_paiements').select('*').eq('chantier_id', id).order('date_paiement', { ascending: false }),
      supabase.from('chantier_photos').select('*').eq('chantier_id', id).order('created_at', { ascending: false }),
      supabase.from('chantier_documents').select('*').eq('chantier_id', id).order('created_at', { ascending: false }),
    ])
    if (!c) { router.push('/mes-chantiers'); return }
    setChantier(c)
    setEvenements(ev || [])
    setPaiements(pa || [])
    const [photosResolved, docsResolved] = await Promise.all([
      resolveSignedUrls('chantier-photos', ph || []),
      resolveSignedUrls('chantier-documents', do_ || []),
    ])
    setPhotos(photosResolved)
    setDocuments(docsResolved)

    const { data: phasesData } = await supabase
      .from('chantier_phases').select('*').eq('chantier_id', id).order('created_at')

    if (!phasesData || phasesData.length === 0) {
      const { data: created } = await supabase
        .from('chantier_phases')
        .insert((['preparation', 'travaux', 'finitions', 'reception'] as PhaseNom[]).map(nom => ({
          chantier_id: id, nom, statut: 'en_attente',
        })))
        .select()
      setPhases(created || [])
      setPhaseOuverte(prev => prev ?? created?.find(p => p.statut === 'en_cours')?.nom ?? null)
    } else {
      setPhases(phasesData)
      setPhaseOuverte(prev => prev ?? phasesData.find(p => p.statut === 'en_cours')?.nom ?? null)
    }

    if (c.siret) {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (currentUser) {
        const { data: analysesData } = await supabase
          .from('analyses_devis')
          .select('id, created_at, nom_fichier, resultat_json, siret_artisan')
          .eq('siret_artisan', c.siret)
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false })
        setAnalyses(analysesData || [])
      }
    }

    setLoading(false)
  }, [id, router])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/auth'); return }
      loadAll()
    })
  }, [id, loadAll, router])

  const reloadPhases = useCallback(async () => {
    const { data } = await supabase
      .from('chantier_phases').select('*').eq('chantier_id', id).order('created_at')
    setPhases(data || [])
  }, [id])

  async function updateStatut(statut: string) {
    if (!chantier) return
    setSavingStatut(true)
    await supabase.from('chantiers').update({ statut }).eq('id', id)
    setChantier({ ...chantier, statut: statut as Chantier['statut'] })
    if (statut === 'litige') {
      await supabase.from('chantier_evenements').insert({ chantier_id: id, titre: 'Statut changé en Litige', description: 'Consultez l\'assistant juridique pour vos recours.', type: 'alerte', date_evenement: new Date().toISOString() })
      setEvenements(prev => [{ id: Date.now().toString(), chantier_id: id, titre: 'Statut changé en Litige', description: 'Consultez l\'assistant juridique pour vos recours.', type: 'alerte', date_evenement: new Date().toISOString(), created_at: new Date().toISOString() }, ...prev])
    }
    setSavingStatut(false)
  }

  async function handlePhasePhotoUploadArray(filesArray: File[], phasePhoto: PhotoPhase) {
    console.log('handlePhasePhotoUploadArray called', { count: filesArray.length, phasePhoto, chantier: chantier?.id })
    if (!filesArray || filesArray.length === 0) { console.log('no files'); return }
    if (!chantier) { console.log('chantier is null'); return }
    setUploadingPhoto(true)

    const { data: { user } } = await supabase.auth.getUser()
    console.log('user:', user?.id)
    if (!user) { setUploadingPhoto(false); return }

    for (const file of filesArray) {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${chantier.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      console.log('uploading to path:', path)

      const { error: upErr } = await supabase.storage.from('chantier-photos').upload(path, file)
      if (upErr) {
        console.error('Storage upload error:', upErr)
        continue
      }

      console.log('storage upload OK, inserting in DB...')
      const { error: insertErr } = await supabase.from('chantier_photos').insert({
        chantier_id: chantier.id, url: path, phase: phasePhoto, legende: null,
      })
      if (insertErr) {
        console.error('DB insert error:', insertErr)
      } else {
        console.log('insert OK')
      }
    }

    setUploadingPhoto(false)
    await loadAll()
  }

  async function handlePhaseDocUpload(file: File | null) {
    console.log('handlePhaseDocUpload called', { file: file?.name, chantier: chantier?.id })
    if (!file) { console.log('no file'); return }
    if (!chantier) { console.log('chantier is null'); return }

    const { data: { user } } = await supabase.auth.getUser()
    console.log('user:', user?.id)
    if (!user) return

    const ext = file.name.split('.').pop()
    const path = `${user.id}/${chantier.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    console.log('uploading doc to path:', path)

    const { error: upErr } = await supabase.storage.from('chantier-documents').upload(path, file)
    if (upErr) {
      console.error('Storage doc upload error:', upErr)
      return
    }

    console.log('doc storage OK, inserting...')
    const { error: insertErr } = await supabase.from('chantier_documents').insert({
      chantier_id: chantier.id, nom: file.name,
      type: 'autre' as DocumentType, url: path, taille: file.size,
    })
    if (insertErr) {
      console.error('DB doc insert error:', insertErr)
    } else {
      console.log('doc insert OK')
    }

    await loadAll()
  }

  async function handleDeleteChantier() {
    if (!chantier) return
    setDeleting(true)
    try {
      await supabase.from('chantier_evenements').delete().eq('chantier_id', chantier.id)
      await supabase.from('chantier_paiements').delete().eq('chantier_id', chantier.id)
      await supabase.from('chantier_phases').delete().eq('chantier_id', chantier.id)

      if (photos.length > 0) {
        const photoPaths = photos.map(p => p.url)
        await supabase.storage.from('chantier-photos').remove(photoPaths)
        await supabase.from('chantier_photos').delete().eq('chantier_id', chantier.id)
      }

      if (documents.length > 0) {
        const docPaths = documents.map(d => d.url)
        await supabase.storage.from('chantier-documents').remove(docPaths)
        await supabase.from('chantier_documents').delete().eq('chantier_id', chantier.id)
      }

      await supabase.from('chantiers').delete().eq('id', chantier.id)
      router.push('/mes-chantiers')
    } catch (e) {
      console.error('Erreur suppression chantier:', e)
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8f4ee 0%, #f5efe7 38%, #fcfaf7 100%)' }}>
        <SiteHeader />
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-accent)' }} className="spin" />
        </div>
      </main>
    )
  }

  if (!chantier) return null

  const sc = STATUT_COLORS[chantier.statut]
  const jours = daysUntil(chantier.date_fin_prevue)
  const retard = jours !== null && jours < 0 && chantier.statut === 'en_cours'
  const paye = totalPaye(paiements)
  const payePct = chantier.montant_total && chantier.montant_total > 0 ? Math.min(100, Math.round(paye / chantier.montant_total * 100)) : 0

  const PHASE_PHOTO_MAP: Record<PhaseNom, PhotoPhase> = {
    preparation: 'avant', travaux: 'pendant', finitions: 'pendant', reception: 'apres',
  }

  const mLbl: React.CSSProperties = { fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-muted)', marginBottom: 6, display: 'block' }
  const mVal: React.CSSProperties = { fontSize: 24, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1, display: 'block', marginBottom: 6, letterSpacing: '-0.03em' }
  const mSub: React.CSSProperties = { fontSize: 11, color: 'var(--color-muted)', display: 'block' }
  const sectionLbl: React.CSSProperties = { fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-muted)', fontWeight: 600 }

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8f4ee 0%, #f5efe7 38%, #fcfaf7 100%)' }}>
      <SiteHeader />

      {/* ── HEADER ── */}
      <div style={{ padding: '24px 24px 0' }}>
        <SurfaceCard style={{ maxWidth: '1120px', margin: '0 auto', padding: '28px 28px 0', overflow: 'hidden', position: 'relative' }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 10% 16%, rgba(82,183,136,0.12), transparent 22%), radial-gradient(circle at 88% 16%, rgba(255,196,153,0.18), transparent 18%)',
          }} />
          <div style={{ position: 'relative' }}>

          <button
            onClick={() => router.push('/mes-chantiers')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', fontSize: '13px', fontWeight: 500, padding: 0, marginBottom: '20px', fontFamily: 'var(--font-body)' }}
          >
            <ArrowLeft size={15} />
            Mes chantiers
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ marginBottom: '12px' }}>
                <SectionBadge text="Carnet de chantier" tone="sand" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                <h1 className="font-display" style={{ margin: 0, fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 1.02 }}>
                  {chantier.nom_artisan}
                </h1>
                {chantier.siret && (
                  <a href={`/?q=${chantier.siret}`} target="_blank" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'none', padding: '3px 8px', borderRadius: '20px', background: 'var(--color-accent-light)' }}>
                    Fiche Verifio <ExternalLink size={10} />
                  </a>
                )}
              </div>
              <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--color-muted)' }}>
                {chantier.type_travaux}
                {chantier.adresse_chantier && <> · <MapPin size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> {chantier.adresse_chantier}</>}
              </p>
              {(chantier.date_debut || chantier.date_fin_prevue) && (
                <p style={{ margin: 0, fontSize: '12px', color: retard ? '#dc2626' : 'var(--color-muted)', fontWeight: retard ? 600 : 400 }}>
                  {chantier.date_debut && <>Début : {new Date(chantier.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</>}
                  {chantier.date_fin_prevue && <> · Fin prévue : {new Date(chantier.date_fin_prevue).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</>}
                  {retard && <> · <span style={{ color: '#dc2626' }}>{Math.abs(jours!)} jour{Math.abs(jours!) > 1 ? 's' : ''} de retard</span></>}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <select
                value={chantier.statut} onChange={e => updateStatut(e.target.value)} disabled={savingStatut}
                style={{ padding: '7px 12px', borderRadius: '20px', border: `1.5px solid ${sc.border}`, background: sc.bg, color: sc.color, fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', appearance: 'none', paddingRight: '28px', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(sc.color)}' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
              >
                {(Object.entries(STATUT_LABELS) as [string, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              {chantier.statut === 'litige' && (
                <Link href="/assistant-juridique" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '20px', color: '#dc2626', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}>
                  Assistant juridique
                </Link>
              )}
              <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '20px', color: 'var(--color-muted)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                <Download size={12} />
                Exporter PDF
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: '0.5px solid var(--color-danger, #E24B4A)', borderRadius: '8px', background: 'transparent', color: 'var(--color-danger, #E24B4A)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
              >
                <Trash2 size={14} strokeWidth={1.5} />
                {!isMobile && 'Supprimer le chantier'}
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.35fr 0.9fr', gap: '14px', marginBottom: '18px' }}>
            <div style={{ padding: '18px 18px 20px', borderRadius: '22px', background: 'linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(248,243,236,0.92) 100%)', border: '1px solid rgba(226,217,204,0.82)' }}>
              <p style={{ margin: '0 0 6px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7b8a83', fontWeight: 700 }}>Vision d’ensemble</p>
              <p style={{ margin: '0 0 10px', fontSize: '16px', color: '#14201b', fontWeight: 700 }}>
                Suivez le budget, les phases, les preuves photo et les documents dans un seul espace.
              </p>
              <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.7, color: '#56625d' }}>
                Chaque onglet doit vous aider a prendre une decision simple: continuer, documenter, relancer ou vous proteger en cas de doute.
              </p>
            </div>
            <div style={{ padding: '18px', borderRadius: '22px', background: 'linear-gradient(135deg, #153b2e 0%, #1f4c3d 100%)', border: '1px solid rgba(21,59,46,0.08)', color: '#eef8f3' }}>
              <p style={{ margin: '0 0 6px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, opacity: 0.76 }}>Statut actuel</p>
              <p style={{ margin: '0 0 10px', fontSize: '26px', fontWeight: 800, letterSpacing: '-0.04em' }}>{STATUT_LABELS[chantier.statut]}</p>
              <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: 'rgba(238,248,243,0.76)' }}>
                {retard ? `Le chantier accuse actuellement ${Math.abs(jours || 0)} jour${Math.abs(jours || 0) > 1 ? 's' : ''} de retard.` : 'Le carnet reste a jour pour garder une trace claire des decisions et des preuves.'}
              </p>
            </div>
          </div>

          {/* Tab nav — 2 onglets */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(226,217,204,0.82)', marginBottom: '-1px' }}>
            {(['chantier', 'checklist'] as TabKey[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{ padding: '12px 18px', background: 'none', border: 'none', borderBottom: tab === t ? '2px solid #1B4332' : '2px solid transparent', cursor: 'pointer', fontSize: 13, fontWeight: tab === t ? 700 : 500, color: tab === t ? 'var(--color-text)' : 'var(--color-muted)', fontFamily: 'var(--font-body)', transition: 'color 0.15s' }}
              >
                {t === 'chantier' ? 'Chantier' : 'Checklist'}
              </button>
            ))}
          </div>
          </div>
        </SurfaceCard>
        </div>

      {/* ── CONTENU ── */}
      <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '28px 24px 80px' }}>

        {/* MÉTRIQUES */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,minmax(0,1fr))' : 'repeat(4,minmax(0,1fr))', gap: '12px', marginBottom: '1.75rem' }}>
          <SurfaceCard style={{ padding: '18px 18px 16px', background: 'linear-gradient(180deg, rgba(255,255,255,0.82) 0%, rgba(248,243,236,0.92) 100%)' }}>
            <span style={mLbl}>Budget total</span>
            <span style={mVal}>{chantier.montant_total ? formatEur(chantier.montant_total) : 'Non défini'}</span>
            <span style={mSub}>montant contractuel</span>
          </SurfaceCard>
          <SurfaceCard style={{ padding: '18px 18px 16px', background: 'linear-gradient(180deg, rgba(234,243,222,0.88) 0%, rgba(255,255,255,0.92) 100%)' }}>
            <span style={mLbl}>Payé</span>
            <span style={{ ...mVal, color: '#27500A' }}>{formatEur(paye)}</span>
            <span style={mSub}>{payePct}% du total</span>
          </SurfaceCard>
          <SurfaceCard style={{ padding: '18px 18px 16px', background: 'linear-gradient(180deg, rgba(255,255,255,0.82) 0%, rgba(248,243,236,0.92) 100%)' }}>
            <span style={mLbl}>Restant</span>
            <span style={mVal}>{chantier.montant_total ? formatEur(Math.max(0, chantier.montant_total - paye)) : '—'}</span>
            <span style={mSub}>à verser</span>
          </SurfaceCard>
          <SurfaceCard style={{ padding: '18px 18px 16px', background: retard ? 'linear-gradient(180deg, rgba(252,235,235,0.88) 0%, rgba(255,255,255,0.94) 100%)' : 'linear-gradient(180deg, rgba(255,255,255,0.82) 0%, rgba(248,243,236,0.92) 100%)' }}>
            <span style={mLbl}>Fin prévue</span>
            <span style={mVal}>
              {chantier.date_fin_prevue
                ? new Date(chantier.date_fin_prevue).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                : 'Non définie'}
            </span>
            <span style={mSub}>
              {jours === null ? '' : jours > 0 ? `dans ${jours} jour${jours > 1 ? 's' : ''}` : jours === 0 ? "aujourd'hui" : 'dépassée'}
            </span>
          </SurfaceCard>
        </div>

        {/* TAB CHANTIER */}
        {tab === 'chantier' && (
          <>
            {/* DEVIS ANALYSÉS */}
            {analyses.length > 0 && (
              <SurfaceCard style={{ marginBottom: '1.5rem', padding: '18px' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  Devis analysés pour cet artisan
                </div>
                {analyses.map(analyse => {
                  const score = analyse.resultat_json?.score_global as number | undefined
                  const scoreColor = score !== undefined
                    ? score >= 7 ? '#27500A' : score >= 4 ? '#BA7517' : '#A32D2D'
                    : 'var(--color-muted)'
                  return (
                    <div key={analyse.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: '10px', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)' }}>
                          {analyse.nom_fichier || 'Devis sans nom'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>
                          Analysé le {new Date(analyse.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {score !== undefined && (
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 20, fontWeight: 500, color: scoreColor, lineHeight: 1 }}>{Math.round(score)}/10</div>
                            <div style={{ fontSize: 10, color: 'var(--color-muted)' }}>score</div>
                          </div>
                        )}
                        <a href="/mon-espace" style={{ fontSize: 12, color: 'var(--color-accent)', textDecoration: 'none' }}>
                          Revoir →
                        </a>
                      </div>
                    </div>
                  )
                })}
              </SurfaceCard>
            )}

            {/* PHASES ACCORDÉON */}
            {PHASES_ORDER.map((phaseName, idx) => {
              const phase = phases.find(p => p.nom === phaseName)
              if (!phase) return null
              const isOpen = phaseOuverte === phaseName
              const photoPhase = PHASE_PHOTO_MAP[phaseName]
              const phasePhotos = photos.filter(p => p.phase === photoPhase)
              const docsPhase = documents // tous les documents, pas de filtre par phase
              const avancement = (phase.date_debut_prevue && phase.date_fin_prevue)
                ? dateProgress(phase.date_debut_prevue, phase.date_fin_prevue)
                : null

              const borderColor = phase.statut === 'terminee'
                ? '0.5px solid #3B6D11'
                : phase.statut === 'en_cours'
                ? '0.5px solid #185FA5'
                : '0.5px solid var(--color-border)'

              const circleStyle: React.CSSProperties = {
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: phase.statut === 'terminee' ? '#EAF3DE' : phase.statut === 'en_cours' ? '#E6F1FB' : 'var(--color-bg)',
                fontSize: 13, fontWeight: 600,
                color: phase.statut === 'terminee' ? '#27500A' : phase.statut === 'en_cours' ? '#0C447C' : 'var(--color-muted)',
              }

              const badgeStyle: React.CSSProperties = phase.statut === 'terminee'
                ? { background: '#EAF3DE', color: '#27500A', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }
                : phase.statut === 'en_cours'
                ? { background: '#E6F1FB', color: '#0C447C', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }
                : { background: 'var(--color-bg)', color: 'var(--color-muted)', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: '0.5px solid var(--color-border)' }

              const badgeLabel = phase.statut === 'terminee' ? 'Terminée' : phase.statut === 'en_cours' ? 'En cours' : 'En attente'

              return (
                <SurfaceCard key={phaseName} style={{ borderRadius: '22px', border: borderColor, overflow: 'hidden', marginBottom: '12px', background: 'linear-gradient(180deg, rgba(255,255,255,0.84) 0%, rgba(248,243,236,0.9) 100%)', boxShadow: '0 16px 36px rgba(20,32,27,0.05)' }}>
                  {/* Header */}
                  <div
                    onClick={() => setPhaseOuverte(isOpen ? null : phaseName)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 18px', cursor: 'pointer' }}
                  >
                    <div style={circleStyle}>
                      {phase.statut === 'terminee'
                        ? <Check size={14} strokeWidth={1.5} />
                        : idx + 1
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em' }}>{PHASE_LABELS[phaseName]}</p>
                      {(phase.date_debut_prevue || phase.date_fin_prevue) && (
                        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)' }}>
                          {phase.date_debut_prevue && new Date(phase.date_debut_prevue).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          {phase.date_debut_prevue && phase.date_fin_prevue && ' → '}
                          {phase.date_fin_prevue && new Date(phase.date_fin_prevue).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <span style={badgeStyle}>{badgeLabel}</span>
                      <ChevronDown size={16} strokeWidth={1.5} style={{ color: 'var(--color-muted)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </div>
                  </div>

                  {/* Body */}
                  {isOpen && (
                    <div style={{ borderTop: '1px solid rgba(226,217,204,0.76)' }}>
                      {/* Métriques 3 colonnes */}
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,minmax(0,1fr))', gap: '1px', background: 'var(--color-border)' }}>
                        <div style={{ background: 'rgba(255,255,255,0.72)', padding: '14px 15px' }}>
                          <span style={{ ...mLbl, marginBottom: 4 }}>Dates prévues</span>
                          <span style={{ fontSize: 13, color: 'var(--color-text)' }}>
                            {phase.date_debut_prevue || phase.date_fin_prevue
                              ? `${phase.date_debut_prevue ? new Date(phase.date_debut_prevue).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '?'} → ${phase.date_fin_prevue ? new Date(phase.date_fin_prevue).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '?'}`
                              : 'Non planifiée'}
                          </span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.72)', padding: '14px 15px' }}>
                          <span style={{ ...mLbl, marginBottom: 4 }}>Budget phase</span>
                          <span style={{ fontSize: 13, color: 'var(--color-text)' }}>
                            {phase.budget !== null ? formatEur(phase.budget) : 'Non défini'}
                          </span>
                          {chantier.montant_total && phase.budget !== null && (
                            <span style={{ ...mSub, marginTop: 2 }}>sur {formatEur(chantier.montant_total)} total</span>
                          )}
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.72)', padding: '14px 15px' }}>
                          <span style={{ ...mLbl, marginBottom: 4 }}>Avancement</span>
                          {avancement === null ? (
                            <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>—</span>
                          ) : (
                            <>
                              <span style={{ fontSize: 13, color: 'var(--color-text)' }}>{avancement}%</span>
                              <div style={{ marginTop: 6, height: 5, borderRadius: 3, background: 'var(--color-border)' }}>
                                <div style={{ height: '100%', borderRadius: 3, width: `${avancement}%`, background: '#185FA5' }} />
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Paiements */}
                      <div style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <span style={sectionLbl}>Paiements</span>
                          <button
                            onClick={() => setShowModalPaiement(true)}
                            style={{ fontSize: 11, color: 'var(--color-accent)', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'var(--font-body)', fontWeight: 600, padding: 0 }}
                          >
                            + Ajouter
                          </button>
                        </div>
                        {paiements.length === 0 ? (
                          <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)' }}>Aucun paiement pour cette phase.</p>
                        ) : paiements.map(p => (
                          <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--color-bg)', borderRadius: '8px', marginBottom: '6px' }}>
                            <div>
                              <p style={{ margin: '0 0 2px', fontSize: 13 }}>{p.description || PAIEMENT_LABELS[p.type]}</p>
                              <p style={{ margin: 0, fontSize: 11, color: 'var(--color-muted)' }}>{new Date(p.date_paiement).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                            <span style={{ fontSize: 14, fontWeight: 500, color: '#27500A' }}>+{formatEur(p.montant)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Photos */}
                      <div style={{ padding: '0 16px 14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={sectionLbl}>Photos</span>
                          {uploadingPhoto && <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>Upload…</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 0 }}>
                          {phasePhotos.map(photo => (
                            <div
                              key={photo.id}
                              onClick={() => setLightboxPhoto(photo)}
                              style={{ width: 64, height: 64, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', background: 'var(--color-bg)', border: '0.5px solid var(--color-border)', flexShrink: 0, position: 'relative' }}
                            >
                              {photo.url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={photo.url} alt={photo.legende || 'Photo chantier'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                                  </svg>
                                </div>
                              )}
                            </div>
                          ))}
                          {/* Bouton + ajouter */}
                          <div
                            onClick={() => { setCurrentPhasePhoto(PHASE_PHOTO_MAP[phaseName]); photoInputRef.current?.click() }}
                            style={{ width: 64, height: 64, borderRadius: 8, border: '1px dashed var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-muted)', fontSize: 24, fontWeight: 300, flexShrink: 0 }}
                          >
                            +
                          </div>
                        </div>
                        {phasePhotos.length === 0 && (
                          <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--color-muted)' }}>
                            Aucune photo pour cette phase.
                            {phaseName === 'preparation' && ' (photos "avant travaux")'}
                            {(phaseName === 'travaux' || phaseName === 'finitions') && ' (photos "pendant travaux")'}
                            {phaseName === 'reception' && ' (photos "après travaux")'}
                          </p>
                        )}
                      </div>

                      {/* Documents */}
                      <div style={{ padding: '0 16px 14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <span style={sectionLbl}>Documents</span>
                          <button
                            onClick={() => docInputRef.current?.click()}
                            style={{ fontSize: 11, color: 'var(--color-accent)', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'var(--font-body)', fontWeight: 600, padding: 0 }}
                          >
                            + Ajouter
                          </button>
                        </div>
                        {docsPhase.length === 0 ? (
                          <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)' }}>Aucun document.</p>
                        ) : docsPhase.map(doc => (
                          <div
                            key={doc.id}
                            onClick={() => doc.url && window.open(doc.url, '_blank')}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--color-bg)', borderRadius: 8, marginBottom: 5, cursor: doc.url ? 'pointer' : 'default', transition: 'background 0.15s' }}
                            onMouseEnter={e => { if (doc.url) (e.currentTarget as HTMLDivElement).style.background = 'var(--color-border)' }}
                            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--color-bg)'}
                          >
                            <div style={{ width: 32, height: 32, borderRadius: 6, background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                              </svg>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.nom}</div>
                              <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 1 }}>{DOCUMENT_LABELS[doc.type]} · {new Date(doc.created_at).toLocaleDateString('fr-FR')}</div>
                            </div>
                            {doc.url && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                                <polyline points="15 3 21 3 21 9"/>
                                <line x1="10" y1="14" x2="21" y2="3"/>
                              </svg>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Modifier la phase */}
                      <button
                        onClick={() => setEditPhase(phase)}
                        style={{ margin: '0 16px 14px', padding: '8px', border: '0.5px solid var(--color-border)', borderRadius: '8px', fontSize: 12, color: 'var(--color-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', background: 'transparent', width: 'calc(100% - 32px)', fontFamily: 'var(--font-body)' }}
                      >
                        <Pencil size={12} strokeWidth={1.5} />
                        Modifier les dates et le budget
                      </button>
                    </div>
                  )}
                </SurfaceCard>
              )
            })}

            {/* JOURNAL */}
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', marginBottom: 10, marginTop: 24 }}>Journal</p>
            <JournalTab chantier={chantier} evenements={evenements} paiements={paiements} onRefresh={loadAll} />
          </>
        )}

        {tab === 'checklist' && <GuideChantier initialArtisan={chantier.nom_artisan} />}
      </div>

      {/* Inputs fichiers masqués */}
      <input
        ref={photoInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
        onChange={e => {
          const filesArray = Array.from(e.target.files ?? [])
          e.target.value = ''
          if (filesArray.length > 0) handlePhasePhotoUploadArray(filesArray, currentPhasePhoto)
        }}
      />
      <input
        ref={docInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style={{ display: 'none' }}
        onChange={e => {
          const file = e.target.files?.[0] ?? null
          e.target.value = ''
          if (file) handlePhaseDocUpload(file)
        }}
      />

      {/* Modales */}
      {showModalPaiement && (
        <AddPaiementModal
          chantierId={id}
          onClose={() => setShowModalPaiement(false)}
          onSaved={loadAll}
        />
      )}
      {editPhase && (
        <EditPhaseModal
          phase={editPhase}
          onClose={() => setEditPhase(null)}
          onSaved={reloadPhases}
        />
      )}

      {/* Lightbox photos */}
      {lightboxPhoto && (
        <div
          onClick={() => setLightboxPhoto(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        >
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            {lightboxPhoto.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={lightboxPhoto.url}
                alt={lightboxPhoto.legende || 'Photo chantier'}
                style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 12 }}
              />
            ) : (
              <div style={{ color: '#fff', fontSize: 14 }}>Image non disponible</div>
            )}
            {lightboxPhoto.legende && (
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, textAlign: 'center', marginTop: 10 }}>
                {lightboxPhoto.legende}
              </div>
            )}
            <button
              onClick={() => setLightboxPhoto(null)}
              style={{ position: 'absolute', top: -12, right: -12, width: 32, height: 32, borderRadius: '50%', background: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#333' }}
            >
              ×
            </button>
          </div>
        </div>
      )}
      {/* ── MODALE SUPPRESSION CHANTIER ── */}
      {showDeleteModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={() => !deleting && setShowDeleteModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--color-surface)', borderRadius: '16px', padding: '1.5rem', maxWidth: 400, width: '100%' }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <Trash2 size={32} strokeWidth={1.5} color="#E24B4A" />
            </div>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 500, textAlign: 'center' }}>Supprimer ce chantier ?</p>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--color-muted)', textAlign: 'center' }}>
              Cette action est irréversible. Toutes les données liées (paiements, photos, documents, événements, phases) seront définitivement supprimées.
            </p>
            <p style={{ margin: '10px 0 0', fontSize: 14, textAlign: 'center', fontWeight: 600 }}>{chantier.nom_artisan}</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                style={{ flex: 1, padding: '10px', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'transparent', color: 'var(--color-text)', fontSize: 14, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)' }}
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteChantier}
                disabled={deleting}
                style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', background: '#E24B4A', color: '#fff', fontSize: 14, fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1, fontFamily: 'var(--font-body)' }}
              >
                {deleting ? 'Suppression...' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={null}>
      <ChantierDetailPage params={params} />
    </Suspense>
  )
}
