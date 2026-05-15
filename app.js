import { initTabs } from './js/ui/tabs.js';
import { createState } from './js/state.js';
import { loadData } from './js/data.js';
import { renderSemaine } from './js/views/semaine.js';

const state = createState();

let _dataCache;
async function main() {
  _dataCache = await loadData();
  initTabs();
  rerender();
}

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

document.addEventListener('DOMContentLoaded', main);
