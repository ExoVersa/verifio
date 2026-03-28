'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import SiteHeader from '@/components/SiteHeader'
import { supabase } from '@/lib/supabase'
import {
  Upload, CheckCircle, XCircle, AlertTriangle, ArrowLeft,
  FileText, FileSearch, Scale, BarChart2, Sparkles, Shield,
  BellRing, ClipboardCheck, Search, MessageSquare,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────
interface PrixResult {
  siret: string | null
  nom_artisan: string | null
  type_travaux: string
  region: string | null
  montant_devis: number | null
  fourchette_basse: number
  fourchette_haute: number
  prix_moyen: number
  verdict_prix: 'normal' | 'sous-evalue' | 'surevalue'
  ecart_pourcentage: number
  facteurs: string[]
  alerte: string | null
}

interface JuridiqueResult {
  score_conformite: number
  mentions_presentes: string[]
  mentions_manquantes: string[]
  clauses_abusives: string[]
  verdict_juridique: 'conforme' | 'a_corriger' | 'non_conforme'
  recommandations: string[]
}

interface AnalyseResponse {
  prix: PrixResult
  juridique: JuridiqueResult
  score_global: number
  siret_artisan: string | null
  est_gratuite: boolean
  pack_serenite_actif: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatEur(n: number | null | undefined) {
  if (!n) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

const LOADING_STEPS = [
  { icon: FileText, label: 'Lecture du devis...' },
  { icon: BarChart2, label: 'Vérification des prix...' },
  { icon: Scale, label: 'Analyse juridique...' },
]

const UPSELL_FEATURES = [
  { Icon: FileText, text: 'Rapport PDF complet' },
  { Icon: BellRing, text: 'Surveillance 6 mois' },
  { Icon: Search, text: 'Analyses devis illimitées' },
  { Icon: ClipboardCheck, text: 'Checklist avant signature' },
  { Icon: Scale, text: 'Guide droits et recours' },
  { Icon: MessageSquare, text: 'Questions à poser' },
]

// ── Composant jauge prix ──────────────────────────────────────────────────────
function JaugePrix({ prix }: { prix: PrixResult }) {
  const max = prix.fourchette_haute * 1.6
  const lowPct = (prix.fourchette_basse / max) * 100
  const highPct = (prix.fourchette_haute / max) * 100
  const meanPct = (prix.prix_moyen / max) * 100
  const devisPct = prix.montant_devis ? Math.min((prix.montant_devis / max) * 100, 97) : null

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ position: 'relative', height: 24, borderRadius: 12, overflow: 'hidden', marginBottom: 6 }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${lowPct}%`, background: '#fee2e2' }} />
        <div style={{ position: 'absolute', left: `${lowPct}%`, top: 0, height: '100%', width: `${highPct - lowPct}%`, background: '#dcfce7' }} />
        <div style={{ position: 'absolute', left: `${highPct}%`, top: 0, height: '100%', width: `${100 - highPct}%`, background: '#fef3c7' }} />
        <div style={{ position: 'absolute', left: `${meanPct}%`, top: '3px', height: 'calc(100% - 6px)', width: 2, background: 'var(--color-accent)', transform: 'translateX(-50%)', borderRadius: 1 }} />
        {devisPct !== null && (
          <div style={{ position: 'absolute', left: `${devisPct}%`, top: 0, height: '100%', width: 3, background: '#1d4ed8', transform: 'translateX(-50%)', borderRadius: 2 }} />
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-muted)' }}>
        <span style={{ color: '#ef4444', fontWeight: 600 }}>Trop bas</span>
        <span style={{ color: '#16a34a', fontWeight: 600 }}>Zone normale</span>
        <span style={{ color: '#d97706', fontWeight: 600 }}>Élevé</span>
      </div>
    </div>
  )
}

// ── Composant score cercle ────────────────────────────────────────────────────
function ScoreCercle({ score, size = 56 }: { score: number; size?: number }) {
  const color = score >= 8 ? 'var(--color-safe)' : score >= 5 ? '#d97706' : 'var(--color-danger)'
  const bg = score >= 8 ? 'var(--color-safe-bg)' : score >= 5 ? '#fffbeb' : 'var(--color-danger-bg)'
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, border: `2px solid ${color}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <span style={{ fontSize: size * 0.35, fontWeight: 800, color }}>{score}</span>
    </div>
  )
}

// ── Bloc upsell dark green ────────────────────────────────────────────────────
function UpsellBloc({ siretArtisan, isQuota }: { siretArtisan: string | null; isQuota?: boolean }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)',
      borderRadius: 16, padding: 28, marginTop: 32, color: 'white',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', opacity: 0.7, marginBottom: 8, margin: '0 0 8px' }}>
            PACK SÉRÉNITÉ — 4,90€
          </p>
          <h3 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px', lineHeight: 1.2 }}>
            Analyses illimitées + rapport complet
          </h3>
          {isQuota && (
            <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 14px', margin: '0 0 12px' }}>
              <p style={{ margin: 0, fontSize: 14, opacity: 0.95 }}>
                Vous avez utilisé votre analyse gratuite ce mois-ci.
                Prochain crédit disponible le 1er du mois prochain.
              </p>
            </div>
          )}
          <p style={{ opacity: 0.8, fontSize: 14, margin: '0 0 20px', lineHeight: 1.6 }}>
            Achetez le Pack Sérénité pour cet artisan et obtenez des analyses de devis illimitées, plus tout ceci :
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
            {UPSELL_FEATURES.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, opacity: 0.9 }}>
                <span style={{ opacity: 0.7, flexShrink: 0 }}><f.Icon size={14} strokeWidth={1.5} /></span>
                {f.text}
              </div>
            ))}
          </div>

          {siretArtisan ? (
            <a
              href={`/artisan/${siretArtisan}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'white', color: '#1B4332', borderRadius: 10,
                padding: '12px 24px', textDecoration: 'none', fontWeight: 700, fontSize: 15,
              }}
            >
              <Shield size={16} strokeWidth={1.5} />
              Obtenir le Pack pour cet artisan — 4,90€
            </a>
          ) : (
            <a
              href="/recherche"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'white', color: '#1B4332', borderRadius: 10,
                padding: '12px 24px', textDecoration: 'none', fontWeight: 700, fontSize: 15,
              }}
            >
              <Search size={16} strokeWidth={1.5} />
              Rechercher l&apos;artisan et obtenir le Pack Sérénité
            </a>
          )}
        </div>

        {/* Témoignage */}
        <div style={{
          background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 20,
          maxWidth: 240, flexShrink: 0,
        }}>
          <p style={{ fontSize: 14, fontStyle: 'italic', margin: '0 0 12px', opacity: 0.9, lineHeight: 1.6 }}>
            &ldquo;J&apos;ai évité une arnaque grâce à l&apos;analyse de devis. Le prix était 40% en dessous du marché — signe que l&apos;artisan allait disparaître avec l&apos;acompte.&rdquo;
          </p>
          <p style={{ fontSize: 13, fontWeight: 600, opacity: 0.7, margin: 0 }}>Marie D. — Tours</p>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
function AnalyserDevisInner() {
  const searchParams = useSearchParams()
  const siretParam = searchParams.get('siret')
  const rapportId = searchParams.get('rapport_id')
  const version = parseInt(searchParams.get('version') ?? '1', 10)
  const nomArtisan = searchParams.get('nom') ?? ''
  const sessionId = searchParams.get('session_id') ?? ''

  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [result, setResult] = useState<AnalyseResponse | null>(null)
  const [siretArtisan, setSiretArtisan] = useState<string | null>(siretParam)
  const [quotaDepasse, setQuotaDepasse] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Animer les étapes de chargement
  useEffect(() => {
    if (!loading) return
    setLoadingStep(0)
    setCompletedSteps([])
    const t1 = setTimeout(() => { setCompletedSteps([0]); setLoadingStep(1) }, 1200)
    const t2 = setTimeout(() => { setCompletedSteps([0, 1]); setLoadingStep(2) }, 2600)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [loading])

  function onFileChange(f: File | null) {
    if (!f) return
    setFile(f)
    setError(null)
    setResult(null)
    setQuotaDepasse(false)
  }

  async function handleAnalyse(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)
    setQuotaDepasse(false)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const fileBase64 = Buffer.from(arrayBuffer).toString('base64')
      const mimeType = file.type || 'application/pdf'

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

      setResult(data)
      if (data.siret_artisan) setSiretArtisan(data.siret_artisan)

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

  const CARD: React.CSSProperties = {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 16,
    padding: 24,
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)', fontFamily: 'var(--font-body)' }}>
      <SiteHeader />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 20px 80px' }}>

        {/* Bouton retour si depuis rapport */}
        {rapportId && siretParam && (
          <a
            href={`/rapport/succes?siret=${siretParam}&session_id=${sessionId}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-muted)', textDecoration: 'none', marginBottom: 28 }}
          >
            <ArrowLeft size={14} strokeWidth={1.5} /> Retour au rapport
          </a>
        )}

        {/* Header page */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          {nomArtisan && (
            <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {nomArtisan}
            </p>
          )}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(45,185,110,0.08)', border: '1px solid rgba(45,185,110,0.2)',
            borderRadius: 20, padding: '6px 14px',
            fontSize: 13, color: 'var(--color-accent)', fontWeight: 600, marginBottom: 16,
          }}>
            <FileSearch size={14} strokeWidth={1.5} />
            1 analyse gratuite par mois · Illimitée avec Pack Sérénité
          </div>
          <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            Analyser &amp; vérifier mon devis
            {version > 1 && <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-muted)', marginLeft: 10 }}>v{version}</span>}
          </h1>
          <p style={{ margin: 0, fontSize: 16, color: 'var(--color-muted)', maxWidth: 520, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
            Uploadez votre devis PDF — on vérifie les prix ET la conformité juridique en 30 secondes.
          </p>
        </div>

        {/* Quota dépassé — upsell seul */}
        {quotaDepasse && <UpsellBloc siretArtisan={siretArtisan} isQuota />}

        {/* Formulaire upload */}
        {!quotaDepasse && !result && (
          <form onSubmit={handleAnalyse}>
            {/* Zone drag & drop */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => {
                e.preventDefault()
                setDragOver(false)
                const f = e.dataTransfer.files?.[0]
                if (f) onFileChange(f)
              }}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? 'var(--color-accent)' : file ? 'var(--color-accent)' : 'var(--color-border)'}`,
                borderRadius: 16,
                padding: '48px 24px',
                textAlign: 'center',
                background: dragOver ? 'rgba(45,185,110,0.04)' : file ? 'var(--color-safe-bg)' : 'var(--color-surface)',
                transition: 'all 0.15s ease',
                marginBottom: 16,
                cursor: 'pointer',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/jpeg,image/png"
                style={{ display: 'none' }}
                onChange={e => onFileChange(e.target.files?.[0] ?? null)}
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
                    Glissez votre devis PDF ici ou cliquez pour parcourir
                  </p>
                  <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--color-muted)' }}>
                    PDF uniquement · Max 10 Mo · Vos données restent privées
                  </p>
                  <span style={{
                    display: 'inline-block', padding: '8px 18px', borderRadius: 10,
                    border: '1.5px solid var(--color-border)', fontSize: 13, fontWeight: 600,
                    color: 'var(--color-text)', background: 'var(--color-bg)',
                  }}>
                    Parcourir
                  </span>
                </>
              )}
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '12px 14px', background: 'var(--color-danger-bg)', borderRadius: 10, marginBottom: 16 }}>
                <XCircle size={16} color="var(--color-danger)" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ margin: 0, fontSize: 13, color: 'var(--color-danger)' }}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!file || loading}
              style={{
                width: '100%', background: !file ? 'var(--color-border)' : 'var(--color-accent)',
                color: !file ? 'var(--color-muted)' : 'white',
                border: 'none', borderRadius: 12, padding: '16px 24px',
                fontSize: 16, fontWeight: 700,
                cursor: !file || loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                fontFamily: 'var(--font-body)', transition: 'background 0.15s ease',
              }}
            >
              {loading ? (
                <span style={{ opacity: 0.9 }}>Analyse en cours…</span>
              ) : (
                <>
                  <Sparkles size={18} strokeWidth={1.5} />
                  Analyser mon devis — gratuit
                </>
              )}
            </button>
          </form>
        )}

        {/* Animation de chargement */}
        {loading && (
          <div style={{ marginTop: 28, ...CARD }}>
            <p style={{ margin: '0 0 20px', fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
              Analyse en cours...
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {LOADING_STEPS.map((step, i) => {
                const done = completedSteps.includes(i)
                const active = loadingStep === i && !done
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: done ? 'var(--color-safe-bg)' : active ? 'rgba(45,185,110,0.08)' : 'var(--color-bg)',
                      border: `1.5px solid ${done ? 'var(--color-safe)' : active ? 'var(--color-accent)' : 'var(--color-border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {done
                        ? <CheckCircle size={16} color="var(--color-safe)" strokeWidth={1.5} />
                        : <step.icon size={14} color={active ? 'var(--color-accent)' : 'var(--color-muted)'} strokeWidth={1.5} />}
                    </div>
                    <span style={{
                      fontSize: 14,
                      fontWeight: active ? 600 : 400,
                      color: done ? 'var(--color-safe)' : active ? 'var(--color-text)' : 'var(--color-muted)',
                    }}>
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Résultats */}
        {result && (
          <div style={{ marginTop: 32 }}>
            {/* Badge Pack Sérénité actif */}
            {result.pack_serenite_actif && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(45,185,110,0.08)', color: 'var(--color-accent)',
                borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600,
                marginBottom: 20,
              }}>
                <CheckCircle size={12} strokeWidth={2} />
                Pack Sérénité actif — analyses illimitées pour cet artisan
              </div>
            )}

            {/* 2 colonnes — prix + juridique */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 16,
              marginBottom: 16,
            }}>
              {/* Colonne gauche — Analyse des prix */}
              <div style={CARD}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <BarChart2 size={20} color="var(--color-accent)" strokeWidth={1.5} />
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Analyse des prix</h2>
                </div>

                {/* Artisan détecté */}
                {(result.prix.nom_artisan || result.siret_artisan) && (
                  <div style={{
                    background: 'var(--color-bg)', borderRadius: 10,
                    padding: '10px 12px', marginBottom: 14,
                    fontSize: 13,
                  }}>
                    <span style={{ color: 'var(--color-muted)' }}>Artisan : </span>
                    <strong style={{ color: 'var(--color-text)' }}>
                      {result.prix.nom_artisan || `SIRET ${result.siret_artisan}`}
                    </strong>
                    {result.siret_artisan && (
                      <>
                        <span style={{ color: 'var(--color-muted)', margin: '0 6px' }}>·</span>
                        <a href={`/artisan/${result.siret_artisan}`} style={{ color: 'var(--color-accent)', fontSize: 12, fontWeight: 600 }}>
                          Voir la fiche →
                        </a>
                      </>
                    )}
                  </div>
                )}

                {/* Type + région */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                  <span style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent)', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                    {result.prix.type_travaux}
                  </span>
                  {result.prix.region && (
                    <span style={{ background: 'var(--color-bg)', color: 'var(--color-muted)', borderRadius: 20, padding: '3px 10px', fontSize: 12 }}>
                      {result.prix.region}
                    </span>
                  )}
                </div>

                {/* Montant devis vs fourchette */}
                {result.prix.montant_devis && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: 'var(--color-muted)' }}>Montant du devis</span>
                      <strong>{formatEur(result.prix.montant_devis)}</strong>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: 'var(--color-muted)' }}>Fourchette normale</span>
                  <span>{formatEur(result.prix.fourchette_basse)} — {formatEur(result.prix.fourchette_haute)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 12 }}>
                  <span style={{ color: 'var(--color-muted)' }}>Prix moyen marché</span>
                  <strong>{formatEur(result.prix.prix_moyen)}</strong>
                </div>

                <JaugePrix prix={result.prix} />

                {/* Verdict prix */}
                <div style={{
                  marginTop: 16,
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: result.prix.verdict_prix === 'normal' ? 'var(--color-safe-bg)' : result.prix.verdict_prix === 'sous-evalue' ? 'var(--color-danger-bg)' : '#fffbeb',
                  border: `1px solid ${result.prix.verdict_prix === 'normal' ? 'rgba(45,185,110,0.3)' : result.prix.verdict_prix === 'sous-evalue' ? 'rgba(220,38,38,0.2)' : '#fde68a'}`,
                }}>
                  <p style={{
                    margin: '0 0 4px', fontWeight: 700, fontSize: 14,
                    color: result.prix.verdict_prix === 'normal' ? 'var(--color-safe)' : result.prix.verdict_prix === 'sous-evalue' ? 'var(--color-danger)' : '#d97706',
                  }}>
                    {result.prix.verdict_prix === 'normal' && 'Prix dans la norme'}
                    {result.prix.verdict_prix === 'sous-evalue' && 'Devis sous-évalué — méfiance'}
                    {result.prix.verdict_prix === 'surevalue' && 'Devis surévalué'}
                  </p>
                  {result.prix.ecart_pourcentage > 0 && (
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)' }}>
                      Écart : {result.prix.ecart_pourcentage}% par rapport au prix moyen
                    </p>
                  )}
                  {result.prix.alerte && (
                    <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--color-danger)', display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                      <AlertTriangle size={12} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />
                      {result.prix.alerte}
                    </p>
                  )}
                </div>

                {/* Facteurs */}
                {result.prix.facteurs?.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Facteurs de variation
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {result.prix.facteurs.map((f, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12 }}>
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--color-accent)', flexShrink: 0, marginTop: 5 }} />
                          <span style={{ color: 'var(--color-text)', lineHeight: 1.5 }}>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Colonne droite — Conformité juridique */}
              <div style={CARD}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Scale size={20} color="var(--color-accent)" strokeWidth={1.5} />
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Conformité juridique</h2>
                </div>

                {/* Score */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, padding: '12px 14px', background: 'var(--color-bg)', borderRadius: 10 }}>
                  <ScoreCercle score={result.juridique.score_conformite} size={52} />
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 800,
                      color: result.juridique.verdict_juridique === 'conforme' ? 'var(--color-safe)' : result.juridique.verdict_juridique === 'a_corriger' ? '#d97706' : 'var(--color-danger)',
                    }}>
                      {result.juridique.verdict_juridique === 'conforme' && 'Devis conforme'}
                      {result.juridique.verdict_juridique === 'a_corriger' && 'Devis à corriger'}
                      {result.juridique.verdict_juridique === 'non_conforme' && 'Devis non conforme'}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)' }}>Score /10</p>
                  </div>
                </div>

                {/* Mentions présentes */}
                {result.juridique.mentions_presentes?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Mentions présentes
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {result.juridique.mentions_presentes.map((m, i) => (
                        <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start', fontSize: 13 }}>
                          <CheckCircle size={13} color="var(--color-safe)" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />
                          <span>{m}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mentions manquantes */}
                {result.juridique.mentions_manquantes?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: 'var(--color-danger)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Mentions manquantes
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {result.juridique.mentions_manquantes.map((m, i) => (
                        <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start', fontSize: 13 }}>
                          <XCircle size={13} color="var(--color-danger)" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />
                          <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>{m}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clauses abusives */}
                {result.juridique.clauses_abusives?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Clauses abusives détectées
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {result.juridique.clauses_abusives.map((c, i) => (
                        <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start', fontSize: 13 }}>
                          <AlertTriangle size={13} color="#d97706" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />
                          <span style={{ color: '#92400e' }}>{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommandations */}
                {result.juridique.recommandations?.length > 0 && (
                  <div style={{ marginTop: 8, padding: '10px 12px', background: 'var(--color-bg)', borderRadius: 10 }}>
                    <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Recommandations
                    </p>
                    <ol style={{ margin: 0, padding: '0 0 0 16px' }}>
                      {result.juridique.recommandations.map((r, i) => (
                        <li key={i} style={{ fontSize: 12, color: 'var(--color-text)', marginBottom: 4, lineHeight: 1.5 }}>{r}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            </div>

            {/* Score global — pleine largeur */}
            <div style={{
              ...CARD,
              display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
              background: result.score_global >= 8 ? 'var(--color-safe-bg)' : result.score_global >= 5 ? '#fffbeb' : 'var(--color-danger-bg)',
              border: `1.5px solid ${result.score_global >= 8 ? 'rgba(45,185,110,0.3)' : result.score_global >= 5 ? '#fde68a' : 'rgba(220,38,38,0.2)'}`,
            }}>
              <ScoreCercle score={result.score_global} size={64} />
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)' }}>
                  Score global du devis
                </p>
                <p style={{
                  margin: 0, fontSize: 18, fontWeight: 800,
                  color: result.score_global >= 8 ? 'var(--color-safe)' : result.score_global >= 5 ? '#d97706' : 'var(--color-danger)',
                }}>
                  {result.score_global >= 8 && 'Devis excellent — vous pouvez signer en confiance'}
                  {result.score_global >= 5 && result.score_global < 8 && 'Devis à revoir — demandez des corrections'}
                  {result.score_global < 5 && 'Devis problématique — ne signez pas'}
                </p>
              </div>
            </div>

            {/* Upsell si analyse gratuite */}
            {result.est_gratuite && <UpsellBloc siretArtisan={siretArtisan} />}

            {/* Bouton nouvelle analyse */}
            <button
              onClick={() => { setResult(null); setFile(null); setError(null) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'none', border: '1.5px solid var(--color-border)',
                borderRadius: 10, padding: '10px 16px',
                cursor: 'pointer', fontSize: 13, fontWeight: 600,
                color: 'var(--color-muted)', fontFamily: 'var(--font-body)',
                marginTop: 20,
              }}
            >
              <FileSearch size={14} strokeWidth={1.5} /> Analyser un autre devis
            </button>
          </div>
        )}

      </div>
    </main>
  )
}

export default function AnalyserDevisPage() {
  return (
    <Suspense>
      <AnalyserDevisInner />
    </Suspense>
  )
}
