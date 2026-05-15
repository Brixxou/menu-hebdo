// tests/scaling.test.js
import { test } from 'node:test';
import assert from 'node:assert';
import { scaleIngredient, smartRound } from '../js/scaling.js';

test('scaleIngredient: linguine 400g de 4 à 6 personnes', () => {
  const r = scaleIngredient(
    { qty: 400, unit: 'g', name: 'linguine', scalable: true },
    4, 6
  );
  assert.strictEqual(r.qty, 600);
  assert.strictEqual(r.unit, 'g');
});

test('scaleIngredient: gousses d ail arrondi entier supérieur', () => {
  const r = scaleIngredient(
    { qty: 4, unit: null, name: 'gousses d ail', scalable: true },
    4, 5
  );
  assert.strictEqual(r.qty, 5);
});

test('scaleIngredient: 1 oignon de 4 à 6 → 2 oignons', () => {
  const r = scaleIngredient(
    { qty: 1, unit: null, name: 'oignon', scalable: true },
    4, 6
  );
  assert.strictEqual(r.qty, 2);
});

test('scaleIngredient: scalable=false renvoie tel quel', () => {
  const r = scaleIngredient(
    { qty: 1, unit: 'botte', name: 'basilic', scalable: false },
    4, 8
  );
  assert.strictEqual(r.qty, 1);
});

test('scaleIngredient: cuillères arrondi au demi', () => {
  const r = scaleIngredient(
    { qty: 2, unit: 'cs', name: 'huile', scalable: true },
    4, 5
  );
  assert.strictEqual(r.qty, 2.5);
});

test('smartRound: poids/volume par paliers', () => {
  assert.strictEqual(smartRound(133, 'g'), 130);
  assert.strictEqual(smartRound(600, 'g'), 600);
  assert.strictEqual(smartRound(125, 'g'), 125);
  assert.strictEqual(smartRound(47, 'ml'), 50);
});

test('smartRound: unités discrètes au supérieur', () => {
  assert.strictEqual(smartRound(2.5, null), 3);
  assert.strictEqual(smartRound(1.25, 'botte'), 2);
});

test('smartRound: cuillères au demi', () => {
  assert.strictEqual(smartRound(2.5, 'cs'), 2.5);
  assert.strictEqual(smartRound(2.7, 'cs'), 3);
  assert.strictEqual(smartRound(2.2, 'cc'), 2);
});
