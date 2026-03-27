# CLAUDE.md

## Instructions pour Claude

Ce fichier ne contient pas les règles du projet.
La source de vérité est dans les fichiers partagés du repo.

---

## Fichiers à lire obligatoirement

Avant toute tâche, lire :

1. `AGENTS.md` — règles d’exécution pour tous les agents
2. `PROJECT_AUDIT.md` — vérité technique et flows réels
3. `PROJECT_CONTEXT.md` — contexte produit et UX
4. `docs/HANDOFF.md` — état courant du projet
5. `docs/DECISIONS.md` — décisions d’architecture et produit
6. `CHANGELOG.md` — historique récent si nécessaire

---

## Règles importantes

- Ne jamais utiliser d’anciennes instructions qui auraient pu exister dans ce fichier
- Ne jamais considérer la mémoire du chat comme source de vérité
- Le code du repo et les fichiers Markdown font autorité
- En cas de conflit → suivre `AGENTS.md`
- En cas de doute → vérifier dans `PROJECT_AUDIT.md` ou le code

---

## Méthode de travail attendue

Pour chaque tâche :

1. Lire le contexte nécessaire
2. Résumer rapidement l’existant
3. Proposer un plan
4. Implémenter
5. Vérifier les impacts
6. Mettre à jour `docs/HANDOFF.md` si nécessaire
7. Mettre à jour `docs/DECISIONS.md` si une décision est prise

---

## Contexte

Projet : Verifio

Ce projet est utilisé par plusieurs agents (Claude Code, Codex).
Tous les agents doivent suivre les mêmes règles définies dans le repo.

Ce fichier sert uniquement de point d’entrée pour Claude.
