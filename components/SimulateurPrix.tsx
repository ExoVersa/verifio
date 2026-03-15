'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronRight, ChevronLeft, Loader2, AlertTriangle, CheckCircle2,
  TrendingDown, TrendingUp, Lightbulb, Search, ArrowRight,
  Layers, Home, Droplets, Zap, Grid3X3, Paintbrush, Hammer,
  Flame, Square, Bath, UtensilsCrossed, Maximize2,
} from 'lucide-react'

interface SimulateurResult {
  fourchette_basse: number
  fourchette_haute: number
  prix_moyen: number
  unite: string
  facteurs_variation: string[]
  conseils: string[]
  alerte_si_trop_bas: string
  alerte_si_trop_haut: string
}

const TYPES = [
  { id: 'Isolation', slug: 'isolation', icon: <Layers size={22} /> },
  { id: 'Toiture', slug: 'toiture', icon: <Home size={22} /> },
  { id: 'Plomberie', slug: 'plomberie', icon: <Droplets size={22} /> },
  { id: 'Électricité', slug: 'electricite', icon: <Zap size={22} /> },
  { id: 'Carrelage', slug: 'carrelage', icon: <Grid3X3 size={22} /> },
  { id: 'Peinture', slug: 'peinture', icon: <Paintbrush size={22} /> },
  { id: 'Maçonnerie', slug: 'maconnerie', icon: <Hammer size={22} /> },
  { id: 'Chauffage', slug: 'chauffage', icon: <Flame size={22} /> },
  { id: 'Fenêtres / menuiserie', slug: 'fenetres', icon: <Square size={22} /> },
  { id: 'Salle de bain', slug: 'salle-de-bain', icon: <Bath size={22} /> },
  { id: 'Cuisine', slug: 'cuisine', icon: <UtensilsCrossed size={22} /> },
  { id: 'Extension', slug: 'extension', icon: <Maximize2 size={22} /> },
]

const REGIONS = [
  'Île-de-France', 'Auvergne-Rhône-Alpes', 'Bourgogne-Franche-Comté',
  'Bretagne', 'Centre-Val de Loire', 'Corse', 'Grand Est',
  'Hauts-de-France', 'Normandie', 'Nouvelle-Aquitaine', 'Occitanie',
  'Pays de la Loire', 'Provence-Alpes-Côte d\'Azur',
  'Guadeloupe', 'Martinique', 'Guyane', 'La Réunion', 'Mayotte',
]

function formatEur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

interface Props {
  defaultType?: string
}

