# Instructions permanentes

## Workflow Git
À chaque modification de fichier, automatiquement :
1. git add .
2. git commit -m "description courte du changement"
3. git push origin HEAD:main  ← worktree, ne pas oublier HEAD:main

## Contexte du projet
- Nom : **Verifio** (anciennement ArtisanCheck)
- Repo : https://github.com/ExoVersa/verifio
- Stack : Next.js 15 App Router, TypeScript, inline styles (pas Tailwind classes), Supabase, Stripe
- Déploiement : Vercel (auto sur push main) → https://verifio-eight.vercel.app
- L'app sera aussi une app mobile (React Native plus tard)
- Worktree actif : `/Users/CharlieCouratin/artisancheck/.claude/worktrees/focused-haslett`

## APIs externes utilisées
- Recherche entreprises : `https://recherche-entreprises.api.gouv.fr`
- RGE ADEME : `https://data.ademe.fr`
- BODACC (annonces légales) : API gouv (via `lib/fetchCompany.ts`)
- Stripe pour les paiements premium (4,90€ par rapport)
- Anthropic API (`claude-sonnet-4-6`) pour la synthèse IA du rapport complet

## Variables d'environnement Vercel
Aller sur https://vercel.com → Projet verifio → Settings → Environment Variables :
- `NEXT_PUBLIC_BASE_URL` = https://verifio-eight.vercel.app
- `ANTHROPIC_API_KEY` = (clé secrète Anthropic)
- `STRIPE_SECRET_KEY` = (clé secrète Stripe)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = (clé publique Stripe)
- `NEXT_PUBLIC_SUPABASE_URL` = https://eflaghdxvrfenyqkrfnt.supabase.co
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (clé anon Supabase)

## Règles de code
- Toujours écrire en TypeScript strict
- Toujours push après chaque modification
- Interface responsive (mobile first) — breakpoint principal : 768px
- Textes en français
- Icônes : **Lucide React uniquement**, `strokeWidth={1.5}`, taille 14/16 inline, 20 titres section, 28/32 hero. **Aucun emoji dans le code.**
- Styles : inline styles JS uniquement (pas de classes Tailwind). Exceptions : classes globales dans `globals.css` (`btn-primary`, `card-hover`, `fade-up`, `font-display`, `font-body`).
- Variables CSS : `--color-bg`, `--color-surface`, `--color-border`, `--color-accent`, `--color-accent-light`, `--color-muted`, `--color-safe`, `--color-danger`, `--color-neutral-bg`

---

## État du projet au 24 mars 2026

### Pages publiques

| Route | Description | État |
|-------|-------------|------|
| `/` | Landing page — Hero, Stats, Timeline 5 étapes, Pricing, Témoignages, Sources, CTA | ✅ Complet |
| `/recherche` | Recherche artisans avec autocomplete, filtres métiers, cartes résultats | ✅ Complet |
| `/artisan/[siret]` | Fiche artisan complète — ScoreRing, BODACC, RGE, dirigeants, Pack Sérénité | ✅ Complet |
| `/comparer` | Comparateur 2-3 artisans côte à côte | ✅ Complet |
| `/simulateur-prix` | Simulateur de prix travaux par catégorie | ✅ Complet |
| `/simulateur-prix/[type]` | Pages dédiées par type (isolation, toiture, plomberie…) | ✅ Complet |
| `/analyser-devis` | Upload et analyse IA d'un devis (Anthropic) | ✅ Complet |
| `/calculateur-aides` | Calculateur MaPrimeRénov', CEE et aides état | ✅ Complet |
| `/assistant-juridique` | Assistant juridique IA pour litiges | ✅ Complet |
| `/assistant-juridique/[slug]` | Fiches juridiques par situation (artisan-disparu, travaux-mal-faits…) | ✅ Complet |
| `/pricing` | Page tarifs détaillée | ✅ Complet |
| `/auth` | Login / Signup — 2 colonnes, Google OAuth, indicateur force mot de passe | ✅ Complet |
| `/guide-chantier` | **Redirige vers `/mes-chantiers`** (contenu intégré dans onglet Checklist) | ✅ Redirigé |
| `/a-propos` | Page à propos | ✅ Existe |
| `/contact` | Formulaire de contact | ✅ Existe |
| `/cgu` | Conditions générales d'utilisation | ✅ Existe |
| `/mentions-legales` | Mentions légales | ✅ Existe |
| `/politique-confidentialite` | Politique de confidentialité | ✅ Existe |

