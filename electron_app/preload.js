const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('fileAPI', {
  getCurrentDir: () => ipcRenderer.invoke('get-current-dir'),
  createFolder: (folderPath) => ipcRenderer.invoke('create-folder', folderPath),
  downloadFile: (url, dest) => ipcRenderer.invoke('download-file', { url, dest }),
  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
  // contextBridge.exposeInMainWorld('torrentAPI', {
  download: (magnetOrUrl) => ipcRenderer.invoke('download-torrent', magnetOrUrl),
  onProgress: (callback) => ipcRenderer.on('torrent-progress', (event, data) => callback(data))
// })
});
