<template>
  <b-row class="row align-items-center min-vh-100">
    <b-col>
        <form action="#" id="login-form">
            <img src="~@/assets/colors_logo.svg" alt="Paper Matter logo" class="d-block mx-auto my-3">
            <div class="form-label-group">
                <input autofocus="" class="form-control" id="id_email" name="username" placeholder="Email" required="" type="text">
                <label for="id_email">Email</label>
            </div>
            <div class="form-label-group">
                <input class="form-control" id="id_password" name="password" placeholder="Password" required="" type="password">
                <label for="id_password">Password</label>
                <button class="btn btn-link px-0 pt-1 pb-0" @click="open('https://papermatter.app/password_reset/')" id="password-reset">Forgot password?</button>
            </div>
            <input class="btn btn-lg btn-primary btn-block mb-3" type="submit" value="Login">
        </form>
    </b-col>
  </b-row>
</template>

<script>

  export default {
    name: 'login',
    methods: {
      open (link) {
        this.$electron.shell.openExternal(link)
      }
    }
  }
</script>

<style>
</style>
