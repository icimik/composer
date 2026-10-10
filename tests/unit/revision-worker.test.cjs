const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const { setup, invoke } = require('../helpers/revision-runtime-fixture.cjs');

test('real worker plans a synthetic long history while parent event-loop callbacks remain active', async (t) => {
  const f = await setup(t);
  const history = Array.from({ length: 500 }, (_, i) => ({
    id: `snapshot-${i}`,
    title: 'Synthetic title',
    content: '合成'.repeat(2500),
    createdAt: '2026-10-10T00:00:00.000Z',
    reason: 'Synthetic scale observation'
  }));
  await fs.writeFile(
    path.join(f.a.path, '.composer/history', `${f.request.docId}.json`),
    JSON.stringify(history)
  );
  let callbacks = 0;
  let longestGap = 0;
  let previous = performance.now();
  const start = previous;
  const timer = setInterval(() => {
    const now = performance.now();
    longestGap = Math.max(longestGap, now - previous);
    previous = now;
    callbacks++;
  }, 5);
  try {
    await invoke(f.store, f.request);
  } finally {
    clearInterval(timer);
  }
  assert.ok(callbacks > 0, 'planning must not monopolize the parent event loop');
  assert.equal((await f.store.history(f.a.id, f.request.docId)).length, 501);
  t.diagnostic(
    JSON.stringify({
      sample: '500 synthetic 5000-character history entries',
      milliseconds: performance.now() - start,
      callbacks,
      longestCallbackGapMs: longestGap
    })
  );
});
