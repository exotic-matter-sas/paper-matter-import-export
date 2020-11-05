<!--
  - Copyright (c) 2019 Exotic Matter SAS. All rights reserved.
  - Licensed under the MIT License. See LICENSE in the project root for license information.
  -->

<template>
  <b-container id="export-tab-content" class="pt-2">
    <b-row>
      <b-col>
        <b-form-group>
            <template slot="label">
              <span :title="$t('yourPaperMatterOrg')">
                <img src="~@/assets/pm_favicon_32.png"/>
                {{ $t('exportTab.sourcesFormGroupLabel') }}
              </span>
            </template>
            <label class="d-block" id="update-source" :title="$t('exportTab.sourceOnlyRootTitle')"
                   @click.prevent="$emit('event-pick-folder')">
              <font-awesome-icon icon="folder"/>{{folderSourceName}}
              <div>{{ $t('bFormFile.BrowseLabel') }}</div>
            </label>
        </b-form-group>
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <b-form-group :description="$t('exportTab.destinationFormGroupDescription')">
          <template slot="label">
            <span :title="$t('yourComputer')">
              <font-awesome-icon icon="laptop"/>
              {{ $t('exportTab.destinationFormGroupLabel') }}
            </span>
          </template>
          <label class="d-block border border-success rounded" id="update-destination" :title="savedExportDestination"
                 @click.prevent="setDestinationFolder">
            <span v-if="savedExportDestination">
              {{savedExportDestination}}
            </span>
            <span v-else>
              {{ $t('exportTab.folderInputPlaceholder') }}
            </span>
            <div>{{ $t('bFormFile.BrowseLabel') }}</div>
          </label>
        </b-form-group>
      </b-col>
    </b-row>

    <b-button class="w-100" id="export-button" variant="primary"
              :disabled="actionDisabled"
              @click.prevent="proceedToExport">
      {{ $t('exportTab.exportButtonValue')}}
    </b-button>
  </b-container>
</template>

