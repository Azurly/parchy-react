# Parchy

**L'atelier d'écriture de roman, de l'idée au manuscrit.**

Parchy guide les auteurs francophones pas à pas dans la conception de leur roman (méthode Snowflake, structure en 3 actes, voyage du héros), centralise leur univers, leurs personnages et leur plan, et relie le tout au manuscrit. Une IA de relecture signale les incohérences — chronologie, personnages, faits contradictoires — sans jamais écrire à la place de l'auteur.

> Projet développé par **Amélie FLORENT** et **Nathan HEMERY**.

---

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Architecture](#architecture)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Commandes utiles](#commandes-utiles)
- [Tests et qualité](#tests-et-qualité)
- [Structure du dépôt](#structure-du-dépôt)
- [Documentation](#documentation)
- [Conventions de contribution](#conventions-de-contribution)
- [Auteurs](#auteurs)
- [Licence](#licence)

---

## Fonctionnalités

| Module | Ce que fait Parchy |
| --- | --- |
| Conception guidée | Suivre une méthode d'écriture étape par étape, avec consignes et exemples |
| Univers | Fiches personnages, lieux, objets, groupes ; relations entre entités ; chronologie |
| Plan | Parties, chapitres et scènes organisés par glisser-déposer |
| Manuscrit | Éditeur riche, sauvegarde automatique, mode hors ligne, historique des versions |
| Suivi | Objectifs de mots, statistiques d'écriture, défis |
| IA de cohérence | Analyse du manuscrit et alertes reliées aux passages concernés |
| Exports | DOCX au format manuscrit normé, PDF, EPUB |
| Partage | Bible d'univers ou fiche partagée en lecture seule par lien |
| Outils gratuits | Générateur de noms, modèle de fiche personnage, calculateur de longueur |
| Abonnement | Formules Gratuit et Premium, paiement via Stripe |

## Stack technique

| Couche | Technologie |
| --- | --- |
| Front-end | React, Next.js, TypeScript, TanStack Query, TipTap, Dexie (IndexedDB) |
| Back-end | PHP 8.3, Symfony 7, Doctrine ORM, Symfony Messenger, Mercure |
| Base de données | PostgreSQL 16 |
| Exports | PhpWord (DOCX), Gotenberg (PDF), génération EPUB |
| Stockage de fichiers | Flysystem + stockage S3 hébergé dans l'UE |
| Paiement | Stripe Billing |
| Outillage | Docker Compose, PHPUnit, PHPStan, Deptrac, ESLint, Vitest, Playwright, GitHub Actions |

## Architecture

Parchy est composé de deux applications dans un même dépôt :

- **`backend/`** — API REST Symfony, organisée par domaine métier (Manuscrit, Univers, Projet, Ia, Export, Abonnement, Partage, Compte). Chaque domaine suit une séparation en couches :
  - `Domain` : entités, value objects, interfaces de repository, événements métier ;
  - `Application` : cas d'utilisation (commandes et requêtes traitées via Messenger), Voters ;
  - `Infrastructure` : implémentations Doctrine, client LLM, Stripe, stockage, exporteurs ;
  - `UI/Http` : contrôleurs et DTO, sans logique métier.

  Les dépendances vont toujours vers l'intérieur (`UI` → `Application` → `Domain`) ; la règle est vérifiée par Deptrac en intégration continue.

- **`frontend/`** — Application Next.js. Les pages publiques (outils gratuits, partages) sont rendues côté serveur pour le référencement ; l'espace auteur est découpé par fonctionnalité (`features/manuscrit`, `features/univers`, `features/ia`…). L'éditeur écrit dans une file locale (`sync/`) synchronisée avec l'API, ce qui garantit le fonctionnement hors ligne.

Les traitements longs (analyses IA, exports) sont exécutés de façon asynchrone par des workers Messenger ; leur avancement est poussé au front via Mercure.

## Prérequis

- Docker et Docker Compose
- Git
- Pour un développement hors conteneur : PHP 8.3, Composer 2, Node.js 22, pnpm

## Installation

```bash
# 1. Cloner le dépôt
git clone <url-du-depot> parchy
cd parchy

# 2. Créer les fichiers d'environnement locaux
cp backend/.env backend/.env.local
cp frontend/.env.example frontend/.env.local

# 3. Démarrer les services (PostgreSQL, API, front, Mercure, Gotenberg)
docker compose up -d --build

# 4. Installer les dépendances
docker compose exec php composer install
docker compose exec node pnpm install

# 5. Créer la base et jouer les migrations
docker compose exec php bin/console doctrine:database:create --if-not-exists
docker compose exec php bin/console doctrine:migrations:migrate -n

# 6. Charger les données de démonstration (méthodes, défis, compte de test)
docker compose exec php bin/console doctrine:fixtures:load -n
```

Une fois les services démarrés :

| Service | URL locale |
| --- | --- |
| Front-end | http://localhost:3000 |
| API | http://localhost:8000/api |
| Documentation de l'API (OpenAPI) | http://localhost:8000/api/docs |
| Mercure | http://localhost:3001/.well-known/mercure |

## Configuration

Variables principales, à renseigner dans `backend/.env.local` et `frontend/.env.local` (ne jamais les committer) :

| Variable | Rôle |
| --- | --- |
| `DATABASE_URL` | Connexion PostgreSQL |
| `APP_SECRET` | Secret Symfony |
| `MESSENGER_TRANSPORT_DSN` | Transport des messages asynchrones |
| `MERCURE_URL`, `MERCURE_JWT_SECRET` | Hub Mercure |
| `LLM_API_URL`, `LLM_API_KEY` | Fournisseur d'IA pour l'analyse de cohérence |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Paiement |
| `STORAGE_S3_*` | Stockage des exports et des images |
| `GOTENBERG_URL` | Génération des PDF |
| `VITE_API_URL` | URL de l'API Symfony (par défaut : `http://localhost:8000/api`) |

## Image Docker

Depuis le dossier `parchy-react` :

```bash
docker build --build-arg VITE_API_URL=http://localhost:8000/api -t parchy-react .
docker run --rm -p 3000:80 parchy-react
```

L'application est ensuite disponible sur http://localhost:3000. `VITE_API_URL` est intégrée au bundle lors de la construction de l'image ; en production, indiquez l'URL publique de l'API. L'authentification utilise `POST /connexion`, conformément au [contrat API](docs/API-CONTRAT.md).

## Commandes utiles

```bash
# Lancer les workers asynchrones (analyses IA, exports, webhooks)
docker compose exec php bin/console messenger:consume async -vv

# Créer une migration après modification des entités
docker compose exec php bin/console make:migration

# Générer les types TypeScript depuis l'OpenAPI de l'API
docker compose exec node pnpm generate:api

# Écouter les webhooks Stripe en local
stripe listen --forward-to localhost:8000/api/webhooks/stripe
```

## Tests et qualité

```bash
# Back-end
docker compose exec php vendor/bin/phpunit
docker compose exec php vendor/bin/phpstan analyse
docker compose exec php vendor/bin/deptrac analyse

# Front-end
docker compose exec node pnpm lint
docker compose exec node pnpm test
docker compose exec node pnpm test:e2e
```

La CI (GitHub Actions) exécute l'ensemble de ces contrôles à chaque pull request ; une PR ne peut être fusionnée que si tout est au vert.

## Structure du dépôt

```
parchy/
├── backend/
│   ├── config/
│   ├── migrations/
│   ├── src/
│   │   ├── Abonnement/
│   │   ├── Compte/
│   │   ├── Export/
│   │   ├── Ia/
│   │   ├── Manuscrit/
│   │   │   ├── Domain/
│   │   │   ├── Application/
│   │   │   ├── Infrastructure/
│   │   │   └── UI/Http/
│   │   ├── Partage/
│   │   ├── Projet/
│   │   ├── Univers/
│   │   └── Shared/
│   ├── tests/
│   └── deptrac.yaml
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── features/
│   │   ├── sync/
│   │   ├── shared/
│   │   └── lib/
│   └── tests/
├── docs/
│   ├── cas_utilisation.puml
│   ├── modele_logique_donnees.puml
│   └── cahier_des_charges.md
├── compose.yaml
├── LICENSE
└── README.md
```

## Documentation

Le dossier `docs/` contient le cahier des charges, le diagramme de cas d'utilisation et le modèle logique de données (PlantUML). Pour générer les images :

```bash
plantuml -tpng docs/*.puml
```

## Conventions de contribution

- Branches : `feature/<sujet>`, `fix/<sujet>`, `chore/<sujet>` à partir de `main`.
- Commits au format [Conventional Commits](https://www.conventionalcommits.org/fr/) : `feat(manuscrit): sauvegarde hors ligne des scènes`.
- Toute modification passe par une pull request relue par l'autre développeur.
- Pas de logique métier dans les contrôleurs ni dans les composants React : elle vit dans `Application`/`Domain` côté back et dans les hooks de `features/` côté front.

## Auteurs

- **Amélie FLORENT**
- **Nathan HEMERY**

## Licence

Copyright © 2026 Amélie FLORENT et Nathan HEMERY. Tous droits réservés.

Parchy est un logiciel propriétaire. Toute reproduction, modification ou distribution sans autorisation écrite des auteurs est interdite. Voir le fichier [LICENSE](LICENSE).
