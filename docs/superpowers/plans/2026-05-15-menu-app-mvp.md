# Menu Hebdo MVP — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construire une PWA installable (sans framework) qui transforme `menu-semaine.html` en app interactive : choix d'un menu thématique, swap de recettes, scaling au nombre de personnes, liste de courses agrégée par rayon, fonctionnement hors-ligne.

**Architecture :** HTML + CSS + JavaScript vanilla en modules ESM. Pas de build step. Données dans `data/*.json` chargées en `fetch`. État utilisateur 100% dans `localStorage`. PWA via `manifest.json` + service worker minimal. Tests unitaires sur la logique pure via `node --test`.

**Tech Stack :** HTML5, CSS3 (variables, `backdrop-filter`, flex/grid), JavaScript ESM, Service Worker API, `navigator.share`, `navigator.wakeLock`, `localStorage`. Tests : `node --test` (intégré à Node ≥18). Serveur de dev : `python3 -m http.server` ou `npx serve`.

**Spec source :** [`docs/superpowers/specs/2026-05-15-menu-app-design.md`](../specs/2026-05-15-menu-app-design.md)

---

## Aperçu des phases

| # | Phase | Tâches | Livrable |
|---|---|---|---|
| 1 | Foundation | 1-5 | Squelette projet + dev server + state module |
| 2 | Pure logic (TDD) | 6-9 | Scaling, aggregation, key gen, tous testés |
| 3 | Données initiales | 10-11 | recipes.json + menus.json + seasonality.json démarrés |
| 4 | App shell + Semaine | 12-16 | Tab bar, routing, vue Semaine basique |
| 5 | Vue Recette | 17-19 | Modal recette avec scaling + notes + favoris |
| 6 | Wizard nouvelle semaine | 20-22 | 3 étapes fonctionnelles |
| 7 | Swap modal | 23 | Remplacement de recettes |
| 8 | Courses | 24-27 | Liste agrégée + rayons + supermarché + share |
| 9 | Bibliothèque | 28-29 | Grille + recherche + filtres + favoris |
| 10 | Features additionnelles | 30-32 | Substitutions + saisonnalité + timer |
| 11 | PWA | 33-34 | Manifest + service worker + offline OK |
| 12 | Historique | 35 | Archive + relancer une semaine passée |
| 13 | Theme switcher | 36 | Bascule iOS ⇄ Terracotta |
| 14 | Contenu | 37-42 | 60+ recettes, 10 menus thématiques |
| 15 | Deploy + QA | 43-44 | Netlify + checklist acceptance |

---

## Conventions

**Commits.** Format `<type>: <description courte en français>`. Types : `feat`, `fix`, `refactor`, `test`, `chore`, `docs`, `style`, `content`.

**Structure de fichiers cible :**
```
/
├── index.html
├── app.js                   # Bootstrap, routing, render orchestration
├── styles.css               # Tous les styles
├── manifest.json
├── sw.js
├── icons/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── apple-touch-icon.png
├── data/
│   ├── recipes.json
│   ├── menus.json
│   └── seasonality.json
├── js/                      # Modules ESM
│   ├── state.js             # localStorage state
│   ├── scaling.js           # scaling + smart rounding
│   ├── shopping.js          # aggregation + derivation
│   ├── keys.js              # stable key generation
│   ├── data.js              # data loading + lookup
│   ├── views/
│   │   ├── semaine.js
│   │   ├── courses.js
│   │   ├── recettes.js
│   │   ├── recipe-modal.js
│   │   ├── wizard.js
│   │   └── swap-modal.js
│   └── ui/
│       ├── tabs.js
│       ├── timer.js
│       └── share.js
└── tests/
    ├── scaling.test.js
    ├── shopping.test.js
    ├── keys.test.js
    └── state.test.js
```

**Pourquoi cette découpe :** chaque module a une responsabilité unique. Les modules `js/` purs (scaling, shopping, keys, state) sont testés avec `node --test`. Les modules `js/views/*` font du DOM, testés manuellement. `app.js` orchestre.

---

## Phase 1 — Foundation

### Task 1: Squelette du projet

**Files:**
- Create: `index.html`
- Create: `styles.css`
- Create: `app.js`
- Create: `js/.gitkeep`
- Create: `data/.gitkeep`
- Create: `tests/.gitkeep`
- Create: `icons/.gitkeep`

- [ ] **Step 1: Créer `index.html` minimal**

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#ff9500">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <title>Menu Hebdo</title>
  <link rel="stylesheet" href="styles.css">
  <link rel="manifest" href="manifest.json">
</head>
<body>
  <main id="app">
    <div id="loading">Chargement…</div>
  </main>
  <script type="module" src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Créer `styles.css` avec variables iOS de base**

```css
:root {
  --bg: #f2f2f7;
  --surface: #ffffff;
  --text: #000000;
  --text-secondary: #3c3c43;
  --text-muted: #8e8e93;
  --separator: rgba(60, 60, 67, 0.12);
  --accent: #ff9500;
  --radius-card: 12px;
  --radius-modal: 16px;
  --radius-button: 8px;
  --shadow-card: 0 1px 2px rgba(0, 0, 0, 0.04);
  --font-system: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", system-ui, sans-serif;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

html { -webkit-text-size-adjust: 100%; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-system);
  font-size: 17px;
  line-height: 1.4;
  min-height: 100vh;
  padding-bottom: env(safe-area-inset-bottom);
}

#loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  color: var(--text-muted);
}
```

- [ ] **Step 3: Créer `app.js` placeholder**

```js
// js/app.js — bootstrap, sera étoffé tâche par tâche
console.log('Menu Hebdo — boot');

document.addEventListener('DOMContentLoaded', () => {
  const loading = document.getElementById('loading');
  if (loading) loading.textContent = 'Prêt.';
});
```

- [ ] **Step 4: Créer les dossiers vides avec .gitkeep**

```bash
mkdir -p js/views js/ui data tests icons
touch js/.gitkeep data/.gitkeep tests/.gitkeep icons/.gitkeep
```

- [ ] **Step 5: Tester le serveur de dev**

```bash
python3 -m http.server 8000 &
sleep 1
curl -s http://localhost:8000/ | head -5
```

Expected: `<!DOCTYPE html>` au début de l'output.
Stop server: `kill %1`.

- [ ] **Step 6: Commit**

```bash
git add index.html styles.css app.js js/ data/ tests/ icons/
git commit -m "feat: squelette projet (index.html + styles + bootstrap)"
```

---

### Task 2: Module de chargement des données

**Files:**
- Create: `js/data.js`

- [ ] **Step 1: Créer `js/data.js`**

```js
// js/data.js — chargement et lookup des données statiques

let _cache = null;

export async function loadData() {
  if (_cache) return _cache;
  const [recipes, menus, seasonality] = await Promise.all([
    fetch('data/recipes.json').then(r => r.json()),
    fetch('data/menus.json').then(r => r.json()),
    fetch('data/seasonality.json').then(r => r.json()).catch(() => ({}))
  ]);
  _cache = {
    recipes,
    menus,
    seasonality,
    recipesById: Object.fromEntries(recipes.map(r => [r.id, r])),
    menusById: Object.fromEntries(menus.map(m => [m.id, m]))
  };
  return _cache;
}

export function getRecipe(data, id) {
  const r = data.recipesById[id];
  if (!r) throw new Error(`Recipe not found: ${id}`);
  return r;
}

export function getMenu(data, id) {
  const m = data.menusById[id];
  if (!m) throw new Error(`Menu not found: ${id}`);
  return m;
}
```

- [ ] **Step 2: Commit**

```bash
git add js/data.js
git commit -m "feat(data): module de chargement et lookup des recettes/menus"
```

---

### Task 3: Setup test runner Node

**Files:**
- Create: `package.json`

- [ ] **Step 1: Créer `package.json` minimal**

```json
{
  "name": "menu-hebdo",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "scripts": {
    "test": "node --test tests/",
    "serve": "python3 -m http.server 8000"
  }
}
```

- [ ] **Step 2: Test smoke — créer `tests/smoke.test.js`**

```js
import { test } from 'node:test';
import assert from 'node:assert';

test('node test runner fonctionne', () => {
  assert.strictEqual(1 + 1, 2);
});
```

- [ ] **Step 3: Exécuter les tests**

Run: `npm test`
Expected: `# pass 1`

- [ ] **Step 4: Commit**

```bash
git add package.json tests/smoke.test.js
git commit -m "chore(test): setup node --test runner"
```

---

### Task 4: Module state (localStorage)

**Files:**
- Create: `js/state.js`
- Create: `tests/state.test.js`

- [ ] **Step 1: Écrire le test (TDD)**

```js
// tests/state.test.js
import { test } from 'node:test';
import assert from 'node:assert';
import { createState, defaultState } from '../js/state.js';

class MockStorage {
  constructor() { this.store = {}; }
  getItem(k) { return this.store[k] ?? null; }
  setItem(k, v) { this.store[k] = String(v); }
  removeItem(k) { delete this.store[k]; }
}

test('state: load returns defaultState quand storage vide', () => {
  const s = createState(new MockStorage());
  const loaded = s.load();
  assert.deepStrictEqual(loaded, defaultState());
});

test('state: save puis load round-trip', () => {
  const storage = new MockStorage();
  const s = createState(storage);
  const data = defaultState();
  data.preferences.defaultPeople = 6;
  s.save(data);
  const loaded = s.load();
  assert.strictEqual(loaded.preferences.defaultPeople, 6);
});

test('state: mutate { } applique et sauvegarde', () => {
  const s = createState(new MockStorage());
  s.mutate(d => { d.preferences.theme = 'terracotta'; });
  assert.strictEqual(s.load().preferences.theme, 'terracotta');
});

test('state: schemaVersion incohérent → defaultState', () => {
  const storage = new MockStorage();
  storage.setItem('food:v1', JSON.stringify({ schemaVersion: 99, foo: 'bar' }));
  const s = createState(storage);
  assert.deepStrictEqual(s.load(), defaultState());
});

test('state: archiveActiveWeek limite history à 10', () => {
  const s = createState(new MockStorage());
  for (let i = 0; i < 15; i++) {
    s.mutate(d => {
      d.activeWeek = { startedAt: `2026-01-${i+1}`, menuId: 'x', days: [], peopleGlobal: 4, notes: {} };
      d.history.push(d.activeWeek);
      while (d.history.length > 10) d.history.shift();
    });
  }
  assert.strictEqual(s.load().history.length, 10);
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm test -- tests/state.test.js`
Expected: FAIL, "Cannot find module '../js/state.js'".

- [ ] **Step 3: Implémenter `js/state.js`**

```js
// js/state.js — état applicatif persisté dans localStorage

const SCHEMA_VERSION = 1;
const STORAGE_KEY = 'food:v1';

export function defaultState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    activeWeek: null,
    shoppingList: { checked: {}, inStock: {} },
    preferences: {
      theme: 'ios',
      defaultPeople: 4,
      aisleOrder: [
        'fruits-legumes',
        'viandes-poissons',
        'pains-pates',
        'frais',
        'epicerie',
        'epices',
        'en-cas'
      ],
      favorites: []
    },
    history: []
  };
}

export function createState(storage = globalThis.localStorage) {
  function load() {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      if (parsed.schemaVersion !== SCHEMA_VERSION) return defaultState();
      return parsed;
    } catch {
      return defaultState();
    }
  }

  function save(state) {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function mutate(fn) {
    const state = load();
    fn(state);
    save(state);
    return state;
  }

  return { load, save, mutate };
}
```

- [ ] **Step 4: Lancer les tests**

Run: `npm test`
Expected: tous les tests passent.

- [ ] **Step 5: Commit**

```bash
git add js/state.js tests/state.test.js
git commit -m "feat(state): module localStorage avec mutate/load/save (testé)"
```

---

### Task 5: Helpers utilitaires (slugify, formatage)

**Files:**
- Create: `js/utils.js`
- Create: `tests/utils.test.js`

- [ ] **Step 1: Écrire les tests**

```js
// tests/utils.test.js
import { test } from 'node:test';
import assert from 'node:assert';
import { slugify, formatQty } from '../js/utils.js';

test('slugify: enleve accents et caractères spéciaux', () => {
  assert.strictEqual(slugify('Tomates cerises'), 'tomates-cerises');
  assert.strictEqual(slugify("Filet d'agneau"), 'filet-d-agneau');
  assert.strictEqual(slugify('Crème fraîche'), 'creme-fraiche');
  assert.strictEqual(slugify('  Huile  d olive  '), 'huile-d-olive');
});

test('formatQty: affichage unitaire', () => {
  assert.strictEqual(formatQty({ qty: 400, unit: 'g' }), '400 g');
  assert.strictEqual(formatQty({ qty: 2, unit: null }), '×2');
  assert.strictEqual(formatQty({ qty: 1, unit: 'botte' }), '1 botte');
  assert.strictEqual(formatQty({ qty: 2, unit: 'botte' }), '2 bottes');
  assert.strictEqual(formatQty({ qty: null, unit: null }), '');
});
```

- [ ] **Step 2: Implémenter `js/utils.js`**

```js
// js/utils.js — helpers communs

export function slugify(s) {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const PLURALS = { botte: 'bottes', boite: 'boîtes', gousse: 'gousses', oeuf: 'œufs', tranche: 'tranches' };

export function formatQty({ qty, unit }) {
  if (qty == null && unit == null) return '';
  if (unit == null) return `×${qty}`;
  if (PLURALS[unit] && qty > 1) return `${qty} ${PLURALS[unit]}`;
  return `${qty} ${unit}`;
}
```

- [ ] **Step 3: Lancer les tests**

Run: `npm test`
Expected: tous passent.

- [ ] **Step 4: Commit**

```bash
git add js/utils.js tests/utils.test.js
git commit -m "feat(utils): slugify + formatQty (testés)"
```

---

## Phase 2 — Pure logic (TDD)

### Task 6: Scaling avec arrondi intelligent

**Files:**
- Create: `js/scaling.js`
- Create: `tests/scaling.test.js`

- [ ] **Step 1: Écrire les tests**

```js
// tests/scaling.test.js
import { test } from 'node:test';
import assert from 'node:assert';
import { scaleIngredient, smartRound } from '../js/scaling.js';

test('scaleIngredient: linguine 400g de 4 à 6 personnes', () => {
  const r = scaleIngredient(
    { qty: 400, unit: 'g', name: 'linguine', scalable: true },
    4, 6
  );
  assert.strictEqual(r.qty, 600);
  assert.strictEqual(r.unit, 'g');
});

test('scaleIngredient: gousses d ail arrondi entier supérieur', () => {
  const r = scaleIngredient(
    { qty: 4, unit: null, name: 'gousses d ail', scalable: true },
    4, 5
  );
  assert.strictEqual(r.qty, 5);
});

test('scaleIngredient: 1 oignon de 4 à 6 → 2 oignons', () => {
  const r = scaleIngredient(
    { qty: 1, unit: null, name: 'oignon', scalable: true },
    4, 6
  );
  assert.strictEqual(r.qty, 2);
});

test('scaleIngredient: scalable=false renvoie tel quel', () => {
  const r = scaleIngredient(
    { qty: 1, unit: 'botte', name: 'basilic', scalable: false },
    4, 8
  );
  assert.strictEqual(r.qty, 1);
});

test('scaleIngredient: cuillères arrondi au demi', () => {
  const r = scaleIngredient(
    { qty: 2, unit: 'cs', name: 'huile', scalable: true },
    4, 5
  );
  assert.strictEqual(r.qty, 2.5);
});

test('smartRound: poids/volume par paliers', () => {
  assert.strictEqual(smartRound(133, 'g'), 130);
  assert.strictEqual(smartRound(600, 'g'), 600);
  assert.strictEqual(smartRound(125, 'g'), 125);
  assert.strictEqual(smartRound(47, 'ml'), 50);
});

test('smartRound: unités discrètes au supérieur', () => {
  assert.strictEqual(smartRound(2.5, null), 3);
  assert.strictEqual(smartRound(1.25, 'botte'), 2);
});

test('smartRound: cuillères au demi', () => {
  assert.strictEqual(smartRound(2.5, 'cs'), 2.5);
  assert.strictEqual(smartRound(2.7, 'cs'), 3);
  assert.strictEqual(smartRound(2.2, 'cc'), 2);
});
```

