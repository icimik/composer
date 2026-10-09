const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const { renderTemplate } = require('../../scripts/design/templates.cjs');
const { runShowcase } = require('../helpers/showcase-dom.cjs');
const repo = path.resolve(__dirname, '../..');

test('design template rendering rejects missing values', () => {
  assert.throws(() => renderTemplate('spec', {}), /Missing template value/);
});

test('extracted templates reproduce specification and preserve showcase interactions', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'composer-design-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  for (const file of ['scripts/design.cjs', 'scripts/design', 'src/styles.css']) {
    const target = path.join(root, file);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.cp(path.join(repo, file), target, { recursive: true });
  }
  execFileSync(process.execPath, [path.join(root, 'scripts/design.cjs')], { timeout: 10000 });
  const generated = path.join(root, 'docs/research');
  assert.equal(
    await fs.readFile(path.join(generated, '08-设计规范.md'), 'utf8'),
    await fs.readFile(path.join(repo, 'docs/research/08-设计规范.md'), 'utf8')
  );
  const baseline = runShowcase(
    await fs.readFile(path.join(repo, 'docs/research/design-showcase.html'), 'utf8')
  );
  const updated = runShowcase(
    await fs.readFile(path.join(generated, 'design-showcase.html'), 'utf8')
  );
  const compare = () => assert.deepEqual(updated.snapshot(), baseline.snapshot());
  compare();
  for (const instance of [baseline, updated]) {
    instance.get('mode').value = 'dark';
    instance.get('mode').onchange();
    instance.get('scheme').value = 'mono';
    instance.get('scheme').onchange();
    instance.get('density').value = 'compact';
    instance.get('density').onchange();
  }
  compare();
  for (const action of ['accept', 'reset', 'discard', 'reset', 'cancel', 'character', 'chapter']) {
    for (const instance of [baseline, updated]) instance.get(action).onclick();
    compare();
  }
});
