'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  User, HardHat, Bell, Clock, Search, Plus, LogOut, Trash2,
  KeyRound, ChevronRight, CheckCircle2, XCircle, AlertCircle, ExternalLink,
  LayoutDashboard, History, Shield, FileText, ChevronLeft,
  BarChart2, Scale, AlertTriangle, CheckCircle, FileSearch,
} from 'lucide-react'
import JaugePrix from '@/components/JaugePrix'
import ScoreCercle from '@/components/ScoreCercle'
import SiteHeader from '@/components/SiteHeader'
import { SectionBadge, SurfaceCard } from '@/components/ExperiencePrimitives'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Search as SearchRecord } from '@/lib/supabase'
import {
  type Chantier,
  STATUT_LABELS, STATUT_COLORS, formatEur, dateProgress, daysUntil,
} from '@/types/chantier'

// ── Types ──────────────────────────────────────────────────────────────────

interface Surveillance {
  id: string
  user_id: string | null
  email: string | null
  siret: string
  nom_artisan: string | null
  statut_initial: string | null
  score_initial: number | null
  expires_at: string | null
  created_at: string
}

interface ChantierWithStats extends Chantier {
  montant_paye: number
  derniere_activite?: string
}

type TabId = 'dashboard' | 'chantiers' | 'surveillances' | 'historique' | 'rapports' | 'analyses'

interface AnalyseDevis {
  id: string
  created_at: string
  nom_fichier: string | null
  siret_artisan: string | null
  resultat_json: Record<string, unknown> | null
}

interface Rapport {
  id: string
  siret: string
  stripe_session_id: string
  montant: number
  statut: string
  created_at: string
  nom_entreprise?: string
}

interface ChantierWithRelations extends Chantier {
  chantier_paiements?: { montant: number | null }[]
  chantier_evenements?: { date_evenement: string }[]
}

const TABS: { id: TabId; label: string; Icon: React.ComponentType<{ size: number }> }[] = [
  { id: 'dashboard', label: 'Tableau de bord', Icon: LayoutDashboard },
  { id: 'chantiers', label: 'Mes chantiers', Icon: HardHat },
  { id: 'surveillances', label: 'Mes surveillances', Icon: Bell },
  { id: 'historique', label: 'Mon historique', Icon: History },
  { id: 'rapports', label: 'Mes rapports', Icon: FileText },
  { id: 'analyses', label: 'Mes analyses', Icon: FileSearch },
]

// ── Helpers ────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 70) return 'var(--color-safe)'
  if (score >= 40) return '#f59e0b'
  return 'var(--color-danger)'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Tab: Tableau de bord ───────────────────────────────────────────────────

