'use client'

import { useState, useEffect } from 'react'
import {
  CheckCircle2, Circle, Download, Share2, ClipboardCheck,
  ShieldCheck, Hammer, Camera, FileSignature, Flag,
  CheckCheck, AlertTriangle,
} from 'lucide-react'

interface CheckItem {
  id: string
  label: string
  tip?: string
}

interface Phase {
  id: string
  number: number
  title: string
  subtitle: string
  icon: React.ReactNode
  color: string
  bg: string
  items: CheckItem[]
}

const PHASES: Phase[] = [
  {
    id: 'phase1',
    number: 1,
    title: 'Avant de signer',
    subtitle: 'Vérifications essentielles avant tout engagement contractuel.',
    icon: <ShieldCheck size={18} />,
    color: '#2563eb',
    bg: '#eff6ff',
    items: [
      { id: 'p1-1', label: 'Vérifier le SIRET sur Verifio', tip: 'Contrôlez le statut, l\'ancienneté, les certifications RGE et l\'absence de procédure collective.' },
      { id: 'p1-2', label: 'Demander 3 devis minimum', tip: 'Comparer plusieurs offres vous protège d\'une surfacturation et vous donne un levier de négociation.' },
      { id: 'p1-3', label: 'Vérifier que le devis contient toutes les mentions légales', tip: 'Nom, SIRET, adresse, désignation précise des travaux, prix unitaires, délai d\'exécution, conditions de paiement.' },
      { id: 'p1-4', label: 'Demander l\'attestation décennale', tip: 'L\'assurance décennale est obligatoire pour tous les travaux de construction. Vérifiez sa validité et qu\'elle couvre bien le type de travaux.' },
      { id: 'p1-5', label: 'Vérifier que l\'acompte ne dépasse pas 30 %', tip: 'Au-delà de 30 % avant début des travaux, vous prenez un risque financier important en cas de défaillance.' },
      { id: 'p1-6', label: 'Délai de rétractation 14 jours mentionné', tip: 'Pour les contrats signés à domicile ou hors établissement, vous disposez de 14 jours pour vous rétracter sans frais.' },
      { id: 'p1-7', label: 'Ne jamais payer en espèces', tip: 'Le paiement en espèces ne laisse aucune trace et vous prive de tout recours en cas de litige.' },
    ],
  },
  {
    id: 'phase2',
    number: 2,
    title: 'Au démarrage',
    subtitle: 'Sécurisez le début du chantier avec les bons réflexes.',
    icon: <Camera size={18} />,
    color: '#7c3aed',
    bg: '#f5f3ff',
    items: [
      { id: 'p2-1', label: 'Prendre des photos de l\'état initial', tip: 'Documentez l\'état de votre logement avant le début des travaux : sols, murs, mobilier, réseaux apparents.' },
      { id: 'p2-2', label: 'Conserver tous les documents signés', tip: 'Devis signé, contrat, bon de commande : gardez les originaux dans un dossier dédié.' },
      { id: 'p2-3', label: 'Vérifier que les matériaux livrés correspondent au devis', tip: 'Contrôlez les marques, références et quantités des matériaux à leur livraison. Tout écart doit être signalé immédiatement.' },
      { id: 'p2-4', label: 'Ne pas payer plus de 30 % avant début des travaux', tip: 'Attendez que le chantier soit réellement démarré avant tout versement complémentaire.' },
    ],
  },
  {
    id: 'phase3',
    number: 3,
    title: 'Pendant les travaux',
    subtitle: 'Restez vigilant tout au long du chantier.',
    icon: <Hammer size={18} />,
    color: '#d97706',
    bg: '#fffbeb',
    items: [
      { id: 'p3-1', label: 'Faire des points réguliers avec l\'artisan', tip: 'Une communication régulière prévient les malentendus et permet d\'identifier rapidement les problèmes.' },
      { id: 'p3-2', label: 'Photographier l\'avancement', tip: 'Constituez un journal photo daté : il est précieux en cas de litige sur la qualité des travaux.' },
      { id: 'p3-3', label: 'Tout changement = avenant écrit signé', tip: 'Aucune modification, même mineure, ne doit rester orale. Un avenant précise les nouvelles prestations et leur coût.' },
      { id: 'p3-4', label: 'Ne jamais payer 100 % avant réception', tip: 'Le solde final ne doit être versé qu\'après la réception des travaux et la levée des éventuelles réserves.' },
    ],
  },
  {
    id: 'phase4',
    number: 4,
    title: 'À la réception',
    subtitle: 'La réception est un acte juridique crucial : ne la bâclez pas.',
    icon: <Flag size={18} />,
    color: '#16a34a',
    bg: '#f0fdf4',
    items: [
      { id: 'p4-1', label: 'Procès-verbal de réception écrit', tip: 'La réception doit être constatée par écrit (PV de réception). Elle déclenche les garanties légales.' },
      { id: 'p4-2', label: 'Lister toutes les réserves par écrit', tip: 'Mentionnez chaque défaut, malfaçon ou travail non conforme. Les réserves doivent être précises et datées.' },
      { id: 'p4-3', label: 'Ne libérer le solde qu\'après levée des réserves', tip: 'Retenez le solde (5 à 10 %) jusqu\'à correction des défauts constatés. C\'est votre principal levier.' },
      { id: 'p4-4', label: 'Conserver tous les documents 10 ans', tip: 'Devis, factures, PV de réception, garanties, notices techniques : conservez tout pendant la durée de la garantie décennale.' },
    ],
  },
]

