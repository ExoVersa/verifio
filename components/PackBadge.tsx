import { Shield } from 'lucide-react'

export default function PackBadge() {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      background: 'rgba(45,185,110,0.1)',
      color: 'var(--color-accent)',
      border: '1px solid rgba(45,185,110,0.3)',
      borderRadius: 20,
      padding: '2px 8px',
      fontSize: 11,
      fontWeight: 600,
      marginLeft: 8,
    }}>
      <Shield size={10} strokeWidth={2} />
      Pack Sérénité
    </span>
  )
}
