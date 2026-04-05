# PROJECT_AUDIT.md — Verifio
> Audit technique complet — état réel du code au 5 avril 2026.
> Inclut toutes les modifications effectuées du 24 mars au 5 avril 2026.
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

**Auth obligatoire (4 avril 2026) :**

Vérification en tête du handler, avant toute logique Stripe :
```typescript
const token = req.headers.get('authorization')?.replace('Bearer ', '')
// 401 si absent
const { data: { user }, error } = await supabaseAuth.auth.getUser(token)
// 401 si invalide ou expiré
```
- Si pas de token → HTTP 401 `{ error: 'non_connecte', message: 'Connexion requise pour accéder au paiement.' }`
- Si token invalide → HTTP 401 `{ error: 'non_connecte', message: 'Session invalide. Veuillez vous reconnecter.' }`
- Le client Supabase utilisé ici est initialisé avec `ANON_KEY` (pas de service role)

**Frontend (`app/artisan/[siret]/page.tsx`) :**

`startSerenite()` utilise désormais `supabase.auth.getSession()` pour récupérer `session.access_token` et le passe dans `Authorization: Bearer` :
```typescript
const { data: { session } } = await supabase.auth.getSession()
if (!session?.user) { router.push(`/auth?redirect=/artisan/${siret}`); return }
fetch('/api/checkout', {
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
  body: JSON.stringify({ ..., user_id: session.user.id })
})
```

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

**Refonte visuelle (2 avril 2026) :**
- hero premium "Pack Sérénité activé" en tête de rapport
- cartes principales et sidebar migrées vers `SurfaceCard`
- hiérarchie renforcée sur les blocs score, identité, droits, guide et actions
- aucune modification du workflow Stripe / Supabase / email / PDF

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
4b. **Bannière rouge si entreprise fermée** (ajoutée le 31 mars) : `(result.statut as string)?.toLowerCase().trim() !== 'a' && !== 'actif'` → bloc rouge AlertTriangle avant la SyntheseIA
5. Score + statut (ScoreRing animé — affiche 0 si entreprise fermée)
6. Synthèse IA (skeleton pendant chargement, fallback "indisponible" si pas de clé)
7. Données identité (SIRET, forme juridique, date création, adresse, capital, effectif)
8. Certifications RGE (cards avec icônes thématiques)
9. Régularité financière / Procédures collectives BODACC
10. **Dirigeants** (5 avril 2026) — chaque dirigeant est un `<a href="/dirigeant/[slug]">` avec nom en vert + icône externe + CTA pill "Voir ses entreprises →". Génération du slug via `dirigeantSlug(nom, prenoms)` depuis `lib/dirigeant.ts`
11. Historique changements statut
12. Annonces BODACC redesign — cards colorées par type, pagination 5 par page
13. **Marchés publics BOAMP** (5 avril 2026) — `SurfaceCard` conditionnelle si `result.boampMarches?.length > 0` : objet, date, montant, procédure, acheteur. Source affichée en bas.
14. "Vos droits avant de signer" — 4 cartes universelles + **droits personnalisés par IA** (5 avril 2026) : appel direct Anthropic Haiku dans le Server Component, 2-3 cartes contextuelles selon profil (forme juridique, NAF, ancienneté, score, RGE, BODACC). Backticks strippés avant `JSON.parse`. Fallback silencieux si pas de clé.
15. Modèle de contrat pré-rempli (avec badge Pack Sérénité)
16. Guide recours si ça se passe mal (avec badge Pack Sérénité)
17. Sidebar : score, surveillance active/expiry, CTA "Ouvrir un carnet de chantier" (→ `/nouveau-chantier?siret=&nom=&adresse=&from=rapport&session_id=`)
18. `WelcomeModal` premier achat (`isNew=true`)

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

**Court-circuit entreprise fermée (ajouté le 31 mars 2026) :**

```typescript
function isActif(statut: string): boolean {
  const s = String(statut || '').toLowerCase().trim()
  return s === 'a' || s === 'actif'
}

// Dans calculateScore() :
if (!isActif(input.statut)) {
  return { score: 0, totalPoints: 0, totalMax: 0, criteres: [] }
}
```

