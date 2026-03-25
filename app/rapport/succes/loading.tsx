export default function Loading() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Header skeleton */}
      <header style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <div className="shimmer" style={{ width: 22, height: 22, borderRadius: '50%' }} />
        <div className="shimmer" style={{ width: 80, height: 20 }} />
        <div className="shimmer" style={{ width: 160, height: 24, borderRadius: '20px', marginLeft: 8 }} />
      </header>

      <div className="rapport-layout">
        {/* Colonne principale */}
        <div className="rapport-main">
          {/* Bannière */}
          <div className="shimmer" style={{ height: 56, borderRadius: '10px', marginBottom: '20px' }} />

          {/* Score + titre */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
            <div className="shimmer" style={{ width: 80, height: 80, borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="shimmer" style={{ height: 24, width: '60%', marginBottom: '10px' }} />
              <div className="shimmer" style={{ height: 16, width: '40%', marginBottom: '8px' }} />
              <div className="shimmer" style={{ height: 14, width: '80%' }} />
            </div>
          </div>

          {/* Identité */}
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ display: 'flex', gap: '10px', padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
              <div className="shimmer" style={{ width: 16, height: 16, borderRadius: '4px', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="shimmer" style={{ height: 11, width: '25%', marginBottom: '6px' }} />
                <div className="shimmer" style={{ height: 14, width: '55%' }} />
              </div>
            </div>
          ))}

          {/* Carte Google Maps */}
          <div className="shimmer" style={{ height: 220, borderRadius: '12px', marginTop: '24px' }} />

          {/* Section BODACC */}
          <div className="shimmer" style={{ height: 200, borderRadius: '14px', marginTop: '24px' }} />

          {/* Droits */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '24px' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="shimmer" style={{ flex: '1 1 calc(50% - 6px)', minWidth: '200px', height: 140, borderRadius: '12px' }} />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="rapport-sidebar">
          <div className="shimmer" style={{ height: 44, borderRadius: '10px', marginBottom: '10px' }} />
          <div className="shimmer" style={{ height: 44, borderRadius: '10px', marginBottom: '20px' }} />
          <div className="shimmer" style={{ height: 180, borderRadius: '12px', marginBottom: '16px' }} />
          <div className="shimmer" style={{ height: 100, borderRadius: '12px' }} />
        </div>
      </div>
    </main>
  )
}
