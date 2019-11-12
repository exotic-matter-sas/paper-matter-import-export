<template>
  <b-container fluid class="min-vh-100 d-flex flex-column">
    <ul class="nav nav-tabs row bg-dark align-items-center" role="tablist">
      <li class="nav-item col">
        <a class="nav-link active text-center" id="import-tab" data-toggle="tab" href="#import" role="tab" aria-controls="home" aria-selected="true">Import</a>
      </li>
      <li class="nav-item col">
        <a class="nav-link text-center" id="export-tab" data-toggle="tab" href="#export" role="tab" aria-controls="profile" aria-selected="false">Export</a>
      </li>
      <li id="logged-header" class="col  text-white-50">
        <button @click.prevent="disconnectUser" type="button" aria-label="Disconnect" class="close text-white-50" title="Disconnect">
          ×
        </button>
        Logged as: <span :title="accountName">{{accountName}}</span>
      </li>
    </ul>
    <div class="tab-content row flex-grow-1">
      <div class="tab-pane show active col" id="import" role="tabpanel" aria-labelledby="import-tab">
        <ImportTab
          :importInterrupted="importInterrupted"
          @event-import-start="displayImportProgress"
          @event-import-end="hideImportProgress"/>
      </div>
      <div class="tab-pane col" id="export" role="tabpanel" aria-labelledby="export-tab">
        <ExportTab/>
      </div>
    </div>
    <ProgressModal v-if="actionOnGoing" :action="actionType" :totalCount="totalCount"
      @event-import-interrupt="interruptImport"
    />
  </b-container>
</template>

<script>
  import ImportTab from "./HomePage/ImportTab";
  import ExportTab from "./HomePage/ExportTab";
  import ProgressModal from "./HomePage/ProgressModal";
  import {mapState} from "vuex";

  const log = require('electron-log');

  export default {
    name: 'home',
    components: {
        ImportTab,
        ExportTab,
        ProgressModal
    },

    data() {
      return {
          actionType: '',
          actionOnGoing: false,
          totalCount: 0,
          importInterrupted: false,
      }
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
          this.actionType = 'import';
          this.totalCount = totalCount;
      },
      interruptImport() {
          this.importInterrupted = true;
          console.log('interrupt event received')
      },
      hideImportProgress() {
          this.actionOnGoing = false;
          this.actionType = '';
          this.totalCount = 0;
          this.importInterrupted = false;
      }
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
