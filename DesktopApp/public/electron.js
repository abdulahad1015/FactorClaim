const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Handle Squirrel events on Windows
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Check if running in development
const isDev = !app.isPackaged;

let mainWindow;
let autoUpdater = null;

/**
 * Initialize the auto-updater safely.
 * - Only runs in production (app-update.yml only exists in packaged builds)
 * - Wrapped in try-catch so a missing/broken config never crashes the app
 */
function initAutoUpdater() {
  if (isDev) {
    console.log('Auto-updater: skipped (development mode)');
    return;
  }

  try {
    const { autoUpdater: updater } = require('electron-updater');
    autoUpdater = updater;

    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on('checking-for-update', () => {
      console.log('Checking for updates...');
      if (mainWindow) mainWindow.webContents.send('update-checking');
    });

    autoUpdater.on('update-available', (info) => {
      console.log('Update available:', info.version);
      if (mainWindow) mainWindow.webContents.send('update-available', info);
    });

    autoUpdater.on('update-not-available', (info) => {
      console.log('App is up to date:', info.version);
      if (mainWindow) mainWindow.webContents.send('update-not-available', info);
    });

    autoUpdater.on('error', (err) => {
      console.error('Auto-updater error:', err.message);
      if (mainWindow) mainWindow.webContents.send('update-error', err.message);
    });

    autoUpdater.on('download-progress', (progressObj) => {
      console.log(`Download progress: ${Math.round(progressObj.percent)}%`);
      if (mainWindow) mainWindow.webContents.send('update-download-progress', progressObj);
    });

    autoUpdater.on('update-downloaded', (info) => {
      console.log('Update downloaded:', info.version);
      if (mainWindow) mainWindow.webContents.send('update-downloaded', info);
    });

    console.log('Auto-updater: initialized successfully');
  } catch (error) {
    console.error('Auto-updater: failed to initialize -', error.message);
    autoUpdater = null;
  }
}

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
    icon: path.join(__dirname, 'favicon.ico'),
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

  mainWindow.loadURL(startUrl);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  // Open DevTools only in development mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App ready event
app.whenReady().then(() => {
  createWindow();
  initAutoUpdater();

  // Schedule update checks only when updater is available
  if (autoUpdater) {
    // Check for updates on app start (after a delay to let the app load)
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch((err) =>
        console.error('Scheduled update check failed:', err.message)
      );
    }, 5000);

    // Check for updates every 4 hours
    setInterval(() => {
      autoUpdater.checkForUpdates().catch((err) =>
        console.error('Scheduled update check failed:', err.message)
      );
    }, 4 * 60 * 60 * 1000);
  }

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

// IPC handlers for auto-updates
ipcMain.handle('check-for-updates', async () => {
  if (autoUpdater) {
    try {
      await autoUpdater.checkForUpdates();
    } catch (err) {
      console.error('Manual update check failed:', err.message);
    }
  }
  return { isDev, updaterAvailable: !!autoUpdater };
});

ipcMain.handle('download-update', async () => {
  if (autoUpdater) {
    try {
      await autoUpdater.downloadUpdate();
    } catch (err) {
      console.error('Update download failed:', err.message);
    }
  }
});

ipcMain.handle('install-update', () => {
  if (autoUpdater) {
    setImmediate(() => {
      autoUpdater.quitAndInstall(false, true);
    });
  }
});
