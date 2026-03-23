import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const siren = req.nextUrl.searchParams.get('siren')?.trim()
  if (!siren) return NextResponse.json({ error: 'siren requis' }, { status: 400 })

  // Try INPI public API
  try {
    const inpiRes = await fetch(`https://data.inpi.fr/entreprises/${siren}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000),
    })
    if (inpiRes.ok) {
      const data = await inpiRes.json()
      if (data && typeof data === 'object') {
        return NextResponse.json({ source: 'inpi', data })
      }
    }
  } catch {
    // INPI unavailable, fall through
  }

  return NextResponse.json({ source: null, data: null })
}
