<!--
  - Copyright (c) 2019 Exotic Matter SAS. All rights reserved.
  - Licensed under the MIT License. See LICENSE in the project root for license information.
  -->

<template>
  <b-modal
    id="folder-picker-modal"
    centered
    hide-header
    no-close-on-esc
    no-close-on-backdrop
    @hidden="$emit('event-folder-picker-modal-hidden')"
  >
    <b-container fluid>
      <b-row>
        <h1 class="text-primary">{{ title }}</h1>
      </b-row>
      <b-row>
        <b-col>
          <FTLTreeFolders
            :store="$store"
            :i18n="$i18n"
            :unsaved-destination="unsavedDestination"
            @event-folder-selected="
              (folder) => {
                unsavedDestination = folder;
              }
            "
          />
        </b-col>
      </b-row>
    </b-container>
    <template slot="modal-footer">
      <div
        id="selected-folder-label"
        class="flex-grow-1 text-muted text-left font-italic"
      >
        <span v-if="unsavedDestination" :title="unsavedDestination.name">
          {{
            $t("folderPickerModal.selectedFolderLabel") +
            unsavedDestination.name
          }}
        </span>
        <span v-else>{{ $t("folderPickerModal.noFolderSelectedLabel") }}</span>
      </div>

      <b-button
        variant="secondary"
        @click.prevent="$bvModal.hide('folder-picker-modal')"
      >
        {{ $t("bModal.cancelButtonValue") }}
      </b-button>
      <b-button variant="primary" @click.prevent="savePickedFolder">
        {{ $t("bModal.okButtonValue") }}
      </b-button>
    </template>
  </b-modal>
</template>

<script>
import FTLTreeFolders from "./FolderPickerModal/FTLTreeFolders";

export default {
  name: "folder-picker-modal",

  components: { FTLTreeFolders },

  props: {
    title: {
      type: String,
      required: true,
    },
    defaultDestination: {
      type: Object,
      default: function () {
        return { name: "Root", id: null };
      },
    },
  },

  data() {
    return {
      unsavedDestination: null,
    };
  },

  mounted() {
    this.$bvModal.show("folder-picker-modal");
    this.unsavedDestination = this.defaultDestination;
  },

  methods: {
    savePickedFolder() {
      // save selection
      this.$emit("event-save-picked-folder", this.unsavedDestination);
      this.$bvModal.hide("folder-picker-modal");
    },
  },
};
</script>

<style lang="scss" scoped>
@import "../../customBootstrap.scss";

h1 {
  font-size: 2rem;
  width: 100%;
  text-align: center;
}

#selected-folder-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}
</style>
