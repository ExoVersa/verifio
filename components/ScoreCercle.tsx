'use client'

export default function ScoreCercle({ score, size = 56 }: { score: number; size?: number }) {
  const color = score >= 8 ? 'var(--color-safe)' : score >= 5 ? '#d97706' : 'var(--color-danger)'
  const bg = score >= 8 ? 'var(--color-safe-bg)' : score >= 5 ? '#fffbeb' : 'var(--color-danger-bg)'
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, border: `2px solid ${color}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <span style={{ fontSize: size * 0.35, fontWeight: 800, color }}>{score}</span>
    </div>
  )
}
