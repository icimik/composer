const { WorkspaceFault } = require('./store/diagnostics.cjs');
class UserFacingError extends Error {}
function safeError(error) {
  if (error instanceof UserFacingError || error instanceof WorkspaceFault)
    return new Error(error.message);
  return new Error('本地操作失败，请检查文件和权限；编辑区内容仍保留，不会自动修复原文件。');
}
module.exports = { UserFacingError, safeError };
