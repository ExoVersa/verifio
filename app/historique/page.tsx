'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck, ArrowLeft, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Search } from '@/lib/supabase'

export default function HistoriquePage() {
  const router = useRouter()
  const [searches, setSearches] = useState<Search[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }
      const { data } = await supabase
        .from('searches')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      setSearches(data ?? [])
      setLoading(false)
    }
    init()
  }, [router])

  const scoreColor = (score: number) => {
    if (score >= 70) return 'var(--color-safe)'
    if (score >= 40) return '#f59e0b'
    return 'var(--color-danger)'
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Header */}
      <header style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <ShieldCheck size={22} color="var(--color-accent)" strokeWidth={2} />
        <span className="font-display" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-accent)' }}>
          Rien qui cloche
        </span>
      </header>

      <section style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 24px' }}>
        <Link href="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          fontSize: '13px', color: 'var(--color-muted)', textDecoration: 'none',
          marginBottom: '24px',
        }}>
          <ArrowLeft size={14} />
          Retour
        </Link>

        <h1 className="font-display" style={{ margin: '0 0 24px', fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em' }}>
          Mes recherches
        </h1>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-muted)', fontSize: '14px' }}>
            Chargement…
          </div>
        )}

        {!loading && searches.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '60px 24px',
            background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px',
          }}>
            <Clock size={32} color="var(--color-muted)" style={{ marginBottom: '12px' }} />
            <p style={{ margin: 0, color: 'var(--color-muted)', fontSize: '15px' }}>
              Aucune recherche pour l'instant.
            </p>
            <Link href="/" style={{
              display: 'inline-block', marginTop: '16px',
              padding: '10px 20px', borderRadius: '10px',
              background: 'var(--color-text)', color: 'var(--color-bg)',
              fontSize: '14px', fontWeight: 600, textDecoration: 'none',
            }}>
              Faire une recherche
            </Link>
          </div>
        )}

        {!loading && searches.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {searches.map((s) => (
              <div key={s.id} style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}>
                {/* Score */}
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  border: `2px solid ${scoreColor(s.score)}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: scoreColor(s.score) }}>
                    {s.score}
                  </span>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.nom}
                    </p>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      fontSize: '11px', fontWeight: 500,
                      color: s.statut === 'actif' ? 'var(--color-safe)' : 'var(--color-danger)',
                      background: s.statut === 'actif' ? 'var(--color-safe-bg)' : 'var(--color-danger-bg)',
                      padding: '2px 8px', borderRadius: '20px', flexShrink: 0,
                    }}>
                      {s.statut === 'actif' ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                      {s.statut}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)' }}>
                    SIRET {s.siret} · {formatDate(s.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
