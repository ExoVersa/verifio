'use client'

import { useState } from 'react'
import { Download, Loader } from 'lucide-react'

interface BoutonPDFProps {
  siret: string
  sessionId: string
  fullWidth?: boolean
}

export default function BoutonPDF({ siret, sessionId, fullWidth }: BoutonPDFProps) {
  const [loading, setLoading] = useState(false)
  const [hovered, setHovered] = useState(false)

  async function handleDownload() {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/rapport-pdf?siret=${siret}&session_id=${sessionId}`)
      if (!res.ok) throw new Error('Erreur génération PDF')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rapport-verifio-${siret}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Erreur lors de la génération du PDF. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: fullWidth ? 'flex' : 'inline-flex',
        width: fullWidth ? '100%' : undefined,
        justifyContent: fullWidth ? 'center' : undefined,
        alignItems: 'center',
        gap: '8px',
        background: hovered && !loading ? '#22a85f' : 'var(--color-accent)',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '10px 20px',
        cursor: loading ? 'not-allowed' : 'pointer',
        fontWeight: 600,
        fontSize: '14px',
        opacity: loading ? 0.7 : 1,
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
      }}
    >
      {loading ? (
        <Loader size={16} strokeWidth={1.5} style={{ animation: 'spin 1s linear infinite' }} />
      ) : (
        <Download size={16} strokeWidth={1.5} />
      )}
      {loading ? 'Génération…' : 'Télécharger le rapport PDF'}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </button>
  )
}
