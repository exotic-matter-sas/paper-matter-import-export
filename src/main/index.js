/*
 * Copyright (c) 2019 Exotic Matter SAS. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import {app, BrowserWindow, ipcMain, Menu} from 'electron'
import {getTemplate} from "./appMenuTemplate";

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow;
let menu;
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`;
const log = require('electron-log');
const fs = require('fs');
const path = require('path');

// Set log level for main process
const debugFilePath = path.join(app.getPath("appData"), "paper-matter-import-export", "DEBUG-MODE");
export let debugMode = fs.existsSync(debugFilePath);
log.transports.file.level =  debugMode ? "silly" : "error";
log.transports.console.level = "silly";

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    // When using run dev, electron version may be shown instead of packages.json version
    title: 'Paper Matter import & export - ' + app.getVersion(),
    width: 500,
    height: 438,
    useContentSize: false, // width and height set webview content instead of windows size (with borders and title bar)
    webPreferences: {
      nodeIntegration: true, // not an issue as long as we do not display third party web page through the app
      webSecurity: process.env.NODE_ENV !== 'development' // to allow requesting API from localhost during development
    }
  });

  // Set custom menu
  menu = Menu.buildFromTemplate(getTemplate(debugMode));
  Menu.setApplicationMenu(menu);

  mainWindow.setMenuBarVisibility(false);
  mainWindow.setAutoHideMenuBar(true); // user can bring menu hitting alt key

  mainWindow.loadURL(winURL);

  mainWindow.on('close', (event) => {
    event.preventDefault();
    mainWindow.webContents.send('closeMainWindow'); // emit event to VueJS main to ask user for confirmation if needed
  });
  ipcMain.on('closeConfirmed', (event, message) => {
    mainWindow.destroy();
  });

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

export function toggleDebugFileLogLevel() {
  let level;
  debugMode = !debugMode;

  // update main process log level
  debugMode ? level = 'silly' : level = 'error';
  log.transports.file.level = level;
  // update render process log level
  if (mainWindow !==undefined) {
    debugMode ? level = 'silly' : level = 'error';
    mainWindow.webContents.send("updateFileLogLevel", level);
  }
  // Use a DEBUG file in config folder to persist setting after app restart
  debugMode ? fs.closeSync(fs.openSync(debugFilePath, 'w')) : fs.unlinkSync(debugFilePath);
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
});

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

import { autoUpdater } from 'electron-updater'
autoUpdater.logger = log;

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production' || process.env.DEBUG === 'electron-builder'){
    autoUpdater.checkForUpdates();
  }
});

autoUpdater.on('update-not-available', (info) => {
  mainWindow.webContents.send("updateNotAvailable");
});
autoUpdater.on('error', (err) => {
  mainWindow.webContents.send("updateError");
  log.error("Error during update:\n", err)
});
// This event is not emitted during differential download so SplashScreen progressbar may not be shown currently
// https://github.com/electron-userland/electron-builder/issues/2521#issuecomment-363130128
autoUpdater.on('download-progress', (progressObj) => {
  mainWindow.webContents.send("downloadingUpdate", progressObj.transferred, progressObj.total);
});
autoUpdater.on('update-downloaded', (info) => {
  mainWindow.webContents.send("updateDownloaded");
  autoUpdater.quitAndInstall()
});
