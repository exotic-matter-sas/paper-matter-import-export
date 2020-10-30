/*
 * Copyright (c) 2020 Exotic Matter SAS. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import {app, shell} from 'electron';
import {toggleDebugFileLogLevel} from "./index";

const path = require('path');

export function getTemplate(debugMode){
  let template = [];
  const isMac = process.platform === 'darwin';
  const name = app.getName();
  // OS X
  if (isMac) {
    template.push({
      label: name,
      role: 'appMenu'
    });
  }
  template.push({
    label: 'Advanced',
    submenu: [
      {
        label: 'Enable DEBUG mode',
        type: 'checkbox',
        checked: debugMode,
        click() { toggleDebugFileLogLevel(); }
      },
      {
        label: 'Open logs folder',
        click: () => {
          let logsFolderPath;
          if (isMac) {
            logsFolderPath = path.join(app.getPath("home"), "Library", "Logs", "paper-matter-import-export");
          } else {
            logsFolderPath = path.join(app.getPath("appData"), "paper-matter-import-export", "logs");
          }
          shell.openItem(logsFolderPath);
        }
      },
    ]
  });

  return template;
}