- [ ] **Step 2: Lancer pour vérifier l'échec**

Run: `npm test -- tests/scaling.test.js`
Expected: FAIL avec "Cannot find module".

- [ ] **Step 3: Implémenter `js/scaling.js`**

```js
// js/scaling.js — multiplication + arrondi intelligent par unité

const DISCRETE_UNITS = new Set([null, 'botte', 'boite', 'gousse', 'oeuf', 'tranche', 'pavé', 'filet']);
const SPOON_UNITS = new Set(['cs', 'cc']);

export function smartRound(qty, unit) {
  if (DISCRETE_UNITS.has(unit)) {
    return Math.ceil(qty);
  }
  if (SPOON_UNITS.has(unit)) {
    return Math.round(qty * 2) / 2;
  }
  // poids/volume : palier selon magnitude
  if (qty < 10) return Math.round(qty * 10) / 10;
  if (qty < 100) return Math.round(qty / 5) * 5;
  if (qty < 1000) return Math.round(qty / 10) * 10;
  return Math.round(qty / 50) * 50;
}

export function scaleIngredient(ing, basePeople, targetPeople) {
  if (!ing.scalable || ing.qty == null) {
    return { ...ing };
  }
  const factor = targetPeople / basePeople;
  return { ...ing, qty: smartRound(ing.qty * factor, ing.unit) };
}
```

- [ ] **Step 4: Lancer**

Run: `npm test`
Expected: tous passent.

- [ ] **Step 5: Commit**

```bash
git add js/scaling.js tests/scaling.test.js
git commit -m "feat(scaling): scaling proportionnel + arrondi intelligent (testé)"
```

---

### Task 7: Génération de clés stables

**Files:**
- Create: `js/keys.js`
- Create: `tests/keys.test.js`

- [ ] **Step 1: Tests**

```js
// tests/keys.test.js
import { test } from 'node:test';
import assert from 'node:assert';
import { ingredientKey } from '../js/keys.js';

test('ingredientKey: format {cat}:{slug-name}:{unit}', () => {
  const k = ingredientKey({ name: 'Tomates cerises', unit: 'g', category: 'fruits-legumes' });
  assert.strictEqual(k, 'fruits-legumes:tomates-cerises:g');
});

test('ingredientKey: unit null devient "piece"', () => {
  const k = ingredientKey({ name: 'Oignon', unit: null, category: 'fruits-legumes' });
  assert.strictEqual(k, 'fruits-legumes:oignon:piece');
});

test('ingredientKey: identique pour deux ingredients identiques', () => {
  const a = ingredientKey({ name: 'Linguine', unit: 'g', category: 'epicerie' });
  const b = ingredientKey({ name: 'linguine', unit: 'g', category: 'epicerie' });
  assert.strictEqual(a, b);
});
```

- [ ] **Step 2: Implémenter `js/keys.js`**

```js
// js/keys.js — clés stables pour matcher les ingrédients à travers les swaps

import { slugify } from './utils.js';

export function ingredientKey({ name, unit, category }) {
  return `${category}:${slugify(name)}:${unit ?? 'piece'}`;
}
```

- [ ] **Step 3: Lancer**

Run: `npm test`
Expected: tous passent.

- [ ] **Step 4: Commit**

```bash
git add js/keys.js tests/keys.test.js
git commit -m "feat(keys): génération de clés stables d'ingrédients"
```

---

### Task 8: Agrégation de la liste de courses

**Files:**
- Create: `js/shopping.js`
- Create: `tests/shopping.test.js`

- [ ] **Step 1: Tests**

```js
// tests/shopping.test.js
import { test } from 'node:test';
import assert from 'node:assert';
import { buildShoppingList } from '../js/shopping.js';

const recipeA = {
  id: 'a', basePeople: 4,
  ingredients: [
    { qty: 400, unit: 'g', name: 'linguine', category: 'epicerie', scalable: true },
    { qty: 200, unit: 'g', name: 'tomates cerises', category: 'fruits-legumes', scalable: true }
  ]
};
const recipeB = {
  id: 'b', basePeople: 4,
  ingredients: [
    { qty: 200, unit: 'g', name: 'linguine', category: 'epicerie', scalable: true },
    { qty: null, unit: null, name: 'huile d olive', category: 'epices', scalable: false }
  ]
};
const recipes = { a: recipeA, b: recipeB };

test('buildShoppingList: agrège même ingrédient', () => {
  const week = {
    days: [
      { lunch: { recipeId: 'a', peopleOverride: null }, dinner: { recipeId: 'b', peopleOverride: null } }
    ],
    peopleGlobal: 4
  };
  const aisleOrder = ['fruits-legumes', 'epicerie', 'epices'];
  const list = buildShoppingList(week, recipes, aisleOrder);
  // linguine 400 + 200 = 600 g
  const linguine = list.find(c => c.category === 'epicerie').items.find(i => i.name === 'linguine');
  assert.strictEqual(linguine.qty, 600);
});

test('buildShoppingList: peopleOverride applique uniquement à la recette concernée', () => {
  const week = {
    days: [
      { lunch: { recipeId: 'a', peopleOverride: 6 }, dinner: { recipeId: 'b', peopleOverride: null } }
    ],
    peopleGlobal: 4
  };
  const list = buildShoppingList(week, recipes, ['fruits-legumes', 'epicerie', 'epices']);
  // a scale 4→6 (×1.5), b scale 4→4 (×1)
  // linguine = 400*1.5 + 200*1 = 600+200 = 800g
  const linguine = list.find(c => c.category === 'epicerie').items.find(i => i.name === 'linguine');
  assert.strictEqual(linguine.qty, 800);
});

test('buildShoppingList: respecte aisleOrder', () => {
  const week = { days: [{ lunch: { recipeId: 'a', peopleOverride: null }, dinner: null }], peopleGlobal: 4 };
  const list = buildShoppingList(week, recipes, ['epicerie', 'fruits-legumes']);
  assert.strictEqual(list[0].category, 'epicerie');
  assert.strictEqual(list[1].category, 'fruits-legumes');
});

test('buildShoppingList: non-scalable apparait une fois', () => {
  const week = {
    days: [
      { lunch: { recipeId: 'b', peopleOverride: null }, dinner: { recipeId: 'b', peopleOverride: null } }
    ],
    peopleGlobal: 4
  };
  const list = buildShoppingList(week, recipes, ['epicerie', 'epices']);
  const huile = list.find(c => c.category === 'epices').items;
  assert.strictEqual(huile.length, 1);
});

test('buildShoppingList: ignore les slots vides', () => {
  const week = { days: [{ lunch: null, dinner: { recipeId: 'a', peopleOverride: null } }], peopleGlobal: 4 };
  const list = buildShoppingList(week, recipes, ['fruits-legumes', 'epicerie']);
  const flat = list.flatMap(c => c.items);
  assert.strictEqual(flat.length, 2);
});
```

- [ ] **Step 2: Implémenter `js/shopping.js`**

```js
// js/shopping.js — dérivation de la liste de courses depuis activeWeek

import { scaleIngredient } from './scaling.js';
import { ingredientKey } from './keys.js';

export function buildShoppingList(week, recipesById, aisleOrder) {
  const buckets = new Map(); // key -> aggregated ingredient

  for (const day of week.days) {
    for (const slot of ['lunch', 'dinner']) {
      const meal = day[slot];
      if (!meal || !meal.recipeId) continue;
      const recipe = recipesById[meal.recipeId];
      if (!recipe) continue;
      const targetPeople = meal.peopleOverride ?? week.peopleGlobal;

      for (const ing of recipe.ingredients) {
        const scaled = scaleIngredient(ing, recipe.basePeople, targetPeople);
        const key = ingredientKey(ing);
        if (buckets.has(key)) {
          const existing = buckets.get(key);
          if (ing.scalable && existing.qty != null && scaled.qty != null) {
            existing.qty += scaled.qty;
          }
        } else {
          buckets.set(key, { ...scaled, key });
        }
      }
    }
  }

  // groupe par catégorie
  const byCategory = new Map();
  for (const item of buckets.values()) {
    if (!byCategory.has(item.category)) byCategory.set(item.category, []);
    byCategory.get(item.category).push(item);
  }

  // trie selon aisleOrder
  const ordered = [];
  for (const cat of aisleOrder) {
    if (byCategory.has(cat)) {
      ordered.push({ category: cat, items: byCategory.get(cat).sort((a, b) => a.name.localeCompare(b.name, 'fr')) });
      byCategory.delete(cat);
    }
  }
  // catégories non listées : à la fin
  for (const [cat, items] of byCategory) {
    ordered.push({ category: cat, items: items.sort((a, b) => a.name.localeCompare(b.name, 'fr')) });
  }

  return ordered;
}
```

- [ ] **Step 3: Lancer**

Run: `npm test`
Expected: tous passent.

- [ ] **Step 4: Commit**

```bash
git add js/shopping.js tests/shopping.test.js
git commit -m "feat(shopping): agrégation liste de courses par rayon (testée)"
```

---

### Task 9: Helper d'archivage de la semaine

**Files:**
- Modify: `js/state.js` (ajouter `archiveAndStart`)
- Create: `tests/archive.test.js`

- [ ] **Step 1: Test**

```js
// tests/archive.test.js
import { test } from 'node:test';
import assert from 'node:assert';
import { createState } from '../js/state.js';

class MockStorage {
  constructor() { this.store = {}; }
  getItem(k) { return this.store[k] ?? null; }
  setItem(k, v) { this.store[k] = String(v); }
  removeItem(k) { delete this.store[k]; }
}

test('archiveAndStart: aucun active → nouvelle active sans archivage', () => {
  const s = createState(new MockStorage());
  const newWeek = { startedAt: '2026-05-15', menuId: 'med', days: [], peopleGlobal: 4, notes: {} };
  s.archiveAndStart(newWeek);
  const st = s.load();
  assert.deepStrictEqual(st.activeWeek, newWeek);
  assert.strictEqual(st.history.length, 0);
});

test('archiveAndStart: active existante → archivée', () => {
  const s = createState(new MockStorage());
  s.mutate(d => { d.activeWeek = { startedAt: '2026-05-01', menuId: 'a', days: [], peopleGlobal: 4, notes: {} }; });
  s.archiveAndStart({ startedAt: '2026-05-08', menuId: 'b', days: [], peopleGlobal: 4, notes: {} });
  const st = s.load();
  assert.strictEqual(st.activeWeek.menuId, 'b');
  assert.strictEqual(st.history.length, 1);
  assert.strictEqual(st.history[0].menuId, 'a');
});

test('archiveAndStart: history limitée à 10 (FIFO)', () => {
  const s = createState(new MockStorage());
  for (let i = 0; i < 12; i++) {
    s.archiveAndStart({ startedAt: `2026-${String(i+1).padStart(2,'0')}-01`, menuId: `m${i}`, days: [], peopleGlobal: 4, notes: {} });
  }
  const st = s.load();
  assert.strictEqual(st.history.length, 10);
  // les plus anciennes sont droppées
  assert.strictEqual(st.history[0].menuId, 'm1');
  assert.strictEqual(st.history[9].menuId, 'm10');
});
```

- [ ] **Step 2: Ajouter `archiveAndStart` à `js/state.js`**

Dans la fonction `createState`, ajouter :

```js
function archiveAndStart(newWeek) {
  mutate(d => {
    if (d.activeWeek) {
      d.history.push(d.activeWeek);
      while (d.history.length > 10) d.history.shift();
    }
    d.activeWeek = newWeek;
    d.shoppingList.checked = {};
  });
}
```

Et ajouter `archiveAndStart` au return : `return { load, save, mutate, archiveAndStart };`

- [ ] **Step 3: Lancer**

Run: `npm test`
Expected: tous passent.

- [ ] **Step 4: Commit**

```bash
git add js/state.js tests/archive.test.js
git commit -m "feat(state): archiveAndStart pour démarrer une nouvelle semaine"
```

---

## Phase 3 — Données initiales

### Task 10: Migrer les 8 recettes existantes

**Files:**
- Create: `data/recipes.json`
- Create: `data/menus.json`

- [ ] **Step 1: Créer `data/recipes.json` avec les 8 recettes du `menu-semaine.html` au schéma §3.1 du spec**

Inclure : `pates-crevettes-ail`, `poulet-citron-origan`, `cabillaud-cap-olives`, `omelette-courgettes`, `saumon-papillote`, `souvlaki-poulet`, `tajine-poulet`, `minestrone`. Plus les 6 déjeuners express (`salade-pois-chiches`, `wrap-thon`, `bowl-quinoa-lentilles`, `salade-nicoise`, `pita-falafels`, `pizza-fine`).

Format exemple pour `pates-crevettes-ail` :

```json
{
  "id": "pates-crevettes-ail",
  "title": "Pâtes aux crevettes, ail & tomates cerises",
  "slot": "dinner",
  "timeMin": 15,
  "description": "Le plat italien express par excellence. Crevettes saisies dans l'huile d'olive parfumée à l'ail, tomates cerises qui fondent en sauce, basilic frais en finition.",
  "tags": ["italien", "poisson", "une-poele"],
  "constraints": ["sans-lactose"],
  "basePeople": 4,
  "ingredients": [
    { "qty": 400, "unit": "g", "name": "linguine", "category": "epicerie", "scalable": true },
    { "qty": 500, "unit": "g", "name": "crevettes décortiquées", "category": "viandes-poissons", "scalable": true },
    { "qty": 400, "unit": "g", "name": "tomates cerises", "category": "fruits-legumes", "scalable": true },
    { "qty": 4, "unit": null, "name": "gousses d'ail", "category": "fruits-legumes", "scalable": true },
    { "qty": null, "unit": null, "name": "piment d'Espelette", "category": "epices", "scalable": false },
    { "qty": 1, "unit": "botte", "name": "basilic frais", "category": "fruits-legumes", "scalable": false },
    { "qty": null, "unit": null, "name": "huile d'olive", "category": "epices", "scalable": false },
    { "qty": null, "unit": null, "name": "sel, poivre", "category": "epices", "scalable": false }
  ],
  "steps": [
    "Lancer l'eau des pâtes, salée, et cuire les linguine.",
    "Chauffer 4 c. à s. d'huile d'olive, faire dorer l'ail émincé et le piment 1 min.",
    "Ajouter les tomates cerises coupées en deux, écraser 5 min à feu vif.",
    "Saisir les crevettes 2-3 min dans la sauce.",
    "Verser les pâtes égouttées, mélanger avec une louche d'eau de cuisson, basilic ciselé."
  ]
}
```

Faire pareil pour les 13 autres. Le fichier final est un `[...]` JSON valide.

- [ ] **Step 2: Créer `data/menus.json` avec le menu méditerranéen**

```json
[
  {
    "id": "mediterraneen",
    "name": "Méditerranéen",
    "theme": "Sud, soleil, huile d'olive",
    "defaultConstraints": ["sans-lactose"],
    "seasons": ["printemps", "ete"],
    "days": [
      { "day": "Lundi",    "lunch": "salade-pois-chiches", "dinner": "pates-crevettes-ail" },
      { "day": "Mardi",    "lunch": "wrap-thon",            "dinner": "poulet-citron-origan" },
      { "day": "Mercredi", "lunch": "bowl-quinoa-lentilles", "dinner": "cabillaud-cap-olives" },
      { "day": "Jeudi",    "lunch": "salade-nicoise",        "dinner": "omelette-courgettes" },
      { "day": "Vendredi", "lunch": "pita-falafels",         "dinner": "saumon-papillote" },
      { "day": "Samedi",   "lunch": "pizza-fine",            "dinner": "souvlaki-poulet" },
      { "day": "Dimanche", "lunch": "tajine-poulet",         "dinner": "minestrone" }
    ]
  }
]
```

