const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // future API
});
