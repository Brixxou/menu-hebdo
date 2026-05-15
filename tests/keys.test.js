// tests/keys.test.js
import { test } from 'node:test';
import assert from 'node:assert';
import { ingredientKey } from '../js/keys.js';

test('ingredientKey: format {cat}:{slug-name}:{unit}', () => {
  const k = ingredientKey({ name: 'Tomates cerises', unit: 'g', category: 'fruits-legumes' });
  assert.strictEqual(k, 'fruits-legumes:tomates-cerises:g');
});

test('ingredientKey: unit null devient "piece"', () => {
  const k = ingredientKey({ name: 'Oignon', unit: null, category: 'fruits-legumes' });
  assert.strictEqual(k, 'fruits-legumes:oignon:piece');
});

test('ingredientKey: identique pour deux ingredients identiques', () => {
  const a = ingredientKey({ name: 'Linguine', unit: 'g', category: 'epicerie' });
  const b = ingredientKey({ name: 'linguine', unit: 'g', category: 'epicerie' });
  assert.strictEqual(a, b);
});
