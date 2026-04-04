import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        textAlign: 'center',
      }}>

        {/* Icône */}
        <div style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: '#EAF3DE',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
            stroke="#3B6D11" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="11" y1="8" x2="11" y2="12"/>
            <line x1="11" y1="16" x2="11.01" y2="16"/>
          </svg>
        </div>

        {/* Code */}
        <p style={{
          fontSize: 13,
          fontWeight: 500,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--color-muted)',
          marginBottom: '0.5rem',
        }}>
          Erreur 404
        </p>

        {/* Titre */}
        <h1 style={{
          fontSize: 28,
          fontWeight: 500,
          color: 'var(--color-text)',
          marginBottom: '0.75rem',
          maxWidth: 400,
        }}>
          Cette page n&apos;existe pas
        </h1>

        {/* Sous-titre */}
        <p style={{
          fontSize: 15,
          color: 'var(--color-muted)',
          lineHeight: 1.6,
          maxWidth: 380,
          marginBottom: '2rem',
        }}>
          L&apos;adresse que vous avez saisie est incorrecte ou la page a été déplacée.
        </p>

        {/* CTAs */}
        <div style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          <Link href="/" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#1B4332',
            color: '#fff',
            padding: '11px 22px',
            borderRadius: '10px',
            fontSize: 14,
            fontWeight: 500,
            textDecoration: 'none',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Accueil
          </Link>

          <Link href="/recherche" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'transparent',
            color: 'var(--color-text)',
            padding: '11px 22px',
            borderRadius: '10px',
            fontSize: 14,
            fontWeight: 500,
            textDecoration: 'none',
            border: '0.5px solid var(--color-border)',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Vérifier un artisan
          </Link>
        </div>

      </div>
    </>
  )
}
