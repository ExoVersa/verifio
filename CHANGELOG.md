# CHANGELOG — Verifio

## 2026-04

### 2026-04-10 — Fixes responsive mobile page rapport

- `app/globals.css` : `html`/`body` `overflow-x: hidden` + `max-width: 100vw` ; `.rapport-grid-2` passe à `repeat(2, minmax(0, 1fr))` ; `.rapport-card` : `max-width: 100%`, `min-width: 0`
- `app/rapport/succes/page.tsx` : fix overflow identité (minWidth 0, wordBreak), droits cards `paddingRight: 120px` → `80px`, override CSS `.rapport-droits-item > div:first-of-type { padding-right: 40px !important }`
- `components/GuideRecours.tsx` : ajout `minWidth: 0`, `width: 100%`, `boxSizing: border-box` sur flex items
- `components/ModeleContrat.tsx` : root div `width: 100%`, `pre` `width: 100%`, header `flexWrap: wrap`, badge `whiteSpace: nowrap`

### 2026-04-08 — Phase 2 : unification score BODACC et forme juridique

- `lib/fetchCompany.ts` : export `libelleFormeJuridique` (était privé) ; filtre BODACC `famille` → comparaison robuste insensible à la casse
- `app/api/recherche/route.ts` : suppression table `FORMES_JURIDIQUES` dupliquée → import `libelleFormeJuridique` depuis `lib/fetchCompany.ts` ; champ BODACC `familleavis_lib` → `familleavis`
- Résultat : score BODACC cohérent entre page de recherche et fiche rapport

### 2026-04-07 — Phase 1 : auth synthèse IA + désinscription HMAC

- `lib/unsubscribeSig.ts` (nouveau) : HMAC-SHA256 pour signer/vérifier les liens de désinscription surveillance
- `app/api/surveillance/unsubscribe/route.ts` : vérification signature si `UNSUBSCRIBE_REQUIRE_SIGNATURE=true`
- `app/api/cron/verifier-changements/route.ts` : génère les liens désinscription signés quand `CRON_SECRET` disponible
- `app/api/rapport-synthese/route.ts` : `assertCanGenerateSynthese()` — vérifie JWT (rapport acheté) ou `share_token` (rapport partagé) avant d'appeler Anthropic
- `components/SyntheseIA.tsx` : envoie `Authorization: Bearer` (JWT) ou `share_token` selon le contexte ; gestion d'annulation via flag `cancelled`

### 2026-04-07 — Phase 0 : sécurisation checkout user_id

- `app/api/checkout/route.ts` : `user_id` dans les metadata Stripe est désormais `user.id` extrait du JWT côté serveur — la valeur du body est ignorée (empêche usurpation d'identité)
- `app/artisan/[siret]/page.tsx` : `startSerenite()` passe `Authorization: Bearer ${access_token}`

### 2026-04-05 — Features rapport complet

- Dirigeants rapport payant : liens cliquables `<a href="/dirigeant/[slug]">` + pill "Voir ses entreprises →"
- Droits personnalisés IA : appel Haiku dans le Server Component → 2-3 cartes contextuelles spécifiques à l'artisan
- Marchés publics BOAMP : `fetchBOAMP()` dans `fetchCompany` + section rapport/fiche
- Page 404 : `app/not-found.tsx` personnalisée

### 2026-04-04 — Sécurisation checkout + B2B masqué

- `/api/checkout` : auth obligatoire (JWT) — 401 si absent ou invalide
- `SiteHeader` : features B2B masquées (commentées) pour lancement B2C

### 2026-04-02 — Refonte visuelle

- Couche design "confiance premium" sur 10 pages clés
- Composants partagés : `SurfaceCard`, `PageHero`, `SectionBadge`, `PrimaryLink` dans `ExperiencePrimitives`
- `app/pricing/page.tsx`, `app/analyser-devis/page.tsx`, `app/mon-espace/page.tsx`, etc.

---

## 2026-03

- Auth refactor : Google OAuth, flow signup/login, indicateur force MDP
- Fix Stripe prix : 19,90€ → 4,90€ (490 cents)
- Flow rapport stabilisé : vérification paiement, INSERT Supabase service role, surveillance 6 mois, email Resend
- Cron surveillance : `vercel.json`, `normalizeStatut()`, gestion `statut_initial = null`
- Analyse devis IA : auth obligatoire, quota 5/mois/artisan, vérification Pack Sérénité
- Carnet de chantier : suppression cascade, 5 onglets, export PDF
- Score : court-circuit entreprise fermée (score = 0)
- Recherche : `exactMatch` SIRET, `maxDuration=30`, `fetchWithRetry`, `AbortSignal.timeout`
