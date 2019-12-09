/*
 * Copyright (c) 2019 Exotic Matter SAS. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

const namespaced = true;

const state = {
  docsPathToImport: [],
  docsPathInError: [],
  savedImportDestination: {name:'Root', id: null}
};

const mutations = {
  SET_DOCS_TO_IMPORT (state, serializedDocuments) {
    // copy files path to state as File objects aren't serializable
    state.docsPathToImport = serializedDocuments;
  },

  SET_IMPORT_DESTINATION (state, folder) {
    state.savedImportDestination = folder
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
    state.savedImportDestination = {name:'Root', id: null};
  },
};

const getters = {
  FTLTreeItemSelected(state) {
    return (itemId) => {
      return state.savedImportDestination && state.savedImportDestination.id === itemId;
    }
  }
};

export default {
  namespaced,
  state,
  mutations,
  getters
}
