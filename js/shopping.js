// js/shopping.js — dérivation de la liste de courses depuis activeWeek

import { scaleIngredient } from './scaling.js';
import { ingredientKey } from './keys.js';

export function buildShoppingList(week, recipesById, aisleOrder) {
  const buckets = new Map(); // key -> aggregated ingredient

  for (const day of week.days) {
    for (const slot of ['lunch', 'dinner']) {
      const meal = day[slot];
      if (!meal || !meal.recipeId) continue;
      const recipe = recipesById[meal.recipeId];
      if (!recipe) continue;
      const targetPeople = meal.peopleOverride ?? week.peopleGlobal;

      for (const ing of recipe.ingredients) {
        const scaled = scaleIngredient(ing, recipe.basePeople, targetPeople);
        const key = ingredientKey(ing);
        if (buckets.has(key)) {
          const existing = buckets.get(key);
          if (ing.scalable && existing.qty != null && scaled.qty != null) {
            existing.qty += scaled.qty;
          }
        } else {
          buckets.set(key, { ...scaled, key });
        }
      }
    }
  }

  // groupe par catégorie
  const byCategory = new Map();
  for (const item of buckets.values()) {
    if (!byCategory.has(item.category)) byCategory.set(item.category, []);
    byCategory.get(item.category).push(item);
  }

  // trie selon aisleOrder
  const ordered = [];
  for (const cat of aisleOrder) {
    if (byCategory.has(cat)) {
      ordered.push({ category: cat, items: byCategory.get(cat).sort((a, b) => a.name.localeCompare(b.name, 'fr')) });
      byCategory.delete(cat);
    }
  }
  // catégories non listées : à la fin
  for (const [cat, items] of byCategory) {
    ordered.push({ category: cat, items: items.sort((a, b) => a.name.localeCompare(b.name, 'fr')) });
  }

  return ordered;
}
