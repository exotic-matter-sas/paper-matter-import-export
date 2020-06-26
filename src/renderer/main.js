/*
 * Copyright (c) 2019 Exotic Matter SAS. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import Vue from 'vue'

import App from './App'
import router from './router'
import storeConfig from './store'
import i18n from './i18n'
import BootstrapVue from "bootstrap-vue";
import axios from "axios";
import {ipcRenderer, remote} from 'electron';
import {library} from '@fortawesome/fontawesome-svg-core';
import {
  faFolder,
  faFolderOpen,
  faFolderPlus,
} from '@fortawesome/free-solid-svg-icons';
import {
  faPlusSquare,
  faMinusSquare,
} from '@fortawesome/free-regular-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/vue-fontawesome';

import './customBootstrap.scss'
import '../../node_modules/bootstrap/js/dist/tab.js';
import ApiClient from './apiClient'
import Vuex from "vuex";
import Router from "vue-router";

const log = require('electron-log');

if (!process.env.IS_WEB) Vue.use(require('vue-electron'));
Vue.config.productionTip = false;

// Font Awesome icons definition
library.add(faFolder, faFolderOpen, faFolderPlus, faPlusSquare, faMinusSquare);
Vue.component('font-awesome-icon', FontAwesomeIcon);
// register Bootstrap vue components
Vue.use(BootstrapVue);
// Vuex
Vue.use(Vuex);
// Router
Vue.use(Router);

const store = new Vuex.Store(storeConfig);

Vue.api = Vue.prototype.$api = new ApiClient(store.state.config.apiHostName);

/* eslint-disable no-new */
const vi = new Vue({
  components: {App},
  i18n,
  router,
  store,
  template: '<App/>'
}).$mount('#app');

// listen to webContents close event to ask user for confirmation on close (if needed)
ipcRenderer.on('closeMainWindow', (event, message) => {
  if (store.state.import.docsToImport.length  > 0 || store.state.export.docsToExport.length  > 0){
    remote.dialog.showMessageBox(null,
      {
        type: 'question',
        title: i18n.t('main.warningExitingActionIncompleteTitle'),
        message: i18n.t('main.warningExitingActionIncompleteMessage'),
        detail: i18n.t('main.warningExitingActionIncompleteDetail'),
        buttons: [i18n.t('bModal.cancelButtonValue'), i18n.t('bModal.closeButtonValue')],
        defaultId: 0
      }).then( ({response}) => {
        if (response === 1){
          store.commit('import/RESET_IMPORT_DATA');
          store.commit('export/RESET_EXPORT_DATA');
          ipcRenderer.sendSync('closeConfirmed');
       }
    });
  } else {
    store.commit('import/RESET_IMPORT_DATA');
    store.commit('export/RESET_EXPORT_DATA');
    ipcRenderer.sendSync('closeConfirmed');
  }
});

// global API error handling
Vue.api.http.interceptors.response.use(function (response) {
  return response;
}, function (error) {
  if (error.response && error.response.status === 403) {
    log.warn('last API request fail with 403 status, accessToken is not valid');
    return store.dispatch('auth/refreshAccessToken', vi.$api)
      .then((accessToken) => {
        // refresh should be OK, try to replay request
        log.info('try to replay last request with refreshed token');
        error.config.headers.Authorization = "Bearer " + accessToken;
        // not using apiClient.http instance below to avoid infinite loop with the interceptor setup above
        return axios.request(error.config)
          .then((response) => {
            return Promise.resolve(response);
          })
      })
      .catch((error) => {
        if (error.response && (error.response.data.code === 'token_not_valid' || error.response.status === 403)) {
          if (error.response.data.code === 'token_not_valid') {
            log.error('fail to refresh, disconnecting user to get new accessToken');
          } else if (error.response.status === 403) {
            log.error('refreshed token used in replayed request considered as invalid, disconnecting user to get' +
              ' new accessToken');
          }
          return store.dispatch('auth/disconnectUser', 'fail to refresh access token')
            .then(() => {
              return Promise.reject(error)
            });
        } else {
          // a non related authentication error occurred
          log.error('last API request fail with error:\n' + error);
          return Promise.reject(error);
        }
      });
  } else {
    // a non 403 error occurred
    log.error('last API request fail with error:\n' + error);
    return Promise.reject(error);
  }
});
