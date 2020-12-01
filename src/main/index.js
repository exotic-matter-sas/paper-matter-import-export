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

const appName = "Paper Matter import & export";

function createWindow () {
  /**
   * Initial window options
   */
  let browserWindowOptions = {
    // When using run dev, electron version may be shown instead of packages.json version
    title: `${appName} - ${app.getVersion()}`,
    width: 500,
    height: 438,
    useContentSize: false, // width and height set webview content instead of windows size (with borders and title bar)
    webPreferences: {
      nodeIntegration: true, // not an issue as long as we do not display third party web page through the app
      webSecurity: process.env.NODE_ENV !== 'development' // to allow requesting API from localhost during development
    }
  };
  if (process.env.NODE_ENV !== 'development' && process.platform === 'linux') {
    // Workaround to make icon work for AppImage (in task bar only, icon not appears on .AppImage file)
    // https://github.com/electron-userland/electron-builder/issues/748#issuecomment-406786917
    // https://github.com/electron-userland/electron-builder/issues/748#issuecomment-342062462
    browserWindowOptions['icon'] = path.join(process.env.APPDIR, "paper-matter-import-export.png");
  }
  mainWindow = new BrowserWindow(browserWindowOptions);

  // Set custom menu
  menu = Menu.buildFromTemplate(getTemplate(debugMode));
  Menu.setApplicationMenu(menu);

  mainWindow.setMenuBarVisibility(false);
  mainWindow.setAutoHideMenuBar(true); // user can bring out menu using Alt key

  mainWindow.loadURL(winURL);

  mainWindow.on('close', (event) => {
    event.preventDefault();
    mainWindow.webContents.send('closeMainWindow'); // emit event to VueJS main to ask user for confirmation if needed
  });
  ipcMain.on('closeConfirmed', (event, message) => {
    mainWindow.destroy();
  });

  mainWindow.on('closed', () => {
    if (localServer && localServer.listening) {
      shutdownLocalServer();
    }
    mainWindow = null;
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
  app.quit()
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

ipcMain.on('checkForUpdate', () => {
  autoUpdater.checkForUpdates()
    // in case autoUpdater "error" event is not emitted
    .catch((err) => {
      log.error("Unhandled error during update:\n", err);
      mainWindow.webContents.send("updateError");
    });
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


/**
 * Local server to listen for redirect uri for Oauth2 flow
 *
 */
const http = require('http');
let localServer;
let localServerSockets;

// We have to kill every socket alive to be able to close the server
function shutdownLocalServer () {
  for (const socket of localServerSockets) {
    socket.destroy();
  }
  localServer.close(() => log.debug("Local server closed"));
}

ipcMain.on('startLocalServer', (event, apiHostName) => {
  let error;
  log.debug("Local server started, listening for Oauth2 redirect URI...");

  localServer = http.createServer()
    .setTimeout(10000)
    .listen(1612);
  localServerSockets = new Set();


  localServer.on('connection', socket => {
    localServerSockets.add(socket);
    socket.once('close', () => {
      localServerSockets.delete(socket);
    })
  });

  localServer.on('request',(req, res) => {
    log.debug("Oauth2 flow [2]: request received by local server");
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);

    if (parsedUrl.pathname === '/oauth2/redirect') {
      if (parsedUrl.searchParams.has('code')) {
        log.debug("Oauth2 flow [2]: OK, redirect URI properly formatted with authorization code");
        res.writeHead(302, {
          'Location': `${apiHostName}/oauth2/authorization_ok/?app_name=${encodeURIComponent(appName)}`
        });
        res.end();
        mainWindow.webContents.send("oauthFlowSuccess", parsedUrl.searchParams.get('code'));

        // Closing local server as Oauth2 flow is completed (it will be restarted when login page is mounted)
        shutdownLocalServer();
      }
      else if (parsedUrl.searchParams.has('error')) {
        error = parsedUrl.searchParams.get('error');
        log.error("Oauth2 flow [2]: server returns an error:\n", error);
        res.writeHead(302, {
          'Location': `${apiHostName}/oauth2/authorization_ko/?app_name=${encodeURIComponent(appName)}&error=${error}`
        });
        res.end();
        mainWindow.webContents.send("oauthFlowError", error);
      }
      // querystring missing
      else {
        error = 'query_string_missing';
        log.error(`Oauth2 flow [2]: redirect URI malformed (${error})`);
        res.writeHead(302, {
          'Location': `${apiHostName}/oauth2/authorization_ko/?app_name=${encodeURIComponent(appName)}&error=${error}`
        });
        res.end();
        mainWindow.webContents.send("oauthFlowError", error);
      }
    }
    // wrong url called
    else {
      error = 'wrong_url_called';
      log.error(`Oauth2 flow [2]: redirect URI malformed (${error})`);
      res.writeHead(302, {
        'Location': `${apiHostName}/oauth2/authorization_ko/?app_name=${encodeURIComponent(appName)}&error=${error}`
      });
      res.end();
      mainWindow.webContents.send("oauthFlowError", error);
    }
  });
});
