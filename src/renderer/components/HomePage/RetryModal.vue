<!--
  - Copyright (c) 2020 Exotic Matter SAS. All rights reserved.
  - Licensed under the MIT License. See LICENSE in the project root for license information.
  -->

<template>
  <b-modal id="retry-modal" centered hide-header no-close-on-esc no-close-on-backdrop>
    <b-container fluid>
      <b-row class="align-items-center">
        <b-col>
          <b-row>
            <h1 class="text-warning">
              {{ $tc('retryModal.retryTitle', 2, {action_infinitive: $t(`retryModal.${action}Infinitive`)}) }}
            </h1>
          </b-row>
          <b-row>
            <p class="mb-0">
              <span v-if="actionNotCompleted">
                {{ $t('retryModal.resumeSubTitle', {action: $t(`retryModal.${action}`)}) }}
              </span>
              <span v-else>
                {{ $tc('retryModal.retrySubTitle', 2, {
                action_infinitive: $t(`retryModal.${action}Infinitive`),
                action_ed: $t(`retryModal.${action}ed`)
                }) }}
              </span>
            </p>
          </b-row>
        </b-col>
      </b-row>
    </b-container>
    <template slot="modal-footer">
      <b-button variant="secondary" @click.prevent="abortRetry">
        {{ $t('retryModal.abortButtonValue') }}
      </b-button>
      <b-button variant="primary" @click.prevent="this.$emit('event-retry-action')">
        <span v-if="actionNotCompleted">
          {{ $t('retryModal.resumeButtonValue', {action: $t(`retryModal.${action}`)}) }}
        </span>
        <span v-else>
          {{ $t('retryModal.retryButtonValue', {action: $t(`retryModal.${action}`)}) }}
        </span>
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
    },

    mounted() {
      this.$bvModal.show('retry-modal');
    },

    computed: {
      actionNotCompleted () {
        if (this.action === 'import'){
          return this.docsToImport.length > 0
        }
        else if (this.action === 'export') {
          return this.docsToExport.length > 0
        }
        else {
          return false
        }
      },

      ...mapState('import', ['docsToImport', 'importDocsInError']),
      ...mapState('export', ['docsToExport', 'exportDocsInError'])
    },

    methods: {
      abortRetry () {
        this.$bvModal.hide('retry-modal');
        this.$emit('event-abort-retry');
      }
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
