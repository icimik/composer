const reasons = {
  'invalid-json': '工作区信息文件不是有效 JSON。',
  'invalid-manifest': '工作区信息或内部引用无效。',
  'missing-manifest': '工作区信息文件缺失。',
  'missing-document': '被引用的文稿文件缺失。',
  'read-denied': '没有读取工作区文件的权限。',
  'unsafe-path': '工作区路径或符号链接不符合安全要求。',
  'read-failed': '无法读取工作区文件。',
  unknown: '原因暂无法确定。'
};
class WorkspaceFault extends Error {
  constructor(code) {
    super(reasons[code]);
    this.code = code;
  }
}
function fault(error, missing) {
  if (error instanceof WorkspaceFault) return error;
  if (error?.code === 'ENOENT') return new WorkspaceFault(missing);
  if (['EACCES', 'EPERM'].includes(error?.code)) return new WorkspaceFault('read-denied');
  if (['EIO', 'ENOTDIR', 'EISDIR', 'EMFILE', 'ENFILE'].includes(error?.code))
    return new WorkspaceFault('read-failed');
  return new WorkspaceFault('unknown');
}
function unavailable(entry, error) {
  const safe = fault(error, 'read-failed');
  return {
    status: 'unavailable',
    id: entry.id,
    name: entry.name,
    diagnostic: {
      code: safe.code,
      message: safe.message,
      nextStep: '请保留原目录，检查文件或权限；外部修复后点击重试。原文件未自动修复或替换。'
    }
  };
}
module.exports = { WorkspaceFault, fault, unavailable };
