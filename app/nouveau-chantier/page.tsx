'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, HardHat, CheckCircle2 } from 'lucide-react'
import SiteHeader from '@/components/SiteHeader'
import { supabase } from '@/lib/supabase'
import { TYPE_TRAVAUX, type PhaseNom, type PhaseStatut } from '@/types/chantier'

function NouveauChantierForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fromRapport = params.get('from') === 'rapport'
  const sessionId = params.get('session_id') ?? ''

  const [form, setForm] = useState({
    nom_artisan: params.get('nom') || '',
    siret: params.get('siret') || '',
    type_travaux: params.get('type') || '',
    adresse_chantier: params.get('adresse') || '',
    date_debut: '',
    date_fin_prevue: '',
    montant_total: '',
    description: '',
    statut: 'en_cours',
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/auth')
    })
  }, [])

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom_artisan.trim() || !form.type_travaux) {
      setError('Le nom de l\'artisan et le type de travaux sont obligatoires.')
      return
    }
    setSaving(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }

    const payload: any = {
      user_id: user.id,
      nom_artisan: form.nom_artisan.trim(),
      type_travaux: form.type_travaux,
      statut: 'en_cours',
    }
    if (form.siret.trim()) payload.siret = form.siret.trim()
    if (form.adresse_chantier.trim()) payload.adresse_chantier = form.adresse_chantier.trim()
    if (form.date_debut) payload.date_debut = form.date_debut
    if (form.date_fin_prevue) payload.date_fin_prevue = form.date_fin_prevue
    if (form.montant_total) payload.montant_total = parseFloat(form.montant_total)
    if (form.description.trim()) payload.description = form.description.trim()

    const { data, error } = await supabase.from('chantiers').insert(payload).select().single()
    if (error || !data) {
      setError('Erreur lors de la création. Réessayez.')
      setSaving(false)
      return
    }

    // Auto-créer les 4 phases du chantier
    const phaseNoms: PhaseNom[] = ['preparation', 'travaux', 'finitions', 'reception']
    await supabase.from('chantier_phases').insert(
      phaseNoms.map(nom => ({
        chantier_id: data.id,
        nom,
        statut: 'en_attente' as PhaseStatut,
      }))
    )

    // Auto-alert J+1 : décennale reminder (stored as event)
    await supabase.from('chantier_evenements').insert({
      chantier_id: data.id,
      titre: 'Chantier créé — vérifiez l\'attestation décennale',
      description: 'Pensez à demander l\'attestation d\'assurance décennale à votre artisan avant le début des travaux. Elle est obligatoire.',
      type: 'alerte',
      date_evenement: new Date().toISOString(),
    })

    router.push(`/chantier/${data.id}`)
  }

  const siretParam = params.get('siret') || ''
  const nomParam = params.get('nom') || ''

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', border: '1.5px solid var(--color-border)',
    borderRadius: '10px', fontSize: '14px', fontFamily: 'var(--font-body)',
    background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none',
    boxSizing: 'border-box',
  }
  const prefilledStyle: React.CSSProperties = {
    ...inputStyle,
    border: '1.5px solid var(--color-safe)',
    background: 'rgba(45,185,110,0.04)',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '13px', fontWeight: 600,
    color: 'var(--color-text)', marginBottom: '6px',
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <SiteHeader />

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Back */}
        <button
          onClick={() => router.back()}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', fontSize: '13px', fontWeight: 500, padding: 0, marginBottom: '24px', fontFamily: 'var(--font-body)' }}
        >
          <ArrowLeft size={15} />
          Retour
        </button>

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <HardHat size={22} color="#fff" />
          </div>
          <div>
            <h1 className="font-display" style={{ margin: 0, fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Nouveau chantier
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)' }}>Suivez vos travaux, paiements et documents</p>
          </div>
        </div>

        {fromRapport && nomParam && (
          <div style={{
            background: 'rgba(45,185,110,0.08)',
            border: '1px solid var(--color-safe)',
            borderRadius: 10,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 24,
          }}>
            <CheckCircle2 size={16} color="var(--color-safe)" strokeWidth={1.5} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 14 }}>
              Chantier pré-rempli depuis votre rapport Verifio —{' '}
              <strong>{nomParam}</strong> a été vérifié et validé.
              {sessionId && (
                <>
                  {' '}
                  <a
                    href={`/rapport/succes?session_id=${sessionId}&siret=${siretParam}&from=rapport`}
                    style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600 }}
                  >
                    Retour au rapport →
                  </a>
                </>
              )}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Nom artisan */}
            <div>
              <label style={labelStyle}>
                Nom de l'artisan <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                style={nomParam ? prefilledStyle : inputStyle}
                type="text"
                placeholder="Ex : Bonsens Plomberie SARL"
                value={form.nom_artisan}
                onChange={e => set('nom_artisan', e.target.value)}
                required
              />
            </div>

            {/* SIRET */}
            <div>
              <label style={labelStyle}>
                SIRET
                {!siretParam && <span style={{ color: 'var(--color-muted)', fontWeight: 400 }}> (optionnel — permet d'accéder à la fiche Verifio)</span>}
                {siretParam && <span style={{ color: 'var(--color-safe)', fontWeight: 400 }}> · Artisan vérifié</span>}
              </label>
              <input
                style={siretParam ? prefilledStyle : inputStyle}
                type="text"
                placeholder="14 chiffres"
                value={form.siret}
                onChange={e => set('siret', e.target.value)}
                maxLength={14}
                pattern="[0-9]*"
                readOnly={!!siretParam}
              />
              {form.siret.length >= 9 && !siretParam && (
                <a
                  href={`/?q=${form.siret}`}
                  target="_blank"
                  style={{ display: 'inline-block', marginTop: '6px', fontSize: '12px', color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 500 }}
                >
                  → Voir la fiche Verifio ↗
                </a>
              )}
            </div>

            {/* Type de travaux */}
            <div>
              <label style={labelStyle}>
                Type de travaux <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <select
                style={{ ...inputStyle, appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}
                value={form.type_travaux}
                onChange={e => set('type_travaux', e.target.value)}
                required
              >
                <option value="">Sélectionner…</option>
                {TYPE_TRAVAUX.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Adresse */}
            <div>
              <label style={labelStyle}>
                Adresse du chantier
                {params.get('adresse') && <span style={{ color: 'var(--color-muted)', fontWeight: 400 }}> · Pré-remplie avec le siège de l'artisan, modifiable</span>}
              </label>
              <input
                style={params.get('adresse') ? prefilledStyle : inputStyle}
                type="text"
                placeholder="Ex : 12 rue de la Paix, 75001 Paris"
                value={form.adresse_chantier}
                onChange={e => set('adresse_chantier', e.target.value)}
              />
            </div>

            {/* Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Date de début</label>
                <input style={inputStyle} type="date" value={form.date_debut} onChange={e => set('date_debut', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Date de fin prévue</label>
                <input style={inputStyle} type="date" value={form.date_fin_prevue} onChange={e => set('date_fin_prevue', e.target.value)} />
              </div>
            </div>

            {/* Montant */}
            <div>
              <label style={labelStyle}>Montant total du devis (€)</label>
              <input
                style={inputStyle}
                type="number"
                placeholder="Ex : 12500"
                min="0"
                step="0.01"
                value={form.montant_total}
                onChange={e => set('montant_total', e.target.value)}
              />
            </div>

            {/* Description */}
            <div>
              <label style={labelStyle}>Description libre</label>
              <textarea
                style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                placeholder="Détails des travaux, observations particulières…"
                value={form.description}
                onChange={e => set('description', e.target.value)}
              />
            </div>

            {error && (
              <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', fontSize: '13px', color: 'var(--color-danger)', fontWeight: 500 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              style={{ padding: '14px 24px', background: saving ? 'var(--color-muted)' : 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {saving ? (
                <><div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff' }} className="spin" />Création en cours…</>
              ) : (
                <>Créer le chantier →</>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}

export default function NouveauChantierPage() {
  return (
    <Suspense>
      <NouveauChantierForm />
    </Suspense>
  )
}