export default function SimulateurPrix({ defaultType }: Props) {
  const defaultTypeObj = defaultType ? TYPES.find(t => t.slug === defaultType) : null
  const [step, setStep] = useState(defaultTypeObj ? 2 : 1)
  const [selectedType, setSelectedType] = useState<string>(defaultTypeObj?.id || '')
  const [surface, setSurface] = useState('')
  const [region, setRegion] = useState('')
  const [logement, setLogement] = useState<'maison' | 'appartement'>('maison')
  const [gamme, setGamme] = useState<'economique' | 'standard' | 'premium'>('standard')
  const [devisRecu, setDevisRecu] = useState('')
  const [result, setResult] = useState<SimulateurResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEstimer = async () => {
    if (!selectedType || !surface || !region) return
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const params = new URLSearchParams({ type: selectedType, surface, region, logement, gamme })
      const res = await fetch(`/api/simulateur-prix?${params}`)
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setResult(data)
      setStep(3)
    } catch {
      setError('Erreur réseau. Réessayez.')
    } finally {
      setIsLoading(false)
    }
  }

  const reset = () => {
    setStep(1); setSelectedType(''); setSurface(''); setRegion('')
    setLogement('maison'); setGamme('standard'); setDevisRecu('')
    setResult(null); setError(null)
  }

  // Jauge
  const userDevis = devisRecu ? parseFloat(devisRecu.replace(/[^0-9.]/g, '')) : null
  const getDevisStatus = () => {
    if (!result || !userDevis) return null
    if (userDevis < result.fourchette_basse * 0.8) return 'tres_bas'
    if (userDevis < result.fourchette_basse) return 'bas'
    if (userDevis > result.fourchette_haute * 1.3) return 'tres_haut'
    if (userDevis > result.fourchette_haute) return 'haut'
    return 'normal'
  }
  const devisStatus = getDevisStatus()

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px 80px' }}>

      {/* Titre */}
      <div style={{ marginBottom: '32px' }}>
        <h1 className="font-display" style={{ margin: '0 0 10px', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, letterSpacing: '-0.03em' }}>
          Mon devis est-il au bon prix&nbsp;?
        </h1>
        <p style={{ margin: 0, fontSize: '15px', color: 'var(--color-muted)', lineHeight: 1.6 }}>
          Comparez votre devis avec les prix réels du marché français 2024-2025.
        </p>
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '32px' }}>
        {['Type de travaux', 'Détails', 'Résultat'].map((label, i) => {
          const s = i + 1
          const active = step === s
          const done = step > s
          return (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: s < 3 ? 1 : undefined }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 700,
                  background: done ? 'var(--color-safe)' : active ? 'var(--color-accent)' : 'var(--color-border)',
                  color: done || active ? 'white' : 'var(--color-muted)',
                }}>
                  {done ? '✓' : s}
                </div>
                <span style={{ fontSize: '12px', fontWeight: active ? 600 : 400, color: active ? 'var(--color-text)' : 'var(--color-muted)', whiteSpace: 'nowrap' }}>
                  {label}
                </span>
              </div>
              {s < 3 && <div style={{ flex: 1, height: '1px', background: done ? 'var(--color-safe)' : 'var(--color-border)' }} />}
            </div>
          )
        })}
      </div>

      {/* ── ÉTAPE 1 ── */}
      {step === 1 && (
        <div>
          <p style={{ margin: '0 0 20px', fontSize: '14px', fontWeight: 600 }}>Quel type de travaux ?</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
            {TYPES.map(t => (
              <button
                key={t.id}
                onClick={() => { setSelectedType(t.id); setStep(2) }}
                style={{
                  padding: '14px 12px', borderRadius: '12px', border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                  fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600,
                  color: 'var(--color-text)', transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget
                  el.style.borderColor = 'var(--color-accent)'
                  el.style.background = 'color-mix(in srgb, var(--color-accent) 6%, var(--color-surface))'
                  el.style.color = 'var(--color-accent)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget
                  el.style.borderColor = 'var(--color-border)'
                  el.style.background = 'var(--color-surface)'
                  el.style.color = 'var(--color-text)'
                }}
              >
                <div style={{ color: 'var(--color-accent)' }}>{t.icon}</div>
                {t.id}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── ÉTAPE 2 ── */}
      {step === 2 && (
        <div>
          <button onClick={() => setStep(1)} style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px', marginBottom: '20px',
            fontSize: '13px', color: 'var(--color-muted)', background: 'none', border: 'none',
            cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 0,
          }}>
            <ChevronLeft size={14} /> Retour
          </button>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 14px',
            borderRadius: '10px', background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
            border: '1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)',
            marginBottom: '24px',
          }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-accent)' }}>{selectedType}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Surface */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Surface concernée (m²) ou quantité
              </label>
              <input
                type="number"
                value={surface}
                onChange={e => setSurface(e.target.value)}
                placeholder="Ex : 80"
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: '10px', boxSizing: 'border-box',
                  border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                  fontSize: '14px', fontFamily: 'var(--font-body)', outline: 'none',
                  color: 'var(--color-text)',
                }}
              />
            </div>

            {/* Région */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Région
              </label>
              <select
                value={region}
                onChange={e => setRegion(e.target.value)}
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: '10px', boxSizing: 'border-box',
                  border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                  fontSize: '14px', fontFamily: 'var(--font-body)', outline: 'none',
                  color: region ? 'var(--color-text)' : 'var(--color-muted)', cursor: 'pointer',
                  appearance: 'none',
                }}
              >
                <option value="">Sélectionnez votre région</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {/* Logement */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                Type de logement
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {(['maison', 'appartement'] as const).map(opt => (
                  <button
                    key={opt}
                    onClick={() => setLogement(opt)}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '10px', cursor: 'pointer',
                      border: `1px solid ${logement === opt ? 'var(--color-accent)' : 'var(--color-border)'}`,
                      background: logement === opt ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)' : 'var(--color-surface)',
                      color: logement === opt ? 'var(--color-accent)' : 'var(--color-text)',
                      fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-body)',
                      textTransform: 'capitalize',
                    }}
                  >
                    {opt === 'maison' ? '🏠 Maison' : '🏢 Appartement'}
                  </button>
                ))}
              </div>
            </div>

            {/* Gamme */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                Niveau de gamme souhaité
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {([
                  { id: 'economique', label: '💰 Économique' },
                  { id: 'standard', label: '⚖️ Standard' },
                  { id: 'premium', label: '✨ Premium' },
                ] as const).map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setGamme(opt.id)}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '10px', cursor: 'pointer',
                      border: `1px solid ${gamme === opt.id ? 'var(--color-accent)' : 'var(--color-border)'}`,
                      background: gamme === opt.id ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)' : 'var(--color-surface)',
                      color: gamme === opt.id ? 'var(--color-accent)' : 'var(--color-text)',
                      fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font-body)',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Devis reçu (optionnel) */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                Vous avez déjà reçu un devis ? <span style={{ color: 'var(--color-muted)', fontWeight: 400 }}>(optionnel)</span>
              </label>
              <p style={{ margin: '0 0 8px', fontSize: '12px', color: 'var(--color-muted)' }}>
                Entrez le montant pour savoir s'il est dans la normale.
              </p>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={devisRecu}
                  onChange={e => setDevisRecu(e.target.value)}
                  placeholder="Ex : 3500"
                  style={{
                    width: '100%', padding: '11px 40px 11px 14px', borderRadius: '10px', boxSizing: 'border-box',
                    border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                    fontSize: '14px', fontFamily: 'var(--font-body)', outline: 'none',
                    color: 'var(--color-text)',
                  }}
                />
                <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: 'var(--color-muted)' }}>€</span>
              </div>
            </div>

            {error && (
              <div style={{ display: 'flex', gap: '8px', padding: '10px 12px', borderRadius: '10px', background: 'var(--color-danger-bg)' }}>
                <AlertTriangle size={15} color="var(--color-danger)" style={{ flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-danger)' }}>{error}</p>
              </div>
            )}

            <button
              onClick={handleEstimer}
              disabled={!selectedType || !surface || !region || isLoading}
              style={{
                padding: '15px 20px', borderRadius: '12px', border: 'none',
                background: !selectedType || !surface || !region ? 'var(--color-border)' : 'var(--color-text)',
                color: !selectedType || !surface || !region ? 'var(--color-muted)' : 'var(--color-bg)',
                fontSize: '15px', fontWeight: 700, cursor: !selectedType || !surface || !region ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                fontFamily: 'var(--font-body)',
              }}
            >
              {isLoading ? (
                <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />Analyse en cours…</>
              ) : (
                <><Search size={18} />Estimer le prix<ChevronRight size={16} /></>
              )}
            </button>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      )}

      {/* ── ÉTAPE 3 — RÉSULTATS ── */}
      {step === 3 && result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px',
              borderRadius: '8px', background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
            }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-accent)' }}>{selectedType} · {surface}m² · {region}</span>
            </div>
            <button onClick={reset} style={{
              fontSize: '12px', color: 'var(--color-muted)', background: 'none', border: 'none',
              cursor: 'pointer', fontFamily: 'var(--font-body)', textDecoration: 'underline',
            }}>
              Nouvelle simulation
            </button>
          </div>

          {/* Fourchette principale */}
          <div className="result-card" style={{ textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Fourchette de prix estimée
            </p>
            <p style={{ margin: '0 0 4px', fontSize: 'clamp(28px, 6vw, 44px)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--color-text)' }}>
              {formatEur(result.fourchette_basse)} — {formatEur(result.fourchette_haute)}
            </p>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--color-muted)' }}>
              Prix moyen constaté : <strong>{formatEur(result.prix_moyen)}</strong>
            </p>

            {/* Jauge visuelle */}
            <JaugeVisuelle result={result} userDevis={userDevis} />
          </div>

          {/* Comparaison devis reçu */}
          {userDevis && devisStatus && (
            <div className="result-card" style={{
              background: devisStatus === 'normal' ? 'var(--color-safe-bg)' : devisStatus === 'tres_bas' || devisStatus === 'tres_haut' ? 'var(--color-danger-bg)' : '#fffbeb',
              border: `1px solid ${devisStatus === 'normal' ? 'color-mix(in srgb, var(--color-safe) 30%, transparent)' : devisStatus === 'tres_bas' || devisStatus === 'tres_haut' ? 'color-mix(in srgb, var(--color-danger) 25%, transparent)' : '#fde68a'}`,
            }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ flexShrink: 0, marginTop: '2px' }}>
                  {devisStatus === 'normal' ? <CheckCircle2 size={20} color="var(--color-safe)" /> :
                    devisStatus === 'haut' || devisStatus === 'bas' ? <AlertTriangle size={20} color="#d97706" /> :
                    <AlertTriangle size={20} color="var(--color-danger)" />}
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700,
                    color: devisStatus === 'normal' ? 'var(--color-safe)' : devisStatus === 'tres_bas' || devisStatus === 'tres_haut' ? 'var(--color-danger)' : '#d97706',
                  }}>
                    Votre devis : {formatEur(userDevis)} —{' '}
                    {devisStatus === 'normal' && 'Dans la normale ✓'}
                    {devisStatus === 'bas' && 'Légèrement bas ⚠️'}
                    {devisStatus === 'tres_bas' && 'Très bas — méfiez-vous ⚠️'}
                    {devisStatus === 'haut' && 'Légèrement élevé ⚠️'}
                    {devisStatus === 'tres_haut' && 'Très élevé ⚠️'}
                  </p>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)', lineHeight: 1.5 }}>
                    {devisStatus === 'normal' && 'Votre devis est cohérent avec les prix du marché pour ce type de travaux.'}
                    {devisStatus === 'bas' && result.alerte_si_trop_bas}
                    {devisStatus === 'tres_bas' && result.alerte_si_trop_bas}
                    {devisStatus === 'haut' && result.alerte_si_trop_haut}
                    {devisStatus === 'tres_haut' && result.alerte_si_trop_haut}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Facteurs de variation */}
          <div className="result-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <TrendingUp size={16} color="var(--color-accent)" />
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>Facteurs qui influencent le prix</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {result.facteurs_variation.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-accent)',
                    flexShrink: 0, marginTop: '7px',
                  }} />
                  <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5 }}>{f}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Conseils */}
          <div className="result-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Lightbulb size={16} color="#d97706" />
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>Conseils pour ce type de travaux</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {result.conseils.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                    background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                    color: 'var(--color-accent)', fontSize: '11px', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1px',
                  }}>
                    {i + 1}
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6 }}>{c}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Vérifier l'artisan */}
          <div style={{
            padding: '20px 24px', borderRadius: '14px',
            background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 8%, var(--color-surface)), var(--color-surface))',
            border: '1px solid var(--color-border)',
            display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap',
          }}>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700 }}>Prêt à choisir votre artisan ?</p>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)' }}>
                Vérifiez le statut légal, la décennale et le score de confiance.
              </p>
            </div>
            <Link href="/" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '11px 20px',
              borderRadius: '10px', background: 'var(--color-text)', color: 'var(--color-bg)',
              textDecoration: 'none', fontSize: '14px', fontWeight: 700, whiteSpace: 'nowrap',
            }}>
              <Search size={15} />
              Vérifier l'artisan
              <ArrowRight size={14} />
            </Link>
          </div>

        </div>
      )}
    </div>
  )
}

