<!--
  - Copyright (c) 2019 Exotic Matter SAS. All rights reserved.
  - Licensed under the MIT License. See LICENSE in the project root for license information.
  -->

<template>
  <b-modal
    id="documents-metadata-modal"
    centered
    hide-header
    no-close-on-esc
    no-close-on-backdrop
  >
    <b-container fluid>
      <b-row class="align-items-center">
        <b-col>
          <b-row>
            <h1 class="text-primary">
              {{ $t("documentsMetadataModal.title") }}
            </h1>
          </b-row>
          <b-row>
            <b-col>
              <b-form-group
                :label="$t('documentsMetadataModal.sourceFormGroupLabel')"
              >
                <b-form-file
                  v-model="csvFile"
                  :state="Boolean(csvFile)"
                  :title="csvFileInputPlaceholder"
                  :placeholder="csvFileInputPlaceholder"
                  :drop-placeholder="
                    $t('documentsMetadataModal.csvInputDropLabel')
                  "
                  accept=".csv"
                ></b-form-file>
              </b-form-group>
            </b-col>
          </b-row>
          <b-row>
            <b-col>
              <b-form-group
                :label="$t('documentsMetadataModal.previewFormGroupLabel')"
                v-if="Boolean(csvFile)"
              >
                <b-table
                  :fields="previewTabHeaders"
                  :items="extractedCsvDataPreview"
                  striped
                  small
                  sticky-header="200px"
                  head-variant="light"
                >
                  <template v-slot:head(filePath)="data">
                    {{ data.label }}
                    <b-form-select
                      v-model="selectedFilePathMeta"
                      @change="
                        extractedCsvDataPreview = extractCsvData(
                          fullCsvDataPreview
                        )
                      "
                    >
                      <option v-for="option in csvHeaders" :value="option">
                        {{ option }}</option
                      >
                    </b-form-select>
                  </template>
                  <template v-slot:head(documentTitle)="data">
                    {{ data.label }}
                    <b-form-select
                      v-model="selectedDocumentTitleMeta"
                      @change="
                        extractedCsvDataPreview = extractCsvData(
                          fullCsvDataPreview
                        )
                      "
                    >
                      <option v-for="option in csvHeaders" :value="option">
                        {{ option }}</option
                      >
                    </b-form-select>
                  </template>
                  <template v-slot:head(documentNotes)="data">
                    {{ data.label }}
                    <b-form-select
                      v-model="selectedDocumentNotesMeta"
                      @change="
                        extractedCsvDataPreview = extractCsvData(
                          fullCsvDataPreview
                        )
                      "
                    >
                      <option v-for="option in csvHeaders" :value="option">
                        {{ option }}</option
                      >
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
      <b-button
        id="cancel-button"
        variant="secondary"
        @click.prevent="$emit('event-close-documents-metadata-modal')"
        class="w-100"
      >
        {{ $t("bModal.cancelButtonValue") }}
      </b-button>
      <b-button
        id="start-import-button"
        variant="primary"
        @click.prevent="storeCsvData"
        class="w-100"
        :disabled="!Boolean(csvFile) || storingCsvData"
      >
        <span v-if="storingCsvData">
          <b-spinner small type="grow"></b-spinner
          >{{ $t("documentsMetadataModal.startImportLoadingButton") }}
        </span>
        <span v-else>{{ $t("documentsMetadataModal.startImportButton") }}</span>
      </b-button>
    </template>
  </b-modal>
</template>

<script>
import { mapState } from "vuex";
import { remote } from "electron";

const log = require("electron-log");
const fs = require("fs");
const csv = require("@fast-csv/parse");

