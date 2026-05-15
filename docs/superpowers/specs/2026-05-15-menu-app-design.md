# Menu App — Design

**Date :** 2026-05-15
**Statut :** Validé pour passage en plan d'implémentation
**Source de départ :** `menu-semaine.html` (page statique unique, semaine méditerranéenne fixe)

---

## 1. Objectif

Transformer le `menu-semaine.html` actuel (un menu hebdomadaire fixe, hardcodé en HTML) en une **mini app web installable sur iPhone** qui permet de :

1. Choisir parmi ~10 menus thématiques pré-composés.
2. Personnaliser sa semaine (swap de recettes), avec scaling au nombre de personnes.
3. Générer automatiquement la liste de courses agrégée par rayon, cochable et persistante.
4. Consulter une bibliothèque de ~60-80 recettes détaillées.
5. Tout fonctionner hors-ligne (PWA basique) — utile au supermarché.

**Audience :** usage personnel, 1 utilisateur principal, pour des repas de 1 à 6 personnes.

**Non-objectifs :**
- Pas de backend, pas de compte utilisateur, pas de sync multi-appareils.
- Pas d'app native (React Native / Capacitor).
- Pas d'IA / génération de recettes.

---

## 2. Architecture technique

**Stack :** HTML + CSS + JavaScript vanilla. Aucun framework. Aucun build step obligatoire (un script de bundling minimal optionnel pour le service worker).

**Fichiers livrés :**

```
/
├── index.html              # App shell, structure des onglets, modals
├── app.js                  # Logique : routing, state, scaling, swap, render
├── styles.css              # Design system iOS + thème terracotta optionnel
├── manifest.json           # PWA manifest (nom, icône, couleurs, standalone)
├── sw.js                   # Service worker : cache-first des assets
├── icons/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── apple-touch-icon.png
└── data/
    ├── recipes.json        # ~60-80 recettes structurées
    ├── menus.json          # ~10 menus hebdomadaires pré-composés
    └── seasonality.json    # Calendrier de saisonnalité (par mois)
```

**Déploiement :** drag&drop sur Netlify (ou GitHub Pages). Aucun build serveur. L'utilisateur ouvre l'URL sur iPhone Safari → "Ajouter à l'écran d'accueil" → l'app se lance en mode standalone.

**Stockage :** `localStorage` uniquement, namespace `food:v1`. Estimé < 50 KB par utilisateur. Aucune base de données.

---

## 3. Modèle de données

### 3.1 Recipe

```js
{
  id: "pates-crevettes-ail",                    // slug stable
  title: "Pâtes aux crevettes, ail & tomates cerises",
  slot: "dinner",                                // "lunch" | "dinner" | "both"
  timeMin: 15,
  description: "...",
  tags: ["italien", "poisson", "une-poele"],
  constraints: ["sans-lactose"],                 // tags de contrainte respectés
  basePeople: 4,                                 // toujours stocké pour 4 pers.
  ingredients: [
    {
      qty: 400,
      unit: "g",                                 // "g" | "ml" | "cl" | "cs" | "cc" | "botte" | "boite" | null (pièces)
      name: "linguine",
      category: "epicerie",                      // catégorie de rayon (cf. §3.3)
      scalable: true,
      substitutes: ["spaghetti", "tagliatelle"]  // optionnel
    },
    { qty: null, unit: null, name: "huile d'olive", category: "epices", scalable: false }
  ],
  steps: ["Lancer l'eau...", "Chauffer l'huile..."],
  seasons: ["printemps", "ete"]                  // optionnel ; absent = toute l'année
}
```

### 3.2 Menu

```js
{
  id: "mediterraneen-printemps",
  name: "Méditerranéen",
  theme: "Sud, soleil, huile d'olive",
  defaultConstraints: ["sans-lactose"],
  seasons: ["printemps", "ete"],
  days: [
    { day: "Lundi",    lunch: "salade-pois-chiches", dinner: "pates-crevettes-ail" },
    { day: "Mardi",    lunch: "wrap-thon",            dinner: "poulet-citron-origan" },
    { day: "Mercredi", lunch: "bowl-quinoa-lentilles", dinner: "cabillaud-cap-olives" },
    { day: "Jeudi",    lunch: "salade-nicoise",        dinner: "omelette-courgettes" },
    { day: "Vendredi", lunch: "pita-falafels",         dinner: "saumon-papillote" },
    { day: "Samedi",   lunch: "pizza-fine",            dinner: "souvlaki-poulet" },
    { day: "Dimanche", lunch: "tajine-poulet",         dinner: "minestrone" }
  ]
}
```

