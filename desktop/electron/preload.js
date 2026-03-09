const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  skills: {
    list: () => ipcRenderer.invoke('skills:list'),
    read: (name) => ipcRenderer.invoke('skills:read', name),
    create: (name, content, meta) => ipcRenderer.invoke('skills:create', name, content, meta),
    update: (name, content, meta) => ipcRenderer.invoke('skills:update', name, content, meta),
    remove: (name) => ipcRenderer.invoke('skills:remove', name),
  },
  sync: {
    run: (options) => ipcRenderer.invoke('sync:run', options),
  },
  config: {
    load: () => ipcRenderer.invoke('config:load'),
    set: (key, value) => ipcRenderer.invoke('config:set', key, value),
  },
  projects: {
    list: () => ipcRenderer.invoke('projects:list'),
    add: (dir) => ipcRenderer.invoke('projects:add', dir),
    remove: (dir) => ipcRenderer.invoke('projects:remove', dir),
  },
  dialog: {
    openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  },
});
