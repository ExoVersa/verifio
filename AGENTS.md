# AGENTS.md — Verifio

## Objectif
Ce dépôt est utilisé par plusieurs agents (Claude Code, Codex).
Le repo Git est la source de vérité.
La mémoire des chats n'est jamais fiable si elle n'est pas dans le code.

---

## Règles fondamentales

- Toujours lire ce fichier avant modification
- Toujours lire `PROJECT_AUDIT.md`
- Toujours lire `docs/HANDOFF.md`
- Toujours analyser avant de modifier
- Toujours proposer un plan avant implémentation
- Toujours lister les fichiers modifiés
- Toujours expliquer les impacts
- Toujours vérifier TypeScript

---

## Coordination multi-agents

- Claude et Codex peuvent tous les deux coder et push
- Toujours récupérer l’état le plus récent avant de coder
- Ne jamais supposer que le contexte chat est à jour
- Le code et les fichiers du repo font autorité
- Toute modification importante doit être documentée

---

## Workflow Git

- Travailler sur une branche à jour
- Commits petits et clairs
- Éviter push direct sur main
- Toujours garder le repo stable

---

## Zones critiques (ne pas casser)

- Auth Supabase
- Stripe checkout
- `/rapport/succes`
- Tables `rapports`, `surveillances`
- Cron surveillance

---

## Règles UI

- Mobile first
- Breakpoint 768px
- Français uniquement
- Lucide React uniquement
- Aucun emoji
- Styles inline

---

## Code

- TypeScript strict
- Composants simples
- Pas de refactor massif sans demande
- Gérer loading / error

---

## Supabase

- Pas de service role côté client
- Migrations SQL obligatoires
- Respect RLS

---

## Stripe

- Toujours vérifier paiement côté serveur
- Ne pas modifier les prix sans validation

---

## Méthode de travail

1. Analyse
2. Plan
3. Implémentation
4. Vérification
5. Mise à jour docs si nécessaire
6. Récapitulatif

---

## Format attendu

- Fichiers modifiés
- Impacts
- Risques
