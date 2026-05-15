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
