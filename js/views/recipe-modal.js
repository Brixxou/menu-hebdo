// js/views/recipe-modal.js — sheet modal pour afficher une recette

import { scaleIngredient } from '../scaling.js';
import { formatQty } from '../utils.js';
import { effectiveIngredients } from '../shopping.js';
import { isInSeason } from '../seasonality.js';

export function openRecipeModal({ recipe, peopleEffective, isFavorite, isCooked, note, callbacks, meal, seasonality }) {
  const root = document.getElementById('modal-root');
  root.innerHTML = '';
  const sheet = document.createElement('div');
  sheet.className = 'sheet-overlay';
  const ingredients = meal ? effectiveIngredients(recipe, meal) : recipe.ingredients;
  sheet.innerHTML = `
    <div class="sheet" role="dialog" aria-modal="true">
      <button class="sheet-close" aria-label="Fermer">✕</button>
      <div class="sheet-body">
        <header class="recipe-head">
          <h2>${escapeHtml(recipe.title)}</h2>
          <button class="fav-toggle" aria-pressed="${isFavorite}">${isFavorite ? '★' : '☆'}</button>
        </header>
        <div class="recipe-meta">
          ${recipe.timeMin} min ·
          <div class="people-inline">
            <button class="ppl-btn" data-dir="-1">−</button>
            <span class="ppl-value">${peopleEffective}</span>
            <button class="ppl-btn" data-dir="+1">+</button>
          </div>
          pers.
        </div>
        <p class="recipe-desc">${escapeHtml(recipe.description)}</p>
        <h3 class="section-h">Ingrédients</h3>
        <ul class="ingredients-list">
          ${ingredients.map(ing => {
            const scaled = scaleIngredient(ing, recipe.basePeople, peopleEffective);
            const hasSubs = (ing.substitutes ?? []).length > 0;
            const inSeason = isInSeason(scaled.name, seasonality);
            return `<li class="ing ${hasSubs ? 'has-subs' : ''}" data-name="${escapeAttr(ing.name)}">
              <span class="ing-qty">${formatQty(scaled)}</span>
              <span class="ing-name">${escapeHtml(scaled.name)}${inSeason ? ' 🌱' : ''}${hasSubs ? ' <span class="subs-hint">↻</span>' : ''}</span>
            </li>`;
          }).join('')}
        </ul>
        <h3 class="section-h">Étapes</h3>
        <ol class="steps-list">
          ${recipe.steps.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
        </ol>
        <div class="cooked-row">
          <button class="btn-secondary cooked-toggle" aria-pressed="${isCooked}">
            ${isCooked ? '✓ Repas fait' : 'Marquer comme fait'}
          </button>
        </div>
        <h3 class="section-h">Notes perso</h3>
        <textarea class="recipe-notes" rows="3" placeholder="Tes notes…">${escapeHtml(note ?? '')}</textarea>
      </div>
    </div>
  `;
  root.appendChild(sheet);

  sheet.querySelector('.sheet-close').addEventListener('click', close);
  sheet.addEventListener('click', e => { if (e.target === sheet) close(); });
  sheet.querySelector('.fav-toggle').addEventListener('click', () => callbacks.onToggleFavorite());
  sheet.querySelectorAll('.ppl-btn').forEach(b => {
    b.addEventListener('click', () => {
      const dir = parseInt(b.dataset.dir, 10);
      const current = parseInt(sheet.querySelector('.ppl-value').textContent, 10);
      const next = Math.max(1, Math.min(12, current + dir));
      if (next !== current) callbacks.onPeopleOverride(next);
    });
  });
  sheet.querySelector('.cooked-toggle').addEventListener('click', () => callbacks.onToggleCooked());
  sheet.querySelector('.recipe-notes').addEventListener('input', e => callbacks.onNoteChange(e.target.value));

  // Substitutions
  sheet.querySelectorAll('.ing.has-subs').forEach(li => {
    li.addEventListener('click', () => {
      const origName = li.dataset.name;
      const ing = ingredients.find(i => i.name === origName) || recipe.ingredients.find(i => i.name === origName);
      if (!ing) return;
      const opts = ing.substitutes ?? [];
      if (!opts.length) return;
      const choice = prompt(`Remplacer "${origName}" par :\n${opts.map((o, i) => `${i + 1}. ${o}`).join('\n')}\n\nSaisir le numéro ou le nom :`);
      if (!choice) return;
      let chosen = null;
      const n = parseInt(choice, 10);
      if (!isNaN(n) && n >= 1 && n <= opts.length) chosen = opts[n - 1];
      else if (opts.includes(choice.trim())) chosen = choice.trim();
      if (chosen && callbacks.onSubstitute) callbacks.onSubstitute(origName, chosen);
    });
  });

  function close() { root.innerHTML = ''; }
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function escapeAttr(s) {
  return escapeHtml(s);
}
