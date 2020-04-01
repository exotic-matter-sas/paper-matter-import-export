/*
 * Copyright (c) 2019 Exotic Matter SAS. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

const namespaced = true;
const defaultApiBaseUrl = 'https://papermatter.app/app'; // prod
// const defaultApiBaseUrl = 'http://127.0.0.1:8000/app'; // local

const state = {
  apiBaseUrl: defaultApiBaseUrl
};

const mutations = {
  UPDATE_API_BASE_URL (state, apiBaseUrl) {
    if (apiBaseUrl === ''){
      state.apiBaseUrl = defaultApiBaseUrl;
    } else {
      state.apiBaseUrl = apiBaseUrl.split('#')[0]; // get ride of eventual anchor
    }
  },
};

export {
  defaultApiBaseUrl
};

export default {
  namespaced,
  state,
  mutations,
};
