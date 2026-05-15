// js/keys.js — clés stables pour matcher les ingrédients à travers les swaps

import { slugify } from './utils.js';

export function ingredientKey({ name, unit, category }) {
  return `${category}:${slugify(name)}:${unit ?? 'piece'}`;
}
