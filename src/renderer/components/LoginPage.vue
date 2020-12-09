<!--
  - Copyright (c) 2019 Exotic Matter SAS. All rights reserved.
  - Licensed under the MIT License. See LICENSE in the project root for license information.
  -->

<template>
  <b-container>
    <b-row class="align-items-center min-vh-100">
      <b-col>
        <b-row>
          <b-col>
            <div id="login-form" class="text-center">
              <img class="mb-1" src="~@/assets/colors_logo.svg" :alt="$t('loginPage.logoAlt')">
              <br>
              <a href="#" :title="$t('loginPage.loginDomainLinkTitle')" @click.prevent="updatingServer = true">
                {{ apiHostName }}
                <font-awesome-icon class="align-baseline" icon="edit" size="xs"/>
              </a>
              <br>
              <a href="#" class="btn btn-lg btn-primary mt-5 w-50" @click.prevent="openLoginPage" :disabled="loginPending"
                 :title="$t('loginPage.loginLinkTitle')">
                {{ $t('loginPage.submitInputValue') }}
                <font-awesome-icon icon="external-link-alt" size="xs"/>
              </a>
              <div v-if="lastError" class="alert alert-danger mt-3">{{ $t('loginPage.errorAuthorizationFailed', [lastError]) }}</div>
            </div>
          </b-col>
        </b-row>
        <b-row id="domain-footer">
          <b-col class="text-center">

          </b-col>
        </b-row>
      </b-col>
    </b-row>
    <EditServerModal v-if="updatingServer"
                     @event-hidden="updatingServer = false"/>
  </b-container>
</template>


<script>
  import {remote, ipcRenderer} from "electron";
  import {mapActions, mapState} from "vuex";
  import EditServerModal from "./LoginPage/EditServerModal";
  const log = require('electron-log');

  export default {
    name: 'login',
    components: {EditServerModal},
    data(){
      return {
        windowHeight: 438,
        email: '',
        password: '',
        loginPending: false,
        lastError: '',
        updatingServer: false
      }
    },

    mounted () {
      const vi = this;
      // to resize window to page content
      const window = remote.getCurrentWindow();
      window.setContentSize(window.getContentSize()[0], vi.windowHeight); // keep same width

      // force disconnect user when app start in case disconnectUser wasn't call on close
      this.disconnectUser({apiClient: vi.$api, reason: 'auto disconnect at startup'})
      .catch(error => log.error('disconnect failed, ignoring error:\n' + error));

      // start local server to listen for Oauth2 flow redirect uri
      ipcRenderer.on('oauthFlowSuccess', (event, code) => {
        vi.getAndStoreAccessToken(code)
      });
      ipcRenderer.on('oauthFlowError', (event, error) => {
        vi.lastError = error;
      });
      ipcRenderer.send('startLocalServer', this.apiHostName);
    },

    destroyed () {
      // delete events registered in mounted to avoid multiple trigger if login page is displayed multiple time
      ipcRenderer.removeAllListeners('oauthFlowSuccess');
      ipcRenderer.removeAllListeners('oauthFlowError');
    },

    computed: {
      ...mapState('auth', ['clientId', 'redirectUri', 'accessToken', 'refreshToken']),
      ...mapState('config', ['apiHostName'])
    },

    methods: {
      open(link) {
          this.$electron.shell.openExternal(link)
      },

      openLoginPage(){
        log.debug('Oauth2 flow [1]: open login page');

        this.lastError = '';

        this.open(
          `${this.apiHostName}/oauth2/authorize/` +
          `?response_type=code` +
          `&client_id=${this.clientId}` +
          `&redirect_uri=${this.redirectUri}` +
          `&scope=read write` +
          `&approval_prompt=auto` // to only ask for user approval on first login
        );
      },

      async getAndStoreAccessToken(code){
        log.debug('get and store access token - start');
        const vi = this;

        await vi.$api.getAccessToken(code).then(response => {
            vi.$store.commit('auth/SAVE_AUTHENTICATION_DATA', {
                accessToken: response.data.access_token,
                accessTokenExpiresIn: response.data.expires_in,
                refreshToken: response.data.refresh_token
            });
            vi.$router.push({name: 'home'});
          });

        log.debug('get and store access token - end');
      },

      ...mapActions('auth', ['disconnectUser']),
    }
  }
</script>

<style lang="scss" scoped>
  @import '../customBootstrap.scss';

  #domain-footer{
    align-items: baseline;
    color: map_get($theme-colors, 'primary');
    font-style: italic;

    label{
      font-size: 0.9em;
    }
  }

  #login-form {
    .form-label-group {
      position: relative;
      margin-bottom: 1rem;

      input, label {
        height: 3.125rem;
        padding: .75rem;
        &::placeholder{
          color: transparent;
        }
      }

      input:not(:placeholder-shown) {
        padding-top: 1.25rem;
        padding-bottom: .25rem;
      }

      input:not(:placeholder-shown) ~ label {
        padding-top: .25rem;
        padding-bottom: .25rem;
        font-size: 12px;
        color: #777;
      }

      label {
        position: absolute;
        top: 0;
        left: 0;
        display: block;
        width: 100%;
        margin-bottom: 0;
        line-height: 1.5;
        color: #495057;
        pointer-events: none;
        cursor: text;
        border: 1px solid transparent;
        border-radius: .25rem;
        transition: all .1s ease-in-out;
      }
    }

    ul {
      list-style: none;
      padding-left: 0;
      text-align: justify;
      margin-bottom: 0;
    }

    .alert-danger li {
      border-top: 1px solid lighten($danger, 20%);
      margin-top: 0.5em;
      padding-top: 0.5em;

      &:first-child {
        margin-top: 0;
        padding-top: 0;
        border-top: none;
      }
    }
  }
</style>