- [ ] **Step 3: Créer `data/seasonality.json` minimal**

```json
{
  "tomate": ["juin", "juillet", "aout", "septembre"],
  "tomates cerises": ["juin", "juillet", "aout", "septembre"],
  "courgette": ["mai", "juin", "juillet", "aout", "septembre"],
  "concombre": ["mai", "juin", "juillet", "aout", "septembre"],
  "haricots verts": ["juin", "juillet", "aout", "septembre"],
  "poivron": ["juillet", "aout", "septembre", "octobre"],
  "patate douce": ["octobre", "novembre", "decembre", "janvier", "fevrier"]
}
```

- [ ] **Step 4: Tester le chargement dans le navigateur**

Démarrer le serveur, ouvrir la console, exécuter :
```js
fetch('data/recipes.json').then(r => r.json()).then(d => console.log(d.length, 'recettes'));
```
Expected : `14 recettes` (8 dîners + 6 déjeuners express).

- [ ] **Step 5: Commit**

```bash
git add data/
git commit -m "content(data): 14 recettes initiales + menu méditerranéen + seasonality"
```

---

### Task 11: Validation des données

**Files:**
- Create: `tests/data.test.js`

- [ ] **Step 1: Test de validation structurelle**

```js
// tests/data.test.js
import { test } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { ingredientKey } from '../js/keys.js';

const recipes = JSON.parse(readFileSync(new URL('../data/recipes.json', import.meta.url)));
const menus = JSON.parse(readFileSync(new URL('../data/menus.json', import.meta.url)));

test('toutes les recettes ont les champs requis', () => {
  for (const r of recipes) {
    assert.ok(r.id, `recipe missing id`);
    assert.ok(r.title, `${r.id}: missing title`);
    assert.ok(['lunch', 'dinner', 'both'].includes(r.slot), `${r.id}: invalid slot`);
    assert.ok(typeof r.timeMin === 'number', `${r.id}: timeMin must be number`);
    assert.ok(typeof r.basePeople === 'number', `${r.id}: basePeople must be number`);
    assert.ok(Array.isArray(r.ingredients), `${r.id}: ingredients must be array`);
    assert.ok(Array.isArray(r.steps), `${r.id}: steps must be array`);
    for (const ing of r.ingredients) {
      assert.ok(ing.name, `${r.id}: ingredient missing name`);
      assert.ok(ing.category, `${r.id}: ${ing.name} missing category`);
      assert.ok(typeof ing.scalable === 'boolean', `${r.id}: ${ing.name} scalable must be boolean`);
    }
  }
});

test('aucun id de recette dupliqué', () => {
  const ids = recipes.map(r => r.id);
  assert.strictEqual(new Set(ids).size, ids.length);
});

test('tous les menus pointent vers des recettes existantes', () => {
  const ids = new Set(recipes.map(r => r.id));
  for (const m of menus) {
    for (const d of m.days) {
      if (d.lunch) assert.ok(ids.has(d.lunch), `menu ${m.id}: lunch ${d.lunch} introuvable`);
      if (d.dinner) assert.ok(ids.has(d.dinner), `menu ${m.id}: dinner ${d.dinner} introuvable`);
    }
  }
});
```

- [ ] **Step 2: Lancer**

Run: `npm test`
Expected: tous passent (sinon corriger `recipes.json` ou `menus.json`).

- [ ] **Step 3: Commit**

```bash
git add tests/data.test.js
git commit -m "test(data): validation structurelle recettes/menus"
```

---

## Phase 4 — App shell + Semaine

### Task 12: Tab bar + routing

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `app.js`
- Create: `js/ui/tabs.js`

- [ ] **Step 1: Modifier `index.html` — structure des onglets**

Remplacer `<main id="app">` par :

```html
<main id="app">
  <header class="app-header">
    <h1 id="app-title">Menu Hebdo</h1>
  </header>
  <section id="view-semaine" class="view active" data-tab="semaine"></section>
  <section id="view-courses" class="view" data-tab="courses"></section>
  <section id="view-recettes" class="view" data-tab="recettes"></section>
  <nav class="tab-bar">
    <button class="tab-btn active" data-target="semaine"><span class="tab-icon">🍽</span><span>Semaine</span></button>
    <button class="tab-btn" data-target="courses"><span class="tab-icon">🛒</span><span>Courses</span></button>
    <button class="tab-btn" data-target="recettes"><span class="tab-icon">📖</span><span>Recettes</span></button>
  </nav>
</main>
```

- [ ] **Step 2: Étendre `styles.css` — header, view, tab bar**

```css
.app-header {
  padding: env(safe-area-inset-top) 16px 12px;
  background: var(--bg);
  position: sticky;
  top: 0;
  z-index: 10;
}
.app-header h1 {
  font-size: 22px;
  font-weight: 700;
}
.view {
  display: none;
  padding: 16px 16px 96px;
  min-height: calc(100vh - 120px);
}
.view.active { display: block; }
.tab-bar {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  display: flex;
  background: rgba(248, 248, 250, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid var(--separator);
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 20;
}
.tab-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 0 4px;
  background: none;
  border: none;
  font: inherit;
  color: var(--text-muted);
  font-size: 10px;
  cursor: pointer;
}
.tab-btn .tab-icon { font-size: 22px; }
.tab-btn.active { color: var(--accent); }
```

- [ ] **Step 3: Créer `js/ui/tabs.js`**

```js
// js/ui/tabs.js — switching d'onglets

export function initTabs() {
  const buttons = document.querySelectorAll('.tab-btn');
  const views = document.querySelectorAll('.view');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      buttons.forEach(b => b.classList.toggle('active', b === btn));
      views.forEach(v => v.classList.toggle('active', v.dataset.tab === target));
      window.scrollTo({ top: 0 });
    });
  });
}
```

- [ ] **Step 4: Mettre à jour `app.js`**

```js
import { initTabs } from './js/ui/tabs.js';

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
});
```

- [ ] **Step 5: Vérification visuelle**

Démarrer `python3 -m http.server 8000`, ouvrir `http://localhost:8000`, vérifier :
- 3 onglets en bas
- Clic sur chaque change la vue active
- Animation/active state OK

- [ ] **Step 6: Commit**

```bash
git add index.html styles.css app.js js/ui/tabs.js
git commit -m "feat(ui): tab bar bas iOS + routing entre 3 vues"
```

---

### Task 13: Vue Semaine — état vide

**Files:**
- Create: `js/views/semaine.js`
- Modify: `styles.css`
- Modify: `app.js`

- [ ] **Step 1: Créer `js/views/semaine.js`**

```js
// js/views/semaine.js — rendu de l'onglet Semaine

export function renderSemaine(container, { state, data, callbacks }) {
  container.innerHTML = '';
  if (!state.activeWeek) {
    container.appendChild(renderEmpty(callbacks));
    return;
  }
  container.appendChild(renderWeek(state, data, callbacks));
}

function renderEmpty({ onStartWeek }) {
  const div = document.createElement('div');
  div.className = 'semaine-empty';
  div.innerHTML = `
    <div class="semaine-empty-emoji">🥗</div>
    <h2>Aucune semaine en cours</h2>
    <p>Démarre ta semaine en choisissant un menu ou en composant librement.</p>
    <button class="btn-primary" id="btn-start-week">Démarrer ma semaine</button>
  `;
  div.querySelector('#btn-start-week').addEventListener('click', onStartWeek);
  return div;
}

function renderWeek(state, data, callbacks) {
  const div = document.createElement('div');
  div.className = 'semaine-week';
  div.textContent = `Semaine en cours · ${state.activeWeek.menuId ?? 'libre'} · ${state.activeWeek.peopleGlobal} pers.`;
  return div;
}
```

- [ ] **Step 2: CSS empty state**

```css
.semaine-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 64px 24px;
  gap: 16px;
}
.semaine-empty-emoji { font-size: 64px; }
.semaine-empty h2 { font-size: 22px; font-weight: 600; }
.semaine-empty p { color: var(--text-secondary); max-width: 280px; }
.btn-primary {
  background: var(--accent);
  color: white;
  border: none;
  padding: 14px 28px;
  border-radius: var(--radius-button);
  font: inherit;
  font-weight: 600;
  font-size: 17px;
  cursor: pointer;
  margin-top: 16px;
}
.btn-primary:active { opacity: 0.8; }
```

- [ ] **Step 3: Intégrer dans `app.js`**

Remplacer le contenu :

```js
import { initTabs } from './js/ui/tabs.js';
import { createState } from './js/state.js';
import { loadData } from './js/data.js';
import { renderSemaine } from './js/views/semaine.js';

const state = createState();

async function main() {
  const data = await loadData();
  initTabs();
  rerender(data);
}

function rerender(data) {
  const s = state.load();
  const callbacks = {
    onStartWeek: () => console.log('TODO: wizard')
  };
  renderSemaine(document.getElementById('view-semaine'), { state: s, data, callbacks });
}

document.addEventListener('DOMContentLoaded', main);
```

- [ ] **Step 4: Vérification manuelle**

Ouvrir l'app dans le navigateur, vider le localStorage (`localStorage.clear()` en console), recharger. L'écran montre :
- "Aucune semaine en cours"
- Bouton "Démarrer ma semaine"
- Clic → log "TODO: wizard" dans la console.

- [ ] **Step 5: Commit**

```bash
git add js/views/semaine.js styles.css app.js
git commit -m "feat(semaine): vue vide + bouton démarrer la semaine"
```

---

### Task 14: Rendu de la semaine active

**Files:**
- Modify: `js/views/semaine.js`
- Modify: `styles.css`

- [ ] **Step 1: Étendre `js/views/semaine.js` — rendu des jours**

Remplacer `renderWeek` par :

```js
function renderWeek(state, data, callbacks) {
  const wrap = document.createElement('div');
  wrap.className = 'semaine-week';

  const header = document.createElement('div');
  header.className = 'semaine-header';
  const menuName = state.activeWeek.menuId
    ? data.menusById[state.activeWeek.menuId]?.name ?? 'Menu'
    : 'Composition libre';
  header.innerHTML = `
    <div class="semaine-title">
      <h2>${escapeHtml(menuName)}</h2>
      <button class="btn-link" id="btn-restart">Nouvelle semaine</button>
    </div>
    <div class="people-slider">
      <label for="people-input">🍽 Personnes</label>
      <input type="number" id="people-input" min="1" max="12" value="${state.activeWeek.peopleGlobal}">
    </div>
  `;
  header.querySelector('#btn-restart').addEventListener('click', callbacks.onStartWeek);
  header.querySelector('#people-input').addEventListener('input', e => {
    const v = Math.max(1, Math.min(12, parseInt(e.target.value, 10) || 1));
    callbacks.onChangePeople(v);
  });
  wrap.appendChild(header);

  const list = document.createElement('div');
  list.className = 'day-list';
  for (const day of state.activeWeek.days) {
    list.appendChild(renderDay(day, data, callbacks));
  }
  wrap.appendChild(list);
  return wrap;
}

function renderDay(day, data, callbacks) {
  const card = document.createElement('article');
  card.className = 'day-card';
  card.innerHTML = `<h3>${day.day}</h3>`;
  for (const slot of ['lunch', 'dinner']) {
    const meal = day[slot];
    const slotLabel = slot === 'lunch' ? 'Midi' : 'Soir';
    if (!meal || !meal.recipeId) {
      const empty = document.createElement('div');
      empty.className = 'meal meal-empty';
      empty.textContent = `${slotLabel} : —`;
      card.appendChild(empty);
      continue;
    }
    const recipe = data.recipesById[meal.recipeId];
    const div = document.createElement('div');
    div.className = `meal ${meal.cooked ? 'cooked' : ''}`;
    div.innerHTML = `
      <div class="meal-label">${slotLabel}</div>
      <div class="meal-title">${escapeHtml(recipe?.title ?? 'recette inconnue')}</div>
      <div class="meal-meta">${recipe?.timeMin ?? '?'} min${meal.peopleOverride ? ` · pour ${meal.peopleOverride} pers.` : ''}</div>
    `;
    div.addEventListener('click', () => callbacks.onOpenRecipe(day.day, slot, meal.recipeId));
    card.appendChild(div);
  }
  return card;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
```

- [ ] **Step 2: CSS**

```css
.semaine-header {
  margin-bottom: 16px;
}
.semaine-title {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.semaine-title h2 {
  font-size: 28px;
  font-weight: 700;
}
.btn-link {
  background: none;
  border: none;
  color: var(--accent);
  font: inherit;
  font-size: 15px;
  cursor: pointer;
}
.people-slider {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 15px;
  color: var(--text-secondary);
}
.people-slider input {
  width: 60px;
  padding: 6px 10px;
  border: 1px solid var(--separator);
  border-radius: 8px;
  font: inherit;
  text-align: center;
}
.day-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.day-card {
  background: var(--surface);
  border-radius: var(--radius-card);
  padding: 16px;
  box-shadow: var(--shadow-card);
}
.day-card h3 {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 12px;
}
.meal {
  padding: 8px 0;
  border-top: 1px solid var(--separator);
  cursor: pointer;
}
.meal:first-of-type { border-top: none; }
.meal-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}
.meal-title {
  font-size: 16px;
  margin: 2px 0;
}
.meal-meta {
  font-size: 13px;
  color: var(--text-muted);
}
.meal.cooked .meal-title { text-decoration: line-through; opacity: 0.5; }
.meal-empty {
  color: var(--text-muted);
  font-style: italic;
}
@media (min-width: 768px) {
  .day-list { display: grid; grid-template-columns: repeat(2, 1fr); }
}
```

- [ ] **Step 3: Étendre `app.js` callbacks**

```js
function rerender() {
  const s = state.load();
  const callbacks = {
    onStartWeek: () => console.log('TODO: wizard'),
    onChangePeople: (n) => {
      state.mutate(d => { if (d.activeWeek) d.activeWeek.peopleGlobal = n; });
      rerender();
    },
    onOpenRecipe: (day, slot, recipeId) => console.log('TODO: open recipe', day, slot, recipeId)
  };
  renderSemaine(document.getElementById('view-semaine'), { state: s, data: _dataCache, callbacks });
}

let _dataCache;
async function main() {
  _dataCache = await loadData();
  initTabs();
  rerender();
}
```

- [ ] **Step 4: Test manuel — injecter une semaine fictive**

Console :
```js
localStorage.setItem('food:v1', JSON.stringify({
  schemaVersion: 1,
  activeWeek: {
    startedAt: "2026-05-15", menuId: "mediterraneen",
    days: [
      { day: "Lundi", lunch: { recipeId: "salade-pois-chiches", peopleOverride: null, cooked: false }, dinner: { recipeId: "pates-crevettes-ail", peopleOverride: null, cooked: false } },
      { day: "Mardi", lunch: { recipeId: "wrap-thon", peopleOverride: null, cooked: false }, dinner: { recipeId: "poulet-citron-origan", peopleOverride: null, cooked: false } }
    ],
    peopleGlobal: 4, notes: {}
  },
  shoppingList: { checked: {}, inStock: {} },
  preferences: { theme: "ios", defaultPeople: 4, aisleOrder: ["fruits-legumes","viandes-poissons","pains-pates","frais","epicerie","epices","en-cas"], favorites: [] },
  history: []
}));
location.reload();
```
Expected : on voit "Méditerranéen", curseur 🍽 à 4, 2 cartes (Lundi/Mardi) avec 4 repas.

- [ ] **Step 5: Commit**

```bash
git add js/views/semaine.js styles.css app.js
git commit -m "feat(semaine): rendu semaine active + curseur personnes"
```

---

### Task 15: Bouton "Marquer faite" depuis la carte

**Files:**
- Modify: `js/views/semaine.js`
- Modify: `styles.css`

- [ ] **Step 1: Ajouter un menu contextuel sur tap long**

Dans `renderDay`, modifier l'event listener du `.meal` pour distinguer tap court (ouvre la recette) et tap long (action sheet). Pour le MVP, ajouter un petit icône `•••` visible :

