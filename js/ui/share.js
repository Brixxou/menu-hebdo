// js/ui/share.js — partage natif de la liste de courses

import { formatQty } from '../utils.js';
import { ingredientKey } from '../keys.js';

const LABELS = {
  'fruits-legumes': '🥬 Fruits & légumes',
  'viandes-poissons': '🐟 Viandes & poissons',
  'pains-pates': '🥖 Pains & pâtes',
  'frais': '🥚 Frais',
  'epicerie': '🍝 Épicerie',
  'epices': '🫒 Épices & huiles',
  'en-cas': '🥜 En-cas'
};

export function shoppingListToText(list, state) {
  const date = new Date(state.activeWeek.startedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  let out = `Liste de courses · Semaine du ${date} · ${state.activeWeek.peopleGlobal} personnes\n`;
  for (const cat of list) {
    const visible = cat.items.filter(i => !state.shoppingList.inStock[ingredientKey(i)]);
    if (visible.length === 0) continue;
    out += `\n${LABELS[cat.category] ?? cat.category}\n`;
    for (const item of visible) {
      out += `- ${item.name} ${formatQty(item)}\n`;
    }
  }
  return out;
}

export async function shareShoppingList(list, state) {
  const text = shoppingListToText(list, state);
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Liste de courses', text });
      return 'shared';
    } catch (e) {
      if (e.name === 'AbortError') return 'cancelled';
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}
