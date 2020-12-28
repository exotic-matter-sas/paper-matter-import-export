<!--
  - Copyright (c) 2019 Exotic Matter SAS. All rights reserved.
  - Licensed under the MIT License. See LICENSE in the project root for license information.
  -->

<template>
  <b-container id="import-tab-content" class="pt-2">
    <b-row>
      <b-col>
        <b-form-group>
          <template slot="description">
            <span v-if="checkingFilesInFolder">
              <b-spinner small type="grow"></b-spinner>
              {{ $t("importTab.sourcesFormGroupDescriptionCheck") }}
            </span>
            <span v-else-if="unsupportedFilesInsideFolder.length > 0">
              <a
                href="#"
                class="text-danger"
                @click.prevent="displayUnsupportedFilesInsideFolderReport"
                :title="
                  $tc(
                    'importTab.sourcesFormGroupDescriptionWarning1Title',
                    unsupportedFilesInsideFolder.length
                  )
                "
              >
                {{
                  $tc(
                    "importTab.sourcesFormGroupDescriptionWarning1",
                    unsupportedFilesInsideFolder.length
                  )
                }}</a>
              {{
                $tc(
                  "importTab.sourcesFormGroupDescriptionWarning2",
                  unsupportedFilesInsideFolder.length
                )
              }}
            </span>
            <span v-else>
              <!--hack using white space to keep same UI height when no description is displayed-->
              &nbsp;
            </span>
          </template>
          <template slot="label">
            <span :title="$t('yourComputer')">
              <font-awesome-icon icon="laptop" />
              {{ $t("importTab.sourcesFormGroupLabel") }}
            </span>
          </template>
          <b-form-file
            multiple
            v-model="files"
            :state="Boolean(files)"
            :placeholder="this.filesInputPlaceholder"
            :drop-placeholder="$t('importTab.filesInputDropLabel')"
            :accept="supportedFileExtensions.join(',')"
            :browse-text="$t('bFormFile.BrowseLabel')"
          ></b-form-file>

          <b-form-file
            class="mt-2"
            directory
            multiple
            v-model="filesInsideFolder"
            :state="Boolean(filesInsideFolder)"
            :placeholder="$t('importTab.folderInputPlaceholder')"
            :drop-placeholder="$t('importTab.folderInputDropLabel')"
            :browse-text="$t('bFormFile.BrowseLabel')"
          ></b-form-file>
        </b-form-group>
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <b-form-group
          :description="$t('importTab.destinationFormGroupDescription')"
        >
          <template slot="label">
            <span :title="$t('yourPaperMatterOrg')">
              <img src="~@/assets/pm_favicon_32.png" />
              {{ $t("importTab.destinationFormGroupLabel") }}
            </span>
          </template>
          <label
            class="d-block"
            id="update-destination"
            :title="folderDestinationName"
            @click.prevent="$emit('event-pick-folder')"
          >
            <font-awesome-icon icon="folder" />{{ folderDestinationName }}
            <div>{{ $t("bFormFile.BrowseLabel") }}</div>
          </label>
        </b-form-group>
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <b-dropdown
          id="import-button"
          :text="
            detectedMetadataFile !== null
              ? $t('importTab.importButtonWithMetadataValue')
              : $t('importTab.importButtonWithoutMetadataValue')
          "
          block
          split
          variant="primary"
          class="w-100"
          :disabled="actionDisabled"
          @click.prevent="prepareImport(detectedMetadataFile !== null)"
          menu-class="w-100"
          dropup
        >
          <b-dropdown-item
            variant="primary"
            @click.prevent="prepareImport(!(detectedMetadataFile !== null))"
            class="text-center"
          >
            {{
              !(detectedMetadataFile !== null)
                ? $t("importTab.importButtonWithMetadataValue")
                : $t("importTab.importButtonWithoutMetadataValue")
            }}
          </b-dropdown-item>
        </b-dropdown>
      </b-col>
    </b-row>
    <DocumentsMetadataModal
      v-if="settingDocumentsMetadata"
      :detected-metadata-file="detectedMetadataFile"
      @event-proceed-to-import="proceedToImport"
      @event-close-documents-metadata-modal="settingDocumentsMetadata = false"
    />
  </b-container>
