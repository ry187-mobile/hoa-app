const { app, BrowserWindow, Menu, dialog } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // In dev, ELECTRON_START_URL points to CRA dev server
  const startUrl = process.env.ELECTRON_START_URL;
  if (startUrl) {
    win.loadURL(startUrl);
  } else {
    win.loadFile(path.join(__dirname, 'build', 'index.html'));
  }

  // Setup simple application menu with view menu (DevTools toggle)
  const isMac = process.platform === 'darwin';
  const template = [
    // { role: 'appMenu' }
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    // { role: 'fileMenu' }
    {
      label: 'File',
      submenu: [
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    // { role: 'viewMenu' }
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forcereload' },
        { role: 'toggledevtools' },
      ]
    },
    // { role: 'windowMenu' }
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

  app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Global handlers for main-process errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception in Electron main process:', err);
  dialog.showErrorBox('Critical Error', `An error occurred in the application: ${err.message}`);
});

app.on('web-contents-created', (event, contents) => {
  contents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Renderer failed to load:', errorCode, errorDescription, validatedURL);
    dialog.showErrorBox('Load Error', `Failed to load app content: ${errorDescription} (code ${errorCode})`);
  });
  contents.on('render-process-gone', (event, details) => {
    console.error('Renderer process gone', details);
    dialog.showErrorBox('Renderer Crashed', `Renderer process crashed: ${details.reason}`);
  });
});
