// tests/shopping.test.js
import { test } from 'node:test';
import assert from 'node:assert';
import { buildShoppingList, effectiveIngredients } from '../js/shopping.js';

const recipeA = {
  id: 'a', basePeople: 4,
  ingredients: [
    { qty: 400, unit: 'g', name: 'linguine', category: 'epicerie', scalable: true },
    { qty: 200, unit: 'g', name: 'tomates cerises', category: 'fruits-legumes', scalable: true }
  ]
};
const recipeB = {
  id: 'b', basePeople: 4,
  ingredients: [
    { qty: 200, unit: 'g', name: 'linguine', category: 'epicerie', scalable: true },
    { qty: null, unit: null, name: 'huile d olive', category: 'epices', scalable: false }
  ]
};
const recipes = { a: recipeA, b: recipeB };

test('buildShoppingList: agrège même ingrédient', () => {
  const week = {
    days: [
      { lunch: { recipeId: 'a', peopleOverride: null }, dinner: { recipeId: 'b', peopleOverride: null } }
    ],
    peopleGlobal: 4
  };
  const aisleOrder = ['fruits-legumes', 'epicerie', 'epices'];
  const list = buildShoppingList(week, recipes, aisleOrder);
  // linguine 400 + 200 = 600 g
  const linguine = list.find(c => c.category === 'epicerie').items.find(i => i.name === 'linguine');
  assert.strictEqual(linguine.qty, 600);
});

test('buildShoppingList: peopleOverride applique uniquement à la recette concernée', () => {
  const week = {
    days: [
      { lunch: { recipeId: 'a', peopleOverride: 6 }, dinner: { recipeId: 'b', peopleOverride: null } }
    ],
    peopleGlobal: 4
  };
  const list = buildShoppingList(week, recipes, ['fruits-legumes', 'epicerie', 'epices']);
  // a scale 4→6 (×1.5), b scale 4→4 (×1)
  // linguine = 400*1.5 + 200*1 = 600+200 = 800g
  const linguine = list.find(c => c.category === 'epicerie').items.find(i => i.name === 'linguine');
  assert.strictEqual(linguine.qty, 800);
});

test('buildShoppingList: respecte aisleOrder', () => {
  const week = { days: [{ lunch: { recipeId: 'a', peopleOverride: null }, dinner: null }], peopleGlobal: 4 };
  const list = buildShoppingList(week, recipes, ['epicerie', 'fruits-legumes']);
  assert.strictEqual(list[0].category, 'epicerie');
  assert.strictEqual(list[1].category, 'fruits-legumes');
});

test('buildShoppingList: non-scalable apparait une fois', () => {
  const week = {
    days: [
      { lunch: { recipeId: 'b', peopleOverride: null }, dinner: { recipeId: 'b', peopleOverride: null } }
    ],
    peopleGlobal: 4
  };
  const list = buildShoppingList(week, recipes, ['epicerie', 'epices']);
  const huile = list.find(c => c.category === 'epices').items;
  assert.strictEqual(huile.length, 1);
});

test('buildShoppingList: ignore les slots vides', () => {
  const week = { days: [{ lunch: null, dinner: { recipeId: 'a', peopleOverride: null } }], peopleGlobal: 4 };
  const list = buildShoppingList(week, recipes, ['fruits-legumes', 'epicerie']);
  const flat = list.flatMap(c => c.items);
  assert.strictEqual(flat.length, 2);
});

test('effectiveIngredients: applique les substitutions du meal', () => {
  const recipe = { ingredients: [{ qty: 100, unit: 'g', name: 'linguine', category: 'epicerie', scalable: true }] };
  const meal = { substitutes: { linguine: 'spaghetti' } };
  const eff = effectiveIngredients(recipe, meal);
  assert.strictEqual(eff[0].name, 'spaghetti');
  assert.strictEqual(eff[0].qty, 100);  // unchanged
});
