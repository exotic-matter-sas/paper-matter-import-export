const namespaced = true;

const state = {
  documentsPathToImport: [], // TODO rename
  documentsPathInError: []  // TODO rename
};

const mutations = {
  SET_DOCS_TO_IMPORT (state, serializedDocuments) {
    // copy files path to state as File objects aren't serializable
    state.documentsPathToImport = serializedDocuments;
  },

  REMOVE_FIRST_DOC_FROM_IMPORT (state) {
    state.documentsPathToImport.splice(0, 1);
  },

  MOVE_FIRST_DOC_FROM_IMPORT_TO_ERROR (state, reason=null) {
    let serializedDocument = state.documentsPathToImport.splice(0, 1)[0];
    serializedDocument.reason = reason; // add error reason to serialized document
    state.documentsPathInError.push(serializedDocument);
  },

  MOVE_DOCS_FROM_ERROR_TO_IMPORT(state) {
    state.documentsPathToImport = state.documentsPathInError.splice(0);
  },

  RESET_IMPORT_DATA (state) {
    state.documentsPathToImport = [];
    state.documentsPathInError = [];
  },
};

export default {
  namespaced,
  state,
  mutations,
}
