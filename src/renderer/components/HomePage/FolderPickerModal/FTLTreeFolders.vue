<!--
  - Copyright (c) 2019 Exotic Matter SAS. All rights reserved.
  - Licensed under the MIT License. See LICENSE in the project root for license information.
  -->

<template>
  <b-row>
    <b-col id="moving-folders">
      <ul class="pl-3" >
        <FTLTreeItem
          class="item"
          v-for="folder in folders"
          :key="folder.id"
          :item="folder"
          :source-folder="sourceFolder"
          :unSavedImportDestination="unSavedImportDestination"
          :store="store"
          @event-folder-selected="(folder) => {$emit('event-folder-selected', folder)}"
        ></FTLTreeItem>
      </ul>
      <ul class="pl-3">
        <li class="text-muted" v-if="folders.length > 0 && folders[0].children.length === 0">
          No folder created yet
        </li>
        <li class="text-danger" v-if="lastFolderListingFailed">
          Folders can't be loaded
        </li>
      </ul>
    </b-col>
  </b-row>
</template>

<script>
  import {mapState} from "vuex";
  import FTLTreeItem from "./FTLTreeItem";

  export default {
    name: 'FTLTreeFolders',

    components: {FTLTreeItem},

    props: {
      root: {type: Boolean, default: true},
      sourceFolder: {type: Number, default: -1},
      unSavedImportDestination: {type: Object},
      store: {type: Object} // using props instead to get store reference instead of normal usage as a workaround
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
      this.$api.listFolders(this.store.state.auth.accessToken)
        .then(response => {
            let rootFolder = {id: null, name: 'Root', has_descendant: true};
            rootFolder.children = response.data
              .filter(function (e) {
                return e.id !== vi.sourceFolder;
              })
              .map(function (e) {
                return {id: e.id, name: e.name, has_descendant: e.has_descendant, children: []}
              });
            vi.folders.push(rootFolder);
        })
        .catch((error)=>{
          vi.lastFolderListingFailed = true;
        });
    },
  }
</script>

<style scoped>
  ul{
    list-style: none;
  }

  .item {
    cursor: pointer;
  }
</style>
