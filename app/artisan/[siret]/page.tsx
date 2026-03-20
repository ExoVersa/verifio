'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Search } from 'lucide-react'
import SiteHeader from '@/components/SiteHeader'
import ResultCard from '@/components/ResultCard'
import ShareButton from '@/components/ShareButton'
import type { SearchResult } from '@/types'

export default function ArtisanFichePage() {
  const params = useParams()
  const router = useRouter()
  const siret = typeof params.siret === 'string' ? params.siret : ''

  const [result, setResult] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!siret) return
    setLoading(true)
    setError(null)
    fetch(`/api/search?q=${encodeURIComponent(siret)}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setResult(data)
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
          <ResultCard result={result} />
        )}
      </div>
    </main>
  )
}