### Pages connectées (Supabase Auth)

| Route | Description | État |
|-------|-------------|------|
| `/mes-chantiers` | Liste de tous les chantiers de l'utilisateur | ✅ Complet |
| `/nouveau-chantier` | Formulaire création chantier | ✅ Complet |
| `/chantier/[id]` | Carnet de chantier détaillé — 5 onglets | ✅ Complet |
| `/mon-espace` | Profil, surveillances, historique | ✅ Complet |
| `/historique` | Historique des recherches | ✅ Existe |

### Espace artisan (B2B)

| Route | Description | État |
|-------|-------------|------|
| `/espace-artisan` | Landing espace artisan | ✅ Existe |
| `/espace-artisan/inscription` | Formulaire inscription artisan | ✅ Existe |
| `/artisan/dashboard` | Dashboard artisan connecté | ✅ Existe |
| `/artisan/dashboard/devis/nouveau` | Créer un devis depuis le dashboard | ✅ Existe |
| `/rapport/succes` | Page succès après paiement Stripe | ✅ Existe |
| `/admin` | Interface admin interne | ✅ Existe |

---

## Architecture technique

### Composants principaux (`/components`)

| Fichier | Rôle |
|---------|------|
| `SiteHeader.tsx` | Header avec mega-menu déroulant, auth, mobile hamburger |
| `SearchAutocomplete.tsx` | Autocomplete recherche avec skeleton, fetchedQuery state |
| `GuideChantier.tsx` | Checklist interactive 4 phases (Avant signer / Démarrage / Pendant / Réception) |
| `AssistantJuridique.tsx` | Chat IA juridique |
| `ComparateurArtisans.tsx` | Tableau comparatif multi-artisans |
| `DevisAnalysisCard.tsx` | Rendu analyse de devis IA |
| `ScoreRing.tsx` | Anneau de score SVG animé (gris si score=-1) |
| `SimulateurPrix.tsx` | Interface simulateur de prix |
| `ResultCard.tsx` | Carte résultat de recherche |
| `SearchBar.tsx` | Barre de recherche simple |
| `CookieBanner.tsx` | Bandeau cookies RGPD |
| `OnboardingModal.tsx` | Modal d'onboarding premier usage |
| `ShareButton.tsx` | Bouton partage natif |
| `FadeUpObserver.tsx` | Animation scroll fade-in |

### Lib (`/lib`)

| Fichier | Rôle |
|---------|------|
| `score.ts` | `calculateScore(input: ScoreInput): ScoreResult` — source unique du score |
| `fetchCompany.ts` | Fetch INSEE + BODACC + RGE + dirigeants, retourne `CompanyData` |
| `supabase.ts` | Client Supabase (browser + server) |
| `dirigeant.ts` | Helpers dirigeants |

### Types (`/types`)

| Fichier | Contenu |
|---------|---------|
| `index.ts` | `SearchCandidate`, `CompanyData`, `BodaccAnnonce`, etc. |
| `chantier.ts` | `Chantier`, `ChantierPaiement`, `ChantierEvenement`, `ChantierPhoto`, `ChantierDocument`, helpers |

### API Routes (`/app/api`)

| Route | Rôle |
|-------|------|
| `/api/recherche` | Recherche entreprises + score rapide (INSEE + BODACC async) |
| `/api/enrich` | Enrichissement complet fiche artisan (BODACC, RGE, dirigeants) |
| `/api/checkout` | Création session Stripe paiement rapport |
| `/api/analyser-devis` | Analyse IA devis via Anthropic |
| `/api/assistant-juridique` | Chat IA juridique via Anthropic |
| `/api/comparer-verdict` | Verdict IA comparatif entre artisans |
| `/api/simulateur-prix` | Calcul prix estimatif par type travaux |
| `/api/surveillance` | CRUD surveillances artisans |
| `/api/surveillance/unsubscribe` | Désinscription surveillance |
| `/api/cron/verifier-changements` | Cron Vercel — détecte changements artisans surveillés |
| `/api/contact` | Envoi formulaire contact |
| `/api/financial` | Données financières artisan |
| `/api/artisan/*` | Gestion espace artisan (profil, devis, validation admin) |
| `/api/account/delete` | Suppression compte utilisateur |
| `/api/search` | Route de recherche alternative |
| `/api/check-env` | Vérification variables d'environnement |

