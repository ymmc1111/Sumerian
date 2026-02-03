import { app, BrowserWindow, dialog } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setupHandlers } from './main/ipc/handlers';
import { windowManager } from './main/windows/WindowManager';
import { resolveClaudePathSync } from './main/cli/resolveClaudePath';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (process.platform === 'win32') {
  try {
    const started = require('electron-squirrel-startup');
    if (started) {
      app.quit();
    }
  } catch {
    // Module not available on non-Windows platforms
  }
}

// Resolve claude CLI path early (caches result for zero-latency spawns)
try {
  const claudePath = resolveClaudePathSync();
  console.log(`[Sumerian] Claude CLI found at: ${claudePath}`);
} catch (error: any) {
  app.whenReady().then(() => {
    dialog.showErrorBox(
      'Claude CLI Not Found',
      error.message || 'Please install the Claude CLI and restart Sumerian.'
    );
    app.quit();
  });
}

setupHandlers();

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1000,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // DevTools can be opened manually with Cmd+Option+I
  
  // Register main window with window manager
  windowManager.setMainWindow(mainWindow);
  
  // Set preload path for detached windows (must use __dirname from here, not from WindowManager)
  windowManager.setPreloadPath(path.join(__dirname, 'preload.cjs'));
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
