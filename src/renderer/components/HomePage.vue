<!--
  - Copyright (c) 2019 Exotic Matter SAS. All rights reserved.
  - Licensed under the MIT License. See LICENSE in the project root for license information.
  -->

<template>
  <b-container fluid class="d-flex flex-column">
    <ul class="nav nav-tabs row bg-dark align-items-center" role="tablist">
      <li class="nav-item col">
        <a
          class="nav-link text-center"
          id="import-tab"
          :class="{ active: this.action === 'import' }"
          data-toggle="tab"
          href="#import"
          role="tab"
          @click.prevent="$store.commit('config/SET_ACTION', 'import')"
        >
          {{ $t("homePage.importTabLabel") }}
        </a>
      </li>
      <li class="nav-item col">
        <a
          class="nav-link text-center"
          id="export-tab"
          :class="{ active: this.action === 'export' }"
          data-toggle="tab"
          href="#export"
          role="tab"
          @click.prevent="$store.commit('config/SET_ACTION', 'export')"
        >
          {{ $t("homePage.exportTabLabel") }}
        </a>
      </li>
      <li id="logged-header" class="col text-white-50">
        <button
          @click.prevent="logout"
          type="button"
          :aria-label="$t('homePage.disconnectTooltip')"
          class="close text-white-50"
          :title="$t('homePage.disconnectTooltip')"
        >
          ×
        </button>
        {{ $t("homePage.loggedAsLabel")
        }}<span :title="accountName" class="text-nowrap">{{
          accountName
        }}</span>
      </li>
    </ul>
    <div class="tab-content row flex-grow-1 mb-3">
      <div
        class="tab-pane show col"
        :class="{ active: this.action === 'import' }"
        id="import"
        role="tabpanel"
        aria-labelledby="import-tab"
      >
        <ImportTab
          :actionInterrupted="actionInterrupted"
          :performRetry.sync="performImportRetry"
          @event-importing="updateActionProgress"
          @event-import-end="
            resetActionProgress();
            displayRetryModalIfNeeded();
          "
          @event-pick-folder="pickingFolder = true"
        />
      </div>
      <div
        class="tab-pane col"
        :class="{ active: this.action === 'export' }"
        id="export"
        role="tabpanel"
        aria-labelledby="export-tab"
      >
        <ExportTab
          :actionInterrupted="actionInterrupted"
          :performRetry.sync="performExportRetry"
          @event-exporting="updateActionProgress"
          @event-step-end="currentStep++"
          @event-export-end="
            resetActionProgress();
            displayRetryModalIfNeeded();
          "
          @event-pick-folder="pickingFolder = true"
        />
      </div>
    </div>

    <ProgressModal
      v-if="ongoingAction"
      :action="action"
      :currentStep="currentStep"
      :current-count="currentCount"
      :totalCount="totalCount"
      @event-import-interrupt="actionInterrupted = true"
    />
    <FolderPickerModal
      id="folder-picker-modal"
      v-if="pickingFolder"
      :title="folderPickerModalTitle"
      :default-destination="folderPickerDefaultDestination"
      @event-save-picked-folder="saveFolderPickerSelection"
      @event-folder-picker-modal-hidden="pickingFolder = false"
    />
    <RetryModal
      v-if="askForActionRetry"
      :action="action"
      :actionInterrupted="actionInterrupted"
      @event-retry-action="performActionRetry"
      @event-abort-retry="resetAllData"
      @event-retry-modal-hidden="askForActionRetry = false"
    />
  </b-container>
</template>

<script>
import { remote } from "electron";
import ImportTab from "./HomePage/ImportTab";
import ExportTab from "./HomePage/ExportTab";
import ProgressModal from "./HomePage/ProgressModal";
import { mapState } from "vuex";
import FolderPickerModal from "./HomePage/FolderPickerModal";
import RetryModal from "./HomePage/RetryModal";

const log = require("electron-log");

