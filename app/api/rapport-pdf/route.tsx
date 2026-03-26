import { NextRequest } from 'next/server'
import { redirect } from 'next/navigation'
import Stripe from 'stripe'
import React from 'react'
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer'
import { fetchCompany } from '@/lib/fetchCompany'
import type { SyntheseResult } from '@/app/api/rapport-synthese/route'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 40,
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: '#2db96e',
  },
  logo: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#2db96e' },
  headerMeta: { fontSize: 9, color: '#666', textAlign: 'right' },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  section: { marginBottom: 18 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#333',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  label: { width: '38%', color: '#666', fontSize: 9 },
  value: { flex: 1, fontFamily: 'Helvetica-Bold', fontSize: 9 },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 8,
    marginBottom: 18,
  },
  scoreNum: { fontSize: 32, fontFamily: 'Helvetica-Bold' },
  scoreLabel: { fontSize: 9, color: '#666', marginTop: 2 },
  synthBlock: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  synthTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#166534', marginBottom: 8 },
  synthResume: { fontSize: 10, lineHeight: 1.6, color: '#1a1a1a', marginBottom: 10 },
  bullet: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  bulletDot: { fontSize: 9, color: '#2db96e' },
  bulletText: { fontSize: 9, flex: 1, color: '#1a1a1a' },
  bulletRed: { fontSize: 9, color: '#ef4444' },
  recommBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  recommText: { fontSize: 9, color: '#555', fontStyle: 'italic' },
  bodaccRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  bodaccDot: { width: 8, height: 8, borderRadius: 4, marginTop: 2 },
  bodaccContent: { flex: 1 },
  bodaccDate: { fontSize: 8, color: '#888', marginBottom: 1 },
  bodaccFamille: { fontSize: 9, fontFamily: 'Helvetica-Bold' },
  rgeChip: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 8,
    color: '#166534',
    marginRight: 4,
    marginBottom: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 8, color: '#999' },
})

function scoreColor(score: number) {
  if (score >= 80) return '#16a34a'
  if (score >= 50) return '#d97706'
  return '#dc2626'
}

function recommColors(r: string) {
  if (r === 'FIABLE') return { bg: '#f0fdf4', color: '#166534' }
  if (r === 'RISQUE') return { bg: '#fef2f2', color: '#dc2626' }
  return { bg: '#fffbeb', color: '#92400e' }
}

