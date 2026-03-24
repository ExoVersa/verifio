# PROJECT_AUDIT.md — Verifio
> Audit technique complet — état réel du code au 24 mars 2026.
> Ne pas modifier ce fichier manuellement — il est regénéré par inspection du code.

---

## 1. Auth & Utilisateurs

### Flow login email + password

**Fichier :** `app/auth/page.tsx`

1. L'utilisateur saisit email + mot de passe dans `LoginForm`
2. Submit → `handleLogin()` dans `AuthPage`
3. Appel Supabase :
   ```typescript
   supabase.auth.signInWithPassword({ email, password })
   ```
4. Succès → `router.push('/')` (landing)
5. Erreur → `setError(err.message)` affiché dans le formulaire

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
   - `prenom` et `nom` stockés dans les **metadata** de `auth.users`
4. Succès → message `"Compte créé ! Vérifiez votre e-mail pour confirmer."` (pas de redirection automatique)
5. Erreur Supabase → message d'erreur affiché

### Indicateur de force du mot de passe

Composant `PasswordStrength({ password })` — évalue 4 critères :
- longueur ≥ 8
- au moins une majuscule
- au moins un chiffre
- au moins un caractère spécial

Score 0–4 → 4 barres colorées (rouge → vert)

### Flow Google OAuth

⚠️ **Incomplet** — Le bouton Google OAuth est présent dans `LoginForm` (SVG inline) mais :
- Aucun appel `supabase.auth.signInWithOAuth()` n'est implémenté dans le code
- **Le fichier `/app/auth/callback/route.ts` n'existe pas** dans le projet
- Le bouton est affiché mais non fonctionnel

### Table `auth.users` (Supabase built-in)

| Colonne | Contenu |
|---------|---------|
| `id` | UUID généré automatiquement |
| `email` | Email de l'utilisateur |
| `encrypted_password` | Hash du mot de passe |
| `raw_user_meta_data` | JSON — contient `{ prenom, nom }` depuis le signup |
| `email_confirmed_at` | Timestamp de confirmation email |
| Autres | Colonnes Supabase standard (created_at, last_sign_in_at…) |

### Table `profiles`

⚠️ **Inexistante** — Aucune table `profiles` n'est trouvée dans les migrations SQL ni dans le code. Les données utilisateur (prenom, nom) sont stockées uniquement dans `auth.users.raw_user_meta_data`. Il n'y a pas de table profil dédiée.

### Gestion des rôles utilisateur

⚠️ **Inexistante** — Pas de système de rôles dans `auth.users`. La seule distinction de rôle est :
- **Admin** : comparaison d'email hardcodé (`process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'couratincharlie@gmail.com'`) dans les routes `/api/artisan/*`
- **Artisan vérifié** : présence d'un enregistrement dans la table `artisans` avec `statut = 'verifie'`
- **Particulier** : tout autre utilisateur authentifié

La détection artisan dans `SiteHeader.tsx` se fait via une requête sur la table `artisans` au chargement du header.

---

## 2. Flow Revendication Fiche Artisan

### Ce que fait le lien "Revendiquez cette fiche →"

**Fichier :** `app/artisan/[siret]/page.tsx`

C'est un simple `<a href="/espace-artisan">`. **Il ne transmet pas le SIRET en paramètre URL, ne pré-remplit aucun champ, ne déclenche aucune logique.** L'artisan arrive sur la landing de l'espace artisan et doit naviguer manuellement vers le formulaire d'inscription, puis saisir son SIRET à la main.

⚠️ **UX manquante** : le lien devrait pointer vers `/espace-artisan/inscription?siret=${result.siret}` pour pré-remplir le formulaire.

### Formulaire d'inscription artisan

**Fichier :** `app/espace-artisan/inscription/page.tsx`

Formulaire 2 étapes.

**Interface FormData :**
```typescript
{
  siret: string
  nomEntreprise: string
  adresse: string
  typesTravaux: string[]
  zoneIntervention: string
  siteWeb: string
  nomDirigeant: string
  email: string
  telephone: string
  motDePasse: string
  motDePasseConfirm: string
  cguAcceptees: boolean
}
```

