'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Search, ShieldCheck } from 'lucide-react'
import SiteHeader from '@/components/SiteHeader'
import ResultCard from '@/components/ResultCard'
import ShareButton from '@/components/ShareButton'
import type { SearchResult } from '@/types'

interface ArtisanPublicInfo {
  verifie: boolean
  badgeActif: boolean
  nomEntreprise: string | null
  description: string | null
}

export default function ArtisanFichePage() {
  const params = useParams()
  const router = useRouter()
  const siret = typeof params.siret === 'string' ? params.siret : ''

  const [result, setResult] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [artisanPublic, setArtisanPublic] = useState<ArtisanPublicInfo | null>(null)

  async function startSerenite() {
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'serenite', siret, nom: result?.nom }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      alert('Erreur Stripe. Réessayez.')
    } finally {
      setCheckoutLoading(false)
    }
  }

  useEffect(() => {
    if (!siret) return
    setLoading(true)
    setError(null)
    // Charger simultanément la fiche officielle et le statut Verifio
    Promise.all([
      fetch(`/api/search?q=${encodeURIComponent(siret)}`).then(r => r.json()),
      fetch(`/api/artisan/public?siret=${encodeURIComponent(siret)}`).then(r => r.json()),
    ])
      .then(([searchData, publicData]) => {
        if (searchData.error) setError(searchData.error)
        else setResult(searchData)
        if (!publicData.error) setArtisanPublic(publicData as ArtisanPublicInfo)
      })
      .catch(() => setError('Erreur réseau. Vérifiez votre connexion.'))
      .finally(() => setLoading(false))
  }, [siret])

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <SiteHeader />

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '28px 24px 80px' }}>

        {/* Back + Share */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <button
            onClick={() => router.back()}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-muted)', fontSize: '13px', fontWeight: 500,
              padding: 0, fontFamily: 'var(--font-body)',
            }}
          >
            <ArrowLeft size={15} />
            Retour
          </button>
          {result && (
            <ShareButton
              url={typeof window !== 'undefined' ? window.location.href : `https://verifio-eight.vercel.app/artisan/${siret}`}
              nom={result.nom}
              score={result.score}
              statut={result.statut}
            />
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '60px 0', textAlign: 'center' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px',
              background: 'var(--color-accent-light)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              border: '2px solid rgba(27,67,50,0.15)',
            }}>
              <Search size={22} color="var(--color-accent)" style={{ animation: 'spin 1.5s linear infinite' }} />
            </div>
            <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--color-text)' }}>
              Chargement de la fiche…
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{
            padding: '20px 24px', background: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger-border)',
            borderRadius: '14px', color: 'var(--color-danger)',
            fontSize: '14px',
          }}>
            {error}
          </div>
        )}

        {/* Result */}
        {!loading && result && (
          <>
            <ResultCard result={result} />

            {/* Badge Verifio ou CTA inscription artisan */}
            {artisanPublic && artisanPublic.verifie && artisanPublic.badgeActif ? (
              <div style={{
                marginTop: '16px',
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '14px 18px',
                background: '#f0fdf4', border: '1px solid #86efac',
                borderRadius: '14px',
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: '#1B4332',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, fontSize: '16px',
                }}>
                  ✓
                </div>
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 700, color: '#14532d' }}>
                    Artisan vérifié Verifio
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#166534' }}>
                    L&apos;identité et l&apos;existence légale de cet artisan ont été vérifiées par notre équipe.
                  </p>
                </div>
              </div>
            ) : (
              !artisanPublic?.verifie && (
                <div style={{
                  marginTop: '16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  flexWrap: 'wrap', gap: '10px',
                  padding: '12px 16px',
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                }}>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)' }}>
                    Vous êtes {result.nom}&nbsp;?
                  </p>
                  <a
                    href="/espace-artisan"
                    style={{
                      fontSize: '13px', fontWeight: 700, color: '#1B4332',
                      textDecoration: 'none', whiteSpace: 'nowrap',
                    }}
                  >
                    Revendiquez votre fiche →
                  </a>
                </div>
              )
            )}

            {/* Pack Sérénité CTA */}
            <div style={{ marginTop: '24px', background: '#1B4332', borderRadius: '20px', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ShieldCheck size={22} color="#D8F3DC" />
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800, color: '#fff' }}>
                    🛡️ Vous avez un devis de cet artisan&nbsp;?
                  </p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#74C69D', lineHeight: 1.55 }}>
                    Analysez-le et obtenez un rapport complet + surveillance 6 mois &mdash; <strong style={{ color: '#D8F3DC' }}>19,90&nbsp;€</strong> achat unique.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  onClick={startSerenite}
                  disabled={checkoutLoading}
                  style={{ flex: 1, minWidth: '200px', padding: '13px 20px', borderRadius: '12px', border: 'none', background: '#52B788', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', opacity: checkoutLoading ? 0.7 : 1 }}
                >
                  {checkoutLoading ? 'Redirection…' : 'Activer le Pack Sérénité →'}
                </button>
                <a href="/pricing" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '13px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
                  Voir les offres
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
