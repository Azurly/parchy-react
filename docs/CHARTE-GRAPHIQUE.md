# Charte graphique Parchy

Référence pour concevoir la landing page (et toute page publique) dans la continuité de l'application.
Valeurs relevées dans le code du front (`src/App.css`, `src/features/auth/components/auth-screen.css`, `src/index.css`) en novembre 2026.

---

## 1. Identité

**Parchy, l'atelier d'écriture de roman, de l'idée au manuscrit.**

Parchy accompagne les auteurs francophones pas à pas : méthode d'écriture guidée, univers et personnages centralisés, plan relié au manuscrit, sauvegarde automatique et hors ligne.

L'ambiance visuelle est celle d'un **carnet d'écrivain** : papier clair, vert sauge apaisant, touches de couleurs chaudes (cuivre, sable). Elle reste calme, littéraire et sans surcharge : l'auteur doit avoir envie de s'asseoir pour écrire.

| Mots-clés | À éviter |
| --- | --- |
| calme, artisanal, littéraire, bienveillant, sobre | criard, « tech », gamifié à l'excès, néon, dégradés vifs |

## 2. Ton et rédaction

- On vouvoie l'auteur, sur un ton chaleureux et encourageant, jamais infantilisant.
- Phrases courtes, verbes d'action. Exemples tirés de l'application :
  - « Votre atelier d'écriture »
  - « Écrivez votre histoire, un passage après l'autre. »
  - « Votre espace d'écriture, à votre rythme. »
  - « Heureux de vous revoir »
- Typographie française : espace insécable avant `: ; ! ?`, guillemets « », apostrophe typographique ’, points de suspension …
- **Ne pas promettre l'IA de relecture** : elle est désactivée en v1. Pas de mention « IA », « relecture automatique » ou « détection d'incohérences » sur la landing tant qu'elle n'est pas disponible.
- Fonctionnalités v1 que l'on peut mettre en avant : conception guidée (méthodes d'écriture), univers et personnages, plan en chapitres et scènes, éditeur avec sauvegarde automatique et hors ligne, historique des versions, objectifs de mots.

## 3. Logo

Le logo est composé d'un pictogramme et d'un logotype.

- **Pictogramme** : icône « livre ouvert » (`BookOpen` de Lucide), blanche, dans un carré arrondi vert.
  - Carré : `28 × 28 px`, rayon `8 px`, fond `#557d69` ; icône `19 px`, trait `2.2`.
- **Logotype** : `parchy.` en minuscules.
  - Police Inter, graisse `720`, `23 px`, interlettrage `-0.8 px`, couleur encre `#26332f`.
  - Le point final est en vert clair `#76a086` : c'est la signature de la marque, à toujours conserver.
- Espacement entre pictogramme et logotype : environ `8 px`.
- En petit format (favicon, barre latérale repliée) : pictogramme seul (`public/favicon.svg`).

À ne pas faire : majuscule à « Parchy » dans le logotype, retirer ou recolorer le point, placer le logo sur un fond vert moyen (le point disparaît).

Dans le texte courant, le nom s'écrit **Parchy** (majuscule initiale).

## 4. Couleurs

### Couleurs de marque (variables déjà définies dans `src/App.css`)

| Rôle | Variable | Valeur | Usage |
| --- | --- | --- | --- |
| Encre | `--ink` | `#26332f` | Titres, texte principal |
| Vert Parchy | `--green` | `#517b68` | Marque, liens forts, éléments actifs |
| Vert foncé | `--green-dark` | `#3e6654` | Survol des boutons verts |
| Texte secondaire | `--muted` | `#818984` | Sous-titres, légendes (voir contraste) |
| Filet | `--line` | `#e9ece8` | Bordures des cartes, séparateurs |
| Papier | `--paper` | `#ffffff` | Fond des cartes |
| Fond de page | — | `#f7f8f6` | Fond général, légèrement verdi |

### Nuances complémentaires

| Rôle | Valeur |
| --- | --- |
| Bouton principal | `#4d765f` (survol `#3f6651`) |
| Vert clair (point du logo, puces) | `#76a086`, `#78a187` |
| Fond vert pâle (icônes, sélection) | `#edf4ee`, `#edf3ec` |
| Couverture de livre, vert | `#456a5b`, texte `#f3ecdb`, filets `#d8c69b` |
| Couverture de livre, cuivre | `#9c745d`, texte `#f0dfc7` |
| Corps de texte long (éditeur) | `#4a514b` |

