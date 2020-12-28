/*
 * Copyright (c) 2019 Exotic Matter SAS. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import VuexPersist from "vuex-persist";
import modules from "./modules";

const vuexPersist = new VuexPersist({
  key: "paper-matter-import-export",
  storage: window.localStorage,
});

export default {
  modules,
  plugins: [vuexPersist.plugin],
  strict: process.env.NODE_ENV !== "production",
};
