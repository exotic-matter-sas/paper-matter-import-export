/*
 * Copyright (c) 2020 Exotic Matter SAS. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

const namespaced = true;

const state = {
  exportFolderName: null,
  docsToExport: [],
  exportDocsInError: [],
  docsMetadataToExport: {},
  duplicatedFilePathCount: {},
  savedExportSource: {name: 'Root', id: null},
  savedExportDestination: null
};

const mutations = {
  SET_EXPORT_SOURCE(state, folder) {
    state.savedExportSource = folder;
  },

  SET_EXPORT_FOLDER_NAME(state) {
    state.exportFolderName = new Date().toISOString().replace(/[:.]/g, '-');
  },

  SET_EXPORT_DESTINATION(state, folderPath) {
    state.savedExportDestination = folderPath;
  },

  SET_DOCS_TO_EXPORT(state, serializedDocuments) {
    // store serialized version of File objects
    state.docsToExport = serializedDocuments;
  },

  SET_DUPLICATED_FILE_PATH_COUNT(state, filePathCountArray) {
    state.duplicatedFilePathCount[filePathCountArray[0]] = filePathCountArray[1];
  },

  CONSUME_FIRST_DOC_TO_EXPORT(state) {
    state.docsToExport.splice(0, 1);
  },

  MOVE_FIRST_DOC_FROM_EXPORT_TO_ERROR(state, reason = null) {
    let serializedDocument = state.docsToExport.splice(0, 1)[0];
    serializedDocument.reason = reason; // add error reason to serialized document
    state.exportDocsInError.push(serializedDocument);
  },

  MOVE_DOCS_FROM_ERROR_TO_EXPORT(state) {
    state.docsToExport = state.exportDocsInError.splice(0);
  },

  RESET_EXPORT_DATA(state) {
    state.exportFolderName = null;
    state.docsToExport = [];
    state.exportDocsInError = [];
    state.filePathDuplicatedCount = {};
    // state.docsMetadataToExport = {};
    state.savedExportSource = {name: 'Root', id: null};
  },
};

export default {
  namespaced,
  state,
  mutations,
}