<script>
  import {mapActions, mapState} from "vuex";
  import {remote} from "electron";
  import {reportTools} from "../../htmlReport";
  import {format} from '@fast-csv/format';

  const log = require('electron-log');
  const fs = require('fs');
  const os = require('os');
  const path = require('path');
  const win = remote.getCurrentWindow();

  export default {
    name: 'export-tab',

    props: {
      actionInterrupted: {
        type: Boolean
      },
      performRetry: {
        type: Boolean
      },
    },

    watch: {
      performRetry: function (newVal, oldVal) {
        if (newVal) {
          if (!this.actionDisabled) {
            this.proceedToExport();
          }
          this.$emit('update:performRetry', false);
        }
      }
    },

    computed: {
      folderSourceName () {
        return this.savedExportSource && this.savedExportSource.name !== 'Root' ?
          this.savedExportSource.name : this.$t('rootFolderName')
      },

      actionDisabled () {
        return !this.savedExportDestination;
      },

      ...mapState('auth', ['accessToken']),
      ...mapState('export', ['savedExportSource', 'savedExportDestination', 'exportFolderName', 'docsToExport',
        'exportDocsInError', 'duplicatedFilePathCount', 'metadataExportSkipped']),
      ...mapState('config', ['apiHostName'])
    },

    methods: {
      setDestinationFolder () {
        const vi = this;

        remote.dialog.showOpenDialog(win,
          {
            title: this.$t('exportTab.setDestinationFolderPromptTitle'),
            message: this.$t('exportTab.setDestinationFolderPromptMessage'),
            defaultPath: this.savedExportDestination === null ? os.homedir() : this.savedExportDestination,
            properties: ['openDirectory', 'createDirectory']
          })
        .then(selectionObject => {
          if (selectionObject.canceled) {
            log.info('User canceled destination folder selection for export');
          }
          else {
            // We store the export destination
            vi.$store.commit('export/SET_EXPORT_DESTINATION', selectionObject.filePaths[0]);
          }
        });
      },

      // Current limitations :
      // - a new folder is created into destination at each export
      // - no export of empty folder (containing no documents or only folders with no documents)
      async proceedToExport () {
        const vi = this;
        let csvWriteStream;
        let csvFormatStream;
        let totalCount = this.docsToExport.length;

        try {
          // Create export parent folder
          // (unless its is already created from a previous session recovered)
          if (!this.exportFolderName){
            try {
              vi.$store.commit('export/SET_EXPORT_FOLDER_NAME');
              fs.mkdirSync(path.join(this.savedExportDestination, this.exportFolderName), {recursive: true})
            }
            catch (e) {
              log.error('aborting export, initial folder creation failed', e);
              const error = new Error('exportFolderCreationFailed');
              error.name = 'PMISetupError';
              throw error;
            }
          }

          // Create CSV file to store docs metadata
          try {
            csvWriteStream = fs.createWriteStream(
              path.join(this.savedExportDestination, this.exportFolderName, 'import.csv'),
              {flags: 'a'} // create file if it doesn't exist and/or append to it
            );
            csvFormatStream = format({ headers: true });
            csvFormatStream.pipe(csvWriteStream);
          } catch (e) {
            log.error('ignoring metadata export, an error occurred during CSV file initialization:\n', e);
            vi.$store.commit('export/SKIP_METADATA_EXPORT');
          }

          // List and store all documents to export
          // (unless there is already documentsToExport, recovered from a previous session)
          if (vi.docsToExport.length === 0) {
            let sourceFolderId = vi.savedExportSource.id;
            await vi.listAllDocuments(1, 0, sourceFolderId)
            .then(allDocuments => {
              vi.$store.commit(
                'export/SET_DOCS_TO_EXPORT',
                // storing only useful fields for documents to export
                allDocuments.map(
                  ({pid, title, note, created, path, md5, ext, download_url}) =>
                    ({pid, title, note, created, path, md5, ext, download_url})
                )
              );
              totalCount = allDocuments.length;
            })
            .catch(e => {
              log.error('aborting export, error occurred during documents listing:\n', e);

              // interruptedByUser error silently fail, error message won't be shown
              if (e.message !== 'interruptedByUser') {
                const error = new Error('documentsListingFailed');
                error.name = 'PMISetupError';
                throw error;
              }
            });
          }
          vi.$emit('event-step-end'); // to display second step progressbar

          // Export each listed document to file and associated metadata to csv file
          let serializedDocument;
          let docDirAbsolutePath;
          let docAbsolutePath;
          while (vi.docsToExport.length > 0 && !(vi.actionInterrupted || vi.accessToken === '')) {
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
            .catch(e => {
              log.error('skipping document, parent folder creation failed:\n', e);
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
            .then(path => {docAbsolutePath = path})
            .catch(e => {
              log.error('skipping document, download failed:\n', e);
              vi.$store.commit('export/MOVE_FIRST_DOC_FROM_EXPORT_TO_ERROR', 'Download failed');
              downloadError = true;
            });
            if (downloadError) continue;

            // Append doc metadata to import.csv file
            if(!this.metadataExportSkipped){
              csvFormatStream.write({
                path: docAbsolutePath,
                name: serializedDocument.title,
                notes: serializedDocument.note,
              });
            }

            vi.$store.commit('export/CONSUME_FIRST_DOC_TO_EXPORT')
          }

          log.debug('export end');
          vi.$emit('event-export-end', vi.docsToExport.length); // close progressModal
          vi.notifyExportEnd(totalCount, path.join(vi.savedExportDestination, vi.exportFolderName));
        }
        catch (e) {
          log.error('Export aborted due to a fatal error:\n', e);
          this.displayFatalError(e);
        }
        finally {
          try {
            // If export is complete and there is no error reset some states for next export
            if(this.docsToExport.length === 0 && this.exportDocsInError.length === 0){
              vi.$store.commit('export/RESET_EXPORT_DATA_FOR_NEXT_RUN');
            }
            // close writeStream
            csvFormatStream.end();
          }
          catch (e) {
            // ignore errors
          }
        }
      },

      listAllDocuments(startPage, currentDocumentCount, level) {
        let vi = this;
        let documentsToExport;

        return this.$api.listDocuments(vi.accessToken, startPage, level)
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
              await this.listAllDocuments(startPage + 1, currentDocumentCount + documentsToExport.length, level)
              .then(additionalDocumentsToExport => {
                  // merging returned array with documentsToExport
                  Array.prototype.push.apply(documentsToExport, additionalDocumentsToExport);
                }
              );
            }
            else {
              let error;
              if (vi.actionInterrupted) {
                error = new Error('interruptedByUser');
              }
              else {
                error = new Error('accessTokenMissing');
              }
              return Promise.reject(error);
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

        // If user export a specific folder, docDirPathArray need to be truncated
        // for source folder and its parents not to be created inside destination
        if (docDirPathArray.length > 0 && this.savedExportSource.id !== null) {
          // reverse array to go through it from closest parent to farthest one
          docDirPathArray.reverse();
          let truncatedDocDirPathArray = [];

          // populate truncatedDocDirPathArray with docDirPathArray until exported folder is encountered
          docDirPathArray.some((doc) => {
            if (doc.id === this.savedExportSource.id){
              return true
            } else {
              truncatedDocDirPathArray.push(doc);
            }
          });
          docDirPathArray = truncatedDocDirPathArray;

          // restore original order
          docDirPathArray.reverse();
        }

        // if doc is inside a sub folder
        if (docDirPathArray.length) {
          docDirAbsolutePathArray.push(
            path.join(...docDirPathArray.map(({name}) => name))
          );
        }

        return path.join(...docDirAbsolutePathArray);
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

        return path.join(...docAbsolutePathArray);
      },

      downloadAndIntegrityCheckDocument(serializedDocument, docDirAbsolutePath){
        let vi = this;
        const docAbsolutePath = vi.getDocAbsolutePath(
          docDirAbsolutePath,
          serializedDocument.title,
          serializedDocument.ext
        );

        return vi.$api.downloadDocumentAsArrayBuffer(vi.accessToken, serializedDocument.download_url)
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
          }});
        })
        // update file date to match document date
        .then(() => {
          const documentDate = new Date(serializedDocument.created);
          return fs.promises.utimes(docAbsolutePath, documentDate, documentDate);
        })
        .then(() => {
          return Promise.resolve(docAbsolutePath)
        })
      },

      displayFatalError(error) {
        let errorTitle;
        let errorMessage;
        let errorDetail;
        let buttons = ['Ok'];
        // Error occurred during export setup
        if (error.name === 'PMISetupError'){
          errorTitle = this.$t(`exportTab.expectedFatalErrors.${error.message}.title`);
          errorMessage = this.$t(`exportTab.expectedFatalErrors.${error.message}.message`);
          errorDetail = this.$t(`exportTab.expectedFatalErrors.${error.message}.detail`);
        }
        // Unexpected error occurred during setup or while loop
        else {
          errorTitle = this.$t(`exportTab.unexpectedFatalErrors.title`);
          errorMessage = this.$t(`exportTab.unexpectedFatalErrors.message`);
          errorDetail = this.$t(`exportTab.unexpectedFatalErrors.detail`);
          buttons.push(this.$t(`reportAnIssue`));
        }

        // Display error prompt
        remote.dialog.showMessageBox(win,
          {
            type: 'error',
            title: errorTitle,
            message: errorMessage,
            detail: errorDetail,
            buttons: buttons,
            defaultId: 0
          })
          .then(({response}) => {
          if (response === 1){ // Second button clicked
            this.$electron.shell.openExternal(
              'https://github.com/exotic-matter-sas/paper-matter-import-export/issues/new'
            );
          }
        });
      },

      displayExportErrorPrompt(errorCount, optionalMention='') {
        log.error('theses files could not be exported:', this.exportDocsInError);
        remote.dialog.showMessageBox(win,
          {
            type: 'error',
            title: this.$tc('exportTab.errorExportTitle', this.exportDocsInError.length),
            message: this.$tc('exportTab.errorExportMessage', this.exportDocsInError.length),
            detail: this.$tc('exportTab.errorExportDetail', this.exportDocsInError.length,
              {optionalMention}),
            buttons: ['Ok', this.$t('exportTab.displayErrorReportButtonValue')],
            defaultId: 0
          })
        .then(({response}) => {
          if (response === 1){ // Second button clicked
            this.displayExportErrorReport();
          }
          // Move docs in error list to able to retry an export
          this.$store.commit('export/MOVE_DOCS_FROM_ERROR_TO_EXPORT');
        });
      },

      notifyExportEnd (totalCount, exportFolderPath){
        const errorCount = this.exportDocsInError.length; // reset by export/RESET_EXPORT_DATA mutation
        const mentionsList = [
          this.metadataExportSkipped ? this.$t('exportTab.metadataNotExportedMention') : ''
        ]
        .filter(mention => mention !== '');

        let joinedMentions = mentionsList.join(this.$t('exportTab.and'));
        if (joinedMentions !== ''){
          joinedMentions = ` (${joinedMentions})`
        }

        // Do not display success or error messages when user get disconnected
        // (it will be shown at the end of the resumed export after reconnection)
        if(this.accessToken){
          if (errorCount) {
            this.displayExportErrorPrompt(errorCount, joinedMentions);
          } else {
            remote.dialog.showMessageBox(win,
              {
                type: 'info',
                title: this.$t('exportTab.successExportTitle'),
                message: this.$tc(
                  'exportTab.successExportMessage',
                  totalCount - this.docsToExport.length, {joined_mentions: joinedMentions}
                  ),
                buttons: ['Ok', this.$t('exportTab.displayFolderButtonValue')],
                defaultId: 0
              }).then( ({response}) => {
              if (response === 1){
                this.$electron.shell.openItem(exportFolderPath);
              }
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

  svg,img {
    vertical-align: -0.125em;
    height: 16px;
  }

  label{
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
    }
  }

  #update-destination {
    color: $gray-700;
  }
</style>

<style lang="scss">
  #export-button > button:first-child{
    width:100%;
  }
</style>
