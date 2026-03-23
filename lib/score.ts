/* ─── Shared score calculation utility ───────────────────────
   Used by /recherche (CandidateCard) and /artisan/[siret] page.
   Works with partial data: missing fields default conservatively.
──────────────────────────────────────────────────────────── */

export interface ScoreInput {
  statut: 'actif' | 'fermé'
  /** Either a boolean flag (search results) or full RGEInfo (artisan page) */
  rge?: boolean | { certifie: boolean }
  dateCreation?: string
  /** Only available on the full artisan page */
  dirigeants?: unknown[]
  /** Only available on the full artisan page */
  bodacc?: {
    procedureCollective?: boolean
    annonces?: unknown[]
  }
}

export interface ScoreResult {
  total: number
  statut_score: number
  certif_score: number
  anciennete_score: number
  dirigeants_score: number
  procedures_score: number
}

export function getYears(dateStr: string | undefined): number {
  if (!dateStr) return 0
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return 0
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365))
}

export function calculateScore(input: ScoreInput): ScoreResult {
  const statut_score = input.statut === 'actif' ? 25 : 0

  const rge = input.rge
  const isRgeCertifie = typeof rge === 'boolean'
    ? rge
    : (rge?.certifie ?? false)
  const certif_score = isRgeCertifie ? 20 : 0

  const age = getYears(input.dateCreation)
  const anciennete_score = age >= 10 ? 20 : age >= 3 ? 14 : 7

  // dirigeants: if unavailable → 0 (conservative)
  const dirigeants_score = (input.dirigeants?.length ?? 0) > 0 ? 20 : 0

  // bodacc: if unavailable → assume no procedure → full 15 pts
  const hasProcedure = input.bodacc?.procedureCollective ?? false
  const nbProcedures = input.bodacc?.annonces?.length ?? 0
  const procedures_score = !hasProcedure ? 15 : nbProcedures < 3 ? 5 : 0

  const total = statut_score + certif_score + anciennete_score + dirigeants_score + procedures_score

  return { total, statut_score, certif_score, anciennete_score, dirigeants_score, procedures_score }
}

export function scoreColor(score: number): string {
  if (score >= 70) return '#52B788'
  if (score >= 50) return '#F4A261'
  return '#E63946'
}

export function scoreBg(score: number): string {
  if (score >= 70) return '#f0fdf4'
  if (score >= 50) return '#fff7ed'
  return '#fef2f2'
}