### Accents (catégories, illustrations, badges)

Toujours en paire « texte + fond pâle », jamais en aplat vif.

| Accent | Texte | Fond |
| --- | --- | --- |
| Sauge | `#55735d` | `#eaf1e9` |
| Cuivre / sable | `#ad7d56` | `#f7f0e9` |
| Ambre | `#b0804b` | `#faf3e9` |
| Rose poudré | `#a56f69` | `#f7eeec` |
| Bleu ardoise | `#687c99` | `#edf0f7` |

### États

| État | Texte | Fond | Bordure |
| --- | --- | --- | --- |
| Erreur | `#9c3d38` | `#fff3f1` | `#f1d4d0` |
| Succès | `#54745a` | `#eff5ed` | `#e2ecdf` |

### Contraste (WCAG)

| Paire | Ratio | Verdict |
| --- | --- | --- |
| Encre `#26332f` sur blanc | 13,2 | ✅ tout usage |
| Corps `#4a514b` sur blanc | 8,2 | ✅ tout usage |
| Blanc sur bouton `#4d765f` | 5,2 | ✅ tout usage |
| Vert `#4d765f` sur blanc | 5,2 | ✅ liens, texte |
| Secondaire `#818984` sur blanc | 3,6 | ⚠️ texte ≥ 18 px uniquement |
| Gris clair `#9aa19b` sur blanc | 2,6 | ❌ décoratif uniquement |
| Vert clair `#76a086` sur blanc | 2,9 | ❌ décoratif uniquement (point du logo) |

Pour la landing, utiliser `#5f6862` (ou plus foncé) pour tout texte secondaire de petite taille.

### Point d'attention

`src/index.css` contient le thème shadcn par défaut (`--primary` magenta, `oklch(0.518 0.253 323.9)`), **qui ne correspond pas à la marque**. Il n'apparaît que dans quelques composants shadcn (menus, fenêtres). Pour la landing, utiliser uniquement les couleurs ci-dessus ; à terme, aligner `--primary` et `--accent` de `index.css` sur le vert Parchy.

## 5. Typographie

Trois familles, chacune avec un rôle précis.

| Famille | Rôle | Chargement |
| --- | --- | --- |
| **Inter Variable** | Titres, logotype, chiffres, libellés en capitales | `@fontsource-variable/inter` |
| **Noto Sans Variable** | Texte courant de l'interface | `@fontsource-variable/noto-sans` |
| **Georgia** (serif système) | Tout ce qui évoque le livre : titres de couverture, extraits de manuscrit, citations | police système |

### Échelle utilisée dans l'application

| Élément | Police | Taille | Graisse | Interlettrage |
| --- | --- | --- | --- | --- |
| H1 de page | Inter | 29 px | 590 | -0,8 px |
| Titre de fenêtre | Inter | 21 px | 650 | -0,4 px |
| Titre de carte | Inter | 14–17 px | 640–650 | -0,2 à -0,3 px |
| Grand chiffre (statistique) | Inter | 23–27 px | 620–650 | -0,7 px |
| Surtitre (eyebrow) | Inter, CAPITALES | 9 px | 700 | +0,85 px |
| Texte d'interface | Noto Sans | 10–12 px | 400–600 | — |
| Texte de manuscrit | Georgia | 15 px, interligne 1,9 | 400 | — |

L'application est dense (petites tailles). **Pour la landing, agrandir** en gardant les mêmes rapports et graisses :

| Élément landing | Suggestion |
| --- | --- |
| Titre principal (hero) | Inter 48–56 px, graisse 600, interlettrage -1,5 px, interligne 1,1 |
| Titre de section | Inter 32–36 px, graisse 600, interlettrage -0,8 px |
| Surtitre | Inter 12 px, CAPITALES, graisse 700, interlettrage +1 px, précédé d'un point vert de 6 px |
| Texte courant | Noto Sans 17–18 px, interligne 1,6, couleur `#4a514b` |
| Citation / extrait | Georgia 20–22 px, italique possible, interligne 1,6 |

## 6. Formes, espacements et ombres

