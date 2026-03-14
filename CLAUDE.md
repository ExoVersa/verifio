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

## Règles
- Toujours écrire le code en TypeScript
- Toujours push après chaque modification
- L'interface doit être responsive (mobile first)
- Les textes sont en français
