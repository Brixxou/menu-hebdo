// js/ui/shopping-mode.js — mode "supermarché" plein écran avec wake lock

let wakeLock = null;

export async function enterShoppingMode() {
  document.body.classList.add('shopping-mode');
  if ('wakeLock' in navigator) {
    try { wakeLock = await navigator.wakeLock.request('screen'); } catch {}
  }
}

export async function exitShoppingMode() {
  document.body.classList.remove('shopping-mode');
  if (wakeLock) {
    try { await wakeLock.release(); } catch {}
    wakeLock = null;
  }
}
