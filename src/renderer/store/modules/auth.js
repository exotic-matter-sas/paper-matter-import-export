import jwt_decode from "jwt-decode"

const log = require('electron-log');

const namespaced = true;

const state = {
  accountName: '',
  accessToken: '',
  refreshToken: ''
};

const mutations = {
  SAVE_AUTHENTICATION_DATA (state, {accountName, accessToken, refreshToken}) {
    state.accountName = accountName;
    state.accessToken = accessToken;
    state.refreshToken = refreshToken;
  },

  REFRESH_ACCESS_TOKEN (state, accessToken) {
    state.accessToken = accessToken;
  },

  CLEAR_AUTHENTICATION_DATA (state) {
    state.accountName = '';
    state.accessToken = '';
    state.refreshToken = '';
  },
};

const actions = {
  tryToRefreshAccessToken ({ commit, state }, apiClient) {
    if(state.accessToken){
      const currentDate = new Date();
      const tokenExpirationDate = new Date(jwt_decode(state.accessToken).exp * 1000);
      if(currentDate < tokenExpirationDate){
        log.debug('access token is still valid, refresh not needed');
        return Promise.resolve();
      } else {
        log.debug('access token need a refresh');
        return apiClient.refreshAccessToken(state.refreshToken)
        .then(response => {
          log.debug('token refresh suceeded');
          commit('REFRESH_ACCESS_TOKEN', response.data.access);
        })
        .catch((error) => {
            log.error('refresh failed, user need to login to set a new access token\n' + error);
            commit('CLEAR_AUTHENTICATION_DATA');
            return Promise.reject('Access token refresh failed');
        });
      }
    } else {
      return Promise.reject('No access token set');
    }
  }
};

export default {
  namespaced,
  state,
  mutations,
  actions
}