const STORAGE_KEY = 'verifio_guide_chantier_v1'

function loadChecked(): Record<string, boolean> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveChecked(checked: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checked))
  } catch {}
}

function loadArtisanName(): string {
  if (typeof window === 'undefined') return ''
  try {
    return localStorage.getItem(STORAGE_KEY + '_artisan') || ''
  } catch {
    return ''
  }
}

function saveArtisanName(name: string) {
  try {
    if (name) localStorage.setItem(STORAGE_KEY + '_artisan', name)
    else localStorage.removeItem(STORAGE_KEY + '_artisan')
  } catch {}
}

const ALL_ITEMS = PHASES.flatMap((p) => p.items)
const TOTAL = ALL_ITEMS.length

export default function GuideChantier({ initialArtisan }: { initialArtisan?: string }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [artisanName, setArtisanName] = useState(initialArtisan || '')
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied] = useState(false)
  const [expandedTips, setExpandedTips] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const stored = loadChecked()
    setChecked(stored)
    if (!initialArtisan) {
      setArtisanName(loadArtisanName())
    }
    setMounted(true)
  }, [initialArtisan])

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      saveChecked(next)
      return next
    })
  }

  const handleArtisanChange = (name: string) => {
    setArtisanName(name)
    saveArtisanName(name)
  }

  const toggleTip = (id: string) => {
    setExpandedTips((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const doneCount = mounted ? Object.values(checked).filter(Boolean).length : 0
  const percent = Math.round((doneCount / TOTAL) * 100)

  const phaseProgress = (phase: Phase) => {
    if (!mounted) return { done: 0, total: phase.items.length }
    const done = phase.items.filter((item) => checked[item.id]).length
    return { done, total: phase.items.length }
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Guide chantier — ArtisanCheck', url })
        return
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const handlePrint = () => window.print()

  const resetAll = () => {
    setChecked({})
    saveChecked({})
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px 60px' }}>

      {/* TITRE */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ClipboardCheck size={18} color="#2563eb" />
          </div>
          <h1 className="font-display" style={{ margin: 0, fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Guide de suivi de chantier
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-muted)', lineHeight: 1.6 }}>
          Votre checklist complète pour suivre vos travaux sereinement, de la signature au solde final.
        </p>
      </div>

      {/* ARTISAN PRÉ-REMPLI */}
      <div style={{ marginBottom: '24px', padding: '14px 16px', borderRadius: '12px', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
          Artisan concerné (optionnel)
        </label>
        <input
          type="text"
          value={artisanName}
          onChange={(e) => handleArtisanChange(e.target.value)}
          placeholder="Nom de l'artisan ou de l'entreprise"
          style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '9px 12px', fontSize: '14px', fontFamily: 'var(--font-body)', background: 'var(--color-bg)', color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box' }}
        />
        {artisanName && (
          <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--color-muted)' }}>
            Suivi pour : <strong>{artisanName}</strong>
          </p>
        )}
      </div>

      {/* PROGRESSION GLOBALE */}
      <div style={{ marginBottom: '28px', padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Progression globale</p>
            <p className="font-display" style={{ margin: '2px 0 0', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.03em', color: percent === 100 ? 'var(--color-safe)' : 'var(--color-text)' }}>
              {mounted ? `${doneCount} / ${TOTAL}` : `0 / ${TOTAL}`}
            </p>
          </div>
          <div style={{ position: 'relative', width: '64px', height: '64px' }}>
            <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="32" cy="32" r="26" fill="none" stroke="var(--color-border)" strokeWidth="6" />
              <circle
                cx="32" cy="32" r="26" fill="none"
                stroke={percent === 100 ? 'var(--color-safe)' : percent > 50 ? '#f59e0b' : 'var(--color-accent)'}
                strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 26}`}
                strokeDashoffset={`${2 * Math.PI * 26 * (1 - percent / 100)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.4s ease' }}
              />
            </svg>
            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: percent === 100 ? 'var(--color-safe)' : 'var(--color-text)' }}>
              {percent}%
            </span>
          </div>
        </div>
        <div style={{ height: '8px', borderRadius: '100px', background: 'var(--color-border)', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: '100px', background: percent === 100 ? 'var(--color-safe)' : percent > 50 ? '#f59e0b' : 'var(--color-accent)', width: `${percent}%`, transition: 'width 0.4s ease' }} />
        </div>
        {percent === 100 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', padding: '10px 12px', borderRadius: '10px', background: 'var(--color-safe-bg)' }}>
            <CheckCheck size={15} color="var(--color-safe)" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-safe)' }}>Chantier 100 % suivi — Félicitations !</span>
          </div>
        )}
        {/* Mini progression par phase */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '14px' }}>
          {PHASES.map((phase) => {
            const { done, total } = phaseProgress(phase)
            const pct = Math.round((done / total) * 100)
            return (
              <div key={phase.id} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: phase.color, fontWeight: 700, marginBottom: '4px' }}>Phase {phase.number}</div>
                <div style={{ height: '4px', borderRadius: '100px', background: 'var(--color-border)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: '100px', background: phase.color, width: `${pct}%`, transition: 'width 0.4s ease' }} />
                </div>
                <div style={{ fontSize: '10px', color: 'var(--color-muted)', marginTop: '3px' }}>{done}/{total}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* PHASES */}
      {PHASES.map((phase) => {
        const { done, total } = phaseProgress(phase)
        const allDone = done === total
        return (
          <div key={phase.id} style={{ marginBottom: '20px', border: `1px solid ${allDone ? 'color-mix(in srgb, ' + phase.color + ' 30%, transparent)' : 'var(--color-border)'}`, borderRadius: '16px', overflow: 'hidden', transition: 'border-color 0.3s' }}>
            {/* Phase header */}
            <div style={{ padding: '16px 20px', background: allDone ? phase.bg : 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: allDone ? 'white' : phase.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: phase.color }}>
                {phase.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: phase.color }}>Phase {phase.number}</span>
                  {allDone && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: phase.bg, color: phase.color }}>
                    <CheckCircle2 size={10} />Complète
                  </span>}
                </div>
                <p className="font-display" style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 700, letterSpacing: '-0.01em' }}>{phase.title}</p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--color-muted)', lineHeight: 1.5 }}>{phase.subtitle}</p>
              </div>
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                <span style={{ fontSize: '18px', fontWeight: 800, color: allDone ? phase.color : 'var(--color-muted)', fontFamily: 'var(--font-display)' }}>{done}/{total}</span>
              </div>
            </div>
            {/* Items */}
            <div style={{ background: 'var(--color-bg)' }}>
              {phase.items.map((item, i) => {
                const isChecked = mounted && !!checked[item.id]
                const isLast = i === phase.items.length - 1
                const tipOpen = !!expandedTips[item.id]
                return (
                  <div key={item.id} style={{ borderBottom: isLast ? 'none' : '1px solid var(--color-border)' }}>
                    <div
                      style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 20px', cursor: 'pointer', background: isChecked ? 'color-mix(in srgb, ' + phase.color + ' 4%, transparent)' : 'transparent', transition: 'background 0.2s' }}
                      onClick={() => toggle(item.id)}
                    >
                      <div style={{ flexShrink: 0, marginTop: '1px', color: isChecked ? phase.color : 'var(--color-muted)', transition: 'color 0.2s' }}>
                        {isChecked ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: isChecked ? 500 : 600, color: isChecked ? 'var(--color-muted)' : 'var(--color-text)', textDecoration: isChecked ? 'line-through' : 'none', transition: 'all 0.2s', lineHeight: 1.4 }}>
                          {item.label}
                        </p>
                        {tipOpen && item.tip && (
                          <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--color-muted)', lineHeight: 1.6, background: 'var(--color-surface)', padding: '8px 10px', borderRadius: '8px', borderLeft: `3px solid ${phase.color}` }}>
                            {item.tip}
                          </p>
                        )}
                      </div>
                      {item.tip && (
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleTip(item.id) }}
                          style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--color-muted)', display: 'flex', alignItems: 'center' }}
                          title="Pourquoi c'est important ?"
                        >
                          <AlertTriangle size={14} color={tipOpen ? phase.color : undefined} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* ACTIONS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
        <button
          onClick={handleShare}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '14px 20px', borderRadius: '12px', border: '1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)', background: 'color-mix(in srgb, var(--color-accent) 8%, transparent)', color: 'var(--color-accent)', fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'opacity 0.2s' }}
        >
          <Share2 size={16} />
          {copied ? 'Lien copié !' : 'Partager cette checklist'}
        </button>
        <button
          onClick={handlePrint}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '14px 20px', borderRadius: '12px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
        >
          <Download size={16} />
          Télécharger en PDF
        </button>
        {mounted && doneCount > 0 && (
          <button
            onClick={resetAll}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', border: 'none', background: 'none', color: 'var(--color-muted)', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
          >
            Réinitialiser la checklist
          </button>
        )}
      </div>

      {/* DISCLAIMER */}
      <p style={{ marginTop: '28px', fontSize: '11px', color: 'var(--color-muted)', lineHeight: 1.6, padding: '12px', background: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
        Ce guide est fourni à titre informatif. Il ne constitue pas un avis juridique. En cas de litige, consultez un avocat spécialisé ou contactez une association de défense des consommateurs (DGCCRF, associations UFC-Que Choisir, etc.).
      </p>

      <style>{`
        @media print {
          header, footer, button, a[href] { display: none !important; }
          body { background: white; }
          .result-card { box-shadow: none; border: 1px solid #ddd; }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
