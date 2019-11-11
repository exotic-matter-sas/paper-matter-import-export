<template>
  <b-container class="h-100 d-flex align-content-evenly flex-wrap">
    <b-form-file
      multiple
      v-model="files"
      :state="Boolean(files)"
      :placeholder=this.placeholder
      drop-placeholder="Drop pdf documents to import here..."
      accept=".pdf"
    ></b-form-file>

    <b-button class="w-100" id="import-button" variant="primary"
              :disabled="(files.length === 0 && documentsPathToImport.length === 0) || importing"
              @click.prevent="importDocuments">
      Import
    </b-button>
  </b-container>
</template>

<script>
  import {mapState} from "vuex";
  import {createThumbFromFile} from "../../thumbnailGenerator";
  import {remote} from "electron";
  import HtmlReport from "../../htmlReport";

  const log = require('electron-log');
  const fs = require('fs');

  export default {
    name: 'import-tab',

    data(){
      return {
        files: [],
        importing: false,
        placeholder: 'Choose pdf documents to import...'
      }
    },

    mounted() {
      // if last import wasn't properly completed
      let documentsToImportCount = this.documentsPathToImport.length;
      if (documentsToImportCount > 0){
        log.info('last import wasn\'t fully completed, inform user that he can finish it');
        const win = remote.getCurrentWindow();
        remote.dialog.showMessageBox(win,
          {
            type: 'info',
            title: 'You can resume last import',
            message: 'Last import wasn\'t fully completed.',
            detail: `There is ${documentsToImportCount} files left to import, you can finish the import by clicking ` +
                'the Import button.',
            buttons: ['Ok'],
            defaultId: 0
          }, (res) => {
            this.placeholder = this.documentsPathToImport.map(file => file.name).join(', ')
          }
        );
      }
    },

    computed: {
      ...mapState('auth', ['accessToken']),
      ...mapState('import', ['documentsPathToImport', 'documentsPathInError'])
    },

    methods: {
      async importDocuments () {
        let vi = this;
        let importFolderId = null;
        let jsonData = {};

        log.debug('importing start');
        console.log(vi.files);
        vi.importing = true;

        // Store files to import in store if needed (not needed when documents are recover from a previous session)
        if (vi.files.length > 0){
          vi.$store.commit(
              'import/SET_DOCS_TO_IMPORT',
              // serialize File object by storing only useful fields
              vi.files.map(({name, path, type, lastModified}) => ({name, path, type, lastModified}))
          );
        }

        // create folder
        await vi.$api.createFolder(vi.accessToken, 'import ' + new Date().toISOString()).then(response => {
          log.debug('folder created');
          importFolderId = response.data.id;
        })
        .catch((error) => {
          vi.importing = false;
          log.error('error during folder creation\n'+ error);
          throw new Error('Creation of import folder failed');
        });

        let serializedDocument;
        let file;
        while (vi.documentsPathToImport.length > 0){
          // Get file blob from serialized document
          serializedDocument = vi.documentsPathToImport[0];
          try {
            file = new File([fs.readFileSync(serializedDocument.path)], serializedDocument.name, {
              type: serializedDocument.type,
              lastModified: serializedDocument.lastModified,
              lastModifiedDate: new Date(serializedDocument.lastModified)
            });
            console.log(file);
          } catch (error) {
            log.error('error during file read, the file may have been rename, move, or deleted since its selection');
            vi.$store.commit('import/MOVE_FIRST_DOC_FROM_IMPORT_TO_ERROR', 'File not found (deleted, renamed or moved?)');
            continue;
          }
          jsonData = {
            ftl_folder: importFolderId
          };
          let thumbnail = null;

          // create doc thumbnail
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
        }
        log.debug('importing end');
        vi.importing = false;
        vi.files = [];

        const errorCount = vi.documentsPathInError.length;
        const s = vi.documentsPathInError.length > 1 ? 's' : '';
        if (errorCount) {
          log.error('theses files could not be imported:', vi.documentsPathInError);
          const win = remote.getCurrentWindow();
          // define Sync dialog (with no callback)
          const response = remote.dialog.showMessageBox(win,
            {
              type: 'error',
              title: `Error${s} occurred during import`,
              message: `${errorCount} document${s} couldn't be imported:`,
              detail: 'You can retry to import them by clicking the Import button.',
              buttons: ['Ok', 'Display detailed report'],
              defaultId: 0
            }
          );

          if (response === 1){ // Second button clicked
            this.displayImportErrorReport();
          }

          // Move docs in error in the import list to able to retry an import
          vi.$store.commit('import/MOVE_DOCS_FROM_ERROR_TO_IMPORT');
          this.placeholder = this.documentsPathToImport.map(file => file.name).join(', ')
        }
      },

      displayImportErrorReport() {
        const report = new HtmlReport(
            ['Name', 'Path', 'Error detail'],
            this.documentsPathInError.map(({name, path, reason}) => ([name, path, reason]))
        );
        this.$electron.shell.openExternal('file:///'+ report.save());
      }
    }
  }
</script>

<style>
</style>
