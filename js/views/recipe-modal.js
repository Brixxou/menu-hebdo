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
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
