# PROJECT_OVERVIEW.md — Verifio

## Stack technique
- Next.js 16 (App Router), React 19, TypeScript strict
- Styles : inline styles JS partout, sauf classes globales dans `app/globals.css` (`btn-primary`, `card-hover`, `fade-up`, `font-display`, `font-body`). Tailwind v4 présent (config) mais quasi inutilisé.
- Supabase (auth + DB + storage)
- Stripe (paiements, pack "Sérénité" 4,90€)
- Anthropic SDK (`@anthropic-ai/sdk`) : `claude-haiku-4-5-20251001` (droits perso, analyse devis), `claude-sonnet-4-6` (synthèse IA rapport)
- Resend (emails)
- `@react-pdf/renderer` (génération PDF rapport)
- Icônes : Lucide React uniquement, `strokeWidth={1.5}`, pas d'emoji
- Déploiement : Vercel, auto sur push `main` → https://verifio-eight.vercel.app

## Structure des dossiers
- `app/` — routes App Router (pages + `app/api/**/route.ts` pour les endpoints)
- `components/` — composants partagés (UI, sections rapport, modals)
- `lib/` — logique métier : `fetchCompany.ts` (agrégation API entreprise/BODACC/BOAMP/RGE/dirigeants), `score.ts`, `supabase.ts`, `unsubscribeSig.ts`, `batiment.ts`, `dirigeant.ts`
- `types/` — types partagés (`index.ts`, `chantier.ts`)
- `supabase/migrations/` — migrations SQL (certaines non encore appliquées en prod, voir Bugs connus)
- `supabase/storage-policies.sql` — policies bucket storage
- `docs/` — `HANDOFF.md`, `DECISIONS.md`
- `artisancheck/` — ancien projet (ex-nom "ArtisanCheck"), dossier dupliqué/legacy, ne pas modifier
- `PROJECT_AUDIT.md` — vérité technique détaillée (auth, Stripe, flows critiques) — à consulter avant modif importante
- `PROJECT_CONTEXT.md`, `AGENTS.md`, `CHANGELOG.md` — contexte additionnel

## Variables d'environnement
- `NEXT_PUBLIC_BASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `RESEND_API_KEY` (silent fail si absent)
- `CRON_SECRET`
- `ADMIN_EMAIL` / `NEXT_PUBLIC_ADMIN_EMAIL` (défaut `couratincharlie@gmail.com`)
- `UNSUBSCRIBE_SECRET`, `UNSUBSCRIBE_REQUIRE_SIGNATURE`
- `NEXT_PUBLIC_GOOGLE_MAPS_KEY`
- `VERCEL_URL`, `NODE_ENV` (auto)

## Fonctionnalités existantes
- Recherche entreprise (SIRET/nom) avec autocomplete, fiche entreprise + score de confiance, BODACC, BOAMP, RGE, dirigeants
- Auth Supabase (email/password + Google OAuth), gestion profil, suppression compte
- Rapport payant (Stripe, pack Sérénité) avec synthèse IA, PDF, partage par lien (`share_token`)
- Analyse de devis par IA (quota 5/mois par SIRET)
- Simulateur de prix travaux, calculateur d'aides
- Suivi de chantiers (`mes-chantiers`, `chantier/[id]`, phases)
- Comparateur d'artisans
- Surveillance d'entreprise (alertes changements via cron) + désinscription sécurisée (HMAC)
- Espace artisan B2B (inscription, validation admin, dashboard, devis) — **masqué côté UI pour le lancement B2C**, code conservé
- Assistant juridique
- Guide chantier, guide recours, modèle de contrat

## Bugs connus / non testés
- PDF rapport (`/api/rapport-pdf`) non validé en prod
- Email confirmation Resend non testé en prod (clé requise)
- Partage sécurisé rapport (`share_token`/`share_expires_at`) à vérifier
- Synthèse IA dépend de `ANTHROPIC_API_KEY` (fallback si absente)
- Cron surveillance configuré (`vercel.json`) mais non déclenché en prod
- Google OAuth à configurer en prod (Supabase + Google Console)
- `ScoreRing` : flash gris avant chargement BODACC
- Timeline mobile : ne repasse pas toujours en 1 colonne
- `.pricing-grid` media query ne cible pas correctement les divs inline

## Migrations Supabase non confirmées appliquées
- `20260325000000_create_rapports.sql`
- `20260326_add_nom_entreprise_rapports.sql`
- `20260325000000_surveillance_devis.sql`
- `ALTER TABLE surveillances ADD COLUMN IF NOT EXISTS statut_initial text;`
- colonnes `nom_fichier`/`resultat_json` sur `analyses_devis`

## TODOs prioritaires (masquage B2B, non terminé)
- Rediriger vers `/` : `app/espace-artisan/page.tsx`, `app/espace-artisan/inscription/page.tsx`, `app/artisan/dashboard/page.tsx`, `app/artisan/dashboard/devis/nouveau/page.tsx`, `app/admin/page.tsx`
- `app/page.tsx` : retirer le lien "Espace artisan" de `FOOTER_LINKS.produit`
- `app/artisan/[siret]/page.tsx` : commenter le bloc "Revendiquez cette fiche" vers `/espace-artisan`

## Conventions de code
- TypeScript strict partout
- Mobile-first, breakpoint principal 768px
- Textes en français
- Aucun emoji dans le code
- Inline styles JS (pas de classes Tailwind), sauf classes globales listées ci-dessus
- Variables CSS : `--color-bg`, `--color-surface`, `--color-border`, `--color-accent`, `--color-accent-light`, `--color-muted`, `--color-safe`, `--color-danger`, `--color-neutral-bg`
- Réponses Haiku/Sonnet : toujours stripper les backticks markdown avant `JSON.parse` :
  `.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/```\s*$/i,'').trim()`
- `LoginForm`/`SignupForm` définis au niveau module (pas dans le composant parent) pour éviter de casser le focus des inputs
- Statuts entreprise : toujours comparer via `String(statut || '').toLowerCase().trim()`
- Composants partagés clés : `ScoreRing`, `SyntheseIA`, `BodaccSection`, `PackBadge`, `SiteHeader`, `ResultCard`, `PricingCards`, `ExperiencePrimitives` (`SectionBadge`, `PageHero`, `SurfaceCard`, `PrimaryLink`)

## Référence
Pour le détail complet des flows (auth, Stripe, surveillance, etc.) voir `PROJECT_AUDIT.md`.