```js
div.innerHTML = `
  <div class="meal-label">${slotLabel}</div>
  <div class="meal-row">
    <div class="meal-title">${escapeHtml(recipe?.title ?? 'recette inconnue')}</div>
    <button class="meal-more" aria-label="Plus d'actions">⋯</button>
  </div>
  <div class="meal-meta">${recipe?.timeMin ?? '?'} min${meal.peopleOverride ? ` · pour ${meal.peopleOverride} pers.` : ''}</div>
`;
div.querySelector('.meal-more').addEventListener('click', (e) => {
  e.stopPropagation();
  callbacks.onMealAction(day.day, slot);
});
```

- [ ] **Step 2: CSS pour `.meal-row` et `.meal-more`**

```css
.meal-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.meal-more {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 22px;
  line-height: 1;
  padding: 4px 8px;
  cursor: pointer;
}
```

- [ ] **Step 3: Action sheet simple dans `app.js`**

```js
onMealAction: (day, slot) => {
  const action = prompt('Action : "cooked" / "swap" / annuler');
  if (action === 'cooked') {
    state.mutate(d => {
      const dayObj = d.activeWeek.days.find(x => x.day === day);
      if (dayObj && dayObj[slot]) dayObj[slot].cooked = !dayObj[slot].cooked;
    });
    rerender();
  } else if (action === 'swap') {
    console.log('TODO: open swap modal', day, slot);
  }
}
```

