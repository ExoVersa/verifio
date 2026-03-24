'use client'

import { useState, useRef, useCallback } from 'react'
import SiteHeader from '@/components/SiteHeader'
import { calculateScore } from '@/lib/score'

interface CompanyResult {
  nom_complet: string
  siret: string
  siren: string
  statut_diffusion?: string
  etat_administratif?: string
  date_creation?: string
  forme_juridique?: string
  activite_principale?: string
  libelle_activite_principale?: string
  siege?: {
    siret?: string
    adresse?: string
    code_postal?: string
    libelle_commune?: string
    etat_administratif?: string
    date_creation?: string
  }
  dirigeants?: Array<{ nom?: string; prenom?: string; qualite?: string }>
  complements?: {
    convention_collective_renseignee?: boolean
    effectif_min?: number
    effectif_max?: number
    est_rge?: boolean
    liste_rge?: Array<{ domaine?: string; organisme?: string }>
  }
}

interface SearchResult {
  nom_complet: string
  siret: string
  siren: string
  etat_administratif?: string
  matching_etablissements?: Array<{ siret?: string }>
}

function computeScore(company: CompanyResult): number {
  const actif = company.etat_administratif === 'A' || company.siege?.etat_administratif === 'A'
  // BODACC non disponible depuis l'API autocomplete → critère exclu du score
  return calculateScore({
    statut: actif ? 'actif' : 'fermé',
    dateCreation: company.date_creation || company.siege?.date_creation,
    bodacc: null,
  }).score
}

