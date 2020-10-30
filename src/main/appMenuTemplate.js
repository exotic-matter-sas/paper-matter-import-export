/*
 * Copyright (c) 2020 Exotic Matter SAS. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import {app, shell} from 'electron';
import {toggleDebugFileLogLevel} from "./index";

const path = require('path');

export function getTemplate(debugMode){
  let template = [];
  const name = app.getName();
  // OS X
  if (process.platform === 'darwin') {
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
        click() { shell.openItem(path.join(app.getPath("appData"), "paper-matter-import-export", "logs")) }
      },
    ]
  });

  return template;
}




