<!--
  - Copyright (c) 2019 Exotic Matter SAS. All rights reserved.
  - Licensed under the MIT License. See LICENSE in the project root for license information.
  -->

<template>
  <b-container class="pt-2" id="import-tab">
    <b-row>
      <b-col>
        <b-form-group :label="$t('importTab.sourcesFormGroupLabel')" >
          <b-form-file
            multiple
            v-model="files"
            :state="Boolean(files)"
            :placeholder=this.filesInputPlaceholder
            :drop-placeholder="$t('importTab.filesInputDropLabel')"
            accept=".pdf"
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
        <b-form-group :label="$t('importTab.destinationFormGroupLabel')"
                      :description="$t('importTab.destinationFormGroupDescription')">
          <label class="d-block " id="update-destination" :title="folderDestinationName" @click.prevent="$emit('event-pick-folder')">
            <font-awesome-icon icon="folder"/>{{folderDestinationName}}
            <div>{{ $t('bFormFile.BrowseLabel') }}</div>
          </label>
        </b-form-group>
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <b-dropdown
          id="import-button"
          :text="metadataFileDetected ?
          $t('importTab.importButtonWithMetadataValue') : $t('importTab.importButtonWithoutMetadataValue')"
          block
          split
          variant="primary"
          class="w-100"
          :disabled="(files.length === 0 && filesInsideFolder.length === 0 && docsToImport.length === 0) || importing"
          @click.prevent="prepareImport(metadataFileDetected)"
          menu-class="w-100"
          dropup
        >
          <b-dropdown-item variant="primary" @click.prevent="prepareImport(!metadataFileDetected)" class="text-center">
            {{!metadataFileDetected ?
            $t('importTab.importButtonWithMetadataValue') : $t('importTab.importButtonWithoutMetadataValue')}}
          </b-dropdown-item>
        </b-dropdown>
      </b-col>
    </b-row>
    <DocumentsMetadataModal v-if="settingDocumentsMetadata"
                            @event-proceed-to-import="proceedToImport"
                            @event-close-documents-metadata-modal="settingDocumentsMetadata = false"/>
  </b-container>
</template>

