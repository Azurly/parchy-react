# Parchy, front (React + Vite + TypeScript)

## Contexte
Application d'atelier d'écriture de roman. L'API est le dépôt parchy-backend (Symfony / API Platform).

## Sources de vérité
- `openapi/openapi.json` : contrat de l'API (endpoints, paramètres, schémas).
- `src/shared/api/schema.d.ts` : types générés (`npm run api:types`). Ne pas les modifier à la main.
- `docs/API-CONTRAT.md` : règles hors OpenAPI (auth, conflits de version, polling).

## Architecture
- `src/features/<domaine>/` : components, hooks, `api.ts` (TanStack Query).
- `src/sync/` : file d'attente IndexedDB (Dexie) pour la sauvegarde hors ligne.
- Règle : un composant n'appelle jamais `fetch` ; il passe par un hook de sa feature, qui passe par `api.ts` ou `sync/`. L'éditeur n'écrit que dans `sync/`.

## Configuration
- `VITE_API_URL` dans `.env` (jamais de secret dans une variable `VITE_`).

## Commandes
- `npm run dev`, `npm run build`, `npm run api:types`.

## Conventions
- Réponses en français pour les textes affichés ; code et identifiants selon l'existant.
- IA désactivée en v1 : aucun écran pour les analyses ni les alertes.