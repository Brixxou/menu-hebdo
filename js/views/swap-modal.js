// js/views/swap-modal.js — modal pour remplacer une recette

export function openSwapModal({ data, slot, currentRecipeId, defaultConstraints, favorites, onPick }) {
  const root = document.getElementById('modal-root');
  const overlay = document.createElement('div');
  overlay.className = 'sheet-overlay';

  let showAll = false;

  function compatible(r) {
    if (showAll) return true;
    if (r.slot !== 'both' && r.slot !== slot) return false;
    for (const c of defaultConstraints ?? []) {
      if (!r.constraints?.includes(c)) return false;
    }
    return true;
  }

  function render() {
    const filtered = data.recipes.filter(compatible).filter(r => r.id !== currentRecipeId);
    const ordered = [
      ...filtered.filter(r => favorites.includes(r.id)),
      ...filtered.filter(r => !favorites.includes(r.id))
    ];
    overlay.innerHTML = `
      <div class="sheet sheet-tall" role="dialog" aria-modal="true">
        <button class="sheet-close" aria-label="Fermer">✕</button>
        <div class="sheet-body">
          <h2>Remplacer la recette</h2>
          <div class="swap-actions">
            <button class="btn-secondary" id="swap-all">${showAll ? 'Filtrer' : 'Voir tout le catalogue'}</button>
            <button class="btn-secondary" id="swap-random">🎲 Surprends-moi</button>
          </div>
          <ul class="swap-list">
            ${ordered.map(r => `
              <li data-id="${r.id}">
                <div class="swap-title">${favorites.includes(r.id) ? '★ ' : ''}${escapeHtml(r.title)}</div>
                <div class="swap-meta">${r.timeMin} min · ${(r.tags ?? []).slice(0,3).join(' · ')}</div>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    `;
    overlay.querySelector('.sheet-close').addEventListener('click', close);
    overlay.querySelector('#swap-all').addEventListener('click', () => { showAll = !showAll; render(); });
    overlay.querySelector('#swap-random').addEventListener('click', () => {
      if (ordered.length === 0) return;
      const pick = ordered[Math.floor(Math.random() * ordered.length)];
      onPick(pick.id);
      close();
    });
    overlay.querySelectorAll('.swap-list li').forEach(li => {
      li.addEventListener('click', () => {
        onPick(li.dataset.id);
        close();
      });
    });
  }

  function close() { overlay.remove(); }

  root.appendChild(overlay);
  render();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
