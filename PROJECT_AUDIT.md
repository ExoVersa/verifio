# PROJECT_AUDIT.md — Verifio
> Audit technique complet — état réel du code au 29 mars 2026.
> Inclut toutes les modifications effectuées du 24 au 29 mars 2026.
> Ne pas modifier ce fichier manuellement — il est regénéré par inspection du code.

## Utilisation par les agents

Ce fichier est la vérité technique du projet.

Tout agent doit :
- le lire avant toute modification importante
- s'y référer pour éviter les régressions
- ne jamais supposer un comportement sans vérifier ici

Ce fichier fait autorité sur :
- auth
- Stripe
- Supabase
- flows critiques

---

## 1. Auth & Utilisateurs

### Flow login email + password

**Fichier :** `app/auth/page.tsx`

1. L'utilisateur saisit email + mot de passe dans `LoginForm`
2. Submit → `handleLogin()` dans `AuthPageInner`
3. Appel Supabase :
   ```typescript
   supabase.auth.signInWithPassword({ email, password })
   ```
4. Succès → `router.push(redirectTo || '/')` (supporte `?redirect=/artisan/[siret]`)
5. Erreur → `setError('E-mail ou mot de passe incorrect.')`

### Flow signup email + password

1. L'utilisateur remplit `SignupForm` : prénom, nom, email, mot de passe (×2), CGU
2. Validations client-side :
   - Mots de passe non identiques → `"Les mots de passe ne correspondent pas."`
   - CGU non coché → `"Veuillez accepter les CGU pour continuer."`
3. Appel Supabase :
   ```typescript
   supabase.auth.signUp({
     email,
     password,
     options: { data: { prenom, nom } }
   })
   ```
4. Succès → message `"Compte créé ! Vérifiez votre e-mail pour confirmer."`

### Indicateur de force du mot de passe

Composant `PasswordStrength({ password })` — évalue 4 critères :
- longueur ≥ 8
- au moins une majuscule
- au moins un chiffre
- au moins un caractère spécial

Score 0–4 → 4 barres colorées (rouge → vert)

### Flow Google OAuth

**Statut : fonctionnel (implémenté le 24 mars 2026)**

- `handleGoogleAuth()` dans `AuthPageInner` :
  ```typescript
  supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/callback` }
  })
  ```
- Route callback **`app/auth/callback/route.ts`** existe et gère le code OAuth → session
- Bouton "Continuer avec Google" branché dans `LoginForm` (onClick)
- Bouton "S'inscrire avec Google" ajouté dans `SignupForm` (même handler)
- `onGoogleAuth` passé en prop aux deux formulaires depuis `AuthPageInner`

⚠️ **À configurer en prod** : Supabase Dashboard → Authentication → Providers → Google (Client ID + Secret). Callback URL à autoriser dans Google Console : `https://eflaghdxvrfenyqkrfnt.supabase.co/auth/v1/callback`

### Architecture des composants Auth

`LoginForm` et `SignupForm` sont définis **au niveau MODULE** (hors du composant parent `AuthPageInner`). C'est intentionnel : si définis à l'intérieur, React les recrée à chaque render, cassant le focus des inputs. Les props nécessaires sont passées explicitement.

### Paramètre `?redirect`

La page `/auth` supporte `?redirect=/artisan/[siret]` — après login, redirige vers l'URL souhaitée au lieu de `/`.

### Table `auth.users` (Supabase built-in)

| Colonne | Contenu |
|---------|---------|
| `id` | UUID généré automatiquement |
| `email` | Email de l'utilisateur |
| `encrypted_password` | Hash du mot de passe |
| `raw_user_meta_data` | JSON — contient `{ prenom, nom }` depuis le signup |
| `email_confirmed_at` | Timestamp de confirmation email |

### Gestion des rôles utilisateur

Pas de système de rôles custom. Distinction :
- **Admin** : comparaison d'email hardcodé (`NEXT_PUBLIC_ADMIN_EMAIL || 'couratincharlie@gmail.com'`)
- **Artisan vérifié** : enregistrement dans `artisans` avec `statut = 'verifie'`
- **Particulier** : tout autre utilisateur authentifié

---

## 2. Flow Paiement Stripe

### `POST /api/checkout`

**Fichier :** `app/api/checkout/route.ts`

Input JSON :
```typescript
{
  plan: 'serenite',
  siret?: string,
  nom?: string,
  user_id: string  // id Supabase auth, stocké en metadata Stripe
}
```

