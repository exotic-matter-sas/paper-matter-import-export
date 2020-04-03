<!--
  - Copyright (c) 2019 Exotic Matter SAS. All rights reserved.
  - Licensed under the MIT License. See LICENSE in the project root for license information.
  -->

<template>
  <b-container fluid class="d-flex flex-column">
    <ul class="nav nav-tabs row bg-dark align-items-center" role="tablist">
      <li class="nav-item col">
        <a class="nav-link active text-center" id="import-tab" data-toggle="tab" href="#import" role="tab" aria-controls="home" aria-selected="true">
          {{$t('homePage.importTabLabel')}}
        </a>
      </li>
      <li class="nav-item col">
        <a class="nav-link text-center" id="export-tab" data-toggle="tab" href="#export" role="tab" aria-controls="profile" aria-selected="false">
          {{$t('homePage.exportTabLabel')}}
        </a>
      </li>
      <li id="logged-header" class="col  text-white-50">
        <button @click.prevent="disconnectUser" type="button" :aria-label="$t('homePage.disconnectTooltip')"
                class="close text-white-50" :title="$t('homePage.disconnectTooltip')">
          ×
        </button>
        {{$t('homePage.loggedAsLabel')}}<span :title="accountName">{{accountName}}</span>
      </li>
    </ul>
    <div class="tab-content row flex-grow-1 mb-3">
      <div class="tab-pane show active col" id="import" role="tabpanel" aria-labelledby="import-tab">
        <ImportTab
          :importInterrupted="importInterrupted"
          @event-import-started="displayImportProgress"
          @event-import-end="hideImportProgress"
          @event-pick-folder="pickingFolder = true"/>
      </div>
      <div class="tab-pane col" id="export" role="tabpanel" aria-labelledby="export-tab">
        <ExportTab/>
      </div>
    </div>
    <ProgressModal v-if="actionOnGoing" :action="actionType" :totalCount="totalCount"
      @event-import-interrupt="interruptImport"/>
    <FolderPickerModal id="folder-picker-modal" v-if="pickingFolder" :action="actionType"
      @event-import-interrupt="interruptImport"
      @event-folder-picker-modal-hidden="pickingFolder = false"/>
  </b-container>
</template>

<script>
  import {remote} from "electron";
  import ImportTab from "./HomePage/ImportTab";
  import ExportTab from "./HomePage/ExportTab";
  import ProgressModal from "./HomePage/ProgressModal";
  import {mapState} from "vuex";
  import FolderPickerModal from "./HomePage/FolderPickerModal";

  const log = require('electron-log');

  export default {
    name: 'home',
    components: {
        ImportTab,
        ExportTab,
        ProgressModal,
        FolderPickerModal,
    },

    data() {
      return {
        windowHeight: 386,
        actionType: 'import', // TODO make this value dynamic based on active tab
        actionOnGoing: false,
        totalCount: 0,
        importInterrupted: false,
        pickingFolder: false
      }
    },

    mounted() {
      // to resize window to page content
      const window = remote.getCurrentWindow();
      window.setContentSize(window.getContentSize()[0], this.windowHeight); // keep same width
    },

    computed: {
      ...mapState('auth', ['accountName'])
    },

    methods: {
      disconnectUser () {
        this.$store.dispatch('auth/disconnectUser', 'user disconnect himself');
      },

      displayImportProgress(totalCount) {
          this.actionOnGoing = true;
          this.totalCount = totalCount;
      },
      interruptImport() {
          this.importInterrupted = true;
      },
      hideImportProgress() {
          this.actionOnGoing = false;
          this.totalCount = 0;
          this.importInterrupted = false;
      },
    }
  }
</script>

<style lang="scss" scoped>
  @import '../customBootstrap.scss';

  ul.nav {
    flex-wrap: wrap-reverse;
    li {
      margin-top: 15px;
      padding:0 0 0 15px;

      &:last-child{
        padding-right: 15px;
      }
    }
  }

  .nav-tabs .nav-link {
    color: $white-50;
    border: 1px solid $white-50;
    border-bottom: 0;
    font-weight: bold;
    padding: 0.75em 0 0.75em 0;

    &:hover{
      color: $white-75;
      border: 1px solid $white-75;
      border-bottom: 0;
    }
    &.active{
      color: map_get($theme-colors, 'primary');
      background: $light;
    }
  }

  #logged-header{
    font-size: 0.9em;

    span {
      font-weight: bold;
      color: $white-75;
      display: inline-block;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      vertical-align: middle;
    }

    button.close{
      font-size: 1.5em;
      vertical-align: -0.1em;
    }
  }

  .close:hover{
    color: $white-75;
  }
</style>
