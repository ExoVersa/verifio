'use client'

import React, { useState } from 'react'
import { FileSignature, Copy, Check, Printer } from 'lucide-react'

interface ModeleContratProps {
  nomEntreprise: string
  siret: string
  adresse: string
  nomDirigeant: string
  sessionId: string
}

function buildContrat(
  nomEntreprise: string,
  siret: string,
  adresse: string,
  nomDirigeant: string,
): string {
  return `CONTRAT DE PRESTATION DE TRAVAUX
═══════════════════════════════════════════════════════
Entre les soussignés :

L'ARTISAN
Raison sociale : ${nomEntreprise}
SIRET : ${siret}
Adresse : ${adresse}
Représenté par : ${nomDirigeant}

LE CLIENT
Nom : ___________________________
Adresse : ___________________________
Téléphone : ___________________________
Email : ___________________________

OBJET DES TRAVAUX
Nature des travaux : ___________________________
Adresse du chantier : ___________________________
Date de début prévue : ___________________________
Durée estimée : ___________________________
Matériaux principaux : ___________________________

CONDITIONS FINANCIÈRES
Montant total TTC : ___________________________
Acompte à la signature (max 30%) : ___________________________
2ème versement (mi-chantier) : ___________________________
Solde à la réception : ___________________________
Mode de paiement : ___________________________

GARANTIES
L'artisan certifie être couvert par une assurance décennale.
Numéro de police : ___________________________
Assureur : ___________________________
Validité : ___________________________

CONDITIONS GÉNÉRALES
- Les travaux supplémentaires feront l'objet d'un avenant écrit.
- Tout retard de paiement entraîne des pénalités de 3x le taux légal.
- En cas de litige, les parties s'engagent à tenter une médiation
  avant tout recours judiciaire.
- Le présent contrat est soumis au droit français.

RÉCEPTION DES TRAVAUX
Les travaux feront l'objet d'un procès-verbal de réception
signé contradictoirement par les deux parties.
La réception déclenche :
- Garantie de parfait achèvement (1 an)
- Garantie biennale (2 ans)
- Garantie décennale (10 ans)

═══════════════════════════════════════════════════════
Fait à _______________, le _______________

Signature de l'artisan :        Signature du client :
(précédée de "Lu et approuvé")  (précédée de "Lu et approuvé")

___________________________     ___________________________
`
}

function renderHighlighted(text: string, vars: string[]): React.ReactNode {
  const validVars = vars.filter(v => v && v.length > 0)
  if (validVars.length === 0) return text

  const escapedVars = validVars.map(v => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const regex = new RegExp(`(${escapedVars.join('|')})`, 'g')
  const parts = text.split(regex)

  return (
    <>
      {parts.map((part, i) =>
        validVars.includes(part)
          ? <span key={i} style={{ color: 'var(--color-accent)', fontWeight: 700 }}>{part}</span>
          : part
      )}
    </>
  )
}

export default function ModeleContrat({
  nomEntreprise,
  siret,
  adresse,
  nomDirigeant,
  sessionId,
}: ModeleContratProps) {
  const [copied, setCopied] = useState(false)
  const contratText = buildContrat(nomEntreprise, siret, adresse, nomDirigeant)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(contratText)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch { /* silent */ }
  }

  return (
    <div style={{ marginTop: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <FileSignature size={20} color="var(--color-accent)" strokeWidth={1.5} />
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, letterSpacing: '-0.01em' }}>
          Modèle de contrat simplifié
        </h2>
      </div>
      <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--color-muted)' }}>
        Pré-rempli avec les informations de cet artisan
      </p>

      {/* Contrat */}
      <div style={{
        background: '#fff',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 20px',
          background: 'var(--color-neutral-bg)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <FileSignature size={14} color="var(--color-muted)" strokeWidth={1.5} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Contrat pré-rempli
          </span>
          <span style={{
            marginLeft: 'auto',
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '4px',
            background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
            color: 'var(--color-accent)',
            fontWeight: 600,
          }}>
            Données en bleu = pré-remplies
          </span>
        </div>

        <pre style={{
          margin: 0,
          padding: '20px',
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace',
          fontSize: '12px',
          lineHeight: 1.7,
          color: 'var(--color-text)',
          overflowX: 'auto',
          whiteSpace: 'pre',
          maxHeight: '480px',
          overflowY: 'auto',
        }}>
          {renderHighlighted(contratText, [nomEntreprise, siret, adresse, nomDirigeant])}
        </pre>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
        <button
          onClick={handleCopy}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '9px 16px',
            borderRadius: '8px',
            background: copied ? 'var(--color-safe)' : 'var(--color-accent)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            transition: 'background 0.15s ease',
          }}
        >
          {copied ? <Check size={14} strokeWidth={1.5} /> : <Copy size={14} strokeWidth={1.5} />}
          {copied ? 'Copié !' : 'Copier le contrat'}
        </button>

        <a
          href={`/api/rapport-pdf?type=contrat&session_id=${sessionId}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '9px 16px',
            borderRadius: '8px',
            background: 'transparent',
            color: 'var(--color-text)',
            border: '1.5px solid var(--color-border)',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          <FileSignature size={14} strokeWidth={1.5} />
          Télécharger en PDF
        </a>

        <button
          onClick={() => window.print()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '9px 16px',
            borderRadius: '8px',
            background: 'transparent',
            color: 'var(--color-muted)',
            border: '1.5px solid var(--color-border)',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          <Printer size={14} strokeWidth={1.5} />
          Imprimer
        </button>
      </div>
    </div>
  )
}
