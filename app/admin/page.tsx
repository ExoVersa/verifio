'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import SiteHeader from '@/components/SiteHeader'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'couratincharlie@gmail.com'

interface Artisan {
  id: string
  siret: string
  nom_entreprise: string
  nom_dirigeant: string
  email: string
  telephone: string
  statut: 'en_attente' | 'verifie' | 'refuse'
  justificatif_url: string | null
  abonnement_actif: boolean
  badge_actif: boolean
  essai_fin: string | null
  created_at: string
  motif_refus: string | null
}

interface RefusModal {
  artisanId: string
  nomEntreprise: string
}

export default function AdminPage() {
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [authEmail, setAuthEmail] = useState<string | null>(null)
  const [loadingAuth, setLoadingAuth] = useState(true)

  const [attente, setAttente] = useState<Artisan[]>([])
  const [valides, setValides] = useState<Artisan[]>([])
  const [loadingData, setLoadingData] = useState(false)

  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [refusModal, setRefusModal] = useState<RefusModal | null>(null)
  const [motifRefus, setMotifRefus] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session
      if (session) {
        setAuthToken(session.access_token)
        setAuthEmail(session.user?.email || null)
      }
      setLoadingAuth(false)
    })
  }, [])

  useEffect(() => {
    if (!authToken || authEmail !== ADMIN_EMAIL) return
    loadData()
  }, [authToken, authEmail])

  async function loadData() {
    setLoadingData(true)
    try {
      const headers = { Authorization: `Bearer ${authToken}` }
      const [resAttente, resValides] = await Promise.all([
        fetch('/api/artisan/list?statut=en_attente', { headers }),
        fetch('/api/artisan/list?statut=verifie', { headers }),
      ])
      const dataAttente = await resAttente.json()
      const dataValides = await resValides.json()
      setAttente(dataAttente.artisans || [])
      setValides(dataValides.artisans || [])
    } catch {
      console.error('Erreur chargement données')
    } finally {
      setLoadingData(false)
    }
  }

  async function valider(artisanId: string) {
    setActionLoading(artisanId)
    try {
      const res = await fetch('/api/artisan/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ artisanId }),
      })
      if (res.ok) {
        await loadData()
      } else {
        const d = await res.json()
        alert(d.error || 'Erreur lors de la validation.')
      }
    } finally {
      setActionLoading(null)
    }
  }

  async function refuser() {
    if (!refusModal) return
    setActionLoading(refusModal.artisanId)
    try {
      const res = await fetch('/api/artisan/refuse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ artisanId: refusModal.artisanId, motif: motifRefus }),
      })
      if (res.ok) {
        setRefusModal(null)
        setMotifRefus('')
        await loadData()
      } else {
        const d = await res.json()
        alert(d.error || 'Erreur lors du refus.')
      }
    } finally {
      setActionLoading(null)
    }
  }

  if (loadingAuth) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
        <SiteHeader />
        <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--color-muted)' }}>
          Chargement…
        </div>
      </main>
    )
  }

  if (!authToken || authEmail !== ADMIN_EMAIL) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
        <SiteHeader />
        <div style={{
          maxWidth: '420px', margin: '80px auto', padding: '40px 24px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔒</div>
          <h1 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 800, color: 'var(--color-text)' }}>
            Accès refusé
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-muted)' }}>
            Cette page est réservée aux administrateurs Rien qui cloche. Connectez-vous avec le compte admin.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <SiteHeader />

      {/* Modal refus */}
      {refusModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px',
        }}>
          <div style={{
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: '20px', padding: '28px', maxWidth: '480px', width: '100%',
          }}>
            <h2 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800, color: 'var(--color-text)' }}>
              Refuser la demande
            </h2>
            <p style={{ margin: '0 0 16px', fontSize: '14px', color: 'var(--color-muted)' }}>
              {refusModal.nomEntreprise}
            </p>
            <textarea
              placeholder="Motif du refus (ex : justificatif illisible, activité non éligible…)"
              value={motifRefus}
              onChange={e => setMotifRefus(e.target.value)}
              rows={4}
              style={{
                width: '100%', padding: '12px', boxSizing: 'border-box',
                border: '1.5px solid var(--color-border)', borderRadius: '10px',
                fontSize: '14px', fontFamily: 'var(--font-body)',
                background: 'var(--color-bg)', color: 'var(--color-text)',
                resize: 'vertical', outline: 'none',
                marginBottom: '16px',
              }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => { setRefusModal(null); setMotifRefus('') }}
                style={{
                  flex: 1, padding: '11px', borderRadius: '10px',
                  background: 'transparent', border: '1.5px solid var(--color-border)',
                  color: 'var(--color-muted)', fontSize: '14px', fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'var(--font-body)',
                }}
              >
                Annuler
              </button>
              <button
                onClick={refuser}
                disabled={actionLoading === refusModal.artisanId}
                style={{
                  flex: 1, padding: '11px', borderRadius: '10px',
                  background: '#dc2626', border: 'none',
                  color: '#fff', fontSize: '14px', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'var(--font-body)',
                  opacity: actionLoading === refusModal.artisanId ? 0.7 : 1,
                }}
              >
                {actionLoading === refusModal.artisanId ? 'Envoi…' : 'Confirmer le refus'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 className="font-display" style={{
            margin: '0 0 4px', fontSize: '28px', fontWeight: 900,
            color: 'var(--color-text)', letterSpacing: '-0.02em',
          }}>
            Administration Rien qui cloche
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-muted)' }}>
            Connecté en tant que {authEmail}
          </p>
        </div>

        {loadingData && (
          <p style={{ color: 'var(--color-muted)', fontSize: '14px' }}>Chargement des données…</p>
        )}

        {/* ── EN ATTENTE ── */}
        <section style={{ marginBottom: '48px' }}>
          <h2 style={{
            margin: '0 0 20px', fontSize: '18px', fontWeight: 800, color: 'var(--color-text)',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            En attente de validation
            <span style={{
              background: '#fef3c7', color: '#92400e',
              fontSize: '12px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px',
            }}>
              {attente.length}
            </span>
          </h2>

          {attente.length === 0 && !loadingData && (
            <p style={{ fontSize: '14px', color: 'var(--color-muted)' }}>Aucune demande en attente.</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {attente.map(artisan => (
              <div
                key={artisan.id}
                style={{
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                  borderRadius: '16px', padding: '20px',
                }}
              >
                <div style={{
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                  flexWrap: 'wrap', gap: '12px', marginBottom: '12px',
                }}>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>
                      {artisan.nom_entreprise}
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)', fontFamily: 'monospace' }}>
                      SIRET : {artisan.siret}
                    </p>
                  </div>
                  <span style={{
                    fontSize: '11px', fontWeight: 700, padding: '4px 10px',
                    borderRadius: '100px', background: '#fef3c7', color: '#92400e',
                  }}>
                    En attente
                  </span>
                </div>

                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '8px', marginBottom: '16px',
                }}>
                  {[
                    { label: 'Dirigeant', value: artisan.nom_dirigeant },
                    { label: 'Email', value: artisan.email },
                    { label: 'Téléphone', value: artisan.telephone },
                    { label: 'Date', value: new Date(artisan.created_at).toLocaleDateString('fr-FR') },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p style={{ margin: '0 0 2px', fontSize: '11px', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>{value}</p>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {artisan.justificatif_url && (
                    <a
                      href={artisan.justificatif_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '8px 14px', borderRadius: '8px',
                        border: '1.5px solid var(--color-border)', background: 'transparent',
                        color: 'var(--color-text)', fontSize: '13px', fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      📎 Voir justificatif
                    </a>
                  )}
                  <button
                    onClick={() => valider(artisan.id)}
                    disabled={actionLoading === artisan.id}
                    style={{
                      padding: '8px 16px', borderRadius: '8px', border: 'none',
                      background: '#16a34a', color: '#fff',
                      fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                      fontFamily: 'var(--font-body)',
                      opacity: actionLoading === artisan.id ? 0.7 : 1,
                    }}
                  >
                    {actionLoading === artisan.id ? '…' : '✓ Valider'}
                  </button>
                  <button
                    onClick={() => setRefusModal({ artisanId: artisan.id, nomEntreprise: artisan.nom_entreprise })}
                    style={{
                      padding: '8px 16px', borderRadius: '8px', border: 'none',
                      background: '#dc2626', color: '#fff',
                      fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    ✕ Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── VALIDÉS ── */}
        <section>
          <h2 style={{
            margin: '0 0 20px', fontSize: '18px', fontWeight: 800, color: 'var(--color-text)',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            Artisans validés
            <span style={{
              background: '#dcfce7', color: '#14532d',
              fontSize: '12px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px',
            }}>
              {valides.length}
            </span>
          </h2>

          {valides.length === 0 && !loadingData && (
            <p style={{ fontSize: '14px', color: 'var(--color-muted)' }}>Aucun artisan validé pour l&apos;instant.</p>
          )}

          {valides.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
                    {['Nom', 'SIRET', 'Abonnement', 'Fin essai', 'Badge'].map(col => (
                      <th key={col} style={{
                        padding: '10px 14px', textAlign: 'left',
                        fontWeight: 700, color: 'var(--color-muted)',
                        fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em',
                      }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {valides.map((artisan, i) => (
                    <tr
                      key={artisan.id}
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)',
                      }}
                    >
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--color-text)' }}>
                        {artisan.nom_entreprise}
                      </td>
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: 'var(--color-muted)' }}>
                        {artisan.siret}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontSize: '11px', fontWeight: 700, padding: '3px 8px',
                          borderRadius: '100px',
                          background: artisan.abonnement_actif ? '#dcfce7' : '#f3f4f6',
                          color: artisan.abonnement_actif ? '#14532d' : '#6B7280',
                        }}>
                          {artisan.abonnement_actif ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--color-muted)' }}>
                        {artisan.essai_fin
                          ? new Date(artisan.essai_fin).toLocaleDateString('fr-FR')
                          : '—'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontSize: '11px', fontWeight: 700, padding: '3px 8px',
                          borderRadius: '100px',
                          background: artisan.badge_actif ? '#dcfce7' : '#f3f4f6',
                          color: artisan.badge_actif ? '#14532d' : '#6B7280',
                        }}>
                          {artisan.badge_actif ? '✓ Actif' : 'Inactif'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
