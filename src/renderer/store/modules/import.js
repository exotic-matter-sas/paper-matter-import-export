const namespaced = true;

const state = {
  documentsToImport: [],
  errorList: []
};

const mutations = {
  SET_DOCUMENTS_IMPORT_LIST (state, documentsList) {
    state.documentsToImport = documentsList;
  },

  REMOVE_FIRST_DOCUMENT_FROM_IMPORT_LIST (state) {
    state.documentsToImport.splice(0, 1);
  },

  MOVE_FIRST_DOCUMENT_TO_ERROR_LIST (state) {
    state.errorList.push(state.documentsToImport.splice(0, 1)[0]);
  },

  CLEAR_IMPORT_DATA (state) {
    state.documentsToImport = [];
    state.errorList = [];
  },
};

export default {
  namespaced,
  state,
  mutations,
}
