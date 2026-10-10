const { ipcMain } = require('electron');
const { UserFacingError, safeError } = require('./errors.cjs');
function registerHandlers(handlers, window) {
  for (const [name, fn] of Object.entries(handlers)) {
    ipcMain.handle(`composer:${name}`, async (event, ...args) => {
      if (
        event.sender !== window()?.webContents ||
        event.senderFrame !== event.sender.mainFrame ||
        event.senderFrame.url !== 'composer://app/'
      )
        throw new UserFacingError('拒绝未经授权的调用。');
      try {
        return await fn(...args);
      } catch (error) {
        throw safeError(error);
      }
    });
  }
}
module.exports = { registerHandlers };
