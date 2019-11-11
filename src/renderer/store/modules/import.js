const namespaced = true;

const state = {
  docsPathToImport: [],
  docsPathInError: []
};

const mutations = {
  SET_DOCS_TO_IMPORT (state, serializedDocuments) {
    // copy files path to state as File objects aren't serializable
    state.docsPathToImport = serializedDocuments;
  },

  REMOVE_FIRST_DOC_FROM_IMPORT (state) {
    state.docsPathToImport.splice(0, 1);
  },

  MOVE_FIRST_DOC_FROM_IMPORT_TO_ERROR (state, reason=null) {
    let serializedDocument = state.docsPathToImport.splice(0, 1)[0];
    serializedDocument.reason = reason; // add error reason to serialized document
    state.docsPathInError.push(serializedDocument);
  },

  MOVE_DOCS_FROM_ERROR_TO_IMPORT(state) {
    state.docsPathToImport = state.docsPathInError.splice(0);
  },

  RESET_IMPORT_DATA (state) {
    state.docsPathToImport = [];
    state.docsPathInError = [];
  },
};

export default {
  namespaced,
  state,
  mutations,
}