**Étape 1 — Entreprise :**
- `siret` → auto-popule `nomEntreprise` + `adresse` via `https://recherche-entreprises.api.gouv.fr/search?q=${siret}&per_page=1` quand 14 chiffres saisis
- `typesTravaux` : sélection multiple parmi Plomberie, Électricité, Maçonnerie, Peinture, Isolation, Toiture, Menuiserie, Carrelage, Chauffage, Climatisation, Jardinage, Façade, Charpente, Serrurerie, Démolition, Autre
- `zoneIntervention` : texte libre (départements)
- `siteWeb` : optionnel

**Validations étape 1 :**
- SIRET 14 chiffres obligatoire
- `nomEntreprise` obligatoire
- Au moins 1 type de travaux sélectionné

**Étape 2 — Identité :**
- `nomDirigeant`, `email`, `telephone` obligatoires
- `justificatif` : upload fichier (Kbis < 3 mois OU pièce d'identité), max 5 Mo, formats PDF/JPG/PNG
- `motDePasse` min 8 chars, confirmation obligatoire
- `cguAcceptees` checkbox obligatoire

**Submit :** `POST /api/artisan/register` (FormData multipart, inclut le fichier)

### Routes `/api/artisan/*`

#### `POST /api/artisan/register`

1. Valide les champs requis
2. Crée un compte Supabase Auth :
   ```typescript
   supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true })
   ```
   - Si email déjà existant → retourne 409 `"Email déjà enregistré"`
3. Upload du justificatif vers le bucket Supabase Storage `justificatifs` :
   - Path : `${siret}/${Date.now()}.${ext}`
   - Non bloquant si échec
4. Insère dans `artisans` avec `statut = 'en_attente'`
5. Si insertion DB échoue → supprime l'utilisateur Auth créé (cleanup)
6. Envoie email de notification admin via Resend

#### `GET /api/artisan/list`

- **Auth** : Bearer token + email admin
- Paramètre query : `?statut=en_attente|verifie|refuse`
- Retourne tous les artisans filtrés, triés par `created_at DESC`
- Colonnes retournées : `id, siret, nom_entreprise, nom_dirigeant, email, telephone, statut, justificatif_url, abonnement_actif, badge_actif, essai_fin, created_at, motif_refus`

#### `POST /api/artisan/validate`

- **Auth** : Bearer token + email admin obligatoire
- Input JSON : `{ artisanId: string }`
- Calcule 14 jours d'essai (`essai_fin = now() + 14 jours`)
- Met à jour `artisans` :
  ```typescript
  { statut: 'verifie', badge_actif: true, essai_debut: now, essai_fin, abonnement_actif: true }
  ```
- Envoie email de confirmation à l'artisan via Resend

#### `POST /api/artisan/refuse`

- **Auth** : Bearer token + email admin obligatoire
- Input JSON : `{ artisanId: string, motif?: string }`
- Met à jour `artisans` :
  ```typescript
  { statut: 'refuse', motif_refus: motif }
  ```
- Envoie email de refus à l'artisan (avec motif en encadré rouge) via Resend

#### `PATCH /api/artisan/profile`

- **Auth** : Bearer token utilisateur (pas admin)
- Input JSON : `{ description?: string, telephone?: string }`
- Met à jour `artisans` WHERE `user_id = auth_user.id`

#### `GET /api/artisan/public`

- **Auth** : Aucune (public)
- Query param : `?siret=...`
- Retourne : `{ verifie: boolean, badgeActif: boolean, nomEntreprise: string|null, description: string|null }`
- Vérifie `statut = 'verifie'` ET `badge_actif = true`
- Si SIRET inconnu → retourne `{ verifie: false, badgeActif: false, nomEntreprise: null, description: null }`

#### `POST /api/artisan/devis/create`

- **Auth** : Bearer token utilisateur
- Vérifie que l'artisan est `statut = 'verifie'` (sinon 403)
- Compte les devis existants pour incrémenter `numero_devis`
- Insère dans `devis_artisan`
- Input : `{ clientNom, clientEmail?, clientTelephone?, clientAdresse?, lignes[], totalHt, tvaTaux, totalTtc, acompte, statut? }`

### Structure de la table `artisans`

> Note : la table s'appelle **`artisans`** (pas `artisan_profiles`)

```sql
CREATE TYPE statut_artisan AS ENUM ('en_attente', 'verifie', 'refuse');

TABLE artisans:
  id                      uuid          PK, gen_random_uuid()
  user_id                 uuid          FK → auth.users(id) ON DELETE CASCADE
  siret                   text          UNIQUE NOT NULL
  nom_entreprise          text          NOT NULL
  adresse                 text
  types_travaux           text[]        DEFAULT {}
  zone_intervention       text[]        DEFAULT {}
  site_web                text
  nom_dirigeant           text          NOT NULL
  email                   text          NOT NULL
  telephone               text          NOT NULL
  justificatif_url        text          — URL bucket 'justificatifs'
  statut                  statut_artisan DEFAULT 'en_attente'
  motif_refus             text
  stripe_customer_id      text
  stripe_subscription_id  text
  essai_debut             timestamptz
  essai_fin               timestamptz
  abonnement_actif        boolean       DEFAULT false
  badge_actif             boolean       DEFAULT false
  photo_url               text
  description             text
  created_at              timestamptz   DEFAULT now()
```

**RLS policies :**
- Lecture/écriture sur ses propres lignes (`user_id = auth.uid()`)
- Lecture publique des artisans vérifiés (`statut = 'verifie'`)
- `service_role` : accès total (utilisé par les routes API)

⚠️ `photo_url` n'est jamais alimenté (ni dans l'inscription, ni dans le dashboard)
⚠️ `stripe_customer_id` / `stripe_subscription_id` présents mais aucun flow Stripe B2B implémenté