- **Rayons** : 5–6 px pour les boutons et les cartes, 12 px pour les grandes cartes (écran de connexion), 50 % pour les pastilles et avatars, 3 px pour les couvertures de livre.
- **Bordures** : 1 px `#e9ece8` sur toutes les cartes.
- **Ombres**, toujours très légères et teintées de vert :
  - carte : `0 2px 7px rgba(34, 48, 39, .025)`
  - menu : `0 6px 18px rgba(25, 40, 30, .11)`
  - grande carte mise en avant : `0 18px 50px rgba(39, 57, 43, .08)`
  - fenêtre : `0 18px 60px rgba(24, 37, 28, .2)`
  - couverture de livre : `2px 3px 6px rgba(35, 54, 42, .12)`
- **Largeur de contenu** : 1230 px maximum, marges latérales d'environ 4 %.
- **Fond d'ambiance** (écran de connexion), réutilisable pour le hero :
  ```css
  background:
    radial-gradient(ellipse at 15% 15%, rgba(198, 211, 186, .36), transparent 40%),
    #f7f8f5;
  ```

## 7. Composants de référence

**Bouton principal**
```css
min-height: 37px; padding: 0 14px; gap: 8px;
color: #fff; background: #4d765f; border: 1px solid #4d765f; border-radius: 5px;
font-weight: 600;
/* survol */ background: #3f6651; transform: translateY(-1px);
```
Sur la landing, porter la hauteur à 44–48 px et le texte à 15–16 px.

**Bouton secondaire** : fond blanc, bordure `#e1e6e0`, texte `#4b544d`, survol `#f6f8f5`.

**Lien d'action** : texte vert `#688271` suivi d'une flèche `→` (icône `ArrowRight`), survol `#355b46`.

**Surtitre (eyebrow)** : point vert `#78a187` de 6 px, puis libellé en capitales Inter 700 espacé (« VOTRE ATELIER D'ÉCRITURE »).

**Carte** : fond blanc, bordure 1 px `#e9ece8`, rayon 6 px, ombre de carte, padding 21 px (40 px pour une carte mise en avant).

**Pastille d'icône** : carré arrondi de 28–32 px, fond pâle et icône de l'accent correspondant (par exemple vert `#597f69` sur `#edf4ee`).

**Couverture de livre** : motif signature de Parchy. Rectangle au format 4:5 (146 × 184 px), fond vert `#456a5b` ou cuivre `#9c745d`, titre en Georgia crème `#f3ecdb`, mentions en Inter capitales minuscules espacées, filets dorés `#d8c69b` qui dessinent une arche et des vagues. Idéal pour illustrer le hero.

## 8. Iconographie et illustrations

- Icônes : bibliothèque **Lucide** (`lucide-react`), trait 1,8 (2,2 pour le logo), tailles 14–19 px dans l'application, 20–24 px sur la landing.
- Icônes déjà associées aux fonctionnalités : `BookOpen` (marque), `FileText` (manuscrit), `Globe2` (univers), `Users` (personnages), `Compass` (plan), `Target` (objectifs), `Flame` (régularité), `History` (versions), `CloudOff` (hors ligne).
- Illustrations : formes simples au trait fin (arches, vagues, livres), dans les couleurs de la palette. Pas de photos génériques ni d'illustrations 3D.
- Captures d'écran de l'application : bienvenues, sur le fond `#f7f8f6` avec l'ombre « grande carte ».

## 9. Mode sombre

L'application n'a pas encore de mode sombre aux couleurs de la marque. Si la landing en propose un, partir de l'encre `#26332f` comme fond, du papier `#f7f8f6` comme texte et éclaircir le vert à `#76a086` pour les liens. Vérifier les contrastes avant de publier.

## 10. Récapitulatif pour l'intégration

```css
:root {
  --ink: #26332f;
  --text: #4a514b;
  --text-muted: #5f6862;       /* texte secondaire lisible (landing) */
  --line: #e9ece8;
  --paper: #ffffff;
  --page: #f7f8f6;
  --green: #517b68;
  --green-button: #4d765f;
  --green-dark: #3f6651;
  --green-light: #76a086;      /* décoratif uniquement */
  --green-pale: #edf4ee;
  --copper: #9c745d;
  --gold-line: #d8c69b;
  --cream: #f3ecdb;
  --radius: 6px;
  --shadow-card: 0 2px 7px rgba(34, 48, 39, .025);
  --shadow-hero: 0 18px 50px rgba(39, 57, 43, .08);
  --font-title: 'Inter Variable', sans-serif;
  --font-text: 'Noto Sans Variable', sans-serif;
  --font-book: Georgia, 'Times New Roman', serif;
}
```
