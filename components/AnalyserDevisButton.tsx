'use client'

import { useState } from 'react'
import { Upload } from 'lucide-react'

interface Props {
  href: string
  label: string
}

export default function AnalyserDevisButton({ href, label }: Props) {
  const [hovered, setHovered] = useState(false)
  return (
    <a
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '7px',
        padding: '9px 12px',
        borderRadius: '8px',
        background: hovered ? '#1a7a4a' : 'var(--color-accent)',
        color: '#fff',
        border: 'none',
        textDecoration: 'none',
        fontSize: '13px',
        fontWeight: 600,
        transition: 'background 0.15s ease',
      }}
    >
      <Upload size={14} strokeWidth={1.5} />
      {label}
    </a>
  )
}
