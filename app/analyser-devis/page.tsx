'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import { supabase } from '@/lib/supabase'
import { Upload, CheckCircle, AlertCircle, AlertTriangle, ArrowLeft, FileText, Info } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────
interface AnalyseMention {
  label: string
  present: boolean
  detail: string
}
interface AnalyseAlerte {
  type: 'danger' | 'warn' | 'info'
  message: string
}
interface AnalyseResult {
  score: number
  verdict: 'conforme' | 'vigilance' | 'suspect'
  mentions_legales: AnalyseMention[]
  alertes: AnalyseAlerte[]
  recommandations: string[]
  resume: string
}

const VERDICT_CONFIG = {
  conforme: { bg: 'var(--color-safe-bg)', color: 'var(--color-safe)', label: 'Conforme' },
  vigilance: { bg: '#fffbeb', color: '#92400e', label: 'Vigilance' },
  suspect: { bg: 'var(--color-danger-bg)', color: 'var(--color-danger)', label: 'Suspect' },
}

// ── Main component (inner) ────────────────────────────────────────────────────
function AnalyserDevisInner() {
  const searchParams = useSearchParams()
  const siret = searchParams.get('siret')
  const rapportId = searchParams.get('rapport_id')
  const version = parseInt(searchParams.get('version') ?? '1', 10)
  const nomArtisan = searchParams.get('nom') ?? ''

  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalyseResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Waitlist state (when no rapport_id)
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  // Full analysis mode: accessed from rapport page
  const isRapportMode = Boolean(rapportId && siret)

  async function handleAnalyse(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Vous devez être connecté pour analyser un devis.')
        return
      }

      const formData = new FormData()
      formData.append('file', file)
      if (siret) formData.append('siret', siret)

      const res = await fetch('/api/analyser-devis', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.message || data.error || 'Erreur lors de l\'analyse.')
        return
      }

      setResult(data)

      // Save to devis_uploads if in rapport mode
      if (rapportId && siret) {
        supabase.from('devis_uploads').insert({
          user_id: session.user.id,
          rapport_id: rapportId,
          siret,
          version,
          nom_fichier: file.name,
          analyse_json: data,
        }).then(() => {})
      }
    } catch {
      setError('Erreur réseau. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  async function handleWaitlist(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    try {
      await supabase.from('waitlist').insert({ email, feature: 'devis' })
    } catch { /* ignore */ }
    setSubmitted(true)
  }

  // ── Rapport mode: full analysis UI ──────────────────────────────────────
  if (isRapportMode) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--color-bg)', fontFamily: 'var(--font-body)' }}>
        <SiteHeader />
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px 80px' }}>

          {/* Back */}
          <Link href={`/rapport/succes?siret=${siret}&session_id=${searchParams.get('session_id') ?? ''}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-muted)', textDecoration: 'none', marginBottom: '24px' }}>
            <ArrowLeft size={14} strokeWidth={1.5} /> Retour au rapport
          </Link>

          {/* Header */}
          <div style={{ marginBottom: '28px' }}>
            {nomArtisan && (
              <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 600, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {nomArtisan}
              </p>
            )}
            <h1 style={{ margin: '0 0 8px', fontSize: '26px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Analyse juridique du devis
              {version > 1 && <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-muted)', marginLeft: '10px' }}>v{version}</span>}
            </h1>
            <p style={{ margin: 0, fontSize: '15px', color: 'var(--color-muted)', lineHeight: 1.6 }}>
              Détection des clauses abusives, mentions légales manquantes et prix anormaux.
            </p>
          </div>

          {/* Upload form */}
          {!result && (
            <form onSubmit={handleAnalyse}>
              <div style={{
                border: `2px dashed ${file ? 'var(--color-accent)' : 'var(--color-border)'}`,
                borderRadius: '16px',
                padding: '40px 24px',
                textAlign: 'center',
                background: file ? 'var(--color-safe-bg)' : 'var(--color-surface)',
                transition: 'all 0.15s ease',
                marginBottom: '16px',
                cursor: 'pointer',
              }}
                onClick={() => document.getElementById('devis-file-input')?.click()}
              >
                <input
                  id="devis-file-input"
                  type="file"
                  accept=".pdf"
                  style={{ display: 'none' }}
                  onChange={e => setFile(e.target.files?.[0] ?? null)}
                />
                <Upload size={32} color={file ? 'var(--color-accent)' : 'var(--color-muted)'} strokeWidth={1.5} style={{ marginBottom: '12px' }} />
                {file ? (
                  <>
                    <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '15px', color: 'var(--color-safe)' }}>
                      {file.name}
                    </p>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)' }}>
                      {(file.size / 1024).toFixed(0)} Ko · Cliquez pour changer
                    </p>
                  </>
                ) : (
                  <>
                    <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '15px', color: 'var(--color-text)' }}>
                      Déposez votre devis PDF ici
                    </p>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)' }}>
                      ou cliquez pour parcourir · Max 5 Mo
                    </p>
                  </>
                )}
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '12px 14px', background: 'var(--color-danger-bg)', borderRadius: '10px', marginBottom: '16px' }}>
                  <AlertCircle size={16} color="var(--color-danger)" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: '1px' }} />
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-danger)' }}>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={!file || loading}
                style={{
                  width: '100%', padding: '14px',
                  background: !file || loading ? '#9ca3af' : 'var(--color-accent)',
                  color: 'white', border: 'none', borderRadius: '12px',
                  fontSize: '15px', fontWeight: 700, cursor: !file || loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-body)', transition: 'background 0.15s ease',
                }}
              >
                {loading ? 'Analyse en cours…' : 'Analyser ce devis'}
              </button>
            </form>
          )}

          {/* Results */}
          {result && (
            <div>
              {/* Score + verdict */}
              <div style={{
                background: VERDICT_CONFIG[result.verdict].bg,
                border: `1px solid ${VERDICT_CONFIG[result.verdict].color}33`,
                borderRadius: '16px', padding: '20px 24px', marginBottom: '20px',
                display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap',
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: VERDICT_CONFIG[result.verdict].color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: '24px', fontWeight: 800, color: 'white' }}>{result.score}</span>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800, color: VERDICT_CONFIG[result.verdict].color }}>
                    {VERDICT_CONFIG[result.verdict].label}
                  </p>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text)' }}>{result.resume}</p>
                </div>
              </div>

              {/* Alertes */}
              {result.alertes.length > 0 && (
                <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
                  <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Points d&apos;attention</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {result.alertes.map((a, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        {a.type === 'danger' ? <AlertCircle size={15} color="var(--color-danger)" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: '1px' }} /> :
                         a.type === 'warn' ? <AlertTriangle size={15} color="#d97706" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: '1px' }} /> :
                         <Info size={15} color="var(--color-muted)" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: '1px' }} />}
                        <span style={{ fontSize: '13px', color: 'var(--color-text)' }}>{a.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mentions légales */}
              <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
                <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mentions légales</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {result.mentions_legales.map((m, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      {m.present
                        ? <CheckCircle size={14} color="var(--color-safe)" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: '1px' }} />
                        : <AlertCircle size={14} color="var(--color-danger)" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: '1px' }} />}
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: m.present ? 400 : 700, color: m.present ? 'var(--color-text)' : 'var(--color-danger)' }}>{m.label}</span>
                        {m.detail && <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-muted)' }}>{m.detail}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommandations */}
              {result.recommandations.length > 0 && (
                <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
                  <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recommandations</p>
                  <ol style={{ margin: 0, padding: '0 0 0 20px' }}>
                    {result.recommandations.map((r, i) => (
                      <li key={i} style={{ fontSize: '13px', color: 'var(--color-text)', marginBottom: '6px', lineHeight: 1.5 }}>{r}</li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Nouvelle analyse */}
              <button
                onClick={() => { setResult(null); setFile(null); setError(null) }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: '1.5px solid var(--color-border)', borderRadius: '10px', padding: '10px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}
              >
                <FileText size={14} strokeWidth={1.5} /> Analyser un autre devis
              </button>
            </div>
          )}
        </div>
      </main>
    )
  }

  // ── Waitlist mode: no rapport_id ─────────────────────────────────────────
  return (
    <main style={{ minHeight: '100vh', background: '#F8F4EF', fontFamily: 'var(--font-body)' }}>
      <SiteHeader />
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>

        <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'center' }}>
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="12" y="10" width="38" height="50" rx="4" stroke="#52B788" strokeWidth="3" />
            <line x1="20" y1="24" x2="42" y2="24" stroke="#52B788" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="20" y1="33" x2="42" y2="33" stroke="#52B788" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="20" y1="42" x2="34" y2="42" stroke="#52B788" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="56" cy="56" r="12" stroke="#52B788" strokeWidth="3" />
            <line x1="65" y1="65" x2="72" y2="72" stroke="#52B788" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <span style={{ display: 'inline-block', background: '#D8F3DC', color: '#1B4332', fontSize: '12px', fontWeight: 700, padding: '4px 14px', borderRadius: '20px' }}>
            Inclus dans le Pack Sérénité
          </span>
        </div>

        <h1 style={{ margin: '0 0 16px', fontWeight: 800, fontSize: 'clamp(28px, 5vw, 40px)', color: '#1B4332', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
          Analyse IA de votre devis
        </h1>
        <p style={{ margin: '0 0 40px', fontSize: '16px', color: '#6b7280', lineHeight: 1.65 }}>
          Notre IA analyse votre devis PDF en profondeur : clauses abusives, mentions légales manquantes, prix anormaux. En quelques secondes.
        </p>

        {!submitted ? (
          <form onSubmit={handleWaitlist}>
            <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: 600, color: '#1B4332', textAlign: 'left' }}>
              Soyez notifié dès l&apos;ouverture
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="votre@email.com" required
                style={{ flex: '1 1 200px', height: '48px', border: '1.5px solid #e5e7eb', borderRadius: '12px', padding: '0 16px', fontSize: '15px', fontFamily: 'var(--font-body)', outline: 'none', background: '#fff', color: '#111' }}
              />
              <button type="submit"
                style={{ flex: '0 0 auto', height: '48px', padding: '0 24px', background: '#1B4332', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
                Me notifier →
              </button>
            </div>
          </form>
        ) : (
          <p style={{ fontSize: '16px', fontWeight: 700, color: '#52B788', margin: '0 0 24px' }}>
            Vous serez notifié en priorité !
          </p>
        )}

        <div style={{ marginTop: '48px' }}>
          <Link href="/" style={{ fontSize: '14px', color: '#52B788', textDecoration: 'none' }}>
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </main>
  )
}

// ── Suspense wrapper (useSearchParams requirement) ───────────────────────────
export default function AnalyserDevisPage() {
  return (
    <Suspense>
      <AnalyserDevisInner />
    </Suspense>
  )
}