*(L'action sheet propre arrivera avec le swap modal en Task 23.)*

- [ ] **Step 4: Test manuel**

Cliquer sur `⋯` d'un repas, taper "cooked" → la recette se raye.

- [ ] **Step 5: Commit**

```bash
git add js/views/semaine.js styles.css app.js
git commit -m "feat(semaine): bouton ⋯ avec action 'marquer faite' (prompt temporaire)"
```

---

### Task 16: Sauvegarder l'override personnes par recette

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Ajouter le callback `onChangePeopleForMeal`**

Dans `rerender()` callbacks :
```js
onChangePeopleForMeal: (day, slot, n) => {
  state.mutate(d => {
    const dayObj = d.activeWeek.days.find(x => x.day === day);
    if (dayObj && dayObj[slot]) dayObj[slot].peopleOverride = n;
  });
  rerender();
}
```

*(Ce callback sera utilisé depuis le recipe modal en Task 19.)*

- [ ] **Step 2: Commit**

```bash
git add app.js
git commit -m "feat(app): callback override personnes par repas (préparation modal recette)"
```

---

## Phase 5 — Vue Recette (modal sheet)

### Task 17: Modal recipe sheet — squelette

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Create: `js/views/recipe-modal.js`
- Modify: `app.js`

- [ ] **Step 1: Ajouter le conteneur de modal dans `index.html`**

Avant `</main>` :
```html
<div id="modal-root"></div>
```

- [ ] **Step 2: Créer `js/views/recipe-modal.js`**

```js
// js/views/recipe-modal.js — sheet modal pour afficher une recette

import { scaleIngredient } from '../scaling.js';
import { formatQty } from '../utils.js';

export function openRecipeModal({ recipe, peopleEffective, isFavorite, note, callbacks }) {
  const root = document.getElementById('modal-root');
  root.innerHTML = '';
  const sheet = document.createElement('div');
  sheet.className = 'sheet-overlay';
  sheet.innerHTML = `
    <div class="sheet" role="dialog" aria-modal="true">
      <button class="sheet-close" aria-label="Fermer">✕</button>
      <div class="sheet-body">
        <header class="recipe-head">
          <h2>${escapeHtml(recipe.title)}</h2>
          <button class="fav-toggle" aria-pressed="${isFavorite}">${isFavorite ? '★' : '☆'}</button>
        </header>
        <div class="recipe-meta">
          ${recipe.timeMin} min · ${peopleEffective} pers.
          <button class="people-override-btn">⋯ Personnes</button>
        </div>
        <p class="recipe-desc">${escapeHtml(recipe.description)}</p>
        <h3 class="section-h">Ingrédients</h3>
        <ul class="ingredients-list">
          ${recipe.ingredients.map(ing => {
            const scaled = scaleIngredient(ing, recipe.basePeople, peopleEffective);
            return `<li><span class="ing-qty">${formatQty(scaled)}</span> <span class="ing-name">${escapeHtml(scaled.name)}</span></li>`;
          }).join('')}
        </ul>
        <h3 class="section-h">Étapes</h3>
        <ol class="steps-list">
          ${recipe.steps.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
        </ol>
        <h3 class="section-h">Notes perso</h3>
        <textarea class="recipe-notes" rows="3" placeholder="Tes notes…">${escapeHtml(note ?? '')}</textarea>
      </div>
    </div>
  `;
  root.appendChild(sheet);

  sheet.querySelector('.sheet-close').addEventListener('click', close);
  sheet.addEventListener('click', e => { if (e.target === sheet) close(); });
  sheet.querySelector('.fav-toggle').addEventListener('click', () => callbacks.onToggleFavorite());
  sheet.querySelector('.people-override-btn').addEventListener('click', () => {
    const n = parseInt(prompt('Pour combien de personnes ?', peopleEffective), 10);
    if (!isNaN(n) && n >= 1 && n <= 12) callbacks.onPeopleOverride(n);
  });
  sheet.querySelector('.recipe-notes').addEventListener('input', e => callbacks.onNoteChange(e.target.value));

  function close() { root.innerHTML = ''; }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
```

- [ ] **Step 3: CSS du sheet (style iOS)**

```css
.sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: flex-end;
  z-index: 100;
  animation: fadeIn 0.2s ease;
}
.sheet {
  background: var(--surface);
  width: 100%;
  max-height: 92vh;
  border-radius: var(--radius-modal) var(--radius-modal) 0 0;
  overflow-y: auto;
  position: relative;
  animation: slideUp 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.sheet-close {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(120, 120, 128, 0.15);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 16px;
  cursor: pointer;
  z-index: 1;
}
.sheet-body { padding: 24px 20px 40px; }
.recipe-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.recipe-head h2 { font-size: 24px; font-weight: 700; line-height: 1.2; }
.fav-toggle { background: none; border: none; font-size: 28px; cursor: pointer; line-height: 1; color: var(--accent); }
.recipe-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 14px;
  color: var(--text-muted);
  margin: 8px 0 12px;
}
.people-override-btn {
  background: none;
  border: 1px solid var(--separator);
  border-radius: 14px;
  padding: 4px 10px;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}
.recipe-desc { color: var(--text-secondary); margin-bottom: 16px; }
.section-h { font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent); margin: 24px 0 8px; }
.ingredients-list { list-style: none; }
.ingredients-list li { display: flex; gap: 12px; padding: 6px 0; border-bottom: 1px solid var(--separator); }
.ing-qty { min-width: 80px; color: var(--text-muted); font-variant-numeric: tabular-nums; }
.steps-list { padding-left: 24px; }
.steps-list li { padding: 6px 0; }
.recipe-notes {
  width: 100%;
  margin-top: 8px;
  padding: 10px;
  border: 1px solid var(--separator);
  border-radius: 8px;
  font: inherit;
  resize: vertical;
}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
```

- [ ] **Step 4: Brancher dans `app.js`**

```js
import { openRecipeModal } from './js/views/recipe-modal.js';

// dans rerender callbacks :
onOpenRecipe: (day, slot, recipeId) => {
  const recipe = _dataCache.recipesById[recipeId];
  const s = state.load();
  const meal = s.activeWeek.days.find(x => x.day === day)[slot];
  const peopleEffective = meal.peopleOverride ?? s.activeWeek.peopleGlobal;
  openRecipeModal({
    recipe,
    peopleEffective,
    isFavorite: s.preferences.favorites.includes(recipeId),
    note: s.activeWeek.notes[recipeId],
    callbacks: {
      onToggleFavorite: () => {
        state.mutate(d => {
          const i = d.preferences.favorites.indexOf(recipeId);
          if (i >= 0) d.preferences.favorites.splice(i, 1);
          else d.preferences.favorites.push(recipeId);
        });
        // reopen pour refresh
        rerender();
      },
      onPeopleOverride: (n) => {
        state.mutate(d => {
          const dayObj = d.activeWeek.days.find(x => x.day === day);
          dayObj[slot].peopleOverride = n;
        });
        rerender();
        // reopen avec nouvelle valeur
        document.querySelector('.meal:hover')?.click();
      },
      onNoteChange: (text) => {
        state.mutate(d => { d.activeWeek.notes[recipeId] = text; });
      }
    }
  });
}
```

- [ ] **Step 5: Test manuel**

Cliquer sur une recette → modal s'ouvre depuis le bas. Vérifier :
- Titre, temps, description
- Ingrédients avec quantités
- Étapes numérotées
- Toggle favori change l'étoile
- Override personnes via prompt change l'affichage des quantités (après reload)
- Notes texte sauvegarde au fil de la frappe

- [ ] **Step 6: Commit**

```bash
git add index.html styles.css js/views/recipe-modal.js app.js
git commit -m "feat(recipe-modal): sheet iOS avec ingrédients scalés, favori, notes, override"
```

---

### Task 18: Marquer recette comme faite depuis le modal

**Files:**
- Modify: `js/views/recipe-modal.js`
- Modify: `app.js`

- [ ] **Step 1: Ajouter le bouton "Marquer comme faite" dans le modal**

Dans `sheet-body`, après les étapes, ajouter (avant les notes) :
```html
<div class="cooked-row">
  <button class="btn-secondary cooked-toggle" aria-pressed="${isCooked}">
    ${isCooked ? '✓ Repas fait' : 'Marquer comme fait'}
  </button>
</div>
```

Accepter `isCooked` en paramètre de `openRecipeModal({...})` et ajouter le handler `onToggleCooked`.

- [ ] **Step 2: CSS**

```css
.cooked-row { margin: 24px 0 0; }
.btn-secondary {
  background: rgba(120, 120, 128, 0.12);
  color: var(--text);
  border: none;
  padding: 12px 20px;
  border-radius: var(--radius-button);
  font: inherit;
  font-size: 15px;
  cursor: pointer;
  width: 100%;
}
.btn-secondary[aria-pressed="true"] { background: rgba(52, 199, 89, 0.15); color: #34c759; }
```

- [ ] **Step 3: Brancher dans `app.js`**

Passer `isCooked: meal.cooked` à `openRecipeModal` et ajouter le callback :
```js
onToggleCooked: () => {
  state.mutate(d => {
    const dayObj = d.activeWeek.days.find(x => x.day === day);
    dayObj[slot].cooked = !dayObj[slot].cooked;
  });
  rerender();
}
```

- [ ] **Step 4: Test manuel**

Ouvrir une recette → bouton "Marquer comme fait" → le repas est rayé sur la vue Semaine après fermeture.

- [ ] **Step 5: Commit**

```bash
git add js/views/recipe-modal.js styles.css app.js
git commit -m "feat(recipe-modal): toggle 'marquer comme fait'"
```

---

### Task 19: Override personnes via curseur inline (au lieu de prompt)

**Files:**
- Modify: `js/views/recipe-modal.js`
- Modify: `styles.css`

- [ ] **Step 1: Remplacer le `prompt` par un mini-curseur inline**

Dans le modal, remplacer le bouton `.people-override-btn` par :

```html
<div class="people-inline">
  <button class="ppl-btn" data-dir="-1">−</button>
  <span class="ppl-value">${peopleEffective}</span>
  <button class="ppl-btn" data-dir="+1">+</button>
</div>
```

Event handlers :
```js
sheet.querySelectorAll('.ppl-btn').forEach(b => {
  b.addEventListener('click', () => {
    const dir = parseInt(b.dataset.dir, 10);
    const current = parseInt(sheet.querySelector('.ppl-value').textContent, 10);
    const next = Math.max(1, Math.min(12, current + dir));
    callbacks.onPeopleOverride(next);
  });
});
```

- [ ] **Step 2: CSS**

```css
.people-inline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(120, 120, 128, 0.12);
  border-radius: 14px;
  padding: 2px 4px;
}
.ppl-btn {
  background: none;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 12px;
  font: inherit;
  cursor: pointer;
}
.ppl-btn:active { background: rgba(120, 120, 128, 0.25); }
.ppl-value { min-width: 18px; text-align: center; font-variant-numeric: tabular-nums; }
```

- [ ] **Step 3: `onPeopleOverride` doit re-rendre le modal sans le fermer**

Modifier `openRecipeModal` pour ré-écrire le contenu sans refermer. Simplification : ré-appeler `openRecipeModal` avec les nouvelles props.

Dans `app.js` :
```js
onPeopleOverride: (n) => {
  state.mutate(d => {
    const dayObj = d.activeWeek.days.find(x => x.day === day);
    dayObj[slot].peopleOverride = n;
  });
  rerender();
  // ré-ouvrir avec la nouvelle valeur :
  callbacks.onOpenRecipe(day, slot, recipeId);
}
```

*(Note : on a une dépendance circulaire dans le bloc callbacks. Pour la propreté, extraire `openRecipeModal(day, slot, recipeId)` en fonction nommée dans `app.js`.)*

- [ ] **Step 4: Test manuel**

Boutons + / − changent la valeur, les ingrédients se recalculent en direct.

- [ ] **Step 5: Commit**

```bash
git add js/views/recipe-modal.js styles.css app.js
git commit -m "feat(recipe-modal): override personnes inline avec +/-"
```

---

## Phase 6 — Wizard "Démarrer ma semaine"

### Task 20: Wizard — squelette 3 étapes

**Files:**
- Create: `js/views/wizard.js`
- Modify: `styles.css`
- Modify: `app.js`

- [ ] **Step 1: Créer `js/views/wizard.js`**

```js
// js/views/wizard.js — wizard 3 étapes pour démarrer une nouvelle semaine

export function openWizard({ data, currentDefaults, callbacks }) {
  const root = document.getElementById('modal-root');
  root.innerHTML = '';
  const overlay = document.createElement('div');
  overlay.className = 'wizard-overlay';

  let step = 1;
  let selectedMenuId = null;
  let draft = null;     // { startedAt, menuId, days, peopleGlobal, notes }

  function render() {
    overlay.innerHTML = `
      <div class="wizard">
        <header class="wizard-head">
          <button class="wizard-back" aria-label="Retour">${step > 1 ? '←' : '✕'}</button>
          <div class="wizard-progress">${step} / 3</div>
        </header>
        <div class="wizard-body" id="wizard-body"></div>
        <footer class="wizard-foot">
          ${step < 3
            ? `<button class="btn-primary" id="wizard-next" ${step === 1 && !selectedMenuId ? 'disabled' : ''}>Continuer</button>`
            : `<button class="btn-primary" id="wizard-validate">C'est parti</button>`}
        </footer>
      </div>
    `;
    overlay.querySelector('.wizard-back').addEventListener('click', () => {
      if (step === 1) close();
      else { step--; render(); }
    });
    const next = overlay.querySelector('#wizard-next');
    if (next) next.addEventListener('click', () => { advance(); render(); });
    const validate = overlay.querySelector('#wizard-validate');
    if (validate) validate.addEventListener('click', () => {
      callbacks.onValidate(draft);
      close();
    });
    renderStep();
  }

  function renderStep() {
    const body = overlay.querySelector('#wizard-body');
    if (step === 1) renderStep1(body);
    if (step === 2) renderStep2(body);
    if (step === 3) renderStep3(body);
  }

  function renderStep1(body) {
    body.innerHTML = `
      <h2 class="wizard-title">Choisis ton menu</h2>
      <div class="menu-grid">
        ${data.menus.map(m => `
          <button class="menu-card ${selectedMenuId === m.id ? 'selected' : ''}" data-menu="${m.id}">
            <h3>${escapeHtml(m.name)}</h3>
            <p>${escapeHtml(m.theme)}</p>
          </button>
        `).join('')}
        <button class="menu-card menu-card-special" data-menu="random">🎲<br>Surprends-moi</button>
        <button class="menu-card menu-card-special" data-menu="libre">🧑‍🍳<br>Composer librement</button>
      </div>
    `;
    body.querySelectorAll('.menu-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.menu;
        if (id === 'random') {
          selectedMenuId = data.menus[Math.floor(Math.random() * data.menus.length)].id;
        } else if (id === 'libre') {
          selectedMenuId = null; // signifie composition libre
        } else {
          selectedMenuId = id;
        }
        render();
      });
    });
  }

  function renderStep2(body) {
    body.innerHTML = `
      <h2 class="wizard-title">Personnalise</h2>
      <p class="wizard-help">Tape sur une recette pour la remplacer.</p>
      <div class="day-list">
        ${draft.days.map((day, i) => `
          <article class="day-card">
            <h3>${day.day}</h3>
            ${['lunch','dinner'].map(slot => {
              const meal = day[slot];
              const recipe = meal?.recipeId ? data.recipesById[meal.recipeId] : null;
              return `
                <div class="meal" data-day="${day.day}" data-slot="${slot}">
                  <div class="meal-label">${slot === 'lunch' ? 'Midi' : 'Soir'}</div>
                  <div class="meal-title">${recipe ? escapeHtml(recipe.title) : '— (tape pour ajouter)'}</div>
                </div>
              `;
            }).join('')}
          </article>
        `).join('')}
      </div>
    `;
    body.querySelectorAll('.meal').forEach(el => {
      el.addEventListener('click', () => {
        callbacks.onPickRecipeForSlot(el.dataset.day, el.dataset.slot, draft, (newRecipeId) => {
          const dayObj = draft.days.find(d => d.day === el.dataset.day);
          if (newRecipeId) dayObj[el.dataset.slot] = { recipeId: newRecipeId, peopleOverride: null, cooked: false };
          else dayObj[el.dataset.slot] = null;
          render();
        });
      });
    });
  }

  function renderStep3(body) {
    const totalRecipes = draft.days.reduce((sum, d) => sum + (d.lunch?1:0) + (d.dinner?1:0), 0);
    const totalTime = draft.days.reduce((sum, d) => {
      for (const slot of ['lunch','dinner']) {
        if (d[slot]?.recipeId) sum += data.recipesById[d[slot].recipeId]?.timeMin ?? 0;
      }
      return sum;
    }, 0);
    body.innerHTML = `
      <h2 class="wizard-title">Récap</h2>
      <div class="wizard-stats">
        <div><span class="big">${totalRecipes}</span><br>recettes</div>
        <div><span class="big">${draft.peopleGlobal}</span><br>personnes</div>
        <div><span class="big">${totalTime}</span><br>min de cuisine</div>
      </div>
      <p class="wizard-help">Une fois validée, l'ancienne semaine sera archivée et la liste de courses sera générée.</p>
    `;
  }

  function advance() {
    if (step === 1) {
      // construit le draft à partir du menu choisi (ou libre)
      const menu = selectedMenuId ? data.menusById[selectedMenuId] : null;
      const today = new Date().toISOString().slice(0, 10);
      draft = {
        startedAt: today,
        menuId: selectedMenuId,
        peopleGlobal: currentDefaults.peopleGlobal,
        notes: {},
        days: menu
          ? menu.days.map(d => ({
              day: d.day,
              lunch: d.lunch ? { recipeId: d.lunch, peopleOverride: null, cooked: false } : null,
              dinner: d.dinner ? { recipeId: d.dinner, peopleOverride: null, cooked: false } : null
            }))
          : ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'].map(day => ({ day, lunch: null, dinner: null }))
      };
      step = 2;
    } else if (step === 2) {
      step = 3;
    }
  }

  function close() { root.innerHTML = ''; }

  render();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
```

- [ ] **Step 2: CSS du wizard**

```css
.wizard-overlay {
  position: fixed;
  inset: 0;
  background: var(--bg);
  z-index: 200;
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.2s ease;
}
.wizard {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 720px;
  margin: 0 auto;
  width: 100%;
}
.wizard-head {
  display: flex;
  align-items: center;
  padding: env(safe-area-inset-top) 16px 12px;
  gap: 16px;
}
.wizard-back { background: none; border: none; font-size: 22px; cursor: pointer; padding: 4px 8px; }
.wizard-progress { color: var(--text-muted); font-size: 13px; }
.wizard-body { flex: 1; overflow-y: auto; padding: 8px 16px 16px; }
.wizard-foot { padding: 16px; padding-bottom: calc(16px + env(safe-area-inset-bottom)); }
.wizard-foot .btn-primary { width: 100%; }
.wizard-foot .btn-primary[disabled] { opacity: 0.4; cursor: not-allowed; }
.wizard-title { font-size: 28px; font-weight: 700; margin-bottom: 16px; }
.wizard-help { color: var(--text-secondary); margin-bottom: 16px; font-size: 15px; }
.menu-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.menu-card {
  background: var(--surface);
  border: 2px solid transparent;
  border-radius: var(--radius-card);
  padding: 16px;
  text-align: left;
  font: inherit;
  cursor: pointer;
}
.menu-card.selected { border-color: var(--accent); }
.menu-card h3 { font-size: 17px; font-weight: 600; }
.menu-card p { font-size: 13px; color: var(--text-muted); margin-top: 4px; }
.menu-card-special {
  text-align: center;
  font-size: 28px;
  line-height: 1.4;
}
.wizard-stats {
  display: flex;
  justify-content: space-around;
  margin: 24px 0;
  text-align: center;
  font-size: 13px;
  color: var(--text-muted);
}
.wizard-stats .big {
  font-size: 36px;
  font-weight: 700;
  color: var(--accent);
}
```

- [ ] **Step 3: Brancher dans `app.js`**

```js
import { openWizard } from './js/views/wizard.js';

onStartWeek: () => {
  const s = state.load();
  openWizard({
    data: _dataCache,
    currentDefaults: { peopleGlobal: s.activeWeek?.peopleGlobal ?? s.preferences.defaultPeople },
    callbacks: {
      onPickRecipeForSlot: (day, slot, draft, done) => {
        // TODO Task 23 : ouvrir le swap modal
        const id = prompt('ID de recette ?');
        done(id || null);
      },
      onValidate: (draft) => {
        state.archiveAndStart(draft);
        rerender();
      }
    }
  });
}
```

- [ ] **Step 4: Test manuel**

Cliquer "Démarrer ma semaine" → wizard apparaît. Step 1 : cards de menus, le menu méditerranéen + 2 cards spéciales. Sélection + continuer → Step 2 vue jours. Continuer → Step 3 récap. Validate → revient sur Semaine avec le menu choisi.

- [ ] **Step 5: Commit**

```bash
git add js/views/wizard.js styles.css app.js
git commit -m "feat(wizard): 3 étapes — choisir menu, personnaliser, valider"
```

---

### Task 21: Wizard Étape 2 — "surprends-moi" en step 1 et navigation entre étapes

*(La majorité du flow étant déjà câblée en Task 20, cette tâche affine l'UX.)*

**Files:**
- Modify: `js/views/wizard.js`

- [ ] **Step 1: Réordonner Step 1 — favoris en premier**

Dans `renderStep1`, trier les `data.menus` selon : (1) menus dont la `seasons` matche le mois courant, (2) le reste.

```js
const month = new Date().toLocaleString('fr-FR', { month: 'long' }).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const seasonOf = m => {
  if (m.seasons?.includes('ete') && ['juin','juillet','aout'].includes(month)) return 0;
  if (m.seasons?.includes('automne') && ['septembre','octobre','novembre'].includes(month)) return 0;
  // etc.
  return 1;
};
const sortedMenus = [...data.menus].sort((a, b) => seasonOf(a) - seasonOf(b));
```

- [ ] **Step 2: Ajouter swipe gestures pour naviguer entre étapes (optionnel mais nice)**

Dans `js/views/wizard.js`, attacher `touchstart`/`touchend` à `.wizard-body` et basculer step en arrière sur swipe-right.

Implémentation simple :
```js
let touchStartX = 0;
overlay.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; });
overlay.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (dx > 80 && step > 1) { step--; render(); }
});
```

- [ ] **Step 3: Test manuel**

Vérifier : si on est en mai, le menu "Méditerranéen" (printemps/été) est en haut. Swipe right depuis Step 2 → revient Step 1.

- [ ] **Step 4: Commit**

```bash
git add js/views/wizard.js
git commit -m "feat(wizard): tri saisonnier + swipe right pour revenir"
```

---

### Task 22: Wizard Étape 3 — pré-aperçu de la liste de courses

**Files:**
- Modify: `js/views/wizard.js`

- [ ] **Step 1: Importer et appeler `buildShoppingList`**

Dans `renderStep3`, ajouter sous les stats :

```js
import { buildShoppingList } from '../shopping.js';

// dans renderStep3 :
const list = buildShoppingList(draft, data.recipesById, currentDefaults.aisleOrder ?? ['fruits-legumes','viandes-poissons','pains-pates','frais','epicerie','epices','en-cas']);
const totalItems = list.reduce((s, c) => s + c.items.length, 0);
body.innerHTML += `
  <div class="wizard-preview">
    <h3 class="section-h">Aperçu liste de courses</h3>
    <p>${totalItems} articles dans ${list.length} rayons.</p>
  </div>
`;
```

- [ ] **Step 2: Passer `aisleOrder` dans `currentDefaults` depuis `app.js`**

```js
currentDefaults: {
  peopleGlobal: s.activeWeek?.peopleGlobal ?? s.preferences.defaultPeople,
  aisleOrder: s.preferences.aisleOrder
}
```

- [ ] **Step 3: Test manuel**

À l'étape 3, on lit "X articles dans Y rayons" — cohérent avec le menu choisi.

- [ ] **Step 4: Commit**

```bash
git add js/views/wizard.js app.js
git commit -m "feat(wizard): aperçu liste de courses à l'étape récap"
```

---

## Phase 7 — Swap modal

### Task 23: Modal de swap (filtré + voir tout + surprends-moi)

**Files:**
- Create: `js/views/swap-modal.js`
- Modify: `styles.css`
- Modify: `app.js`
- Modify: `js/views/wizard.js`

- [ ] **Step 1: Créer `js/views/swap-modal.js`**

```js
// js/views/swap-modal.js — modal pour remplacer une recette

export function openSwapModal({ data, slot, currentRecipeId, defaultConstraints, favorites, onPick }) {
  const root = document.getElementById('modal-root');
  // ne pas effacer si un autre modal est ouvert ; pour MVP on remplace
  const previousContent = root.innerHTML;
  const overlay = document.createElement('div');
  overlay.className = 'sheet-overlay';

  let showAll = false;

  function compatible(r) {
    if (showAll) return true;
    if (r.slot !== 'both' && r.slot !== slot) return false;
    for (const c of defaultConstraints ?? []) {
      if (!r.constraints?.includes(c)) return false;
    }
    return true;
  }

  function render() {
    const filtered = data.recipes.filter(compatible).filter(r => r.id !== currentRecipeId);
    const ordered = [
      ...filtered.filter(r => favorites.includes(r.id)),
      ...filtered.filter(r => !favorites.includes(r.id))
    ];
    overlay.innerHTML = `
      <div class="sheet sheet-tall" role="dialog" aria-modal="true">
        <button class="sheet-close" aria-label="Fermer">✕</button>
        <div class="sheet-body">
          <h2>Remplacer la recette</h2>
          <div class="swap-actions">
            <button class="btn-secondary" id="swap-all">${showAll ? 'Filtrer' : 'Voir tout le catalogue'}</button>
            <button class="btn-secondary" id="swap-random">🎲 Surprends-moi</button>
          </div>
          <ul class="swap-list">
            ${ordered.map(r => `
              <li data-id="${r.id}">
                <div class="swap-title">${favorites.includes(r.id) ? '★ ' : ''}${escapeHtml(r.title)}</div>
                <div class="swap-meta">${r.timeMin} min · ${(r.tags ?? []).slice(0,3).join(' · ')}</div>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    `;
    overlay.querySelector('.sheet-close').addEventListener('click', close);
    overlay.querySelector('#swap-all').addEventListener('click', () => { showAll = !showAll; render(); });
    overlay.querySelector('#swap-random').addEventListener('click', () => {
      if (ordered.length === 0) return;
      const pick = ordered[Math.floor(Math.random() * ordered.length)];
      onPick(pick.id);
      close();
    });
    overlay.querySelectorAll('.swap-list li').forEach(li => {
      li.addEventListener('click', () => {
        onPick(li.dataset.id);
        close();
      });
    });
  }

  function close() { root.innerHTML = previousContent; }

  root.appendChild(overlay);
  render();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
```

- [ ] **Step 2: CSS additionnel**

```css
.sheet-tall { max-height: 95vh; }
.swap-actions { display: flex; gap: 8px; margin: 12px 0 16px; }
.swap-actions .btn-secondary { flex: 1; padding: 10px; font-size: 14px; }
.swap-list { list-style: none; }
.swap-list li {
  padding: 12px 0;
  border-bottom: 1px solid var(--separator);
  cursor: pointer;
}
.swap-title { font-size: 16px; }
.swap-meta { font-size: 13px; color: var(--text-muted); margin-top: 2px; }
```

- [ ] **Step 3: Brancher dans `app.js` (Semaine view)**

Remplacer le `prompt` dans `onMealAction` cas `'swap'` par l'ouverture du swap modal :

```js
onMealAction: (day, slot) => {
  const action = prompt('Action : "cooked" / "swap" / annuler');
  if (action === 'cooked') { /* ... inchangé ... */ }
  else if (action === 'swap') {
    const s = state.load();
    const meal = s.activeWeek.days.find(x => x.day === day)[slot];
    const menu = s.activeWeek.menuId ? _dataCache.menusById[s.activeWeek.menuId] : null;
    openSwapModal({
      data: _dataCache,
      slot,
      currentRecipeId: meal?.recipeId,
      defaultConstraints: menu?.defaultConstraints,
      favorites: s.preferences.favorites,
      onPick: (newId) => {
        state.mutate(d => {
          const dayObj = d.activeWeek.days.find(x => x.day === day);
          dayObj[slot] = { recipeId: newId, peopleOverride: null, cooked: false };
        });
        rerender();
      }
    });
  }
}
```

- [ ] **Step 4: Brancher dans le wizard (Step 2)**

Remplacer le `prompt` dans `onPickRecipeForSlot` :
```js
onPickRecipeForSlot: (day, slot, draft, done) => {
  const currentId = draft.days.find(d => d.day === day)[slot]?.recipeId;
  const menu = draft.menuId ? _dataCache.menusById[draft.menuId] : null;
  openSwapModal({
    data: _dataCache,
    slot,
    currentRecipeId: currentId,
    defaultConstraints: menu?.defaultConstraints,
    favorites: state.load().preferences.favorites,
    onPick: (newId) => done(newId)
  });
}
```

- [ ] **Step 5: Test manuel**

- Depuis la vue Semaine : ⋯ → "swap" → modal s'ouvre filtré. Sélectionner → la recette change.
- Bouton "Voir tout" → liste complète.
- Bouton "🎲 Surprends-moi" → pioche au hasard.
- Depuis le wizard Step 2 : tap sur un repas → swap modal → sélection met à jour le draft.

- [ ] **Step 6: Commit**

```bash
git add js/views/swap-modal.js styles.css app.js
git commit -m "feat(swap): modal de remplacement filtré + voir tout + random"
```

---

## Phase 8 — Vue Courses

### Task 24: Vue Courses — rendu de base

**Files:**
- Create: `js/views/courses.js`
- Modify: `styles.css`
- Modify: `app.js`

- [ ] **Step 1: Créer `js/views/courses.js`**

```js
// js/views/courses.js — rendu de l'onglet liste de courses

import { buildShoppingList } from '../shopping.js';
import { ingredientKey } from '../keys.js';
import { formatQty } from '../utils.js';

export function renderCourses(container, { state, data, callbacks }) {
  container.innerHTML = '';
  if (!state.activeWeek) {
    container.innerHTML = `<p class="empty-text">Démarre une semaine pour générer ta liste de courses.</p>`;
    return;
  }
  const list = buildShoppingList(state.activeWeek, data.recipesById, state.preferences.aisleOrder);
  const totalItems = list.reduce((s, c) => s + c.items.filter(i => !state.shoppingList.inStock[ingredientKey(i)]).length, 0);

  const header = document.createElement('div');
  header.className = 'courses-header';
  header.innerHTML = `
    <div class="courses-stats">${totalItems} articles · ${list.length} rayons</div>
    <div class="courses-actions">
      <button class="btn-secondary" id="btn-shopping-mode">🔍 Supermarché</button>
      <button class="btn-secondary" id="btn-share">📤 Partager</button>
      <button class="btn-secondary" id="btn-uncheck-all">Tout décocher</button>
    </div>
  `;
  header.querySelector('#btn-shopping-mode').addEventListener('click', callbacks.onShoppingMode);
  header.querySelector('#btn-share').addEventListener('click', callbacks.onShare);
  header.querySelector('#btn-uncheck-all').addEventListener('click', callbacks.onUncheckAll);
  container.appendChild(header);

  for (const cat of list) {
    container.appendChild(renderCategory(cat, state, callbacks));
  }
}

function renderCategory(cat, state, callbacks) {
  const section = document.createElement('section');
  section.className = 'course-cat';
  section.dataset.category = cat.category;
  section.innerHTML = `
    <header class="cat-head" draggable="true">
      <span class="cat-drag">⋮⋮</span>
      <h3>${labelForCategory(cat.category)}</h3>
    </header>
    <ul class="cat-list">
      ${cat.items.map(item => {
        const k = ingredientKey(item);
        const checked = state.shoppingList.checked[k];
        const inStock = state.shoppingList.inStock[k];
        if (inStock) return '';
        return `
          <li class="${checked ? 'checked' : ''}" data-key="${k}">
            <span class="check"></span>
            <span class="item-name">${escapeHtml(item.name)}</span>
            <span class="item-qty">${formatQty(item)}</span>
          </li>
        `;
      }).join('')}
    </ul>
  `;
  section.querySelectorAll('li').forEach(li => {
    li.addEventListener('click', () => callbacks.onToggleChecked(li.dataset.key));
    let pressTimer;
    li.addEventListener('pointerdown', () => {
      pressTimer = setTimeout(() => callbacks.onMarkInStock(li.dataset.key), 600);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(e => li.addEventListener(e, () => clearTimeout(pressTimer)));
  });
  return section;
}

const LABELS = {
  'fruits-legumes': '🥬 Fruits & légumes',
  'viandes-poissons': '🐟 Viandes & poissons',
  'pains-pates': '🥖 Pains & pâtes',
  'frais': '🥚 Frais',
  'epicerie': '🍝 Épicerie',
  'epices': '🫒 Épices & huiles',
  'en-cas': '🥜 En-cas'
};
function labelForCategory(c) { return LABELS[c] ?? c; }

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
```

- [ ] **Step 2: CSS**

```css
.empty-text { text-align: center; color: var(--text-muted); padding: 48px 16px; }
.courses-header { margin-bottom: 12px; }
.courses-stats { color: var(--text-muted); font-size: 13px; margin-bottom: 8px; }
.courses-actions { display: flex; gap: 8px; }
.courses-actions .btn-secondary { padding: 8px 12px; font-size: 13px; flex: 1; }
.course-cat {
  background: var(--surface);
  border-radius: var(--radius-card);
  padding: 12px 16px;
  margin-bottom: 12px;
  box-shadow: var(--shadow-card);
}
.cat-head {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: grab;
}
.cat-drag { color: var(--text-muted); font-size: 14px; }
.cat-head h3 { font-size: 15px; font-weight: 600; }
.cat-list { list-style: none; margin-top: 8px; }
.cat-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid var(--separator);
  cursor: pointer;
}
.cat-list li:first-child { border-top: none; }
.check {
  width: 22px; height: 22px;
  border: 1.5px solid var(--text-muted);
  border-radius: 50%;
  flex-shrink: 0;
  position: relative;
}
.cat-list li.checked { opacity: 0.45; }
.cat-list li.checked .item-name { text-decoration: line-through; }
.cat-list li.checked .check {
  background: var(--accent);
  border-color: var(--accent);
}
.cat-list li.checked .check::after {
  content: '✓';
  color: white;
  position: absolute;
  inset: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px;
}
.item-name { flex: 1; }
.item-qty { color: var(--text-muted); font-variant-numeric: tabular-nums; font-size: 14px; }
```

- [ ] **Step 3: Brancher dans `app.js`**

```js
import { renderCourses } from './js/views/courses.js';

// dans rerender callbacks, ajouter :
onToggleChecked: (k) => {
  state.mutate(d => { d.shoppingList.checked[k] = !d.shoppingList.checked[k]; });
  rerender();
},
onMarkInStock: (k) => {
  state.mutate(d => { d.shoppingList.inStock[k] = true; });
  rerender();
},
onUncheckAll: () => {
  state.mutate(d => { d.shoppingList.checked = {}; });
  rerender();
},
onShare: () => console.log('TODO: share'),
onShoppingMode: () => console.log('TODO: shopping mode')

// dans rerender(), ajouter :
renderCourses(document.getElementById('view-courses'), { state: s, data: _dataCache, callbacks });
```

- [ ] **Step 4: Test manuel**

Aller sur l'onglet Courses : liste agrégée s'affiche, cochage marche, long-press masque l'item (in stock).

- [ ] **Step 5: Commit**

```bash
git add js/views/courses.js styles.css app.js
git commit -m "feat(courses): rendu liste par rayon + check + long-press in-stock"
```

---

### Task 25: Drag&drop pour réordonner les rayons

**Files:**
- Modify: `js/views/courses.js`

- [ ] **Step 1: Ajouter drag handlers sur `.cat-head`**

Au bas de `renderCourses`, après avoir ajouté toutes les sections :

```js
let draggedCategory = null;
container.querySelectorAll('.course-cat').forEach(section => {
  const head = section.querySelector('.cat-head');
  head.addEventListener('dragstart', e => {
    draggedCategory = section.dataset.category;
    e.dataTransfer.effectAllowed = 'move';
    section.classList.add('dragging');
  });
  head.addEventListener('dragend', () => {
    section.classList.remove('dragging');
    draggedCategory = null;
  });
  section.addEventListener('dragover', e => { e.preventDefault(); });
  section.addEventListener('drop', e => {
    e.preventDefault();
    if (!draggedCategory || draggedCategory === section.dataset.category) return;
    callbacks.onReorderAisles(draggedCategory, section.dataset.category);
  });
});
```

- [ ] **Step 2: Callback dans `app.js`**

```js
onReorderAisles: (movedCat, targetCat) => {
  state.mutate(d => {
    const order = d.preferences.aisleOrder.slice();
    const fromIdx = order.indexOf(movedCat);
    const toIdx = order.indexOf(targetCat);
    order.splice(fromIdx, 1);
    order.splice(toIdx, 0, movedCat);
    d.preferences.aisleOrder = order;
  });
  rerender();
}
```

- [ ] **Step 3: CSS pour `.dragging`**

```css
.course-cat.dragging { opacity: 0.5; }
```

- [ ] **Step 4: Test manuel**

Sur desktop : drag&drop d'une catégorie sur une autre → ordre change. (Sur mobile iOS, le drag HTML5 ne marche pas — accepter pour le MVP, on aura un fallback "boutons monter/descendre" en polish.)

- [ ] **Step 5: Ajouter fallback boutons mobiles**

Dans `.cat-head`, ajouter avant `<h3>` :
```html
<button class="cat-move" data-dir="-1" aria-label="Monter">▲</button>
<button class="cat-move" data-dir="+1" aria-label="Descendre">▼</button>
```

CSS :
```css
.cat-move { background: none; border: none; padding: 2px 4px; color: var(--text-muted); cursor: pointer; font-size: 11px; }
```

Handler :
```js
head.querySelectorAll('.cat-move').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    callbacks.onMoveAisle(section.dataset.category, parseInt(btn.dataset.dir, 10));
  });
});
```

Callback dans `app.js` :
```js
onMoveAisle: (cat, dir) => {
  state.mutate(d => {
    const order = d.preferences.aisleOrder.slice();
    const i = order.indexOf(cat);
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    d.preferences.aisleOrder = order;
  });
  rerender();
}
```

- [ ] **Step 6: Commit**

```bash
git add js/views/courses.js styles.css app.js
git commit -m "feat(courses): drag&drop rayons (desktop) + boutons ▲▼ (mobile)"
```

---

### Task 26: Mode "supermarché"

**Files:**
- Modify: `js/views/courses.js`
- Modify: `styles.css`
- Modify: `app.js`

- [ ] **Step 1: Wake lock helper**

Dans `js/ui/shopping-mode.js` :

```js
let wakeLock = null;

export async function enterShoppingMode() {
  document.body.classList.add('shopping-mode');
  if ('wakeLock' in navigator) {
    try { wakeLock = await navigator.wakeLock.request('screen'); } catch {}
  }
}

export async function exitShoppingMode() {
  document.body.classList.remove('shopping-mode');
  if (wakeLock) { try { await wakeLock.release(); } catch {} wakeLock = null; }
}
```

- [ ] **Step 2: CSS du mode**

```css
body.shopping-mode {
  background: #000;
  color: #fff;
}
body.shopping-mode .tab-bar,
body.shopping-mode .app-header,
body.shopping-mode .courses-header {
  display: none;
}
body.shopping-mode #view-courses {
  padding: 16px;
}
body.shopping-mode .course-cat {
  background: #1c1c1e;
  box-shadow: none;
}
body.shopping-mode .cat-head h3 { font-size: 24px; }
body.shopping-mode .item-name { font-size: 22px; }
body.shopping-mode .item-qty { font-size: 18px; color: #8e8e93; }
body.shopping-mode .check { width: 32px; height: 32px; border-width: 2px; }
body.shopping-mode .cat-list li { padding: 16px 0; }
body.shopping-mode .shopping-exit {
  position: fixed; top: env(safe-area-inset-top); right: 12px;
  background: #fff; color: #000;
  border: none; padding: 10px 16px;
  border-radius: 20px; font-size: 15px; font-weight: 600;
  z-index: 30; cursor: pointer;
}
```

- [ ] **Step 3: Bouton de sortie**

Dans `app.js` `onShoppingMode` :

```js
import { enterShoppingMode, exitShoppingMode } from './js/ui/shopping-mode.js';

onShoppingMode: () => {
  enterShoppingMode();
  let exitBtn = document.querySelector('.shopping-exit');
  if (!exitBtn) {
    exitBtn = document.createElement('button');
    exitBtn.className = 'shopping-exit';
    exitBtn.textContent = 'Sortir';
    exitBtn.addEventListener('click', () => {
      exitShoppingMode();
      exitBtn.remove();
    });
    document.body.appendChild(exitBtn);
  }
}
```

- [ ] **Step 4: Test manuel**

Bouton "Supermarché" → fond noir, typo grande, tab bar cachée, bouton "Sortir" en haut droite. Sortir → retour normal.

- [ ] **Step 5: Commit**

```bash
git add js/ui/shopping-mode.js js/views/courses.js styles.css app.js
git commit -m "feat(courses): mode supermarché grande typo + wake lock"
```

---

### Task 27: Partage natif iOS

**Files:**
- Create: `js/ui/share.js`
- Modify: `app.js`

- [ ] **Step 1: Créer `js/ui/share.js`**

```js
// js/ui/share.js — partage natif de la liste de courses

import { formatQty } from '../utils.js';
import { ingredientKey } from '../keys.js';

const LABELS = {
  'fruits-legumes': '🥬 Fruits & légumes',
  'viandes-poissons': '🐟 Viandes & poissons',
  'pains-pates': '🥖 Pains & pâtes',
  'frais': '🥚 Frais',
  'epicerie': '🍝 Épicerie',
  'epices': '🫒 Épices & huiles',
  'en-cas': '🥜 En-cas'
};

export function shoppingListToText(list, state) {
  const date = new Date(state.activeWeek.startedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  let out = `Liste de courses · Semaine du ${date} · ${state.activeWeek.peopleGlobal} personnes\n`;
  for (const cat of list) {
    const visible = cat.items.filter(i => !state.shoppingList.inStock[ingredientKey(i)]);
    if (visible.length === 0) continue;
    out += `\n${LABELS[cat.category] ?? cat.category}\n`;
    for (const item of visible) {
      out += `- ${item.name} ${formatQty(item)}\n`;
    }
  }
  return out;
}

export async function shareShoppingList(list, state) {
  const text = shoppingListToText(list, state);
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Liste de courses', text });
      return 'shared';
    } catch (e) {
      if (e.name === 'AbortError') return 'cancelled';
    }
  }
  // fallback : copie
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}
```

- [ ] **Step 2: Brancher dans `app.js`**

```js
import { shareShoppingList } from './js/ui/share.js';
import { buildShoppingList } from './js/shopping.js';

