import Vue from 'vue'
import Router from 'vue-router'
import LoginPage from "../components/LoginPage";
import HomePage from "../components/HomePage";

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/', redirect: '/login'
    },
    {
      path: '/login',
      name: 'login',
      component: LoginPage
    },
    {
      path: '/home',
      name: 'home',
      component: HomePage
    },
    {
      path: '*',
      redirect: '/login'
    }
  ]
})
