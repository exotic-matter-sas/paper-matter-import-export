import jwt_decode from "jwt-decode"
import router from "../../router"

const log = require('electron-log');

const namespaced = true;

const state = {
  accountName: '',
  accessToken: '',
  refreshToken: ''
};

const mutations = {
  SAVE_AUTHENTICATION_DATA(state, {accountName, accessToken, refreshToken}) {
    state.accountName = accountName;
    state.accessToken = accessToken;
    state.refreshToken = refreshToken;
  },

  REFRESH_ACCESS_TOKEN(state, accessToken) {
    state.accessToken = accessToken;
  },

  CLEAR_AUTHENTICATION_DATA(state) {
    state.accountName = '';
    state.accessToken = '';
    state.refreshToken = '';
  },
};

const actions = {
  refreshAccessToken({commit, state}, apiClient) {
    log.debug('trying to refresh accessToken if needed');
    const currentDate = new Date();
    let tokenExpirationDate = new Date(jwt_decode(state.accessToken).exp * 1000);
    // subtracts 1 min to expiration date to be sure the token is valid long enough to be used
    tokenExpirationDate = new Date( tokenExpirationDate.getTime() - 1000 * 60 );
    if (currentDate < tokenExpirationDate) {
      log.debug('access token is still valid, refresh should not be needed (unless it was revoked by server)');
      return Promise.resolve(state.accessToken);
    } else {
      log.debug('access token need a refresh');
      return apiClient.refreshAccessToken(state.refreshToken)
        .then(response => {
          log.debug('token refresh succeeded');
          commit('REFRESH_ACCESS_TOKEN', response.data.access);
          return Promise.resolve(state.accessToken);
        })
        .catch((error) => {
          log.error('refresh failed, user need to login to set a new access token\n' + error);
          commit('CLEAR_AUTHENTICATION_DATA');
          return Promise.reject('Access token refresh failed');
        });
    }
  },

  disconnectUser({commit, state}, reason = null) {
    let disconnectMessage = 'disconnect user';
    if (reason !== null) disconnectMessage.concat('\n', reason);
    log.info(disconnectMessage);

    commit('CLEAR_AUTHENTICATION_DATA');
    router.push({name: 'login'});

    return Promise.resolve();
  }
};

export default {
  namespaced,
  state,
  mutations,
  actions
}
