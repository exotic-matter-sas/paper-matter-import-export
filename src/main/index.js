/*
 * Copyright (c) 2019 Exotic Matter SAS. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import {app, BrowserWindow, ipcMain} from 'electron'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow;
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`;

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    // When using run dev, electron version may be shown instead of packages.json version
    title: 'Paper Matter import and export - ' + app.getVersion(),
    width: 500,
    height: 375,
    useContentSize: false, // width and height set webview content instead of windows size (with borders and title bar)
    webPreferences: {
      nodeIntegration: true, // not an issue as long as we do not display third party web page through the app
      webSecurity: process.env.NODE_ENV !== 'development' // to allow requesting API from localhost during development
    }
  });

  mainWindow.setMenuBarVisibility(false);

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

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
});

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
});

