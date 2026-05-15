// js/views/settings.js — petit modal de réglages

export function openSettings({ state, onChange }) {
  const root = document.getElementById('modal-root');
  const overlay = document.createElement('div');
  overlay.className = 'sheet-overlay';
  overlay.innerHTML = `
    <div class="sheet" role="dialog" aria-modal="true">
      <button class="sheet-close" aria-label="Fermer">✕</button>
      <div class="sheet-body">
        <h2>Réglages</h2>
        <label class="row">
          Thème
          <select id="theme-select">
            <option value="ios" ${state.preferences.theme === 'ios' ? 'selected' : ''}>iOS minimaliste</option>
            <option value="terracotta" ${state.preferences.theme === 'terracotta' ? 'selected' : ''}>Terracotta luxe</option>
          </select>
        </label>
        <label class="row">
          Par défaut, nombre de personnes
          <input type="number" min="1" max="12" id="def-people" value="${state.preferences.defaultPeople}">
        </label>
      </div>
    </div>
  `;
  overlay.querySelector('.sheet-close').addEventListener('click', () => { overlay.remove(); });
  overlay.querySelector('#theme-select').addEventListener('change', e => onChange({ theme: e.target.value }));
  overlay.querySelector('#def-people').addEventListener('input', e => {
    const n = Math.max(1, Math.min(12, parseInt(e.target.value, 10) || 1));
    onChange({ defaultPeople: n });
  });
  root.appendChild(overlay);
}