function DashboardTab({
  chantiers, surveillances, searches, router,
}: {
  chantiers: ChantierWithStats[]
  surveillances: Surveillance[]
  searches: SearchRecord[]
  router: ReturnType<typeof useRouter>
}) {
  const enCours = chantiers.filter(c => c.statut === 'en_cours').length

  const stats = [
    {
      label: 'Chantiers en cours',
      value: enCours,
      icon: <HardHat size={20} />,
      color: 'var(--color-accent)',
      bg: 'var(--color-accent-light)',
      href: '/mes-chantiers',
    },
    {
      label: 'Artisans surveillés',
      value: surveillances.length,
      icon: <Bell size={20} />,
      color: '#d97706',
      bg: '#fef3c7',
      href: undefined,
    },
    {
      label: 'Recherches effectuées',
      value: searches.length,
      icon: <Search size={20} />,
      color: '#6366f1',
      bg: '#ede9fe',
      href: '/recherche',
    },
  ]

  // Last 3 searches
  const lastSearches = searches.slice(0, 3)

  // Last chantier events (approximate via derniere_activite)
  const recentChantiers = [...chantiers]
    .filter(c => c.derniere_activite)
    .sort((a, b) =>
      new Date(b.derniere_activite!).getTime() - new Date(a.derniere_activite!).getTime()
    )
    .slice(0, 3)

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '36px' }}>
        {stats.map(({ label, value, icon, color, bg, href }) => (
          <SurfaceCard
            key={label}
            onClick={href ? () => router.push(href) : undefined}
            style={{
              padding: '22px 24px',
              display: 'flex', alignItems: 'center', gap: '16px',
              cursor: href ? 'pointer' : 'default',
              transition: 'box-shadow 0.15s, transform 0.15s',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.84) 0%, rgba(248,243,236,0.94) 100%)',
            }}
            className={href ? 'card-hover' : ''}
          >
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color, flexShrink: 0,
            }}>
              {icon}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: 'var(--color-text)', fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}>
                {value}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--color-muted)' }}>
                {label}
              </p>
            </div>
          </SurfaceCard>
        ))}
      </div>

      {/* Deux colonnes : dernière activité + raccourcis */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px', alignItems: 'start' }}>

        {/* Dernière activité */}
        <SurfaceCard style={{ padding: '24px' }}>
          <h2 className="font-display" style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 700 }}>
            Dernière activité
          </h2>

          {lastSearches.length === 0 && recentChantiers.length === 0 ? (
            <p style={{ fontSize: '14px', color: 'var(--color-muted)', margin: 0 }}>
              Aucune activité récente. Commencez par rechercher un artisan.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {lastSearches.map(s => (
                <Link
                  key={s.id}
                  href={`/artisan/${s.siret}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--color-border)',
                    textDecoration: 'none', color: 'var(--color-text)',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    border: `2px solid ${scoreColor(s.score)}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: scoreColor(s.score) }}>{s.score}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.nom}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-muted)' }}>
                      Recherche · {formatDate(s.created_at)}
                    </p>
                  </div>
                  <ExternalLink size={14} color="var(--color-muted)" />
                </Link>
              ))}
              {recentChantiers.map(c => (
                <div
                  key={c.id}
                  onClick={() => router.push(`/chantier/${c.id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--color-border)',
                    cursor: 'pointer', transition: 'background 0.12s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: STATUT_COLORS[c.statut].bg, border: `1px solid ${STATUT_COLORS[c.statut].border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <HardHat size={16} color={STATUT_COLORS[c.statut].color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.nom_artisan}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-muted)' }}>
                      Chantier · {formatDate(c.derniere_activite!)}
                    </p>
                  </div>
                  <ChevronRight size={14} color="var(--color-muted)" />
                </div>
              ))}
            </div>
          )}
        </SurfaceCard>

        {/* Raccourcis */}
        <SurfaceCard style={{ padding: '24px', background: 'linear-gradient(180deg, rgba(255,255,255,0.82) 0%, rgba(244,238,230,0.92) 100%)' }}>
          <h2 className="font-display" style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700 }}>
            Raccourcis
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: 'Nouvelle recherche', href: '/', Icon: Search, accent: false },
              { label: 'Nouveau chantier', href: '/nouveau-chantier', Icon: Plus, accent: true },
              { label: 'Mes alertes', href: '/mon-espace?tab=surveillances', Icon: Bell, accent: false },
            ].map(({ label, href, Icon, accent }) => (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '11px 14px', borderRadius: '10px',
                  background: accent ? 'var(--color-accent)' : 'var(--color-bg)',
                  border: `1px solid ${accent ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  color: accent ? '#fff' : 'var(--color-text)',
                  textDecoration: 'none', fontSize: '13px', fontWeight: 600,
                  transition: 'opacity 0.12s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </div>
        </SurfaceCard>
      </div>
    </div>
  )
}

// ── Tab: Mes chantiers ─────────────────────────────────────────────────────

function ChantiersTab({ chantiers, router }: { chantiers: ChantierWithStats[]; router: ReturnType<typeof useRouter> }) {
  const [filter, setFilter] = useState<'tous' | 'en_cours' | 'termine' | 'litige' | 'en_attente'>('tous')
  const filtered = filter === 'tous' ? chantiers : chantiers.filter(c => c.statut === filter)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 className="font-display" style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>
          {chantiers.length === 0
            ? 'Aucun chantier'
            : `${chantiers.length} chantier${chantiers.length > 1 ? 's' : ''}`}
        </h2>
        <button
          onClick={() => router.push('/nouveau-chantier')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '9px 16px', background: 'var(--color-accent)', color: '#fff',
            border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--font-body)',
          }}
        >
          <Plus size={15} />Nouveau chantier
        </button>
      </div>

      {/* Filters */}
      {chantiers.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {(['tous', 'en_cours', 'termine', 'litige', 'en_attente'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 14px', borderRadius: '20px', border: '1px solid',
                fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)',
                transition: 'all 0.15s',
                ...(filter === f
                  ? { background: 'var(--color-accent)', color: '#fff', borderColor: 'var(--color-accent)' }
                  : { background: 'var(--color-surface)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }),
              }}
            >
              {f === 'tous' ? 'Tous' : STATUT_LABELS[f]}
              {f !== 'tous' && ` (${chantiers.filter(c => c.statut === f).length})`}
            </button>
          ))}
        </div>
      )}

      {chantiers.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '64px 24px',
          background: 'var(--color-surface)', borderRadius: 'var(--radius-card)',
          border: '1px solid var(--color-border)',
        }}>
          <HardHat size={32} color="var(--color-muted)" style={{ marginBottom: '16px' }} />
          <h3 className="font-display" style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700 }}>
            Aucun chantier suivi
          </h3>
          <p style={{ margin: '0 0 24px', fontSize: '14px', color: 'var(--color-muted)' }}>
            Créez votre premier carnet de chantier pour suivre vos travaux.
          </p>
          <button
            onClick={() => router.push('/nouveau-chantier')}
            style={{
              padding: '11px 22px', background: 'var(--color-accent)', color: '#fff',
              border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}
          >
            Créer mon premier chantier
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(c => {
            const sc = STATUT_COLORS[c.statut]
            const prog = dateProgress(c.date_debut, c.date_fin_prevue)
            const jours = daysUntil(c.date_fin_prevue)
            const payePct = c.montant_total && c.montant_total > 0
              ? Math.min(100, Math.round(c.montant_paye / c.montant_total * 100))
              : 0
            const retard = jours !== null && jours < 0 && c.statut === 'en_cours'

            return (
              <div
                key={c.id}
                className="card-hover"
                onClick={() => router.push(`/chantier/${c.id}`)}
                style={{
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-card)', padding: '20px 24px', cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <h3 className="font-display" style={{ margin: 0, fontSize: '16px', fontWeight: 700, letterSpacing: '-0.01em' }}>
                        {c.nom_artisan}
                      </h3>
                      <span style={{
                        fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px',
                        background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, flexShrink: 0,
                      }}>
                        {STATUT_LABELS[c.statut]}
                      </span>
                      {retard && (
                        <span style={{
                          fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px',
                          background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                          display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0,
                        }}>
                          <AlertCircle size={10} />Retard {Math.abs(jours!)}j
                        </span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)' }}>
                      {c.type_travaux}{c.adresse_chantier ? ` · ${c.adresse_chantier}` : ''}
                    </p>
                  </div>
                  <ChevronRight size={18} color="var(--color-muted)" style={{ flexShrink: 0 }} />
                </div>

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
    </div>
  )
}

// ── Tab: Mes surveillances ─────────────────────────────────────────────────

function SurveillancesTab({
  surveillances,
  onStop,
}: {
  surveillances: Surveillance[]
  onStop: (id: string) => void
}) {
  const [stopping, setStopping] = useState<string | null>(null)

  const handleStop = async (id: string) => {
    setStopping(id)
    await onStop(id)
    setStopping(null)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 className="font-display" style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>
          {surveillances.length === 0
            ? 'Aucune surveillance'
            : `${surveillances.length} artisan${surveillances.length > 1 ? 's' : ''} surveillé${surveillances.length > 1 ? 's' : ''}`}
        </h2>
      </div>

      {surveillances.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '64px 24px',
          background: 'var(--color-surface)', borderRadius: 'var(--radius-card)',
          border: '1px solid var(--color-border)',
        }}>
          <Bell size={32} color="var(--color-muted)" style={{ marginBottom: '16px' }} />
          <h3 className="font-display" style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700 }}>
            Aucune surveillance active
          </h3>
          <p style={{ margin: '0 0 24px', fontSize: '14px', color: 'var(--color-muted)', lineHeight: 1.6 }}>
            Surveillez un artisan depuis sa fiche pour être alerté<br />
            dès qu&apos;un changement de statut est détecté.
          </p>
          <Link
            href="/"
            style={{
              display: 'inline-block', padding: '11px 22px',
              background: 'var(--color-accent)', color: '#fff',
              borderRadius: '10px', textDecoration: 'none',
              fontSize: '14px', fontWeight: 600,
            }}
          >
            Rechercher un artisan
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {surveillances.map(s => (
            <div
              key={s.id}
              style={{
                background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-card)', padding: '20px 24px',
                display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
              }}
            >
              {/* Status dot */}
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                background: s.statut_initial === 'actif' ? 'var(--color-safe-bg)' : '#fef2f2',
                border: `1px solid ${s.statut_initial === 'actif' ? 'var(--color-safe-border)' : '#fecaca'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {s.statut_initial === 'actif'
                  ? <CheckCircle2 size={20} color="var(--color-safe)" />
                  : <XCircle size={20} color="var(--color-danger)" />
                }
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                  <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.nom_artisan || `SIRET ${s.siret}`}
                  </p>
                  {/* Badge Active / Expirée */}
                  {s.expires_at ? (
                    new Date(s.expires_at) > new Date() ? (
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', flexShrink: 0, background: 'var(--color-safe-bg)', color: 'var(--color-safe)', border: '1px solid var(--color-safe-border)' }}>
                        Active
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', flexShrink: 0, background: 'var(--color-neutral-bg)', color: 'var(--color-muted)', border: '1px solid var(--color-border)' }}>
                        Expirée
                      </span>
                    )
                  ) : (
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', flexShrink: 0, background: 'var(--color-safe-bg)', color: 'var(--color-safe)', border: '1px solid var(--color-safe-border)' }}>
                      Active
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)' }}>
                  SIRET {s.siret}
                  {s.expires_at && (
                    <> · Jusqu&apos;au {new Date(s.expires_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</>
                  )}
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <Link
                  href={`/artisan/${s.siret}`}
                  style={{
                    padding: '8px 14px', borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg)',
                    color: 'var(--color-text)', textDecoration: 'none',
                    fontSize: '12px', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}
                >
                  <ExternalLink size={13} />Voir la fiche
                </Link>
                <button
                  onClick={() => handleStop(s.id)}
                  disabled={stopping === s.id}
                  style={{
                    padding: '8px 14px', borderRadius: '8px',
                    border: '1px solid #fecaca',
                    background: '#fef2f2',
                    color: '#dc2626', fontSize: '12px', fontWeight: 600,
                    cursor: stopping === s.id ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-body)',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    opacity: stopping === s.id ? 0.6 : 1,
                  }}
                >
                  <Bell size={13} />
                  {stopping === s.id ? 'Arrêt…' : 'Arrêter'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Tab: Mon historique ────────────────────────────────────────────────────

function HistoriqueTab({ searches }: { searches: SearchRecord[] }) {
  return (
    <div>
      <h2 className="font-display" style={{ margin: '0 0 24px', fontSize: '20px', fontWeight: 700 }}>
        {searches.length === 0 ? 'Aucune recherche' : `${searches.length} dernière${searches.length > 1 ? 's' : ''} recherche${searches.length > 1 ? 's' : ''}`}
      </h2>

      {searches.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '64px 24px',
          background: 'var(--color-surface)', borderRadius: 'var(--radius-card)',
          border: '1px solid var(--color-border)',
        }}>
          <Clock size={32} color="var(--color-muted)" style={{ marginBottom: '16px' }} />
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-muted)' }}>
            Aucune recherche pour l&apos;instant.
          </p>
          <Link
            href="/"
            style={{
              display: 'inline-block', marginTop: '20px',
              padding: '11px 22px', borderRadius: '10px',
              background: 'var(--color-accent)', color: '#fff',
              textDecoration: 'none', fontSize: '14px', fontWeight: 600,
            }}
          >
            Faire une recherche
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {searches.map(s => (
            <Link
              key={s.id}
              href={`/artisan/${s.siret}`}
              style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                borderRadius: '14px', padding: '14px 20px',
                textDecoration: 'none', color: 'var(--color-text)',
                transition: 'background 0.12s, box-shadow 0.12s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-surface)')}
            >
              {/* Score ring */}
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%',
                border: `2px solid ${scoreColor(s.score)}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: scoreColor(s.score) }}>{s.score}</span>
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.nom}
                  </p>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    fontSize: '11px', fontWeight: 600, flexShrink: 0,
                    color: s.statut === 'actif' ? 'var(--color-safe)' : 'var(--color-danger)',
                    background: s.statut === 'actif' ? 'var(--color-safe-bg)' : 'var(--color-danger-bg)',
                    padding: '2px 8px', borderRadius: '20px',
                  }}>
                    {s.statut === 'actif' ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                    {s.statut}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)' }}>
                  SIRET {s.siret} · {formatDateTime(s.created_at)}
                </p>
              </div>

              <ExternalLink size={15} color="var(--color-muted)" style={{ flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Tab: Mes rapports ──────────────────────────────────────────────────────

function RapportsTab({
  rapports,
  router,
}: {
  rapports: Rapport[]
  router: ReturnType<typeof useRouter>
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [noms, setNoms] = useState<Record<string, string>>({})

  useEffect(() => {
    const missing = rapports.filter(r => !r.nom_entreprise && r.siret)
    if (missing.length === 0) return
    Promise.all(
      missing.map(r =>
        fetch(`/api/artisan/public?siret=${encodeURIComponent(r.siret)}`)
          .then(res => res.json())
          .then(data => ({ siret: r.siret, nom: data?.nomEntreprise ?? null }))
          .catch(() => ({ siret: r.siret, nom: null }))
      )
    ).then(results => {
      const map: Record<string, string> = {}
      for (const { siret, nom } of results) if (nom) map[siret] = nom
      setNoms(map)
    })
  }, [rapports])

  if (rapports.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px' }}>
        <FileText size={40} color="var(--color-border)" strokeWidth={1.5} style={{ marginBottom: '16px' }} />
        <p style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 600 }}>Aucun rapport pour l&apos;instant</p>
        <p style={{ margin: '0 0 24px', fontSize: '14px', color: 'var(--color-muted)' }}>
          Vérifiez un artisan pour sécuriser votre chantier.
        </p>
        <button
          onClick={() => router.push('/recherche')}
          style={{
            background: 'var(--color-accent)', color: 'white',
            border: 'none', borderRadius: '10px',
            padding: '12px 24px', fontSize: '14px', fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Rechercher un artisan →
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--color-muted)' }}>
        {rapports.length} rapport{rapports.length > 1 ? 's' : ''} acheté{rapports.length > 1 ? 's' : ''}
      </p>
      {rapports.map(r => (
        <div
          key={r.id}
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            transform: hoveredId === r.id ? 'translateY(-2px)' : 'none',
            boxShadow: hoveredId === r.id ? '0 4px 16px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s ease',
            cursor: 'pointer',
          }}
          onMouseEnter={() => setHoveredId(r.id)}
          onMouseLeave={() => setHoveredId(null)}
          onClick={() => router.push(`/rapport/succes?session_id=${r.stripe_session_id}&siret=${r.siret}&from=mon-espace`)}
        >
          <Shield size={20} color="var(--color-accent)" strokeWidth={1.5} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: '0 0 2px', fontSize: '16px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {r.nom_entreprise || noms[r.siret] || 'Entreprise inconnue'}
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)' }}>
              SIRET {r.siret}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--color-muted)' }}>
              {formatDate(r.created_at)} · {(r.montant / 100).toFixed(2).replace('.', ',')}€
            </p>
          </div>
          <span style={{
            fontSize: '13px', fontWeight: 600,
            color: 'var(--color-accent)',
            whiteSpace: 'nowrap',
          }}>
            Voir →
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Tab: Mon profil ────────────────────────────────────────────────────────

function ProfilTab({
  user,
  onPasswordReset,
  onDeleteAccount,
}: {
  user: SupabaseUser
  onPasswordReset: () => void
  onDeleteAccount: () => void
}) {
  const router = useRouter()
  const [resetSent, setResetSent] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleReset = async () => {
    await onPasswordReset()
    setResetSent(true)
  }

  const handleDelete = async () => {
    setDeleting(true)
    await onDeleteAccount()
    setDeleting(false)
  }

  return (
    <div style={{ maxWidth: '560px' }}>
      <h2 className="font-display" style={{ margin: '0 0 28px', fontSize: '20px', fontWeight: 700 }}>
        Mon profil
      </h2>

      {/* Info compte */}
      <div style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)', padding: '24px', marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '50%',
            background: 'var(--color-accent)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px', fontWeight: 700, flexShrink: 0,
          }}>
            {user.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--color-text)' }}>
              {user.email}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-muted)' }}>
              Membre depuis le {formatDate(user.created_at)}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {resetSent ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '12px 16px', borderRadius: '10px',
              background: 'var(--color-safe-bg)', border: '1px solid var(--color-safe-border)',
              fontSize: '13px', color: 'var(--color-safe)', fontWeight: 500,
            }}>
              <CheckCircle2 size={15} />
              Email envoyé ! Vérifiez votre boîte mail.
            </div>
          ) : (
            <button
              onClick={handleReset}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 16px', borderRadius: '10px',
                background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                color: 'var(--color-text)', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left',
              }}
            >
              <KeyRound size={15} color="var(--color-muted)" />
              Changer le mot de passe
            </button>
          )}

          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '12px 16px', borderRadius: '10px',
              background: 'var(--color-bg)', border: '1px solid var(--color-border)',
              color: 'var(--color-text)', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left',
            }}
          >
            <LogOut size={15} color="var(--color-muted)" />
            Se déconnecter
          </button>
        </div>
      </div>

      {/* Zone dangereuse */}
      <div style={{
        background: '#fef2f2', border: '1px solid #fecaca',
        borderRadius: 'var(--radius-card)', padding: '24px',
      }}>
        <h3 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 700, color: '#991b1b' }}>
          Zone dangereuse
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#7f1d1d', lineHeight: 1.5 }}>
          La suppression de votre compte est irréversible. Toutes vos données
          (chantiers, surveillances, historique) seront définitivement effacées.
        </p>
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '11px 18px', borderRadius: '10px',
            background: '#dc2626', color: '#fff',
            border: 'none', fontSize: '13px', fontWeight: 600,
            cursor: deleting ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-body)',
            opacity: deleting ? 0.7 : 1,
          }}
        >
          <Trash2 size={14} />
          {deleting ? 'Suppression…' : 'Supprimer mon compte'}
        </button>
      </div>
    </div>
  )
}

// ── Tab: Mes analyses ──────────────────────────────────────────────────────

function AnalysesTab({ analyses }: { analyses: AnalyseDevis[] }) {
  const [analyseSelectionnee, setAnalyseSelectionnee] = useState<AnalyseDevis | null>(null)

  function formatEurLocal(n: number | null | undefined) {
    if (!n) return '—'
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
  }

  if (analyseSelectionnee) {
    const r = analyseSelectionnee.resultat_json as {
      prix: {
        siret: string | null; nom_artisan: string | null; type_travaux: string; region: string | null
        montant_devis: number | null; fourchette_basse: number; fourchette_haute: number; prix_moyen: number
        verdict_prix: 'normal' | 'sous-evalue' | 'surevalue'; ecart_pourcentage: number
        facteurs: string[]; alerte: string | null
      }
      juridique: {
        score_conformite: number; mentions_presentes: string[]; mentions_manquantes: string[]
        clauses_abusives: string[]; verdict_juridique: 'conforme' | 'a_corriger' | 'non_conforme'
        recommandations: string[]
      }
      score_global: number
      siret_artisan: string | null
    } | null

    const CARD: React.CSSProperties = {
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderRadius: 16, padding: 24,
    }

    return (
      <div>
        <button
          onClick={() => setAnalyseSelectionnee(null)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', marginBottom: '1rem', padding: 0 }}
        >
          <ChevronLeft size={14} strokeWidth={1.5} />
          Retour à mes analyses
        </button>

        <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--color-muted)' }}>
          {analyseSelectionnee.nom_fichier || 'Devis sans nom'} · {new Date(analyseSelectionnee.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        {r ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>
              {/* Analyse des prix */}
              <div style={CARD}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <BarChart2 size={20} color="var(--color-accent)" strokeWidth={1.5} />
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Analyse des prix</h2>
                </div>

                {(r.prix.nom_artisan || r.siret_artisan) && (
                  <div style={{ background: 'var(--color-bg)', borderRadius: 10, padding: '10px 12px', marginBottom: 14, fontSize: 13 }}>
                    <span style={{ color: 'var(--color-muted)' }}>Artisan : </span>
                    <strong>{r.prix.nom_artisan || `SIRET ${r.siret_artisan}`}</strong>
                    {r.siret_artisan && (
                      <>
                        <span style={{ color: 'var(--color-muted)', margin: '0 6px' }}>·</span>
                        <a href={`/artisan/${r.siret_artisan}`} style={{ color: 'var(--color-accent)', fontSize: 12, fontWeight: 600 }}>Voir la fiche →</a>
                      </>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                  <span style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent)', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{r.prix.type_travaux}</span>
                  {r.prix.region && <span style={{ background: 'var(--color-bg)', color: 'var(--color-muted)', borderRadius: 20, padding: '3px 10px', fontSize: 12 }}>{r.prix.region}</span>}
                </div>

                {r.prix.montant_devis && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: 'var(--color-muted)' }}>Montant du devis</span>
                    <strong>{formatEurLocal(r.prix.montant_devis)}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: 'var(--color-muted)' }}>Fourchette normale</span>
                  <span>{formatEurLocal(r.prix.fourchette_basse)} — {formatEurLocal(r.prix.fourchette_haute)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 12 }}>
                  <span style={{ color: 'var(--color-muted)' }}>Prix moyen marché</span>
                  <strong>{formatEurLocal(r.prix.prix_moyen)}</strong>
                </div>

                <JaugePrix prix={r.prix} />

                <div style={{
                  marginTop: 16, padding: '12px 14px', borderRadius: 10,
                  background: r.prix.verdict_prix === 'normal' ? 'var(--color-safe-bg)' : r.prix.verdict_prix === 'sous-evalue' ? 'var(--color-danger-bg)' : '#fffbeb',
                  border: `1px solid ${r.prix.verdict_prix === 'normal' ? 'rgba(45,185,110,0.3)' : r.prix.verdict_prix === 'sous-evalue' ? 'rgba(220,38,38,0.2)' : '#fde68a'}`,
                }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 14, color: r.prix.verdict_prix === 'normal' ? 'var(--color-safe)' : r.prix.verdict_prix === 'sous-evalue' ? 'var(--color-danger)' : '#d97706' }}>
                    {r.prix.verdict_prix === 'normal' && 'Prix dans la norme'}
                    {r.prix.verdict_prix === 'sous-evalue' && 'Devis sous-évalué — méfiance'}
                    {r.prix.verdict_prix === 'surevalue' && 'Devis surévalué'}
                  </p>
                  {r.prix.ecart_pourcentage > 0 && (
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)' }}>Écart : {r.prix.ecart_pourcentage}% par rapport au prix moyen</p>
                  )}
                  {r.prix.alerte && (
                    <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--color-danger)', display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                      <AlertTriangle size={12} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />
                      {r.prix.alerte}
                    </p>
                  )}
                </div>

                {r.prix.facteurs?.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Facteurs de variation</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {r.prix.facteurs.map((f: string, i: number) => (
                        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12 }}>
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--color-accent)', flexShrink: 0, marginTop: 5 }} />
                          <span style={{ color: 'var(--color-text)', lineHeight: 1.5 }}>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Conformité juridique */}
              <div style={CARD}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Scale size={20} color="var(--color-accent)" strokeWidth={1.5} />
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Conformité juridique</h2>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, padding: '12px 14px', background: 'var(--color-bg)', borderRadius: 10 }}>
                  <ScoreCercle score={r.juridique.score_conformite} size={52} />
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 800, color: r.juridique.verdict_juridique === 'conforme' ? 'var(--color-safe)' : r.juridique.verdict_juridique === 'a_corriger' ? '#d97706' : 'var(--color-danger)' }}>
                      {r.juridique.verdict_juridique === 'conforme' && 'Devis conforme'}
                      {r.juridique.verdict_juridique === 'a_corriger' && 'Devis à corriger'}
                      {r.juridique.verdict_juridique === 'non_conforme' && 'Devis non conforme'}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)' }}>Score /10</p>
                  </div>
                </div>

                {r.juridique.mentions_presentes?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mentions présentes</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {r.juridique.mentions_presentes.map((m: string, i: number) => (
                        <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start', fontSize: 13 }}>
                          <CheckCircle size={13} color="var(--color-safe)" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />
                          <span>{m}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {r.juridique.mentions_manquantes?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: 'var(--color-danger)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mentions manquantes</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {r.juridique.mentions_manquantes.map((m: string, i: number) => (
                        <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start', fontSize: 13 }}>
                          <XCircle size={13} color="var(--color-danger)" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />
                          <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>{m}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {r.juridique.clauses_abusives?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Clauses abusives détectées</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {r.juridique.clauses_abusives.map((c: string, i: number) => (
                        <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start', fontSize: 13 }}>
                          <AlertTriangle size={13} color="#d97706" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />
                          <span style={{ color: '#92400e' }}>{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {r.juridique.recommandations?.length > 0 && (
                  <div style={{ marginTop: 8, padding: '10px 12px', background: 'var(--color-bg)', borderRadius: 10 }}>
                    <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recommandations</p>
                    <ol style={{ margin: 0, padding: '0 0 0 16px' }}>
                      {r.juridique.recommandations.map((rec: string, i: number) => (
                        <li key={i} style={{ fontSize: 12, color: 'var(--color-text)', marginBottom: 4, lineHeight: 1.5 }}>{rec}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            </div>

            {/* Score global */}
            <div style={{
              ...CARD, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
              background: r.score_global >= 8 ? 'var(--color-safe-bg)' : r.score_global >= 5 ? '#fffbeb' : 'var(--color-danger-bg)',
              border: `1.5px solid ${r.score_global >= 8 ? 'rgba(45,185,110,0.3)' : r.score_global >= 5 ? '#fde68a' : 'rgba(220,38,38,0.2)'}`,
            }}>
              <ScoreCercle score={r.score_global} size={64} />
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)' }}>Score global du devis</p>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: r.score_global >= 8 ? 'var(--color-safe)' : r.score_global >= 5 ? '#d97706' : 'var(--color-danger)' }}>
                  {r.score_global >= 8 && 'Devis excellent — vous pouvez signer en confiance'}
                  {r.score_global >= 5 && r.score_global < 8 && 'Devis à revoir — demandez des corrections'}
                  {r.score_global < 5 && 'Devis problématique — ne signez pas'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: 14, color: 'var(--color-muted)' }}>Résultats non disponibles pour cette analyse.</p>
        )}
      </div>
    )
  }

  if (analyses.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px', background: 'var(--color-surface)', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)' }}>
        <FileSearch size={32} color="var(--color-muted)" strokeWidth={1.5} style={{ marginBottom: '16px' }} />
        <p style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 600 }}>Aucune analyse pour l&apos;instant.</p>
        <a href="/analyser-devis" style={{ display: 'inline-block', marginTop: '16px', fontSize: 14, color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'none' }}>
          Analyser un devis →
        </a>
      </div>
    )
  }

  return (
    <div>
      <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--color-muted)' }}>
        {analyses.length} analyse{analyses.length > 1 ? 's' : ''}
      </p>
      {analyses.map(analyse => {
        const score = analyse.resultat_json?.score_global as number | undefined
        const scoreColor = score !== undefined ? (score >= 7 ? '#3B6D11' : score >= 4 ? '#BA7517' : '#A32D2D') : undefined
        return (
          <div key={analyse.id} style={{
            background: 'var(--color-surface)', border: '0.5px solid var(--color-border)',
            borderRadius: 'var(--border-radius-lg, 12px)', padding: '1rem 1.25rem',
            marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <p style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>
                {analyse.nom_fichier || 'Devis sans nom'}
              </p>
              <p style={{ margin: '0 0 2px', fontSize: 12, color: 'var(--color-muted)' }}>
                {analyse.siret_artisan ? `Artisan · ${analyse.siret_artisan}` : 'SIRET non détecté'}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)' }}>
                {new Date(analyse.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
              {score !== undefined && (
                <span style={{ fontSize: 22, fontWeight: 500, color: scoreColor }}>{Math.round(score)}</span>
              )}
              <button
                onClick={() => setAnalyseSelectionnee(analyse)}
                style={{ fontSize: 13, color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, padding: 0 }}
              >
                Revoir →
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

function MonEspaceInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const validTabs: TabId[] = ['dashboard', 'chantiers', 'surveillances', 'historique', 'rapports', 'analyses']
  const tabParam = searchParams.get('tab') as TabId | null
  const [tab, setTabState] = useState<TabId>(
    tabParam && validTabs.includes(tabParam) ? tabParam : 'dashboard'
  )

  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [chantiers, setChantiers] = useState<ChantierWithStats[]>([])
  const [surveillances, setSurveillances] = useState<Surveillance[]>([])
  const [searches, setSearches] = useState<SearchRecord[]>([])
  const [rapports, setRapports] = useState<Rapport[]>([])
  const [analyses, setAnalyses] = useState<AnalyseDevis[]>([])
  const [toast, setToast] = useState<string | null>(null)

  const setTab = (t: TabId) => {
    setTabState(t)
    router.replace(`/mon-espace?tab=${t}`, { scroll: false })
  }

  async function loadAll(u: SupabaseUser) {
    setPageLoading(true)

    const [chantiersRes, survRes, searchRes, rapportsRes, analysesRes] = await Promise.all([
      supabase
        .from('chantiers')
        .select('*, chantier_paiements(montant), chantier_evenements(date_evenement)')
        .order('created_at', { ascending: false }),
      supabase
        .from('surveillances')
        .select('*')
        .eq('user_id', u.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('searches')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('rapports')
        .select('*')
        .eq('user_id', u.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('analyses_devis')
        .select('id, created_at, nom_fichier, siret_artisan, resultat_json')
        .eq('user_id', u.id)
        .order('created_at', { ascending: false }),
    ])

    if (chantiersRes.data) {
      const withStats: ChantierWithStats[] = (chantiersRes.data as ChantierWithRelations[]).map((c) => {
        const paiements = c.chantier_paiements || []
        const events = c.chantier_evenements || []
        const paye = paiements.reduce((sum, paiement) => sum + (paiement.montant || 0), 0)
        const sorted = [...events].sort((a, b) =>
          new Date(b.date_evenement).getTime() - new Date(a.date_evenement).getTime()
        )
        return { ...c, montant_paye: paye, derniere_activite: sorted[0]?.date_evenement }
      })
      setChantiers(withStats)
    }

    console.log('RAPPORTS:', rapportsRes.data, rapportsRes.error)
    setSurveillances(survRes.data ?? [])
    setSearches(searchRes.data ?? [])
    setRapports(rapportsRes.data ?? [])
    setAnalyses(analysesRes.data ?? [])
    setPageLoading(false)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/auth'); return }
      setUser(data.user)
      loadAll(data.user)
    })
  }, [router])

  async function stopSurveillance(id: string) {
    const { error } = await supabase
      .from('surveillances')
      .delete()
      .eq('id', id)
      .eq('user_id', user?.id ?? '')
    if (error) {
      setToast('Erreur lors de la suppression. Réessayez.')
      setTimeout(() => setToast(null), 4000)
      return
    }
    setSurveillances(prev => prev.filter(s => s.id !== id))
  }

  async function handlePasswordReset() {
    if (!user?.email) return
    await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth?mode=reset`,
    })
  }

  async function handleDeleteAccount() {
    if (!confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) return
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/account/delete', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session?.access_token}` },
    })
    if (res.ok) {
      await supabase.auth.signOut()
      router.push('/')
    } else {
      alert('Erreur lors de la suppression du compte. Veuillez réessayer.')
    }
  }

  // Loading state
  if (pageLoading) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
        <SiteHeader />
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          height: 'calc(100vh - 58px)',
        }}>
          <div className="spin" style={{
            width: '36px', height: '36px', borderRadius: '50%',
            border: '3px solid var(--color-border)', borderTopColor: 'var(--color-accent)',
          }} />
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8f4ee 0%, #f5efe7 38%, #fcfaf7 100%)' }}>
      <SiteHeader />

      {/* Toast d'erreur */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
          background: '#1a1a1a', color: '#fff', padding: '12px 20px', borderRadius: '10px',
          fontSize: '14px', fontWeight: 500, zIndex: 1000,
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        }}>
          {toast}
        </div>
      )}

      <div style={{ maxWidth: '1040px', margin: '0 auto', padding: '32px 24px 88px' }}>

        {/* Page header */}
        <SurfaceCard style={{ padding: '28px 30px', marginBottom: '22px', overflow: 'hidden', position: 'relative', background: 'linear-gradient(180deg, rgba(255,255,255,0.82) 0%, rgba(244,238,230,0.94) 100%)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 10% 16%, rgba(82,183,136,0.12), transparent 22%), radial-gradient(circle at 88% 18%, rgba(255,196,153,0.18), transparent 20%)' }} />
        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(260px, 0.85fr)', gap: '18px', alignItems: 'start' }}>
          <div>
            <SectionBadge text="Espace personnel" tone="green" />
            <h1 className="font-display" style={{ margin: '14px 0 8px', fontSize: 'clamp(34px, 5vw, 46px)', fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 1.02 }}>
              Votre espace de pilotage
            </h1>
            <p style={{ margin: 0, fontSize: '15px', color: 'var(--color-muted)', lineHeight: 1.75, maxWidth: '560px' }}>
              Centralisez vos rapports, surveillances, analyses et chantiers dans une seule interface plus calme, plus claire et plus utile au quotidien.
            </p>
          </div>
          <div style={{ padding: '18px 18px 16px', borderRadius: '22px', background: 'linear-gradient(135deg, #153b2e 0%, #1f4c3d 100%)', color: '#eef8f3', border: '1px solid rgba(21,59,46,0.08)' }}>
            <p style={{ margin: '0 0 6px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.76, fontWeight: 700 }}>Compte actif</p>
            <p style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: 700, lineHeight: 1.45, overflowWrap: 'anywhere' }}>
              {user?.email}
            </p>
            <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.6, color: 'rgba(238,248,243,0.76)' }}>
              Utilisez les onglets ci-dessous pour passer rapidement d&apos;une decision a l&apos;autre, sans perdre le fil de votre chantier.
            </p>
          </div>
        </div>
        </SurfaceCard>

        {/* Tabs */}
        <SurfaceCard style={{
          display: 'flex', flexWrap: 'wrap', gap: '8px',
          marginBottom: '32px',
          padding: '12px',
          background: 'rgba(255,255,255,0.74)',
        }}>
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '10px 14px',
                background: tab === id ? 'rgba(21,59,46,0.08)' : 'transparent',
                border: `1px solid ${tab === id ? 'rgba(21,59,46,0.14)' : 'transparent'}`,
                borderRadius: '999px',
                cursor: 'pointer', fontSize: '12px',
                fontWeight: tab === id ? 700 : 500,
                color: tab === id ? 'var(--color-accent)' : 'var(--color-muted)',
                fontFamily: 'var(--font-body)',
                transition: 'color 0.15s, background 0.15s, border-color 0.15s',
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </SurfaceCard>

        {/* Tab content */}
        {tab === 'dashboard' && (
          <DashboardTab
            chantiers={chantiers}
            surveillances={surveillances}
            searches={searches}
            router={router}
          />
        )}
        {tab === 'chantiers' && (
          <ChantiersTab chantiers={chantiers} router={router} />
        )}
        {tab === 'surveillances' && (
          <SurveillancesTab surveillances={surveillances} onStop={stopSurveillance} />
        )}
        {tab === 'historique' && (
          <HistoriqueTab searches={searches} />
        )}
        {tab === 'rapports' && (
          <RapportsTab rapports={rapports} router={router} />
        )}
        {tab === 'analyses' && (
          <AnalysesTab analyses={analyses} />
        )}
      </div>
    </main>
  )
}

export default function MonEspacePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spin" style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-accent)' }} />
      </div>
    }>
      <MonEspaceInner />
    </Suspense>
  )
}
