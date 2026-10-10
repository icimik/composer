async function cleanupFixture(app, cleanups) {
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
  } finally {
    for (const cleanup of cleanups) await cleanup();
  }
}
module.exports = { cleanupFixture };