function getAgeYears(dateStr?: string): number | null {
  if (!dateStr) return null
  const created = new Date(dateStr)
  if (isNaN(created.getTime())) return null
  const now = new Date()
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const FORME_JURIDIQUE_MAP: Record<string, string> = {
  'SAS': 'Société par actions simplifiée',
  'SARL': 'Société à responsabilité limitée',
  'EURL': 'Entreprise unipersonnelle à responsabilité limitée',
  'SA': 'Société anonyme',
  'SNC': 'Société en nom collectif',
  'EI': 'Entreprise individuelle',
  'SASU': 'Société par actions simplifiée unipersonnelle',
  'SCI': 'Société civile immobilière',
  'GIE': 'Groupement d\'intérêt économique',
}

function formatFormeJuridique(raw?: string): string {
  if (!raw) return '—'
  const upper = raw.toUpperCase()
  for (const [key, val] of Object.entries(FORME_JURIDIQUE_MAP)) {
    if (upper.includes(key)) return val
  }
  return raw
}

function SearchZone({
  label,
  selected,
  onSelect,
  onDeselect,
}: {
  label: string
  selected: CompanyResult | null
  onSelect: (c: CompanyResult) => void
  onDeselect: () => void
}) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) { setSuggestions([]); setOpen(false); return }
    setLoading(true)
    try {
      const res = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(q)}&per_page=5`)
      const data = await res.json()
      const results: SearchResult[] = (data.results || []).map((r: Record<string, unknown>) => ({
        nom_complet: r.nom_complet as string,
        siren: r.siren as string,
        siret: (r as { matching_etablissements?: Array<{ siret?: string }> }).matching_etablissements?.[0]?.siret || (r.siege as { siret?: string } | undefined)?.siret || '',
        etat_administratif: (r.siege as { etat_administratif?: string } | undefined)?.etat_administratif,
        matching_etablissements: (r.matching_etablissements as Array<{ siret?: string }> | undefined),
      }))
      setSuggestions(results)
      setOpen(true)
    } catch {
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300)
  }

  const handleSelect = async (s: SearchResult) => {
    setOpen(false)
    setQuery('')
    setSuggestions([])
    try {
      const res = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(s.siren)}&per_page=1`)
      const data = await res.json()
      const raw = data.results?.[0]
      if (raw) {
        const company: CompanyResult = {
          nom_complet: raw.nom_complet,
          siren: raw.siren,
          siret: raw.matching_etablissements?.[0]?.siret || raw.siege?.siret || s.siret,
          etat_administratif: raw.siege?.etat_administratif,
          date_creation: raw.date_creation || raw.siege?.date_creation,
          forme_juridique: raw.forme_juridique,
          activite_principale: raw.activite_principale,
          libelle_activite_principale: raw.libelle_activite_principale,
          siege: raw.siege,
          dirigeants: raw.dirigeants,
          complements: raw.complements,
        }
        onSelect(company)
      }
    } catch {
      onSelect({
        nom_complet: s.nom_complet,
        siren: s.siren,
        siret: s.siret,
        etat_administratif: s.etat_administratif,
      })
    }
  }

  const isActif = selected?.etat_administratif === 'A' || selected?.siege?.etat_administratif === 'A'

  return (
    <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
        {label}
      </div>
      {selected ? (
        <div style={{
          border: '1.5px solid #52B788',
          borderRadius: 12,
          padding: '12px 16px',
          background: '#f0fdf4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, color: '#1B4332', fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selected.nom_complet}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
              SIRET : {selected.siret || selected.siren}
              <span style={{
                marginLeft: 8,
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
                background: isActif ? '#dcfce7' : '#fee2e2',
                color: isActif ? '#166534' : '#991b1b',
              }}>
                {isActif ? '● ACTIF' : '✕ FERMÉ'}
              </span>
            </div>
          </div>
          <button
            onClick={onDeselect}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 18, lineHeight: 1, padding: 4 }}
            aria-label="Désélectionner"
          >
            ×
          </button>
        </div>
      ) : (
        <>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
            </span>
            <input
              type="text"
              value={query}
              onChange={handleChange}
              onFocus={() => { if (suggestions.length > 0) setOpen(true) }}
              placeholder="Nom ou SIRET de l'artisan..."
              style={{
                width: '100%',
                height: 52,
                border: '1.5px solid #e5e7eb',
                borderRadius: 12,
                padding: '0 16px 0 44px',
                fontSize: 15,
                outline: 'none',
                boxSizing: 'border-box',
                background: 'white',
              }}
            />
            {loading && (
              <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 12 }}>
                ...
              </span>
            )}
          </div>
          {open && suggestions.length > 0 && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              background: 'white',
              borderRadius: 12,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              zIndex: 10,
              maxHeight: 240,
              overflowY: 'auto',
            }}>
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  onClick={() => handleSelect(s)}
                  style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: i < suggestions.length - 1 ? '1px solid #f3f4f6' : 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f0fdf4')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                >
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{s.nom_complet}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>SIRET : {s.siret || '—'}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ScoreDisplay({ score }: { score: number }) {
  const color = score > 70 ? '#16a34a' : score >= 50 ? '#d97706' : '#dc2626'
  return (
    <span style={{ fontSize: 22, fontWeight: 800, color }}>
      {score}<span style={{ fontSize: 13, fontWeight: 600, color: '#6b7280' }}> /100</span>
    </span>
  )
}

function ComparisonRow({
  label,
  valA,
  valB,
  winner,
}: {
  label: string
  valA: React.ReactNode
  valB: React.ReactNode
  winner?: 'A' | 'B' | 'equal' | null
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #f3f4f6' }}>
      <div style={{ flex: '0 0 30%', fontSize: 13, fontWeight: 600, color: '#374151' }}>{label}</div>
      <div style={{ flex: 1, fontSize: 14, color: '#111827', padding: '6px 12px', borderRadius: 8, background: winner === 'A' ? '#f0fdf4' : 'transparent' }}>
        {valA}
      </div>
      <div style={{ flex: 1, fontSize: 14, color: '#111827', padding: '6px 12px', borderRadius: 8, background: winner === 'B' ? '#f0fdf4' : 'transparent' }}>
        {valB}
      </div>
    </div>
  )
}

function StatusBadge({ actif }: { actif: boolean }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 700,
      background: actif ? '#dcfce7' : '#fee2e2',
      color: actif ? '#166534' : '#991b1b',
    }}>
      {actif ? '● ACTIF' : '✕ FERMÉ'}
    </span>
  )
}

