<!--
  - Copyright (c) 2019 Exotic Matter SAS. All rights reserved.
  - Licensed under the MIT License. See LICENSE in the project root for license information.
  -->

<template>
  <b-container class="h-100 d-flex align-content-evenly flex-wrap" id="export-tab">
    <h2 class="text-muted text-center w-100 font-italic my-5">{{ $t('exportTab.comingSoonLabel')}}</h2>

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
      {{ $t('exportTab.exportButtonValue')}}
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
