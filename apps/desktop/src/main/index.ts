import { electronApp, is, optimizer } from '@electron-toolkit/utils';
import { BrowserWindow, app, ipcMain, protocol, shell } from 'electron';
import { createHandler } from 'next-electron-rsc';
import path, { join } from 'node:path';

import icon from '../../resources/icon.png?asset';

const appPath = app.getAppPath();
const localhostUrl = 'http://localhost:3010'; // must match Next.js dev server
const standaloneDir = is.dev
  ? path.join(__dirname, '../../../../.next', 'standalone', 'demo')
  : path.join(appPath, '.next', 'standalone', 'demo');

const createWindow = async () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    autoHideMenuBar: true,
    height: 670,
    show: false,
    width: 900,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      contextIsolation: true, // protect against prototype pollution
      preload: join(__dirname, '../preload/index.js'),
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  const loadURL = async () => {
    if (!is.dev) {
      console.log(
        `[APP] Server Debugging Enabled, ${localhostUrl} will be intercepted to ${standaloneDir}`,
      );

      const { createInterceptor } = createHandler({
        localhostUrl,
        protocol,
        standaloneDir,
      });

      createInterceptor({ session: mainWindow.webContents.session });
    }
  };
  await mainWindow.loadURL(localhostUrl);

  loadURL();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
// eslint-disable-next-line unicorn/prefer-top-level-await
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron');

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // IPC test
  ipcMain.on('ping', () => console.log('pong'));

  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
