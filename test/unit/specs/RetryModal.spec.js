/*
 * Copyright (c) 2020 Exotic Matter SAS. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { createLocalVue, shallowMount } from "@vue/test-utils";
import sm from "simple-mock"

import BootstrapVue from "bootstrap-vue";
import flushPromises from "flush-promises";
import Vuex from "vuex";
import storeConfig from "../../../src/renderer/store";
import cloneDeep from "lodash.clonedeep";


import {remote} from "electron";
import * as tv from "../../tools/testValues.js";
import RetryModal from "../../../src/renderer/components/HomePage/RetryModal";

// Create clean Vue instance and set installed package to avoid warning
const localVue = createLocalVue();

localVue.prototype.$t = (text, args = "") => {
  return text + args;
}; // i18n mock
localVue.prototype.$tc = (text, args = "") => {
  return text + args;
}; // i18n mock
const showModalMock = sm.mock();
const hideModalMock = sm.mock();
localVue.prototype.$bvModal = { show: showModalMock, hide: hideModalMock}; // bvModal mock

// Attach Vue plugins bellow (after prototype mocks)
localVue.use(Vuex);
localVue.use(BootstrapVue); // avoid bootstrap vue warnings
localVue.component("font-awesome-icon"); // avoid font awesome warnings


describe("RetryModal template", () => {
  // define all vars common to the describe block here
  let wrapper;
  let store;
  let actionNotCompletedMock;

  beforeEach(() => {
    // set vars common to the describe block here (vue wrapper args, fake values, mocks)
    actionNotCompletedMock = sm.mock().returnWith(true);
    store = new Vuex.Store(storeConfig);
    wrapper = shallowMount(RetryModal, {
      localVue,
      store,
      propsData: {
        action: 'import'
      },
      computed: {
        actionNotCompleted: {
          cache: false,
          get: actionNotCompletedMock
        },
      }
    });
  });

  afterEach(() => {
    sm.restore();
    showModalMock.reset();
  });

  it("renders properly html element", () => {
    const elementSelector = "#retry-modal";
    const elem = wrapper.find(elementSelector);
    expect(elem.is(elementSelector)).to.equal(true);
  });
});

describe("RetryModal mounted", () => {
  // define all vars common to the describe block here
  let wrapper;
  let store;
  let actionNotCompletedMock;

  beforeEach(() => {
    // set vars common to the describe block here (vue wrapper args, fake values, mocks)
    actionNotCompletedMock = sm.mock().returnWith(true);
    store = new Vuex.Store(storeConfig);
    wrapper = shallowMount(RetryModal, {
      localVue,
      store,
      propsData: {
        action: 'import'
      },
      computed: {
        actionNotCompleted: {
          cache: false,
          get: actionNotCompletedMock
        },
      }
    });
  });

  afterEach(() => {
    sm.restore();
    showModalMock.reset();
  });

  it("modal is shown", () => {
    expect(showModalMock.callCount).to.equal(1);
    expect(showModalMock.lastCall.arg).to.equal('retry-modal');
  });
});

describe("RetryModal computed", () => {
  // define all vars common to the describe block here
  let wrapper;
  let store;
  let docsToImportMock;
  let docsToExportMock;

  beforeEach(() => {
    // set vars common to the describe block here (vue wrapper args, fake values, mocks)
    docsToImportMock = sm.mock().returnWith([]);
    docsToExportMock = sm.mock().returnWith([]);
    store = new Vuex.Store(storeConfig);
    wrapper = shallowMount(RetryModal, {
      localVue,
      store,
      propsData: {
        action: 'import'
      },
      computed: {
        actionNotCompleted: {
          cache: false,
          get: RetryModal.computed.actionNotCompleted
        },
        docsToImport: {
          cache: false,
          get: docsToImportMock
        },
        docsToExport: {
          cache: false,
          get: docsToExportMock
        }
      }
    });
  });

  afterEach(() => {
    sm.restore();
    docsToImportMock.actions = [];
    docsToExportMock.actions = [];
  });

  it("actionNotCompleted return proper value", () => {
    // given there is no docsToImport
    wrapper.setData({action: 'import'});

    let testedValue = wrapper.vm.actionNotCompleted;

    expect(testedValue).to.equal(false);

    // given action is import and there is docsToImport
    wrapper.setData({action: 'import'});
    docsToImportMock.actions = [];
    docsToImportMock.returnWith([tv.DOCUMENT_PROPS]);

    testedValue = wrapper.vm.actionNotCompleted;

    expect(testedValue).to.equal(true);

    // given action is export and there is docsToExport
    wrapper.setData({action: 'export'});
    docsToExportMock.actions = [];
    docsToExportMock.returnWith([tv.DOCUMENT_PROPS]);

    testedValue = wrapper.vm.actionNotCompleted;

    expect(testedValue).to.equal(true);
  });
});

describe("RetryModal methods", () => {
  // define all vars common to the describe block here
  let wrapper;
  let store;
  let actionNotCompletedMock;

  beforeEach(() => {
    // set vars common to the describe block here (vue wrapper args, fake values, mocks)
    actionNotCompletedMock = sm.mock().returnWith(true);
    store = new Vuex.Store(storeConfig);
    wrapper = shallowMount(RetryModal, {
      localVue,
      store,
      propsData: {
        action: 'import'
      },
      computed: {
        actionNotCompleted: {
          cache: false,
          get: actionNotCompletedMock
        },
      }
    });
  });

  afterEach(() => {
    sm.restore();
    showModalMock.reset();
  });

  it("abortRetry call hide modal", () => {
    wrapper.vm.abortRetry();

    expect(hideModalMock.callCount).to.equal(1);
    expect(hideModalMock.lastCall.arg).to.equal('retry-modal');
  });

  it("abortRetry emit event", () => {
    const testedEvent = "event-abort-retry";
    wrapper.vm.abortRetry();

    // then
    expect(wrapper.emitted(testedEvent)).to.not.be.undefined;
    expect(wrapper.emitted(testedEvent).length).to.equal(1);
  });
});
