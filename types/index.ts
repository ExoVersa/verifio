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

export interface SearchResult {
  siret: string
  siren: string
  nom: string
  statut: 'actif' | 'fermé'
  formeJuridique: string
  dateCreation: string
  adresse: string
  activite: string
  capitalSocial?: number
  score: number
  alerts: Alert[]
  rge: RGEInfo
  autresResultats: Array<{
    siren: string
    nom: string
    adresse: string
  }>
}
