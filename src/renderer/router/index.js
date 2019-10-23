import Vue from 'vue'
import Router from 'vue-router'
import LoginPage from "../components/LoginPage";
import HomePage from "../components/HomePage";
import ActionProgressPage from "../components/ActionProgressPage";

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
      path: '/progress/import',
      name: 'import-progress',
      component: ActionProgressPage,
      props: {
        action: 'import'
      }
    },
    {
      path: '/progress/export',
      name: 'export-progress',
      component: ActionProgressPage,
      props: {
        action: 'export'
      }
    },
    {
      path: '*',
      redirect: '/login'
    }
  ]
})
