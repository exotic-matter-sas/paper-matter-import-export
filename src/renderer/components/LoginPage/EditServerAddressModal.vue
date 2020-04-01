<!--
  - Copyright (c) 2020 Exotic Matter SAS. All rights reserved.
  - Licensed under the MIT License. See LICENSE in the project root for license information.
  -->

<template>
  <b-modal id="edit-server-address-modal"
           :title="$t('editServerAddressModal.title')"
           @hidden="$emit('event-hidden')"
           @ok="save"
           centered no-close-on-esc no-close-on-backdrop>
    <b-container fluid>
      <b-row>
        <b-col>
          <b-form-group :label="$t('editServerAddressModal.inputLabel')"
                        :description="$t('editServerAddressModal.inputDescription')" >
            <b-form-input v-model="serverAddress"
                          onfocus="this.select()"
                          trim autofocus></b-form-input>
          </b-form-group>
        </b-col>
      </b-row>
    </b-container>
  </b-modal>
</template>

<script>
  import {mapState} from "vuex";

  const log = require('electron-log');

  export default {
    name: 'edit-server-address-modal',

    data(){
      return {
        serverAddress: ''
      }
    },

    computed: {
      ...mapState('config', ['apiBaseUrl'])
    },

    mounted() {
      this.$bvModal.show('edit-server-address-modal');
      this.serverAddress = this.apiBaseUrl;
    },

    methods: {
      save () {
        this.$store.commit('config/UPDATE_API_BASE_URL', this.serverAddress);
        // re-instantiate api http client with new base url
        this.$api.constructor(this.apiBaseUrl);
        log.info('user update api baseUrl');
      },
    }
  }
</script>
