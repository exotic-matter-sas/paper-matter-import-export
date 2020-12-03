/*
 * Copyright (c) 2019 Exotic Matter SAS. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import jwt_decode from "jwt-decode"
import router from "../../router"

const log = require('electron-log');

const namespaced = true;

const state = {
  clientId: 'jAVjrlpVayPTvASvaKwgcj5Wfg9PmtNOnvaKoFqa', // FIXME set using var ENV during build
  redirectUri: 'http://localhost:1612/oauth2/redirect',
  accountName: '',
  accessToken: '',
  accessTokenExpireTimestamp: '',
  refreshToken: ''
};

const mutations = {
  SAVE_AUTHENTICATION_DATA(state, {accessToken, accessTokenExpiresIn, refreshToken}) {
    state.accessToken = accessToken;
    state.accessTokenExpireTimestamp = new Date().getTime() + (parseInt(accessTokenExpiresIn) * 1000);
    state.refreshToken = refreshToken;
  },

  SET_ACCOUNT_NAME(state, accountName) {
    state.accountName = accountName;
  },

  CLEAR_AUTHENTICATION_DATA(state) {
    state.accountName = '';
    state.accessToken = '';
    state.accessTokenExpireTimestamp = '';
    state.refreshToken = '';
  },
};

const actions = {
  refreshAccessToken({commit, state, dispatch}, apiClient) {
    log.debug('trying to refresh accessToken if needed');
    const currentDate = new Date();
    let tokenExpirationDate = new Date(state.accessTokenExpireTimestamp);
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
          // Update all authentication data
          commit('SAVE_AUTHENTICATION_DATA', {
            accessToken: response.data.access_token,
            accessTokenExpiresIn: response.data.expires_in,
            refreshToken: response.data.refresh_token
          });
          return Promise.resolve(state.accessToken);
        })
        .catch((error) => {
          log.error('refresh failed, user need to login to set a new access token\n' + error);
          dispatch('disconnectUser', apiClient, 'refresh failed');
          return Promise.reject('Access token refresh failed');
        });
    }
  },

  disconnectUser({commit, state}, apiClient, reason = null) {
    if (state.accountName === '' && state.accessToken === '' && state.accessTokenExpireTimestamp === ''
      && state.refreshToken === ''){
      log.info("disconnectUser skipped as auth data already cleared")
    }
    else {
      let disconnectMessage = 'disconnect user';
      if (reason !== null) disconnectMessage.concat('\n', reason);
      log.info(disconnectMessage);

      return apiClient.revokeToken(state.accessToken, 'access_token')
        .then(() => apiClient.revokeToken(this.refreshToken, 'refresh_token'))
        .then(() => {
          commit('CLEAR_AUTHENTICATION_DATA');
          router.push({name: 'login'});
          return Promise.resolve()
        })
    }
  }
};

export default {
  namespaced,
  state,
  mutations,
  actions
}
