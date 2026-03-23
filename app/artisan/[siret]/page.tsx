'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Search, ShieldCheck, MapPin } from 'lucide-react'
import SiteHeader from '@/components/SiteHeader'
import ShareButton from '@/components/ShareButton'
import type { SearchResult } from '@/types'

interface ArtisanPublicInfo {
  verifie: boolean
  badgeActif: boolean
  nomEntreprise: string | null
  description: string | null
}

/* ─── Helpers ───────────────────────────────────────────── */
function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return dateStr
  }
}

function getYears(dateStr: string | undefined): number {
  if (!dateStr) return 0
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return 0
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365))
}

/* ─── Score Card (right column) ────────────────────────── */
function ScoreCard({
  result,
  checkoutLoading,
  onStartSerenite,
}: {
  result: SearchResult
  checkoutLoading: boolean
  onStartSerenite: () => void
}) {
  const score = result.score ?? 0
  const circumference = 2 * Math.PI * 52
  const dasharray = `${(score / 100) * circumference} ${circumference}`
  const strokeColor = score >= 70 ? '#52B788' : score >= 50 ? '#F4A261' : '#E63946'

  const breakdown = [
    { label: 'Statut légal', value: result.statut === 'actif' ? 25 : 0, max: 25 },
    { label: 'Certifications', value: result.rge?.certifie ? 18 : 10, max: 20 },
    { label: 'Ancienneté', value: Math.min(20, Math.floor(getYears(result.dateCreation) * 1.5)), max: 20 },
    { label: 'Dirigeants', value: result.dirigeants?.length > 0 ? 16 : 8, max: 20 },
    { label: 'Procédures', value: result.bodacc?.procedureCollective ? 0 : 15, max: 15 },
  ]

  let verdictText = ''
  let verdictColor = ''
  if (score >= 70) {
    verdictText = '✓ Vous pouvez avancer sereinement'
    verdictColor = '#16a34a'
  } else if (score >= 50) {
    verdictText = '⚠ Vérifications recommandées'
    verdictColor = '#d97706'
  } else {
    verdictText = '🚨 Procédez avec grande prudence'
    verdictColor = '#dc2626'
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '20px',
      padding: '28px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
      position: 'sticky',
      top: '24px',
    }}>
      {/* Score ring */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px', position: 'relative' }}>
        <svg viewBox="0 0 120 120" width="120" height="120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="#E8E3DC" strokeWidth="8" />
          <circle
            cx="60" cy="60" r="52" fill="none"
            stroke={strokeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={dasharray}
            transform="rotate(-90 60 60)"
            style={{ transition: 'stroke-dasharray 1.5s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '36px',
            color: '#1A1A1A',
            lineHeight: 1,
          }}>
            {score}
          </div>
          <div style={{ fontSize: '12px', color: '#8A8A8A' }}>/100</div>
        </div>
      </div>

      {/* Verdict */}
      <p style={{
        textAlign: 'center',
        fontSize: '13px',
        fontWeight: 700,
        color: verdictColor,
        margin: '0 0 20px',
        lineHeight: 1.4,
      }}>
        {verdictText}
      </p>

      {/* Breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
        {breakdown.map((item) => (
          <div key={item.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px', color: '#4A4A4A' }}>{item.label}</span>
              <span style={{ fontSize: '12px', color: '#8A8A8A', fontWeight: 600 }}>{item.value}/{item.max}</span>
            </div>
            <div style={{ background: '#E8E3DC', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
              <div style={{
                background: item.value / item.max >= 0.7 ? '#52B788' : item.value / item.max >= 0.4 ? '#F4A261' : '#E63946',
                height: '100%',
                width: `${(item.value / item.max) * 100}%`,
                borderRadius: '4px',
                transition: 'width 1s ease',
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          onClick={onStartSerenite}
          disabled={checkoutLoading}
          className="btn-primary"
          style={{
            width: '100%',
            justifyContent: 'center',
            opacity: checkoutLoading ? 0.7 : 1,
          }}
        >
          {checkoutLoading ? 'Redirection…' : '🛡️ Pack Sérénité — 19,90€'}
        </button>

        <button
          className="btn-secondary"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          🔔 Recevoir une alerte
        </button>

        <ShareButton
          url={typeof window !== 'undefined' ? window.location.href : `https://verifio-eight.vercel.app/artisan/${result.siret}`}
          nom={result.nom}
          score={result.score}
          statut={result.statut}
        />
      </div>
    </div>
  )
}

/* ─── Card wrapper ──────────────────────────────────────── */
function InfoCard({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '20px',
      padding: '28px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      marginBottom: '16px',
      ...style,
    }}>
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: '16px',
      color: '#1A1A1A',
      margin: '0 0 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    }}>
      {children}
    </h3>
  )
}

/* ─── Main Page ─────────────────────────────────────────── */
export default function ArtisanFichePage() {
  const params = useParams()
  const router = useRouter()
  const siret = typeof params.siret === 'string' ? params.siret : ''

  const [result, setResult] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [artisanPublic, setArtisanPublic] = useState<ArtisanPublicInfo | null>(null)

  async function startSerenite() {
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'serenite', siret, nom: result?.nom }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      alert('Erreur Stripe. Réessayez.')
    } finally {
      setCheckoutLoading(false)
    }
  }

  useEffect(() => {
    if (!siret) return
    setLoading(true)
    setError(null)
    Promise.all([
      fetch(`/api/search?q=${encodeURIComponent(siret)}`).then(r => r.json()),
      fetch(`/api/artisan/public?siret=${encodeURIComponent(siret)}`).then(r => r.json()),
    ])
      .then(([searchData, publicData]) => {
        if (searchData.error) setError(searchData.error)
        else setResult(searchData)
        if (!publicData.error) setArtisanPublic(publicData as ArtisanPublicInfo)
      })
      .catch(() => setError('Erreur réseau. Vérifiez votre connexion.'))
      .finally(() => setLoading(false))
  }, [siret])

  const score = result?.score ?? 0

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-cream)' }}>
      <SiteHeader />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* Back bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <button
            onClick={() => router.back()}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-text-muted)', fontSize: '13px', fontWeight: 500,
              padding: 0, fontFamily: 'var(--font-body)',
            }}
          >
            <ArrowLeft size={15} />
            Retour
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '80px 0', textAlign: 'center' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: '#E8F5EE', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Search size={24} color="#1B4332" style={{ animation: 'spin 1.5s linear infinite' }} />
            </div>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1A1A1A' }}>
              Analyse en cours…
            </p>
            <p style={{ margin: 0, fontSize: '14px', color: '#8A8A8A' }}>
              Interrogation de 6 sources officielles
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{
            padding: '20px 24px',
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '16px',
            color: '#dc2626',
            fontSize: '14px',
          }}>
            {error}
          </div>
        )}

        {/* Result */}
        {!loading && result && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 340px',
            gap: '24px',
            alignItems: 'start',
          }}>
            {/* ── COLONNE GAUCHE ── */}
            <div>

              {/* Header fiche */}
              <InfoCard>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '16px',
                    background: '#1B4332',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700, fontSize: '18px', color: '#D8F3DC',
                  }}>
                    {getInitials(result.nom)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h1 style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700, fontSize: 'clamp(20px, 3vw, 28px)',
                      color: '#1A1A1A', margin: '0 0 8px',
                      lineHeight: 1.2,
                    }}>
                      {result.nom}
                    </h1>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      {result.formeJuridique && (
                        <span style={{
                          background: '#F0EFE9', color: '#4A4A4A',
                          borderRadius: '100px', padding: '3px 10px',
                          fontSize: '12px', fontWeight: 500,
                        }}>
                          {result.formeJuridique}
                        </span>
                      )}
                      {result.activite && (
                        <span style={{
                          background: '#F0EFE9', color: '#4A4A4A',
                          borderRadius: '100px', padding: '3px 10px',
                          fontSize: '12px', fontWeight: 500,
                        }}>
                          {result.activite}
                        </span>
                      )}
                    </div>
                    {result.adresse && (
                      <p style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: 0, fontSize: '13px', color: '#8A8A8A' }}>
                        <MapPin size={12} /> {result.adresse}
                      </p>
                    )}
                  </div>
                </div>

                {/* Statut badge */}
                <div style={{ marginBottom: '12px' }}>
                  {result.statut === 'actif' ? (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      background: '#f0fdf4', color: '#16a34a',
                      border: '1px solid #86efac',
                      borderRadius: '8px', padding: '8px 16px',
                      fontSize: '14px', fontWeight: 700,
                    }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
                      Entreprise active
                    </span>
                  ) : (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      background: '#fef2f2', color: '#dc2626',
                      border: '1px solid #fecaca',
                      borderRadius: '8px', padding: '8px 16px',
                      fontSize: '14px', fontWeight: 700,
                    }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} />
                      Entreprise inactive
                    </span>
                  )}
                </div>

                {/* Phrase synthèse */}
                <p style={{
                  margin: 0, fontSize: '14px', color: '#4A4A4A',
                  fontStyle: 'italic', lineHeight: 1.5,
                }}>
                  {score >= 80
                    ? 'Profil solide — Aucun signal négatif détecté.'
                    : score >= 60
                    ? 'Profil correct — Quelques points à vérifier.'
                    : 'Profil préoccupant — Vérifications fortement conseillées.'}
                </p>
              </InfoCard>

              {/* Infos légales */}
              <InfoCard>
                <SectionTitle>📋 Informations légales</SectionTitle>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                }}>
                  {[
                    {
                      label: 'SIRET',
                      value: result.siret,
                      badge: { text: 'Vérifié INSEE ✓', bg: '#f0fdf4', color: '#16a34a' },
                    },
                    {
                      label: 'Date de création',
                      value: formatDate(result.dateCreation),
                      badge: getYears(result.dateCreation) > 0 ? {
                        text: `${getYears(result.dateCreation)} ans d'activité`,
                        bg: '#eff6ff', color: '#1d4ed8',
                      } : undefined,
                    },
                    result.formeJuridique ? { label: 'Forme juridique', value: result.formeJuridique } : null,
                    result.capitalSocial ? { label: 'Capital social', value: `${result.capitalSocial.toLocaleString('fr-FR')} €` } : null,
                    result.effectif ? { label: 'Effectifs', value: result.effectif } : null,
                    result.codeNaf ? { label: 'Code NAF', value: `${result.codeNaf} — ${result.activite}` } : null,
                  ].filter(Boolean).map((item, i) => (
                    item && (
                      <div key={i} style={{
                        padding: '14px 16px',
                        background: '#F8F4EF',
                        borderRadius: '12px',
                      }}>
                        <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#8A8A8A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {item.label}
                        </p>
                        <p style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 600, color: '#1A1A1A', wordBreak: 'break-all' }}>
                          {item.value}
                        </p>
                        {item.badge && (
                          <span style={{
                            display: 'inline-block',
                            background: item.badge.bg,
                            color: item.badge.color,
                            borderRadius: '20px',
                            padding: '2px 8px',
                            fontSize: '11px',
                            fontWeight: 700,
                          }}>
                            {item.badge.text}
                          </span>
                        )}
                      </div>
                    )
                  ))}
                </div>
              </InfoCard>

              {/* Certifications RGE */}
              <InfoCard>
                <SectionTitle>🌿 Certifications RGE</SectionTitle>
                {result.rge?.certifie ? (
                  <div>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      background: '#f0fdf4', color: '#16a34a',
                      border: '1px solid #86efac',
                      borderRadius: '12px', padding: '10px 18px',
                      fontSize: '14px', fontWeight: 700,
                      marginBottom: '16px',
                    }}>
                      <ShieldCheck size={18} />
                      Certifié RGE — Travaux éligibles aux aides État
                    </div>
                    {result.rge.domaines?.length > 0 && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                        {result.rge.domaines.map((d, i) => (
                          <span key={i} style={{
                            background: '#E8F5EE', color: '#1B4332',
                            borderRadius: '20px', padding: '4px 12px',
                            fontSize: '12px', fontWeight: 600,
                          }}>
                            {d}
                          </span>
                        ))}
                      </div>
                    )}
                    <a href="https://www.maprimerenov.gouv.fr" target="_blank" rel="noreferrer" style={{
                      fontSize: '13px', color: '#1B4332', fontWeight: 700, textDecoration: 'none',
                    }}>
                      Calculer mes aides →
                    </a>
                  </div>
                ) : (
                  <div>
                    <span style={{
                      display: 'inline-block',
                      background: '#F0EFE9', color: '#8A8A8A',
                      borderRadius: '12px', padding: '8px 16px',
                      fontSize: '13px', fontWeight: 600,
                      marginBottom: '10px',
                    }}>
                      Non certifié RGE
                    </span>
                    <p style={{ margin: 0, fontSize: '13px', color: '#8A8A8A', lineHeight: 1.5 }}>
                      Les aides MaPrimeRénov&apos; nécessitent un artisan RGE
                    </p>
                  </div>
                )}
              </InfoCard>

              {/* Dirigeants */}
              {result.dirigeants && result.dirigeants.length > 0 && (
                <InfoCard>
                  <SectionTitle>👤 Dirigeants</SectionTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {result.dirigeants.map((d, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '12px 16px',
                        background: '#F8F4EF',
                        borderRadius: '12px',
                      }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: '#1B4332',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '13px', fontWeight: 700, color: '#D8F3DC',
                          flexShrink: 0,
                          fontFamily: 'var(--font-display)',
                        }}>
                          {getInitials(`${d.prenoms || ''} ${d.nom}`)}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#1A1A1A' }}>
                            {d.prenoms ? `${d.prenoms} ` : ''}{d.nom}
                          </p>
                          <p style={{ margin: 0, fontSize: '12px', color: '#8A8A8A' }}>
                            {d.qualite}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </InfoCard>
              )}

              {/* Procédures judiciaires */}
              <InfoCard>
                <SectionTitle>⚖️ Procédures judiciaires</SectionTitle>
                {result.bodacc?.procedureCollective ? (
                  <div>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      background: '#fef2f2', color: '#dc2626',
                      border: '1px solid #fecaca',
                      borderRadius: '8px', padding: '8px 14px',
                      fontSize: '13px', fontWeight: 700,
                      marginBottom: '16px',
                    }}>
                      ⚠ {result.bodacc.annonces?.length || 1} procédure(s) détectée(s)
                    </div>
                    {result.bodacc.annonces?.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {result.bodacc.annonces.slice(0, 5).map((a, i) => (
                          <div key={i} style={{
                            padding: '10px 14px',
                            background: '#fef2f2',
                            borderRadius: '10px',
                            fontSize: '13px',
                            color: '#4A4A4A',
                          }}>
                            <span style={{ fontWeight: 600 }}>{a.date}</span> — {a.type}
                            {a.tribunal && <span style={{ color: '#8A8A8A' }}> · {a.tribunal}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{
                    padding: '16px',
                    background: '#f0fdf4',
                    border: '1px solid #86efac',
                    borderRadius: '12px',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    color: '#16a34a', fontSize: '14px', fontWeight: 600,
                  }}>
                    <ShieldCheck size={18} />
                    Aucune procédure judiciaire détectée
                  </div>
                )}
              </InfoCard>

              {/* Checklist */}
              <InfoCard style={{ background: '#F8F4EF' }}>
                <SectionTitle>✅ Avant de signer avec cet artisan</SectionTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    'Vérifier l\'assurance décennale',
                    'Demander le certificat RGE (si travaux éligibles)',
                    'Exiger un devis détaillé avec mentions légales',
                    'Vérifier les avis clients indépendants',
                    'Ne pas verser plus de 30% d\'acompte',
                  ].map((item, i) => (
                    <label key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      cursor: 'pointer', fontSize: '14px', color: '#1A1A1A',
                    }}>
                      <input
                        type="checkbox"
                        style={{
                          width: '18px', height: '18px',
                          accentColor: '#1B4332',
                          flexShrink: 0,
                          cursor: 'pointer',
                        }}
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </InfoCard>

              {/* Badge Verifio ou CTA inscription artisan */}
              {artisanPublic && artisanPublic.verifie && artisanPublic.badgeActif ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '16px 20px',
                  background: '#f0fdf4', border: '1px solid #86efac',
                  borderRadius: '16px',
                }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: '#1B4332',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, fontSize: '18px',
                    color: 'white',
                  }}>
                    ✓
                  </div>
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 700, color: '#14532d' }}>
                      Artisan vérifié Verifio
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#166534' }}>
                      L&apos;identité et l&apos;existence légale de cet artisan ont été vérifiées par notre équipe.
                    </p>
                  </div>
                </div>
              ) : (
                !artisanPublic?.verifie && (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: '10px',
                    padding: '14px 18px',
                    background: 'white', border: '1px solid #E8E3DC',
                    borderRadius: '14px',
                  }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#8A8A8A' }}>
                      Vous êtes {result.nom}&nbsp;?
                    </p>
                    <a
                      href="/espace-artisan"
                      style={{
                        fontSize: '13px', fontWeight: 700, color: '#1B4332',
                        textDecoration: 'none', whiteSpace: 'nowrap',
                      }}
                    >
                      Revendiquez votre fiche →
                    </a>
                  </div>
                )
              )}
            </div>

            {/* ── COLONNE DROITE ── */}
            <div>
              <ScoreCard
                result={result}
                checkoutLoading={checkoutLoading}
                onStartSerenite={startSerenite}
              />
            </div>
          </div>
        )}

        {/* Mobile: fixed bottom CTA */}
        {!loading && result && (
          <div style={{
            display: 'none',
            position: 'fixed', bottom: 0, left: 0, right: 0,
            padding: '12px 16px',
            background: 'white',
            borderTop: '1px solid #E8E3DC',
            zIndex: 100,
          }}
          className="mobile-serenite-cta"
          >
            <button
              onClick={startSerenite}
              disabled={checkoutLoading}
              style={{
                width: '100%',
                background: '#1B4332', color: 'white',
                border: 'none', borderRadius: '12px',
                padding: '14px', fontSize: '15px', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'var(--font-body)',
                opacity: checkoutLoading ? 0.7 : 1,
              }}
            >
              🛡️ Pack Sérénité — 19,90€
            </button>
          </div>
        )}
        <style>{`
          @media (max-width: 768px) {
            .mobile-serenite-cta { display: block !important; }
          }
        `}</style>
      </div>

      {/* Responsive grid override */}
      <style>{`
        @media (max-width: 900px) {
          .artisan-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  )
}