function RgeBadge({ rge }: { rge: boolean }) {
  return (
    <span style={{ fontWeight: 600, color: rge ? '#16a34a' : '#9ca3af' }}>
      {rge ? '✓ Certifié RGE' : '✗ Non certifié'}
    </span>
  )
}

export default function ComparerPage() {
  const [artisanA, setArtisanA] = useState<CompanyResult | null>(null)
  const [artisanB, setArtisanB] = useState<CompanyResult | null>(null)

  const bothSelected = artisanA !== null && artisanB !== null

  const scoreA = artisanA ? computeScore(artisanA) : 0
  const scoreB = artisanB ? computeScore(artisanB) : 0

  const actifA = artisanA?.etat_administratif === 'A' || artisanA?.siege?.etat_administratif === 'A'
  const actifB = artisanB?.etat_administratif === 'A' || artisanB?.siege?.etat_administratif === 'A'

  const rgeA = artisanA?.complements?.est_rge === true
  const rgeB = artisanB?.complements?.est_rge === true

  const dateA = artisanA?.date_creation || artisanA?.siege?.date_creation
  const dateB = artisanB?.date_creation || artisanB?.siege?.date_creation
  const ageA = getAgeYears(dateA)
  const ageB = getAgeYears(dateB)

  const winner: 'A' | 'B' | 'equal' | null = bothSelected
    ? scoreA > scoreB ? 'A' : scoreB > scoreA ? 'B' : 'equal'
    : null

  const verdictBullets: string[] = []
  if (bothSelected) {
    if (rgeA && !rgeB) verdictBullets.push(`${artisanA!.nom_complet} est certifié RGE, ce qui lui permet d'accéder aux aides MaPrimeRénov'`)
    else if (rgeB && !rgeA) verdictBullets.push(`${artisanB!.nom_complet} est certifié RGE, ce qui lui permet d'accéder aux aides MaPrimeRénov'`)
    if (ageA !== null && ageB !== null && ageA !== ageB) {
      if (ageA > ageB) verdictBullets.push(`${artisanA!.nom_complet} est plus ancien (${ageA} ans vs ${ageB} ans)`)
      else verdictBullets.push(`${artisanB!.nom_complet} est plus ancien (${ageB} ans vs ${ageA} ans)`)
    }
    if (verdictBullets.length === 0) {
      if (actifA && !actifB) verdictBullets.push(`${artisanA!.nom_complet} est actif alors que ${artisanB!.nom_complet} est fermé`)
      else if (actifB && !actifA) verdictBullets.push(`${artisanB!.nom_complet} est actif alors que ${artisanA!.nom_complet} est fermé`)
      else verdictBullets.push('Les deux artisans ont un profil similaire sur les critères disponibles')
    }
  }

  const winnerCompany = winner === 'A' ? artisanA : winner === 'B' ? artisanB : null
  const winnerLabel = winner === 'A' ? artisanA?.nom_complet : winner === 'B' ? artisanB?.nom_complet : null

  return (
    <main style={{ minHeight: '100vh', background: '#F8F4EF' }}>
      <SiteHeader />

      {/* HEADER */}
      <div style={{ background: '#1B4332', padding: '48px 24px 40px', textAlign: 'center' }}>
        <h1 style={{
          color: 'white',
          fontSize: 'clamp(28px, 5vw, 40px)',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          margin: '0 0 12px',
        }}>
          Comparer deux artisans
        </h1>
        <p style={{ color: 'rgba(216,243,220,0.85)', fontSize: 16, margin: 0 }}>
          Analysez côte à côte pour faire le meilleur choix
        </p>
      </div>

      <div style={{ padding: '0 16px 64px' }}>

        {/* SEARCH SECTION */}
        <div style={{
          background: 'white',
          maxWidth: 900,
          margin: '-24px auto 32px',
          borderRadius: 20,
          boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
          padding: 28,
          position: 'relative',
          zIndex: 2,
        }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <SearchZone
              label="Premier artisan"
              selected={artisanA}
              onSelect={setArtisanA}
              onDeselect={() => setArtisanA(null)}
            />
            <SearchZone
              label="Deuxième artisan"
              selected={artisanB}
              onSelect={setArtisanB}
              onDeselect={() => setArtisanB(null)}
            />
          </div>
        </div>

        {/* EMPTY STATE */}
        {!bothSelected && (
          <div style={{ textAlign: 'center', padding: '48px 16px', maxWidth: 480, margin: '0 auto' }}>
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" style={{ marginBottom: 20, opacity: 0.5 }} aria-hidden="true">
              <rect x="6" y="20" width="28" height="40" rx="6" fill="#52B788" opacity="0.3" />
              <rect x="46" y="20" width="28" height="40" rx="6" fill="#52B788" opacity="0.3" />
              <rect x="6" y="20" width="28" height="40" rx="6" stroke="#52B788" strokeWidth="2" />
              <rect x="46" y="20" width="28" height="40" rx="6" stroke="#52B788" strokeWidth="2" />
              <path d="M34 40h12M37 36l-3 4 3 4M43 36l3 4-3 4" stroke="#1B4332" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="10" y="27" width="20" height="3" rx="1.5" fill="#52B788" opacity="0.6" />
              <rect x="10" y="34" width="16" height="3" rx="1.5" fill="#52B788" opacity="0.4" />
              <rect x="10" y="41" width="18" height="3" rx="1.5" fill="#52B788" opacity="0.4" />
              <rect x="50" y="27" width="20" height="3" rx="1.5" fill="#52B788" opacity="0.6" />
              <rect x="50" y="34" width="16" height="3" rx="1.5" fill="#52B788" opacity="0.4" />
              <rect x="50" y="41" width="18" height="3" rx="1.5" fill="#52B788" opacity="0.4" />
            </svg>
            <p style={{ fontSize: 15, color: '#9ca3af', margin: 0 }}>
              Sélectionnez deux artisans pour comparer leur profil
            </p>
          </div>
        )}

        {/* COMPARISON TABLE */}
        {bothSelected && (
          <>
            <div style={{
              maxWidth: 900,
              margin: '0 auto',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
            }}>
              {/* Table header */}
              <div style={{ display: 'flex', background: '#1B4332', color: 'white', padding: '16px 20px', fontWeight: 700, fontSize: 14 }}>
                <div style={{ flex: '0 0 30%' }}>Critère</div>
                <div style={{ flex: 1, paddingLeft: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {artisanA!.nom_complet}
                </div>
                <div style={{ flex: 1, paddingLeft: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {artisanB!.nom_complet}
                </div>
              </div>

              {/* Row 1: Score de confiance */}
              <div style={{ background: 'white' }}>
                <ComparisonRow
                  label="Score de confiance"
                  valA={<ScoreDisplay score={scoreA} />}
                  valB={<ScoreDisplay score={scoreB} />}
                  winner={scoreA > scoreB ? 'A' : scoreB > scoreA ? 'B' : 'equal'}
                />
              </div>

              {/* Row 2: Statut légal */}
              <div style={{ background: '#fafafa' }}>
                <ComparisonRow
                  label="Statut légal"
                  valA={<StatusBadge actif={actifA} />}
                  valB={<StatusBadge actif={actifB} />}
                  winner={actifA && !actifB ? 'A' : actifB && !actifA ? 'B' : null}
                />
              </div>

              {/* Row 3: Date de création */}
              <div style={{ background: 'white' }}>
                <ComparisonRow
                  label="Date de création"
                  valA={<span>{formatDate(dateA)}{ageA !== null ? <span style={{ color: '#6b7280', fontSize: 12 }}> ({ageA} ans)</span> : null}</span>}
                  valB={<span>{formatDate(dateB)}{ageB !== null ? <span style={{ color: '#6b7280', fontSize: 12 }}> ({ageB} ans)</span> : null}</span>}
                  winner={ageA !== null && ageB !== null ? (ageA > ageB ? 'A' : ageB > ageA ? 'B' : 'equal') : null}
                />
              </div>

              {/* Row 4: Forme juridique */}
              <div style={{ background: '#fafafa' }}>
                <ComparisonRow
                  label="Forme juridique"
                  valA={formatFormeJuridique(artisanA?.forme_juridique)}
                  valB={formatFormeJuridique(artisanB?.forme_juridique)}
                  winner={null}
                />
              </div>

              {/* Row 5: Certifications RGE */}
              <div style={{ background: 'white' }}>
                <ComparisonRow
                  label="Certifications RGE"
                  valA={<RgeBadge rge={rgeA} />}
                  valB={<RgeBadge rge={rgeB} />}
                  winner={rgeA && !rgeB ? 'A' : rgeB && !rgeA ? 'B' : null}
                />
              </div>

              {/* Row 6: Procédures BODACC */}
              <div style={{ background: '#fafafa' }}>
                <ComparisonRow
                  label="Procédures BODACC"
                  valA={<span style={{ color: '#9ca3af', fontSize: 13 }}>Non vérifiable ici</span>}
                  valB={<span style={{ color: '#9ca3af', fontSize: 13 }}>Non vérifiable ici</span>}
                  winner={null}
                />
              </div>

              {/* Row 7: Code NAF / Secteur */}
              <div style={{ background: 'white' }}>
                <ComparisonRow
                  label="Code NAF / Secteur"
                  valA={
                    artisanA?.activite_principale
                      ? <span>{artisanA.activite_principale}{artisanA.libelle_activite_principale ? <span style={{ color: '#6b7280', fontSize: 12 }}> – {artisanA.libelle_activite_principale}</span> : null}</span>
                      : <span style={{ color: '#9ca3af' }}>—</span>
                  }
                  valB={
                    artisanB?.activite_principale
                      ? <span>{artisanB.activite_principale}{artisanB.libelle_activite_principale ? <span style={{ color: '#6b7280', fontSize: 12 }}> – {artisanB.libelle_activite_principale}</span> : null}</span>
                      : <span style={{ color: '#9ca3af' }}>—</span>
                  }
                  winner={null}
                />
              </div>
            </div>

            {/* VERDICT BLOCK */}
            <div style={{
              maxWidth: 900,
              margin: '20px auto 0',
              background: 'white',
              borderLeft: `4px solid ${winner === 'equal' ? '#d97706' : '#52B788'}`,
              borderRadius: '0 12px 12px 0',
              padding: '20px 24px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
            }}>
              <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 15, color: '#111827' }}>
                {winner === 'A' && `Notre recommandation : ${artisanA!.nom_complet} obtient un meilleur score de confiance`}
                {winner === 'B' && `Notre recommandation : ${artisanB!.nom_complet} obtient un meilleur score de confiance`}
                {winner === 'equal' && 'Les deux artisans ont un profil équivalent'}
              </p>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {verdictBullets.map((b, i) => (
                  <li key={i} style={{ fontSize: 14, color: '#374151', marginBottom: 4 }}>{b}</li>
                ))}
              </ul>
            </div>

            {/* CTA SECTION */}
            <div style={{
              maxWidth: 900,
              margin: '20px auto 0',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
            }}>
              <a
                href={`/artisan/${artisanA!.siret || artisanA!.siren}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '12px 20px',
                  border: '1.5px solid #1B4332',
                  borderRadius: 10,
                  color: '#1B4332',
                  fontWeight: 600,
                  fontSize: 14,
                  textDecoration: 'none',
                  background: 'white',
                }}
              >
                Voir la fiche de {artisanA!.nom_complet} →
              </a>
              <a
                href={`/artisan/${artisanB!.siret || artisanB!.siren}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '12px 20px',
                  border: '1.5px solid #1B4332',
                  borderRadius: 10,
                  color: '#1B4332',
                  fontWeight: 600,
                  fontSize: 14,
                  textDecoration: 'none',
                  background: 'white',
                }}
              >
                Voir la fiche de {artisanB!.nom_complet} →
              </a>
              {winnerCompany && (
                <a
                  href="/pricing"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '12px 20px',
                    border: 'none',
                    borderRadius: 10,
                    background: '#1B4332',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: 14,
                    textDecoration: 'none',
                    cursor: 'pointer',
                  }}
                >
                  🛡️ Analyser le devis de {winnerLabel} — 19,90€
                </a>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
