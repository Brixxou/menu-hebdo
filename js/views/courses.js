// js/views/courses.js — rendu de l'onglet liste de courses

import { buildShoppingList } from '../shopping.js';
import { ingredientKey } from '../keys.js';
import { formatQty } from '../utils.js';
import { populateIcons } from '../ui/icons.js';

export function renderCourses(container, { state, data, callbacks }) {
  container.innerHTML = '';
  if (!state.activeWeek) {
    const empty = document.createElement('div');
    empty.className = 'courses-empty';
    empty.innerHTML = `
      <p class="empty-text">Aucune <em class="italic">semaine</em> en cours.<br>Démarre une semaine pour générer ta liste de courses.</p>
      <button class="btn-primary" id="btn-go-semaine">Aller au menu de la semaine</button>
    `;
    empty.querySelector('#btn-go-semaine').addEventListener('click', () => callbacks.onGoToSemaine());
    container.appendChild(empty);
    return;
  }
  const list = buildShoppingList(state.activeWeek, data.recipesById, state.preferences.aisleOrder);
  const totalItems = list.reduce((s, c) => s + c.items.filter(i => !state.shoppingList.inStock[ingredientKey(i)]).length, 0);

  const header = document.createElement('div');
  header.className = 'courses-header';
  header.innerHTML = `
    <div class="courses-stats">${totalItems} articles · ${list.length} rayons</div>
    <div class="courses-actions">
      <button class="btn-secondary" id="btn-shopping-mode"><span data-icon="shoppingMode" data-icon-size="16"></span>Mode supermarché</button>
      <button class="btn-secondary" id="btn-share"><span data-icon="share" data-icon-size="16"></span>Partager</button>
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
  populateIcons(container);

  // Drag & drop des rayons (desktop) + fallback ▲▼ (mobile)
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
    head.querySelectorAll('.cat-move').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        callbacks.onMoveAisle(section.dataset.category, parseInt(btn.dataset.dir, 10));
      });
    });
  });
}

function renderCategory(cat, state, callbacks) {
  const section = document.createElement('section');
  section.className = 'course-cat';
  section.dataset.category = cat.category;
  section.innerHTML = `
    <header class="cat-head" draggable="true">
      <span class="cat-drag">⋮⋮</span>
      <button class="cat-move" data-dir="-1" aria-label="Monter">▲</button>
      <button class="cat-move" data-dir="+1" aria-label="Descendre">▼</button>
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
    let pressTimer = null;
    let suppressClick = false;
    li.addEventListener('pointerdown', () => {
      pressTimer = setTimeout(() => {
        suppressClick = true;
        pressTimer = null;
        callbacks.onMarkInStock(li.dataset.key);
      }, 600);
    });
    const cancelTimer = () => {
      if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
    };
    li.addEventListener('pointerup', cancelTimer);
    li.addEventListener('pointerleave', cancelTimer);
    li.addEventListener('pointercancel', cancelTimer);
    li.addEventListener('click', () => {
      if (suppressClick) { suppressClick = false; return; }
      callbacks.onToggleChecked(li.dataset.key);
    });
  });
  return section;
}

const LABELS = {
  'fruits-legumes': 'Fruits & légumes',
  'viandes-poissons': 'Viandes & poissons',
  'pains-pates': 'Pains & pâtes',
  'frais': 'Frais',
  'epicerie': 'Épicerie',
  'epices': 'Épices & huiles',
  'en-cas': 'En-cas'
};
function labelForCategory(c) { return LABELS[c] ?? c; }

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
