// In preload.js:
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('torrentAPI', {
  download: (magnetURI, fileName) => ipcRenderer.invoke('start-torrent-download', magnetURI, fileName),
  onProgress: (callback) => ipcRenderer.on('torrent-download-progress', (event, data) => callback(data))
})
