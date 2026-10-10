const path = require('node:path');
const { Worker } = require('node:worker_threads');
const { UserFacingError } = require('../../errors.cjs');

function run(task, root, request) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.join(__dirname, 'worker-entry.cjs'), {
      workerData: { task, root, request },
      execArgv: []
    });
    let received = false;
    const unavailable = () => {
      const error = new UserFacingError('修订处理未完成，请保留输入并检查修订记录。');
      error.code = 'io-failure';
      reject(error);
    };
    worker.once('message', (result) => {
      received = true;
      if (result.error) {
        const error = new UserFacingError(result.error.message);
        error.code = result.error.code;
        reject(error);
      } else resolve(result.value);
    });
    worker.once('error', unavailable);
    worker.once('exit', () => {
      if (!received) unavailable();
    });
  });
}
module.exports = { run };
