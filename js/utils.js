// js/utils.js — helpers communs

export function slugify(s) {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const PLURALS = { botte: 'bottes', boite: 'boîtes', gousse: 'gousses', oeuf: 'œufs', tranche: 'tranches' };

export function formatQty({ qty, unit }) {
  if (qty == null && unit == null) return '';
  if (unit == null) return `×${qty}`;
  if (PLURALS[unit] && qty > 1) return `${qty} ${PLURALS[unit]}`;
  return `${qty} ${unit}`;
}
