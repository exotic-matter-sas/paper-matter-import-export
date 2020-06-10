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

  const log = require('electron-log');
  const fs = require('fs');
  const os = require('os');

  export default {
    name: 'export-tab',

    props: {
      exportInterrupted: {
        type: Boolean
      }
    },

    data(){
      return {
        exportStartDate: '',
        filePathDuplicatedCount: {} // TODO move into store
      }
    },

    mounted() {

    },

    computed: {
      folderSourceName () {
        return this.savedExportSource && this.savedExportSource.name !== 'Root' ?
          this.savedExportSource.name : this.$t('rootFolderName')
      },

      ...mapState('auth', ['accessToken']),
      ...mapState('export', ['docsToExport', 'savedExportSource', 'savedExportDestination'])
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
        this.resetDataExportStart();

        // List and store all documents to export
        let listDocumentsError = false;
        await vi.listAllDocuments()
        .then(allDocuments => {
          console.log('allDocuments', allDocuments);
          vi.$store.commit(
            'export/SET_DOCS_TO_EXPORT',
            // storing only useful fields of documents to export
            allDocuments.map(
              ({pid, title, note, created, path, md5, ext}) =>
              ({pid, title, note, created, path, md5, ext})
            )
          );
        })
        .catch(error => {
          log.error(`aborting export, error occurred during documents listing:\n ${error}`);
          listDocumentsError = true;
        });

        let serializedDocument;
        let docDirAbsolutePath;
        while (vi.docsToExport.length > 0 && !(vi.importInterrupted || vi.accessToken === '' || listDocumentsError)) {
          serializedDocument = vi.docsToExport[0];

          docDirAbsolutePath = this.getDocDirAbsolutePath(serializedDocument.path);

          // Create folder path for document if needed
          let folderCreationError = false;
          console.log('docDirAbsolutePath', docDirAbsolutePath);

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
        // TODO complete API doc to add info about download and document details + refactor url format
        // first version limitations :
        //    a new folder is created into destination at each export
        //    no source selection possible (only Root)
        //    no export of empty folder (containing no documents or only folders with no documents)
      },

      async resetDataExportStart () {
        this.exportStartDate = new Date();
      },

      async listAllDocuments(firstPage=1) {
        let vi = this;
        let documentsToExport;

        // TODO emit events for progressbar

        return await this.$api.listDocuments(vi.accessToken, firstPage)
          .then(async response => {
            documentsToExport = response.data.results;
            // If results are paginated, additional API calls are required
            if (response.data.next !== null) {
              // if user interrupted export or need to log again, no need to pursue
              if (!(vi.exportInterrupted || vi.accessToken === '')) {
                // recursion black magic happen here
                await this.listAllDocuments(firstPage + 1)
                  .then(additionalDocumentsToExport => {
                      // merging returned array with documentsToExport
                      Array.prototype.push.apply(documentsToExport, additionalDocumentsToExport);
                    }
                  );
              } else {
                let errorMessage;
                if (vi.exportInterrupted) {
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
          this.exportStartDate.toISOString().replace(/[:.]/g, '-'), // replace non path friendly characters by "-"
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
        const docAbsolutePath = this.getDocAbsolutePath(
          docDirAbsolutePath,
          serializedDocument.title,
          serializedDocument.ext
        );

        return this.$api.downloadDocumentAsArrayBuffer(this.accessToken, serializedDocument.pid)
        // compute and check md5
        .then(response => {
          const nodeFileBuffer = Buffer.from(response.data);

          return this.hashFile({algorithm: 'md5', file: nodeFileBuffer}).then(computedMd5 => {
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
              console.log('error catched!');
              // compute the count to add to file name
              const docPathHash = await this.hashString({algorithm: 'md5', string: docAbsolutePath});
              let fileCount;

              if (docPathHash in this.filePathDuplicatedCount) {
                fileCount = this.filePathDuplicatedCount[docPathHash] += 1
              }
              else {
                fileCount = this.filePathDuplicatedCount[docPathHash] = 1
              }
              console.log('recall write file');
              return fs.promises.writeFile(
                this.getDocAbsolutePath(
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

      ...mapActions('tools', ['hashString', 'hashFile'])
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