### 3.3 Catégories de rayon (constantes)

Ordre par défaut, modifiable par l'utilisateur via drag&drop persistant :

1. `fruits-legumes`
2. `viandes-poissons`
3. `pains-pates`
4. `frais` (œufs, yaourts, alternatives sans lactose)
5. `epicerie` (féculents, légumineuses, conserves, condiments en bocal)
6. `epices` (sel, poivre, herbes sèches, huiles)
7. `en-cas` (fruits, oléagineux, petit-déj)

### 3.4 Saisonnalité

```js
// data/seasonality.json
{
  "tomate": ["juin", "juillet", "aout", "septembre"],
  "courgette": ["mai", "juin", "juillet", "aout", "septembre"],
  ...
}
```

Utilisée pour afficher un badge `🌱` sur les ingrédients de saison dans la recette et pour mettre en avant les menus saisonniers dans le wizard.

---

## 4. État & persistance

Un seul objet stocké dans `localStorage` sous la clé `food:v1` :

```js
{
  schemaVersion: 1,
  activeWeek: {
    startedAt: "2026-05-15",
    menuId: "mediterraneen-printemps",   // null si composition libre
    days: [
      {
        day: "Lundi",
        lunch:  { recipeId: "salade-pois-chiches", peopleOverride: null, cooked: false },
        dinner: { recipeId: "pates-crevettes-ail",  peopleOverride: null, cooked: false }
      },
      ...
    ],
    peopleGlobal: 4,
    notes: { "pates-crevettes-ail": "70g par perso suffit" }
  },
  shoppingList: {
    checked: { "fruits-legumes:tomates-cerises:g": true, ... },
    inStock: { "epices:huile-olive:null": true, ... }       // §6.6
  },
  preferences: {
    theme: "ios",                          // "ios" | "terracotta"
    defaultPeople: 4,
    aisleOrder: ["fruits-legumes", "viandes-poissons", ...],
    favorites: ["pates-crevettes-ail", "tajine-poulet", ...]
  },
  history: [
    /* archive des semaines passées, max 10, FIFO */
    { startedAt: "2026-05-08", menuId: "asiatique", days: [...], peopleGlobal: 4 }
  ]
}
```

**Règles d'écriture :**
- Chaque mutation écrit immédiatement dans `localStorage` (pas de bouton "sauver").
- Démarrer une nouvelle semaine → `activeWeek` actuelle archivée dans `history` (FIFO max 10), nouvelle construite.
- La liste de courses **n'est pas stockée** — elle est dérivée de `activeWeek` à chaque rendu. Seul `checked` et `inStock` sont persistés.
- Clés stables pour `checked` / `inStock` : `"{category}:{slug(name)}:{unit ?? 'piece'}"` — survivent aux swaps si le même ingrédient revient.

---

## 5. Écrans & flows

### 5.1 Navigation

**Tab bar fixe en bas** (mobile, style iOS) avec 3 onglets :

1. **🍽 Semaine** *(défaut)*
2. **🛒 Courses**
3. **📖 Recettes**

Sur desktop (≥768px), la tab bar passe en haut, sous un header simple.

### 5.2 Onglet Semaine

**Si aucune `activeWeek`** : écran vide avec un gros bouton centré "Démarrer ma semaine".

**Sinon** :
- Header sticky : nom du menu actif + curseur 🍽 personnes (1-12).
- Vue 7 jours en cartes verticales (mobile) ou grille (desktop).
- Chaque case (jour × midi/soir) montre le titre de la recette + temps + tags compacts.
- Tap sur une recette → ouvre la **Vue Recette** (sheet modal slidant depuis le bas).
- Tap long ou icône `•••` → ouvre le **modal de Swap**.
- Checkmark "✓" sur les recettes marquées faites (tap sur ✓ depuis la vue recette).

### 5.3 Vue Recette (modal sheet)

- Titre + temps + tags + description.
- **Ingrédients** scalés selon `peopleOverride ?? peopleGlobal`.
- **Étapes** numérotées. Chaque mention de durée (regex `\d+\s*min`) devient un lien vers le timer (§6.7).
- **Notes perso** : champ texte libre éditable, persiste sur `notes[recipeId]`.
- **Étoile favori** en haut à droite.
- **Override personnes** : icône `•••` → mini-curseur "Faire pour X personnes" (override local à cette recette).
- Bouton "Marquer comme faite" → toggle `cooked: true`.

