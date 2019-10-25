import Vue from 'vue'
import Vuex from 'vuex'

import VuexPersist from 'vuex-persist'
import modules from './modules'

const vuexPersist = new VuexPersist({
  key: 'paper-matter-import-export',
  storage: window.localStorage
});

Vue.use(Vuex);

export default new Vuex.Store({
  modules,
  plugins: [vuexPersist.plugin],
  strict: process.env.NODE_ENV !== 'production'
})
