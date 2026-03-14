'use client'

import { useState, useEffect } from 'react'
import { Search, ShieldCheck, AlertTriangle, Info, History, LogOut, LogIn } from 'lucide-react'
import Link from 'next/link'
import SearchBar from '@/components/SearchBar'
import ResultCard from '@/components/ResultCard'
import type { SearchResult } from '@/types'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export default function Home() {
  const [result, setResult] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const saveSearch = async (data: SearchResult) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('searches').insert({
      user_id: user.id,
      siret: data.siret,
      nom: data.nom,
      score: data.score,
      statut: data.statut,
    })
  }

  const handleSearch = async (query: string) => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error || 'Aucun résultat trouvé.')
      } else {
        setResult(data)
        saveSearch(data)
      }
    } catch {
      setError('Erreur réseau. Vérifiez votre connexion.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Header */}
      <header style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={22} color="var(--color-accent)" strokeWidth={2} />
          <span className="font-display" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-accent)' }}>
            ArtisanCheck
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user ? (
            <>
              <Link href="/historique" style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '13px', color: 'var(--color-muted)', textDecoration: 'none', fontWeight: 500,
              }}>
                <History size={15} />
                Historique
              </Link>
              <button onClick={handleLogout} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '13px', color: 'var(--color-muted)', fontFamily: 'var(--font-body)', fontWeight: 500,
              }}>
                <LogOut size={15} />
                Déconnexion
              </button>
            </>
          ) : (
            <Link href="/auth" style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '13px', color: 'var(--color-muted)', textDecoration: 'none', fontWeight: 500,
            }}>
              <LogIn size={15} />
              Connexion
            </Link>
          )}
        </div>
      </header>

      {/* Hero */}
      <section style={{
        maxWidth: '680px',
        margin: '0 auto',
        padding: result ? '40px 24px 24px' : '80px 24px 40px',
        transition: 'padding 0.4s ease',
      }}>
        {!result && !loading && (
          <div className="fade-up" style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h1 className="font-display" style={{
              fontSize: 'clamp(32px, 6vw, 52px)',
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: '16px',
              letterSpacing: '-0.02em',
            }}>
              Vérifiez votre artisan<br />
              <span style={{ color: 'var(--color-accent)' }}>avant de signer.</span>
            </h1>
            <p style={{
              fontSize: '17px',
              color: 'var(--color-muted)',
              lineHeight: 1.6,
              maxWidth: '480px',
              margin: '0 auto',
            }}>
              26 000 signalements d'arnaques en 2024. En 30 secondes, vérifiez le statut légal, les certifications RGE et la décennale de n'importe quel artisan.
            </p>
          </div>
        )}

        {/* Search bar */}
        <div className={result || loading ? '' : 'fade-up fade-up-delay-1'}>
          <SearchBar onSearch={handleSearch} loading={loading} />
        </div>

        {/* Hints */}
        {!result && !loading && !error && (
          <div className="fade-up fade-up-delay-2" style={{
            display: 'flex',
            gap: '8px',
            marginTop: '14px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}>
            {['Plomberie Martin SARL', '82312345600018', 'Élec Dupont'].map((ex) => (
              <button
                key={ex}
                onClick={() => handleSearch(ex)}
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '20px',
                  padding: '6px 14px',
                  fontSize: '13px',
                  color: 'var(--color-muted)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {ex}
              </button>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="fade-up" style={{
            marginTop: '20px',
            padding: '16px',
            background: 'var(--color-danger-bg)',
            borderRadius: '12px',
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
          }}>
            <AlertTriangle size={18} color="var(--color-danger)" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-danger)' }}>{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid var(--color-border)',
              borderTopColor: 'var(--color-accent)',
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{ color: 'var(--color-muted)', fontSize: '14px' }}>Vérification en cours…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="fade-up" style={{ marginTop: '28px' }}>
            <ResultCard result={result} />
          </div>
        )}
      </section>

      {/* Footer trust indicators */}
      {!result && !loading && (
        <section style={{
          maxWidth: '680px',
          margin: '0 auto',
          padding: '0 24px 60px',
        }}>
          <div className="fade-up fade-up-delay-3" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '12px',
            marginTop: '48px',
          }}>
            {[
              { icon: <ShieldCheck size={20} />, label: 'Données officielles', sub: 'INSEE, ADEME, INPI' },
              { icon: <Info size={20} />, label: 'Open data', sub: 'Sources gouvernementales' },
              { icon: <AlertTriangle size={20} />, label: '34% victimes', sub: 'Des foyers chaque année' },
            ].map(({ icon, label, sub }) => (
              <div key={label} style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}>
                <div style={{ color: 'var(--color-accent)' }}>{icon}</div>
                <p style={{ margin: 0, fontWeight: 500, fontSize: '14px' }}>{label}</p>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)' }}>{sub}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
