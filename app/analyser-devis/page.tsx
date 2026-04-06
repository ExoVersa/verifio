'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import { PageHero, SectionBadge, SurfaceCard } from '@/components/ExperiencePrimitives'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import {
  CheckCircle, XCircle, AlertTriangle, ArrowLeft,
  FileText, FileSearch, Scale, BarChart2, Sparkles,
} from 'lucide-react'
import JaugePrix from '@/components/JaugePrix'
import ScoreCercle from '@/components/ScoreCercle'

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
  verdict?: string | null
  siret_artisan: string | null
  est_gratuite: boolean
  pack_serenite_actif: boolean
}

interface RapportWithQuota {
  id: string
  siret: string
  nom_entreprise: string | null
  stripe_session_id: string
  analysesUtilisees: number
  quotaMax: number
  quotaRestant: number
  quotaAtteint: boolean
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

// ── Main component ────────────────────────────────────────────────────────────
function AnalyserDevisInner() {
  const searchParams = useSearchParams()
  const siretParam = searchParams.get('siret')
  const rapportId = searchParams.get('rapport_id')
  const version = parseInt(searchParams.get('version') ?? '1', 10)
  const nomArtisan = searchParams.get('nom') ?? ''
  const sessionId = searchParams.get('session_id') ?? ''

  const [user, setUser] = useState<User | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  const [rapports, setRapports] = useState<RapportWithQuota[]>([])
  const [rapportSelectionne, setRapportSelectionne] = useState<RapportWithQuota | null>(null)
  const [loadingRapports, setLoadingRapports] = useState(true)

  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [result, setResult] = useState<AnalyseResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoadingUser(false)
      if (user) {
        loadRapports(user.id)
      } else {
        setLoadingRapports(false)
      }
    })
  }, [])

  async function loadRapports(userId: string) {
    setLoadingRapports(true)

    const { data: rapportsData } = await supabase
      .from('rapports')
      .select('id, siret, nom_entreprise, stripe_session_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (!rapportsData || rapportsData.length === 0) {
      setRapports([])
      setLoadingRapports(false)
      return
    }

    const debutMois = new Date()
    debutMois.setDate(1)
    debutMois.setHours(0, 0, 0, 0)

    const rapportsWithQuota = await Promise.all(
      rapportsData.map(async (rapport) => {
        const { count } = await supabase
          .from('analyses_devis')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('siret_artisan', rapport.siret)
          .gte('created_at', debutMois.toISOString())

        const analysesUtilisees = count ?? 0
        const quotaMax = 5
        const quotaRestant = Math.max(0, quotaMax - analysesUtilisees)

        return {
          ...rapport,
          analysesUtilisees,
          quotaMax,
          quotaRestant,
          quotaAtteint: quotaRestant === 0,
        }
      })
    )

    setRapports(rapportsWithQuota)
    setLoadingRapports(false)
  }

  // Animer les étapes de chargement
  useEffect(() => {
    if (!loading) return
    setLoadingStep(0)
    setCompletedSteps([])
    const t1 = setTimeout(() => { setCompletedSteps([0]); setLoadingStep(1) }, 1200)
    const t2 = setTimeout(() => { setCompletedSteps([0, 1]); setLoadingStep(2) }, 2600)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [loading])

  async function triggerAnalyse(file: File) {
    setLoading(true)
    setError(null)
    setResult(null)

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
        body: JSON.stringify({
          fileBase64,
          mimeType,
          nomFichier: file.name,
          siretArtisan: rapportSelectionne?.siret,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.message || data.error || 'Erreur lors de l\'analyse.')
        if (user) await loadRapports(user.id)
        return
      }

      setResult(data)

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

      // Recharger les rapports pour mettre à jour les quotas
      if (user) await loadRapports(user.id)
    } catch {
      setError('Erreur réseau. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  if (loadingUser || (user !== null && loadingRapports)) {
    return (
      <main style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f7f2ea 0%, #fcfaf7 18%, #f6f8f5 100%)', fontFamily: 'var(--font-body)' }}>
        <SiteHeader />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 58px)' }}>
          <div className="spin" style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-accent)' }} />
        </div>
      </main>
    )
  }

  if (!user) {
    return (
      <main style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f7f2ea 0%, #fcfaf7 18%, #f6f8f5 100%)', fontFamily: 'var(--font-body)' }}>
        <SiteHeader />
        <PageHero
          badge={<SectionBadge text="Analyse de devis" />}
          title="Connectez-vous pour sécuriser vos devis."
          subtitle="Cette analyse est réservée aux comptes connectés ayant un Pack Sérénité actif sur l’artisan concerné."
          maxWidth="880px"
        />
        <div style={{ maxWidth: 640, margin: '-28px auto 0', padding: '0 20px 80px', position: 'relative', zIndex: 2 }}>
          <SurfaceCard style={{ padding: '32px', textAlign: 'center', background: 'rgba(255,255,255,0.86)', backdropFilter: 'blur(16px)' }}>
            <div style={{ width: 60, height: 60, borderRadius: '20px', background: '#eef8f3', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#153b2e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <h2 style={{ fontSize: 28, lineHeight: 1.05, letterSpacing: '-0.04em', margin: '0 0 10px', color: 'var(--color-text)' }}>
              Connexion requise
            </h2>
            <p style={{ fontSize: 15, color: 'var(--color-muted)', lineHeight: 1.7, margin: '0 0 20px' }}>
              L&apos;analyse de devis est incluse dans le Pack Sérénité et limitée à 5 analyses par mois et par artisan.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/auth?redirect=/analyser-devis" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--color-accent)', color: '#fff', padding: '14px 24px', borderRadius: '16px', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
                Se connecter pour analyser mon devis
              </Link>
              <Link href="/auth?mode=signup&redirect=/analyser-devis" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.92)', color: 'var(--color-text)', padding: '14px 24px', borderRadius: '16px', fontSize: 15, fontWeight: 700, textDecoration: 'none', border: '1px solid var(--color-border)' }}>
                Créer un compte gratuit
              </Link>
            </div>
          </SurfaceCard>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f7f2ea 0%, #fcfaf7 18%, #f6f8f5 100%)', fontFamily: 'var(--font-body)' }}>
      <SiteHeader />
      <PageHero
        badge={<SectionBadge text="Analyse de devis" />}
        title="Votre devis mérite une vraie lecture avant signature."
        subtitle="Choisissez l’artisan concerné, téléversez le document, puis obtenez une lecture prix + juridique beaucoup plus claire et actionnable."
        maxWidth="980px"
      >
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {['Prix + conformité', '5 analyses / mois / artisan', 'Parcours pensé mobile'].map(item => (
            <span key={item} style={{ display: 'inline-flex', alignItems: 'center', padding: '8px 12px', borderRadius: '999px', background: 'rgba(255,255,255,0.76)', border: '1px solid rgba(226,217,204,0.9)', fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
              {item}
            </span>
          ))}
        </div>
      </PageHero>
      <div style={{ maxWidth: 1040, margin: '-34px auto 0', padding: '0 20px 80px', position: 'relative', zIndex: 2 }}>

        {/* Bouton retour si depuis rapport */}
        {rapportId && siretParam && (
          <Link
            href={`/rapport/succes?siret=${siretParam}&session_id=${sessionId}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-muted)', textDecoration: 'none', marginBottom: 28 }}
          >
            <ArrowLeft size={14} strokeWidth={1.5} /> Retour au rapport
          </Link>
        )}

        {/* Header page */}
        <SurfaceCard style={{ padding: 28, background: 'rgba(255,255,255,0.86)', backdropFilter: 'blur(16px)', marginBottom: 28 }}>
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
            Incluse dans le Pack Sérénité · 5 analyses / mois par artisan
          </div>
          <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            Analyser &amp; vérifier mon devis
            {version > 1 && <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-muted)', marginLeft: 10 }}>v{version}</span>}
          </h1>
          <p style={{ margin: 0, fontSize: 16, color: 'var(--color-muted)', maxWidth: 520, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
            Uploadez le devis PDF de votre artisan — on vérifie les prix ET la conformité juridique.
          </p>
        </SurfaceCard>

        {/* État vide — aucun Pack Sérénité actif */}
        {rapports.length === 0 && !result && (
          <div style={{ maxWidth: 640, margin: '3rem auto', padding: '0 1rem' }}>
            <SurfaceCard style={{ padding: '32px', textAlign: 'center', background: 'rgba(255,255,255,0.9)' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '20px',
                background: 'var(--color-surface)',
                border: '0.5px solid var(--color-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1rem',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="var(--color-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text)', marginBottom: 8 }}>
                Aucun Pack Sérénité actif
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                L&apos;analyse de devis est incluse dans le Pack Sérénité d&apos;un artisan.
                Vérifiez d&apos;abord votre artisan pour accéder à cette fonctionnalité.
              </div>
              <Link href="/recherche" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#1B4332', color: '#fff',
                padding: '13px 22px', borderRadius: '16px',
                fontSize: 14, fontWeight: 700, textDecoration: 'none',
              }}>
                Vérifier un artisan →
              </Link>
            </SurfaceCard>
          </div>
        )}

        {/* Liste artisans + zone upload */}
        {rapports.length > 0 && !result && (
          <SurfaceCard style={{ padding: 28, background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(16px)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
              <div>
                <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 800, color: 'var(--color-accent)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Étape 1
                </p>
                <h2 style={{ margin: 0, fontSize: 'clamp(24px, 4vw, 32px)', lineHeight: 1.06, letterSpacing: '-0.04em', color: 'var(--color-text)' }}>
                  Sélectionnez l&apos;artisan concerné.
                </h2>
              </div>
              <div style={{ maxWidth: 320, fontSize: 14, lineHeight: 1.7, color: 'var(--color-muted)' }}>
                Chaque Pack Sérénité ouvre 5 analyses mensuelles pour l&apos;artisan choisi.
              </div>
            </div>

            {rapports.map(rapport => (
              <div
                key={rapport.id}
                onClick={() => !rapport.quotaAtteint && !loading && setRapportSelectionne(rapport)}
                style={{
                  background: rapportSelectionne?.id === rapport.id ? '#EAF3DE' : 'var(--color-surface)',
                  border: rapportSelectionne?.id === rapport.id
                    ? '2px solid #1B4332'
                    : '0.5px solid var(--color-border)',
                  borderRadius: '14px',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 10,
                  cursor: rapport.quotaAtteint ? 'not-allowed' : 'pointer',
                  opacity: rapport.quotaAtteint ? 0.6 : 1,
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: rapportSelectionne?.id === rapport.id ? '#C0DD97' : '#E6F1FB',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 500,
                    color: rapportSelectionne?.id === rapport.id ? '#27500A' : '#0C447C',
                    flexShrink: 0,
                  }}>
                    {(rapport.nom_entreprise || rapport.siret).slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: 14, fontWeight: 500,
                      color: rapportSelectionne?.id === rapport.id ? '#27500A' : 'var(--color-text)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {rapport.nom_entreprise || `Artisan ${rapport.siret}`}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>
                      SIRET {rapport.siret}
                    </div>
                  </div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  {rapport.quotaAtteint ? (
                    <span style={{
                      fontSize: 11, fontWeight: 500, padding: '3px 10px',
                      borderRadius: 99, background: '#F1EFE8', color: '#5F5E5A',
                    }}>
                      Quota atteint
                    </span>
                  ) : rapport.quotaRestant <= 1 ? (
                    <span style={{
                      fontSize: 11, fontWeight: 500, padding: '3px 10px',
                      borderRadius: 99, background: '#FAEEDA', color: '#854F0B',
                    }}>
                      {rapport.quotaRestant}/5 restante
                    </span>
                  ) : (
                    <span style={{
                      fontSize: 11, fontWeight: 500, padding: '3px 10px',
                      borderRadius: 99, background: '#EAF3DE', color: '#27500A',
                    }}>
                      {rapport.quotaRestant}/5 restantes
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Zone upload — visible si artisan sélectionné */}
            {rapportSelectionne && (
              <div style={{
                border: '1.5px dashed rgba(220,208,193,0.95)',
                borderRadius: '24px',
                padding: '3rem 1.5rem',
                textAlign: 'center',
                marginTop: '1.5rem',
                background: 'linear-gradient(180deg, rgba(250,246,241,0.9) 0%, rgba(255,255,255,0.86) 100%)',
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                  stroke="var(--color-muted)" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round"
                  style={{ margin: '0 auto 12px', display: 'block' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', marginBottom: 6 }}>
                  Déposez le devis de {rapportSelectionne.nom_entreprise || rapportSelectionne.siret}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 16 }}>
                  PDF uniquement · Max 10 Mo · {rapportSelectionne.quotaRestant} analyse{rapportSelectionne.quotaRestant > 1 ? 's' : ''} restante{rapportSelectionne.quotaRestant > 1 ? 's' : ''} ce mois
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  style={{
                    background: '#1B4332', color: '#fff',
                    border: 'none', borderRadius: 16,
                    padding: '12px 22px', fontSize: 14, fontWeight: 700,
                    cursor: loading ? 'wait' : 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    fontFamily: 'var(--font-body)',
                    boxShadow: '0 16px 32px rgba(21,59,46,0.16)',
                  }}
                >
                  <Sparkles size={14} strokeWidth={1.5} />
                  {loading ? 'Analyse en cours…' : 'Parcourir'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/jpeg,image/png"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const f = e.target.files?.[0]
                    e.target.value = ''
                    if (f && rapportSelectionne) triggerAnalyse(f)
                  }}
                />
              </div>
            )}

            {/* Erreur */}
            {error && !loading && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '12px 14px', background: 'var(--color-danger-bg)', borderRadius: 10, marginTop: 16 }}>
                <XCircle size={16} color="var(--color-danger)" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ margin: 0, fontSize: 13, color: 'var(--color-danger)' }}>{error}</p>
              </div>
            )}
          </SurfaceCard>
        )}

        {/* Animation de chargement */}
        {loading && (
          <SurfaceCard style={{ marginTop: 28, padding: 24 }}>
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
          </SurfaceCard>
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
                Pack Sérénité actif — {rapportSelectionne ? `${rapportSelectionne.quotaRestant}/5 analyses restantes ce mois` : 'analyses incluses pour cet artisan'}
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
              <SurfaceCard style={{ padding: 24, background: 'rgba(255,255,255,0.9)' }}>
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
                        <Link href={`/artisan/${result.siret_artisan}`} style={{ color: 'var(--color-accent)', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                          Voir la fiche →
                        </Link>
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
              </SurfaceCard>

              {/* Colonne droite — Conformité juridique */}
              <SurfaceCard style={{ padding: 24, background: 'rgba(255,255,255,0.9)' }}>
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
              </SurfaceCard>
            </div>

            {/* Score global — pleine largeur */}
            <SurfaceCard style={{
              padding: 24,
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
                  {result.verdict ?? (
                    result.score_global >= 9 ? 'Devis excellent — vous pouvez signer en confiance'
                    : result.score_global >= 7 ? 'Devis correct — quelques points à clarifier avant de signer'
                    : result.score_global >= 5 ? 'Devis à corriger — demandez les éléments manquants avant tout engagement'
                    : result.score_global >= 3 ? 'Devis insuffisant — ne signez pas sans corrections importantes'
                    : 'Devis à rejeter — mentions légales obligatoires absentes'
                  )}
                </p>
              </div>
            </SurfaceCard>

            {/* Bouton nouvelle analyse */}
            <button
              onClick={() => { setResult(null); setError(null) }}
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
