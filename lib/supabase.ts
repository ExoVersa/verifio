import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type Search = {
  id: string
  user_id: string
  siret: string
  nom: string
  score: number
  statut: string
  created_at: string
}
