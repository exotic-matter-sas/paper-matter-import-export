<!--
  - Copyright (c) 2019 Exotic Matter SAS. All rights reserved.
  - Licensed under the MIT License. See LICENSE in the project root for license information.
  -->

<template>
  <b-container id="export-tab-content" class="pt-2">
    <b-row>
      <b-col>
        <b-form-group :label="$t('exportTab.sourcesFormGroupLabel')">
            <label class="d-block" id="update-source" :title="folderSourceName">
                   <!--TODO re-enable when we could export a specific folder @click.prevent="$emit('event-pick-folder')"-->
              <font-awesome-icon icon="folder"/>{{folderSourceName}}
              <!--TODO re-enable when we could export a specific folder <div>{{ $t('bFormFile.BrowseLabel') }}</div>-->
            </label>
        </b-form-group>
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <b-form-group :label="$t('exportTab.destinationFormGroupLabel')"
                      :description="$t('exportTab.destinationFormGroupDescription')">
          <label class="d-block" id="update-destination" :title="savedExportDestination"
                 @click.prevent="setDestinationFolder">
            <font-awesome-icon icon="folder"/>{{savedExportDestination}}
            <div>{{ $t('bFormFile.BrowseLabel') }}</div>
          </label>
        </b-form-group>
      </b-col>
    </b-row>

    <b-button class="w-100" id="export-button" variant="primary"
              :disabled="!savedExportDestination"
              @click.prevent="proceedToExport">
      {{ $t('exportTab.exportButtonValue')}}
    </b-button>
  </b-container>
</template>

