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
