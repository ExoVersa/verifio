export type ChantierStatut = 'en_cours' | 'termine' | 'litige' | 'en_attente'
export type EvenementType = 'note' | 'alerte' | 'appel' | 'visite' | 'probleme' | 'document' | 'photo'
export type PaiementType = 'acompte' | 'avancement' | 'solde'
export type PhotoPhase = 'avant' | 'pendant' | 'apres'
export type DocumentType = 'devis' | 'contrat' | 'decennale' | 'facture' | 'pv_reception' | 'correspondance' | 'autre'

export const STATUT_LABELS: Record<ChantierStatut, string> = {
  en_cours: 'En cours',
  termine: 'Terminé',
  litige: 'Litige',
  en_attente: 'En attente',
}

export const STATUT_COLORS: Record<ChantierStatut, { bg: string; color: string; border: string }> = {
  en_cours:   { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  termine:    { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  litige:     { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  en_attente: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
}

export const TYPE_TRAVAUX = [
  'Électricité', 'Plomberie', 'Chauffage / PAC', 'Isolation',
  'Toiture', 'Charpente', 'Maçonnerie', 'Peinture', 'Carrelage',
  'Menuiserie / Fenêtres', 'Cuisine', 'Salle de bain', 'Extension',
  'Ravalement de façade', 'Étanchéité', 'Photovoltaïque', 'Autre',
]

export const EVENEMENT_ICONS: Record<EvenementType, string> = {
  note:      '📝',
  alerte:    '⚠️',
  appel:     '📞',
  visite:    '🏗',
  probleme:  '🚨',
  document:  '📄',
  photo:     '📷',
}

export const PAIEMENT_LABELS: Record<PaiementType, string> = {
  acompte:    'Acompte',
  avancement: 'Paiement d\'avancement',
  solde:      'Solde final',
}

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  devis:          'Devis signé',
  contrat:        'Contrat',
  decennale:      'Attestation décennale',
  facture:        'Facture',
  pv_reception:   'Procès-verbal de réception',
  correspondance: 'Correspondance',
  autre:          'Autre document',
}

export interface Chantier {
  id: string
  user_id: string
  siret?: string
  nom_artisan: string
  type_travaux: string
  description?: string
  adresse_chantier?: string
  date_debut?: string
  date_fin_prevue?: string
  montant_total?: number
  statut: ChantierStatut
  created_at: string
}

export interface ChantierPaiement {
  id: string
  chantier_id: string
  montant: number
  date_paiement: string
  type: PaiementType
  description?: string
  photo_url?: string
  created_at: string
}

export interface ChantierEvenement {
  id: string
  chantier_id: string
  titre: string
  description?: string
  type: EvenementType
  date_evenement: string
  created_at: string
  _auto?: boolean // computed auto-alert, not stored in DB
}

export interface ChantierPhoto {
  id: string
  chantier_id: string
  url: string
  legende?: string
  phase: PhotoPhase
  created_at: string
}

export interface ChantierDocument {
  id: string
  chantier_id: string
  nom: string
  type: DocumentType
  url: string
  taille?: number
  created_at: string
}

// Helper: total payé
export function totalPaye(paiements: ChantierPaiement[]): number {
  return paiements.reduce((s, p) => s + p.montant, 0)
}

// Helper: progress % based on dates
export function dateProgress(debut?: string, fin?: string): number {
  if (!debut || !fin) return 0
  const s = new Date(debut).getTime()
  const e = new Date(fin).getTime()
  const n = Date.now()
  if (n <= s) return 0
  if (n >= e) return 100
  return Math.round((n - s) / (e - s) * 100)
}

// Helper: days until deadline (negative = overdue)
export function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null
  return Math.round((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

// Helper: format € amount
export function formatEur(n?: number): string {
  if (n === undefined || n === null) return '—'
  return n.toLocaleString('fr-FR') + ' €'
}

export type PhaseNom = 'preparation' | 'travaux' | 'finitions' | 'reception'
export type PhaseStatut = 'en_attente' | 'en_cours' | 'terminee'

export interface ChantierPhase {
  id: string
  chantier_id: string
  nom: PhaseNom
  statut: PhaseStatut
  date_debut_prevue: string | null
  date_fin_prevue: string | null
  date_debut_reelle: string | null
  date_fin_reelle: string | null
  budget: number | null
  created_at: string
}

export const PHASE_LABELS: Record<PhaseNom, string> = {
  preparation: 'Préparation',
  travaux: 'Travaux',
  finitions: 'Finitions',
  reception: 'Réception',
}

export const PHASES_ORDER: PhaseNom[] = ['preparation', 'travaux', 'finitions', 'reception']
