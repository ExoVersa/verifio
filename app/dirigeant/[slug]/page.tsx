'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Building2, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react'
import SiteHeader from '@/components/SiteHeader'
import { slugToQuery } from '@/lib/dirigeant'

interface EntrepriseResult {
  siret: string
  siren: string
  nom: string
  statut: 'actif' | 'fermé'
  formeJuridique: string
  dateCreation: string
  dateFermeture?: string
  adresse: string
  activite: string
  score?: number
}

export default function DirigeantPage() {
  const params = useParams()
  const router = useRouter()
  const slug = typeof params.slug === 'string' ? params.slug : ''

  const [entreprises, setEntreprises] = useState<EntrepriseResult[]>([])
  const [loading, setLoading] = useState(true)

  const query = slugToQuery(slug)
  const displayName = query.replace(/\b\w/g, (c) => c.toUpperCase())
  const initials = displayName
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const fermeesCount = entreprises.filter((e) => e.statut === 'fermé').length
  const analyseLevel =
    fermeesCount === 0 ? 'ok' : fermeesCount <= 2 ? 'warn' : 'danger'

  useEffect(() => {
    if (displayName) {
      document.title = `${displayName} — Dirigeant · ${entreprises.length} entreprise${entreprises.length !== 1 ? 's' : ''} · Rien qui cloche`
    }
  }, [displayName, entreprises.length])

  async function loadScores(list: EntrepriseResult[]) {
    const toLoad = list.filter((e) => e.siret).slice(0, 10)
    const updated = [...list]
    await Promise.all(
      toLoad.map(async (e) => {
        try {
          const res = await fetch(`/api/search?q=${e.siret}`)
          if (res.ok) {
            const data = await res.json()
            const idx = updated.findIndex((u) => u.siret === e.siret)
            if (idx >= 0)
              updated[idx] = { ...updated[idx], score: data.score ?? undefined }
          }
        } catch {
          /* ignore */
        }
      })
    )
    setEntreprises([...updated])
  }

  useEffect(() => {
    if (!slug) return
    setLoading(true)

    const fetchEntreprises = async () => {
      try {
        const res = await fetch(
          `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(query)}&per_page=25`
        )
        if (!res.ok) throw new Error('Erreur API')
        const data = await res.json()

        const results: EntrepriseResult[] = (data.results || []).map(
          (r: {
            siege?: { siret?: string; adresse?: string }
            siret?: string
            siren?: string
            nom_raison_sociale?: string
            nom_complet?: string
            etat_administratif?: string
            nature_juridique?: string
            date_creation?: string
            date_fermeture?: string
            activite_principale_libelle?: string
          }) => ({
            siret: r.siege?.siret || r.siret || '',
            siren: r.siren || '',
            nom: r.nom_raison_sociale || r.nom_complet || '',
            statut: r.etat_administratif === 'A' ? 'actif' : 'fermé',
            formeJuridique: r.nature_juridique || '',
            dateCreation: r.date_creation || '',
            dateFermeture: r.date_fermeture || undefined,
            adresse: r.siege?.adresse || '',
            activite: r.activite_principale_libelle || '',
          })
        )

        // Trier : actifs d'abord, puis fermés
        const sorted = [
          ...results.filter((e) => e.statut === 'actif'),
          ...results.filter((e) => e.statut === 'fermé'),
        ]

        setEntreprises(sorted)
        setLoading(false)
        loadScores(sorted)
      } catch {
        setLoading(false)
      }
    }

    fetchEntreprises()
  }, [slug])

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-cream)' }}>
      <SiteHeader />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* Fil d'Ariane */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '24px',
            fontSize: '13px',
            color: 'var(--color-text-muted)',
          }}
        >
          <a href="/" style={{ color: 'inherit', textDecoration: 'none' }}>
            Accueil
          </a>
          <span>›</span>
          <button
            onClick={() => router.back()}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              fontSize: 'inherit',
              fontFamily: 'inherit',
              padding: 0,
            }}
          >
            Fiche entreprise
          </button>
          <span>›</span>
          <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
            {displayName}
          </span>
        </nav>

        {/* Header dirigeant */}
        <div
          style={{
            background: 'white',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: 'var(--shadow-md)',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              flexWrap: 'wrap',
            }}
          >
            {/* Avatar 80px */}
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: '#1B4332',
                color: '#D8F3DC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                fontWeight: 800,
                fontFamily: 'var(--font-display)',
                flexShrink: 0,
              }}
            >
              {initials}
            </div>

            <div style={{ flex: 1 }}>
              <h1
                style={{
                  margin: '0 0 6px',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '28px',
                  color: 'var(--color-text-primary)',
                }}
              >
                {displayName}
              </h1>
              <p style={{ margin: 0, fontSize: '15px', color: 'var(--color-text-muted)' }}>
                {entreprises.length} entreprise
                {entreprises.length !== 1 ? 's' : ''} trouvée
                {entreprises.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Badge alerte si fermées */}
            {fermeesCount > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '20px',
                  background: fermeesCount >= 3 ? '#fef2f2' : '#fffbeb',
                  border: `1px solid ${fermeesCount >= 3 ? '#fecaca' : '#fde68a'}`,
                  color: fermeesCount >= 3 ? '#dc2626' : '#d97706',
                }}
              >
                <AlertTriangle size={14} />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>
                  {fermeesCount} entreprise{fermeesCount > 1 ? 's' : ''} fermée
                  {fermeesCount > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bloc analyse */}
        <div
          style={{
            borderRadius: '16px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background:
              analyseLevel === 'ok'
                ? '#f0fdf4'
                : analyseLevel === 'warn'
                ? '#fffbeb'
                : '#fef2f2',
            border: `1px solid ${
              analyseLevel === 'ok'
                ? '#86efac'
                : analyseLevel === 'warn'
                ? '#fde68a'
                : '#fecaca'
            }`,
          }}
        >
          {analyseLevel === 'ok' ? (
            <CheckCircle size={18} color="#16a34a" />
          ) : analyseLevel === 'warn' ? (
            <AlertTriangle size={18} color="#d97706" />
          ) : (
            <ShieldAlert size={18} color="#dc2626" />
          )}
          <p
            style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: 600,
              color:
                analyseLevel === 'ok'
                  ? '#15803d'
                  : analyseLevel === 'warn'
                  ? '#92400e'
                  : '#991b1b',
            }}
          >
            {analyseLevel === 'ok'
              ? "✓ Aucune entreprise fermée dans l'historique de ce dirigeant"
              : analyseLevel === 'warn'
              ? `⚠ ${fermeesCount} entreprise${fermeesCount > 1 ? 's' : ''} fermée${fermeesCount > 1 ? 's' : ''} — vérifiez le contexte`
              : `🚨 Historique préoccupant — ${fermeesCount} entreprises fermées`}
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 0',
              color: 'var(--color-text-muted)',
            }}
          >
            Chargement…
          </div>
        )}

        {/* Liste entreprises */}
        {!loading &&
          entreprises.map((e) => (
            <a
              key={e.siret}
              href={`/artisan/${e.siret}`}
              style={{
                display: 'block',
                textDecoration: 'none',
                color: 'inherit',
                marginBottom: '12px',
              }}
            >
              <div
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '20px 24px',
                  boxShadow: 'var(--shadow-sm)',
                  border: '1px solid var(--color-border)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '12px',
                  alignItems: 'center',
                }}
                onMouseEnter={(el) => {
                  ;(el.currentTarget as HTMLElement).style.transform =
                    'translateY(-2px)'
                  ;(el.currentTarget as HTMLElement).style.boxShadow =
                    'var(--shadow-md)'
                }}
                onMouseLeave={(el) => {
                  ;(el.currentTarget as HTMLElement).style.transform = ''
                  ;(el.currentTarget as HTMLElement).style.boxShadow =
                    'var(--shadow-sm)'
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '6px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontFamily: 'var(--font-display)',
                        fontWeight: 700,
                        fontSize: '16px',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {e.nom}
                    </p>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '20px',
                        background: e.statut === 'actif' ? '#f0fdf4' : '#fef2f2',
                        color: e.statut === 'actif' ? '#16a34a' : '#dc2626',
                        border: `1px solid ${e.statut === 'actif' ? '#86efac' : '#fecaca'}`,
                      }}
                    >
                      {e.statut === 'actif' ? '● ACTIF' : '● FERMÉ'}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: '16px',
                      flexWrap: 'wrap',
                      fontSize: '13px',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    <span>SIRET {e.siret}</span>
                    {e.formeJuridique && <span>{e.formeJuridique}</span>}
                    {e.dateCreation && (
                      <span>
                        Créée le{' '}
                        {new Date(e.dateCreation).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                        })}
                      </span>
                    )}
                    {e.dateFermeture && (
                      <span style={{ color: '#dc2626' }}>
                        Fermée le{' '}
                        {new Date(e.dateFermeture).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                        })}
                      </span>
                    )}
                    {e.adresse && <span>📍 {e.adresse}</span>}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '8px',
                    flexShrink: 0,
                  }}
                >
                  {e.score !== undefined ? (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                      }}
                    >
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background:
                            e.score >= 70
                              ? '#f0fdf4'
                              : e.score >= 50
                              ? '#fffbeb'
                              : '#fef2f2',
                          border: `2px solid ${
                            e.score >= 70
                              ? '#52B788'
                              : e.score >= 50
                              ? '#F4A261'
                              : '#E63946'
                          }`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: 'var(--font-display)',
                          fontWeight: 800,
                          fontSize: '16px',
                          color:
                            e.score >= 70
                              ? '#15803d'
                              : e.score >= 50
                              ? '#92400e'
                              : '#991b1b',
                        }}
                      >
                        {e.score}
                      </div>
                      <span
                        style={{
                          fontSize: '10px',
                          color: 'var(--color-text-muted)',
                          marginTop: '2px',
                        }}
                      >
                        /100
                      </span>
                    </div>
                  ) : (
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'var(--color-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Building2 size={18} color="var(--color-text-muted)" />
                    </div>
                  )}
                  <span
                    style={{ fontSize: '12px', color: '#1B4332', fontWeight: 600 }}
                  >
                    Voir la fiche →
                  </span>
                </div>
              </div>
            </a>
          ))}

        {!loading && entreprises.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 0',
              color: 'var(--color-text-muted)',
            }}
          >
            Aucune entreprise trouvée pour ce dirigeant.
          </div>
        )}
      </div>
    </main>
  )
}
