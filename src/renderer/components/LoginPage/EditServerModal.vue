<!--
  - Copyright (c) 2020 Exotic Matter SAS. All rights reserved.
  - Licensed under the MIT License. See LICENSE in the project root for license information.
  -->

<template>
  <b-modal id="edit-server-address-modal"
           :title="$t('EditServerModal.title')"
           @hidden="$emit('event-hidden')"
           @ok="save"
           centered no-close-on-backdrop>
    <template #default="{ ok }">
      <b-container fluid>
        <b-row>
          <b-col>
            <b-form-group :label="$t('EditServerModal.serverInputLabel')"
                          :description="$t('EditServerModal.serverInputDescription')" >
              <b-form-input v-model="serverAddress"
                            onfocus="this.select()"
                            :placeholder="serverInputPlaceholder"
                            :class="{'text-danger': updateServerAddressError}"
                            :title="updateServerAddressError ? $t('EditServerModal.errorParseServerAddress') : ''"
                            @update="updateServerAddressError = false"
                            trim autofocus></b-form-input>
            </b-form-group>
            <b-form-group :label="$t('EditServerModal.clientIdInputLabel')">
              <b-form-input v-model="clientIdModel"
                            onfocus="this.select()"
                            :placeholder="clientIdInputPlaceholder"
                            trim></b-form-input>
              <template slot="description">
                <i18n path="EditServerModal.clientIdInputDescription" tag="span">
                  <template slot="self_hosting_doc_link">
                    <a href="#" @click.prevent="open('https://exotic-matter.gitlab.io/ftl-app/doc/self-hosting/#authorize-import-and-export-app-and-other-oauth2-apps')">
                      {{ $t('EditServerModal.clientIdInputDescriptionLinkText') }}
                    </a>
                  </template>
                </i18n>
              </template>
            </b-form-group>
          </b-col>
        </b-row>
      </b-container>
    </template>
  </b-modal>
</template>

<script>
  import {mapState} from "vuex";
  import {defaultApiHostName} from "../../store/modules/config";
  import {defaultClientId} from "../../store/modules/auth";

  const log = require('electron-log');

  export default {
    name: 'edit-server-address-modal',

    data(){
      return {
        serverAddress: '',
        serverInputPlaceholder: '',
        clientIdModel: '',
        clientIdInputPlaceholder: '',
        updateServerAddressError: false
      }
    },

    computed: {
      ...mapState('config', ['apiHostName']),
      ...mapState('auth', ['clientId', 'redirectUri'])
    },

    mounted() {
      this.$bvModal.show('edit-server-address-modal');
      this.serverAddress = this.apiHostName;
      this.clientIdModel = this.clientId;
      this.serverInputPlaceholder = defaultApiHostName;
      this.clientIdInputPlaceholder = defaultClientId;
    },

    methods: {
      open(link) {
        this.$electron.shell.openExternal(link)
      },

      save (bvModalEvt) {
        if (this.serverAddress === ''){
          this.serverAddress = defaultApiHostName;
        }

        if (this.clientIdModel === ''){
          this.clientIdModel = defaultClientId;
        }

        try {
          const parsedAddress = new URL(this.serverAddress);

          this.$store.commit(
            'config/SET_API_HOST_NAME',
            `${parsedAddress.protocol}//${parsedAddress.host}`
          );
        }
        catch (e) {
          log.error('fail to parse new hostname');
          this.updateServerAddressError = true;
          bvModalEvt.preventDefault();
          throw new Error('cantParseHostName');
        }

        this.$store.commit(
          'auth/SET_CLIENT_ID',
          this.clientIdModel
        );

        // re-instantiate api http client with new base url
        this.$api.constructor(this.apiHostName, this.clientId, this.redirectUri);
        log.info('server data updated');
      },
    }
  }
</script>
