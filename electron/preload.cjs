const { contextBridge, ipcRenderer } = require('electron');
const names = [
  'load',
  'createWorkspace',
  'openWorkspace',
  'switchWorkspace',
  'saveDocument',
  'createDocument',
  'updateWorkspace',
  'createSession',
  'updateSession',
  'switchSession',
  'getSettings',
  'setSettings',
  'generate',
  'cancel',
  'resolveProposal',
  'snapshots',
  'restore',
  'revisionPreview',
  'applyRevision',
  'exportWorkspace',
  'setTheme'
];
contextBridge.exposeInMainWorld(
  'composer',
  Object.fromEntries(
    names.map((name) => [name, (...args) => ipcRenderer.invoke(`composer:${name}`, ...args)])
  )
);
contextBridge.exposeInMainWorld('composerClose', () => ipcRenderer.invoke('composer:close-ready'));
