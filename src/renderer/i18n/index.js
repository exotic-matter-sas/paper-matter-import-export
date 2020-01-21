/*
 * Copyright (c) 2020 Exotic Matter SAS. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import Vue from 'vue'
import VueI18n from 'vue-i18n'
import {remote} from "electron";
import messages from "./messages";

Vue.use(VueI18n);

const locale = remote.app.getLocale(); // language detected by electron
// const locale = 'fr'; // force language for test purpose

export default new VueI18n({
  locale,
  fallbackLocale: 'en',
  messages
})
