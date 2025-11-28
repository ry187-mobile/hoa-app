const { contextBridge } = require('electron');

// Expose minimal API/window-safe methods here if required later
contextBridge.exposeInMainWorld('electronAPI', {
  // Example: show a version or provide read-file functionality if needed
});
