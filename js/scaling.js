// js/scaling.js — multiplication + arrondi intelligent par unité

const DISCRETE_UNITS = new Set([null, 'botte', 'boite', 'gousse', 'oeuf', 'tranche', 'pavé', 'filet']);
const SPOON_UNITS = new Set(['cs', 'cc']);

export function smartRound(qty, unit) {
  if (DISCRETE_UNITS.has(unit)) {
    return Math.ceil(qty);
  }
  if (SPOON_UNITS.has(unit)) {
    // Préserve la fraction exacte 0.5, sinon arrondi à l'entier le plus proche
    const fractional = qty - Math.floor(qty);
    if (Math.abs(fractional - 0.5) < 1e-9) return Math.floor(qty) + 0.5;
    return Math.round(qty);
  }
  // poids/volume : palier selon magnitude
  if (qty < 10) return Math.round(qty * 10) / 10;
  if (qty >= 1000) return Math.round(qty / 50) * 50;
  // 10 ≤ qty < 1000 : préfère un palier "propre" si la valeur l'est déjà
  for (const p of [25, 10, 5]) {
    if (qty % p === 0) return qty;
  }
  if (qty < 100) return Math.ceil(qty / 5) * 5;
  return Math.round(qty / 10) * 10;
}

export function scaleIngredient(ing, basePeople, targetPeople) {
  if (!ing.scalable || ing.qty == null) {
    return { ...ing };
  }
  const factor = targetPeople / basePeople;
  return { ...ing, qty: smartRound(ing.qty * factor, ing.unit) };
}