onShare: async () => {
  const s = state.load();
  if (!s.activeWeek) return;
  const list = buildShoppingList(s.activeWeek, _dataCache.recipesById, s.preferences.aisleOrder);
  const result = await shareShoppingList(list, s);
  if (result === 'copied') alert('Liste copiée dans le presse-papier');
}
```

- [ ] **Step 3: Test manuel**

Sur iPhone Safari : bouton "Partager" → ouvre l'iOS share sheet. Sur desktop Chrome : copie dans le presse-papier + alert.

- [ ] **Step 4: Commit**

```bash
git add js/ui/share.js app.js
git commit -m "feat(courses): partage natif iOS + fallback presse-papier"
```

---

## Phase 9 — Bibliothèque

### Task 28: Vue Recettes — grille + recherche

**Files:**
- Create: `js/views/recettes.js`
- Modify: `styles.css`
- Modify: `app.js`

- [ ] **Step 1: Créer `js/views/recettes.js`**

```js
// js/views/recettes.js — bibliothèque consultable

let _query = '';
let _activeFilters = { slot: 'all', maxTime: null, tag: null, favoritesOnly: false };

export function renderRecettes(container, { state, data, callbacks }) {
  container.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'recettes-header';
  header.innerHTML = `
    <input type="search" class="search-input" placeholder="Rechercher une recette ou un ingrédient…" value="${escapeAttr(_query)}">
    <div class="filter-chips">
      <button class="chip ${_activeFilters.slot === 'all' ? 'active' : ''}" data-slot="all">Tout</button>
      <button class="chip ${_activeFilters.slot === 'lunch' ? 'active' : ''}" data-slot="lunch">Midi</button>
      <button class="chip ${_activeFilters.slot === 'dinner' ? 'active' : ''}" data-slot="dinner">Soir</button>
      <button class="chip ${_activeFilters.favoritesOnly ? 'active' : ''}" data-fav="1">★ Favoris</button>
    </div>
  `;
  header.querySelector('.search-input').addEventListener('input', e => {
    _query = e.target.value.trim().toLowerCase();
    renderGrid();
  });
  header.querySelectorAll('[data-slot]').forEach(btn => {
    btn.addEventListener('click', () => {
      _activeFilters.slot = btn.dataset.slot;
      renderRecettes(container, { state, data, callbacks });
    });
  });
  header.querySelector('[data-fav]').addEventListener('click', () => {
    _activeFilters.favoritesOnly = !_activeFilters.favoritesOnly;
    renderRecettes(container, { state, data, callbacks });
  });
  container.appendChild(header);

  const gridWrap = document.createElement('div');
  gridWrap.className = 'recettes-grid';
  container.appendChild(gridWrap);

  function renderGrid() {
    const filtered = data.recipes.filter(r => {
      if (_activeFilters.slot !== 'all' && r.slot !== _activeFilters.slot && r.slot !== 'both') return false;
      if (_activeFilters.favoritesOnly && !state.preferences.favorites.includes(r.id)) return false;
      if (_query) {
        const hay = (r.title + ' ' + (r.ingredients ?? []).map(i => i.name).join(' ')).toLowerCase();
        if (!hay.includes(_query)) return false;
      }
      return true;
    });
    gridWrap.innerHTML = filtered.map(r => `
      <article class="recipe-card" data-id="${r.id}">
        <h3>${state.preferences.favorites.includes(r.id) ? '★ ' : ''}${escapeHtml(r.title)}</h3>
        <p class="card-meta">${r.timeMin} min · ${(r.tags ?? []).slice(0, 2).join(' · ')}</p>
      </article>
    `).join('') || '<p class="empty-text">Aucune recette ne correspond.</p>';
    gridWrap.querySelectorAll('.recipe-card').forEach(c => {
      c.addEventListener('click', () => callbacks.onOpenRecipeStandalone(c.dataset.id));
    });
  }
  renderGrid();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function escapeAttr(s) { return escapeHtml(s); }
```

- [ ] **Step 2: CSS**

```css
.recettes-header { margin-bottom: 16px; }
.search-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--separator);
  border-radius: 10px;
  font: inherit;
  background: var(--surface);
}
.filter-chips {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  margin-top: 12px;
  padding-bottom: 4px;
}
.chip {
  background: var(--surface);
  border: 1px solid var(--separator);
  padding: 6px 12px;
  border-radius: 16px;
  font: inherit;
  font-size: 13px;
  white-space: nowrap;
  cursor: pointer;
}
.chip.active { background: var(--accent); color: white; border-color: var(--accent); }
.recettes-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}
@media (min-width: 600px) { .recettes-grid { grid-template-columns: 1fr 1fr; } }
@media (min-width: 900px) { .recettes-grid { grid-template-columns: 1fr 1fr 1fr; } }
.recipe-card {
  background: var(--surface);
  border-radius: var(--radius-card);
  padding: 16px;
  box-shadow: var(--shadow-card);
  cursor: pointer;
}
.recipe-card h3 { font-size: 16px; font-weight: 600; line-height: 1.3; }
.card-meta { font-size: 13px; color: var(--text-muted); margin-top: 6px; }
```

- [ ] **Step 3: Brancher dans `app.js`**

```js
import { renderRecettes } from './js/views/recettes.js';

