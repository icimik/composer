const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const io = require('../../electron/store/revisions/disk-io.cjs');
const disk = require('../../electron/store/revisions/disk.cjs');
const { setup } = require('../helpers/revision-disk-fixture.cjs');

for (const phase of ['write', 'sync']) {
  test(`failed exclusive ${phase} removes only its own file and recovery can proceed`, async (t) => {
    const { root, f, plan, targets } = await setup(t);
    const scratch = path.join(root, `${targets.manuscript}.operation-a.revision.tmp`);
    const original = fs.open;
    let inject = true;
    fs.open = async (file, ...args) => {
      const handle = await original(file, ...args);
      if (file === scratch && args[0] === 'wx' && inject) {
        inject = false;
        if (phase === 'write') {
          handle.writeFile = async (bytes) => {
            await handle.write(bytes.subarray(0, 2));
            throw Object.assign(new Error('Private synthetic details'), { code: 'EIO' });
          };
        } else {
          handle.sync = async () => {
            throw Object.assign(new Error('Private synthetic details'), { code: 'EIO' });
          };
        }
      }
      return handle;
    };
    t.after(() => {
      fs.open = original;
    });
    await assert.rejects(disk.execute(root, plan, f.policy), (e) => e.code === 'io-failure');
    await assert.rejects(fs.access(scratch), { code: 'ENOENT' });
    assert.ok(
      (await fs.readFile(path.join(root, targets.manuscript))).equals(plan.images.manuscript.before)
    );
    await disk.recover(root, 'operation-a', f.policy);
    assert.ok(
      (await fs.readFile(path.join(root, targets.manuscript))).equals(plan.images.manuscript.after)
    );
  });
}
test('exclusive failure never removes a replacement file or loses the original exception', async (t) => {
  const { root } = await setup(t);
  const relative = '.composer/owned.tmp';
  const file = path.join(root, relative);
  const original = fs.open;
  const failure = Object.assign(new Error('Synthetic write failure'), { code: 'ENOSPC' });
  fs.open = async (...args) => {
    const handle = await original(...args);
    if (args[0] === file) {
      handle.writeFile = async () => {
        await fs.rename(file, `${file}.retained`);
        await fs.writeFile(file, 'External replacement');
        throw failure;
      };
    }
    return handle;
  };
  t.after(() => {
    fs.open = original;
  });
  await assert.rejects(io.exclusive(root, relative, Buffer.from('New')), (e) => e === failure);
  assert.equal(await fs.readFile(file, 'utf8'), 'External replacement');
  assert.equal(await fs.readFile(`${file}.retained`, 'utf8'), '');
});
test('exclusive refuses pre-existing files without removing their bytes', async (t) => {
  const { root } = await setup(t);
  await fs.writeFile(path.join(root, '.composer/existing.tmp'), 'Unknown bytes');
  await assert.rejects(io.exclusive(root, '.composer/existing.tmp', Buffer.from('New')), {
    code: 'EEXIST'
  });
  assert.equal(
    await fs.readFile(path.join(root, '.composer/existing.tmp'), 'utf8'),
    'Unknown bytes'
  );
});
test('cleanup permission failure retains the partial file and preserves the original exception', async (t) => {
  const { root } = await setup(t);
  const file = path.join(root, '.composer/owned.tmp');
  const open = fs.open;
  const unlink = fs.unlink;
  const failure = Object.assign(new Error('Injected write'), { code: 'ENOSPC' });
  fs.open = async (...args) => {
    const handle = await open(...args);
    if (args[0] === file)
      handle.writeFile = async () => {
        await handle.write(Buffer.from('Partial'));
        throw failure;
      };
    return handle;
  };
  fs.unlink = async (target) => {
    if (target === file) throw Object.assign(new Error('Injected unlink'), { code: 'EACCES' });
    return unlink(target);
  };
  t.after(() => {
    fs.open = open;
    fs.unlink = unlink;
  });
  await assert.rejects(
    io.exclusive(root, '.composer/owned.tmp', Buffer.from('New')),
    (e) => e === failure
  );
  assert.equal(await fs.readFile(file, 'utf8'), 'Partial');
});
test('a validated scratch retained by process interruption is flushed before reuse', async (t) => {
  const { root, f, plan, targets } = await setup(t);
  await assert.rejects(
    disk.execute(root, plan, f.policy, async (phase) => {
      if (phase === 'scratch:manuscript') throw new Error('Stop after flushed scratch');
    })
  );
  const scratch = path.join(root, `${targets.manuscript}.operation-a.revision.tmp`);
  const original = fs.open;
  let synchronized = 0;
  fs.open = async (file, ...args) => {
    const handle = await original(file, ...args);
    if (file === scratch && typeof args[0] === 'number') {
      const sync = handle.sync.bind(handle);
      handle.sync = async () => {
        synchronized++;
        return sync();
      };
    }
    return handle;
  };
  t.after(() => {
    fs.open = original;
  });
  await disk.recover(root, 'operation-a', f.policy);
  assert.equal(synchronized, 1);
});
test('failed staging removes its owned partial file but retains the incomplete journal', async (t) => {
  const { root, f, plan, targets } = await setup(t);
  const file = path.join(root, '.composer/transactions/operation-a/manuscript.after');
  const original = fs.open;
  fs.open = async (...args) => {
    const handle = await original(...args);
    if (args[0] === file)
      handle.writeFile = async (bytes) => {
        await handle.write(bytes.subarray(0, 1));
        throw Object.assign(new Error('Injected staging write'), { code: 'ENOSPC' });
      };
    return handle;
  };
  t.after(() => {
    fs.open = original;
  });
  await assert.rejects(disk.execute(root, plan, f.policy), (e) => e.code === 'io-failure');
  await assert.rejects(fs.access(file), { code: 'ENOENT' });
  assert.ok(
    (await fs.readFile(path.join(root, targets.manuscript))).equals(plan.images.manuscript.before)
  );
  assert.deepEqual(await fs.readdir(path.dirname(file)), ['manuscript.before']);
  await assert.rejects(disk.preview(root, 'operation-a', f.policy), (e) => e.code === 'io-failure');
});
