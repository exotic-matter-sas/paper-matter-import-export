<template>
  <b-row id="logged-header" class="bg-dark text-white-50">
    <b-col class="text-center py-1">
      Logged as: <span>{{accountName}}</span>
      <button @click.prevent="disconnectUser" type="button" aria-label="Disconnect" class="close text-white-50" title="Disconnect">
        ×
      </button>
    </b-col>
  </b-row>
</template>

<script>

  import {mapState} from "vuex";

  export default {
    name: 'logged-header',

    computed: {
      ...mapState('auth', ['accountName'])
    },

    methods: {
      disconnectUser () {
        this.$store.dispatch('auth/disconnectUser', 'user disconnect himself');
      }
    }
  }
</script>

<style lang="scss" scoped>
  @import '../../customBootstrap.scss';

  #logged-header{
    font-size: 0.9em;

    span {
      font-weight: bold;
      color: $white-75;
    }

    button.close{
      font-size: 1.5em;
      float: none;
      vertical-align: -0.1em;
    }
  }

  .close:hover{
    color: $white-75;
  }
</style>
