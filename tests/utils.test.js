// tests/utils.test.js
import { test } from 'node:test';
import assert from 'node:assert';
import { slugify, formatQty } from '../js/utils.js';

test('slugify: enleve accents et caractères spéciaux', () => {
  assert.strictEqual(slugify('Tomates cerises'), 'tomates-cerises');
  assert.strictEqual(slugify("Filet d'agneau"), 'filet-d-agneau');
  assert.strictEqual(slugify('Crème fraîche'), 'creme-fraiche');
  assert.strictEqual(slugify('  Huile  d olive  '), 'huile-d-olive');
});

test('formatQty: affichage unitaire', () => {
  assert.strictEqual(formatQty({ qty: 400, unit: 'g' }), '400 g');
  assert.strictEqual(formatQty({ qty: 2, unit: null }), '×2');
  assert.strictEqual(formatQty({ qty: 1, unit: 'botte' }), '1 botte');
  assert.strictEqual(formatQty({ qty: 2, unit: 'botte' }), '2 bottes');
  assert.strictEqual(formatQty({ qty: null, unit: null }), '');
});
