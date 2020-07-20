/*
 * Copyright (c) 2019 Exotic Matter SAS. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

const namespaced = true;
const defaultApiHostName = 'https://papermatter.app'; // prod
// const defaultApiHostName = 'http://127.0.0.1:8000'; // local

const state = {
  apiHostName: defaultApiHostName,
  action: 'import'
};

const mutations = {
  SET_API_HOST_NAME (state, apiHostName) {
    state.apiHostName = apiHostName
  },
  SET_ACTION (state, action) {
    state.action = action
  },
};

export {
  defaultApiHostName
};

export default {
  namespaced,
  state,
  mutations,
};
