/*
 * Copyright (c) 2019 Exotic Matter SAS. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import Router from 'vue-router'
import LoginPage from "../components/LoginPage";
import HomePage from "../components/HomePage";

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
