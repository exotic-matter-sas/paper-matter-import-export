/*
 * Copyright (c) 2020 Exotic Matter SAS. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import Vue from "vue";
import VueI18n from "vue-i18n";
import { remote } from "electron";
import messages from "./messages";

Vue.use(VueI18n);
const log = require("electron-log");

// language detection by electron
// strip eventual lang variant to avoid vuei18n falling always falling back to en when a lang variant is set (eg. fr-CA)
const locale = remote.app.getLocale().split("-")[0];
log.debug(`detected locale: ${locale}`);
// const locale = 'fr'; // force language for test purpose

export default new VueI18n({
  locale,
  fallbackLocale: "en",
  messages,
});
