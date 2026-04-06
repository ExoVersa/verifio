'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'

const TYPES_TRAVAUX = [
  'Plomberie', 'Électricité', 'Maçonnerie', 'Charpente', 'Couverture',
  'Isolation', 'Menuiserie', 'Peinture', 'Carrelage', 'Chauffage',
  'Climatisation', 'Autre',
]

interface FormData {
  // Étape 1
  siret: string
  nomEntreprise: string
  adresse: string
  typesTravaux: string[]
  zoneIntervention: string
  siteWeb: string
  // Étape 2
  nomDirigeant: string
  email: string
  telephone: string
  motDePasse: string
  motDePasseConfirm: string
  cguAcceptees: boolean
}

export default function InscriptionArtisanPage() {
  const router = useRouter()
  useEffect(() => { router.push('/') }, [])

  const [etape, setEtape] = useState<1 | 2>(1)
  const [form, setForm] = useState<FormData>({
    siret: '',
    nomEntreprise: '',
    adresse: '',
    typesTravaux: [],
    zoneIntervention: '',
    siteWeb: '',
    nomDirigeant: '',
    email: '',
    telephone: '',
    motDePasse: '',
    motDePasseConfirm: '',
    cguAcceptees: false,
  })
  const [fichier, setFichier] = useState<File | null>(null)
  const [siretLoading, setSiretLoading] = useState(false)
  const [erreurs, setErreurs] = useState<string[]>([])
  const [submitLoading, setSubmitLoading] = useState(false)
  const [succes, setSucces] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function onSiretChange(value: string) {
    const cleaned = value.replace(/\D/g, '').slice(0, 14)
    setField('siret', cleaned)

    if (cleaned.length === 14) {
      setSiretLoading(true)
      try {
        const res = await fetch(
          `https://recherche-entreprises.api.gouv.fr/search?q=${cleaned}&per_page=1`
        )
        const data = await res.json()
        const result = data?.results?.[0]
        if (result) {
          const siege = result.siege
          const nom = result.nom_raison_sociale || result.nom_complet || ''
          const adresseArr = [
            siege?.numero_voie,
            siege?.type_voie,
            siege?.libelle_voie,
            siege?.code_postal,
            siege?.libelle_commune,
          ].filter(Boolean)
          setField('nomEntreprise', nom)
          setField('adresse', adresseArr.join(' '))
        }
      } catch {
        // Silencieux — l'utilisateur peut remplir manuellement
      } finally {
        setSiretLoading(false)
      }
    }
  }

  function toggleTypeTravail(type: string) {
    setField(
      'typesTravaux',
      form.typesTravaux.includes(type)
        ? form.typesTravaux.filter(t => t !== type)
        : [...form.typesTravaux, type]
    )
  }

  function validerEtape1(): string[] {
    const errs: string[] = []
    if (form.siret.length !== 14) errs.push('Le SIRET doit comporter 14 chiffres.')
    if (!form.nomEntreprise.trim()) errs.push('Le nom de l\'entreprise est requis.')
    if (form.typesTravaux.length === 0) errs.push('Sélectionnez au moins un type de travaux.')
    return errs
  }

  function continuerEtape2() {
    const errs = validerEtape1()
    if (errs.length > 0) {
      setErreurs(errs)
      return
    }
    setErreurs([])
    setEtape(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function validerEtape2(): string[] {
    const errs: string[] = []
    if (!form.nomDirigeant.trim()) errs.push('Le nom du dirigeant est requis.')
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.push('L\'email est invalide.')
    if (!form.telephone.trim()) errs.push('Le téléphone est requis.')
    if (!fichier) errs.push('Le justificatif est requis.')
    if (fichier && fichier.size > 5 * 1024 * 1024) errs.push('Le fichier ne doit pas dépasser 5 Mo.')
    if (form.motDePasse.length < 8) errs.push('Le mot de passe doit comporter au moins 8 caractères.')
    if (form.motDePasse !== form.motDePasseConfirm) errs.push('Les mots de passe ne correspondent pas.')
    if (!form.cguAcceptees) errs.push('Vous devez accepter les CGU.')
    return errs
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault()
    const errs = validerEtape2()
    if (errs.length > 0) {
      setErreurs(errs)
      return
    }
    setErreurs([])
    setSubmitLoading(true)

    try {
      const fd = new FormData()
      fd.append('siret', form.siret)
      fd.append('nomEntreprise', form.nomEntreprise)
      fd.append('adresse', form.adresse)
      fd.append('typesTravaux', JSON.stringify(form.typesTravaux))
      fd.append('zoneIntervention', form.zoneIntervention)
      fd.append('siteWeb', form.siteWeb)
      fd.append('nomDirigeant', form.nomDirigeant)
      fd.append('email', form.email)
      fd.append('telephone', form.telephone)
      fd.append('motDePasse', form.motDePasse)
      if (fichier) fd.append('justificatif', fichier)

      const res = await fetch('/api/artisan/register', { method: 'POST', body: fd })
      const data = await res.json()

      if (!res.ok) {
        setErreurs([data.error || 'Erreur lors de l\'envoi.'])
      } else {
        setSucces(true)
      }
    } catch {
      setErreurs(['Erreur réseau. Vérifiez votre connexion.'])
    } finally {
      setSubmitLoading(false)
    }
  }

  if (succes) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
        <SiteHeader />
        <div style={{
          maxWidth: '560px', margin: '0 auto', padding: '80px 24px',
          textAlign: 'center',
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: '#f0fdf4', border: '2px solid #86efac',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', margin: '0 auto 24px',
          }}>
            ✓
          </div>
          <h1 className="font-display" style={{
            margin: '0 0 16px', fontSize: '28px', fontWeight: 900,
            color: 'var(--color-text)', letterSpacing: '-0.02em',
          }}>
            Demande envoyée !
          </h1>
          <p style={{ margin: '0 0 24px', fontSize: '16px', color: 'var(--color-muted)', lineHeight: 1.65 }}>
            Votre dossier a bien été reçu. Notre équipe le vérifie sous <strong>24h ouvrées</strong>. Vous recevrez un email de confirmation à <strong>{form.email}</strong>.
          </p>
          <Link
            href="/"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: '#1B4332', color: '#fff',
              padding: '13px 24px', borderRadius: '12px',
              fontSize: '14px', fontWeight: 700, textDecoration: 'none',
            }}
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <SiteHeader />

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <Link
            href="/espace-artisan"
            style={{ fontSize: '13px', color: 'var(--color-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '16px' }}
          >
            ← Retour
          </Link>
          <h1 className="font-display" style={{
            margin: '0 0 8px', fontSize: '28px', fontWeight: 900,
            color: 'var(--color-text)', letterSpacing: '-0.02em',
          }}>
            Créer mon dossier artisan
          </h1>
          <p style={{ margin: 0, fontSize: '15px', color: 'var(--color-muted)' }}>
            {etape === 1 ? 'Étape 1/2 — Votre entreprise' : 'Étape 2/2 — Votre identité'}
          </p>
        </div>

        {/* Progress bar */}
        <div style={{
          height: '4px', background: 'var(--color-border)', borderRadius: '4px',
          marginBottom: '36px', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', background: '#1B4332', borderRadius: '4px',
            width: etape === 1 ? '50%' : '100%',
            transition: 'width 0.3s ease',
          }} />
        </div>

        {/* Erreurs */}
        {erreurs.length > 0 && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: '12px', padding: '16px 20px',
            marginBottom: '24px',
          }}>
            {erreurs.map((e, i) => (
              <p key={i} style={{ margin: i === 0 ? 0 : '6px 0 0', fontSize: '13px', color: '#dc2626' }}>
                • {e}
              </p>
            ))}
          </div>
        )}

        {/* ── ÉTAPE 1 ── */}
        {etape === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={labelStyle}>
                SIRET de l&apos;entreprise <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="14 chiffres"
                  value={form.siret}
                  onChange={e => onSiretChange(e.target.value)}
                  maxLength={14}
                  style={inputStyle}
                />
                {siretLoading && (
                  <div style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    fontSize: '12px', color: 'var(--color-muted)',
                  }}>
                    Recherche…
                  </div>
                )}
              </div>
              <p style={hintStyle}>Nous récupérons automatiquement les informations de votre entreprise.</p>
            </div>

            <div>
              <label style={labelStyle}>
                Nom de l&apos;entreprise <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                value={form.nomEntreprise}
                onChange={e => setField('nomEntreprise', e.target.value)}
                style={inputStyle}
                placeholder="Raison sociale ou nom commercial"
              />
            </div>

            <div>
              <label style={labelStyle}>Adresse du siège</label>
              <input
                type="text"
                value={form.adresse}
                onChange={e => setField('adresse', e.target.value)}
                style={inputStyle}
                placeholder="Adresse complète"
              />
            </div>

            <div>
              <label style={labelStyle}>
                Types de travaux <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '8px',
                padding: '16px', background: 'var(--color-surface)',
                border: '1px solid var(--color-border)', borderRadius: '12px',
              }}>
                {TYPES_TRAVAUX.map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleTypeTravail(type)}
                    style={{
                      padding: '6px 14px', borderRadius: '100px',
                      fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                      border: form.typesTravaux.includes(type)
                        ? '1.5px solid #1B4332'
                        : '1.5px solid var(--color-border)',
                      background: form.typesTravaux.includes(type)
                        ? 'rgba(27,67,50,0.08)'
                        : 'transparent',
                      color: form.typesTravaux.includes(type) ? '#1B4332' : 'var(--color-muted)',
                      transition: 'all 0.12s',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {form.typesTravaux.includes(type) ? '✓ ' : ''}{type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Zone d&apos;intervention</label>
              <input
                type="text"
                value={form.zoneIntervention}
                onChange={e => setField('zoneIntervention', e.target.value)}
                style={inputStyle}
                placeholder="Ex : 37, 41, 45"
              />
              <p style={hintStyle}>Départements séparés par des virgules.</p>
            </div>

            <div>
              <label style={labelStyle}>Site web (optionnel)</label>
              <input
                type="url"
                value={form.siteWeb}
                onChange={e => setField('siteWeb', e.target.value)}
                style={inputStyle}
                placeholder="https://mon-site.fr"
              />
            </div>

            <button
              type="button"
              onClick={continuerEtape2}
              style={ctaStyle}
            >
              Continuer →
            </button>
          </div>
        )}

        {/* ── ÉTAPE 2 ── */}
        {etape === 2 && (
          <form onSubmit={soumettre} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            <div>
              <label style={labelStyle}>
                Prénom et nom du dirigeant <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                value={form.nomDirigeant}
                onChange={e => setField('nomDirigeant', e.target.value)}
                style={inputStyle}
                placeholder="Jean Dupont"
              />
            </div>

            <div>
              <label style={labelStyle}>
                Email professionnel <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setField('email', e.target.value)}
                style={inputStyle}
                placeholder="contact@mon-entreprise.fr"
                autoComplete="email"
              />
            </div>

            <div>
              <label style={labelStyle}>
                Téléphone <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="tel"
                value={form.telephone}
                onChange={e => setField('telephone', e.target.value)}
                style={inputStyle}
                placeholder="06 12 34 56 78"
              />
            </div>

            <div>
              <label style={labelStyle}>
                Justificatif <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <p style={hintStyle}>Kbis de moins de 3 mois OU pièce d&apos;identité du dirigeant (PDF, JPG, PNG — max 5 Mo)</p>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--color-border)',
                  borderRadius: '12px', padding: '24px',
                  textAlign: 'center', cursor: 'pointer',
                  background: fichier ? 'rgba(27,67,50,0.04)' : 'var(--color-surface)',
                  transition: 'border-color 0.15s',
                }}
              >
                {fichier ? (
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, color: '#1B4332' }}>
                      ✓ {fichier.name}
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)' }}>
                      {(fichier.size / 1024 / 1024).toFixed(2)} Mo — Cliquer pour changer
                    </p>
                  </div>
                ) : (
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '14px', color: 'var(--color-muted)' }}>
                      📎 Cliquer pour sélectionner un fichier
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)' }}>
                      PDF, JPG, PNG — max 5 Mo
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
                onChange={e => {
                  const f = e.target.files?.[0] || null
                  setFichier(f)
                }}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Mot de passe <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="password"
                value={form.motDePasse}
                onChange={e => setField('motDePasse', e.target.value)}
                style={inputStyle}
                placeholder="Minimum 8 caractères"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label style={labelStyle}>
                Confirmer le mot de passe <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="password"
                value={form.motDePasseConfirm}
                onChange={e => setField('motDePasseConfirm', e.target.value)}
                style={inputStyle}
                placeholder="Répétez le mot de passe"
                autoComplete="new-password"
              />
            </div>

            <label style={{
              display: 'flex', alignItems: 'flex-start', gap: '10px',
              cursor: 'pointer', fontSize: '13px', color: 'var(--color-muted)', lineHeight: 1.5,
            }}>
              <input
                type="checkbox"
                checked={form.cguAcceptees}
                onChange={e => setField('cguAcceptees', e.target.checked)}
                style={{ marginTop: '2px', accentColor: '#1B4332', flexShrink: 0 }}
              />
              <span>
                J&apos;accepte les{' '}
                <Link href="/cgu" target="_blank" style={{ color: '#1B4332', fontWeight: 600 }}>
                  Conditions Générales d&apos;Utilisation
                </Link>{' '}
                et la{' '}
                <Link href="/politique-confidentialite" target="_blank" style={{ color: '#1B4332', fontWeight: 600 }}>
                  Politique de confidentialité
                </Link>{' '}
                de Rien qui cloche.{' '}
                <span style={{ color: '#dc2626' }}>*</span>
              </span>
            </label>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => { setEtape(1); setErreurs([]) }}
                style={{
                  ...ctaStyle,
                  background: 'transparent',
                  color: 'var(--color-muted)',
                  border: '1.5px solid var(--color-border)',
                  flex: '0 0 auto',
                }}
              >
                ← Retour
              </button>
              <button
                type="submit"
                disabled={submitLoading}
                style={{ ...ctaStyle, flex: 1, opacity: submitLoading ? 0.7 : 1 }}
              >
                {submitLoading ? 'Envoi en cours…' : 'Envoyer ma demande →'}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '13px', fontWeight: 700,
  color: 'var(--color-text)', marginBottom: '6px',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px',
  background: 'var(--color-surface)',
  border: '1.5px solid var(--color-border)',
  borderRadius: '10px', fontSize: '14px',
  color: 'var(--color-text)', fontFamily: 'var(--font-body)',
  outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

const hintStyle: React.CSSProperties = {
  margin: '4px 0 0', fontSize: '12px', color: 'var(--color-muted)',
}

const ctaStyle: React.CSSProperties = {
  padding: '14px 24px',
  background: '#1B4332', color: '#fff',
  borderRadius: '12px', fontSize: '15px', fontWeight: 700,
  cursor: 'pointer', border: 'none', fontFamily: 'var(--font-body)',
  textAlign: 'center',
}