---

## Fonctionnalités détaillées

### Score de fiabilité (`lib/score.ts`)
```typescript
interface ScoreInput {
  statut: string          // 'actif'|'A' = actif, 'fermé'|'F' = fermé
  dateCreation?: string
  procedures: {
    collectives: number   // nb procédures BODACC famille='collective'
    disponible: boolean   // false = BODACC pas encore chargé → score=-1
  }
}
```
- **score = -1** : BODACC non disponible → ScoreRing gris + "Données indisponibles"
- **0 procédures** = 25 pts, **1 procédure** = 5 pts, **2+** = 0 pts
- Critères : statut légal (40pts), ancienneté (35pts), procédures BODACC (25pts)
- Couleurs breakdown : ratio ≥ 0.8 → vert, ≥ 0.5 → orange, < 0.5 → rouge

### Carnet de chantier (`/chantier/[id]`)
5 onglets avec icônes Lucide :
1. **Journal** (`FileText`) — événements chronologiques + alertes auto
2. **Paiements** (`CreditCard`) — suivi acomptes, soldes, jalons
3. **Photos** (`Camera`) — galerie horodatée par phase
4. **Documents** (`Download`) — factures, contrats, PV
5. **Checklist** (`ClipboardCheck`) — `GuideChantier` intégré (4 phases)

Alertes automatiques :
- 14 jours sans activité
- Fin de chantier dans 7 jours
- Acompte > 30% du total (loi Hoguet)

### Landing page (`/`)
- **S1 Hero** : fond photo chantier, badges flottants animés, barre de recherche autocomplete, chips 6 métiers
- **S2 Stats** : compteurs animés au scroll (26 000 arnaques, 6 sources, 30s, 100% gratuit)
- **S3 Timeline** : 5 étapes interactives dépliables (Trouver / Analyser devis / Signer / Suivre / Réceptionner)
- **S4 Pricing** : 3 colonnes (Gratuit / Pack Sérénité 4,90€ / Pack Tranquillité bientôt)
- **S5 Témoignages** : 3 cartes (Marie D., Thomas L., Sophie M.)
- **S6 Sources** : 6 logos officiels (INSEE, ADEME, BODACC, INPI, data.gouv.fr, Qualibat)
- **S7 CTA finale** : fond vert foncé, 2 boutons
- **Footer** : 3 colonnes (Verifio / Produit / Légal)

### Navigation SiteHeader
4 mega-menus déroulants :
- **Vérifier** : Rechercher un artisan + Comparer des artisans
- **Analyser** : Simulateur de prix + Analyser un devis IA + Calculateur d'aides État
- **Se protéger** : Assistant juridique + Pack Sérénité (→ /pricing)
- **Mon chantier** : Carnet de chantier + Mon espace

### Pricing
- **Gratuit** : recherche, score, statut INSEE, certifications RGE
- **Pack Sérénité — 4,90€/rapport** : + rapport PDF, analyse devis IA, alertes BODACC, carnet chantier illimité, détection clauses abusives
- **Pack Tranquillité** : (à venir) multi-artisans, support prioritaire, alertes illimitées, API

### Page Auth (`/auth`)
- Layout 2 colonnes : gauche 45% vert foncé `#1B4332` + droite 55% crème `#F8F4EF`
- Panneau gauche : logo Verifio, citation, 3 arguments (Shield/Zap/Gift), témoignage Marie D.
- Formulaire login : email + mdp avec œil, "Mot de passe oublié?", Google OAuth
- Formulaire signup : prénom+nom, email, mdp + indicateur de force (4 barres), confirmation, CGU
- Mobile : colonne gauche masquée, formulaire plein écran

