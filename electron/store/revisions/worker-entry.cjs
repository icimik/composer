const { parentPort, workerData } = require('node:worker_threads');
const { UserFacingError, safeError } = require('../../errors.cjs');
const { WorkspaceFault } = require('../diagnostics.cjs');
const { resourcePolicy } = require('./resource-policy.cjs');

async function main() {
  const { task, root, request } = workerData;
  let value;
  if (task === 'mutate')
    value = await require('./mutation.cjs').mutate(root, request, resourcePolicy);
  else if (task === 'preview')
    value = await require('./service.cjs').preview(root, request.workspaceId, resourcePolicy);
  else if (task === 'apply')
    value = await require('./service.cjs').apply(root, request, resourcePolicy);
  else throw new Error('Invalid worker task');
  parentPort.postMessage({ value });
}
main()
  .catch((error) => {
    parentPort.postMessage({
      error: {
        message: safeError(error).message,
        code:
          error instanceof UserFacingError || error instanceof WorkspaceFault
            ? error.code
            : 'io-failure'
      }
    });
  })
  .finally(() => parentPort.close());
