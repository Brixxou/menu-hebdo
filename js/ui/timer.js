// js/ui/timer.js — timers empilés dans une bannière fixe

import { icons } from './icons.js';

const timers = new Map(); // id -> { label, remaining, intervalId }
let nextId = 1;

function ensureBanner() {
  let banner = document.getElementById('timer-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'timer-banner';
    document.body.appendChild(banner);
  }
  return banner;
}

function render() {
  const banner = ensureBanner();
  if (timers.size === 0) {
    banner.remove();
    return;
  }
  banner.innerHTML = '';
  for (const [id, t] of timers) {
    const row = document.createElement('div');
    row.className = 'timer-row';
    const mm = String(Math.floor(t.remaining / 60)).padStart(2, '0');
    const ss = String(t.remaining % 60).padStart(2, '0');
    row.innerHTML = `<span class="timer-icon">${icons.timer({ size: 16 })}</span><span>${escapeHtml(t.label)}</span><strong>${mm}:${ss}</strong><button data-id="${id}" aria-label="Annuler">${icons.close({ size: 14 })}</button>`;
    row.querySelector('button').addEventListener('click', () => cancelTimer(id));
    banner.appendChild(row);
  }
}

function tick(id) {
  const t = timers.get(id);
  if (!t) return;
  t.remaining -= 1;
  if (t.remaining <= 0) {
    clearInterval(t.intervalId);
    timers.delete(id);
    render();
    if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 300]);
    setTimeout(() => alert(`Terminé : ${t.label}`), 50);
    return;
  }
  render();
}

export function startTimer(label, durationMin) {
  const id = nextId++;
  const t = {
    label,
    remaining: Math.max(1, Math.floor(durationMin * 60)),
    intervalId: null
  };
  t.intervalId = setInterval(() => tick(id), 1000);
  timers.set(id, t);
  render();
  return id;
}

export function cancelTimer(id) {
  const t = timers.get(id);
  if (!t) return;
  clearInterval(t.intervalId);
  timers.delete(id);
  render();
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
