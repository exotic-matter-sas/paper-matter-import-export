const namespaced = true;

const state = {
  apiBaseUrl: 'https://papermatter.app/app', // prod
  // apiBaseUrl: 'http://127.0.0.1:8000/app', // local
};

const mutations = {
  SAVE_API_BASE_URL (state, apiBaseUrl) {
    state.apiBaseUrl = apiBaseUrl;
  },
};

export default {
  namespaced,
  state,
  mutations,
}
