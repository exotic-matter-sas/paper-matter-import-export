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
  refreshAccessToken ({ commit }, {apiClient, refreshToken}) {
    return apiClient.refreshAccessToken(refreshToken)
    // refresh token succeed
    .then(response => {
      commit('REFRESH_ACCESS_TOKEN', response.data.access);
    })
    // refresh failed, user need to login to set a new access token
    .catch((error) => {
        commit('CLEAR_AUTHENTICATION_DATA');
        throw new Error('Access token refresh failed');
    });
  }
};

export default {
  namespaced,
  state,
  mutations,
  actions
}
