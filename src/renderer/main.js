import Vue from 'vue'
import axios from 'axios'

import App from './App'
import router from './router'
import store from './store'
import BootstrapVue from "bootstrap-vue";

import './customBootstrap.scss'
import '../../node_modules/bootstrap/js/dist/tab.js';
import ApiClient from './apiClient'


if (!process.env.IS_WEB) Vue.use(require('vue-electron'));
Vue.api = Vue.prototype.$api = new ApiClient(store.state.config.apiBaseUrl);
Vue.config.productionTip = false;

// register Bootstrap vue components
Vue.use(BootstrapVue);

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app');

axios.interceptors.response.use(function (response) {
  return response;
}, function (error) {
  if (error.response.status === 403) {
    // TODO refresh access token or reconnect user when an XHR returns 403 ?
    console.log('access token expire TODO')
  } else {
    return Promise.reject(error);
  }
});
