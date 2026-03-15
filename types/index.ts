export type AlertType = 'safe' | 'warn' | 'danger' | 'info'

export interface Alert {
  type: AlertType
  message: string
}

export interface RGEInfo {
  certifie: boolean
  domaines: string[]
  organismes: string[]
}

export interface Dirigeant {
  nom: string
  prenoms?: string
  qualite: string
  type: string
  anneeNaissance?: string
}

export interface BodaccAnnonce {
  id: string
  date: string
  famille: string
  type: string
  tribunal?: string
  details?: string
}

export interface BodaccInfo {
  procedureCollective: boolean
  typeProcedure?: string
  annonces: BodaccAnnonce[]
  changementDirigeantRecent: boolean
}

export interface SuccessionInfo {
  cessionDetectee: boolean
  cessionRecente: boolean // < 3 ans
}

export interface DevisMentionLegale {
  label: string
  present: boolean
  detail: string
}

export interface DevisAlerte {
  type: 'danger' | 'warn' | 'info'
  message: string
}

export interface DevisAnalysis {
  score: number
  verdict: 'conforme' | 'vigilance' | 'suspect'
  siret_trouve: string | null
  mentions_legales: DevisMentionLegale[]
  alertes: DevisAlerte[]
  recommandations: string[]
  prix_coherents: boolean | null
  commentaire_prix: string | null
  resume: string
}

export interface SearchResult {
  siret: string
  siren: string
  nom: string
  statut: 'actif' | 'fermé'
  formeJuridique: string
  dateCreation: string
  adresse: string
  activite: string
  codeNaf?: string
  conventionCollective?: string
  capitalSocial?: number
  effectif?: string
  score: number
  alerts: Alert[]
  rge: RGEInfo
  dirigeants: Dirigeant[]
  bodacc: BodaccInfo
  successionInfo?: SuccessionInfo
  autresResultats: Array<{
    siren: string
    nom: string
    adresse: string
  }>
}