**Pack Sérénité :**
- Mode : `'payment'` (one-time)
- Montant : **490 cents (€4,90)** — corrigé le 24 mars (était 1990 = €19,90)
- Nom produit : `"Pack Sérénité — ${nom}"`
- Success URL : `/rapport/succes?siret=${siret}&session_id={CHECKOUT_SESSION_ID}&new=true`
- Metadata Stripe : `{ plan: 'serenite', siret, nom, user_id }`

### Page `/rapport/succes`

**Fichier :** `app/rapport/succes/page.tsx` — Server Component (`force-dynamic`)

**Vérification Stripe :** La page vérifie `payment_status === 'paid'` via `stripe.checkout.sessions.retrieve(session_id)`. Si non payé → `redirect('/recherche')`. Si `session_id` absent → `redirect('/recherche')`.

**Récupération `user_id` :** `stripeSession.metadata?.user_id` (transmis lors du checkout)

**Workflow complet :**
1. Vérification Stripe → paiement confirmé ou redirect
2. `fetchCompany(siret)` → données artisan complètes
3. Si `userId` présent :
   - `supabaseAdmin.auth.admin.getUserById(userId)` → récupère `userEmail`
   - Vérifie si rapport déjà inséré (`stripe_session_id` unique) → évite les doublons
   - Si nouveau : INSERT dans `rapports` (service role, bypass RLS)
   - INSERT/UPSERT dans `surveillances` avec `email` + `user_id` + `expires_at` (6 mois)
   - Envoi email de confirmation via Resend (`buildConfirmationEmail`)
4. Génération synthèse IA via Anthropic claude-sonnet-4-6 (fallback vide si pas de clé)

**Client Supabase utilisé :** `createClient(url, SUPABASE_SERVICE_ROLE_KEY)` — bypass RLS complet

