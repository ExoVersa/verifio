'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, HardHat, ChevronRight, AlertCircle, Clock } from 'lucide-react'
import SiteHeader from '@/components/SiteHeader'
import { supabase } from '@/lib/supabase'
import {
  type Chantier, type ChantierPaiement,
  STATUT_LABELS, STATUT_COLORS, totalPaye, dateProgress, daysUntil, formatEur,
} from '@/types/chantier'

interface ChantierWithStats extends Chantier {
  montant_paye: number
  derniere_activite?: string
}

export default function MesChantiersPage() {
  const router = useRouter()
  const [chantiers, setChantiers] = useState<ChantierWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'tous' | 'en_cours' | 'termine' | 'litige' | 'en_attente'>('tous')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/auth'); return }
      loadChantiers()
    })
  }, [])

  async function loadChantiers() {
    setLoading(true)
    const { data, error } = await supabase
      .from('chantiers')
      .select(`*, chantier_paiements(montant), chantier_evenements(date_evenement)`)
      .order('created_at', { ascending: false })

    if (!error && data) {
      const withStats: ChantierWithStats[] = data.map((c: any) => {
        const paiements: { montant: number }[] = c.chantier_paiements || []
        const events: { date_evenement: string }[] = c.chantier_evenements || []
        const paye = paiements.reduce((s: number, p: any) => s + (p.montant || 0), 0)
        const sorted = [...events].sort((a, b) =>
          new Date(b.date_evenement).getTime() - new Date(a.date_evenement).getTime()
        )
        return {
          ...c,
          montant_paye: paye,
          derniere_activite: sorted[0]?.date_evenement,
        }
      })
      setChantiers(withStats)
    }
    setLoading(false)
  }

  const filtered = filter === 'tous' ? chantiers : chantiers.filter(c => c.statut === filter)
  const enCours = chantiers.filter(c => c.statut === 'en_cours').length

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <SiteHeader />

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
          <div>
            <h1 className="font-display" style={{ margin: '0 0 6px', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Mes chantiers
            </h1>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-muted)' }}>
              {chantiers.length === 0 ? 'Aucun chantier' : `${chantiers.length} chantier${chantiers.length > 1 ? 's' : ''}${enCours > 0 ? ` · ${enCours} en cours` : ''}`}
            </p>
          </div>
          <button
            onClick={() => router.push('/nouveau-chantier')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0 }}
          >
            <Plus size={16} />
            Nouveau chantier
          </button>
        </div>

        {/* Filters */}
        {chantiers.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {(['tous', 'en_cours', 'termine', 'litige', 'en_attente'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.15s', ...(filter === f ? { background: 'var(--color-accent)', color: '#fff', borderColor: 'var(--color-accent)' } : { background: 'var(--color-surface)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }) }}
              >
                {f === 'tous' ? 'Tous' : STATUT_LABELS[f]}
                {f !== 'tous' && ` (${chantiers.filter(c => c.statut === f).length})`}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-accent)' }} className="spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && chantiers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 24px', background: 'var(--color-surface)', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--color-neutral-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <HardHat size={28} color="var(--color-muted)" />
            </div>
            <h2 className="font-display" style={{ margin: '0 0 10px', fontSize: '20px', fontWeight: 700 }}>
              Aucun chantier suivi
            </h2>
            <p style={{ margin: '0 0 24px', fontSize: '14px', color: 'var(--color-muted)', lineHeight: 1.6 }}>
              Créez votre premier carnet de chantier pour suivre<br />
              vos travaux, paiements et documents.
            </p>
            <button
              onClick={() => router.push('/nouveau-chantier')}
              style={{ padding: '12px 24px', background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
            >
              Créer mon premier chantier
            </button>
          </div>
        )}

        {/* Chantier cards */}
        {!loading && filtered.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(c => {
              const sc = STATUT_COLORS[c.statut]
              const prog = dateProgress(c.date_debut, c.date_fin_prevue)
              const jours = daysUntil(c.date_fin_prevue)
              const payePct = c.montant_total && c.montant_total > 0 ? Math.min(100, Math.round(c.montant_paye / c.montant_total * 100)) : 0
              const retard = jours !== null && jours < 0 && c.statut === 'en_cours'

              return (
                <div
                  key={c.id}
                  className="card-hover"
                  onClick={() => router.push(`/chantier/${c.id}`)}
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', padding: '20px 24px', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <h3 className="font-display" style={{ margin: 0, fontSize: '16px', fontWeight: 700, letterSpacing: '-0.01em' }}>
                          {c.nom_artisan}
                        </h3>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, flexShrink: 0 }}>
                          {STATUT_LABELS[c.statut]}
                        </span>
                        {retard && (
                          <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                            <AlertCircle size={10} />
                            Retard {Math.abs(jours!)}j
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)' }}>
                        {c.type_travaux}{c.adresse_chantier ? ` · ${c.adresse_chantier}` : ''}
                      </p>
                    </div>
                    <ChevronRight size={18} color="var(--color-muted)" style={{ flexShrink: 0 }} />
                  </div>

                  {/* Date progress bar */}
                  {c.date_debut && c.date_fin_prevue && (
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                          Début : {new Date(c.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
                        <span style={{ fontSize: '11px', color: retard ? '#dc2626' : 'var(--color-muted)', fontWeight: retard ? 600 : 400 }}>
                          Fin prévue : {new Date(c.date_fin_prevue).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div style={{ height: '5px', borderRadius: '3px', background: 'var(--color-border)' }}>
                        <div style={{ height: '100%', borderRadius: '3px', width: `${prog}%`, background: retard ? '#dc2626' : 'var(--color-accent)', transition: 'width 0.5s' }} />
                      </div>
                    </div>
                  )}

                  {/* Amounts + last activity */}
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {c.montant_total && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ height: '6px', width: '60px', borderRadius: '3px', background: 'var(--color-border)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: '3px', width: `${payePct}%`, background: 'var(--color-safe)' }} />
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                          {formatEur(c.montant_paye)} / {formatEur(c.montant_total)} payé
                        </span>
                      </div>
                    )}
                    {c.derniere_activite && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                        <Clock size={11} color="var(--color-muted)" />
                        <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                          {new Date(c.derniere_activite).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* No results after filter */}
        {!loading && chantiers.length > 0 && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-muted)', fontSize: '14px' }}>
            Aucun chantier avec ce statut.
          </div>
        )}
      </div>
    </main>
  )
}
