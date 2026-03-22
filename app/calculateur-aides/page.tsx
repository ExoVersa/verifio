'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, ChevronRight, Info, CheckCircle2, Euro, Leaf, Home, ExternalLink } from 'lucide-react'
import SiteHeader from '@/components/SiteHeader'

// ── Types ───────────────────────────────────────────────────────────────────

type Categorie = 'bleu' | 'jaune' | 'violet' | 'rose' | null

interface Travail {
  id: string
  label: string
  icon: string
  desc: string
  unite: 'forfait' | 'm2' | 'unite'
  uniteLabel: string
  prixRef: number
  plafondDepense: number
  taux: { bleu: number; jaune: number; violet: number; rose: number }
  ceeEstim?: number
  ceeParUnite?: boolean
}

// ── Barèmes 2026 ────────────────────────────────────────────────────────────

// Seuils ANAH 2026 — revenus fiscaux de référence (RFR)
// Source : ANAH, arrêté du 24 mai 2023 revalorisé 2026
const SEUILS: Record<'horsIdf' | 'idf', Record<number, { bleu: number; jaune: number; violet: number }>> = {
  horsIdf: {
    1: { bleu: 17009, jaune: 21805, violet: 30549 },
    2: { bleu: 24875, jaune: 31889, violet: 44907 },
    3: { bleu: 29917, jaune: 38349, violet: 54071 },
    4: { bleu: 34948, jaune: 44802, violet: 63235 },
    5: { bleu: 40002, jaune: 51281, violet: 72400 },
    6: { bleu: 45057, jaune: 57760, violet: 81565 },
  },
  idf: {
    1: { bleu: 25714, jaune: 33167, violet: 41199 },
    2: { bleu: 37739, jaune: 48488, violet: 60546 },
    3: { bleu: 45349, jaune: 58214, violet: 72946 },
    4: { bleu: 52959, jaune: 67939, violet: 85345 },
    5: { bleu: 60570, jaune: 77664, violet: 97744 },
    6: { bleu: 68180, jaune: 87390, violet: 110143 },
  },
}

