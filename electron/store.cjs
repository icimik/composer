const { atomic, hash, newId, idSchema } = require('./store/primitives.cjs');
class Store {
  constructor(root) {
    this.root = root;
    this.registry = null;
    this.queue = Promise.resolve();
  }
  serial(fn) {
    const task = this.queue.then(fn);
    this.queue = task.catch(() => {});
    return task;
  }
}
// These explicit method groups share the same Store receiver and serialized queue.
const groups = [
  require('./store/files.cjs'),
  require('./store/workspaces.cjs'),
  require('./store/documents.cjs'),
  require('./store/sessions.cjs')
];
for (const methods of groups) {
  for (const [name, value] of Object.entries(methods)) {
    Object.defineProperty(Store.prototype, name, { value, writable: true, configurable: true });
  }
}
module.exports = { Store, atomic, hash, newId, idSchema };
