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
