/*
 * Copyright (c) 2020 Exotic Matter SAS. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import Vue from 'vue'
import VueI18n from 'vue-i18n'
import {remote} from "electron";

Vue.use(VueI18n);

// const locale = remote.app.getLocale();
const locale = 'fr';

export default new VueI18n({
  locale: locale,
  fallbackLocale: 'en',
  // silentFallbackWarn: true,
  // formatFallbackMessages: true,
  // silentTranslationWarn: true,
})
