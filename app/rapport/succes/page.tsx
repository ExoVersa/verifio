import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function SuccesPage({
  searchParams,
}: {
  searchParams: Promise<{ siret?: string }>
}) {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'var(--color-bg)',
    }}>
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '16px',
        padding: '40px 32px',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'var(--color-safe-bg)',
          marginBottom: '24px',
        }}>
          <CheckCircle2 size={32} color="var(--color-safe)" />
        </div>

        <h1 className="font-display" style={{
          margin: '0 0 12px',
          fontSize: '24px',
          fontWeight: 700,
          letterSpacing: '-0.02em',
        }}>
          Paiement confirmé
        </h1>

        <p style={{
          margin: '0 0 8px',
          fontSize: '15px',
          color: 'var(--color-muted)',
          lineHeight: 1.6,
        }}>
          Merci pour votre achat. Votre rapport complet est en cours de préparation et vous sera envoyé par e-mail sous quelques minutes.
        </p>

        <p style={{
          margin: '0 0 32px',
          fontSize: '13px',
          color: 'var(--color-muted)',
        }}>
          Conservez votre confirmation de paiement Stripe comme reçu.
        </p>

        <Link href="/" style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px 24px',
          borderRadius: '10px',
          background: 'var(--color-text)',
          color: 'var(--color-bg)',
          fontSize: '14px',
          fontWeight: 600,
          textDecoration: 'none',
          letterSpacing: '-0.01em',
        }}>
          Nouvelle recherche
        </Link>
      </div>
    </main>
  )
}
