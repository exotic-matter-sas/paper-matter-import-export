/*
 * Copyright (c) 2020 Exotic Matter SAS. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { createLocalVue, shallowMount } from "@vue/test-utils";
import sm from "simple-mock"

import BootstrapVue from "bootstrap-vue";
import Vuex from "vuex";
import storeConfig from "../../../src/renderer/store";

import ExportTab from "../../../src/renderer/components/HomePage/ExportTab";

// Create clean Vue instance and set installed package to avoid warning
const localVue = createLocalVue();

// Mock prototype and mixin bellow
localVue.prototype.$t = (text, args = "") => {
  return text + args;
}; // i18n mock
localVue.prototype.$tc = (text, args = "") => {
  return text + args;
}; // i18n mock

// Attach Vue plugins here (after mocking prototypes)
localVue.use(Vuex);
localVue.use(BootstrapVue); // avoid bootstrap vue warnings
localVue.component("font-awesome-icon"); // avoid font awesome warnings

describe("ExportTab template", () => {
  // define all var needed for the test here
  let wrapper;
  let store;

  beforeEach(() => {
    // set vars here: vue wrapper args, fake values, mock
    store = new Vuex.Store(storeConfig);
    wrapper = shallowMount(ExportTab, {
      localVue,
      store,
    });
  });

  afterEach(() => {
    sm.restore();
  });

  it("renders properly html element", () => {
    const elementSelector = "#export-tab";
    const elem = wrapper.find(elementSelector);
    expect(elem.is(elementSelector)).to.equal(true);
  });
});