Toute entreprise dont le statut n'est pas `'a'` ou `'actif'` retourne **score = 0** immédiatement, sans calculer les critères. Le `ScoreRing` affiche 0.

**Comparaison statut — pattern canonique :**

Dans tous les fichiers (fiche artisan, rapport, ResultCard), la comparaison se fait uniquement via :
```typescript
String(result.statut || '').toLowerCase().trim() !== 'a'
&& String(result.statut || '').toLowerCase().trim() !== 'actif'
```
Ne jamais utiliser une fonction helper externe — inliner le pattern directement.

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

### Bannière entreprise fermée (ajoutée le 31 mars 2026)

Bandeau rouge d'avertissement affiché en tête de page si l'entreprise n'est pas active :
```tsx
{String(result.statut || '').toLowerCase().trim() !== 'a'
 && String(result.statut || '').toLowerCase().trim() !== 'actif' && (
  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', ... }}>
    <AlertTriangle .../>
    Entreprise fermée ou radiée — ...
  </div>
)}
```

### Affichage conditionnel Pack Sérénité

- `rapportExistant !== null` → bloc "Rapport déjà acheté" (fond vert translucide, bouton "Accéder à mon rapport →")
- `rapportExistant === null` → bloc d'achat contextuel (vert si OK, rouge si risque, liste 6 features, CTA 4,90€)
- `rapportExistant && surveillanceActive` → bloc "Surveillance active" (bordure verte)
- `rapportExistant && !surveillanceActive` → bloc "Surveillance inactive"
- Ni l'un ni l'autre → teaser surveillance verrouillé + lien "Débloquer avec le Pack Sérénité"
- **Entreprise fermée** → CTA d'achat bloqué : bouton grisé + message "Rapport non disponible pour une entreprise fermée"

### Revendication fiche artisan

Le lien "Revendiquez cette fiche →" pointe vers `/espace-artisan/inscription?siret=${result.siret}` — le SIRET est transmis en param URL.

### Prix corrigé

Prix affiché dans la sidebar : 4,90€ (était 19,90€)

---

## 6. Mon Espace `/mon-espace`

**Fichier :** `app/mon-espace/page.tsx` (`'use client'`)

**Refonte visuelle (2 avril 2026) :**
- fond global aligné sur le nouveau langage visuel premium (`linear-gradient` chaud)
- hero éditorial avec `SectionBadge`, panneau de contexte compte et copy plus produit
- tabs refaites en pills dans `SurfaceCard` (plus de simple barre basse)
- dashboard : cartes stats, activité récente et raccourcis migrés vers `SurfaceCard`

### Onglets

1. **Mes surveillances** — requête `.eq('user_id', u.id)` (corrigé, était `.eq('email', ...)`)
   - Badge "Active" (vert) si `expires_at > now()`, "Expirée" (gris) sinon
   - Affiche "Jusqu'au [date]"
   - Bouton "Arrêter la surveillance" → DELETE `.eq('user_id', ...)`

2. **Mes rapports** — requête `.eq('user_id', u.id).order('created_at', desc)`
   - Pour chaque rapport : appel `GET /api/artisan/public?siret=` → `nomEntreprise`
   - Affiche nom entreprise ou fallback 'Entreprise inconnue' (plus `SIRET [...]`)
   - Bouton "Accéder au rapport →" → `/rapport/succes?session_id=...&siret=...&from=mon-espace`

~~3. **Profil**~~ — **Supprimé le 31 mars 2026**. Les données profil ont été déplacées vers la page `/mon-profil` (accessible via le dropdown avatar dans le header).

**Tabs container :** `flexWrap: 'wrap'` — plus de scroll horizontal sur mobile.

---

## 6b. Page Profil `/mon-profil`

**Fichier :** `app/mon-profil/page.tsx` (`'use client'`) — **Ajoutée le 31 mars 2026**

**Accès :** Lien dans le dropdown avatar du `SiteHeader` (icône User + "Mon profil").

**Auth :** `supabase.auth.getUser()` au montage → redirect `/auth?redirect=/mon-profil` si non connecté.

