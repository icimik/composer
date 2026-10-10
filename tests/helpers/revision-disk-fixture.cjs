const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { fixture } = require('./revision-core-fixture.cjs');
const core = require('../../electron/store/revisions/journal.cjs');
const { hash } = require('../../electron/store/primitives.cjs');

const targets = {
  manuscript: '07-writing/chapters/document-a.md',
  manifest: '.composer/workspace.json',
  history: '.composer/history/document-a.json',
  audit: '08-operations/logs/changes.jsonl'
};
async function setup(t, kind = 'save') {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'composer-revision-')));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const nonce = randomUUID();
  await fs.writeFile(path.join(root, '.fixture-ownership'), nonce);
  const f = fixture(kind);
  const plan = core.createPlan(f.fields, f.images, f.policy, f.availableBytes);
  for (const [kind, relative] of Object.entries(targets)) {
    const value = plan.images[kind].before;
    if (value === null) continue;
    const file = path.join(root, relative);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, value);
  }
  return { root, nonce, f, plan, targets };
}
async function inventory(root, relative = '') {
  const result = {};
  const dir = path.join(root, relative);
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const next = path.join(relative, entry.name);
    if (entry.isDirectory()) Object.assign(result, await inventory(root, next));
    else if (entry.isSymbolicLink())
      result[next] = `link:${await fs.readlink(path.join(root, next))}`;
    else result[next] = hash(await fs.readFile(path.join(root, next)));
  }
  return result;
}
module.exports = { setup, inventory, targets };
