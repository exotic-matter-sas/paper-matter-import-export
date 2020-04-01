<!--
  - Copyright (c) 2019 Exotic Matter SAS. All rights reserved.
  - Licensed under the MIT License. See LICENSE in the project root for license information.
  -->

<template>
  <b-container>
    <b-row class="align-items-center">
      <b-col>
        <form v-if="!refreshPending" id="login-form">
          <img src="~@/assets/colors_logo.svg" :alt="$t('loginPage.logoAlt')" class="d-block mx-auto my-3">
          <div class="form-label-group">
            <input autofocus="" class="form-control" id="id_email" name="username"
                   :placeholder="$t('loginPage.emailInputLabel')" required="" type="text" v-model="email">
            <label for="id_email">{{ $t('loginPage.emailInputLabel')}}</label>
          </div>
          <div class="form-label-group">
            <input class="form-control" id="id_password" name="password"
                   :placeholder="$t('loginPage.passwordInputLabel' )" required=""
                   type="password"  v-model="password">
            <label for="id_password">{{ $t('loginPage.passwordInputLabel')}}</label>
            <a class="mt-1 d-block" href @click.prevent="open('https://papermatter.app/password_reset/')"
                    id="password-reset">{{ $t('loginPage.forgotPasswordLink')}}
            </a>
          </div>
          <div v-if="lastError" class="alert alert-danger">{{lastError}}</div>
          <input class="btn btn-lg btn-primary btn-block mb-3" type="submit" :value="$t('loginPage.submitInputValue')"
                 @click.prevent="login" :disabled="loginPending || !(login && password)">
        </form>

        <div v-else class="text-center">
          <b-spinner type="grow" variant="primary" :label="$t('loginPage.loadingSpinnerLabel')"
                     style="width:4em;height:4em;"></b-spinner>
        </div>
      </b-col>
    </b-row>
    <b-row id="domain-footer" class="mb-3">
      <b-col class="text-center">
          <label class="d-inline">{{ $t('loginPage.serverAddressLabel') }}</label>
        <a href="#" :title="$t('loginPage.loginDomainLinkTitle')"
           @click.prevent="updatingServerAddress = true">{{ apiBaseUrl }}</a>
      </b-col>
    </b-row>
    <EditServerAddressModal v-if="updatingServerAddress"
                            @event-hidden="updatingServerAddress = false"/>
  </b-container>
</template>


<script>
    import {ipcRenderer} from "electron";
    import {mapState} from "vuex";
    import EditServerAddressModal from "./LoginPage/EditServerAddressModal";
    import {defaultApiBaseUrl} from "./../store/modules/config";
    const log = require('electron-log');

    export default {
      name: 'login',
      components: {EditServerAddressModal},
      data(){
            return{
                email: '',
                password: '',
                loginPending: false,
                refreshPending: false,
                lastError: '',
                updatingServerAddress: false
            }
        },

        mounted () {
            // to resize window to content
            this.$nextTick().then(() => ipcRenderer.send('vue-did-finish-load'));
            // redirect to home if user access token is set (and still valid or can be refresh)
            this.skipLoginIfAuthenticated();
        },

        computed: {
          ...mapState('auth', ['accessToken', 'refreshToken']),
          ...mapState('config', ['apiBaseUrl'])
        },

        methods: {
            open(link) {
                this.$electron.shell.openExternal(link)
            },

            async skipLoginIfAuthenticated(){
                let vi = this;

                if (vi.accessToken) {
                  vi.refreshPending = true;
                  await vi.$store.dispatch('auth/refreshAccessToken', vi.$api)
                  .then(() => vi.$router.push({name: 'home'}))
                  .catch((error)=>{});
                  vi.refreshPending = false;
                }
            },

            async login(){
                log.debug('login start');
                let vi = this;

                vi.lastError = '';
                vi.loginPending = true;

                await vi.$api.getAccessToken(vi.email, vi.password).then(response => {
                        vi.$store.commit('auth/SAVE_AUTHENTICATION_DATA', {
                            accountName: vi.email,
                            accessToken: response.data.access,
                            refreshToken: response.data.refresh
                        });
                        vi.$router.push({name: 'home'});
                    })
                    .catch((error) => {
                        if (error.response) {
                            if (error.response.data.detail) {
                                vi.lastError = error.response.data.detail
                            } else {
                                if(this.baseUrl !== defaultApiBaseUrl) {
                                  vi.lastError = 'Unknown error, please double check the server address set.'
                                } else {
                                  vi.lastError = 'Unknown error, please retry later.'
                                }
                            }
                        } else if (error.request) {
                         vi.lastError = 'The Paper Matter server seems unreachable, please check your connection.'
                        }
                        // to resize window to content when error message appears
                        this.$nextTick().then(() => ipcRenderer.send('vue-did-finish-load'));
                    });

                vi.loginPending = false;
                log.debug('login end');
            },
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
