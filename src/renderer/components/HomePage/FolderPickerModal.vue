<!--
  - Copyright (c) 2019 Exotic Matter SAS. All rights reserved.
  - Licensed under the MIT License. See LICENSE in the project root for license information.
  -->

<template>
  <b-modal id="folder-picker-modal" centered hide-header no-close-on-esc no-close-on-backdrop
           @hidden="$emit('event-folder-picker-modal-hidden')">
    <b-container fluid >
      <b-row v-if="action === 'import'">
        <h1 class="text-primary">{{ $t('folderPickerModal.importTitle') }}</h1>
      </b-row>
      <b-row v-else>
        <h1 class="text-primary">{{ $t('folderPickerModal.exportTitle') }}</h1>
      </b-row>
      <b-row>
        <b-col>
          <FTLTreeFolders :store="$store" :i18n="$i18n" :un-saved-import-destination="unSavedImportDestination"
                          @event-folder-selected="(folder) => {unSavedImportDestination = folder}"/>
        </b-col>
      </b-row>
    </b-container>
    <template slot="modal-footer">
          <div class="text-muted w-100 text-left font-italic">
            <span v-if="unSavedImportDestination">
              {{ $t('folderPickerModal.selectedFolderLabel') + unSavedImportDestination.name }}
            </span>
            <span v-else>{{ $t('folderPickerModal.noFolderSelectedLabel') }}</span>
          </div>
          <b-button variant="secondary" @click.prevent="$bvModal.hide('folder-picker-modal')">
            {{ $t('bModal.cancelButtonValue') }}
          </b-button>
          <b-button variant="primary" @click.prevent="saveFolderPick">
            {{ $t('bModal.okButtonValue') }}
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
