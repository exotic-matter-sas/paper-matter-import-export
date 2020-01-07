import {remote} from "electron";
<!--
  - Copyright (c) 2019 Exotic Matter SAS. All rights reserved.
  - Licensed under the MIT License. See LICENSE in the project root for license information.
  -->

<template>
  <b-modal id="documents-metadata-modal" centered hide-header no-close-on-esc no-close-on-backdrop>
    <b-container fluid>
      <b-row class="align-items-center">
        <b-col>
          <b-row>
            <h1 class="text-primary">Documents metadata</h1>
          </b-row>
          <b-row>
            <b-col>
              <b-form-group label="Source">
                <b-form-file
                  v-model="csvFile"
                  :state="Boolean(csvFile)"
                  placeholder="Choose csv file to use"
                  drop-placeholder="Drop csv file to use here..."
                  accept=".csv"
                ></b-form-file>
              </b-form-group>
            </b-col>
          </b-row>
          <b-row>
            <b-col>
              <b-form-group label="First 100 lines preview" v-if="Boolean(csvFile)">
                <b-table :fields="previewTabHeaders" :items="extractedCsvDataPreview" striped small
                         sticky-header="200px"
                         head-variant="light">
                  <template v-slot:head(filePath)="data">
                    {{data.label}}
                    <b-form-select v-model="selectedFilePathMeta"
                                   @change="extractedCsvDataPreview = extractCsvData(fullCsvDataPreview)">
                      <option v-for="option in csvHeaders" :value="option"> {{ option }}</option>
                    </b-form-select>
                  </template>
                  <template v-slot:head(documentTitle)="data">
                    {{data.label}}
                    <b-form-select v-model="selectedDocumentTitleMeta"
                                   @change="extractedCsvDataPreview = extractCsvData(fullCsvDataPreview)">
                      <option v-for="option in csvHeaders" :value="option"> {{ option }}</option>
                    </b-form-select>
                  </template>
                  <template v-slot:head(documentNotes)="data">
                    {{data.label}}
                    <b-form-select v-model="selectedDocumentNotesMeta"
                                   @change="extractedCsvDataPreview = extractCsvData(fullCsvDataPreview)">
                      <option v-for="option in csvHeaders" :value="option"> {{ option }}</option>
                    </b-form-select>
                  </template>
                  <template v-slot:cell()="data">
                    <span :title="data.value">{{ data.value }}</span>
                  </template>
                </b-table>
              </b-form-group>
            </b-col>
          </b-row>
        </b-col>
      </b-row>
    </b-container>
    <template slot="modal-footer">
      <b-button id="cancel-button" variant="secondary" @click.prevent="$emit('event-close-documents-metadata-modal')"
                class="w-100">
        Cancel
      </b-button>
      <b-button id="start-import-button" variant="primary" @click.prevent="storeCsvData" class="w-100"
                :disabled="!Boolean(csvFile)">
        Start import
      </b-button>
    </template>
  </b-modal>
</template>