function RapportPDF({
  result,
  synthese,
  dateGeneration,
}: {
  result: Awaited<ReturnType<typeof fetchCompany>>
  synthese: SyntheseResult | null
  dateGeneration: string
}) {
  const sc = scoreColor(result.score)
  return (
    <Document title={`Rapport Verifio — ${result.nom}`} author="Verifio">
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>Verifio</Text>
            <Text style={{ fontSize: 8, color: '#666', marginTop: 2 }}>Rapport officiel d&apos;analyse artisan</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.headerMeta}>Généré le {dateGeneration}</Text>
            <Text style={[styles.headerMeta, { marginTop: 2, fontFamily: 'Helvetica-Bold', color: '#2db96e' }]}>
              verifio-eight.vercel.app
            </Text>
          </View>
        </View>

        {/* Score */}
        <View style={[styles.scoreBox, { backgroundColor: sc + '15', borderWidth: 1, borderColor: sc + '40' }]}>
          <View>
            <Text style={[styles.scoreNum, { color: sc }]}>{result.score}</Text>
            <Text style={styles.scoreLabel}>Score /100</Text>
          </View>
          <View style={{ flex: 1, paddingLeft: 14 }}>
            <Text style={{ fontSize: 15, fontFamily: 'Helvetica-Bold', marginBottom: 3 }}>{result.nom}</Text>
            <Text style={{ fontSize: 9, color: '#666', marginBottom: 5 }}>{result.activite}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Text style={[styles.badge, {
                backgroundColor: result.statut === 'actif' ? '#f0fdf4' : '#fef2f2',
                color: result.statut === 'actif' ? '#166534' : '#dc2626',
              }]}>
                {result.statut === 'actif' ? '● Actif' : '● Fermé'}
              </Text>
              {result.rge.certifie && (
                <Text style={[styles.badge, { backgroundColor: '#f0fdf4', color: '#166534' }]}>
                  ✓ RGE
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Synthèse IA */}
        {synthese && (
          <View style={styles.synthBlock}>
            <Text style={styles.synthTitle}>Synthèse Verifio</Text>
            <Text style={styles.synthResume}>{synthese.resume}</Text>

            {synthese.points_forts.length > 0 && (
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 4, color: '#166534' }}>
                  Points forts
                </Text>
                {synthese.points_forts.map((p, i) => (
                  <View key={i} style={styles.bullet}>
                    <Text style={styles.bulletDot}>✓</Text>
                    <Text style={styles.bulletText}>{p}</Text>
                  </View>
                ))}
              </View>
            )}

            {synthese.points_attention.length > 0 && (
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 4, color: '#b45309' }}>
                  Points d&apos;attention
                </Text>
                {synthese.points_attention.map((p, i) => (
                  <View key={i} style={styles.bullet}>
                    <Text style={styles.bulletRed}>⚠</Text>
                    <Text style={styles.bulletText}>{p}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={[styles.recommBadge, { backgroundColor: recommColors(synthese.recommandation).bg }]}>
              <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: recommColors(synthese.recommandation).color }}>
                {synthese.recommandation}
              </Text>
            </View>
            <Text style={styles.recommText}>{synthese.recommandation_texte}</Text>
          </View>
        )}

        {/* Identité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations légales</Text>
          {[
            { label: 'SIRET', value: result.siret },
            { label: 'Forme juridique', value: result.formeJuridique },
            { label: 'Date de création', value: result.dateCreation ? new Date(result.dateCreation).toLocaleDateString('fr-FR') : '-' },
            { label: 'Adresse', value: result.adresse },
            { label: 'Effectif', value: result.effectif || 'Non renseigné' },
            ...(result.capitalSocial !== undefined ? [{ label: 'Capital social', value: `${result.capitalSocial.toLocaleString('fr-FR')} €` }] : []),
          ].map((row, i) => (
            <View key={i} style={styles.row}>
              <Text style={styles.label}>{row.label}</Text>
              <Text style={styles.value}>{row.value || '-'}</Text>
            </View>
          ))}
        </View>

        {/* RGE */}
        {result.rge.certifie && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications RGE</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
              {[...new Set(result.rge.domaines)].slice(0, 8).map((d, i) => (
                <Text key={i} style={styles.rgeChip}>{d}</Text>
              ))}
            </View>
            {result.rge.organismes.length > 0 && (
              <Text style={{ fontSize: 8, color: '#666', marginTop: 6 }}>
                Organisme(s) : {[...new Set(result.rge.organismes)].slice(0, 3).join(', ')}
              </Text>
            )}
          </View>
        )}

        {/* Dirigeants */}
        {result.dirigeants.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dirigeants</Text>
            {result.dirigeants.map((d, i) => (
              <View key={i} style={styles.row}>
                <Text style={styles.label}>{d.qualite}</Text>
                <Text style={styles.value}>
                  {[d.prenoms, d.nom].filter(Boolean).join(' ')}
                  {d.anneeNaissance ? ` (né en ${d.anneeNaissance})` : ''}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* BODACC */}
        {result.bodacc.annonces.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Annonces BODACC (5 dernières)</Text>
            {result.bodacc.annonces.slice(0, 5).map((a, i) => {
              const isProc = a.famille.toLowerCase().includes('procédure') || a.famille.toLowerCase().includes('collective')
              return (
                <View key={i} style={styles.bodaccRow}>
                  <View style={[styles.bodaccDot, { backgroundColor: isProc ? '#dc2626' : '#9ca3af' }]} />
                  <View style={styles.bodaccContent}>
                    <Text style={styles.bodaccDate}>
                      {a.date ? new Date(a.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                      {a.tribunal ? ` — ${a.tribunal}` : ''}
                    </Text>
                    <Text style={[styles.bodaccFamille, { color: isProc ? '#dc2626' : '#1a1a1a' }]}>
                      {a.famille}
                    </Text>
                  </View>
                </View>
              )
            })}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Données issues de l&apos;INSEE, ADEME et BODACC — verifio-eight.vercel.app
          </Text>
          <Text style={styles.footerText}>
            Ce rapport ne garantit pas la qualité des travaux.
          </Text>
        </View>

      </Page>
    </Document>
  )
}

// ── Contrat PDF ───────────────────────────────────────────────────────────────
function buildContratText(nomEntreprise: string, siret: string, adresse: string, nomDirigeant: string) {
  return [
    'CONTRAT DE PRESTATION DE TRAVAUX',
    '═══════════════════════════════════════════════════════',
    'Entre les soussignés :',
    '',
    "L'ARTISAN",
    `Raison sociale : ${nomEntreprise}`,
    `SIRET : ${siret}`,
    `Adresse : ${adresse}`,
    `Représenté par : ${nomDirigeant}`,
    '',
    'LE CLIENT',
    'Nom : ___________________________',
    'Adresse : ___________________________',
    'Téléphone : ___________________________',
    'Email : ___________________________',
    '',
    'OBJET DES TRAVAUX',
    'Nature des travaux : ___________________________',
    'Adresse du chantier : ___________________________',
    'Date de début prévue : ___________________________',
    'Durée estimée : ___________________________',
    'Matériaux principaux : ___________________________',
    '',
    'CONDITIONS FINANCIÈRES',
    'Montant total TTC : ___________________________',
    'Acompte à la signature (max 30 %) : ___________________________',
    '2ème versement (mi-chantier) : ___________________________',
    'Solde à la réception : ___________________________',
    'Mode de paiement : ___________________________',
    '',
    'GARANTIES',
    "L'artisan certifie être couvert par une assurance décennale.",
    'Numéro de police : ___________________________',
    'Assureur : ___________________________',
    'Validité : ___________________________',
    '',
    'CONDITIONS GÉNÉRALES',
    '- Les travaux supplémentaires feront l\'objet d\'un avenant écrit.',
    '- Tout retard de paiement entraîne des pénalités de 3x le taux légal.',
    '- En cas de litige, les parties s\'engagent à tenter une médiation',
    '  avant tout recours judiciaire.',
    '- Le présent contrat est soumis au droit français.',
    '',
    'RÉCEPTION DES TRAVAUX',
    'Les travaux feront l\'objet d\'un procès-verbal de réception',
    'signé contradictoirement par les deux parties.',
    'La réception déclenche :',
    '- Garantie de parfait achèvement (1 an)',
    '- Garantie biennale (2 ans)',
    '- Garantie décennale (10 ans)',
    '',
    '═══════════════════════════════════════════════════════',
    'Fait à _______________, le _______________',
    '',
    'Signature de l\'artisan :        Signature du client :',
    '(précédée de "Lu et approuvé")  (précédée de "Lu et approuvé")',
    '',
    '___________________________     ___________________________',
  ]
}

const contratStyles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, padding: 40, color: '#1a1a1a', backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: '#2db96e' },
  logo: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#2db96e' },
  meta: { fontSize: 8, color: '#888', textAlign: 'right' },
  line: { marginBottom: 3, lineHeight: 1.5 },
  bold: { fontFamily: 'Helvetica-Bold', fontSize: 10 },
  separator: { fontSize: 9, color: '#aaa', marginBottom: 3 },
  footer: { position: 'absolute', bottom: 24, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 7, color: '#999' },
})

function ContratPDF({ lines, dateGeneration, nomEntreprise }: { lines: string[]; dateGeneration: string; nomEntreprise: string }) {
  return (
    <Document title={`Contrat — ${nomEntreprise}`} author="Verifio">
      <Page size="A4" style={contratStyles.page}>
        <View style={contratStyles.header}>
          <View>
            <Text style={contratStyles.logo}>Verifio</Text>
            <Text style={{ fontSize: 8, color: '#666', marginTop: 2 }}>Modèle de contrat de prestation</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={contratStyles.meta}>Généré le {dateGeneration}</Text>
            <Text style={[contratStyles.meta, { color: '#2db96e', fontFamily: 'Helvetica-Bold', marginTop: 2 }]}>verifio-eight.vercel.app</Text>
          </View>
        </View>
        {lines.map((line, i) => {
          if (line.startsWith('═')) return <Text key={i} style={contratStyles.separator}>{line}</Text>
          if (line === 'CONTRAT DE PRESTATION DE TRAVAUX') return <Text key={i} style={[contratStyles.bold, { marginBottom: 6, fontSize: 12, color: '#1B4332' }]}>{line}</Text>
          const isSectionHeader = /^[A-ZÀÈÉÊËÎÏÔÙÛÜ\s'&]+$/.test(line) && line.length > 3 && !line.startsWith('-') && !line.startsWith('(') && !line.includes(':') && !line.includes('___')
          if (isSectionHeader && line.trim().length > 0) return <Text key={i} style={[contratStyles.bold, { marginTop: 10, marginBottom: 4, color: '#1B4332', fontSize: 9 }]}>{line}</Text>
          return <Text key={i} style={contratStyles.line}>{line || ' '}</Text>
        })}
        <View style={contratStyles.footer} fixed>
          <Text style={contratStyles.footerText}>Modèle non contractuel — à adapter selon votre situation</Text>
          <Text style={contratStyles.footerText}>Verifio · verifio-eight.vercel.app</Text>
        </View>
      </Page>
    </Document>
  )
}

async function getSynthese(result: Awaited<ReturnType<typeof fetchCompany>>): Promise<SyntheseResult | null> {
  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
    const input = {
      nom: result.nom, siret: result.siret, score: result.score,
      statut: result.statut, dateCreation: result.dateCreation,
      formeJuridique: result.formeJuridique, effectif: result.effectif || '',
      certifieRge: result.rge.certifie, domainesRge: result.rge.domaines,
      dirigeants: result.dirigeants.map(d => ({ nom: d.nom, qualite: d.qualite, anneeNaissance: d.anneeNaissance })),
      nbAnnoncesBodacc: result.bodacc.annonces.length,
      proceduresCollectives: result.bodacc.annonces.filter(a =>
        a.famille.toLowerCase().includes('procédure') || a.famille.toLowerCase().includes('collective')
      ).length,
    }
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: `Tu es un expert en analyse juridique et financière d'entreprises du bâtiment. Réponds toujours en JSON strict, sans markdown, sans backticks.`,
      messages: [{ role: 'user', content: `Génère une synthèse JSON : {"resume":"...","points_forts":[],"points_attention":[],"recommandation":"FIABLE"|"VIGILANCE"|"RISQUE","recommandation_texte":"..."}. Données : ${JSON.stringify(input)}` }],
    })
    const text = msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    return JSON.parse(cleaned) as SyntheseResult
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const type = searchParams.get('type') ?? 'rapport'
  const siret = searchParams.get('siret')
  const session_id = searchParams.get('session_id')

  if (!session_id) {
    return new Response('Paramètre session_id manquant', { status: 400 })
  }
  if (!siret) {
    return new Response('Paramètre siret manquant', { status: 400 })
  }

  // Vérification Stripe
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })
    const session = await stripe.checkout.sessions.retrieve(session_id)
    if (session.payment_status !== 'paid') {
      console.error('[rapport-pdf] Paiement non confirmé pour session', session_id)
      return new Response('Paiement non confirmé', { status: 403 })
    }
  } catch (err) {
    console.error('[rapport-pdf] Erreur vérification Stripe:', err)
    return new Response('Session Stripe invalide', { status: 403 })
  }

  // Données artisan
  let result: Awaited<ReturnType<typeof fetchCompany>>
  try {
    result = await fetchCompany(siret)
  } catch (err) {
    console.error('[rapport-pdf] Erreur fetchCompany pour siret', siret, ':', err)
    return new Response('Erreur chargement données artisan', { status: 500 })
  }

  const dateGeneration = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  // Génération PDF contrat
  if (type === 'contrat') {
    try {
      const dirigeant = result.dirigeants?.[0]
      const nomDirigeant = dirigeant ? `${dirigeant.nom}${dirigeant.qualite ? ` (${dirigeant.qualite})` : ''}` : 'Non renseigné'
      const adresse = result.adresse || 'Non renseignée'
      const lines = buildContratText(result.nom, result.siret, adresse, nomDirigeant)
      const pdfBuffer = await renderToBuffer(
        <ContratPDF lines={lines} dateGeneration={dateGeneration} nomEntreprise={result.nom} />
      )
      return new Response(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="contrat-verifio-${siret}.pdf"`,
          'Cache-Control': 'no-store',
        },
      })
    } catch (err) {
      console.error('[rapport-pdf] Erreur génération PDF contrat:', err)
      return new Response('Erreur génération PDF contrat', { status: 500 })
    }
  }

  // Génération PDF rapport complet
  try {
    const synthese = await getSynthese(result)
    const pdfBuffer = await renderToBuffer(
      <RapportPDF result={result} synthese={synthese} dateGeneration={dateGeneration} />
    )
    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="rapport-verifio-${siret}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[rapport-pdf] Erreur génération PDF rapport:', err)
    return new Response('Erreur génération PDF rapport', { status: 500 })
  }
}