// ── Composant jauge
function JaugeVisuelle({ result, userDevis }: { result: SimulateurResult; userDevis: number | null }) {
  const max = Math.max(result.fourchette_haute * 1.5, userDevis ? userDevis * 1.1 : 0)
  const lowPct = (result.fourchette_basse / max) * 100
  const highPct = (result.fourchette_haute / max) * 100
  const meanPct = (result.prix_moyen / max) * 100
  const userPct = userDevis ? Math.min((userDevis / max) * 100, 98) : null

  return (
    <div>
      <div style={{ position: 'relative', height: '28px', borderRadius: '14px', overflow: 'hidden', marginBottom: '8px' }}>
        {/* Fond rouge gauche */}
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${lowPct}%`, background: '#fee2e2' }} />
        {/* Zone verte (normale) */}
        <div style={{ position: 'absolute', left: `${lowPct}%`, top: 0, height: '100%', width: `${highPct - lowPct}%`, background: '#dcfce7' }} />
        {/* Fond orange droite */}
        <div style={{ position: 'absolute', left: `${highPct}%`, top: 0, height: '100%', width: `${100 - highPct}%`, background: '#fef3c7' }} />
        {/* Marqueur prix moyen */}
        <div style={{
          position: 'absolute', left: `${meanPct}%`, top: '4px', height: 'calc(100% - 8px)',
          width: '2px', background: 'var(--color-accent)', transform: 'translateX(-50%)',
          borderRadius: '1px',
        }} />
        {/* Marqueur devis utilisateur */}
        {userPct !== null && (
          <div style={{
            position: 'absolute', left: `${userPct}%`, top: 0, height: '100%',
            width: '3px', background: '#1d4ed8', transform: 'translateX(-50%)',
            borderRadius: '2px',
          }} />
        )}
      </div>

      {/* Légende */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-muted)', marginBottom: '8px' }}>
        <span style={{ color: '#ef4444', fontWeight: 600 }}>Trop bas</span>
        <span style={{ color: '#16a34a', fontWeight: 600 }}>Zone normale</span>
        <span style={{ color: '#d97706', fontWeight: 600 }}>Élevé</span>
      </div>

      {/* Labels */}
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', fontSize: '11px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '10px', height: '3px', background: 'var(--color-accent)', borderRadius: '2px', display: 'inline-block' }} />
          Prix moyen ({formatEur(result.prix_moyen)})
        </span>
        {userDevis && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '3px', background: '#1d4ed8', borderRadius: '2px', display: 'inline-block' }} />
            Votre devis ({formatEur(userDevis)})
          </span>
        )}
      </div>
    </div>
  )
}
