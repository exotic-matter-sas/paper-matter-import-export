<template>
  <b-container class="h-100 d-flex align-content-evenly flex-wrap">
    <h2 class="text-muted text-center w-100 font-italic"> Coming soon </h2>

    <!--
    <b-form-file
      directory
      v-model="folder"
      :state="Boolean(folder)"
      placeholder="Choose where to export your documents..."
      drop-placeholder="Drop export destination folder here..."
    ></b-form-file>
-->
    <b-button class="w-100" id="export-button" variant="primary"
              :disabled="!folder"
              @click.prevent="exportDocuments">
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
