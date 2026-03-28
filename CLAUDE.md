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

## État du projet
Voir `PROJECT_AUDIT.md` pour l'état complet : pages, composants, architecture, Supabase, bugs connus, TODO.
