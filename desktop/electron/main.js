import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Import lib modules from parent project
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const libPath = path.resolve(__dirname, '../../lib');

let config, skills, sync;

async function loadLib() {
  config = await import(path.join(libPath, 'config.js'));
  skills = await import(path.join(libPath, 'skills.js'));
  sync = await import(path.join(libPath, 'sync.js'));
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#111113',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Dev or production
  const isDev = !app.isPackaged;
  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webPreferences.devTools = true;
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

function setupIPC() {
  // Skills
  ipcMain.handle('skills:list', () => skills.list());
  ipcMain.handle('skills:read', (_e, name) => skills.read(name));
  ipcMain.handle('skills:create', (_e, name, content, meta) => {
    skills.create(name, content, meta);
    return { ok: true };
  });
  ipcMain.handle('skills:update', (_e, name, content, meta) => {
    skills.update(name, content, meta);
    return { ok: true };
  });
  ipcMain.handle('skills:remove', (_e, name) => {
    skills.remove(name);
    return { ok: true };
  });

  // Sync
  ipcMain.handle('sync:run', (_e, options) => sync.sync(options));

  // Config
  ipcMain.handle('config:load', () => config.load());
  ipcMain.handle('config:set', (_e, key, value) => {
    config.set(key, value);
    return { ok: true };
  });

  // Projects — stored in config.json under "projects" key
  ipcMain.handle('projects:list', () => {
    const cfg = config.load();
    return cfg.projects || [];
  });
  ipcMain.handle('projects:add', (_e, dir) => {
    const cfg = config.load();
    if (!cfg.projects) cfg.projects = [];
    if (!cfg.projects.includes(dir)) {
      cfg.projects.push(dir);
      config.save(cfg);
    }
    return cfg.projects;
  });
  ipcMain.handle('projects:remove', (_e, dir) => {
    const cfg = config.load();
    cfg.projects = (cfg.projects || []).filter(p => p !== dir);
    config.save(cfg);
    return cfg.projects;
  });

  // Dialog
  ipcMain.handle('dialog:openDirectory', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    if (result.canceled) return null;
    return result.filePaths[0];
  });
}

app.whenReady().then(async () => {
  await loadLib();
  setupIPC();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
