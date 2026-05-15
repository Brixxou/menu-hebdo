// js/ui/tabs.js — switching d'onglets

export function initTabs() {
  const buttons = document.querySelectorAll('.tab-btn');
  const views = document.querySelectorAll('.view');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      buttons.forEach(b => b.classList.toggle('active', b === btn));
      views.forEach(v => v.classList.toggle('active', v.dataset.tab === target));
      window.scrollTo({ top: 0 });
    });
  });
}
