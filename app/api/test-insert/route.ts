import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log('=== TEST INSERT DEBUG ===')
  console.log('SUPABASE_URL set:', !!supabaseUrl)
  console.log('ANON_KEY set:', !!anonKey)
  console.log('SERVICE_ROLE_KEY set:', !!serviceKey)
  console.log('SERVICE_ROLE_KEY length:', serviceKey?.length ?? 0)

  const supabaseAdmin = createClient(supabaseUrl!, serviceKey!)

  // Test insert rapports via service role (no RLS)
  const testSessionId = `test_${Date.now()}`
  const { data: rapportData, error: rapportError } = await supabaseAdmin
    .from('rapports')
    .insert({
      user_id: null,
      siret: 'TEST00000000000',
      stripe_session_id: testSessionId,
      montant: 490,
      statut: 'test',
    })
    .select()

  console.log('INSERT rapports data:', rapportData)
  console.log('INSERT rapports error:', rapportError)

  if (rapportData?.[0]?.id) {
    await supabaseAdmin.from('rapports').delete().eq('id', rapportData[0].id)
  }

  // Test insert surveillances via service role
  const { data: survData, error: survError } = await supabaseAdmin
    .from('surveillances')
    .insert({
      user_id: null,
      siret: 'TEST00000000000',
      nom_artisan: 'Test artisan',
      expires_at: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()

  console.log('INSERT surveillances data:', survData)
  console.log('INSERT surveillances error:', survError)

  if (survData?.[0]?.id) {
    await supabaseAdmin.from('surveillances').delete().eq('id', survData[0].id)
  }

  return NextResponse.json({
    env: {
      supabase_url_set: !!supabaseUrl,
      anon_key_set: !!anonKey,
      service_role_key_set: !!serviceKey,
      service_role_key_length: serviceKey?.length ?? 0,
    },
    rapports: {
      data: rapportData,
      error: rapportError?.message ?? null,
      code: rapportError?.code ?? null,
      details: rapportError?.details ?? null,
    },
    surveillances: {
      data: survData,
      error: survError?.message ?? null,
      code: survError?.code ?? null,
      details: survError?.details ?? null,
    },
  })
}
