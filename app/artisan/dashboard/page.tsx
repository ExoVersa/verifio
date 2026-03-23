'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import SiteHeader from '@/components/SiteHeader'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://verifio.vercel.app'

interface ArtisanProfil {
  id: string
  siret: string
  nom_entreprise: string
  nom_dirigeant: string
  email: string
  telephone: string
  statut: 'en_attente' | 'verifie' | 'refuse'
  motif_refus: string | null
  badge_actif: boolean
  abonnement_actif: boolean
  essai_debut: string | null
  essai_fin: string | null
  description: string | null
  created_at: string
}

export default function ArtisanDashboardPage() {
  const router = useRouter()
  const [profil, setProfil] = useState<ArtisanProfil | null>(null)
  const [loading, setLoading] = useState(true)
  const [authToken, setAuthToken] = useState<string | null>(null)

  // Formulaire profil
  const [description, setDescription] = useState('')
  const [telephone, setTelephone] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)

  // Badge copié
  const [badgeCopied, setBadgeCopied] = useState(false)

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
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (error || !artisanData) {
        router.push('/espace-artisan')
        return
      }

      setProfil(artisanData as ArtisanProfil)
      setDescription(artisanData.description || '')
      setTelephone(artisanData.telephone || '')
      setLoading(false)
    })
  }, [router])

  function joursEssaiRestants(): number {
    if (!profil?.essai_fin) return 0
    const fin = new Date(profil.essai_fin).getTime()
    const now = Date.now()
    return Math.max(0, Math.ceil((fin - now) / (1000 * 60 * 60 * 24)))
  }

  function copyBadgeHtml() {
    const html = `<a href="${BASE_URL}/artisan/${profil?.siret}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:8px;background:#1B4332;color:#D8F3DC;padding:8px 16px;border-radius:8px;text-decoration:none;font-family:sans-serif;font-size:13px;font-weight:700;">✓ Artisan Vérifié Verifio</a>`
    navigator.clipboard.writeText(html).then(() => {
      setBadgeCopied(true)
      setTimeout(() => setBadgeCopied(false), 2500)
    })
  }

  async function saveProfile() {
    if (!authToken) return
    setProfileSaving(true)
    try {
      const res = await fetch('/api/artisan/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ description, telephone }),
      })
      if (res.ok) {
        setProfileSuccess(true)
        setTimeout(() => setProfileSuccess(false), 2500)
        if (profil) setProfil({ ...profil, description, telephone })
      }
    } finally {
      setProfileSaving(false)
    }
  }

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
        <SiteHeader />
        <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--color-muted)' }}>
          Chargement de votre espace…
        </div>
      </main>
    )
  }

  if (!profil) return null

  // ── EN ATTENTE ──
  if (profil.statut === 'en_attente') {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
        <SiteHeader />
        <div style={{ maxWidth: '520px', margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: '#fef3c7', border: '2px solid #fcd34d',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', margin: '0 auto 24px',
          }}>
            ⏳
          </div>
          <h1 className="font-display" style={{
            margin: '0 0 12px', fontSize: '24px', fontWeight: 900,
            color: 'var(--color-text)', letterSpacing: '-0.02em',
          }}>
            Demande en cours de vérification
          </h1>
          <p style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-muted)', lineHeight: 1.65 }}>
            Notre équipe examine votre dossier <strong>{profil.nom_entreprise}</strong>.
          </p>
          <p style={{ margin: '0 0 28px', fontSize: '14px', color: 'var(--color-muted)', lineHeight: 1.65 }}>
            Vous recevrez un email de confirmation à <strong>{profil.email}</strong> dans les <strong>24h ouvrées</strong>.
          </p>
          <Link
            href="/"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              color: '#1B4332', fontWeight: 700, fontSize: '14px', textDecoration: 'none',
            }}
          >
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </main>
    )
  }

  // ── REFUSÉ ──
  if (profil.statut === 'refuse') {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
        <SiteHeader />
        <div style={{ maxWidth: '520px', margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: '#fef2f2', border: '2px solid #fecaca',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', margin: '0 auto 24px',
          }}>
            ✕
          </div>
          <h1 className="font-display" style={{
            margin: '0 0 12px', fontSize: '24px', fontWeight: 900,
            color: 'var(--color-text)', letterSpacing: '-0.02em',
          }}>
            Demande non validée
          </h1>
          <p style={{ margin: '0 0 16px', fontSize: '15px', color: 'var(--color-muted)', lineHeight: 1.65 }}>
            Nous n&apos;avons pas pu valider votre dossier pour le motif suivant :
          </p>
          {profil.motif_refus && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: '12px', padding: '16px 20px', marginBottom: '24px',
              textAlign: 'left',
            }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#dc2626', lineHeight: 1.65 }}>
                {profil.motif_refus}
              </p>
            </div>
          )}
          <p style={{ margin: '0 0 24px', fontSize: '14px', color: 'var(--color-muted)' }}>
            Vous pouvez nous contacter pour en savoir plus ou soumettre un nouveau dossier.
          </p>
          <a
            href="mailto:contact@verifio.fr"
            style={{
              display: 'inline-flex', padding: '12px 24px', borderRadius: '12px',
              background: '#1B4332', color: '#fff',
              fontSize: '14px', fontWeight: 700, textDecoration: 'none',
            }}
          >
            Contacter l&apos;équipe Verifio →
          </a>
        </div>
      </main>
    )
  }

  // ── DASHBOARD COMPLET (statut = 'verifie') ──
  const jours = joursEssaiRestants()

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <SiteHeader />

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '12px', marginBottom: '36px',
        }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--color-muted)' }}>
              Espace Artisan
            </p>
            <h1 className="font-display" style={{
              margin: 0, fontSize: '26px', fontWeight: 900,
              color: 'var(--color-text)', letterSpacing: '-0.02em',
            }}>
              {profil.nom_entreprise}
            </h1>
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', borderRadius: '100px',
            background: '#dcfce7', color: '#14532d',
            fontSize: '12px', fontWeight: 700,
          }}>
            ✓ {jours > 0 ? `${jours} jours d'essai restants` : 'Abonnement actif'}
          </div>
        </div>

        {/* Statistiques */}
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>📊 Statistiques</h2>
          <div style={{
            background: 'var(--color-bg)', border: '1px solid var(--color-border)',
            borderRadius: '12px', padding: '20px',
            display: 'flex', alignItems: 'center', gap: '14px',
          }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'rgba(27,67,50,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', flexShrink: 0,
            }}>
              ⏳
            </div>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-muted)', lineHeight: 1.55 }}>
              Statistiques disponibles bientôt — nous comptons vos recherches. Vous serez notifié dès que cette fonctionnalité est prête.
            </p>
          </div>
        </section>

        {/* Badge */}
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>🛡️ Votre badge de confiance</h2>

          {/* Aperçu du badge */}
          <div style={{ marginBottom: '16px' }}>
            <p style={{ margin: '0 0 10px', fontSize: '13px', color: 'var(--color-muted)' }}>Aperçu :</p>
            <a
              href={`${BASE_URL}/artisan/${profil.siret}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: '#1B4332', color: '#D8F3DC',
                padding: '10px 18px', borderRadius: '10px',
                textDecoration: 'none', fontSize: '14px', fontWeight: 700,
              }}
            >
              ✓ Artisan Vérifié Verifio
            </a>
          </div>

          <button
            onClick={copyBadgeHtml}
            style={{
              padding: '11px 20px', borderRadius: '10px',
              background: badgeCopied ? '#16a34a' : '#1B4332', color: '#fff',
              border: 'none', fontSize: '14px', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'var(--font-body)',
              transition: 'background 0.2s',
            }}
          >
            {badgeCopied ? '✓ Code copié !' : '📋 Copier le code HTML'}
          </button>

          <p style={{ margin: '10px 0 0', fontSize: '12px', color: 'var(--color-muted)', lineHeight: 1.5 }}>
            Collez ce code HTML sur votre site web, dans vos emails ou vos devis pour afficher votre badge de confiance avec un lien vers votre fiche Verifio.
          </p>
        </section>

        {/* Devis */}
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>📄 Mes devis</h2>
          <div style={{
            background: 'var(--color-bg)', border: '2px dashed var(--color-border)',
            borderRadius: '16px', padding: '32px',
            textAlign: 'center',
          }}>
            <p style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 700, color: 'var(--color-text)' }}>
              Aucun devis pour l&apos;instant
            </p>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--color-muted)' }}>
              Créez votre premier devis professionnel avec toutes les mentions légales.
            </p>
            <Link
              href="/artisan/dashboard/devis/nouveau"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: '#1B4332', color: '#fff',
                padding: '11px 20px', borderRadius: '10px',
                fontSize: '14px', fontWeight: 700, textDecoration: 'none',
              }}
            >
              Créer mon premier devis →
            </Link>
          </div>
        </section>

        {/* Profil */}
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>👤 Mon profil</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              padding: '14px 16px', background: 'var(--color-bg)',
              border: '1px solid var(--color-border)', borderRadius: '10px',
              fontSize: '13px', color: 'var(--color-muted)',
            }}>
              <strong style={{ color: 'var(--color-text)' }}>SIRET : </strong>{profil.siret}
            </div>

            <div>
              <label style={labelStyle}>Téléphone</label>
              <input
                type="tel"
                value={telephone}
                onChange={e => setTelephone(e.target.value)}
                style={inputStyle}
                placeholder="06 12 34 56 78"
              />
            </div>

            <div>
              <label style={labelStyle}>Description de votre activité</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                style={{ ...inputStyle, resize: 'vertical' } as React.CSSProperties}
                placeholder="Décrivez votre savoir-faire, vos spécialités, vos certifications…"
              />
            </div>

            <button
              onClick={saveProfile}
              disabled={profileSaving}
              style={{
                padding: '12px 20px', borderRadius: '10px',
                background: profileSuccess ? '#16a34a' : '#1B4332', color: '#fff',
                border: 'none', fontSize: '14px', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'var(--font-body)',
                opacity: profileSaving ? 0.7 : 1,
                transition: 'background 0.2s',
                alignSelf: 'flex-start',
              }}
            >
              {profileSuccess ? '✓ Enregistré !' : profileSaving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}

const sectionStyle: React.CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '20px',
  padding: '24px',
  marginBottom: '20px',
}

const sectionTitleStyle: React.CSSProperties = {
  margin: '0 0 16px',
  fontSize: '16px',
  fontWeight: 700,
  color: 'var(--color-text)',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '13px', fontWeight: 700,
  color: 'var(--color-text)', marginBottom: '6px',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px',
  background: 'var(--color-bg)',
  border: '1.5px solid var(--color-border)',
  borderRadius: '10px', fontSize: '14px',
  color: 'var(--color-text)', fontFamily: 'var(--font-body)',
  outline: 'none', boxSizing: 'border-box',
}
