'use client'

import { useState, useEffect, useRef } from 'react'
import { Share2, Copy, Mail, MessageCircle, Check } from 'lucide-react'

interface Props {
  url: string
  nom: string
  score?: number
  statut?: string
  label?: string
  compact?: boolean
}

export default function ShareButton({ url, nom, score, statut, label = 'Partager', compact = false }: Props) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      setOpen(false)
    } catch {
      // fallback
      const el = document.createElement('textarea')
      el.value = url
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      setOpen(false)
    }
  }

  const emailSubject = encodeURIComponent(`Vérification artisan — ${nom}`)
  const emailBody = encodeURIComponent(
    `J'ai vérifié cet artisan sur Verifio : ${url}` +
    (score !== undefined ? `\nScore de confiance : ${score}/100` : '') +
    (statut ? `\nStatut : ${statut}` : '')
  )
  const emailHref = `mailto:?subject=${emailSubject}&body=${emailBody}`

  const waText = encodeURIComponent(
    `J'ai vérifié ${nom} sur Verifio : ${url}${score !== undefined ? ` (score ${score}/100)` : ''}`
  )
  const waHref = `https://wa.me/?text=${waText}`

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: compact ? '7px 12px' : '9px 16px',
          borderRadius: '10px',
          border: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          color: 'var(--color-text)',
          fontSize: compact ? '12px' : '13px',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
          transition: 'background 0.12s',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-surface)')}
      >
        {copied
          ? <><Check size={14} color="var(--color-safe)" /><span style={{ color: 'var(--color-safe)' }}>Copié !</span></>
          : <><Share2 size={14} />{label}</>
        }
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '14px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
          padding: '6px',
          minWidth: '210px',
          zIndex: 100,
          animation: 'fadeIn 0.12s ease',
        }}>
          <MenuItem
            Icon={Copy}
            label="Copier le lien"
            onClick={copyLink}
            color="var(--color-text)"
          />
          <a
            href={emailHref}
            onClick={() => setOpen(false)}
            style={{ textDecoration: 'none' }}
          >
            <MenuItem Icon={Mail} label="Partager par email" color="var(--color-text)" />
          </a>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            style={{ textDecoration: 'none' }}
          >
            <MenuItem Icon={MessageCircle} label="Partager sur WhatsApp" color="#16a34a" iconColor="#16a34a" />
          </a>
        </div>
      )}

      {/* Toast */}
      {copied && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#1B4332',
          color: '#D8F3DC',
          padding: '10px 20px',
          borderRadius: '10px',
          fontSize: '14px',
          fontWeight: 600,
          zIndex: 400,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', gap: '8px',
          animation: 'slideUp 0.2s ease',
          pointerEvents: 'none',
        }}>
          <Check size={16} />
          Lien copié !
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes slideUp { from { opacity: 0; transform: translateX(-50%) translateY(8px) } to { opacity: 1; transform: translateX(-50%) translateY(0) } }
      `}</style>
    </div>
  )
}

// ── Menu item ──────────────────────────────────────────────────────────────

function MenuItem({
  Icon, label, onClick, color = 'var(--color-text)', iconColor,
}: {
  Icon: React.ComponentType<{ size: number; color?: string }>
  label: string
  onClick?: () => void
  color?: string
  iconColor?: string
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '9px 12px', borderRadius: '10px', cursor: 'pointer',
        color, fontSize: '13px', fontWeight: 500,
        transition: 'background 0.12s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <Icon size={15} color={iconColor || color} />
      {label}
    </div>
  )
}
