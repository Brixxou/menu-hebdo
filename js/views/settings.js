// js/views/settings.js — petit modal de réglages

import { icons, populateIcons } from '../ui/icons.js';

export function openSettings({ state, onResetStock, onResetChecked, onClearHistory }) {
  const root = document.getElementById('modal-root');
  const overlay = document.createElement('div');
  overlay.className = 'sheet-overlay';
  overlay.innerHTML = `
    <div class="sheet" role="dialog" aria-modal="true">
      <button class="sheet-close" aria-label="Fermer">${icons.close({ size: 16 })}</button>
      <div class="sheet-body">
        <h2 class="recipe-head"><span style="font-family: var(--font-serif); font-weight: 300; font-style: italic; font-size: 28px;">Réglages</span></h2>
        <h3 class="section-h">Données</h3>
        <button class="btn-secondary settings-btn" id="reset-stock">Réinitialiser le stock</button>
        <button class="btn-secondary settings-btn" id="reset-checked">Décocher toute la liste</button>
        <button class="btn-secondary settings-btn" id="clear-history">Vider l'historique</button>
        <h3 class="section-h">À propos</h3>
        <p class="settings-about">
          <em class="italic">Menu Hebdo</em> · MVP 0.1 · Conçu pour rester simple, fonctionner hors-ligne, et tenir dans une poche.
        </p>
      </div>
    </div>
  `;
  overlay.querySelector('.sheet-close').addEventListener('click', () => { overlay.remove(); });
  overlay.querySelector('#reset-stock').addEventListener('click', () => {
    if (confirm('Effacer tous les ingrédients marqués "déjà en stock" ?')) {
      onResetStock();
      overlay.remove();
    }
  });
  overlay.querySelector('#reset-checked').addEventListener('click', () => {
    if (confirm('Décocher tous les articles de la liste de courses ?')) {
      onResetChecked();
      overlay.remove();
    }
  });
  overlay.querySelector('#clear-history').addEventListener('click', () => {
    if (confirm('Effacer toutes les semaines archivées ?')) {
      onClearHistory();
      overlay.remove();
    }
  });
  root.appendChild(overlay);
  populateIcons(overlay);
}
