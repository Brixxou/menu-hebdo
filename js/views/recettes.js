// js/views/recettes.js — bibliothèque consultable

import { icons, populateIcons } from '../ui/icons.js';

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
      <button class="chip chip-with-icon ${_activeFilters.favoritesOnly ? 'active' : ''}" data-fav="1"><span data-icon="star" data-icon-size="14"></span>Favoris</button>
      <button class="chip ${_activeFilters.maxTime === 15 ? 'active' : ''}" data-time="15">≤ 15 min</button>
      <button class="chip ${_activeFilters.maxTime === 20 ? 'active' : ''}" data-time="20">≤ 20 min</button>
      <button class="chip ${_activeFilters.maxTime === 30 ? 'active' : ''}" data-time="30">≤ 30 min</button>
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
  header.querySelectorAll('[data-time]').forEach(btn => {
    btn.addEventListener('click', () => {
      const v = parseInt(btn.dataset.time, 10);
      _activeFilters.maxTime = _activeFilters.maxTime === v ? null : v;
      renderRecettes(container, { state, data, callbacks });
    });
  });
  container.appendChild(header);

  const gridWrap = document.createElement('div');
  gridWrap.className = 'recettes-grid';
  container.appendChild(gridWrap);

  function renderGrid() {
    const filtered = data.recipes.filter(r => {
      if (_activeFilters.slot !== 'all' && r.slot !== _activeFilters.slot && r.slot !== 'both') return false;
      if (_activeFilters.favoritesOnly && !state.preferences.favorites.includes(r.id)) return false;
      if (_activeFilters.maxTime && r.timeMin > _activeFilters.maxTime) return false;
      if (_query) {
        const hay = (r.title + ' ' + (r.ingredients ?? []).map(i => i.name).join(' ')).toLowerCase();
        if (!hay.includes(_query)) return false;
      }
      return true;
    });
    gridWrap.innerHTML = filtered.map(r => `
      <article class="recipe-card" data-id="${r.id}">
        <h3>${state.preferences.favorites.includes(r.id) ? icons.starFilled({ size: 14 }) + ' ' : ''}${escapeHtml(r.title)}</h3>
        <p class="card-meta">${r.timeMin} min · ${(r.tags ?? []).slice(0, 2).join(' · ')}</p>
      </article>
    `).join('') || '<p class="empty-text">Aucune recette ne correspond.</p>';
    gridWrap.querySelectorAll('.recipe-card').forEach(c => {
      c.addEventListener('click', () => callbacks.onOpenRecipeStandalone(c.dataset.id));
    });
    populateIcons(container);
  }
  renderGrid();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function escapeAttr(s) { return escapeHtml(s); }
