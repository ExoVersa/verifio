# Instructions permanentes

## Workflow Git
À chaque modification de fichier, automatiquement :
1. git add .
2. git commit -m "description courte du changement"
3. git push https://github.com/ExoVersa/verifio HEAD:main  ← worktree, toujours `HEAD:main`

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
- BODACC (annonces légales) : via `lib/fetchCompany.ts`
- BOAMP (marchés publics) : `https://www.boamp.fr/api/explore/v2.1/...` via `lib/fetchCompany.ts`
- Stripe pour les paiements premium (4,90€ par rapport)
- Anthropic API : `claude-haiku-4-5-20251001` pour droits personnalisés + analyse devis, `claude-sonnet-4-6` pour synthèse IA rapport

## Variables d'environnement Vercel
- `NEXT_PUBLIC_BASE_URL` = https://verifio-eight.vercel.app
- `ANTHROPIC_API_KEY` = (clé secrète Anthropic)
- `STRIPE_SECRET_KEY` = (clé secrète Stripe)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = (clé publique Stripe)
- `NEXT_PUBLIC_SUPABASE_URL` = https://eflaghdxvrfenyqkrfnt.supabase.co
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (clé anon Supabase)
- `SUPABASE_SERVICE_ROLE_KEY` = (critique — insertions server-side)
- `RESEND_API_KEY` = (emails — silent fail si absent)
- `CRON_SECRET` = (auth route cron)

## Règles de code
- Toujours écrire en TypeScript strict
- Toujours push après chaque modification
- Interface responsive (mobile first) — breakpoint principal : 768px
- Textes en français
- Icônes : **Lucide React uniquement**, `strokeWidth={1.5}`, taille 14/16 inline, 20 titres section, 28/32 hero. **Aucun emoji dans le code.**
- Styles : inline styles JS uniquement (pas de classes Tailwind). Exceptions : classes globales dans `globals.css` (`btn-primary`, `card-hover`, `fade-up`, `font-display`, `font-body`).
- Variables CSS : `--color-bg`, `--color-surface`, `--color-border`, `--color-accent`, `--color-accent-light`, `--color-muted`, `--color-safe`, `--color-danger`, `--color-neutral-bg`
- Backticks markdown : quand on appelle Haiku via `anthropic.messages.create()`, la réponse peut contenir des backticks. Toujours stripper avant `JSON.parse` : `.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/```\s*$/i,'').trim()`

## État du projet
Voir `PROJECT_AUDIT.md` pour l'état complet : pages, composants, architecture, Supabase, bugs connus, TODO.