### Validation dans `/app/admin/page.tsx`

- **Auth** : session Supabase + `user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL` (défaut `couratincharlie@gmail.com`)
- Si non-admin → affiche "Accès refusé"

**Section "En attente" :**
- Affiche : SIRET, nom entreprise, dirigeant, email, téléphone, date, lien Kbis
- Bouton **Valider** → `POST /api/artisan/validate` avec `{ artisanId }`
- Bouton **Refuser** → prompt JS pour saisir motif → `POST /api/artisan/refuse`

**Section "Artisans validés" :**
- Tableau : nom, SIRET, abonnement actif, date fin essai, badge actif

---

## 3. Flow Paiement Stripe

### `POST /api/checkout`

**Fichier :** `app/api/checkout/route.ts`

Input JSON :
```typescript
{
  plan: 'serenite' | 'tranquillite',
  siret?: string,
  nom?: string,
  chantierId?: string
}
```

**Pack Sérénité :**
- Mode : `'payment'` (one-time)
- Montant : **1990 cents (€19,90)**
- Nom produit : `"Pack Sérénité — ${nom}"`
- Description : `"Analyse IA de votre devis PDF + rapport complet artisan + surveillance 6 mois."`
- Success URL : `/artisan/${siret}?pack=serenite&session_id={CHECKOUT_SESSION_ID}` (si siret fourni) ou `/mes-chantiers?pack=serenite&session_id={CHECKOUT_SESSION_ID}`
- Metadata Stripe : `{ plan: 'serenite', siret, nom, chantierId }`
- Retourne 400 si `siret` ET `chantierId` tous les deux absents

**Pack Tranquillité :**
- Mode : `'subscription'` (récurrent)
- Montant : **490 cents (€4,90/mois)**
- `recurring: { interval: 'month' }`
- Success URL : `/mon-espace?plan=tranquillite&session_id={CHECKOUT_SESSION_ID}`

**Résolution de l'URL de base :**
1. `process.env.NEXT_PUBLIC_BASE_URL` si défini
2. Sinon détection depuis `request.headers` (proto + host)
3. Fallback : `http://localhost:3000`

⚠️ **Incohérence de prix** : L'interface affiche **4,90€** (mis à jour récemment) mais `api/checkout` facture **€19,90 (1990 cents)** pour le Pack Sérénité. Prix non synchronisé.

### Page `/rapport/succes`

**Fichier :** `app/rapport/succes/page.tsx`

Paramètres URL attendus : `?siret=...` (requis) + `?session_id=...` (optionnel, non vérifié)

**Workflow :**
1. Lit `siret` depuis `searchParams`
2. Lance en parallèle :
   - `fetchCompany(siret)` → données complètes de l'artisan
   - `getAISummary(result)` → synthèse Anthropic
