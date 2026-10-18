const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('jvDesktop', {
  onLogout: (callback) => ipcRenderer.on('jv-logout', callback),
})
