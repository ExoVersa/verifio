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
  familleLible?: string
  type: string
  tribunal?: string
  ville?: string
  numeroAnnonce?: number
  numeroBodacc?: string
  urlBodacc?: string
  registre?: string
  details?: string
  // Jugement (procédures collectives)
  jugementNature?: string
  jugementDate?: string
  jugementComplement?: string
  // Acte (immatriculation, vente)
  acteDescriptif?: string
  acteCategorie?: string
  acteDate?: string
  // Modifications
  modificationDescriptif?: string
  // Radiation
  radiationDate?: string
  radiationCommentaire?: string
  // Établissement (vente/cession)
  etablissementActivite?: string
  etablissementOrigine?: string
  etablissementAdresse?: string
  vendeurNom?: string
  // Personne/Société
  personnesDenomination?: string
  personnesActivite?: string
  personnesAdministration?: string
  personnesFormeJuridique?: string
  personnesCapital?: string
}

export interface BodaccInfo {
  procedureCollective: boolean
  typeProcedure?: string
  annonces: BodaccAnnonce[]
  changementDirigeantRecent: boolean
  /** true si l'appel API BODACC a réussi, false si indisponible/erreur */
  fetched?: boolean
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

export interface SearchCandidate {
  siret: string
  siren: string
  nom: string
  statut: 'actif' | 'fermé'
  formeJuridique: string
  formeJuridiqueCode: string
  ville: string
  codePostal: string
  codeNaf: string
  activite: string
  dateCreation?: string
  rge?: boolean
  /** Score pré-calculé côté serveur via lib/score.ts calculateScore */
  score?: number
}

export interface BOAMPMarche {
  objet: string
  date: string | null
  montant: string | null
  procedure: string | null
  acheteur: string | null
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
  boampMarches?: BOAMPMarche[]
  successionInfo?: SuccessionInfo
  autresResultats: Array<{
    siren: string
    nom: string
    adresse: string
  }>
}