// nouveau callback pour ouvrir une recette hors contexte semaine
onOpenRecipeStandalone: (recipeId) => {
  const s = state.load();
  const recipe = _dataCache.recipesById[recipeId];
  openRecipeModal({
    recipe,
    peopleEffective: s.preferences.defaultPeople,
    isFavorite: s.preferences.favorites.includes(recipeId),
    note: s.activeWeek?.notes[recipeId],
    isCooked: false,
    callbacks: {
      onToggleFavorite: () => {
        state.mutate(d => {
          const i = d.preferences.favorites.indexOf(recipeId);
          if (i >= 0) d.preferences.favorites.splice(i, 1);
          else d.preferences.favorites.push(recipeId);
        });
        rerender();
      },
      onPeopleOverride: () => {}, // pas applicable hors semaine
      onNoteChange: () => {}, // pas applicable hors semaine
      onToggleCooked: () => {} // pas applicable
    }
  });
}

// dans rerender() :
renderRecettes(document.getElementById('view-recettes'), { state: s, data: _dataCache, callbacks });
```

- [ ] **Step 4: Test manuel**

Onglet Recettes → liste des 14 recettes. Recherche "thon" → wrap + niçoise. Filtre "Midi" → seulement les déjeuners. Tap → modal recette s'ouvre.

- [ ] **Step 5: Commit**

```bash
git add js/views/recettes.js styles.css app.js
git commit -m "feat(recettes): bibliothèque consultable avec recherche + filtres slot/favoris"
```

---

### Task 29: Filtres avancés (temps + tag + saison)

**Files:**
- Modify: `js/views/recettes.js`

- [ ] **Step 1: Ajouter chips temps + select tag**

Dans `renderRecettes`, étendre le HTML `.filter-chips` :

```html
<button class="chip ${_activeFilters.maxTime === 15 ? 'active' : ''}" data-time="15">≤ 15 min</button>
<button class="chip ${_activeFilters.maxTime === 20 ? 'active' : ''}" data-time="20">≤ 20 min</button>
<button class="chip ${_activeFilters.maxTime === 30 ? 'active' : ''}" data-time="30">≤ 30 min</button>
```

Handler :
```js
header.querySelectorAll('[data-time]').forEach(btn => {
  btn.addEventListener('click', () => {
    const v = parseInt(btn.dataset.time, 10);
    _activeFilters.maxTime = _activeFilters.maxTime === v ? null : v;
    renderRecettes(container, { state, data, callbacks });
  });
});
```

Et étendre le filtre :
```js
if (_activeFilters.maxTime && r.timeMin > _activeFilters.maxTime) return false;
```

- [ ] **Step 2: Test manuel**

Filtre ≤ 15 min → seulement les recettes rapides.

- [ ] **Step 3: Commit**

```bash
git add js/views/recettes.js
git commit -m "feat(recettes): filtres par temps de cuisine"
```

---

## Phase 10 — Features additionnelles

### Task 30: Substitutions d'ingrédients

**Files:**
- Modify: `js/views/recipe-modal.js`
- Modify: `styles.css`

- [ ] **Step 1: Rendre les ingrédients cliquables si `substitutes` non vide**

Dans la liste d'ingrédients du modal :
```js
recipe.ingredients.map(ing => {
  const scaled = scaleIngredient(ing, recipe.basePeople, peopleEffective);
  const hasSubs = (ing.substitutes ?? []).length > 0;
  return `<li class="ing ${hasSubs ? 'has-subs' : ''}" data-name="${escapeAttr(ing.name)}">
    <span class="ing-qty">${formatQty(scaled)}</span>
    <span class="ing-name">${escapeHtml(scaled.name)}${hasSubs ? ' <span class="subs-hint">↻</span>' : ''}</span>
  </li>`;
}).join('')
```

Event :
```js
sheet.querySelectorAll('.ing.has-subs').forEach(li => {
  li.addEventListener('click', () => {
    const name = li.dataset.name;
    const ing = recipe.ingredients.find(i => i.name === name);
    const choice = prompt(`Remplacer "${name}" par :\n${ing.substitutes.join('\n')}\n\nÉcris le nom exact :`);
    if (choice && ing.substitutes.includes(choice)) {
      callbacks.onSubstitute(name, choice);
    }
  });
});
```

*(Le `prompt` est volontairement basique pour le MVP. Un select propre arrivera en polish.)*

- [ ] **Step 2: CSS hint**

```css
.subs-hint { font-size: 12px; color: var(--accent); margin-left: 4px; }
.ing.has-subs { cursor: pointer; }
```

- [ ] **Step 3: Callback dans `app.js`**

Modifier `onOpenRecipe` pour passer `onSubstitute` :
```js
onSubstitute: (origName, newName) => {
  // Stocker la subst au niveau du meal courant.
  // Schema : meal.substitutes = { origName: newName }
  state.mutate(d => {
    const dayObj = d.activeWeek.days.find(x => x.day === day);
    const meal = dayObj[slot];
    meal.substitutes = meal.substitutes ?? {};
    meal.substitutes[origName] = newName;
  });
  // re-ouvrir le modal avec ingrédients substitués (faut adapter le rendu pour appliquer subs)
  rerender();
}
```

Adapter `renderSemaine` + `buildShoppingList` pour appliquer les substitutions :
- Quand on lit les `ingredients` d'une recette pour rendu ou agrégation, mapper `name → meal.substitutes[name] ?? name`.

Refactor : ajouter un helper `effectiveIngredients(recipe, meal)` dans `js/shopping.js` :
```js
export function effectiveIngredients(recipe, meal) {
  const subs = meal?.substitutes ?? {};
  return recipe.ingredients.map(ing => subs[ing.name] ? { ...ing, name: subs[ing.name] } : ing);
}
```

Et `buildShoppingList` doit l'utiliser à la place de `recipe.ingredients`.

- [ ] **Step 4: Test manuel**

Ouvrir une recette avec `substitutes`, taper sur l'ingrédient, choisir une alternative → ingrédient remplacé dans la recette et dans la liste de courses.

- [ ] **Step 5: Commit**

```bash
git add js/views/recipe-modal.js js/shopping.js styles.css app.js
git commit -m "feat(substitutions): swap d'ingrédients par alternative pour la semaine en cours"
```

---

### Task 31: Badges de saisonnalité

**Files:**
- Modify: `js/views/recipe-modal.js`
- Create: `js/seasonality.js`

- [ ] **Step 1: Helper `isInSeason`**

```js
// js/seasonality.js
const MONTHS = ['janvier','fevrier','mars','avril','mai','juin','juillet','aout','septembre','octobre','novembre','decembre'];

export function currentMonthFr() {
  return MONTHS[new Date().getMonth()];
}

export function isInSeason(ingredientName, seasonality) {
  const key = ingredientName.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const months = seasonality[key] ?? seasonality[key.split(' ')[0]];
  if (!months) return false;
  return months.includes(currentMonthFr());
}
```

- [ ] **Step 2: Afficher le badge dans le modal**

Dans la liste d'ingrédients :
```js
const inSeason = isInSeason(ing.name, data.seasonality);
return `<li class="ing ${hasSubs ? 'has-subs' : ''}" data-name="${escapeAttr(ing.name)}">
  <span class="ing-qty">${formatQty(scaled)}</span>
  <span class="ing-name">${escapeHtml(scaled.name)}${inSeason ? ' 🌱' : ''}${hasSubs ? ' <span class="subs-hint">↻</span>' : ''}</span>
</li>`;
```

(Passer `data` au modal : ajouter `data` dans la signature et la chaîne d'appels.)

- [ ] **Step 3: Test manuel**

En mai (mois actuel) : tomates cerises, courgettes, concombres → badge 🌱.

- [ ] **Step 4: Commit**

```bash
git add js/seasonality.js js/views/recipe-modal.js app.js
git commit -m "feat(saisonnalité): badge 🌱 sur les ingrédients de saison"
```

---

### Task 32: Timer intégré

**Files:**
- Create: `js/ui/timer.js`
- Modify: `js/views/recipe-modal.js`
- Modify: `styles.css`

- [ ] **Step 1: Créer `js/ui/timer.js`**

```js
// js/ui/timer.js — timers empilés en bannière

const timers = new Map(); // id -> { label, endsAt, interval }
let bannerEl;

function ensureBanner() {
  if (bannerEl) return bannerEl;
  bannerEl = document.createElement('div');
  bannerEl.id = 'timer-banner';
  document.body.appendChild(bannerEl);
  return bannerEl;
}

export function startTimer(label, durationMin) {
  const id = Date.now() + Math.random();
  const endsAt = Date.now() + durationMin * 60 * 1000;
  timers.set(id, { label, endsAt });
  render();
  const interval = setInterval(() => {
    if (Date.now() >= timers.get(id).endsAt) {
      clearInterval(interval);
      notifyFinished(label);
      timers.delete(id);
      render();
    } else {
      render();
    }
  }, 1000);
  timers.get(id).interval = interval;
}

function notifyFinished(label) {
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  try { new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAESsAAABAAgAZGF0YQAAAAA=').play(); } catch {}
  alert(`⏰ Timer "${label}" terminé !`);
}

function render() {
  const banner = ensureBanner();
  if (timers.size === 0) { banner.innerHTML = ''; banner.style.display = 'none'; return; }
  banner.style.display = 'block';
  banner.innerHTML = Array.from(timers.entries()).map(([id, t]) => {
    const remain = Math.max(0, t.endsAt - Date.now());
    const m = Math.floor(remain / 60000);
    const s = Math.floor((remain % 60000) / 1000);
    return `<div class="timer-row">⏱ ${escapeHtml(t.label)} <strong>${m}:${String(s).padStart(2,'0')}</strong> <button data-id="${id}">✕</button></div>`;
  }).join('');
  banner.querySelectorAll('button').forEach(b => {
    b.addEventListener('click', () => {
      const id = parseFloat(b.dataset.id);
      clearInterval(timers.get(id).interval);
      timers.delete(id);
      render();
    });
  });
}

function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
```

- [ ] **Step 2: CSS**

```css
#timer-banner {
  position: fixed;
  bottom: calc(56px + env(safe-area-inset-bottom));
  left: 12px; right: 12px;
  background: rgba(28, 28, 30, 0.95);
  color: white;
  border-radius: 12px;
  padding: 8px 12px;
  z-index: 50;
  display: none;
  font-size: 14px;
}
.timer-row { display: flex; align-items: center; gap: 8px; padding: 4px 0; }
.timer-row strong { font-variant-numeric: tabular-nums; }
.timer-row button { margin-left: auto; background: none; border: none; color: white; cursor: pointer; font-size: 16px; }
```

- [ ] **Step 3: Détection des durées dans les steps**

Dans `recipe-modal.js`, étendre la transformation des steps :

```js
import { startTimer } from '../ui/timer.js';

// ...
recipe.steps.map((s, i) => {
  const enriched = s.replace(/\b(\d+)\s*(min|minutes)\b/g, (m, n) => `<button class="timer-trigger" data-min="${n}" data-label="${escapeAttr(recipe.title.slice(0, 24))}">⏱ ${m}</button>`);
  return `<li>${enriched}</li>`;
}).join('')

