'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import { supabase } from '@/lib/supabase'
import {
  Upload, CheckCircle, AlertCircle, AlertTriangle, ArrowLeft,
  FileText, Info, FileSearch, Search, BellRing, Scale,
  ClipboardCheck, Shield,
} from 'lucide-react'

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

const UPSELL_FEATURES = [
  { icon: <Search size={14} strokeWidth={1.5} />, text: 'Analyses de devis illimitées pour cet artisan' },
  { icon: <FileText size={14} strokeWidth={1.5} />, text: 'Rapport PDF complet de l\'artisan' },
  { icon: <BellRing size={14} strokeWidth={1.5} />, text: 'Surveillance 6 mois — alertes si changement' },
  { icon: <Scale size={14} strokeWidth={1.5} />, text: 'Vos droits et recours juridiques' },
  { icon: <ClipboardCheck size={14} strokeWidth={1.5} />, text: 'Checklist personnalisée avant de signer' },
  { icon: <Shield size={14} strokeWidth={1.5} />, text: 'Score de fiabilité détaillé' },
]

// ── Bloc upsell Pack Sérénité ─────────────────────────────────────────────────
function UpsellBlock({ siretArtisan, isQuotaBlock }: { siretArtisan: string | null; isQuotaBlock?: boolean }) {
  return (
    <div style={{
      background: 'rgba(45,185,110,0.06)',
      border: '1.5px solid var(--color-accent)',
      borderRadius: 12,
      padding: 20,
      marginTop: isQuotaBlock ? 0 : 24,
    }}>
      <p style={{ fontWeight: 700, fontSize: 15, margin: '0 0 8px', color: 'var(--color-text)' }}>
        {isQuotaBlock
          ? 'Vous avez utilisé votre analyse gratuite ce mois-ci'
          : 'Vous avez utilisé votre analyse gratuite du mois'}
      </p>
      <p style={{ fontSize: 14, color: 'var(--color-muted)', margin: '0 0 16px', lineHeight: 1.6 }}>
        Pour analyser d&apos;autres devis sans limite et accéder à toutes ces fonctionnalités :
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {UPSELL_FEATURES.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
            <span style={{ color: 'var(--color-accent)', flexShrink: 0 }}>{f.icon}</span>
            <span style={{ color: 'var(--color-text)' }}>{f.text}</span>
          </div>
        ))}
      </div>

      {siretArtisan ? (
        <a
          href={`/artisan/${siretArtisan}`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: 'var(--color-accent)', color: 'white', borderRadius: 10,
            padding: '12px 20px', textDecoration: 'none', fontWeight: 600, fontSize: 14,
          }}
        >
          <Shield size={16} strokeWidth={1.5} />
          Obtenir le Pack Sérénité pour cet artisan — 4,90€
        </a>
      ) : (
        <a
          href="/recherche"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: 'var(--color-accent)', color: 'white', borderRadius: 10,
            padding: '12px 20px', textDecoration: 'none', fontWeight: 600, fontSize: 14,
          }}
        >
          <Search size={16} strokeWidth={1.5} />
          Rechercher l&apos;artisan et obtenir le Pack Sérénité
        </a>
      )}

      {isQuotaBlock && (
        <p style={{ fontSize: 13, color: 'var(--color-muted)', textAlign: 'center', marginTop: 12, marginBottom: 0 }}>
          Prochain crédit gratuit disponible le 1er du mois prochain
        </p>
      )}
    </div>
  )
}

