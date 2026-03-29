'use client'

export interface PrixResult {
  fourchette_basse: number
  fourchette_haute: number
  prix_moyen: number
  montant_devis: number | null
  siret: string | null
  nom_artisan: string | null
  type_travaux: string
  region: string | null
  verdict_prix: 'normal' | 'sous-evalue' | 'surevalue'
  ecart_pourcentage: number
  facteurs: string[]
  alerte: string | null
}

export default function JaugePrix({ prix }: { prix: PrixResult }) {
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
