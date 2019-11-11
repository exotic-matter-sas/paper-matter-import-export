<template>
  <b-modal id="progress-modal" centered hide-header no-close-on-esc no-close-on-backdrop>
    <b-container fluid>
      <b-row class="align-items-center">
        <b-col>
          <b-row v-if="action === 'import'">
            <h1 class="text-primary">Importing your documents...</h1>
          </b-row>
          <b-row v-else>
            <h1 class="text-primary">Exporting your documents...</h1>
          </b-row>
          <b-row class="align-items-end">
            <b-col cols="12">
              <b-progress id="progress-bar" height="2rem" :value="totalCount - docsPathToImport.length"
                  :max="totalCount" variant="primary" show-progress animated/>
            </b-col>
            <b-col cols="6" v-if="docsPathInError.length" id="error-count" class="text-left text-danger">
              {{docsPathInError.length}} error{{docsPathInError.length > 1 ? 's' : ''}}
            </b-col>
            <b-col cols="6" id="progression-count" class="text-right text-muted">
              {{totalCount - docsPathToImport.length}}/{{totalCount}}
            </b-col>
          </b-row>
        </b-col>
      </b-row>
    </b-container>
    <template slot="modal-footer">
      <b-button id="stop-button" variant="outline-danger" @click.prevent="interruptImport" class="w-100">
        Stop
      </b-button>
    </template>
  </b-modal>
</template>

<script>
  import {mapState} from "vuex";

  export default {
    name: 'progress-modal',

    props: {
      action: {
        type: String,
        validator: (val) => ['export', 'import'].includes(val)
      },
      totalCount: {
        type: Number
      }
    },

    mounted() {
      this.$bvModal.show('progress-modal');
    },

    computed: {
      ...mapState('import', ['docsPathToImport', 'docsPathInError'])
    },

    methods: {
      interruptImport() {
          this.$emit('event-import-interrupt');
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