<script>
  import {mapActions, mapState} from "vuex";
  import {thumbnailGenerator} from "../../thumbnailGenerator";
  import {remote} from "electron";
  import DocumentsMetadataModal from "./ImportTab/DocumentsMetadataModal";
  import {reportTools} from "../../htmlReport";

  const log = require('electron-log');
  const fs = require('fs');

  export default {
    name: 'import-tab',
    components: {
        DocumentsMetadataModal
    },

    props: {
      importInterrupted: {
        type: Boolean
      }
    },

    data(){
      return {
        files: [],
        filesInsideFolder: [],
        importing: false,
        createdFoldersCache: {},
        settingDocumentsMetadata: false,
        guessMetadataFileName: ['data_documents_exported.csv', 'import.csv'],
        metadataFileDetected: false
      }
    },

    mounted() {
      // if last import wasn't properly completed
      if (this.docsToImport.length > 0){
        log.info('last import wasn\'t fully completed, inform user that he can finish it');
        const win = remote.getCurrentWindow();
        remote.dialog.showMessageBox(win,
          {
            type: 'info',
            title: this.$t('importTab.warningResumeLastImportTitle'),
            message: this.$t('importTab.warningResumeLastImportMessage'),
            detail: this.$tc('importTab.warningResumeLastImportDetail', this.docsToImport.length),
            buttons: ['Ok'],
            defaultId: 0
          });
      } else if (this.docsInError.length > 0) {
        this.displayImportErrorPrompt(this.docsInError.length)
      }
    },

    watch: {
      filesInsideFolder: function (newVal, oldVal) {
        if (newVal !== oldVal && newVal != null) {
          // we try to detect the presence of a csv file with document metadata inside folder to import
          if (newVal.some(({name}) => this.guessMetadataFileName.includes(name))) {
            this.metadataFileDetected = true;
          } else {
            this.metadataFileDetected = false;
          }
        }
      }
    },

    computed: {
      folderDestinationName () {
        return this.savedImportDestination && this.savedImportDestination.name !== 'Root' ?
          this.savedImportDestination.name : this.$t('rootFolderName')
      },

      filesInputPlaceholder () {
        if (this.docsToImport.length) {
          return this.docsToImport.map(file => file.name).join(', ')
        } else {
          return this.$t('importTab.filesInputPlaceholder')
        }
      },
      ...mapState('auth', ['accessToken']),
      ...mapState('import', ['docsToImport', 'docsInError', 'savedImportDestination', 'docsMetadataToImport'])
    },

    methods: {
      prepareImport (importingMetadata) {
        let vi = this;
        log.debug(importingMetadata ? 'preparing import with metadata' : 'preparing import without metadata');

        // Store files to import in store if needed (not needed when documents are recover from a previous session)
        if (vi.files.length > 0 || vi.filesInsideFolder.length > 0){
          // we filter filesInsideFolder to get only pdf files
          const filteredFilesInsideFolder = vi.filesInsideFolder.filter(file => file.type === 'application/pdf');
          // we merge files selected from file input and directory input
          const mergedFiles = vi.files.concat(filteredFilesInsideFolder);
          vi.$store.commit(
            'import/SET_DOCS_TO_IMPORT',
            // serialize File object by storing only useful fields
            mergedFiles.map(
              ({name, path, webkitRelativePath, type, lastModified}) =>
              ({name, path, webkitRelativePath, type, lastModified})
            )
          );
        }

        if(importingMetadata){
          // if there are metadata to select, set flag to display DocumentsMetadataModal
          vi.settingDocumentsMetadata = true;
        } else {
          // if there are no metadata to select, begin import right-away
          vi.proceedToImport();
        }
      },

      async proceedToImport () {
        let vi = this;
        vi.resetDataImportStart();

        log.debug('importing start');
        vi.importing = true;
        const totalCount = vi.docsToImport.length;
        vi.$emit('event-import-started', totalCount); // display progressModal

        let jsonData = {};
        let serializedDocument;
        let file;
        let md5;
        let thumbnail;
        let parentFolderId;

        while (vi.docsToImport.length > 0 && !(vi.importInterrupted || vi.accessToken === '')){
          serializedDocument = vi.docsToImport[0];

          let folderCreationError = false;
          await this.getOrCreateDocumentFolder(serializedDocument)
            .then(folderId => {
            parentFolderId = folderId;
          })
          .catch(error => {
            log.error('skipping document, parent folder creation failed');
            vi.$store.commit('import/MOVE_FIRST_DOC_FROM_IMPORT_TO_ERROR', 'Parent folder creation failed');
            folderCreationError = true;
          });
          if (folderCreationError) continue;

          // Get file blob from serialized document
          let fileReadingError = false;
          await vi.getFileAndMd5FromSerializedDocument(serializedDocument)
            .then(fileAndMd5 => {
              file = fileAndMd5.file;
              md5 = fileAndMd5.md5;
          })
          .catch(error => {
            log.error('skipping document, error during file read (the file may have been rename, move, or deleted since its selection)');
            vi.$store.commit('import/MOVE_FIRST_DOC_FROM_IMPORT_TO_ERROR', 'File not found (deleted, renamed or moved?)');
            fileReadingError = true;
          });
          if (fileReadingError) continue;

          // Format data for upload request
          jsonData = await vi.constructJsonData(parentFolderId, file, md5, serializedDocument.path);

          // Generate doc thumbnail
          thumbnail = null;
          await thumbnailGenerator.createThumbFromFile(file)
            .then(thumb => {
              thumbnail = thumb;
              log.debug('thumbnail generated');
            })
            // Ignore thumbnail generation error, as it could be generated later by Paper Matter web app
            .catch(error => {
                log.warn('error during thumbnail generation', '\n', error);
            });

          // Upload doc
          await vi.$api.uploadDocument(vi.accessToken, jsonData, file, thumbnail)
          .then((response) => {
            vi.$store.dispatch('import/consumeFirstDocToImport');
            log.debug('file uploaded', '\n', file.path);
          })
          .catch((error) => {
            vi.$store.commit('import/MOVE_FIRST_DOC_FROM_IMPORT_TO_ERROR', 'Upload error (corrupt file, network error?)');
            log.error('error during upload!', file.path, '\n', error);
          });
        }

        if(vi.importInterrupted){
          log.info('Import interrupt by user');
        } else if (vi.accessToken === '') {
          log.info('User has been disconnected');
        }

        log.debug('importing end');
        vi.resetDataImportEnd();
        vi.$emit('event-import-end', vi.docsToImport.length); // close progressModal
        vi.notifyImportEnd(totalCount);
      },

      resetDataImportStart () {
        if (this.settingDocumentsMetadata){
          // hide DocumentsMetadataModal
          this.settingDocumentsMetadata = false;
        }
        this.createdFoldersCache = {};
      },

      resetDataImportEnd () {
        this.importing = false;
        this.files = [];
        this.filesInsideFolder = [];
      },

      async getOrCreateDocumentFolder (serializedDocument) {
        // If imported document is inside a sub-folder, we may need to create the path leading to this sub-folder
        if (serializedDocument.webkitRelativePath !== '') {
          return await this.createFolderPath(serializedDocument.webkitRelativePath)
        }
        // Imported document is at the root of the imported folder or is imported as a file
        else {
          return Promise.resolve(this.savedImportDestination.id);
        }
      },

      async createFolderPath (folderPath) {
        log.debug('checking if parent folders path need to be created');
        let parentId = null;
        let currentPath = '';
        let folderPathList = folderPath.split('/'); // webkitRelativePath always use /, Windows included

        // replace local folder name, selected with input directory, by selected destination folder name
        folderPathList[0] = this.savedImportDestination.name;
        // Add destination folder to cache as it already exist
        this.createdFoldersCache['/' + this.savedImportDestination.name] = this.savedImportDestination.id;
        // remove file name from path list
        folderPathList.pop();

        for (const folderName of folderPathList){
          currentPath += '/' + folderName;
          // try to create folder only if it isn't cached in created folder yet
          if (!(currentPath in this.createdFoldersCache)) {
            await this.$api.createFolder(this.accessToken, folderName, parentId)
            .then(response => {
              log.debug(`folder "${currentPath}" created`);
              this.createdFoldersCache[currentPath] = response.data.id;
            })
            .catch((error) => {
              // folder already exist
              if (error.response && error.response.data.code === 'folder_name_unique_for_org_level') {
                log.debug(`folder ${currentPath} already exist`);
                this.getFolderId(parentId, folderName)
                .then(folderId => {
                  this.createdFoldersCache[currentPath] = folderId;
                })
                .catch(error => {
                  return Promise.reject(error);
                });
              }
              // unexpected error during folder creation
              else {
                log.error('Unexpected error during folder creation');
                return Promise.reject('Unexpected error during folder creation');
              }
            });
          }
          parentId = this.createdFoldersCache[currentPath];
        }

        return Promise.resolve(this.createdFoldersCache[currentPath]);
      },

      async getFileAndMd5FromSerializedDocument (serializedDocument){
        try{
          const nodeFileBuffer = fs.readFileSync(serializedDocument.path);
          const fileArrayBuffer = nodeFileBuffer.buffer;
          return Promise.resolve({
            file: new File([fileArrayBuffer], serializedDocument.name, {
              type: serializedDocument.type,
              lastModified: serializedDocument.lastModified,
              lastModifiedDate: new Date(serializedDocument.lastModified)
            }),
            md5: await this.hashFile({algorithm: 'md5', file: nodeFileBuffer})
          })
        }
        catch (error) {
          return Promise.reject(error);
        }
      },

      async constructJsonData (parentFolderId, file, md5, filePath) {
        let jsonData = {
          ftl_folder: parentFolderId,
          created: new Date(file.lastModified).toISOString(),
          md5: md5,
        };

        // If documents metadata are setup, check if there is a match with current document and add them to jsonData
        if (Object.getOwnPropertyNames(this.docsMetadataToImport).length) {
          const uniqueMetadataKey = await this.hashString({algorithm: 'md5', string: filePath});
          const docMetadata = this.docsMetadataToImport[uniqueMetadataKey];
          if(docMetadata !== undefined){
            if('documentTitle' in docMetadata){
              jsonData['title'] = docMetadata['documentTitle'];
            }
            if('documentNotes' in docMetadata){
              jsonData['note'] = docMetadata['documentNotes'];
            }
          }
        }
        return jsonData;
      },

      async getFolderId(parentId, name) {
        log.debug(`Try to get folder id for folder ${name} inside parent ${parentId}`);
        return await this.$api.listFolders(this.accessToken, parentId)
        .then(response => {
          for (let folder of response.data) {
              if (folder.name === name) {
                return Promise.resolve(folder.id);
              }
          }
          return Promise.reject('Fail to get folder id');
        })
        .catch(error => {
          log.error('Unexpected error when getting folder id');
          return Promise.reject(error);
        });
      },

      displayImportErrorPrompt(errorCount, export_interrupted_mention='') {
        const win = remote.getCurrentWindow();

        log.error('theses files could not be imported:', this.docsInError);
        remote.dialog.showMessageBox(win,
          {
            type: 'error',
            title: this.$tc('importTab.errorImportTitle', this.docsInError.length),
            message: this.$tc('importTab.errorImportMessage', this.docsInError.length),
            detail: this.$tc('importTab.errorImportDetail', this.docsInError.length, {export_interrupted_mention}),
            buttons: ['Ok', this.$t('importTab.displayErrorReportButtonValue')],
            defaultId: 0
          }).then( ({response}) => {
            if (response === 1){ // Second button clicked
              this.displayImportErrorReport();
            }
            // Move docs in error in the import list to able to retry an import
            this.$store.commit('import/MOVE_DOCS_FROM_ERROR_TO_IMPORT');
          }
        );
      },

      notifyImportEnd (totalCount){
        const errorCount = this.docsInError.length; // reset by import/RESET_IMPORT_DATA mutation
        const win = remote.getCurrentWindow();
        const export_interrupted_mention = this.importInterrupted ? this.$t('importTab.exportInterruptedMention') : '';

        // Do not display success or error messages when user get disconnected
        // (it will be shown at the end of the resumed import after reconnection)
        if(this.accessToken){
          if (errorCount) {
            this.displayImportErrorPrompt(errorCount, export_interrupted_mention);
          } else {
            remote.dialog.showMessageBox(win,
              {
                type: 'info',
                title: this.$t('importTab.successImportTitle'),
                message: this.$tc('importTab.successImportMessage',
                  totalCount - this.docsToImport.length, {export_interrupted_mention}),
                buttons: ['Ok'],
                defaultId: 0
              });
          }
        } else {
          remote.dialog.showMessageBox(win,
            {
              type: 'error',
              title: this.$t('importTab.warningExportInterruptedTitle'),
              message: this.$t('importTab.warningExportInterruptedMessage'),
              buttons: ['Ok'],
              defaultId: 0
            });
        }
      },

      displayImportErrorReport() {
        log.debug('displaying detailed report');
        const report = new reportTools.HtmlReport(
            ['Name', 'Path', 'Error detail'],
            this.docsInError.map(({name, path, reason}) => ([name, path, reason]))
        );
        this.$electron.shell.openExternal('file:///'+ report.save());
      },

      ...mapActions('tools', ['hashString', 'hashFile'])
    }
  }
</script>

<style scoped lang="scss">
  @import '../../customBootstrap.scss';

  #update-destination{
    color: map_get($theme-colors, 'primary');
    position:relative;
    padding: 0.375rem 0.75rem;
    line-height: 1.5;
    background: white;
    overflow: hidden;
    white-space: nowrap;

    div{
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
      vertical-align: -0.125em;
    }
  }
</style>

<style lang="scss">
  #import-button > button:first-child{
    width:100%;
  }
</style>
