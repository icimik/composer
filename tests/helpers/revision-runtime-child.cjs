const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { Store } = require('../../electron/store.cjs');
const runner = require('../../electron/store/revisions/worker-runner.cjs');
const { mutate } = require('../../electron/store/revisions/mutation.cjs');
const { resourcePolicy } = require('../../electron/store/revisions/resource-policy.cjs');
const { invoke } = require('./revision-runtime-fixture.cjs');

async function main() {
  const [root, nonce, raw, phase] = process.argv.slice(2);
  const temporary = await fs.realpath(os.tmpdir());
  if (
    !path.resolve(root).startsWith(temporary + path.sep + 'composer-isolation-') ||
    (await fs.realpath(root)) !== root ||
    (await fs.readFile(path.join(root, '.revision-ownership'), 'utf8')) !== nonce
  )
    throw Error('Fixture ownership missing');
  const request = JSON.parse(raw);
  const store = new Store(path.join(root, 'data'));
  await store.init();
  const target = store.entry(request.wid).path;
  if (
    !target.startsWith(path.join(root, 'data/workspaces') + path.sep) ||
    (await fs.realpath(target)) !== target
  )
    throw Error('Fixture workspace ownership missing');
  const original = runner.run;
  // Trusted fixture-only interception. Production exposes neither hooks nor fault environment switches.
  runner.run = (task, target, fields) =>
    task === 'mutate'
      ? mutate(target, fields, resourcePolicy, async (step) => {
          if (step === phase) process.exit(77);
        })
      : original(task, target, fields);
  await store.serial(() => invoke(store, request));
  throw Error('Interruption not reached');
}
main().catch(() => {
  console.error('Owned runtime interruption fixture failed; raw data omitted.');
  process.exitCode = 1;
});
