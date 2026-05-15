// js/seasonality.js — détection saison courante pour ingrédients

const MONTHS = ['janvier','fevrier','mars','avril','mai','juin','juillet','aout','septembre','octobre','novembre','decembre'];

export function currentMonthFr() {
  return MONTHS[new Date().getMonth()];
}

export function isInSeason(ingredientName, seasonality) {
  if (!ingredientName || !seasonality) return false;
  const key = ingredientName.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  // Try full match, then first word
  const months = seasonality[key] ?? seasonality[key.split(' ')[0]];
  if (!months) return false;
  return months.includes(currentMonthFr());
}
