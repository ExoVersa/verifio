'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import SiteHeader from '@/components/SiteHeader'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

const UNITES = ['m²', 'ml', 'forfait', 'heure', 'unité']
const TVA_OPTIONS = [0, 5.5, 10, 20]

interface LigneDevis {
  id: string
  description: string
  quantite: number
  unite: string
  prix_unitaire_ht: number
  total_ht: number
}

interface ClientInfo {
  nom: string
  email: string
  telephone: string
  adresse: string
}

interface ArtisanInfo {
  siret: string
  nom_entreprise: string
  adresse: string | null
  telephone: string
}

export default function NouveauDevisPage() {
  const router = useRouter()
  useEffect(() => { router.push('/') }, [])
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [artisan, setArtisan] = useState<ArtisanInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const [client, setClient] = useState<ClientInfo>({ nom: '', email: '', telephone: '', adresse: '' })
  const [lignes, setLignes] = useState<LigneDevis[]>([
    { id: '1', description: '', quantite: 1, unite: 'forfait', prix_unitaire_ht: 0, total_ht: 0 },
  ])
  const [tvaTaux, setTvaTaux] = useState<number>(20)
  const [acompte, setAcompte] = useState<number>(0)

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [pdfMessage, setPdfMessage] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const session = data.session
      if (!session) {
        router.push('/espace-artisan')
        return
      }
      setAuthToken(session.access_token)

      const { data: artisanData, error } = await supabase
        .from('artisans')
        .select('siret, nom_entreprise, adresse, telephone, statut')
        .eq('user_id', session.user.id)
        .single()

      if (error || !artisanData || artisanData.statut !== 'verifie') {
        router.push('/artisan/dashboard')
        return
      }
      setArtisan(artisanData as ArtisanInfo)
      setLoading(false)
    })
  }, [router])

  const totalHt = lignes.reduce((sum, l) => sum + l.total_ht, 0)
  const montantTva = totalHt * (tvaTaux / 100)
  const totalTtc = totalHt + montantTva

  const updateLigne = useCallback((id: string, field: keyof LigneDevis, value: string | number) => {
    setLignes(prev => prev.map(l => {
      if (l.id !== id) return l
      const updated = { ...l, [field]: value }
      // Recalculer le total HT
      updated.total_ht = updated.quantite * updated.prix_unitaire_ht
      return updated
    }))
  }, [])

  function addLigne() {
    const newId = String(Date.now())
    setLignes(prev => [
      ...prev,
      { id: newId, description: '', quantite: 1, unite: 'forfait', prix_unitaire_ht: 0, total_ht: 0 },
    ])
  }

  function removeLigne(id: string) {
    if (lignes.length === 1) return
    setLignes(prev => prev.filter(l => l.id !== id))
  }

  async function sauvegarder(statut: 'brouillon' | 'envoye') {
    if (!authToken || !client.nom) {
      setSaveError('Le nom du client est requis.')
      return
    }
    setSaveError(null)
    setSaving(true)
    try {
      const res = await fetch('/api/artisan/devis/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          clientNom: client.nom,
          clientEmail: client.email || undefined,
          clientTelephone: client.telephone || undefined,
          clientAdresse: client.adresse || undefined,
          lignes: lignes.map(({ id: _id, ...l }) => l),
          totalHt: totalHt,
          tvaTaux,
          totalTtc,
          acompte,
          statut,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSaveError(data.error || 'Erreur lors de la sauvegarde.')
      } else {
        router.push('/artisan/dashboard')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
        <SiteHeader />
        <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--color-muted)' }}>
          Chargement…
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <SiteHeader />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* Navigation */}
        <div style={{ marginBottom: '24px' }}>
          <Link href="/artisan/dashboard" style={{
            fontSize: '13px', color: 'var(--color-muted)', textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: '4px',
          }}>
            ← Mon tableau de bord
          </Link>
        </div>

        <h1 className="font-display" style={{
          margin: '0 0 28px', fontSize: '26px', fontWeight: 900,
          color: 'var(--color-text)', letterSpacing: '-0.02em',
        }}>
          Nouveau devis
        </h1>

        {saveError && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: '10px', padding: '12px 16px', marginBottom: '20px',
            fontSize: '13px', color: '#dc2626',
          }}>
            {saveError}
          </div>
        )}

        {/* Layout 2 colonnes */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)',
          gap: '24px',
          alignItems: 'start',
        }}>

          {/* ── COLONNE GAUCHE — FORMULAIRE ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Mentions légales artisan */}
            {artisan && (
              <div style={cardStyle}>
                <h2 style={cardTitleStyle}>Émetteur</h2>
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
                  fontSize: '13px', color: 'var(--color-text)',
                }}>
                  <div><span style={{ color: 'var(--color-muted)' }}>Entreprise : </span><strong>{artisan.nom_entreprise}</strong></div>
                  <div><span style={{ color: 'var(--color-muted)' }}>SIRET : </span><strong>{artisan.siret}</strong></div>
                  {artisan.adresse && <div style={{ gridColumn: '1/-1' }}><span style={{ color: 'var(--color-muted)' }}>Adresse : </span>{artisan.adresse}</div>}
                  <div><span style={{ color: 'var(--color-muted)' }}>Tél : </span>{artisan.telephone}</div>
                </div>
              </div>
            )}

            {/* Section Client */}
            <div style={cardStyle}>
              <h2 style={cardTitleStyle}>Informations client</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={labelStyle}>Nom complet <span style={{ color: '#dc2626' }}>*</span></label>
                  <input type="text" value={client.nom} onChange={e => setClient(c => ({ ...c, nom: e.target.value }))} style={inputStyle} placeholder="Jean Dupont" />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input type="email" value={client.email} onChange={e => setClient(c => ({ ...c, email: e.target.value }))} style={inputStyle} placeholder="jean@exemple.fr" />
                </div>
                <div>
                  <label style={labelStyle}>Téléphone</label>
                  <input type="tel" value={client.telephone} onChange={e => setClient(c => ({ ...c, telephone: e.target.value }))} style={inputStyle} placeholder="06 12 34 56 78" />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={labelStyle}>Adresse du chantier</label>
                  <input type="text" value={client.adresse} onChange={e => setClient(c => ({ ...c, adresse: e.target.value }))} style={inputStyle} placeholder="12 rue des Roses, 37000 Tours" />
                </div>
              </div>
            </div>

            {/* Section Travaux */}
            <div style={cardStyle}>
              <h2 style={cardTitleStyle}>Travaux</h2>

              {/* En-tête tableau */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '3fr 80px 90px 100px 90px 36px',
                gap: '8px',
                padding: '0 0 8px',
                borderBottom: '1px solid var(--color-border)',
                marginBottom: '8px',
              }}>
                {['Description', 'Qté', 'Unité', 'PU HT (€)', 'Total HT', ''].map(h => (
                  <p key={h} style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {h}
                  </p>
                ))}
              </div>

              {/* Lignes */}
              {lignes.map(ligne => (
                <div key={ligne.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '3fr 80px 90px 100px 90px 36px',
                  gap: '8px', marginBottom: '8px', alignItems: 'center',
                }}>
                  <input
                    type="text" value={ligne.description}
                    onChange={e => updateLigne(ligne.id, 'description', e.target.value)}
                    style={inputSmallStyle} placeholder="Pose de carrelage…"
                  />
                  <input
                    type="number" min="0" step="0.01"
                    value={ligne.quantite}
                    onChange={e => updateLigne(ligne.id, 'quantite', parseFloat(e.target.value) || 0)}
                    style={{ ...inputSmallStyle, textAlign: 'right' }}
                  />
                  <select
                    value={ligne.unite}
                    onChange={e => updateLigne(ligne.id, 'unite', e.target.value)}
                    style={{ ...inputSmallStyle, cursor: 'pointer' }}
                  >
                    {UNITES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <input
                    type="number" min="0" step="0.01"
                    value={ligne.prix_unitaire_ht}
                    onChange={e => updateLigne(ligne.id, 'prix_unitaire_ht', parseFloat(e.target.value) || 0)}
                    style={{ ...inputSmallStyle, textAlign: 'right' }}
                  />
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--color-text)', textAlign: 'right' }}>
                    {ligne.total_ht.toFixed(2)} €
                  </p>
                  <button
                    type="button" onClick={() => removeLigne(ligne.id)}
                    disabled={lignes.length === 1}
                    style={{
                      width: '28px', height: '28px', borderRadius: '6px',
                      background: 'transparent', border: '1px solid var(--color-border)',
                      cursor: lignes.length === 1 ? 'not-allowed' : 'pointer',
                      color: '#dc2626', fontSize: '14px',
                      opacity: lignes.length === 1 ? 0.3 : 1,
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}

              <button
                type="button" onClick={addLigne}
                style={{
                  marginTop: '8px', padding: '8px 14px', borderRadius: '8px',
                  background: 'transparent', border: '1.5px dashed var(--color-border)',
                  color: '#1B4332', fontSize: '13px', fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'var(--font-body)',
                }}
              >
                + Ajouter une ligne
              </button>
            </div>

            {/* Boutons */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => sauvegarder('brouillon')}
                disabled={saving}
                style={{
                  padding: '12px 20px', borderRadius: '10px',
                  background: 'transparent', border: '1.5px solid var(--color-border)',
                  color: 'var(--color-text)', fontSize: '14px', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'var(--font-body)',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'Enregistrement…' : '💾 Enregistrer en brouillon'}
              </button>
              <button
                onClick={() => { setPdfMessage(true); setTimeout(() => setPdfMessage(false), 3000) }}
                style={{
                  padding: '12px 20px', borderRadius: '10px',
                  background: pdfMessage ? '#6B7280' : '#1B4332', color: '#fff',
                  border: 'none', fontSize: '14px', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'var(--font-body)',
                  transition: 'background 0.2s',
                }}
              >
                {pdfMessage ? 'Bientôt disponible !' : '📄 Générer PDF'}
              </button>
            </div>
          </div>

          {/* ── COLONNE DROITE — RÉCAPITULATIF ── */}
          <div style={{
            ...cardStyle,
            position: 'sticky' as const,
            top: '100px',
          }}>
            <h2 style={cardTitleStyle}>Récapitulatif</h2>

            {client.nom && (
              <div style={{ marginBottom: '16px', padding: '10px 12px', background: 'var(--color-bg)', borderRadius: '8px', fontSize: '13px' }}>
                <p style={{ margin: '0 0 2px', fontWeight: 700, color: 'var(--color-text)' }}>{client.nom}</p>
                {client.adresse && <p style={{ margin: 0, color: 'var(--color-muted)' }}>{client.adresse}</p>}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              {lignes.filter(l => l.description).map(l => (
                <div key={l.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  gap: '8px', padding: '6px 0',
                  borderBottom: '1px solid var(--color-border)',
                  fontSize: '13px',
                }}>
                  <span style={{ color: 'var(--color-text)', flex: 1 }}>{l.description}</span>
                  <span style={{ color: 'var(--color-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {l.total_ht.toFixed(2)} €
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--color-muted)' }}>
                <span>Total HT</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{totalHt.toFixed(2)} €</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: 'var(--color-muted)' }}>
                <span>TVA</span>
                <select
                  value={tvaTaux}
                  onChange={e => setTvaTaux(parseFloat(e.target.value))}
                  style={{ ...inputSmallStyle, width: 'auto', padding: '4px 8px' }}
                >
                  {TVA_OPTIONS.map(t => <option key={t} value={t}>{t}%</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--color-muted)' }}>
                <span>Montant TVA</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{montantTva.toFixed(2)} €</span>
              </div>

              <div style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '10px 0', borderTop: '2px solid var(--color-border)',
                fontSize: '15px', fontWeight: 800, color: 'var(--color-text)',
              }}>
                <span>Total TTC</span>
                <span style={{ color: '#1B4332' }}>{totalTtc.toFixed(2)} €</span>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Acompte demandé (€)</label>
              <input
                type="number" min="0" step="0.01"
                value={acompte}
                onChange={e => setAcompte(parseFloat(e.target.value) || 0)}
                style={inputStyle}
                placeholder="0.00"
              />
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-muted)' }}>
                Soit {totalTtc > 0 ? ((acompte / totalTtc) * 100).toFixed(1) : 0}% du total TTC
              </p>
            </div>

            {artisan && (
              <div style={{
                marginTop: '16px', padding: '10px 12px',
                background: 'rgba(27,67,50,0.05)', borderRadius: '8px',
                fontSize: '11px', color: 'var(--color-muted)', lineHeight: 1.6,
              }}>
                <strong style={{ color: 'var(--color-text)' }}>Mentions légales</strong><br />
                {artisan.nom_entreprise} — SIRET {artisan.siret}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

const cardStyle: React.CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '16px',
  padding: '20px',
}

const cardTitleStyle: React.CSSProperties = {
  margin: '0 0 16px',
  fontSize: '15px',
  fontWeight: 700,
  color: 'var(--color-text)',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: 700,
  color: 'var(--color-text)', marginBottom: '4px',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  background: 'var(--color-bg)',
  border: '1.5px solid var(--color-border)',
  borderRadius: '8px', fontSize: '14px',
  color: 'var(--color-text)', fontFamily: 'var(--font-body)',
  outline: 'none', boxSizing: 'border-box',
}

const inputSmallStyle: React.CSSProperties = {
  width: '100%', padding: '7px 8px',
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '6px', fontSize: '13px',
  color: 'var(--color-text)', fontFamily: 'var(--font-body)',
  outline: 'none', boxSizing: 'border-box',
}
