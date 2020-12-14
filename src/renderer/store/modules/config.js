/*
 * Copyright (c) 2019 Exotic Matter SAS. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

const namespaced = true;
const defaultPmHostName = 'https://papermatter.app'; // prod
// const defaultPmHostName = 'http://127.0.0.1:8000'; // local

const state = {
  pmHostName: defaultPmHostName,
  action: 'import'
};

const mutations = {
  SET_PM_HOST_NAME (state, pmHostName) {
    state.pmHostName = pmHostName
  },
  SET_ACTION (state, action) {
    state.action = action
  },
};

export {
  defaultPmHostName
};

export default {
  namespaced,
  state,
  mutations,
};
