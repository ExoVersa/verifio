/* ─── Score de confiance — source unique de vérité ────────────
   3 critères, calcul dynamique (BODACC optionnel),
   RGE et Dirigeants hors score (info seulement).
──────────────────────────────────────────────────────────── */

export function getYears(dateStr: string | undefined): number {
  if (!dateStr) return 0
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return 0
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365))
}

/* ── Input ────────────────────────────────────────────────── */
export interface ScoreInput {
  statut: 'actif' | 'fermé'
  dateCreation?: string
  /**
   * Passer null ou omettre si BODACC non disponible → critère exclu du score.
   * Passer { disponible: true, ... } si données récupérées.
   */
  bodacc?: {
    disponible: boolean
    procedureCollective?: boolean
    /** Nombre de procédures collectives distinctes */
    nbProceduresCollectives?: number
  } | null
}

/* ── Output ───────────────────────────────────────────────── */
export interface ScoreCritere {
  nom: string
  points: number
  max: number
  /** false = donnée indisponible, critère exclu du calcul */
  disponible: boolean
}

export interface ScoreResult {
  /** Score normalisé 0-100 */
  score: number
  totalPoints: number
  totalMax: number
  criteres: ScoreCritere[]
}

/* ── Helpers ─────────────────────────────────────────────── */
function anciennetePoints(dateCreation?: string): number {
  const years = getYears(dateCreation)
  if (years >= 10) return 35
  if (years >= 5) return 28
  if (years >= 2) return 17
  return 7
}

/* ── Fonction principale ─────────────────────────────────── */
export function calculateScore(input: ScoreInput): ScoreResult {
  const criteres: ScoreCritere[] = []

  /* 1. Statut légal — 40 pts, toujours disponible */
  criteres.push({
    nom: 'Statut légal',
    points: input.statut === 'actif' ? 40 : 0,
    max: 40,
    disponible: true,
  })

  /* 2. Ancienneté — 35 pts, toujours disponible */
  criteres.push({
    nom: 'Ancienneté',
    points: anciennetePoints(input.dateCreation),
    max: 35,
    disponible: true,
  })

  /* 3. Procédures BODACC — 25 pts, seulement si données récupérées */
  const bodaccFetched = input.bodacc?.disponible === true
  if (bodaccFetched) {
    const nb = input.bodacc!.nbProceduresCollectives
      ?? (input.bodacc!.procedureCollective ? 1 : 0)
    criteres.push({
      nom: 'Procédures judiciaires',
      points: nb === 0 ? 25 : nb === 1 ? 10 : 0,
      max: 25,
      disponible: true,
    })
  } else {
    criteres.push({
      nom: 'Procédures judiciaires',
      points: 0,
      max: 25,
      disponible: false,
    })
  }

  /* Calcul normalisé sur les critères disponibles uniquement */
  const included = criteres.filter(c => c.disponible)
  const totalPoints = included.reduce((s, c) => s + c.points, 0)
  const totalMax = included.reduce((s, c) => s + c.max, 0)
  const score = totalMax > 0 ? Math.round((totalPoints / totalMax) * 100) : 0

  return { score, totalPoints, totalMax, criteres }
}

/* ── Couleurs ────────────────────────────────────────────── */
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
