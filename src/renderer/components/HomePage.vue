<template>
  <b-container fluid class="min-vh-100 d-flex flex-column">
    <LoggedHeader :accountName="accountName"/>
    <ul class="nav nav-tabs row bg-dark" role="tablist">
      <li class="nav-item col">
        <a class="nav-link active text-center" id="import-tab" data-toggle="tab" href="#import" role="tab" aria-controls="home" aria-selected="true">Import</a>
      </li>
      <li class="nav-item col">
        <a class="nav-link text-center" id="export-tab" data-toggle="tab" href="#export" role="tab" aria-controls="profile" aria-selected="false">Export</a>
      </li>
    </ul>
    <div class="tab-content row flex-grow-1">
      <div class="tab-pane show active col" id="import" role="tabpanel" aria-labelledby="import-tab">
        <ImportTab/>
      </div>
      <div class="tab-pane col" id="export" role="tabpanel" aria-labelledby="export-tab">
        <ExportTab/>
      </div>
    </div>
  </b-container>
</template>

<script>
    import LoggedHeader from "./HomePage/LoggedHeader";
    import ImportTab from "./HomePage/ImportTab";
    import ExportTab from "./HomePage/ExportTab";

    export default {
        name: 'home',
        components: {
            LoggedHeader,
            ImportTab,
            ExportTab
        },

        props: {
          accountName: {
            type: String,
            required: true
          },
        },

        methods: {
            open(link) {
                this.$electron.shell.openExternal(link)
            }
        }
    }
</script>

<style lang="scss" scoped>
  @import '../customBootstrap.scss';

  .nav-tabs .nav-link {
    color: $white-50;
    border: 1px solid $white-50;
    border-bottom: 0;
    font-weight: bold;
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
</style>
