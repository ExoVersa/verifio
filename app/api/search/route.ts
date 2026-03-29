import { NextRequest, NextResponse } from 'next/server'
import { fetchCompany } from '@/lib/fetchCompany'

export const maxDuration = 30

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')?.trim()
  if (!query || query.length < 2) {
    return NextResponse.json({ error: 'Saisissez au moins 2 caractères.' }, { status: 400 })
  }

  try {
    const result = await fetchCompany(query)
    return NextResponse.json(result)
  } catch (err: any) {
    console.error('Search error:', err)
    if (err.message === 'Aucune entreprise trouvée.') {
      return NextResponse.json({ error: 'Aucune entreprise trouvée. Essayez avec le SIRET.' }, { status: 404 })
    }
    if (err.message === 'API indisponible') {
      return NextResponse.json({
        error: 'service_indisponible',
        message: 'Les données INSEE sont temporairement indisponibles. Réessayez dans quelques minutes.',
      }, { status: 503 })
    }
    return NextResponse.json({ error: 'Erreur lors de la recherche. Réessayez.' }, { status: 500 })
  }
}
