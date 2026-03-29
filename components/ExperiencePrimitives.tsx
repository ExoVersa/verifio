import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'

export function SectionBadge({
  text,
  tone = 'green',
}: {
  text: string
  tone?: 'green' | 'sand' | 'blue' | 'light'
}) {
  const tones = {
    green: { bg: 'rgba(21,59,46,0.05)', border: 'rgba(21,59,46,0.10)', color: '#153b2e' },
    sand: { bg: 'rgba(184,93,30,0.06)', border: 'rgba(184,93,30,0.12)', color: '#b85d1e' },
    blue: { bg: 'rgba(32,94,207,0.06)', border: 'rgba(32,94,207,0.12)', color: '#205ecf' },
    light: { bg: 'rgba(255,255,255,0.10)', border: 'rgba(255,255,255,0.16)', color: '#eef8f3' },
  }
  const toneStyles = tones[tone]

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '7px 12px',
        borderRadius: '999px',
        background: toneStyles.bg,
        border: `1px solid ${toneStyles.border}`,
        color: toneStyles.color,
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}
    >
      {text}
    </div>
  )
}

export function PageHero({
  badge,
  title,
  subtitle,
  dark = false,
  children,
  maxWidth = '760px',
}: {
  badge?: ReactNode
  title: ReactNode
  subtitle: ReactNode
  dark?: boolean
  children?: ReactNode
  maxWidth?: string
}) {
  return (
    <section
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: dark ? '74px 24px 66px' : '72px 24px 62px',
        background: dark
          ? 'linear-gradient(135deg, #10251d 0%, #153b2e 58%, #234a3b 100%)'
          : 'linear-gradient(180deg, #fbf8f4 0%, #f4eee6 100%)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: dark
            ? 'radial-gradient(circle at 20% 28%, rgba(82,183,136,0.12), transparent 24%), radial-gradient(circle at 82% 18%, rgba(255,255,255,0.06), transparent 20%)'
            : 'radial-gradient(circle at 16% 20%, rgba(82,183,136,0.12), transparent 24%), radial-gradient(circle at 84% 18%, rgba(255,196,153,0.18), transparent 20%)',
        }}
      />
      <div style={{ position: 'relative', maxWidth, margin: '0 auto', textAlign: 'center' }}>
        {badge && <div style={{ marginBottom: '18px' }}>{badge}</div>}
        <h1
          style={{
            margin: '0 0 14px',
            color: dark ? '#ffffff' : '#14201b',
            fontSize: 'clamp(32px, 5vw, 56px)',
            lineHeight: 1.08,
            letterSpacing: '-0.04em',
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
          }}
        >
          {title}
        </h1>
        <p
          style={{
            margin: '0 auto',
            maxWidth: '640px',
            color: dark ? 'rgba(255,255,255,0.76)' : '#43524c',
            fontSize: '17px',
            lineHeight: 1.75,
          }}
        >
          {subtitle}
        </p>
        {children && <div style={{ marginTop: '28px' }}>{children}</div>}
      </div>
    </section>
  )
}

export function SurfaceCard({
  children,
  style,
}: {
  children: ReactNode
  style?: CSSProperties
}) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.78)',
        border: '1px solid rgba(226,217,204,0.86)',
        borderRadius: '26px',
        boxShadow: '0 14px 32px rgba(20,32,27,0.06)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function PrimaryLink({
  href,
  children,
  light = false,
}: {
  href: string
  children: ReactNode
  light?: boolean
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '14px 20px',
        borderRadius: '16px',
        textDecoration: 'none',
        background: light ? '#ffffff' : '#153b2e',
        color: light ? '#153b2e' : '#ffffff',
        fontSize: '14px',
        fontWeight: 800,
        boxShadow: light ? '0 12px 24px rgba(20,32,27,0.10)' : '0 12px 24px rgba(21,59,46,0.16)',
      }}
    >
      {children}
    </Link>
  )
}
