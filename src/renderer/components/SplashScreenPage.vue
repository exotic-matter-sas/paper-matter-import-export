<!--
  - Copyright (c) 2020 Exotic Matter SAS. All rights reserved.
  - Licensed under the MIT License. See LICENSE in the project root for license information.
  -->

<template>
  <b-container>
    <b-row class="align-items-center min-vh-100">
      <b-col>
        <div id="splash-screen" class="text-center text-primary">
          <img src="~@/assets/colors_logo.svg" :alt="$t('loginPage.logoAlt')" class="w-50 d-block mx-auto mb-5">
          <span v-if="!downloadingUpdate">
            <b-spinner id="checking-update-loader" type="grow" variant="primary" :label="$t('loginPage.loadingSpinnerLabel')"></b-spinner>
          </span>
          <span v-else>
            {{ $t('splashScreenPage.downloadingUpdate')}}
            <b-progress id="download-progress" class="w-50 mx-auto mt-2" variant="primary"
                        :value="downloadCurrentProgress" :max="downloadTotalProgress"/>
          </span>
        </div>
      </b-col>
    </b-row>
  </b-container>
</template>


<script>
    import {remote, ipcRenderer} from "electron";
    import EditServerAddressModal from "./LoginPage/EditServerAddressModal";

    export default {
      name: 'splash-screen',
      components: {EditServerAddressModal},
      data(){
        return {
          windowHeight: 438, // use same height as LoginPage
          downloadingUpdate: false,
          downloadCurrentProgress: 0,
          downloadTotalProgress: 100
        }
      },

      mounted () {
        // to resize window to page content
        const window = remote.getCurrentWindow();
        window.setContentSize(window.getContentSize()[0], this.windowHeight); // keep same width

        // wait for update check to be completed, then redirect to LoginPage
        ipcRenderer.on('updateNotAvailable', () => {
          this.$router.push({name: 'login'})
        });
        ipcRenderer.on('downloadingUpdate', (event, current, total) => {
          this.downloadingUpdate = true;
          this.downloadCurrentProgress = current;
          this.downloadTotalProgress = total;
        });
        ipcRenderer.on('update-downloaded', () => {
          this.downloadCurrentProgress = this.downloadTotalProgress;
        });
        ipcRenderer.on('updateError', () => {
          this.$router.push({name: 'login'})
        });
      },
    }
</script>

<style lang="scss" scoped>
  #splash-screen {
    font-size: 1.2rem;

    #checking-update-loader{
      vertical-align: middle;
    }
    #download-progress {
      height: 0.25rem;

    }
  }
</style>