<script>
  import {mapState} from "vuex";
  import {remote} from "electron";

  const log = require('electron-log');
  const fs = require('fs');
  const csv = require('@fast-csv/parse');

  export default {
    name: 'documents-metadata-modal',

    data() {
      return {
        csvFile: null,
        selectedFilePathMeta: null,
        selectedDocumentTitleMeta: null,
        selectedDocumentNotesMeta: null,
        previewTabHeaders: [
          {key: 'filePath', label: 'File Path*', headerTitle: 'Full path of pdf files to import (required)'},
          {
            key: 'documentTitle', label: 'Doc. Title', headerTitle:
              'Document title will be used in document list or preview and make document search easier'
          },
          {
            key: 'documentNotes', label: 'Doc. Notes', headerTitle:
              'Document notes will be displayed in document preview and make document search easier'
          },
        ],
        csvHeaders: [],
        fullCsvDataPreview: [],
        extractedCsvDataPreview: [
          {filePath: '', documentTitle: '', documentNotes: ''},
        ],
      }
    },

    mounted() {
      this.$bvModal.show('documents-metadata-modal');
    },

    watch: {
      csvFile: function (newVal, oldVal) {
        if (newVal !== oldVal && newVal != null) {
          this.preloadCsvData();
        }
      }
    },

    computed: {
      ...mapState('import', ['docsToImport', 'docsMetadataToImport'])
    },

    methods: {
      preloadCsvData() {
        let vi = this;
        vi.fullCsvDataPreview = [];
        fs.createReadStream(vi.csvFile.path)
          .pipe(csv.parse({ignoreEmpty: true, headers: true, maxRows: 100}))
          .on('error', error => console.error(error)) // TODO show a message box here in case of corrupt csv file and reset UI to csv file selection
          .on('data',
            function (row) {
              // concat headers name for every lines preloaded (most will be duplicates)
              vi.csvHeaders = vi.csvHeaders.concat(Object.keys(row).map(item => (item)));
              // concat csv data for preloaded lines
              vi.fullCsvDataPreview = vi.fullCsvDataPreview.concat(row);
            })
          .on('end',
            function (rowCount) {
              const deduplicatedCsvHeaders = new Set(vi.csvHeaders);
              vi.csvHeaders = Array.from(deduplicatedCsvHeaders);
              vi.$forceUpdate(); // can't make work reactivity otherwise for select options (in tab header)
              vi.guessMetadataAssociation(); // auto select <select> values
              vi.extractedCsvDataPreview = vi.extractCsvData(vi.fullCsvDataPreview); // display metadata preview for csv
            });
      },

      guessMetadataAssociation() {
        const guessDict = {
          'filePath': ['path'],
          'documentTitle': ['title', 'name'],
          'documentNotes': ['notes', 'note'],
        };

        // Set a default selection if no guess succeed (put csv headers in select by left to right)
        for (const [i, metadata] of this.previewTabHeaders.entries()) {
          const metadataKey = metadata.key;
          // set <select> v-model using computed attribute
          this['selected' + metadataKey.charAt(0).toUpperCase() + metadataKey.slice(1) + 'Meta'] = this.csvHeaders[i];
        }

        // For each metadata available
        for (const metadata of this.previewTabHeaders) {
          const metadataKey = metadata.key;
          // Check if there is a match for each guess available
          for (let guess of guessDict[metadata.key]) {
            let guessedMetadataIndex = this.csvHeaders.indexOf(guess);
            // If a match is found stop checking and set proper select value
            if (guessedMetadataIndex !== -1) {
              // set <select> v-model using computed attribute
              this['selected' + metadataKey.charAt(0).toUpperCase() + metadataKey.slice(1) + 'Meta'] =
                this.csvHeaders[guessedMetadataIndex];
              break;
            }
          }
        }
      },

      extractCsvData(csvData) {
        // Using "Computed object property names and destructuring" to extract selected csv headers from csvData
        // Used to display metadata preview
        return csvData.map(
          ({
             [this.selectedFilePathMeta]: filePath,
             [this.selectedDocumentTitleMeta]: documentTitle,
             [this.selectedDocumentNotesMeta]: documentNotes
           }) => (
            {filePath, documentTitle, documentNotes}
          )
        )
      },

      storeCsvData() {
        log.debug('storeCsvData start');
        let vi = this;

        vi.$store.commit('import/RESET_DOC_METADATA_TO_IMPORT');

        fs.createReadStream(vi.csvFile.path)
          .pipe(csv.parse({ignoreEmpty: true, headers: true}))
          .on('error', error => console.error(error)) // TODO show a message box here in case of corrupt csv file and reset UI to csv file selection
          .on('data',
            function (row) {
              vi.$store.commit(
                'import/ADD_DOC_METADATA_TO_IMPORT',
                vi.extractCsvData([row])[0]
              );
            })
          .on('end',
            function (rowCount) {
              const docsToImportCount = vi.docsToImport.length;
              const metadataToImportCount = Object.keys(vi.docsMetadataToImport).length;
              const win = remote.getCurrentWindow();
              if (metadataToImportCount === 0) {
                log.warn('No metadata match documents to import');
                remote.dialog.showMessageBox(win,
                  {
                    type: 'info',
                    title: 'Fix metadata selection',
                    message: 'No metadata match documents to import',
                    detail: 'Check that File path is properly selected and formatted.',
                    buttons: ['Ok'],
                    defaultId: 0
                  });
              } else if (metadataToImportCount < docsToImportCount) {
                const s = (docsToImportCount - metadataToImportCount) > 1 ? 's' : '';
                log.warn('Some documents have no metadata associated');
                remote.dialog.showMessageBox(win,
                  {
                    type: 'info',
                    title: 'Confirm metadata selection',
                    message: 'Some documents have no metadata associated',
                    detail: `Metadata are missing for ${docsToImportCount - metadataToImportCount} document${s}, do you want to proceed anyway?`,
                    buttons: ['Cancel', 'Continue'],
                    defaultId: 1
                  }).then(({response}) => {
                    if (response === 1) { // Continue clicked
                      vi.$emit('event-proceed-to-import');
                    }
                  }
                );
              } else {
                vi.$emit('event-proceed-to-import');
              }
              log.debug('storeCsvData end');
            });
      },
    }
  }
</script>

<style lang="scss" scoped>
  @import '../../../customBootstrap.scss';

  h1 {
    font-size: 2rem;
    width: 100%;
    text-align: center;
  }
</style>

<style lang="scss">
  .b-table-sticky-header {
    overflow-y: auto;
  }

  .table {
    table-layout: fixed;

    thead > tr > th {
      position: sticky;
      top: -1px;
      z-index: 2;
    }

    td {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
</style>