### 5.4 Modal de Swap

- Titre : "Remplacer [nom recette] · [Mardi soir]".
- **Filtre par défaut** : recettes du même `slot` + respectant les `defaultConstraints` du menu actif. Favoris en premier.
- Bouton "Voir tout le catalogue" → désactive le filtre.
- Bouton "🎲 Surprends-moi" → pioche au hasard parmi le filtré.
- Liste verticale, scroll, tap → swap immédiat + ferme le modal + met à jour la liste de courses.

### 5.5 Onglet Courses

- Header : "X articles · Y catégories", bouton "Mode supermarché" 🔍, bouton "Tout décocher".
- Catégories en sections collapsibles, dans l'ordre `preferences.aisleOrder`.
- Drag handle sur chaque header de catégorie → drag&drop pour réordonner (persiste).
- Items : case à cocher + nom + quantité agrégée. Long-press → menu contextuel ("Déjà en stock" / "Annuler").
- Items "in stock" sont masqués par défaut (toggle "Afficher tout" pour les voir grisés).

**Mode supermarché** : bascule vers une vue plein écran à fond sombre, typo grande (24-28px), contraste max, scroll vertical fluide. Toujours cochable. Bouton sortie en haut.

### 5.6 Onglet Recettes

- Barre de recherche en haut (filtre titre + ingrédients).
- Filtres : Slot (Midi / Soir), Temps (≤15, ≤20, ≤30, +), Tag (poisson, végé, italien…), Saison.
- Toggle "Favoris uniquement".
- Grille de cards (1 col mobile, 2-3 desktop). Tap → Vue Recette.

### 5.7 Wizard "Démarrer ma semaine"

Modal plein écran, 3 étapes, swipe-able (style iOS) :

1. **Point de départ** : grille de cards de menus thématiques (avec badge saison si pertinent), bouton "Composer librement", bouton "🎲 Surprends-moi" (menu au hasard).
2. **Personnalise** : vue identique à l'onglet Semaine, mais en mode édition. Tap → swap. Curseur personnes en haut.
3. **Valide** : récap (nb recettes, nb articles dans la liste, total estimé de temps de cuisine), bouton "C'est parti" → sauvegarde, archive l'ancienne semaine, bascule sur l'onglet Semaine.

---

## 6. Logique de scaling

### 6.1 Formule

```
peopleEffective = peopleOverride ?? peopleGlobal
factor          = peopleEffective / recipe.basePeople

if ingredient.scalable:
    scaledQty = smartRound(ingredient.qty * factor, ingredient.unit)
else:
    scaledQty = ingredient.qty   // affichée telle quelle ("1 botte de basilic")
```

### 6.2 Arrondi intelligent

- `unit` ∈ poids/volume (`g`, `ml`, `cl`) : arrondi à 1 décimale, puis au pas le plus naturel (5 g, 10 g, 50 g selon la magnitude).
  - 100 × 1.25 = 125 g → 125 g
  - 400 × 1.5 = 600 g → 600 g
  - 100 × 1.33 = 133 g → 130 g
- `unit` ∈ unités discrètes (`null`, `botte`, `boite`, `gousse`, `oeuf`) : arrondi à l'entier supérieur (`Math.ceil`).
  - 4 gousses × 1.25 = 5 (pas 5.0)
  - 1 oignon × 1.5 = 2
- `unit` ∈ cuillères (`cs`, `cc`) : arrondi au demi le plus proche.

### 6.3 Liste de courses — agrégation

Pour chaque recette du `activeWeek` :
1. Calculer `peopleEffective` pour cette recette (override > global).
2. Émettre tous les ingrédients scalés.
3. Agréger par clé `(name, unit)` : addition des `qty` si scalable, fusion sans addition si non-scalable.
4. Grouper par `category`.
5. Trier les catégories selon `preferences.aisleOrder`.
6. Filtrer : exclure `inStock[clé] === true`.

---

## 7. Fonctionnalités MVP — détail

### 7.1 Mode supermarché (A)

Toggle dans l'onglet Courses. Active une classe `.shopping-mode` sur `<body>` qui :
- Force le thème sombre (fond noir, texte blanc).
- Augmente la typo des items à 24px, des catégories à 32px.
- Augmente la zone de tap des cases à cocher.
- Masque tab bar et headers décoratifs.
- Wake lock screen via `navigator.wakeLock` si l'API est dispo.

