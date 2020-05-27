<!--
  - Copyright (c) 2019 Exotic Matter SAS. All rights reserved.
  - Licensed under the MIT License. See LICENSE in the project root for license information.
  -->

<template>
  <b-container id="export-tab-content" class="pt-2">
    <b-row>
      <b-col>
        <b-form-group :label="$t('exportTab.sourcesFormGroupLabel')">
            <label class="d-block" id="update-source" :title="folderSourceName" @click.prevent="$emit('event-pick-folder')">
              <font-awesome-icon icon="folder"/>{{folderSourceName}}
              <div>{{ $t('bFormFile.BrowseLabel') }}</div>
            </label>
        </b-form-group>
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <b-form-group :label="$t('exportTab.destinationFormGroupLabel')"
                      :description="$t('exportTab.destinationFormGroupDescription')">
          <b-form-file
            directory
            v-model="folder"
            :state="Boolean(folder)"
            placeholder="Choose where to export your documents..."
            drop-placeholder="Drop export destination folder here..."
          ></b-form-file>
        </b-form-group>
      </b-col>
    </b-row>

    <b-button class="w-100" id="export-button" variant="primary"
              :disabled="!folder"
              @click.prevent="exportDocuments">
      {{ $t('exportTab.exportButtonValue')}}
    </b-button>
  </b-container>
</template>

<script>
  import {mapState} from "vuex";

  export default {
    name: 'export-tab',

    data(){
      return {
          folder: null,
          folderSourceName: 'Root'
      }
    },

    mounted() {

    },

    computed: {
      folderDestinationName () {
        return this.savedExportSource && this.savedExportSource.name !== 'Root' ?
          this.savedExportSource.name : this.$t('rootFolderName')
      },

      ...mapState('auth', ['accessToken']),
      ...mapState('export', ['savedExportSource'])
    },

    methods: {
      exportDocuments (link) {
        // TODO
      }
    }
  }
</script>

<style scoped lang="scss">
  @import '../../customBootstrap.scss';

  #update-source{
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
