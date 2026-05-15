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