### 7.2 Réordonner les rayons (B)

Drag&drop natif HTML5 sur les headers de catégorie dans l'onglet Courses. Mise à jour immédiate de `preferences.aisleOrder`.

### 7.3 Notes perso par recette (C)

Champ `<textarea>` au bas de la Vue Recette, debounced sur `input`, écrit dans `activeWeek.notes[recipeId]`. Aussi visible dans la bibliothèque (icône 📝 si une note existe).

### 7.4 Favoris (D)

Étoile en haut à droite de la Vue Recette. Toggle dans `preferences.favorites`. Filtre dédié dans la bibliothèque et tri prioritaire dans le modal de Swap.

### 7.5 Partage natif (E)

Bouton "Partager la liste" dans l'onglet Courses qui appelle `navigator.share({ title, text })` avec la liste rendue en texte structuré. Fallback : copie dans le presse-papier + toast "Copié".

Format texte :
```
Liste de courses · Semaine du 15 mai · 4 personnes

🥬 Fruits & légumes
- Tomates cerises 800 g
- Concombres ×3
...
```

### 7.6 "Déjà en stock" (F)

Long-press sur un item de la liste → action sheet "Déjà à la maison" / "Annuler". Toggle `inStock[key]`. L'item disparaît de la liste mais reste dans la recette.

Reset global : bouton "Réinitialiser le stock" dans les préférences.

### 7.7 Timer intégré (G)

Détection regex `\b(\d+)\s*(min|minutes|h)\b` dans les `steps`. Wrap dans un `<button class="timer-trigger" data-min="X">`. Tap → instancie un timer dans une bannière sticky en bas (au-dessus de la tab bar). Plusieurs timers en parallèle (empilés). Notification sonore + vibration à expiration. Le timer survit aux changements d'onglet (state global en mémoire).

### 7.8 Substitutions (I)

Tap sur un ingrédient dans la Vue Recette → si `substitutes` non vide, ouvre une mini-popup "Remplacer par : [option1] [option2]". Le swap est local à cette recette dans cette semaine (stocké dans `activeWeek.days[i].lunch.substitutes[ingredientName] = "spaghetti"`). Met à jour le rendu et la liste de courses.

### 7.9 Saisonnalité (J)

À chaque ingrédient, si son nom matche une entrée de `seasonality.json` et que le mois courant est dans ses saisons, afficher un badge `🌱`. Pas de filtrage, c'est purement informatif.

Sur les cards de menus dans le wizard, badge "🌱 Saison" si le menu a un tag de saison correspondant au mois courant.

### 7.10 Historique (L)

Onglet caché accessible via un bouton "Historique" dans les préférences (ou swipe-down depuis le header de Semaine — à valider). Liste les 10 dernières semaines (date + nom du menu + nb de recettes). Tap sur une semaine → "Relancer cette semaine ?" → la copie en `activeWeek`.

---

## 8. Hors-scope (pour plus tard)

Volontairement exclus du MVP :

- **H. Frais à manger en premier** — ordre suggéré des jours selon la périssabilité.
- **K. Plan d'attaque batch cooking** — vue temporelle de l'ordre de cuisson.
- **M. Toggles globaux de contraintes** — sans gluten, végé, etc., qui filtrent partout.
- **N. Ajouter ma propre recette** — formulaire utilisateur.

Ces fonctionnalités peuvent être ajoutées sans casser le modèle de données ci-dessus.

---

## 9. Design system

### 9.1 Thème par défaut : iOS minimaliste

- **Typographie** : `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", system-ui, sans-serif`. Tailles : 13 / 15 / 17 / 22 / 28 / 34.
- **Palette** :
  - Fond : `#f2f2f7` (gray-6 iOS), surface : `#ffffff`.
  - Texte : `#000000` / `#3c3c43` / `#8e8e93`.
  - Accent : `#ff9500` (orange iOS) — chaleur cuisine, distinct du bleu trop générique.
  - Séparateurs : `rgba(60,60,67,0.12)`.
- **Coins** : 12px sur les cards, 16px sur les modals, 8px sur les boutons.
- **Ombres** : très douces, `0 1px 2px rgba(0,0,0,0.04)`.
- **Espaces** : grille de 4px (4, 8, 12, 16, 24, 32, 48).
- **Tab bar** : fond `rgba(248,248,250,0.9)` avec `backdrop-filter: blur(20px)`, séparateur fin en haut.
- **Animations** : transitions courtes (150-200ms), `cubic-bezier(0.4, 0.0, 0.2, 1)`.

