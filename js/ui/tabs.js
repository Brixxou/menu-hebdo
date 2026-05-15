// js/ui/tabs.js — switching d'onglets

import { populateIcons } from './icons.js';

export function initTabs() {
  populateIcons(document);
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.target));
  });
}

export function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.target === name));
  document.querySelectorAll('.view').forEach(v => {
    const active = v.dataset.tab === name;
    v.classList.toggle('active', active);
    if (active) v.scrollTop = 0;
  });
}
