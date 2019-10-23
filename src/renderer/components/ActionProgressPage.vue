<template>
  <b-container fluid>
    <b-row class="align-items-center min-vh-100">
      <b-col class="mb-4">
        <b-row v-if="action === 'import'">
          <h1 class="text-primary">Importing your documents...</h1>
        </b-row>
        <b-row v-else>
          <h1 class="text-primary">Exporting your documents...</h1>
        </b-row>
        <b-row class="mb-4 align-items-end">
          <b-col cols="12">
            <b-progress id="progress-bar" height="2rem" :value="10"
                variant="primary" show-progress animated/>
          </b-col>
          <b-col cols="12" id="progression-count" class="text-right text-muted">15/1200</b-col>
        </b-row>
        <b-row>
          <b-col>
            <b-button id="stop-button" variant="outline-danger" @click="stopImport" class="w-100">
              Stop
            </b-button>
          </b-col>
          <b-col>
            <b-button id="pause-button" variant="primary" @click="pauseImport" class="w-100">
              Pause
            </b-button>
          </b-col>
        </b-row>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
    import LoggedHeader from "./HomePage/LoggedHeader";
    import ImportTab from "./HomePage/ImportTab";
    import ExportTab from "./HomePage/ExportTab";

    export default {
        name: 'action-progress',
        components: {
            LoggedHeader,
            ImportTab,
            ExportTab
        },

        props: {
          action: {
            type: String,
            validator: (val) => ['export', 'import'].includes(val)
          },
        },

        data() {
            return {
                account: 'fabien@exotic-matter.fr', // TODO FIX THAT
            }
        },

        methods: {
            stopImport() {
                // TODO
            },
            pauseImport() {
                // TODO
            }
        }
    }
</script>

<style lang="scss" scoped>
  @import '../customBootstrap.scss';

  h1{
    font-size: 2rem;
    width: 100%;
    text-align: center;
  }

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