export default {
  name: "home",
  components: {
    ImportTab,
    ExportTab,
    ProgressModal,
    FolderPickerModal,
    RetryModal,
  },

  data() {
    return {
      windowHeight: 415,
      ongoingAction: false,
      currentStep: 1,
      currentCount: 0,
      totalCount: 0,
      actionInterrupted: false,
      pickingFolder: false,
      askForActionRetry: false,
      performImportRetry: false,
      performExportRetry: false,
    };
  },

  mounted() {
    const vi = this;
    // to resize window to page content
    const window = remote.getCurrentWindow();
    window.setContentSize(window.getContentSize()[0], vi.windowHeight); // keep same width

    vi.displayRetryModalIfNeeded();

    vi.$api
      .getUserData(this.accessToken)
      .then((response) => {
        vi.$store.commit("auth/SET_ACCOUNT_NAME", response.data.email);
      })
      .catch((error) => {
        log.error("Can't retrieve user data:\n", error);
        vi.$store.commit("auth/SET_ACCOUNT_NAME", "?");
      });
  },

  computed: {
    folderPickerModalTitle() {
      return this.action === "import"
        ? this.$t("folderPickerModal.importTitle")
        : this.$t("folderPickerModal.exportTitle");
    },
    folderPickerDefaultDestination() {
      return this.action === "import"
        ? this.savedImportDestination
        : this.savedExportSource;
    },
    ...mapState("config", ["action"]),
    ...mapState("auth", ["accountName", "accessToken", "refreshToken"]),
    ...mapState("import", [
      "docsToImport",
      "importDocsInError",
      "savedImportDestination",
    ]),
    ...mapState("export", [
      "docsToExport",
      "exportDocsInError",
      "savedExportSource",
    ]),
  },

  methods: {
    logout() {
      this.$store.dispatch("auth/disconnectUser", {
        apiClient: this.$api,
        reason: "user disconnect himself",
      });
    },

    saveFolderPickerSelection(destinationFolder) {
      this.action === "import"
        ? this.$store.commit("import/SET_IMPORT_DESTINATION", destinationFolder)
        : this.$store.commit("export/SET_EXPORT_SOURCE", destinationFolder);
    },

    updateActionProgress({ currentCount, totalCount }) {
      this.ongoingAction = true;
      this.currentCount = currentCount;
      this.totalCount = totalCount;
    },

    resetActionProgress() {
      this.ongoingAction = false;
      this.currentStep = 1;
      this.totalCount = 0;
      this.actionInterrupted = false;
    },

    displayRetryModalIfNeeded() {
      // check if an action need to be retried or resumed
      if (
        this.docsToImport.length > 0 ||
        this.importDocsInError.length > 0 ||
        this.docsToExport.length > 0 ||
        this.exportDocsInError.length > 0
      ) {
        this.askForActionRetry = true;
        log.info(
          "last action wasn't fully completed, ask user if he want to retry or resume it"
        );
      }
    },

    performActionRetry() {
      this.action === "import"
        ? (this.performImportRetry = true)
        : (this.performExportRetry = true);
    },

    resetAllData() {
      this.$store.commit("import/RESET_IMPORT_DATA");
      this.$store.commit("export/RESET_EXPORT_DATA");
    },
  },
};
</script>

<style lang="scss" scoped>
@import "../customBootstrap.scss";

ul.nav {
  flex-wrap: wrap-reverse;
  li {
    margin-top: 15px;
    padding: 0 0 0 15px;

    &:last-child {
      padding-right: 15px;
    }
  }
}

.nav-tabs .nav-link {
  color: $white-50;
  border: 1px solid $white-50;
  border-bottom: 0;
  font-weight: bold;
  padding: 0.75em 0 0.75em 0;

  &:hover {
    color: $white-75;
    border: 1px solid $white-75;
    border-bottom: 0;
  }
  &.active {
    color: map_get($theme-colors, "primary");
    background: $light;
  }
}

#logged-header {
  font-size: 0.9em;

  span {
    font-weight: bold;
    color: $white-75;
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: middle;
  }

  button.close {
    font-size: 1.5em;
    vertical-align: -0.1em;
  }
}

.close:hover {
  color: $white-75;
}
</style>