<script>
  import {mapActions, mapState} from "vuex";
  import {remote} from "electron";
  import {reportTools} from "../../htmlReport";

  const log = require('electron-log');
  const fs = require('fs');
  const os = require('os');

  export default {
    name: 'export-tab',

    props: {
      actionInterrupted: {
        type: Boolean
      }
    },

    mounted() {
      // if last export wasn't properly completed
      if (this.docsToExport.length > 0){
        log.info('last export wasn\'t fully completed, inform user that he can resume it');
        const win = remote.getCurrentWindow();
        remote.dialog.showMessageBox(win,
          {
            type: 'info',
            title: this.$t('exportTab.warningResumeLastExportTitle'),
            message: this.$t('exportTab.warningResumeLastExportMessage'),
            detail: this.$tc('exportTab.warningResumeLastExportDetail', this.docsToExport.length),
            buttons: ['Ok'],
            defaultId: 0
          });
      } else if (this.exportDocsInError.length > 0) {
        this.displayExportErrorPrompt(this.exportDocsInError.length)
      }
    },

    computed: {
      folderSourceName () {
        return this.savedExportSource && this.savedExportSource.name !== 'Root' ?
          this.savedExportSource.name : this.$t('rootFolderName')
      },

      ...mapState('auth', ['accessToken']),
      ...mapState('export', ['savedExportSource', 'savedExportDestination', 'exportFolderName', 'docsToExport',
        'exportDocsInError', 'duplicatedFilePathCount']),
      ...mapState('config', ['apiHostName'])
    },

    methods: {
      setDestinationFolder () {
        const vi = this;
        const win = remote.getCurrentWindow();

        remote.dialog.showOpenDialog(win,
          {
            title: this.$t('exportTab.setDestinationFolderPromptTitle'),
            message: this.$t('exportTab.setDestinationFolderPromptMessage'),
            defaultPath: this.savedExportDestination === null ? os.homedir() : this.savedExportDestination,
            properties: ['openDirectory', 'createDirectory']
          }
        ).then(selectionObject => {
          if (selectionObject.canceled) {
            log.info('User canceled destination folder selection for export');
          }
          else {
            // We store the export destination
            vi.$store.commit('export/SET_EXPORT_DESTINATION', selectionObject.filePaths[0]);
          }
        });
      },

      async proceedToExport () {
        const vi = this;

        // List and store all documents to export, unless documents are recovered from a previous session
        let listDocumentsError = false;
        let totalCount = 0;
        if (vi.docsToExport.length === 0) {
          await vi.listAllDocuments()
            .then(allDocuments => {
              vi.$store.commit(
                'export/SET_DOCS_TO_EXPORT',
                // storing only useful fields of documents to export
                allDocuments.map(
                  ({pid, title, note, created, path, md5, ext}) =>
                    ({pid, title, note, created, path, md5, ext})
                )
              );
              totalCount = allDocuments.length;
              vi.$emit('event-step-end') // to display second step progressbar
            })
            .catch(error => {
              log.error(`aborting export, error occurred during documents listing:\n ${error}`);
              listDocumentsError = true;
            });
        }

        let serializedDocument;
        let docDirAbsolutePath;
        while (vi.docsToExport.length > 0 && !(vi.actionInterrupted || vi.accessToken === '' || listDocumentsError)) {
          // Display and update progressModal
          vi.$emit('event-exporting', {
            currentCount: totalCount - vi.docsToExport.length,
            totalCount: totalCount
          });

          serializedDocument = vi.docsToExport[0];
          docDirAbsolutePath = this.getDocDirAbsolutePath(serializedDocument.path);

          // Create folder path for document if needed
          let folderCreationError = false;

          await fs.promises.mkdir(docDirAbsolutePath, {recursive: true})
          .catch(error => {
            log.error('skipping document, parent folder creation failed');
            vi.$store.commit('export/MOVE_FIRST_DOC_FROM_EXPORT_TO_ERROR', 'Parent folder creation failed');
            folderCreationError = true;
          });
          if (folderCreationError) continue;

          // Download document and check its integrity
          let downloadError = false;
          await this.downloadAndIntegrityCheckDocument(
            serializedDocument,
            docDirAbsolutePath
          )
          .catch(error => {
            log.error(`skipping document, download failed (${error})`);
            vi.$store.commit('export/MOVE_FIRST_DOC_FROM_EXPORT_TO_ERROR', 'Download failed');
            downloadError = true;
          });
          if (downloadError) continue;
          // TODO Store document meta into CSV

          vi.$store.commit('export/CONSUME_FIRST_DOC_TO_EXPORT')
        }

        log.debug('export end');
        vi.$emit('event-export-end', vi.docsToExport.length); // close progressModal
        vi.notifyExportEnd(totalCount);
        // TODO complete API doc to add info about download and document details + refactor url format
        // first version limitations :
        //    a new folder is created into destination at each export
        //    no source selection possible (only Root)
        //    no export of empty folder (containing no documents or only folders with no documents)
      },

      listAllDocuments(startPage=1, currentDocumentCount=0) {
        let vi = this;
        let documentsToExport;

        return this.$api.listDocuments(vi.accessToken, startPage)
          .then(async response => {
            // Display and update progressModal
            vi.$emit('event-exporting', {
              currentCount: currentDocumentCount,
              totalCount: response.data.count
            });

            documentsToExport = response.data.results;

            // If results are paginated, additional API calls are required
            if (response.data.next !== null) {
              // if user does not interrupt export or doesn't need to log again
              if (!(vi.actionInterrupted || vi.accessToken === '')) {
                // /!\ recursion black magic happen here
                await this.listAllDocuments(startPage + 1, currentDocumentCount + documentsToExport.length)
                  .then(additionalDocumentsToExport => {
                      // merging returned array with documentsToExport
                      Array.prototype.push.apply(documentsToExport, additionalDocumentsToExport);
                    }
                  );
              }
              else {
                let errorMessage;
                if (vi.actionInterrupted) {
                  errorMessage = 'Export interrupted by user';
                }
                else {
                  errorMessage = 'User need to login to get a new access token';
                }
                return Promise.reject(errorMessage);
              }

            }
            return Promise.resolve(documentsToExport);
          })
      },

      getDocDirAbsolutePath(docDirPathArray) {
        let docDirAbsolutePathArray = [
          this.savedExportDestination,
          this.exportFolderName
        ];

        // if doc is in a sub folder
        if (docDirPathArray.length) {
          docDirAbsolutePathArray.push(
            docDirPathArray.map(({name}) => name).join('/')
          );
        }

        return docDirAbsolutePathArray.join('/');
      },

      getDocAbsolutePath(docDirAbsolutePath, fileName, fileExt, fileNameCount = null) {
        let counter = '';

        if (fileNameCount !== null) {
          counter = ` (${fileNameCount})`
        }

        let docAbsolutePathArray = [
          docDirAbsolutePath,
          fileName + counter + fileExt
        ];

        return docAbsolutePathArray.join('/');
      },

      downloadAndIntegrityCheckDocument(serializedDocument, docDirAbsolutePath){
        let vi = this;
        const docAbsolutePath = vi.getDocAbsolutePath(
          docDirAbsolutePath,
          serializedDocument.title,
          serializedDocument.ext
        );

        return vi.$api.downloadDocumentAsArrayBuffer(vi.accessToken, serializedDocument.pid)
        // compute and check md5
        .then(response => {
          const nodeFileBuffer = Buffer.from(response.data);

          return vi.hashFile({algorithm: 'md5', file: nodeFileBuffer}).then(computedMd5 => {
              if (serializedDocument.md5 === computedMd5) {
                return Promise.resolve(nodeFileBuffer);
              } else {
                return Promise.reject('File md5 mismatch, file seems to have been corrupted during download');
              }
          })
        })
        // save file to disk
        .then(nodeFileBuffer => {
          return fs.promises.writeFile(
              docAbsolutePath,
              nodeFileBuffer,
              {flag: 'wx'}  // write mode + error in case file already exist
            )
            .catch(async error => {
            // a file with the same name already exist in the folder
            if ('code' in error && error.code === 'EEXIST'){
              // compute the count to add to file name
              const docPathHash = await vi.hashString({algorithm: 'md5', string: docAbsolutePath});
              let fileCount;

              if (docPathHash in vi.duplicatedFilePathCount) {
                fileCount = vi.duplicatedFilePathCount[docPathHash] + 1;
                vi.$store.commit(
                  'export/SET_DUPLICATED_FILE_PATH_COUNT',
                  [docPathHash, fileCount]
                );
              }
              else {
                fileCount = 1;
                vi.$store.commit(
                  'export/SET_DUPLICATED_FILE_PATH_COUNT',
                  [docPathHash, fileCount]
                );
              }
              return fs.promises.writeFile(
                vi.getDocAbsolutePath(
                  docDirAbsolutePath,
                  serializedDocument.title,
                  serializedDocument.ext,
                  fileCount
                ),
                nodeFileBuffer,
                {flag: 'wx'}
              );
            }
            else {
              return Promise.reject(error);
            }
          });
        })
      },

      displayExportErrorPrompt(errorCount, export_interrupted_mention='') {
        const win = remote.getCurrentWindow();

        log.error('theses files could not be exported:', this.exportDocsInError);
        remote.dialog.showMessageBox(win,
          {
            type: 'error',
            title: this.$tc('exportTab.errorExportTitle', this.exportDocsInError.length),
            message: this.$tc('exportTab.errorExportMessage', this.exportDocsInError.length),
            detail: this.$tc('exportTab.errorExportDetail', this.exportDocsInError.length,
              {export_interrupted_mention}),
            buttons: ['Ok', this.$t('exportTab.displayErrorReportButtonValue')],
            defaultId: 0
          }).then( ({response}) => {
            if (response === 1){ // Second button clicked
              this.displayExportErrorReport();
            }
            // Move docs in error list to able to retry an export
            this.$store.commit('export/MOVE_DOCS_FROM_ERROR_TO_EXPORT');
          }
        );
      },

      notifyExportEnd (totalCount){
        const errorCount = this.exportDocsInError.length; // reset by export/RESET_EXPORT_DATA mutation
        const win = remote.getCurrentWindow();
        const export_interrupted_mention = this.actionInterrupted ? this.$t('exportTab.exportInterruptedMention') : '';

        // Do not display success or error messages when user get disconnected
        // (it will be shown at the end of the resumed export after reconnection)
        if(this.accessToken){
          if (errorCount) {
            this.displayExportErrorPrompt(errorCount, export_interrupted_mention);
          } else {
            remote.dialog.showMessageBox(win,
              {
                type: 'info',
                title: this.$t('exportTab.successExportTitle'),
                message: this.$tc(
                  'exportTab.successExportMessage',
                  totalCount - this.docsToExport.length, {export_interrupted_mention}
                  ),
                buttons: ['Ok'],
                defaultId: 0
              });
          }
        } else {
          remote.dialog.showMessageBox(win,
            {
              type: 'error',
              title: this.$t('exportTab.warningExportInterruptedTitle'),
              message: this.$t('exportTab.warningExportInterruptedMessage'),
              buttons: ['Ok'],
              defaultId: 0
            });
        }
      },

      displayExportErrorReport() {
        log.debug('displaying detailed report');
        const report = new reportTools.HtmlReport(
          ['Title', 'Error detail'],
          this.exportDocsInError.map(({title, pid, reason}) => ([
            `<a href="${this.apiHostName}/app/#/home?doc=${pid}" target="_blank">${title}</a>`,
            reason
          ]))
        );
        this.$electron.shell.openExternal('file:///'+ report.save());
      },

      ...mapActions('tools', ['hashString', 'hashFile']),
    }
  }
</script>

<style scoped lang="scss">
  @import '../../customBootstrap.scss';

  #update-source, #update-destination{
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
  #export-button > button:first-child{
    width:100%;
  }
</style>
