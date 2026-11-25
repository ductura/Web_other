import { test } from 'vitest';
import assert from 'node:assert/strict';
import { debounce, parseRoute, docHref, wordCount, saveStatusLabel, isKeyboardOpen } from '../src/lib/doc.js';

test('parseRoute i docHref', () => {
  assert.deepEqual(parseRoute('#/doc/demo-1'), { view: 'doc', id: 'demo-1' });
  assert.deepEqual(parseRoute('#/'), { view: 'list' });
  assert.deepEqual(parseRoute(''), { view: 'list' });
  assert.deepEqual(parseRoute('#/doc/abc'), { view: 'doc', id: 'abc' });
  assert.equal(docHref('abc'), '/doc/abc');
  assert.equal(docHref('a b'), '/doc/a%20b');
});

test('wordCount', () => {
  assert.equal(wordCount(''), 0);
  assert.equal(wordCount('  jedna   dvije\ntri '), 3);
});

test('saveStatusLabel', () => {
  // PRODUCT §5: „spremljeno” uvijek kaže gdje.
  assert.equal(saveStatusLabel('saved'), 'Spremljeno na poslužitelju');
  assert.equal(saveStatusLabel('nepoznato'), '');
});

test('isKeyboardOpen', () => {
  assert.equal(isKeyboardOpen(400, 800), true);
  assert.equal(isKeyboardOpen(780, 800), false);
  assert.equal(isKeyboardOpen(0, 800), false);
});

test('debounce poziva samo zadnji put, flush odmah', async () => {
  const calls = [];
  const d = debounce((x) => calls.push(x), 20);
  d(1); d(2); d(3);
  await new Promise((r) => setTimeout(r, 40));
  assert.deepEqual(calls, [3]);
  d(4); d.flush(5);
  assert.deepEqual(calls, [3, 5]);
});
