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
  /** Accepte 'actif', 'fermé', 'A', 'F' ou toute autre chaîne */
  statut: string
  dateCreation?: string
  /**
   * procedures.disponible = false → données BODACC pas encore récupérées
   * → retourne score: -1, loading: true
   */
  procedures: {
    /** Nombre de procédures collectives trouvées dans BODACC */
    collectives: number
    /** true si les données BODACC ont été récupérées (même si 0 procédures) */
    disponible: boolean
  }
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
  /** Score normalisé 0-100, ou -1 si données BODACC pas encore disponibles */
  score: number
  totalPoints: number
  totalMax: number
  criteres: ScoreCritere[]
  /** true quand score === -1 (BODACC en attente) */
  loading?: boolean
}

/* ── Helpers ─────────────────────────────────────────────── */
function anciennetePoints(dateCreation?: string): number {
  const years = getYears(dateCreation)
  if (years >= 10) return 35
  if (years >= 5) return 28
  if (years >= 2) return 17
  return 7
}

function isActif(statut: string): boolean {
  return statut === 'actif' || statut === 'A'
}

/* ── Fonction principale ─────────────────────────────────── */
export function calculateScore(input: ScoreInput): ScoreResult {
  /* Données BODACC pas encore récupérées → score en attente */
  if (!input.procedures.disponible) {
    return { score: -1, totalPoints: 0, totalMax: 0, criteres: [], loading: true }
  }

  /* Court-circuit : entreprise fermée → score 0 immédiat */
  if (!isActif(input.statut)) {
    return { score: 0, totalPoints: 0, totalMax: 0, criteres: [] }
  }

  const criteres: ScoreCritere[] = []

  /* 1. Statut légal — 40 pts, toujours disponible */
  criteres.push({
    nom: 'Statut légal',
    points: isActif(input.statut) ? 40 : 0,
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

  /* 3. Procédures BODACC — 25 pts */
  const nb = input.procedures.collectives
  criteres.push({
    nom: 'Procédures judiciaires',
    points: nb === 0 ? 25 : nb === 1 ? 5 : 0,
    max: 25,
    disponible: true,
  })

  /* Calcul normalisé */
  const totalPoints = criteres.reduce((s, c) => s + c.points, 0)
  const totalMax = criteres.reduce((s, c) => s + c.max, 0)
  const score = totalMax > 0 ? Math.round((totalPoints / totalMax) * 100) : 0

  return { score, totalPoints, totalMax, criteres }
}

/* ── Couleurs ────────────────────────────────────────────── */
export function scoreColor(score: number): string {
  if (score < 0) return '#9ca3af'
  if (score >= 70) return '#52B788'
  if (score >= 50) return '#F4A261'
  return '#E63946'
}

export function scoreBg(score: number): string {
  if (score < 0) return '#f3f4f6'
  if (score >= 70) return '#f0fdf4'
  if (score >= 50) return '#fff7ed'
  return '#fef2f2'
}
