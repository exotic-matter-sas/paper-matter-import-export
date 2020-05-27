<!--
  - Copyright (c) 2019 Exotic Matter SAS. All rights reserved.
  - Licensed under the MIT License. See LICENSE in the project root for license information.
  -->

<template>
  <b-row>
    <b-col id="moving-folders">
      <ul class="pl-0" v-if="folders.length > 0 && folders[0].children.length > 0">
        <FTLTreeItem
          class="item"
          v-for="folder in folders"
          :key="folder.id"
          :item="folder"
          :unsavedDestination="unsavedDestination"
          :store="store"
          :i18n="i18n"
          @event-folder-selected="(folder) => {$emit('event-folder-selected', folder)}"
        ></FTLTreeItem>
      </ul>
      <ul class="pl-0" v-else-if="lastFolderListingFailed">
        <li class="text-danger">
          {{ i18n.t('ftlTreeFolders.cantLoadFolderLabel') }}
        </li>
      </ul>
      <ul class="pl-0" v-else>
        <li class="text-muted">
          {{ i18n.t('ftlTreeFolders.noFolderCreatedLabel') }}
        </li>
      </ul>
    </b-col>
  </b-row>
</template>

<script>
  import FTLTreeItem from "./FTLTreeItem";

  export default {
    name: 'FTLTreeFolders',

    components: {FTLTreeItem},

    props: {
      root: {type: Boolean, default: true},
      unsavedDestination: {type: Object},
      store: {type: Object, required: true}, // using props to get store reference instead of normal usage as a workaround
      i18n: {type: Object, required: true} // using props to get t method reference instead of normal usage as a workaround
    },

    data() {
      return {
        folders: [],
        lastFolderListingFailed: false,
      }
    },

    mounted() {
      const vi = this;
      vi.lastFolderListingFailed = false;

      // list folders at Root
      vi.$api.listFolders(vi.store.state.auth.accessToken)
        .then(response => {
            let rootFolder = {id: null, name: vi.i18n.t('rootFolderName'), has_descendant: true, is_root: true};
            rootFolder.children = response.data
              .map(function (e) {
                return {id: e.id, name: e.name, has_descendant: e.has_descendant, children: []}
              });
            vi.folders.push(rootFolder);
        })
        .catch(error => vi.lastFolderListingFailed = true );
    },
  }
</script>

<style scoped>
  ul{
    list-style: none;
    margin-bottom: 0;
    user-select: none;
  }

  .item {
    cursor: pointer;
  }
</style>