// puis :
sheet.querySelectorAll('.timer-trigger').forEach(b => {
  b.addEventListener('click', e => {
    e.stopPropagation();
    startTimer(b.dataset.label, parseInt(b.dataset.min, 10));
  });
});
```

- [ ] **Step 4: CSS pour le bouton inline**

```css
.timer-trigger {
  background: rgba(255, 149, 0, 0.15);
  color: var(--accent);
  border: none;
  padding: 2px 8px;
  border-radius: 12px;
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}
```

- [ ] **Step 5: Test manuel**

Ouvrir une recette, taper sur "⏱ 12 min" dans une étape → banner avec compte à rebours. Démarrer un autre timer en parallèle. À expiration : alert + vibration.

- [ ] **Step 6: Commit**

```bash
git add js/ui/timer.js js/views/recipe-modal.js styles.css
git commit -m "feat(timer): timers empilés en bannière déclenchés depuis les étapes"
```

---

## Phase 11 — PWA

### Task 33: Manifest + icônes

**Files:**
- Create: `manifest.json`
- Create: `icons/icon-192.png`
- Create: `icons/icon-512.png`
- Create: `icons/apple-touch-icon.png`
- Modify: `index.html`

- [ ] **Step 1: Créer `manifest.json`**

```json
{
  "name": "Menu Hebdo",
  "short_name": "Menu",
  "start_url": ".",
  "scope": ".",
  "display": "standalone",
  "background_color": "#f2f2f7",
  "theme_color": "#ff9500",
  "orientation": "portrait",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

- [ ] **Step 2: Générer les icônes**

Approche simple : créer un SVG temporaire et le convertir.

```bash
cat > /tmp/icon.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#ff9500"/>
  <text x="256" y="340" font-family="-apple-system,system-ui,sans-serif" font-weight="900" font-size="280" text-anchor="middle" fill="white">M</text>
</svg>
SVG
# si rsvg-convert dispo :
which rsvg-convert && rsvg-convert -w 192 -h 192 /tmp/icon.svg -o icons/icon-192.png
which rsvg-convert && rsvg-convert -w 512 -h 512 /tmp/icon.svg -o icons/icon-512.png
which rsvg-convert && rsvg-convert -w 180 -h 180 /tmp/icon.svg -o icons/apple-touch-icon.png
# sinon, fallback avec sips macOS :
sips -z 192 192 /tmp/icon.png --out icons/icon-192.png 2>/dev/null || true
```

*Si aucune conversion automatique n'est dispo, créer trois PNG à la main (orange uni avec lettre M blanche). C'est juste pour le MVP — un designer peut faire mieux plus tard.*

- [ ] **Step 3: Ajouter les liens dans `index.html`**

Dans `<head>` :
```html
<link rel="icon" href="icons/icon-192.png" type="image/png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
```

- [ ] **Step 4: Test manuel**

Ouvrir l'app sur iPhone Safari → "Partager" → "Ajouter à l'écran d'accueil" → l'icône M sur fond orange apparaît sur le home screen. Lancer → mode standalone (pas de barre Safari).

- [ ] **Step 5: Commit**

```bash
git add manifest.json icons/ index.html
git commit -m "feat(pwa): manifest + icônes pour install à l'écran d'accueil"
```

---

### Task 34: Service worker

**Files:**
- Create: `sw.js`
- Modify: `app.js`

- [ ] **Step 1: Créer `sw.js`**

```js
// sw.js — service worker minimal cache-first

const CACHE = 'menu-hebdo-v1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './js/state.js',
  './js/data.js',
  './js/utils.js',
  './js/scaling.js',
  './js/shopping.js',
  './js/keys.js',
  './js/seasonality.js',
  './js/ui/tabs.js',
  './js/ui/timer.js',
  './js/ui/share.js',
  './js/ui/shopping-mode.js',
  './js/views/semaine.js',
  './js/views/courses.js',
  './js/views/recettes.js',
  './js/views/recipe-modal.js',
  './js/views/wizard.js',
  './js/views/swap-modal.js',
  './data/recipes.json',
  './data/menus.json',
  './data/seasonality.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(resp => {
        if (resp.ok) caches.open(CACHE).then(c => c.put(e.request, resp.clone()));
        return resp;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
```

- [ ] **Step 2: Enregistrement dans `app.js`**

En haut du `main()` :
```js
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(err => console.error('SW failed:', err));
}
```

- [ ] **Step 3: Test offline**

Servir l'app, l'ouvrir, attendre que le SW soit installé (DevTools → Application → Service Workers).
- Couper le réseau (DevTools → Network → Offline).
- Recharger → l'app charge normalement.

- [ ] **Step 4: Commit**

```bash
git add sw.js app.js
git commit -m "feat(pwa): service worker cache-first pour mode hors-ligne"
```

---

## Phase 12 — Historique

### Task 35: Voir et relancer une semaine passée

**Files:**
- Create: `js/views/history.js`
- Modify: `app.js`
- Modify: `styles.css`

- [ ] **Step 1: Créer `js/views/history.js`**

```js
// js/views/history.js — modal liste des semaines archivées

export function openHistory({ history, data, onRestart, onClose }) {
  const root = document.getElementById('modal-root');
  root.innerHTML = '';
  const overlay = document.createElement('div');
  overlay.className = 'sheet-overlay';
  overlay.innerHTML = `
    <div class="sheet" role="dialog" aria-modal="true">
      <button class="sheet-close" aria-label="Fermer">✕</button>
      <div class="sheet-body">
        <h2>Historique</h2>
        ${history.length === 0 ? '<p class="empty-text">Aucune semaine archivée.</p>' : `
          <ul class="history-list">
            ${history.slice().reverse().map((w, i) => {
              const real = history.length - 1 - i;
              const date = new Date(w.startedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
              const menuName = w.menuId ? data.menusById[w.menuId]?.name ?? 'Menu' : 'Composition libre';
              return `<li data-idx="${real}"><div class="hist-date">${date}</div><div class="hist-menu">${menuName}</div></li>`;
            }).join('')}
          </ul>
        `}
      </div>
    </div>
  `;
  overlay.querySelector('.sheet-close').addEventListener('click', () => { root.innerHTML = ''; onClose && onClose(); });
  overlay.querySelectorAll('.history-list li').forEach(li => {
    li.addEventListener('click', () => {
      if (confirm('Relancer cette semaine ? La semaine en cours sera archivée.')) {
        onRestart(parseInt(li.dataset.idx, 10));
        root.innerHTML = '';
      }
    });
  });
  root.appendChild(overlay);
}
```

- [ ] **Step 2: Bouton d'accès dans le header de Semaine**

Dans `renderWeek` (`js/views/semaine.js`), ajouter à droite du titre :

```html
<button class="btn-link" id="btn-history">Historique</button>
```

Handler : `callbacks.onOpenHistory()`.

- [ ] **Step 3: Brancher dans `app.js`**

```js
import { openHistory } from './js/views/history.js';

onOpenHistory: () => {
  const s = state.load();
  openHistory({
    history: s.history,
    data: _dataCache,
    onRestart: (idx) => {
      const week = JSON.parse(JSON.stringify(s.history[idx]));
      week.startedAt = new Date().toISOString().slice(0, 10);
      // reset cooked + checked
      week.days.forEach(d => { if (d.lunch) d.lunch.cooked = false; if (d.dinner) d.dinner.cooked = false; });
      state.archiveAndStart(week);
      rerender();
    }
  });
}
```

- [ ] **Step 4: CSS**

```css
.history-list { list-style: none; }
.history-list li { padding: 12px 0; border-bottom: 1px solid var(--separator); cursor: pointer; }
.hist-date { color: var(--text-muted); font-size: 13px; }
.hist-menu { font-size: 16px; }
```

- [ ] **Step 5: Test manuel**

Démarrer une semaine, en démarrer une autre, puis ouvrir Historique → liste avec date + menu. Relancer une → la semaine actuelle bascule, l'ancienne reprend.

- [ ] **Step 6: Commit**

```bash
git add js/views/history.js js/views/semaine.js styles.css app.js
git commit -m "feat(history): voir et relancer une semaine passée"
```

---

## Phase 13 — Theme switcher

### Task 36: Bascule iOS ⇄ Terracotta

**Files:**
- Modify: `styles.css`
- Create: `js/views/settings.js`
- Modify: `app.js`

- [ ] **Step 1: Encapsuler la palette terracotta dans `[data-theme="terracotta"]`**

Dans `styles.css`, ajouter en bas :

```css
[data-theme="terracotta"] {
  --bg: #f4ede0;
  --surface: #faf5ea;
  --text: #2a1f15;
  --text-secondary: #5c4a37;
  --text-muted: #5c4a37;
  --separator: #d4c4a8;
  --accent: #c2562a;
  --font-system: 'Fraunces', 'Times New Roman', serif;
}
[data-theme="terracotta"] .meal-label,
[data-theme="terracotta"] .section-h {
  font-family: 'DM Mono', 'Menlo', monospace;
  letter-spacing: 0.1em;
}
```

(Charger les Google Fonts si terracotta actif — `<link>` conditionnel via JS pour éviter de les charger inutilement.)

- [ ] **Step 2: Créer `js/views/settings.js`**

```js
// js/views/settings.js — petit modal de réglages

export function openSettings({ state, onChange }) {
  const root = document.getElementById('modal-root');
  root.innerHTML = '';
  const overlay = document.createElement('div');
  overlay.className = 'sheet-overlay';
  overlay.innerHTML = `
    <div class="sheet" role="dialog" aria-modal="true">
      <button class="sheet-close" aria-label="Fermer">✕</button>
      <div class="sheet-body">
        <h2>Réglages</h2>
        <label class="row">
          Thème
          <select id="theme-select">
            <option value="ios" ${state.preferences.theme === 'ios' ? 'selected' : ''}>iOS minimaliste</option>
            <option value="terracotta" ${state.preferences.theme === 'terracotta' ? 'selected' : ''}>Terracotta luxe</option>
          </select>
        </label>
        <label class="row">
          Par défaut, nombre de personnes
          <input type="number" min="1" max="12" id="def-people" value="${state.preferences.defaultPeople}">
        </label>
      </div>
    </div>
  `;
  overlay.querySelector('.sheet-close').addEventListener('click', () => { root.innerHTML = ''; });
  overlay.querySelector('#theme-select').addEventListener('change', e => onChange({ theme: e.target.value }));
  overlay.querySelector('#def-people').addEventListener('input', e => {
    const n = Math.max(1, Math.min(12, parseInt(e.target.value, 10) || 1));
    onChange({ defaultPeople: n });
  });
  root.appendChild(overlay);
}
```

- [ ] **Step 3: Appliquer le thème dynamiquement**

Dans `app.js`, ajouter en haut de `rerender()` :
```js
document.documentElement.dataset.theme = s.preferences.theme;
if (s.preferences.theme === 'terracotta' && !document.querySelector('link[data-terracotta]')) {
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.setAttribute('data-terracotta', '');
  l.href = 'https://fonts.googleapis.com/css2?family=Fraunces:wght@300;400;500;700&family=DM+Mono:wght@400&display=swap';
  document.head.appendChild(l);
}
```

- [ ] **Step 4: Accès au modal Settings**

Bouton ⚙ dans le header app :
```html
<header class="app-header">
  <h1 id="app-title">Menu Hebdo</h1>
  <button class="btn-link" id="btn-settings">⚙</button>
</header>
```

CSS :
```css
.app-header { display: flex; justify-content: space-between; align-items: center; }
```

JS dans `app.js` :
```js
import { openSettings } from './js/views/settings.js';

document.getElementById('btn-settings').addEventListener('click', () => {
  openSettings({
    state: state.load(),
    onChange: (patch) => {
      state.mutate(d => { Object.assign(d.preferences, patch); });
      rerender();
    }
  });
});
```

- [ ] **Step 5: Test manuel**

⚙ → Settings → bascule "Terracotta" → palette + fonts changent. Re-bascule "iOS" → revient au défaut.

- [ ] **Step 6: Commit**

```bash
git add js/views/settings.js styles.css index.html app.js
git commit -m "feat(theme): bascule iOS ⇄ terracotta + réglage défaut personnes"
```

---

## Phase 14 — Contenu

### Task 37: Lot 1 — Menu Asiatique express (~7 recettes + 1 menu)

**Files:**
- Modify: `data/recipes.json`
- Modify: `data/menus.json`

- [ ] **Step 1: Ajouter 7 recettes au format §3.1**

Exemples : `bo-bun-poulet`, `nouilles-soba-cacahuete`, `riz-saute-legumes`, `curry-coco-poisson`, `salade-mango-crevettes`, `dumplings-vapeur`, `pho-express-poulet`. Chacune avec ingrédients structurés et étapes claires.

- [ ] **Step 2: Ajouter le menu correspondant dans `menus.json`**

```json
{
  "id": "asiatique-express",
  "name": "Asiatique express",
  "theme": "Wok, herbes, citron vert",
  "defaultConstraints": ["sans-lactose"],
  "seasons": [],
  "days": [
    { "day": "Lundi", "lunch": "salade-mango-crevettes", "dinner": "bo-bun-poulet" },
    ...
  ]
}
```

- [ ] **Step 3: Valider**

Run: `npm test`
Expected: les tests `data.test.js` passent (toutes les références sont valides).

- [ ] **Step 4: Commit**

```bash
git add data/recipes.json data/menus.json
git commit -m "content: menu asiatique express + 7 recettes"
```

---

### Task 38-42: Lots de contenu

Répéter Task 37 pour chacun :

- **Task 38** : Menu Hiver réconfort (~8 recettes) — soupes, mijotés, plats au four (gratin patate douce, soupe lentilles corail, tartiflette sans lactose, etc.)
- **Task 39** : Menu Batch cooking dimanche (~8 recettes) — plats qui se conservent / réchauffent bien (chili sin carne, lasagnes courgettes, parmentier patate douce…)
- **Task 40** : Menu Végétarien complet (~8 recettes) — buddha bowl, dahl coco, falafels maison, etc.
- **Task 41** : Menu Express ≤ 20 min (~7 recettes) — pâtes ail-pignons, poêlée œufs/épinards, etc.
- **Task 42** : Menu Familial enfants + Menu Découverte fusion (~10 recettes au total) — pour atteindre la cible de 60+ recettes et 8+ menus.

Pour chacune :
- [ ] Rédiger les recettes en respectant le schéma
- [ ] Définir le menu
- [ ] `npm test` doit passer
- [ ] Commit dédié `content: <nom du menu>`

---

## Phase 15 — Deploy + QA

### Task 43: Checklist d'acceptance MVP

**Files:**
- Create: `docs/ACCEPTANCE.md`

- [ ] **Step 1: Créer la checklist**

```markdown
# MVP Acceptance Checklist

À cocher au fil des vérifications manuelles sur iPhone Safari et desktop Chrome.

## Navigation
- [ ] Les 3 onglets fonctionnent et persistent leur état
- [ ] Le wizard "Démarrer ma semaine" couvre les 3 étapes
- [ ] Le swipe right revient à l'étape précédente du wizard

## Données
- [ ] Au moins 60 recettes dans recipes.json
- [ ] Au moins 8 menus dans menus.json
- [ ] `npm test` passe en entier

## Logique
- [ ] Curseur global change toutes les quantités cohéremment
- [ ] Override personnes par recette n'impacte que la recette
- [ ] Liste de courses agrège correctement
- [ ] Substitutions mettent à jour ingrédients ET liste
- [ ] Arrondi correct : gousses entières, g par paliers, cs au demi

## UI
- [ ] Mode supermarché grande typo fond noir
- [ ] Drag&drop des rayons + boutons ▲▼ persistent l'ordre
- [ ] Long-press → "in stock" masque l'item
- [ ] Étoile favori persiste
- [ ] Notes perso sauvegardées au fil de la frappe
- [ ] Recette marquée "faite" est rayée
- [ ] Badge 🌱 visible sur les ingrédients de saison
- [ ] Bouton timer dans les étapes déclenche le compte à rebours
- [ ] Plusieurs timers en parallèle possibles
- [ ] Historique liste les semaines passées et permet de relancer

## PWA
- [ ] manifest.json valide
- [ ] Service worker installé (DevTools → Application)
- [ ] Mode hors-ligne fonctionne après premier chargement
- [ ] "Ajouter à l'écran d'accueil" affiche l'icône orange
- [ ] Mode standalone (pas de barre Safari)
- [ ] Lighthouse PWA : ≥ 90

## Partage
- [ ] navigator.share sur iPhone ouvre la share sheet
- [ ] Fallback copie + alert sur desktop

## Thème
- [ ] Bascule iOS ⇄ Terracotta change palette + fonts
- [ ] Pas de FOUC visible

## Console
- [ ] Aucune erreur console en navigation normale
- [ ] Aucun warning service worker
```

- [ ] **Step 2: Faire la passe et cocher**

Ouvrir l'app sur iPhone + desktop, dérouler la checklist, fixer les bugs rencontrés (commits dédiés `fix:`).

- [ ] **Step 3: Commit final QA**

```bash
git add docs/ACCEPTANCE.md
git commit -m "docs: checklist acceptance MVP"
```

---

### Task 44: Déploiement Netlify

**Files:** *(aucun — config via UI/CLI Netlify)*

- [ ] **Step 1: Vérifier que le build statique fonctionne en local**

```bash
python3 -m http.server 8000
# tester l'app à http://localhost:8000
```

- [ ] **Step 2: Installer netlify CLI si nécessaire**

```bash
which netlify || npm install -g netlify-cli
```

- [ ] **Step 3: Login + deploy**

```bash
netlify login
netlify deploy --prod --dir=.
```

Netlify détecte que c'est un site statique sans build step. Confirmer "Publish directory: ." et créer un nouveau site.

- [ ] **Step 4: Tester l'URL Netlify sur iPhone**

Ouvrir l'URL `<site>.netlify.app` sur iPhone Safari → "Ajouter à l'écran d'accueil" → l'app marche, hors-ligne après premier chargement.

- [ ] **Step 5: Ajouter l'URL au README**

Modifier `README.md` pour ajouter en haut :
```markdown
> **App en ligne :** https://<site>.netlify.app
```

- [ ] **Step 6: Commit final**

```bash
git add README.md
git commit -m "docs: ajouter URL Netlify de l'app déployée"
git push
```

---

## Récap de fin

Une fois le plan exécuté, l'utilisateur dispose de :
- Une URL publique Netlify avec l'app fonctionnelle
- 60+ recettes, 8+ menus thématiques
- Toutes les features MVP (A B C D E F G I J L) opérationnelles
- App installable sur iPhone, fonctionnant hors-ligne
- Codebase clean en HTML/CSS/JS pure, testée sur la logique métier
- Repo public GitHub avec spec, plan, et code

Pour aller plus loin (post-MVP) : ajouter les features panier 🥈/🥉 différées (`H`, `K`, `M`, `N`) — chacune ferait son propre plan.