**Sections du rapport affiché :**
1. `SiteHeader` en haut de page
2. Sub-header sticky : "Verifio · Rapport complet · [Nom entreprise]" + boutons PDF / Partage
3. Bouton retour contextuel (`?from=mon-espace` → "Mes rapports", sinon → "Retour à la fiche")
4. Bandeau features débloquées : 6 items avec icônes (PDF, Analyse devis, Surveillance, BODACC, Synthèse IA, Carnet chantier)
5. Score + statut (ScoreRing animé)
6. Synthèse IA (skeleton pendant chargement, fallback "indisponible" si pas de clé)
7. Données identité (SIRET, forme juridique, date création, adresse, capital, effectif)
8. Certifications RGE (cards avec icônes thématiques)
9. Régularité financière / Procédures collectives BODACC
10. Dirigeants (jusqu'à 5)
11. Historique changements statut
12. Annonces BODACC redesign — cards colorées par type :
    - `dpc` → bleu `#3B82F6`
    - `modification` → orange `#F59E0B`
    - `vente` → violet `#8B5CF6`
    - `immatriculation` → vert `var(--color-safe)`
    - `radiation` → rouge `var(--color-danger)`
    - procédure collective → rouge avec fond alert + icône AlertTriangle
    - Pagination 5 par page
13. Checklist personnalisée avant de signer (10 items, cochables)
14. Questions à poser à l'artisan (liste)
15. "Vos droits avant de signer" — 4 cartes avec badge Pack Sérénité
16. Modèle de contrat pré-rempli (avec badge Pack Sérénité)
17. Guide recours si ça se passe mal (avec badge Pack Sérénité)
18. Sidebar : score, surveillance active/expiry, CTA "Ouvrir un carnet de chantier" (→ `/nouveau-chantier?siret=&nom=&adresse=&from=rapport&session_id=`)
19. `WelcomeModal` premier achat (`isNew=true`)

**`PackBadge` :** composant partagé `components/PackBadge.tsx` — badge vert translucide avec icône Shield, affiché sur les sections premium.

**`AnalyserDevisButton` :** composant client `components/AnalyserDevisButton.tsx` avec hover state.

### Email de confirmation (Resend)

Envoyé depuis `/rapport/succes` après un nouvel achat. Contenu :
- Score de fiabilité coloré
- SIRET
- Liste des features débloquées
- Lien "Accéder au rapport"
- Info surveillance si activée
- From : `Verifio <onboarding@resend.dev>`

⚠️ **À tester** : nécessite `RESEND_API_KEY` configurée dans Vercel

### PDF rapport

**Fichier :** `app/api/rapport-pdf/route.tsx`

- `?siret=` + `?session_id=` requis
- Vérifie paiement Stripe avant génération
- `?type=contrat` → génère `ContratPDF` uniquement
- Par défaut → génère `RapportPDF` complet
- Retourne `new Response(new Uint8Array(buffer), { headers: { Content-Disposition: attachment } })`

⚠️ **À tester** : vérifier que le téléchargement fonctionne en prod

---

## 3. Tables Supabase

### Table `rapports`

**Migration :** `supabase/migrations/20260325000000_create_rapports.sql`

```sql
TABLE rapports:
  id                uuid          PK, gen_random_uuid()
  user_id           uuid          FK → auth.users(id) ON DELETE SET NULL (nullable)
  siret             text          NOT NULL
  nom_entreprise    text          — ajouté le 26 mars 2026
  stripe_session_id text          UNIQUE NOT NULL
  montant           integer       NOT NULL DEFAULT 490
  statut            text          NOT NULL DEFAULT 'genere'
  created_at        timestamptz   DEFAULT now()
```

**RLS policies :**
- SELECT : `auth.uid() = user_id`
- ALL (service role) : `true`

⚠️ **À appliquer** : si la table n'existe pas encore, exécuter la migration dans Supabase Dashboard → SQL Editor

### Table `surveillances`

Existait avant le 24 mars. Colonnes ajoutées :

**Migration :** `supabase/migrations/20260325000000_surveillance_devis.sql`

```sql
ALTER TABLE surveillances ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE surveillances ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE surveillances ADD COLUMN IF NOT EXISTS statut_initial text; -- ajouté le 27 mars 2026
```

Colonnes notables :
- `email` : NOT NULL (requis pour les alertes cron)
- `siret` : NOT NULL
- `nom_artisan` : texte
- `statut_initial` : statut au moment de l'activation — utilisé par le cron pour détecter les changements ; peut être NULL pour les anciennes lignes (le cron gère ce cas en initialisant sans alerte)
- `user_id` : ajouté pour requêtes par utilisateur (auth.uid())
- `expires_at` : date d'expiration de la surveillance (6 mois après achat)

L'upsert utilisé lors de l'achat :
```typescript
supabaseAdmin.from('surveillances').upsert({
  user_id, siret, email, nom_artisan, expires_at
}, { onConflict: 'email,siret', ignoreDuplicates: false })
```

### Table `devis_uploads`

**Migration :** `supabase/migrations/20260325000000_surveillance_devis.sql`

```sql
TABLE devis_uploads:
  id           uuid    PK
  user_id      uuid    FK → auth.users(id) NOT NULL
  rapport_id   uuid    FK → rapports(id)
  siret        text    NOT NULL
  version      int     DEFAULT 1
  nom_fichier  text
  analyse_json jsonb
  created_at   timestamptz
```

RLS : users can manage own devis (auth.uid() = user_id)

### Table `analyses_devis`

**Ajoutée le 27 mars 2026** pour le quota mensuel de l'analyse devis IA.

```sql
TABLE analyses_devis:
  id              uuid          PK, gen_random_uuid()
  user_id         uuid          FK → auth.users(id) ON DELETE SET NULL (nullable)
  siret_artisan   text          -- SIRET extrait du devis par IA (peut être null)
  ip_address      text          -- IP anonyme si non connecté
  pages_pdf       int
  taille_pdf_bytes bigint
  created_at      timestamptz   DEFAULT now()
```

Utilisation :
- Quota : une analyse gratuite par mois par `user_id` (connecté) ou `ip_address` (anonyme)
- Exception : si l'utilisateur a un rapport Pack Sérénité pour ce SIRET → `pack_serenite_actif = true`, quota ignoré

### Table `artisans`

```sql
TABLE artisans:
  id, user_id, siret (UNIQUE), nom_entreprise, adresse,
  types_travaux[], zone_intervention[], site_web,
  nom_dirigeant, email, telephone, justificatif_url,
  statut (en_attente|verifie|refuse), motif_refus,
  stripe_customer_id, stripe_subscription_id,
  essai_debut, essai_fin, abonnement_actif, badge_actif,
  photo_url, description, created_at
```

---

## 4. Score de Fiabilité

### `lib/score.ts`

```typescript
interface ScoreInput {
  statut: string          // 'actif'|'A' = actif ; tout autre = fermé
  dateCreation?: string
  procedures: {
    collectives: number   // nb de procédures BODACC famille collectif
    disponible: boolean   // false → score = -1 (loading)
  }
}
```

| Critère | Points max | Conditions |
|---------|-----------|------------|
| Statut légal | 40 | Actif = 40, Fermé = 0 |
| Ancienneté | 35 | ≥10 ans = 35, ≥5 = 28, ≥2 = 17, <2 = 7 |
| Procédures BODACC | 25 | 0 proc = 25, 1 proc = 5, ≥2 proc = 0 |

- `score = -1` si `procedures.disponible === false` → ScoreRing gris
- Couleurs breakdown : ratio ≥ 0.8 → vert, ≥ 0.5 → orange, < 0.5 → rouge

---

## 5. Fiche Artisan `/artisan/[siret]`

**Fichier :** `app/artisan/[siret]/page.tsx` (`'use client'`)

### Détection rapport existant

`useEffect` au montage (dépendance `[siret, retryCount]`) :
```typescript
supabase.auth.getUser().then(({ data: { user } }) => {
  if (!user) return
  supabase.from('rapports')
    .select('id, stripe_session_id')
    .eq('user_id', user.id).eq('siret', siret).maybeSingle()
    .then(({ data }) => { if (data) setRapportExistant(data) })
  supabase.from('surveillances')
    .select('expires_at')
    .eq('user_id', user.id).eq('siret', siret).maybeSingle()
    .then(({ data }) => { if (data) setSurveillanceActive(data) })
})
```

### Gestion service indisponible (ajoutée le 27 mars 2026)

États : `isServiceDown: boolean`, `retryCount: number`

- Si la réponse de `/api/search` contient `error === 'service_indisponible'` (HTTP 503) :
  - `setIsServiceDown(true)` → bloc d'erreur orange avec icône `AlertCircle`
  - Titre : "Service temporairement indisponible"
  - Bouton "Réessayer" → incrémente `retryCount` (re-déclenche le `useEffect`)
  - Bouton secondaire "Retour à la recherche" → `router.push('/recherche')`
- Le `useEffect` reset `isServiceDown(false)` à chaque déclenchement

### Affichage conditionnel Pack Sérénité

- `rapportExistant !== null` → bloc "Rapport déjà acheté" (fond vert translucide, bouton "Accéder à mon rapport →")
- `rapportExistant === null` → bloc d'achat contextuel (vert si OK, rouge si risque, liste 6 features, CTA 4,90€)
- `rapportExistant && surveillanceActive` → bloc "Surveillance active" (bordure verte)
- `rapportExistant && !surveillanceActive` → bloc "Surveillance inactive"
- Ni l'un ni l'autre → teaser surveillance verrouillé + lien "Débloquer avec le Pack Sérénité"

### Revendication fiche artisan

Le lien "Revendiquez cette fiche →" pointe vers `/espace-artisan/inscription?siret=${result.siret}` — le SIRET est transmis en param URL.

### Prix corrigé

Prix affiché dans la sidebar : 4,90€ (était 19,90€)

---

## 6. Mon Espace `/mon-espace`

**Fichier :** `app/mon-espace/page.tsx` (`'use client'`)

### Onglets

1. **Mes surveillances** — requête `.eq('user_id', u.id)` (corrigé, était `.eq('email', ...)`)
   - Badge "Active" (vert) si `expires_at > now()`, "Expirée" (gris) sinon
   - Affiche "Jusqu'au [date]"
   - Bouton "Arrêter la surveillance" → DELETE `.eq('user_id', ...)`

2. **Mes rapports** — requête `.eq('user_id', u.id).order('created_at', desc)`
   - Pour chaque rapport : appel `GET /api/artisan/public?siret=` → `nomEntreprise`
   - Affiche nom entreprise ou fallback 'Entreprise inconnue' (plus `SIRET [...]`)
   - Bouton "Accéder au rapport →" → `/rapport/succes?session_id=...&siret=...&from=mon-espace`

3. **Profil** — données utilisateur auth

---

## 7. Pricing

### Cohérence des prix

- Landing page (`/`) : Pack Sérénité affiché à **4,90€** ✅
- Page `/pricing` : **4,90€** ✅
- Fiche artisan sidebar : **4,90€** ✅
- `POST /api/checkout` : **490 cents = 4,90€** ✅ (corrigé le 24 mars)

### Pack Gratuit
- Recherche artisan
- Score de fiabilité
- Statut INSEE
- Certifications RGE
- Analyse devis IA — 1 analyse gratuite / mois (ajouté le 27 mars)

### Pack Sérénité — 4,90€ (one-time)
- Rapport PDF complet
- Analyse devis IA illimitée pour cet artisan (quota ignoré si rapport acheté pour le même SIRET)
- Surveillance 6 mois (alertes email)
- Historique BODACC complet
- Synthèse IA (claude-sonnet-4-6)
- Carnet de chantier illimité
- Modèle de contrat pré-rempli
- Guide recours

### Pack Tranquillité
- Statut : "Bientôt" — non implémenté

---

## 8. Analyse Devis IA `/analyser-devis`

**Ajouté / refondu le 27 mars 2026**

### Route `POST /api/analyser-devis`

**Fichier :** `app/api/analyser-devis/route.ts`

**Flux :**
1. Auth optionnelle — token JWT parsé si présent, `user` peut être `null`
2. IP extraite depuis `x-forwarded-for`
3. Étape 1 : extraction légère du SIRET (100 tokens max, Haiku) — retourne JSON `{ siret }`
4. Étape 2 : si SIRET trouvé → vérifie rapport Pack Sérénité dans `rapports` → `packSereniteActif`
5. Étape 3 : si pas de Pack → vérifie quota mensuel dans `analyses_devis` par `user_id` ou `ip_address` ; si `count > 0` → HTTP 429 `quota_depasse`
6. Étape 4 : `Promise.all([prixCall, juridiqueCall])` — deux appels Anthropic Haiku en parallèle

**Réponse JSON :**
```typescript
{
  prix: {
    siret, nom_artisan, type_travaux, region,
    montant_devis, fourchette_basse, fourchette_haute, prix_moyen,
    verdict_prix,        // 'normal' | 'sur-evalué' | 'sous-evalué'
    ecart_pourcentage,
    facteurs: string[],
    alerte: string
  },
  juridique: {
    score_conformite,    // 0-10
    mentions_presentes: string[],
    mentions_manquantes: string[],
    clauses_abusives: string[],
    verdict_juridique,
    recommandations: string[]
  },
  score_global,          // (score_conformite + scorePrix) / 2 — scorePrix: normal=10, sous-evalué=4, sur-évalué=6
  siret_artisan,
  est_gratuite,          // true si quota utilisé (non pack)
  pack_serenite_actif    // true si rapport acheté pour ce SIRET
}
```

**Logs dans `analyses_devis` :** `user_id`, `siret_artisan`, `ip_address`, `pages_pdf`, `taille_pdf_bytes`

### Page `/analyser-devis`

**Fichier :** `app/analyser-devis/page.tsx` (`'use client'`, wrappé dans `<Suspense>`)

**États :** `file`, `dragOver`, `loading`, `loadingStep`, `completedSteps`, `result`, `siretArtisan`, `quotaDepasse`, `error`

**Upload :** Fichier converti en base64 via `arrayBuffer()` + `Buffer.from(...).toString('base64')`. Envoi JSON `{ fileBase64, mimeType }` (pas FormData).

**Animation de chargement :** 3 étapes avec `setTimeout` à 1200ms et 2600ms :
1. Lecture du document (icône `FileText`)
2. Analyse des prix du marché (icône `BarChart2`)
3. Vérification juridique (icône `Scale`)

**Composants intégrés :**
- `JaugePrix` : jauge horizontale avec zones rouge/vert/orange, marqueurs verticaux pour prix moyen et montant devis
- `ScoreCercle` : affichage circulaire du score global
- `UpsellBloc` : fond dégradé vert foncé, grille 6 features, CTA vers `/artisan/{siret}` ou `/recherche`, témoignage

**Comportement quota :**
- Si `quota_depasse` (HTTP 429) → affiche `UpsellBloc` sans formulaire d'upload
- Si `result.est_gratuite` → affiche résultats + `UpsellBloc` en dessous

### SiteHeader — badge "Analyser un devis"

**Interface `NavItem`** : champ `badge?: string` ajouté

Item nav : `{ href: '/analyser-devis', label: 'Analyser & vérifier mon devis', desc: 'Prix du marché + conformité juridique en 1 clic', badge: 'Gratuit · 1/mois' }`

Badge rendu dans `MegaMenuPanel` : fond `rgba(45,185,110,0.12)`, couleur `var(--color-accent)`

---

## 9. Carnet de Chantier

### Page `/mes-chantiers`

Liste des chantiers de l'utilisateur avec statut, montant, dates.

### Page `/nouveau-chantier`

**Fichier :** `app/nouveau-chantier/page.tsx`

**Pré-remplissage depuis `/rapport/succes`** (implémenté le 25 mars) :

Le CTA "Ouvrir un carnet de chantier" depuis le rapport pointe vers :
```
/nouveau-chantier?siret=[siret]&nom=[nom]&adresse=[adresse]&from=rapport&session_id=[session_id]
```

Dans `NouveauChantierForm` :
- `fromRapport` = `params.get('from') === 'rapport'`
- `nomParam`, `siretParam`, `adresse` pré-remplis depuis query params
- Style `prefilledStyle` : bordure verte + fond vert translucide sur les champs pré-remplis
- SIRET : `readOnly={!!siretParam}` + label "· Artisan vérifié"
- Adresse : label "· Pré-remplie avec le siège de l'artisan, modifiable"
- Bandeau vert si `fromRapport && nomParam`

### Page `/chantier/[id]`

**Fichier :** `app/chantier/[id]/page.tsx` (`'use client'`)

**5 onglets :**

1. **Journal** (`onglet === 'journal'`)
   - Timeline des événements (table `chantier_evenements` + auto-alertes client-side)
   - Types : `note`, `alerte`, `appel`, `visite`, `probleme`, `document`, `photo`
   - Auto-alertes (`_auto: true`) : calculées côté client (jamais stockées en DB) :
     - Retard : si `date_fin_prevue` dépassée et statut non terminé
     - Paiement : si montant payé > 30% du total avant démarrage officiel
   - Formulaire d'ajout d'événement : type, titre, description, date
   - Icônes par type depuis `EVENEMENT_ICONS` (types/chantier.ts)

2. **Paiements** (`onglet === 'paiements'`)
   - Liste des paiements (table `chantier_paiements`)
   - Barre de progression : total payé / montant total
   - Types : `acompte`, `avancement`, `solde`
   - Ajout paiement : montant, date, type, description, photo_url

3. **Photos** (`onglet === 'photos'`)
   - Galerie groupée par phase : `avant`, `pendant`, `apres`
   - Table `chantier_photos`
   - Upload avec légende et phase

4. **Documents** (`onglet === 'documents'`)
   - Liste des documents (table `chantier_documents`)
   - Types : `devis`, `contrat`, `decennale`, `facture`, `pv_reception`, `correspondance`, `autre`
   - Upload avec nom, type, URL

5. **Checklist** (`onglet === 'checklist'`)
   - Composant `GuideChantier` intégré
   - 4 phases : Avant de signer, Démarrage chantier, Pendant les travaux, Réception finale
   - État persisté dans `localStorage` sous la clé `verifio_guide_chantier_v1`
   - Format : `{ [itemId]: boolean }` — jamais envoyé en base de données

**Types Supabase (table `chantiers`) :**
```typescript
interface Chantier {
  id, user_id, siret?, nom_artisan, type_travaux,
  description?, adresse_chantier?,
  date_debut?, date_fin_prevue?,
  montant_total?, statut: ChantierStatut, created_at
}
```

**Helpers dans `types/chantier.ts` :**
- `totalPaye(paiements)` — somme des montants
- `dateProgress(debut, fin)` — pourcentage avancement sur dates
- `daysUntil(dateStr)` — jours avant échéance (négatif si dépassé)
- `formatEur(n)` — formatage montant en euros fr-FR

---

## 10. Recherche & API INSEE

### `lib/fetchCompany.ts`

**Ajouté le 27 mars 2026 :**

```typescript
async function fetchWithRetry(url: string, retries = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(5000),
      })
      if (res.ok) return res
      if (i === retries) throw new Error('API indisponible')
      await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    } catch (e: any) {
      if (i === retries) throw new Error('API indisponible')
      await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    }
  }
  throw new Error('API indisponible')
}
```

- `fetchEntreprise` utilise `fetchWithRetry(url)` (3 tentatives, backoff 1s/2s)
- `fetchRGE` : `AbortSignal.timeout(6000)` ajouté
- `fetchBODACC` : `AbortSignal.timeout(7000)` ajouté

### Route `GET /api/search`

**Fichier :** `app/api/search/route.ts`

- `export const maxDuration = 30` (Vercel Pro — évite timeout à 10s)
- Catch `'API indisponible'` → HTTP 503 avec body :
  ```json
  { "error": "service_indisponible", "message": "Les données INSEE sont temporairement indisponibles. Réessayez dans quelques minutes." }
  ```
- Catch `'Aucune entreprise trouvée.'` → HTTP 404
- Catch autres → HTTP 500

### Route `GET /api/recherche`

- `export const maxDuration = 30` ajouté

---

## 11. Cron Surveillance

**Fichier :** `app/api/cron/verifier-changements/route.ts`

- Authentification : `Authorization: Bearer ${CRON_SECRET}` (optionnel en dev)
- Récupère toutes les surveillances avec `.gt('expires_at', now())`
- Groupe par SIRET (une seule requête API par SIRET)
- Appelle `https://recherche-entreprises.api.gouv.fr/search?q=${siret}`

**Correction faux positifs (27 mars 2026) :**

```typescript
function normalizeStatut(s?: string | null): string {
  const v = (s || '').toLowerCase().trim()
  if (v === 'a' || v === 'actif' || v === 'active') return 'actif'
  if (v === 'f' || v === 'fermé' || v === 'ferme' || v === 'ceased') return 'ferme'
  return v
}
```

- Si `surveillance.statut_initial` est `null` : UPDATE sans envoyer d'alerte (initialisation silencieuse)
- Comparaison : `normalizeStatut(currentStatut) !== normalizeStatut(surveillance.statut_initial)`
- Seul un vrai changement après normalisation déclenche l'email d'alerte

**Configuration Vercel :** `vercel.json` à la racine :
```json
{
  "crons": [{ "path": "/api/cron/verifier-changements", "schedule": "0 8 * * *" }]
}
```

Email d'alerte : design HTML avec avant/après du statut en badges colorés, lien vers fiche, guide "Que faire ?", lien désinscription.

⚠️ **Migration requise** : `ALTER TABLE surveillances ADD COLUMN IF NOT EXISTS statut_initial text;` dans Supabase Dashboard

---

## 12. Variables d'Environnement

| Variable | Utilisée dans | Obligatoire |
|----------|--------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | partout | Oui |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client Supabase | Oui |
| `SUPABASE_SERVICE_ROLE_KEY` | insertions server-side (rapports, surveillances, artisans) | **Critique** |
| `STRIPE_SECRET_KEY` | checkout, vérification paiement, PDF | Oui |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | (non utilisé côté client actuellement) | Non |
| `ANTHROPIC_API_KEY` | synthèse IA rapport + analyse devis (Haiku) | Non (dégradé si absent) |
| `RESEND_API_KEY` | emails confirmation, alertes, admin | Non (silent fail) |
| `NEXT_PUBLIC_BASE_URL` | `https://verifio-eight.vercel.app` | Recommandé |
| `CRON_SECRET` | authentification route cron | Recommandé |
| `NEXT_PUBLIC_ADMIN_EMAIL` | accès admin | Optionnel |

**Note importante :** `SUPABASE_SERVICE_ROLE_KEY` est la variable la plus critique pour le bon fonctionnement des achats. Sans elle, aucune insertion en base n'est possible après paiement.

---

## 13. URLs de déploiement

- **Production :** `https://verifio-eight.vercel.app`
- **Repo GitHub :** `https://github.com/ExoVersa/verifio`
- **Supabase :** `https://eflaghdxvrfenyqkrfnt.supabase.co`
- **Worktree actif :** `/Users/CharlieCouratin/artisancheck/.claude/worktrees/focused-haslett`

---

## 14. Documentation interne

- **`CLAUDE.md`** : workflow Git + contexte projet + règles code (simplifié le 28 mars — sans tableaux d'état)
- **`docs/HANDOFF.md`** : synthèse de passation — pointe vers CHANGELOG.md et PROJECT_AUDIT.md
- **`docs/DECISIONS.md`** : 4 décisions techniques documentées (inline styles, Lucide, lib/score.ts, Haiku pour devis)
- **`CHANGELOG.md`** : historique des versions

---

## 15. Bugs Corrigés (24–29 mars 2026)

| Bug | Date | Correction |
|-----|------|-----------|
| Prix Stripe 19,90€ | 24 mars | Corrigé → 490 cents (4,90€) dans `/api/checkout` |
| `/rapport/succes` accessible sans paiement | 24 mars | Ajout vérification `payment_status === 'paid'` via Stripe |
| Focus inputs cassé sur `/auth` | 24 mars | `LoginForm` et `SignupForm` déplacés au niveau module |
| Google OAuth non fonctionnel | 24 mars | `handleGoogleAuth()` implémenté + route `/auth/callback` créée |
| Bouton Google absent sur inscription | 24 mars | Ajouté dans `SignupForm` avec même handler |
| Emoji dans titre auth | 24 mars | "Bon retour 👋" → "Bon retour" |
| Revendication fiche sans SIRET | 24 mars | Lien pointe vers `/espace-artisan/inscription?siret=...` |
| Surveillance gratuite | 24 mars | Maintenant liée au Pack Sérénité (payant) |
| Insertions Supabase silencieuses | 25 mars | `supabaseAdmin` avec service role key + logs diagnostics |
| `nom_entreprise` absent de la table `rapports` | 26 mars | Colonne ajoutée en migration |
| Surveillance échouait (email NOT NULL manquant) | 26 mars | `email` inclus dans upsert depuis `auth.admin.getUserById` |
| Doublons de rapport à chaque refresh | 26 mars | Vérification `stripe_session_id` unique avant insert |
| Surveillance visible seulement par email | 26 mars | Query modifiée → `.eq('user_id', ...)` |
| Nom entreprise "SIRET XXXX" dans Mon Espace | 26 mars | Appel `/api/artisan/public` → `nomEntreprise` |
| Double flèche bouton retour rapport | 26 mars | Retrait des `← ` hardcodés dans `backLabel` |
| `SiteHeader` absent de `/rapport/succes` | 26 mars | Ajouté avec Fragment wrapper |
| URL prod `verifio.vercel.app` incorrecte | 26 mars | Remplacé par `verifio-eight.vercel.app` partout |
| Cron faux positifs (statut 'A' vs 'actif') | 27 mars | `normalizeStatut()` + gestion `statut_initial = null` sans alerte |
| `/api/search` timeout (500 sur Vercel) | 27 mars | `maxDuration=30` + `fetchWithRetry` + `AbortSignal.timeout()` + 503 |
| Utilisateur bloqué sans message clair si INSEE down | 27 mars | `isServiceDown` + bouton "Réessayer" dans fiche artisan |

---

## 16. Bugs Connus Restants

| Bug | Priorité | Description |
|-----|----------|-------------|
| PDF téléchargeable | À tester | Route `/api/rapport-pdf` implémentée mais non validée en prod |
| Email confirmation | À tester | Resend implémenté, nécessite `RESEND_API_KEY` en prod |
| Partage sécurisé | À tester | `share_token` + `share_expires_at` dans rapports à vérifier |
| Modal bienvenue | À tester | `WelcomeModal` affiché sur `?new=true`, logique à valider |
| Synthèse IA | Dépend clé | `ANTHROPIC_API_KEY` nécessaire — fallback affiché si absente |
| Cron surveillance | Non testé | `vercel.json` configuré, non déclenché en prod |
| Migration `statut_initial` | À appliquer | `ALTER TABLE surveillances ADD COLUMN IF NOT EXISTS statut_initial text;` |
| Migrations Supabase | À appliquer | `20260325000000_create_rapports.sql` + `20260326_add_nom_entreprise_rapports.sql` + `20260325000000_surveillance_devis.sql` à exécuter dans Supabase Dashboard si pas déjà fait |
| Google OAuth prod | À tester | Nécessite config Google Console + Supabase Providers |
| ScoreRing flash | Mineur | Bref flash gris avant que BODACC charge |
| Timeline mobile | Mineur | 2 colonnes ne passent pas toujours en 1 colonne |
| Pricing responsive | Mineur | `.pricing-grid` media query ne cible pas les divs inline |

---

## 17. Flow Revendication Fiche Artisan

### Inscription artisan

**Fichier :** `app/espace-artisan/inscription/page.tsx`

Formulaire 2 étapes. Le SIRET est pré-rempli si passé en `?siret=...`.

**Route :** `POST /api/artisan/register`
1. Crée compte Supabase Auth (`supabaseAdmin.auth.admin.createUser`)
2. Upload justificatif → bucket `justificatifs`
3. Insert dans `artisans` (statut `en_attente`)
4. Email notification admin via Resend

### Validation admin

**Page :** `/admin` — auth email admin hardcodé

- Valider → `POST /api/artisan/validate` → statut `verifie`, badge actif, 14j essai
- Refuser → `POST /api/artisan/refuse` → statut `refuse` + motif

### Dashboard artisan

**Page :** `/artisan/dashboard`

- Affiche SIRET, nom entreprise, badge, essai restant
- Création de devis (`POST /api/artisan/devis/create`)

---

## 18. Composants Partagés Clés

| Composant | Fichier | Rôle |
|-----------|---------|------|
| `ScoreRing` | `components/ScoreRing.tsx` | Anneau SVG animé, gris si score=-1 |
| `SyntheseIA` | `components/SyntheseIA.tsx` | Bloc synthèse IA avec skeleton |
| `BodaccSection` | `components/BodaccSection.tsx` | Cards colorées par type + pagination |
| `PackBadge` | `components/PackBadge.tsx` | Badge "Pack Sérénité" inline, server-compatible |
| `AnalyserDevisButton` | `components/AnalyserDevisButton.tsx` | Bouton client avec hover state |
| `SiteHeader` | `components/SiteHeader.tsx` | Header mega-menu, auth, mobile ; `badge?` sur NavItem |
| `GuideChantier` | `components/GuideChantier.tsx` | Checklist 4 phases, état localStorage |
| `WelcomeModal` | `components/WelcomeModal.tsx` | Modal premier achat |
| `ModeleContrat` | `components/ModeleContrat.tsx` | Modèle contrat pré-rempli avec badge |
| `GuideRecours` | `components/GuideRecours.tsx` | Guide recours avec badge |
| `BoutonPDF` | `components/BoutonPDF.tsx` | Déclencheur téléchargement PDF |
