# Décisions techniques

Ce fichier trace les décisions d'architecture importantes.

## Décisions actives

| Date | Décision | Raison |
|------|----------|--------|
| 2026-03 | Inline styles uniquement (pas Tailwind classes) | Cohérence future app mobile React Native |
| 2026-03 | Lucide React pour toutes les icônes | Uniformité, pas d'emojis dans le code |
| 2026-03 | `lib/score.ts` source unique du score | Évite les divergences entre fiche artisan et résultats recherche |
| 2026-03 | Haiku pour analyses devis (2×800 tokens) | Coût et vitesse — pas besoin de Sonnet pour extraction JSON |
