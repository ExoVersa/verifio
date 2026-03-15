'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  ShieldCheck, Upload, FileText, Image as ImageIcon, X, AlertTriangle,
  Loader2, LogIn, CheckCircle2, ArrowLeft, FileSearch,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { DevisAnalysis, SearchResult } from '@/types'
import DevisAnalysisCard from '@/components/DevisAnalysisCard'
import SiteHeader from '@/components/SiteHeader'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 Mo
const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']

export default function AnalyserDevisPage() {
  const [user, setUser] = useState<User | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null)
  const [fileBase64, setFileBase64] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<DevisAnalysis | null>(null)
  const [company, setCompany] = useState<SearchResult | null>(null)
  const [requiresPayment, setRequiresPayment] = useState(false)
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [paidSession, setPaidSession] = useState<string | null>(null)
  const [justPaid, setJustPaid] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Détection du retour Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('session_id')
    if (sessionId) {
      localStorage.setItem('devis_session_id', sessionId)
      setPaidSession(sessionId)
      setJustPaid(true)
      window.history.replaceState({}, '', '/analyser-devis')
    } else {
      const stored = localStorage.getItem('devis_session_id')
      if (stored) setPaidSession(stored)
    }
  }, [])

  const handleFile = useCallback((f: File) => {
    setFileError(null)
    setError(null)
    setAnalysis(null)
    setRequiresPayment(false)

    if (!ACCEPTED_TYPES.includes(f.type)) {
      setFileError('Format non supporté. Utilisez PDF, JPG ou PNG.')
      return
    }
    if (f.size > MAX_FILE_SIZE) {
      setFileError('Fichier trop volumineux (max 10 Mo).')
      return
    }
    setFile(f)
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setFileDataUrl(result)
      setFileBase64(result.split(',')[1])
    }
    reader.readAsDataURL(f)
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFile(dropped)
  }, [handleFile])

  const handleAnalyze = async () => {
    if (!fileBase64 || !file) return
    setIsAnalyzing(true)
    setError(null)
    setAnalysis(null)
    setRequiresPayment(false)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setError('Vous devez être connecté pour analyser un devis.')
      setIsAnalyzing(false)
      return
    }

    try {
      const res = await fetch('/api/analyser-devis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ fileBase64, mimeType: file.type, sessionId: paidSession || undefined }),
      })

      const data = await res.json()

      if (data.requiresPayment) {
        setCheckoutUrl(data.checkoutUrl)
        setRequiresPayment(true)
      } else if (data.error) {
        setError(data.error)
      } else {
        setAnalysis(data.analysis)
        setCompany(data.company || null)
        // Purger la session payée après utilisation
        if (paidSession) {
          localStorage.removeItem('devis_session_id')
          setPaidSession(null)
          setJustPaid(false)
        }
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
      }
    } catch {
      setError('Erreur réseau. Vérifiez votre connexion et réessayez.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const removeFile = () => {
    setFile(null)
    setFileDataUrl(null)
    setFileBase64(null)
    setFileError(null)
    setAnalysis(null)
    setRequiresPayment(false)
    setError(null)
  }

  const isPdf = file?.type === 'application/pdf'

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>

      {/* HEADER */}
      <SiteHeader />

      <section style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Titre */}
        <div style={{ marginBottom: '32px' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-muted)', textDecoration: 'none', marginBottom: '20px' }}>
            <ArrowLeft size={14} />Retour
          </Link>
          <h1 className="font-display" style={{ margin: '0 0 10px', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, letterSpacing: '-0.03em' }}>
            Analyser un devis
          </h1>
          <p style={{ margin: 0, fontSize: '15px', color: 'var(--color-muted)', lineHeight: 1.6 }}>
            Déposez votre devis (PDF ou photo) — notre IA vérifie en 30 secondes les mentions légales obligatoires, la cohérence des prix et détecte les clauses suspectes.
          </p>
        </div>

        {/* Bannière paiement confirmé */}
        {justPaid && (
          <div style={{
            display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '14px 16px',
            borderRadius: '12px', background: 'var(--color-safe-bg)',
            border: '1px solid color-mix(in srgb, var(--color-safe) 30%, transparent)', marginBottom: '24px',
          }}>
            <CheckCircle2 size={18} color="var(--color-safe)" style={{ flexShrink: 0 }} />
            <div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--color-safe)' }}>Paiement confirmé !</p>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--color-muted)' }}>
                Déposez votre devis ci-dessous pour lancer l'analyse.
              </p>
            </div>
          </div>
        )}

        {/* Connexion requise */}
        {!user && (
          <div style={{
            padding: '24px', borderRadius: '14px', border: '1px solid var(--color-border)',
            background: 'var(--color-surface)', textAlign: 'center', marginBottom: '24px',
          }}>
            <LogIn size={32} color="var(--color-muted)" style={{ marginBottom: '12px' }} />
            <p style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600 }}>Connexion requise</p>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--color-muted)' }}>
              Créez un compte gratuit pour bénéficier d'une analyse offerte, puis 9,90&nbsp;€ par analyse.
            </p>
            <Link href="/auth" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
              borderRadius: '10px', background: 'var(--color-text)', color: 'var(--color-bg)',
              textDecoration: 'none', fontSize: '14px', fontWeight: 600,
            }}>
              <LogIn size={15} />Se connecter / S'inscrire
            </Link>
          </div>
        )}

        {/* Zone d'upload */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => !file && fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${isDragging ? 'var(--color-accent)' : file ? 'var(--color-safe)' : 'var(--color-border)'}`,
            borderRadius: '16px', padding: '32px 24px',
            background: isDragging
              ? 'color-mix(in srgb, var(--color-accent) 5%, var(--color-bg))'
              : file ? 'var(--color-safe-bg)' : 'var(--color-surface)',
            cursor: file ? 'default' : 'pointer',
            transition: 'all 0.2s',
            marginBottom: '16px',
            textAlign: 'center',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          {!file ? (
            <>
              <div style={{
                width: '56px', height: '56px', borderRadius: '14px',
                background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
              }}>
                <Upload size={24} color="var(--color-accent)" />
              </div>
              <p style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 700 }}>
                Déposez votre devis ici
              </p>
              <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--color-muted)' }}>
                ou cliquez pour sélectionner un fichier
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)' }}>
                PDF, JPG, PNG · Max 10 Mo
              </p>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
              {/* Aperçu */}
              {isPdf ? (
                <div style={{
                  width: '80px', height: '100px', borderRadius: '10px', flexShrink: 0,
                  background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}>
                  <FileText size={28} color="var(--color-accent)" />
                  <span style={{ fontSize: '10px', color: 'var(--color-muted)', fontWeight: 600 }}>PDF</span>
                </div>
              ) : (
                fileDataUrl && (
                  <img
                    src={fileDataUrl}
                    alt="Aperçu du devis"
                    style={{ width: '80px', height: '100px', objectFit: 'cover', borderRadius: '10px', border: '1px solid var(--color-border)', flexShrink: 0 }}
                  />
                )
              )}
              <div style={{ textAlign: 'left' }}>
                <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600 }}>{file.name}</p>
                <p style={{ margin: '0 0 12px', fontSize: '12px', color: 'var(--color-muted)' }}>
                  {(file.size / 1024 / 1024).toFixed(2)} Mo · {isPdf ? 'Document PDF' : 'Image'}
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile() }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    fontSize: '12px', color: 'var(--color-muted)', background: 'none', border: 'none',
                    cursor: 'pointer', padding: '4px 8px', borderRadius: '6px',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  <X size={13} />Supprimer
                </button>
              </div>
            </div>
          )}
        </div>

        {fileError && (
          <div style={{ display: 'flex', gap: '8px', padding: '10px 12px', borderRadius: '10px', background: 'var(--color-danger-bg)', marginBottom: '12px' }}>
            <AlertTriangle size={15} color="var(--color-danger)" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-danger)' }}>{fileError}</p>
          </div>
        )}

        {/* Bouton Analyser */}
        <button
          onClick={handleAnalyze}
          disabled={!file || !user || isAnalyzing}
          style={{
            width: '100%', padding: '15px 20px', borderRadius: '12px', border: 'none',
            background: !file || !user ? 'var(--color-border)' : 'var(--color-text)',
            color: !file || !user ? 'var(--color-muted)' : 'var(--color-bg)',
            fontSize: '15px', fontWeight: 700, cursor: !file || !user ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            fontFamily: 'var(--font-body)', transition: 'opacity 0.2s',
            opacity: isAnalyzing ? 0.7 : 1,
          }}
        >
          {isAnalyzing ? (
            <>
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              Analyse en cours…
            </>
          ) : (
            <>
              <FileSearch size={18} />
              Analyser mon devis
              {!justPaid && user && <span style={{ fontSize: '12px', fontWeight: 500, opacity: 0.7 }}>· 1ère analyse gratuite</span>}
            </>
          )}
        </button>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        {/* Erreur */}
        {error && (
          <div style={{ display: 'flex', gap: '10px', padding: '14px 16px', borderRadius: '12px', background: 'var(--color-danger-bg)', border: '1px solid color-mix(in srgb, var(--color-danger) 20%, transparent)', marginTop: '16px' }}>
            <AlertTriangle size={16} color="var(--color-danger)" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-danger)' }}>{error}</p>
          </div>
        )}

        {/* Paiement requis */}
        {requiresPayment && checkoutUrl && (
          <div style={{
            marginTop: '16px', padding: '20px', borderRadius: '14px',
            border: '1px solid var(--color-border)', background: 'var(--color-surface)', textAlign: 'center',
          }}>
            <p style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 700 }}>Analyse supplémentaire — 9,90&nbsp;€</p>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--color-muted)' }}>
              Votre analyse gratuite a déjà été utilisée. Accédez au résultat pour 9,90&nbsp;€.
            </p>
            <a
              href={checkoutUrl}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px',
                borderRadius: '10px', background: 'var(--color-text)', color: 'var(--color-bg)',
                textDecoration: 'none', fontSize: '14px', fontWeight: 700,
              }}
            >
              Payer 9,90&nbsp;€ et analyser
            </a>
          </div>
        )}

        {/* Résultats */}
        <div ref={resultsRef}>
          {analysis && (
            <div style={{ marginTop: '36px' }}>
              <p style={{ margin: '0 0 20px', fontSize: '12px', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Résultats de l'analyse
              </p>
              <DevisAnalysisCard analysis={analysis} company={company} />
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <p style={{ margin: '32px 0 0', fontSize: '11px', color: 'var(--color-muted)', lineHeight: 1.6, padding: '12px', background: 'var(--color-bg)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
          Cette analyse est fournie à titre informatif par une intelligence artificielle. Elle ne constitue pas un avis juridique. Consultez un professionnel du droit pour toute décision importante.
        </p>

      </section>
    </main>
  )
}
