const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Check if running in development
const isDev = !app.isPackaged;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'icon.png'),
    title: 'FactorClaim',
    show: false
  });

  // Load the app
  let startUrl;
  if (isDev) {
    startUrl = 'http://localhost:3000';
  } else {
    // When packaged, build is in resources folder
    startUrl = `file://${path.join(process.resourcesPath, 'build', 'index.html')}`;
  }

  console.log('isDev:', isDev);
  console.log('Loading URL:', startUrl);
  console.log('__dirname:', __dirname);

  mainWindow.loadURL(startUrl);

  // Log any loading errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  // Log when page finishes loading
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page loaded successfully');
    // Execute a script to check if React mounted
    mainWindow.webContents.executeJavaScript(`
      console.log('Checking if React is mounted...');
      console.log('Root element:', document.getElementById('root'));
      console.log('Root innerHTML length:', document.getElementById('root').innerHTML.length);
    `).catch(err => console.error('Failed to execute script:', err));
  });

  // Catch any console messages from the renderer
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`Renderer console [${level}]:`, message);
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools to debug
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App ready event
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for potential future use
ipcMain.handle('app-version', () => {
  return app.getVersion();
});

ipcMain.handle('app-name', () => {
  return app.getName();
});
