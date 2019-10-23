<template>
  <b-container class="h-100 d-flex align-content-evenly flex-wrap">
    <b-form-file
      multiple
      v-model="files"
      :state="Boolean(files)"
      placeholder="Choose pdf documents/folders to import..."
      drop-placeholder="Drop pdf documents or folders to import here..."
    ></b-form-file>

    <b-button class="w-100" id="import-button" variant="primary"
              :disabled="!files.length > 0"
              @click="importDocuments">
      Import
    </b-button>
  </b-container>
</template>

<script>
  export default {
    name: 'import-tab',

    data(){
      return {
          files: [],
      }
    },

    methods: {
      importDocuments (link) {
        // TODO
      }
    }
  }
</script>

<style>
</style>