const TRAVAUX: Travail[] = [
  {
    id: 'toiture',
    label: 'Isolation de la toiture',
    icon: '🏠',
    desc: 'Combles perdus, rampants ou toiture-terrasse',
    unite: 'm2',
    uniteLabel: 'm²',
    prixRef: 45,
    plafondDepense: 200,
    taux: { bleu: 75, jaune: 60, violet: 45, rose: 30 },
    ceeEstim: 8,
    ceeParUnite: true,
  },
  {
    id: 'murs',
    label: 'Isolation des murs',
    icon: '🧱',
    desc: 'Isolation thermique par l\'extérieur (ITE) ou intérieur',
    unite: 'm2',
    uniteLabel: 'm²',
    prixRef: 130,
    plafondDepense: 150,
    taux: { bleu: 75, jaune: 60, violet: 45, rose: 25 },
    ceeEstim: 6,
    ceeParUnite: true,
  },
  {
    id: 'plancher',
    label: 'Isolation du plancher bas',
    icon: '⬇️',
    desc: 'Sous-sol, vide sanitaire, garage non chauffé',
    unite: 'm2',
    uniteLabel: 'm²',
    prixRef: 60,
    plafondDepense: 120,
    taux: { bleu: 75, jaune: 60, violet: 45, rose: 25 },
    ceeEstim: 4,
    ceeParUnite: true,
  },
  {
    id: 'fenetres',
    label: 'Fenêtres / Portes-fenêtres',
    icon: '🪟',
    desc: 'Double ou triple vitrage, Uw ≤ 1,3 W/m²K',
    unite: 'unite',
    uniteLabel: 'fenêtre(s)',
    prixRef: 600,
    plafondDepense: 700,
    taux: { bleu: 50, jaune: 40, violet: 25, rose: 0 },
    ceeEstim: 120,
    ceeParUnite: true,
  },
  {
    id: 'pac_aireau',
    label: 'Pompe à chaleur air/eau',
    icon: '🌡️',
    desc: 'Système de chauffage central haute performance',
    unite: 'forfait',
    uniteLabel: 'installation',
    prixRef: 9000,
    plafondDepense: 10000,
    taux: { bleu: 60, jaune: 50, violet: 45, rose: 40 },
    ceeEstim: 900,
  },
  {
    id: 'pac_geo',
    label: 'Pompe à chaleur géothermique',
    icon: '♨️',
    desc: 'PAC eau/eau ou sol/eau, très haute performance',
    unite: 'forfait',
    uniteLabel: 'installation',
    prixRef: 13000,
    plafondDepense: 15000,
    taux: { bleu: 60, jaune: 50, violet: 45, rose: 40 },
    ceeEstim: 1200,
  },
  {
    id: 'cet',
    label: 'Chauffe-eau thermodynamique',
    icon: '💧',
    desc: 'ECS produite par PAC, classe énergétique A+',
    unite: 'forfait',
    uniteLabel: 'installation',
    prixRef: 2800,
    plafondDepense: 4000,
    taux: { bleu: 40, jaune: 40, violet: 25, rose: 0 },
    ceeEstim: 250,
  },
  {
    id: 'biomasse',
    label: 'Chaudière à granulés (biomasse)',
    icon: '🪵',
    desc: 'Chaudière bûches, granulés ou plaquettes forestières',
    unite: 'forfait',
    uniteLabel: 'installation',
    prixRef: 9000,
    plafondDepense: 20000,
    taux: { bleu: 60, jaune: 50, violet: 45, rose: 30 },
    ceeEstim: 800,
  },
  {
    id: 'poele',
    label: 'Poêle à granulés / Insert',
    icon: '🔥',
    desc: 'Poêle ou insert biomasse, rendement ≥ 87%',
    unite: 'forfait',
    uniteLabel: 'appareil',
    prixRef: 2500,
    plafondDepense: 3000,
    taux: { bleu: 60, jaune: 50, violet: 45, rose: 30 },
    ceeEstim: 300,
  },
  {
    id: 'vmc',
    label: 'Ventilation VMC double flux',
    icon: '💨',
    desc: 'Ventilation mécanique contrôlée avec échangeur de chaleur',
    unite: 'forfait',
    uniteLabel: 'installation',
    prixRef: 3500,
    plafondDepense: 4000,
    taux: { bleu: 50, jaune: 40, violet: 30, rose: 0 },
    ceeEstim: 200,
  },
  {
    id: 'audit',
    label: 'Audit énergétique',
    icon: '📋',
    desc: 'Obligatoire avant MPR Rénovation d\'ampleur',
    unite: 'forfait',
    uniteLabel: 'audit',
    prixRef: 700,
    plafondDepense: 1000,
    taux: { bleu: 80, jaune: 80, violet: 80, rose: 50 },
  },
]

