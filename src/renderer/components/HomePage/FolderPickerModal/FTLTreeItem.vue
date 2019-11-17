<template>
  <li class="folder-tree-item">
    <span
      :class="{bold: item.has_descendant, selected: unSavedImportDestination && unSavedImportDestination.id === item.id}">
      <span class="target-folder-name" @click.prevent="folderSelected">
        <font-awesome-icon :icon="isOpen || item.id==null ? 'folder-open' : 'folder'"/>
        &nbsp;{{ item.name }}&nbsp;
      </span>
      <span class="expand-folder-child" v-if="item.has_descendant && !loading && item.id !== null"
            @click.prevent="toggle">[{{ isOpen ? '-' : '+' }}]</span>
      <b-spinner :class="{'d-none': !loading}" small></b-spinner>
    </span>

    <ul class="pl-3" v-show="isOpen || item.id === null" v-if="item.has_descendant">
      <FTLTreeItem
        class="item"
        v-for="folder in item.children"
        :key="folder.id"
        :item="folder"
        :source-folder="sourceFolder"
        :unSavedImportDestination="unSavedImportDestination"
        :store="store"
        @event-folder-selected="(folder) => {$emit('event-folder-selected', folder)}">
      </FTLTreeItem>
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
      sourceFolder: {
        type: Number,
        required: true
      },
      unSavedImportDestination: {type: Object},
      store: {type: Object} // using props instead to get store reference instead of normal usage as a workaround
    },

    data() {
      return {
        loading: false,
        isOpen: false
      }
    },

    methods: {
      toggle: function () {
        this.isOpen = !this.isOpen;

        if (this.item.has_descendant && this.isOpen) {
          this.updateMovingFolder(this.item.id);
        }

        if (!this.isOpen) {
          this.item.children = [];
        }
      },

      folderSelected: function () {
        this.$emit('event-folder-selected', this.item);
      },

      updateMovingFolder: function (level = null) {
        const vi = this;

        this.loading = true;
        this.$api.listFolders(this.accessToken, level)
          .then(response => {
              vi.item.children = response.data
                .filter(function (e) {
                  return e.id !== vi.sourceFolder;
                })
                .map(function (e) {
                  return {id: e.id, name: e.name, has_descendant: e.has_descendant, children: []}
                })
            }
          )
          .finally(() => this.loading = false);
      }
    }
  }
</script>


<style scoped lang="scss">
  @import '../../../customBootstrap.scss';

  ul{
    list-style: none;
  }

  .bold {
    font-weight: bold;
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
