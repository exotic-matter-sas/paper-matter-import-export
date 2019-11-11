import Vue from 'vue'

import App from './App'
import router from './router'
import store from './store'
import BootstrapVue from "bootstrap-vue";
import axios from "axios";
import {ipcRenderer, remote} from 'electron';

import './customBootstrap.scss'
import '../../node_modules/bootstrap/js/dist/tab.js';
import ApiClient from './apiClient'

const log = require('electron-log');

if (!process.env.IS_WEB) Vue.use(require('vue-electron'));
Vue.api = Vue.prototype.$api = new ApiClient(store.state.config.apiBaseUrl);
Vue.config.productionTip = false;

// register Bootstrap vue components
Vue.use(BootstrapVue);

/* eslint-disable no-new */
const vi = new Vue({
  components: {App},
  router,
  store,
  template: '<App/>'
}).$mount('#app');

// listen to webContents close event to ask user for confirmation on close (if needed)
ipcRenderer.on('closeMainWindow', (event, message) => {
  console.log('close event from main received!');
  if (store.state.import.documentsPathToImport.length  > 0){
    remote.dialog.showMessageBox(null,
      {
        type: 'question',
        title: 'Are you sure you want to quit?',
        message: 'There are some documents which remain to be imported.',
        detail: 'If you close now, ongoing import or documents selection will be lost.',
        buttons: ['Cancel', 'Close'],
        defaultId: 0
      }, (res) => {
      if (res === 1){
        store.commit('import/RESET_IMPORT_DATA');
        ipcRenderer.sendSync('closeConfirmed');
     }
    });
  } else {
    store.commit('import/RESET_IMPORT_DATA');
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
          .catch((error) => {
            log.error('fail to replay last request, disconnecting user to get new accessToken');
            return store.dispatch('auth/disconnectUser', 'fail to refresh access token')
              .then(() => {
                return Promise.reject(error)
              });
          });
      })
      .catch((error) => {
        log.error('fail to refresh, disconnecting user to get new accessToken');
        return store.dispatch('auth/disconnectUser', 'fail to refresh access token')
          .then(() => {
            return Promise.reject(error)
          });
      });
  } else {
    // a non 403 error occurred
    log.error('last API request fail with error:\n' + error);
    return Promise.reject(error);
  }
});