**Sections :**
- Avatar circulaire (initiale de l'email), email, date création du compte
- Bouton "Changer le mot de passe" → `supabase.auth.resetPasswordForEmail(email, { redirectTo: .../auth?mode=reset })` → remplacé par confirmation verte inline
- Bouton "Se déconnecter" → `supabase.auth.signOut()` → redirect `/`
- Zone dangereuse : bouton "Supprimer mon compte" → `DELETE /api/account/delete` (avec confirm() + spinner)

**Route API :** `DELETE /api/account/delete` — supprime le compte via service role.

---

## 7. Pricing

**Refonte visuelle (2 avril 2026) :**
- `app/pricing/page.tsx` conserve les mêmes plans/prix, mais utilise désormais des surfaces premium cohérentes avec le reste de la plateforme
- `PricingCards` reste la source de vérité de la grille tarifaire
- FAQ et CTA final sont maintenant encapsulées dans des `SurfaceCard`

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
- ~~Analyse devis IA gratuite~~ — **supprimée le 30 mars** (l'analyse devis requiert un Pack)

### Pack Sérénité — 4,90€ (one-time)
- Rapport PDF complet
- Analyse de devis — **5/mois par artisan** (prix + juridique)
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

**Créé le 27 mars, refondu en hub le 30 mars 2026**

### Route `POST /api/analyser-devis`

**Fichier :** `app/api/analyser-devis/route.ts`

**Flux (version hub — 30 mars 2026) :**
1. **Auth obligatoire** — token JWT depuis `Authorization: Bearer`. Si absent ou invalide → HTTP 401 `non_connecte`
2. `siretArtisan` (alias `siretClient`) extrait du body — obligatoire (HTTP 400 si absent)
3. **Vérification Pack Sérénité** : SELECT dans `rapports` où `user_id = user.id AND siret = siretClient`. Si aucun rapport → HTTP 403 `pack_requis`
4. **Quota** : COUNT dans `analyses_devis` où `user_id = user.id AND siret_artisan = siretClient AND created_at >= début_du_mois`. Si count ≥ 5 → HTTP 429 `quota_depasse`
5. Validation fichier (taille ≤ 10Mo, pages ≤ 10 si PDF)
6. Extraction SIRET légère (Haiku, 100 tokens) → `siretExtrait` (utilisé uniquement pour metadata — **ne sert plus à la vérification des droits**)
7. `Promise.all([prixCall, juridiqueCall])` — deux appels Anthropic Haiku en parallèle
8. INSERT dans `analyses_devis` avec `siret_artisan: siretClient`

⚠️ **IMPORTANT — siretClient vs siretExtrait** : `siretClient` (envoyé par le front) est la seule source de vérité pour l'autorisation. `siretExtrait` (extrait par IA du PDF) n'est jamais utilisé pour les contrôles d'accès — il peut être `null` si l'extraction échoue.

**Réponse JSON :**
```typescript
{
  prix: {
    siret, nom_artisan, type_travaux, region,
    montant_devis, fourchette_basse, fourchette_haute, prix_moyen,
    verdict_prix,        // 'normal' | 'surevalue' | 'sous-evalue'
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
  score_global,          // (score_conformite + scorePrix) / 2
  siret_artisan,         // = siretClient
  est_gratuite: false,
  pack_serenite_actif: true,
  analyses_utilisees,
  quota_max: 5,
  quota_restant
}
```

**Table `analyses_devis` — schéma réel :**
```sql
TABLE analyses_devis:
  id              uuid          PK
  user_id         uuid          FK → auth.users(id)
  siret_artisan   text          -- siretClient
  pages_pdf       int
  taille_pdf_bytes bigint
  nom_fichier     text
  resultat_json   jsonb
  created_at      timestamptz   DEFAULT now()
```
⚠️ `ip_address` n'existe plus. Le modèle est user-centric + siret-centric. Analyse gratuite anonyme supprimée.

### Page `/analyser-devis` — Hub artisan

**Fichier :** `app/analyser-devis/page.tsx` (`'use client'`, wrappé dans `<Suspense>`)

**Refonte visuelle (2 avril 2026) :**
- page transformée en hub plus éditorial
- hero + shells premium via `PageHero`, `SectionBadge`, `SurfaceCard`
- zone upload et résultats davantage mis en scène, sans changement de logique métier

**Nouveau flux (hub) :**
1. Au montage : `supabase.auth.getUser()` → si non connecté, redirect `/auth?redirect=/analyser-devis`
2. `loadRapports(userId)` : SELECT dans `rapports` + COUNT analyses ce mois par SIRET → liste `RapportWithQuota[]`
3. Affichage liste des artisans vérifiés avec badge quota `X/5 ce mois`
4. Clic → `setRapportSelectionne(r)` → zone upload affichée
5. Upload → `triggerAnalyse(file)` → envoie `{ fileBase64, mimeType, nomFichier, siretArtisan: rapportSelectionne.siret }`
6. Token : `supabase.auth.getSession()` → `session.access_token` → `Authorization: Bearer`

**Interface `RapportWithQuota` :**
```typescript
interface RapportWithQuota {
  id: string
  siret: string
  nom_entreprise: string | null
  stripe_session_id: string
  analysesUtilisees: number
  quotaMax: number   // toujours 5
  quotaRestant: number
  quotaAtteint: boolean
}
```

**États :** `rapports`, `rapportSelectionne`, `file`, `dragOver`, `loading`, `loadingStep`, `completedSteps`, `result`, `error`

**Animation chargement :** 3 étapes (1200ms / 2600ms) — FileText → BarChart2 → Scale.

**Composants intégrés :** `JaugePrix`, `ScoreCercle`. `UpsellBloc` supprimé (Pack toujours requis).

### SiteHeader — badge "Analyser un devis"

**Interface `NavItem`** : champ `badge?: string` ajouté

Item nav : `{ href: '/analyser-devis', label: 'Analyser & vérifier mon devis', desc: '5 analyses par mois par artisan vérifié', badge: 'Pack Sérénité' }`

Badge rendu dans `MegaMenuPanel` : fond `rgba(45,185,110,0.12)`, couleur `var(--color-accent)`

---

## 9. Carnet de Chantier

### Page `/mes-chantiers`

Liste des chantiers de l'utilisateur avec statut, montant, dates.

**Refonte visuelle (2 avril 2026) :**
- header premium avec `SurfaceCard`
- cartes chantier plus aérées et plus cohérentes avec le nouveau shell
- aucun changement de logique métier

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

**Refonte visuelle (2 avril 2026) :**
- fond global harmonisé avec les autres écrans coeur
- header chantier transformé en hero premium avec résumé de contexte
- métriques de pilotage migrées vers `SurfaceCard`
- accordéons de phases restylés avec surfaces, bordures et hiérarchie plus haut de gamme
- la logique Supabase / uploads / suppressions reste inchangée

**Suppression chantier (ajoutée le 30 mars 2026) :**
- Bouton Trash2 à côté de "Exporter PDF" dans le header du chantier
- Modal de confirmation → `handleDeleteChantier()` : cascade delete en ordre :
  1. `chantier_evenements` WHERE `chantier_id`
  2. `chantier_paiements` WHERE `chantier_id`
  3. `chantier_phases` WHERE `chantier_id` (si existe)
  4. Photos : list storage bucket `chantier-photos` + DELETE tous + DELETE `chantier_photos`
  5. Documents : list storage bucket `chantier-documents` + DELETE tous + DELETE `chantier_documents`
  6. DELETE `chantiers` WHERE `id`
  7. `router.push('/mes-chantiers')`
- États : `showDeleteModal: boolean`, `deleting: boolean`

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

### `fetchBOAMP(nomEntreprise)` — (ajoutée le 5 avril 2026)

**Fichier :** `lib/fetchCompany.ts` (exportée)

```typescript
export async function fetchBOAMP(nomEntreprise: string): Promise<BOAMPMarche[]>
```

- URL : `https://www.boamp.fr/api/explore/v2.1/catalog/datasets/boamp/records?where=titulaires like "${nom}"&limit=5&select=objet,datepublication,montant,procedure,acheteur&order_by=datepublication DESC`
- `AbortSignal.timeout(5000)` + `next: { revalidate: 86400 }` (cache 24h)
- Retourne `BOAMPMarche[]` ou `[]` en cas d'erreur
- Intégré dans le `Promise.all` de `fetchCompany` (3e promesse, en parallèle RGE + BODACC)
- `boampMarches` dans `SearchResult` : `undefined` si tableau vide → sections JSX conditionnelles

**Type `BOAMPMarche` dans `types/index.ts` :**
```typescript
interface BOAMPMarche {
  objet: string
  date: string | null
  montant: string | null
  procedure: string | null
  acheteur: string | null
}
```

**Affichage :**
- `app/artisan/[siret]/page.tsx` : section après BODACC, avant checklist, conditionnelle
- `app/rapport/succes/page.tsx` : `SurfaceCard` entre BODACC (7) et Vos droits (8), numérotée 7b

---

## 9b. Page Dirigeant `/dirigeant/[slug]`

**Fichier :** `app/dirigeant/[slug]/page.tsx` (`'use client'`)

**Accès :** Lien cliquable sur le nom du dirigeant dans `app/artisan/[siret]/page.tsx` (fiche publique gratuite). Pas de lien depuis le rapport payant (`/rapport/succes`) — les dirigeants y sont listés sans lien.

**Lib :** `lib/dirigeant.ts`
- `toSlug(str)` : lowercase + normalize NFD + strip accents + kebab-case
- `dirigeantSlug(nom, prenoms?)` : concatène prénom + nom → slug
- `slugToQuery(slug)` : remplace `-` par espaces → query pour l'API

**Logique :**
1. `slugToQuery(slug)` → reconstruit le nom pour l'API
2. Fetch `https://recherche-entreprises.api.gouv.fr/search?q=${query}&per_page=25`
3. Trie : actifs d'abord, fermés ensuite
4. `loadScores(list)` : fetch `/api/search?q=${siret}` en parallèle (max 10) → enrichit avec `score`
5. `analyseLevel` : `'ok'` si 0 fermées, `'warn'` si 1-2, `'danger'` si ≥3

**Interface `EntrepriseResult` :** `siret`, `siren`, `nom`, `statut: 'actif'|'fermé'`, `formeJuridique`, `dateCreation`, `dateFermeture?`, `adresse`, `activite`, `score?`

**JSX :**
- Fil d'Ariane : Accueil → `router.back()` (Fiche entreprise) → nom dirigeant
- Header : avatar initiales 2 lettres (#1B4332), nom, compteur entreprises, badge alerte si fermées (jaune ≤2, rouge ≥3)
- Bloc analyse coloré (vert/orange/rouge) selon `analyseLevel`
- Liste `<a href="/artisan/${siret}">` : nom + badge ACTIF/FERMÉ, SIRET, forme juridique, dates, adresse, score circulaire 48px

---

## 9c. Droits personnalisés par IA — `/rapport/succes`

**(Ajouté le 5 avril 2026)**

Appel Haiku **directement dans le Server Component** `app/rapport/succes/page.tsx`, après `fetchCompany` et avant la persistence Supabase.

```typescript
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
// model: 'claude-haiku-4-5-20251001', max_tokens: 800
```

**Données envoyées :** `formeJuridique`, `codeNaf`, `activite`, `dateCreation`, `score`, `rge`, `bodacc`, `effectif`

**Réponse :** 2-3 objets `DroitPersonnalise` :
```typescript
interface DroitPersonnalise {
  titre: string           // max 6 mots
  badge: string           // max 3 mots
  badgeType: 'danger' | 'warning' | 'info' | 'success'
  texte: string           // 2-3 phrases
}
```

**Strip backticks :** `.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/```\s*$/i,'').trim()` avant `JSON.parse()` — Haiku peut wrapper le JSON dans des backticks markdown.

**Fallback :** `droitsPersonnalises = []` si pas de clé API, si parse échoue, ou si le tableau est vide → les 4 cartes universelles s'affichent seules, la section "Spécifique à cet artisan" n'apparaît pas.

**JSX :** dans la grille flex-wrap des cartes droits, après les 4 universelles. Séparateur "Spécifique à cet artisan" (icône éclair SVG). Bordure colorée des cartes : `${colors.color}33` (20% opacité).

---

## 9d. Page 404 personnalisée

**(Ajoutée le 5 avril 2026)**

**Fichier :** `app/not-found.tsx` — Server Component, détecté automatiquement par Next.js comme page 404 globale.

Contenu : icône loupe SVG, "Erreur 404", titre, sous-titre, deux CTAs ("Accueil" bouton vert + "Vérifier un artisan" bouton outline).

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
- **SIRET exact (31 mars 2026)** : recherche `exactMatch` sur les champs `siret`, `siege.siret`, `siren` des résultats bruts. Si trouvé → retourne ce résultat en premier. Remplace l'ancienne logique `rawResults.length === 1` qui pouvait échouer si l'API retournait plusieurs résultats pour un SIRET.

### Page d'accueil `/` — Détection SIRET (31 mars 2026)

**Fichier :** `app/page.tsx`

- Dans `search()` : si l'input normalisé fait 14 chiffres → `router.push('/artisan/${normalized}')` directement, sans passer par `/recherche`
- Dans `handleSubmit()` : même vérification 14 chiffres avant de construire l'URL de recherche
- `normalized = query.replace(/\s/g, '')` — supprime tous les espaces (SIRET peut être saisi "123 456 789 00012")

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

## 15. Bugs Corrigés (24 mars – 1er avril 2026)

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
| Pack Sérénité vérifié sur siretExtrait (pouvait être null) | 30 mars | Vérification basée sur `siretClient` (envoyé par le front) |
| Analyse devis : quota global (1/mois tous artisans) | 30 mars | Quota par artisan (5/mois par SIRET) — séparé par rapport |
| Score non nul pour entreprise fermée | 31 mars | Court-circuit `isActif()` → score = 0 immédiatement |
| Statut entreprise : comparaison 'A' vs 'actif' TypeScript | 31 mars | `String(result.statut \|\| '').toLowerCase().trim()` partout |
| Suppression chantier impossible | 30 mars | `handleDeleteChantier()` avec cascade + modal de confirmation |
| Onglet Mon Profil dans Mon Espace | 31 mars | Déplacé vers `/mon-profil` (standalone) + lien dropdown avatar |
| Recherche SIRET 14 chiffres → résultats multiples | 31 mars | `exactMatch` lookup + redirect direct depuis la home |
| `/api/checkout` accessible sans auth | 4 avril | Vérification `Authorization: Bearer` + `supabaseAuth.auth.getUser(token)` → 401 si absent/invalide |
| `startSerenite()` ne transmettait pas le token | 4 avril | `getSession()` + `Authorization: Bearer ${access_token}` dans le fetch |
| Dirigeants rapport payant sans lien | 5 avril | `<a href="/dirigeant/[slug]">` + pill "Voir ses entreprises →" via `dirigeantSlug()` |
| Droits avant de signer — 4 cartes génériques uniquement | 5 avril | Haiku génère 2-3 droits contextuels, appel direct dans Server Component |
| Haiku renvoyait du JSON avec backticks markdown | 5 avril | Strip ```` ```json ```` avant `JSON.parse()` |
| Page 404 absente | 5 avril | `app/not-found.tsx` créé — détecté automatiquement par Next.js |
| Marchés publics non affichés | 5 avril | `fetchBOAMP()` dans `fetchCompany` + section dans fiche et rapport |

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
| Migrations Supabase | À appliquer | `20260325000000_create_rapports.sql` + `20260326_add_nom_entreprise_rapports.sql` + `20260325000000_surveillance_devis.sql` + ajout colonnes `nom_fichier`/`resultat_json` sur `analyses_devis` à exécuter dans Supabase Dashboard si pas déjà fait |
| Google OAuth prod | À tester | Nécessite config Google Console + Supabase Providers |
| ScoreRing flash | Mineur | Bref flash gris avant que BODACC charge |
| Timeline mobile | Mineur | 2 colonnes ne passent pas toujours en 1 colonne |
| Pricing responsive | Mineur | `.pricing-grid` media query ne cible pas les divs inline |

---

## 17. Features B2B — Masquées pour le lancement B2C (4 avril 2026)

Les features B2B sont masquées dans l'UI sans être supprimées du code (réversible par uncomment).

### `SiteHeader.tsx`
- Les deux appels `checkArtisan(userId)` dans `useEffect` sont commentés → `isArtisan` reste `false` en permanence → badge "Artisan vérifié", lien dashboard artisan, items dropdown artisan ne s'affichent jamais
- Lien "Espace Artisan" desktop (nav) : supprimé, remplacé par commentaire
- Lien "Espace Artisan" mobile (drawer) : supprimé, remplacé par commentaire

### Pages B2B à rediriger vers `/` (TODO — non encore fait)
- `app/espace-artisan/page.tsx` — Server Component : `import { redirect } from 'next/navigation'` + `redirect('/')`
- `app/espace-artisan/inscription/page.tsx` — Client Component : `useEffect(() => { router.push('/') }, [])`
- `app/artisan/dashboard/page.tsx` — Client Component : `useEffect(() => { router.push('/') }, [])` (router déjà importé)
- `app/artisan/dashboard/devis/nouveau/page.tsx` — Client Component : `useEffect(() => { router.push('/') }, [])` (router déjà importé)
- `app/admin/page.tsx` — Client Component : ajouter `useRouter` + `useEffect(() => { router.push('/') }, [])`

### Autres (TODO — non encore fait)
- `app/page.tsx` ligne 144 : supprimer `{ label: 'Espace artisan', href: '/espace-artisan' }` du tableau `FOOTER_LINKS.produit`
- `app/artisan/[siret]/page.tsx` : commenter le bloc else "Vous êtes le dirigeant ? Revendiquez cette fiche →" (vers `/espace-artisan`)

---

## 18. Flow Revendication Fiche Artisan

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

## 19. Composants Partagés Clés

| Composant | Fichier | Rôle |
|-----------|---------|------|
| `ScoreRing` | `components/ScoreRing.tsx` | Anneau SVG animé, gris si score=-1 |
| `SyntheseIA` | `components/SyntheseIA.tsx` | Bloc synthèse IA avec skeleton |
| `BodaccSection` | `components/BodaccSection.tsx` | Cards colorées par type + pagination |
| `PackBadge` | `components/PackBadge.tsx` | Badge "Pack Sérénité" inline, server-compatible |
| `AnalyserDevisButton` | `components/AnalyserDevisButton.tsx` | Bouton client avec hover state |
| `SiteHeader` | `components/SiteHeader.tsx` | Header mega-menu, auth, mobile ; `badge?` sur NavItem ; dropdown avatar avec lien `/mon-profil` |
| `ResultCard` | `components/ResultCard.tsx` | Card résultat de recherche ; `verdictLevel` basé sur `String(statut).toLowerCase()` |
| `PricingCards` | `components/PricingCards.tsx` | Cards pricing ; Gratuit sans analyse devis ; Pack avec 5 analyses/mois |
| `GuideChantier` | `components/GuideChantier.tsx` | Checklist 4 phases, état localStorage |
| `WelcomeModal` | `components/WelcomeModal.tsx` | Modal premier achat |
| `ModeleContrat` | `components/ModeleContrat.tsx` | Modèle contrat pré-rempli avec badge |
| `GuideRecours` | `components/GuideRecours.tsx` | Guide recours avec badge |
| `BoutonPDF` | `components/BoutonPDF.tsx` | Déclencheur téléchargement PDF |
| `ExperiencePrimitives` | `components/ExperiencePrimitives.tsx` | Primitives visuelles partagées : `SectionBadge`, `PageHero`, `SurfaceCard`, `PrimaryLink` |

### Couche design / expérience (2 avril 2026)

Les écrans suivants ont été remontés sur un langage visuel commun "confiance premium" :
- `app/recherche/page.tsx`
- `app/analyser-devis/page.tsx`
- `app/artisan/[siret]/page.tsx`
- `app/rapport/succes/page.tsx`
- `app/chantier/[id]/page.tsx`
- `app/mon-espace/page.tsx`
- `app/mes-chantiers/page.tsx`
- `app/pricing/page.tsx`
- `app/auth/page.tsx`
- `app/contact/page.tsx`

Points communs de cette couche :
- fonds chauds en dégradé plutôt que surfaces plates
- usage répété de `SurfaceCard` pour unifier cards, shells et sidebars
- badges de section via `SectionBadge`
- `SiteHeader` plus premium avec navigation interne migrée vers `Link`
- hiérarchie plus éditoriale sur les écrans de décision sans modification des flows critiques
