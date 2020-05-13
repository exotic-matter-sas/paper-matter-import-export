/*
 * Copyright (c) 2020 Exotic Matter SAS. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { createLocalVue, shallowMount } from "@vue/test-utils";
import sm from "simple-mock"

import BootstrapVue from "bootstrap-vue";
import Vuex from "vuex";
import storeConfig from "../../../src/renderer/store";

import ProgressModal from "../../../src/renderer/components/HomePage/ProgressModal";

// Create clean Vue instance and set installed package to avoid warning
const localVue = createLocalVue();

// Mock prototype and mixin bellow
localVue.prototype.$t = (text, args = "") => {
  return text + args;
}; // i18n mock
localVue.prototype.$tc = (text, args = "") => {
  return text + args;
}; // i18n mock
const showModalMock = sm.mock();
localVue.prototype.$bvModal = { show: showModalMock }; // bvModal mock

// Attach Vue plugins here (after mocking prototypes)
localVue.use(Vuex);
localVue.use(BootstrapVue); // avoid bootstrap vue warnings
localVue.component("font-awesome-icon"); // avoid font awesome warnings

let docsToImportMock;
let docsInErrorMock;


describe("ProgressModal template", () => {
  // define all var needed for the test here
  let wrapper;
  let store;

  beforeEach(() => {
    docsToImportMock = sm.mock().returnWith("");
    docsInErrorMock = sm.mock().returnWith("");
    store = new Vuex.Store(storeConfig);
    wrapper = shallowMount(ProgressModal, {
      localVue,
      store,
      computed: {
        docsToImport: docsToImportMock,
        docsInError: docsInErrorMock,
      },
      propsData: {
        totalCount: 0,
        action: 'import'
      }
    });
  });

  afterEach(() => {
    sm.restore();
    showModalMock.reset();
  });

  it("renders properly html element", () => {
    const elementSelector = "#progress-modal";
    const elem = wrapper.find(elementSelector);
    expect(elem.is(elementSelector)).to.equal(true);
  });
});

describe("ProgressModal mounted", () => {
  let wrapper;
  let store;

  beforeEach(() => {
    docsToImportMock = sm.mock().returnWith("");
    docsInErrorMock = sm.mock().returnWith("");
    store = new Vuex.Store(storeConfig);
    wrapper = shallowMount(ProgressModal, {
      localVue,
      store,
      computed: {
        docsToImport: docsToImportMock,
        docsInError: docsInErrorMock,
      },
      propsData: {
        totalCount: 0,
        action: 'import'
      }
    });
  });

  afterEach(() => {
    sm.restore();
    showModalMock.reset();
  });

  it("modal is shown and proper values are set", () => {
    expect(showModalMock.callCount).to.equal(1);
    expect(showModalMock.lastCall.arg).to.equal('progress-modal');
  });
});

describe("ProgressModal methods", () => {
  let wrapper;
  let store;

  beforeEach(() => {
    docsToImportMock = sm.mock().returnWith("");
    docsInErrorMock = sm.mock().returnWith("");
    store = new Vuex.Store(storeConfig);
    wrapper = shallowMount(ProgressModal, {
      localVue,
      store,
      computed: {
        docsToImport: docsToImportMock,
        docsInError: docsInErrorMock,
      },
      propsData: {
        totalCount: 0,
        action: 'import'
      }
    });
  });

  afterEach(() => {
    sm.restore();
    showModalMock.reset();
  });

  it("interruptImport emit event event-import-interrupt", () => {
    const testedEvent = "event-import-interrupt";

    // when
    wrapper.vm.interruptImport();

    // then
    expect(wrapper.emitted(testedEvent)).to.not.be.undefined;
    expect(wrapper.emitted(testedEvent).length).to.equal(1);
  });
});
