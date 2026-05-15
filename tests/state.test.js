// tests/state.test.js
import { test } from 'node:test';
import assert from 'node:assert';
import { createState, defaultState } from '../js/state.js';

class MockStorage {
  constructor() { this.store = {}; }
  getItem(k) { return this.store[k] ?? null; }
  setItem(k, v) { this.store[k] = String(v); }
  removeItem(k) { delete this.store[k]; }
}

test('state: load returns defaultState quand storage vide', () => {
  const s = createState(new MockStorage());
  const loaded = s.load();
  assert.deepStrictEqual(loaded, defaultState());
});

test('state: save puis load round-trip', () => {
  const storage = new MockStorage();
  const s = createState(storage);
  const data = defaultState();
  data.preferences.defaultPeople = 6;
  s.save(data);
  const loaded = s.load();
  assert.strictEqual(loaded.preferences.defaultPeople, 6);
});

test('state: mutate { } applique et sauvegarde', () => {
  const s = createState(new MockStorage());
  s.mutate(d => { d.preferences.theme = 'terracotta'; });
  assert.strictEqual(s.load().preferences.theme, 'terracotta');
});

test('state: schemaVersion incohérent → defaultState', () => {
  const storage = new MockStorage();
  storage.setItem('food:v1', JSON.stringify({ schemaVersion: 99, foo: 'bar' }));
  const s = createState(storage);
  assert.deepStrictEqual(s.load(), defaultState());
});

test('state: archiveActiveWeek limite history à 10', () => {
  const s = createState(new MockStorage());
  for (let i = 0; i < 15; i++) {
    s.mutate(d => {
      d.activeWeek = { startedAt: `2026-01-${i+1}`, menuId: 'x', days: [], peopleGlobal: 4, notes: {} };
      d.history.push(d.activeWeek);
      while (d.history.length > 10) d.history.shift();
    });
  }
  assert.strictEqual(s.load().history.length, 10);
});
