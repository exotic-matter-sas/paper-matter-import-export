<!--
  - Copyright (c) 2019 Exotic Matter SAS. All rights reserved.
  - Licensed under the MIT License. See LICENSE in the project root for license information.
  -->

<template>
  <li class="folder-tree-item">
    <span @click.prevent="folderSelected" @dblclick.prevent="toggle"
      class="px-1"
      :class="{'font-weight-bold': item.has_descendant, selected: unSavedImportDestination && unSavedImportDestination.id === item.id}">
      <span class="target-folder-name">
        <font-awesome-icon :icon="isOpen || item.is_root ? 'folder-open' : 'folder'"/>
        &nbsp;{{ item.name }}&nbsp;
      </span>
      <b-spinner :class="{'d-none': !loading}" small></b-spinner>
    </span>
    <span class="expand-folder-child" v-if="item.has_descendant && !loading && !item.is_root" @click.prevent="toggle">
      [{{ isOpen ? '-' : '+' }}]
    </span>
    <ul class="pl-3" v-show="isOpen || item.is_root" v-if="item.children.length > 0">
      <FTLTreeItem
        class="item"
        v-for="folder in item.children"
        :key="folder.id"
        :item="folder"
        :unSavedImportDestination="unSavedImportDestination"
        :store="store"
        :i18n="i18n"
        @event-folder-selected="(folder) => {$emit('event-folder-selected', folder)}">
      </FTLTreeItem>
    </ul>
    <ul class="pl-3" v-else-if="lastFolderListingFailed">
      <li class="text-danger">
        {{ i18n.t('ftlTreeFolders.cantLoadFolderLabel') }}
      </li>
    </ul>
  </li>
</template>

<script>
  export default {
    name: "FTLTreeItem",

    props: {
      item: {
        type: Object,
        required: true
      },
      unSavedImportDestination: {type: Object},
      store: {type: Object}, // using props to get store reference instead of normal usage as a workaround
      i18n: {type: Object} // using props to get t method reference instead of normal usage as a workaround
    },

    data() {
      return {
        loading: false,
        isOpen: false,
        lastFolderListingFailed: false,
      }
    },

    methods: {
      toggle: function () {
        if (this.item.has_descendant && !this.loading && !this.item.is_root){
          this.isOpen = !this.isOpen;
          this.lastFolderListingFailed = false;

          if (this.item.has_descendant && this.isOpen) {
            this.listItemChildren(this.item.id);
          }

          if (!this.isOpen) {
            this.item.children = [];
          }
        }
      },

      folderSelected: function () {
        this.$emit('event-folder-selected', this.item);
      },

      listItemChildren: function (level = null) {
        const vi = this;
        vi.lastFolderListingFailed = false;

        vi.loading = true;
        vi.$api.listFolders(this.accessToken, level)
          .then(response => {
              vi.item.children = response.data
                .map(function (e) {
                  return {id: e.id, name: e.name, has_descendant: e.has_descendant, children: []}
                })
            }
          )
          .catch(error => vi.lastFolderListingFailed = true )
          .finally(() => vi.loading = false);
      }
    }
  }
</script>


<style scoped lang="scss">
  @import '../../../customBootstrap.scss';

  ul{
    list-style: none;
    user-select: none;
  }

  .item {
    cursor: pointer;
  }

  .selected {
    background: map_get($theme-colors, 'active');
  }

  svg {
    vertical-align: -0.125em;
  }
</style>
