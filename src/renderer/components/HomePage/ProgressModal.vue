<!--
  - Copyright (c) 2019 Exotic Matter SAS. All rights reserved.
  - Licensed under the MIT License. See LICENSE in the project root for license information.
  -->

<template>
  <b-modal id="progress-modal" centered hide-header no-close-on-esc no-close-on-backdrop>
    <b-container fluid>
      <b-row class="align-items-center">
        <!-- Import progress -->
        <b-col v-if="action === 'import'">
          <b-row>
            <h1 class="text-primary">{{ $t('progressModal.importTitle') }}</h1>
          </b-row>
          <b-row class="align-items-end">
            <b-col cols="12">
              <b-progress id="import-progress-bar" height="2rem" :value="currentCount"
                  :max="totalCount" variant="primary" show-progress animated/>
            </b-col>
            <b-col cols="6" id="error-count" class="text-left text-danger">
              <span v-if="importDocsInError.length">
                {{ $tc('progressModal.errorCountLabel', importDocsInError.length) }}
              </span>
            </b-col>
            <b-col cols="6" id="progression-count" class="text-right text-muted">
              {{currentCount}}/{{totalCount}}
            </b-col>
          </b-row>
        </b-col>
        <!-- Export progress, step 1: listing docs -->
        <b-col v-if="action === 'export' && currentStep === 1">
          <b-row>
            <h1 class="text-primary">{{ $t('progressModal.exportTitle1') }}</h1>
            <h2 class="text-muted font-italic">{{ $t('progressModal.exportSubTitle1') }}</h2>
          </b-row>
          <b-row class="align-items-end">
            <b-col cols="12">
              <b-progress id="export-progress-bar-1" height="2rem" variant="primary"
                          :value="currentCount" :max="totalCount"
                          show-progress animated/>
            </b-col>
          </b-row>
        </b-col>
        <!-- Export progress, step 2: downloading docs  -->
        <b-col v-if="action === 'export' && currentStep === 2">
          <b-row>
            <h1 class="text-primary">{{ $t('progressModal.exportTitle2') }}</h1>
            <h2 class="text-muted font-italic">{{ $t('progressModal.exportSubTitle2') }}</h2>
          </b-row>
          <b-row class="align-items-end">
            <b-col cols="12">
              <b-progress id="export-progress-bar-2" height="2rem" variant="primary"
                          :value="currentCount" :max="totalCount"
                          show-progress animated/>
            </b-col>

            <b-col cols="6" id="error-count" class="text-left text-danger">
            <span v-if="exportDocsInError.length">
            {{ $tc('progressModal.errorCountLabel', exportDocsInError.length) }}
            </span>
            </b-col>
            <b-col cols="6" id="progression-count" class="text-right text-muted">
            {{currentCount}}/{{totalCount}}
            </b-col>
          </b-row>
        </b-col>
      </b-row>
    </b-container>
    <template slot="modal-footer">
      <b-button id="interrupt-button" variant="outline-danger" @click.prevent="interruptAction" class="w-100">
        {{ $t('progressModal.interruptButtonValue') }}
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
      currentStep: {
        type: Number,
        default: 1
      },
      currentCount: {
        type: Number
      },
      totalCount: {
        type: Number
      }
    },

    mounted() {
      this.$bvModal.show('progress-modal');
    },

    computed: {
      ...mapState('import', ['docsToImport', 'importDocsInError']),
      ...mapState('export', ['docsToExport', 'exportDocsInError'])
    },

    methods: {
      interruptAction() {
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
  h2{
    font-size: 1rem;
    width: 100%;
    text-align: center;
  }
</style>

<style lang="scss" scoped>
  #progress-modal {
    /*Disable transition to prevent bar to go backward when displaying export step2 progressbar in place of step1 one*/
    ::v-deep .progress-bar{
      transition: none !important;
    }
  }
</style>
