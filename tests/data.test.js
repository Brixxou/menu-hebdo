// tests/data.test.js
import { test } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, '..', 'data');

const recipes = JSON.parse(readFileSync(resolve(dataDir, 'recipes.json'), 'utf8'));
const menus = JSON.parse(readFileSync(resolve(dataDir, 'menus.json'), 'utf8'));

const VALID_SLOTS = new Set(['lunch', 'dinner', 'both']);
const VALID_CATEGORIES = new Set([
  'fruits-legumes',
  'viandes-poissons',
  'pains-pates',
  'frais',
  'epicerie',
  'epices',
  'en-cas',
]);

test('toutes les recettes ont les champs requis et valides', () => {
  assert.ok(Array.isArray(recipes), 'recipes doit être un tableau');
  assert.ok(recipes.length > 0, 'recipes ne doit pas être vide');

  for (const r of recipes) {
    assert.ok(typeof r.id === 'string' && r.id.length > 0, `id manquant: ${JSON.stringify(r)}`);
    assert.ok(typeof r.title === 'string' && r.title.length > 0, `title manquant pour ${r.id}`);
    assert.ok(VALID_SLOTS.has(r.slot), `slot invalide pour ${r.id}: ${r.slot}`);
    assert.strictEqual(typeof r.timeMin, 'number', `timeMin doit être un nombre pour ${r.id}`);
    assert.strictEqual(typeof r.basePeople, 'number', `basePeople doit être un nombre pour ${r.id}`);
    assert.ok(Array.isArray(r.ingredients), `ingredients doit être un tableau pour ${r.id}`);
    assert.ok(Array.isArray(r.steps), `steps doit être un tableau pour ${r.id}`);
    assert.ok(r.steps.length > 0, `steps ne doit pas être vide pour ${r.id}`);

    for (const ing of r.ingredients) {
      assert.ok(
        typeof ing.name === 'string' && ing.name.length > 0,
        `ingredient sans name dans ${r.id}: ${JSON.stringify(ing)}`,
      );
      assert.ok(
        VALID_CATEGORIES.has(ing.category),
        `category invalide dans ${r.id} (${ing.name}): ${ing.category}`,
      );
      assert.strictEqual(
        typeof ing.scalable,
        'boolean',
        `scalable doit être un booléen dans ${r.id} (${ing.name})`,
      );
    }
  }
});

test('aucun ID de recette en double', () => {
  const ids = recipes.map((r) => r.id);
  const seen = new Set();
  const duplicates = [];
  for (const id of ids) {
    if (seen.has(id)) duplicates.push(id);
    seen.add(id);
  }
  assert.deepStrictEqual(duplicates, [], `IDs dupliqués: ${duplicates.join(', ')}`);
});

test('toutes les références de menu pointent vers des recettes existantes', () => {
  const recipeIds = new Set(recipes.map((r) => r.id));
  for (const menu of menus) {
    assert.ok(Array.isArray(menu.days), `menu ${menu.id} doit avoir des days`);
    for (const day of menu.days) {
      if (day.lunch !== null && day.lunch !== undefined) {
        assert.ok(
          recipeIds.has(day.lunch),
          `menu ${menu.id} jour ${day.day}: lunch "${day.lunch}" non trouvé`,
        );
      }
      if (day.dinner !== null && day.dinner !== undefined) {
        assert.ok(
          recipeIds.has(day.dinner),
          `menu ${menu.id} jour ${day.day}: dinner "${day.dinner}" non trouvé`,
        );
      }
    }
  }
});
