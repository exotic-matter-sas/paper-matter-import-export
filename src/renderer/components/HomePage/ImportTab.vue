<template>
  <b-container class="pt-2">
    <b-row>
      <b-col>
        <b-form-group label="Sources" >
          <b-form-file
            multiple
            v-model="files"
            :state="Boolean(files)"
            :placeholder=this.filesInputPlaceholder
            drop-placeholder="Drop pdf documents to import here..."
            accept=".pdf"
          ></b-form-file>

          <b-form-file
            class="mt-2"
            directory
            multiple
            v-model="filesInsideFolder"
            :state="Boolean(filesInsideFolder)"
            placeholder="Choose a folder to import..."
            drop-placeholder="Drop a folder to import here..."
          ></b-form-file>
        </b-form-group>
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <b-form-group label="Destination" description="Files or content of selected folder will be imported into the destination">
          <label class="d-block " id="update-destination" :title="folderDestinationName" @click.prevent="$emit('event-pick-folder')">
            <font-awesome-icon icon="folder"/>{{folderDestinationName}}
          </label>
        </b-form-group>
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <b-button class="w-100" id="import-button" variant="primary"
                  :disabled="(files.length === 0 && filesInsideFolder.length === 0 && docsPathToImport.length === 0) || importing"
                  @click.prevent="importDocuments">
          Import
        </b-button>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
  import {mapState} from "vuex";
  import {createThumbFromFile} from "../../thumbnailGenerator";
  import {remote} from "electron";
  import HtmlReport from "../../htmlReport";

  const log = require('electron-log');
  const fs = require('fs');
  const path = require('path');

  export default {
    name: 'import-tab',

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
        createdFoldersCache: {}
      }
    },

    mounted() {
      // if last import wasn't properly completed
      let docsToImportCount = this.docsPathToImport.length;
      if (docsToImportCount > 0){
        log.info('last import wasn\'t fully completed, inform user that he can finish it');
        const win = remote.getCurrentWindow();
        remote.dialog.showMessageBox(win,
          {
            type: 'info',
            title: 'You can resume last import',
            message: 'Last import wasn\'t fully completed.',
            detail: `There is ${docsToImportCount} files left to import, you can finish the import by clicking ` +
                'the Import button.',
            buttons: ['Ok'],
            defaultId: 0
          });
      }
    },

    computed: {
      folderDestinationName () {
          return this.savedImportDestination ? this.savedImportDestination.name : 'Root'
      },

      filesInputPlaceholder () {
        if (this.docsPathToImport.length) {
          return this.docsPathToImport.map(file => file.name).join(', ')
        } else {
          return 'Choose pdf documents to import...'
        }
      },
      ...mapState('auth', ['accessToken']),
      ...mapState('import', ['docsPathToImport', 'docsPathInError', 'savedImportDestination'])
    },

    methods: {
      async importDocuments () {
        let vi = this;
        let jsonData = {};
        vi.createdFoldersCache = {};

        log.debug('importing start');
        vi.importing = true;

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

        const totalCount = this.docsPathToImport.length;
        vi.$emit('event-import-start', totalCount); // display progressModal

        let serializedDocument;
        let file;
        while (vi.docsPathToImport.length > 0){
          serializedDocument = vi.docsPathToImport[0];

          // Create parents folders if needed
          let parentFolderId = this.savedImportDestination.id;
          if (serializedDocument.webkitRelativePath !== '') {
              let folderCreationError = false;
              await vi.createFolderPath(serializedDocument.webkitRelativePath)
                .then(folderId => {
                  parentFolderId = folderId;
                  log.silly(folderId);
                })
                .catch(error => {
                    log.error('skipping document because parent folder creation failed');
                    vi.$store.commit('import/MOVE_FIRST_DOC_FROM_IMPORT_TO_ERROR', 'Parent folder creation failed');
                    folderCreationError = true;
                });
              if (folderCreationError) continue;
          }

          // Get file blob from serialized document
          try {
            file = new File([fs.readFileSync(serializedDocument.path)], serializedDocument.name, {
              type: serializedDocument.type,
              lastModified: serializedDocument.lastModified,
              lastModifiedDate: new Date(serializedDocument.lastModified)
            });
          } catch (error) {
            log.error('error during file read, the file may have been rename, move, or deleted since its selection');
            vi.$store.commit('import/MOVE_FIRST_DOC_FROM_IMPORT_TO_ERROR', 'File not found (deleted, renamed or moved?)');
            continue;
          }
          jsonData = {
            ftl_folder: parentFolderId
          };

          // generate doc thumbnail
          let thumbnail = null;
          try {
            thumbnail = await createThumbFromFile(file);
            log.debug('thumbnail generated')
          } catch (error) {
            log.warn('error during thumbnail generation', '\n', error)
          }
          // upload doc
          await vi.$api.uploadDocument(vi.accessToken, jsonData, file, thumbnail)
          .then((response) => {
            vi.$store.commit('import/REMOVE_FIRST_DOC_FROM_IMPORT');
            log.debug('file uploaded', '\n', file.path);
          })
          .catch((error) => {
            vi.$store.commit('import/MOVE_FIRST_DOC_FROM_IMPORT_TO_ERROR', 'Upload error (corrupt file, network error?)');
            log.error('error during upload!', file.path, '\n', error);
          });

          if(this.importInterrupted){
              log.info('Import interrupt by user');
              break;
          }
        }
        log.debug('importing end');
        vi.importing = false;
        vi.files = [];
        vi.filesInsideFolder = [];
        vi.$emit('event-import-end', this.docsPathToImport.length); // close progressModal

        const errorCount = vi.docsPathInError.length;
        const win = remote.getCurrentWindow();
        const export_interrupted_mention = this.importInterrupted ? ' (export has been interrupted)' : '';

        if (errorCount) {
          const s = vi.docsPathInError.length > 1 ? 's' : '';
          log.error('theses files could not be imported:', vi.docsPathInError);
          remote.dialog.showMessageBox(win,
            {
              type: 'error',
              title: `Error${s} occurred during import`,
              message: `${errorCount} document${s} couldn't be imported:`,
              detail: `You can retry to import them by clicking the Import button${export_interrupted_mention}.`,
              buttons: ['Ok', 'Display detailed report'],
              defaultId: 0
            }).then( ({response}) => {
              if (response === 1){ // Second button clicked
                this.displayImportErrorReport();
              }
              // Move docs in error in the import list to able to retry an import
              vi.$store.commit('import/MOVE_DOCS_FROM_ERROR_TO_IMPORT');
            }
          );
        } else {
          const s = vi.docsPathToImport.length > 1 ? 's' : '';
          remote.dialog.showMessageBox(win,
            {
              type: 'info',
              title: `Documents successfully imported`,
              message: `${totalCount - this.docsPathToImport.length} document${s} imported without error${export_interrupted_mention}.`,
              buttons: ['Ok'],
              defaultId: 0
            });
        }
      },

      async createFolderPath (folderPath) {
        log.debug('checking if parent folders path need to be created');
        let parent = null;
        let currentPath = '';
        let folderPathList = folderPath.split(path.sep);

        // replace local folder name selected with input directory by selected destination folder name
        folderPathList[0] = this.savedImportDestination.name;
        this.createdFoldersCache[this.savedImportDestination.name] = this.savedImportDestination.id;
        // remove file name from path list
        folderPathList.pop();

        for (const folderName of folderPathList){
          currentPath += path.sep + folderName;
          // try to create folder only if it isn't cached in created folder yet
          if (!(currentPath in this.createdFoldersCache)) {
            await this.$api.createFolder(this.accessToken, folderName, parent)
            .then(response => {
              log.debug(`folder "${currentPath}" created`);
              this.createdFoldersCache[currentPath] = response.data.id;
            })
            .catch((error) => {
              // folder already exist
              if (error.response && error.response.data.code === 'folder_name_unique_for_org_level') {
                log.debug(`folder ${currentPath} already exist`);
                return this.getFolderId(parent, folderName)
                .then(folderId => {
                  this.createdFoldersCache[currentPath] = folderId;
                });
              }
              // unexpected error during folder creation
              else {
                log.error('Unexpected error during folder creation');
                return Promise.reject('Unexpected error during folder creation');
              }
            });
          }
          parent = this.createdFoldersCache[currentPath];
        }

        return Promise.resolve(this.createdFoldersCache[currentPath]);
      },

      async getFolderId(parent, name) {
        log.debug(`Try to get folder id for folder ${name} inside parent ${parent}`);
        return await this.$api.listFolders(this.accessToken, parent)
        .then(response => {
          let folder;
          for (folder of response.data) {
              if (folder.name === name) {
                break;
              }
          }
          if (folder !== undefined){
            return Promise.resolve(folder.id);
          } else {
            return Promise.reject('Fail to get folder id');
          }
        })
        .catch(error => {
          log.error('Unexpected error when getting folder id');
          return Promise.reject(error);
        });
      },

      displayImportErrorReport() {
        log.debug('displaying detailed report');
        const report = new HtmlReport(
            ['Name', 'Path', 'Error detail'],
            this.docsPathInError.map(({name, path, reason}) => ([name, path, reason]))
        );
        this.$electron.shell.openExternal('file:///'+ report.save());
      },
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

    &::after{
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