---

## Supabase — Tables principales

| Table | Contenu |
|-------|---------|
| `chantiers` | Chantiers utilisateurs (nom_artisan, siret, statut, montant_total, dates…) |
| `chantier_evenements` | Journal des événements d'un chantier |
| `chantier_paiements` | Paiements associés à un chantier |
| `chantier_photos` | Photos avec phase et légende |
| `chantier_documents` | Documents (factures, contrats, PV…) |
| `surveillances` | Artisans surveillés par utilisateur |
| `artisan_profiles` | Profils artisans côté B2B |
| `artisan_devis` | Devis créés par les artisans |
| `recherches` | Historique de recherches utilisateur |
| `rapports` | Rapports payants générés |

---

## Bugs connus

| Bug | Statut | Description |
|-----|--------|-------------|
| ScoreRing flash | Mineur | Bref flash gris avant que BODACC charge sur la fiche artisan |
| Timeline mobile | Mineur | Les 2 colonnes de la timeline ne passent pas toujours en 1 colonne sur petits écrans (className vs inline) |
| Pricing responsive | Mineur | La grille 3 colonnes du pricing nécessite `.pricing-grid` class mais les divs utilisent style inline — le media query CSS dans `<style>` ne cible pas les divs inline |
| Auth Google OAuth | À tester | Bouton Google présent mais flow Supabase OAuth à valider en production |
| Cron surveillance | Non testé | Route `/api/cron/verifier-changements` n'est pas encore configurée dans Vercel Cron |
| /guide-chantier redirect | Mineur | La page est statique (○) donc le redirect fonctionne bien, mais les anciens liens dans Google seront indexés |

---

## TODO — Priorités

### 🔴 Critique
- [ ] Configurer le cron Vercel pour `/api/cron/verifier-changements` (alertes surveillances)
- [ ] Tester le flow Stripe complet en production (checkout → /rapport/succes → rapport généré)
- [ ] Valider Google OAuth en production avec domaine verifio-eight.vercel.app

### 🟠 Important
- [ ] Fixer le responsive de la section Pricing (remplacer style inline par className `.pricing-grid`)
- [ ] Fixer le responsive de la Timeline (idem, className `.timeline-two-col`)
- [ ] Page `/pricing` : aligner visuellement avec la section Pricing de la landing
- [ ] Page `mon-espace` : tabs surveillances / historique / profil à compléter
- [ ] Onboarding : modal premier usage à déclencher après inscription

### 🟡 Nice to have
- [ ] "Signaler un artisan" (currently `soon: true` dans le nav → à développer)
- [ ] Pack Tranquillité (abonnement mensuel) — paiement récurrent Stripe
- [ ] Espace artisan : validation admin + dashboard complet
- [ ] Export PDF du carnet de chantier
- [ ] App mobile React Native

### ✅ Récemment terminé (mars 2026)
- [x] Score de fiabilité avec `lib/score.ts` — interface unique, BODACC graceful degrade
- [x] BODACC filter fix (`famille === 'collective'` au lieu de `includes('procédure')`)
- [x] ScoreRing état loading (gris, score = -1)
- [x] Breakdown couleurs par critère (ratio ≥ 0.8/0.5/<0.5)
- [x] Pack Sérénité contextuel (rouge si risque, vert sinon, bannière urgence procédures)
- [x] Autocomplete : skeleton rows, `fetchedQuery` state, no false empty state
- [x] Page `/auth` : refonte complète 2 colonnes, indicateur force mdp, Google OAuth
- [x] Emojis → Lucide icons (remplacement complet sur toutes les pages)
- [x] Onglet Checklist dans `/chantier/[id]` (GuideChantier intégré)
- [x] `/guide-chantier` redirige vers `/mes-chantiers`
- [x] Landing : timeline 5 étapes interactive + pricing 3 colonnes
- [x] Navigation SiteHeader réorganisée (Se protéger + Mon chantier simplifiés)
- [x] Section Sources : 6 logos + phrase "Données officielles mises à jour quotidiennement"
