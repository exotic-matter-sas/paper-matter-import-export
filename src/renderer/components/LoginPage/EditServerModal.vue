<!--
  - Copyright (c) 2020 Exotic Matter SAS. All rights reserved.
  - Licensed under the MIT License. See LICENSE in the project root for license information.
  -->

<template>
  <b-modal
    id="edit-server-modal"
    :title="$t('EditServerModal.title')"
    @hidden="$emit('event-hidden')"
    @ok="save"
    centered
    no-close-on-backdrop
  >
    <b-container fluid>
      <b-row>
        <b-col>
          <b-form-group
            :label="$t('EditServerModal.serverInputLabel')"
            :description="$t('EditServerModal.serverInputDescription')"
          >
            <b-form-input
              v-model="serverAddress"
              @focus="(event) => event.target.select()"
              :placeholder="serverInputPlaceholder"
              :class="{ 'text-danger': serverAddressError }"
              :title="
                serverAddressError
                  ? $t('EditServerModal.errorParseServerAddress')
                  : ''
              "
              @update="serverAddressError = false"
              trim
              autofocus
            ></b-form-input>
          </b-form-group>
          <b-form-group :label="$t('EditServerModal.clientIdInputLabel')">
            <b-form-input
              v-model="clientIdModel"
              @focus="(event) => event.target.select()"
              :placeholder="clientIdInputPlaceholder"
              trim
            ></b-form-input>
            <template slot="description">
              <i18n path="EditServerModal.clientIdInputDescription" tag="span">
                <template slot="self_hosting_doc_link">
                  <a
                    href="#"
                    @click.prevent="
                      open(
                        'https://exotic-matter.gitlab.io/ftl-app/doc/self-hosting/#authorize-import-and-export-app-and-other-oauth2-apps'
                      )
                    "
                  >
                    {{
                      $t("EditServerModal.clientIdInputDescriptionLinkText")
                    }}</a
                  >
                </template>
              </i18n>
            </template>
          </b-form-group>
        </b-col>
      </b-row>
    </b-container>
  </b-modal>
</template>

<script>
import { ipcRenderer } from "electron";
import { mapState } from "vuex";

import { defaultPmHostName } from "../../store/modules/config";
import { defaultClientId } from "../../store/modules/auth";

const log = require("electron-log");

export default {
  name: "edit-server-modal",

  data() {
    return {
      serverAddress: "",
      serverInputPlaceholder: "",
      clientIdModel: "",
      clientIdInputPlaceholder: "",
      serverAddressError: false,
    };
  },

  computed: {
    ...mapState("config", ["pmHostName"]),
    ...mapState("auth", ["clientId"]),
  },

  mounted() {
    this.$bvModal.show("edit-server-modal");
    this.serverAddress = this.pmHostName;
    this.clientIdModel = this.clientId;
    this.serverInputPlaceholder = defaultPmHostName;
    this.clientIdInputPlaceholder = defaultClientId;
  },

  methods: {
    open(link) {
      this.$electron.shell.openExternal(link);
    },

    save(bvModalEvt) {
      let parsedAddress;

      if (this.serverAddress === "") {
        this.serverAddress = defaultPmHostName;
      }

      if (this.clientIdModel === "") {
        this.clientIdModel = defaultClientId;
      }

      try {
        parsedAddress = new URL(this.serverAddress);
      } catch (e) {
        log.error("fail to parse new hostname");
        this.serverAddressError = true;
        bvModalEvt.preventDefault();
        throw new Error("cantParseHostName");
      }

      this.$store.commit(
        "config/SET_PM_HOST_NAME",
        `${parsedAddress.protocol}//${parsedAddress.host}`
      );

      this.$store.commit("auth/SET_CLIENT_ID", this.clientIdModel);

      // update server data in api http client
      this.$api.updateServerData(this.pmHostName, this.clientId);
      // update server data in main process for localServer and for CSP header
      ipcRenderer.send("updateHostName", this.pmHostName);
      log.info("server data updated");
    },
  },
};
</script>

<style lang="scss" scoped>
::v-deep #edit-server-modal small a {
  text-decoration: underline;
}
</style>
