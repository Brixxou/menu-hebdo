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

  return { load, save, mutate, archiveAndStart };
}
