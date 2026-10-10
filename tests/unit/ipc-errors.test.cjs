const { test } = require('node:test');
const assert = require('node:assert/strict');
const { UserFacingError, safeError } = require('../../electron/errors.cjs');
const { WorkspaceFault, fault } = require('../../electron/store/diagnostics.cjs');
test('IPC/startup errors retain only explicitly safe user messages, not raw exceptions', () => {
  for (const error of [
    new Error('/private/manuscript secret-key'),
    new SyntaxError('private excerpt'),
    { code: 'EACCES', message: 'private absolute path' },
    null
  ]) {
    const safe = safeError(error);
    assert.ok(!safe.message.includes('private'));
    assert.ok(!safe.message.includes('secret-key'));
  }
  assert.equal(safeError(new UserFacingError('安全提示')).message, '安全提示');
  assert.equal(safeError(new WorkspaceFault('missing-document')).message, '被引用的文稿文件缺失。');
  assert.equal(fault(null, 'missing-manifest').code, 'unknown');
});
