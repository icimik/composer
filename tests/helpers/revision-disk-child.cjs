const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { fixture } = require('./revision-core-fixture.cjs');
const { createPlan } = require('../../electron/store/revisions/journal.cjs');
const disk = require('../../electron/store/revisions/disk.cjs');

async function main() {
  const [root, nonce, kind, boundary] = process.argv.slice(2);
  const temporary = await fs.realpath(os.tmpdir());
  if (
    !path.resolve(root).startsWith(temporary + path.sep + 'composer-revision-') ||
    (await fs.realpath(root)) !== root ||
    (await fs.readFile(path.join(root, '.fixture-ownership'), 'utf8')) !== nonce
  )
    throw new Error('Fixture ownership missing');
  const f = fixture(kind);
  const plan = createPlan(f.fields, f.images, f.policy, f.availableBytes);
  await disk.execute(root, plan, f.policy, async (phase) => {
    if (phase === boundary) process.exit(77);
  });
}
main().catch(() => {
  console.error('Synthetic revision child failed; no raw data published.');
  process.exitCode = 1;
});
