'use client'

import { useState, useEffect, useRef, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft, AlertCircle, CheckCircle2, Clock, Plus, Calendar,
  MapPin, ExternalLink, MessageSquare, Phone, Wrench, FileText,
  Camera, Trash2, Download, Upload, Eye, X, CreditCard, ChevronDown,
  HardHat,
} from 'lucide-react'
import SiteHeader from '@/components/SiteHeader'
import { supabase } from '@/lib/supabase'
import {
  type Chantier, type ChantierPaiement, type ChantierEvenement,
  type ChantierPhoto, type ChantierDocument,
  type EvenementType, type PaiementType, type PhotoPhase, type DocumentType,
  STATUT_LABELS, STATUT_COLORS, EVENEMENT_ICONS, PAIEMENT_LABELS, DOCUMENT_LABELS,
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
                  <a href="/assistant-juridique" style={{ display: 'inline-block', marginTop: '6px', fontSize: '12px', color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'none' }}>
                    → Consulter l'assistant juridique
                  </a>
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
              <label style={lbl}>Type d'événement</label>
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
              L'acompte versé ({Math.round(acomptePct * 100)}%) dépasse 30% du total. Vérifiez votre contrat.
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

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function ChantierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()

  const [chantier, setChantier] = useState<Chantier | null>(null)
  const [evenements, setEvenements] = useState<ChantierEvenement[]>([])
  const [paiements, setPaiements] = useState<ChantierPaiement[]>([])
  const [photos, setPhotos] = useState<ChantierPhoto[]>([])
  const [documents, setDocuments] = useState<ChantierDocument[]>([])

  const validTabs = ['journal', 'paiements', 'photos', 'documents'] as const
  type TabKey = typeof validTabs[number]
  const tabParam = searchParams.get('tab') as TabKey | null
  const [tab, setTabState] = useState<TabKey>(validTabs.includes(tabParam as TabKey) ? (tabParam as TabKey) : 'journal')

  const setTab = (t: TabKey) => {
    setTabState(t)
    router.replace(`/chantier/${id}?tab=${t}`, { scroll: false })
  }

  const [loading, setLoading] = useState(true)
  const [savingStatut, setSavingStatut] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/auth'); return }
      loadAll()
    })
  }, [id])

  async function loadAll() {
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
    // Résoudre les URLs signées pour les buckets privés
    const [photosResolved, docsResolved] = await Promise.all([
      resolveSignedUrls('chantier-photos', ph || []),
      resolveSignedUrls('chantier-documents', do_ || []),
    ])
    setPhotos(photosResolved)
    setDocuments(docsResolved)
    setLoading(false)
  }

  async function updateStatut(statut: string) {
    if (!chantier) return
    setSavingStatut(true)
    await supabase.from('chantiers').update({ statut }).eq('id', id)
    setChantier({ ...chantier, statut: statut as any })
    if (statut === 'litige') {
      await supabase.from('chantier_evenements').insert({ chantier_id: id, titre: 'Statut changé en Litige', description: 'Consultez l\'assistant juridique pour vos recours.', type: 'alerte', date_evenement: new Date().toISOString() })
      setEvenements(prev => [{ id: Date.now().toString(), chantier_id: id, titre: 'Statut changé en Litige', description: 'Consultez l\'assistant juridique pour vos recours.', type: 'alerte', date_evenement: new Date().toISOString(), created_at: new Date().toISOString() }, ...prev])
    }
    setSavingStatut(false)
  }

  function handleExport() {
    window.print()
  }

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
        <SiteHeader />
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-accent)' }} className="spin" />
        </div>
      </main>
    )
  }

  if (!chantier) return null

  const sc = STATUT_COLORS[chantier.statut]
  const prog = dateProgress(chantier.date_debut, chantier.date_fin_prevue)
  const jours = daysUntil(chantier.date_fin_prevue)
  const retard = jours !== null && jours < 0 && chantier.statut === 'en_cours'
  const paye = totalPaye(paiements)
  const payePct = chantier.montant_total && chantier.montant_total > 0 ? Math.min(100, Math.round(paye / chantier.montant_total * 100)) : 0

  const TABS = [
    { key: 'journal', label: '📝 Journal', count: evenements.length },
    { key: 'paiements', label: '💶 Paiements', count: paiements.length },
    { key: 'photos', label: '📷 Photos', count: photos.length },
    { key: 'documents', label: '📄 Documents', count: documents.length },
  ] as const

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <SiteHeader />

      {/* ── HEADER ── */}
      <div style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 24px 0' }}>

          <button
            onClick={() => router.push('/mes-chantiers')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', fontSize: '13px', fontWeight: 500, padding: 0, marginBottom: '20px', fontFamily: 'var(--font-body)' }}
          >
            <ArrowLeft size={15} />
            Mes chantiers
          </button>

          {/* Title row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                <h1 className="font-display" style={{ margin: 0, fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                  {chantier.nom_artisan}
                </h1>
                {chantier.siret && (
                  <a href={`/?q=${chantier.siret}`} target="_blank" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'none', padding: '3px 8px', borderRadius: '20px', background: 'var(--color-accent-light)' }}>
                    Fiche Verifio <ExternalLink size={10} />
                  </a>
                )}
              </div>
              <p style={{ margin: '0 0 6px', fontSize: '13px', color: 'var(--color-muted)' }}>
                {chantier.type_travaux}
                {chantier.adresse_chantier && <> · <MapPin size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> {chantier.adresse_chantier}</>}
              </p>
              {(chantier.date_debut || chantier.date_fin_prevue) && (
                <p style={{ margin: 0, fontSize: '12px', color: retard ? '#dc2626' : 'var(--color-muted)', fontWeight: retard ? 600 : 400 }}>
                  {chantier.date_debut && <>Début : {new Date(chantier.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</>}
                  {chantier.date_fin_prevue && <> · Fin prévue : {new Date(chantier.date_fin_prevue).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</>}
                  {retard && <> · <span style={{ color: '#dc2626' }}>⚠ {Math.abs(jours!)} jour{Math.abs(jours!) > 1 ? 's' : ''} de retard</span></>}
                </p>
              )}
            </div>

            {/* Statut + actions */}
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <select
                value={chantier.statut}
                onChange={e => updateStatut(e.target.value)}
                disabled={savingStatut}
                style={{ padding: '7px 12px', borderRadius: '20px', border: `1.5px solid ${sc.border}`, background: sc.bg, color: sc.color, fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', appearance: 'none', paddingRight: '28px', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(sc.color)}' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
              >
                {(Object.entries(STATUT_LABELS) as [string, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              {chantier.statut === 'litige' && (
                <a href="/assistant-juridique" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '20px', color: '#dc2626', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}>
                  🚨 Assistant juridique
                </a>
              )}
              <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '20px', color: 'var(--color-muted)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                <Download size={12} />
                Exporter PDF
              </button>
            </div>
          </div>

          {/* Progress bars */}
          {chantier.date_debut && chantier.date_fin_prevue && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: 500 }}>Avancement temporel</span>
                <span style={{ fontSize: '11px', color: retard ? '#dc2626' : 'var(--color-muted)', fontWeight: 600 }}>{prog}%</span>
              </div>
              <div style={{ height: '6px', borderRadius: '3px', background: 'var(--color-border)' }}>
                <div style={{ height: '100%', borderRadius: '3px', width: `${prog}%`, background: retard ? '#dc2626' : 'var(--color-accent)' }} />
              </div>
            </div>
          )}
          {chantier.montant_total && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: 500 }}>Paiements</span>
                <span style={{ fontSize: '11px', color: 'var(--color-safe)', fontWeight: 600 }}>
                  {formatEur(paye)} / {formatEur(chantier.montant_total)} ({payePct}%)
                </span>
              </div>
              <div style={{ height: '6px', borderRadius: '3px', background: 'var(--color-border)' }}>
                <div style={{ height: '100%', borderRadius: '3px', width: `${payePct}%`, background: 'var(--color-safe)' }} />
              </div>
            </div>
          )}

          {/* Tab nav */}
          <div style={{ display: 'flex', gap: '2px', marginBottom: '-1px' }}>
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{ padding: '10px 16px', background: 'none', border: 'none', borderBottom: tab === t.key ? '2px solid var(--color-accent)' : '2px solid transparent', cursor: 'pointer', fontSize: '13px', fontWeight: tab === t.key ? 700 : 500, color: tab === t.key ? 'var(--color-accent)' : 'var(--color-muted)', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', transition: 'color 0.15s' }}
              >
                {t.label}{t.count > 0 && <span style={{ marginLeft: '5px', fontSize: '11px', padding: '1px 6px', borderRadius: '10px', background: tab === t.key ? 'var(--color-accent-light)' : 'var(--color-neutral-bg)', color: tab === t.key ? 'var(--color-accent)' : 'var(--color-muted)' }}>{t.count}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── TAB CONTENT ── */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '28px 24px 80px' }}>
        {tab === 'journal' && <JournalTab chantier={chantier} evenements={evenements} paiements={paiements} onRefresh={loadAll} />}
        {tab === 'paiements' && <PaiementsTab chantier={chantier} paiements={paiements} onRefresh={loadAll} />}
        {tab === 'photos' && <PhotosTab chantier={chantier} photos={photos} onRefresh={loadAll} />}
        {tab === 'documents' && <DocumentsTab chantier={chantier} documents={documents} onRefresh={loadAll} />}
      </div>
    </main>
  )
}
