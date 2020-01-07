<!--
  - Copyright (c) 2019 Exotic Matter SAS. All rights reserved.
  - Licensed under the MIT License. See LICENSE in the project root for license information.
  -->

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
              <b-progress id="progress-bar" height="2rem" :value="totalCount - docsToImport.length"
                  :max="totalCount" variant="primary" show-progress animated/>
            </b-col>
            <b-col cols="6" id="error-count" class="text-left text-danger">
              <span v-if="docsInError.length">
                {{docsInError.length}} error{{docsInError.length > 1 ? 's' : ''}}
              </span>
            </b-col>
            <b-col cols="6" id="progression-count" class="text-right text-muted">
              {{totalCount - docsToImport.length}}/{{totalCount}}
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
      ...mapState('import', ['docsToImport', 'docsInError'])
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
