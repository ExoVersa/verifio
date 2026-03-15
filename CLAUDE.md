# Instructions permanentes

## Workflow Git
À chaque modification de fichier, automatiquement :
1. git add .
2. git commit -m "description courte du changement"
3. git push origin main

## Contexte du projet
- Nom : ArtisanCheck / Verifio
- Repo : https://github.com/ExoVersa/verifio
- Stack : Next.js 15, TypeScript, Tailwind, Supabase, Stripe
- Déploiement : Vercel (auto sur push main)
- L'app sera aussi une app mobile (React Native plus tard)

## APIs utilisées
- Recherche entreprises : https://recherche-entreprises.api.gouv.fr
- RGE ADEME : https://data.ademe.fr
- Stripe pour les paiements premium (4,90€ par rapport)
- Anthropic API (claude-sonnet-4-6) pour la synthèse IA du rapport complet

## Variables d'environnement Vercel (à configurer manuellement)
Aller sur https://vercel.com → Projet verifio → Settings → Environment Variables :
- NEXT_PUBLIC_BASE_URL = https://verifio.vercel.app
- ANTHROPIC_API_KEY = (clé secrète Anthropic)
- STRIPE_SECRET_KEY = (clé secrète Stripe)
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = (clé publique Stripe)
- NEXT_PUBLIC_SUPABASE_URL = https://eflaghdxvrfenyqkrfnt.supabase.co
- NEXT_PUBLIC_SUPABASE_ANON_KEY = (clé anon Supabase)

## Règles
- Toujours écrire le code en TypeScript
- Toujours push après chaque modification
- L'interface doit être responsive (mobile first)
- Les textes sont en français
