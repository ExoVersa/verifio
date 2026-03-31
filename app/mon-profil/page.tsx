'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Trash2, KeyRound, CheckCircle2 } from 'lucide-react'
import SiteHeader from '@/components/SiteHeader'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function MonProfilPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [resetSent, setResetSent] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/auth?redirect=/mon-profil'); return }
      setUser(user)
      setLoading(false)
    })
  }, [router])

  async function handlePasswordReset() {
    if (!user?.email) return
    await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth?mode=reset`,
    })
    setResetSent(true)
  }

  async function handleDeleteAccount() {
    if (!confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) return
    setDeleting(true)
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
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
        <SiteHeader />
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
          <div className="spin" style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-accent)' }} />
        </div>
      </main>
    )
  }

  if (!user) return null

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)', fontFamily: 'var(--font-body)' }}>
      <SiteHeader />
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px 80px' }}>

        <h1 className="font-display" style={{ margin: '0 0 28px', fontSize: '24px', fontWeight: 700 }}>
          Mon profil
        </h1>

        {/* Info compte */}
        <div style={{
          background: 'var(--color-surface)',
          border: '0.5px solid var(--color-border)',
          borderRadius: 'var(--border-radius-lg, 16px)',
          padding: '24px',
          marginBottom: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'var(--color-accent)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', fontWeight: 700, flexShrink: 0,
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
                <CheckCircle2 size={15} strokeWidth={1.5} />
                Email envoyé — vérifiez votre boîte mail.
              </div>
            ) : (
              <button
                onClick={handlePasswordReset}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px 16px', borderRadius: '10px',
                  background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                  color: 'var(--color-text)', fontSize: '13px', fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left',
                }}
              >
                <KeyRound size={15} strokeWidth={1.5} color="var(--color-muted)" />
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
              <LogOut size={15} strokeWidth={1.5} color="var(--color-muted)" />
              Se déconnecter
            </button>
          </div>
        </div>

        {/* Zone dangereuse */}
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 'var(--border-radius-lg, 16px)',
          padding: '24px',
        }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 700, color: '#991b1b' }}>
            Zone dangereuse
          </h3>
          <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#7f1d1d', lineHeight: 1.5 }}>
            La suppression de votre compte est irréversible. Toutes vos données
            (chantiers, surveillances, historique) seront définitivement effacées.
          </p>
          <button
            onClick={handleDeleteAccount}
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
            <Trash2 size={14} strokeWidth={1.5} />
            {deleting ? 'Suppression…' : 'Supprimer mon compte'}
          </button>
        </div>

      </div>
    </main>
  )
}
