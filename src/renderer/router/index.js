/*
 * Copyright (c) 2019 Exotic Matter SAS. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import Router from "vue-router";
import LoginPage from "../components/LoginPage";
import HomePage from "../components/HomePage";
import SplashScreenPage from "../components/SplashScreenPage";

export default new Router({
  routes: [
    {
      path: "/",
      redirect: "/splash-screen",
    },
    {
      path: "/splash-screen",
      name: "splash-screen",
      component: SplashScreenPage,
    },
    {
      path: "/login",
      name: "login",
      component: LoginPage,
    },
    {
      path: "/home",
      name: "home",
      component: HomePage,
    },
    {
      path: "*",
      redirect: "/login",
    },
  ],
});
