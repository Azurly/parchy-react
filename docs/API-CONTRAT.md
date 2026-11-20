# Contrat de l'API Parchy (règles hors OpenAPI)

Complète `openapi/openapi.json` : l'OpenAPI décrit les chemins, paramètres et schémas ; ce document décrit les règles de comportement. En cas de désaccord sur le format d'un champ, ce document fait foi (voir "Points imprécis dans l'OpenAPI").

Source : README du dépôt `parchy-backend`.

## Base

- URL de base : variable `VITE_API_URL` (par exemple `http://localhost:8000/api`).
- API sans état : chaque requête authentifiée porte `Authorization: Bearer <token>`.
- Seules `POST /api/connexion` et `POST /api/utilisateurs` sont publiques (ainsi que les méthodes de conception et la documentation).

## En-têtes de contenu

| Opération | Content-Type |
| --- | --- |
| `POST /api/connexion` | `application/json` |
| `POST` sur une ressource API Platform | `application/ld+json` |
| `PATCH` | `application/merge-patch+json` |
| `PUT /api/scenes/{id}/contenu` | `application/ld+json` (seul type déclaré dans l'OpenAPI) |

## Liens entre ressources

Les relations s'envoient sous forme d'IRI, pas d'identifiant seul : `"projet": "/api/projets/{uuid}"`.

## Pagination

Les listes renvoient `{ member[], totalItems, view.next }` avec un paramètre `?page=`. Le front doit suivre `view.next` tant qu'il existe.

## Authentification

1. Inscription : `POST /api/utilisateurs` avec `email`, `motDePasse` (8 à 4096 caractères), `nomAffichage` (100 maximum). Cela crée aussi l'abonnement gratuit.
2. Connexion : `POST /api/connexion` avec `email` et `motDePasse`, réponse `{ "token": "..." }`.
3. Appels suivants : en-tête `Authorization: Bearer <token>`.
4. `GET /api/moi` renvoie l'utilisateur courant (avec `abonnement`).

Il n'y a pas de renouvellement de jeton en v1. Durée de vie : **1 heure** (`token_ttl: 3600` dans `config/packages/lexik_jwt_authentication.yaml` du back). Sur `401`, le front supprime le jeton et renvoie vers la connexion.

Comptes de démonstration (mot de passe `motdepasse`) : `demo@parchy.test` (Premium, deux romans), `camille@parchy.test` (Gratuit), `jules@parchy.test` (Gratuit, e-mail non vérifié, un projet à la corbeille).

## Propriété des ressources et codes d'erreur

- Chaque ressource n'est visible que par son propriétaire. Une ressource d'un autre utilisateur répond `404` (pas `403`).
- `400` : requête mal formée. `403` : accès refusé. `404` : introuvable.
- `422` : validation, corps `{ detail, violations: [{ propertyPath, message }] }` (à afficher champ par champ).
- Les erreurs `400`, `403` et `404` portent `{ title, detail, description, status }` (le champ s'appelle `description`, sans préfixe `hydra:`).
- `409` : conflit de version (voir "Synchronisation") ou export pas encore terminé.
- `410` : fichier d'export expiré.
- `429` : quota atteint (utilisé surtout pour l'IA, désactivée en v1).

## Format du contenu d'une scène

`contenu` est un **objet JSON TipTap**, pas un tableau :

```json
{ "type": "doc", "content": [ { "type": "paragraph", "content": [ { "type": "text", "text": "Il pleuvait." } ] } ] }
```

Valeur d'une scène vide : `{"type":"doc","content":[]}`. Typer le champ avec `JSONContent` de TipTap. Le back stocke ce JSON tel quel : ne jamais envoyer ni afficher de HTML brut.

## Synchronisation des scènes

Chaque scène porte un numéro de `version`. Le front enregistre d'abord localement (IndexedDB), puis envoie :

```http
PUT /api/scenes/{id}/contenu
{ "contenu": { "type": "doc", "content": [] }, "version": 12 }
```

- Version identique à celle du serveur : le back enregistre, recalcule le nombre de mots et renvoie la scène avec `"version": 13`. Le front remplace sa version locale par celle de la réponse.
- Version différente : `409 Conflict`. Le front relit la scène (`GET /api/scenes/{id}`) et propose :
  - « garder celle du serveur » : il remplace sa copie locale ;
  - « garder ma version » : il renvoie son texte avec la version du serveur et `"resolutionConflit": true`. Le texte écrasé est archivé (origine `conflit`).
- Envoyer la sauvegarde automatique avec une temporisation de quelques secondes après la dernière frappe, et une seule requête à la fois par scène (attendre la réponse avant l'envoi suivant, sinon le `409` se déclenche contre soi-même).
- Les métadonnées (titre, résumé, statut, point de vue, lieu, présences) et l'emplacement (chapitre, position) se modifient par `PATCH /api/scenes/{id}`, sans verrou de version. Les positions sont renumérotées automatiquement (1 à n, sans trou).
- `GET /api/scenes` (liste) ne renvoie pas le contenu ; `GET /api/scenes/{id}` le renvoie.

## Historique des versions

- Pendant l'écriture, le texte remplacé est archivé au plus toutes les 10 minutes (origine `auto`).
- `POST /api/scenes/{id}/versions` : archive le texte courant (origine `manuelle`), sans corps.
- `GET /api/scenes/{id}/versions` : liste. `GET /api/scene_versions/{id}` : `{ numero, origine, nombreMots, contenu }`.
- `POST /api/scene_versions/{id}/restaurer` avec `{ "version": <version courante de la scène> }` : remet ce texte dans la scène et archive le texte remplacé (origine `restauration`). `409` si la version courante envoyée est périmée.

## Traitements asynchrones (exports)

```http
POST /api/exports
{ "projet": "/api/projets/{id}", "format": "docx", "options": { "chapitres": ["/api/chapitres/{id}"], "auteur": "Nom" } }
```

- `format` : `docx` ou `epub` (`pdf` refusé en v1). `options` facultatives.
- Réponse `202` avec `"statut": "en_attente"`. Interroger `GET /api/exports/{id}` toutes les quelques secondes jusqu'à `termine` ou `echoue` (le champ `erreur` explique l'échec, par exemple un manuscrit vide).
- Une fois terminé, `lienTelechargement` pointe vers `GET /api/exports/{id}/fichier` (avec le même jeton, donc à télécharger via `fetch` et un `Blob`, pas par un simple lien). Disponible 7 jours : `409` si la génération n'est pas finie, `410` après expiration.
- `GET /api/exports?projet=...` liste l'historique ; `DELETE /api/exports/{id}` supprime l'export et son fichier.

## Valeurs énumérées

- `projet.statut` : `conception`, `redaction`, `relecture`, `termine`.
- `scene.statut` : `plan`, `brouillon`, `relu`, `final`.
- `presence.role` : `present`, `mentionne`.
- `scene_version.origine` : `auto`, `manuelle`, `conflit`, `restauration`.
- `export.statut` : `en_attente`, `en_cours`, `termine`, `echoue`.

## Hors périmètre de la v1

- `/api/analyses` et `/api/alertes` (IA) : désactivés, retournent `404`. Aucun écran d'IA à afficher.
- Export PDF, notifications temps réel (le polling les remplace), collaboration entre auteurs.

## Univers

- `entite.donnees` : objet libre (âge, apparence, climat…). Le front édite les valeurs texte et nombre, et conserve les autres telles quelles.
- Supprimer une fiche supprime en cascade ses relations, ses présences dans les scènes et ses liens avec les événements.
- Relations : 422 si une fiche est reliée à elle-même, si les deux fiches ne sont pas du même projet, ou si le triplet (source, cible, type) existe déjà.
- Événements : `position` est obligatoire, ≥ 1 et **unique par projet**, et le back **ne renumérote pas**. Le front crée à la fin (position max + 1) et échange deux événements en trois PATCH (via une position libre).
- `evenement.entites` : des IRI à l'écriture, mais des objets `{ "@id": … }` à la lecture.

## Points imprécis dans l'OpenAPI

- `contenu` y est décrit comme un tableau ; c'est en réalité l'objet TipTap ci-dessus.
- Les réponses `401` et `409` ne sont pas listées sur les opérations concernées.
- Les corps `PATCH` (`…jsonMergePatch`) marquent des champs comme obligatoires (`titre`, `statut`…), alors qu'en JSON Merge Patch tout est facultatif : le front les type avec `Partial<…>`.
- `DELETE /api/projets/{id}` met le projet à la corbeille (purge définitive après 30 jours), sans que l'OpenAPI le dise. Les routes `GET /api/projets/corbeille` et `POST /api/projets/{id}/restaurer` existent dans le back (branche `develop`) mais pas dans l'OpenAPI : le front ne les utilise pas encore.
- Les routes `/api/exports` sont présentes depuis la ré-exportation de la spécification (20/11/2026, branche `develop`). `GET /api/exports/{id}/fichier` (contrôleur Symfony) reste absente de l'OpenAPI ; `lienTelechargement` est un chemin relatif (`/api/exports/{id}/fichier`).
- `export.statut` est un simple texte dans l'OpenAPI ; le front le type avec les valeurs listées plus haut.
- Le back n'expose pas `Content-Disposition` en CORS (`expose_headers: ['Link']`) : le front ne peut pas lire le nom du fichier téléchargé et le construit lui-même (`titre-du-projet-AAAA-MM-JJ.docx`). Ajouter `Content-Disposition` à `expose_headers` côté back pour utiliser son nom.
