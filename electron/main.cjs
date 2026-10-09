const {
  app,
  BrowserWindow,
  ipcMain,
  protocol,
  net,
  dialog,
  session,
  safeStorage
} = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { Store, atomic } = require('./store.cjs');
const { AI } = require('./ai.cjs');
const crypto = require('node:crypto');
protocol.registerSchemesAsPrivileged([
  { scheme: 'composer', privileges: { standard: true, secure: true, supportFetchAPI: true } }
]);
const isTest = !app.isPackaged && process.env.COMPOSER_E2E === '1';
if (isTest) app.setPath('userData', process.env.COMPOSER_TEST_ROOT);
if (!app.requestSingleInstanceLock()) app.quit();
else {
  let win,
    store,
    ai,
    closing = false;
  app.on('second-instance', () => {
    win?.show();
    win?.focus();
  });
  app
    .whenReady()
    .then(async () => {
      const root = path.join(app.getPath('userData'), 'data');
      store = new Store(root);
      await store.init();
      // E2E uses a process-local encrypted fixture vault, never an OS secret or a real API key.
      // This branch is unreachable in packaged applications.
      const fixtureKey = isTest ? crypto.randomBytes(32) : null;
      const testVault = {
        isEncryptionAvailable: () => true,
        getSelectedStorageBackend: () => 'e2e-fixture',
        encryptString: (value) => {
          const iv = crypto.randomBytes(12);
          const c = crypto.createCipheriv('aes-256-gcm', fixtureKey, iv);
          const encrypted = Buffer.concat([c.update(value, 'utf8'), c.final()]);
          return Buffer.concat([iv, c.getAuthTag(), encrypted]);
        },
        decryptString: (value) => {
          const d = crypto.createDecipheriv('aes-256-gcm', fixtureKey, value.subarray(0, 12));
          d.setAuthTag(value.subarray(12, 28));
          return Buffer.concat([d.update(value.subarray(28)), d.final()]).toString('utf8');
        }
      };
      ai = new AI(store, isTest ? testVault : safeStorage, path.join(__dirname, '../framework'), {
        allowTestHttp: isTest
      });
      protocol.handle('composer', (request) => {
        const u = new URL(request.url);
        if (u.host !== 'app') return new Response('Forbidden', { status: 403 });
        let decoded;
        try {
          decoded = decodeURIComponent(u.pathname);
        } catch {
          return new Response('Bad path', { status: 400 });
        }
        const file = path.resolve(
          __dirname,
          '../dist',
          '.' + (decoded === '/' ? '/index.html' : decoded)
        );
        const dist = path.resolve(__dirname, '../dist');
        if (!file.startsWith(dist + path.sep)) return new Response('Forbidden', { status: 403 });
        return net.fetch(pathToFileURL(file).toString());
      });
      session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) =>
        callback(false)
      );
      const handlers = {
        load: () => store.load(),
        createWorkspace: (name) => store.serial(() => store.createWorkspace(name)),
        openWorkspace: async () => {
          const r = await dialog.showOpenDialog(win, { properties: ['openDirectory'] });
          if (r.canceled) return null;
          return store.serial(() => store.openWorkspace(r.filePaths[0]));
        },
        switchWorkspace: (id) => store.serial(() => store.switchWorkspace(id)),
        saveDocument: (...args) => store.serial(() => store.saveDocument(...args)),
        createDocument: (...args) => store.serial(() => store.createDocument(...args)),
        updateWorkspace: (...args) => store.serial(() => store.updateWorkspace(...args)),
        createSession: (...args) => store.serial(() => store.createSession(...args)),
        updateSession: (...args) => store.serial(() => store.updateSession(...args)),
        switchSession: (...args) => store.serial(() => store.switchSession(...args)),
        getSettings: (wid) => ai.settings(wid),
        setSettings: (...args) => store.serial(() => ai.configure(...args)),
        generate: (...args) => ai.generate(...args),
        cancel: (id) => ai.cancel(id),
        resolveProposal: (...args) => store.serial(() => store.resolveProposal(...args)),
        snapshots: (...args) => store.history(...args),
        restore: (...args) => store.serial(() => store.restore(...args)),
        exportWorkspace: async (wid) => {
          const text = await store.exportText(wid);
          const r = await dialog.showSaveDialog(win, {
            defaultPath: 'manuscript.md',
            filters: [{ name: 'Markdown', extensions: ['md'] }]
          });
          if (r.canceled) return null;
          await atomic(r.filePath, text);
          return r.filePath;
        },
        setTheme: (theme) =>
          store.serial(async () => {
            if (!['light', 'dark'].includes(theme)) throw new Error('无效主题。');
            store.registry.theme = theme;
            await store.persistRegistry();
          })
      };
      for (const [name, fn] of Object.entries(handlers))
        ipcMain.handle(`composer:${name}`, async (event, ...args) => {
          if (
            event.sender !== win?.webContents ||
            event.senderFrame !== event.sender.mainFrame ||
            event.senderFrame.url !== 'composer://app/'
          )
            throw new Error('拒绝未经授权的调用。');
          return fn(...args);
        });
      win = new BrowserWindow({
        width: 1500,
        height: 960,
        minWidth: 900,
        minHeight: 640,
        title: 'Icimik Composer',
        backgroundColor: '#f6f5f1',
        webPreferences: {
          preload: path.join(__dirname, 'preload.cjs'),
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true
        }
      });
      win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
      win.webContents.on('will-navigate', (e) => e.preventDefault());
      win.on('close', (event) => {
        if (closing) return;
        event.preventDefault();
        win.webContents
          .executeJavaScript('window.dispatchEvent(new Event("composer-before-close"))')
          .catch(() => {
            closing = true;
            win.close();
          });
      });
      // The renderer flushes its current draft, then acknowledges close.
      ipcMain.handle('composer:close-ready', async (event) => {
        if (
          event.sender !== win.webContents ||
          event.senderFrame !== event.sender.mainFrame ||
          event.senderFrame.url !== 'composer://app/'
        )
          return;
        await store.queue;
        closing = true;
        win.close();
      });
      await win.loadURL('composer://app/');
      win.webContents.on('render-process-gone', () => {
        closing = true;
      });
    })
    .catch((e) => {
      dialog.showErrorBox('Icimik Composer 无法启动', e.message);
      app.quit();
    });
  app.on('window-all-closed', () => app.quit());
}