// ── Main component (inner) ────────────────────────────────────────────────────
function AnalyserDevisInner() {
  const searchParams = useSearchParams()
  const siretParam = searchParams.get('siret')
  const rapportId = searchParams.get('rapport_id')
  const version = parseInt(searchParams.get('version') ?? '1', 10)
  const nomArtisan = searchParams.get('nom') ?? ''
  const sessionId = searchParams.get('session_id') ?? ''

  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalyseResult | null>(null)
  const [siretArtisan, setSiretArtisan] = useState<string | null>(siretParam)
  const [estGratuite, setEstGratuite] = useState(false)
  const [packSereniteActif, setPackSereniteActif] = useState(false)
  const [quotaDepasse, setQuotaDepasse] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAnalyse(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)
    setQuotaDepasse(false)
    setEstGratuite(false)
    setPackSereniteActif(false)

    try {
      // Convertir le fichier en base64
      const arrayBuffer = await file.arrayBuffer()
      const fileBase64 = Buffer.from(arrayBuffer).toString('base64')
      const mimeType = file.type || 'application/pdf'

      // Token auth optionnel
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`

      const res = await fetch('/api/analyser-devis', {
        method: 'POST',
        headers,
        body: JSON.stringify({ fileBase64, mimeType }),
      })
      const data = await res.json()

      if (res.status === 429 && data.error === 'quota_depasse') {
        setQuotaDepasse(true)
        if (data.siret) setSiretArtisan(data.siret)
        return
      }

      if (!res.ok) {
        setError(data.message || data.error || 'Erreur lors de l\'analyse.')
        return
      }

      setResult(data.analysis)
      if (data.siret_artisan) setSiretArtisan(data.siret_artisan)
      setEstGratuite(!!data.est_gratuite)
      setPackSereniteActif(!!data.pack_serenite_actif)

      // Sauvegarder dans devis_uploads si depuis un rapport
      if (rapportId && siretParam && session) {
        supabase.from('devis_uploads').insert({
          user_id: session.user.id,
          rapport_id: rapportId,
          siret: siretParam,
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

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)', fontFamily: 'var(--font-body)' }}>
      <SiteHeader />
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* Bouton retour si depuis rapport */}
        {rapportId && siretParam && (
          <Link
            href={`/rapport/succes?siret=${siretParam}&session_id=${sessionId}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-muted)', textDecoration: 'none', marginBottom: 24 }}
          >
            <ArrowLeft size={14} strokeWidth={1.5} /> Retour au rapport
          </Link>
        )}

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          {nomArtisan && (
            <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {nomArtisan}
            </p>
          )}
          <h1 style={{ margin: '0 0 8px', fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Analyse juridique du devis
            {version > 1 && <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-muted)', marginLeft: 10 }}>v{version}</span>}
          </h1>
          <p style={{ margin: 0, fontSize: 15, color: 'var(--color-muted)', lineHeight: 1.6 }}>
            Détection des clauses abusives, mentions légales manquantes et prix anormaux.
          </p>
        </div>

        {/* Bandeau quota */}
        <div style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 12, padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 24, flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileSearch size={20} color="var(--color-accent)" strokeWidth={1.5} />
            <div>
              <p style={{ fontWeight: 600, margin: 0, fontSize: 14, color: 'var(--color-text)' }}>
                1 analyse gratuite par mois
              </p>
              <p style={{ fontSize: 13, color: 'var(--color-muted)', margin: 0 }}>
                Illimitée si vous avez acheté le Pack Sérénité de l&apos;artisan concerné
              </p>
            </div>
          </div>
          <a href="/pricing" style={{ fontSize: 13, color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Découvrir le Pack Sérénité →
          </a>
        </div>

        {/* Quota dépassé — bloc upsell seul, sans formulaire */}
        {quotaDepasse && (
          <UpsellBlock siretArtisan={siretArtisan} isQuotaBlock />
        )}

        {/* Formulaire upload (masqué si quota dépassé ou résultat déjà affiché) */}
        {!quotaDepasse && !result && (
          <form onSubmit={handleAnalyse}>
            <div
              style={{
                border: `2px dashed ${file ? 'var(--color-accent)' : 'var(--color-border)'}`,
                borderRadius: 16, padding: '40px 24px', textAlign: 'center',
                background: file ? 'var(--color-safe-bg)' : 'var(--color-surface)',
                transition: 'all 0.15s ease', marginBottom: 16, cursor: 'pointer',
              }}
              onClick={() => document.getElementById('devis-file-input')?.click()}
            >
              <input
                id="devis-file-input"
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={e => setFile(e.target.files?.[0] ?? null)}
              />
              <Upload size={32} color={file ? 'var(--color-accent)' : 'var(--color-muted)'} strokeWidth={1.5} style={{ marginBottom: 12 }} />
              {file ? (
                <>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 15, color: 'var(--color-safe)' }}>{file.name}</p>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--color-muted)' }}>
                    {(file.size / 1024).toFixed(0)} Ko · Cliquez pour changer
                  </p>
                </>
              ) : (
                <>
                  <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 15, color: 'var(--color-text)' }}>
                    Déposez votre devis PDF ici
                  </p>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--color-muted)' }}>
                    ou cliquez pour parcourir · PDF, JPG, PNG · Max 5 Mo
                  </p>
                </>
              )}
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '12px 14px', background: 'var(--color-danger-bg)', borderRadius: 10, marginBottom: 16 }}>
                <AlertCircle size={16} color="var(--color-danger)" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ margin: 0, fontSize: 13, color: 'var(--color-danger)' }}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!file || loading}
              style={{
                width: '100%', padding: 14,
                background: !file || loading ? '#9ca3af' : 'var(--color-accent)',
                color: 'white', border: 'none', borderRadius: 12,
                fontSize: 15, fontWeight: 700,
                cursor: !file || loading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-body)', transition: 'background 0.15s ease',
              }}
            >
              {loading ? 'Analyse en cours…' : 'Analyser ce devis'}
            </button>
          </form>
        )}

        {/* Résultats */}
        {result && (
          <div>
            {/* Badge Pack Sérénité actif */}
            {packSereniteActif && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(45,185,110,0.08)', color: 'var(--color-accent)',
                borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600,
                marginBottom: 16,
              }}>
                <CheckCircle size={12} strokeWidth={2} />
                Pack Sérénité actif — analyses illimitées pour cet artisan
              </div>
            )}

            {/* Score + verdict */}
            <div style={{
              background: VERDICT_CONFIG[result.verdict].bg,
              border: `1px solid ${VERDICT_CONFIG[result.verdict].color}33`,
              borderRadius: 16, padding: '20px 24px', marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: VERDICT_CONFIG[result.verdict].color,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: 'white' }}>{result.score}</span>
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: VERDICT_CONFIG[result.verdict].color }}>
                  {VERDICT_CONFIG[result.verdict].label}
                </p>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text)' }}>{result.resume}</p>
              </div>
            </div>

            {/* Alertes */}
            {result.alertes.length > 0 && (
              <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: 20, marginBottom: 16 }}>
                <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Points d&apos;attention
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {result.alertes.map((a, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      {a.type === 'danger'
                        ? <AlertCircle size={15} color="var(--color-danger)" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />
                        : a.type === 'warn'
                        ? <AlertTriangle size={15} color="#d97706" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />
                        : <Info size={15} color="var(--color-muted)" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />}
                      <span style={{ fontSize: 13, color: 'var(--color-text)' }}>{a.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mentions légales */}
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: 20, marginBottom: 16 }}>
              <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Mentions légales
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {result.mentions_legales.map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    {m.present
                      ? <CheckCircle size={14} color="var(--color-safe)" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />
                      : <AlertCircle size={14} color="var(--color-danger)" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />}
                    <div>
                      <span style={{ fontSize: 13, fontWeight: m.present ? 400 : 700, color: m.present ? 'var(--color-text)' : 'var(--color-danger)' }}>
                        {m.label}
                      </span>
                      {m.detail && <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--color-muted)' }}>{m.detail}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommandations */}
            {result.recommandations.length > 0 && (
              <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
                <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Recommandations
                </p>
                <ol style={{ margin: 0, padding: '0 0 0 20px' }}>
                  {result.recommandations.map((r, i) => (
                    <li key={i} style={{ fontSize: 13, color: 'var(--color-text)', marginBottom: 6, lineHeight: 1.5 }}>{r}</li>
                  ))}
                </ol>
              </div>
            )}

            {/* Upsell si analyse gratuite utilisée */}
            {estGratuite && <UpsellBlock siretArtisan={siretArtisan} />}

            {/* Bouton nouvelle analyse */}
            <button
              onClick={() => { setResult(null); setFile(null); setError(null); setEstGratuite(false); setPackSereniteActif(false) }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: '1.5px solid var(--color-border)', borderRadius: 10, padding: '10px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--color-muted)', fontFamily: 'var(--font-body)', marginTop: estGratuite ? 16 : 0 }}
            >
              <FileText size={14} strokeWidth={1.5} /> Analyser un autre devis
            </button>
          </div>
        )}

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
