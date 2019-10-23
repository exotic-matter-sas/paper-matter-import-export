<template>
  <b-container class="h-100 d-flex align-content-evenly flex-wrap">
    <b-form-file
      directory
      v-model="folder"
      :state="Boolean(folder)"
      placeholder="Choose where to export your documents..."
      drop-placeholder="Drop export destination folder here..."
    ></b-form-file>

    <b-button class="w-100" id="export-button" variant="primary"
              :disabled="!folder"
              @click="exportDocuments">
      Export
    </b-button>
  </b-container>
</template>

<script>
  export default {
    name: 'export-tab',

    data(){
      return {
          folder: null,
      }
    },

    methods: {
      exportDocuments (link) {
        // TODO
      }
    }
  }
</script>

<style>
</style>
