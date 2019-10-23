import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/', redirect: '/login'
    },
    {
      path: '/login',
      name: 'login',
      component: require('@/components/LoginPage').default
    },
    {
      path: '*',
      redirect: '/login'
    }
  ]
})
