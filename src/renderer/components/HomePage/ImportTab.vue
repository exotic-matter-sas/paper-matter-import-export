<template>
  <b-container class="h-100 d-flex align-content-evenly flex-wrap">
    <b-form-file
      multiple
      v-model="files"
      :state="Boolean(files)"
      placeholder="Choose pdf documents to import..."
      drop-placeholder="Drop pdf documents to import here..."
      accept=".pdf"
    ></b-form-file>

    <b-button class="w-100" id="import-button" variant="primary"
              :disabled="files.length === 0 || importing"
              @click.prevent="importDocuments">
      Import
    </b-button>
  </b-container>
</template>

<script>
  import {mapState} from "vuex";
  import {createThumbFromFile} from "../../thumbnailGenerator";

  const log = require('electron-log');

  export default {
    name: 'import-tab',

    data(){
      return {
        files: [],
        importing: false
      }
    },

    computed: {
      ...mapState('auth', ['accessToken']),
      ...mapState('import', ['documentsToImport', 'errorList'])
    },

    methods: {
      async importDocuments (link) {
        let vi = this;
        let importFolderId = null;
        let jsonData = {};

        log.debug('importing start');
        console.log(vi.files);
        vi.importing = true;

        // Store files to import in case of interruption during import
        vi.$store.commit('import/SET_DOCUMENTS_IMPORT_LIST', vi.files);

        await vi.$api.createFolder(vi.accessToken, 'import ' + new Date().toISOString()).then(response => {
          log.debug('folder created');
          importFolderId = response.data.id;
        })
        .catch((error) => {
          vi.importing = false;
          log.error('error during folder creation\n'+ error);
          throw new Error('Creation of import folder failed');
        });

        while (vi.documentsToImport.length > 0){
          let file = vi.documentsToImport[0];
          jsonData = {
            ftl_folder: importFolderId
          };
          let thumbnail = null;

          try {
            thumbnail = await createThumbFromFile(file);
            log.debug('thumbnail generated')
          } catch (error) {
            log.warn('error during thumbnail generation', '\n', error)
          }

          await vi.$api.uploadDocument(vi.accessToken, jsonData, file, thumbnail)
          .then((response) => {
            vi.$store.commit('import/REMOVE_FIRST_DOCUMENT_FROM_IMPORT_LIST');
            log.debug('file uploaded', '\n', file.path);
          })
          .catch((error) => {
            vi.$store.commit('import/MOVE_FIRST_DOCUMENT_TO_ERROR_LIST');
            log.error('error during upload!', file.path, '\n', error);
          });
        }

        if (vi.errorList.length > 0) {
          log.error('theses files could not be imported:', vi.errorList);
        }
        log.debug('importing end');
        vi.importing = false;
        vi.files = [];
      }
    }
  }
</script>

<style>
</style>
