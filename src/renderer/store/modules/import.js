/*
 * Copyright (c) 2019 Exotic Matter SAS. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

const namespaced = true;

const state = {
  docsToImport: [],
  docsInError: [],
  docsMetadataToImport: {},
  savedImportDestination: {name:'Root', id: null}
};

const mutations = {
  SET_DOCS_TO_IMPORT (state, serializedDocuments) {
    // store serialized version of File objects
    state.docsToImport = serializedDocuments;
  },

  RESET_DOC_METADATA_TO_IMPORT (state) {
    state.docsMetadataToImport = {};
  },

  ADD_DOC_METADATA_TO_IMPORT (state, docMetadataDict) {
    // if metadata path match a path in docsToImport
    if (state.docsToImport.some(({path}) => path === docMetadataDict['filePath'])){
      console.log('match found !');
      const metadataPath = docMetadataDict.path;
      delete docMetadataDict.path;
      state.docsMetadataToImport[metadataPath] = docMetadataDict;
    }
  },

  SET_IMPORT_DESTINATION (state, folder) {
    state.savedImportDestination = folder
  },

  CONSUME_FIRST_DOC_TO_IMPORT (state) {
    const consumedDoc = state.docsToImport.splice(0, 1);
    // Consume eventual doc metadata too
    delete state.docsMetadataToImport[consumedDoc.path]
  },

  MOVE_FIRST_DOC_FROM_IMPORT_TO_ERROR (state, reason=null) {
    let serializedDocument = state.docsToImport.splice(0, 1)[0];
    serializedDocument.reason = reason; // add error reason to serialized document
    state.docsInError.push(serializedDocument);
  },

  MOVE_DOCS_FROM_ERROR_TO_IMPORT(state) {
    state.docsToImport = state.docsInError.splice(0);
  },

  RESET_IMPORT_DATA (state) {
    state.docsToImport = [];
    state.docsInError = [];
    state.docsMetadataToImport = {};
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