</template>

<script>
import { mapActions, mapState } from "vuex";
import { thumbnailGenerator } from "../../thumbnailGenerator";
import { remote } from "electron";
import DocumentsMetadataModal from "./ImportTab/DocumentsMetadataModal";
import { reportTools } from "../../htmlReport";

const log = require("electron-log");
const fs = require("fs");
const path = require("path");

export default {
  name: "import-tab",
  components: {
    DocumentsMetadataModal,
  },

  props: {
    actionInterrupted: {
      type: Boolean,
    },
    performRetry: {
      type: Boolean,
    },
  },

  data() {
    return {
      files: [],
      filesInsideFolder: [],
      supportedFileExtensions: [
        ".pdf",
        ".txt",
        ".rtf",
        ".doc",
        ".xls",
        ".ppt",
        ".docx",
        ".xlsx",
        ".pptx",
        ".odt",
        ".odp",
        ".ods",
      ],
      importing: false,
      createdFoldersCache: {},
      settingDocumentsMetadata: false,
      expectedMetadataFileNameList: [
        "import.csv",
        "data_documents_exported.csv",
      ],
      detectedMetadataFile: null,
      unsupportedFilesInsideFolder: [],
      checkingFilesInFolder: false,
    };
  },

  watch: {
    filesInsideFolder: function (newVal, oldVal) {
      if (newVal !== oldVal && newVal != null) {
        this.checkingFilesInFolder = true;
        this.detectedMetadataFile = null;
        this.unsupportedFilesInsideFolder = [];
        let vi = this;
        let fileExtension;
        let returnedIndex;

        newVal.forEach(function (file) {
          // if document metadata file not yet detected
          if (vi.detectedMetadataFile === null) {
            returnedIndex = vi.expectedMetadataFileNameList.indexOf(file.name);
            if (returnedIndex === -1) {
              vi.detectedMetadataFile = null;
            } else {
              vi.detectedMetadataFile = file;
              // if current file is the metadata file, skip next check
              return;
            }
          }
          fileExtension = path.extname(file.name).toLowerCase();
          // if file got no extension or extension isn't supported
          if (
            !fileExtension ||
            !vi.supportedFileExtensions.includes(fileExtension)
          ) {
            // store its path to display a warning message to user
            vi.unsupportedFilesInsideFolder.push(file.path);
          }
        });

        vi.checkingFilesInFolder = false;
      }
    },

    performRetry: function (newVal, oldVal) {
      if (newVal) {
        if (!this.actionDisabled) {
          this.proceedToImport();
        }
        this.$emit("update:performRetry", false);
      }
    },
  },

  computed: {
    actionDisabled() {
      // import can't be run if there is no files to import or an import is already running
      return (
        (this.files.length === 0 &&
          this.filesInsideFolder.length === 0 &&
          this.docsToImport.length === 0) ||
        this.importing
      );
    },

    folderDestinationName() {
      return this.savedImportDestination &&
        this.savedImportDestination.name !== "Root"
        ? this.savedImportDestination.name
        : this.$t("rootFolderName");
    },

    filesInputPlaceholder() {
      if (this.docsToImport.length) {
        return this.docsToImport.map((file) => file.name).join(", ");
      } else {
        return this.$t("importTab.filesInputPlaceholder");
      }
    },
    ...mapState("auth", ["accessToken"]),
    ...mapState("import", [
      "docsToImport",
      "importDocsInError",
      "savedImportDestination",
      "docsMetadataToImport",
    ]),
  },

  methods: {
    prepareImport(importingMetadata) {
      let vi = this;
      log.debug(
        importingMetadata
          ? "preparing import with metadata"
          : "preparing import without metadata"
      );

      // Store files to import in store if needed (not needed when documents are recovered from a previous session)
      if (vi.files.length > 0 || vi.filesInsideFolder.length > 0) {
        // we filter filesInsideFolder to get only supported files
        const filteredFilesInsideFolder = vi.filesInsideFolder.filter(
          (file) => {
            const fileExtension = path.extname(file.name).toLowerCase();
            if (fileExtension) {
              return this.supportedFileExtensions.includes(fileExtension);
            } // ignore files without extensions
            else {
              return false;
            }
          }
        );
        // we merge files selected from file input and directory input
        const mergedFiles = vi.files.concat(filteredFilesInsideFolder);
        vi.$store.commit(
          "import/SET_DOCS_TO_IMPORT",
          // serialize File object by storing only useful fields
          mergedFiles.map(
            ({ name, path, webkitRelativePath, type, lastModified }) => ({
              name,
              path,
              webkitRelativePath,
              type,
              lastModified,
            })
          )
        );
      }

      if (importingMetadata) {
        // if there are metadata to select, set flag to display DocumentsMetadataModal
        vi.settingDocumentsMetadata = true;
      } else {
        // if there are no metadata to select, begin import right-away
        vi.proceedToImport();
      }
    },

    async proceedToImport() {
      let vi = this;
      vi.resetDataImportStart();

      log.debug("importing start");
      vi.importing = true;
      const totalCount = vi.docsToImport.length;

      let jsonData = {};
      let serializedDocument;
      let file;
      let md5;
      let thumbnail;
      let parentFolderId;

      while (
        vi.docsToImport.length > 0 &&
        !(vi.actionInterrupted || vi.accessToken === "")
      ) {
        // Display and update progressModal
        vi.$emit("event-importing", {
          currentCount: totalCount - vi.docsToImport.length,
          totalCount: totalCount,
        });

        serializedDocument = vi.docsToImport[0];

        let folderCreationError = false;
        await this.getOrCreateDocumentFolder(serializedDocument)
          .then((folderId) => {
            parentFolderId = folderId;
          })
          .catch((error) => {
            log.error("skipping document, parent folder creation failed");
            vi.$store.commit(
              "import/MOVE_FIRST_DOC_FROM_IMPORT_TO_ERROR",
              "Parent folder creation failed"
            );
            folderCreationError = true;
          });
        if (folderCreationError) continue;

        // Get file blob from serialized document
        let fileReadingError = false;
        await vi
          .getFileAndMd5FromSerializedDocument(serializedDocument)
          .then((fileAndMd5) => {
            file = fileAndMd5.file;
            md5 = fileAndMd5.md5;
          })
          .catch((error) => {
            log.error(
              "skipping document, error during file read (the file may have been rename, move, or deleted since its selection)"
            );
            vi.$store.commit(
              "import/MOVE_FIRST_DOC_FROM_IMPORT_TO_ERROR",
              "File not found (deleted, renamed or moved?)"
            );
            fileReadingError = true;
          });
        if (fileReadingError) continue;

        // Format data for upload request
        jsonData = await vi.constructJsonData(
          parentFolderId,
          serializedDocument.lastModified,
          md5,
          serializedDocument.path
        );

        // PDF ONLY: Generate doc thumbnail
        thumbnail = null;
        if (file.type === "application/pdf") {
          await thumbnailGenerator
            .createThumbFromFile(file)
            .then((thumb) => {
              thumbnail = thumb;
              log.debug("thumbnail generated");
            })
            // Ignore thumbnail generation error, as it could be generated later by Paper Matter web app
            .catch((error) => {
              log.warn("error during thumbnail generation", "\n", error);
            });
        }

        // Upload doc
        await vi.$api
          .uploadDocument(vi.accessToken, jsonData, file, thumbnail)
          .then((response) => {
            vi.$store.dispatch("import/consumeFirstDocToImport");
            log.debug("file uploaded", "\n", file.path);
          })
          .catch((error) => {
            vi.$store.commit(
              "import/MOVE_FIRST_DOC_FROM_IMPORT_TO_ERROR",
              "Upload error (corrupt file, network error?)"
            );
            log.error("error during upload!", file.path, "\n", error);
          });
      }

      if (vi.actionInterrupted) {
        log.info("Import interrupt by user");
      } else if (vi.accessToken === "") {
        log.info("User has been disconnected");
      }

      log.debug("importing end");
      vi.resetDataImportEnd();
      vi.$emit("event-import-end"); // close progressModal
      vi.notifyImportEnd(totalCount);
    },

    resetDataImportStart() {
      if (this.settingDocumentsMetadata) {
        // hide DocumentsMetadataModal
        this.settingDocumentsMetadata = false;
      }
      this.createdFoldersCache = {};
    },

    resetDataImportEnd() {
      this.importing = false;
      this.files = [];
      this.filesInsideFolder = [];
    },

    async getOrCreateDocumentFolder(serializedDocument) {
      // If imported document is inside a sub-folder, we may need to create the path leading to this sub-folder
      if (serializedDocument.webkitRelativePath !== "") {
        return await this.createFolderPath(
          serializedDocument.webkitRelativePath
        );
      }
      // Imported document is at the root of the imported folder or is imported as a file
      else {
        return Promise.resolve(this.savedImportDestination.id);
      }
    },

    async createFolderPath(folderPath) {
      log.debug("checking if parent folders path need to be created");
      let parentId = null;
      let currentPath = "";
      let folderPathList = folderPath.split("/"); // webkitRelativePath always use /, Windows included

      // replace local folder name, selected with input directory, by selected destination folder name
      folderPathList[0] = this.savedImportDestination.name;
      // Add destination folder to cache as it already exist
      this.createdFoldersCache[
        "/" + this.savedImportDestination.name
      ] = this.savedImportDestination.id;
      // remove file name from path list
      folderPathList.pop();

      for (const folderName of folderPathList) {
        currentPath += "/" + folderName;
        // try to create folder only if it isn't cached in created folder yet
        if (!(currentPath in this.createdFoldersCache)) {
          await this.$api
            .createFolder(this.accessToken, folderName, parentId)
            .then((response) => {
              log.debug(`folder "${currentPath}" created`);
              this.createdFoldersCache[currentPath] = response.data.id;
            })
            .catch(async (error) => {
              // folder already exist
              if (
                error.response &&
                error.response.data.code === "folder_name_unique_for_org_level"
              ) {
                log.debug(`folder ${currentPath} already exist`);
                await this.getFolderId(parentId, folderName)
                  .then((folderId) => {
                    this.createdFoldersCache[currentPath] = folderId;
                  })
                  .catch((error) => {
                    return Promise.reject(error);
                  });
              }
              // unexpected error during folder creation
              else {
                log.error("Unexpected error during folder creation");
                return Promise.reject(
                  "Unexpected error during folder creation"
                );
              }
            });
        }
        parentId = this.createdFoldersCache[currentPath];
      }

      return Promise.resolve(this.createdFoldersCache[currentPath]);
    },

    async getFileAndMd5FromSerializedDocument(serializedDocument) {
      try {
        const nodeFileBuffer = fs.readFileSync(serializedDocument.path);
        return Promise.resolve({
          file: new File([nodeFileBuffer], serializedDocument.name, {
            type: serializedDocument.type,
          }),
          md5: await this.hashFile({
            algorithm: "md5",
            file: nodeFileBuffer,
          }),
        });
      } catch (error) {
        return Promise.reject(error);
      }
    },

    async constructJsonData(parentFolderId, creationDate, md5, filePath) {
      let jsonData = {
        ftl_folder: parentFolderId,
        created: new Date(creationDate).toISOString(),
        md5: md5,
      };

      // If documents metadata are setup, check if there is a match with current document and add them to jsonData
      if (Object.getOwnPropertyNames(this.docsMetadataToImport).length) {
        const uniqueMetadataKey = await this.hashString({
          algorithm: "md5",
          string: filePath,
        });
        const docMetadata = this.docsMetadataToImport[uniqueMetadataKey];
        if (docMetadata !== undefined) {
          if ("documentTitle" in docMetadata) {
            jsonData["title"] = docMetadata["documentTitle"];
          }
          if ("documentNotes" in docMetadata) {
            jsonData["note"] = docMetadata["documentNotes"];
          }
        }
      }
      return jsonData;
    },

    async getFolderId(parentId, name) {
      log.debug(
        `Try to get folder id for folder ${name} inside parent ${parentId}`
      );
      return await this.$api
        .listFolders(this.accessToken, parentId)
        .then((response) => {
          for (let folder of response.data) {
            if (folder.name === name) {
              return Promise.resolve(folder.id);
            }
          }
          return Promise.reject("Fail to get folder id");
        })
        .catch((error) => {
          log.error("Unexpected error when getting folder id");
          return Promise.reject(error);
        });
    },

    displayImportErrorPrompt(errorCount) {
      const win = remote.getCurrentWindow();

      log.error(
        "theses files could not be imported:\n",
        this.importDocsInError
      );
      remote.dialog
        .showMessageBox(win, {
          type: "error",
          title: this.$tc("importTab.errorImportTitle", errorCount),
          message: this.$tc("importTab.errorImportMessage", errorCount),
          detail: this.$tc("importTab.errorImportDetail", errorCount),
          buttons: ["Ok", this.$t("importTab.displayErrorReportButtonValue")],
          defaultId: 0,
        })
        .then(({ response }) => {
          if (response === 1) {
            // Second button clicked
            this.displayImportErrorReport();
          }
          // Move docs in error in the import list to able to retry an import
          this.$store.commit("import/MOVE_DOCS_FROM_ERROR_TO_IMPORT");
        });
    },

    notifyImportEnd(totalCount) {
      const errorCount = this.importDocsInError.length; // reset by import/RESET_IMPORT_DATA mutation
      const win = remote.getCurrentWindow();

      // Do not display success or error messages when user get disconnected
      // (it will be shown at the end of the resumed import after reconnection)
      if (this.accessToken) {
        if (errorCount) {
          this.displayImportErrorPrompt(errorCount);
        } else {
          remote.dialog.showMessageBox(win, {
            type: "info",
            title: this.$t("importTab.successImportTitle"),
            message: this.$tc(
              "importTab.successImportMessage",
              totalCount - this.docsToImport.length
            ),
            buttons: ["Ok"],
            defaultId: 0,
          });
        }
      } else {
        remote.dialog.showMessageBox(win, {
          type: "error",
          title: this.$t("importTab.warningImportInterruptedTitle"),
          message: this.$t("importTab.warningImportInterruptedMessage"),
          buttons: ["Ok"],
          defaultId: 0,
        });
      }
    },

    displayImportErrorReport() {
      log.debug("displaying detailed report");
      const report = new reportTools.HtmlReport(
        ["Name", "Path", "Error detail"],
        this.importDocsInError.map(({ name, path, reason }) => [
          name,
          path,
          reason,
        ])
      );
      this.$electron.shell.openExternal("file:///" + report.save());
    },

    displayUnsupportedFilesInsideFolderReport() {
      log.debug("displaying unsupported files report");
      let reportContent = this.unsupportedFilesInsideFolder.map((path) => [
        path,
      ]);
      // Add an information message as first row
      reportContent.unshift([
        `<span style="color: gray;">${this.$t(
          "importTab.displayUnsupportedFilesInsideFolderReportIntro",
          {
            files_extensions: this.supportedFileExtensions.join(", "),
          }
        )}</span><hr>`,
      ]);

      const report = new reportTools.HtmlReport(["Path"], reportContent);
      this.$electron.shell.openExternal("file:///" + report.save());
    },

    ...mapActions("tools", ["hashString", "hashFile"]),
  },
};
</script>

<style scoped lang="scss">
@import "../../customBootstrap.scss";

svg,
img {
  vertical-align: -0.125em;
  height: 16px;
}

#update-destination {
  color: map_get($theme-colors, "primary");
  position: relative;
  padding: 0.375rem 0.75rem;
  line-height: 1.5;
  background: white;
  overflow: hidden;
  white-space: nowrap;

  div {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 3;
    display: block;
    height: calc(1.5em + 0.75rem);
    padding: 0.375rem 0.75rem;
    line-height: 1.5;
    color: #495057;
    content: "Browse";
    background-color: #e9ecef;
    border-left: inherit;
    border-radius: 0 0.25rem 0.25rem 0;
  }

  svg {
    margin-right: 0.5em;
  }
}

#import-tab-content ::v-deep small a {
  text-decoration: underline;
}
</style>
