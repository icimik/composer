async function cleanupFixture(app, cleanups) {
  const errors = [];
  try {
    if (app) {
      // Synthetic teardown only; restart assertions use the ordinary app.close() path.
      await app
        .evaluate(({ BrowserWindow }) => {
          for (const win of BrowserWindow.getAllWindows()) win.removeAllListeners('close');
        })
        .catch(() => {});
      await app.close();
    }
  } catch (error) {
    errors.push(error);
  }
  for (const cleanup of cleanups) {
    try {
      await cleanup();
    } catch (error) {
      errors.push(error);
    }
  }
  if (errors.length === 1) throw errors[0];
  if (errors.length > 1)
    throw new AggregateError(errors, 'Fixture teardown failures', { cause: errors[0] });
}
module.exports = { cleanupFixture };
