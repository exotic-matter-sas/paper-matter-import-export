<!--
  - Copyright (c) 2019 Exotic Matter SAS. All rights reserved.
  - Licensed under the MIT License. See LICENSE in the project root for license information.
  -->

<template>
  <b-container>
    <b-row id="login-page" class="align-items-center min-vh-100">
      <b-col>
        <b-row>
          <b-col>
            <div class="text-center">
              <img
                class="mb-1"
                src="~@/assets/colors_logo.svg"
                :alt="$t('loginPage.logoAlt')"
              />
              <br />
              <a
                href="#"
                :title="$t('loginPage.loginDomainLinkTitle')"
                @click.prevent="updatingServer = true"
              >
                {{ pmHostName }}
                <font-awesome-icon
                  class="align-baseline"
                  icon="edit"
                  size="xs"
                />
              </a>
              <br />
              <a
                href="#"
                class="btn btn-lg btn-primary mt-5 w-50"
                @click.prevent="openLoginPage"
                :disabled="loginPending"
                :title="$t('loginPage.loginLinkTitle')"
              >
                {{ $t("loginPage.submitInputValue") }}
                <font-awesome-icon icon="external-link-alt" size="xs" />
              </a>
              <div v-if="lastErrorCode" class="alert alert-danger mt-3">
                {{ $t("loginPage.errorAuthorizationFailed", [lastErrorCode]) }}
              </div>
            </div>
          </b-col>
        </b-row>
      </b-col>
    </b-row>
    <EditServerModal
      v-if="updatingServer"
      @event-hidden="updatingServer = false"
    />
  </b-container>
</template>

<script>
import { remote, ipcRenderer } from "electron";
import { mapActions, mapState } from "vuex";
import EditServerModal from "./LoginPage/EditServerModal";
const log = require("electron-log");

export default {
  name: "login",
  components: { EditServerModal },
  data() {
    return {
      windowHeight: 438,
      email: "",
      password: "",
      loginPending: false,
      lastErrorCode: "",
      updatingServer: false,
    };
  },

  mounted() {
    const vi = this;
    // to resize window to page content
    const window = remote.getCurrentWindow();
    window.setContentSize(window.getContentSize()[0], vi.windowHeight); // keep same width

    // force disconnect user when app start in case disconnectUser wasn't call on close
    this.disconnectUser({
      apiClient: vi.$api,
      reason: "auto disconnect at startup",
    }).catch((error) =>
      log.error("disconnect failed, ignoring error:\n" + error)
    );

    // start local server to listen for Oauth2 flow redirect uri
    ipcRenderer.on("oauthFlowSuccess", (event, code) => {
      vi.getAndStoreAccessToken(code);
    });
    ipcRenderer.on("oauthFlowError", (event, error) => {
      vi.lastErrorCode = error;
    });
    ipcRenderer.send("startLocalServer", this.pmHostName);
  },

  destroyed() {
    // delete events registered in mounted to avoid multiple trigger if login page is displayed multiple time
    ipcRenderer.removeAllListeners("oauthFlowSuccess");
    ipcRenderer.removeAllListeners("oauthFlowError");
    // shutdown Oauth2 local server
    ipcRenderer.send("shutdownLocalServer");
  },

  computed: {
    ...mapState("auth", [
      "clientId",
      "redirectUri",
      "accessToken",
      "refreshToken",
    ]),
    ...mapState("config", ["pmHostName"]),
  },

  methods: {
    open(link) {
      this.$electron.shell.openExternal(link);
    },

    openLoginPage() {
      log.debug("Oauth2 flow [1]: open login page");

      this.lastErrorCode = "";

      this.open(
        `${this.pmHostName}/oauth2/authorize/` +
          `?response_type=code` +
          `&client_id=${this.clientId}` +
          `&redirect_uri=${this.redirectUri}` +
          `&scope=read write`
      );
    },

    async getAndStoreAccessToken(code) {
      log.debug("get and store access token - start");
      const vi = this;

      await vi.$api
        .getAccessToken(code)
        .then((response) => {
          vi.$store.commit("auth/SAVE_AUTHENTICATION_DATA", {
            accessToken: response.data.access_token,
            accessTokenExpiresIn: response.data.expires_in,
            refreshToken: response.data.refresh_token,
          });
          vi.$router.push({ name: "home" });
        })
        .catch((error) => {
          log.error("fail to get access token:\n", error);
          this.lastErrorCode = "cantGetAccessToken";
        });

      log.debug("get and store access token - end");
    },

    ...mapActions("auth", ["disconnectUser"]),
  },
};
</script>

<style></style>
