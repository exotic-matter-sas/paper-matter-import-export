/*
 * Copyright (c) 2020 Exotic Matter SAS. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

const namespaced = true;

const state = {
  docsToExport: [],
  docsInError: [],
  docsMetadataToExport: {},
  savedExportSource: {name: 'Root', id: null},
  savedExportDestination: null
};

const mutations = {
  SET_DOCS_TO_EXPORT(state, serializedDocuments) {
    // store serialized version of File objects
    state.docsToExport = serializedDocuments;
  },
  //
  // RESET_DOC_METADATA_TO_IMPORT(state) {
  //   state.docsMetadataToExport = {};
  // },
  //
  // ADD_DOC_METADATA_TO_IMPORT(state, metadataKeyValuesPair) {
  //   state.docsMetadataToExport[metadataKeyValuesPair[0]] = metadataKeyValuesPair[1];
  // },

  SET_EXPORT_SOURCE(state, folder) {
    state.savedExportSource = folder;
  },

  SET_EXPORT_DESTINATION(state, folderPath) {
    state.savedExportDestination = folderPath;
  },

  //
  CONSUME_FIRST_DOC_TO_EXPORT(state) {
    state.docsToExport.splice(0, 1);
  },
  //
  // CONSUME_DOC_METADATA_TO_IMPORT(state, metadataKey) {
  //   delete state.docsMetadataToExport[metadataKey];
  // },
  //
  MOVE_FIRST_DOC_FROM_EXPORT_TO_ERROR(state, reason = null) {
    let serializedDocument = state.docsToExport.splice(0, 1)[0];
    serializedDocument.reason = reason; // add error reason to serialized document
    state.docsInError.push(serializedDocument);
  },

  MOVE_DOCS_FROM_ERROR_TO_EXPORT(state) {
    state.docsToExport = state.docsInError.splice(0);
  },

  RESET_EXPORT_DATA(state) {
    state.docsToExport = [];
    state.docsInError = [];
    // state.docsMetadataToExport = {};
    state.savedExportSource = {name: 'Root', id: null};
  },
};

const getters = {
  // FTLTreeItemSelected(state) {
  //   return (itemId) => {
  //     return state.savedImportDestination && state.savedImportDestination.id === itemId;
  //   }
  // }
};

const actions = {
  // addDocMetadataToImport({commit, state, dispatch}, docMetadataDict) {
  //   // if metadata path match a path in docsToExport
  //   if (state.docsToExport.some(({path}) => path === docMetadataDict['filePath'])) {
  //     const metadataDocPath = docMetadataDict.filePath;
  //     delete docMetadataDict.filePath;
  //     // generate a unique key to store meta in docsMetadataToExport by hashing metadataDocPath
  //     return dispatch('tools/hashString', {algorithm: 'md5', string: metadataDocPath}, {root:true}).then(
  //       uniqueMetadataKey => {
  //         commit('ADD_DOC_METADATA_TO_IMPORT', [uniqueMetadataKey, docMetadataDict]);
  //       }
  //     );
  //   }
  // },
  //
  // consumeFirstDocToImport({commit, state, dispatch}){
  //   const firstDocPath = state.docsToExport[0].path;
  //   commit('CONSUME_FIRST_DOC_TO_IMPORT');
  //   // consume eventual doc metadata too
  //   dispatch('tools/hashString', {algorithm: 'md5', string: firstDocPath}, {root:true}).then(
  //     uniqueMetadataKey => {
  //       commit('CONSUME_DOC_METADATA_TO_IMPORT', uniqueMetadataKey);
  //     }
  //   );
  // }
};

export default {
  namespaced,
  state,
  mutations,
  getters,
  actions
}
