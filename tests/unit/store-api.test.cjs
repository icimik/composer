const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Store, atomic, hash, newId, idSchema } = require('../../electron/store.cjs');

test('split Store preserves public methods and class descriptor semantics', () => {
  const expected = [
    'serial',
    'init',
    'persistRegistry',
    'entry',
    'manifestPath',
    'protectedFile',
    'meta',
    'writeMeta',
    'docPath',
    'workspace',
    'workspaceResult',
    'writableMeta',
    'load',
    'createWorkspace',
    'openWorkspace',
    'switchWorkspace',
    'updateWorkspace',
    'createDocument',
    'history',
    'saveDocument',
    'createSession',
    'switchSession',
    'updateSession',
    'addProposal',
    'resolveProposal',
    'restore',
    'exportText'
  ];
  assert.deepEqual(
    Object.getOwnPropertyNames(Store.prototype)
      .filter((name) => name !== 'constructor')
      .sort(),
    expected.sort()
  );
  assert.deepEqual(Object.keys(Store.prototype), []);
  for (const name of expected) {
    const descriptor = Object.getOwnPropertyDescriptor(Store.prototype, name);
    assert.equal(typeof descriptor.value, 'function');
    assert.equal(descriptor.writable, true);
    assert.equal(descriptor.configurable, true);
  }
  assert.equal(typeof atomic, 'function');
  assert.equal(typeof hash, 'function');
  assert.equal(typeof newId, 'function');
  assert.equal(idSchema.parse('fixture-id'), 'fixture-id');
});
