// tests/archive.test.js
import { test } from 'node:test';
import assert from 'node:assert';
import { createState } from '../js/state.js';

class MockStorage {
  constructor() { this.store = {}; }
  getItem(k) { return this.store[k] ?? null; }
  setItem(k, v) { this.store[k] = String(v); }
  removeItem(k) { delete this.store[k]; }
}

test('archiveAndStart: aucun active → nouvelle active sans archivage', () => {
  const s = createState(new MockStorage());
  const newWeek = { startedAt: '2026-05-15', menuId: 'med', days: [], peopleGlobal: 4, notes: {} };
  s.archiveAndStart(newWeek);
  const st = s.load();
  assert.deepStrictEqual(st.activeWeek, newWeek);
  assert.strictEqual(st.history.length, 0);
});

test('archiveAndStart: active existante → archivée', () => {
  const s = createState(new MockStorage());
  s.mutate(d => { d.activeWeek = { startedAt: '2026-05-01', menuId: 'a', days: [], peopleGlobal: 4, notes: {} }; });
  s.archiveAndStart({ startedAt: '2026-05-08', menuId: 'b', days: [], peopleGlobal: 4, notes: {} });
  const st = s.load();
  assert.strictEqual(st.activeWeek.menuId, 'b');
  assert.strictEqual(st.history.length, 1);
  assert.strictEqual(st.history[0].menuId, 'a');
});

test('archiveAndStart: history limitée à 10 (FIFO)', () => {
  const s = createState(new MockStorage());
  for (let i = 0; i < 12; i++) {
    s.archiveAndStart({ startedAt: `2026-${String(i+1).padStart(2,'0')}-01`, menuId: `m${i}`, days: [], peopleGlobal: 4, notes: {} });
  }
  const st = s.load();
  assert.strictEqual(st.history.length, 10);
  // les plus anciennes sont droppées
  assert.strictEqual(st.history[0].menuId, 'm1');
  assert.strictEqual(st.history[9].menuId, 'm10');
});
