// js/views/history.js — modal liste des semaines archivées

export function openHistory({ history, data, onRestart, onClose }) {
  const root = document.getElementById('modal-root');
  const overlay = document.createElement('div');
  overlay.className = 'sheet-overlay';
  overlay.innerHTML = `
    <div class="sheet" role="dialog" aria-modal="true">
      <button class="sheet-close" aria-label="Fermer">✕</button>
      <div class="sheet-body">
        <h2>Historique</h2>
        ${history.length === 0 ? '<p class="empty-text">Aucune semaine archivée.</p>' : `
          <ul class="history-list">
            ${history.slice().reverse().map((w, i) => {
              const real = history.length - 1 - i;
              const date = new Date(w.startedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
              const menuName = w.menuId ? data.menusById[w.menuId]?.name ?? 'Menu' : 'Composition libre';
              return `<li data-idx="${real}"><div class="hist-date">${escapeHtml(date)}</div><div class="hist-menu">${escapeHtml(menuName)}</div></li>`;
            }).join('')}
          </ul>
        `}
      </div>
    </div>
  `;
  overlay.querySelector('.sheet-close').addEventListener('click', () => { overlay.remove(); onClose && onClose(); });
  overlay.querySelectorAll('.history-list li').forEach(li => {
    li.addEventListener('click', () => {
      if (confirm('Relancer cette semaine ? La semaine en cours sera archivée.')) {
        onRestart(parseInt(li.dataset.idx, 10));
        overlay.remove();
      }
    });
  });
  root.appendChild(overlay);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
