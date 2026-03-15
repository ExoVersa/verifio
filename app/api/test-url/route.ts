import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const requestHost = req.headers.get('host')
  const requestProto = req.headers.get('x-forwarded-proto') || (requestHost?.includes('localhost') ? 'http' : 'https')
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (requestHost ? `${requestProto}://${requestHost}` : 'http://localhost:3000')

  return NextResponse.json({
    baseUrl,
    successUrl: `${baseUrl}/rapport/succes?siret=TEST&session_id=TEST`,
    env: {
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || '(non défini)',
      VERCEL_URL: process.env.VERCEL_URL || '(non défini)',
      host: requestHost,
      proto: requestProto,
    },
  })
}