export default {
  name: "documents-metadata-modal",

  props: {
    detectedMetadataFile: {
      type: Object,
      required: true,
    },
  },

  data() {
    return {
      csvFile: null,
      selectedFilePathMeta: null,
      selectedDocumentTitleMeta: null,
      selectedDocumentNotesMeta: null,
      previewTabHeaders: [
        {
          key: "filePath",
          label: this.$t("documentsMetadataModal.filePathLabel"),
          headerTitle: this.$t("documentsMetadataModal.filePathTooltip"),
        },
        {
          key: "documentTitle",
          label: this.$t("documentsMetadataModal.documentTitleLabel"),
          headerTitle: this.$t("documentsMetadataModal.documentTitleTooltip"),
        },
        {
          key: "documentNotes",
          label: this.$t("documentsMetadataModal.documentNotesLabel"),
          headerTitle: this.$t("documentsMetadataModal.documentNotesTooltip"),
        },
      ],
      csvHeaders: [],
      fullCsvDataPreview: [],
      extractedCsvDataPreview: [
        { filePath: "", documentTitle: "", documentNotes: "" },
      ],
      storingCsvData: false,
    };
  },

  mounted() {
    this.$bvModal.show("documents-metadata-modal");

    // auto-select csv file if it has been detected
    if (this.detectedMetadataFile !== null) {
      this.csvFile = this.detectedMetadataFile;
    }
  },

  watch: {
    csvFile: function (newVal, oldVal) {
      if (newVal !== oldVal && newVal != null) {
        this.preloadCsvData();
      }
    },
  },

  computed: {
    csvFileInputPlaceholder() {
      if (this.detectedMetadataFile) {
        return this.detectedMetadataFile.path;
      } else {
        return this.$t("documentsMetadataModal.csvInputPlaceholder");
      }
    },

    ...mapState("import", ["docsToImport", "docsMetadataToImport"]),
  },

  methods: {
    preloadCsvData() {
      let vi = this;
      vi.fullCsvDataPreview = [];
      const win = remote.getCurrentWindow();
      const csvStream = fs.createReadStream(vi.csvFile.path);
      // handle file I/O error here
      csvStream.on("error", function (error) {
        log.error(`Error occurred trying to read csv file:\n${error}`);
        remote.dialog.showMessageBox(win, {
          type: "error",
          title: vi.$t("documentsMetadataModal.errorReadingCsvTitle"),
          message: vi.$t("documentsMetadataModal.errorReadingCsvMessage"),
          detail: vi.$t("documentsMetadataModal.errorReadingCsvDetail"),
          buttons: ["Ok"],
          defaultId: 0,
        });
      });
      csvStream
        .pipe(
          csv.parse({
            ignoreEmpty: true,
            headers: true,
            maxRows: 100,
          })
        )
        // handle csv parsing error here
        .on("error", function (error) {
          log.error(`Error during csv parsing:\n${error}`);
          remote.dialog.showMessageBox(win, {
            type: "error",
            title: vi.$t("documentsMetadataModal.errorParsingCsvTitle"),
            message: vi.$t("documentsMetadataModal.errorParsingCsvMessage"),
            detail: vi.$t("documentsMetadataModal.errorParsingCsvDetail"),
            buttons: ["Ok"],
            defaultId: 0,
          });
        })
        .on("data", function (row) {
          // concat headers name for every lines preloaded (most will be duplicates)
          vi.csvHeaders = vi.csvHeaders.concat(
            Object.getOwnPropertyNames(row).map((item) => item)
          );
          // concat csv data for preloaded lines
          vi.fullCsvDataPreview = vi.fullCsvDataPreview.concat(row);
        })
        .on("end", function (rowCount) {
          const deduplicatedCsvHeaders = new Set(vi.csvHeaders);
          vi.csvHeaders = Array.from(deduplicatedCsvHeaders);
          vi.$forceUpdate(); // can't make work reactivity otherwise for select options (in tab header)
          vi.guessMetadataAssociation(); // auto select <select> values
          vi.extractedCsvDataPreview = vi.extractCsvData(vi.fullCsvDataPreview); // display metadata preview for csv
        });
    },

    guessMetadataAssociation() {
      const guessDict = {
        filePath: ["path"],
        documentTitle: ["title", "name"],
        documentNotes: ["notes", "note"],
      };

      // Set a default selection if no guess succeed (put csv headers in select by left to right)
      for (const [i, metadata] of this.previewTabHeaders.entries()) {
        const metadataKey = metadata.key;
        // set <select> v-model using computed attribute
        this[
          "selected" +
            metadataKey.charAt(0).toUpperCase() +
            metadataKey.slice(1) +
            "Meta"
        ] = this.csvHeaders[i];
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
            this[
              "selected" +
                metadataKey.charAt(0).toUpperCase() +
                metadataKey.slice(1) +
                "Meta"
            ] = this.csvHeaders[guessedMetadataIndex];
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
          [this.selectedDocumentNotesMeta]: documentNotes,
        }) => ({ filePath, documentTitle, documentNotes })
      );
    },

    storeCsvData() {
      log.debug("storeCsvData start");
      let vi = this;
      vi.storingCsvData = true;
      vi.$store.commit("import/RESET_DOC_METADATA_TO_IMPORT");
      const win = remote.getCurrentWindow();

      const csvStream = fs.createReadStream(vi.csvFile.path);
      // handle file I/O error here
      csvStream.on("error", function (error) {
        log.error(`Error occurred trying to read csv file:\n${error}`);
        remote.dialog.showMessageBox(win, {
          type: "error",
          title: vi.$t("documentsMetadataModal.errorReadingCsvTitle"),
          message: vi.$t("documentsMetadataModal.errorReadingCsvMessage"),
          detail: vi.$t("documentsMetadataModal.errorReadingCsvDetail"),
          buttons: ["Ok"],
          defaultId: 0,
        });
        vi.storingCsvData = false;
      });
      let addDocMetadataToImportPromises = [];
      csvStream
        .pipe(csv.parse({ ignoreEmpty: true, headers: true }))
        // handle csv parsing error here
        .on("error", function (error) {
          log.error(`Error during csv parsing:\n${error}`);
          remote.dialog.showMessageBox(win, {
            type: "error",
            title: vi.$t("documentsMetadataModal.errorParsingCsvTitle"),
            message: vi.$t("documentsMetadataModal.errorParsingCsvMessage"),
            detail: vi.$t("documentsMetadataModal.errorParsingCsvDetail"),
            buttons: ["Ok"],
            defaultId: 0,
          });
          vi.storingCsvData = false;
        })
        .on("data", function (row) {
          addDocMetadataToImportPromises.push(
            vi.$store.dispatch(
              "import/addDocMetadataToImport",
              vi.extractCsvData([row])[0]
            )
          );
        })
        .on("end", function (rowCount) {
          // FIXME remove usage of this polyfill when Promise.allSettled will be available in Dev env
          let allSettled = (promises) =>
            Promise.all(
              promises.map((promise, i) =>
                promise
                  .then((value) => ({
                    status: "fulfilled",
                    value,
                  }))
                  .catch((reason) => ({
                    status: "rejected",
                    reason,
                  }))
              )
            );

          allSettled(addDocMetadataToImportPromises).then(() => {
            const docsToImportCount = vi.docsToImport.length;
            const metadataToImportCount = Object.getOwnPropertyNames(
              vi.docsMetadataToImport
            ).length;
            const win = remote.getCurrentWindow();
            if (metadataToImportCount === 0) {
              log.warn("No metadata match documents to import");
              remote.dialog.showMessageBox(win, {
                type: "info",
                title: vi.$t(
                  "documentsMetadataModal.warningMetadataNoMatchTitle"
                ),
                message: vi.$t(
                  "documentsMetadataModal.warningMetadataNoMatchMessage"
                ),
                detail: vi.$t(
                  "documentsMetadataModal.warningMetadataNoMatchDetail"
                ),
                buttons: ["Ok"],
                defaultId: 0,
              });
            } else if (metadataToImportCount < docsToImportCount) {
              log.warn("Some documents have no metadata associated");
              remote.dialog
                .showMessageBox(win, {
                  type: "question",
                  title: vi.$t(
                    "documentsMetadataModal.warningDocumentsMissingMetadataTitle"
                  ),
                  message: vi.$t(
                    "documentsMetadataModal.warningDocumentsMissingMetadataMessage"
                  ),
                  detail: vi.$tc(
                    "documentsMetadataModal.warningDocumentsMissingMetadataDetail",
                    docsToImportCount - metadataToImportCount
                  ),
                  buttons: [
                    vi.$t("bModal.cancelButtonValue"),
                    vi.$t("bModal.continueButtonValue"),
                  ],
                  defaultId: 1,
                })
                .then(({ response }) => {
                  if (response === 1) {
                    // Continue clicked
                    vi.$emit("event-proceed-to-import");
                  }
                });
            } else {
              vi.$emit("event-proceed-to-import");
            }
            vi.storingCsvData = false;
            log.debug("storeCsvData end");
          });
        });
    },
  },
};
</script>

<style lang="scss" scoped>
@import "../../../customBootstrap.scss";

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
