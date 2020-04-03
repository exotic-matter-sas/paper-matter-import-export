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
                          :placeholder="inputPlaceholder"
                          :class="{'text-danger': updateError}"
                          :title="updateError ? $t('editServerAddressModal.errorParseServerAddress') : ''"
                          @update="updateError = false"
                          trim autofocus></b-form-input>
          </b-form-group>
        </b-col>
      </b-row>
    </b-container>
  </b-modal>
</template>

<script>
  import {mapState} from "vuex";
  import {defaultApiHostName} from "../../store/modules/config";

  const log = require('electron-log');

  export default {
    name: 'edit-server-address-modal',

    data(){
      return {
        serverAddress: '',
        inputPlaceholder: '',
        updateError: false
      }
    },

    computed: {
      ...mapState('config', ['apiHostName'])
    },

    mounted() {
      this.$bvModal.show('edit-server-address-modal');
      this.serverAddress = this.apiHostName;
      this.inputPlaceholder = defaultApiHostName;
    },

    methods: {
      save (bvModalEvt) {
        if (this.serverAddress === ''){
          this.serverAddress = defaultApiHostName;
        }

        try {
          const parsedAddress = new URL(this.serverAddress);

          this.$store.commit(
            'config/UPDATE_API_HOST_NAME',
            `${parsedAddress.protocol}//${parsedAddress.host}`
          );

          // re-instantiate api http client with new base url
          this.$api.constructor(this.apiHostName);
          log.info('user update api hostName');
        }
        catch (e) {
          log.error('fail to parse new hostname');
          this.updateError = true;
          bvModalEvt.preventDefault()
        }
      },
    }
  }
</script>
