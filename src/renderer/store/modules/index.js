/*
 * Copyright (c) 2019 Exotic Matter SAS. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

/**
 * The file enables `@/store/index.js` to import all vuex modules
 * in a one-shot manner. There should not be any reason to edit this file.
 */

const files = require.context('.', false, /\.js$/);
const modules = {};

files.keys().forEach(key => {
  if (key === './index.js') return;
  modules[key.replace(/(\.\/|\.js)/g, '')] = files(key).default
});

export default modules
