'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Search, ShieldCheck, AlertTriangle, History, LogOut, LogIn,
  CheckCircle2, Leaf, Scale, Clock, Users, TrendingDown, Lock,
  Star, ChevronRight, Quote, FileSearch,
} from 'lucide-react'
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
  const resultsRef = useRef<HTMLDivElement>(null)

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
      user_id: user.id, siret: data.siret, nom: data.nom, score: data.score, statut: data.statut,
    })
  }

  const handleSearch = async (query: string) => {
    setLoading(true)
    setError(null)
    setResult(null)
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
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

  const showLanding = !result && !loading && !error

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>

      {/* ── HEADER ── */}
      <header style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button onClick={() => { setResult(null); setError(null) }} style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        }}>
          <ShieldCheck size={22} color="var(--color-accent)" strokeWidth={2} />
          <span className="font-display" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-accent)' }}>
            ArtisanCheck
          </span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/analyser-devis" style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '13px', color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600,
            background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
            padding: '6px 12px', borderRadius: '8px',
            border: '1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)',
          }}>
            <FileSearch size={15} />
            Analyser un devis
          </Link>
          {user ? (
            <>
              <Link href="/historique" style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '13px', color: 'var(--color-muted)', textDecoration: 'none', fontWeight: 500,
              }}>
                <History size={15} />
                Historique
              </Link>
              <button onClick={() => supabase.auth.signOut()} style={{
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

      {/* ── HERO ── */}
      <section style={{
        background: showLanding
          ? 'linear-gradient(170deg, color-mix(in srgb, var(--color-accent) 6%, var(--color-bg)) 0%, var(--color-bg) 70%)'
          : 'var(--color-bg)',
        padding: showLanding ? '72px 24px 64px' : '40px 24px 24px',
        borderBottom: showLanding ? '1px solid var(--color-border)' : 'none',
        transition: 'padding 0.3s ease',
      }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>

          {showLanding && (
            <div className="fade-up" style={{ textAlign: 'center', marginBottom: '48px' }}>
              {/* Badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                fontSize: '12px', fontWeight: 600, color: 'var(--color-accent)',
                background: 'var(--color-safe-bg)', padding: '5px 14px', borderRadius: '20px',
                marginBottom: '28px',
                border: '1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)',
              }}>
                <ShieldCheck size={13} />
                Données 100% officielles — INSEE · ADEME · BODACC · INPI
              </div>

              <h1 className="font-display" style={{
                fontSize: 'clamp(34px, 7vw, 58px)',
                fontWeight: 800, lineHeight: 1.05,
                margin: '0 0 20px',
                letterSpacing: '-0.03em',
              }}>
                Vérifiez votre artisan<br />
                <span style={{ color: 'var(--color-accent)' }}>avant de signer.</span>
              </h1>

              <p style={{
                fontSize: '18px', color: 'var(--color-muted)', lineHeight: 1.65,
                maxWidth: '480px', margin: '0 auto 44px',
              }}>
                En 30 secondes, obtenez un score de confiance basé sur 5 sources officielles.<br />
                <strong style={{ color: 'var(--color-text)' }}>Gratuit, sans inscription.</strong>
              </p>

              {/* Chiffres clés */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px',
                maxWidth: '520px', margin: '0 auto',
              }}>
                {[
                  { value: '26 000', label: 'signalements d\'arnaques', sub: 'en 2024 (DGCCRF)' },
                  { value: '34%', label: 'des foyers touchés', sub: 'par au moins 1 malfaçon' },
                  { value: '20 000€', label: 'perte moyenne', sub: 'par sinistre non couvert' },
                ].map(({ value, label, sub }) => (
                  <div key={value} style={{
                    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                    borderRadius: '14px', padding: '16px 12px',
                  }}>
                    <p style={{ margin: '0 0 4px', fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-danger)' }}>
                      {value}
                    </p>
                    <p style={{ margin: '0 0 2px', fontSize: '12px', fontWeight: 600, lineHeight: 1.3 }}>{label}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-muted)' }}>{sub}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Barre de recherche principale */}
          <div className={showLanding ? 'fade-up fade-up-delay-1' : ''}>
            <SearchBar onSearch={handleSearch} loading={loading} />
          </div>

          {showLanding && (
            <div className="fade-up fade-up-delay-2" style={{
              display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap', justifyContent: 'center',
            }}>
              <span style={{ fontSize: '12px', color: 'var(--color-muted)', alignSelf: 'center' }}>Ex :</span>
              {['Plomberie Martin SARL', '82312345600018', 'Élec Dupont'].map((ex) => (
                <button key={ex} onClick={() => handleSearch(ex)} style={{
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                  borderRadius: '20px', padding: '5px 12px', fontSize: '12px',
                  color: 'var(--color-muted)', cursor: 'pointer', fontFamily: 'var(--font-body)',
                }}>
                  {ex}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── ZONE RÉSULTATS ── */}
      <div ref={resultsRef}>
        {error && (
          <section style={{ maxWidth: '680px', margin: '0 auto', padding: '20px 24px' }}>
            <div className="fade-up" style={{
              padding: '16px', background: 'var(--color-danger-bg)', borderRadius: '12px',
              display: 'flex', gap: '10px', alignItems: 'flex-start',
            }}>
              <AlertTriangle size={18} color="var(--color-danger)" style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-danger)' }}>{error}</p>
            </div>
          </section>
        )}

        {loading && (
          <section style={{ maxWidth: '680px', margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
            <div style={{
              width: '40px', height: '40px',
              border: '3px solid var(--color-border)', borderTopColor: 'var(--color-accent)',
              borderRadius: '50%', margin: '0 auto 16px',
              animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{ color: 'var(--color-muted)', fontSize: '14px' }}>Vérification en cours…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </section>
        )}

        {result && !loading && (
          <section style={{ maxWidth: '680px', margin: '0 auto', padding: '28px 24px 60px' }}>
            <div className="fade-up">
              <ResultCard result={result} />
            </div>
          </section>
        )}
      </div>

      {/* ══════════════════════════════════════════
          SECTIONS MARKETING
      ══════════════════════════════════════════ */}
      {showLanding && (
        <>

          {/* ── COMMENT ÇA MARCHE ── */}
          <section style={{ padding: '80px 24px', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}>
            <div style={{ maxWidth: '720px', margin: '0 auto' }}>
              <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' }}>Simple & rapide</p>
              <h2 className="font-display" style={{ margin: '0 0 48px', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, letterSpacing: '-0.02em', textAlign: 'center' }}>
                Comment ça marche
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px' }}>
                {[
                  { step: '01', icon: <Search size={22} />, title: 'Entrez le nom ou SIRET', desc: 'Nom de l\'entreprise, du gérant ou numéro SIRET à 14 chiffres.' },
                  { step: '02', icon: <ShieldCheck size={22} />, title: 'On vérifie 5 sources officielles', desc: 'INSEE, ADEME, BODACC, INPI et registre des procédures collectives.' },
                  { step: '03', icon: <Star size={22} />, title: 'Obtenez le score de confiance', desc: 'Un score sur 100 avec les alertes clés pour prendre la bonne décision.' },
                ].map(({ step, icon, title, desc }) => (
                  <div key={step} style={{
                    background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                    borderRadius: '16px', padding: '24px 20px',
                    display: 'flex', flexDirection: 'column', gap: '14px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '12px',
                        background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--color-accent)', flexShrink: 0,
                      }}>
                        {icon}
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-muted)', letterSpacing: '0.05em' }}>ÉTAPE {step}</span>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 700, letterSpacing: '-0.01em' }}>{title}</p>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)', lineHeight: 1.6 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── CE QU'ON VÉRIFIE ── */}
          <section style={{ padding: '80px 24px', background: 'var(--color-bg)', borderTop: '1px solid var(--color-border)' }}>
            <div style={{ maxWidth: '720px', margin: '0 auto' }}>
              <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' }}>5 sources officielles</p>
              <h2 className="font-display" style={{ margin: '0 0 12px', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, letterSpacing: '-0.02em', textAlign: 'center' }}>
                Ce qu'on vérifie
              </h2>
              <p style={{ margin: '0 0 48px', fontSize: '15px', color: 'var(--color-muted)', textAlign: 'center', lineHeight: 1.6 }}>
                Chaque rapport gratuit inclut ces 6 vérifications en temps réel.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                {[
                  { icon: <CheckCircle2 size={18} />, color: 'var(--color-safe)', bg: 'var(--color-safe-bg)', title: 'Statut légal', source: 'INSEE Sirene', desc: 'Entreprise active, fermée ou en cessation d\'activité.', free: true },
                  { icon: <Leaf size={18} />, color: 'var(--color-safe)', bg: 'var(--color-safe-bg)', title: 'Certifications RGE', source: 'ADEME', desc: 'Reconnu Garant de l\'Environnement — obligatoire pour les aides État.', free: true },
                  { icon: <TrendingDown size={18} />, color: 'var(--color-danger)', bg: 'var(--color-danger-bg)', title: 'Procédures judiciaires', source: 'BODACC', desc: 'Redressement, liquidation, conciliation détectés.', free: true },
                  { icon: <Users size={18} />, color: '#f59e0b', bg: 'color-mix(in srgb, #f59e0b 12%, transparent)', title: 'Dirigeants & historique', source: 'RNE / INPI', desc: 'Identité complète des gérants, présidents et associés.', free: false },
                  { icon: <Clock size={18} />, color: '#6366f1', bg: 'color-mix(in srgb, #6366f1 12%, transparent)', title: 'Annonces légales', source: 'BODACC complet', desc: 'Toutes les publications officielles depuis la création.', free: false },
                  { icon: <Scale size={18} />, color: 'var(--color-accent)', bg: 'color-mix(in srgb, var(--color-accent) 12%, transparent)', title: 'Score de confiance', source: '0 → 100', desc: 'Score calculé en temps réel sur la base de tous les indicateurs.', free: true },
                ].map(({ icon, color, bg, title, source, desc, free }) => (
                  <div key={title} style={{
                    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                    borderRadius: '14px', padding: '18px 16px',
                    display: 'flex', flexDirection: 'column', gap: '10px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px', background: bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color, flexShrink: 0,
                      }}>
                        {icon}
                      </div>
                      <span style={{
                        fontSize: '10px', fontWeight: 700,
                        color: free ? 'var(--color-safe)' : 'var(--color-muted)',
                        background: free ? 'var(--color-safe-bg)' : 'var(--color-bg)',
                        border: `1px solid ${free ? 'color-mix(in srgb, var(--color-safe) 30%, transparent)' : 'var(--color-border)'}`,
                        padding: '3px 8px', borderRadius: '20px',
                        display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap',
                      }}>
                        {!free && <Lock size={9} />}
                        {free ? 'Gratuit' : 'Rapport'}
                      </span>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 600 }}>{title}</p>
                      <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 600, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{source}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)', lineHeight: 1.5 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── ANALYSER UN DEVIS ── */}
          <section style={{ padding: '80px 24px', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}>
            <div style={{ maxWidth: '720px', margin: '0 auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '48px', alignItems: 'center' }}>
                <div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    fontSize: '12px', fontWeight: 600, color: 'var(--color-accent)',
                    background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
                    padding: '5px 14px', borderRadius: '20px', marginBottom: '20px',
                    border: '1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)',
                  }}>
                    <FileSearch size={13} />
                    Nouveau — Analyse IA
                  </div>
                  <h2 className="font-display" style={{ margin: '0 0 16px', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, letterSpacing: '-0.02em' }}>
                    Votre devis est-il<br />
                    <span style={{ color: 'var(--color-accent)' }}>vraiment conforme ?</span>
                  </h2>
                  <p style={{ margin: '0 0 28px', fontSize: '15px', color: 'var(--color-muted)', lineHeight: 1.7 }}>
                    Déposez votre devis (PDF ou photo) et notre IA analyse en 30 secondes les 9 mentions légales obligatoires, les incohérences de prix et les signaux d'alerte.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
                    {[
                      '9 mentions légales vérifiées (SIRET, décennale, TVA…)',
                      'Alertes sur les clauses abusives',
                      'Cohérence des prix détectée par IA',
                      '1ère analyse gratuite, sans abonnement',
                    ].map(item => (
                      <div key={item} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <CheckCircle2 size={16} color="var(--color-safe)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span style={{ fontSize: '14px', lineHeight: 1.5 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/analyser-devis" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '14px 24px', borderRadius: '12px',
                    background: 'var(--color-accent)', color: 'white',
                    fontSize: '15px', fontWeight: 700, textDecoration: 'none',
                  }}>
                    <FileSearch size={18} />
                    Analyser mon devis gratuitement
                    <ChevronRight size={16} />
                  </Link>
                </div>
                <div style={{
                  background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                  borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '50%',
                      background: 'var(--color-safe)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: '16px', fontWeight: 800,
                    }}>72</div>
                    <div>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: 700 }}>Devis — Points de vigilance</p>
                      <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-muted)' }}>Rénovation cuisine • 4 200 €</p>
                    </div>
                  </div>
                  {[
                    { label: 'Numéro SIRET', ok: true },
                    { label: 'Assurance décennale', ok: false },
                    { label: 'TVA intracommunautaire', ok: true },
                    { label: 'Délai de rétractation 14j', ok: false },
                    { label: 'Acompte ≤ 30%', ok: true },
                    { label: 'Description des travaux', ok: true },
                  ].map(({ label, ok }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                      {ok
                        ? <CheckCircle2 size={14} color="var(--color-safe)" />
                        : <AlertTriangle size={14} color="var(--color-danger)" />
                      }
                      <span style={{ fontSize: '12px', color: ok ? 'var(--color-text)' : 'var(--color-danger)', fontWeight: ok ? 400 : 600 }}>{label}</span>
                    </div>
                  ))}
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--color-muted)', fontStyle: 'italic' }}>
                    ⚠️ 2 mentions manquantes — vérifiez avant de signer
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── TÉMOIGNAGES ── */}
          <section style={{ padding: '80px 24px', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}>
            <div style={{ maxWidth: '720px', margin: '0 auto' }}>
              <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' }}>Témoignages</p>
              <h2 className="font-display" style={{ margin: '0 0 12px', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, letterSpacing: '-0.02em', textAlign: 'center' }}>
                Ils ont évité le pire
              </h2>
              <p style={{ margin: '0 0 48px', fontSize: '15px', color: 'var(--color-muted)', textAlign: 'center', lineHeight: 1.6 }}>
                Des particuliers qui ont pris 30 secondes avant de signer.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {[
                  {
                    name: 'Sophie M.', location: 'Lyon (69)', score: 5,
                    text: 'J\'allais signer un devis de 8 000€ pour une rénovation salle de bain. ArtisanCheck m\'a montré que l\'entreprise était en liquidation judiciaire depuis 3 mois. Sauvée !',
                    tag: 'Liquidation détectée',
                    tagColor: 'var(--color-danger)',
                    tagBg: 'var(--color-danger-bg)',
                  },
                  {
                    name: 'Thierry B.', location: 'Nantes (44)', score: 5,
                    text: 'Le plombier était inconnu au SIRET qu\'il m\'avait donné. Score de 18/100. J\'ai refusé les travaux et trouvé un artisan certifié RGE avec un score de 84.',
                    tag: 'SIRET invalide',
                    tagColor: 'var(--color-danger)',
                    tagBg: 'var(--color-danger-bg)',
                  },
                  {
                    name: 'Isabelle R.', location: 'Bordeaux (33)', score: 5,
                    text: 'La société avait changé de gérant 2 fois en 6 mois — un signal d\'alerte que je n\'aurais jamais vu sans ArtisanCheck. J\'ai pu demander des garanties supplémentaires.',
                    tag: 'Changement de dirigeant',
                    tagColor: '#f59e0b',
                    tagBg: 'color-mix(in srgb, #f59e0b 12%, transparent)',
                  },
                ].map(({ name, location, score, text, tag, tagColor, tagBg }) => (
                  <div key={name} style={{
                    background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                    borderRadius: '16px', padding: '24px 20px',
                    display: 'flex', flexDirection: 'column', gap: '14px',
                  }}>
                    <Quote size={20} color="var(--color-border)" />
                    <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.7, color: 'var(--color-text)', flex: 1 }}>
                      {text}
                    </p>
                    <div>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        fontSize: '11px', fontWeight: 600, color: tagColor,
                        background: tagBg, padding: '3px 10px', borderRadius: '20px',
                        marginBottom: '12px',
                      }}>
                        <AlertTriangle size={10} />
                        {tag}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: 700 }}>{name}</p>
                          <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)' }}>{location}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {Array.from({ length: score }).map((_, i) => (
                            <Star key={i} size={13} color="#f59e0b" fill="#f59e0b" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── PRICING ── */}
          <section style={{ padding: '80px 24px', background: 'var(--color-bg)', borderTop: '1px solid var(--color-border)' }}>
            <div style={{ maxWidth: '680px', margin: '0 auto' }}>
              <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' }}>Tarif</p>
              <h2 className="font-display" style={{ margin: '0 0 48px', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, letterSpacing: '-0.02em', textAlign: 'center' }}>
                Gratuit + rapport complet à 4,90&nbsp;€
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                {/* Gratuit */}
                <div style={{
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                  borderRadius: '16px', padding: '28px 24px',
                  display: 'flex', flexDirection: 'column',
                }}>
                  <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Gratuit</p>
                  <p style={{ margin: '0 0 4px', fontSize: '38px', fontWeight: 800, letterSpacing: '-0.03em' }}>0&nbsp;€</p>
                  <p style={{ margin: '0 0 24px', fontSize: '12px', color: 'var(--color-muted)' }}>Sans inscription, sans CB</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px', flex: 1 }}>
                    {['Score de confiance /100', 'Statut légal actif / fermé', 'Certification RGE', 'Alertes procédures détectées', 'Adresse & activité principale'].map(f => (
                      <div key={f} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <CheckCircle2 size={15} color="var(--color-safe)" />
                        <span style={{ fontSize: '13px' }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{
                    width: '100%', padding: '12px', borderRadius: '10px',
                    border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                    fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
                  }}>
                    Vérifier gratuitement
                  </button>
                </div>

                {/* Rapport complet */}
                <div style={{
                  background: 'var(--color-text)', color: 'var(--color-bg)',
                  borderRadius: '16px', padding: '28px 24px',
                  display: 'flex', flexDirection: 'column',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute', top: '16px', right: '16px',
                    fontSize: '10px', fontWeight: 700, color: 'var(--color-text)',
                    background: 'var(--color-bg)', padding: '4px 10px', borderRadius: '20px',
                  }}>
                    RECOMMANDÉ
                  </div>
                  <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 700, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rapport complet</p>
                  <p style={{ margin: '0 0 4px', fontSize: '38px', fontWeight: 800, letterSpacing: '-0.03em' }}>4,90&nbsp;€</p>
                  <p style={{ margin: '0 0 24px', fontSize: '12px', opacity: 0.5 }}>Paiement unique, accès immédiat</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px', flex: 1 }}>
                    {[
                      { label: 'Tout ce qui est gratuit', included: true, base: true },
                      { label: 'Identité complète des dirigeants', included: true },
                      { label: 'Historique BODACC complet', included: true },
                      { label: 'Effectif de l\'entreprise', included: true },
                      { label: 'Synthèse IA personnalisée', included: true },
                    ].map(({ label, included, base }) => (
                      <div key={label} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <CheckCircle2 size={15} color={base ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.9)'} />
                        <span style={{ fontSize: '13px', opacity: base ? 0.5 : 1 }}>{label}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{
                    width: '100%', padding: '12px', borderRadius: '10px',
                    border: 'none', background: 'var(--color-bg)', color: 'var(--color-text)',
                    fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  }}>
                    Rechercher un artisan
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ── CTA FINAL ── */}
          <section style={{
            padding: '80px 24px',
            background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 8%, var(--color-surface)), var(--color-surface))',
            borderTop: '1px solid var(--color-border)',
          }}>
            <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
              <ShieldCheck size={40} color="var(--color-accent)" style={{ marginBottom: '20px' }} />
              <h2 className="font-display" style={{ margin: '0 0 16px', fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Vérifiez votre artisan<br />maintenant
              </h2>
              <p style={{ margin: '0 0 40px', fontSize: '16px', color: 'var(--color-muted)', lineHeight: 1.6 }}>
                30 secondes. Gratuit. Sans inscription.<br />
                Parce que 4,90€ coûte moins cher qu'une mauvaise surprise à 20 000€.
              </p>
              <SearchBar onSearch={handleSearch} loading={loading} />
            </div>
          </section>

          {/* ── FOOTER ── */}
          <footer style={{ padding: '32px 24px', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
            <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
                {['INSEE — Sirene', 'ADEME — RGE', 'BODACC', 'INPI — RNE', 'DGCCRF'].map(s => (
                  <span key={s} style={{
                    fontSize: '11px', fontWeight: 500, color: 'var(--color-muted)',
                    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                    padding: '4px 10px', borderRadius: '20px',
                  }}>
                    {s}
                  </span>
                ))}
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-muted)', lineHeight: 1.6 }}>
                ArtisanCheck n'est pas responsable des décisions prises sur la base des données affichées.
                Les données sont issues de sources publiques mises à jour quotidiennement.
              </p>
            </div>
          </footer>

        </>
      )}
    </main>
  )
}