### 9.2 Thème alternatif : Terracotta luxe

Le style actuel du `menu-semaine.html` est conservé tel quel (Fraunces / DM Sans / DM Mono, palette terracotta/olive/gold, grain texture). Activable via un toggle dans les préférences. Toutes les classes thématisables utilisent des CSS variables.

### 9.3 Mobile-first

Le CSS est structuré mobile-first :
- Base : layout 1 colonne, tab bar en bas, sheets plein écran.
- Breakpoint `min-width: 768px` : grille 2-3 colonnes pour les listes, modals centrés (max 600px), tab bar en haut.

---

## 10. PWA

### manifest.json

```json
{
  "name": "Menu Hebdo",
  "short_name": "Menu",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f2f2f7",
  "theme_color": "#ff9500",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### sw.js

Service worker minimal :
- Au `install` : cache tous les assets statiques (`index.html`, `app.js`, `styles.css`, `data/*.json`, icônes).
- Au `fetch` : stratégie **cache-first**, fallback réseau, mise à jour du cache en arrière-plan (stale-while-revalidate).
- Versionning du cache via une constante `CACHE_VERSION = 'v1'`.

Pas de push notifications, pas de background sync, pas de Periodic Background Sync.

---

## 11. Contenu (recettes & menus)

### 11.1 Volumétrie cible

- **Recettes** : 60-80 entrées dans `recipes.json`, structurées comme §3.1.
- **Menus** : ~10 menus thématiques dans `menus.json` :
  - Méditerranéen
  - Asiatique express
  - Hiver réconfort
  - Été frais
  - Batch cooking dimanche
  - Végétarien complet
  - Sans lactose
  - Express ≤ 20 min
  - Familial enfants
  - Découverte (fusion / nouveautés)

### 11.2 Sourcing

Recettes rédigées à partir de classiques méditerranéens, asiatiques, français du quotidien — pas de copie de sources copyright. Format identique aux 8 recettes existantes du `menu-semaine.html` (descriptions courtes, étapes numérotées, ingrédients structurés).

Les 8 recettes du fichier actuel sont **migrées telles quelles** dans `recipes.json`, juste reformatées au schéma §3.1.

### 11.3 Génération du contenu

Le contenu (recettes + menus) sera produit lors de l'implémentation, en passes thématiques (par menu). Pas de contenu external/API.

---

## 12. Critères d'acceptation MVP

L'app est livrable quand :

- [ ] Les 3 onglets fonctionnent et persistent leur état.
- [ ] Le wizard "Démarrer ma semaine" couvre les 3 étapes.
- [ ] Au moins 60 recettes structurées dans `recipes.json`, au moins 8 menus dans `menus.json`.
- [ ] Le scaling fonctionne sur recettes et liste de courses, avec arrondi intelligent.
- [ ] Le swap (filtré + tout + 🎲) fonctionne et met à jour la liste.
- [ ] La liste de courses agrège correctement, supporte coches, drag&drop des rayons, mode supermarché, "déjà en stock", partage natif.
- [ ] Les fonctionnalités A, B, C, D, E, F, G, I, J, L sont implémentées.
- [ ] L'app fonctionne hors-ligne après premier chargement (PWA, service worker).
- [ ] Installation à l'écran d'accueil iPhone fonctionne avec icône et splash propres.
- [ ] Pas de console errors en navigation normale.
- [ ] Lighthouse PWA : score ≥ 90.

---

## 13. Risques & décisions ouvertes

- **Édition manuelle des JSON** : 60-80 recettes en JSON brut sont relativement pénibles à maintenir à la main. Décision MVP : on accepte. Si la maintenance devient un problème, on pourra ajouter un petit éditeur in-app (= panier 🥉, fonctionnalité N, hors MVP).
- **Wake lock en mode supermarché** : l'API `navigator.wakeLock` n'est pas garantie sur toutes les versions iOS Safari. Fallback : pas de wake lock, l'écran s'éteindra normalement. Acceptable pour le MVP.
- **Détection des durées dans les étapes (timer)** : la regex `\d+\s*min` est naïve mais suffisante pour les recettes rédigées dans le format actuel. À surveiller.
- **Pas de git initialisé** : le dossier `/Users/nathan/Public/food/` n'est pas un repo git. À décider avant l'implémentation : `git init` + repo GitHub, ou rester en local ?
