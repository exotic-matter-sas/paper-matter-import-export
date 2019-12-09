<!--
  - Copyright (c) 2019 Exotic Matter SAS. All rights reserved.
  - Licensed under the MIT License. See LICENSE in the project root for license information.
  -->

<template>
  <b-modal id="folder-picker-modal" centered hide-header no-close-on-esc no-close-on-backdrop
           @hidden="$emit('event-folder-picker-modal-hidden')">
    <b-container fluid >
      <b-row v-if="action === 'import'">
        <h1 class="text-primary">Select destination folder</h1>
      </b-row>
      <b-row v-else>
        <h1 class="text-primary">Select folder to export</h1>
      </b-row>
      <b-row>
        <b-col>
          <FTLTreeFolders :store="this.$store" :un-saved-import-destination="unSavedImportDestination"
                          @event-folder-selected="(folder) => {unSavedImportDestination = folder}"/>
        </b-col>
      </b-row>
    </b-container>
    <template slot="modal-footer">
          <div class="text-muted w-100 text-left font-italic">
            <span v-if="unSavedImportDestination">selected folder: {{unSavedImportDestination.name}}</span>
            <span v-else>No folder selected</span>
          </div>
          <b-button variant="secondary" @click.prevent="$bvModal.hide('folder-picker-modal')">
            Cancel
          </b-button>
          <b-button variant="primary" @click.prevent="saveFolderPick">
            OK
          </b-button>
    </template>
  </b-modal>
</template>

<script>
  import {mapState} from "vuex";
  import FTLTreeFolders from "./FolderPickerModal/FTLTreeFolders";

  export default {
    name: 'folder-picker-modal',

    components: {FTLTreeFolders},

    props: {
      action: {
        type: String,
        validator: (val) => ['export', 'import'].includes(val)
      }
    },

    data(){
      return{
        unSavedImportDestination: null,
      }
    },

    mounted() {
      this.$bvModal.show('folder-picker-modal');
      this.unSavedImportDestination = this.savedImportDestination;
    },

    computed: {
      ...mapState('import', ['savedImportDestination']),
      ...mapState('auth', ['accessToken'])
    },

    methods: {
      saveFolderPick() {
        // save selection
        this.$store.commit('import/SET_IMPORT_DESTINATION', this.unSavedImportDestination);
        this.$bvModal.hide('folder-picker-modal')
      },
    }
  }
</script>

<style lang="scss" scoped>
  @import '../../customBootstrap.scss';

  h1{
    font-size: 2rem;
    width: 100%;
    text-align: center;
  }
</style>