const CAT_COLORS: Record<string, { bg: string; border: string; text: string; label: string; desc: string }> = {
  bleu: {
    bg: '#eff6ff',
    border: '#bfdbfe',
    text: '#1d4ed8',
    label: 'Très modeste — Catégorie Bleu',
    desc: "Taux maximum MaPrimeRénov\u2019 \u2014 jusqu\u2019\u00e0 90% de certains travaux",
  },
  jaune: {
    bg: '#fefce8',
    border: '#fde68a',
    text: '#b45309',
    label: 'Modeste \u2014 Cat\u00e9gorie Jaune',
    desc: "Bons taux MaPrimeR\u00e9nov\u2019 \u2014 jusqu\u2019\u00e0 75% de certains travaux",
  },
  violet: {
    bg: '#f5f3ff',
    border: '#ddd6fe',
    text: '#7c3aed',
    label: 'Interm\u00e9diaire \u2014 Cat\u00e9gorie Violet',
    desc: "Taux interm\u00e9diaires MaPrimeR\u00e9nov\u2019 \u2014 jusqu\u2019\u00e0 45% de certains travaux",
  },
  rose: {
    bg: '#fff1f2',
    border: '#fecdd3',
    text: '#e11d48',
    label: 'Supérieur — Catégorie Rose',
    desc: 'Aides réduites — certains travaux non éligibles',
  },
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function getCategorie(region: 'horsIdf' | 'idf', personnes: number, revenus: number): Categorie {
  const n = Math.min(personnes, 6) as keyof typeof SEUILS['horsIdf']
  const s = SEUILS[region][n]
  if (!s) return null
  if (revenus <= s.bleu) return 'bleu'
  if (revenus <= s.jaune) return 'jaune'
  if (revenus <= s.violet) return 'violet'
  return 'rose'
}

function calcAide(travail: Travail, cat: Categorie, quantite: number): { mpr: number; cee: number } {
  if (!cat || cat === 'rose' && travail.taux.rose === 0) return { mpr: 0, cee: 0 }
  const tauxMpr = travail.taux[cat] / 100
  const depense = Math.min(travail.prixRef * quantite, travail.plafondDepense * quantite)
  const mpr = Math.round(depense * tauxMpr)
  const cee = travail.ceeEstim
    ? travail.ceeParUnite
      ? Math.round(travail.ceeEstim * quantite)
      : Math.round(travail.ceeEstim)
    : 0
  return { mpr, cee }
}

function formatEuro(n: number) {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
}

// ── Step components ─────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: number }) {
  const steps = ['Situation', 'Logement', 'Travaux', 'Résultats']
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '32px' }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: i < step ? 'var(--color-accent)' : i === step ? 'var(--color-accent)' : 'var(--color-border)',
              color: i <= step ? '#fff' : 'var(--color-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 700,
              opacity: i > step ? 0.5 : 1,
            }}>
              {i < step ? <CheckCircle2 size={14} /> : i + 1}
            </div>
            <span style={{ fontSize: '11px', fontWeight: i === step ? 700 : 500, color: i === step ? 'var(--color-text)' : 'var(--color-muted)', whiteSpace: 'nowrap' }}>
              {s}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: '2px', background: i < step ? 'var(--color-accent)' : 'var(--color-border)', margin: '0 8px', marginBottom: '20px', opacity: i >= step ? 0.4 : 1 }} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function CalculateurAidesPage() {
  // Step state
  const [step, setStep] = useState(0)

  // Step 1 — Situation
  const [region, setRegion] = useState<'horsIdf' | 'idf'>('horsIdf')
  const [personnes, setPersonnes] = useState(2)
  const [revenus, setRevenus] = useState('')

  // Step 2 — Logement
  const [anneeConstruction, setAnneeConstruction] = useState('')
  const [surfaceHabitable, setSurfaceHabitable] = useState('')
  const [typeLogement, setTypeLogement] = useState<'maison' | 'appartement'>('maison')

  // Step 3 — Travaux
  const [travauxSelectionnes, setTravauxSelectionnes] = useState<Record<string, number>>({})

  // Computed
  const revenuNum = parseFloat(revenus.replace(/\s/g, '')) || 0
  const categorie = step >= 1 ? getCategorie(region, personnes, revenuNum) : null

  const toggleTravail = (id: string) => {
    setTravauxSelectionnes(prev => {
      if (id in prev) {
        const next = { ...prev }
        delete next[id]
        return next
      }
      const t = TRAVAUX.find(t => t.id === id)!
      return { ...prev, [id]: t.unite === 'forfait' ? 1 : (t.unite === 'm2' ? 50 : 5) }
    })
  }

  const setQuantite = (id: string, val: number) => {
    setTravauxSelectionnes(prev => ({ ...prev, [id]: Math.max(1, val) }))
  }

  // Results
  const resultats = categorie ? TRAVAUX
    .filter(t => t.id in travauxSelectionnes)
    .map(t => {
      const q = travauxSelectionnes[t.id]
      const { mpr, cee } = calcAide(t, categorie, q)
      return { travail: t, quantite: q, mpr, cee, total: mpr + cee }
    }) : []

  const totalMpr = resultats.reduce((s, r) => s + r.mpr, 0)
  const totalCee = resultats.reduce((s, r) => s + r.cee, 0)
  const total = totalMpr + totalCee

  const cat = categorie ? CAT_COLORS[categorie] : null

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <SiteHeader />

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '28px 20px 100px' }}>

        {/* Back */}
        <Link href="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          color: 'var(--color-muted)', fontSize: '13px', fontWeight: 500,
          textDecoration: 'none', marginBottom: '24px',
        }}>
          <ArrowLeft size={14} /> Retour à l'accueil
        </Link>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: 'var(--color-accent-light)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Euro size={20} color="var(--color-accent)" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'var(--color-text)' }}>
                Calculateur d&apos;aides État 2026
              </h1>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)' }}>
                MaPrimeRénov&apos; · CEE · barèmes officiels ANAH
              </p>
            </div>
          </div>
        </div>

        {/* Step indicator */}
        <StepIndicator step={step} />

        {/* ── Step 0 : Situation ── */}
        {step === 0 && (
          <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '28px 24px' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '17px', fontWeight: 700, color: 'var(--color-text)' }}>
              Votre situation fiscale
            </h2>

            {/* Région */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>
                Région du logement
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {([['horsIdf', '🗺️', 'Hors Île-de-France', 'La majorité des régions'], ['idf', '🗼', 'Île-de-France', 'Paris + petite et grande couronne']] as const).map(([val, icon, label, sub]) => (
                  <button key={val} onClick={() => setRegion(val)} style={{
                    padding: '14px', borderRadius: '12px', cursor: 'pointer', textAlign: 'left',
                    border: `2px solid ${region === val ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    background: region === val ? 'var(--color-accent-light)' : 'var(--color-surface)',
                    transition: 'all 0.12s',
                  }}>
                    <div style={{ fontSize: '20px', marginBottom: '4px' }}>{icon}</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>{label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: '2px' }}>{sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Nb personnes */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>
                Personnes dans le foyer fiscal
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <button key={n} onClick={() => setPersonnes(n)} style={{
                    width: '48px', height: '48px', borderRadius: '12px', cursor: 'pointer', fontWeight: 700,
                    fontSize: '15px', border: `2px solid ${personnes === n ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    background: personnes === n ? 'var(--color-accent-light)' : 'var(--color-surface)',
                    color: personnes === n ? 'var(--color-accent)' : 'var(--color-text)',
                    transition: 'all 0.12s',
                  }}>
                    {n}{n === 6 ? '+' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Revenus */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '4px' }}>
                Revenu fiscal de référence (RFR) du foyer
              </label>
              <p style={{ margin: '0 0 8px', fontSize: '12px', color: 'var(--color-muted)' }}>
                Ligne &quot;Revenu fiscal de référence&quot; de votre dernier avis d&apos;imposition
              </p>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  value={revenus}
                  onChange={e => setRevenus(e.target.value)}
                  placeholder="Ex : 28 000"
                  style={{
                    width: '100%', padding: '12px 48px 12px 14px',
                    border: '1.5px solid var(--color-border)', borderRadius: '10px',
                    fontSize: '15px', fontFamily: 'var(--font-body)',
                    background: 'var(--color-bg)', color: 'var(--color-text)',
                    boxSizing: 'border-box', outline: 'none',
                  }}
                />
                <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: 'var(--color-muted)', pointerEvents: 'none' }}>€/an</span>
              </div>
            </div>

            {/* Preview catégorie */}
            {revenuNum > 0 && (() => {
              const c = getCategorie(region, personnes, revenuNum)
              const info = c ? CAT_COLORS[c] : null
              if (!info) return null
              return (
                <div style={{
                  padding: '12px 14px', borderRadius: '10px',
                  background: info.bg, border: `1px solid ${info.border}`,
                  marginBottom: '20px',
                }}>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: info.text }}>{info.label}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: info.text, opacity: 0.8 }}>{info.desc}</p>
                </div>
              )
            })()}

            <button
              onClick={() => setStep(1)}
              disabled={!revenus || revenuNum <= 0}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px', cursor: revenus ? 'pointer' : 'not-allowed',
                background: revenus && revenuNum > 0 ? 'var(--color-accent)' : 'var(--color-border)',
                color: revenus && revenuNum > 0 ? '#fff' : 'var(--color-muted)',
                border: 'none', fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-body)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all 0.12s',
              }}
            >
              Suivant <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ── Step 1 : Logement ── */}
        {step === 1 && (
          <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '28px 24px' }}>
            <h2 style={{ margin: '0 0 6px', fontSize: '17px', fontWeight: 700, color: 'var(--color-text)' }}>
              Votre logement <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-muted)' }}>(facultatif)</span>
            </h2>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--color-muted)' }}>
              Ces informations affinent votre simulation mais ne sont pas obligatoires.
            </p>

            {/* Type */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>Type de logement</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {([['maison', '🏡', 'Maison individuelle'], ['appartement', '🏢', 'Appartement']] as const).map(([val, icon, label]) => (
                  <button key={val} onClick={() => setTypeLogement(val)} style={{
                    padding: '14px', borderRadius: '12px', cursor: 'pointer', textAlign: 'center',
                    border: `2px solid ${typeLogement === val ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    background: typeLogement === val ? 'var(--color-accent-light)' : 'var(--color-surface)',
                    transition: 'all 0.12s',
                  }}>
                    <div style={{ fontSize: '22px', marginBottom: '4px' }}>{icon}</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>{label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Surface + Année */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '28px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
                  Surface habitable
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    value={surfaceHabitable}
                    onChange={e => setSurfaceHabitable(e.target.value)}
                    placeholder="Ex : 85"
                    style={{
                      width: '100%', padding: '11px 42px 11px 12px',
                      border: '1.5px solid var(--color-border)', borderRadius: '10px',
                      fontSize: '14px', fontFamily: 'var(--font-body)',
                      background: 'var(--color-bg)', color: 'var(--color-text)',
                      boxSizing: 'border-box', outline: 'none',
                    }}
                  />
                  <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: 'var(--color-muted)' }}>m²</span>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
                  Année de construction
                </label>
                <input
                  type="number"
                  value={anneeConstruction}
                  onChange={e => setAnneeConstruction(e.target.value)}
                  placeholder="Ex : 1975"
                  style={{
                    width: '100%', padding: '11px 12px',
                    border: '1.5px solid var(--color-border)', borderRadius: '10px',
                    fontSize: '14px', fontFamily: 'var(--font-body)',
                    background: 'var(--color-bg)', color: 'var(--color-text)',
                    boxSizing: 'border-box', outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setStep(0)} style={{
                flex: 1, padding: '13px', borderRadius: '12px', cursor: 'pointer',
                border: '1.5px solid var(--color-border)', background: 'var(--color-surface)',
                color: 'var(--color-text)', fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-body)',
              }}>
                Retour
              </button>
              <button onClick={() => setStep(2)} style={{
                flex: 2, padding: '13px', borderRadius: '12px', cursor: 'pointer',
                background: 'var(--color-accent)', color: '#fff',
                border: 'none', fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-body)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}>
                Suivant <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2 : Travaux ── */}
        {step === 2 && (
          <div>
            {cat && (
              <div style={{
                padding: '12px 14px', borderRadius: '10px', marginBottom: '16px',
                background: cat.bg, border: `1px solid ${cat.border}`,
                display: 'flex', alignItems: 'flex-start', gap: '10px',
              }}>
                <Info size={15} color={cat.text} style={{ marginTop: '1px', flexShrink: 0 }} />
                <div>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: cat.text }}>{cat.label}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: cat.text, opacity: 0.8 }}>{cat.desc}</p>
                </div>
              </div>
            )}

            <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '24px' }}>
              <h2 style={{ margin: '0 0 6px', fontSize: '17px', fontWeight: 700, color: 'var(--color-text)' }}>
                Travaux envisagés
              </h2>
              <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--color-muted)' }}>
                Sélectionnez les travaux et ajustez les quantités.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {TRAVAUX.map(t => {
                  const selected = t.id in travauxSelectionnes
                  const q = travauxSelectionnes[t.id] || 1
                  const aide = categorie ? calcAide(t, categorie, q) : { mpr: 0, cee: 0 }
                  const taux = categorie && t.taux[categorie]
                  const nonEligible = categorie === 'rose' && t.taux.rose === 0

                  return (
                    <div key={t.id} style={{
                      borderRadius: '12px', overflow: 'hidden',
                      border: `1.5px solid ${selected ? 'var(--color-accent)' : 'var(--color-border)'}`,
                      background: selected ? 'var(--color-accent-light)' : 'var(--color-surface)',
                      opacity: nonEligible ? 0.5 : 1,
                      transition: 'all 0.12s',
                    }}>
                      <div
                        onClick={() => !nonEligible && toggleTravail(t.id)}
                        style={{ padding: '14px 16px', cursor: nonEligible ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
                      >
                        <span style={{ fontSize: '20px', flexShrink: 0 }}>{t.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>{t.label}</span>
                            {nonEligible && (
                              <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '20px', background: '#fee2e2', color: '#dc2626', fontWeight: 600 }}>Non éligible</span>
                            )}
                            {taux && !nonEligible && (
                              <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '20px', background: 'var(--color-safe-bg)', color: 'var(--color-safe)', fontWeight: 700, border: '1px solid var(--color-safe-border)' }}>
                                MPR {taux}%
                              </span>
                            )}
                          </div>
                          <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--color-muted)' }}>{t.desc}</p>
                        </div>
                        <div style={{
                          width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0,
                          border: `2px solid ${selected ? 'var(--color-accent)' : 'var(--color-border)'}`,
                          background: selected ? 'var(--color-accent)' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {selected && <CheckCircle2 size={13} color="#fff" />}
                        </div>
                      </div>

                      {/* Quantité + aide estimée */}
                      {selected && (
                        <div style={{
                          borderTop: '1px solid var(--color-border)',
                          padding: '12px 16px',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {t.unite !== 'forfait' && (
                              <>
                                <span style={{ fontSize: '12px', color: 'var(--color-muted)', fontWeight: 600 }}>Quantité :</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <button onClick={() => setQuantite(t.id, q - (t.unite === 'm2' ? 5 : 1))} style={{
                                    width: '28px', height: '28px', borderRadius: '7px', cursor: 'pointer',
                                    border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                                    fontSize: '16px', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  }}>−</button>
                                  <span style={{ fontSize: '14px', fontWeight: 700, minWidth: '40px', textAlign: 'center' }}>
                                    {q} {t.uniteLabel}
                                  </span>
                                  <button onClick={() => setQuantite(t.id, q + (t.unite === 'm2' ? 5 : 1))} style={{
                                    width: '28px', height: '28px', borderRadius: '7px', cursor: 'pointer',
                                    border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                                    fontSize: '16px', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  }}>+</button>
                                </div>
                              </>
                            )}
                            {t.unite === 'forfait' && (
                              <span style={{ fontSize: '12px', color: 'var(--color-muted)', fontWeight: 600 }}>Forfait unique</span>
                            )}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-accent)' }}>
                              ~{formatEuro(aide.mpr + aide.cee)}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--color-muted)', display: 'block' }}>MPR + CEE estimés</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                <button onClick={() => setStep(1)} style={{
                  flex: 1, padding: '13px', borderRadius: '12px', cursor: 'pointer',
                  border: '1.5px solid var(--color-border)', background: 'var(--color-surface)',
                  color: 'var(--color-text)', fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-body)',
                }}>
                  Retour
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={Object.keys(travauxSelectionnes).length === 0}
                  style={{
                    flex: 2, padding: '13px', borderRadius: '12px',
                    cursor: Object.keys(travauxSelectionnes).length > 0 ? 'pointer' : 'not-allowed',
                    background: Object.keys(travauxSelectionnes).length > 0 ? 'var(--color-accent)' : 'var(--color-border)',
                    color: Object.keys(travauxSelectionnes).length > 0 ? '#fff' : 'var(--color-muted)',
                    border: 'none', fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-body)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  }}
                >
                  Voir mes aides <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3 : Résultats ── */}
        {step === 3 && (
          <div>
            {/* Récap catégorie */}
            {cat && (
              <div style={{
                padding: '14px 16px', borderRadius: '12px', marginBottom: '16px',
                background: cat.bg, border: `1px solid ${cat.border}`,
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <Leaf size={16} color={cat.text} />
                <div>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: cat.text }}>{cat.label}</p>
                  <p style={{ margin: '1px 0 0', fontSize: '12px', color: cat.text, opacity: 0.8 }}>Barème ANAH 2026 · {region === 'idf' ? 'Île-de-France' : 'Hors Île-de-France'} · {personnes} personne{personnes > 1 ? 's' : ''}</p>
                </div>
              </div>
            )}

            {/* Total */}
            <div style={{
              background: '#1B4332', borderRadius: '16px', padding: '24px',
              marginBottom: '16px', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
            }}>
              <div>
                <p style={{ margin: 0, fontSize: '13px', color: '#86efac', fontWeight: 600 }}>
                  Aides totales estimées
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '36px', fontWeight: 900, letterSpacing: '-1px' }}>
                  ~{formatEuro(total)}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#a7f3d0' }}>
                  dont {formatEuro(totalMpr)} MaPrimeRénov&apos; + {formatEuro(totalCee)} CEE
                </p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px 18px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '11px', color: '#86efac', fontWeight: 600 }}>Travaux sélectionnés</p>
                <p style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: 800 }}>{resultats.length}</p>
              </div>
            </div>

            {/* Détail par travaux */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {resultats.map(r => (
                <div key={r.travail.id} style={{
                  background: 'var(--color-surface)', borderRadius: '12px',
                  border: '1px solid var(--color-border)', padding: '16px',
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                }}>
                  <span style={{ fontSize: '22px', flexShrink: 0, marginTop: '2px' }}>{r.travail.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>{r.travail.label}</span>
                      <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-accent)' }}>~{formatEuro(r.total)}</span>
                    </div>
                    {r.travail.unite !== 'forfait' && (
                      <p style={{ margin: '2px 0 4px', fontSize: '12px', color: 'var(--color-muted)' }}>
                        {r.quantite} {r.travail.uniteLabel}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                      {r.mpr > 0 && (
                        <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '20px', background: 'var(--color-safe-bg)', color: 'var(--color-safe)', fontWeight: 600, border: '1px solid var(--color-safe-border)' }}>
                          MPR {formatEuro(r.mpr)}
                        </span>
                      )}
                      {r.cee > 0 && (
                        <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '20px', background: '#eff6ff', color: '#1d4ed8', fontWeight: 600, border: '1px solid #bfdbfe' }}>
                          CEE ~{formatEuro(r.cee)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Info CEE */}
            <div style={{
              padding: '12px 14px', borderRadius: '10px', marginBottom: '16px',
              background: '#eff6ff', border: '1px solid #bfdbfe',
              display: 'flex', alignItems: 'flex-start', gap: '8px',
            }}>
              <Info size={14} color="#1d4ed8" style={{ marginTop: '2px', flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: '12px', color: '#1e40af' }}>
                <strong>CEE (Certificats d&apos;Économie d&apos;Énergie)</strong> : montants variables selon le fournisseur d&apos;énergie. Ces estimations correspondent à des offres courantes en 2026 — comparez les offres sur france-renov.gouv.fr.
              </p>
            </div>

            {/* Éco-PTZ info */}
            <div style={{
              background: 'var(--color-surface)', borderRadius: '12px',
              border: '1px solid var(--color-border)', padding: '16px', marginBottom: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Home size={15} color="var(--color-accent)" />
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>Éco-PTZ — Prêt à taux zéro</span>
              </div>
              <p style={{ margin: '0 0 6px', fontSize: '13px', color: 'var(--color-muted)' }}>
                Complémentaire à MaPrimeRénov&apos;. Jusqu&apos;à <strong>50 000€</strong> de prêt à 0% sur 20 ans pour financer le reste à charge, sans conditions de revenus.
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)' }}>
                À demander auprès d&apos;une banque partenaire avant le début des travaux.
              </p>
            </div>

            {/* Disclaimer */}
            <div style={{
              padding: '14px 16px', borderRadius: '12px', marginBottom: '20px',
              background: '#fffbeb', border: '1px solid #fde68a',
            }}>
              <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 700, color: '#92400e' }}>
                ⚠️ Simulation indicative — non contractuelle
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: '#78350f', lineHeight: 1.5 }}>
                Ces montants sont des estimations basées sur les barèmes ANAH 2026. L&apos;éligibilité réelle dépend de critères supplémentaires (ancienneté du logement, occupation, travaux éligibles par un artisan RGE…). Consultez un conseiller France Rénov&apos; pour une simulation officielle gratuite.
              </p>
            </div>

            {/* CTAs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a
                href="https://www.maprimerenov.gouv.fr"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '14px', borderRadius: '12px', textDecoration: 'none',
                  background: 'var(--color-accent)', color: '#fff',
                  fontSize: '15px', fontWeight: 700,
                }}
              >
                Simulation officielle MaPrimeRénov&apos; <ExternalLink size={15} />
              </a>
              <a
                href="https://france-renov.gouv.fr/aides/mpr/accompagnee"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '14px', borderRadius: '12px', textDecoration: 'none',
                  background: 'var(--color-surface)', color: 'var(--color-text)',
                  fontSize: '14px', fontWeight: 600, border: '1.5px solid var(--color-border)',
                }}
              >
                Trouver un conseiller France Rénov&apos; <ExternalLink size={14} />
              </a>
              <button
                onClick={() => { setStep(0); setTravauxSelectionnes({}) }}
                style={{
                  padding: '12px', borderRadius: '12px', cursor: 'pointer',
                  background: 'transparent', color: 'var(--color-muted)',
                  border: 'none', fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-body)',
                }}
              >
                Recommencer la simulation
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
