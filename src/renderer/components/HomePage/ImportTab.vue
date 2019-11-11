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
              :disabled="(files.length === 0 && docsPathToImport.length === 0) || importing"
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

    props: {
      importInterrupted: {
        type: Boolean
      }
    },

    data(){
      return {
        files: [],
        importing: false,
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
          }, (res) => {}
        );
      }
    },

    computed: {
      placeholder () {
        if (this.docsPathToImport.length) {
          return this.docsPathToImport.map(file => file.name).join(', ')
        } else {
          return 'Choose pdf documents to import...'
        }
      },
      ...mapState('auth', ['accessToken']),
      ...mapState('import', ['docsPathToImport', 'docsPathInError'])
    },

    methods: {
      async importDocuments () {
        let vi = this;
        let importFolderId = null;
        let jsonData = {};

        log.debug('importing start');
        vi.importing = true;

        // Store files to import in store if needed (not needed when documents are recover from a previous session)
        if (vi.files.length > 0){
          vi.$store.commit(
              'import/SET_DOCS_TO_IMPORT',
              // serialize File object by storing only useful fields
              vi.files.map(({name, path, type, lastModified}) => ({name, path, type, lastModified}))
          );
        }

        const totalCount = this.docsPathToImport.length;
        vi.$emit('event-import-start', totalCount); // display progressModal

        // create folder
        await vi.$api.createFolder(vi.accessToken, 'import ' + new Date().toISOString()).then(response => {
          log.debug('folder created');
          importFolderId = response.data.id;
        })
        .catch((error) => {
          vi.importing = false;
          log.error('error during folder creation\n'+ error);
          vi.$emit('event-import-end', this.docsPathToImport.length); // close progressModal
          throw new Error('Creation of import folder failed');
        });

        let serializedDocument;
        let file;
        while (vi.docsPathToImport.length > 0){
          // Get file blob from serialized document
          serializedDocument = vi.docsPathToImport[0];
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

          if(this.importInterrupted){
              log.info('Import interrupt by user');
              break;
          }
        }
        log.debug('importing end');
        vi.importing = false;
        vi.files = [];
        vi.$emit('event-import-end', this.docsPathToImport.length); // close progressModal

        const errorCount = vi.docsPathInError.length;
        const win = remote.getCurrentWindow();
        const export_interrupted_mention = this.importInterrupted ? ' (export has been interrupted)' : '';

        if (errorCount) {
          const s = vi.docsPathInError.length > 1 ? 's' : '';
          log.error('theses files could not be imported:', vi.docsPathInError);
          // define Sync dialog (with no callback)
          remote.dialog.showMessageBox(win,
            {
              type: 'error',
              title: `Error${s} occurred during import`,
              message: `${errorCount} document${s} couldn't be imported:`,
              detail: `You can retry to import them by clicking the Import button${export_interrupted_mention}.`,
              buttons: ['Ok', 'Display detailed report'],
              defaultId: 0
            }
          , (res) => {
            if (res === 1){ // Second button clicked
              this.displayImportErrorReport();
            }
            // Move docs in error in the import list to able to retry an import
            vi.$store.commit('import/MOVE_DOCS_FROM_ERROR_TO_IMPORT');
          });
        } else {
          const s = vi.docsPathToImport.length > 1 ? 's' : '';
          // define Sync dialog (with no callback)
          remote.dialog.showMessageBox(win,
            {
              type: 'info',
              title: `Documents successfully imported`,
              message: `${totalCount - this.docsPathToImport.length} document${s} imported without error${export_interrupted_mention}.`,
              buttons: ['Ok'],
              defaultId: 0
            }, (res) => {}
          );
        }
      },

      displayImportErrorReport() {
        const report = new HtmlReport(
            ['Name', 'Path', 'Error detail'],
            this.docsPathInError.map(({name, path, reason}) => ([name, path, reason]))
        );
        this.$electron.shell.openExternal('file:///'+ report.save());
      }
    }
  }
</script>

<style>
</style>