3. Génère une page HTML avec rapport complet débloqué

**Fonction `getAISummary()` :**
```typescript
// Model: claude-sonnet-4-6
// Max tokens: 300
// Input: nom, statut, score, activité, ancienneté, capital, effectif, RGE, BODACC, dirigeants, alerts
// Output: résumé 3-4 phrases pour décision de confiance
```
- Import dynamique du SDK Anthropic : `await import('@anthropic-ai/sdk')`
- Retourne `""` si `ANTHROPIC_API_KEY` absent ou erreur API

**Sections du rapport :**
1. Badge "Rapport complet débloqué" + confirmation paiement
2. ScoreRing animé + verdicts + alerts
3. Résumé IA (si disponible) — fond gradient avec icône Sparkles
4. Informations légales (SIRET, forme juridique, date création, adresse, capital, effectif)
5. Certifications RGE
6. Procédures collectives (si présentes, encadré rouge)
7. Dirigeants (jusqu'à 5)
8. Timeline BODACC

⚠️ **Absence de vérification paiement** : La page `/rapport/succes` n'appelle pas Stripe pour confirmer que `session_id` correspond à un paiement réel complété. N'importe qui connaissant un SIRET peut accéder à `/rapport/succes?siret=XXX` sans avoir payé.

⚠️ **Table `rapports`** : Référencée dans CLAUDE.md mais **aucune migration SQL trouvée**. La page succès ne persiste rien en base. Il n'y a pas de table `rapports`.

---

## 4. Score de Fiabilité

### `lib/score.ts`

**Interface d'entrée :**
```typescript
interface ScoreInput {
  statut: string          // 'actif'|'A' = actif ; tout autre = fermé
  dateCreation?: string
  procedures: {
    collectives: number   // nb de procédures BODACC de type collectif
    disponible: boolean   // false → BODACC pas encore chargé
  }
}
```

**Retour loading :**
- Si `procedures.disponible === false` → `{ score: -1, loading: true }`
- `ScoreRing` affiche alors un anneau gris `#9ca3af`

**Calcul du score (3 critères) :**

| Critère | Points max | Conditions |
|---------|-----------|------------|
| Statut légal | 40 | Actif = 40, Fermé = 0 |
| Ancienneté | 35 | ≥10 ans = 35, ≥5 = 28, ≥2 = 17, <2 = 7 |
| Procédures BODACC | 25 | 0 proc = 25, 1 proc = 5, ≥2 proc = 0 |

Score final = `Math.round((totalPoints / 100) * 100)` → plage 0–100

**Couleurs :**
- `scoreColor(score)` : ≥70 → `#52B788` (vert), ≥50 → `#F4A261` (orange), <50 → `#E63946` (rouge), <0 → `#9ca3af` (gris)
- `scoreBg(score)` : versions pastel des mêmes couleurs

**Fonction helper :**
- `getYears(dateStr)` : calcule les années entières entre `dateStr` et aujourd'hui

### Appel depuis la fiche artisan

**Fichier :** `app/artisan/[siret]/page.tsx`

1. Appel initial `fetchCompany(siret)` depuis l'API `/api/enrich`
2. `result.score` est pré-calculé dans `fetchCompany.ts` (appelé dans la route `/api/enrich`)
3. La fiche re-calcule le score localement avec :
   ```typescript
   const scoreResult = calculateScore({
     statut: result.statut,
     dateCreation: result.dateCreation,
     procedures: {
       disponible: result.bodacc?.fetched ?? false,
       collectives: result.bodacc?.annonces?.filter(a => a.famille === 'collective').length ?? 0
     }
   })
   ```
4. `ScoreRing` reçoit `score` et `strokeColor`

### Comment BODACC est fetché et filtré

**Fichier :** `lib/fetchCompany.ts`

Appel API :
```
https://bodacc-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/annonces-commerciales/records
  ?where=registre like "${siren}"
  &order_by=dateparution desc
  &limit=20
```

**Filtrage pour procédures collectives** (pour le score) :
```typescript
annonces.filter(a =>
  a.famille === 'collective'
  || a.type?.toLowerCase().includes('liquidation')
  || a.type?.toLowerCase().includes('redressement')
  || a.type?.toLowerCase().includes('sauvegarde')
)
```

**Détection de changement de dirigeant récent** (6 mois) :
- Recherche dans `modificationsgenerales` les mots-clés : `administration|gérant|président|directeur`
- Seulement pour les annonces de moins de 6 mois

**Détection de cession** :
- Annonces `famille === 'Ventes et cessions'` dans les 3 dernières années

**Champ `fetched`** : `true` si l'appel BODACC a réussi, `false` si erreur → déclenche le score `-1`

---

## 5. Carnet de Chantier

### Structure des tables

#### Table `chantiers`
```
id               uuid         PK
user_id          uuid         FK → auth.users
siret            text         nullable (lien vers artisan)
nom_artisan      text         NOT NULL
type_travaux     text         NOT NULL
description      text
adresse_chantier text
date_debut       date
date_fin_prevue  date
montant_total    numeric
statut           text         'en_cours'|'termine'|'litige'|'en_attente'
created_at       timestamptz
```

#### Table `chantier_evenements`
```
id               uuid         PK
chantier_id      uuid         FK → chantiers
titre            text         NOT NULL
description      text
type             text         'note'|'alerte'|'appel'|'visite'|'probleme'|'document'|'photo'
date_evenement   timestamptz  NOT NULL
created_at       timestamptz
```

#### Table `chantier_paiements`
```
id               uuid         PK
chantier_id      uuid         FK → chantiers
montant          numeric      NOT NULL
date_paiement    date         NOT NULL
type             text         'acompte'|'avancement'|'solde'
description      text
photo_url        text         nullable (reçu photo)
created_at       timestamptz
```

#### Table `chantier_photos`
```
id               uuid         PK
chantier_id      uuid         FK → chantiers
url              text         NOT NULL (path Supabase Storage)
legende          text
phase            text         'avant'|'pendant'|'apres'
created_at       timestamptz
```

#### Table `chantier_documents`
```
id               uuid         PK
chantier_id      uuid         FK → chantiers
nom              text         NOT NULL
type             text         'devis'|'contrat'|'decennale'|'facture'|'pv_reception'|'correspondance'|'autre'
url              text         NOT NULL (path Supabase Storage)
taille           integer      nullable (bytes)
created_at       timestamptz
```

**Storage buckets :**
- `chantier-photos` — URLs signées (expiry 3600s), path : `{user_id}/{chantier_id}/{timestamp}.{ext}`
- `chantier-documents` — idem

### Les 5 onglets de `/app/chantier/[id]`

**Fichier :** `app/chantier/[id]/page.tsx`

Le chargement initial fait 5 requêtes Supabase en parallèle (chantier + 4 tables liées). Auth obligatoire (redirect vers `/auth` si non connecté).

**Onglet 1 — Journal** (`FileText`)
- Affiche la liste chronologique des `chantier_evenements` + alertes automatiques calculées
- Modal d'ajout : titre, description, type (icône colorée par type), date
- Insert dans `chantier_evenements`

**Onglet 2 — Paiements** (`CreditCard`)
- Résumé : total payé / montant total / barre de progression / % payé
- Avertissement rouge si acomptes > 30% du total
- Modal d'ajout : montant, date, type (acompte/avancement/solde), description
- Insert dans `chantier_paiements` + auto-log dans `chantier_evenements`

**Onglet 3 — Photos** (`Camera`)
- Filtre par phase (avant, pendant, apres, toutes)
- Zone de drop ou clic pour upload
- Sélecteur de phase + légende optionnelle avant envoi
- Upload vers bucket `chantier-photos`, insert métadonnées
- Visionneuse plein écran (lightbox) + bouton suppression
- URLs résolues via `resolveSignedUrls('chantier-photos', photos, 3600)`

**Onglet 4 — Documents** (`Download`)
- Filtre par type
- Sélecteur de type + nom, puis upload
- Formats acceptés : PDF, JPG, JPEG, PNG, DOC, DOCX
- Upload vers bucket `chantier-documents`, insert métadonnées
- Lien de téléchargement + bouton suppression par document

**Onglet 5 — Checklist** (`ClipboardCheck`)
- Intègre le composant `<GuideChantier />` (4 phases interactives)
- Contenu identique à l'ancienne page `/guide-chantier` (maintenant redirigée)

**Changement de statut :**
- Dropdown de statut éditable
- `supabase.from('chantiers').update({ statut })`
- Si statut → `'litige'` : insère automatiquement un événement alerte avec lien vers `/assistant-juridique`

**Export :**
- `window.print()` (impression navigateur, pas de PDF généré côté serveur)

### Alertes automatiques

Calculées **côté client à l'affichage** (non persistées en base) dans une fonction `computeAutoAlerts()` :

1. **14 jours sans activité** : si le dernier événement journal date de plus de 14 jours
2. **Fin de chantier dans 7 jours** : si `date_fin_prevue` est dans moins de 7 jours
3. **Acompte > 30%** : si la somme des paiements de type `acompte` dépasse 30% du `montant_total` (référence loi Hoguet)

Ces alertes s'affichent dans l'onglet Journal avec un style `type: 'alerte'` et le flag `_auto: true`.

**Alerte à la création d'un chantier :**
Lors du `POST` de création (`app/nouveau-chantier`), un événement est automatiquement inséré :
```
titre: "Chantier créé — vérifiez l'attestation décennale"
type: "alerte"
```

---

## 6. Surveillance Artisans

### `POST /api/surveillance` — Abonnement

Input : `{ email, siret, nom?, score?, statut? }`

Validation : regex email + siret requis

Opération Supabase :
```typescript
supabase.from('surveillances').upsert(
  { email, siret, nom_artisan: nom, score_initial: score, statut_initial: statut },
  { onConflict: 'email,siret', ignoreDuplicates: true }
)
```
- Contrainte unique : `(email, siret)` → pas de doublons
- Pas de `user_id` : la surveillance est liée à l'email uniquement (fonctionne sans compte)

Email de confirmation envoyé via Resend :
- From : `'Verifio <onboarding@resend.dev>'`
- Contient : lien de désinscription `/api/surveillance/unsubscribe?email=${email}&siret=${siret}`

### `GET /api/surveillance/unsubscribe` — Désinscription

Params : `?email=...&siret=...`

```typescript
supabase.from('surveillances').delete().eq('email', email).eq('siret', siret)
```

Retourne une page HTML (200 succès / 400 lien invalide / 500 erreur DB)

### Structure de la table `surveillances`

```
id               uuid         PK
email            text         NOT NULL
siret            text         NOT NULL
nom_artisan      text
score_initial    integer
statut_initial   text
created_at       timestamptz
UNIQUE (email, siret)
```

**RLS policies :**
- SELECT / INSERT / DELETE : `auth.email() = email`

⚠️ La surveillance fonctionne sans authentification (email comme clé) mais la RLS exige une session. Les routes API bypasse la RLS via `supabaseAdmin` (service_role).

### Cron `/api/cron/verifier-changements`

**Fichier :** `app/api/cron/verifier-changements/route.ts`

**Authentification cron :**
```typescript
if (process.env.CRON_SECRET) {
  return authHeader === `Bearer ${process.env.CRON_SECRET}`
}
return true // Si pas de secret configuré → tout le monde peut déclencher
```

⚠️ Sans `CRON_SECRET` configuré, la route est accessible publiquement.

**Workflow :**
1. `supabase.from('surveillances').select('*')` → toutes les surveillances
2. Groupe par SIRET (pour consolider les emails)
3. Pour chaque SIRET :
   - Appel `https://recherche-entreprises.api.gouv.fr/search?q=${siret}` pour le statut actuel
   - Compare avec `statut_initial` stocké
   - Si changement → envoie email d'alerte + `supabase.from('surveillances').update({ statut_initial: nouveauStatut }).eq('id', surveillance.id)`

**Email d'alerte :**
- Sujet : `⚠️ Alerte : ${nom} a changé de statut`
- Avant/après avec badges colorés (vert/rouge)
- Lien vers fiche + lien désinscription

**Réponse JSON :**
```typescript
{
  ok: boolean,
  sirets_checked: number,
  alertes_sent: number,
  results: Array<{ siret, changed, error? }>
}
```

⚠️ **Cron non configuré dans Vercel** : La route existe mais aucun déclencheur automatique Vercel Cron n'est en place (pas de `vercel.json` avec `crons`).

---

## 7. APIs Externes

### INSEE — `recherche-entreprises.api.gouv.fr`

**Utilisée dans :** `lib/fetchCompany.ts`, `app/espace-artisan/inscription/page.tsx`, `app/api/cron/verifier-changements`

**Paramètres de recherche :**
```
GET https://recherche-entreprises.api.gouv.fr/search
  ?q={siret_ou_nom}
  &page=1
  &per_page=5     (recherche générale)
  &per_page=1     (lookup SIRET)
```

**Détection SIRET :** regex `/^\d{9,14}$/`

**Champs utilisés dans la réponse :**
- `results[0].matching_etablissements[0].siret`
- `results[0].siren`
- `results[0].nom_complet` → `nom`
- `results[0].etat_administratif` → `'A'` (actif) ou `'F'` (fermé)
- `results[0].nature_juridique` → code forme juridique (mapé via `FORMES_JURIDIQUES`)
- `results[0].date_creation`
- `results[0].siege.adresse` (reconstitué depuis rue + cp + ville)
- `results[0].activite_principale` → code NAF + libellé
- `results[0].convention_collective_renseignee`
- `results[0].tranche_effectif_salarie` → mapé via `TRANCHES`
- `results[0].capital_social`
- `results[0].dirigeants[]` → nom, prénom, qualité, type, année naissance

**Cache :** `next: { revalidate: 3600 }` (1 heure)

**Pas d'authentification** (API publique)

### ADEME — RGE Certifications

**Utilisée dans :** `lib/fetchCompany.ts`

```
GET https://data.ademe.fr/data-fair/api/v1/datasets/liste-des-entreprises-rge-2/lines
  ?q={siret}
  &q_fields=siret
  &size=10
```

**Champs utilisés :**
- `results[].domaine` → domaine de certification
- `results[].domaine_travaux`
- `results[].organisme` → organisme certificateur

**Retour :** `{ certifie: boolean, domaines: string[], organismes: string[] }`

**Graceful degradation :** retourne `null` si l'API échoue (pas de plantage)

**Cache :** `next: { revalidate: 3600 }` (1 heure)

### BODACC — Annonces légales

**Utilisée dans :** `lib/fetchCompany.ts`

```
GET https://bodacc-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/annonces-commerciales/records
  ?where=registre like "{siren}"
  &order_by=dateparution desc
  &limit=20
```

Recherche par **SIREN** (9 chiffres, extrait du SIRET).

**Extraction (`extractBodaccAnnonce()`) :** mappe ~40 champs de la réponse vers `BodaccAnnonce` :
- `jugement` : nature, date, complement
- `acte` : descriptif, typeActe, dateImmatriculation
- `modificationsgenerales` : descriptif
- `radiationaurcs` : dateCessation, dateRadiation
- `listepersonnes` : denomination, nom, prenom, capital, formeJuridique, administration
- `listeetablissements` : activite, origineFonds, adresse
- `familleavis_lib` → `famille` (type d'annonce)

**Logique de filtrage :**
- **Procédures collectives** : `famille === 'collective'` OU `type` inclut `liquidation|redressement|sauvegarde`
- **Changement de dirigeant** : `modificationsgenerales` inclut `administration|gérant|président|directeur`, annonce < 6 mois
- **Cession** : `famille === 'Ventes et cessions'`, annonce < 3 ans

**Cache :** `next: { revalidate: 3600 }` (1 heure)

---

## 8. Bugs Connus Réels (observés dans le code)

### ⚠️ BUG CRITIQUE — Incohérence de prix Stripe
**Fichier :** `app/api/checkout/route.ts` ligne 30

Le checkout facture **€19,90 (1990 cents)** pour le Pack Sérénité. L'interface (fiche artisan, landing, page pricing) affiche **4,90€** depuis la mise à jour récente. Le prix dans Stripe n'a pas été mis à jour.

---

### ⚠️ BUG CRITIQUE — Page rapport/succes accessible sans paiement
**Fichier :** `app/rapport/succes/page.tsx`

Aucune vérification côté serveur que `session_id` correspond à un paiement Stripe complété. N'importe qui peut accéder à `/rapport/succes?siret=XXXXX` et voir le rapport complet sans payer.

---

### ⚠️ BUG — Google OAuth non fonctionnel
**Fichier :** `app/auth/page.tsx`

Le bouton Google OAuth est affiché mais `supabase.auth.signInWithOAuth()` n'est pas implémenté. Le fichier `/app/auth/callback/route.ts` **n'existe pas**.

---

### ⚠️ BUG — Revendication fiche ne transmet pas le SIRET
**Fichier :** `app/artisan/[siret]/page.tsx` ligne ~1671

Lien `<a href="/espace-artisan">` sans `?siret=${result.siret}`. L'artisan doit re-saisir manuellement son SIRET sur le formulaire d'inscription.

---

### ⚠️ BUG — Cron vérification sans sécurité si CRON_SECRET absent
**Fichier :** `app/api/cron/verifier-changements/route.ts`

Si `CRON_SECRET` n'est pas défini dans les variables d'environnement, la route est accessible publiquement sans authentification. Peut déclencher des appels API massifs.

---

### ⚠️ BUG — Cron non déclenché automatiquement
Le fichier `vercel.json` n'existe pas ou ne contient pas de configuration `crons`. Le cron de surveillance ne s'exécute jamais automatiquement.

---

### ⚠️ BUG MINEUR — ScoreRing flash gris
**Fichier :** `app/artisan/[siret]/page.tsx`

Bref flash gris au chargement de la fiche avant que BODACC soit disponible. `procedures.disponible = false` → score = -1 → anneau gris. Normal par design mais visible.

---

### ⚠️ BUG — Table `rapports` inexistante
Le fichier `CLAUDE.md` référence une table `rapports` dans Supabase. **Aucune migration SQL pour cette table n'existe.** La page `/rapport/succes` ne persiste rien en base.

---

### ⚠️ BUG — `photo_url` artisan jamais alimentée
**Table :** `artisans`

La colonne `photo_url` existe dans le schéma SQL mais n'est jamais écrite par le formulaire d'inscription, ni par `/api/artisan/profile`. Elle est toujours `null`.

---

### ⚠️ BUG — Stripe B2B artisan non implémenté
**Table :** `artisans`

Les colonnes `stripe_customer_id` et `stripe_subscription_id` existent mais aucun flow Stripe pour l'abonnement artisan n'est implémenté. `abonnement_actif` est mis à `true` manuellement lors de la validation admin, sans Stripe.

---

### ⚠️ BUG MINEUR — Timeline responsive
**Fichier :** `app/page.tsx`

La section Timeline utilise `style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr' }}` en inline. La classe CSS `.timeline-two-col` est définie dans le `<style>` block mais les divs utilisent des styles inline → le media query ne s'applique pas correctement sur mobile.

---

### ⚠️ BUG MINEUR — Ancienne mention "ArtisanCheck"
**Fichier :** `app/rapport/succes/page.tsx`

Le disclaimer en bas de page mentionne "ArtisanCheck" (ancien nom) au lieu de "Verifio".

---

## Récapitulatif des tables Supabase

| Table | Clé | Usage |
|-------|-----|-------|
| `auth.users` | id (uuid) | Authentification (Supabase built-in) |
| `chantiers` | id + user_id | Carnets de chantier utilisateurs |
| `chantier_evenements` | id + chantier_id | Journal d'événements |
| `chantier_paiements` | id + chantier_id | Suivi des paiements |
| `chantier_photos` | id + chantier_id | Photos avec phase |
| `chantier_documents` | id + chantier_id | Documents uploadés |
| `surveillances` | id + (email,siret) unique | Alertes email (sans user_id) |
| `user_plans` | id + user_id | Achats Pack Sérénité/Tranquillité |
| `artisans` | id + user_id + siret unique | Profils artisans B2B |
| `devis_artisan` | id + artisan_id | Devis créés par les artisans |
| `analyses_devis` | id + user_id | Historique analyses IA devis |
| `alertes_abus` | id + user_id | Détection fraude (service_role only) |
| `recherches` | id + user_id | Historique des recherches |
| `rapports` | — | **N'existe pas** (référencée dans CLAUDE.md) |
| `profiles` | — | **N'existe pas** (données dans auth.users metadata) |

---

*Audit généré le 24 mars 2026 par inspection statique du code.*
