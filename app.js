// js/app.js — bootstrap, sera étoffé tâche par tâche
console.log('Menu Hebdo — boot');

document.addEventListener('DOMContentLoaded', () => {
  const loading = document.getElementById('loading');
  if (loading) loading.textContent = 'Prêt.';
});
