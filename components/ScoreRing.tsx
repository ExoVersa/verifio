interface Props {
  score: number
}

export default function ScoreRing({ score }: Props) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const color =
    score >= 70 ? 'var(--color-safe)' :
    score >= 45 ? '#BA7517' :
    'var(--color-danger)'

  const label =
    score >= 70 ? 'Fiable' :
    score >= 45 ? 'Prudence' :
    'Risqué'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        {/* Track */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="8"
        />
        {/* Progress */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
          className="score-ring"
          style={{
            transition: 'stroke-dashoffset 0.8s ease-out',
          }}
        />
        {/* Score text */}
        <text
          x="50" y="46"
          textAnchor="middle"
          fontSize="22"
          fontWeight="700"
          fill={color}
          fontFamily="var(--font-display)"
        >
          {score}
        </text>
        <text
          x="50" y="62"
          textAnchor="middle"
          fontSize="10"
          fill="var(--color-muted)"
          fontFamily="var(--font-body)"
        >
          /100
        </text>
      </svg>
      <span style={{
        fontSize: '13px',
        fontWeight: 600,
        color,
        fontFamily: 'var(--font-display)',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}>
        {label}
      </span>
    </div>
  )
}
